import React, { useState } from "react";
import {
  ArrowLeft, Database, Lock, Hash, CheckCircle2, Upload,
  AlertTriangle, Clock, File, Shield, ChevronRight, Loader2
} from "lucide-react";
import { prepareEvidenceForIPFS, sha256Hex } from "@/utils/radix44";
import { Button } from "@/components/ui/button";

const STORED_EVIDENCE = [
  {
    id: "EV-001",
    label: "Network Capture — C2 Beacon",
    evidence_type: "pcap",
    sha256: "a3f1c2d4e5b6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
    ipfs_cid: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    size_bytes: 148204,
    prepared_at: "2026-04-06T09:14:00Z",
    analyst: "A.Morman",
    verified: true,
    tags: ["C2", "PCAP", "Network"],
  },
  {
    id: "EV-002",
    label: "Screenshot — Threat Actor Forum Post",
    evidence_type: "image",
    sha256: "b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5",
    ipfs_cid: "bafybeif2fdfqe3jkrl7v2crnhzthckl4n5rh24mv6vqmamklvxmn2u6cy",
    size_bytes: 312840,
    prepared_at: "2026-04-06T08:31:00Z",
    analyst: "S.Morman",
    verified: true,
    tags: ["Dark Web", "Screenshot", "Forum"],
  },
  {
    id: "EV-003",
    label: "Malware Binary — Stage 2 Dropper",
    evidence_type: "binary",
    sha256: "c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    ipfs_cid: null,
    size_bytes: 89600,
    prepared_at: "2026-04-05T22:47:00Z",
    analyst: "A.Morman",
    verified: false,
    tags: ["Malware", "Binary", "Unverified"],
  },
];

const typeColor = { pcap: "#00d4ff", image: "#a855f7", binary: "#ff4757", text: "#2ed573", json: "#ffa502" };

