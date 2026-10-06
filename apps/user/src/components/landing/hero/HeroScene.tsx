/**
 * FILE PURPOSE:
 * Fullscreen background Three.js WebGL shader canvas for the landing hero section.
 *
 * MAIN RESPONSIBILITY:
 * Executes a full-bleed GLSL domain-warped noise shader in brand pink palettes (#F9C2D7)
 * with an opening light-reveal sweep and interactive pointer warping.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/app/page.tsx
 * - apps/user/src/components/landing/hero/OpeningPage.tsx
 */

"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/** -----------------------------------
 * HeroScene
 *
 * No objects — the opening itself is the animation. A single full-bleed quad
 * running a domain-warped noise field in the brand pinks:
 *
 *   on load  — an expanding ring of light sweeps out from centre, revealing the
 *              field behind it while the turbulence settles from churning to calm
 *   at rest  — the field drifts slowly and warps a little toward the pointer
 *
 * Sits at z-0, behind the paper grain (z-10) and the type (z-20), and is
 * pointer-events-none — the layout above it is untouched and stays clickable.
 * ----------------------------------- */

// #F9C2D7 — the --background pink, and a deeper tone to drift against it.
const PALE = new THREE.Color(0.976, 0.761, 0.843);
const DEEP = new THREE.Color(0.937, 0.639, 0.761);

/** Length of the opening reveal. */
const INTRO_SECONDS = 2.6;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uAspect;
  uniform float uIntro;   // 0 -> 1 across the opening
  uniform vec2  uMouse;
  uniform vec3  uPale;
  uniform vec3  uDeep;
  varying vec2 vUv;

  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, hash(i)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
    return dot(n, vec3(70.0));
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 p = vUv - 0.5;
    p.x *= uAspect;

    // Drift rate. This is the main dial for how much the field moves — lower
    // is calmer. At 0.045 it visibly churned.
    float t = uTime * 0.014;

    // Domain warping — fbm fed through itself twice. This is what makes the
    // field read as flowing ink rather than as a noise texture.
    vec2 q = vec2(
      fbm(p * 1.4 + vec2(0.0, t)),
      fbm(p * 1.4 + vec2(5.2, 1.3 - t))
    );
    vec2 r = vec2(
      fbm(p * 1.4 + 3.0 * q + vec2(1.7, 9.2) + 0.15 * t + uMouse * 0.12),
      fbm(p * 1.4 + 3.0 * q + vec2(8.3, 2.8) - 0.13 * t + uMouse * 0.12)
    );
    float n = fbm(p * 1.4 + 2.0 * r) * 0.5 + 0.5;

    // Turbulence settles as the intro completes: churning -> calm.
    n = mix(clamp(n * 1.7 - 0.35, 0.0, 1.0), n, uIntro);

    vec3 col = mix(uDeep, uPale, smoothstep(0.3, 0.8, n));

    // The reveal: a wavefront expanding from centre.
    float d = length(p);
    float front = uIntro * 1.7;
    float revealed = smoothstep(0.0, 0.55, front - d);
    col = mix(uDeep * 0.9, col, revealed);

    // A ring of light riding the wavefront, gone by the time it settles.
    float ring = smoothstep(0.06, 0.0, abs(d - front)) * (1.0 - uIntro);
    col += ring * 0.22;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Honour the OS setting: render the settled field, never the reveal.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // Capped at 1.5, not 2. This shader is domain-warped fbm — five fbm calls
    // of four octaves each, so ~20 noise evaluations for every fragment, over
    // the whole viewport, every frame. At DPR 2 on a 1600x900 window that is
    // ~7B noise evaluations a second, which is enough to starve the compositor
    // the book's page turns depend on. Dropping to 1.5 is 44% less work and
    // invisible on a field this soft.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uIntro: { value: reduced ? 1 : 0 },
      uMouse: { value: new THREE.Vector2() },
      uPale: { value: PALE },
      uDeep: { value: DEEP },
    };

    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      depthWrite: false,
      depthTest: false,
    });
    scene.add(new THREE.Mesh(geo, mat));

    const layout = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      uniforms.uAspect.value = w / h;
    };
    layout();

    const ro = new ResizeObserver(layout);
    ro.observe(mount);

    const target = new THREE.Vector2();
    const onPointerMove = (e: PointerEvent) => {
      target.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    };
    window.addEventListener("pointermove", onPointerMove);

    // Timer, not the deprecated Clock. connect() wires the Page Visibility API
    // so a backgrounded tab doesn't return a huge delta and jump the reveal.
    const timer = new THREE.Timer();
    timer.connect(document);
    let frame = 0;

    // Decelerating reveal — fast out of the gate, easing into the settled field.
    const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

    const tick = (timestamp: number) => {
      timer.update(timestamp);
      const t = timer.getElapsed();

      uniforms.uTime.value = t;
      uniforms.uIntro.value = easeOutCubic(Math.min(t / INTRO_SECONDS, 1));
      uniforms.uMouse.value.lerp(target, 0.015);

      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };

    if (reduced) {
      renderer.render(scene, camera);
    } else {
      frame = requestAnimationFrame(tick);
    }

    // Don't burn frames on a tab nobody is looking at.
    const onVisibility = () => {
      if (reduced) return;
      if (document.hidden) {
        cancelAnimationFrame(frame);
      } else {
        frame = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      timer.dispose();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none" />;
}
