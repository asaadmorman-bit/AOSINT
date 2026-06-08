import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AssetHealthScore({ assetId, assetName }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthScore();
  }, [assetId]);

  const fetchHealthScore = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('calculateAssetHealthScore', {
        assetId
      });
      setHealth(response.data);
    } catch (error) {
      console.error('Failed to fetch health score:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
        <div className="animate-pulse text-sm text-slate-500">Calculating health score...</div>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card className="p-6 bg-red-50 border border-red-200">
        <div className="text-sm text-red-600">Unable to calculate health score</div>
      </Card>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent':
        return 'from-green-50 to-emerald-50 border-green-200';
      case 'healthy':
        return 'from-blue-50 to-cyan-50 border-blue-200';
      case 'fair':
        return 'from-yellow-50 to-amber-50 border-yellow-200';
      case 'poor':
        return 'from-orange-50 to-red-50 border-orange-200';
      case 'critical':
        return 'from-red-50 to-rose-50 border-red-300';
      default:
        return 'from-slate-50 to-slate-100 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'excellent':
      case 'healthy':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'fair':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'poor':
      case 'critical':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Zap className="w-6 h-6 text-slate-600" />;
    }
  };

  const getScoreTextColor = (score) => {
    if (score >= 80) return 'text-green-700';
    if (score >= 60) return 'text-blue-700';
    if (score >= 40) return 'text-yellow-700';
    return 'text-red-700';
  };

  return (
    <Card className={`p-6 bg-gradient-to-br ${getStatusColor(health.status)} border transition-all`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Asset Health Score</h3>
          <p className="text-sm text-slate-600">{health.assetName}</p>
        </div>
        {getStatusIcon(health.status)}
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-24 h-24">
          <svg className="transform -rotate-90 w-24 h-24">
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-200"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${(health.healthScore / 100) * 251} 251`}
              className={`${getScoreTextColor(health.healthScore)} transition-all duration-500`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getScoreTextColor(health.healthScore)}`}>
                {health.healthScore}
              </div>
              <div className="text-xs text-slate-600">/ 100</div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-3">
            <p className="text-sm font-medium text-slate-700 capitalize">{health.status}</p>
            <p className="text-xs text-slate-600">Overall health status</p>
          </div>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-slate-600">Vulnerabilities: </span>
              <span className="font-semibold text-slate-900">{health.vulnerabilityCount}</span>
              {health.criticalVulns > 0 && (
                <span className="text-red-600 font-semibold ml-2">
                  ({health.criticalVulns} critical)
                </span>
              )}
            </div>
            <div className="text-sm">
              <span className="text-slate-600">Intel Reports: </span>
              <span className="font-semibold text-slate-900">{health.intelReportCount}</span>
              {health.criticalReports > 0 && (
                <span className="text-red-600 font-semibold ml-2">
                  ({health.criticalReports} critical)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={fetchHealthScore}
          className="text-xs text-slate-600 hover:text-slate-900 font-medium"
        >
          Refresh Score
        </button>
      </div>
    </Card>
  );
}