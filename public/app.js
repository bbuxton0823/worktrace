// WorkTrace prototype: egocentric hand-task capture, labeling, and export.
// All processing is local to the browser. Hand tracking uses MediaPipe Tasks
// (loaded from CDN at runtime); the synthetic demo works fully offline.

const TRANSITION_TASK = { id: 'transition', label: 'Transition / idle', color: '#8b95a7' };

const VERTICALS = {
  cleaning: {
    label: 'House cleaning',
    demoHint: 'Synthetic cleaning episode generated: wipe, fold, pick and place. Scrub or play it back, then export.',
    tasks: [
      { id: 'wipe_surface', label: 'Wipe surface', color: '#63b3e6' },
      { id: 'wash_dishes', label: 'Wash dishes', color: '#7fd0aa' },
      { id: 'fold_laundry', label: 'Fold laundry', color: '#e6b063' },
      { id: 'sweep_floor', label: 'Sweep floor', color: '#c79ae6' },
      { id: 'pick_place', label: 'Pick and place', color: '#e67d97' },
    ],
    demoScript: [
      { label: 'wipe_surface', motion: 'orbit' },
      { label: 'fold_laundry', motion: 'bimanual' },
      { label: 'pick_place', motion: 'arc' },
    ],
  },
  staging: {
    label: 'Home staging',
    demoHint: 'Synthetic staging episode generated: arrange decor, assemble furniture, two-hand carry. Scrub or play it back, then export.',
    tasks: [
      { id: 'carry_furniture', label: 'Carry furniture', color: '#e6b063' },
      { id: 'place_furniture', label: 'Place furniture', color: '#63b3e6' },
      { id: 'assemble_furniture', label: 'Assemble furniture', color: '#7fd0aa' },
      { id: 'arrange_decor', label: 'Arrange decor', color: '#c79ae6' },
      { id: 'hang_art', label: 'Hang art', color: '#e67d97' },
      { id: 'dress_bed', label: 'Dress bed', color: '#6fc3d9' },
      { id: 'style_shelf', label: 'Style shelf', color: '#d9c96f' },
    ],
    demoScript: [
      { label: 'arrange_decor', motion: 'orbit' },
      { label: 'assemble_furniture', motion: 'bimanual' },
      { label: 'carry_furniture', motion: 'carry' },
    ],
  },
};

const ALL_TASKS = [...Object.values(VERTICALS).flatMap(v => v.tasks), TRANSITION_TASK];
const TASK_BY_ID = Object.fromEntries(ALL_TASKS.map(t => [t.id, t]));

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

// Stylized right-hand landmark offsets in hand space (x right, y up, wrist at origin).
const HAND_SHAPE = [
  [0.00, 0.00],
  [-0.28, 0.18], [-0.44, 0.36], [-0.54, 0.52], [-0.62, 0.66],
  [-0.17, 0.62], [-0.19, 0.88], [-0.20, 1.06], [-0.21, 1.22],
  [0.00, 0.66], [0.00, 0.94], [0.00, 1.14], [0.00, 1.30],
  [0.16, 0.62], [0.18, 0.88], [0.19, 1.06], [0.20, 1.20],
  [0.31, 0.54], [0.36, 0.74], [0.39, 0.88], [0.41, 1.00],
];

const W = 960, H = 540;
const $ = id => document.getElementById(id);

const els = {
  video: $('video'), canvas: $('canvas'),
  trackerStatus: $('trackerStatus'), viewportHint: $('viewportHint'),
  btnWebcam: $('btnWebcam'), btnUpload: $('btnUpload'), btnDemo: $('btnDemo'),
  cameraSel: $('cameraSel'), btnFlip: $('btnFlip'),
  fileInput: $('fileInput'),
  btnRecord: $('btnRecord'), btnStop: $('btnStop'),
  recBadge: $('recBadge'), recTime: $('recTime'),
  btnPlay: $('btnPlay'), speedSel: $('speedSel'),
  timeline: $('timeline'), playhead: $('playhead'), scrubber: $('scrubber'),
  timeCursor: $('timeCursor'), timeTotal: $('timeTotal'),
  btnCopy: $('btnCopy'), btnDownload: $('btnDownload'), exportPreview: $('exportPreview'),
  consentWorker: $('consentWorker'), consentHome: $('consentHome'),
  taskChips: $('taskChips'), verticalSel: $('verticalSel'),
  statDuration: $('statDuration'), statFrames: $('statFrames'),
  statVisible: $('statVisible'), statSegments: $('statSegments'),
  taskBreakdown: $('taskBreakdown'),
};
const ctx = els.canvas.getContext('2d');

