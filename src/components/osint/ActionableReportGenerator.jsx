import React, { useState } from "react";
import { FileText, Download, Mail, Copy, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ActionableReportGenerator({ report, personName }) {
  const [generating, setGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(null);

  const generateReport = async () => {
    setGenerating(true);
    try {
      // Create structured report data for export
      const reportData = {
        subject: personName,
        generated_at: new Date().toISOString(),
        risk_score: report?.subject?.risk_score,
        risk_label: report?.subject?.risk_label,
        summary: report?.subject?.summary,
        trajectory: report?.risk_forecast?.trajectory,
        
        // Actionable sections
        immediate_actions: report?.recommended_actions?.immediate || [],
        short_term_actions: report?.recommended_actions?.short_term || [],
        long_term_actions: report?.recommended_actions?.long_term || [],
        
        security_risks: report?.security_risks || [],
        early_warnings: report?.risk_forecast?.early_warning_indicators || [],
        
        // Supporting evidence
        digital_footprint: report?.digital_footprint,
        threat_actor_interest: report?.threat_actor_interest,
        professional_profile: report?.professional_profile,
      };

      // Generate markdown report
      const markdown = generateMarkdownReport(reportData);
      setReportGenerated({ markdown, data: reportData });
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!reportGenerated) return;
    const blob = new Blob([reportGenerated.markdown], { type: "text/markdown" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${personName.replace(/\s+/g, "_")}_OSINT_Report_${new Date().toISOString().split("T")[0]}.md`;
    a.click();
  };

  const copyReport = () => {
    navigator.clipboard.writeText(reportGenerated.markdown);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-700/40">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" /> Actionable Report Generator
        </h3>
      </div>

      <div className="p-6 space-y-4">
        {!reportGenerated ? (
          <>
            <p className="text-xs text-gray-300 leading-relaxed">
              Generate a structured report with prioritized actions for decision makers, incident responders, and security teams.
            </p>
            <Button
              onClick={generateReport}
              disabled={generating}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating…</>
              ) : (
                <><FileText className="w-4 h-4 mr-2" /> Generate Report</>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-green-400 mb-3">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-semibold">Report generated successfully</span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={downloadReport}
                size="sm"
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                <Download className="w-3 h-3 mr-1" /> Download
              </Button>
              <Button
                onClick={copyReport}
                size="sm"
                variant="outline"
                className="flex-1 border-slate-600 text-gray-300 hover:bg-white/5"
              >
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
            </div>

            {/* Quick Summary */}
            <div className="mt-4 space-y-2 pt-4 border-t border-slate-700/40">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Report Contents</p>
              <div className="space-y-1 text-[10px] text-gray-400">
                <p>✓ Executive summary with risk score</p>
                <p>✓ {reportGenerated.data.immediate_actions.length} immediate actions (≤1 week)</p>
                <p>✓ {reportGenerated.data.short_term_actions.length} short-term actions (1-3 months)</p>
                <p>✓ {reportGenerated.data.long_term_actions.length} long-term actions</p>
                <p>✓ {reportGenerated.data.security_risks.length} security risks with context</p>
                <p>✓ {reportGenerated.data.early_warnings.length} early warning indicators</p>
                <p>✓ Supporting evidence and corroboration</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function generateMarkdownReport(data) {
  return `# OSINT Security Impact Analysis Report

**Subject:** ${data.subject}  
**Generated:** ${new Date(data.generated_at).toLocaleString()}  
**Risk Score:** ${data.risk_score}/100 (${data.risk_label || "Unknown"})  
**Risk Trajectory:** ${data.trajectory}

---

## Executive Summary

${data.summary || "No summary available."}

---

## Risk Trajectory

**Current Status:** ${data.trajectory}

${data.trajectory ? `The subject's risk profile is currently **${data.trajectory}**.` : ""}

---

## Actionable Recommendations

### Immediate Actions (≤1 week)

${
  data.immediate_actions.length > 0
    ? data.immediate_actions.map((action, i) => `${i + 1}. ${action}`).join("\n")
    : "- No immediate actions required."
}

### Short-Term Actions (1-3 months)

${
  data.short_term_actions.length > 0
    ? data.short_term_actions.map((action, i) => `${i + 1}. ${action}`).join("\n")
    : "- No short-term actions required."
}

### Long-Term Actions (3+ months)

${
  data.long_term_actions.length > 0
    ? data.long_term_actions.map((action, i) => `${i + 1}. ${action}`).join("\n")
    : "- No long-term actions required."
}

---

## Security Risks

${
  data.security_risks.length > 0
    ? data.security_risks
        .map(
          (risk) =>
            `### ${risk.category}\n\n**Severity:** ${risk.severity}  \n**Confidence:** ${risk.confidence || "Unknown"}\n\n${risk.description}`
        )
        .join("\n\n")
    : "No specific security risks identified."
}

---

## Early Warning Indicators

Monitor for the following indicators of increased risk:

${
  data.early_warnings.length > 0
    ? data.early_warnings.map((warning, i) => `${i + 1}. ${warning}`).join("\n")
    : "- No early warning indicators."
}

---

## Supporting Evidence

### Digital Footprint
${
  data.digital_footprint?.social_media_presence?.length > 0
    ? "**Social Media Presence:**\n" +
      data.digital_footprint.social_media_presence
        .map((sm) => `- ${sm.platform}: ${sm.likelihood}`)
        .join("\n")
    : "- No known social media presence."
}

${
  data.digital_footprint?.breach_exposure
    ? `\n**Breach/Credential Exposure:**\n- ${data.digital_footprint.breach_exposure.details}`
    : ""
}

### Threat Actor Interest
${
  data.threat_actor_interest
    ? `- **Nation-State:** ${data.threat_actor_interest.nation_state || "Low"}
- **Organized Crime:** ${data.threat_actor_interest.organized_crime || "Low"}
- **Hacktivism:** ${data.threat_actor_interest.hacktivism || "Low"}
- **Corporate Espionage:** ${data.threat_actor_interest.corporate_espionage || "Low"}`
    : "- Unable to assess threat actor interest."
}

---

## Methodology

This report is generated using AI-assisted analysis of publicly available information and OSINT feeds. All findings are based on observable indicators and should be corroborated with additional intelligence before taking action.

**Confidence Note:** All severity and confidence assessments are estimates and should be independently verified.

---

*Report generated by ASOSINT Platform. For legitimate security analysis purposes only.*
`;
}