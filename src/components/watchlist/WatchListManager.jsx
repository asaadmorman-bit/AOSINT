import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import EntitySearchPanel from "@/components/search/EntitySearchPanel";
import { Eye, Plus, Trash2, Save, X } from "lucide-react";

export default function WatchListManager() {
  const queryClient = useQueryClient();
  const [showNewForm, setShowNewForm] = useState(false);
  const [newWatchList, setNewWatchList] = useState({
    name: "",
    description: "",
    watch_list_type: "mixed",
    items: []
  });
  const [selectedWatchList, setSelectedWatchList] = useState(null);

  const { data: watchLists, isLoading } = useQuery({
    queryKey: ['watch_lists'],
    queryFn: () => base44.entities.WatchList.list('-last_updated', 100),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WatchList.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch_lists'] });
      setShowNewForm(false);
      setNewWatchList({ name: "", description: "", watch_list_type: "mixed", items: [] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WatchList.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch_lists'] });
      setSelectedWatchList(null);
    }
  });

  const handleAddEntity = (entity, entityType) => {
    const newItem = {
      item_id: entity.id,
      item_type: entityType.replace(/s$/, ''),
      item_name: entity.entity_name || entity.indicator_value || entity.name || entity.title,
      added_date: new Date().toISOString(),
      notes: ""
    };

    setNewWatchList(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const handleCreateWatchList = () => {
    if (!newWatchList.name) {
      alert("Watch list name is required");
      return;
    }

    createMutation.mutate({
      ...newWatchList,
      last_updated: new Date().toISOString()
    });
  };

  const typeColors = {
    organization: 'bg-blue-100 text-blue-800',
    entity: 'bg-purple-100 text-purple-800',
    threat_actor: 'bg-red-100 text-red-800',
    campaign: 'bg-orange-100 text-orange-800',
    mixed: 'bg-gray-100 text-gray-800'
  };

  if (isLoading) return <p className="text-gray-500">Loading watch lists...</p>;

  return (
    <div className="space-y-6">
      {/* Existing Watch Lists */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Watch Lists</CardTitle>
            <Button onClick={() => setShowNewForm(!showNewForm)} size="sm">
              <Plus className="w-4 h-4 mr-2" /> New Watch List
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {watchLists.length === 0 && !showNewForm && (
            <Alert>No watch lists created yet. Create one to start monitoring.</Alert>
          )}

          {watchLists.map(wl => (
            <div
              key={wl.id}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedWatchList(wl)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold">{wl.name}</p>
                    <Badge className={typeColors[wl.watch_list_type]}>
                      {wl.watch_list_type}
                    </Badge>
                    {wl.is_default && <Badge variant="outline">Default</Badge>}
                  </div>
                  <p className="text-sm text-gray-600">{wl.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {(wl.items || []).length} items • Updated {new Date(wl.last_updated).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(wl.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* New Watch List Form */}
      {showNewForm && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle>Create New Watch List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Watch List Name"
              value={newWatchList.name}
              onChange={(e) => setNewWatchList(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Description"
              value={newWatchList.description}
              onChange={(e) => setNewWatchList(prev => ({ ...prev, description: e.target.value }))}
            />

            <select
              value={newWatchList.watch_list_type}
              onChange={(e) => setNewWatchList(prev => ({ ...prev, watch_list_type: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="mixed">Mixed Items</option>
              <option value="organization">Organizations</option>
              <option value="entity">Entities</option>
              <option value="threat_actor">Threat Actors</option>
              <option value="campaign">Campaigns</option>
            </select>

            {/* Current Items */}
            {newWatchList.items && newWatchList.items.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">{newWatchList.items.length} Items Added:</p>
                {newWatchList.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                    <span>{item.item_name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setNewWatchList(prev => ({
                        ...prev,
                        items: prev.items.filter((_, i) => i !== idx)
                      }))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Entity Search */}
            <EntitySearchPanel onSelectEntity={handleAddEntity} />

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateWatchList} className="flex-1">
                <Save className="w-4 h-4 mr-2" /> Create Watch List
              </Button>
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Watch List Details */}
      {selectedWatchList && (
        <Card className="border-purple-300 bg-purple-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedWatchList.name}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedWatchList(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">{selectedWatchList.description}</p>
            <div className="flex gap-2 flex-wrap">
              {selectedWatchList.alert_on_activity && (
                <Badge className="bg-green-100 text-green-800">Alerts Enabled</Badge>
              )}
              <Badge className={typeColors[selectedWatchList.watch_list_type]}>
                {selectedWatchList.watch_list_type}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Monitored Items ({(selectedWatchList.items || []).length}):</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedWatchList.items?.map((item, idx) => (
                  <div key={idx} className="text-sm p-2 bg-white rounded border">
                    <p className="font-medium">{item.item_name}</p>
                    <p className="text-xs text-gray-600">{item.item_type}</p>
                  </div>
                )) || <p className="text-xs text-gray-500">No items in this watch list</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}