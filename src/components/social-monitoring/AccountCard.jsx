import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, Settings, Trash2 } from "lucide-react";

const PLATFORM_ICONS = {
  linkedin: "💼",
  twitter: "🐦",
  facebook: "📘",
  instagram: "📷",
  tiktok: "🎵",
  discord: "💬"
};

export default function AccountCard({ account }) {
  const statusConfig = {
    connected: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
    disconnected: { icon: XCircle, color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20" },
    expired: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    error: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
  };

  const status = statusConfig[account.connection_status] || statusConfig.disconnected;
  const StatusIcon = status.icon;

  return (
    <Card className="bg-[#0d1220] border-white/5 hover:border-white/10 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{PLATFORM_ICONS[account.platform] || "📱"}</div>
            <div>
              <p className="font-medium text-white">{account.account_name}</p>
              <p className="text-xs text-gray-500 capitalize">{account.platform}</p>
            </div>
          </div>
          <StatusIcon className={`w-5 h-5 ${status.color}`} />
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge className={`${status.bg} ${status.color} ${status.border} text-xs`}>
            {account.connection_status}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {account.account_type === "owned" ? "Own Account" : "Authorized"}
          </Badge>
          {account.monitoring_enabled && (
            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
              Monitoring
            </Badge>
          )}
        </div>

        <div className="space-y-1 text-xs text-gray-500 mb-3">
          {account.authorized_by_email && account.account_type === "authorized_third_party" && (
            <p>Owner: {account.authorized_by_email}</p>
          )}
          {account.authorization_date && (
            <p>Connected: {new Date(account.authorization_date).toLocaleDateString()}</p>
          )}
          {account.last_synced && (
            <p>Last sync: {new Date(account.last_synced).toLocaleString()}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Settings className="w-3 h-3 mr-1" />
            Settings
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}