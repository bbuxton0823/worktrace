// ChoreCam landing: WebGL2 particle stage that morphs between four forms
// (hand skeleton, data stream, globe, lattice) driven by scroll, plus the
// page's reveal, counter, cursor, and magnetic-button choreography.
// WebGL2 is the baseline; everything degrades to a static gradient.

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE = matchMedia('(pointer: coarse)').matches;

// ---------------------------------------------------------------- particles

const HAND_SHAPE = [
  [0, 0], [-0.28, 0.18], [-0.44, 0.36], [-0.54, 0.52], [-0.62, 0.66],
  [-0.17, 0.62], [-0.19, 0.88], [-0.20, 1.06], [-0.21, 1.22],
  [0, 0.66], [0, 0.94], [0, 1.14], [0, 1.30],
  [0.16, 0.62], [0.18, 0.88], [0.19, 1.06], [0.20, 1.20],
  [0.31, 0.54], [0.36, 0.74], [0.39, 0.88], [0.41, 1.00],
];
const CONN = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.85;

function buildTargets(count) {
  const hand = new Float32Array(count * 3);
  const stream = new Float32Array(count * 3);
  const globe = new Float32Array(count * 3);
  const lattice = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);

  // precompute bone segments in centered space, weighted by length
  const bones = CONN.map(([a, b]) => {
    const p = HAND_SHAPE[a], q = HAND_SHAPE[b];
    return { p, q, len: Math.hypot(q[0] - p[0], q[1] - p[1]) };
  });
  const totalLen = bones.reduce((s, b) => s + b.len, 0);

  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const ambient = Math.random() < 0.10;

    // hand: points scattered along bones
    if (ambient) {
      const r = 1.9 + Math.random() * 1.1;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      hand[i * 3] = r * Math.sin(ph) * Math.cos(th) + 0.55;
      hand[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      hand[i * 3 + 2] = r * Math.cos(ph) * 0.6;
    } else {
      let pick = Math.random() * totalLen;
      let bone = bones[0];
      for (const b of bones) { if (pick < b.len) { bone = b; break; } pick -= b.len; }
      const t = Math.random();
      const x = bone.p[0] + (bone.q[0] - bone.p[0]) * t;
      const y = bone.p[1] + (bone.q[1] - bone.p[1]) * t;
      hand[i * 3] = (x + 0.08) * 1.7 + 0.55 + gauss() * 0.045;
      hand[i * 3 + 1] = (y - 0.62) * 1.7 + gauss() * 0.045;
      hand[i * 3 + 2] = gauss() * 0.07;
    }

    // stream: three flowing lanes (labeled episode timelines)
    const lane = i % 3;
    stream[i * 3] = Math.random() * 3.2 - 1.6;
    stream[i * 3 + 1] = 0.52 - lane * 0.52 + gauss() * 0.045;
    stream[i * 3 + 2] = gauss() * 0.08;

    // globe: fibonacci sphere
    const gy = 1 - (i / (count - 1)) * 2;
    const gr = Math.sqrt(Math.max(0, 1 - gy * gy));
    const ga = golden * i;
    globe[i * 3] = Math.cos(ga) * gr * 1.05 + 0.5;
    globe[i * 3 + 1] = gy * 1.05;
    globe[i * 3 + 2] = Math.sin(ga) * gr * 1.05;

    // lattice: snapped 3D grid
    lattice[i * 3] = (Math.floor(Math.random() * 13) - 6) * 0.24 + 0.45 + gauss() * 0.012;
    lattice[i * 3 + 1] = (Math.floor(Math.random() * 8) - 3.5) * 0.24 + gauss() * 0.012;
    lattice[i * 3 + 2] = (Math.floor(Math.random() * 6) - 2.5) * 0.24 + gauss() * 0.012;

    seed[i * 4] = Math.random();
    seed[i * 4 + 1] = 0.4 + Math.random() * 0.9;
    seed[i * 4 + 2] = ambient ? 0.25 + Math.random() * 0.3 : 0.45 + Math.random() * 0.55;
    seed[i * 4 + 3] = lane === 0 ? Math.random() * 0.35 : lane === 1 ? 0.65 + Math.random() * 0.35 : Math.random();
  }
  return { hand, stream, globe, lattice, seed };
}

