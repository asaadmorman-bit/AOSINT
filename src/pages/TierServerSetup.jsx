import React from "react";
import { Shield } from "lucide-react";
import TierServerManager from "@/components/discord/TierServerManager";

export default function TierServerSetup() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Subscription Tier Discord Setup</h1>
        </div>
        <p className="text-gray-600">
          Organize your threat intelligence by subscription tier. This creates dedicated channels in your Discord server so users only see threats matching their subscription level.
        </p>
      </div>

      <TierServerManager />
    </div>
  );
}