const state = {
  vertical: 'cleaning',
  flip: false,
  mode: 'idle',            // idle | live | review
  source: null,            // webcam | upload | synthetic-demo
  landmarker: null,
  trackerState: 'idle',    // idle | loading | ready | error
  stream: null,
  recording: false,
  recordStart: 0,
  currentLabel: null,
  openSegmentStart: 0,
  episode: null,           // { source, fps, duration, frames, segments, synthetic }
  playing: false,
  playFrame: 0,
  lastTick: 0,
  liveHands: [],
  rafId: null,
};

// ---------------------------------------------------------------- status

function setTrackerStatus(kind, text) {
  state.trackerState = kind;
  els.trackerStatus.textContent = text;
  els.trackerStatus.className = 'status-pill status-' + ({ idle: 'idle', loading: 'loading', ready: 'ready', error: 'error' }[kind] || 'idle');
}

function setHint(text) { els.viewportHint.textContent = text; }

// ---------------------------------------------------------------- tracker

async function loadTracker() {
  if (state.landmarker || state.trackerState === 'loading') return state.landmarker;
  setTrackerStatus('loading', 'Loading hand tracker…');
  try {
    const mod = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs');
    const vision = await mod.FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );
    state.landmarker = await mod.HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
    });
    setTrackerStatus('ready', 'Hand tracker ready');
    return state.landmarker;
  } catch (err) {
    console.warn('Hand tracker failed to load:', err);
    setTrackerStatus('error', 'Tracker unavailable (demo mode still works)');
    return null;
  }
}

// ---------------------------------------------------------------- consent

function consentOk() { return els.consentWorker.checked && els.consentHome.checked; }

function refreshConsentUI() {
  const ok = consentOk();
  els.btnRecord.disabled = !ok || state.mode !== 'live';
  els.btnWebcam.disabled = !ok;
  els.btnUpload.disabled = !ok;
  if (!ok && state.mode !== 'review') {
    setHint('Real capture is locked until both consent checks pass. The synthetic demo is always available.');
  }
}

// ---------------------------------------------------------------- task chips

function buildChips() {
  els.taskChips.innerHTML = '';
  const tasks = [...VERTICALS[state.vertical].tasks, TRANSITION_TASK];
  for (const t of tasks) {
    const b = document.createElement('button');
    b.className = 'chip';
    b.dataset.task = t.id;
    b.style.setProperty('--chip-color', t.color);
    b.innerHTML = `<span class="dot" style="background:${t.color}"></span>${t.label}`;
    b.disabled = true;
    b.addEventListener('click', () => setCurrentTask(t.id));
    els.taskChips.appendChild(b);
  }
}

function setChipsEnabled(on) {
  els.taskChips.querySelectorAll('.chip').forEach(c => { c.disabled = !on; });
}

function highlightChip(taskId) {
  els.taskChips.querySelectorAll('.chip').forEach(c =>
    c.classList.toggle('active', c.dataset.task === taskId));
}

function setCurrentTask(taskId) {
  if (!state.recording) return;
  const t = nowRecSeconds();
  if (state.currentLabel && state.currentLabel !== taskId) {
    closeOpenSegment(t);
  }
  if (state.currentLabel !== taskId) {
    state.currentLabel = taskId;
    state.openSegmentStart = t;
  }
  highlightChip(taskId);
}

function closeOpenSegment(endT) {
  if (state.currentLabel == null) return;
  const start = state.openSegmentStart;
  if (endT - start > 0.05) {
    state.episode.segments.push({ label: state.currentLabel, start: round2(start), end: round2(endT) });
  }
  state.currentLabel = null;
}

// ---------------------------------------------------------------- live capture

