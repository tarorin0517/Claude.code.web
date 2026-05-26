import * as THREE from "three";

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

/* paper sheet with faint printed lines */
const paperTex = makeTexture(256, 200, (ctx, w, h) => {
  ctx.fillStyle = "#fdfdfb";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#dfe3ec";
  ctx.fillRect(0, 0, w, 6);
  ctx.fillStyle = "#9aa3b8";
  ctx.fillRect(20, 28, 120, 10);
  ctx.fillStyle = "#cdd3e0";
  for (let i = 0; i < 7; i++) ctx.fillRect(20, 56 + i * 18, w - 60 - (i % 3) * 24, 7);
  ctx.fillStyle = "#4f6bff";
  ctx.fillRect(w - 90, h - 40, 70, 24);
});

/* calculator face */
const calcTex = makeTexture(200, 256, (ctx, w, h) => {
  ctx.fillStyle = "#2b2f3a";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#9be7c4";
  ctx.fillRect(18, 16, w - 36, 42);
  ctx.fillStyle = "#1d3b2e";
  ctx.font = "bold 26px monospace";
  ctx.textAlign = "right";
  ctx.fillText("1,204,800", w - 26, 46);
  for (let r = 0; r < 5; r++)
    for (let cI = 0; cI < 4; cI++) {
      ctx.fillStyle = r === 0 && cI === 3 ? "#ff8a4f" : "#4a4f5e";
      ctx.fillRect(18 + cI * 44, 76 + r * 34, 36, 26);
    }
});

/* AI assistant display */
const screenTex = makeTexture(640, 400, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#0b1226");
  g.addColorStop(1, "#1a1346");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // glow orb
  const rg = ctx.createRadialGradient(w / 2, 150, 10, w / 2, 150, 150);
  rg.addColorStop(0, "rgba(124,180,255,0.9)");
  rg.addColorStop(0.5, "rgba(124,77,255,0.35)");
  rg.addColorStop(1, "rgba(124,77,255,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, w, 320);
  // AI wordmark
  ctx.textAlign = "center";
  ctx.fillStyle = "#eaf1ff";
  ctx.font = "800 120px Inter, sans-serif";
  ctx.fillText("AI", w / 2, 195);
  ctx.font = "600 26px Inter, sans-serif";
  ctx.fillStyle = "#18d3c8";
  ctx.fillText("sDoctor", w / 2, 245);
  // chat lines
  ctx.textAlign = "left";
  const lines = ["請求書 32件を仕訳しました", "領収書を自動分類", "すべて整理完了 ✓"];
  lines.forEach((t, i) => {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(60, 286 + i * 36, w - 120, 26);
    ctx.fillStyle = "#cfe0ff";
    ctx.font = "20px 'Noto Sans JP', sans-serif";
    ctx.fillText(t, 76, 305 + i * 36);
  });
});

/* ---------- object builders ---------- */
function makeMat(opts) {
  return new THREE.MeshStandardMaterial({
    transparent: true,
    ...opts,
  });
}

function makePaper() {
  const g = new THREE.Group();
  const sheets = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < sheets; i++) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.025, 0.92),
      makeMat({ map: paperTex, roughness: 0.95, metalness: 0 })
    );
    m.position.set(rand(-0.05, 0.05), i * 0.03, rand(-0.05, 0.05));
    m.rotation.y = rand(-0.08, 0.08);
    g.add(m);
  }
  return g;
}

function makeBinder() {
  const color = new THREE.Color().setHSL(rand(0, 1), 0.55, 0.5);
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 1.5, 0.42),
    makeMat({ color, roughness: 0.6, metalness: 0.05 })
  );
  g.add(body);
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 1.52, 0.44),
    makeMat({ color: color.clone().offsetHSL(0, 0, -0.18), roughness: 0.6 })
  );
  spine.position.x = -0.58;
  g.add(spine);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.5),
    makeMat({ color: 0xf7f9fc, roughness: 0.9 })
  );
  label.position.set(0.1, 0.2, 0.212);
  g.add(label);
  return g;
}

