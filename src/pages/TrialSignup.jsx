import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, AlertCircle, Loader2, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TIERS = [
  {
    id: "pro",
    name: "Pro",
    badge: "Most Popular",
    badgeColor: "#00d4ff",
    price: "Free 14-day trial",
    description: "Full platform access for individuals and small teams.",
    features: ["Full OSINT intelligence hub", "Threat actor tracking", "14-day trial period", "Email support"],
    trialDays: 14,
    requiresDomain: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: "30-Day Trial",
    badgeColor: "#a855f7",
    price: "Free 30-day trial",
    description: "Advanced capabilities for organizations. Company domain required.",
    features: ["Everything in Pro", "Multi-tenant support", "Priority support", "Company domain verification", "30-day trial period"],
    trialDays: 30,
    requiresDomain: true,
  },
  {
    id: "gov",
    name: "Gov / CI",
    badge: "Verified Access",
    badgeColor: "#f59e0b",
    price: "Free 30-day trial",
    description: "Compliance-verified access for government and CI agencies.",
    features: ["Everything in Enterprise", "Government/agency access", "Compliance verification", "Agency domain required", "30-day trial period"],
    trialDays: 30,
    requiresDomain: true,
  },
];

export default function TrialSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [tier, setTier] = useState("pro");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    company_name: "",
    company_domain: "",
    use_case: "",
  });

  const [errors, setErrors] = useState({});

  const selectedTier = TIERS.find((t) => t.id === tier);
  const requiresDomain = selectedTier?.requiresDomain;

  const validate = () => {
    const errs = {};
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = "Valid email required";
    if (!formData.full_name.trim()) errs.full_name = "Full name required";
    if (!formData.company_name.trim()) errs.company_name = "Company or organization name required";
    if (requiresDomain) {
      if (!formData.company_domain.trim()) errs.company_domain = "Company domain required for this tier";
      else {
        const emailDomain = formData.email.split("@")[1] || "";
        if (emailDomain && !emailDomain.endsWith(formData.company_domain.replace(/^\./, ""))) {
          errs.email = `Email domain must match ${formData.company_domain}`;
        }
      }
    }
    if (!formData.use_case.trim()) errs.use_case = "Please describe your primary use case";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // 1. Create trial signup record
      await base44.functions.invoke("createTrialSignup", {
        email: formData.email,
        full_name: formData.full_name,
        company_name: formData.company_name,
        company_domain: formData.company_domain || null,
        tier,
        use_case: formData.use_case,
      });

      // 2. Invite user to the platform (creates account & sends login email)
      await base44.users.inviteUser(formData.email, "user");

      // 3. Redirect to login pointing at Dashboard
      base44.auth.redirectToLogin(createPageUrl("Dashboard"));
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Sign-up failed. Please try again.";
      if (msg.toLowerCase().includes("domain")) setErrors({ email: msg });
      else setErrors({ _general: msg });
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ id, type = "text", placeholder, error }) => (
    <div>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={formData[id]}
        onChange={(e) => {
          setFormData({ ...formData, [id]: e.target.value });
          if (errors[id]) setErrors({ ...errors, [id]: "" });
        }}
        className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00d4ff] transition ${
          error ? "border-[#ff4757]" : "border-white/10 focus:border-[#00d4ff]"
        }`}
      />
      {error && <p className="text-xs text-[#ff4757] mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-3 flex items-center justify-between bg-[#0d1220]">
        <Link to={createPageUrl("Homepage")} className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#00d4ff]" />
          <span className="text-lg font-black">ASOSINT</span>
        </Link>
        <span className="text-xs text-gray-500">
          Already have an account?{" "}
          <button
            className="text-[#00d4ff] hover:underline"
            onClick={() => base44.auth.redirectToLogin(createPageUrl("Dashboard"))}
          >
            Sign in
          </button>
        </span>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s ? "bg-[#00d4ff] text-black" : "bg-white/10 text-gray-500"
                }`}>{s}</div>
                {s < 2 && <div className={`h-0.5 w-12 transition-all ${step > s ? "bg-[#00d4ff]" : "bg-white/10"}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Tier Selection */}
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black mb-2">Choose Your Trial Tier</h1>
                <p className="text-gray-400">Select the plan that best fits your needs. No credit card required.</p>
              </div>

              <div className="grid gap-4 mb-8">
                {TIERS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTier(t.id)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                      tier === t.id
                        ? "border-[#00d4ff] bg-[#00d4ff]/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 mt-1 shrink-0 flex items-center justify-center ${
                        tier === t.id ? "border-[#00d4ff]" : "border-gray-500"
                      }`}>
                        {tier === t.id && <div className="w-2.5 h-2.5 rounded-full bg-[#00d4ff]" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{t.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${t.badgeColor}20`, color: t.badgeColor }}>
                            {t.badge}
                          </span>
                          <span className="ml-auto text-xs text-gray-400">{t.price}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{t.description}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {t.features.map((f) => (
                            <span key={f} className="text-xs text-gray-500">✓ {f}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#0099cc] h-11" onClick={() => setStep(2)}>
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Details Form */}
          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black mb-2">Create Your Account</h1>
                <p className="text-gray-400">
                  Starting a <span className="text-[#00d4ff] font-semibold">{selectedTier?.name}</span> trial — {selectedTier?.trialDays} days free.
                </p>
              </div>

              <div className="bg-[#0d1220] border border-white/10 rounded-xl p-6 space-y-4">
                {errors._general && (
                  <div className="flex items-center gap-2 bg-[#ff4757]/10 border border-[#ff4757]/20 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 text-[#ff4757] shrink-0" />
                    <p className="text-xs text-[#ff4757]">{errors._general}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field id="full_name" placeholder="Full name" error={errors.full_name} />
                  <Field id="email" type="email" placeholder="Work email address" error={errors.email} />
                </div>

                <Field id="company_name" placeholder={tier === "gov" ? "Agency or organization name" : "Company name"} error={errors.company_name} />

                {requiresDomain && (
                  <div>
                    <div className="flex items-center gap-2 bg-[#ffa502]/10 border border-[#ffa502]/20 rounded-lg p-2.5 mb-2">
                      <AlertCircle className="w-4 h-4 text-[#ffa502] shrink-0" />
                      <p className="text-xs text-[#ffa502]">{selectedTier?.name} tier requires a verified company/agency domain</p>
                    </div>
                    <Field id="company_domain" placeholder="e.g. company.com or agency.gov" error={errors.company_domain} />
                  </div>
                )}

                <div>
                  <textarea
                    placeholder="Describe your primary use case (e.g., threat monitoring for financial sector, OSINT investigations, LEA intelligence gathering...)"
                    value={formData.use_case}
                    onChange={(e) => {
                      setFormData({ ...formData, use_case: e.target.value });
                      if (errors.use_case) setErrors({ ...errors, use_case: "" });
                    }}
                    rows={3}
                    className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00d4ff] transition resize-none ${
                      errors.use_case ? "border-[#ff4757]" : "border-white/10 focus:border-[#00d4ff]"
                    }`}
                  />
                  {errors.use_case && <p className="text-xs text-[#ff4757] mt-1">{errors.use_case}</p>}
                </div>

                <p className="text-xs text-gray-600">
                  By creating an account, you agree to the{" "}
                  <Link to={createPageUrl("TermsOfService")} className="text-[#00d4ff] hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link to={createPageUrl("PrivacyPolicy")} className="text-[#00d4ff] hover:underline">Privacy Policy</Link>.
                </p>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="border-white/10 text-gray-400 hover:text-white" onClick={() => setStep(1)} disabled={loading}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button
                    className="flex-1 bg-[#00d4ff] text-black hover:bg-[#0099cc] h-11 font-bold"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating account...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4 mr-2" /> Start Free Trial</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}