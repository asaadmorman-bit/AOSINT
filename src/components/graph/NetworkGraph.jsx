import React, { useEffect, useRef, useState, useCallback } from "react";

const NODE_COLORS = {
  entity: "#00d4ff",
  threat_actor: "#ff4757",
  campaign: "#ffa502",
  indicator: "#a855f7",
};

const NODE_RADIUS = { entity: 18, threat_actor: 22, campaign: 20, indicator: 14 };

function buildGraph(entities, actors, campaigns, indicators) {
  const nodes = [];
  const links = [];

  entities.slice(0, 15).forEach(e => nodes.push({ id: `e-${e.id}`, label: e.name, type: "entity", raw: e }));
  actors.slice(0, 10).forEach(a => nodes.push({ id: `a-${a.id}`, label: a.name, type: "threat_actor", raw: a }));
  campaigns.slice(0, 10).forEach(c => {
    nodes.push({ id: `c-${c.id}`, label: c.name, type: "campaign", raw: c });
    // Link campaigns to actors
    (c.associated_actors || []).forEach(actorName => {
      const actor = actors.find(a => a.name === actorName || a.id === actorName);
      if (actor) links.push({ source: `c-${c.id}`, target: `a-${actor.id}` });
    });
  });
  indicators.slice(0, 20).forEach(i => {
    nodes.push({ id: `i-${i.id}`, label: i.title || i.value, type: "indicator", raw: i });
    // Link indicators to actors
    (i.related_actors || []).forEach(actorName => {
      const actor = actors.find(a => a.name === actorName || a.id === actorName);
      if (actor) links.push({ source: `i-${i.id}`, target: `a-${actor.id}` });
    });
  });

  return { nodes, links };
}

function useForceSimulation(nodes, links, width, height) {
  const posRef = useRef({});
  const velRef = useRef({});
  const [positions, setPositions] = useState({});

  useEffect(() => {
    if (!nodes.length) return;
    // Initialize positions randomly
    const pos = {};
    const vel = {};
    nodes.forEach((n, i) => {
      if (!posRef.current[n.id]) {
        const angle = (i / nodes.length) * Math.PI * 2;
        const r = Math.min(width, height) * 0.3;
        pos[n.id] = { x: width / 2 + r * Math.cos(angle), y: height / 2 + r * Math.sin(angle) };
        vel[n.id] = { x: 0, y: 0 };
      } else {
        pos[n.id] = posRef.current[n.id];
        vel[n.id] = { x: 0, y: 0 };
      }
    });
    posRef.current = pos;
    velRef.current = vel;

    let frame;
    let alpha = 1;

    const tick = () => {
      if (alpha < 0.01) return;
      alpha *= 0.985;
      const p = posRef.current;
      const v = velRef.current;
      const nodeIds = Object.keys(p);

      // Repulsion
      for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
          const a = nodeIds[i], b = nodeIds[j];
          const dx = p[b].x - p[a].x, dy = p[b].y - p[a].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (8000 / (dist * dist)) * alpha;
          v[a].x -= (dx / dist) * force;
          v[a].y -= (dy / dist) * force;
          v[b].x += (dx / dist) * force;
          v[b].y += (dy / dist) * force;
        }
      }

      // Attraction along links
      links.forEach(l => {
        const a = p[l.source], b = p[l.target];
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ideal = 120;
        const force = ((dist - ideal) / dist) * 0.05 * alpha;
        v[l.source].x += dx * force;
        v[l.source].y += dy * force;
        v[l.target].x -= dx * force;
        v[l.target].y -= dy * force;
      });

      // Gravity to center
      nodeIds.forEach(id => {
        v[id].x += (width / 2 - p[id].x) * 0.003 * alpha;
        v[id].y += (height / 2 - p[id].y) * 0.003 * alpha;
      });

      // Apply velocity with damping
      nodeIds.forEach(id => {
        v[id].x *= 0.8;
        v[id].y *= 0.8;
        p[id].x += v[id].x;
        p[id].y += v[id].y;
        p[id].x = Math.max(30, Math.min(width - 30, p[id].x));
        p[id].y = Math.max(30, Math.min(height - 30, p[id].y));
      });

      setPositions({ ...p });
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [nodes.length, links.length, width, height]);

  return [positions, posRef];
}

