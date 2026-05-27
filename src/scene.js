import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

/* ---------- easing helpers ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeInCubic = (x) => x * x * x;
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);

const CYAN = 0x35e8ff;
const VIOLET = 0x8a5bff;

/* ---------- canvas texture factory ---------- */
function makeTexture(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* document sheet with printed lines */
const paperTex = makeTexture(256, 200, (ctx, w, h) => {
  ctx.fillStyle = "#f3f6fb";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#cfd8e8";
  ctx.fillRect(0, 0, w, 6);
  ctx.fillStyle = "#7f8aa6";
  ctx.fillRect(20, 28, 120, 10);
  ctx.fillStyle = "#c2cbdc";
  for (let i = 0; i < 7; i++) ctx.fillRect(20, 56 + i * 18, w - 60 - (i % 3) * 24, 7);
  ctx.fillStyle = "#4f6bff";
  ctx.fillRect(w - 90, h - 40, 70, 24);
});

/* calculator face */
const calcTex = makeTexture(200, 256, (ctx, w, h) => {
  ctx.fillStyle = "#262b36";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#9be7c4";
  ctx.fillRect(18, 16, w - 36, 42);
  ctx.fillStyle = "#1d3b2e";
  ctx.font = "bold 26px monospace";
  ctx.textAlign = "right";
  ctx.fillText("1,204,800", w - 26, 46);
  for (let r = 0; r < 5; r++)
    for (let cI = 0; cI < 4; cI++) {
      ctx.fillStyle = r === 0 && cI === 3 ? "#ff8a4f" : "#454b5a";
      ctx.fillRect(18 + cI * 44, 76 + r * 34, 36, 26);
    }
});

/* holographic dashboard panels (efficiency UI) */
function holoPanel(draw) {
  return makeTexture(420, 300, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    // glassy frame
    ctx.fillStyle = "rgba(20,60,90,0.42)";
    roundRect(ctx, 8, 8, w - 16, h - 16, 18);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(80,230,255,0.9)";
    ctx.stroke();
    // corner ticks
    ctx.strokeStyle = "rgba(140,245,255,1)";
    ctx.lineWidth = 4;
    [[20, 20, 1, 1], [w - 20, 20, -1, 1], [20, h - 20, 1, -1], [w - 20, h - 20, -1, -1]].forEach(
      ([x, y, sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(x, y + 22 * sy);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 22 * sx, y);
        ctx.stroke();
      }
    );
    draw(ctx, w, h);
  });
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const panelCharts = holoPanel((ctx, w, h) => {
  ctx.fillStyle = "#cdeffff0";
  ctx.font = "600 26px 'Noto Sans JP', sans-serif";
  ctx.fillText("業務処理スピード", 40, 60);
  const bars = [0.35, 0.55, 0.48, 0.7, 0.85, 1.0];
  const bw = 42;
  bars.forEach((v, i) => {
    const x = 44 + i * 58;
    const bh = v * 150;
    const g = ctx.createLinearGradient(0, h - 60, 0, h - 60 - bh);
    g.addColorStop(0, "rgba(53,232,255,0.25)");
    g.addColorStop(1, "rgba(120,245,255,1)");
    ctx.fillStyle = g;
    ctx.fillRect(x, h - 60 - bh, bw, bh);
  });
});
const panelMetric = holoPanel((ctx, w) => {
  ctx.textAlign = "center";
  ctx.fillStyle = "#bfefff";
  ctx.font = "600 24px 'Noto Sans JP', sans-serif";
  ctx.fillText("処理時間", w / 2, 70);
  ctx.fillStyle = "#7cffe0";
  ctx.font = "800 96px Inter, sans-serif";
  ctx.fillText("-82%", w / 2, 180);
  ctx.fillStyle = "#9fe9ff";
  ctx.font = "500 22px 'Noto Sans JP', sans-serif";
  ctx.fillText("月40時間を削減", w / 2, 240);
  ctx.textAlign = "left";
});
const panelTasks = holoPanel((ctx, w) => {
  ctx.fillStyle = "#cdefff";
  ctx.font = "600 26px 'Noto Sans JP', sans-serif";
  ctx.fillText("AI 自動処理", 40, 58);
  const items = ["請求書 32件 仕訳完了", "領収書 OCR 取込", "契約書 自動分類", "帳簿 整合チェック"];
  items.forEach((t, i) => {
    const y = 100 + i * 44;
    ctx.strokeStyle = "#7cffe0";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(46, y);
    ctx.lineTo(56, y + 10);
    ctx.lineTo(74, y - 12);
    ctx.stroke();
    ctx.fillStyle = "#d8f3ff";
    ctx.font = "400 22px 'Noto Sans JP', sans-serif";
    ctx.fillText(t, 92, y + 8);
  });
});

/* radial glow sprite for nebula / core halo */
const glowTex = makeTexture(256, 256, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, "rgba(120,240,255,0.9)");
  g.addColorStop(0.35, "rgba(80,160,255,0.4)");
  g.addColorStop(1, "rgba(80,160,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
});