// ---------------------------------------------------------------- webgl

const VERT = `#version 300 es
precision highp float;
in vec3 aHand; in vec3 aStream; in vec3 aGlobe; in vec3 aLattice; in vec4 aSeed;
uniform float uScene, uTime, uDpr, uMotion, uAspect;
uniform vec2 uPointer;
out float vMix; out float vFade;
void main() {
  float w0 = max(0.0, 1.0 - abs(uScene - 0.0));
  float w1 = max(0.0, 1.0 - abs(uScene - 1.0));
  float w2 = max(0.0, 1.0 - abs(uScene - 2.0));
  float w3 = max(0.0, 1.0 - abs(uScene - 3.0));
  float tot = w0 + w1 + w2 + w3 + 1e-5;

  vec3 s = aStream;
  s.x = mod(s.x + uTime * 0.22 * aSeed.y + 1.6, 3.2) - 1.1;

  float ga = uTime * 0.1;
  vec3 g = aGlobe;
  g = vec3(g.x * cos(ga) + g.z * sin(ga), g.y, -g.x * sin(ga) + g.z * cos(ga));

  vec3 pos = (aHand * w0 + s * w1 + g * w2 + aLattice * w3) / tot;

  pos += uMotion * 0.03 * (0.4 + 0.6 * aSeed.z) * vec3(
    sin(uTime * 0.9 * aSeed.y + aSeed.x * 40.0),
    cos(uTime * 1.1 * aSeed.y + aSeed.x * 30.0),
    sin(uTime * 0.7 * aSeed.y + aSeed.x * 20.0));

  pos *= mix(0.78, 1.0, smoothstep(0.85, 1.5, uAspect));

  float ry = uScene * 0.5 + uPointer.x * 0.16;
  float rx = -uPointer.y * 0.1;
  pos = vec3(pos.x * cos(ry) + pos.z * sin(ry), pos.y, -pos.x * sin(ry) + pos.z * cos(ry));
  pos = vec3(pos.x, pos.y * cos(rx) - pos.z * sin(rx), pos.y * sin(rx) + pos.z * cos(rx));

  float viewZ = 3.1 - pos.z;
  float f = 2.2;
  gl_Position = vec4(pos.x * f / uAspect, pos.y * f, 0.0, viewZ);

  vec2 ndc = gl_Position.xy / viewZ;
  vec2 d = ndc - uPointer;
  float force = uMotion * 0.09 * smoothstep(0.5, 0.0, length(d));
  gl_Position.xy += normalize(d + vec2(1e-4)) * force * viewZ;

  gl_PointSize = uDpr * (1.6 + 4.0 * aSeed.z) * (3.1 / viewZ);
  vMix = aSeed.w;
  // recede to a ghost where the text column lives (left of center)
  float zone = smoothstep(-0.78, 0.12, gl_Position.x / gl_Position.w);
  vFade = (0.16 + 0.42 * aSeed.z) * mix(0.18, 1.0, zone);
}`;

const FRAG = `#version 300 es
precision mediump float;
in float vMix; in float vFade;
uniform vec3 uColA, uColB;
out vec4 o;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float a = exp(-dot(p, p) * 4.0) * vFade;
  // low ceiling keeps additive stacking saturated mint-violet, never
  // white, so the field reads as a distinct layer behind white type
  o = vec4(mix(uColA, uColB, vMix) * a * 0.26, a * 0.26);
}`;

