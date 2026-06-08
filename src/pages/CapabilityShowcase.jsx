import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Zap, BarChart3, Globe2, Users, Shield, Bot, AlertCircle,
  TrendingUp, Target, Network, CheckCircle2, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CapabilityShowcase() {
  const capabilities = [
    {
      title: "Real-Time Threat Intelligence Dashboard",
      description: "Monitor threats, alerts, and indicators as they happen with live updates",
      icon: Zap,
      color: "from-blue-500 to-cyan-500",
      link: "Dashboard",
      features: [
        "Live threat feeds",
        "Critical alerts highlighting",
        "Severity filtering",
        "Real-time notifications"
      ]
    },
    {
      title: "OSINT Intelligence Hub",
      description: "Comprehensive open-source intelligence gathering and analysis",
      icon: Globe2,
      color: "from-purple-500 to-pink-500",
      link: "OsintHub",
      features: [
        "Dark web monitoring",
        "Leak intelligence",
        "Entity search",
        "Investigation tracking"
      ]
    },
    {
      title: "Threat Actor Profiling",
      description: "Detailed intelligence on threat actors, campaigns, and their TTPs",
      icon: Users,
      color: "from-red-500 to-orange-500",
      link: "ThreatActors",
      features: [
        "Actor profiles",
        "Campaign tracking",
        "TTP analysis",
        "Attribution intelligence"
      ]
    },
    {
      title: "Vulnerability Management",
      description: "Track, prioritize, and remediate vulnerabilities across your assets",
      icon: Shield,
      color: "from-yellow-500 to-orange-500",
      link: "VulnerabilityManagement",
      features: [
        "CVSS scoring",
        "Active exploitation tracking",
        "Remediation guidance",
        "Asset correlation"
      ]
    },
    {
      title: "AI-Powered Analysis",
      description: "Leverage AI agents for threat correlation and deep analysis",
      icon: Bot,
      color: "from-indigo-500 to-purple-500",
      link: "AgentOps",
      features: [
        "Automated correlation",
        "Pattern detection",
        "Threat attribution",
        "Anomaly detection"
      ]
    },
    {
      title: "Executive Briefings",
      description: "High-level threat summaries for leadership and decision makers",
      icon: BarChart3,
      color: "from-green-500 to-teal-500",
      link: "ExecutiveDashboard",
      features: [
        "KPI dashboards",
        "Risk scoring",
        "Convergence analysis",
        "Executive summary"
      ]
    },
    {
      title: "Discord Threat Intelligence",
      description: "Automated threat intelligence delivery and correlation in Discord",
      icon: Zap,
      color: "from-indigo-600 to-blue-600",
      link: "DiscordServerManagement",
      features: [
        "Automated channel creation",
        "Real-time alerts",
        "Alert rules engine",
        "Cross-organization sync"
      ]
    },
    {
      title: "Regional & Sector Analysis",
      description: "Threat analysis by geographic region and industry sector",
      icon: Target,
      color: "from-cyan-500 to-blue-500",
      link: "ThreatIntelByRegion",
      features: [
        "Geographic filtering",
        "Sector-specific threats",
        "Regional hotspots",
        "Targeted mitigation"
      ]
    },
    {
      title: "Threat Hunting & Enrichment",
      description: "Advanced threat hunting with IOC enrichment and correlation",
      icon: Network,
      color: "from-pink-500 to-rose-500",
      link: "ThreatHunting",
      features: [
        "IOC enrichment",
        "Hash analysis",
        "Domain investigation",
        "Entity pivoting"
      ]
    },
    {
      title: "Alert Configuration",
      description: "Customize alerts by role, severity, and threat type",
      icon: AlertCircle,
      color: "from-orange-500 to-red-500",
      link: "AlertConfiguration",
      features: [
        "Role-based thresholds",
        "Notification channels",
        "Batch processing",
        "Custom filters"
      ]
    }
  ];

  const useCases = [
    {
      title: "SOC Operations",
      description: "Streamline security operations with unified threat intelligence",
      roles: ["Security Analysts", "SOC Managers"],
      capabilities: ["Real-time alerts", "Threat correlation", "Investigation tools"]
    },
    {
      title: "Executive Leadership",
      description: "Board-level threat visibility and risk metrics",
      roles: ["CISOs", "Board Members"],
      capabilities: ["Executive briefings", "Risk scoring", "Trend analysis"]
    },
    {
      title: "Threat Hunting",
      description: "Proactive threat identification and investigation",
      roles: ["Threat Hunters", "Analysts"],
      capabilities: ["IOC enrichment", "Pattern matching", "Deep analysis"]
    },
    {
      title: "Incident Response",
      description: "Speed up incident response with contextual intelligence",
      roles: ["IR Teams", "Forensics"],
      capabilities: ["Rapid enrichment", "Actor attribution", "Correlation analysis"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Platform Capabilities</h1>
          <p className="text-xl text-gray-600">
            Explore ASOSINT's comprehensive threat intelligence features and see how they can support your mission
          </p>
        </div>

        {/* Capabilities Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Core Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <Link key={idx} to={createPageUrl(cap.link)}>
                  <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer overflow-hidden">
                    <div className={`h-2 bg-gradient-to-r ${cap.color}`} />
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Icon className="w-6 h-6 text-gray-600" />
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <CardTitle className="text-lg mt-2">{cap.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">{cap.description}</p>
                      <div className="space-y-2">
                        {cap.features.map((feature, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                      <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                        Explore Module
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Use Cases */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Designed for Your Role</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((useCase, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle>{useCase.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{useCase.description}</p>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 mb-2">Best For:</h4>
                    <div className="flex flex-wrap gap-2">
                      {useCase.roles.map((role, rIdx) => (
                        <span
                          key={rIdx}
                          className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 mb-2">Key Capabilities:</h4>
                    <ul className="space-y-1">
                      {useCase.capabilities.map((cap, cIdx) => (
                        <li key={cIdx} className="flex items-center gap-2 text-xs text-gray-700">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          {cap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Feature Comparison */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">By the Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Data Sources", value: "200+" },
              { label: "Threat Actors", value: "1,000+" },
              { label: "Indicators Tracked", value: "50M+" },
              { label: "Daily Updates", value: "100K+" }
            ].map((stat, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                    <div className="text-xs text-gray-600">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0">
          <CardContent className="pt-8 text-center space-y-4">
            <h3 className="text-2xl font-bold">Ready to Transform Your Threat Intelligence?</h3>
            <p className="text-blue-100 max-w-2xl mx-auto">
              Start with a personalized demo or explore the platform with your team. Our threat intelligence specialists are ready to show you how ASOSINT can support your mission.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button className="bg-white text-blue-600 hover:bg-gray-100">
                Request Demo
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                Start Free Trial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}