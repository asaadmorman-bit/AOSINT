import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, MessageSquare, Settings, Hash } from "lucide-react";
import PermissionedDiscordServerManagement from "@/components/discord/PermissionedDiscordServerManagement";
import ThreatAlertConfigurator from "@/components/discord/ThreatAlertConfigurator";
import ThreatIntelRoleManager from "@/components/discord/ThreatIntelRoleManager";
import ThreatResponseCollaboration from "@/components/discord/ThreatResponseCollaboration";
import CommunityChannelManager from "@/components/discord/CommunityChannelManager";

export default function DiscordIntegrationHub() {
  const [activeTab, setActiveTab] = useState("servers");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Discord Integration Hub</h1>
        <p className="text-gray-400">
          Manage Discord servers, configure threat alerts, assign roles, and coordinate real-time threat response
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-[#111827] border border-white/5">
          <TabsTrigger value="servers" className="gap-2 data-[state=active]:bg-[#00d4ff]/10 data-[state=active]:text-[#00d4ff]">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Servers</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2 data-[state=active]:bg-[#00d4ff]/10 data-[state=active]:text-[#00d4ff]">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2 data-[state=active]:bg-[#00d4ff]/10 data-[state=active]:text-[#00d4ff]">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="collaboration" className="gap-2 data-[state=active]:bg-[#00d4ff]/10 data-[state=active]:text-[#00d4ff]">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Collab</span>
          </TabsTrigger>
          <TabsTrigger value="community" className="gap-2 data-[state=active]:bg-[#00d4ff]/10 data-[state=active]:text-[#00d4ff]">
            <Hash className="w-4 h-4" />
            <span className="hidden sm:inline">Community</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="servers" className="space-y-4">
          <PermissionedDiscordServerManagement />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <ThreatAlertConfigurator />
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <ThreatIntelRoleManager />
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-4">
          <ThreatResponseCollaboration />
        </TabsContent>

        <TabsContent value="community" className="space-y-4">
          <CommunityChannelManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}