async function startWebcam(deviceId) {
  stopSource();
  const tracker = await loadTracker();
  if (!tracker) { setHint('Hand tracker could not load, so live tracking is unavailable. Try the synthetic demo.'); return; }
  const video = { width: 1280, height: 720 };
  if (deviceId) video.deviceId = { exact: deviceId };
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
  } catch (err) {
    console.warn('Webcam denied:', err);
    setHint('Webcam access was denied or is unavailable in this browser. Try uploading a video or the synthetic demo.');
    return;
  }
  els.video.srcObject = state.stream;
  await els.video.play();
  enterLiveMode('webcam');
  populateCameraSelect();
}

// Once permission is granted, list all cameras (built-in plus any USB/UVC
// camera such as a hat rig) so the user can switch without touching browser
// settings.
async function populateCameraSelect() {
  try {
    const cams = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
    if (cams.length < 2) return;
    els.cameraSel.innerHTML = '';
    for (const c of cams) {
      const opt = document.createElement('option');
      opt.value = c.deviceId;
      opt.textContent = c.label || 'Camera';
      els.cameraSel.appendChild(opt);
    }
    const current = state.stream?.getVideoTracks()[0]?.getSettings().deviceId;
    if (current) els.cameraSel.value = current;
    els.cameraSel.classList.remove('hidden');
  } catch (err) {
    console.warn('Camera enumeration failed:', err);
  }
}

async function startUpload(file) {
  stopSource();
  const tracker = await loadTracker();
  if (!tracker) { setHint('Hand tracker could not load, so video analysis is unavailable. Try the synthetic demo.'); return; }
  els.video.srcObject = null;
  els.video.src = URL.createObjectURL(file);
  els.video.loop = true;
  await els.video.play();
  enterLiveMode('upload');
}

function enterLiveMode(source) {
  state.mode = 'live';
  state.source = source;
  state.playing = false;
  setHint(source === 'webcam'
    ? 'Live webcam with hand tracking. Hit Record, then tap task chips as you work.'
    : 'Analyzing uploaded video. Hit Record to capture landmarks, and tap task chips to label.');
  refreshConsentUI();
  els.btnFlip.classList.remove('hidden');
  startLoop();
}

function stopSource() {
  els.btnFlip.classList.add('hidden');
  if (state.stream) { state.stream.getTracks().forEach(t => t.stop()); state.stream = null; }
  els.video.pause();
  els.video.srcObject = null;
  els.video.removeAttribute('src');
  if (state.recording) stopRecording();
  state.mode = 'idle';
}

function nowRecSeconds() { return (performance.now() - state.recordStart) / 1000; }

function startRecording() {
  if (state.mode !== 'live' || !consentOk()) return;
  state.recording = true;
  state.recordStart = performance.now();
  state.episode = {
    source: state.source, synthetic: false, vertical: state.vertical, fps: null,
    frames: [], segments: [], duration: 0,
    consent: { worker: true, household: true },
  };
  state.currentLabel = 'transition';
  state.openSegmentStart = 0;
  highlightChip('transition');
  setChipsEnabled(true);
  els.recBadge.classList.remove('hidden');
  els.btnRecord.disabled = true;
  els.btnStop.disabled = false;
  setHint('Recording. Tap the chip for the task being performed; switching chips closes the previous segment.');
}

function stopRecording() {
  if (!state.recording) return;
  const t = nowRecSeconds();
  closeOpenSegment(t);
  state.recording = false;
  state.episode.duration = round2(t);
  const n = state.episode.frames.length;
  state.episode.fps = n > 1 ? round2(n / t) : 0;
  els.recBadge.classList.add('hidden');
  els.btnStop.disabled = true;
  setChipsEnabled(false);
  highlightChip(null);
  stopSource();
  enterReviewMode();
}

// ---------------------------------------------------------------- synthetic demo

function synthHand(cx, cy, scale, rot, curl, mirror) {
  const cos = Math.cos(rot), sin = Math.sin(rot);
  const palmX = mirror ? -0.02 : 0.02, palmY = 0.55;
  return HAND_SHAPE.map(([sx, sy], i) => {
    let x = mirror ? -sx : sx, y = sy;
    if (curl > 0 && i >= 5) {
      const joint = (i - 5) % 4;
      const k = curl * (joint / 3) * 0.85;
      x += (palmX - x) * k;
      y += (palmY - y) * k;
    } else if (curl > 0 && i >= 1) {
      const k = curl * ((i - 1) / 3) * 0.5;
      x += ((mirror ? 0.05 : -0.05) - x) * k;
      y += (0.4 - y) * k;
    }
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    return [round4(cx + rx * scale * (H / W)), round4(cy - ry * scale), round4(-0.02 - 0.008 * (i % 5))];
  });
}

