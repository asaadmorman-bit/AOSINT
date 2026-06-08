import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShieldCheck, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Scale, Globe, Mail } from "lucide-react";

export default function AcceptableUsePolicy() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const Section = ({ title, children }) => (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-3">{title}</h2>
      <div className="text-gray-300 leading-relaxed space-y-3">{children}</div>
    </div>
  );

  const lawBadge = (label) => (
    <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-500/20 mr-1 mb-1">{label}</span>
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
            <ShieldCheck className="w-8 h-8 text-[#00d4ff]" />
            <div>
              <h1 className="text-3xl font-black">Acceptable Use Policy</h1>
              <p className="text-gray-400 text-sm mt-1">Effective Date: January 1, 2026 · Emerging Defense Solutions (EDS)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Preamble */}
        <div className="bg-[#00d4ff]/5 border border-[#00d4ff]/20 rounded-xl p-6 mb-10">
          <p className="text-gray-200 leading-relaxed text-sm">
            This Acceptable Use Policy ("AUP") establishes the standards of lawful, ethical, and responsible use of the ASOSINT platform and all associated services operated by Emerging Defense Solutions ("EDS"). This AUP applies to all users, organizations, agencies, and third parties accessing the platform and is incorporated by reference into the ASOSINT Terms of Service. Compliance with this AUP is mandatory. Violations may result in immediate account suspension, termination, reporting to law enforcement, or civil and criminal legal action.
          </p>
        </div>

        {/* Legal Framework Banner */}
        <div className="bg-slate-900/50 border border-slate-700/40 rounded-xl p-5 mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-[#00d4ff]" />
            <h3 className="font-bold text-white">Governing Legal Frameworks</h3>
          </div>
          <p className="text-gray-400 text-xs mb-3">This AUP is written in accordance with and compliance is required under the following legal frameworks:</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              "Computer Fraud & Abuse Act (CFAA) — 18 U.S.C. § 1030",
              "Electronic Communications Privacy Act (ECPA)",
              "Wiretap Act — 18 U.S.C. § 2511",
              "Stored Communications Act (SCA) — 18 U.S.C. § 2701",
              "CAN-SPAM Act",
              "Children's Online Privacy Protection Act (COPPA)",
              "California Consumer Privacy Act (CCPA/CPRA)",
              "Illinois BIPA",
              "Virginia CDPA",
              "Colorado Privacy Act",
              "EU GDPR (Regulation 2016/679)",
              "UK GDPR / Data Protection Act 2018",
              "Canada PIPEDA / Bill C-27",
              "Australian Privacy Act 1988",
              "NIST Cybersecurity Framework",
              "CISA Cybersecurity Advisories",
              "FISMA (Federal Information Security Management Act)",
              "HIPAA (Health Insurance Portability & Accountability Act)",
              "Gramm-Leach-Bliley Act (GLBA)",
              "Export Administration Regulations (EAR)",
              "International Traffic in Arms Regulations (ITAR)",
              "Budapest Convention on Cybercrime",
              "UNCAC (UN Convention Against Corruption)",
              "NIS2 Directive (EU 2022/2555)",
              "DC Code § 22-3571 (Computer-Related Crimes)",
            ].map((law, i) => (
              <span key={i} className="text-[9px] font-semibold px-2 py-0.5 rounded bg-blue-900/20 text-blue-300 border border-blue-500/20">{law}</span>
            ))}
          </div>
        </div>

        <Section title="1. Purpose & Scope">
          <p>This AUP governs all use of the ASOSINT platform, APIs, integrations, AI agents, data exports, and any derivative services. It applies to:</p>
          <ul className="list-disc list-inside space-y-1.5 mt-2">
            <li>Individual users and account holders</li>
            <li>Organizations and their employees, contractors, and agents</li>
            <li>Government agencies, law enforcement entities, and their designated personnel</li>
            <li>Third-party developers and API integrators</li>
            <li>Partners accessing the platform through reseller or referral agreements</li>
          </ul>
          <p>This AUP does not limit EDS's rights to enforce additional contractual obligations established in separate agreements.</p>
        </Section>

        <Section title="2. Permitted Uses">
          <p>ASOSINT is authorized for the following lawful, defensive, and professionally-oriented purposes:</p>
          <div className="space-y-3 mt-3">
            {[
              { title: "Threat Intelligence Operations", desc: "Collection, analysis, correlation, and dissemination of threat intelligence to protect organizational assets, networks, and data from cyber and physical threats." },
              { title: "Security Monitoring & Incident Response", desc: "Continuous monitoring of your own or your authorized clients' environments for security events; investigation and response to confirmed or suspected incidents." },
              { title: "Vulnerability Assessment & Management", desc: "Identification, prioritization, and remediation tracking of vulnerabilities within systems and networks you own, manage, or have explicit written authorization to assess." },
              { title: "Authorized Penetration Testing & Red Team Operations", desc: "Offensive security engagements conducted under a signed Rules of Engagement (ROE) document and written authorization from the target organization's authorized representative." },
              { title: "Open Source Intelligence (OSINT) Research", desc: "Collection and analysis of publicly available information for lawful security research, due diligence, background analysis, or protective intelligence purposes — conducted in compliance with the platform's data collection laws and the terms of each source platform." },
              { title: "Law Enforcement & Protective Intelligence", desc: "Use by duly authorized law enforcement, government, or protective service agencies for lawful investigations, threat assessment, and public safety operations within the scope of applicable authority and applicable legal process requirements." },
              { title: "Security Training & Certification", desc: "Use of the platform for education, skills development, certification programs, and security awareness training for professional development purposes." },
              { title: "Research & Academic Use", desc: "Legitimate academic and security research conducted with appropriate IRB oversight (where required), ethical guidelines, and responsible disclosure practices." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-green-900/10 border border-green-500/15 rounded-lg p-4">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="3. Prohibited Uses — Absolutely Forbidden">
          <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="font-bold text-red-300">Violations of the following constitute grounds for immediate termination and referral to law enforcement.</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              {
                title: "Unauthorized Computer Access",
                desc: "Accessing, probing, scanning, or exploiting any system, network, device, or data that you do not own or do not have explicit written authorization to access.",
                laws: ["CFAA 18 U.S.C. § 1030", "ECPA", "Budapest Convention Art. 2"]
              },
              {
                title: "Unlawful Surveillance & Stalking",
                desc: "Using the platform to monitor, track, surveil, or gather intelligence on individuals without lawful authority, including use for stalking, harassment, domestic abuse, or covert surveillance of private persons.",
                laws: ["Violence Against Women Act", "State Anti-Stalking Laws", "GDPR Art. 9", "ECPA"]
              },
              {
                title: "Unauthorized Interception of Communications",
                desc: "Intercepting, capturing, or accessing private electronic communications without all-party or one-party consent as required by applicable law.",
                laws: ["Wiretap Act 18 U.S.C. § 2511", "ECPA", "State Wiretapping Laws"]
              },
              {
                title: "Malware Development & Distribution",
                desc: "Using the platform to create, test, deploy, or distribute malicious code, ransomware, spyware, trojans, botnets, or any tool designed to cause unauthorized harm to systems or data.",
                laws: ["CFAA 18 U.S.C. § 1030(a)(5)", "18 U.S.C. § 2512", "Computer Misuse Act (UK)"]
              },
              {
                title: "Doxxing & Non-Consensual Personal Data Exposure",
                desc: "Collecting, aggregating, or publishing personal information about individuals for the purpose of harassment, intimidation, public shaming, or enabling third-party harm.",
                laws: ["CCPA", "GDPR", "State Privacy Laws", "Common Law Torts"]
              },
              {
                title: "Child Exploitation",
                desc: "Any use of the platform related to child sexual abuse material (CSAM), exploitation of minors, or violations of COPPA. All known violations will be reported to NCMEC and law enforcement immediately.",
                laws: ["COPPA", "PROTECT Act 18 U.S.C. § 2251", "18 U.S.C. § 2256"]
              },
              {
                title: "Export Control Violations",
                desc: "Exporting, re-exporting, or providing access to platform features, AI models, or data to individuals, organizations, or countries subject to U.S. or applicable international export controls or sanctions.",
                laws: ["EAR (15 C.F.R. Parts 730-774)", "ITAR (22 C.F.R. Parts 120-130)", "OFAC Sanctions Programs"]
              },
              {
                title: "Fraud, Impersonation & Social Engineering Against Unauthorized Targets",
                desc: "Using platform capabilities to commit fraud, impersonate law enforcement or government officials, or conduct social engineering campaigns against individuals or organizations that have not provided written authorization for such testing.",
                laws: ["18 U.S.C. § 912 (Impersonation)", "18 U.S.C. § 1343 (Wire Fraud)", "State Fraud Statutes"]
              },
              {
                title: "Discrimination & Civil Rights Violations",
                desc: "Using intelligence data or platform outputs to discriminate against individuals on the basis of race, color, religion, sex, national origin, disability, sexual orientation, gender identity, or any other protected characteristic.",
                laws: ["Civil Rights Act of 1964", "ADA", "Fair Housing Act", "GDPR Art. 22"]
              },
              {
                title: "Unauthorized Data Broking & Resale",
                desc: "Extracting, aggregating, or reselling data obtained through the platform for commercial data broking purposes, or sharing intelligence outputs with unauthorized third parties.",
                laws: ["CCPA/CPRA", "GDPR Art. 6", "FTC Act § 5"]
              },
              {
                title: "Facilitating Terrorism or Extremist Violence",
                desc: "Using the platform to support, plan, fund, recruit for, or facilitate any act of terrorism, mass violence, or violent extremism, including providing material support to designated terrorist organizations.",
                laws: ["18 U.S.C. § 2339A/B (Material Support)", "UN Security Council Resolutions", "EU Counter-Terrorism Directive"]
              },
              {
                title: "Platform Abuse & Service Disruption",
                desc: "Attempting to circumvent platform security controls, overload system resources through automated abuse, reverse engineer proprietary AI models, or disrupt the platform's availability for other users.",
                laws: ["CFAA 18 U.S.C. § 1030(a)(5)", "18 U.S.C. § 1037"]
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-red-900/10 border border-red-500/15 rounded-lg p-4">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  <p className="text-gray-400 text-sm mt-1 mb-2">{item.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {item.laws.map((law, j) => (
                      <span key={j} className="text-[9px] font-semibold px-2 py-0.5 rounded bg-blue-900/20 text-blue-300 border border-blue-500/20">{law}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="4. Law Enforcement & Government Agency Use">
          <p>Government agencies and law enforcement entities are subject to additional requirements:</p>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li>All use must be within the scope of lawful authority, applicable statutes, and departmental policy</li>
            <li>Intelligence collection activities must comply with the Fourth Amendment (U.S.) or equivalent constitutional protections in the applicable jurisdiction</li>
            <li>Cross-border intelligence sharing must comply with MLAT agreements, applicable data sharing treaties, and Privacy Shield successor frameworks</li>
            <li>Use of the platform in active criminal investigations must be consistent with agency legal authority and any applicable court orders or warrants</li>
            <li>Agencies are responsible for ensuring their use complies with the Privacy Act of 1974, applicable state privacy statutes, and civil liberties protections</li>
            <li>EDS may require agencies to provide a Memorandum of Understanding (MOU) or Agency Use Agreement for Gov/CI tier access</li>
          </ul>
        </Section>

        <Section title="5. OSINT & Open Source Data Collection Standards">
          <p>When using ASOSINT to collect, aggregate, or analyze open source data, users must:</p>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li>Comply with the Terms of Service of each third-party platform from which data is sourced</li>
            <li>Not circumvent technical access controls, CAPTCHAs, or rate limiting measures on external platforms</li>
            <li>Not collect or store special categories of personal data (health, biometric, religious, political, sexual orientation data) without explicit legal basis</li>
            <li>Apply data minimization principles — collect only what is necessary for the lawful purpose</li>
            <li>Maintain audit records of OSINT collection activities for accountability purposes</li>
            <li>Not use collected data beyond the purpose for which it was originally collected</li>
          </ul>
        </Section>

        <Section title="6. AI & Automated Decision-Making Standards">
          <p>When using ASOSINT's AI capabilities, users must:</p>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li>Not rely solely on AI outputs for enforcement, legal, medical, or life-safety decisions — human review is mandatory</li>
            <li>Not use AI-generated intelligence to make automated decisions that significantly affect individuals without human oversight, in compliance with GDPR Art. 22 and applicable AI governance frameworks</li>
            <li>Disclose to affected individuals when AI-generated analysis has materially influenced decisions about them, where required by law</li>
            <li>Not attempt to manipulate, adversarially attack, or extract training data from ASOSINT's AI models</li>
            <li>Report observed AI errors, biases, or unexpected outputs to EDS through the responsible disclosure process</li>
          </ul>
        </Section>

        <Section title="7. Data Handling & Privacy Obligations">
          <p>All users processing personal data through ASOSINT must:</p>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li>Have a documented lawful basis for processing personal data under applicable privacy law (GDPR Art. 6, CCPA, etc.)</li>
            <li>Not submit protected health information (PHI) to the platform without a signed Business Associate Agreement (BAA) with EDS</li>
            <li>Not submit classified government information above the platform's authorized classification level</li>
            <li>Apply appropriate data retention limits and purge personal data when it is no longer needed</li>
            <li>Honor data subject rights requests (access, deletion, portability) for personal data submitted to the platform</li>
            <li>Implement appropriate organizational security measures to prevent unauthorized disclosure of data accessed through the platform</li>
          </ul>
        </Section>

        <Section title="8. Incident Reporting Obligations">
          <p>Users must promptly notify EDS if they:</p>
          <ul className="list-disc list-inside space-y-2 mt-3">
            <li>Discover a security vulnerability in the ASOSINT platform (report to security@eds-360.com within 72 hours)</li>
            <li>Suspect their account credentials have been compromised</li>
            <li>Observe another user violating this AUP</li>
            <li>Experience a data breach involving data processed through the platform</li>
            <li>Receive a law enforcement or legal demand related to their use of the platform</li>
          </ul>
        </Section>

        <Section title="9. Enforcement & Consequences">
          <p>EDS reserves the right to investigate suspected violations of this AUP. Consequences for violations may include, depending on severity:</p>
          <div className="space-y-2 mt-3">
            {[
              { level: "Level 1 — Warning", desc: "Written notice for minor first-time violations with opportunity to cure", color: "text-yellow-400 bg-yellow-900/10 border-yellow-500/20" },
              { level: "Level 2 — Feature Restriction", desc: "Temporary restriction of specific platform capabilities pending investigation", color: "text-orange-400 bg-orange-900/10 border-orange-500/20" },
              { level: "Level 3 — Account Suspension", desc: "Immediate suspension pending full investigation and legal review", color: "text-red-400 bg-red-900/10 border-red-500/20" },
              { level: "Level 4 — Account Termination", desc: "Permanent termination with forfeiture of fees paid; data purged per retention policy", color: "text-red-400 bg-red-900/15 border-red-500/30" },
              { level: "Level 5 — Law Enforcement Referral", desc: "Reporting to FBI, CISA, NCMEC, or other applicable agencies; cooperation with legal process; civil litigation", color: "text-red-300 bg-red-900/20 border-red-500/40" },
            ].map((item, i) => (
              <div key={i} className={`flex items-start gap-3 border rounded-lg p-3 ${item.color}`}>
                <Scale className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">{item.level}</p>
                  <p className="text-gray-300 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4">EDS cooperates fully with all lawful law enforcement investigations and will provide records, logs, and user information in response to valid legal process without delay.</p>
        </Section>

        <Section title="10. Jurisdiction & Compliance Responsibility">
          <p>Users are solely responsible for ensuring their use of ASOSINT complies with all laws and regulations applicable in their jurisdiction, including local, state/provincial, national, and international law. EDS makes no representation that the platform is appropriate or lawful for use in all jurisdictions.</p>
          <p>Users operating in the European Union are reminded that processing of personal data through the platform is subject to GDPR and must comply with applicable national implementations. Users in Canada are subject to PIPEDA and applicable provincial privacy laws. Users in Australia must comply with the Privacy Act 1988 and Australian Privacy Principles.</p>
          <p>Any conflict between this AUP and applicable law shall be resolved in favor of the more restrictive standard.</p>
        </Section>

        <Section title="11. Updates to This Policy">
          <p>EDS reserves the right to update this AUP at any time to reflect changes in law, platform capabilities, or operational requirements. Material changes will be communicated via email and platform notice at least 30 days before taking effect. Continued use of the platform after changes constitutes acceptance of the updated AUP.</p>
        </Section>

        <div className="bg-[#0d1220] border border-white/10 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Mail className="w-4 h-4 text-[#00d4ff]" /> Report a Violation or Security Issue</h3>
          <p className="text-gray-400 text-sm">AUP violations: <a href="mailto:legal@eds-360.com" className="text-[#00d4ff]">legal@eds-360.com</a></p>
          <p className="text-gray-400 text-sm">Security vulnerabilities: <a href="mailto:security@eds-360.com" className="text-[#00d4ff]">security@eds-360.com</a></p>
          <p className="text-gray-400 text-sm">Privacy concerns: <a href="mailto:privacy@eds-360.com" className="text-[#00d4ff]">privacy@eds-360.com</a></p>
          <p className="text-gray-500 text-xs mt-3">Emerging Defense Solutions · (866) 208-3674 · Washington, D.C.</p>
        </div>
      </div>

      <footer className="border-t border-white/5 py-6 px-4 bg-[#0d1220]">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-4 justify-center text-sm text-gray-500">
          <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-[#00d4ff] transition-colors">Privacy Policy</Link>
          <Link to={createPageUrl("TermsOfService")} className="hover:text-[#00d4ff] transition-colors">Terms of Service</Link>
          <Link to={createPageUrl("LegalObligations")} className="hover:text-[#00d4ff] transition-colors">Legal & Compliance</Link>
          <Link to={createPageUrl("AcceptableUsePolicy")} className="hover:text-[#00d4ff] transition-colors">Acceptable Use Policy</Link>
          <Link to={createPageUrl("Documentation")} className="hover:text-[#00d4ff] transition-colors">Documentation</Link>
        </div>
      </footer>
    </div>
  );
}