function initGL() {
  const canvas = document.getElementById('gl');
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, powerPreference: 'high-performance' });
  if (!gl) { document.body.classList.add('no-gl'); return null; }

  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { document.body.classList.add('no-gl'); return null; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    document.body.classList.add('no-gl');
    return null;
  }
  gl.useProgram(prog);

  const COUNT = COARSE ? 16000 : 40000;
  const t = buildTargets(COUNT);
  const attr = (name, data, size) => {
    const loc = gl.getAttribLocation(prog, name);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  };
  attr('aHand', t.hand, 3);
  attr('aStream', t.stream, 3);
  attr('aGlobe', t.globe, 3);
  attr('aLattice', t.lattice, 3);
  attr('aSeed', t.seed, 4);

  const U = n => gl.getUniformLocation(prog, n);
  gl.uniform3f(U('uColA'), 0.30, 0.92, 0.74);
  gl.uniform3f(U('uColB'), 0.72, 0.55, 0.94);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.disable(gl.DEPTH_TEST);

  const dpr = Math.min(devicePixelRatio || 1, 2);
  const resize = () => {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(U('uAspect'), innerWidth / innerHeight);
    gl.uniform1f(U('uDpr'), dpr);
  };
  addEventListener('resize', resize);
  resize();

  return {
    draw(scene, time, pointer, motion) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U('uScene'), scene);
      gl.uniform1f(U('uTime'), time);
      gl.uniform1f(U('uMotion'), motion);
      gl.uniform2f(U('uPointer'), pointer.x, pointer.y);
      gl.drawArrays(gl.POINTS, 0, COUNT);
    },
  };
}

// ---------------------------------------------------------------- choreography

const stage = initGL();
const sections = [...document.querySelectorAll('[data-scene]')];
const scenes = sections.map(s => parseFloat(s.dataset.scene));

const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
let sceneNow = 0, sceneTarget = 0;
let running = true;

let centers = [];
function measure() {
  centers = sections.map(s => s.offsetTop + s.offsetHeight / 2);
}
measure();
addEventListener('resize', measure, { passive: true });
addEventListener('load', measure);

// Each chapter rests on its pure form; the morph happens between section
// centers, with a hold plateau so shapes stay legible while reading.
function sceneFromScroll() {
  const mid = scrollY + innerHeight * 0.5;
  if (!centers.length || mid <= centers[0]) return scenes[0];
  for (let i = 0; i < centers.length - 1; i++) {
    if (mid < centers[i + 1]) {
      const t = (mid - centers[i]) / (centers[i + 1] - centers[i]);
      const e = Math.min(1, Math.max(0, (t - 0.22) / 0.56));
      const s = e * e * (3 - 2 * e);
      return scenes[i] + (scenes[i + 1] - scenes[i]) * s;
    }
  }
  return scenes[scenes.length - 1];
}

addEventListener('pointermove', e => {
  pointer.tx = (e.clientX / innerWidth) * 2 - 1;
  pointer.ty = -((e.clientY / innerHeight) * 2 - 1);
  const c = document.getElementById('cursor');
  if (c) {
    c.querySelector('.dot').style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    c.querySelector('.ring').style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  }
}, { passive: true });

document.addEventListener('visibilitychange', () => { running = !document.hidden; });

if (stage) {
  if (REDUCED) {
    const still = () => stage.draw(sceneFromScroll(), 1.2, { x: 0, y: 0 }, 0);
    still();
    addEventListener('scroll', still, { passive: true });
    addEventListener('resize', still, { passive: true });
  } else {
    const tick = now => {
      requestAnimationFrame(tick);
      if (!running) return;
      sceneTarget = sceneFromScroll();
      sceneNow += (sceneTarget - sceneNow) * 0.06;
      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;
      stage.draw(sceneNow, now * 0.001, pointer, 1);
    };
    requestAnimationFrame(tick);
  }
}

// reveals
const io = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('inview'); io.unobserve(e.target); }
}, { threshold: 0.25 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// count-up figures
const fmt = n => n >= 1000 ? n.toLocaleString('en-US') : String(n);
const cio = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    cio.unobserve(e.target);
    const el = e.target;
    const to = parseFloat(el.dataset.to);
    const pre = el.dataset.prefix || '';
    const suf = el.dataset.suffix || '';
    if (REDUCED) { el.textContent = pre + fmt(to) + suf; continue; }
    const t0 = performance.now();
    const dur = 1400;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(Math.round(to * ease)) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

// magnetic buttons + cursor hover state
if (!COARSE && !REDUCED) {
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      btn.style.translate = `${dx * 0.18}px ${dy * 0.3}px`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.translate = '0 0'; });
  });
  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover'));
  });
}
