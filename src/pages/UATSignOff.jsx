import React, { useState } from "react";
import { CheckCircle2, Download, Send } from "lucide-react";
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

const COMPLETION_CRITERIA = [
  "All Critical issues resolved",
  "All High issues resolved or assigned",
  "Medium/Low issues documented",
  "All workflows validated",
  "All modules functional",
  "All tier gating correct",
  "All content accurate",
  "All integrations stable",
];

export default function UATSignOff() {
  const [formData, setFormData] = useState({
    uatLeadName: "",
    uatLeadSignature: "",
    uatSignatureDate: new Date().toISOString().split("T")[0],
    approverName: "",
    approverSignature: "",
    approverDate: new Date().toISOString().split("T")[0],
    completionStatus: {},
    notes: "",
  });

  const [completedCriteria, setCompletedCriteria] = useState(
    COMPLETION_CRITERIA.reduce((acc, criterion) => {
      acc[criterion] = false;
      return acc;
    }, {})
  );

  const handleExport = () => {
    const completedList = Object.entries(completedCriteria)
      .map(([criterion, completed]) => `${completed ? "✓" : "✗"} ${criterion}`)
      .join("\n");

    const content = `
ASOSINT UAT COMPLETION & SIGN-OFF FORM
======================================

PROJECT: ASOSINT
OWNER: Emerging Defense Solutions

COMPLETION CRITERIA:
${completedList}

UAT LEAD:
Name: ${formData.uatLeadName}
Signature: ${formData.uatLeadSignature}
Date: ${formData.uatSignatureDate}

EDS APPROVER:
Name: ${formData.approverName}
Signature: ${formData.approverSignature}
Date: ${formData.approverDate}

NOTES:
${formData.notes}

------------------------
Submit to: info@eds-360.com
    `;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
    element.setAttribute("download", `ASOSINT_UAT_SignOff_${formData.uatLeadName}_${new Date().toISOString().split("T")[0]}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const allCriteriaComplete = Object.values(completedCriteria).every(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#0d1220] px-6 py-12">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl font-black text-white mb-2">ASOSINT UAT Completion & Sign-Off</h1>
        <p className="text-gray-400">Final approval form for ASOSINT platform validation completion</p>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto bg-[#111827] border border-white/5 rounded-xl p-8">
        <div className="space-y-8">
          {/* Project Info */}
          <div className="bg-[#0a0e1a] rounded-lg p-6 border border-white/5">
            <h2 className="font-bold text-white mb-4">Project Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Project Name</p>
                <p className="text-lg font-bold text-white">ASOSINT</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Platform Owner</p>
                <p className="text-lg font-bold text-white">Emerging Defense Solutions (EDS)</p>
              </div>
            </div>
          </div>

          {/* Completion Criteria */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#2ed573]" />
              <span>Completion Criteria Checklist</span>
            </h2>
            <div className="space-y-2">
              {COMPLETION_CRITERIA.map((criterion) => (
                <label key={criterion} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={completedCriteria[criterion] || false}
                    onChange={(e) =>
                      setCompletedCriteria({
                        ...completedCriteria,
                        [criterion]: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#00d4ff]"
                  />
                  <span className="text-sm text-gray-300">{criterion}</span>
                  {completedCriteria[criterion] && (
                    <CheckCircle2 className="w-4 h-4 text-[#2ed573] ml-auto" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="bg-[#0a0e1a] rounded-lg p-6 border border-white/5">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${allCriteriaComplete ? "bg-[#2ed573]" : "bg-[#ffa502]"}`} />
              <p className="text-sm text-gray-300">
                {allCriteriaComplete
                  ? "All completion criteria met. Ready for sign-off."
                  : "Some criteria not yet completed. Please review."}
              </p>
            </div>
          </div>

          {/* UAT Lead Sign-Off */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-[#00d4ff]">1.</span> UAT Lead Authorization
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">UAT Lead Name *</label>
                <Input
                  placeholder="Full name"
                  value={formData.uatLeadName}
                  onChange={(e) => setFormData({ ...formData, uatLeadName: e.target.value })}
                  className="bg-[#0a0e1a] border-white/10"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Signature *</label>
                  <Input
                    placeholder="Type signature or initials"
                    value={formData.uatLeadSignature}
                    onChange={(e) => setFormData({ ...formData, uatLeadSignature: e.target.value })}
                    className="bg-[#0a0e1a] border-white/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
                  <Input
                    type="date"
                    value={formData.uatSignatureDate}
                    onChange={(e) => setFormData({ ...formData, uatSignatureDate: e.target.value })}
                    className="bg-[#0a0e1a] border-white/10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* EDS Approver Sign-Off */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-[#a855f7]">2.</span> EDS Approver Authorization
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">EDS Approver Name *</label>
                <Input
                  placeholder="Full name"
                  value={formData.approverName}
                  onChange={(e) => setFormData({ ...formData, approverName: e.target.value })}
                  className="bg-[#0a0e1a] border-white/10"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Signature *</label>
                  <Input
                    placeholder="Type signature or initials"
                    value={formData.approverSignature}
                    onChange={(e) => setFormData({ ...formData, approverSignature: e.target.value })}
                    className="bg-[#0a0e1a] border-white/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
                  <Input
                    type="date"
                    value={formData.approverDate}
                    onChange={(e) => setFormData({ ...formData, approverDate: e.target.value })}
                    className="bg-[#0a0e1a] border-white/10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Additional Notes</h2>
            <Textarea
              placeholder="Any final observations, outstanding issues, or recommendations..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-[#0a0e1a] border-white/10 h-28"
            />
          </div>

          {/* Submit */}
          <div className="border-t border-white/5 pt-8">
            <p className="text-sm text-gray-500 mb-4">
              Submit sign-off form to: <span className="text-[#00d4ff]">info@eds-360.com</span>
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleExport}
                disabled={!allCriteriaComplete || !formData.uatLeadName || !formData.approverName}
                className="bg-[#00d4ff] text-black font-bold gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Export Sign-Off
              </Button>
              <a
                href={`mailto:info@eds-360.com?subject=ASOSINT%20UAT%20Sign-Off%20-%20${formData.uatLeadName}`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full border-white/20 gap-2">
                  <Send className="w-4 h-4" /> Email Sign-Off
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}