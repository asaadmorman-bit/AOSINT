import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SecurityPostureReportButton() {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error

  const generateReport = async () => {
    setStatus("loading");
    try {
      // Use fetch directly since we need a binary (PDF) response
      const res = await fetch(`/functions/generateSecurityPostureReport`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate report");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().split("T")[0];
      a.download = `ASOSINT_Security_Posture_Report_${today}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (e) {
      console.error(e);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const labels = {
    idle: { text: "Export PDF Report", icon: FileText },
    loading: { text: "Generating...", icon: Loader2 },
    done: { text: "Downloaded!", icon: CheckCircle2 },
    error: { text: "Failed — Retry", icon: FileText },
  };

  const isLoading = status === "loading";

  return (
    <Button
      onClick={generateReport}
      disabled={isLoading}
      className={`flex items-center gap-2 text-xs font-semibold transition-all
        ${status === "done" ? "bg-green-600/20 text-green-300 border border-green-500/30" :
          status === "error" ? "bg-red-600/20 text-red-300 border border-red-500/30" :
          "bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20"}`}
      variant="ghost"
    >
      {status === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
       status === "done" ? <CheckCircle2 className="w-3.5 h-3.5" /> :
       <FileText className="w-3.5 h-3.5" />}
      {status === "idle" ? "Export PDF Report" :
       status === "loading" ? "Generating..." :
       status === "done" ? "Downloaded!" : "Failed — Retry"}
    </Button>
  );
}