function demoHandsAt(motion, t) {
  const jx = 0.006 * Math.sin(t * 11.3) + 0.004 * Math.sin(t * 23.7);
  const jy = 0.006 * Math.cos(t * 9.1) + 0.004 * Math.sin(t * 19.3);
  const hands = [];
  if (motion === 'orbit') {
    const th = (2 * Math.PI * t) / 1.8;
    hands.push({ handedness: 'Right', score: 0.97, landmarks: synthHand(0.58 + 0.15 * Math.cos(th) + jx, 0.55 + 0.09 * Math.sin(th) + jy, 0.26, 0.25 * Math.sin(th), 0.25, false) });
    hands.push({ handedness: 'Left', score: 0.94, landmarks: synthHand(0.2 + jx * 0.5, 0.68 + 0.015 * Math.sin(t * 2.1), 0.22, -0.15, 0.75, true) });
  } else if (motion === 'bimanual') {
    const s = Math.sin((2 * Math.PI * t) / 2.6);
    const lift = 0.06 * Math.max(0, Math.sin((2 * Math.PI * t) / 1.3));
    const curl = 0.2 + 0.45 * Math.max(0, s);
    hands.push({ handedness: 'Right', score: 0.96, landmarks: synthHand(0.63 - 0.09 * s + jx, 0.6 - lift + jy, 0.24, -0.12 - 0.1 * s, curl, false) });
    hands.push({ handedness: 'Left', score: 0.96, landmarks: synthHand(0.37 + 0.09 * s - jx, 0.6 - lift + jy, 0.24, 0.12 + 0.1 * s, curl, true) });
  } else if (motion === 'arc') {
    const p = (t % 2.6) / 2.6;
    const q = p < 0.5 ? p * 2 : (1 - p) * 2;
    const carry = q > 0.15 && q < 0.85 ? 0.6 : 0.12;
    hands.push({ handedness: 'Right', score: 0.98, landmarks: synthHand(0.32 + 0.38 * q + jx, 0.7 - 0.32 * Math.sin(Math.PI * q) + jy, 0.25, (q - 0.5) * 0.7, carry, false) });
  } else if (motion === 'carry') {
    // two-hand furniture carry: hands locked a fixed span apart, swaying with gait
    const sway = 0.045 * Math.sin((2 * Math.PI * t) / 1.4);
    const bob = 0.025 * Math.abs(Math.sin((2 * Math.PI * t) / 0.7));
    const cx = 0.5 + 0.1 * Math.sin((2 * Math.PI * t) / 5.2) + sway;
    const cy = 0.62 + bob + jy;
    hands.push({ handedness: 'Right', score: 0.97, landmarks: synthHand(cx + 0.17, cy, 0.24, -0.35 + sway, 0.8, false) });
    hands.push({ handedness: 'Left', score: 0.97, landmarks: synthHand(cx - 0.17, cy, 0.24, 0.35 + sway, 0.8, true) });
  }
  return hands;
}

function generateSyntheticEpisode() {
  stopSource();
  const fps = 30, segLen = 4;
  const vertical = VERTICALS[state.vertical];
  const script = vertical.demoScript;
  const duration = segLen * script.length;
  const frames = [];
  const segments = script.map((s, i) => ({ label: s.label, start: i * segLen, end: (i + 1) * segLen }));
  for (let f = 0; f < fps * duration; f++) {
    const t = f / fps;
    const si = Math.min(Math.floor(t / segLen), script.length - 1);
    const inSeg = t - si * segLen;
    // brief hands-out-of-frame gap at each segment boundary, like a real transition
    const hands = (si > 0 && inSeg < 0.35) ? [] : demoHandsAt(script[si].motion, t);
    frames.push({ t: round4(t), hands });
  }
  state.episode = {
    source: 'synthetic-demo', synthetic: true, vertical: state.vertical, fps, duration, frames, segments,
    consent: { synthetic_data_no_humans_recorded: true },
  };
  setHint(vertical.demoHint);
  enterReviewMode(true);
}

