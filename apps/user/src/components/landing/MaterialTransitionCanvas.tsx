/**
 * FILE PURPOSE:
 * Fullscreen WebGL shader canvas providing gradient-mesh transition between Hero and Experience sections.
 *
 * MAIN RESPONSIBILITY:
 * Uses Three.js and custom GLSL fragment shaders to render an organic, multi-point color gradient mesh
 * driven by window scroll progress between the landing Hero and Experience sections.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/landing/TransitionCanvasLoader.tsx
 * - apps/user/src/app/page.tsx
 */

"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * MaterialTransitionCanvas — Gradient Mesh Edition
 *
 * A fixed, full-viewport WebGL canvas that renders a premium
 * gradient-mesh transition while scrolling from Hero → Experience.
 *
 * Visual journey (scroll-driven, 0 → 1):
 *   0.0  Soft blush pinks  — matches Hero palette
 *   0.5  Rich jewel tones  — deep violet, rose, amethyst (the trending moment)
 *   1.0  Deep editorial dark — converges to #1E1E1E
 *
 * 5 floating gradient control points use inverse-distance-squared
 * weighting to create a smooth organic mesh with no hard edges.
 * Each point orbits gently via slow sin/cos drift.
 *
 * z-index 20 — above HeroScene (z-0), below FloatingNav (z-100).
 * alpha = 0 outside transition zone — sections show through normally.
 */

