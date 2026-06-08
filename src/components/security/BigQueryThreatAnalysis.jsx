import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line
} from "recharts";
import {
  Database, TrendingUp, AlertTriangle, Target, Server, Clock, Zap, RefreshCw
} from "lucide-react";

export default function BigQueryThreatAnalysis() {
  const [projectId, setProjectId] = useState("");
  const [datasetId, setDatasetId] = useState("");
  const [tableId, setTableId] = useState("");
  const [timeRange, setTimeRange] = useState(24);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('analyzeThreatIntelFromBigQuery', {
        projectId,
        datasetId,
        tableId,
        timeRangeHours: timeRange,
      }),
    onSuccess: (response) => {
      setAnalysis(response.data);
      setError(null);
    },
    onError: (err) => {
      setError(err.message || 'Failed to analyze threat intelligence');
      setAnalysis(null);
    },
  });

  const handleAnalyze = () => {
    if (!projectId || !datasetId || !tableId) {
      setError('Please fill in all required fields');
      return;
    }
    analyzeMutation.mutate();
  };

  const SEVERITY_COLORS = {
    critical: '#ff4757',
    high: '#ffa502',
    medium: '#ffc107',
    low: '#2ed573',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Database className="w-6 h-6 text-cyan-400" />
          BigQuery Threat Intelligence Analysis
        </h2>
      </div>

      {/* Input Section */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Configure BigQuery Source</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Project ID</label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="e.g., my-gcp-project"
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Dataset ID</label>
            <input
              type="text"
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              placeholder="e.g., threat_intel"
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Table ID</label>
            <input
              type="text"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              placeholder="e.g., indicators"
              className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Time Range (hours)</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="bg-black/20 border border-white/10 rounded px-3 py-2 text-white text-sm"
          >
            <option value={1}>Last 1 hour</option>
            <option value={6}>Last 6 hours</option>
            <option value={24}>Last 24 hours</option>
            <option value={72}>Last 3 days</option>
            <option value={168}>Last 7 days</option>
            <option value={720}>Last 30 days</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending || !projectId || !datasetId || !tableId}
            className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${analyzeMutation.isPending ? 'animate-spin' : ''}`} />
            {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Threat Intelligence'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              title="Total Threats"
              value={analysis.summary.totalThreats}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="red"
            />
            <StatCard
              title="Threat Types"
              value={analysis.analysis.byThreatType.length}
              icon={<Target className="w-5 h-5" />}
              color="cyan"
            />
            <StatCard
              title="Time Range"
              value={`${timeRange}h`}
              icon={<Clock className="w-5 h-5" />}
              color="purple"
            />
            <StatCard
              title="Data Analyzed"
              value={analysis.summary.threatsDetected.length}
              icon={<Database className="w-5 h-5" />}
              color="yellow"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4">
            {/* Threats by Type */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Threats by Type</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analysis.analysis.byThreatType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="threat_type" stroke="rgba(255,255,255,0.5)" angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(0,212,255,0.3)" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" fill="#00d4ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Threats by Severity */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Threats by Severity</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analysis.analysis.bySeverity}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.severity}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analysis.analysis.bySeverity.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SEVERITY_COLORS[entry.severity] || '#888'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(0,212,255,0.3)" }}
                    labelStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Threat Table */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Detailed Threat Intelligence</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-3 text-gray-400">Threat Type</th>
                    <th className="text-left py-2 px-3 text-gray-400">Severity</th>
                    <th className="text-left py-2 px-3 text-gray-400">Count</th>
                    <th className="text-left py-2 px-3 text-gray-400">Unique Sources</th>
                    <th className="text-left py-2 px-3 text-gray-400">Unique Targets</th>
                    <th className="text-left py-2 px-3 text-gray-400">Confidence</th>
                    <th className="text-left py-2 px-3 text-gray-400">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.summary.threatsDetected.map((threat, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-2 px-3 text-white">{threat.threat_type || '-'}</td>
                      <td className="py-2 px-3">
                        <Badge
                          className={`text-[8px] ${
                            threat.severity === 'critical'
                              ? 'bg-red-900/30 text-red-300 border-red-500/20'
                              : threat.severity === 'high'
                              ? 'bg-orange-900/30 text-orange-300 border-orange-500/20'
                              : 'bg-yellow-900/30 text-yellow-300 border-yellow-500/20'
                          }`}
                        >
                          {threat.severity}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-cyan-400 font-semibold">{threat.count}</td>
                      <td className="py-2 px-3 text-gray-400">{threat.unique_sources}</td>
                      <td className="py-2 px-3 text-gray-400">{threat.unique_targets}</td>
                      <td className="py-2 px-3 text-gray-400">{threat.avg_confidence}%</td>
                      <td className="py-2 px-3 text-gray-400 text-xs">
                        {new Date(threat.last_seen).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-xs text-gray-400">
            <p>Analyzed at: {new Date(analysis.summary.queriedAt).toLocaleString()}</p>
            <p>Time Range: {timeRange} hours</p>
            <p>Data Source: {datasetId}.{tableId}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    cyan: "bg-cyan-900/20 border-cyan-500/30 text-cyan-400",
    red: "bg-red-900/20 border-red-500/30 text-red-400",
    yellow: "bg-yellow-900/20 border-yellow-500/30 text-yellow-400",
    purple: "bg-purple-900/20 border-purple-500/30 text-purple-400",
  }[color];

  return (
    <div className={`${colorClasses} border rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-xl opacity-50">{icon}</div>
      </div>
    </div>
  );
}