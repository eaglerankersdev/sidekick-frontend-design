"use client";

/**
 * Soft Three.js particle field behind the home hero.
 * - Ice/light/cobalt points drifting slowly, parallax on pointer.
 * - Skipped entirely under prefers-reduced-motion (CSS gradient remains).
 * - Pauses when off-screen or tab hidden; capped DPR; disposed on unmount.
 */
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

export function HeroField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || prefersReducedMotion() || window.matchMedia("(max-width: 1079px)").matches) return;

    let disposed = false;
    let cleanup = () => {};

    import("three").then((THREE) => {
      if (disposed || !canvas) return;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
      camera.position.z = 14;

      const COUNT = window.innerWidth < 768 ? 35 : 80;
      const positions = new Float32Array(COUNT * 3);
      const colors = new Float32Array(COUNT * 3);
      const palette = [new THREE.Color("#87B5FF"), new THREE.Color("#4388F6"), new THREE.Color("#0062FD"), new THREE.Color("#BED5F4")];
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 24;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
        const c = palette[Math.floor(Math.random() * palette.length)];
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      // Circular soft sprite
      const size = 64;
      const c2 = document.createElement("canvas");
      c2.width = c2.height = size;
      const ctx = c2.getContext("2d")!;
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.4, "rgba(255,255,255,0.6)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      const sprite = new THREE.CanvasTexture(c2);

      const mat = new THREE.PointsMaterial({
        size: 0.2,
        map: sprite,
        vertexColors: true,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        sizeAttenuation: true,
        blending: THREE.NormalBlending,
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);

      // A few larger soft orbs for depth
      const orbGeo = new THREE.SphereGeometry(1, 24, 24);
      const orbs: InstanceType<typeof THREE.Mesh>[] = [];
      [
        [-9, 4, -4, 2.6, "#E6F0FF"],
        [10, -3, -6, 3.4, "#87B5FF"],
        [3, 6, -8, 2.2, "#4388F6"],
      ].forEach(([x, y, z, r, col]) => {
        const m = new THREE.Mesh(orbGeo, new THREE.MeshBasicMaterial({ color: col as string, transparent: true, opacity: 0.035 }));
        m.position.set(x as number, y as number, z as number);
        m.scale.setScalar(r as number);
        scene.add(m);
        orbs.push(m);
      });

      const target = { x: 0, y: 0 };
      const onMove = (e: PointerEvent) => {
        target.x = (e.clientX / window.innerWidth - 0.5) * 2;
        target.y = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener("pointermove", onMove, { passive: true });

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = canvas.parentElement!;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas.parentElement!);

      let visible = true;
      const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting), { threshold: 0.01 });
      io.observe(canvas);

      let raf = 0;
      const started = performance.now();
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!visible || document.hidden) return;
        const t = (performance.now() - started) / 1000;
        points.rotation.y = t * 0.02 + target.x * 0.06;
        points.rotation.x = Math.sin(t * 0.1) * 0.04 + target.y * 0.04;
        points.position.y = Math.sin(t * 0.25) * 0.3;
        orbs.forEach((o, i) => {
          o.position.y += Math.sin(t * 0.3 + i) * 0.002;
          o.position.x += Math.cos(t * 0.2 + i) * 0.002;
        });
        renderer.render(scene, camera);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        window.removeEventListener("pointermove", onMove);
        geo.dispose();
        mat.dispose();
        sprite.dispose();
        orbGeo.dispose();
        orbs.forEach((o) => (o.material as InstanceType<typeof THREE.Material>).dispose());
        renderer.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <canvas ref={ref} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}