export default function NetworkGraph({ entities = [], actors = [], campaigns = [], indicators = [] }) {
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const svgRef = useRef();
  const W = 800, H = 560;

  const { nodes, links } = buildGraph(entities, actors, campaigns, indicators);
  const [positions, posRef] = useForceSimulation(nodes, links, W, H);

  const handleMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setDragging(nodeId);
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    posRef.current[dragging] = { x, y };
  }, [dragging]);

  const handleMouseUp = () => setDragging(null);

  const legendItems = [
    { type: "entity", label: "Entity" },
    { type: "threat_actor", label: "Threat Actor" },
    { type: "campaign", label: "Campaign" },
    { type: "indicator", label: "Indicator" },
  ];

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 px-2">
        {legendItems.map(l => (
          <div key={l.type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: NODE_COLORS[l.type] }} />
            <span className="text-xs text-gray-400">{l.label} ({
              l.type === "entity" ? entities.length :
              l.type === "threat_actor" ? actors.length :
              l.type === "campaign" ? campaigns.length :
              indicators.length
            })</span>
          </div>
        ))}
      </div>

      <div className="relative bg-[#07091a] rounded-xl border border-white/10 overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 480, cursor: dragging ? "grabbing" : "default" }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <radialGradient key={type} id={`grad-${type}`} cx="35%" cy="35%">
                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={color} stopOpacity="0.3" />
              </radialGradient>
            ))}
          </defs>

          {/* Grid */}
          <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
          <rect width={W} height={H} fill="url(#grid)" />

          {/* Links */}
          {links.map((l, i) => {
            const src = positions[l.source], tgt = positions[l.target];
            if (!src || !tgt) return null;
            return (
              <line
                key={i}
                x1={src.x} y1={src.y}
                x2={tgt.x} y2={tgt.y}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const pos = positions[node.id];
            if (!pos) return null;
            const color = NODE_COLORS[node.type];
            const r = NODE_RADIUS[node.type] || 16;
            const isSelected = selected?.id === node.id;
            return (
              <g
                key={node.id}
                transform={`translate(${pos.x},${pos.y})`}
                style={{ cursor: "grab" }}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onClick={() => setSelected(isSelected ? null : node)}
              >
                {isSelected && (
                  <circle r={r + 8} fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 3" opacity="0.6" />
                )}
                <circle r={r} fill={`url(#grad-${node.type})`} stroke={color} strokeWidth={isSelected ? 2 : 1} opacity="0.95" />
                <text
                  textAnchor="middle"
                  dy={r + 12}
                  fontSize="9"
                  fill="rgba(255,255,255,0.7)"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {node.label?.substring(0, 14)}{node.label?.length > 14 ? "…" : ""}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected panel */}
        {selected && (
          <div className="absolute top-3 right-3 bg-[#0d1220]/95 border border-white/10 rounded-lg p-4 w-64 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: NODE_COLORS[selected.type] }} />
              <p className="text-xs font-bold text-white truncate">{selected.label}</p>
            </div>
            <p className="text-[10px] text-gray-500 uppercase mb-2">{selected.type.replace(/_/g, " ")}</p>
            {selected.raw && (
              <div className="space-y-1.5 text-xs text-gray-400">
                {selected.raw.risk_level && <p>Risk: <span className="text-white capitalize">{selected.raw.risk_level}</span></p>}
                {selected.raw.status && <p>Status: <span className="text-white capitalize">{selected.raw.status}</span></p>}
                {selected.raw.severity && <p>Severity: <span className="text-white capitalize">{selected.raw.severity}</span></p>}
                {selected.raw.actor_type && <p>Type: <span className="text-white capitalize">{selected.raw.actor_type}</span></p>}
                {selected.raw.campaign_type && <p>Campaign Type: <span className="text-white capitalize">{selected.raw.campaign_type}</span></p>}
                {selected.raw.attributed_country && <p>Origin: <span className="text-white">{selected.raw.attributed_country}</span></p>}
              </div>
            )}
            <button className="mt-3 text-[10px] text-gray-600 hover:text-gray-400" onClick={() => setSelected(null)}>Dismiss</button>
          </div>
        )}

        <div className="absolute bottom-3 left-3 text-[9px] text-gray-700">
          {nodes.length} nodes · {links.length} connections · drag to explore
        </div>
      </div>
    </div>
  );
}