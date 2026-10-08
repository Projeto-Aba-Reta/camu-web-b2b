import * as THREE from "three";
import { PIECES } from "./hero-pieces";
import { MESH_SHAPES } from "./hero-shapes";
import type { Chest } from "./hero-chest";
import type { Coins } from "./hero-coins";
import { MODEL_FILES } from "./hero-models";

const AROUND = 128;
/** raio máximo de uma peça livre (as de revolução ficam em ~0.8) */
const MAX_RADIUS = 1.15;
const ROWS = 96;
/** peça que vem de modelos OBJ (hero-chest.ts) e tem a tampa animada */
const CHEST = "bau";
const LID_OPEN = (112 * Math.PI) / 180;
const ACCENT = { dark: "#2f9e8e", light: "#ce6a4b" };
/** luz da luminária acesa */
const LAMP = { dark: "#ffcf7a", light: "#ff9a2e" };
/** moedas que caem no baú aberto */
const COIN = { dark: "#ffd45c", light: "#c9921a" };
/** fita da medalha (vértices com aTint) */
const RIBBON = { dark: "#d9363e", light: "#b5232b" };

type Profile = {
  /** altura relativa (1 = peça mais alta) */
  ext: number;
  /** topo aberto (vaso, taça) ou fechado */
  open: boolean;
  twist: number;
  /** raio por altura t (0 base → 1 topo) */
  r: (t: number) => number;
  /** expoente da superelipse: 2 = redondo, alto = quadrado */
  n: number;
  /** amplitude e nº de gomos da ondulação lateral */
  amp: (t: number) => number;
  m: number;
};

const PI = Math.PI;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const sup = (t: number, c: number, a: number, b: number, p: number) => {
  const x = Math.abs((t - c) / a);
  return x >= 1 ? 0 : b * Math.pow(1 - Math.pow(x, p), 1 / p);
};

// Peças de revolução: se metamorfoseiam entre si. A chave é o `shape` em PIECES.
// As demais peças vêm de hero-shapes.ts e são reimpressas.
const PROFILES: Record<string, Profile> = {
  caixa: {
    ext: 0.68,
    open: false,
    twist: 0,
    n: 7,
    m: 4,
    r: (t) => {
      if (t < 0.62) return 0.78;
      if (t < 0.68) return 0.83;
      return 0.83 * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.68) / 0.32, 2)));
    },
    amp: () => 0,
  },
  trofeu: {
    ext: 1,
    open: true,
    twist: 0,
    n: 2,
    m: 2,
    r: (t) => {
      const knob = 0.07 * Math.exp(-Math.pow((t - 0.24) / 0.03, 2));
      if (t < 0.38) return 0.62 - 0.42 * smooth(0.06, 0.1, t) + knob;
      const v = (t - 0.38) / 0.62;
      return 0.2 + 0.52 * Math.pow(Math.sin(v * PI * 0.5), 0.75);
    },
    amp: () => 0,
  },
  mascote: {
    ext: 1,
    open: false,
    twist: 0,
    n: 2,
    m: 2,
    r: (t) => Math.max(sup(t, 0.3, 0.3, 0.74, 3), sup(t, 0.75, 0.22, 0.5, 2)),
    amp: (t) => 0.4 * Math.exp(-Math.pow((t - 0.84) / 0.07, 2)),
  },
  torre: {
    ext: 1,
    open: false,
    twist: PI * 0.85,
    n: 9,
    m: 4,
    r: (t) => 0.72 * (1 - 0.5 * t) * (1 - 0.07 * ((t * 5) % 1)),
    amp: () => 0,
  },
};

/** Peça livre pronta para a cena: base em y = -1 e dentro do volume das peças de revolução. */
type Prepared = {
  geo: THREE.BufferGeometry;
  yMin: number;
  yMax: number;
  sway: boolean;
  /** malha com normais suaves (modelos OBJ) em vez de faces chapadas */
  smooth?: boolean;
  /** altura (cena) da fonte de luz, se a peça acende */
  glowY?: number;
};