// ---------------------------------------------------------------- review / playback

function enterReviewMode(autoplay = false) {
  state.mode = 'review';
  state.playFrame = 0;
  state.playing = false;
  const ep = state.episode;
  if (!ep || ep.frames.length === 0) { setHint('No frames were captured in that episode.'); return; }
  els.scrubber.disabled = false;
  els.scrubber.max = String(ep.frames.length - 1);
  els.scrubber.value = '0';
  els.btnPlay.disabled = false;
  els.playhead.classList.remove('hidden');
  els.timeTotal.textContent = fmtTime(ep.duration);
  renderTimeline();
  renderStats();
  renderExport();
  drawReviewFrame(0);
  startLoop();
  if (autoplay) togglePlay(true);
}

function togglePlay(force) {
  if (state.mode !== 'review') return;
  state.playing = force != null ? force : !state.playing;
  if (state.playing && state.playFrame >= state.episode.frames.length - 1) state.playFrame = 0;
  state.lastTick = performance.now();
  els.btnPlay.innerHTML = state.playing ? '&#10074;&#10074; Pause' : '&#9654; Play';
}

function seekFrame(f) {
  state.playFrame = Math.max(0, Math.min(f, state.episode.frames.length - 1));
  drawReviewFrame(state.playFrame);
}

// ---------------------------------------------------------------- render loop

function startLoop() {
  if (state.rafId) cancelAnimationFrame(state.rafId);
  const tick = () => {
    state.rafId = requestAnimationFrame(tick);
    if (state.mode === 'live') liveTick();
    else if (state.mode === 'review') reviewTick();
  };
  state.rafId = requestAnimationFrame(tick);
}

// Offscreen canvas used when the camera is mounted upside down: both the
// display and the hand detector read the rotated frame, so landmarks always
// match what is drawn.
const work = document.createElement('canvas');
work.width = W; work.height = H;
const wctx = work.getContext('2d');

function liveTick() {
  const v = els.video;
  if (v.readyState < 2 || v.videoWidth === 0) return;
  let src = v;
  if (state.flip) {
    wctx.save();
    wctx.translate(W, H);
    wctx.rotate(Math.PI);
    wctx.drawImage(v, 0, 0, W, H);
    wctx.restore();
    src = work;
  }
  ctx.drawImage(src, 0, 0, W, H);
  let hands = [];
  if (state.landmarker) {
    try {
      const res = state.landmarker.detectForVideo(src, performance.now());
      hands = (res.landmarks || []).map((lm, i) => ({
        handedness: res.handednesses?.[i]?.[0]?.categoryName || 'Unknown',
        score: round2(res.handednesses?.[i]?.[0]?.score ?? 0),
        landmarks: lm.map(p => [round4(p.x), round4(p.y), round4(p.z)]),
      }));
    } catch (err) { /* keep drawing video even if a detect call hiccups */ }
  }
  for (const h of hands) drawHand(h, false);
  state.liveHands = hands;
  if (state.recording) {
    const t = nowRecSeconds();
    state.episode.frames.push({ t: round4(t), hands });
    els.recTime.textContent = fmtClock(t);
  }
}

function reviewTick() {
  if (!state.playing || !state.episode) return;
  const now = performance.now();
  const dt = (now - state.lastTick) / 1000;
  state.lastTick = now;
  const speed = Number(els.speedSel.value);
  state.playFrame += dt * state.episode.fps * speed;
  if (state.playFrame >= state.episode.frames.length - 1) {
    state.playFrame = state.episode.frames.length - 1;
    togglePlay(false);
  }
  drawReviewFrame(Math.floor(state.playFrame));
}

// ---------------------------------------------------------------- drawing

