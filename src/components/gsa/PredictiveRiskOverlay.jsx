import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// Define geographical regions with bounding boxes
const REGIONS = [
  { name: "Eastern Europe", lat: 50, lng: 30, radius: 15, color: 0xff1744 },
  { name: "Middle East", lat: 32, lng: 45, radius: 12, color: 0xff6d00 },
  { name: "South China Sea", lat: 15, lng: 115, radius: 10, color: 0xffd600 },
  { name: "Horn of Africa", lat: 8, lng: 45, radius: 8, color: 0xff9100 },
  { name: "Korean Peninsula", lat: 38, lng: 127, radius: 6, color: 0xff4757 },
  { name: "Taiwan Strait", lat: 25, lng: 120, radius: 5, color: 0xff6b35 },
  { name: "Kashmir", lat: 34, lng: 75, radius: 5, color: 0xffa726 },
  { name: "Sahel Region", lat: 15, lng: 5, radius: 12, color: 0xff7043 },
];

// Convert lat/lng to 3D position
function latLngToVector3(lat, lng, radius = 1, altitude = 0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const r = radius + altitude;
  
  const x = -r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
}

// Calculate risk score based on historical event patterns
function calculateRiskScore(events, region) {
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  
  // Filter events near this region
  const regionalEvents = events.filter(e => {
    if (!e.lat || !e.lng) return false;
    const distance = Math.sqrt(
      Math.pow(e.lat - region.lat, 2) + Math.pow(e.lng - region.lng, 2)
    );
    return distance <= region.radius;
  });
  
  // Recent events (last 7 days)
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  const recentEvents = regionalEvents.filter(e => {
    const timestamp = new Date(e.timestamp || e.occurred_at || e.created_date).getTime();
    return timestamp >= sevenDaysAgo;
  });
  
  // Historical events (8-30 days ago)
  const historicalEvents = regionalEvents.filter(e => {
    const timestamp = new Date(e.timestamp || e.occurred_at || e.created_date).getTime();
    return timestamp >= thirtyDaysAgo && timestamp < sevenDaysAgo;
  });
  
  // Calculate trend: increasing, stable, or decreasing
  const recentCount = recentEvents.length;
  const historicalAvg = historicalEvents.length / 3; // Average per week
  const trend = recentCount - historicalAvg;
  
  // Weight by severity
  const severityWeight = {
    critical: 5,
    high: 3,
    medium: 2,
    low: 1,
    informational: 0.5
  };
  
  const weightedScore = recentEvents.reduce((sum, e) => {
    return sum + (severityWeight[e.severity] || 1);
  }, 0);
  
  // Risk score: 0-100
  const baseScore = Math.min(100, weightedScore * 2);
  const trendBoost = trend > 0 ? Math.min(30, trend * 5) : 0;
  
  return {
    score: Math.min(100, baseScore + trendBoost),
    trend: trend > 2 ? "increasing" : trend < -2 ? "decreasing" : "stable",
    recentCount,
    historicalCount: historicalEvents.length,
    criticalCount: recentEvents.filter(e => e.severity === "critical").length
  };
}

export default function PredictiveRiskOverlay({ scene, earthRotation, events = [], enabled = true, replayTime = null }) {
  const overlaysRef = useRef([]);
  
  useEffect(() => {
    if (!scene || !enabled) {
      // Remove overlays if disabled
      overlaysRef.current.forEach(({ mesh, ring }) => {
        scene.remove(mesh);
        scene.remove(ring);
      });
      overlaysRef.current = [];
      return;
    }
    
    // Clear existing overlays
    overlaysRef.current.forEach(({ mesh, ring }) => {
      scene.remove(mesh);
      scene.remove(ring);
    });
    overlaysRef.current = [];
    
    // Filter events by replay time if active
    const filteredEvents = replayTime 
      ? events.filter(e => {
          const timestamp = new Date(e.timestamp || e.occurred_at || e.created_date).getTime();
          return timestamp <= replayTime;
        })
      : events;
    
    // Create risk overlays for each region
    REGIONS.forEach(region => {
      const riskAnalysis = calculateRiskScore(filteredEvents, region);
      
      // Only show regions with meaningful risk scores
      if (riskAnalysis.score < 20) return;
      
      const position = latLngToVector3(region.lat, region.lng, 1, 0.03);
      
      // Risk intensity indicator (cone/spike)
      const height = 0.05 + (riskAnalysis.score / 100) * 0.15;
      const coneGeometry = new THREE.ConeGeometry(0.02, height, 8);
      const coneMaterial = new THREE.MeshBasicMaterial({
        color: region.color,
        transparent: true,
        opacity: 0.6 + (riskAnalysis.score / 200)
      });
      const cone = new THREE.Mesh(coneGeometry, coneMaterial);
      cone.position.copy(position);
      cone.lookAt(0, 0, 0);
      cone.rotateX(Math.PI);
      
      // Pulsing ring for high-risk areas
      const ringSize = 0.03 + (riskAnalysis.score / 100) * 0.04;
      const ringGeometry = new THREE.RingGeometry(ringSize, ringSize + 0.01, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: region.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(position);
      ring.lookAt(0, 0, 0);
      
      scene.add(cone);
      scene.add(ring);
      
      overlaysRef.current.push({
        mesh: cone,
        ring,
        region,
        riskAnalysis,
        originalPos: position.clone(),
        pulsePhase: Math.random() * Math.PI * 2
      });
    });
  }, [scene, events, enabled]);
  
  // Animation loop for pulsing and rotation sync
  useEffect(() => {
    if (!enabled || overlaysRef.current.length === 0) return;
    
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      
      overlaysRef.current.forEach(({ mesh, ring, originalPos, pulsePhase, riskAnalysis }) => {
        // Sync rotation with Earth
        if (earthRotation) {
          const rotatedPos = originalPos.clone();
          rotatedPos.applyEuler(earthRotation);
          mesh.position.copy(rotatedPos);
          mesh.lookAt(0, 0, 0);
          mesh.rotateX(Math.PI);
          ring.position.copy(rotatedPos);
          ring.lookAt(0, 0, 0);
        }
        
        // Pulsing effect based on risk trend
        if (riskAnalysis.trend === "increasing") {
          const pulse = 0.8 + Math.sin(time * 3 + pulsePhase) * 0.2;
          ring.scale.set(pulse, pulse, 1);
          ring.material.opacity = 0.3 + Math.sin(time * 3 + pulsePhase) * 0.2;
        }
      });
    };
    
    animate();
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [enabled, earthRotation]);
  
  return null;
}