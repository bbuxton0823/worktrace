"use client";

import { useEffect, useRef } from "react";

const vertexSource = `#version 300 es
precision highp float;
out vec2 vUv;

void main() {
  vec2 point = vec2(
    gl_VertexID == 1 ? 3.0 : -1.0,
    gl_VertexID == 2 ? 3.0 : -1.0
  );
  vUv = point * 0.5 + 0.5;
  gl_Position = vec4(point, 0.0, 1.0);
}`;

const fragmentSource = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uScroll;
uniform float uMotion;

#define PI 3.14159265359

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + 1.0), f.x), f.y);
}

float segment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
  return length(pa - ba * h);
}

float ring(vec2 p, vec2 center, float radius, float width) {
  return 1.0 - smoothstep(width, width + 0.0025, abs(length(p - center) - radius));
}

float tracePath(vec2 p, float seed, float offset, float time) {
  float line = 10.0;
  vec2 previous = vec2(-0.12, offset);
  for (int i = 1; i < 15; i++) {
    float step = float(i) / 14.0;
    float bend = sin(step * 8.0 + seed) * 0.035;
    bend += sin(step * 19.0 - seed * 1.7 + time * 0.34) * 0.009;
    vec2 current = vec2(step * 1.16 - 0.08, offset + bend + step * (0.49 - offset));
    line = min(line, segment(p, previous, current));
    previous = current;
  }
  return line;
}

