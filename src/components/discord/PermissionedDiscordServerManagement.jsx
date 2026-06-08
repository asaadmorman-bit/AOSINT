import React, { useState } from "react";
import { Zap } from "lucide-react";
import PermissionGuard from "@/components/auth/PermissionGuard";
import DiscordServerOrchestrator from "@/components/discord/DiscordServerOrchestrator";
import DiscordAlertRuleManager from "@/components/discord/DiscordAlertRuleManager";
import DiscordBotSetup from "@/components/discord/DiscordBotSetup";
import DiscordPushTester from "@/components/discord/DiscordPushTester";
import DiscordCommandRegistrar from "@/components/discord/DiscordCommandRegistrar";
import DiscordThreatServerManager from "@/components/discord/DiscordThreatServerManager";

export default function PermissionedDiscordServerManagement() {
  const [activeTab, setActiveTab] = useState('servers');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Discord Threat Intelligence Hub</h1>
        </div>
        <p className="text-gray-600">
          Intelligent agents automatically create servers, organize threats, provide search & correlation, and route real-time alerts based on custom rules.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 flex-wrap">
        <button
          onClick={() => setActiveTab('servers')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'servers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Server Management
        </button>
        
        <PermissionGuard permission="manage_alert_rules" fallback={null}>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'alerts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Alert Rules
          </button>
        </PermissionGuard>

        <PermissionGuard permission="push_data" fallback={null}>
          <button
            onClick={() => setActiveTab('push')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'push'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Push Data (Testing)
          </button>
        </PermissionGuard>

        <PermissionGuard permission="register_commands" fallback={null}>
          <button
            onClick={() => setActiveTab('commands')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'commands'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Register Commands
          </button>
        </PermissionGuard>

        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'channels'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Channel Mappings
        </button>

        <button
          onClick={() => setActiveTab('setup')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'setup'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Bot Setup
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'servers' && <DiscordServerOrchestrator />}
      {activeTab === 'alerts' && (
        <PermissionGuard permission="manage_alert_rules">
          <DiscordAlertRuleManager />
        </PermissionGuard>
      )}
      {activeTab === 'push' && (
        <PermissionGuard permission="push_data">
          <DiscordPushTester />
        </PermissionGuard>
      )}
      {activeTab === 'commands' && (
        <PermissionGuard permission="register_commands">
          <DiscordCommandRegistrar />
        </PermissionGuard>
      )}
      {activeTab === 'channels' && <DiscordThreatServerManager />}
      {activeTab === 'setup' && <DiscordBotSetup />}
    </div>
  );
}