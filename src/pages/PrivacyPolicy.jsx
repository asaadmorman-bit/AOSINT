import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, ArrowLeft, Lock, Eye, Server, Globe, Mail } from "lucide-react";

export default function PrivacyPolicy() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const Section = ({ title, children }) => (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-3">{title}</h2>
      <div className="text-gray-300 leading-relaxed space-y-3">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <div className="bg-[#0d1220] border-b border-white/5 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl("Homepage")} className="inline-flex items-center gap-2 text-[#00d4ff] text-sm mb-4 hover:opacity-80">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <Lock className="w-8 h-8 text-[#00d4ff]" />
            <div>
              <h1 className="text-3xl font-black">Privacy Policy</h1>
              <p className="text-gray-400 text-sm mt-1">Effective Date: January 1, 2026 · Emerging Defense Solutions (EDS)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-[#00d4ff]/5 border border-[#00d4ff]/20 rounded-xl p-5 mb-10">
          <p className="text-gray-200 text-sm leading-relaxed">
            Emerging Defense Solutions ("EDS," "we," "our," or "us") is committed to protecting the privacy and security of all information entrusted to us through the ASOSINT platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you access or use our platform and services.
          </p>
        </div>

        <Section title="1. Information We Collect">
          <p><strong className="text-white">Account Information:</strong> When you register, we collect your name, email address, organization name, job role, and billing information.</p>
          <p><strong className="text-white">Usage Data:</strong> We automatically collect information about how you interact with the platform, including pages visited, features used, query patterns, and session duration — for the purpose of improving service delivery and security.</p>
          <p><strong className="text-white">Uploaded & Submitted Data:</strong> Any threat intelligence data, IOCs, logs, OSINT artifacts, or other content you upload or submit into ASOSINT is stored and processed solely to deliver the platform's services to you.</p>
          <p><strong className="text-white">Device & Technical Data:</strong> IP addresses, browser type, operating system, and authentication tokens are collected for security, fraud prevention, and platform stability.</p>
          <p><strong className="text-white">Communications:</strong> If you contact us for support or partnership, we retain correspondence to resolve your inquiry and improve our services.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc list-inside space-y-2">
            <li>To deliver, operate, and improve the ASOSINT platform and its AI capabilities</li>
            <li>To authenticate your identity and maintain account security</li>
            <li>To process billing and manage your subscription</li>
            <li>To communicate platform updates, security advisories, and product news</li>
            <li>To detect and prevent fraud, abuse, and unauthorized access</li>
            <li>To comply with legal obligations, regulatory requirements, and law enforcement requests</li>
            <li>To conduct internal research and improve threat detection models — using only anonymized, aggregated data</li>
          </ul>
          <p className="mt-3">We do <strong className="text-white">not</strong> sell your personal information to third parties. We do not use your submitted intelligence data to train shared AI models without your explicit consent.</p>
        </Section>

        <Section title="3. Data Sharing & Disclosure">
          <p><strong className="text-white">Service Providers:</strong> We engage trusted third-party vendors (cloud hosting, payment processors, email delivery) who access data only as necessary to provide their services and are bound by data processing agreements.</p>
          <p><strong className="text-white">Law Enforcement:</strong> We may disclose information if required by law, court order, or governmental authority, or when we believe in good faith that disclosure is necessary to protect safety, investigate fraud, or enforce our agreements.</p>
          <p><strong className="text-white">Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of that transaction, with notice provided to affected users.</p>
          <p><strong className="text-white">With Your Consent:</strong> We may share information for other purposes with your explicit consent.</p>
        </Section>

        <Section title="4. Data Retention">
          <p>We retain your account data for as long as your account is active or as needed to provide services. Upon account termination, we will delete or anonymize your personal data within 90 days, unless retention is required by law.</p>
          <p>Submitted intelligence data (IOCs, threat indicators, hunt tickets) is retained per your subscription tier's data retention policy. Enterprise and Gov/CI customers may configure custom retention windows.</p>
        </Section>

        <Section title="5. Security Measures">
          <p>ASOSINT is built with a security-first posture. We employ:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>Encryption in transit (TLS 1.3) and at rest (AES-256)</li>
            <li>Role-based access control (RBAC) and multi-tenant data isolation</li>
            <li>Continuous security monitoring and anomaly detection</li>
            <li>Regular penetration testing and vulnerability assessments</li>
            <li>SOC 2-aligned operational controls</li>
            <li>Incident response and breach notification procedures</li>
          </ul>
        </Section>

        <Section title="6. Your Rights">
          <p>Depending on your jurisdiction, you may have the following rights:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li><strong className="text-white">Access:</strong> Request a copy of your personal data</li>
            <li><strong className="text-white">Correction:</strong> Request correction of inaccurate data</li>
            <li><strong className="text-white">Deletion:</strong> Request deletion of your personal data</li>
            <li><strong className="text-white">Portability:</strong> Receive your data in a portable format</li>
            <li><strong className="text-white">Objection:</strong> Object to certain processing activities</li>
            <li><strong className="text-white">Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
          </ul>
          <p className="mt-3">To exercise your rights, contact us at <a href="mailto:privacy@eds-360.com" className="text-[#00d4ff]">privacy@eds-360.com</a>.</p>
        </Section>

        <Section title="7. Cookies & Tracking">
          <p>ASOSINT uses session cookies and local storage solely for authentication and platform functionality. We do not use third-party advertising cookies or behavioral tracking pixels. You may disable cookies in your browser, though this may affect platform functionality.</p>
        </Section>

        <Section title="8. International Transfers">
          <p>If you access ASOSINT from outside the United States, your data may be transferred to and processed in the United States. We ensure appropriate safeguards are in place for any such transfers, including Standard Contractual Clauses where applicable.</p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>ASOSINT is not intended for individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a minor has provided us personal data, we will promptly delete it.</p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>We may update this Privacy Policy periodically. Material changes will be communicated via email or a prominent notice on the platform at least 30 days before they take effect. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>
        </Section>

        <div className="bg-[#0d1220] border border-white/10 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Mail className="w-4 h-4 text-[#00d4ff]" /> Contact</h3>
          <p className="text-gray-400 text-sm">Emerging Defense Solutions · privacy@eds-360.com · (866) 208-3674</p>
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