import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  varying vec2 vUv;

  // hash & noise
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
    // pixel grid quantize (vertical bias)
    vec2 grid = vec2(220.0, 90.0);
    vec2 cell = floor(uv * grid) / grid;
    vec2 cuv = cell;

    // distance from edges (0 at edge, 1 at center)
    float edgeL = cuv.x;
    float edgeR = 1.0 - cuv.x;
    float edgeMin = min(edgeL, edgeR);
    // calm core in middle: 1 at edges, 0 at center
    float edgeMask = smoothstep(0.5, 0.0, edgeMin);

    // energy waves moving inward
    float waveL = sin((cuv.x * 14.0) - t * 1.6 + noise(cuv * 6.0 + t * 0.2) * 3.0);
    float waveR = sin((1.0 - cuv.x) * 14.0 - t * 1.4 + noise(cuv.yx * 6.0 - t * 0.15) * 3.0);
    float wave = (waveL * step(0.5, edgeR) + waveR * step(0.5, edgeL));
    wave = wave * 0.5 + 0.5;

    // vertical column variance — pixel scanline feel
    float col = noise(vec2(cuv.x * 60.0, t * 0.1)) * 0.6 + noise(vec2(cuv.x * 200.0, 0.0)) * 0.4;
    float vbar = step(0.45, col);

    // height fall-off
    float vert = smoothstep(0.0, 0.55, abs(cuv.y - 0.5)) * 0.7 + 0.3;

    float intensity = wave * edgeMask * vbar * vert;

    // base palette: violet (left), cyan (right)
    vec3 violet = vec3(0.486, 0.361, 1.0);
    vec3 cyan   = vec3(0.0, 0.831, 1.0);
    vec3 base = mix(violet, cyan, smoothstep(0.2, 0.8, cuv.x));

    vec3 col3 = base * intensity * 1.6;
    // deep bg
    col3 += vec3(0.012, 0.014, 0.024);
    return col3;
  }

  void main() {
    vec2 uv = vUv;
    // mouse parallax
    vec2 m = (uMouse - 0.5) * 0.012;
    uv += m;

    float t = uTime;

    // RGB shift
    vec3 c;
    c.r = sampleField(uv + vec2(0.0015, 0.0), t).r;
    c.g = sampleField(uv, t).g;
    c.b = sampleField(uv - vec2(0.0015, 0.0), t).b;

    // film grain
    float grain = (hash(uv * uResolution.xy + t) - 0.5) * 0.05;
    c += grain;

    // vignette
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

function ShaderPlane() {
  const mesh = useRef<THREE.Mesh>(null);
  const { size } = useThree();
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    }),
    []
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        depthTest: false,
        depthWrite: false,
      }),
    [uniforms]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    uniforms.uResolution.value.set(size.width, size.height);
    // lerp mouse
    uniforms.uMouse.value.x += (mouseRef.current.x - uniforms.uMouse.value.x) * 0.04;
    uniforms.uMouse.value.y += (mouseRef.current.y - uniforms.uMouse.value.y) * 0.04;
  });

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[2, 2]} />
      <primitive attach="material" object={material} />
    </mesh>
  );
}

export const HeroShader = () => {
  const [mounted, setMounted] = useState(false);
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mm = window.matchMedia("(max-width: 767px)");
    const onChange = () => setLowPower(mm.matches);
    onChange();
    mm.addEventListener("change", onChange);
    return () => mm.removeEventListener("change", onChange);
  }, []);

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
      <Canvas
        dpr={[1, 1.25]}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 1] }}
      >
        <ShaderPlane />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-rv" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-rv/40 via-transparent to-rv/40" />
    </div>
  );
};
