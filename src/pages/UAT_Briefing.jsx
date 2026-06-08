import React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export default function UAT_Briefing() {
  const briefingContent = `ASOINT User Acceptance Testing (UAT) Briefing Packet
Version 1.0 | February 26, 2026
Contact: info@eds-360.com

MISSION
Validate that the ASOINT website and platform ecosystem function correctly for real users across all roles, tiers, and modules.

SCOPE
This UAT covers:
- Website structure and navigation
- UI/UX and responsive design
- Content accuracy and consistency
- Module functionality (all 13 modules)
- Tier gating and access control
- Authentication workflows
- Cross-module integrations
- Performance metrics
- Accessibility compliance (WCAG 2.1 AA)
- Security posture (non-invasive)

TESTER ROLES
- Unauthenticated Visitor
- Community User
- Pro User
- Enterprise User
- Gov/CI User
- Partner (MSP, Integrator, Government)
- Executive/Leadership
- Analyst/Operator
- Engineer/Architect

KEY RESPONSIBILITIES
- Follow each scenario step-by-step
- Document pass/fail outcomes
- Capture screenshots of failures
- Provide severity ratings (Critical, High, Medium, Low)
- Submit completed reports to: info@eds-360.com

TESTING ENVIRONMENT
URL: [Production URL]
Browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
Mobile: iOS Safari 14+, Android Chrome 90+

TIMELINE
- Kickoff: 1 day
- Smoke Testing: 2 days
- Comprehensive Testing: 5 days
- Regression Testing: 2 days
- Sign-Off: 1 day
Total: 11 days

SEVERITY DEFINITIONS
Critical: Blocks workflow, data loss, security issue → Fix before go-live
High: Major feature broken, confusing UX → Fix before go-live
Medium: Minor feature missing, inconsistency → Next release
Low: Typo, cosmetic issue → Backlog

SUCCESS CRITERIA
✓ 100% of Critical path tests pass
✓ 95%+ of all test cases pass
✓ Zero unresolved Critical issues
✓ Zero unresolved High issues
✓ All 13 modules functional
✓ All tier gating validated
✓ Mobile responsiveness confirmed
✓ Accessibility baseline met
✓ Security posture acceptable

16 SCENARIOS
1. Homepage & First Impression
2. Navigation & Site Structure
3. Platform Overview
4. Module Deep Dive (13 modules)
5. Pricing & Tiers
6. About EDS & Founders
7. Partner Ecosystem
8. Resources & Documentation
9. Contact & Communication
10. Authentication & Account Workflows
11. Tier Gating & Access Control
12. Cross-Module Workflows
13. Mobile Responsiveness
14. Accessibility (WCAG 2.1 AA)
15. Performance
16. Security Posture (Non-Invasive)

CONTACT
Email: info@eds-360.com
For questions or to submit test reports

IMPORTANT
- Test across all user roles and device types
- Document every issue with screenshots
- Ensure tier gating prevents unauthorized access
- Validate all cross-module workflows
- Test accessibility with screen readers
- Check performance on mobile (4G simulation)
- Non-invasive security testing only

All UAT materials are production-ready and modular.`;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">ASOINT UAT Briefing Packet</h1>
          <p className="text-xl text-gray-400">Complete User Acceptance Testing materials for ASOINT platform and website.</p>
        </div>

        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Download Complete UAT Suite</h2>
          <p className="text-gray-300 mb-6">
            The complete ASOINT UAT suite includes: Briefing Packet, Full UAT Script (16 scenarios), 
            Test Report Template, and Sign-Off Form.
          </p>
          <Button className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20">
            <Download className="w-4 h-4 mr-2" />
            Download Complete UAT Suite (.zip)
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6">
            <FileText className="w-6 h-6 text-[#00d4ff] mb-3" />
            <h3 className="font-bold mb-2">UAT Script</h3>
            <p className="text-sm text-gray-400">16 complete test scenarios covering all platform aspects</p>
          </div>
          <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6">
            <FileText className="w-6 h-6 text-[#00d4ff] mb-3" />
            <h3 className="font-bold mb-2">Test Report</h3>
            <p className="text-sm text-gray-400">Standardized template for documenting test issues</p>
          </div>
          <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6">
            <FileText className="w-6 h-6 text-[#00d4ff] mb-3" />
            <h3 className="font-bold mb-2">Sign-Off Form</h3>
            <p className="text-sm text-gray-400">Final approval and deployment authorization</p>
          </div>
          <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6">
            <FileText className="w-6 h-6 text-[#00d4ff] mb-3" />
            <h3 className="font-bold mb-2">Briefing</h3>
            <p className="text-sm text-gray-400">Tester orientation and role definitions</p>
          </div>
        </div>

        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">16 UAT Scenarios</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "1. Homepage & First Impression",
              "2. Navigation & Site Structure",
              "3. Platform Overview",
              "4. Module Deep Dive (13 modules)",
              "5. Pricing & Tiers",
              "6. About EDS & Founders",
              "7. Partner Ecosystem",
              "8. Resources & Documentation",
              "9. Contact & Communication",
              "10. Authentication Workflows",
              "11. Tier Gating & Access Control",
              "12. Cross-Module Workflows",
              "13. Mobile Responsiveness",
              "14. Accessibility (WCAG 2.1 AA)",
              "15. Performance",
              "16. Security Posture (Non-Invasive)",
            ].map((scenario, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-white/5">
                <span className="text-[#00d4ff] font-bold text-sm">{String(idx + 1).padStart(2, "0")}</span>
                <span className="text-gray-300 text-sm">{scenario}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Tester Roles</h2>
          <div className="space-y-2 text-gray-300">
            <p>✓ Unauthenticated Visitor</p>
            <p>✓ Community User</p>
            <p>✓ Pro User</p>
            <p>✓ Enterprise User</p>
            <p>✓ Gov/CI User</p>
            <p>✓ Partner (MSP, Integrator, Government)</p>
            <p>✓ Executive/Leadership</p>
            <p>✓ Analyst/Operator</p>
            <p>✓ Engineer/Architect</p>
          </div>
        </div>

        <div className="bg-[#0d1220] border border-white/5 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Success Criteria</h2>
          <div className="space-y-2 text-gray-300">
            <p>✓ 100% of Critical path tests pass</p>
            <p>✓ 95%+ of all test cases pass</p>
            <p>✓ Zero unresolved Critical issues</p>
            <p>✓ Zero unresolved High issues</p>
            <p>✓ All 13 modules accessible & functional</p>
            <p>✓ Tier gating correct for all roles</p>
            <p>✓ Mobile responsiveness confirmed</p>
            <p>✓ WCAG 2.1 AA accessibility baseline met</p>
            <p>✓ Security posture acceptable</p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
          <h2 className="text-2xl font-bold mb-4">How to Use This UAT Suite</h2>
          <ol className="space-y-3 text-gray-300">
            <li className="flex gap-3">
              <span className="text-[#00d4ff] font-bold">1.</span>
              <span>Download the complete UAT Suite (includes all 4 documents)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#00d4ff] font-bold">2.</span>
              <span>Review the Briefing Packet as tester to understand scope and responsibilities</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#00d4ff] font-bold">3.</span>
              <span>Execute test scenarios from the UAT Script following step-by-step instructions</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#00d4ff] font-bold">4.</span>
              <span>Document all issues (screenshots required) using the Test Report Template</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#00d4ff] font-bold">5.</span>
              <span>Submit completed reports to: info@eds-360.com</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#00d4ff] font-bold">6.</span>
              <span>Upon completion, sign off using the UAT Sign-Off Form</span>
            </li>
          </ol>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
          <h2 className="text-xl font-bold mb-4">Contact & Support</h2>
          <p className="text-gray-300 mb-4">
            For questions about the UAT suite, test scenarios, or to submit your completed test reports:
          </p>
          <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6">
            <p className="text-lg font-bold text-[#00d4ff] mb-2">Email: info@eds-360.com</p>
            <p className="text-gray-400 text-sm">
              Subject line format: "ASOINT UAT - [Scenario ID] - [Issue Type]"
            </p>
          </div>
        </div>

        <div className="mt-12 text-center pt-8 border-t border-white/5">
          <p className="text-gray-500 text-sm">
            ASOINT UAT Suite • Version 1.0 • February 26, 2026<br />
            Created by Emerging Defense Solutions (EDS)<br />
            All materials are production-ready and modular
          </p>
        </div>
      </div>
    </div>
  );
}