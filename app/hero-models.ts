import * as THREE from "three";

/**
 * Modelos 3D da hero, gerados por scripts/convert-models.mjs a partir dos OBJ em public/models.
 * A chave é o `shape` da peça em hero-pieces.ts. São Y-up, com a base em y = 0.
 */
export const MODEL_FILES: Record<string, { file: string; glow?: number; sway?: boolean; scale?: number; heap?: number }> = {
  vaso: { file: "vaso" },
  // glow: altura relativa (0 base → 1 topo) da fonte de luz, dentro da cúpula
  luminaria: { file: "luminaria", glow: 0.45 },
  cofrinho: { file: "pig" },
};

const cache = new Map<string, Promise<THREE.BufferGeometry>>();

function parse(buf: ArrayBuffer, heap = 0): THREE.BufferGeometry {
  const [V, I] = new Uint32Array(buf, 0, 2);
  let pos: Float32Array<ArrayBufferLike> = new Float32Array(buf, 8, V * 3);
  const o = 8 + V * 12;
  let idx: Uint16Array | Uint32Array = V < 65536 ? new Uint16Array(buf, o, I) : new Uint32Array(buf, o, I);
  if (heap > 1) [pos, idx] = heapCoins(pos, idx, heap);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
}

/**
 * Monta um montinho com `n` cópias de uma moeda (face em +z), sem que uma atravesse a outra:
 * cada moeda "cai" por último sobre as anteriores (uma por vez), numa posição sorteada perto do centro,
 * e pára na altura em que sua face de baixo toca o relevo do montinho. Sorteio determinístico (igual em toda visita).
 */
function heapCoins(pos: Float32Array, idx: Uint16Array | Uint32Array, n: number): [Float32Array, Uint32Array] {
  const V = pos.length / 3;
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < V; i++) for (let k = 0; k < 3; k++) {
    lo[k] = Math.min(lo[k], pos[i * 3 + k]);
    hi[k] = Math.max(hi[k], pos[i * 3 + k]);
  }
  const c = lo.map((a, k) => (a + hi[k]) / 2);
  const rad = Math.max(hi[0] - lo[0], hi[1] - lo[1]) / 2;
  const half = (hi[2] - lo[2]) / 2 + rad * 0.01; // meia espessura (com uma folga mínima)

  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

  type Placed = { cx: number; cy: number; cz: number; nx: number; ny: number; nz: number };
  const placed: Placed[] = [];
  /** altura da superfície do montinho no ponto (x, z); 0 = chão */
  const surface = (x: number, z: number) => {
    let h = 0;
    for (const q of placed) {
      const dx = x - q.cx;
      const dz = z - q.cz;
      const y = q.cy + (half - q.nx * dx - q.nz * dz) / q.ny; // face de cima do disco inclinado
      const dy = y - q.cy;
      const along = dx * dx + dy * dy + dz * dz - (dx * q.nx + dy * q.ny + dz * q.nz) ** 2;
      if (along <= rad * rad && y > h) h = y;
    }
    return h;
  };

  // pontos da face de baixo (centro + dois anéis), no sistema da moeda deitada
  const probes: [number, number][] = [[0, 0]];
  for (const f of [0.5, 1]) for (let k = 0; k < 12; k++) probes.push([Math.cos((k * Math.PI) / 6) * rad * f, Math.sin((k * Math.PI) / 6) * rad * f]);

  const out = new Float32Array(V * n * 3);
  const oidx = new Uint32Array(idx.length * n);
  for (let m = 0; m < n; m++) {
    let best: { cx: number; cy: number; cz: number; r: Float64Array; score: number } | null = null;
    for (let t = 0; t < 10; t++) {
      // moeda deitada, com pouca inclinação, girada ao acaso
      const tx = (rnd() - 0.5) * 0.4;
      const tz = (rnd() - 0.5) * 0.4;
      const yaw = rnd() * Math.PI * 2;
      const [sx, cxr] = [Math.sin(tx), Math.cos(tx)];
      const [sz, czr] = [Math.sin(tz), Math.cos(tz)];
      const [sy, cyr] = [Math.sin(yaw), Math.cos(yaw)];
      const rot = (x: number, y: number, z: number): [number, number, number] => {
        [y, z] = [y * cxr - z * sx, y * sx + z * cxr];
        [x, y] = [x * czr - y * sz, x * sz + y * czr];
        [x, z] = [x * cyr + z * sy, -x * sy + z * cyr];
        return [x, y, z];
      };
      const spread = rad * 2.6 * Math.sqrt(rnd());
      const ang = rnd() * Math.PI * 2;
      const cx = Math.cos(ang) * spread;
      const cz = Math.sin(ang) * spread;
      let cy = 0;
      for (const [px, pz] of probes) {
        const o = rot(px, -half, pz);
        cy = Math.max(cy, surface(cx + o[0], cz + o[2]) - o[1]);
      }
      const score = cy + spread * 0.12; // prefere ficar baixo e perto do centro: monta um montinho largo
      if (!best || score < best.score) best = { cx, cy, cz, r: Float64Array.of(tx, tz, yaw), score };
    }
    const { cx, cy, cz } = best!;
    const [tx, tz, yaw] = best!.r;
    const [sx, cxr] = [Math.sin(tx), Math.cos(tx)];
    const [sz, czr] = [Math.sin(tz), Math.cos(tz)];
    const [sy, cyr] = [Math.sin(yaw), Math.cos(yaw)];
    const rot = (x: number, y: number, z: number): [number, number, number] => {
      [y, z] = [y * cxr - z * sx, y * sx + z * cxr];
      [x, y] = [x * czr - y * sz, x * sz + y * czr];
      [x, z] = [x * cyr + z * sy, -x * sy + z * cyr];
      return [x, y, z];
    };
    const nrm = rot(0, 1, 0);
    placed.push({ cx, cy, cz, nx: nrm[0], ny: nrm[1], nz: nrm[2] });
    for (let i = 0; i < V; i++) {
      // deita a moeda (face +z → +y), depois inclina e gira
      const p = rot(pos[i * 3] - c[0], pos[i * 3 + 2] - c[2], -(pos[i * 3 + 1] - c[1]));
      const o = (m * V + i) * 3;
      out[o] = p[0] + cx;
      out[o + 1] = p[1] + cy;
      out[o + 2] = p[2] + cz;
    }
    for (let i = 0; i < idx.length; i++) oidx[m * idx.length + i] = idx[i] + m * V;
  }
  return [out, oidx];
}

/** Baixa o modelo (uma vez; ~1 MB, binário pronto para a GPU) e devolve uma geometria nova. */
export async function loadModel(key: string): Promise<THREE.BufferGeometry> {
  const url = `/models/${MODEL_FILES[key].file}.bin`;
  let p = cache.get(key);
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`[hero] ${url}: ${r.status}`);
      return r.arrayBuffer().then((b) => parse(b, MODEL_FILES[key].heap));
    });
    cache.set(key, p);
    p.catch(() => cache.delete(key));
  }
  return (await p).clone();
}