function makeCalculator() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.12, 1.05),
    makeMat({ color: 0x2b2f3a, roughness: 0.5, metalness: 0.2 })
  );
  g.add(body);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 1.03),
    makeMat({ map: calcTex, roughness: 0.6 })
  );
  face.rotation.x = -Math.PI / 2;
  face.position.y = 0.061;
  g.add(face);
  return g;
}

function makeFolder() {
  const color = new THREE.Color().setHSL(rand(0.07, 0.16), 0.7, 0.6);
  const g = new THREE.Group();
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.05, 1.0),
    makeMat({ color, roughness: 0.8 })
  );
  g.add(m);
  const tab = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.05, 0.16),
    makeMat({ color, roughness: 0.8 })
  );
  tab.position.set(0.3, 0, 0.58);
  g.add(tab);
  return g;
}

function makeSticky() {
  const color = new THREE.Color().setHSL(rand(0.1, 0.45) % 1, 0.85, 0.65);
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.02, 0.4),
    makeMat({ color, roughness: 0.9 })
  );
  const g = new THREE.Group();
  g.add(m);
  return g;
}

function makeLaptop() {
  const g = new THREE.Group();
  const metal = { color: 0xc7d0dc, roughness: 0.35, metalness: 0.7 };
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 1.7), makeMat(metal));
  g.add(base);
  // keyboard deck
  const deck = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.4),
    makeMat({ color: 0x1c2230, roughness: 0.7 })
  );
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = 0.061;
  g.add(deck);
  const pad = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.45),
    makeMat({ color: 0x2a3346, roughness: 0.6 })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(0, 0.062, 0.45);
  g.add(pad);

  // screen lid (pivots at the back edge)
  const lid = new THREE.Group();
  lid.position.set(0, 0.06, -0.85);
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.6, 0.08),
    makeMat(metal)
  );
  panel.position.y = 0.8;
  lid.add(panel);
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 1.42),
    new THREE.MeshBasicMaterial({ map: screenTex, transparent: true })
  );
  display.position.set(0, 0.8, 0.05);
  lid.add(display);
  g.add(lid);

  return { group: g, lid, display, deck };
}

