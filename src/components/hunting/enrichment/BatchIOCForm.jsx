import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Loader2, Zap, X, AlertTriangle } from "lucide-react";

const IOC_TYPES = ["ip_address", "domain", "hash", "url", "email", "cve"];

function detectType(value) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return "ip_address";
  if (/^CVE-\d{4}-\d+$/i.test(value)) return "cve";
  if (/^[a-f0-9]{32,64}$/i.test(value)) return "hash";
  if (/^https?:\/\//i.test(value)) return "url";
  if (/@/.test(value)) return "email";
  if (/\.[a-z]{2,}$/.test(value)) return "domain";
  return "domain";
}

function parseIOCText(text) {
  return text
    .split(/[\n,;]+/)
    .map(l => l.trim())
    .filter(l => l.length > 3 && !l.startsWith('#'))
    .map(ioc => ({ ioc, ioc_type: detectType(ioc) }));
}

export default function BatchIOCForm({ playbooks, onSubmit, isLoading }) {
  const [iocList, setIocList] = useState([]);
  const [pasteText, setPasteText] = useState("");
  const [selectedPlaybooks, setSelectedPlaybooks] = useState([]);
  const [fileName, setFileName] = useState(null);
  const fileRef = useRef();

  const togglePlaybook = (id) =>
    setSelectedPlaybooks((p) => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseIOCText(ev.target.result);
      setIocList(parsed);
      setPasteText(ev.target.result);
    };
    reader.readAsText(file);
  };

  const handlePaste = (text) => {
    setPasteText(text);
    setIocList(parseIOCText(text));
  };

  const removeIOC = (idx) => setIocList(l => l.filter((_, i) => i !== idx));

  const updateType = (idx, type) =>
    setIocList(l => l.map((item, i) => i === idx ? { ...item, ioc_type: type } : item));

  const handleSubmit = () => onSubmit({ batch_iocs: iocList, playbook_ids: selectedPlaybooks });

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-cyan-400" />
          Batch IOC Upload & Analysis
        </h3>

        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-slate-600/50 hover:border-cyan-500/40 rounded-lg p-6 text-center cursor-pointer transition mb-4"
        >
          <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            {fileName ? <span className="text-cyan-300">{fileName}</span> : "Drop a .txt or .csv file, or click to browse"}
          </p>
          <p className="text-xs text-gray-600 mt-1">One IOC per line — IPs, domains, hashes, URLs, emails, CVEs</p>
          <input ref={fileRef} type="file" accept=".txt,.csv" className="hidden" onChange={handleFile} />
        </div>

        {/* Manual paste */}
        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1 font-semibold">Or paste IOCs directly</label>
          <textarea
            rows={4}
            value={pasteText}
            onChange={(e) => handlePaste(e.target.value)}
            placeholder={"185.220.101.45\nevil-domain.com\nCVE-2024-1234\nabc123def456... (hash)"}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-cyan-500/50 resize-none"
          />
        </div>

        {/* Parsed preview */}
        {iocList.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 font-semibold">{iocList.length} IOCs parsed — review & edit types</p>
              <button onClick={() => { setIocList([]); setPasteText(""); setFileName(null); }} className="text-xs text-gray-600 hover:text-gray-400">Clear all</button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {iocList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-800/40 rounded px-2 py-1">
                  <select
                    value={item.ioc_type}
                    onChange={e => updateType(idx, e.target.value)}
                    className="bg-transparent text-[10px] text-cyan-300 border-none outline-none cursor-pointer shrink-0"
                  >
                    {IOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-xs text-gray-300 font-mono truncate flex-1">{item.ioc}</span>
                  <button onClick={() => removeIOC(idx)} className="text-gray-600 hover:text-gray-400 shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {iocList.length > 10 && (
          <div className="flex items-center gap-2 text-xs text-yellow-400 mb-3 bg-yellow-900/10 border border-yellow-500/20 rounded p-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Large batch ({iocList.length} IOCs) — analysis may take 1-3 minutes
          </div>
        )}

        {playbooks.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-2 font-semibold">Auto-update Playbooks with batch enrichment</label>
            <div className="flex flex-wrap gap-2">
              {playbooks.map((pb) => (
                <button
                  key={pb.id}
                  onClick={() => togglePlaybook(pb.id)}
                  className={`text-xs px-2 py-1 rounded border transition ${
                    selectedPlaybooks.includes(pb.id)
                      ? "bg-cyan-900/30 text-cyan-300 border-cyan-500/40"
                      : "bg-slate-800/50 text-gray-400 border-slate-700/30 hover:border-slate-600"
                  }`}
                >
                  {pb.playbook_name}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={iocList.length === 0 || isLoading}
          className="w-full bg-cyan-600 hover:bg-cyan-700 flex items-center justify-center gap-2"
        >
          {isLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing {iocList.length} IOCs…</>
            : <><Zap className="w-4 h-4" /> Analyze {iocList.length} IOCs & Predict Attack Vectors</>}
        </Button>
      </div>
    </div>
  );
}