/* ---------- object builders ---------- */
function pmat(opts) {
  return new THREE.MeshStandardMaterial({ transparent: true, ...opts });
}

function makePaper() {
  const g = new THREE.Group();
  const sheets = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < sheets; i++) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.025, 0.92),
      pmat({ map: paperTex, roughness: 0.9, metalness: 0 })
    );
    m.position.set(rand(-0.05, 0.05), i * 0.03, rand(-0.05, 0.05));
    m.rotation.y = rand(-0.08, 0.08);
    g.add(m);
  }
  return g;
}
function makeBinder() {
  const color = new THREE.Color().setHSL(rand(0, 1), 0.5, 0.5);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.5, 0.42), pmat({ color, roughness: 0.6 })));
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 1.52, 0.44),
    pmat({ color: color.clone().offsetHSL(0, 0, -0.18), roughness: 0.6 })
  );
  spine.position.x = -0.58;
  g.add(spine);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), pmat({ color: 0xeef3fb }));
  label.position.set(0.1, 0.2, 0.212);
  g.add(label);
  return g;
}
function makeFolder() {
  const color = new THREE.Color().setHSL(rand(0.07, 0.16), 0.65, 0.6);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 1.0), pmat({ color, roughness: 0.8 })));
  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.16), pmat({ color, roughness: 0.8 }));
  tab.position.set(0.3, 0, 0.58);
  g.add(tab);
  return g;
}
function makeCalculator() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 1.05), pmat({ color: 0x262b36, roughness: 0.5, metalness: 0.2 })));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.03), pmat({ map: calcTex, roughness: 0.6 }));
  face.rotation.x = -Math.PI / 2;
  face.position.y = 0.061;
  g.add(face);
  return g;
}
function makeSticky() {
  const color = new THREE.Color().setHSL(rand(0.1, 0.45) % 1, 0.8, 0.65);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.4), pmat({ color, roughness: 0.9 })));
  return g;
}

/* give an object glowing scan-edges + digitization-ready emissive */
function digitize(group) {
  const mats = [];
  const edgeMats = [];
  group.traverse((o) => {
    if (!o.isMesh) return;
    o.material.emissive = new THREE.Color(CYAN);
    o.material.emissiveIntensity = 0;
    mats.push(o.material);
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(o.geometry),
      new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending })
    );
    o.add(edge);
    edgeMats.push(edge.material);
  });
  return { mats, edgeMats };
}

/* central AI core that replaces the laptop */
function makeAICore() {
  const g = new THREE.Group();
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x0a2b3a,
    emissive: new THREE.Color(CYAN),
    emissiveIntensity: 0.4,
    metalness: 0.4,
    roughness: 0.25,
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.78, 1), coreMat);
  g.add(core);

  const shellMat = new THREE.MeshBasicMaterial({
    color: CYAN,
    wireframe: true,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
  });
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 1), shellMat);
  g.add(shell);

  const rings = [];
  const ringMats = [];
  [
    [1.9, 0.03, VIOLET, new THREE.Euler(Math.PI / 2.2, 0, 0)],
    [2.3, 0.025, CYAN, new THREE.Euler(0.5, 0.4, Math.PI / 3)],
    [2.7, 0.02, CYAN, new THREE.Euler(-0.6, 0.9, 0.2)],
  ].forEach(([r, t, c, rot]) => {
    const mat = new THREE.MeshBasicMaterial({
      color: c,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 80), mat);
    ring.rotation.copy(rot);
    g.add(ring);
    rings.push(ring);
    ringMats.push(mat);
  });

  // halo glow sprite
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTex, color: CYAN, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  halo.scale.set(7, 7, 1);
  g.add(halo);

  // expanding energy pulse ring
  const pulseMat = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
  const pulse = new THREE.Mesh(new THREE.TorusGeometry(1, 0.02, 8, 80), pulseMat);
  pulse.rotation.x = Math.PI / 2;
  g.add(pulse);

  return { group: g, core, coreMat, shell, shellMat, rings, ringMats, halo, pulse, pulseMat };
}