/* ---------- scene init ---------- */
export function initScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b1020, 0.02);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0.2, 1.4, 9);

  // lighting
  scene.add(new THREE.HemisphereLight(0xbed0ff, 0x10162a, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 8, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7c4dff, 0.8);
  rim.position.set(-6, 3, -4);
  scene.add(rim);
  const screenLight = new THREE.PointLight(0x7cb4ff, 0, 9);
  screenLight.position.set(0, 1, 0.4);
  scene.add(screenLight);

  // laptop at the centre
  const laptop = makeLaptop();
  laptop.group.position.set(0, -0.5, -0.2);
  scene.add(laptop.group);

  const intake = new THREE.Vector3(0, 0.45, -0.2);

  // clutter
  const items = [];
  const builders = [
    ...Array(22).fill(makePaper),
    ...Array(4).fill(makeBinder),
    ...Array(4).fill(makeFolder),
    ...Array(6).fill(makeSticky),
    makeCalculator,
  ];
  builders.forEach((build) => {
    const mesh = build();
    // home: a loose heap above / around the laptop
    const angle = rand(0, Math.PI * 2);
    const radius = rand(0.2, 3.1);
    const home = new THREE.Vector3(
      Math.cos(angle) * radius * 1.05,
      rand(-0.1, 2.7),
      Math.sin(angle) * radius * 0.8 + 0.3
    );
    mesh.position.copy(home);
    const homeRot = new THREE.Euler(rand(-0.5, 0.5), rand(0, Math.PI * 2), rand(-0.5, 0.5));
    mesh.rotation.copy(homeRot);
    const baseScale = rand(0.7, 1.05);
    mesh.scale.setScalar(baseScale);

    // outward "soft" explosion direction
    const dir = new THREE.Vector3(home.x, home.y - 0.5, home.z)
      .normalize()
      .multiplyScalar(rand(1.4, 2.8));
    dir.y += rand(0.4, 1.4);

    const mats = [];
    mesh.traverse((o) => o.material && mats.push(o.material));

    items.push({
      mesh,
      mats,
      home,
      homeRot,
      baseScale,
      dir,
      spin: new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)),
      phase: Math.random() * 0.32,
      float: Math.random() * Math.PI * 2,
    });
    scene.add(mesh);
  });

  // particle stream sucked into the laptop
  const COUNT = 360;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(COUNT * 3);
  const pStart = [];
  for (let i = 0; i < COUNT; i++) {
    const a = rand(0, Math.PI * 2);
    const r = rand(0.5, 3);
    const s = new THREE.Vector3(Math.cos(a) * r, rand(0, 2.6), Math.sin(a) * r * 0.8 + 0.3);
    pStart.push({ s, off: Math.random(), speed: rand(0.6, 1.4) });
    pPos.set([s.x, s.y, s.z], i * 3);
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0x8fd0ff,
    size: 0.05,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  /* ---------- per-frame update ---------- */
  let progress = 0;
  const tmp = new THREE.Vector3();
  const clock = new THREE.Clock();

  function update() {
    const t = clock.getElapsedTime();
    const p = progress;

    items.forEach((it) => {
      const te = clamp((p - it.phase * 0.4) / 0.45); // disassemble
      const ta = clamp((p - 0.42 - it.phase * 0.28) / 0.45); // absorb
      const eTe = easeOutCubic(te);
      const eTa = easeInCubic(ta);

      // exploded (floated-apart) position with gentle idle bob
      tmp.copy(it.home).addScaledVector(it.dir, eTe);
      tmp.y += Math.sin(t * 0.8 + it.float) * 0.08 * (1 - ta);

      // pull toward the laptop intake
      it.mesh.position.set(
        lerp(tmp.x, intake.x, eTa),
        lerp(tmp.y, intake.y, eTa),
        lerp(tmp.z, intake.z, eTa)
      );

      const swirl = eTe * 1.4 + eTa * 6;
      it.mesh.rotation.set(
        it.homeRot.x + it.spin.x * swirl,
        it.homeRot.y + it.spin.y * swirl,
        it.homeRot.z + it.spin.z * swirl
      );

      it.mesh.scale.setScalar(it.baseScale * (1 - 0.95 * easeInOut(ta)));
      const op = 1 - smoothstep(0.55, 1, ta);
      it.mats.forEach((m) => (m.opacity = op));
    });

    // laptop: lid opens, screen wakes up
    const open = smoothstep(0.05, 0.55, p);
    laptop.lid.rotation.x = lerp(-1.45, -0.32, easeInOut(open)); // closed -> reclined open
    const wake = smoothstep(0.4, 0.85, p);
    const pulse = 0.85 + Math.sin(t * 2.2) * 0.15 * wake;
    laptop.display.material.opacity = wake;
    screenLight.intensity = wake * 2.4 * pulse;

    // particles flow in during the absorb phase
    const flow = smoothstep(0.35, 0.75, p);
    pMat.opacity = flow * 0.9;
    const arr = pGeo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      const d = pStart[i];
      let f = (t * 0.18 * d.speed + d.off) % 1; // travel param 0..1 looping
      const ef = easeInCubic(f);
      arr[i * 3] = lerp(d.s.x, intake.x, ef);
      arr[i * 3 + 1] = lerp(d.s.y, intake.y, ef);
      arr[i * 3 + 2] = lerp(d.s.z, intake.z, ef);
    }
    pGeo.attributes.position.needsUpdate = true;

    // camera: gentle dolly-in + slow drift to focus on the laptop
    const cz = lerp(9, 6.3, easeInOut(p));
    const cy = lerp(1.4, 1.0, p);
    camera.position.set(0.2 + Math.sin(t * 0.15) * 0.15, cy, cz);
    camera.lookAt(0, lerp(0.6, 0.5, p), -0.2);

    renderer.render(scene, camera);
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
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
