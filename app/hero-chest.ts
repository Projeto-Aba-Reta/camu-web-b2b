import * as THREE from "three";

/** gerado por scripts/convert-chest.mjs a partir dos OBJ em public/models (~1 MB) */
const URL = "/models/bau.bin";

/** os modelos são Z-up com ~14 de largura; na cena o baú tem ~1.9 e a base apoia em y = -1 */
const S = 1.9 / 14.2;
/** dobradiça (coordenadas do modelo): lado do y negativo, na borda da base */
const HINGE = { y: -0.8, z: 6.0 };

type Part = { pos: Float32Array; gold: Uint8Array; idx: Uint32Array };

let cache: Promise<[Part, Part]> | null = null;

function parse(buf: ArrayBuffer): [Part, Part] {
  const [bv, bi, lv, li] = new Uint32Array(buf, 0, 4);
  let o = 16;
  const part = (v: number, i: number): Part => {
    const pos = new Float32Array(buf, o, v * 3);
    o += v * 12;
    const gold = new Uint8Array(buf, o, v);
    o += v + ((4 - (v % 4)) % 4);
    const idx = new Uint32Array(buf, o, i);
    o += i * 4;
    return { pos, gold, idx };
  };
  return [part(bv, bi), part(lv, li)];
}

export type Chest = {
  base: THREE.BufferGeometry;
  lid: THREE.BufferGeometry;
  /** eixo da dobradiça, em coordenadas da cena */
  pivot: THREE.Vector3;
  yMin: number;
  /** topo com a tampa aberta */
  yMax: number;
};

/** Z-up (x, y, z) → Y-up (-x, z, y): a frente do baú (y positivo) olha para +z, a câmera */
function build({ pos, gold, idx }: Part): THREE.BufferGeometry {
  const out = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) {
    out[i] = (7 - pos[i]) * S;
    out[i + 1] = pos[i + 2] * S - 1;
    out[i + 2] = (pos[i + 1] - 3.5) * S;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(out, 3));
  g.setAttribute("aGold", new THREE.BufferAttribute(Float32Array.from(gold), 1));
  g.setIndex(new THREE.BufferAttribute(idx.slice(), 1));
  return g;
}

/** Baixa o modelo do baú (uma vez; ~1 MB, binário pronto para a GPU) e monta as geometrias. */
export async function loadChest(openAngle: number): Promise<Chest> {
  cache ??= fetch(URL).then((r) => {
    if (!r.ok) throw new Error(`[hero] ${URL}: ${r.status}`);
    return r.arrayBuffer().then(parse);
  });
  const [base, lid] = await cache.catch((e) => {
    cache = null;
    throw e;
  });

  const baseGeo = build(base);
  const lidGeo = build(lid);
  const pivot = new THREE.Vector3(0, HINGE.z * S - 1, (HINGE.y - 3.5) * S);
  const cos = Math.cos(openAngle);
  const sin = Math.sin(openAngle);
  const p = lidGeo.attributes.position.array;
  let yMax = -Infinity;
  for (let i = 0; i < p.length; i += 3) {
    yMax = Math.max(yMax, pivot.y + (p[i + 1] - pivot.y) * cos + (p[i + 2] - pivot.z) * sin);
  }
  return { base: baseGeo, lid: lidGeo, pivot, yMin: -1, yMax };
}
