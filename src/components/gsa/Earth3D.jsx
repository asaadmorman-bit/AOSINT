import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Real satellite orbital data
const SATELLITES = [
  { name: "ISS", inclination: 51.6, altitude: 408, period: 92.9, phase: 0, color: "#00ff88" },
  { name: "NOAA-20", inclination: 98.7, altitude: 824, period: 101.5, phase: 0.3, color: "#00d4ff" },
  { name: "GPS IIF-12", inclination: 55, altitude: 20180, period: 718, phase: 0.7, color: "#ffd600" },
  { name: "Sentinel-2A", inclination: 98.6, altitude: 786, period: 98.9, phase: 0.5, color: "#a855f7" },
  { name: "TerraSAR-X", inclination: 97.4, altitude: 514, period: 94.8, phase: 0.9, color: "#ff6b35" },
  { name: "Landsat 9", inclination: 98.2, altitude: 705, period: 99, phase: 0.2, color: "#00e5ff" },
];

// Calculate satellite position in 3D space
function calculateSatellitePosition(sat, time) {
  const earthRadius = 1;
  const scale = 0.0001; // km to scene units
  const orbitalRadius = earthRadius + sat.altitude * scale;
  
  const n = 1440 / sat.period;
  const M = ((time / 60000) * n * 360 + sat.phase * 360) % 360;
  const rad = M * (Math.PI / 180);
  
  const inc = sat.inclination * (Math.PI / 180);
  
  const x = orbitalRadius * Math.cos(rad);
  const y = orbitalRadius * Math.sin(rad) * Math.sin(inc);
  const z = orbitalRadius * Math.sin(rad) * Math.cos(inc);
  
  return new THREE.Vector3(x, y, z);
}

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat, lng, radius = 1, altitude = 0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const r = radius + altitude;
  
  const x = -r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
}

