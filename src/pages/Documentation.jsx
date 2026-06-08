import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  BookOpen, ArrowLeft, ChevronRight, Search, Crown, Users, Shield, Cpu,
  Crosshair, Globe2, Brain, Zap, FileText, Target, LayoutDashboard,
  Settings, HelpCircle, CheckCircle2, AlertTriangle, Play, Eye
} from "lucide-react";

const AUDIENCE_TABS = [
  { id: "executive", label: "Executive", icon: Crown, color: "text-amber-400" },
  { id: "analyst", label: "Analyst / SOC", icon: Shield, color: "text-blue-400" },
  { id: "admin", label: "Admin / IT", icon: Settings, color: "text-green-400" },
  { id: "developer", label: "Developer / API", icon: Cpu, color: "text-purple-400" },
];

const DOCS = {
  executive: [
    {
      icon: Crown,
      title: "Executive Overview",
      subtitle: "What is ASOSINT and why it matters",
      content: [
        { heading: "What Is ASOSINT?", body: "ASOSINT is a unified intelligence operations platform built by Emerging Defense Solutions. It consolidates cyber threat intelligence, physical security indicators, adversary tracking, AI-powered anomaly detection, and automated playbook execution into a single command environment. Think of it as your organization's mission control for security — everything visible, correlated, and actionable in one place." },
        { heading: "Business Value", body: "Organizations using ASOSINT reduce mean time to detect (MTTD) and mean time to respond (MTTR) by surfacing threats automatically before they escalate. Executives gain real-time situational awareness without needing to interpret raw technical data — dashboards translate intelligence into risk scores, trends, and recommended actions." },
        { heading: "Key Executive Capabilities", body: "• Executive Dashboard with risk posture overview\n• One-click Intel Briefs summarizing top threats to your sector\n• Vulnerability exposure trends with remediation status\n• Agent performance metrics showing your security team's effectiveness\n• Threat actor tracking relevant to your industry and geography" },
        { heading: "How to Get Started (5 Minutes)", body: "1. Navigate to the Executive Dashboard from the sidebar\n2. Review the current threat posture and active incidents\n3. Read the AI-generated Intel Brief for your organization\n4. Set your notification preferences in your profile\n5. Schedule a monthly review cadence with your security team using the Reports module" },
        { heading: "Key Metrics to Monitor", body: "• Overall Risk Score (0–100) on the Executive Dashboard\n• Open Critical Vulnerabilities — should trend toward zero\n• Active Hunt Tickets — higher volume = proactive team\n• Playbook Execution Success Rate — target >90%\n• Agent Task Completion Rate — efficiency of your AI workforce" },
      ]
    },
    {
      icon: Eye,
      title: "Monitoring for Executives",
      subtitle: "Stay informed without getting lost in the weeds",
      content: [
        { heading: "Weekly Review Checklist", body: "• Check Executive Dashboard for risk score changes\n• Review any new Critical or High severity hunt tickets\n• Scan the Intel Brief for sector-relevant threat updates\n• Review vulnerability remediation progress\n• Check if any playbooks were auto-triggered (indicates real incidents)" },
        { heading: "Understanding Risk Scores", body: "Risk scores are composite values (0–100) calculated from vulnerability severity, exploit availability, threat actor activity targeting your sector, and anomaly detection outputs. A score above 70 should prompt an immediate call with your security team. 50–70 warrants a review meeting within 48 hours." },
        { heading: "Escalation Triggers", body: "You will receive alerts (if configured) when: a Critical severity threat indicator is discovered matching your assets, a hunt ticket is escalated, a playbook auto-executes due to an anomaly, or a vulnerability with known active exploitation is found in your environment." },
      ]
    },
  ],
  analyst: [
    {
      icon: Crosshair,
      title: "Threat Hunting",
      subtitle: "Hunt proactively for threats that evade detection",
      content: [
        { heading: "Overview", body: "The Threat Hunting module provides three core capabilities: Hunt Tickets (structured investigation workflows), Hunt Scanner (AI-powered active scanning), IOC Enrichment (enrich indicators with threat intelligence and attack vector prediction), and Anomaly Detection (AI behavioral analysis of historical data mapped to MITRE ATT&CK)." },
        { heading: "Creating a Hunt Ticket", body: "Navigate to Threat Hunting → Hunt Tickets → New Hunt. Fill in the hunt hypothesis (what threat behavior are you looking for?), select data sources and target assets, assign severity, and set a timeline. The AI will suggest relevant TTPs and data queries based on your hypothesis." },
        { heading: "IOC Enrichment Workflow", body: "1. Go to Threat Hunting → IOC Enrichment\n2. Enter a single IOC (IP, domain, hash, URL, email, CVE) or use Batch mode to upload a file\n3. Select playbooks you want auto-updated with enrichment results\n4. Click Enrich — the AI will query threat intelligence and predict attack vectors within 30–60 seconds\n5. Review MITRE ATT&CK mappings, malware families, and hunting steps in the results" },
        { heading: "Anomaly Detection on Historical Data", body: "1. Go to Threat Hunting → Anomaly Detection\n2. Select your data source type (auth logs, network flows, endpoint logs, etc.)\n3. Paste or upload the raw log data\n4. Click Detect Anomalies — the AI performs two-stage analysis: behavioral anomaly identification followed by MITRE ATT&CK TTP correlation\n5. For Critical/High findings, a Hunt Ticket and IR Playbook are automatically created" },
        { heading: "Understanding Confidence Scores", body: "Confidence scores (0–100%) represent the AI's certainty in a finding based on available evidence. Scores above 80% warrant immediate investigation. 60–80% should be investigated within 24 hours. Below 60% can be queued for routine review. Always apply analyst judgment — AI confidence is probabilistic, not absolute." },
      ]
    },
    {
      icon: Shield,
      title: "Indicators & Threat Feeds",
      subtitle: "Manage your threat intelligence pipeline",
      content: [
        { heading: "Threat Indicators", body: "Navigate to Intelligence → Indicators to view, search, filter, and manage all Indicators of Compromise (IOCs) in your environment. You can filter by type (IP, domain, hash, URL), severity, confidence, and source. Click any indicator to view full enrichment data, associated threat actors, and hunting recommendations." },
        { heading: "Integrating Threat Feeds", body: "Go to Intelligence → Threat Feeds → Add Feed. ASOSINT supports STIX/TAXII, MISP, and generic JSON/CSV feeds. Provide the feed URL, authentication credentials, and ingestion frequency. The platform will automatically parse, normalize, deduplicate, and correlate incoming indicators against your existing data and detection rules." },
        { heading: "Detection Rules", body: "After indicators are ingested, the platform automatically cross-correlates them with your detection rule library. Matched rules are flagged and can trigger playbook executions automatically if the relevant playbook trigger type is set to 'ioc_discovery'." },
      ]
    },
    {
      icon: Target,
      title: "Vulnerability Management",
      subtitle: "Find, prioritize, and remediate vulnerabilities",
      content: [
        { heading: "Running a Scan", body: "Go to Analysis → Vulnerability Mgmt → Scan tab. Select scan type (Full, Quick, Targeted, or Compliance), choose target assets, name the scan, and click Launch. The AI scanner simulates a real vulnerability assessment, cross-referencing CVE databases, threat intelligence feeds, and active exploitation data." },
        { heading: "Prioritization Logic", body: "ASOSINT calculates a Priority Score (0–100) for each finding using: CVSS base score, exploitability sub-score, whether active exploitation is confirmed in the wild, threat actor interest, and threat intelligence feed matches. Findings with Priority Score > 80 should be addressed within 24–72 hours." },
        { heading: "Remediation Tasks", body: "For Critical and High findings, ASOSINT auto-generates AgentTasks with specific remediation steps. These appear in the Agent Ops module and can be assigned to team members. Track remediation progress in the Vulnerability Management Findings tab by updating status to 'In Remediation' or 'Remediated'." },
      ]
    },
    {
      icon: Play,
      title: "Playbooks & Automation",
      subtitle: "Automate your incident response and threat hunting",
      content: [
        { heading: "What Are Playbooks?", body: "Playbooks are automated workflows that define step-by-step responses to security events. They can be triggered manually, by IOC discoveries, anomaly detections, or on a schedule. Each playbook step can assign tasks to AI agents, perform data enrichment, send notifications, or make decisions based on findings." },
        { heading: "Creating a Playbook", body: "Navigate to the Playbook Execution Engine → Playbook Library → New Playbook. Define the name, type (Threat Hunt, Incident Response, Investigation, etc.), trigger type, and add workflow steps. Each step specifies an agent type, task objective, dependencies, timeout, and failure behavior." },
        { heading: "Auto-Generated Playbooks", body: "The Anomaly Detection engine automatically creates IR Playbooks when Critical or High severity anomalies are found. These appear in your Playbook Library tagged 'auto_generated' and are immediately active. Review and refine them as needed." },
        { heading: "Playbook Suggestions", body: "The AI Playbook Suggestion Engine analyzes your execution history, agent feedback, and threat hunting successes to recommend new playbooks or modifications to existing ones. Review suggestions in the Playbook Suggestion Engine and accept, modify, or dismiss each one." },
      ]
    },
  ],
  admin: [
    {
      icon: Settings,
      title: "Platform Administration",
      subtitle: "Configure, manage, and monitor ASOSINT for your organization",
      content: [
        { heading: "Initial Setup Checklist", body: "1. Set up your organization profile in Admin Console\n2. Invite users and assign roles (Admin, Analyst, Viewer)\n3. Configure data sources in Intelligence → Threat Feeds\n4. Set up assets in Analysis → Assets (critical for vulnerability scanning)\n5. Configure notification preferences and alert thresholds\n6. Review and activate default playbooks in the Playbook Library\n7. Set data retention policies per your compliance requirements" },
        { heading: "User Management", body: "Go to Admin Console → Users to invite, manage roles, and deactivate users. Roles available: Admin (full access), User/Analyst (operational access), and custom roles. Role-based access controls ensure analysts can only see data within their scope. Multi-tenant isolation ensures different teams or clients cannot access each other's data." },
        { heading: "Asset Management", body: "Navigate to Analysis → Assets to register all organizational assets (servers, endpoints, applications, cloud resources). Assets are used by the vulnerability scanner, anomaly detection, and playbook execution to scope operations and prioritize findings. Maintain accurate asset inventory for best results." },
        { heading: "Data Source Configuration", body: "In Intelligence → Data Sources, configure integrations with your existing security tools. ASOSINT supports API integrations, file imports, webhook ingestion, and SDK-based custom connectors. Configure authentication, ingestion frequency, and data field mappings for each source." },
        { heading: "Audit & Compliance", body: "All user actions, data access events, and playbook executions are logged in the Security Audit Log (Admin Console → Audit Log). Logs include timestamps, user IDs, action types, and data accessed. Export audit logs for SIEM integration or compliance reporting." },
      ]
    },
    {
      icon: Brain,
      title: "AI Agent Management",
      subtitle: "Configure, monitor, and optimize your AI agent workforce",
      content: [
        { heading: "Agent Types", body: "ASOSINT supports multiple agent types: Threat Hunters (proactive scanning), Analysts (data enrichment and correlation), Responders (automated incident response), Investigators (deep-dive analysis), and Monitors (continuous surveillance). Each agent type has specialized capabilities and autonomy configurations." },
        { heading: "Autonomy Levels", body: "Agents can operate at three autonomy levels:\n• Supervised: All decisions require human approval before action\n• Semi-Autonomous: Routine decisions made automatically, novel or high-impact decisions escalated\n• Fully Autonomous: All decisions made automatically within defined policy guardrails\n\nStart with Supervised for new deployments and graduate to higher autonomy as confidence is built." },
        { heading: "Performance Monitoring", body: "Monitor agent performance in AI Agents → Model Lifecycle → Performance Analytics. Key metrics: task success rate (target >90%), false positive rate (target <10%), average response time, and escalation rate. Review the Improvement Trend indicator — 'declining' agents should be retrained." },
        { heading: "Agent Feedback & Training", body: "Use the feedback system to rate agent outputs (1–5 stars) and provide corrective guidance when agents make errors. Corrective feedback is accumulated into Training Datasets and used to continuously improve agent accuracy. The Training Dashboard shows which agents have pending feedback and training recommendations." },
      ]
    },
  ],
  developer: [
    {
      icon: Cpu,
      title: "Platform Architecture",
      subtitle: "Technical overview for developers and integrators",
      content: [
        { heading: "Technology Stack", body: "ASOSINT's frontend is built on React 18 with Tailwind CSS and runs on a modern cloud infrastructure. The backend uses serverless Deno functions for integrations and processing. The data layer uses a managed database with role-based multi-tenant isolation. AI capabilities are powered by large language model APIs with structured JSON output schemas." },
        { heading: "Backend Functions", body: "Custom backend functions handle integrations with external APIs, data processing, and AI orchestration. Key functions include:\n• enrichIOCWithThreatIntel — IOC enrichment and attack vector prediction\n• detectAnomaliesFromData — AI behavioral anomaly detection + MITRE correlation\n• runVulnerabilityScan — Vulnerability scanning and prioritization\n• executePlaybook — Playbook execution orchestration\n• integrateThreatFeeds — Multi-format threat feed ingestion\n• analyzePlaybookPatterns — AI playbook suggestion engine" },
        { heading: "Data Entities", body: "Core entities: ThreatIndicator, HuntTicket, Playbook, PlaybookExecution, AgentProfile, AgentTask, VulnerabilityFinding, VulnerabilityScan, ThreatAnomalyDetection, AnomalyAlert, ThreatFeed, Asset, ThreatActor, Campaign. All entities support CRUD via the SDK with RBAC filtering. Real-time subscriptions are available for live dashboard updates." },
        { heading: "SDK Usage", body: "Import the base44 SDK: `import { base44 } from '@/api/base44Client';`\n\nEntity operations:\n• base44.entities.ThreatIndicator.list() — fetch all\n• base44.entities.ThreatIndicator.filter({status:'active'}) — filtered fetch\n• base44.entities.ThreatIndicator.create({...}) — create record\n• base44.entities.ThreatIndicator.update(id, {...}) — update\n• base44.entities.ThreatIndicator.delete(id) — delete\n• base44.entities.ThreatIndicator.subscribe(callback) — real-time updates" },
        { heading: "Invoking Backend Functions", body: "Call backend functions from the frontend:\n```js\nconst res = await base44.functions.invoke('enrichIOCWithThreatIntel', {\n  ioc: '185.220.101.45',\n  ioc_type: 'ip',\n  playbook_ids_to_update: ['pb_123']\n});\nconsole.log(res.data);\n```\nFunction responses follow the Axios response structure: `res.data` contains the payload." },
        { heading: "Integrations", body: "Built-in integrations available via `base44.integrations.Core`:\n• InvokeLLM — AI inference with optional JSON schema output and web context\n• SendEmail — Transactional email\n• UploadFile — File storage (returns file_url)\n• GenerateImage — AI image generation\n• ExtractDataFromUploadedFile — Parse CSV/Excel/PDF/JSON into structured data\n\nExternal OAuth integrations: Google BigQuery (authorized), plus Slack, Notion, Salesforce, HubSpot, and more." },
      ]
    },
    {
      icon: Zap,
      title: "Custom Integrations & Extensions",
      subtitle: "Extend ASOSINT with custom data sources and workflows",
      content: [
        { heading: "Custom Data Sources", body: "Use the Data Sources module (Intelligence → Data Sources) to register custom API integrations, file imports, or webhook endpoints. Configure field mappings to normalize external data into ASOSINT's standard indicator schema. The SDK Customization module allows writing custom transformation and enrichment logic." },
        { heading: "Webhook Ingestion", body: "Configure external tools (SIEMs, EDR platforms, firewalls) to POST alerts to ASOSINT backend functions as webhooks. Each backend function validates the webhook signature before processing. Contact EDS for webhook URL provisioning and shared secret configuration." },
        { heading: "Automations", body: "ASOSINT supports two automation types:\n• Scheduled automations — run backend functions on a cron/interval schedule (e.g., daily threat feed refresh)\n• Entity automations — trigger functions when entity records are created, updated, or deleted (e.g., auto-enrich a new indicator when it's created)\n\nConfigure automations from the Dashboard settings panel." },
        { heading: "BigQuery Integration", body: "ASOSINT has an authorized Google BigQuery connector. Use the BigQuery Threat Analysis page to run SQL queries against your security data lake directly from the platform. Requires BigQuery read-only OAuth authorization (already configured for authorized users)." },
      ]
    },
  ],
};

