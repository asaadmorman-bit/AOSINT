import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import NotionThreatLogger from "@/components/integrations/NotionThreatLogger";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, Eye, AlertTriangle, Search, FileText, Activity, Globe2, MessageSquare } from "lucide-react";
import OsintOverviewDashboard from "@/components/osint_hub/OsintOverviewDashboard.jsx";
import EntityMonitorDashboard from "@/components/osint_hub/EntityMonitorDashboard.jsx";
import DarkWebDashboard from "@/components/osint_hub/DarkWebDashboard.jsx";
import InvestigationDashboard from "@/components/osint_hub/InvestigationDashboard.jsx";
import AlertsDashboard from "@/components/osint_hub/AlertsDashboard.jsx";
import ReportsDashboard from "@/components/osint_hub/ReportsDashboard.jsx";
import DiscordServerLink from "@/components/discord/DiscordServerLink.jsx";
import ThreatIndicatorMap from "@/components/osint_hub/ThreatIndicatorMap.jsx";

const TABS = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "entities", label: "Entity Monitor", icon: Globe2 },
  { id: "darkweb", label: "Dark Web", icon: Eye },
  { id: "investigations", label: "Investigations", icon: Search },
  { id: "alerts", label: "Alerts", icon: AlertTriangle },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "threatmap", label: "Threat Map", icon: Globe2 },
  { id: "discord", label: "Discord Servers", icon: MessageSquare },
  { id: "notion", label: "Log to Notion", icon: FileText },
];

export default function OsintHub() {
  const [activeTab, setActiveTab] = useState("overview");
  const [notionFindings, setNotionFindings] = useState([]);

  useEffect(() => {
    if (activeTab !== "notion") return;
    Promise.all([
      base44.entities.OsintAlert.filter({ severity: "critical" }, "-created_date", 20),
      base44.entities.OsintAlert.filter({ severity: "high" }, "-created_date", 20),
      base44.entities.ThreatIndicator.filter({ status: "active" }, "-created_date", 20),
    ]).then(([crit, high, indicators]) => {
      const mapped = [
        ...[...crit, ...high].map(a => ({
          title: a.title, severity: a.severity, domain: "cyber",
          source: `OSINT Alert · ${a.alert_type?.replace(/_/g, " ")}`,
          description: a.description || "", tags: a.tags || [], status: a.status,
        })),
        ...indicators.map(i => ({
          title: i.title, severity: i.severity, domain: i.threat_category || "cyber",
          source: `Indicator · ${i.indicator_type}: ${i.value}`,
          description: i.notes || "", tags: i.tags || [], status: i.status,
        })),
      ];
      setNotionFindings(mapped);
    });
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#00d4ff]" />
            <h1 className="text-xl font-black text-white tracking-tight">ASOSINT Intelligence Hub</h1>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#2ed573]/10 text-[#2ed573] border border-[#2ed573]/20 animate-pulse">LIVE</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Multi-agent OSINT · Dark Web Monitoring · Compromise Intelligence · Automated Investigation</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#111827] border border-white/5 flex flex-wrap gap-1 h-auto p-1">
          {TABS.map(t => (
            <TabsTrigger key={t.id} value={t.id}
              className="flex items-center gap-1.5 text-xs data-[state=active]:bg-[#00d4ff]/10 data-[state=active]:text-[#00d4ff] text-gray-500 px-3 py-1.5 rounded">
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview"><OsintOverviewDashboard /></TabsContent>
        <TabsContent value="entities"><EntityMonitorDashboard /></TabsContent>
        <TabsContent value="darkweb"><DarkWebDashboard /></TabsContent>
        <TabsContent value="investigations"><InvestigationDashboard /></TabsContent>
        <TabsContent value="alerts"><AlertsDashboard /></TabsContent>
        <TabsContent value="reports"><ReportsDashboard /></TabsContent>
        <TabsContent value="threatmap"><ThreatIndicatorMap /></TabsContent>
        <TabsContent value="notion">
          <div className="mt-4 max-w-xl">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white mb-1">Log Threat Intelligence to Notion</h2>
              <p className="text-xs text-gray-500">Automatically pulls your latest critical/high alerts and active indicators, then logs them as structured entries in your Notion database.</p>
            </div>
            <NotionThreatLogger findings={notionFindings} />
          </div>
        </TabsContent>
        <TabsContent value="discord">
          <div className="mt-4">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white mb-1">Discord Threat Servers</h2>
              <p className="text-xs text-gray-500">View and access Discord servers where threat intelligence is being shared</p>
            </div>
            <DiscordServerLink />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}