export default function Earth3D({ events = [], onEventClick, selectedEvent, displayMode, onSceneReady, earthRotation, replayTime = null }) {
  const containerRef = useRef(null);
  const onEventClickRef = useRef(onEventClick);
  useEffect(() => { onEventClickRef.current = onEventClick; }, [onEventClick]);
  const sceneRef = useRef(null);
  const earthRef = useRef(null);
  const cloudsRef = useRef(null);
  const satellitesRef = useRef([]);
  const markersRef = useRef([]);
  const heatmapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const autoRotateRef = useRef(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.01, 1000);
    camera.position.set(0, 0, 2.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Starfield background
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starPositions.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1, sizeAttenuation: false });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Lighting - sun from one side
    const ambientLight = new THREE.AmbientLight(0x222222);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2);
    sunLight.position.set(5, 2, 3);
    scene.add(sunLight);

    // Earth sphere - realistic size
    const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
    
    const textureLoader = new THREE.TextureLoader();
    
    // Create basic material first, then load textures
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x2233ff,
      emissive: 0x112244,
      shininess: 5,
    });

    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earthRef.current = earth;
    scene.add(earth);

    // Load textures asynchronously
    textureLoader.load(
      'https://unpkg.com/three-globe@2.24.9/example/img/earth-blue-marble.jpg',
      (texture) => {
        earthMaterial.map = texture;
        earthMaterial.color.setHex(0xffffff);
        earthMaterial.emissive.setHex(0x000000);
        earthMaterial.needsUpdate = true;
        setLoading(false);
      },
      undefined,
      (error) => {
        console.error('Earth texture failed to load:', error);
        setLoading(false);
      }
    );

    textureLoader.load('https://unpkg.com/three-globe@2.24.9/example/img/earth-topology.png', (texture) => {
      earthMaterial.bumpMap = texture;
      earthMaterial.bumpScale = 0.015;
      earthMaterial.needsUpdate = true;
    });

    textureLoader.load('https://unpkg.com/three-globe@2.24.9/example/img/earth-water.png', (texture) => {
      earthMaterial.specularMap = texture;
      earthMaterial.specular = new THREE.Color(0x333333);
      earthMaterial.needsUpdate = true;
    });

    // Cloud layer
    const cloudsGeometry = new THREE.SphereGeometry(1.01, 64, 64);
    const cloudsMaterial = new THREE.MeshPhongMaterial({
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    cloudsRef.current = clouds;
    scene.add(clouds);

    textureLoader.load('https://unpkg.com/three-globe@2.24.9/example/img/earth-clouds.png', (texture) => {
      cloudsMaterial.map = texture;
      cloudsMaterial.needsUpdate = true;
    });

    // Atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(1.12, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Create heatmap layer
    const heatmapGeometry = new THREE.SphereGeometry(1.005, 64, 64);
    const heatmapMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const heatmap = new THREE.Mesh(heatmapGeometry, heatmapMaterial);
    heatmapRef.current = heatmap;
    scene.add(heatmap);

    // Notify parent that scene is ready
    if (onSceneReady) {
      onSceneReady(scene);
    }

    // Satellites
    SATELLITES.forEach((sat) => {
      const satGeometry = new THREE.SphereGeometry(0.01, 8, 8);
      const satMaterial = new THREE.MeshBasicMaterial({ color: sat.color });
      const satMesh = new THREE.Mesh(satGeometry, satMaterial);
      
      // Orbital path
      const orbitPoints = [];
      for (let i = 0; i <= 360; i += 3) {
        const tempSat = { ...sat, phase: i / 360 };
        const pos = calculateSatellitePosition(tempSat, 0);
        orbitPoints.push(pos);
      }
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: sat.color, 
        opacity: 0.15, 
        transparent: true,
        linewidth: 1
      });
      const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
      scene.add(orbit);
      
      scene.add(satMesh);
      satellitesRef.current.push({ mesh: satMesh, data: sat, orbit });
    });

    // Mouse controls for rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let clickStartPos = { x: 0, y: 0 };
    let wasDragging = false;

    const onMouseDown = (e) => {
      clickStartPos = { x: e.clientX, y: e.clientY };
      isDragging = true;
      wasDragging = false;
      autoRotateRef.current = false;
      setAutoRotate(false);
      previousMousePosition = { x: e.clientX, y: e.clientY };
      renderer.domElement.style.cursor = 'grabbing';
    };

    const onMouseMove = (e) => {
      if (!isDragging) {
        renderer.domElement.style.cursor = 'grab';
        return;
      }
      wasDragging = true;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      
      if (earthRef.current) {
        earthRef.current.rotation.y += deltaX * 0.005;
        earthRef.current.rotation.x += deltaY * 0.005;
        earthRef.current.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, earthRef.current.rotation.x));
      }
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      renderer.domElement.style.cursor = 'grab';
    };

    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.002;
      camera.position.z = Math.max(1.5, Math.min(5, camera.position.z));
    };

    // Click detection for markers
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e) => {
      // Check if this was a drag (movement > 5px means drag, not click)
      const deltaX = Math.abs(e.clientX - clickStartPos.x);
      const deltaY = Math.abs(e.clientY - clickStartPos.y);
      if (wasDragging || deltaX > 5 || deltaY > 5) {
        wasDragging = false;
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const markerMeshes = markersRef.current.map(m => m.mesh);
      const intersects = raycaster.intersectObjects(markerMeshes, false);

      if (intersects.length > 0) {
        const clickedMarker = markersRef.current.find(m => m.mesh === intersects[0].object);
        if (clickedMarker && onEventClickRef.current) {
          onEventClickRef.current(clickedMarker.event);
        }
      }
    };

    // Touch events for mobile
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        clickStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        isDragging = true;
        wasDragging = false;
        autoRotateRef.current = false;
        setAutoRotate(false);
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      e.preventDefault();
      wasDragging = true;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;
      
      if (earthRef.current) {
        earthRef.current.rotation.y += deltaX * 0.005;
        earthRef.current.rotation.x += deltaY * 0.005;
        earthRef.current.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, earthRef.current.rotation.x));
      }
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = (e) => {
      if (!wasDragging && e.changedTouches.length > 0) {
        // Treat as a tap/click
        const touch = e.changedTouches[0];
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(
          markersRef.current.map((m) => m.mesh),
          false
        );

        if (intersects.length > 0 && onEventClickRef.current) {
          const clickedMarker = markersRef.current.find(
            (m) => m.mesh === intersects[0].object
          );
          if (clickedMarker) {
            onEventClickRef.current(clickedMarker.event);
          }
        }
      }
      isDragging = false;
      wasDragging = false;
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("mouseleave", onMouseUp);
    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.addEventListener("wheel", onWheel);
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: false });
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: false });
    renderer.domElement.addEventListener("touchend", onTouchEnd);
    renderer.domElement.addEventListener("touchcancel", onTouchEnd);
    renderer.domElement.style.cursor = 'grab';

    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Auto-rotate Earth slowly when not dragging and autoRotate is enabled
      if (!isDragging && autoRotateRef.current && earthRef.current) {
        earthRef.current.rotation.y += 0.0005;
      }

      // Rotate clouds slightly faster
      if (cloudsRef.current && earthRef.current) {
        cloudsRef.current.rotation.copy(earthRef.current.rotation);
        cloudsRef.current.rotation.y += 0.0002;
      }

      // Sync heatmap rotation with Earth
      if (heatmapRef.current && earthRef.current) {
        heatmapRef.current.rotation.copy(earthRef.current.rotation);
      }

      // Provide rotation to parent for overlays
      if (earthRef.current && earthRotation !== earthRef.current.rotation) {
        if (typeof earthRotation === 'function') {
          earthRotation(earthRef.current.rotation);
        }
      }

      // Update satellite positions
      const currentTime = Date.now();
      satellitesRef.current.forEach(({ mesh, data, orbit }) => {
        const pos = calculateSatellitePosition(data, currentTime);
        mesh.position.copy(pos);
        
        // Sync orbit rotation with Earth
        if (earthRef.current) {
          orbit.rotation.copy(earthRef.current.rotation);
        }
      });

      // Update event markers - rotate with Earth
      markersRef.current.forEach(({ mesh, lat, lng, originalPos }) => {
        // Apply Earth's rotation to the original position
        if (earthRef.current) {
          const rotatedPos = originalPos.clone();
          rotatedPos.applyEuler(earthRef.current.rotation);
          mesh.position.copy(rotatedPos);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("mouseleave", onMouseUp);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      renderer.domElement.removeEventListener("touchmove", onTouchMove);
      renderer.domElement.removeEventListener("touchend", onTouchEnd);
      renderer.domElement.removeEventListener("touchcancel", onTouchEnd);
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Generate heatmap texture from events
  useEffect(() => {
    if (!events.length || !heatmapRef.current) return;

    // Create canvas for heatmap
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Aggregate threats by region (simplified grid)
    const gridSize = 32;
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
    const severityWeights = { critical: 10, high: 5, medium: 2, low: 1 };

    events.forEach(event => {
      if (!event.lat || !event.lng) return;
      const x = Math.floor(((event.lng + 180) / 360) * gridSize);
      const y = Math.floor(((90 - event.lat) / 180) * gridSize);
      const weight = severityWeights[event.severity] || 1;
      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        grid[y][x] += weight;
      }
    });

    // Find max for normalization
    const maxVal = Math.max(...grid.flat());

    // Draw heatmap
    grid.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val === 0) return;
        const intensity = val / maxVal;
        const radius = (canvas.width / gridSize) * 1.5 * intensity;
        const cx = (x / gridSize) * canvas.width;
        const cy = (y / gridSize) * canvas.height;

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        if (intensity > 0.7) {
          gradient.addColorStop(0, 'rgba(255, 23, 68, 0.6)');
          gradient.addColorStop(1, 'rgba(255, 23, 68, 0)');
        } else if (intensity > 0.4) {
          gradient.addColorStop(0, 'rgba(255, 109, 0, 0.5)');
          gradient.addColorStop(1, 'rgba(255, 109, 0, 0)');
        } else {
          gradient.addColorStop(0, 'rgba(255, 214, 0, 0.4)');
          gradient.addColorStop(1, 'rgba(255, 214, 0, 0)');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      });
    });

    // Apply texture to heatmap mesh
    const texture = new THREE.CanvasTexture(canvas);
    heatmapRef.current.material.map = texture;
    heatmapRef.current.material.opacity = 0.6;
    heatmapRef.current.material.needsUpdate = true;
  }, [events]);

  // Update event markers when events change
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear old markers
    markersRef.current.forEach(({ mesh }) => sceneRef.current.remove(mesh));
    markersRef.current = [];

    // Filter events by replay time if active
    const visibleEvents = replayTime
      ? events.filter(e => {
          const timestamp = new Date(e.timestamp || e.occurred_at || e.created_date).getTime();
          return timestamp <= replayTime;
        })
      : events;

    // Add new markers
    visibleEvents.forEach((event) => {
      if (!event.lat || !event.lng) return;

      const markerGeometry = new THREE.SphereGeometry(0.025, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: event.severity === "critical" ? 0xff1744 : event.severity === "high" ? 0xff6d00 : 0xffd600,
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);

      // Calculate original position on Earth surface
      const originalPos = latLngToVector3(event.lat, event.lng, 1, 0.02);
      marker.position.copy(originalPos);

      // Pulsing effect
      const scale = event.severity === "critical" ? 1.5 : 1;
      marker.scale.set(scale, scale, scale);

      // Add glow ring for clickable markers
      const ringGeometry = new THREE.RingGeometry(0.018, 0.022, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: event.severity === "critical" ? 0xff1744 : event.severity === "high" ? 0xff6d00 : 0xffd600,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.lookAt(0, 0, 0);
      marker.add(ring);

      sceneRef.current.add(marker);
      markersRef.current.push({ mesh: marker, lat: event.lat, lng: event.lng, event, originalPos });
    });
  }, [events, replayTime]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#020509] z-10">
          <div className="text-[#00e5ff] text-xs font-mono animate-pulse">RENDERING EARTH...</div>
        </div>
      )}
      {!loading && (
        <button
          onClick={() => {
            autoRotateRef.current = !autoRotateRef.current;
            setAutoRotate(!autoRotate);
          }}
          className="absolute top-3 right-3 z-20 px-3 py-1.5 bg-[#0d1220]/90 border border-white/10 hover:border-[#00d4ff]/40 rounded-lg text-xs font-mono text-gray-400 hover:text-[#00d4ff] transition-all"
        >
          {autoRotate ? '🔓 AUTO-ROTATE' : '🔒 LOCKED'}
        </button>
      )}
    </div>
  );
}