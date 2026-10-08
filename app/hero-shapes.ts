import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// Formas "livres" da hero (as que não são de revolução): cada uma devolve uma BufferGeometry.
// A hero (hero-scene.ts) centraliza, escala e imprime cada uma camada por camada.
// A chave aqui é o `shape` da peça em hero-pieces.ts.

export type MeshShape = {
  build: () => THREE.BufferGeometry;
  /** peças planas balançam de frente para a câmera (girando, ficariam de lado) */
  sway?: boolean;
  /** gira em torno do eixo y: centraliza em x/z = 0 em vez da caixa envolvente */
  onAxis?: boolean;
};

/* ---------- utilitários ---------- */

/** Junta várias geometrias numa só (só a posição importa). */
function mergeGeometries(geos: THREE.BufferGeometry[], tinted: boolean[] = []) {
  const flat = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  const total = flat.reduce((n, g) => n + g.attributes.position.count, 0);
  const positions = new Float32Array(total * 3);
  const tint = new Float32Array(total);
  let o = 0;
  let v = 0;
  for (const [k, g] of flat.entries()) {
    const pos = g.attributes.position;
    if (tinted[k]) tint.fill(1, v, v + pos.count);
    v += pos.count;
    for (let i = 0; i < pos.count; i++) {
      positions[o++] = pos.getX(i);
      positions[o++] = pos.getY(i);
      positions[o++] = pos.getZ(i);
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  if (tinted.some(Boolean)) out.setAttribute("aTint", new THREE.BufferAttribute(tint, 1));
  out.computeVertexNormals();
  return out;
}

type Vec3 = [number, number, number];

/** Gira (radianos, em X→Y→Z) e depois move uma geometria. Devolve a mesma geometria. */
function part<G extends THREE.BufferGeometry>(geo: G, at: Vec3 = [0, 0, 0], rot: Vec3 = [0, 0, 0]) {
  if (rot[0]) geo.rotateX(rot[0]);
  if (rot[1]) geo.rotateY(rot[1]);
  if (rot[2]) geo.rotateZ(rot[2]);
  geo.translate(at[0], at[1], at[2]);
  return geo;
}

const v2 = (pts: [number, number][]) => pts.map(([x, y]) => new THREE.Vector2(x, y));

function roundedRect(w: number, h: number, r: number) {
  const x = -w / 2;
  const y = -h / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/* ---------- formas ---------- */

/** Medalha: disco com borda alta, anel e estrela em relevo, argola e fita em V no topo. */
function medal() {
  const body = new THREE.LatheGeometry(
    v2([[0, -0.07], [0.8, -0.07], [0.86, -0.12], [1, -0.12], [1, 0.12], [0.86, 0.12], [0.8, 0.07], [0, 0.07]]),
    96,
  );
  // disco e anel no plano XY (de frente para a câmera)
  const disc = [body, ...[1, -1].map((s) => part(new THREE.TorusGeometry(0.68, 0.035, 8, 64), [0, 0.07 * s, 0], [Math.PI / 2, 0, 0]))];
  const front = mergeGeometries(disc);
  front.rotateX(Math.PI / 2);

  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.2 : 0.5;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i) star.lineTo(x, y);
    else star.moveTo(x, y);
  }
  const relief = { depth: 0.07, bevelEnabled: false };
  const stars = [
    part(new THREE.ExtrudeGeometry(star, relief), [0, 0, 0.07]),
    part(new THREE.ExtrudeGeometry(star, relief), [0, 0, -0.14], [0, 0, Math.PI]),
  ];

  // argola e fita (duas tiras que se encontram na argola)
  const loop = part(new THREE.TorusGeometry(0.11, 0.04, 8, 32), [0, 1.1, 0]);
  const ribbon = [1, -1].map((s) => {
    const len = 1.1;
    const t = 0.32 * s;
    return part(new THREE.BoxGeometry(0.36, len, 0.05), [-Math.sin(t) * (len / 2) + 0, 1.2 + Math.cos(t) * (len / 2), 0], [0, 0, t]);
  });

  // a fita (aTint = 1) ganha a cor própria do shader em vez do dourado da peça
  const geo = mergeGeometries(
    [front, ...stars, loop, ...ribbon],
    [false, false, false, false, true, true],
  );
  geo.rotateY(-0.35);
  return geo;
}

/** Caixa de unboxing com a tampa aberta e uma surpresa dentro. */
function giftBox() {
  const W = 2;
  const D = 1.6;
  const H = 0.8;
  const T = 0.06;
  const tray = [
    part(new THREE.BoxGeometry(W, T, D), [0, T / 2, 0]),
    part(new THREE.BoxGeometry(W, H, T), [0, H / 2, D / 2 - T / 2]),
    part(new THREE.BoxGeometry(W, H, T), [0, H / 2, -D / 2 + T / 2]),
    part(new THREE.BoxGeometry(T, H, D - 2 * T), [W / 2 - T / 2, H / 2, 0]),
    part(new THREE.BoxGeometry(T, H, D - 2 * T), [-W / 2 + T / 2, H / 2, 0]),
  ];
  const lidD = D + 0.08;
  const lid = new THREE.BoxGeometry(W + 0.08, 0.12, lidD);
  lid.translate(0, 0, lidD / 2); // dobradiça na borda de trás
  lid.rotateX(-1.05);
  lid.translate(0, H + 0.06, -D / 2 - 0.04);
  const surprise = part(new THREE.SphereGeometry(0.3, 28, 20), [0, 0.62, 0]);
  return mergeGeometries([...tray, lid, surprise]);
}

/** Berço de dispositivo: bandeja com nicho de celular e dois nichos redondos. */
function cradle() {
  const W = 2.4;
  const D = 1.7;
  const T = 0.12;
  const H = 0.22;
  const w = 0.06;
  const y = T + H / 2;
  const walls = [
    part(new THREE.BoxGeometry(W, H, w), [0, y, D / 2 - w / 2]),
    part(new THREE.BoxGeometry(W, H, w), [0, y, -D / 2 + w / 2]),
    part(new THREE.BoxGeometry(w, H, D - 2 * w), [W / 2 - w / 2, y, 0]),
    part(new THREE.BoxGeometry(w, H, D - 2 * w), [-W / 2 + w / 2, y, 0]),
    // nicho do celular
    part(new THREE.BoxGeometry(0.9, H, w), [-0.65, y, 0.7]),
    part(new THREE.BoxGeometry(0.9, H, w), [-0.65, y, -0.7]),
    part(new THREE.BoxGeometry(w, H, 1.4), [-1.1, y, 0]),
    part(new THREE.BoxGeometry(w, H, 1.4), [-0.2, y, 0]),
  ];
  const phone = part(new THREE.BoxGeometry(0.78, 0.1, 1.3), [-0.65, T + 0.08, 0]);
  const pockets = [0.42, -0.42].flatMap((z) => [
    part(new THREE.CylinderGeometry(0.3, 0.3, H, 32, 1, true), [0.6, y, z]),
    part(new THREE.SphereGeometry(0.17, 20, 14), [0.6, T + 0.17, z]),
  ]);
  const geo = mergeGeometries([part(new THREE.BoxGeometry(W, T, D), [0, T / 2, 0]), ...walls, phone, ...pockets]);
  geo.rotateX(0.5);
  return geo;
}

/** Crachá/chaveiro NFC: placa com furo, argola passando e as ondas do símbolo NFC. */
function nfcTag() {
  const shape = roundedRect(1.5, 2.1, 0.28);
  const hole = new THREE.Path();
  hole.absarc(0, 0.78, 0.11, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const plate = new THREE.ExtrudeGeometry(shape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.02,
    bevelSegments: 2,
    curveSegments: 16,
  });
  plate.translate(0, 0, -0.05);
  const waves = [0.28, 0.5, 0.72].map((r) =>
    part(new THREE.TorusGeometry(r, 0.022, 8, 36, Math.PI / 2), [-0.45, -0.35, 0.07], [0, 0, -Math.PI / 4]),
  );
  const dot = part(new THREE.SphereGeometry(0.06, 12, 10), [-0.45, -0.35, 0.07]);
  const ring = part(new THREE.TorusGeometry(0.3, 0.045, 12, 40), [0, 1.08, 0], [0, Math.PI / 2, 0]);
  const geo = mergeGeometries([plate, ...waves, dot, ring]);
  geo.rotateY(-0.3);
  return geo;
}

/** Foguete: lançamento de produto. */
function rocket() {
  const profile = v2([[0, -0.12], [0.26, -0.12], [0.34, 0], [0.5, 0], [0.5, 1.5]]);
  for (let i = 1; i <= 24; i++) {
    const t = i / 24;
    profile.push(new THREE.Vector2(0.5 * Math.pow(1 - t, 0.65), 1.5 + t * 1.1));
  }
  const body = new THREE.LatheGeometry(profile, 64);
  const finShape = new THREE.Shape();
  finShape.moveTo(0.48, 0.85);
  finShape.lineTo(0.98, 0.15);
  finShape.lineTo(0.98, -0.2);
  finShape.lineTo(0.48, 0);
  const fins = [0, 1, 2].map((k) => {
    const f = new THREE.ExtrudeGeometry(finShape, { depth: 0.07, bevelEnabled: false });
    f.translate(0, 0, -0.035);
    return part(f, [0, 0, 0], [0, (k * Math.PI * 2) / 3, 0]);
  });
  const window = part(new THREE.TorusGeometry(0.18, 0.04, 12, 32), [0, 1.15, 0.5]);
  const glass = part(new THREE.CircleGeometry(0.16, 24), [0, 1.15, 0.5]);
  const stripe = part(new THREE.TorusGeometry(0.5, 0.025, 8, 48), [0, 0.45, 0], [Math.PI / 2, 0, 0]);
  return mergeGeometries([body, ...fins, window, glass, stripe]);
}

/** Cubo modular: oito peças de encaixe separadas, uma puxada para fora. */
function modularCube() {
  const pieces: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const out = sx === 1 && sy === 1 && sz === 1 ? 1.15 : 0.7;
        pieces.push(part(new RoundedBoxGeometry(0.9, 0.9, 0.9, 3, 0.08), [sx * out, sy * out, sz * out]));
      }
    }
  }
  const geo = mergeGeometries(pieces);
  geo.rotateY(0.6);
  return geo;
}