function drawBackdrop() {
  ctx.fillStyle = '#12151c';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

function drawHand(hand, fadeJoints) {
  const pts = hand.landmarks.map(([x, y]) => [x * W, y * H]);
  const color = hand.handedness === 'Left' ? '#b48ce6' : '#5ee6c0';
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.beginPath();
    ctx.moveTo(pts[a][0], pts[a][1]);
    ctx.lineTo(pts[b][0], pts[b][1]);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = fadeJoints ? color + 'aa' : color;
  for (let i = 0; i < pts.length; i++) {
    ctx.beginPath();
    ctx.arc(pts[i][0], pts[i][1], i === 0 ? 6 : 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawReviewFrame(f) {
  const ep = state.episode;
  if (!ep) return;
  const frame = ep.frames[f];
  drawBackdrop();
  for (const h of frame.hands) drawHand(h, true);

  const seg = ep.segments.find(s => frame.t >= s.start && frame.t < s.end);
  const task = seg ? TASK_BY_ID[seg.label] : null;
  if (task) {
    ctx.font = '600 16px Inter, sans-serif';
    const label = task.label;
    const w = ctx.measureText(label).width + 34;
    ctx.fillStyle = 'rgba(18,21,28,0.85)';
    roundRect(ctx, 14, 14, w, 32, 8); ctx.fill();
    ctx.fillStyle = task.color;
    ctx.beginPath(); ctx.arc(30, 30, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8ebf2';
    ctx.fillText(label, 42, 35);
  }
  if (frame.hands.length === 0) {
    ctx.fillStyle = 'rgba(232,235,242,0.35)';
    ctx.font = '500 14px Inter, sans-serif';
    ctx.fillText('hands out of frame', W / 2 - 60, H / 2);
  }
  if (ep.synthetic) {
    ctx.fillStyle = 'rgba(232,235,242,0.28)';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText('SYNTHETIC DEMO DATA', W - 205, H - 18);
  }
  ctx.fillStyle = 'rgba(232,235,242,0.6)';
  ctx.font = '500 13px "JetBrains Mono", monospace';
  ctx.fillText(fmtTime(frame.t), W - 205, 30);

  els.scrubber.value = String(f);
  els.timeCursor.textContent = fmtTime(frame.t);
  const frac = ep.duration > 0 ? frame.t / ep.duration : 0;
  els.playhead.style.left = (frac * 100) + '%';
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawIdle() {
  drawBackdrop();
  ctx.fillStyle = 'rgba(232,235,242,0.5)';
  ctx.font = '500 17px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Choose a source to begin', W / 2, H / 2 - 12);
  ctx.font = '400 14px Inter, sans-serif';
  ctx.fillStyle = 'rgba(232,235,242,0.32)';
  ctx.fillText('Webcam, uploaded video, or the synthetic demo episode', W / 2, H / 2 + 14);
  ctx.textAlign = 'left';
}

// ---------------------------------------------------------------- timeline / stats

function renderTimeline() {
  els.timeline.querySelectorAll('.segment').forEach(n => n.remove());
  const ep = state.episode;
  if (!ep || ep.duration === 0) return;
  for (const seg of ep.segments) {
    const task = TASK_BY_ID[seg.label];
    const d = document.createElement('div');
    d.className = 'segment';
    d.style.left = (seg.start / ep.duration * 100) + '%';
    d.style.width = ((seg.end - seg.start) / ep.duration * 100) + '%';
    d.style.background = task ? task.color : '#8b95a7';
    d.title = `${task ? task.label : seg.label}: ${fmtTime(seg.start)} to ${fmtTime(seg.end)}`;
    d.textContent = task ? task.label : seg.label;
    d.addEventListener('click', () => {
      seekFrame(Math.floor(seg.start * ep.fps));
      togglePlay(false);
    });
    els.timeline.appendChild(d);
  }
}

function renderStats() {
  const ep = state.episode;
  if (!ep) return;
  const visible = ep.frames.filter(f => f.hands.length > 0).length;
  els.statDuration.textContent = fmtTime(ep.duration);
  els.statFrames.textContent = `${ep.frames.length} @ ${ep.fps} fps`;
  els.statVisible.textContent = ep.frames.length ? Math.round(100 * visible / ep.frames.length) + '%' : '0%';
  els.statSegments.textContent = String(ep.segments.length);

  els.taskBreakdown.innerHTML = '';
  const perTask = {};
  for (const s of ep.segments) perTask[s.label] = (perTask[s.label] || 0) + (s.end - s.start);
  const maxT = Math.max(...Object.values(perTask), 0.001);
  for (const [label, secs] of Object.entries(perTask)) {
    const task = TASK_BY_ID[label];
    const line = document.createElement('div');
    line.className = 'task-line';
    line.innerHTML = `
      <span class="dot" style="background:${task ? task.color : '#8b95a7'}"></span>
      <span class="task-name">${task ? task.label : label}</span>
      <span class="bar" style="width:${Math.round(56 * secs / maxT)}px;background:${task ? task.color : '#8b95a7'}"></span>
      <span class="task-time">${secs.toFixed(1)}s</span>`;
    els.taskBreakdown.appendChild(line);
  }
}

// ---------------------------------------------------------------- export

function buildManifest(truncate) {
  const ep = state.episode;
  const visible = ep.frames.filter(f => f.hands.length > 0).length;
  const manifest = {
    schema: 'worktrace-episode-v0.1',
    episode_id: 'ep_' + Date.now().toString(36),
    recorded_at: new Date().toISOString(),
    task_vertical: ep.vertical || 'cleaning',
    device: { source: ep.source, resolution: [W, H], fps: ep.fps, camera_mount: 'head, hands-down view' },
    consent: ep.consent,
    stats: {
      duration_s: ep.duration,
      frame_count: ep.frames.length,
      hands_visible_pct: ep.frames.length ? Math.round(100 * visible / ep.frames.length) : 0,
    },
    segments: ep.segments.map(s => ({ label: s.label, start_s: s.start, end_s: s.end })),
    landmark_format: '21 MediaPipe hand landmarks per hand, [x, y, z] normalized to frame',
    frames: truncate ? ep.frames.slice(0, 2) : ep.frames,
  };
  if (truncate) manifest.preview_note = `frames truncated to 2 of ${ep.frames.length}; the download contains all frames`;
  return manifest;
}

function renderExport() {
  if (!state.episode) return;
  els.exportPreview.textContent = JSON.stringify(buildManifest(true), null, 2);
  els.btnCopy.disabled = false;
  els.btnDownload.disabled = false;
}

function downloadEpisode() {
  const blob = new Blob([JSON.stringify(buildManifest(false))], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'worktrace_' + Date.now().toString(36) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function copyEpisode() {
  const text = JSON.stringify(buildManifest(false));
  try {
    await navigator.clipboard.writeText(text);
    els.btnCopy.textContent = 'Copied!';
  } catch {
    els.btnCopy.textContent = 'Copy failed';
  }
  setTimeout(() => { els.btnCopy.textContent = 'Copy JSON'; }, 1500);
}

// ---------------------------------------------------------------- utils

function round2(n) { return Math.round(n * 100) / 100; }
function round4(n) { return Math.round(n * 10000) / 10000; }
function fmtTime(s) {
  const m = Math.floor(s / 60), sec = s - m * 60;
  return String(m).padStart(2, '0') + ':' + sec.toFixed(1).padStart(4, '0');
}
function fmtClock(s) {
  const m = Math.floor(s / 60), sec = Math.floor(s - m * 60);
  return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

// ---------------------------------------------------------------- wire up

buildChips();
drawIdle();
refreshConsentUI();

els.verticalSel.addEventListener('change', e => {
  if (state.recording) { e.target.value = state.vertical; return; }
  state.vertical = e.target.value;
  buildChips();
  setChipsEnabled(false);
});
els.consentWorker.addEventListener('change', refreshConsentUI);
els.consentHome.addEventListener('change', refreshConsentUI);
els.btnWebcam.addEventListener('click', () => startWebcam());
els.cameraSel.addEventListener('change', e => {
  if (state.mode === 'live' && state.source === 'webcam') startWebcam(e.target.value);
});
els.btnFlip.addEventListener('click', () => {
  state.flip = !state.flip;
  els.btnFlip.classList.toggle('btn-accent', state.flip);
});
els.btnUpload.addEventListener('click', () => els.fileInput.click());
els.fileInput.addEventListener('change', e => { if (e.target.files[0]) startUpload(e.target.files[0]); });
els.btnDemo.addEventListener('click', generateSyntheticEpisode);
els.btnRecord.addEventListener('click', startRecording);
els.btnStop.addEventListener('click', stopRecording);
els.btnPlay.addEventListener('click', () => togglePlay());
els.scrubber.addEventListener('input', e => { togglePlay(false); seekFrame(Number(e.target.value)); });
els.btnCopy.addEventListener('click', copyEpisode);
els.btnDownload.addEventListener('click', downloadEpisode);

// Preload the tracker in the background so webcam start feels instant.
loadTracker();
