import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Skull, Plus, Search, Filter, AlertCircle, Globe2, Target,
  Zap, TrendingUp, Users, Clock, Shield, Loader2
} from "lucide-react";
import ThreatActorForm from "@/components/threats/ThreatActorForm";
import ThreatActorDetail from "@/components/threats/ThreatActorDetail";
import ActorIOCPanel from "@/components/threats/ActorIOCPanel";

export default function ThreatActorProfiles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActor, setSelectedActor] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: actors, isLoading } = useQuery({
    queryKey: ["threat_actors"],
    queryFn: () => base44.entities.ThreatActor.list("-last_active", 100),
    initialData: []
  });

  const { data: alerts } = useQuery({
    queryKey: ["osint_alerts"],
    queryFn: () => base44.entities.OsintAlert.list("-triggered_at", 500),
    initialData: []
  });

  const createActorMutation = useMutation({
    mutationFn: (data) => base44.entities.ThreatActor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threat_actors"] });
      setShowCreateForm(false);
    }
  });

  const filteredActors = actors.filter(actor => {
    const matchesQuery = actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actor.aliases?.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === "all" || actor.status === filterStatus;
    return matchesQuery && matchesStatus;
  });

  const getActorAlerts = (actorId) => {
    return alerts.filter(alert => alert.threat_actor_id === actorId);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-red-100 text-red-800",
      dormant: "bg-yellow-100 text-yellow-800",
      dissolved: "bg-gray-100 text-gray-800",
      unknown: "bg-blue-100 text-blue-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getActorTypeIcon = (type) => {
    const icons = {
      nation_state: "🏛️",
      criminal: "👤",
      hacktivist: "⚙️",
      insider: "🔑",
      hybrid: "⚡",
      unknown: "❓"
    };
    return icons[type] || "❓";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Skull className="w-8 h-8 text-red-600" />
            Threat Actor Profiles
          </h1>
          <p className="text-gray-600 mt-1">Track known threat actors, their TTPs, and attributed activities</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="gap-2 bg-red-600 hover:bg-red-700"
        >
          <Plus className="w-4 h-4" />
          New Actor Profile
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg">Create Threat Actor Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ThreatActorForm
              onSubmit={(data) => createActorMutation.mutate(data)}
              onCancel={() => setShowCreateForm(false)}
              isLoading={createActorMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, alias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "dormant", "dissolved"].map(status => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="gallery" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gallery">Gallery ({filteredActors.length})</TabsTrigger>
          <TabsTrigger value="detail">
            {selectedActor ? "Profile" : "Select Actor"}
          </TabsTrigger>
          <TabsTrigger value="iocs">Indicators of Compromise</TabsTrigger>
        </TabsList>

        {/* Gallery View */}
        <TabsContent value="gallery" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredActors.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Skull className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No threat actors found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredActors.map(actor => {
                const actorAlerts = getActorAlerts(actor.id);
                return (
                  <Card
                    key={actor.id}
                    className="cursor-pointer hover:border-red-300 hover:shadow-lg transition-all"
                    onClick={() => {
                      setSelectedActor(actor);
                      document.querySelector('[value="detail"]')?.click();
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{getActorTypeIcon(actor.actor_type)}</span>
                            <h3 className="font-bold text-lg line-clamp-1">{actor.name}</h3>
                          </div>
                          <p className="text-xs text-gray-500">
                            {actor.attributed_country || "Country Unknown"}
                          </p>
                        </div>
                        <Badge className={getStatusColor(actor.status)}>
                          {actor.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {actor.aliases?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">Aliases</p>
                          <div className="flex flex-wrap gap-1">
                            {actor.aliases.slice(0, 2).map((alias, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {alias}
                              </Badge>
                            ))}
                            {actor.aliases.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{actor.aliases.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {actor.target_sectors?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            Sectors
                          </p>
                          <p className="text-xs text-gray-700 line-clamp-2">
                            {actor.target_sectors.join(", ")}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-600">{actorAlerts.length}</p>
                          <p className="text-xs text-gray-600">Linked Alerts</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">
                            {actor.shared_ttps?.length || 0}
                          </p>
                          <p className="text-xs text-gray-600">TTPs</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Detail View */}
        <TabsContent value="detail">
          {selectedActor ? (
            <ThreatActorDetail
              actor={selectedActor}
              relatedAlerts={getActorAlerts(selectedActor.id)}
              onUpdate={() => queryClient.invalidateQueries({ queryKey: ["threat_actors"] })}
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-gray-500">Select a threat actor from the gallery to view details</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* IOCs View */}
        <TabsContent value="iocs">
          <ActorIOCPanel actors={filteredActors} />
        </TabsContent>
      </Tabs>
    </div>
  );
}