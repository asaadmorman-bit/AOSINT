import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio, Calendar, Users, Eye, Pause, Play, Trash2 } from "lucide-react";

export default function CampaignCard({ campaign, accounts = [] }) {
  const statusColors = {
    draft: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    active: "bg-green-500/10 text-green-500 border-green-500/20",
    paused: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    archived: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };

  const campaignAccounts = accounts.filter(a => campaign.accounts?.includes(a.id));

  return (
    <Card className="bg-[#0d1220] border-white/5 hover:border-white/10 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-white text-base mb-2">{campaign.name}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={statusColors[campaign.status] || statusColors.draft}>
                {campaign.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {campaign.campaign_type === "single_run" ? "Single Run" : "Continuous"}
              </Badge>
              {campaign.campaign_type === "continuous" && campaign.monitoring_frequency && (
                <Badge variant="outline" className="text-xs">
                  {campaign.monitoring_frequency}
                </Badge>
              )}
            </div>
          </div>
          <Radio className={`w-5 h-5 ${campaign.status === "active" ? "text-green-500 animate-pulse" : "text-gray-600"}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {campaign.description && (
          <p className="text-sm text-gray-400 line-clamp-2">{campaign.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{campaignAccounts.length} account{campaignAccounts.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{campaign.findings_count || 0} findings</span>
          </div>
          {campaign.last_scan && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Last: {new Date(campaign.last_scan).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {campaign.keywords_tracked && campaign.keywords_tracked.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {campaign.keywords_tracked.slice(0, 5).map((keyword, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {campaign.keywords_tracked.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{campaign.keywords_tracked.length - 5} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          {campaign.status === "active" && (
            <Button size="sm" variant="ghost">
              <Pause className="w-3 h-3" />
            </Button>
          )}
          {campaign.status === "paused" && (
            <Button size="sm" variant="ghost">
              <Play className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}