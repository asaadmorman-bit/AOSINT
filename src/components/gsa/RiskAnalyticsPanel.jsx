import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const REGIONS = [
  { name: "Eastern Europe", lat: 50, lng: 30, radius: 15 },
  { name: "Middle East", lat: 32, lng: 45, radius: 12 },
  { name: "South China Sea", lat: 15, lng: 115, radius: 10 },
  { name: "Horn of Africa", lat: 8, lng: 45, radius: 8 },
  { name: "Korean Peninsula", lat: 38, lng: 127, radius: 6 },
  { name: "Taiwan Strait", lat: 25, lng: 120, radius: 5 },
  { name: "Kashmir", lat: 34, lng: 75, radius: 5 },
  { name: "Sahel Region", lat: 15, lng: 5, radius: 12 },
];

function calculateRiskAnalysis(events, region) {
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  
  const regionalEvents = events.filter(e => {
    if (!e.lat || !e.lng) return false;
    const distance = Math.sqrt(
      Math.pow(e.lat - region.lat, 2) + Math.pow(e.lng - region.lng, 2)
    );
    return distance <= region.radius;
  });
  
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  const recentEvents = regionalEvents.filter(e => {
    const timestamp = new Date(e.timestamp || e.occurred_at || e.created_date).getTime();
    return timestamp >= sevenDaysAgo;
  });
  
  const historicalEvents = regionalEvents.filter(e => {
    const timestamp = new Date(e.timestamp || e.occurred_at || e.created_date).getTime();
    return timestamp >= thirtyDaysAgo && timestamp < sevenDaysAgo;
  });
  
  const recentCount = recentEvents.length;
  const historicalAvg = historicalEvents.length / 3;
  const trend = recentCount - historicalAvg;
  
  const severityWeight = { critical: 5, high: 3, medium: 2, low: 1, informational: 0.5 };
  const weightedScore = recentEvents.reduce((sum, e) => sum + (severityWeight[e.severity] || 1), 0);
  const baseScore = Math.min(100, weightedScore * 2);
  const trendBoost = trend > 0 ? Math.min(30, trend * 5) : 0;
  
  return {
    score: Math.min(100, baseScore + trendBoost),
    trend: trend > 2 ? "increasing" : trend < -2 ? "decreasing" : "stable",
    recentCount,
    historicalCount: historicalEvents.length,
    criticalCount: recentEvents.filter(e => e.severity === "critical").length,
    trendValue: trend
  };
}

export default function RiskAnalyticsPanel({ events = [] }) {
  const regionalRisks = useMemo(() => {
    return REGIONS.map(region => ({
      ...region,
      analysis: calculateRiskAnalysis(events, region)
    }))
    .filter(r => r.analysis.score >= 20)
    .sort((a, b) => b.analysis.score - a.analysis.score);
  }, [events]);
  
  const getTrendIcon = (trend) => {
    if (trend === "increasing") return <TrendingUp className="w-3 h-3 text-[#ff1744]" />;
    if (trend === "decreasing") return <TrendingDown className="w-3 h-3 text-[#00e676]" />;
    return <Minus className="w-3 h-3 text-gray-500" />;
  };
  
  const getRiskColor = (score) => {
    if (score >= 80) return "#ff1744";
    if (score >= 60) return "#ff6d00";
    if (score >= 40) return "#ffd600";
    return "#ff9100";
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <AlertTriangle className="w-3.5 h-3.5 text-[#ff6d00]" />
        <span className="text-[9px] font-black tracking-[0.2em] text-[#ff6d00] uppercase">
          Predictive Risk Analytics
        </span>
      </div>
      
      <div className="px-2 space-y-1.5 max-h-[300px] overflow-y-auto">
        {regionalRisks.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-[9px] text-gray-600 font-mono">
              Insufficient data for risk prediction
            </p>
          </div>
        ) : (
          regionalRisks.map((region) => (
            <div
              key={region.name}
              className="bg-white/3 border border-white/5 rounded-sm p-2 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold text-white">
                      {region.name}
                    </span>
                    {getTrendIcon(region.analysis.trend)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-mono text-gray-500">
                      {region.analysis.recentCount} events (7d)
                    </span>
                    {region.analysis.criticalCount > 0 && (
                      <Badge className="text-[7px] px-1 py-0 bg-[#ff1744]/10 text-[#ff1744] border-[#ff1744]/20">
                        {region.analysis.criticalCount} CRIT
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-[11px] font-black tabular-nums"
                    style={{ color: getRiskColor(region.analysis.score) }}
                  >
                    {Math.round(region.analysis.score)}
                  </div>
                  <div className="text-[7px] text-gray-600 font-mono">
                    RISK
                  </div>
                </div>
              </div>
              
              {/* Risk bar */}
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${region.analysis.score}%`,
                    background: `linear-gradient(90deg, ${getRiskColor(region.analysis.score)}80, ${getRiskColor(region.analysis.score)})`
                  }}
                />
              </div>
              
              {/* Trend details */}
              {region.analysis.trend !== "stable" && (
                <div className="mt-1 text-[8px] font-mono text-gray-600">
                  {region.analysis.trend === "increasing" ? "↑" : "↓"} {Math.abs(Math.round(region.analysis.trendValue))} event shift vs. historical avg
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <div className="px-3 py-2 border-t border-white/5">
        <p className="text-[7px] text-gray-700 font-mono tracking-wide">
          Risk scores based on 30-day historical patterns, weighted by severity and trend analysis
        </p>
      </div>
    </div>
  );
}