export default function Documentation() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [activeAudience, setActiveAudience] = useState("executive");
  const [activeDoc, setActiveDoc] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState({});

  const docs = DOCS[activeAudience] || [];
  const currentDoc = docs[activeDoc] || docs[0];

  const toggleSection = (idx) => setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <div className="bg-[#0d1220] border-b border-white/5 py-6 px-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto">
          <Link to={createPageUrl("Homepage")} className="inline-flex items-center gap-2 text-[#00d4ff] text-sm mb-3 hover:opacity-80">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-[#00d4ff]" />
              <div>
                <h1 className="text-2xl font-black">ASOSINT Documentation</h1>
                <p className="text-gray-400 text-xs">Full platform guide for all user levels</p>
              </div>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]/50 w-64"
              />
            </div>
          </div>

          {/* Audience tabs */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {AUDIENCE_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveAudience(tab.id); setActiveDoc(0); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeAudience === tab.id ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Icon className={`w-4 h-4 ${activeAudience === tab.id ? 'text-[#00d4ff]' : tab.color}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar nav */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <div className="sticky top-36 space-y-1">
            {docs.map((doc, i) => {
              const Icon = doc.icon;
              return (
                <button
                  key={i}
                  onClick={() => { setActiveDoc(i); window.scrollTo(0, 0); }}
                  className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-lg transition-all ${activeDoc === i ? 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">{doc.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          {currentDoc && (
            <div>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <currentDoc.icon className="w-7 h-7 text-[#00d4ff]" />
                  <h2 className="text-3xl font-black">{currentDoc.title}</h2>
                </div>
                <p className="text-gray-400">{currentDoc.subtitle}</p>
              </div>

              <div className="space-y-4">
                {currentDoc.content
                  .filter(s => !searchQuery || s.heading.toLowerCase().includes(searchQuery.toLowerCase()) || s.body.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((section, idx) => (
                    <div key={idx} className="bg-[#0d1220] border border-white/5 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleSection(idx)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition"
                      >
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <ChevronRight className={`w-4 h-4 text-[#00d4ff] transition-transform ${expandedSections[idx] !== false ? 'rotate-90' : ''}`} />
                          {section.heading}
                        </h3>
                      </button>
                      {expandedSections[idx] !== false && (
                        <div className="px-6 pb-6 border-t border-white/5 pt-4">
                          <p className="text-gray-300 leading-relaxed whitespace-pre-line text-sm">{section.body}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Navigation between docs */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
                {activeDoc > 0 ? (
                  <button onClick={() => { setActiveDoc(activeDoc - 1); window.scrollTo(0, 0); }} className="flex items-center gap-2 text-[#00d4ff] text-sm hover:opacity-80">
                    <ArrowLeft className="w-4 h-4" /> {docs[activeDoc - 1]?.title}
                  </button>
                ) : <div />}
                {activeDoc < docs.length - 1 && (
                  <button onClick={() => { setActiveDoc(activeDoc + 1); window.scrollTo(0, 0); }} className="flex items-center gap-2 text-[#00d4ff] text-sm hover:opacity-80">
                    {docs[activeDoc + 1]?.title} <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-white/5 py-6 px-4 bg-[#0d1220] mt-8">
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