/** Engrenagem (peça de engenharia). */
function gear() {
  const teeth = 16;
  const outer = 1.2;
  const root = 1.0;
  const step = (Math.PI * 2) / teeth;
  const shape = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a0 = i * step;
    const pts: [number, number][] = [
      [root, a0],
      [outer, a0 + step * 0.18],
      [outer, a0 + step * 0.48],
      [root, a0 + step * 0.66],
    ];
    pts.forEach(([r, a], j) => {
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0 && j === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.32, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = new THREE.Path();
    p.absarc(Math.cos(a) * 0.66, Math.sin(a) * 0.66, 0.13, 0, Math.PI * 2, true);
    shape.holes.push(p);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.42,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    bevelSegments: 2,
    curveSegments: 24,
  });
  geo.rotateX(-Math.PI / 2 + 0.5); // deitada, inclinada para mostrar os dentes
  return geo;
}

function spiral() {
  const pts: THREE.Vector3[] = [];
  const turns = 1.6;
  const samples = 220;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const a = Math.PI * 0.28 + t * turns * Math.PI * 2;
    const r = 1.25 * Math.exp(-1.15 * t * turns);
    pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, (t - 0.5) * 0.3));
  }
  const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.13, 20, false);
  const eye = new THREE.SphereGeometry(0.17, 24, 16);
  const ea = Math.PI * 0.06;
  eye.translate(Math.cos(ea) * 1.21, Math.sin(ea) * 1.21, -0.15);
  return mergeGeometries([tube, eye]);
}

/** Formas livres, por chave (`shape` em hero-pieces.ts). */
export const MESH_SHAPES: Record<string, MeshShape> = {
  medalha: { build: medal, sway: true },
  "caixa-aberta": { build: giftBox },
  berco: { build: cradle, sway: true },
  foguete: { build: rocket, onAxis: true },
  "cracha-nfc": { build: nfcTag, sway: true },
  "cubo-modular": { build: modularCube },
  engrenagem: { build: gear, sway: true },
  espiral: { build: spiral, sway: true },
};
