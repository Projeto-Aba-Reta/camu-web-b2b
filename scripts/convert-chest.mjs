// Converte public/models/objBau{Baixo,Cima}.obj em public/models/bau.bin (malha indexada, sem normais).
// Uso: node scripts/convert-chest.mjs
// Formato: 4×u32 [baseV, baseI, lidV, lidI]; depois, por parte: pos f32[V*3], ouro u8[V] (preenchido p/ 4 bytes), índices u32[I].
import fs from "node:fs";

function convert(file) {
  const src = fs.readFileSync(file, "utf8").split("\n");
  const raw = [];
  const pos = [];
  const gold = [];
  const idx = [];
  const map = new Map(); // "v|ouro" -> índice novo
  let isGold = 0;
  for (const line of src) {
    if (line.startsWith("v ")) {
      const p = line.trim().split(/\s+/);
      raw.push([+p[1], +p[2], +p[3]]);
    } else if (line.startsWith("usemtl")) {
      isGold = /ouro/i.test(line) ? 1 : 0;
    } else if (line.startsWith("f ")) {
      const ids = line
        .trim()
        .split(/\s+/)
        .slice(1)
        .map((t) => {
          let v = parseInt(t.split("/")[0], 10);
          v = v < 0 ? raw.length + v : v - 1;
          const key = v * 2 + isGold;
          let n = map.get(key);
          if (n === undefined) {
            n = pos.length / 3;
            map.set(key, n);
            pos.push(...raw[v]);
            gold.push(isGold);
          }
          return n;
        });
      for (let i = 1; i < ids.length - 1; i++) idx.push(ids[0], ids[i], ids[i + 1]);
    }
  }
  return { pos: new Float32Array(pos), gold: new Uint8Array(gold), idx: new Uint32Array(idx) };
}

const parts = ["objBauBaixo", "objBauCima"].map((n) => convert(`public/models/${n}.obj`));
const pad4 = (n) => (4 - (n % 4)) % 4;
const size = 16 + parts.reduce((s, p) => s + p.pos.byteLength + p.gold.length + pad4(p.gold.length) + p.idx.byteLength, 0);
const buf = new ArrayBuffer(size);
const head = new Uint32Array(buf, 0, 4);
head.set([parts[0].pos.length / 3, parts[0].idx.length, parts[1].pos.length / 3, parts[1].idx.length]);
let o = 16;
for (const p of parts) {
  new Float32Array(buf, o, p.pos.length).set(p.pos);
  o += p.pos.byteLength;
  new Uint8Array(buf, o, p.gold.length).set(p.gold);
  o += p.gold.length + pad4(p.gold.length);
  new Uint32Array(buf, o, p.idx.length).set(p.idx);
  o += p.idx.byteLength;
}
fs.writeFileSync("public/models/bau.bin", Buffer.from(buf));
console.log("bau.bin", size, "bytes", [...head]);
