import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw, Plus, Zap, TrendingUp } from "lucide-react";

export default function ThreatIntelligenceFeedsPanel() {
  const [showForm, setShowForm] = useState(false);
  const [feedType, setFeedType] = useState("stix");
  const [feedUrl, setFeedUrl] = useState("");
  const [taxiiUsername, setTaxiiUsername] = useState("");
  const [taxiiPassword, setTaxiiPassword] = useState("");
  const [mispUrl, setMispUrl] = useState("");
  const [mispApiKey, setMispApiKey] = useState("");
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const { data: indicators = [] } = useQuery({
    queryKey: ["threatIndicators"],
    queryFn: () => base44.entities.ThreatIndicator.list("-ingested_date", 100),
    refetchInterval: 60000,
  });

  const integrateMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('integrateThreatFeeds', {
        feedType,
        feedUrl: feedType !== 'misp' ? feedUrl : undefined,
        taxiiUsername: feedType === 'taxii' ? taxiiUsername : undefined,
        taxiiPassword: feedType === 'taxii' ? taxiiPassword : undefined,
        mispUrl: feedType === 'misp' ? mispUrl : undefined,
        mispApiKey: feedType === 'misp' ? mispApiKey : undefined,
      }),
    onSuccess: (response) => {
      setLastResult(response.data);
      setError(null);
      setShowForm(false);
      // Reset form
      setFeedUrl("");
      setTaxiiUsername("");
      setTaxiiPassword("");
      setMispUrl("");
      setMispApiKey("");
    },
    onError: (err) => {
      setError(err.message || 'Failed to integrate feed');
      setLastResult(null);
    },
  });

  const handleIntegrate = () => {
    if (feedType === 'taxii' && (!feedUrl || !taxiiUsername || !taxiiPassword)) {
      setError('Please provide TAXII URL, username, and password');
      return;
    }
    if (feedType === 'misp' && (!mispUrl || !mispApiKey)) {
      setError('Please provide MISP URL and API key');
      return;
    }
    if ((feedType === 'stix' || feedType === 'generic') && !feedUrl) {
      setError('Please provide feed URL');
      return;
    }
    integrateMutation.mutate();
  };

  const recentIndicators = indicators.slice(0, 5);
  const threatDistribution = {
    critical: indicators.filter(i => i.threat_level === 'critical').length,
    high: indicators.filter(i => i.threat_level === 'high').length,
    medium: indicators.filter(i => i.threat_level === 'medium').length,
    low: indicators.filter(i => i.threat_level === 'low').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          Threat Intelligence Feeds
        </h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Integrate Feed
        </Button>
      </div>

      {/* Integration Form */}
      {showForm && (
        <div className="bg-black/30 border border-cyan-500/20 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Feed Type</label>
            <select
              value={feedType}
              onChange={(e) => setFeedType(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-xs"
            >
              <option value="stix">STIX Bundle</option>
              <option value="taxii">TAXII 2.0</option>
              <option value="misp">MISP</option>
              <option value="generic">Generic CSV/JSON</option>
            </select>
          </div>

          {feedType === 'taxii' && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-2">TAXII API URL</label>
                <input
                  type="text"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  placeholder="https://taxii.example.com/api/collections/..."
                  className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Username</label>
                  <input
                    type="text"
                    value={taxiiUsername}
                    onChange={(e) => setTaxiiUsername(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Password</label>
                  <input
                    type="password"
                    value={taxiiPassword}
                    onChange={(e) => setTaxiiPassword(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-xs"
                  />
                </div>
              </div>
            </>
          )}

          {feedType === 'misp' && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-2">MISP URL</label>
                <input
                  type="text"
                  value={mispUrl}
                  onChange={(e) => setMispUrl(e.target.value)}
                  placeholder="https://misp.example.com"
                  className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">API Key</label>
                <input
                  type="password"
                  value={mispApiKey}
                  onChange={(e) => setMispApiKey(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-xs"
                />
              </div>
            </>
          )}

          {(feedType === 'stix' || feedType === 'generic') && (
            <div>
              <label className="block text-xs text-gray-400 mb-2">Feed URL</label>
              <input
                type="text"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="https://example.com/threat-feed"
                className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-xs"
              />
            </div>
          )}

          {error && (
            <div className="p-2 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-xs">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleIntegrate}
              disabled={integrateMutation.isPending}
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${integrateMutation.isPending ? 'animate-spin' : ''}`} />
              {integrateMutation.isPending ? 'Integrating...' : 'Integrate Feed'}
            </Button>
            <Button
              onClick={() => setShowForm(false)}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Last Integration Result */}
      {lastResult && (
        <div className="bg-green-900/10 border border-green-500/20 rounded-lg p-3 text-xs">
          <div className="flex items-start justify-between mb-2">
            <p className="text-green-400 font-semibold">
              ✓ {lastResult.indicatorsIngested} indicators ingested from {lastResult.feedType.toUpperCase()}
            </p>
            <p className="text-gray-400">{new Date(lastResult.timestamp).toLocaleTimeString()}</p>
          </div>

          {lastResult.correlations && lastResult.correlations.length > 0 && (
            <div className="mt-2 pt-2 border-t border-green-500/10 space-y-1">
              <p className="text-gray-400 font-semibold">Matched Detection Rules:</p>
              {lastResult.correlations.slice(0, 3).map((corr, idx) => (
                <div key={idx} className="text-gray-300 text-[10px] flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span>{corr.rule_name}: {corr.matched_count} indicators match</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Threat Distribution */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-red-900/10 border border-red-500/20 rounded p-2 text-center">
          <p className="text-[9px] text-gray-400">Critical</p>
          <p className="text-lg font-bold text-red-400">{threatDistribution.critical}</p>
        </div>
        <div className="bg-orange-900/10 border border-orange-500/20 rounded p-2 text-center">
          <p className="text-[9px] text-gray-400">High</p>
          <p className="text-lg font-bold text-orange-400">{threatDistribution.high}</p>
        </div>
        <div className="bg-yellow-900/10 border border-yellow-500/20 rounded p-2 text-center">
          <p className="text-[9px] text-gray-400">Medium</p>
          <p className="text-lg font-bold text-yellow-400">{threatDistribution.medium}</p>
        </div>
        <div className="bg-blue-900/10 border border-blue-500/20 rounded p-2 text-center">
          <p className="text-[9px] text-gray-400">Low</p>
          <p className="text-lg font-bold text-blue-400">{threatDistribution.low}</p>
        </div>
      </div>

      {/* Recent Indicators */}
      {recentIndicators.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-400 mb-2">Recent IOCs</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {recentIndicators.map((ind) => (
              <div key={ind.id} className="flex items-center justify-between text-xs p-1.5 bg-black/20 rounded">
                <div className="flex-1 truncate">
                  <p className="text-white truncate">{ind.indicator_value}</p>
                  <p className="text-gray-500 text-[9px]">{ind.indicator_type}</p>
                </div>
                <Badge
                  className={`text-[7px] ml-1 ${
                    ind.threat_level === 'critical'
                      ? 'bg-red-900/30 text-red-300 border-red-500/20'
                      : ind.threat_level === 'high'
                      ? 'bg-orange-900/30 text-orange-300 border-orange-500/20'
                      : 'bg-yellow-900/30 text-yellow-300 border-yellow-500/20'
                  }`}
                >
                  {ind.threat_level}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentIndicators.length === 0 && !showForm && (
        <div className="p-4 text-center text-gray-500 text-xs">
          No threat intelligence integrated yet. Add a feed to get started.
        </div>
      )}
    </div>
  );
}