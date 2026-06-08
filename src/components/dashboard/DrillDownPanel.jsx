import React from "react";
import { ChevronLeft, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DrillDownPanel({ data, onClose, title }) {
  if (!data) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center">
      <div className="bg-[#111827] border border-white/10 rounded-t-xl md:rounded-xl w-full md:max-w-2xl md:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#111827] border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Section */}
          <div>
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Summary</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {data.summary && Object.entries(data.summary).map(([key, value]) => (
                <div key={key} className="bg-white/5 rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-gray-500 uppercase">{key.replace(/_/g, " ")}</p>
                  <p className="text-lg font-bold text-white mt-2">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Details Section */}
          {data.details && (
            <div>
              <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Details</h4>
              <div className="space-y-2">
                {Object.entries(data.details).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">{key.replace(/_/g, " ")}</p>
                      <p className="text-sm text-gray-200 font-mono break-all">{String(value)}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(String(value))}
                      className="text-gray-500 hover:text-[#00d4ff] transition-colors flex-shrink-0 ml-2"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Section */}
          {data.timeline && (
            <div>
              <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Timeline</h4>
              <div className="space-y-3">
                {data.timeline.map((event, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#00d4ff] mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{event.label}</p>
                      <p className="text-xs text-gray-500">{event.timestamp}</p>
                      {event.description && <p className="text-xs text-gray-400 mt-1">{event.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Items */}
          {data.relatedItems && (
            <div>
              <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Related Items</h4>
              <div className="space-y-2">
                {data.relatedItems.map((item, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm text-white font-medium">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.type}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button className="flex-1 bg-[#00d4ff] text-black font-bold">
              View Full Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}