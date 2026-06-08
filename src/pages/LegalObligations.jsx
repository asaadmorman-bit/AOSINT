import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Scale, ArrowLeft, AlertTriangle, CheckCircle2, XCircle, Mail } from "lucide-react";

export default function LegalObligations() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const Section = ({ title, children }) => (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-3">{title}</h2>
      <div className="text-gray-300 leading-relaxed space-y-3">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <div className="bg-[#0d1220] border-b border-white/5 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl("Homepage")} className="inline-flex items-center gap-2 text-[#00d4ff] text-sm mb-4 hover:opacity-80">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <Scale className="w-8 h-8 text-[#00d4ff]" />
            <div>
              <h1 className="text-3xl font-black">Legal Obligations, Compliance & Liability</h1>
              <p className="text-gray-400 text-sm mt-1">What ASOSINT Is, What It Adheres To, and What It Is and Is Not Responsible For</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* What ASOSINT Is */}
        <div className="bg-[#00d4ff]/5 border border-[#00d4ff]/20 rounded-xl p-6 mb-10">
          <h3 className="text-lg font-bold text-[#00d4ff] mb-3">What ASOSINT Is</h3>
          <p className="text-gray-200 leading-relaxed">
            ASOSINT is a <strong>defensive intelligence and security operations platform</strong> developed and operated by Emerging Defense Solutions (EDS). It is designed to assist organizations, security professionals, law enforcement partners, and government entities in threat intelligence collection, analysis, correlation, and response planning. ASOSINT is a <strong>tool to support human decision-making</strong> — it does not make autonomous enforcement, legal, or law enforcement decisions on behalf of any user or entity.
          </p>
        </div>

        <Section title="1. Regulatory Frameworks We Adhere To">
          <p>EDS designs and operates ASOSINT in alignment with the following legal and regulatory frameworks:</p>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {[
              { label: "GDPR (EU 2016/679)", desc: "For processing data of EU residents — lawful basis, data subject rights, and DPA obligations" },
              { label: "CCPA / CPRA", desc: "California Consumer Privacy Act rights — access, deletion, opt-out of sale" },
              { label: "CFAA (Computer Fraud and Abuse Act)", desc: "Strict prohibition on unauthorized computer access — platform use must be authorized" },
              { label: "ECPA / Wiretap Act", desc: "Electronic communications privacy — no interception without authorization" },
              { label: "FISMA / NIST 800-53", desc: "Federal security standards alignment for government and critical infrastructure users" },
              { label: "SOC 2 Type II Principles", desc: "Security, availability, and confidentiality controls in our operations" },
              { label: "Export Control (EAR / ITAR)", desc: "No export of controlled dual-use technology to sanctioned entities or jurisdictions" },
              { label: "CISA Guidelines", desc: "Alignment with CISA advisories and defensive cybersecurity best practices" },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="font-semibold text-white text-sm">{item.label}</p>
                <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="2. What EDS Is Responsible For">
          <div className="space-y-3">
            {[
              "Providing a secure, available, and well-maintained platform",
              "Protecting user account data, submitted intelligence, and platform communications using industry-standard encryption and access controls",
              "Ensuring the platform's AI models are tested, monitored, and updated to maintain accuracy and reduce false positives",
              "Providing accurate documentation, release notes, and security advisories",
              "Responding to data breaches, security incidents, and vulnerability disclosures in a timely and transparent manner",
              "Complying with lawful government data requests and notifying users where legally permissible",
              "Maintaining an operational incident response and business continuity plan",
              "Providing user support and a clear dispute resolution process",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="3. What EDS Is NOT Responsible For">
          <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="font-bold text-red-300">Important Limitations of Liability</p>
            </div>
            <p className="text-gray-300 text-sm">The following are expressly outside the scope of EDS's responsibility and liability:</p>
          </div>
          <div className="space-y-3">
            {[
              "Actions taken by users based on intelligence outputs or AI-generated recommendations — users bear full legal and operational responsibility for their decisions",
              "Accuracy or completeness of third-party threat intelligence feeds integrated into the platform — EDS enriches and contextualizes data but cannot guarantee third-party source accuracy",
              "Unauthorized access to systems or networks by users using the platform — ASOSINT is a defensive tool; offensive use outside of explicitly authorized engagements is prohibited and user-liable",
              "Compliance with jurisdiction-specific laws that the user fails to observe (e.g., local privacy laws, sector-specific regulations) — it is the user's responsibility to ensure compliance in their jurisdiction",
              "Data loss or corruption caused by user error, misuse, or failure to follow platform documentation",
              "Consequential, incidental, or indirect damages arising from service interruptions, platform errors, or AI model inaccuracies",
              "Privacy violations caused by users submitting personal data they were not authorized to submit",
              "Legal or regulatory penalties assessed against users for non-compliant use of the platform",
              "Intelligence failures or security incidents that occur despite using the platform — ASOSINT enhances but does not guarantee security outcomes",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="4. Limitation of Liability">
          <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, EDS AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS INTERRUPTION, ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR YOUR USE OF THE SERVICES.</p>
          <p className="mt-3">EDS's total cumulative liability to you for any claims arising under or related to these Terms or the Services shall not exceed the total fees paid by you to EDS in the twelve (12) months preceding the claim.</p>
        </Section>

        <Section title="5. Disclaimer of Warranties">
          <p>THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>
          <p>EDS does not warrant that the platform will be error-free, uninterrupted, or free of harmful components. Intelligence outputs from the platform are provided for informational and operational support purposes only and should not be relied upon as the sole basis for legal, medical, law enforcement, or life-safety decisions.</p>
        </Section>

        <Section title="6. Indemnification">
          <p>You agree to indemnify, defend, and hold harmless EDS and its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or in any way connected with:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>Your access to or use of the Services</li>
            <li>Your violation of these Terms or any applicable law or regulation</li>
            <li>Your User Content or data submitted to the platform</li>
            <li>Any claim that your use of the platform infringed a third party's rights</li>
          </ul>
        </Section>

        <Section title="7. Export Controls & Sanctions Compliance">
          <p>You agree to comply with all applicable export control laws, including the U.S. Export Administration Regulations (EAR) and sanctions programs administered by OFAC. You represent that you are not located in, under the control of, or a national or resident of any country subject to U.S. trade sanctions, and that you are not on any U.S. government restricted party list.</p>
        </Section>

        <Section title="8. Law Enforcement Cooperation">
          <p>EDS will cooperate with lawful requests from government and law enforcement agencies, including subpoenas, court orders, and national security letters. Where legally permitted, EDS will notify affected users of such requests. EDS does not currently receive requests under Section 702 of FISA or similar bulk collection authorities for civilian commercial users.</p>
        </Section>

        <Section title="9. AI-Specific Disclosures">
          <p>ASOSINT uses artificial intelligence and machine learning to analyze threat data and generate intelligence recommendations. Users should be aware:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>AI outputs may contain errors, hallucinations, or biases — human review is required before acting on AI-generated intelligence</li>
            <li>Confidence scores are probabilistic estimates, not guarantees of accuracy</li>
            <li>AI models are continuously updated; outputs may vary over time</li>
            <li>EDS does not use your private data to train shared public AI models without consent</li>
          </ul>
        </Section>

        <div className="bg-[#0d1220] border border-white/10 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Mail className="w-4 h-4 text-[#00d4ff]" /> Legal Contact</h3>
          <p className="text-gray-400 text-sm">Emerging Defense Solutions · legal@eds-360.com · (866) 208-3674</p>
          <p className="text-gray-500 text-xs mt-2">For data subject requests, compliance inquiries, or legal notices.</p>
        </div>
      </div>

      <footer className="border-t border-white/5 py-6 px-4 bg-[#0d1220]">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-4 justify-center text-sm text-gray-500">
          <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-[#00d4ff] transition-colors">Privacy Policy</Link>
          <Link to={createPageUrl("TermsOfService")} className="hover:text-[#00d4ff] transition-colors">Terms of Service</Link>
          <Link to={createPageUrl("LegalObligations")} className="hover:text-[#00d4ff] transition-colors">Legal & Compliance</Link>
          <Link to={createPageUrl("Documentation")} className="hover:text-[#00d4ff] transition-colors">Documentation</Link>
        </div>
      </footer>
    </div>
  );
}