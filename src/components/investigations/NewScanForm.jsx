import React, { useState } from "react";
import { Search, Loader2, Shield, ExternalLink, Save, X, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

const TYPE_LABELS = { ip: "IP Address", domain: "Domain", url: "URL", hash: "File Hash" };

const SOURCE_COLORS = {
  "VirusTotal": "text-[#00d4ff] border-[#00d4ff]/30 bg-[#00d4ff]/5",
  "AlienVault OTX": "text-[#ffa502] border-[#ffa502]/30 bg-[#ffa502]/5",
  "AbuseIPDB": "text-[#ff4757] border-[#ff4757]/30 bg-[#ff4757]/5",
};

const SEVERITY_STYLES = {
  critical: "bg-red-500/20 text-red-300",
  high: "bg-orange-500/20 text-orange-300",
  medium: "bg-yellow-500/20 text-yellow-300",
  low: "bg-blue-500/20 text-blue-300",
};

function SeverityIcon({ severity }) {
  if (severity === "critical" || severity === "high") return <AlertTriangle className="w-4 h-4 text-red-400" />;
  if (severity === "medium") return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
  return <CheckCircle className="w-4 h-4 text-green-400" />;
}

function overallSeverity(results) {
  const order = ["critical", "high", "medium", "low"];
  for (const sev of order) {
    if (results.some(r => r.severity === sev)) return sev;
  }
  return "low";
}

export default function NewScanForm({ onSave, onCancel }) {
  const [indicator, setIndicator] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    if (!indicator.trim()) return;
    setScanning(true);
    setError(null);
    setScanData(null);
    const res = await base44.functions.invoke('scanIndicator', { indicator: indicator.trim() });
    if (res.data?.error) {
      setError(res.data.error);
    } else {
      setScanData(res.data);
    }
    setScanning(false);
  };

  const handleSave = () => {
    if (!scanData) return;
    onSave({
      id: crypto.randomUUID(),
      query: scanData.indicator,
      createdAt: new Date().toISOString(),
      results: scanData.results,
      tags: [scanData.type, overallSeverity(scanData.results)].filter(Boolean),
      notes: `Auto-scanned via OSINT APIs. Type: ${TYPE_LABELS[scanData.type] || scanData.type}. Sources: ${scanData.results.map(r => r.source).join(', ')}.`,
    });
  };

  return (
    <div className="bg-[#111827] border border-[#00d4ff]/20 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#00d4ff]" />
          <h2 className="text-base font-semibold text-white">New API Scan</h2>
          <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">VirusTotal · OTX · AbuseIPDB</span>
        </div>
        <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <Input
          value={indicator}
          onChange={(e) => { setIndicator(e.target.value); setScanData(null); setError(null); }}
          onKeyDown={(e) => e.key === "Enter" && !scanning && handleScan()}
          placeholder="Enter IP, domain, URL, or file hash (MD5/SHA1/SHA256)…"
          className="bg-white/5 border-white/10 flex-1"
        />
        <Button
          onClick={handleScan}
          disabled={scanning || !indicator.trim()}
          className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 font-semibold shrink-0 gap-2"
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {scanning ? "Scanning…" : "Scan"}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {scanData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 text-xs">
                {TYPE_LABELS[scanData.type] || scanData.type}
              </Badge>
              <Badge className={`text-xs border ${SEVERITY_STYLES[overallSeverity(scanData.results)]}`}>
                {overallSeverity(scanData.results)} risk
              </Badge>
              <span className="text-xs text-gray-400">{scanData.results.length} source{scanData.results.length !== 1 ? 's' : ''} scanned</span>
            </div>
          </div>

          {scanData.results.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-white/5 rounded-xl text-sm text-gray-400">
              <Info className="w-4 h-4 shrink-0" />
              No data returned. Check that your API keys are configured.
            </div>
          ) : (
            <div className="space-y-3">
              {scanData.results.map((result, i) => (
                <div key={i} className={`border rounded-xl p-4 ${SOURCE_COLORS[result.source] || 'border-white/10 bg-white/5'}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <SeverityIcon severity={result.severity} />
                      <span className="text-sm font-semibold text-white">{result.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[10px] border-0 ${SEVERITY_STYLES[result.severity]}`}>{result.severity}</Badge>
                      {result.link && (
                        <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">{result.description}</p>
                  <p className="text-[10px] text-gray-600 mt-1">Source: {result.source}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onCancel} className="text-gray-400 hover:text-white">
              Discard
            </Button>
            <Button onClick={handleSave} className="bg-[#2ed573] text-black hover:bg-[#2ed573]/90 font-semibold gap-2">
              <Save className="w-4 h-4" />
              Save as Investigation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}