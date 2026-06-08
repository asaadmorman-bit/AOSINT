import { useEffect, useRef } from "react";
import * as THREE from "three";

// Convert lat/lng to 3D coordinates on sphere
function latLngToVector3(lat, lng, radius = 2.05) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Create hexagonal grid cells for global coverage
function generateHexGrid(resolution = 15) {
  const cells = [];
  const latStep = 180 / resolution;
  const lngStep = 360 / resolution;
  
  for (let lat = -90 + latStep / 2; lat < 90; lat += latStep) {
    const lngCount = Math.max(3, Math.floor((360 * Math.cos(lat * Math.PI / 180)) / lngStep));
    const adjustedLngStep = 360 / lngCount;
    
    for (let lng = -180; lng < 180; lng += adjustedLngStep) {
      cells.push({ lat, lng, count: 0, domains: {} });
    }
  }
  
  return cells;
}

// Calculate threat density per grid cell
function calculateHeatmap(events, gridCells, domain = "all") {
  const filteredEvents = domain === "all" 
    ? events 
    : events.filter(e => e.domain === domain || e._layer === domain);
  
  const densityMap = gridCells.map(cell => ({ ...cell, count: 0, domains: {} }));
  
  filteredEvents.forEach(event => {
    if (!event.lat || !event.lng) return;
    
    // Find nearest grid cell
    let minDist = Infinity;
    let nearestIdx = 0;
    
    densityMap.forEach((cell, idx) => {
      const dist = Math.sqrt(
        Math.pow(event.lat - cell.lat, 2) + 
        Math.pow(event.lng - cell.lng, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = idx;
      }
    });
    
    densityMap[nearestIdx].count++;
    const eventDomain = event.domain || event._layer || "unknown";
    densityMap[nearestIdx].domains[eventDomain] = 
      (densityMap[nearestIdx].domains[eventDomain] || 0) + 1;
  });
  
  return densityMap;
}

// Get color based on density and domain
function getDensityColor(count, maxCount, domain) {
  const intensity = Math.min(1, count / Math.max(1, maxCount));
  
  const domainColors = {
    cyber: { r: 0, g: 229, b: 255 },        // #00e5ff
    physical: { r: 255, g: 82, b: 82 },     // #ff5252
    geopolitical: { r: 255, g: 23, b: 68 }, // #ff1744
    influence: { r: 168, g: 85, b: 247 },   // #a855f7
    hybrid: { r: 255, g: 145, b: 0 },       // #ff9100
    all: { r: 255, g: 214, b: 0 },          // #ffd600
  };
  
  const color = domainColors[domain] || domainColors.all;
  
  return new THREE.Color(
    color.r / 255,
    color.g / 255,
    color.b / 255
  ).multiplyScalar(0.3 + intensity * 0.7);
}

export default function ThreatHeatmapLayer({ 
  scene, 
  events = [], 
  enabled = false, 
  domain = "all",
  earthRotation 
}) {
  const heatmapRef = useRef(null);
  const gridCellsRef = useRef(generateHexGrid(18));
  
  useEffect(() => {
    if (!scene || !enabled) {
      // Clean up existing heatmap
      if (heatmapRef.current) {
        scene.remove(heatmapRef.current);
        heatmapRef.current.geometry.dispose();
        heatmapRef.current.material.dispose();
        heatmapRef.current = null;
      }
      return;
    }
    
    // Calculate heatmap data
    const heatmapData = calculateHeatmap(events, gridCellsRef.current, domain);
    const maxCount = Math.max(...heatmapData.map(cell => cell.count), 1);
    
    // Create or update heatmap mesh
    if (heatmapRef.current) {
      scene.remove(heatmapRef.current);
      heatmapRef.current.geometry.dispose();
      heatmapRef.current.material.dispose();
    }
    
    const positions = [];
    const colors = [];
    const sizes = [];
    
    heatmapData.forEach(cell => {
      if (cell.count === 0) return;
      
      const pos = latLngToVector3(cell.lat, cell.lng, 2.06);
      positions.push(pos.x, pos.y, pos.z);
      
      const color = getDensityColor(cell.count, maxCount, domain);
      colors.push(color.r, color.g, color.b);
      
      const size = 15 + (cell.count / maxCount) * 25;
      sizes.push(size);
    });
    
    if (positions.length === 0) return;
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        opacity: { value: 0.6 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying vec3 vColor;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          if (dist > 0.5) discard;
          
          float intensity = 1.0 - (dist * 2.0);
          intensity = pow(intensity, 2.0);
          
          gl_FragColor = vec4(vColor, intensity * opacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    
    const heatmap = new THREE.Points(geometry, material);
    scene.add(heatmap);
    heatmapRef.current = heatmap;
    
    return () => {
      if (heatmapRef.current) {
        scene.remove(heatmapRef.current);
        heatmapRef.current.geometry.dispose();
        heatmapRef.current.material.dispose();
        heatmapRef.current = null;
      }
    };
  }, [scene, events, enabled, domain]);
  
  // Sync rotation with Earth
  useEffect(() => {
    if (!heatmapRef.current || !earthRotation) return;
    heatmapRef.current.rotation.y = earthRotation.y;
  }, [earthRotation]);
  
  return null;
}