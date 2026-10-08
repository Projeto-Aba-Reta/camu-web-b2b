// Converte public/models/{vaso,luminaria,pig}.obj em .bin leves (malha indexada, sem normais), por clustering de vértices.
// Uso: node scripts/convert-models.mjs [vaso|luminaria|pig ...]
// Formato: u32 V, u32 I, depois pos f32[V*3] e índices u16 (V < 65536) ou u32.
import fs from "node:fs";

// células na maior dimensão do modelo: quanto maior, mais detalhe (e mais bytes)
const MODELS = { vaso: 130, luminaria: 130, pig: 90 };

function convert(name, res) {
  const src = fs.readFileSync(`public/models/${name}.obj`, "utf8").split("\n");
  const raw = [];
  const tris = [];
  for (const line of src) {
    if (line.startsWith("v ")) {
      const p = line.trim().split(/\s+/);
      raw.push(+p[1], +p[2], +p[3]);
    } else if (line.startsWith("f ")) {
      const ids = line.trim().split(/\s+/).slice(1).map((t) => parseInt(t.split("/")[0], 10) - 1);
      for (let i = 1; i < ids.length - 1; i++) tris.push(ids[0], ids[i], ids[i + 1]);
    }
  }
  const n = raw.length / 3;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) {
    min[k] = Math.min(min[k], raw[i * 3 + k]);
    max[k] = Math.max(max[k], raw[i * 3 + k]);
  }
  const cell = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / res;
  const cid = new Map();
  const sum = [];
  const cnt = [];
  const remap = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    const c = [0, 1, 2].map((k) => Math.floor((raw[i * 3 + k] - min[k]) / cell));
    const key = (c[0] * 4096 + c[1]) * 4096 + c[2];
    let id = cid.get(key);
    if (id === undefined) {
      id = cnt.length;
      cid.set(key, id);
      sum.push(0, 0, 0);
      cnt.push(0);
    }
    for (let k = 0; k < 3; k++) sum[id * 3 + k] += raw[i * 3 + k];
    cnt[id]++;
    remap[i] = id;
  }
  // só mantém vértices usados por triângulos não degenerados
  const used = new Map();
  const pos = [];
  const idx = [];
  const seen = new Set();
  for (let t = 0; t < tris.length; t += 3) {
    const a = remap[tris[t]], b = remap[tris[t + 1]], c = remap[tris[t + 2]];
    if (a === b || b === c || a === c) continue;
    const k = [a, b, c].sort((x, y) => x - y).join(",");
    if (seen.has(k)) continue;
    seen.add(k);
    for (const v of [a, b, c]) {
      let u = used.get(v);
      if (u === undefined) {
        u = pos.length / 3;
        used.set(v, u);
        pos.push(sum[v * 3] / cnt[v], sum[v * 3 + 1] / cnt[v], sum[v * 3 + 2] / cnt[v]);
      }
      idx.push(u);
    }
  }
  const V = pos.length / 3;
  const small = V < 65536;
  const head = Buffer.alloc(8);
  head.writeUInt32LE(V, 0);
  head.writeUInt32LE(idx.length, 4);
  const pb = Buffer.from(new Float32Array(pos).buffer);
  let ib = Buffer.from((small ? new Uint16Array(idx) : new Uint32Array(idx)).buffer);
  if (small && ib.length % 4) ib = Buffer.concat([ib, Buffer.alloc(2)]);
  fs.writeFileSync(`public/models/${name}.bin`, Buffer.concat([head, pb, ib]));
  console.log(name, { V, tris: idx.length / 3, bytes: 8 + pb.length + ib.length, min, max });
}

const only = process.argv.slice(2);
for (const [name, res] of Object.entries(MODELS)) if (!only.length || only.includes(name)) convert(name, res);
