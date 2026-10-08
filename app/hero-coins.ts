import * as THREE from "three";

/** gerado por scripts/convert-coin.mjs a partir de "Moeda Camu.obj" (~100 KB, diâmetro 1, face em +z) */
const URL = "/models/moeda.bin";

/** diâmetro da moeda na cena (o baú tem 1.9 de largura) */
const SIZE = 0.28;
const GRAVITY = 6.5;
const SPAWN_Y = 1.45;
/** altura (cena) das moedas apoiadas: bem abaixo da borda do baú (y ≈ -0.13), então elas atravessam a boca e caem para dentro */
const PILE_Y = [-0.55, -0.47];
/** lugares da pilha dentro do baú: [x, z, camada]. Cada moeda tem o seu, então nunca se atravessam. */
const SLOTS: [number, number, number][] = [
  [-0.4, -0.15, 0],
  [0, -0.15, 0],
  [0.4, -0.15, 0],
  [-0.4, 0.15, 0],
  [0, 0.15, 0],
  [0.4, 0.15, 0],
  [-0.4, 0, 1],
  [0, 0, 1],
  [0.4, 0, 1],
];
const BOUNCE = 0.32;
const SINK = 0.5;

const VERT = /* glsl */ `
varying vec3 vView;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uColor;
varying vec3 vView;
void main() {
  vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
  n = faceforward(n, vView, n);
  vec3 V = normalize(-vView);
  vec3 L1 = normalize(vec3(-0.5, 0.8, 0.6));
  vec3 L2 = normalize(vec3(0.8, 0.1, 0.4));
  float diff = max(dot(n, L1), 0.0) * 0.9 + max(dot(n, L2), 0.0) * 0.28 + 0.2;
  float spec = pow(max(dot(n, normalize(L1 + V)), 0.0), 38.0) * 0.8;
  float rim = pow(1.0 - max(dot(n, V), 0.0), 3.0);
  vec3 col = uColor * 1.35 * diff + vec3(spec) + uColor * rim * 0.25;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

let cache: Promise<THREE.BufferGeometry> | null = null;

/** Baixa a moeda (uma vez) e devolve a geometria compartilhada. */
export function loadCoinGeometry(): Promise<THREE.BufferGeometry> {
  cache ??= fetch(URL)
    .then((r) => {
      if (!r.ok) throw new Error(`[hero] ${URL}: ${r.status}`);
      return r.arrayBuffer();
    })
    .then((buf) => {
      const [V, I] = new Uint32Array(buf, 0, 2);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(buf, 8, V * 3), 3));
      g.setIndex(new THREE.BufferAttribute(new Uint16Array(buf, 8 + V * 12, I), 1));
      return g;
    });
  cache.catch(() => (cache = null));
  return cache;
}

type Coin = {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  y: number;
  /** pose de repouso (Euler) e giro restante, em voltas, que se desfaz até o pouso */
  rest: THREE.Euler;
  spin: THREE.Vector3;
  start: number;
  fall: number;
  hold: number;
  /** x e z de onde ela começa a cair */
  fx: number;
  fz: number;
};

export type Coins = {
  group: THREE.Group;
  /** começa a chuva de moedas */
  start: (now: number) => void;
  /** pilha pronta, sem animação */
  settle: () => void;
  /** some com tudo */
  reset: () => void;
  update: (now: number) => void;
  dispose: () => void;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function createCoins(geo: THREE.BufferGeometry, color: string): Coins {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    side: THREE.DoubleSide,
  });
  const group = new THREE.Group();
  group.visible = false;
  let running = false;

  const coins: Coin[] = SLOTS.map(([x, z, layer]) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.visible = false;
    group.add(mesh);
    return {
      mesh,
      x,
      z,
      y: PILE_Y[layer],
      rest: new THREE.Euler(),
      spin: new THREE.Vector3(),
      start: 0,
      fall: 0,
      hold: 0,
      fx: x,
      fz: z,
    };
  });

  /** sorteia uma nova queda para a moeda; `at` é o instante em que ela sai de cima */
  function arm(c: Coin, at: number) {
    c.fx = c.x + rand(-0.1, 0.1);
    c.fz = c.z + rand(-0.06, 0.06);
    c.rest.set(-Math.PI / 2 + rand(-0.18, 0.18), rand(-0.18, 0.18), rand(0, Math.PI * 2));
    c.fall = Math.sqrt((2 * (SPAWN_Y - c.y)) / GRAVITY);
    c.spin.set(rand(1, 2.5), rand(-1, 1), rand(-1, 1)).multiplyScalar(Math.PI * 2);
    c.start = at;
    c.hold = rand(1.2, 2.8);
    c.mesh.visible = false;
  }

  function pose(c: Coin, t: number) {
    const m = c.mesh;
    m.visible = true;
    let s = 1;
    if (t < c.fall) {
      const left = (c.fall - t) / c.fall;
      m.position.set(c.fx + (c.x - c.fx) * (1 - left), SPAWN_Y - 0.5 * GRAVITY * t * t, c.fz + (c.z - c.fz) * (1 - left));
      m.rotation.set(
        c.rest.x + c.spin.x * left,
        c.rest.y + c.spin.y * left,
        c.rest.z + c.spin.z * left,
      );
    } else {
      const tb = t - c.fall;
      const k = Math.min(tb / BOUNCE, 1);
      const bounce = 0.07 * Math.sin(Math.PI * k) * (1 - k);
      const sink = Math.max(0, (tb - c.hold) / SINK);
      m.position.set(c.x, c.y + bounce - 0.08 * sink, c.z);
      m.rotation.copy(c.rest);
      s = 1 - sink * sink;
    }
    m.scale.setScalar(SIZE * Math.max(s, 0.001));
  }

  return {
    group,
    start(now) {
      running = true;
      group.visible = true;
      coins.forEach((c, i) => arm(c, now + 250 + i * 140 + rand(0, 120)));
    },
    settle() {
      running = false;
      group.visible = true;
      coins.forEach((c) => {
        arm(c, 0);
        pose(c, c.fall + BOUNCE);
      });
    },
    reset() {
      running = false;
      group.visible = false;
      coins.forEach((c) => (c.mesh.visible = false));
    },
    update(now) {
      if (!running) return;
      for (const c of coins) {
        const t = (now - c.start) / 1000;
        if (t < 0) continue;
        if (t > c.fall + c.hold + SINK) {
          // sumiu na pilha: volta a cair logo depois
          arm(c, now + rand(100, 900));
          continue;
        }
        pose(c, t);
      }
    },
    dispose() {
      mat.dispose();
    },
  };
}
