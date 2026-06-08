import React, { useState } from "react";
import { Download, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SEVERITY_LEVELS = ["Critical", "High", "Medium", "Low"];
const TESTER_ROLES = ["Visitor", "Community", "Pro", "Enterprise", "Gov/CI"];
const SCENARIOS = [
  "Homepage & Hero Experience",
  "Navigation & Site Structure",
  "Platform Overview & Modules",
  "Module Deep Dive - Global Threat Observatory",
  "Pricing & Tiers Page",
  "About EDS & Founders",
  "Partner Ecosystem",
  "Resources & Documentation",
  "Contact & Support",
  "Authentication Flow",
  "Tier Gating & Access Control",
  "Cross-Module Workflows",
  "Mobile Responsiveness",
  "Accessibility Compliance",
  "Performance & Load Times",
  "Security (Non-Invasive)",
];

export default function UATReportTemplate() {
  const [formData, setFormData] = useState({
    testerName: "",
    roleTested: "",
    testDate: new Date().toISOString().split("T")[0],
    scenarioId: "",
    scenarioName: "",
    passFailStatus: "Fail",
    issueDescription: "",
    expectedBehavior: "",
    actualBehavior: "",
    severity: "Medium",
    screenshotsAttached: "No",
    recommendedFix: "",
    additionalNotes: "",
  });

  const handleExport = () => {
    const content = `
ASOSINT UAT TEST REPORT
========================

TESTER INFORMATION:
Name: ${formData.testerName}
Role Tested: ${formData.roleTested}
Date: ${formData.testDate}

SCENARIO DETAILS:
Scenario ID: ${formData.scenarioId}
Scenario Name: ${formData.scenarioName}
Test Result: ${formData.passFailStatus}

ISSUE DOCUMENTATION:
Description: ${formData.issueDescription}
Expected Behavior: ${formData.expectedBehavior}
Actual Behavior: ${formData.actualBehavior}
Severity: ${formData.severity}
Screenshots Attached: ${formData.screenshotsAttached}

RECOMMENDATIONS:
Fix: ${formData.recommendedFix}

ADDITIONAL NOTES:
${formData.additionalNotes}

------------------------
Submit to: info@eds-360.com
    `;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
    element.setAttribute("download", `ASOSINT_UAT_Report_${formData.testerName}_${formData.testDate}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#0d1220] px-6 py-12">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-black text-white mb-2">ASOSINT UAT Test Report</h1>
        <p className="text-gray-400">Document and submit test results for ASOSINT platform validation</p>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto bg-[#111827] border border-white/5 rounded-xl p-8">
        <div className="space-y-8">
          {/* Section 1: Tester Information */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-[#00d4ff]">1.</span> Tester Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tester Name *</label>
                <Input
                  placeholder="Your full name"
                  value={formData.testerName}
                  onChange={(e) => setFormData({ ...formData, testerName: e.target.value })}
                  className="bg-[#0a0e1a] border-white/10"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Role Tested *</label>
                  <Select value={formData.roleTested} onValueChange={(val) => setFormData({ ...formData, roleTested: val })}>
                    <SelectTrigger className="bg-[#0a0e1a] border-white/10">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {TESTER_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Test Date *</label>
                  <Input
                    type="date"
                    value={formData.testDate}
                    onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                    className="bg-[#0a0e1a] border-white/10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Scenario Details */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-[#00d4ff]">2.</span> Scenario Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Scenario *</label>
                <Select
                  value={formData.scenarioName}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      scenarioName: val,
                      scenarioId: SCENARIOS.indexOf(val) + 1,
                    })
                  }
                >
                  <SelectTrigger className="bg-[#0a0e1a] border-white/10">
                    <SelectValue placeholder="Select scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCENARIOS.map((scenario, i) => (
                      <SelectItem key={scenario} value={scenario}>
                        #{i + 1} — {scenario}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Test Result *</label>
                <Select value={formData.passFailStatus} onValueChange={(val) => setFormData({ ...formData, passFailStatus: val })}>
                  <SelectTrigger className="bg-[#0a0e1a] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pass"><span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2ed573]" /> Pass</span></SelectItem>
                    <SelectItem value="Fail"><span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-[#ff4757]" /> Fail</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 3: Issue Documentation */}
          {formData.passFailStatus === "Fail" && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#ff4757]" />
                <span>3.</span> Issue Documentation
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Issue Description *</label>
                  <Textarea
                    placeholder="What is the issue? Be specific and detailed."
                    value={formData.issueDescription}
                    onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                    className="bg-[#0a0e1a] border-white/10 h-24"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Expected Behavior *</label>
                    <Textarea
                      placeholder="What should happen?"
                      value={formData.expectedBehavior}
                      onChange={(e) => setFormData({ ...formData, expectedBehavior: e.target.value })}
                      className="bg-[#0a0e1a] border-white/10 h-20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Actual Behavior *</label>
                    <Textarea
                      placeholder="What actually happened?"
                      value={formData.actualBehavior}
                      onChange={(e) => setFormData({ ...formData, actualBehavior: e.target.value })}
                      className="bg-[#0a0e1a] border-white/10 h-20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Severity Level *</label>
                    <Select value={formData.severity} onValueChange={(val) => setFormData({ ...formData, severity: val })}>
                      <SelectTrigger className="bg-[#0a0e1a] border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEVERITY_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Screenshots Attached</label>
                    <Select value={formData.screenshotsAttached} onValueChange={(val) => setFormData({ ...formData, screenshotsAttached: val })}>
                      <SelectTrigger className="bg-[#0a0e1a] border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Recommended Fix</label>
                  <Textarea
                    placeholder="How should this be fixed?"
                    value={formData.recommendedFix}
                    onChange={(e) => setFormData({ ...formData, recommendedFix: e.target.value })}
                    className="bg-[#0a0e1a] border-white/10 h-20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Additional Notes */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-[#00d4ff]">{formData.passFailStatus === "Fail" ? "4" : "3"}</span> Additional Notes
            </h2>
            <Textarea
              placeholder="Any other observations or context?"
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              className="bg-[#0a0e1a] border-white/10 h-24"
            />
          </div>

          {/* Submit Section */}
          <div className="border-t border-white/5 pt-8">
            <p className="text-sm text-gray-500 mb-4">
              Submit completed reports to: <span className="text-[#00d4ff]">info@eds-360.com</span>
            </p>
            <div className="flex gap-3">
              <Button onClick={handleExport} className="bg-[#00d4ff] text-black font-bold gap-2">
                <Download className="w-4 h-4" /> Export Report
              </Button>
              <a href="mailto:info@eds-360.com?subject=ASOSINT%20UAT%20Test%20Report%20-%20" className="flex-1">
                <Button variant="outline" className="w-full border-white/20 gap-2">
                  <Send className="w-4 h-4" /> Email Report
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}