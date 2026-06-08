import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, Building2, Mail, Globe } from "lucide-react";

const PARTNER_TYPES = [
  { id: "msp", label: "Managed Security Provider", desc: "Deliver SOINT to downstream customers" },
  { id: "systems_integrator", label: "Systems Integrator", desc: "Deploy SOINT into enterprise environments" },
  { id: "training", label: "Training Partner", desc: "Deliver SOINT training & certifications" },
  { id: "technology", label: "Technology Partner", desc: "Integrate SOINT with third-party tools" },
  { id: "government", label: "Government Partner", desc: "Support sovereign & classified deployments" },
];

const INDUSTRIES = [
  "Finance", "Healthcare", "Technology", "Government", "Defense", "Retail",
  "Energy", "Manufacturing", "Telecommunications", "Transportation", "Other"
];

const REGIONS = ["North America", "Europe", "APAC", "LATAM", "Middle East & Africa", "Global"];

export default function PartnerOnboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    company_name: "",
    partner_type: "",
    website: "",
    industries: [],
    regions: [],
    primary_contact_name: "",
    primary_contact_email: "",
    company_size: "",
    requested_tier: "registered",
  });

  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const result = await base44.functions.invoke("submitPartnerApplication", data);
      return result.data;
    },
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = async () => {
    if (!formData.company_name || !formData.partner_type || !formData.primary_contact_email) {
      alert("Please fill in all required fields");
      return;
    }
    submitMutation.mutate(formData);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#060a0f] text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-16 h-16 text-[#2ed573] mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Application Submitted!</h1>
          <p className="text-gray-400 mb-6">
            Thank you for your interest in the SOINT Partner Program. Our team will review your application and reach out within 5 business days.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-300">Partner ID: <span className="font-mono">{submitMutation.data?.partner_id}</span></p>
          </div>
          <Button className="w-full bg-[#00d4ff] text-black font-bold">Return to SOINT</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a0f] text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-8 h-8 text-[#00d4ff]" />
            <h1 className="text-3xl font-bold">SOINT Partner Program</h1>
          </div>
          <p className="text-gray-400">Join our partner ecosystem and expand your service offerings</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step >= s ? "bg-[#00d4ff] text-black" : "bg-white/10 text-gray-500"
                }`}
              >
                {s}
              </div>
              {s < 3 && <div className="flex-1 h-0.5 bg-white/10" />}
            </React.Fragment>
          ))}
        </div>

        {/* Form */}
        <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Company Information</h2>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-2">Company Name *</label>
                <Input
                  placeholder="Acme Security Inc."
                  value={formData.company_name}
                  onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                  className="bg-black/30 border-white/10 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-2">Website</label>
                <Input
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  className="bg-black/30 border-white/10 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-2">Company Size *</label>
                <select
                  value={formData.company_size}
                  onChange={e => setFormData({ ...formData, company_size: e.target.value })}
                  className="w-full h-9 rounded-lg bg-black/30 border border-white/10 px-3 text-sm text-gray-300"
                >
                  <option value="">Select size...</option>
                  {["1-10", "11-50", "51-200", "201-1000", "1000+"].map(s => (
                    <option key={s} value={s} className="bg-[#0d1117]">{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-2">Industries *</label>
                <div className="grid grid-cols-2 gap-2">
                  {INDUSTRIES.map(ind => (
                    <button
                      key={ind}
                      onClick={() => {
                        const current = formData.industries;
                        setFormData({
                          ...formData,
                          industries: current.includes(ind) ? current.filter(i => i !== ind) : [...current, ind]
                        });
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        formData.industries.includes(ind)
                          ? "bg-[#00d4ff] text-black"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} className="bg-[#00d4ff] text-black font-bold">
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Partner Type & Regions</h2>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-3">Partner Type *</label>
                <div className="space-y-2">
                  {PARTNER_TYPES.map(pt => (
                    <button
                      key={pt.id}
                      onClick={() => setFormData({ ...formData, partner_type: pt.id })}
                      className={`w-full p-3 rounded-lg border transition-all text-left ${
                        formData.partner_type === pt.id
                          ? "border-[#00d4ff] bg-[#00d4ff]/10"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="font-medium text-sm">{pt.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{pt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-3">Regions *</label>
                <div className="grid grid-cols-2 gap-2">
                  {REGIONS.map(reg => (
                    <button
                      key={reg}
                      onClick={() => {
                        const current = formData.regions;
                        setFormData({
                          ...formData,
                          regions: current.includes(reg) ? current.filter(r => r !== reg) : [...current, reg]
                        });
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        formData.regions.includes(reg)
                          ? "bg-[#00d4ff] text-black"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {reg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button onClick={() => setStep(1)} variant="outline" className="border-white/10">
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="bg-[#00d4ff] text-black font-bold">
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Contact Information</h2>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-2">Primary Contact Name *</label>
                <Input
                  placeholder="Jane Smith"
                  value={formData.primary_contact_name}
                  onChange={e => setFormData({ ...formData, primary_contact_name: e.target.value })}
                  className="bg-black/30 border-white/10 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 block mb-2">Email Address *</label>
                <Input
                  type="email"
                  placeholder="jane@example.com"
                  value={formData.primary_contact_email}
                  onChange={e => setFormData({ ...formData, primary_contact_email: e.target.value })}
                  className="bg-black/30 border-white/10 text-sm"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-xs text-gray-300">
                  By submitting this application, you agree to our Partner Program Terms of Service and acknowledge our data privacy policy.
                </p>
              </div>

              <div className="flex justify-between">
                <Button onClick={() => setStep(2)} variant="outline" className="border-white/10">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="bg-[#00d4ff] text-black font-bold gap-2"
                >
                  {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Questions? Contact partnerships@soint.io</p>
        </div>
      </div>
    </div>
  );
}