void main() {
  vec2 uv = vUv;
  vec2 p = uv - 0.5;
  p.x *= uResolution.x / max(uResolution.y, 1.0);

  float t = mod(uTime, 60.0) * uMotion;
  float scrollPhase = clamp(uScroll, 0.0, 1.0);
  vec2 pointer = uPointer - 0.5;
  pointer.x *= uResolution.x / max(uResolution.y, 1.0);
  float pointerField = exp(-9.0 * dot(p - pointer, p - pointer));
  p += vec2(sin(t * 0.35), cos(t * 0.29)) * pointerField * 0.012;

  vec3 ink = vec3(0.018, 0.026, 0.023);
  vec3 field = vec3(0.035, 0.063, 0.052);
  vec3 lime = vec3(0.60, 0.98, 0.26);
  vec3 clay = vec3(1.0, 0.31, 0.17);
  vec3 sky = vec3(0.24, 0.66, 1.0);
  vec3 violet = vec3(0.56, 0.34, 1.0);

  float vignette = smoothstep(0.96, 0.18, length(p * vec2(0.74, 1.0)));
  vec3 color = mix(ink, field, 0.32 * vignette);

  vec2 gridUv = p;
  gridUv.y += p.x * 0.12;
  vec2 grid = abs(fract(gridUv * vec2(18.0, 11.0)) - 0.5) / fwidth(gridUv * vec2(18.0, 11.0));
  float gridLine = 1.0 - min(min(grid.x, grid.y), 1.0);
  float gridFade = smoothstep(0.92, 0.08, length(p)) * (0.15 + scrollPhase * 0.16);
  color += vec3(0.24, 0.40, 0.31) * gridLine * gridFade * 0.18;

  float rawA = tracePath(p, 0.8, -0.32, t);
  float rawB = tracePath(p, 3.2, -0.20, -t * 0.8);
  float reveal = smoothstep(-0.2, 0.9, uv.x + scrollPhase * 0.22);
  float glowA = exp(-rawA * 90.0) * reveal;
  float coreA = 1.0 - smoothstep(0.003, 0.011, rawA);
  float glowB = exp(-rawB * 94.0) * reveal;
  float coreB = 1.0 - smoothstep(0.003, 0.010, rawB);
  color += clay * (glowA * 0.22 + coreA * 0.64) * (1.0 - uv.x * 0.42);
  color += sky * (glowB * 0.18 + coreB * 0.52) * (1.0 - uv.x * 0.38);

  float compileMask = smoothstep(0.44, 0.72, uv.x + 0.04 * sin(uv.y * 17.0 + t * 0.25));
  vec2 cell = floor(uv * vec2(28.0, 17.0)) / vec2(28.0, 17.0) + 0.5 / vec2(28.0, 17.0);
  vec2 cellP = cell - 0.5;
  cellP.x *= uResolution.x / max(uResolution.y, 1.0);
  float semantic = min(tracePath(cellP, 0.8, -0.32, t), tracePath(cellP, 3.2, -0.20, -t * 0.8));
  float semanticEnergy = exp(-semantic * 80.0) * compileMask;
  float node = 1.0 - smoothstep(0.010, 0.018, length((uv - cell) * vec2(uResolution.x / uResolution.y, 1.0)));
  color += lime * semanticEnergy * node * (0.45 + 0.45 * sin(t * 1.4 + cell.x * 30.0));

  vec2 anchors[6];
  anchors[0] = vec2(-0.43, -0.24);
  anchors[1] = vec2(-0.20, -0.11);
  anchors[2] = vec2(0.02, 0.01);
  anchors[3] = vec2(0.24, 0.13);
  anchors[4] = vec2(0.45, 0.25);
  anchors[5] = vec2(0.68, 0.38);
  for (int i = 0; i < 6; i++) {
    vec2 anchor = anchors[i];
    float pulse = 0.016 + 0.004 * sin(t * 1.25 - float(i) * 0.7);
    float halo = ring(p, anchor, 0.024 + pulse, 0.006);
    float dotCore = 1.0 - smoothstep(0.006, 0.012, length(p - anchor));
    vec3 anchorColor = i == 2 ? violet : lime;
    color += anchorColor * (halo * 0.28 + dotCore * 0.75) * reveal;
  }

  float scan = exp(-abs(fract(uv.y * 1.7 - t * 0.045 - scrollPhase * 0.7) - 0.5) * 75.0);
  color += lime * scan * vignette * 0.035 * uMotion;
  float grain = hash21(gl_FragCoord.xy + floor(t * 24.0)) - 0.5;
  color += grain * 0.012;
  color *= 0.76 + vignette * 0.32;

  outColor = vec4(color, 0.82);
}`;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function ShaderField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    let gl: WebGL2RenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let vertex: WebGLShader | null = null;
    let fragment: WebGLShader | null = null;
    let vao: WebGLVertexArrayObject | null = null;
    let uniforms: Record<string, WebGLUniformLocation | null> = {};
    let frame = 0;
    let stopped = false;
    let previousFrame = 0;
    let scroll = 0;
    let cssWidth = 0;
    let cssHeight = 0;
    const pointer = { x: 0.5, y: 0.5 };

    const setFallback = (enabled: boolean) => {
      canvas.dataset.renderer = enabled ? "css" : "webgl2";
    };

    const destroy = () => {
      if (!gl) return;
      if (vao) gl.deleteVertexArray(vao);
      if (program) gl.deleteProgram(program);
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      vao = null;
      program = null;
      vertex = null;
      fragment = null;
      uniforms = {};
    };

    const initialize = () => {
      destroy();
      gl = canvas.getContext("webgl2", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        premultipliedAlpha: true,
        powerPreference: "low-power",
      });
      if (!gl) {
        setFallback(true);
        return false;
      }
      vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
      fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
      if (!vertex || !fragment) {
        setFallback(true);
        return false;
      }
      program = gl.createProgram();
      if (!program) {
        setFallback(true);
        return false;
      }
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        setFallback(true);
        return false;
      }
      vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.useProgram(program);
      uniforms = {
        resolution: gl.getUniformLocation(program, "uResolution"),
        pointer: gl.getUniformLocation(program, "uPointer"),
        time: gl.getUniformLocation(program, "uTime"),
        scroll: gl.getUniformLocation(program, "uScroll"),
        motion: gl.getUniformLocation(program, "uMotion"),
      };
      setFallback(false);
      return true;
    };

    const resize = () => {
      if (!gl) return;
      const mobile = window.innerWidth < 720;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5);
      const width = Math.max(1, Math.floor(window.innerWidth * dpr));
      const height = Math.max(1, Math.floor(window.innerHeight * dpr));
      const physicalSizeChanged = Math.abs(canvas.width - width) > 2 || Math.abs(canvas.height - height) > 2;
      if (physicalSizeChanged) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      if (cssWidth !== window.innerWidth || cssHeight !== window.innerHeight) {
        cssWidth = window.innerWidth;
        cssHeight = window.innerHeight;
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
      }
    };

    const render = (timestamp: number, force = false) => {
      if (stopped || !gl || !program || !vao) return;
      const staticMode = reducedMotion.matches || saveData;
      if (!force && !staticMode && timestamp - previousFrame < 32) {
        frame = window.requestAnimationFrame(render);
        return;
      }
      previousFrame = timestamp;
      resize();
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
      gl.uniform1f(uniforms.time, staticMode ? 8.0 : timestamp * 0.001);
      gl.uniform1f(uniforms.scroll, scroll);
      gl.uniform1f(uniforms.motion, staticMode ? 0.0 : 1.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!staticMode) frame = window.requestAnimationFrame(render);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX / Math.max(window.innerWidth, 1);
      pointer.y = 1 - event.clientY / Math.max(window.innerHeight, 1);
    };
    const onScroll = () => {
      const maximum = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      scroll = window.scrollY / maximum;
    };
    const onVisibility = () => {
      window.cancelAnimationFrame(frame);
      if (!document.hidden && gl) frame = window.requestAnimationFrame((time) => render(time, true));
    };
    const onMotionChange = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame((time) => render(time, true));
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      window.cancelAnimationFrame(frame);
      setFallback(true);
    };
    const onContextRestored = () => {
      if (initialize()) frame = window.requestAnimationFrame((time) => render(time, true));
    };

    if (initialize()) frame = window.requestAnimationFrame((time) => render(time, true));
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    reducedMotion.addEventListener("change", onMotionChange);
    onScroll();

    return () => {
      stopped = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      reducedMotion.removeEventListener("change", onMotionChange);
      destroy();
    };
  }, []);

  return (
    <div className="shader-field" aria-hidden="true">
      <canvas ref={canvasRef} data-renderer="loading" />
      <div className="shader-fallback" />
      <div className="shader-vignette" />
    </div>
  );
}
