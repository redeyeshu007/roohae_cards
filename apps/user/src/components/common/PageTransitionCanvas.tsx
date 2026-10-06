/**
 * FILE PURPOSE:
 * Fullscreen WebGL Three.js canvas rendering liquid ink-dissolve page transition shaders.
 *
 * MAIN RESPONSIBILITY:
 * Mounts a full-screen GPU shader quad executing custom GLSL ink drops, noise warps,
 * and circular wipe reveals that synchronize with Next.js router.push navigations.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/store/transitionStore.ts
 * - apps/user/src/components/common/TransitionLink.tsx
 */

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { useTransitionStore } from "@/store/transitionStore";

/* ─────────────────────────────────────────────────────────────────────────────
   GLSL: vertex shader (full-screen quad, no transforms needed)
───────────────────────────────────────────────────────────────────────────── */
const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   GLSL: fragment shader — ink-drop / liquid warp dissolve
   uProgress  0 → 1   : cover phase   (black takes over the screen)
              1 → 0   : reveal phase  (black retreats)
   uPhase     0 = covering, 1 = revealing
───────────────────────────────────────────────────────────────────────────── */
const frag = /* glsl */ `
  precision highp float;

  uniform float uProgress;   /* 0..1 animation progress within current phase  */
  uniform float uPhase;      /* 0 = covering, 1 = revealing                   */
  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uOrigin;     /* NDC origin of the transition (0..1)           */

  varying vec2 vUv;

  /* ── Smooth noise helpers ──────────────────────────────────────────────── */
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash2(i + vec2(0,0)), f - vec2(0,0)),
          dot(hash2(i + vec2(1,0)), f - vec2(1,0)), u.x),
      mix(dot(hash2(i + vec2(0,1)), f - vec2(0,1)),
          dot(hash2(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2  shift = vec2(100.0);
    mat2  rot   = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p  = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  /* ── Ink-drop radial warp ─────────────────────────────────────────────── */
  void main() {
    vec2 uv      = vUv;
    float aspect = uResolution.x / uResolution.y;

    /* aspect-correct distance from the click origin */
    vec2 delta   = uv - uOrigin;
    delta.x     *= aspect;
    float dist   = length(delta);

    /* animated noise displacement — the ink "bleeds" outward */
    float t      = uTime * 0.4;
    vec2  warpUv = uv * 3.5 + vec2(t * 0.3, t * 0.2);
    float warp   = fbm(warpUv) * 0.22;

    /* effective radius that grows / shrinks with progress */
    float maxDist = 1.8;   /* large enough to cover any corner */

    float p      = uPhase < 0.5
                     ? uProgress           /* covering  : 0 → 1 */
                     : (1.0 - uProgress);  /* revealing : 1 → 0 */

    float radius = p * maxDist;

    /* ink edge with organic warp */
    float edgeSoft = 0.12;
    float mask = 1.0 - smoothstep(radius - edgeSoft + warp,
                                  radius + edgeSoft + warp,
                                  dist);

    if (mask <= 0.001) discard;

    /* ── Colour layers ──────────────────────────────────────────────────── */

    /* Base: deep editorial near-black with slight warm tint */
    vec3 base  = vec3(0.07, 0.06, 0.08);

    /* Prismatic sheen at the ink wavefront — chromatic iridescence */
    float wave    = smoothstep(radius - 0.25 + warp, radius + warp, dist);
    float shimmer = fbm(uv * 8.0 + t * 0.6) * 0.5 + 0.5;

    vec3 prismaA  = vec3(0.55, 0.20, 0.65);   /* deep violet   */
    vec3 prismaB  = vec3(0.85, 0.35, 0.55);   /* jewel rose    */
    vec3 prismaC  = vec3(0.95, 0.72, 0.30);   /* warm gold     */
    vec3 prism    = mix(prismaA, prismaB, shimmer);
         prism    = mix(prism,  prismaC,  pow(shimmer, 3.0) * 0.4);

    vec3 color    = mix(base, prism, wave * 0.55 * mask);

    /* Subtle star / particle glints riding the noise field */
    float glint = step(0.92, fbm(uv * 20.0 + t));
    color      += glint * 0.35 * mask * wave;

    /* Soft inner vignette to focus the eye */
    float vig   = 1.0 - 0.18 * length(uv - 0.5);
    color      *= vig;

    gl_FragColor = vec4(color, mask);
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────────── */
export default function PageTransitionCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);
  const router   = useRouter();

  /* ── Zustand ─────────────────────────────────────────────────────────── */
  const phase          = useTransitionStore((s) => s.phase);
  const href           = useTransitionStore((s) => s.href);
  const onCoverComplete  = useTransitionStore((s) => s.onCoverComplete);
  const beginReveal    = useTransitionStore((s) => s.beginReveal);
  const onRevealComplete = useTransitionStore((s) => s.onRevealComplete);

  /* ── Three.js refs (stable across re-renders) ────────────────────────── */
  const rendererRef  = useRef<THREE.WebGLRenderer | null>(null);
  const uniformsRef  = useRef<{
    uProgress:   { value: number };
    uPhase:      { value: number };
    uTime:       { value: number };
    uResolution: { value: THREE.Vector2 };
    uOrigin:     { value: THREE.Vector2 };
  } | null>(null);
  const frameRef     = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const activeRef    = useRef(false);

  /* ── Boot Three.js once ──────────────────────────────────────────────── */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uProgress:   { value: 0 },
      uPhase:      { value: 0 },
      uTime:       { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uOrigin:     { value: new THREE.Vector2(0.5, 0.5) },
    };
    uniformsRef.current = uniforms;

    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader:   vert,
      fragmentShader: frag,
      transparent:    true,
      depthWrite:     false,
      depthTest:      false,
    });
    scene.add(new THREE.Mesh(geo, mat));

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    /* ── idle render loop (only renders when active) ─────────────────── */
    const tick = (ts: number) => {
      frameRef.current = requestAnimationFrame(tick);
      if (!activeRef.current) return;
      if (uniformsRef.current) {
        uniformsRef.current.uTime.value = ts * 0.001;
      }
      renderer.render(scene, camera);
    };
    frameRef.current = requestAnimationFrame(tick);

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(frameRef.current);
      else frameRef.current = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  /* ── Phase-driven animation ──────────────────────────────────────────── */
  useEffect(() => {
    const uniforms = uniformsRef.current;
    if (!uniforms) return;

    /* COVERING — animate progress 0 → 1 over ~800 ms */
    if (phase === "covering") {
      const DURATION = 820;
      uniforms.uPhase.value    = 0;
      uniforms.uProgress.value = 0;
      activeRef.current        = true;
      startTimeRef.current     = performance.now();

      const animate = () => {
        const elapsed  = performance.now() - startTimeRef.current;
        const progress = Math.min(elapsed / DURATION, 1);
        /* ease-in-out cubic */
        const eased    = progress < 0.5
          ? 4 * progress ** 3
          : 1 - (-2 * progress + 2) ** 3 / 2;

        if (uniforms) uniforms.uProgress.value = eased;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          /* Fully covered — navigate, then begin reveal */
          onCoverComplete();
          if (href) {
            router.push(href);
            /* small delay for the new page to mount */
            setTimeout(() => {
              beginReveal();
            }, 120);
          }
        }
      };
      requestAnimationFrame(animate);
    }

    /* REVEALING — animate progress 1 → 0 over ~700 ms */
    if (phase === "revealing") {
      const DURATION = 700;
      uniforms.uPhase.value    = 1;
      uniforms.uProgress.value = 1;
      activeRef.current        = true;
      startTimeRef.current     = performance.now();

      const animate = () => {
        const elapsed  = performance.now() - startTimeRef.current;
        const progress = Math.min(elapsed / DURATION, 1);
        const eased    = 1 - (progress < 0.5
          ? 4 * progress ** 3
          : 1 - (-2 * progress + 2) ** 3 / 2);

        if (uniforms) uniforms.uProgress.value = eased;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          activeRef.current = false;
          onRevealComplete();
        }
      };
      requestAnimationFrame(animate);
    }

    /* IDLE — ensure canvas is hidden */
    if (phase === "idle") {
      if (uniforms) uniforms.uProgress.value = 0;
      activeRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const isVisible = phase !== "idle";

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         200,
        pointerEvents:  isVisible ? "all" : "none",
        opacity:        isVisible ? 1 : 0,
        transition:     "opacity 60ms",
      }}
    />
  );
}
