import React from "react";
import { FileText, Download, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

const STATUS_META = {
  paid: { label: "Paid", color: "#2ed573", icon: CheckCircle2 },
  open: { label: "Open", color: "#ffa502", icon: Clock },
  draft: { label: "Draft", color: "#6b7280", icon: FileText },
  void: { label: "Void", color: "#ff4757", icon: XCircle },
};

export default function InvoiceHistory({ invoices = [] }) {
  if (invoices.length === 0) return (
    <div className="text-center py-12">
      <FileText className="w-8 h-8 text-gray-700 mx-auto mb-3" />
      <p className="text-sm text-gray-600">No invoices yet</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {invoices.map((inv, i) => {
        const meta = STATUS_META[inv.status] || STATUS_META.draft;
        const Icon = meta.icon;
        return (
          <div key={inv.id || i}
            className="bg-[#0d1117] border border-white/5 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${meta.color}10`, border: `1px solid ${meta.color}15` }}>
              <Icon className="w-4 h-4" style={{ color: meta.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-bold text-white font-mono">{inv.invoice_number || `INV-${(i + 1).toString().padStart(4, "0")}`}</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                  style={{ background: `${meta.color}10`, color: meta.color }}>{meta.label}</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {inv.period_start ? format(new Date(inv.period_start), "MMM d") : "—"} –
                {inv.period_end ? format(new Date(inv.period_end), " MMM d, yyyy") : "—"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold font-mono text-white">${(inv.total_usd || 0).toLocaleString()}</p>
              {inv.paid_at && (
                <p className="text-[9px] text-gray-600">{format(new Date(inv.paid_at), "MMM d, yyyy")}</p>
              )}
            </div>
            <button
              onClick={() => {
                // In production: trigger PDF download or open invoice URL
                alert(`Invoice ${inv.invoice_number || i + 1} — $${inv.total_usd || 0}`);
              }}
              className="p-2 rounded-lg bg-white/5 text-gray-600 hover:text-white hover:bg-white/10 transition-colors shrink-0">
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}