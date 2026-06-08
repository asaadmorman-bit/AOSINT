import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileText, Shield, Download, Play, Loader2, CheckCircle2, AlertCircle, BookOpen, Zap } from "lucide-react";

const DOC_CATEGORIES = [
  { key: "setup", label: "Setup & Implementation", icon: Zap },
  { key: "compliance", label: "Compliance Frameworks", icon: Shield },
  { key: "userguide", label: "User Guides", icon: BookOpen },
  { key: "marketing", label: "Sales Materials", icon: FileText },
];

const AUDIENCES = ["executive", "analyst", "admin", "developer"];

export default function ComplianceDocumentation() {
  const [activeCategory, setActiveCategory] = useState("setup");
  const [selectedAudience, setSelectedAudience] = useState("executive");
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [scanType, setScanType] = useState("scap");

  const generateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke('generateAIDocumentation', data);
      return res.data;
    },
    onSuccess: (data) => {
      setGeneratedDoc(data);
    },
  });

  const scanMutation = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke('runComplianceScan', data);
      return res.data;
    },
    onSuccess: (data) => {
      setScanResults(data);
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10 border border-[#00d4ff]/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/20 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-[#00d4ff]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white mb-1">Compliance & AI Documentation Hub</h1>
            <p className="text-sm text-gray-400">Generate compliance documentation, security guides, and sales materials using AI. Run automated compliance scans (SCAP, SOC 2, ISO 27001).</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Documentation Generator */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#00d4ff]" />
              Generate AI Documentation
            </h2>

            <div className="space-y-4">
              {/* Category Selection */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Documentation Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {DOC_CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        activeCategory === cat.key
                          ? "bg-[#00d4ff]/20 border border-[#00d4ff]/40 text-[#00d4ff]"
                          : "bg-white/5 border border-white/10 text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      <cat.icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audience Selection */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Target Audience</label>
                <div className="grid grid-cols-2 gap-2">
                  {AUDIENCES.map(aud => (
                    <button
                      key={aud}
                      onClick={() => setSelectedAudience(aud)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        selectedAudience === aud
                          ? "bg-[#a855f7]/20 border border-[#a855f7]/40 text-[#a855f7]"
                          : "bg-white/5 border border-white/10 text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      {aud.charAt(0).toUpperCase() + aud.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={() => generateMutation.mutate({ docType: activeCategory, audience: selectedAudience })}
                disabled={generateMutation.isPending}
                className="w-full bg-[#00d4ff] text-black hover:bg-[#0099cc] font-bold gap-2"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Generate Documentation
                  </>
                )}
              </Button>

              {/* Generated Document Display */}
              {generatedDoc && (
                <div className="mt-6 p-4 rounded-lg bg-[#0d1220] border border-[#00d4ff]/20 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2ed573]" />
                      <span className="text-xs font-bold text-gray-300">Generated for {selectedAudience}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[10px]"
                      onClick={() => {
                        const element = document.createElement('a');
                        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(generatedDoc.content));
                        element.setAttribute('download', `${activeCategory}-${selectedAudience}.txt`);
                        element.style.display = 'none';
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      }}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{generatedDoc.content}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compliance Scanner */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#ff4757]" />
            Run Compliance Scan
          </h2>

          <div className="space-y-4">
            {/* Scan Type Selection */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Scan Type</label>
              <div className="space-y-2">
                {["scap", "soc2", "iso27001"].map(type => (
                  <button
                    key={type}
                    onClick={() => setScanType(type)}
                    className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all ${
                      scanType === type
                        ? "bg-[#ff4757]/20 border border-[#ff4757]/40 text-[#ff4757]"
                        : "bg-white/5 border border-white/10 text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    {type.toUpperCase()} {type === "scap" ? "Scan" : "Assessment"}
                  </button>
                ))}
              </div>
            </div>

            {/* Scan Button */}
            <Button
              onClick={() => scanMutation.mutate({
                scanType,
                targetAssets: ["prod-web-server", "prod-db-server", "cloud-storage"],
                complianceFramework: scanType.toUpperCase(),
              })}
              disabled={scanMutation.isPending}
              className="w-full bg-[#ff4757] text-white hover:bg-[#e84345] font-bold gap-2"
            >
              {scanMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Scan
                </>
              )}
            </Button>

            {/* Scan Results */}
            {scanResults && (
              <div className="mt-4 p-4 rounded-lg bg-[#0d1220] border border-[#ff4757]/20 space-y-2 max-h-80 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300">Pass Rate</span>
                  <span className="text-sm font-black text-[#2ed573]">{scanResults.pass_rate}%</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="bg-white/5 p-2 rounded text-center">
                    <div className="font-bold text-white">{scanResults.total_checks}</div>
                    <div className="text-gray-500">Total Checks</div>
                  </div>
                  <div className="bg-[#2ed573]/10 p-2 rounded text-center">
                    <div className="font-bold text-[#2ed573]">{scanResults.passed}</div>
                    <div className="text-gray-500">Passed</div>
                  </div>
                  <div className="bg-[#ff4757]/10 p-2 rounded text-center">
                    <div className="font-bold text-[#ff4757]">{scanResults.failed}</div>
                    <div className="text-gray-500">Failed</div>
                  </div>
                </div>
                <div className="border-t border-white/5 pt-2 mt-2">
                  <p className="text-[10px] text-gray-400">{scanResults.summary}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Framework Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            title: "SOC 2 Type 2",
            description: "Security, Availability, Processing Integrity, Confidentiality, Privacy controls with audit evidence.",
            controls: 17,
          },
          {
            title: "ISO 27001:2022",
            description: "Information security management system with 93 control objectives across 14 domains.",
            controls: 93,
          },
          {
            title: "SCAP",
            description: "Automated vulnerability assessment, configuration compliance, and remediation workflows.",
            controls: 8,
          },
        ].map((framework, idx) => (
          <div key={idx} className="bg-[#111827] border border-white/5 rounded-xl p-4">
            <h3 className="font-bold text-white mb-1">{framework.title}</h3>
            <p className="text-xs text-gray-400 mb-3">{framework.description}</p>
            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <span className="text-[10px] text-gray-500">{framework.controls} Controls</span>
              <Button variant="ghost" size="sm" className="text-[10px] text-[#00d4ff] p-0 h-auto">
                Learn More →
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}