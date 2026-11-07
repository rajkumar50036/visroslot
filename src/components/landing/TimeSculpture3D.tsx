"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function TimeSculpture3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xf5f0e6, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 7, 6);
    scene.add(keyLight);

    // Blue fill light for editorial contrast
    const fillLight = new THREE.DirectionalLight(0x3159d9, 1.4);
    fillLight.position.set(-6, -4, -3);
    scene.add(fillLight);

    // Vibrant Coral rim light
    const rimLight = new THREE.PointLight(0xe75a32, 3.2, 14);
    rimLight.position.set(2, -3, 3);
    scene.add(rimLight);

    // Acid Lime subtle floor kicker
    const limeLight = new THREE.PointLight(0xc8e56a, 1.8, 10);
    limeLight.position.set(-3, 4, 2);
    scene.add(limeLight);

    // ------------------------------------------------------------------
    // SCULPTURE COMPOSITION: Floating Kinetic Time Rings & Prisms
    // ------------------------------------------------------------------
    const sculptureGroup = new THREE.Group();
    scene.add(sculptureGroup);

    // 1. Primary Outer Time Ring (Titanium / Ink Black Brushed Metal)
    const ringGeo1 = new THREE.TorusGeometry(2.35, 0.05, 32, 120);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x171717,
      metalness: 0.88,
      roughness: 0.18,
    });
    const outerRing = new THREE.Mesh(ringGeo1, ringMat1);
    outerRing.rotation.x = Math.PI * 0.35;
    sculptureGroup.add(outerRing);

    // 2. Gimbal Axis Ring (Vibrant Coral Signature Accent)
    const ringGeo2 = new THREE.TorusGeometry(1.85, 0.045, 32, 100);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xe75a32,
      metalness: 0.5,
      roughness: 0.22,
      emissive: 0x4a180b,
      emissiveIntensity: 0.3,
    });
    const coralRing = new THREE.Mesh(ringGeo2, ringMat2);
    coralRing.rotation.y = Math.PI * 0.45;
    coralRing.rotation.x = -Math.PI * 0.25;
    sculptureGroup.add(coralRing);

    // 3. Inner Translucent Orbital Dial (Frosted Glass Appearance)
    const ringGeo3 = new THREE.TorusGeometry(1.35, 0.035, 32, 80);
    const ringMat3 = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.05,
      transparent: true,
      opacity: 0.85,
    });
    const innerRing = new THREE.Mesh(ringGeo3, ringMat3);
    innerRing.rotation.z = Math.PI * 0.2;
    sculptureGroup.add(innerRing);

    // 4. Central Geometric Kinetic Crystal (Coral Polyhedron)
    const coreGeo = new THREE.OctahedronGeometry(0.68, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xe75a32,
      metalness: 0.65,
      roughness: 0.15,
      emissive: 0x3d140a,
      emissiveIntensity: 0.4,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    sculptureGroup.add(coreMesh);

    // 5. Surrounding Satellite Spheres & Prisms
    const satelliteGroup = new THREE.Group();
    sculptureGroup.add(satelliteGroup);

    // Satellite A: Chrome Mirror Sphere
    const satGeo1 = new THREE.SphereGeometry(0.24, 32, 32);
    const satMat1 = new THREE.MeshStandardMaterial({
      color: 0xdcd8cf,
      metalness: 0.95,
      roughness: 0.05,
    });
    const sphere1 = new THREE.Mesh(satGeo1, satMat1);
    sphere1.position.set(1.9, 1.1, 0.5);
    satelliteGroup.add(sphere1);

    // Satellite B: Electric Blue Orbiting Orb
    const satGeo2 = new THREE.SphereGeometry(0.18, 32, 32);
    const satMat2 = new THREE.MeshStandardMaterial({
      color: 0x3159d9,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x0c1b4d,
      emissiveIntensity: 0.5,
    });
    const sphere2 = new THREE.Mesh(satGeo2, satMat2);
    sphere2.position.set(-1.6, -1.3, 0.8);
    satelliteGroup.add(sphere2);

    // Satellite C: Acid Lime Accent Prism
    const satGeo3 = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    const satMat3 = new THREE.MeshStandardMaterial({
      color: 0xc8e56a,
      metalness: 0.2,
      roughness: 0.3,
    });
    const cube1 = new THREE.Mesh(satGeo3, satMat3);
    cube1.position.set(-1.1, 1.8, -0.6);
    cube1.rotation.set(0.5, 0.8, 0.2);
    satelliteGroup.add(cube1);

    // Satellite D: Warm Ivory Cylindrical Time Pillar
    const satGeo4 = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 16);
    const satMat4 = new THREE.MeshStandardMaterial({
      color: 0x171717,
      metalness: 0.7,
      roughness: 0.3,
    });
    const cylinder = new THREE.Mesh(satGeo4, satMat4);
    cylinder.position.set(1.4, -1.6, -0.4);
    cylinder.rotation.z = Math.PI * 0.3;
    satelliteGroup.add(cylinder);

    // ------------------------------------------------------------------
    // INTERACTION & ANIMATION LOOP
    // ------------------------------------------------------------------
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x * 0.7;
      mouseY = y * 0.7;
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse damping
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      // Subtle breathing float motion
      sculptureGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.12;

      // Interactive rotation with mouse parallax
      sculptureGroup.rotation.y = elapsedTime * 0.22 + targetX * 0.9;
      sculptureGroup.rotation.x = Math.sin(elapsedTime * 0.4) * 0.12 - targetY * 0.7;

      // Inner ring counters-rotation
      coralRing.rotation.z = elapsedTime * 0.35;
      innerRing.rotation.y = -elapsedTime * 0.28;
      outerRing.rotation.z = -elapsedTime * 0.15;

      // Core spinning
      coreMesh.rotation.y = elapsedTime * 0.8;
      coreMesh.rotation.x = elapsedTime * 0.5;

      // Satellite orbital pulsation
      sphere1.position.y = 1.1 + Math.sin(elapsedTime * 2.1) * 0.08;
      sphere2.position.x = -1.6 + Math.cos(elapsedTime * 1.7) * 0.08;
      cube1.rotation.y += 0.02;
      cube1.rotation.x += 0.015;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    setIsLoaded(true);

    // Handle resize
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[420px] sm:h-[500px] lg:h-[560px] flex items-center justify-center">
      {/* Subtle backdrop circle */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-coral/10 via-electric/5 to-transparent blur-2xl pointer-events-none -z-10" />

      {/* Canvas container */}
      <div 
        ref={containerRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing transition-opacity duration-700"
        style={{ opacity: isLoaded ? 1 : 0 }}
      />

      {/* Floating typographic status badge */}
      <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 bg-white/90 backdrop-blur-md border border-soft-grey px-3 py-1.5 rounded-full shadow-editorial flex items-center gap-2 pointer-events-none select-none">
        <span className="w-2 h-2 rounded-full bg-coral animate-ping" />
        <span className="font-mono text-[10px] tracking-wider uppercase text-ink font-semibold">
          KINETIC DIAL • 3D SYNC
        </span>
      </div>
    </div>
  );
}
