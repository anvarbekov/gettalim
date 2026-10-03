"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Bosh sahifa foni: sekin suzuvchi arqon rangidagi zarrachalar.
 * Sichqoncha harakatiga yengil javob beradi. prefers-reduced-motion hurmat qilinadi.
 */
export function ThreeBackground() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.z = 22;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    const count = 140;
    const positions = new Float32Array(count * 3);
    const colorList = [new THREE.Color("#c4996c"), new THREE.Color("#1f6fd0"), new THREE.Color("#d2402f")];
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 34;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 26;
      const c = colorList[i % 3];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.42,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let mouseX = 0;
    let mouseY = 0;
    const onMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);

    const onResize = () => {
      if (!el.clientWidth) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", onResize);

    let frame = 0;
    let last = 0;
    const tick = (now = 0) => {
      frame = requestAnimationFrame(tick);
      if (document.hidden) return;
      if (now - last < 33) return;          // ~30 kadr/sek — protsessor bo'sh qoladi
      last = now;
      points.rotation.y += reduced ? 0 : 0.0009;
      points.rotation.x += reduced ? 0 : 0.0004;
      camera.position.x += (mouseX * 2.2 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 1.6 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={host} className="pointer-events-none absolute inset-0 -z-10" aria-hidden />;
}
