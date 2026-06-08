import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, Building2, Users, Target, Globe } from "lucide-react";

export default function EntitySearchPanel({ onSelectEntity }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const { data } = await base44.functions.invoke('searchEntities', {
        searchQuery: query,
        limit: 30
      });
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const categories = useMemo(() => {
    if (!searchResults) return [];
    return [
      { key: 'organizations', label: 'Organizations', icon: Building2 },
      { key: 'entities', label: 'Entities', icon: Globe },
      { key: 'threat_actors', label: 'Threat Actors', icon: Target },
      { key: 'lea_intelligence', label: 'LEA Intelligence', icon: Users }
    ];
  }, [searchResults]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" /> Entity Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search organizations, entities, threat actors..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
          />
          {isSearching && <span className="text-xs text-gray-500 py-2">Searching...</span>}
        </div>

        {searchResults && (
          <div className="space-y-4">
            {categories.map(({ key, label, icon: Icon }) => {
              const items = searchResults[key] || [];
              if (items.length === 0) return null;

              return (
                <div key={key} className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Icon className="w-4 h-4" /> {label} ({items.length})
                  </h3>
                  <div className="space-y-1">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.entity_name || item.indicator_value || item.name || item.title}
                          </p>
                          {item.label && <p className="text-xs text-gray-600">{item.label}</p>}
                          {item.description && <p className="text-xs text-gray-600 truncate">{item.description}</p>}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelectEntity && onSelectEntity(item, key)}
                          className="ml-2 shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {searchResults.total === 0 && searchQuery && (
              <p className="text-sm text-gray-500 text-center py-4">No results found</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}