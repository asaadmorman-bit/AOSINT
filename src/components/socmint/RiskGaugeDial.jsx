import React from "react";

const LEVELS = [
  { max: 25,  label: "LOW",      color: "#00ff41" },
  { max: 50,  label: "MEDIUM",   color: "#ffa502" },
  { max: 75,  label: "HIGH",     color: "#ff6b35" },
  { max: 100, label: "CRITICAL", color: "#ff4757" },
];

function getColor(score) {
  return LEVELS.find(l => score <= l.max)?.color || "#ff4757";
}
function getLabel(score) {
  return LEVELS.find(l => score <= l.max)?.label || "CRITICAL";
}

export default function RiskGaugeDial({ score = 0 }) {
  const radius = 60;
  const cx = 80, cy = 80;
  const startAngle = 210;
  const sweep = 120;
  const angle = startAngle + (score / 100) * sweep * 2;
  const toRad = d => (d * Math.PI) / 180;
  const arcEnd = (pct) => {
    const a = startAngle + pct * sweep * 2;
    return { x: cx + radius * Math.cos(toRad(a)), y: cy + radius * Math.sin(toRad(a)) };
  };
  const s = { x: cx + radius * Math.cos(toRad(startAngle)), y: cy + radius * Math.sin(toRad(startAngle)) };
  const e = { x: cx + radius * Math.cos(toRad(startAngle + sweep * 2)), y: cy + radius * Math.sin(toRad(startAngle + sweep * 2)) };
  const needleEnd = { x: cx + (radius - 8) * Math.cos(toRad(angle)), y: cy + (radius - 8) * Math.sin(toRad(angle)) };
  const color = getColor(score);
  const label = getLabel(score);

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="110" viewBox="0 0 160 110">
        {/* Background arc */}
        <path d={`M ${s.x} ${s.y} A ${radius} ${radius} 0 1 1 ${e.x} ${e.y}`}
          fill="none" stroke="#1a2a1a" strokeWidth="10" strokeLinecap="round" />
        {/* Colored segments */}
        {LEVELS.map((lv, i) => {
          const from = i === 0 ? 0 : LEVELS[i-1].max;
          const p1 = arcEnd(from / 100);
          const p2 = arcEnd(lv.max / 100);
          const large = (lv.max - from) / 100 * sweep * 2 > 180 ? 1 : 0;
          return (
            <path key={lv.label}
              d={`M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${large} 1 ${p2.x} ${p2.y}`}
              fill="none" stroke={lv.color} strokeWidth="6" strokeLinecap="round" opacity="0.25" />
          );
        })}
        {/* Active arc */}
        {score > 0 && (() => {
          const p2 = arcEnd(score / 100);
          const large = (score / 100) * sweep * 2 > 180 ? 1 : 0;
          return <path d={`M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${p2.x} ${p2.y}`}
            fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }} />;
        })()}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleEnd.x} y2={needleEnd.y} stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill={color} />
        {/* Score */}
        <text x={cx} y={cy + 20} textAnchor="middle" fill={color} fontSize="18" fontWeight="900" fontFamily="monospace">{score}</text>
        <text x={cx} y={cy + 32} textAnchor="middle" fill={color} fontSize="7" fontFamily="monospace" letterSpacing="2">{label}</text>
      </svg>
      <div className="text-[9px] font-black tracking-widest mt-1" style={{ color }}>RISK SCORE</div>
    </div>
  );
}