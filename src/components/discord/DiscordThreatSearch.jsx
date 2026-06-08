import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Server, Hash, ExternalLink } from "lucide-react";

export default function DiscordThreatSearch() {
  const [query, setQuery] = useState('');
  const [threatType, setThreatType] = useState('');
  const [severity, setSeverity] = useState('');
  const [results, setResults] = useState(null);

  const searchMutation = useMutation({
    mutationFn: (searchParams) => base44.functions.invoke('searchDiscordThreats', searchParams),
    onSuccess: (response) => {
      setResults(response.data);
    }
  });

  const handleSearch = () => {
    if (!query.trim()) {
      alert('Enter a search query');
      return;
    }
    searchMutation.mutate({
      query,
      threat_type: threatType || undefined,
      severity: severity || undefined
    });
  };

  const severityColors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search Discord Threats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by threat name, actor, or keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={threatType}
              onChange={(e) => setThreatType(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All Threat Types</option>
              <option value="threat_actor">Threat Actor</option>
              <option value="malware_family">Malware Family</option>
              <option value="vulnerability">Vulnerability</option>
              <option value="campaign">Campaign</option>
              <option value="incident">Incident</option>
            </select>

            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <Button
            onClick={handleSearch}
            disabled={searchMutation.isPending}
            className="w-full"
          >
            {searchMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Search
          </Button>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-blue-600">{results.servers_with_matches}</p>
                <p className="text-xs text-gray-600 mt-1">Servers with Matches</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-green-600">{results.channels_found}</p>
                <p className="text-xs text-gray-600 mt-1">Channels Found</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-purple-600">{results.total_servers_searched}</p>
                <p className="text-xs text-gray-600 mt-1">Servers Searched</p>
              </CardContent>
            </Card>
          </div>

          {results.channels.map(serverResult => (
            <Card key={serverResult.server_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-600" />
                    <CardTitle className="text-sm">{serverResult.server_name}</CardTitle>
                  </div>
                  <Badge>{serverResult.channels.length} channels</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {serverResult.channels.map(channel => (
                    <div key={channel.id} className="border rounded-lg p-3 hover:bg-gray-50 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-gray-600" />
                          <p className="font-semibold text-sm">{channel.name}</p>
                        </div>
                        <a
                          href={`discord://discord.com/channels/${serverResult.server_id}/${channel.discord_channel_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {channel.type}
                        </Badge>
                        {channel.severity && (
                          <Badge className={`text-xs ${severityColors[channel.severity] || 'bg-gray-100 text-gray-800'}`}>
                            {channel.severity}
                          </Badge>
                        )}
                        {channel.last_update && (
                          <p className="text-xs text-gray-600">
                            Updated: {new Date(channel.last_update).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {channel.threat_focus && (
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">Focus:</span> {channel.threat_focus}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}