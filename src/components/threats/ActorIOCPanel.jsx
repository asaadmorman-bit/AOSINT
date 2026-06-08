import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function ActorIOCPanel({ actors }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  const { data: indicators = [] } = useQuery({
    queryKey: ["threat_indicators"],
    queryFn: () => base44.entities.ThreatIndicator?.list?.("-created_date", 500) || Promise.resolve([]),
  });

  // Filter indicators by threat actors
  const actorIds = actors.map(a => a.id);
  const actorIOCs = indicators.filter(ioc =>
    ioc.related_actors?.some(actor => actorIds.includes(actor)) ||
    ioc.tags?.some(tag => actors.some(a => a.name.includes(tag)))
  );

  const filteredIOCs = actorIOCs.filter(ioc => {
    const matchesQuery = ioc.value?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ioc.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || ioc.indicator_type === selectedType;
    return matchesQuery && matchesType;
  });

  const iocTypes = ["all", ...new Set(actorIOCs.map(i => i.indicator_type))];

  const getIOCTypeIcon = (type) => {
    const icons = {
      ip_address: "📡",
      domain: "🌐",
      hash: "#️⃣",
      email: "📧",
      url: "🔗",
      cve: "🛡️",
      ttps: "⚙️",
      actor: "👤"
    };
    return icons[type] || "🔍";
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-blue-100 text-blue-800",
      informational: "bg-gray-100 text-gray-800"
    };
    return colors[severity] || "bg-gray-100 text-gray-800";
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
        <h3 className="font-semibold text-red-900 mb-1">Indicators of Compromise (IOCs)</h3>
        <p className="text-sm text-red-700">
          {actorIOCs.length} IOCs linked to threat actors
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search IOC value, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          {iocTypes.map(type => (
            <option key={type} value={type}>
              {type === "all" ? "All Types" : type}
            </option>
          ))}
        </select>
      </div>

      {/* IOCs Grid */}
      {filteredIOCs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500">No indicators of compromise found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredIOCs.map(ioc => (
            <Card key={ioc.id} className="hover:border-gray-400 transition-colors">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{getIOCTypeIcon(ioc.indicator_type)}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{ioc.title}</h4>
                        <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-1 break-all">
                          {ioc.value}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(ioc.value, ioc.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Copy IOC"
                      >
                        {copiedId === ioc.id ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge variant="outline" className="text-xs">
                      {ioc.indicator_type}
                    </Badge>
                    {ioc.severity && (
                      <Badge className={`text-xs ${getSeverityColor(ioc.severity)}`}>
                        {ioc.severity}
                      </Badge>
                    )}
                    {ioc.confidence && (
                      <span className="text-xs text-gray-600">
                        Confidence: {ioc.confidence}%
                      </span>
                    )}
                  </div>

                  {ioc.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ioc.tags.slice(0, 4).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {ioc.notes && (
                    <p className="text-xs text-gray-600 mt-2">{ioc.notes}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}