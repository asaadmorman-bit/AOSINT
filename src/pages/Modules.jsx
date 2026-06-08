import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Globe2, Users, Shield, Bot, AlertCircle, BarChart3,
  Zap, Target, Network, Radar, Database, GitBranch,
  ArrowRight, CheckCircle2, Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function Modules() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setAuthChecked(true);
    }).catch(() => {
      setUser(null);
      setAuthChecked(true);
    });
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-gray-600 text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <Lock className="w-12 h-12 text-gray-400 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Authentication Required</h2>
            <p className="text-sm text-gray-600">
              You must be logged in to access the platform modules.
            </p>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  const modules = [
    {
      title: "OSINT Intelligence Hub",
      icon: Globe2,
      description: "Comprehensive open-source intelligence gathering and analysis platform",
      link: "OsintHub",
      features: ["Dark web monitoring", "Leak tracking", "Entity search", "Investigations"],
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Threat Actor Intelligence",
      icon: Users,
      description: "Detailed profiles on threat actors, their tactics, and campaigns",
      link: "ThreatActors",
      features: ["Actor profiles", "Campaigns", "TTPs", "Attribution"],
      color: "from-red-500 to-orange-500"
    },
    {
      title: "Vulnerability Management",
      icon: Shield,
      description: "Track and remediate vulnerabilities across your assets",
      link: "VulnerabilityManagement",
      features: ["CVSS scoring", "Exploit tracking", "Remediation", "Asset correlation"],
      color: "from-yellow-500 to-orange-500"
    },
    {
      title: "AI-Powered Analysis",
      icon: Bot,
      description: "Leverage AI agents for threat correlation and deep analysis",
      link: "AgentOps",
      features: ["Threat correlation", "Pattern detection", "Attribution", "Automation"],
      color: "from-indigo-500 to-purple-500"
    },
    {
      title: "Alert Management",
      icon: AlertCircle,
      description: "Configure and manage threat alerts by role, severity, and type",
      link: "AlertConfiguration",
      features: ["Custom thresholds", "Notification channels", "Role-based", "Filtering"],
      color: "from-pink-500 to-rose-500"
    },
    {
      title: "Executive Dashboards",
      icon: BarChart3,
      description: "High-level threat intelligence for leadership and decision makers",
      link: "ExecutiveDashboard",
      features: ["KPI dashboards", "Risk scoring", "Executive briefs", "Trends"],
      color: "from-green-500 to-teal-500"
    },
    {
      title: "Threat Intelligence Feeds",
      icon: Radar,
      description: "Real-time threat feeds and indicators from multiple sources",
      link: "ThreatFeeds",
      features: ["Live feeds", "Indicators", "Intel correlation", "Enrichment"],
      color: "from-cyan-500 to-blue-500"
    },
    {
      title: "Discord Integration",
      icon: Zap,
      description: "Automated threat intelligence delivery and alerting via Discord",
      link: "DiscordServerManagement",
      features: ["Auto channels", "Real-time alerts", "Alert rules", "Org sync"],
      color: "from-indigo-600 to-blue-600"
    },
    {
      title: "Threat Hunting",
      icon: Target,
      description: "Advanced threat hunting with IOC enrichment and analysis",
      link: "ThreatHunting",
      features: ["IOC enrichment", "Hunt tickets", "Investigation", "Pivoting"],
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Regional Analysis",
      icon: Globe2,
      description: "Threat analysis by geographic region and industry sector",
      link: "ThreatIntelByRegion",
      features: ["Geographic filtering", "Sector analysis", "Regional threats", "Targeting"],
      color: "from-orange-500 to-red-500"
    },
    {
      title: "Indicators & IOCs",
      icon: Database,
      description: "Manage and track threat indicators and IOCs",
      link: "Indicators",
      features: ["IOC tracking", "Correlation", "Enrichment", "Type filtering"],
      color: "from-teal-500 to-green-500"
    },
    {
      title: "Data Transforms",
      icon: GitBranch,
      description: "Transform and enrich raw intelligence data",
      link: "Transforms",
      features: ["Data mapping", "Enrichment", "Correlation", "Automation"],
      color: "from-sky-500 to-blue-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Platform Modules</h1>
          <p className="text-xl text-gray-600">
            Explore all ASOSINT modules and intelligence capabilities
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, idx) => {
            const Icon = module.icon;
            return (
              <Link key={idx} to={createPageUrl(module.link)}>
                <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${module.color}`} />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Icon className="w-6 h-6 text-gray-600" />
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <CardTitle className="text-lg mt-2">{module.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{module.description}</p>
                    <div className="space-y-2">
                      {module.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Access Module
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Links */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                <span className="text-blue-600">→</span>
                <span className="text-sm font-medium">Main Dashboard</span>
              </Link>
              <Link to={createPageUrl("CapabilityShowcase")} className="flex items-center gap-2 p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                <span className="text-blue-600">→</span>
                <span className="text-sm font-medium">Capabilities Overview</span>
              </Link>
              <Link to={createPageUrl("Documentation")} className="flex items-center gap-2 p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                <span className="text-blue-600">→</span>
                <span className="text-sm font-medium">Documentation</span>
              </Link>
              <Link to={createPageUrl("Support")} className="flex items-center gap-2 p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                <span className="text-blue-600">→</span>
                <span className="text-sm font-medium">Get Support</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}