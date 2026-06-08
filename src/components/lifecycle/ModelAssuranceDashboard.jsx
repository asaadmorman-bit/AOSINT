import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { Shield, TrendingUp, AlertTriangle } from "lucide-react";

const ASSURANCE_COLORS = {
  none: "#6b7280",
  low: "#ffa502",
  medium: "#00d4ff",
  high: "#2ed573",
  very_high: "#a855f7",
  eda: "#ff4757",
  ea: "#ff4757",
};

export default function ModelAssuranceDashboard({ models = [] }) {
  const assuranceData = models.map(m => ({
    name: m.model_name.substring(0, 12),
    level: m.current_assurance_level,
    darpa: m.darpa_validation_score || 0,
    bias: m.bias_audit_score || 0,
    adversarial: m.adversarial_robustness_score || 0,
    risk: m.operational_risk_score || 0,
  }));

  const riskVsDriftData = models.map(m => ({
    name: m.model_name.substring(0, 12),
    risk: m.operational_risk_score || 0,
    drift: m.current_data_drift_percentage || 0,
    id: m.id,
  }));

  const assuranceLevelCounts = {
    none: models.filter(m => m.current_assurance_level === 'none').length,
    low: models.filter(m => m.current_assurance_level === 'low').length,
    medium: models.filter(m => m.current_assurance_level === 'medium').length,
    high: models.filter(m => m.current_assurance_level === 'high').length,
    very_high: models.filter(m => m.current_assurance_level === 'very_high').length,
  };

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.entries(assuranceLevelCounts).map(([level, count]) => (
          <div key={level} className="bg-[#111827] border border-white/5 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-500 capitalize mb-1">{level}</p>
            <p className="text-2xl font-black text-white">{count}</p>
            <div className="h-1 rounded mt-2" style={{ background: ASSURANCE_COLORS[level] }}></div>
          </div>
        ))}
      </div>

      {/* Assurance Scores Chart */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-[#a855f7]" />
          <h3 className="text-sm font-bold text-white">Model Assurance Scores</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={assuranceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Bar dataKey="darpa" fill="#a855f7" name="DARPA" />
            <Bar dataKey="bias" fill="#2ed573" name="Bias Audit" />
            <Bar dataKey="adversarial" fill="#ffa502" name="Adversarial" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk vs Drift Analysis */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-[#ff4757]" />
          <h3 className="text-sm font-bold text-white">Risk vs Data Drift</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" dataKey="drift" name="Data Drift %" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis type="number" dataKey="risk" name="Risk Score" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Scatter name="Models" data={riskVsDriftData} fill="#a855f7" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Model Matrix */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-4">Model Assurance Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-2 text-gray-500">Model</th>
                <th className="text-center p-2 text-gray-500">Assurance</th>
                <th className="text-center p-2 text-gray-500">DARPA</th>
                <th className="text-center p-2 text-gray-500">Bias</th>
                <th className="text-center p-2 text-gray-500">Adversarial</th>
                <th className="text-center p-2 text-gray-500">Risk</th>
              </tr>
            </thead>
            <tbody>
              {models.map(model => (
                <tr key={model.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-2 text-white font-semibold">{model.model_name}</td>
                  <td className="p-2 text-center">
                    <span className="px-2 py-1 rounded text-[9px] text-white capitalize" style={{ background: `${ASSURANCE_COLORS[model.current_assurance_level]}20` }}>
                      {model.current_assurance_level}
                    </span>
                  </td>
                  <td className="p-2 text-center text-white">{model.darpa_validation_score || "—"}%</td>
                  <td className="p-2 text-center text-white">{model.bias_audit_score || "—"}%</td>
                  <td className="p-2 text-center text-white">{model.adversarial_robustness_score || "—"}%</td>
                  <td className="p-2 text-center">
                    <span className={model.operational_risk_score > 70 ? "text-[#ff4757]" : "text-[#2ed573]"} style={{ fontWeight: 'bold' }}>
                      {model.operational_risk_score || 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}