/** Centraliza, escala e apoia a geometria em y = -1. */
function fit(geo: THREE.BufferGeometry, sway: boolean, onAxis = false, scale = 1): Prepared {
  geo.computeBoundingBox();
  const b = geo.boundingBox!;
  // peças que giram em torno do próprio eixo (foguete) não podem ser centradas pela caixa: as aletas desequilibram
  const cx = onAxis ? 0 : (b.min.x + b.max.x) / 2;
  const cz = onAxis ? 0 : (b.min.z + b.max.z) / 2;
  geo.translate(-cx, 0, -cz);
  const pos = geo.attributes.position;
  let maxR = 0;
  for (let i = 0; i < pos.count; i++) maxR = Math.max(maxR, Math.hypot(pos.getX(i), pos.getZ(i)));
  const h = b.max.y - b.min.y;
  const s = Math.min(2 / h, MAX_RADIUS / maxR) * scale;
  // peças reduzidas ficam centradas na altura da cena, não coladas na base
  const y0 = -1 + (2 - h * s) * (scale < 1 ? 0.5 : 0);
  geo.scale(s, s, s);
  geo.translate(0, y0 - b.min.y * s, 0);
  return { geo, yMin: y0, yMax: y0 + h * s, sway };
}

function prepareMesh(key: string): Prepared {
  const def = MESH_SHAPES[key];
  if (!def) throw new Error(`[hero] forma desconhecida: "${key}" (veja PROFILES, MESH_SHAPES e MODEL_FILES)`);
  return fit(def.build(), !!def.sway, !!def.onAxis);
}

function buildShape(p: Profile): Float32Array {
  const out = new Float32Array(ROWS * (AROUND + 1) * 3);
  const e = 2 / p.n;
  let o = 0;
  for (let i = 0; i < ROWS; i++) {
    const t = clamp((i - 1) / (ROWS - 3));
    let rad = p.r(t);
    if (i === 0 || (i === ROWS - 1 && !p.open)) rad = 0;
    const y = -1 + 2 * p.ext * t;
    const amp = p.amp(t);
    for (let j = 0; j <= AROUND; j++) {
      const a = (2 * PI * j) / AROUND + p.twist * t;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const k = rad * (1 + amp * Math.cos(p.m * a));
      out[o++] = Math.sign(c) * Math.pow(Math.abs(c), e) * k;
      out[o++] = y;
      out[o++] = Math.sign(s) * Math.pow(Math.abs(s), e) * k;
    }
  }
  return out;
}

