import React, { useState } from "react";
import { Bell, Plus, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThresholdAlertManager({ alerts, onAddAlert, onRemoveAlert }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({ metric: "risk_score", operator: "greater_than", value: 75, enabled: true });

  const handleAddAlert = () => {
    if (newAlert.metric && newAlert.value !== "") {
      onAddAlert({ ...newAlert, id: Date.now() });
      setNewAlert({ metric: "risk_score", operator: "greater_than", value: 75, enabled: true });
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors relative"
        title="Manage alerts"
      >
        <Bell className="w-4 h-4" />
        {alerts.filter(a => a.enabled).length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff4757] rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-[#111827] border border-white/10 rounded-lg shadow-xl w-80 z-40">
          <div className="p-4 border-b border-white/10">
            <h4 className="text-sm font-bold text-white">Threshold Alerts</h4>
            <p className="text-xs text-gray-500 mt-1">Get notified when metrics exceed thresholds</p>
          </div>

          <div className="p-4 max-h-64 overflow-y-auto space-y-2">
            {alerts.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No alerts configured</p>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="flex items-start justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-xs">
                    <p className="text-gray-300 font-mono">{alert.metric}</p>
                    <p className="text-gray-500">{alert.operator} {alert.value}</p>
                  </div>
                  <button
                    onClick={() => onRemoveAlert(alert.id)}
                    className="text-gray-500 hover:text-[#ff4757] transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-white/10 p-4 space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-2">Metric</label>
              <select
                value={newAlert.metric}
                onChange={(e) => setNewAlert({ ...newAlert, metric: e.target.value })}
                className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white"
              >
                <option value="risk_score">Risk Score</option>
                <option value="anomaly_count">Anomaly Count</option>
                <option value="sector_exposure">Sector Exposure</option>
                <option value="incident_severity">Incident Severity</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">Operator</label>
                <select
                  value={newAlert.operator}
                  onChange={(e) => setNewAlert({ ...newAlert, operator: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white"
                >
                  <option value="greater_than">&gt;</option>
                  <option value="less_than">&lt;</option>
                  <option value="equals">==</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-2">Value</label>
                <input
                  type="number"
                  value={newAlert.value}
                  onChange={(e) => setNewAlert({ ...newAlert, value: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white"
                  placeholder="75"
                />
              </div>
            </div>

            <Button onClick={handleAddAlert} size="sm" className="w-full bg-[#00d4ff] text-black font-bold gap-2">
              <Plus className="w-3 h-3" /> Add Alert
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}