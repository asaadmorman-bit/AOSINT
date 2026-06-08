import React from "react";
import { Server } from "lucide-react";

const SECTORS = ["Finance", "Energy", "Healthcare", "Government", "Defense", "Transport", "Telecom", "Manufacturing"];
const REGIONS = ["Americas", "EMEA", "APAC"];

function getHeat(assets, events, sector, region) {
  const sectorAssets = assets.filter(a => a.tags?.some(t => t.toLowerCase().includes(sector.toLowerCase())));
  const sectorEvents = events.filter(e => e.sectors_affected?.some(s => s.toLowerCase().includes(sector.toLowerCase())));
  const base = Math.random();
  return Math.min(100, sectorAssets.length * 10 + sectorEvents.length * 15 + base * 30);
}

function heatColor(val) {
  if (val >= 70) return { bg: "rgba(255,71,87,0.35)", text: "#ff4757" };
  if (val >= 45) return { bg: "rgba(255,165,2,0.25)", text: "#ffa502" };
  if (val >= 20) return { bg: "rgba(0,212,255,0.15)", text: "#00d4ff" };
  return { bg: "rgba(255,255,255,0.03)", text: "#4b5563" };
}

export default function SectorHeatmap({ assets, events, userTier }) {
  return (
    <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Server className="w-4 h-4 text-[#ffa502]" />
        <h3 className="text-sm font-bold text-white">Sector Vulnerability Heatmap</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr>
              <th className="text-left text-gray-600 py-1.5 pr-3 font-normal w-28">Sector</th>
              {REGIONS.map(r => <th key={r} className="text-center text-gray-600 py-1.5 px-2 font-normal">{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {SECTORS.map(sector => (
              <tr key={sector}>
                <td className="pr-3 py-1 text-gray-400 font-medium whitespace-nowrap">{sector}</td>
                {REGIONS.map(region => {
                  const val = getHeat(assets, events, sector, region);
                  const { bg, text } = heatColor(val);
                  return (
                    <td key={region} className="px-1 py-1">
                      <div className="rounded-lg py-1.5 px-2 text-center transition-all hover:scale-105 cursor-default"
                        style={{ background: bg }}>
                        <span className="font-bold font-mono" style={{ color: text }}>{val.toFixed(0)}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-3 text-[9px] text-gray-600">
        <span style={{ color: "#ff4757" }}>■ Critical ≥70</span>
        <span style={{ color: "#ffa502" }}>■ High ≥45</span>
        <span style={{ color: "#00d4ff" }}>■ Medium ≥20</span>
        <span className="text-gray-700">■ Low</span>
      </div>
    </div>
  );
}