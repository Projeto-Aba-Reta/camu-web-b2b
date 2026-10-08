import * as THREE from "three";

/**
 * Modelos 3D da hero, gerados por scripts/convert-models.mjs a partir dos OBJ em public/models.
 * A chave é o `shape` da peça em hero-pieces.ts. São Y-up, com a base em y = 0.
 */
export const MODEL_FILES: Record<string, { file: string; glow?: number }> = {
  vaso: { file: "vaso" },
  // glow: altura relativa (0 base → 1 topo) da fonte de luz, dentro da cúpula
  luminaria: { file: "luminaria", glow: 0.45 },
  cofrinho: { file: "pig" },
};

const cache = new Map<string, Promise<THREE.BufferGeometry>>();

function parse(buf: ArrayBuffer): THREE.BufferGeometry {
  const [V, I] = new Uint32Array(buf, 0, 2);
  const pos = new Float32Array(buf, 8, V * 3);
  const o = 8 + V * 12;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(V < 65536 ? new Uint16Array(buf, o, I) : new Uint32Array(buf, o, I), 1));
  g.computeVertexNormals();
  return g;
}

/** Baixa o modelo (uma vez; ~1 MB, binário pronto para a GPU) e devolve uma geometria nova. */
export async function loadModel(key: string): Promise<THREE.BufferGeometry> {
  const url = `/models/${MODEL_FILES[key].file}.bin`;
  let p = cache.get(key);
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`[hero] ${url}: ${r.status}`);
      return r.arrayBuffer().then(parse);
    });
    cache.set(key, p);
    p.catch(() => cache.delete(key));
  }
  return (await p).clone();
}