/* ─── GLSL ──────────────────────────────────────────────────── */

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const frag = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uProgress;   /* 0 = hero end   ·   1 = experience start */
  uniform float uAspect;

  varying vec2 vUv;

  /*
   * pal3 — smooth 3-stage palette interpolator
   *   t ∈ [0, 0.5]  → A → B
   *   t ∈ [0.5, 1]  → B → C
   */
  vec3 pal3(vec3 A, vec3 B, vec3 C, float t) {
    float s1 = smoothstep(0.0, 1.0, clamp(t * 2.0,       0.0, 1.0));
    float s2 = smoothstep(0.0, 1.0, clamp(t * 2.0 - 1.0, 0.0, 1.0));
    return mix(mix(A, B, s1), C, s2);
  }

  void main() {
    /* aspect-correct uv space, origin = bottom-left */
    vec2 uv = vec2(vUv.x * uAspect, vUv.y);

    float T = uTime * 0.16;   /* very slow ambient drift          */
    float p = uProgress;      /* scroll progress 0 → 1            */

    /* ─── 5 floating gradient control points ──────────────────
       Positions drift in slow organic Lissajous paths.
       x is aspect-scaled so points spread correctly.          */
    vec2 pt0 = vec2(uAspect*(0.18+0.15*sin(T*0.71)), 0.80+0.13*cos(T*0.53));
    vec2 pt1 = vec2(uAspect*(0.78+0.13*cos(T*0.83)), 0.20+0.15*sin(T*0.67));
    vec2 pt2 = vec2(uAspect*(0.50+0.12*sin(T*1.07)), 0.55+0.10*cos(T*0.44));
    vec2 pt3 = vec2(uAspect*(0.05+0.09*cos(T*0.59)), 0.38+0.12*sin(T*0.79));
    vec2 pt4 = vec2(uAspect*(0.88+0.10*sin(T*0.47)), 0.85+0.11*cos(T*0.91));

    /* ─── Inverse-distance-squared weights ─────────────────── */
    float eps = 0.07;  /* falloff softness — larger = softer pools */
    float w0 = 1.0/(dot(uv-pt0,uv-pt0)+eps);
    float w1 = 1.0/(dot(uv-pt1,uv-pt1)+eps);
    float w2 = 1.0/(dot(uv-pt2,uv-pt2)+eps);
    float w3 = 1.0/(dot(uv-pt3,uv-pt3)+eps);
    float w4 = 1.0/(dot(uv-pt4,uv-pt4)+eps);
    float wSum = w0+w1+w2+w3+w4;

    /* ─── 3-stage colors per point ──────────────────────────
       Stage A (p=0.0) — blush pinks matching the Hero
       Stage B (p=0.5) — rich jewel tones: violet, amethyst, rose
       Stage C (p=1.0) — deep dark converging to #1E1E1E         */

    /* pt0 — rose pink → deep violet → near black */
    vec3 c0 = pal3(
      vec3(0.957, 0.714, 0.796),   /* #F4B5CB rose           */
      vec3(0.388, 0.149, 0.518),   /* #631880 deep violet    */
      vec3(0.118, 0.118, 0.137)    /* #1E1E23                */
    , p);

    /* pt1 — pale blush → rose jewel → near black */
    vec3 c1 = pal3(
      vec3(0.984, 0.831, 0.882),   /* #FBD4E1 blush          */
      vec3(0.694, 0.255, 0.447),   /* #B14172 jewel rose     */
      vec3(0.122, 0.110, 0.118)    /* #1F1C1E                */
    , p);

    /* pt2 — medium pink → amethyst → near black */
    vec3 c2 = pal3(
      vec3(0.922, 0.647, 0.718),   /* #EBA5B7 medium pink    */
      vec3(0.541, 0.200, 0.663),   /* #8A33A9 amethyst       */
      vec3(0.133, 0.118, 0.129)    /* #221E21                */
    , p);

    /* pt3 — pale rose → vibrant purple → near black */
    vec3 c3 = pal3(
      vec3(0.976, 0.898, 0.925),   /* #F9E5EC pale rose      */
      vec3(0.545, 0.212, 0.588),   /* #8B3696 vibrant purple */
      vec3(0.110, 0.114, 0.122)    /* #1C1D1F                */
    , p);

    /* pt4 — mid rose → warm magenta → near black */
    vec3 c4 = pal3(
      vec3(0.941, 0.737, 0.808),   /* #EFBCCF mid rose       */
      vec3(0.827, 0.376, 0.533),   /* #D36088 warm magenta   */
      vec3(0.129, 0.122, 0.133)    /* #211E22                */
    , p);

    /* ─── Weighted blend ───────────────────────────────────── */
    vec3 color = (c0*w0 + c1*w1 + c2*w2 + c3*w3 + c4*w4) / wSum;

    /* Subtle vignette — deepens edges, draws eye to centre */
    float vign = 1.0 - 0.20 * length(vUv - 0.5);
    color *= vign;

    /* ─── Canvas alpha ──────────────────────────────────────
       0 at both ends → sections show through unaltered.
       Ramps to 1 smoothly inside the transition window.     */
    float alpha = smoothstep(0.00, 0.09, p)
                * smoothstep(1.00, 0.91, p);

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ─── Component ─────────────────────────────────────────────── */

export default function MaterialTransitionCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /* Respect prefers-reduced-motion */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* ── Renderer ───────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    /* ── Scene ──────────────────────────────────────────────── */
    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime:     { value: 0 },
      uProgress: { value: 0 },
      uAspect:   { value: window.innerWidth / window.innerHeight },
    };

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

    /* ── Resize ─────────────────────────────────────────────── */
    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uAspect.value = window.innerWidth / window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    /* Cache section references once so scroll handler is cheap.
       Hero uses a <div>, not a <section> — target by its unique class. */
    let heroEl: HTMLElement | null = null;
    let expEl:  HTMLElement | null = null;
    let targetProgress = 0;

    const initSections = () => {
      // Hero: the 100svh opening div (not a <section>)
      heroEl = document.querySelector('div[class*="100svh"]') as HTMLElement ?? null;
      // Experience: the only <section> on the page
      expEl  = document.querySelector('section') as HTMLElement ?? null;
    };
    initSections();

    const calcProgress = (): number => {
      if (!heroEl || !expEl) { initSections(); return 0; }

      const scrollY    = window.scrollY;
      const heroH      = heroEl.offsetHeight;
      const transStart = heroH * 0.70;                              /* 70 % through hero   */
      const transEnd   = expEl.offsetTop + expEl.offsetHeight * 0.18; /* 18 % into exp      */

      if (transEnd <= transStart) return 0;
      return Math.max(0, Math.min(1, (scrollY - transStart) / (transEnd - transStart)));
    };

    const onScroll = () => { targetProgress = calcProgress(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* ── Render loop ────────────────────────────────────────── */
    const timer = new THREE.Timer();
    timer.connect(document);
    let frame   = 0;
    let smooth  = 0;
    let wasActive = false;

    const tick = (ts: number) => {
      frame = requestAnimationFrame(tick);
      timer.update(ts);

      smooth += (targetProgress - smooth) * 0.06;

      const active   = targetProgress > 0.001 || smooth > 0.001;
      const settled  = Math.abs(smooth - targetProgress) < 0.0004;

      if (active || (wasActive && !settled)) {
        uniforms.uTime.value     = timer.getElapsed();
        uniforms.uProgress.value = smooth;
        renderer.render(scene, camera);
        wasActive = true;
      } else if (wasActive && settled) {
        uniforms.uProgress.value = smooth;
        renderer.render(scene, camera); /* final clear */
        wasActive = false;
      }
    };
    frame = requestAnimationFrame(tick);

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(frame);
      else frame = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVisibility);

    /* ── Cleanup ────────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(frame);
      timer.dispose();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 20, pointerEvents: "none" }}
    />
  );
}
