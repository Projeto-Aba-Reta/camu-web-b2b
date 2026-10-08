// Converte public/models/Moeda Camu.obj em public/models/moeda.bin (malha indexada, simplificada por agrupamento de vértices).
// Uso: node scripts/convert-coin.mjs
// Formato: 2×u32 [V, I]; depois pos f32[V*3] (centrada na origem, diâmetro 1, face em +z) e índices u16[I].
import fs from "node:fs";

const src = fs.readFileSync("public/models/Moeda Camu.obj", "utf8").split("\n");
const raw = [];
const faces = [];
for (const line of src) {
  if (line.startsWith("v ")) {
    const p = line.trim().split(/\s+/);
    raw.push([+p[1], +p[2], +p[3]]);
  } else if (line.startsWith("f ")) {
    const ids = line
      .trim()
      .split(/\s+/)
      .slice(1)
      .map((t) => parseInt(t.split("/")[0], 10) - 1);
    for (let i = 1; i < ids.length - 1; i++) faces.push([ids[0], ids[i], ids[i + 1]]);
  }
}

// centro e escala: diâmetro 1, espessura em z centrada na origem
const mn = [Infinity, Infinity, Infinity];
const mx = [-Infinity, -Infinity, -Infinity];
for (const v of raw) for (let k = 0; k < 3; k++) (mn[k] = Math.min(mn[k], v[k])), (mx[k] = Math.max(mx[k], v[k]));
const c = mn.map((a, k) => (a + mx[k]) / 2);
const s = 1 / Math.max(mx[0] - mn[0], mx[1] - mn[1]);

// agrupa vértices numa grade (CELL em unidades de diâmetro) e descarta triângulos degenerados
const CELL = Number(process.argv[2] ?? 0.012);
const cells = new Map();
const pos = [];
const remap = raw.map((v) => {
  const q = v.map((a, k) => Math.round(((a - c[k]) * s) / CELL));
  const key = q.join(",");
  let e = cells.get(key);
  if (!e) {
    e = { i: pos.length / 3, n: 0, sum: [0, 0, 0] };
    cells.set(key, e);
    pos.push(0, 0, 0);
  }
  e.n++;
  for (let k = 0; k < 3; k++) e.sum[k] += (v[k] - c[k]) * s;
  return e;
});
for (const e of cells.values()) for (let k = 0; k < 3; k++) pos[e.i * 3 + k] = e.sum[k] / e.n;

const idx = [];
const seen = new Set();
for (const [a, b, d] of faces) {
  const t = [remap[a].i, remap[b].i, remap[d].i];
  if (t[0] === t[1] || t[1] === t[2] || t[0] === t[2]) continue;
  const key = [...t].sort((x, y) => x - y).join(",");
  if (seen.has(key)) continue;
  seen.add(key);
  idx.push(...t);
}

// compacta os vértices realmente usados
const used = new Map();
const out = [];
const oidx = idx.map((i) => {
  let n = used.get(i);
  if (n === undefined) {
    n = out.length / 3;
    used.set(i, n);
    out.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
  }
  return n;
});

const V = out.length / 3;
const I = oidx.length;
if (V >= 65536) throw new Error("vértices demais para u16: aumente a célula");
const pad = (I * 2) % 4 ? 2 : 0;
const buf = new ArrayBuffer(8 + V * 12 + I * 2 + pad);
new Uint32Array(buf, 0, 2).set([V, I]);
new Float32Array(buf, 8, V * 3).set(out);
new Uint16Array(buf, 8 + V * 12, I).set(oidx);
fs.writeFileSync("public/models/moeda.bin", Buffer.from(buf));
console.log("moeda.bin", buf.byteLength, "bytes", { V, tris: I / 3, cell: CELL });
