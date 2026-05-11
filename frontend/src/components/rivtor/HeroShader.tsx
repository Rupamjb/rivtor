"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  vec3 sampleField(vec2 uv, float t) {
    vec2 grid = vec2(220.0, 90.0);
    vec2 cell = floor(uv * grid) / grid;
    vec2 cuv = cell;

    float edgeL = cuv.x;
    float edgeR = 1.0 - cuv.x;
    float edgeMin = min(edgeL, edgeR);
    float edgeMask = smoothstep(0.5, 0.0, edgeMin);

    float waveL = sin((cuv.x * 14.0) - t * 1.6 + noise(cuv * 6.0 + t * 0.2) * 3.0);
    float waveR = sin((1.0 - cuv.x) * 14.0 - t * 1.4 + noise(cuv.yx * 6.0 - t * 0.15) * 3.0);
    float wave = (waveL * step(0.5, edgeR) + waveR * step(0.5, edgeL));
    wave = wave * 0.5 + 0.5;

    float col = noise(vec2(cuv.x * 60.0, t * 0.1)) * 0.6 + noise(vec2(cuv.x * 200.0, 0.0)) * 0.4;
    float vbar = step(0.45, col);

    float vert = smoothstep(0.0, 0.55, abs(cuv.y - 0.5)) * 0.7 + 0.3;
    float intensity = wave * edgeMask * vbar * vert;

    vec3 violet = vec3(0.486, 0.361, 1.0);
    vec3 cyan   = vec3(0.0, 0.831, 1.0);
    vec3 base = mix(violet, cyan, smoothstep(0.2, 0.8, cuv.x));

    vec3 col3 = base * intensity * 1.6;
    col3 += vec3(0.012, 0.014, 0.024);
    return col3;
  }

  void main() {
    vec2 uv = vUv;
    vec2 m = (uMouse - 0.5) * 0.012;
    uv += m;

    float t = uTime;

    vec3 c;
    c.r = sampleField(uv + vec2(0.0015, 0.0), t).r;
    c.g = sampleField(uv, t).g;
    c.b = sampleField(uv - vec2(0.0015, 0.0), t).b;

    float grain = (hash(uv * uResolution.xy + t) - 0.5) * 0.05;
    c += grain;

    float v = smoothstep(1.2, 0.4, length(uv - 0.5));
    c *= mix(0.7, 1.0, v);

    gl_FragColor = vec4(c, 1.0);
  }
`;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const HeroShader = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    setMounted(true);

    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateMode = () => {
      setLowPower(mobileQuery.matches || reduceMotionQuery.matches);
    };

    updateMode();
    mobileQuery.addEventListener("change", updateMode);
    reduceMotionQuery.addEventListener("change", updateMode);

    return () => {
      mobileQuery.removeEventListener("change", updateMode);
      reduceMotionQuery.removeEventListener("change", updateMode);
    };
  }, []);

  useEffect(() => {
    if (!mounted || lowPower) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    const mouseTarget = new THREE.Vector2(0.5, 0.5);

    const onMouseMove = (event: MouseEvent) => {
      mouseTarget.x = event.clientX / window.innerWidth;
      mouseTarget.y = 1 - event.clientY / window.innerHeight;
    };

    const onResize = () => {
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(width, height);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);
    onResize();

    let animationFrame = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      uniforms.uTime.value += delta;
      uniforms.uMouse.value.lerp(mouseTarget, 0.04);
      renderer.render(scene, camera);

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);

      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [mounted, lowPower]);

  if (!mounted || lowPower) {
    return (
      <div className="absolute inset-0 bg-rv">
        <div className="absolute inset-0 bg-[radial-gradient(700px_360px_at_50%_45%,rgba(124,92,255,0.2),transparent_68%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(500px_260px_at_75%_30%,rgba(0,212,255,0.12),transparent_70%)]" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-rv" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-rv/40 via-transparent to-rv/40" />
    </div>
  );
};