function makeHoloDashboard(tex) {
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.5), mat);
  return mesh;
}

/* ---------- scene init ---------- */
export function initScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = makeTexture(2, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#04060f");
    g.addColorStop(0.55, "#070d1f");
    g.addColorStop(1, "#0a1430");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  scene.fog = new THREE.FogExp2(0x05080f, 0.032);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0.2, 1.4, 9);

  // lighting
  scene.add(new THREE.HemisphereLight(0x9fd0ff, 0x0a1024, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(4, 8, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(VIOLET, 0.9);
  rim.position.set(-6, 3, -4);
  scene.add(rim);
  const coreLight = new THREE.PointLight(CYAN, 0, 12);
  coreLight.position.set(0, 0.4, 0.3);
  scene.add(coreLight);

  // grid floor
  const grid = new THREE.GridHelper(60, 60, 0x2a6cff, 0x123056);
  grid.position.y = -2.6;
  grid.material.transparent = true;
  grid.material.opacity = 0.5;
  scene.add(grid);

  // nebula glow backdrop
  const nebula = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTex, color: VIOLET, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  nebula.position.set(0, 1, -12);
  nebula.scale.set(34, 22, 1);
  scene.add(nebula);

  // distant stars
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(700 * 3);
  for (let i = 0; i < 700; i++) {
    starPos.set([rand(-30, 30), rand(-6, 22), rand(-30, 6)], i * 3);
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  scene.add(
    new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0x9fd6ff, size: 0.06, transparent: true, opacity: 0.7, depthWrite: false })
    )
  );

  // AI core
  const ai = makeAICore();
  ai.group.position.set(0, 0.1, -0.2);
  scene.add(ai.group);
  const intake = new THREE.Vector3(0, 0.1, -0.2);

  // holographic dashboards
  const dashTex = [panelCharts, panelMetric, panelTasks];
  const dashboards = dashTex.map((t, i) => {
    const d = makeHoloDashboard(t);
    const ang = (-0.5 + i) * 0.9;
    d.userData = {
      base: new THREE.Vector3(Math.sin(ang) * 3.4, 0.4 + (i === 1 ? 1.4 : 0), -0.2 - Math.cos(ang) * 0.6),
      rotY: -ang * 0.9,
      float: Math.random() * Math.PI * 2,
    };
    d.position.copy(d.userData.base);
    d.rotation.y = d.userData.rotY;
    scene.add(d);
    return d;
  });

  // clutter
  const items = [];
  const builders = [
    ...Array(20).fill(makePaper),
    ...Array(4).fill(makeBinder),
    ...Array(4).fill(makeFolder),
    ...Array(5).fill(makeSticky),
    makeCalculator,
  ];
  builders.forEach((build) => {
    const mesh = build();
    const angle = rand(0, Math.PI * 2);
    const radius = rand(0.4, 3.2);
    const home = new THREE.Vector3(
      Math.cos(angle) * radius * 1.05,
      rand(-0.2, 2.8),
      Math.sin(angle) * radius * 0.8 + 0.3
    );
    mesh.position.copy(home);
    const homeRot = new THREE.Euler(rand(-0.5, 0.5), rand(0, Math.PI * 2), rand(-0.5, 0.5));
    mesh.rotation.copy(homeRot);
    const baseScale = rand(0.7, 1.05);
    mesh.scale.setScalar(baseScale);

    const dir = new THREE.Vector3(home.x, home.y - 0.4, home.z).normalize().multiplyScalar(rand(1.4, 2.8));
    dir.y += rand(0.4, 1.4);

    const { mats, edgeMats } = digitize(mesh);
    items.push({
      mesh, mats, edgeMats, home, homeRot, baseScale, dir,
      spin: new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)),
      phase: Math.random() * 0.32,
      float: Math.random() * Math.PI * 2,
    });
    scene.add(mesh);
  });

  // data-stream particles flowing into the core
  const COUNT = 700;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(COUNT * 3);
  const pStart = [];
  for (let i = 0; i < COUNT; i++) {
    const a = rand(0, Math.PI * 2);
    const r = rand(0.6, 3.4);
    const s = new THREE.Vector3(Math.cos(a) * r, rand(-0.4, 2.8), Math.sin(a) * r * 0.8 + 0.3);
    pStart.push({ s, off: Math.random(), speed: rand(0.5, 1.5) });
    pPos.set([s.x, s.y, s.z], i * 3);
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0x9ff0ff, size: 0.06, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // post-processing bloom
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.65, 0.55, 0.86);
  composer.addPass(bloom);

  /* ---------- per-frame update ---------- */
  let progress = 0;
  const tmp = new THREE.Vector3();
  const clock = new THREE.Clock();

  function update() {
    const t = clock.getElapsedTime();
    const p = progress;

    items.forEach((it) => {
      const te = clamp((p - it.phase * 0.4) / 0.45);
      const ta = clamp((p - 0.42 - it.phase * 0.28) / 0.45);
      const eTe = easeOutCubic(te);
      const eTa = easeInCubic(ta);

      tmp.copy(it.home).addScaledVector(it.dir, eTe);
      tmp.y += Math.sin(t * 0.8 + it.float) * 0.08 * (1 - ta);
      it.mesh.position.set(
        lerp(tmp.x, intake.x, eTa),
        lerp(tmp.y, intake.y, eTa),
        lerp(tmp.z, intake.z, eTa)
      );

      const swirl = eTe * 1.4 + eTa * 7;
      it.mesh.rotation.set(
        it.homeRot.x + it.spin.x * swirl,
        it.homeRot.y + it.spin.y * swirl,
        it.homeRot.z + it.spin.z * swirl
      );
      it.mesh.scale.setScalar(it.baseScale * (1 - 0.95 * easeInOut(ta)));

      // digitize: glow up as it is pulled in, then dissolve
      const dig = smoothstep(0.1, 0.8, ta);
      const op = 1 - smoothstep(0.55, 1, ta);
      it.mats.forEach((m) => {
        m.opacity = op;
        m.emissiveIntensity = dig * 2.2;
      });
      it.edgeMats.forEach((m) => (m.opacity = lerp(0.12, 1, dig) * op));
    });

    // AI core powers up
    const power = smoothstep(0.08, 0.7, p);
    const pulseSig = 0.8 + Math.sin(t * 2.4) * 0.2;
    ai.coreMat.emissiveIntensity = 0.4 + power * 1.7 * pulseSig;
    ai.core.scale.setScalar(0.85 + power * 0.3 + Math.sin(t * 2.4) * 0.04 * power);
    ai.core.rotation.y += 0.004;
    ai.core.rotation.x += 0.002;
    ai.shell.rotation.y -= 0.006;
    ai.shell.rotation.x += 0.003;
    ai.shellMat.opacity = 0.12 + power * 0.45;
    ai.rings.forEach((ring, i) => {
      ring.rotation.z += 0.004 + i * 0.003 + power * 0.01;
      ring.rotation.y += 0.003;
      ai.ringMats[i].opacity = power * (0.7 - i * 0.12);
    });
    ai.halo.material.opacity = power * 0.38 * pulseSig;
    coreLight.intensity = power * 2.8 * pulseSig;

    // periodic expanding pulse ring
    const pulseT = (t * 0.4) % 1;
    ai.pulse.scale.setScalar(0.8 + pulseT * 5);
    ai.pulseMat.opacity = power * (1 - pulseT) * 0.5;

    // particles flow in
    const flow = smoothstep(0.3, 0.72, p);
    pMat.opacity = flow * 0.95;
    const arr = pGeo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      const d = pStart[i];
      const f = (t * 0.2 * d.speed + d.off) % 1;
      const ef = easeInCubic(f);
      arr[i * 3] = lerp(d.s.x, intake.x, ef);
      arr[i * 3 + 1] = lerp(d.s.y, intake.y, ef);
      arr[i * 3 + 2] = lerp(d.s.z, intake.z, ef);
    }
    pGeo.attributes.position.needsUpdate = true;

    // holographic dashboards materialize at the end
    const dash = smoothstep(0.7, 0.95, p);
    dashboards.forEach((d) => {
      d.material.opacity = dash * 0.95;
      const bob = Math.sin(t * 0.9 + d.userData.float) * 0.08;
      d.position.set(d.userData.base.x, d.userData.base.y + bob, d.userData.base.z);
      d.scale.setScalar(lerp(0.85, 1, dash));
    });

    // camera: cinematic dolly-in with slow orbit, settling on the core
    const orbit = Math.sin(t * 0.13) * 0.5 * (1 - p * 0.4);
    const cz = lerp(9, 6.4, easeInOut(p));
    camera.position.set(orbit + 0.2, lerp(1.4, 0.9, p), cz);
    camera.lookAt(0, lerp(0.5, 0.3, p), -0.2);

    composer.render();
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  renderer.setAnimationLoop(update);

  return {
    setProgress(v) {
      progress = clamp(v);
    },
  };
}
