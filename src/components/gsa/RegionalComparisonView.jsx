import React, { useState, useMemo } from "react";
import { X, TrendingUp, TrendingDown, AlertTriangle, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const REGIONS = [
  { id: "eastern_europe", name: "Eastern Europe", lat: 50, lng: 30, radius: 15 },
  { id: "middle_east", name: "Middle East", lat: 32, lng: 45, radius: 12 },
  { id: "south_china_sea", name: "South China Sea", lat: 15, lng: 115, radius: 10 },
  { id: "horn_africa", name: "Horn of Africa", lat: 8, lng: 45, radius: 8 },
  { id: "korean_peninsula", name: "Korean Peninsula", lat: 38, lng: 127, radius: 6 },
  { id: "taiwan_strait", name: "Taiwan Strait", lat: 25, lng: 120, radius: 5 },
  { id: "kashmir", name: "Kashmir", lat: 34, lng: 75, radius: 5 },
  { id: "sahel", name: "Sahel Region", lat: 15, lng: 5, radius: 12 },
  { id: "indo_pacific", name: "Indo-Pacific", lat: -5, lng: 130, radius: 20 },
  { id: "balkans", name: "Balkans", lat: 43, lng: 20, radius: 8 },
];

function filterEventsByRegion(events, region) {
  return events.filter(e => {
    if (!e.lat || !e.lng) return false;
    const distance = Math.sqrt(
      Math.pow(e.lat - region.lat, 2) + Math.pow(e.lng - region.lng, 2)
    );
    return distance <= region.radius;
  });
}

function calculateRegionMetrics(events) {
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  
  const recentEvents = events.filter(e => {
    const timestamp = new Date(e.timestamp || e.occurred_at || e.created_date).getTime();
    return timestamp >= sevenDaysAgo;
  });
  
  const historicalEvents = events.filter(e => {
    const timestamp = new Date(e.timestamp || e.occurred_at || e.created_date).getTime();
    return timestamp >= thirtyDaysAgo && timestamp < sevenDaysAgo;
  });
  
  const severityWeight = { critical: 5, high: 3, medium: 2, low: 1, informational: 0.5 };
  const weightedScore = recentEvents.reduce((sum, e) => sum + (severityWeight[e.severity] || 1), 0);
  const baseScore = Math.min(100, weightedScore * 2);
  
  const recentCount = recentEvents.length;
  const historicalAvg = historicalEvents.length / 3;
  const trend = recentCount - historicalAvg;
  const trendBoost = trend > 0 ? Math.min(30, trend * 5) : 0;
  
  return {
    totalEvents: events.length,
    recentEvents: recentCount,
    criticalCount: recentEvents.filter(e => e.severity === "critical").length,
    highCount: recentEvents.filter(e => e.severity === "high").length,
    riskScore: Math.min(100, baseScore + trendBoost),
    trend: trend > 2 ? "increasing" : trend < -2 ? "decreasing" : "stable",
    trendValue: trend,
    bySeverity: {
      critical: events.filter(e => e.severity === "critical").length,
      high: events.filter(e => e.severity === "high").length,
      medium: events.filter(e => e.severity === "medium").length,
      low: events.filter(e => e.severity === "low").length,
    },
    byDomain: {
      cyber: events.filter(e => e.domain === "cyber").length,
      geopolitical: events.filter(e => e.domain === "geopolitical").length,
      influence: events.filter(e => e.domain === "influence").length,
      hybrid: events.filter(e => e.domain === "hybrid").length,
      physical: events.filter(e => e.domain === "physical").length,
    }
  };
}

function generateTimeSeriesData(events, days = 14) {
  const now = Date.now();
  const data = [];
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(date).setHours(0, 0, 0, 0);
    const dayEnd = new Date(date).setHours(23, 59, 59, 999);
    
    const dayEvents = events.filter(e => {
      const timestamp = new Date(e.timestamp || e.occurred_at || e.created_date).getTime();
      return timestamp >= dayStart && timestamp <= dayEnd;
    });
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      events: dayEvents.length,
      critical: dayEvents.filter(e => e.severity === "critical").length,
      high: dayEvents.filter(e => e.severity === "high").length,
    });
  }
  
  return data;
}

