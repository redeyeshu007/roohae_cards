/**
 * FILE PURPOSE:
 * Interactive WebGL background canvas for the editorial landing section.
 *
 * MAIN RESPONSIBILITY:
 * Renders procedural noise, fluid silk physics, and cursor-reactive iridescent lighting
 * using Three.js and custom GLSL fragment shaders.
 *
 * CONNECTED SYSTEMS:
 * - apps/user/src/components/landing/Editorial/EditorialSection.tsx
 */

"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

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

    // Very slow time — feels like gently illuminated silk
    float t = uTime * 0.025;

    // Organic domain warping (kept very subtle)
    vec2 q = vec2(
      fbm(p * 1.2 + vec2(0.0, t)),
      fbm(p * 1.2 + vec2(5.2, 1.3 - t * 0.6))
    );
    vec2 r = vec2(
      fbm(p * 0.9 + 2.5 * q + vec2(1.7, 9.2) + 0.10 * t),
      fbm(p * 0.9 + 2.5 * q + vec2(8.3, 2.8) - 0.08 * t)
    );
    float n = fbm(p * 1.2 + 1.5 * r) * 0.5 + 0.5;

    // Blush pink palette
    // #E0ADBE → vec3(0.878, 0.678, 0.745)
    // #E6B7C7 → vec3(0.902, 0.718, 0.780)
    // #EDD0DA → vec3(0.929, 0.816, 0.855)
    vec3 primaryBlush  = vec3(0.878, 0.678, 0.745); // #E0ADBE
    vec3 lightBlush    = vec3(0.902, 0.718, 0.780); // #E6B7C7
    vec3 paleBlush     = vec3(0.929, 0.816, 0.855); // #EDD0DA
    // Soft gold glow: rgba(201,169,110,0.08) → vec3(0.788, 0.663, 0.431)
    vec3 softGold      = vec3(0.788, 0.663, 0.431);

    // Gentle color mixing — no strong shifts, just silk-like variation
    vec3 col = mix(primaryBlush, lightBlush, smoothstep(0.25, 0.75, n));
    col = mix(col, paleBlush, smoothstep(0.6, 1.0, n) * 0.45);

    // Radial glow from center — slowly drifts
    vec2 glowCenter = vec2(
      sin(t * 0.7) * 0.18,
      cos(t * 0.5) * 0.12
    );
    float radial = 1.0 - smoothstep(0.0, 0.65, length(p - glowCenter));
    col = mix(col, lightBlush, radial * 0.18);

    // Delicate gold glow (very subtle — max 8% opacity as per spec)
    float highlight = smoothstep(0.72, 1.0, n) * fbm(p * 1.8 + t * 0.5);
    col = mix(col, softGold, highlight * 0.08);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function EditorialCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uAspect: { value: 1 },
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

    const timer = new THREE.Timer();
    timer.connect(document);
    let frame = 0;

    const tick = (timestamp: number) => {
      timer.update(timestamp);
      uniforms.uTime.value = timer.getElapsed();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      renderer.render(scene, camera);
    } else {
      frame = requestAnimationFrame(tick);
    }

    const onVisibility = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
      document.removeEventListener("visibilitychange", onVisibility);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
}
