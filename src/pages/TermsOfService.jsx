import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, ArrowLeft, Mail } from "lucide-react";

export default function TermsOfService() {
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
            <FileText className="w-8 h-8 text-[#00d4ff]" />
            <div>
              <h1 className="text-3xl font-black">Terms of Service</h1>
              <p className="text-gray-400 text-sm mt-1">Effective Date: January 1, 2026 · Emerging Defense Solutions (EDS)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 mb-10">
          <p className="text-gray-200 text-sm leading-relaxed">
            These Terms of Service ("Terms") govern your access to and use of the ASOSINT platform, products, and services ("Services") provided by Emerging Defense Solutions ("EDS"). By accessing or using the Services, you agree to be bound by these Terms. If you do not agree, do not access or use the Services.
          </p>
        </div>

        <Section title="1. Acceptance of Terms">
          <p>By creating an account, accessing the ASOSINT platform, or using any of our Services, you represent that:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>You are at least 18 years of age</li>
            <li>You have the legal authority to enter into these Terms on behalf of yourself or your organization</li>
            <li>Your use of the Services will comply with all applicable laws and regulations</li>
            <li>You will not use the Services for any unlawful or prohibited purpose</li>
          </ul>
        </Section>

        <Section title="2. License to Use">
          <p>Subject to these Terms, EDS grants you a limited, non-exclusive, non-transferable, revocable license to access and use the ASOSINT platform for your organization's internal security operations, intelligence analysis, and threat management purposes.</p>
          <p>You may not: sublicense, sell, resell, transfer, assign, or otherwise commercially exploit the platform; modify, reverse engineer, or create derivative works; use the platform to build a competing product or service; or access the platform through automated means except via our documented APIs.</p>
        </Section>

        <Section title="3. Permitted Use & Acceptable Use Policy">
          <p>ASOSINT is a <strong className="text-white">defensive intelligence and security operations platform</strong>. Permitted uses include:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>Threat hunting, monitoring, and detection within your own environment or client environments you are authorized to protect</li>
            <li>Intelligence analysis, IOC enrichment, and threat actor research</li>
            <li>Security operations, incident response, and vulnerability management</li>
            <li>Training and certification of security personnel</li>
            <li>Authorized red team / adversary emulation engagements with written authorization from the target organization</li>
          </ul>
          <p className="mt-3"><strong className="text-[#ff4757]">Prohibited uses include:</strong></p>
          <ul className="list-disc list-inside space-y-2 mt-2 text-gray-400">
            <li>Unauthorized access to systems, networks, or data you do not own or have explicit authorization to access</li>
            <li>Harassment, stalking, surveillance, or targeting of private individuals without lawful authority</li>
            <li>Generation or distribution of malware, exploits, or attack tooling for offensive purposes outside of authorized engagements</li>
            <li>Violating any applicable privacy law, computer fraud law, or export control regulation</li>
            <li>Using the platform to facilitate illegal discrimination, hate crimes, or targeted harm</li>
          </ul>
        </Section>

        <Section title="4. Account Responsibilities">
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify EDS of any unauthorized use of your account or any other security breach.</p>
          <p>Organizations using ASOSINT are responsible for ensuring that all users within their account comply with these Terms and applicable law. EDS is not liable for losses caused by unauthorized account access resulting from your failure to maintain credential security.</p>
        </Section>

        <Section title="5. Your Data & Content">
          <p>You retain all ownership rights to the intelligence data, IOCs, reports, and content you upload or create within ASOSINT ("User Content"). You grant EDS a limited, non-exclusive license to process and store your User Content solely to deliver the Services.</p>
          <p>You represent and warrant that your User Content does not violate any third-party rights, applicable laws, or these Terms. EDS reserves the right to remove User Content that violates these Terms without notice.</p>
        </Section>

        <Section title="6. Subscription, Billing & Cancellation">
          <p>Access to certain features requires a paid subscription. Subscription fees are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law or as explicitly stated in a separate agreement.</p>
          <p>You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. EDS reserves the right to modify pricing with 30 days advance notice.</p>
          <p>Failure to pay fees may result in suspension or termination of your account. EDS is not liable for data loss resulting from account suspension due to non-payment.</p>
        </Section>

        <Section title="7. Service Availability & Modifications">
          <p>EDS will use commercially reasonable efforts to ensure platform availability. However, we do not guarantee uninterrupted access and may perform maintenance, updates, or experience outages outside our control.</p>
          <p>EDS reserves the right to modify, suspend, or discontinue any feature or the entire Service at any time with reasonable notice. We are not liable to you or any third party for any such modification, suspension, or discontinuation.</p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>The ASOSINT platform, including its source code, AI models, design, trademarks, and all related intellectual property, is owned exclusively by Emerging Defense Solutions. Nothing in these Terms transfers any IP ownership to you.</p>
          <p>Feedback you provide about the Services may be used by EDS without obligation or compensation to you.</p>
        </Section>

        <Section title="9. Confidentiality">
          <p>Each party agrees to keep confidential any non-public information of the other party disclosed in connection with the Services, and to use such information only in connection with the Services. This obligation survives termination of these Terms for 3 years.</p>
        </Section>

        <Section title="10. Termination">
          <p>EDS may suspend or terminate your access to the Services immediately, without prior notice or liability, if you breach these Terms or engage in conduct that EDS reasonably believes poses a risk to the platform, other users, or third parties.</p>
          <p>Upon termination, your right to use the Services ceases immediately. You may export your data within 30 days of termination. After 30 days, your data may be permanently deleted.</p>
        </Section>

        <Section title="11. Dispute Resolution">
          <p>Any disputes arising under these Terms shall first be addressed through good-faith negotiation. If unresolved, disputes shall be submitted to binding arbitration under the rules of the American Arbitration Association, conducted in Washington, D.C.</p>
          <p>You waive any right to participate in a class action lawsuit or class-wide arbitration. Notwithstanding the foregoing, either party may seek injunctive or equitable relief in a court of competent jurisdiction.</p>
        </Section>

        <Section title="12. Governing Law">
          <p>These Terms shall be governed by the laws of the District of Columbia, without regard to its conflict of law provisions.</p>
        </Section>

        <Section title="13. Changes to Terms">
          <p>EDS reserves the right to update these Terms at any time. Material changes will be communicated via email or platform notice at least 30 days before they become effective. Continued use of the Services after changes are effective constitutes your acceptance of the new Terms.</p>
        </Section>

        <div className="bg-[#0d1220] border border-white/10 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Mail className="w-4 h-4 text-[#00d4ff]" /> Contact</h3>
          <p className="text-gray-400 text-sm">Emerging Defense Solutions · legal@eds-360.com · (866) 208-3674</p>
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