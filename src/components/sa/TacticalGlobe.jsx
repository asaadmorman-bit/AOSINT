import React, { useRef, useEffect } from "react";
import * as THREE from "three";

// Threat hotspot coordinates [lat, lon]
const THREAT_POINTS = [
  { lat: 40.7, lon: -74.0,  sev: "high" },    // New York
  { lat: 51.5, lon: -0.1,   sev: "med" },     // London
  { lat: 48.8, lon: 2.35,   sev: "med" },     // Paris
  { lat: 35.7, lon: 139.7,  sev: "low" },     // Tokyo
  { lat: 25.2, lon: 55.3,   sev: "crit" },    // Dubai
  { lat: 33.9, lon: 35.5,   sev: "crit" },    // Beirut
  { lat: 41.0, lon: 28.9,   sev: "high" },    // Istanbul
  { lat: 4.7,  lon: -74.1,  sev: "crit" },    // Bogota
  { lat: 55.7, lon: 37.6,   sev: "high" },    // Moscow
  { lat: 31.8, lon: 35.2,   sev: "high" },    // Jerusalem
  { lat: 39.9, lon: 116.4,  sev: "med" },     // Beijing
  { lat: 30.0, lon: 31.2,   sev: "med" },     // Cairo
];

const ARCS = [
  [0, 4], [1, 5], [2, 6], [7, 3], [8, 0], [9, 1], [10, 2], [11, 9]
];

function latLonToVec3(lat, lon, r) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

const EARTH_DAY_URL   = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const EARTH_NIGHT_URL = "https://unpkg.com/three-globe/example/img/earth-night.jpg";
const EARTH_CLOUD_URL = "https://unpkg.com/three-globe/example/img/earth-clouds.png";
const EARTH_BUMP_URL  = "https://unpkg.com/three-globe/example/img/earth-topology.png";

export default function TacticalGlobe({ width, height }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const W = width  || mountRef.current.clientWidth  || 400;
    const H = height || mountRef.current.clientHeight || 400;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.z = 2.8;

    // Lighting — sun-like directional + soft ambient
    scene.add(new THREE.AmbientLight(0x333344, 0.6));
    const sun = new THREE.DirectionalLight(0xfff5e0, 2.2);
    sun.position.set(5, 2, 4);
    scene.add(sun);

    // Earth — real NASA Blue Marble textures
    const R = 1;
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = "anonymous";

    const earthGeo = new THREE.SphereGeometry(R, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      map:       loader.load(EARTH_DAY_URL),
      bumpMap:   loader.load(EARTH_BUMP_URL),
      bumpScale: 0.05,
      specularMap: loader.load(EARTH_BUMP_URL),
      specular:  new THREE.Color(0x226688),
      shininess: 18,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // Cloud layer
    const cloudGeo = new THREE.SphereGeometry(R * 1.005, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
      map:         loader.load(EARTH_CLOUD_URL),
      transparent: true,
      opacity:     0.85,
      depthWrite:  false,
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    scene.add(clouds);

    // Thin atmosphere glow (blue haze at limb)
    const atmGeo = new THREE.SphereGeometry(R * 1.06, 32, 32);
    const atmMat = new THREE.MeshPhongMaterial({
      color:       0x4488ff,
      transparent: true,
      opacity:     0.07,
      side:        THREE.FrontSide,
      depthWrite:  false,
    });
    scene.add(new THREE.Mesh(atmGeo, atmMat));

    // Outer glow ring
    const outerGeo = new THREE.SphereGeometry(R * 1.13, 32, 32);
    const outerMat = new THREE.MeshBasicMaterial({
      color:       0x2266ff,
      transparent: true,
      opacity:     0.03,
      side:        THREE.BackSide,
      depthWrite:  false,
    });
    scene.add(new THREE.Mesh(outerGeo, outerMat));

    // Threat point markers
    const SEV_COLORS = { crit: 0xff4757, high: 0xffa502, med: 0x00d4ff, low: 0x2ed573 };
    const pointMarkers = [];
    THREAT_POINTS.forEach(({ lat, lon, sev }) => {
      const pos  = latLonToVec3(lat, lon, R + 0.012);
      const geo  = new THREE.SphereGeometry(0.018, 8, 8);
      const mat  = new THREE.MeshBasicMaterial({ color: SEV_COLORS[sev] || 0x00ff41 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      earth.add(mesh);

      // Ping ring
      const ringGeo = new THREE.RingGeometry(0.02, 0.035, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color:       SEV_COLORS[sev],
        transparent: true,
        opacity:     0.7,
        side:        THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      ring.userData = { phase: Math.random() * Math.PI * 2 };
      earth.add(ring);
      pointMarkers.push(ring);
    });

    // Arc lines between threat points
    const arcLines = [];
    ARCS.forEach(([a, b]) => {
      const pA  = latLonToVec3(THREAT_POINTS[a].lat, THREAT_POINTS[a].lon, R);
      const pB  = latLonToVec3(THREAT_POINTS[b].lat, THREAT_POINTS[b].lon, R);
      const mid = pA.clone().add(pB).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(R * 1.35);

      const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
      const pts   = curve.getPoints(40);
      const geo   = new THREE.BufferGeometry().setFromPoints(pts);
      const mat   = new THREE.LineBasicMaterial({
        color:       0x00ff41,
        transparent: true,
        opacity:     0.35,
      });
      const line = new THREE.Line(geo, mat);
      line.userData = { phase: Math.random() * Math.PI * 2 };
      earth.add(line);
      arcLines.push(line);
    });

    // Stars
    const starVerts = [];
    for (let i = 0; i < 1500; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 8 + Math.random() * 4;
      starVerts.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.025, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Points(starGeo, starMat));

    // Animation
    let frameId;
    let t = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      t += 0.005;
      earth.rotation.y += 0.0015;
      clouds.rotation.y += 0.0017; // clouds drift slightly faster

      // pulse rings
      pointMarkers.forEach(ring => {
        const p = (t + ring.userData.phase) % (Math.PI * 2);
        const s = 0.8 + 0.6 * Math.abs(Math.sin(p));
        ring.scale.setScalar(s);
        ring.material.opacity = 0.8 - 0.6 * Math.abs(Math.sin(p));
      });

      // pulse arcs
      arcLines.forEach(line => {
        const p = (t * 0.7 + line.userData.phase) % (Math.PI * 2);
        line.material.opacity = 0.15 + 0.3 * Math.abs(Math.sin(p));
      });

      renderer.render(scene, camera);
    };
    animate();

    // Drag to rotate
    let dragging = false, lastX = 0, lastY = 0;
    const onDown  = e => { dragging = true; lastX = e.clientX || e.touches?.[0]?.clientX; lastY = e.clientY || e.touches?.[0]?.clientY; };
    const onUp    = () => { dragging = false; };
    const onMove  = e => {
      if (!dragging) return;
      const x = e.clientX || e.touches?.[0]?.clientX;
      const y = e.clientY || e.touches?.[0]?.clientY;
      earth.rotation.y += (x - lastX) * 0.005;
      earth.rotation.x += (y - lastY) * 0.003;
      lastX = x; lastY = y;
    };
    renderer.domElement.addEventListener("mousedown",  onDown);
    renderer.domElement.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchend",  onUp);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      renderer.domElement.removeEventListener("mousedown",  onDown);
      renderer.domElement.removeEventListener("touchstart", onDown);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchend",  onUp);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [width, height]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}