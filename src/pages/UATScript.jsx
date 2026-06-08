import React, { useState } from "react";
import { ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const SCENARIOS = [
  {
    id: 1,
    name: "Homepage & Hero Experience",
    goal: "Verify homepage loads, hero section displays correctly, and messaging is clear",
    steps: [
      "1. Navigate to ASOSINT Homepage",
      "2. Verify hero section with ASOSINT branding loads",
      "3. Check headline clarity and value proposition",
      "4. Verify all CTAs (Get Started, Learn More) are functional",
      "5. Confirm responsive design on desktop",
    ],
    criteria: [
      "Hero section renders with ASOSINT branding",
      "All text is readable and properly formatted",
      "CTAs navigate to correct destinations",
      "No layout breaks or missing elements",
      "Load time < 3 seconds",
    ],
    failures: [
      "Missing ASOSINT logo or branding",
      "Broken links in hero section",
      "Layout breaks on desktop",
      "Slow load times",
    ],
  },
  {
    id: 2,
    name: "Navigation & Site Structure",
    goal: "Verify navigation menu, sidebar, and site hierarchy function correctly",
    steps: [
      "1. Open ASOSINT application",
      "2. Test main navigation menu",
      "3. Verify all nav items are present and labeled correctly",
      "4. Test sidebar collapse/expand functionality",
      "5. Navigate through 3+ different sections",
      "6. Verify breadcrumbs display correctly (if applicable)",
    ],
    criteria: [
      "All nav items present and labeled with ASOSINT module names",
      "Navigation responsive on desktop and mobile",
      "Sidebar toggle works smoothly",
      "No dead links in navigation",
      "Current page highlighted in nav",
    ],
    failures: [
      "Missing nav items",
      "Broken navigation links",
      "Sidebar doesn't collapse",
      "Navigation breaks on mobile",
    ],
  },
  {
    id: 3,
    name: "Platform Overview & Modules",
    goal: "Verify platform overview page displays all ASOSINT modules correctly",
    steps: [
      "1. Navigate to Platform Overview",
      "2. Verify all 17 ASOSINT modules are listed",
      "3. Check module names match ASOSINT branding",
      "4. Verify module descriptions are present",
      "5. Test clicking into module cards",
      "6. Confirm tier gating displays correctly",
    ],
    criteria: [
      "All 17 modules displayed with correct ASOSINT naming",
      "Module descriptions accurate and clear",
      "Tier gating badges visible (Community/Pro/Enterprise/Gov)",
      "Module cards responsive and clickable",
      "No duplicate or missing modules",
    ],
    failures: [
      "Missing modules",
      "Incorrect module names",
      "Broken module links",
      "Tier gating not displaying",
    ],
  },
  {
    id: 4,
    name: "Module Deep Dive - Global Threat Observatory",
    goal: "Verify ASOSINT Global Threat Observatory functions and displays correctly",
    steps: [
      "1. Access Global Threat Observatory module",
      "2. Verify threat feed data loads",
      "3. Check threat indicators display with severity",
      "4. Test filtering by threat category",
      "5. Verify data refresh/update mechanism",
      "6. Test search functionality",
    ],
    criteria: [
      "Threat feeds load and display data",
      "Indicators show correct severity levels",
      "Filters work correctly",
      "Search returns relevant results",
      "No data loading errors",
    ],
    failures: [
      "No data displayed",
      "Broken filters or search",
      "Missing severity indicators",
      "Data doesn't refresh",
    ],
  },
  {
    id: 5,
    name: "Pricing & Tiers Page",
    goal: "Verify pricing page displays all tiers with correct features and pricing",
    steps: [
      "1. Navigate to Pricing page",
      "2. Verify Community, Pro, Enterprise, Gov/CI tiers display",
      "3. Check monthly vs annual pricing toggle",
      "4. Verify all tier features listed correctly",
      "5. Test CTA buttons for each tier",
      "6. Verify comparison table displays",
    ],
    criteria: [
      "All 4 tiers display with correct names and colors",
      "Pricing shows correctly for monthly/annual toggle",
      "Feature comparison table complete and accurate",
      "CTA buttons functional and labeled correctly",
      "Tier descriptions accurate",
    ],
    failures: [
      "Missing tiers",
      "Incorrect pricing",
      "Broken CTA buttons",
      "Missing features in comparison",
    ],
  },
  {
    id: 6,
    name: "About EDS & Founders",
    goal: "Verify About page displays EDS information and founder bios correctly",
    steps: [
      "1. Navigate to About/Company page",
      "2. Verify EDS company information displays",
      "3. Check founder names: Asaad Morman and Shauntze Morman",
      "4. Verify their credentials and backgrounds",
      "5. Confirm EDS contact info (info@eds-360.com)",
      "6. Verify mission statement is present",
    ],
    criteria: [
      "EDS information accurate and complete",
      "Both founders listed with correct credentials",
      "Asaad: Marine Corps veteran, enterprise architect, cybersecurity engineer",
      "Shauntze: Public safety leader, emergency communications, Security+ & CASP",
      "Contact email correct: info@eds-360.com",
      "Mission statement clear and present",
    ],
    failures: [
      "Incorrect founder names or credentials",
      "Missing contact information",
      "Outdated or incomplete company info",
    ],
  },
  {
    id: 7,
    name: "Partner Ecosystem",
    goal: "Verify partner portal, partner features, and partnership info display correctly",
    steps: [
      "1. Navigate to Partner section",
      "2. Verify partner portal accessible",
      "3. Check partner tier benefits displayed",
      "4. Test partner application/registration",
      "5. Verify partner resources available",
      "6. Check partner support contact",
    ],
    criteria: [
      "Partner portal loads and functions",
      "Partner tiers and benefits clearly defined",
      "Partner application process clear",
      "Support contact available",
      "No broken links in partner section",
    ],
    failures: [
      "Partner portal inaccessible",
      "Missing partner benefits info",
      "Broken partner application flow",
    ],
  },
  {
    id: 8,
    name: "Resources & Documentation",
    goal: "Verify resources, documentation, and knowledge base are accessible",
    steps: [
      "1. Navigate to Resources/Docs section",
      "2. Verify documentation index loads",
      "3. Check module guides are available",
      "4. Test search within docs",
      "5. Verify tutorial videos load (if present)",
      "6. Check FAQ section is complete",
    ],
    criteria: [
      "Documentation accessible and organized",
      "Module guides available for each ASOSINT module",
      "Search functionality works in docs",
      "No broken resource links",
      "FAQ covers common questions",
    ],
    failures: [
      "Documentation not loading",
      "Broken links in resources",
      "Missing module guides",
      "Search not working",
    ],
  },
  {
    id: 9,
    name: "Contact & Support",
    goal: "Verify contact forms, support channels, and response mechanisms work",
    steps: [
      "1. Navigate to Contact page",
      "2. Verify contact form displays",
      "3. Test form validation (required fields)",
      "4. Submit test contact form",
      "5. Verify email: info@eds-360.com",
      "6. Check support options display",
    ],
    criteria: [
      "Contact form loads and is functional",
      "Form validation works (required fields)",
      "Form submission processes correctly",
      "Email address info@eds-360.com is visible",
      "Support options clearly listed",
    ],
    failures: [
      "Contact form broken",
      "Form submission fails",
      "Invalid email address displayed",
      "Support options missing",
    ],
  },
  {
    id: 10,
    name: "Authentication Flow",
    goal: "Verify login, registration, and authentication flows work correctly",
    steps: [
      "1. Test login page loads",
      "2. Test account creation/registration",
      "3. Verify password reset flow",
      "4. Test logout functionality",
      "5. Verify session timeout behavior",
      "6. Check for auth error handling",
    ],
    criteria: [
      "Login form functional and secure",
      "Registration process completes",
      "Password reset emails send",
      "Logout clears session",
      "Error messages are clear",
    ],
    failures: [
      "Login/registration fails",
      "Password reset broken",
      "Session issues",
      "Unclear error messages",
    ],
  },
  {
    id: 11,
    name: "Tier Gating & Access Control",
    goal: "Verify tier-based access control functions correctly across features",
    steps: [
      "1. Test Community tier access (public features)",
      "2. Test Pro tier gating (attempt restricted features)",
      "3. Test Enterprise tier features",
      "4. Test Gov/CI tier features",
      "5. Verify upgrade prompts display",
      "6. Check feature availability messaging",
    ],
    criteria: [
      "Community users see correct feature set",
      "Pro users can access Pro features",
      "Enterprise features restricted correctly",
      "Gov/CI features properly gated",
      "Upgrade prompts clear and actionable",
      "Error messages explain restrictions",
    ],
    failures: [
      "Tier gating not enforced",
      "Users accessing restricted features",
      "Missing upgrade prompts",
      "Incorrect tier assignments",
    ],
  },
  {
    id: 12,
    name: "Cross-Module Workflows",
    goal: "Verify data flows correctly between ASOSINT modules",
    steps: [
      "1. Create data in one module (e.g., Threat Indicator)",
      "2. Verify data appears in related modules (Fusion Center, Threat Observatory)",
      "3. Test correlation between modules",
      "4. Verify dashboard aggregation",
      "5. Test filtering across modules",
      "6. Check for data consistency",
    ],
    criteria: [
      "Data syncs across modules within SLA",
      "Correlations displayed correctly",
      "Dashboard aggregates data accurately",
      "Cross-module filters work",
      "No data loss in transfers",
    ],
    failures: [
      "Data not syncing between modules",
      "Correlations missing",
      "Dashboard shows incorrect data",
      "Cross-module filters broken",
    ],
  },
  {
    id: 13,
    name: "Mobile Responsiveness",
    goal: "Verify application functions correctly on mobile devices (iOS/Android)",
    steps: [
      "1. Test on iPhone (14+) and Android (latest)",
      "2. Verify layout responsive on mobile",
      "3. Test navigation on mobile (hamburger menu)",
      "4. Test form input on mobile",
      "5. Verify touch interactions work",
      "6. Check mobile performance",
    ],
    criteria: [
      "Layout responsive on 375px+ screens",
      "Touch targets minimum 44x44px",
      "Navigation accessible on mobile",
      "Forms input correctly on mobile",
      "Load time < 5 seconds on mobile",
      "No horizontal scroll required",
    ],
    failures: [
      "Layout breaks on mobile",
      "Touch targets too small",
      "Navigation inaccessible on mobile",
      "Slow mobile performance",
    ],
  },
  {
    id: 14,
    name: "Accessibility Compliance",
    goal: "Verify WCAG 2.1 AA accessibility compliance",
    steps: [
      "1. Test keyboard navigation (Tab, Enter)",
      "2. Verify screen reader compatibility",
      "3. Check color contrast (text vs background)",
      "4. Verify alt text on images",
      "5. Check form labels associated correctly",
      "6. Test focus indicators visible",
    ],
    criteria: [
      "All interactive elements keyboard accessible",
      "Screen reader announces content correctly",
      "Text contrast ≥ 4.5:1",
      "All images have alt text",
      "Form labels properly associated",
      "Focus visible on all interactive elements",
    ],
    failures: [
      "Keyboard navigation broken",
      "Screen reader doesn't work",
      "Poor color contrast",
      "Missing alt text",
      "Unclear focus indicators",
    ],
  },
  {
    id: 15,
    name: "Performance & Load Times",
    goal: "Verify application meets performance benchmarks",
    steps: [
      "1. Measure homepage load time",
      "2. Measure module load time",
      "3. Test dashboard with data load",
      "4. Verify first contentful paint < 2s",
      "5. Check Core Web Vitals",
      "6. Test under slow network (3G simulation)",
    ],
    criteria: [
      "Homepage load < 3 seconds",
      "Modules load < 2 seconds",
      "First contentful paint < 2 seconds",
      "Core Web Vitals passing",
      "Performance on 3G acceptable (< 8s)",
    ],
    failures: [
      "Load times exceed targets",
      "Core Web Vitals failing",
      "Poor 3G performance",
      "Unoptimized images/assets",
    ],
  },
  {
    id: 16,
    name: "Security (Non-Invasive)",
    goal: "Verify basic security measures are in place",
    steps: [
      "1. Verify HTTPS enabled (padlock visible)",
      "2. Check for security headers (CSP, X-Frame-Options)",
      "3. Verify no sensitive data in URLs",
      "4. Test session timeout behavior",
      "5. Verify password fields masked",
      "6. Check CSRF tokens present in forms",
    ],
    criteria: [
      "HTTPS enabled",
      "Security headers present",
      "No sensitive data in URLs",
      "Session timeout works",
      "Password fields masked",
      "CSRF protection enabled",
    ],
    failures: [
      "HTTP instead of HTTPS",
      "Missing security headers",
      "Sensitive data in URLs",
      "Missing CSRF protection",
      "Unmasked password fields",
    ],
  },
];

export default function UATScript() {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#0d1220]">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-12 bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-black text-white mb-2">ASOSINT UAT Script</h1>
          <p className="text-gray-400">16 Comprehensive Test Scenarios for Complete Platform Validation</p>
          <p className="text-gray-500 text-sm mt-4">Contact: <a href="mailto:info@eds-360.com" className="text-[#00d4ff]">info@eds-360.com</a></p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Overview */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">UAT Scope & Objectives</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-white mb-2">Tester Roles</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Visitor (Public access)</li>
                <li>• Community (Free tier)</li>
                <li>• Pro (Paid tier)</li>
                <li>• Enterprise (Advanced tier)</li>
                <li>• Gov/CI (Government)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2">Testing Tools Required</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Desktop browser (Chrome, Firefox, Safari)</li>
                <li>• Mobile device (iOS/Android)</li>
                <li>• Screenshot tool (built-in or Snagit)</li>
                <li>• PDF/Doc editor for reporting</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Scenarios */}
        <div className="space-y-3">
          {SCENARIOS.map((scenario) => (
            <div key={scenario.id} className="bg-[#111827] border border-white/5 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === scenario.id ? null : scenario.id)}
                className="w-full px-6 py-4 flex items-start justify-between hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[#00d4ff] font-bold">#{scenario.id}</span>
                    <h3 className="font-bold text-white">{scenario.name}</h3>
                  </div>
                  <p className="text-sm text-gray-400">{scenario.goal}</p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform shrink-0 ml-4 ${
                    expanded === scenario.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expanded === scenario.id && (
                <div className="border-t border-white/5 px-6 py-6 space-y-6">
                  {/* Steps */}
                  <div>
                    <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                      <span className="text-[#00d4ff]">Steps</span>
                    </h4>
                    <ol className="space-y-2 text-sm text-gray-300 ml-4">
                      {scenario.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Acceptance Criteria */}
                  <div>
                    <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2ed573]" />
                      <span>Acceptance Criteria</span>
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-300 ml-4">
                      {scenario.criteria.map((criterion, i) => (
                        <li key={i}>✓ {criterion}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Fail Conditions */}
                  <div>
                    <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#ff4757]" />
                      <span>Fail Conditions</span>
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-300 ml-4">
                      {scenario.failures.map((failure, i) => (
                        <li key={i}>✗ {failure}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Test Report CTA */}
        <div className="mt-16 bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10 border border-[#00d4ff]/20 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Test?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-6">Document your findings using the ASOSINT UAT Test Report template. Record pass/fail status, issues, severity levels, and recommendations.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={createPageUrl("UATReportTemplate")}>
              <Button className="bg-[#00d4ff] text-black font-bold">View Test Report Template</Button>
            </Link>
            <a href="mailto:info@eds-360.com">
              <Button variant="outline" className="border-white/20">Submit Results</Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}