const VERT = /* glsl */ `
attribute float aGold;
attribute float aTint;
varying vec3 vView;
varying vec3 vNormal;
varying vec3 vPos;
varying float vY;
varying float vGold;
varying float vTint;
void main() {
  vY = position.y;
  vPos = position;
  vNormal = normalMatrix * normal;
  vGold = aGold;
  vTint = aTint;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uAccent;
uniform vec3 uTint;
uniform float uPrint;
uniform float uWave;
uniform float uWaveAmt;
uniform float uLayers;
uniform float uYMin;
uniform float uYMax;
uniform float uSmooth;
uniform float uGlow;
uniform vec3 uGlowPos;
uniform vec3 uGlowCol;
varying vec3 vView;
varying vec3 vNormal;
varying vec3 vPos;
varying float vY;
varying float vGold;
varying float vTint;
void main() {
  float yn = (vY - uYMin) / (uYMax - uYMin);
  if (yn > uPrint) discard;

  vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
  if (uSmooth > 0.5) n = normalize(vNormal);
  n = faceforward(n, vView, n);
  vec3 V = normalize(-vView);
  vec3 L1 = normalize(vec3(-0.5, 0.8, 0.6));
  vec3 L2 = normalize(vec3(0.8, 0.1, 0.4));
  float diff = max(dot(n, L1), 0.0) * 0.9 + max(dot(n, L2), 0.0) * 0.28 + 0.16;
  float spec = pow(max(dot(n, normalize(L1 + V)), 0.0), 38.0) * (0.35 + 0.5 * vGold);
  float rim = pow(1.0 - max(dot(n, V), 0.0), 3.0);

  float ly = vY * uLayers;
  float f = abs(fract(ly) - 0.5) * 2.0;
  float w = fwidth(ly) * 1.5;
  float line = smoothstep(0.55, 0.95, f) * (1.0 - smoothstep(0.3, 0.8, w));

  vec3 base = mix(uColor * (1.0 + 0.5 * vGold) + vec3(0.1) * vGold, uTint, vTint);
  vec3 col = base * diff * (1.0 - 0.24 * line) + vec3(spec) + uAccent * rim * 0.3;
  col += uAccent * exp(-abs(yn - uPrint) * 70.0) * step(uPrint, 0.999) * 1.6;
  // luminária acesa: a luz de dentro atravessa a cúpula e tinge a peça perto da fonte
  float gd = distance(vPos, uGlowPos);
  float lit = uGlow * (0.15 + 0.45 * exp(-gd * gd * 1.4));
  col = mix(col, uGlowCol, clamp(lit * 0.3, 0.0, 0.4)) + uGlowCol * lit * 0.08;
  col += uAccent * exp(-pow((yn - uWave) * 9.0, 2.0)) * uWaveAmt * 0.85;

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

export type HeroScene = {
  setIndex: (i: number, instant?: boolean) => void;
  setActive: (on: boolean) => void;
  dispose: () => void;
};

export function createScene(
  canvas: HTMLCanvasElement,
  opts: { reduced: boolean; initial: number; theme: "dark" | "light" },
): HeroScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 1.25, 5.9);
  camera.lookAt(0, -0.1, 0);

  // por peça: ou um perfil de revolução (shapes[i]) ou uma malha livre (meshes[i])
  const shapes = PIECES.map((p) => (PROFILES[p.shape] ? buildShape(PROFILES[p.shape]) : null));
  // o baú chega depois (OBJ pesado): começa vazio e é preenchido por ensureChest()
  const chestStub: Prepared = { geo: new THREE.BufferGeometry(), yMin: -1, yMax: 1, sway: true };
  // os modelos OBJ também chegam depois: ensureModel() preenche o stub
  const modelStubs: Record<string, Prepared> = {};
  const meshes = PIECES.map((p) => {
    if (PROFILES[p.shape]) return null;
    if (p.shape === CHEST) return chestStub;
    if (MODEL_FILES[p.shape]) {
      return (modelStubs[p.shape] = { geo: new THREE.BufferGeometry(), yMin: -1, yMax: 1, sway: false, smooth: true });
    }
    return prepareMesh(p.shape);
  });
  const isChest = (i: number) => meshes[i] === chestStub;
  const modelKey = (i: number) => (modelStubs[PIECES[i].shape] ? PIECES[i].shape : null);
  const colors = PIECES.map((p) => new THREE.Color(opts.theme === "light" ? p.colorLight : p.color));
  const cur = new Float32Array(shapes.find((s) => s)!);
  const from = new Float32Array(cur);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(cur, 3));
  const idx: number[] = [];
  const stride = AROUND + 1;
  for (let i = 0; i < ROWS - 1; i++) {
    for (let j = 0; j < AROUND; j++) {
      const a = i * stride + j;
      idx.push(a, a + stride, a + 1, a + 1, a + stride, a + stride + 1);
    }
  }
  geo.setIndex(idx);

  const uniforms = {
    uColor: { value: colors[opts.initial].clone() },
    uAccent: { value: new THREE.Color(ACCENT[opts.theme]) },
    uTint: { value: new THREE.Color(RIBBON[opts.theme]) },
    uPrint: { value: opts.reduced ? 1.1 : 0 },
    uWave: { value: 0 },
    uWaveAmt: { value: 0 },
    uLayers: { value: 36 },
    uYMin: { value: -1 },
    uYMax: { value: 1 },
    uSmooth: { value: 0 },
    uGlow: { value: 0 },
    uGlowPos: { value: new THREE.Vector3() },
    uGlowCol: { value: new THREE.Color(LAMP[opts.theme]) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat); // peças de revolução (a grade se deforma)
  mesh.frustumCulled = false;
  const meshFree = new THREE.Mesh(undefined, mat); // peças livres (troca a geometria)
  meshFree.frustumCulled = false;
  meshFree.visible = false;
  const lidMesh = new THREE.Mesh(undefined, mat); // tampa do baú: gira na dobradiça
  lidMesh.frustumCulled = false;
  lidMesh.visible = false;
  lidMesh.matrixAutoUpdate = false;
  const spin = new THREE.Group();
  spin.add(mesh, meshFree, lidMesh);

  // base de impressão: anéis finos
  const plate = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({
    color: "#ce6a4b", // --c-accent
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
  });
  const rings: [number, number, number][] = [
    [1.25, 1.27, 0.5],
    [1.65, 1.66, 0.22],
  ];
  const ringMats: THREE.MeshBasicMaterial[] = [];
  const ringGeos: THREE.RingGeometry[] = [];
  for (const [a, b, o] of rings) {
    const g = new THREE.RingGeometry(a, b, 96);
    const m = ringMat.clone();
    m.opacity = o;
    const r = new THREE.Mesh(g, m);
    r.rotation.x = -PI / 2;
    r.position.y = -1.001;
    plate.add(r);
    ringGeos.push(g);
    ringMats.push(m);
  }

  // luz da luminária: halo atrás da peça e poça de luz no chão
  const glowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.25, "rgba(255,255,255,0.45)");
    grad.addColorStop(0.6, "rgba(255,255,255,0.12)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const glowBlend = opts.theme === "light" ? THREE.NormalBlending : THREE.AdditiveBlending;
  const glowPeak = opts.theme === "light" ? 0.18 : 0.28;
  const haloMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: LAMP[opts.theme],
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: glowBlend,
  });
  const halo = new THREE.Sprite(haloMat);
  halo.scale.set(3.2, 3.2, 1);
  halo.visible = false;
  const poolGeo = new THREE.CircleGeometry(2, 48);
  const poolMat = new THREE.MeshBasicMaterial({
    map: glowTex,
    color: LAMP[opts.theme],
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: glowBlend,
  });
  const pool = new THREE.Mesh(poolGeo, poolMat);
  pool.rotation.x = -PI / 2;
  pool.position.y = -1.004;
  pool.visible = false;

  const group = new THREE.Group();
  group.add(plate, pool, spin, halo);
  scene.add(group);

  let width = 0;
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    width = w;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // em telas estreitas afasta a câmera para a peça caber inteira
    camera.position.z = camera.aspect < 0.9 ? 5.9 / Math.max(camera.aspect, 0.6) * 0.92 : 5.9;
    camera.updateProjectionMatrix();
    render();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // estado
  let target = opts.initial; // peça de destino da metamorfose
  let shown = opts.initial; // peça que está na tela (ou que vai aparecer)
  let tStart = -1; // início da transição (ms); -1 = parado
  let printStart = opts.reduced ? -1 : 0;
  // trocas que envolvem uma peça livre: a atual se desimprime e a nova é impressa
  let outStart = -1;
  let outFrom = 1;
  let pending = opts.initial;
  let swayOn = false;
  const DUR = 1500;
  const PRINT_DUR = 1800;
  const OUT_DUR = 650;
  let active = true;
  let raf = 0;
  let last = 0;
  let px = 0;
  let py = 0;
  let tx = 0;
  let ty = 0;
  const fromColor = colors[opts.initial].clone();

  // baú: tampa numa mola amortecida (quica ao abrir), presa à dobradiça
  let chestData: Chest | null = null;
  let chestState: "idle" | "loading" | "ready" = "idle";
  let lidAngle = 0;
  let lidVel = 0;
  let lidTarget = 0;
  let openAt = 0;
  let flashStart = -1;
  let disposed = false;
  let coins: Coins | null = null;
  // luminária: acende logo depois de impressa (pisca antes de firmar) e respira de leve
  let glowY: number | null = null;
  let glowStart = -1;
  let glow = 0;
  function setGlow() {
    const on = glowY !== null && glow > 0.002;
    uniforms.uGlow.value = on ? glow : 0;
    halo.visible = pool.visible = on;
    if (on) {
      halo.position.set(0, glowY!, 0);
      haloMat.opacity = glow * glowPeak;
      poolMat.opacity = glow * glowPeak * 0.8;
    }
  }
  const mT = new THREE.Matrix4();
  const mR = new THREE.Matrix4();
  const mB = new THREE.Matrix4();
  function setLid() {
    if (!chestData) return;
    const p = chestData.pivot;
    mT.makeTranslation(p.x, p.y, p.z);
    mR.makeRotationX(-lidAngle);
    mB.makeTranslation(-p.x, -p.y, -p.z);
    lidMesh.matrix.copy(mT).multiply(mR).multiply(mB);
    lidMesh.matrixWorldNeedsUpdate = true;
  }

  function ensureChest() {
    if (chestState !== "idle") return;
    chestState = "loading";
    import("./hero-coins")
      .then((m) => m.loadCoinGeometry().then((g) => m.createCoins(g, COIN[opts.theme])))
      .then((c) => {
        if (disposed) {
          c.dispose();
          return;
        }
        coins = c;
        spin.add(c.group);
        // baú já aberto (movimento reduzido): a pilha aparece pronta
        if (opts.reduced && isChest(shown) && chestData) {
          c.settle();
          render();
        } else if (!opts.reduced && isChest(shown) && lidTarget === LID_OPEN && outStart < 0) {
          // as moedas chegaram depois de a tampa abrir
          c.start(performance.now());
        }
      })
      .catch(() => {});
    import("./hero-chest")
      .then((m) => m.loadChest(LID_OPEN))
      .then((c) => {
        if (disposed) {
          c.base.dispose();
          c.lid.dispose();
          return;
        }
        chestData = c;
        chestState = "ready";
        chestStub.geo = c.base;
        chestStub.yMin = c.yMin;
        chestStub.yMax = c.yMax;
        lidMesh.geometry = c.lid;
        if (isChest(shown) && outStart < 0) {
          show(shown);
          printStart = opts.reduced ? -1 : 0;
          uniforms.uPrint.value = opts.reduced ? 1.1 : 0;
          loop();
          render();
        }
      })
      .catch(() => {
        chestState = "idle";
      });
  }

  const modelState: Record<string, "loading" | "ready"> = {};
  function ensureModel(i: number) {
    const key = modelKey(i);
    if (!key || modelState[key]) return;
    modelState[key] = "loading";
    import("./hero-models")
      .then((m) => m.loadModel(key))
      .then((g) => {
        if (disposed) {
          g.dispose();
          return;
        }
        const stub = modelStubs[key];
        stub.geo.dispose();
        Object.assign(stub, fit(g, !!MODEL_FILES[key].sway, false, MODEL_FILES[key].scale), { smooth: true });
        const rel = MODEL_FILES[key].glow;
        if (rel !== undefined) stub.glowY = stub.yMin + rel * (stub.yMax - stub.yMin);
        modelState[key] = "ready";
        if (PIECES[shown].shape === key && outStart < 0) {
          show(shown);
          printStart = opts.reduced ? -1 : 0;
          uniforms.uPrint.value = opts.reduced ? 1.1 : 0;
          loop();
          render();
        }
      })
      .catch(() => {
        delete modelState[key];
      });
  }

  const ease = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);

  function render() {
    renderer.render(scene, camera);
  }

  /** Coloca a peça i na tela, sem transição. */
  function show(i: number) {
    const free = meshes[i];
    mesh.visible = !free;
    meshFree.visible = !!free;
    if (free) {
      meshFree.geometry = free.geo;
      uniforms.uYMin.value = free.yMin;
      uniforms.uYMax.value = free.yMax;
    } else {
      cur.set(shapes[i]!);
      (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      uniforms.uYMin.value = -1;
      uniforms.uYMax.value = 1;
    }
    uniforms.uSmooth.value = free?.smooth ? 1 : 0;
    glowY = free?.glowY ?? null;
    glowStart = -1;
    glow = glowY !== null && opts.reduced ? 1 : 0;
    if (glowY !== null) uniforms.uGlowPos.value.set(0, glowY, 0);
    setGlow();
    uniforms.uColor.value.copy(colors[i]);
    uniforms.uWaveAmt.value = 0;
    swayOn = !!free?.sway;
    lidMesh.visible = isChest(i) && !!chestData;
    coins?.reset();
    if (opts.reduced && isChest(i) && chestData) coins?.settle();
    lidVel = 0;
    openAt = 0;
    flashStart = -1;
    lidAngle = lidTarget = opts.reduced && isChest(i) ? LID_OPEN : 0;
    setLid();
    shown = i;
    target = i;
  }
  show(opts.initial);

  function setIndex(i: number, instant = false) {
    if (isChest(i)) ensureChest();
    ensureModel(i);
    if (i === target && tStart < 0 && outStart < 0) return;
    if (instant || opts.reduced) {
      tStart = -1;
      outStart = -1;
      show(i);
      if (opts.reduced) uniforms.uPrint.value = 1.1;
      render();
      return;
    }
    if (outStart < 0 && !meshes[shown] && !meshes[i]) {
      // entre peças de revolução: a forma se metamorfoseia
      from.set(cur);
      fromColor.copy(uniforms.uColor.value);
      target = i;
      shown = i;
      tStart = performance.now();
    } else {
      // envolve uma peça livre: a atual se desimprime, a nova é impressa
      pending = i;
      target = i;
      if (outStart < 0) {
        outStart = performance.now();
        outFrom = Math.min(uniforms.uPrint.value, 1.04);
        tStart = -1;
        printStart = -1;
        uniforms.uWaveAmt.value = 0;
      }
    }
    loop();
  }

  function frame(now: number) {
    const dt = Math.min(now - last, 50);
    last = now;
    let busy = false;

    if (outStart >= 0) {
      const k = clamp((now - outStart) / OUT_DUR);
      uniforms.uPrint.value = outFrom * (1 - ease(k));
      if (k >= 1) {
        outStart = -1;
        show(pending);
        uniforms.uPrint.value = 0;
        printStart = 0;
      }
      busy = true;
    }

    if (printStart >= 0) {
      if (printStart === 0) printStart = now;
      const k = clamp((now - printStart) / PRINT_DUR);
      uniforms.uPrint.value = ease(k) * 1.04;
      if (k >= 1) {
        uniforms.uPrint.value = 1.1;
        printStart = -1;
        if (isChest(shown) && chestData) openAt = now + 450;
        if (glowY !== null) glowStart = now + 350;
      }
      busy = true;
    }

    if (chestData && isChest(shown) && outStart < 0) {
      if (openAt && now >= openAt) {
        openAt = 0;
        lidTarget = LID_OPEN;
        flashStart = now;
        coins?.start(now);
      }
      if (openAt) busy = true;
      const s = dt / 1000;
      {
        const K = 38;
        const C = 5.2;
        lidVel += ((lidTarget - lidAngle) * K - lidVel * C) * s;
        lidAngle += lidVel * s;
        if (Math.abs(lidTarget - lidAngle) < 0.0008 && Math.abs(lidVel) < 0.002) {
          lidAngle = lidTarget;
          lidVel = 0;
        } else busy = true;
        setLid();
      }
      if (flashStart >= 0) {
        const k = clamp((now - flashStart) / 900);
        uniforms.uWave.value = k * 1.4 - 0.2;
        uniforms.uWaveAmt.value = Math.sin(k * PI) * 0.8;
        if (k >= 1) {
          flashStart = -1;
          uniforms.uWaveAmt.value = 0;
        }
        busy = true;
      }
    }

    if (coins?.group.visible && outStart < 0) coins.update(now);
    else if (coins?.group.visible) coins.reset();

    if (glowY !== null && !opts.reduced) {
      if (outStart >= 0) {
        glow = Math.min(glow, clamp(uniforms.uPrint.value));
      } else if (glowStart >= 0 && now >= glowStart) {
        const t = (now - glowStart) / 1000;
        const flicker = t < 1 ? 0.7 + 0.3 * Math.sin(t * 70) * Math.sin(t * 23) : 1;
        glow = ease(clamp(t / 0.9)) * flicker * (1 + 0.05 * Math.sin(now * 0.0023));
      }
      setGlow();
    }

    if (tStart >= 0) {
      const k = clamp((now - tStart) / DUR);
      const to = shapes[target]!;
      for (let i = 0; i < ROWS; i++) {
        const delay = (i / (ROWS - 1)) * 0.35;
        const e = ease(clamp((k - delay) / 0.65));
        const base = i * stride * 3;
        for (let q = 0; q < stride * 3; q++) {
          cur[base + q] = from[base + q] + (to[base + q] - from[base + q]) * e;
        }
      }
      (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      uniforms.uColor.value.copy(fromColor).lerp(colors[target], ease(k));
      uniforms.uWave.value = k * 1.4 - 0.2;
      uniforms.uWaveAmt.value = Math.sin(k * PI);
      if (k >= 1) {
        tStart = -1;
        uniforms.uWaveAmt.value = 0;
      }
      busy = true;
    }

    if (!opts.reduced) {
      if (swayOn && outStart < 0) {
        // peças planas balançam de frente para a câmera
        const front = Math.round(spin.rotation.y / (PI * 2)) * PI * 2;
        spin.rotation.y += (front + Math.sin(now * 0.0006) * 0.55 - spin.rotation.y) * 0.04;
      } else {
        spin.rotation.y += dt * 0.00038;
      }
      plate.rotation.y -= dt * 0.00012;
      px += (tx - px) * 0.06;
      py += (ty - py) * 0.06;
      group.rotation.y = px * 0.35;
      group.rotation.x = py * 0.14;
    }

    render();
    return busy || !opts.reduced;
  }

  function loop() {
    if (raf || !active) return;
    last = performance.now();
    const step = (now: number) => {
      raf = 0;
      if (!active) return;
      if (frame(now)) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    tx = clamp(((e.clientX - r.left) / (width || r.width)) * 2 - 1, -1, 1);
    ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
  };
  const onLeave = () => {
    tx = 0;
    ty = 0;
  };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);

  // baixa o baú em segundo plano, antes de a peça chegar
  const prefetch = opts.reduced
    ? 0
    : window.setTimeout(() => {
        ensureChest();
        PIECES.forEach((_, i) => ensureModel(i));
      }, 2500);
  ensureModel(opts.initial);

  resize();
  loop();

  return {
    setIndex,
    setActive(on) {
      active = on;
      if (on) loop();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    dispose() {
      active = false;
      disposed = true;
      clearTimeout(prefetch);
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      geo.dispose();
      meshes.forEach((m) => m?.geo.dispose());
      chestData?.lid.dispose();
      coins?.dispose();
      glowTex.dispose();
      haloMat.dispose();
      poolGeo.dispose();
      poolMat.dispose();
      mat.dispose();
      ringGeos.forEach((g) => g.dispose());
      ringMats.forEach((m) => m.dispose());
      ringMat.dispose();
      renderer.dispose();
    },
  };
}