function RegionPanel({ region, events, onClose, side }) {
  const regionalEvents = useMemo(
    () => region ? filterEventsByRegion(events, region) : [],
    [region, events]
  );
  
  const metrics = useMemo(
    () => regionalEvents.length > 0 ? calculateRegionMetrics(regionalEvents) : null,
    [regionalEvents]
  );
  
  const timeSeriesData = useMemo(
    () => regionalEvents.length > 0 ? generateTimeSeriesData(regionalEvents) : [],
    [regionalEvents]
  );
  
  const severityData = metrics ? [
    { name: "Critical", value: metrics.bySeverity.critical, color: "#ff1744" },
    { name: "High", value: metrics.bySeverity.high, color: "#ff6d00" },
    { name: "Medium", value: metrics.bySeverity.medium, color: "#ffd600" },
    { name: "Low", value: metrics.bySeverity.low, color: "#00e676" },
  ].filter(d => d.value > 0) : [];
  
  const domainData = metrics ? [
    { name: "Cyber", value: metrics.byDomain.cyber, color: "#00e5ff" },
    { name: "Geo-Pol", value: metrics.byDomain.geopolitical, color: "#ff1744" },
    { name: "Influence", value: metrics.byDomain.influence, color: "#a855f7" },
    { name: "Hybrid", value: metrics.byDomain.hybrid, color: "#ff9100" },
    { name: "Physical", value: metrics.byDomain.physical, color: "#ff5252" },
  ].filter(d => d.value > 0) : [];
  
  const getRiskColor = (score) => {
    if (score >= 80) return "#ff1744";
    if (score >= 60) return "#ff6d00";
    if (score >= 40) return "#ffd600";
    return "#00e676";
  };
  
  return (
    <div className="flex-1 flex flex-col min-w-0 border-r border-white/5 bg-[#020509]">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#00e5ff]" />
          <span className="text-[10px] font-black tracking-[0.2em] text-[#00e5ff] uppercase">
            {side}
          </span>
        </div>
        {onClose && (
          <Button onClick={onClose} variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-600 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      
      {/* Region selector */}
      <div className="shrink-0 px-4 py-3 border-b border-white/5">
        {region ? (
          <div className="text-sm font-bold text-white">{region.name}</div>
        ) : (
          <div className="text-sm text-gray-600">Select a region</div>
        )}
      </div>
      
      {/* Metrics */}
      {region && metrics && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Risk score */}
          <div className="bg-white/3 border border-white/5 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[8px] text-gray-600 font-mono uppercase tracking-widest mb-1">Risk Score</div>
                <div className="text-3xl font-black tabular-nums" style={{ color: getRiskColor(metrics.riskScore) }}>
                  {Math.round(metrics.riskScore)}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {metrics.trend === "increasing" ? (
                  <TrendingUp className="w-4 h-4 text-[#ff1744]" />
                ) : metrics.trend === "decreasing" ? (
                  <TrendingDown className="w-4 h-4 text-[#00e676]" />
                ) : (
                  <Zap className="w-4 h-4 text-gray-500" />
                )}
                <span className={`text-[9px] font-mono ${
                  metrics.trend === "increasing" ? "text-[#ff1744]" : 
                  metrics.trend === "decreasing" ? "text-[#00e676]" : "text-gray-500"
                }`}>
                  {metrics.trend.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${metrics.riskScore}%`,
                  background: `linear-gradient(90deg, ${getRiskColor(metrics.riskScore)}80, ${getRiskColor(metrics.riskScore)})`
                }}
              />
            </div>
          </div>
          
          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/3 border border-white/5 rounded-lg p-3">
              <div className="text-[8px] text-gray-600 font-mono uppercase tracking-widest mb-1">Total Events</div>
              <div className="text-2xl font-black text-white">{metrics.totalEvents}</div>
              <div className="text-[8px] text-gray-600 font-mono mt-1">30 days</div>
            </div>
            <div className="bg-white/3 border border-white/5 rounded-lg p-3">
              <div className="text-[8px] text-gray-600 font-mono uppercase tracking-widest mb-1">Recent</div>
              <div className="text-2xl font-black text-[#00e5ff]">{metrics.recentEvents}</div>
              <div className="text-[8px] text-gray-600 font-mono mt-1">7 days</div>
            </div>
            <div className="bg-[#ff1744]/10 border border-[#ff1744]/20 rounded-lg p-3">
              <div className="text-[8px] text-[#ff1744]/80 font-mono uppercase tracking-widest mb-1">Critical</div>
              <div className="text-2xl font-black text-[#ff1744]">{metrics.criticalCount}</div>
            </div>
            <div className="bg-[#ff6d00]/10 border border-[#ff6d00]/20 rounded-lg p-3">
              <div className="text-[8px] text-[#ff6d00]/80 font-mono uppercase tracking-widest mb-1">High</div>
              <div className="text-2xl font-black text-[#ff6d00]">{metrics.highCount}</div>
            </div>
          </div>
          
          {/* Timeline chart */}
          <div className="bg-white/3 border border-white/5 rounded-lg p-4">
            <div className="text-[9px] font-black tracking-[0.2em] text-gray-400 uppercase mb-3">
              14-Day Activity
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#546e7a" tick={{ fill: '#546e7a', fontSize: 9 }} />
                <YAxis stroke="#546e7a" tick={{ fill: '#546e7a', fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ background: '#0d1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                  labelStyle={{ color: '#00e5ff', fontSize: 10 }}
                  itemStyle={{ fontSize: 9 }}
                />
                <Line type="monotone" dataKey="events" stroke="#00e5ff" strokeWidth={2} dot={{ fill: '#00e5ff', r: 3 }} />
                <Line type="monotone" dataKey="critical" stroke="#ff1744" strokeWidth={2} dot={{ fill: '#ff1744', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Severity breakdown */}
          {severityData.length > 0 && (
            <div className="bg-white/3 border border-white/5 rounded-lg p-4">
              <div className="text-[9px] font-black tracking-[0.2em] text-gray-400 uppercase mb-3">
                By Severity
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#546e7a" tick={{ fill: '#546e7a', fontSize: 9 }} />
                  <YAxis stroke="#546e7a" tick={{ fill: '#546e7a', fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ background: '#0d1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                    labelStyle={{ color: '#00e5ff', fontSize: 10 }}
                    itemStyle={{ fontSize: 9 }}
                  />
                  <Bar dataKey="value" fill="#00e5ff">
                    {severityData.map((entry, index) => (
                      <Bar key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {/* Domain breakdown */}
          {domainData.length > 0 && (
            <div className="bg-white/3 border border-white/5 rounded-lg p-4">
              <div className="text-[9px] font-black tracking-[0.2em] text-gray-400 uppercase mb-3">
                By Domain
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={domainData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#546e7a" tick={{ fill: '#546e7a', fontSize: 9 }} />
                  <YAxis stroke="#546e7a" tick={{ fill: '#546e7a', fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{ background: '#0d1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                    labelStyle={{ color: '#00e5ff', fontSize: 10 }}
                    itemStyle={{ fontSize: 9 }}
                  />
                  <Bar dataKey="value" fill="#00e5ff">
                    {domainData.map((entry, index) => (
                      <Bar key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
      
      {/* Empty state */}
      {!region && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-600 font-mono">No region selected</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegionalComparisonView({ events = [], onClose }) {
  const [regionA, setRegionA] = useState(null);
  const [regionB, setRegionB] = useState(null);
  
  return (
    <div className="fixed inset-0 bg-[#020509] z-50 flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="w-6 h-6 text-[#00e5ff]" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">Regional Comparison</h1>
            <p className="text-[9px] text-gray-600 font-mono tracking-widest uppercase">
              Side-by-side threat analysis
            </p>
          </div>
        </div>
        <Button onClick={onClose} variant="ghost" className="text-gray-600 hover:text-white">
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Region selectors */}
      <div className="shrink-0 px-6 py-3 border-b border-white/5 flex items-center gap-4">
        <div className="flex-1">
          <label className="text-[8px] text-gray-600 font-mono uppercase tracking-widest block mb-2">
            Region A
          </label>
          <Select value={regionA?.id || ""} onValueChange={(id) => setRegionA(REGIONS.find(r => r.id === id))}>
            <SelectTrigger className="bg-white/3 border-white/5 text-white">
              <SelectValue placeholder="Select region..." />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map(region => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <label className="text-[8px] text-gray-600 font-mono uppercase tracking-widest block mb-2">
            Region B
          </label>
          <Select value={regionB?.id || ""} onValueChange={(id) => setRegionB(REGIONS.find(r => r.id === id))}>
            <SelectTrigger className="bg-white/3 border-white/5 text-white">
              <SelectValue placeholder="Select region..." />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map(region => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Split panels */}
      <div className="flex-1 flex min-h-0">
        <RegionPanel region={regionA} events={events} side="Region A" />
        <RegionPanel region={regionB} events={events} side="Region B" />
      </div>
    </div>
  );
}