export default function EvidenceVault({ case_, onBack }) {
  const [addMode, setAddMode] = useState(false);
  const [addContent, setAddContent] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [addType, setAddType] = useState("text");
  const [processing, setProcessing] = useState(false);
  const [prepared, setPrepared] = useState(null);
  const [evidence, setEvidence] = useState(STORED_EVIDENCE);

  const handlePrepare = async () => {
    if (!addContent.trim()) return;
    setProcessing(true);
    setPrepared(null);
    const { metadata, hash } = await prepareEvidenceForIPFS(addContent, {
      label: addLabel || "Untitled Evidence",
      evidence_type: addType,
      case_id: case_.id,
      analyst: "Current Analyst",
    });
    setPrepared({ metadata, hash });
    setProcessing(false);
  };

  const handleCommit = () => {
    if (!prepared) return;
    const newItem = {
      id: `EV-${String(evidence.length + 1).padStart(3, "0")}`,
      label: addLabel || "Untitled Evidence",
      evidence_type: addType,
      sha256: prepared.hash,
      ipfs_cid: null,
      size_bytes: new TextEncoder().encode(addContent).length,
      prepared_at: new Date().toISOString(),
      analyst: "Current Analyst",
      verified: false,
      tags: [addType, "New"],
    };
    setEvidence(prev => [newItem, ...prev]);
    setAddContent("");
    setAddLabel("");
    setPrepared(null);
    setAddMode(false);
  };

  return (
    <div className="min-h-screen bg-[#060a14] text-white p-4 sm:p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-500 hover:text-white text-xs transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> {case_.id}
        </button>
        <ChevronRight className="w-3 h-3 text-gray-700" />
        <span className="text-xs text-[#a855f7] font-mono">Evidence Vault</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-[#a855f7]" />
            <h1 className="text-base font-black">Evidence Vault</h1>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#a855f7]/10 border border-[#a855f7]/20 text-[#a855f7]">IPFS-READY</span>
          </div>
          <p className="text-[10px] font-mono text-gray-600">
            Only metadata &amp; SHA-256 hashes stored in entity · Raw evidence pinned to IPFS
          </p>
        </div>
        <Button size="sm" onClick={() => setAddMode(m => !m)} className="bg-[#a855f7] text-white hover:bg-[#9333ea] text-xs h-8 px-3 font-bold">
          <Upload className="w-3.5 h-3.5 mr-1" /> Add Evidence
        </Button>
      </div>

      {/* IPFS model explanation */}
      <div className="rounded-2xl border border-[#a855f7]/15 bg-[#a855f7]/[0.03] p-4 mb-5 grid sm:grid-cols-3 gap-4">
        {[
          { icon: Lock, label: "Privacy Model", desc: "Raw content never stored in the Case entity. Only SHA-256 hash + metadata.", color: "#a855f7" },
          { icon: Shield, label: "Integrity", desc: "SHA-256 hash verifies evidence hasn't been tampered with after collection.", color: "#2ed573" },
          { icon: Hash, label: "IPFS Storage", desc: "Content-addressed via CID. Same file = same CID. Deduplication automatic.", color: "#00d4ff" },
        ].map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}12`, border: `1px solid ${color}20` }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <div>
              <p className="text-xs font-bold text-white mb-0.5">{label}</p>
              <p className="text-[10px] text-gray-600 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add evidence panel */}
      {addMode && (
        <div className="rounded-2xl border border-[#a855f7]/20 bg-[#0d1220] p-5 mb-5">
          <p className="text-xs font-bold text-white mb-3">Prepare New Evidence for IPFS</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[9px] font-mono text-gray-600 uppercase tracking-widest block mb-1">Label</label>
              <input value={addLabel} onChange={e => setAddLabel(e.target.value)} placeholder="Evidence label…" className="w-full bg-[#060a14] border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#a855f7]/30" />
            </div>
            <div>
              <label className="text-[9px] font-mono text-gray-600 uppercase tracking-widest block mb-1">Type</label>
              <select value={addType} onChange={e => setAddType(e.target.value)} className="w-full bg-[#060a14] border border-white/8 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#a855f7]/30">
                {["text", "json", "pcap", "image", "binary"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-[9px] font-mono text-gray-600 uppercase tracking-widest block mb-1">Evidence Content (will NOT be stored — only its hash)</label>
            <textarea
              value={addContent}
              onChange={e => setAddContent(e.target.value)}
              rows={5}
              placeholder="Paste evidence content here — IOC data, log entries, raw text, JSON, etc. This will be hashed and prepared for IPFS. It will NOT be stored in the database."
              className="w-full bg-[#060a14] border border-white/8 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-[#a855f7]/30 font-mono resize-none"
            />
          </div>

          {prepared && (
            <div className="rounded-xl border border-[#2ed573]/20 bg-[#2ed573]/5 p-3 mb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2ed573]" />
                <span className="text-xs font-bold text-[#2ed573]">Hash computed — ready to commit metadata</span>
              </div>
              <p className="text-[9px] font-mono text-gray-500 mb-0.5">SHA-256 (stored in entity):</p>
              <p className="text-[9px] font-mono text-[#2ed573] break-all">{prepared.hash}</p>
              <p className="text-[9px] font-mono text-gray-700 mt-1">Content size: {prepared.metadata.content_size_bytes} bytes · IPFS CID: pending pin</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={handlePrepare} disabled={processing || !addContent.trim()} variant="outline" className="border-[#a855f7]/30 text-[#a855f7] hover:bg-[#a855f7]/5 text-xs h-8">
              {processing ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Hashing…</> : <><Hash className="w-3.5 h-3.5 mr-1" /> Compute Hash</>}
            </Button>
            {prepared && (
              <Button size="sm" onClick={handleCommit} className="bg-[#2ed573] text-black hover:bg-[#26b860] text-xs h-8 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Commit Metadata
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => { setAddMode(false); setPrepared(null); }} className="text-gray-500 text-xs h-8">Cancel</Button>
          </div>
        </div>
      )}

      {/* Evidence items */}
      <div className="space-y-3">
        {evidence.map(ev => (
          <div key={ev.id} className="rounded-2xl border border-white/5 bg-[#0d1220] p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${typeColor[ev.evidence_type] || "#6b7280"}12`, border: `1px solid ${typeColor[ev.evidence_type] || "#6b7280"}20` }}>
                <File className="w-4 h-4" style={{ color: typeColor[ev.evidence_type] || "#6b7280" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-white text-sm">{ev.label}</h3>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded uppercase" style={{ color: typeColor[ev.evidence_type] || "#6b7280", backgroundColor: `${typeColor[ev.evidence_type] || "#6b7280"}12`, border: `1px solid ${typeColor[ev.evidence_type] || "#6b7280"}20` }}>{ev.evidence_type}</span>
                  {ev.verified ? (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded text-[#2ed573] bg-[#2ed573]/10 border border-[#2ed573]/20 flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" /> Verified</span>
                  ) : (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded text-[#ffa502] bg-[#ffa502]/10 border border-[#ffa502]/20 flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> Unverified</span>
                  )}
                </div>

                {/* Hash display */}
                <div className="bg-[#060a14] rounded-lg px-2.5 py-1.5 mb-2 border border-white/5">
                  <p className="text-[8px] font-mono text-gray-700 mb-0.5">SHA-256 · Stored in Entity</p>
                  <p className="text-[9px] font-mono text-[#a855f7] break-all">{ev.sha256}</p>
                </div>

                {ev.ipfs_cid ? (
                  <div className="bg-[#060a14] rounded-lg px-2.5 py-1.5 mb-2 border border-[#2ed573]/10">
                    <p className="text-[8px] font-mono text-gray-700 mb-0.5">IPFS CID · Content Address</p>
                    <p className="text-[9px] font-mono text-[#2ed573] break-all">{ev.ipfs_cid}</p>
                  </div>
                ) : (
                  <div className="bg-[#060a14] rounded-lg px-2.5 py-1.5 mb-2 border border-[#ffa502]/10">
                    <p className="text-[9px] font-mono text-[#ffa502]/60">IPFS CID pending — awaiting pin confirmation from node</p>
                  </div>
                )}

                <div className="flex items-center gap-3 text-[9px] font-mono text-gray-700">
                  <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{new Date(ev.prepared_at).toLocaleString()}</span>
                  <span>·</span>
                  <span>{(ev.size_bytes / 1024).toFixed(1)} KB</span>
                  <span>·</span>
                  <span>{ev.analyst}</span>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {ev.tags.map(t => (
                    <span key={t} className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/8 text-gray-600">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}