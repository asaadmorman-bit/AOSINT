import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Globe2, Users, Target, Zap, AlertCircle, Calendar, TrendingUp,
  Edit2, Trash2, Link2, Clock
} from "lucide-react";
import { format } from "date-fns";

export default function ThreatActorDetail({ actor, relatedAlerts = [], onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);

  const deleteActorMutation = useMutation({
    mutationFn: () => base44.entities.ThreatActor.delete(actor.id),
    onSuccess: () => onUpdate()
  });

  const severityColor = (severity) => {
    const colors = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800"
    };
    return colors[severity] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            {actor.name}
            <Badge variant="outline" className="text-lg">{actor.actor_type}</Badge>
          </h2>
          {actor.attributed_country && (
            <p className="text-gray-600 mt-1 flex items-center gap-1">
              <Globe2 className="w-4 h-4" />
              {actor.attributed_country}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteActorMutation.mutate()}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ttps">TTPs & Infrastructure</TabsTrigger>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="alerts">Linked Alerts ({relatedAlerts.length})</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          {actor.aliases?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Known Aliases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {actor.aliases.map((alias, i) => (
                    <Badge key={i} variant="secondary">{alias}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            {actor.first_observed && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    First Observed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">
                    {format(new Date(actor.first_observed), "MMM d, yyyy")}
                  </p>
                </CardContent>
              </Card>
            )}

            {actor.last_active && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Last Active
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">
                    {format(new Date(actor.last_active), "MMM d, yyyy")}
                  </p>
                </CardContent>
              </Card>
            )}

            {actor.convergence_score !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Convergence Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{actor.convergence_score}</p>
                  <p className="text-xs text-gray-600">0-100</p>
                </CardContent>
              </Card>
            )}

            {actor.confidence !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Confidence Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{actor.confidence}%</p>
                </CardContent>
              </Card>
            )}
          </div>

          {actor.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{actor.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TTPs & Infrastructure */}
        <TabsContent value="ttps" className="space-y-4">
          {actor.shared_ttps?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Techniques & Tactics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {actor.shared_ttps.map((ttp, i) => (
                    <Badge key={i} className="bg-purple-100 text-purple-800">
                      {ttp}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {actor.shared_infrastructure?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shared Infrastructure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {actor.shared_infrastructure.map((infra, i) => (
                    <p key={i} className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {infra}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {actor.mitre_groups?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">MITRE Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {actor.mitre_groups.map((group, i) => (
                    <Badge key={i} variant="outline">{group}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Targets */}
        <TabsContent value="targets" className="space-y-4">
          {actor.target_sectors?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Target Sectors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {actor.target_sectors.map((sector, i) => (
                    <Badge key={i} className="bg-blue-100 text-blue-800">
                      {sector}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {actor.target_regions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe2 className="w-4 h-4" />
                  Geographic Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {actor.target_regions.map((region, i) => (
                    <Badge key={i} variant="secondary">{region}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {actor.associated_campaigns?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Associated Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {actor.associated_campaigns.map((campaign, i) => (
                    <p key={i} className="text-sm">{campaign}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Linked Alerts */}
        <TabsContent value="alerts" className="space-y-4">
          {relatedAlerts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-gray-500">No linked alerts yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {relatedAlerts.map(alert => (
                <Card key={alert.id} className="hover:border-gray-400 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={severityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline">{alert.alert_type}</Badge>
                          <span className="text-xs text-gray-500">
                            {format(new Date(alert.triggered_at), "MMM d, HH:mm")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}