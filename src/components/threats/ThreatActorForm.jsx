import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export default function ThreatActorForm({ onSubmit, onCancel, isLoading = false, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    name: "",
    aliases: [],
    actor_type: "unknown",
    attributed_country: "",
    target_sectors: [],
    target_regions: [],
    shared_ttps: [],
    associated_campaigns: [],
    mitre_groups: [],
    confidence: 50,
    status: "active",
    notes: ""
  });

  const [newAlias, setNewAlias] = useState("");
  const [newSector, setNewSector] = useState("");
  const [newTTP, setNewTTP] = useState("");

  const addItem = (list, item, setter) => {
    if (item.trim() && !list.includes(item)) {
      setFormData({ ...formData, [list]: [...formData[list], item] });
      setter("");
    }
  };

  const removeItem = (list, index) => {
    setFormData({
      ...formData,
      [list]: formData[list].filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-semibold block mb-1">Actor Name *</label>
          <Input
            required
            placeholder="e.g., APT28, Lazarus Group"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1">Actor Type *</label>
          <select
            required
            value={formData.actor_type}
            onChange={(e) => setFormData({ ...formData, actor_type: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="unknown">Unknown</option>
            <option value="nation_state">Nation State</option>
            <option value="criminal">Criminal</option>
            <option value="hacktivist">Hacktivist</option>
            <option value="insider">Insider Threat</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-semibold block mb-1">Country Attribution</label>
          <Input
            placeholder="e.g., Russia, North Korea"
            value={formData.attributed_country}
            onChange={(e) => setFormData({ ...formData, attributed_country: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="active">Active</option>
            <option value="dormant">Dormant</option>
            <option value="dissolved">Dissolved</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      {/* Aliases */}
      <div>
        <label className="text-sm font-semibold block mb-2">Known Aliases</label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Add alias..."
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (addItem("aliases", newAlias, setNewAlias), e.preventDefault())}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addItem("aliases", newAlias, setNewAlias)}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.aliases?.map((alias, i) => (
            <Badge key={i} variant="secondary" className="pr-1">
              {alias}
              <button
                type="button"
                onClick={() => removeItem("aliases", i)}
                className="ml-1 hover:bg-white/20 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Target Sectors */}
      <div>
        <label className="text-sm font-semibold block mb-2">Target Sectors</label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="e.g., Healthcare, Finance, Energy"
            value={newSector}
            onChange={(e) => setNewSector(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (addItem("target_sectors", newSector, setNewSector), e.preventDefault())}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addItem("target_sectors", newSector, setNewSector)}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.target_sectors?.map((sector, i) => (
            <Badge key={i} className="bg-blue-100 text-blue-800 pr-1">
              {sector}
              <button
                type="button"
                onClick={() => removeItem("target_sectors", i)}
                className="ml-1 hover:bg-white/20 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* TTPs */}
      <div>
        <label className="text-sm font-semibold block mb-2">Shared TTPs (Techniques, Tactics, Procedures)</label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="e.g., Spear Phishing, Lateral Movement"
            value={newTTP}
            onChange={(e) => setNewTTP(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (addItem("shared_ttps", newTTP, setNewTTP), e.preventDefault())}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addItem("shared_ttps", newTTP, setNewTTP)}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.shared_ttps?.map((ttp, i) => (
            <Badge key={i} className="bg-purple-100 text-purple-800 pr-1">
              {ttp}
              <button
                type="button"
                onClick={() => removeItem("shared_ttps", i)}
                className="ml-1 hover:bg-white/20 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-semibold block mb-1">Notes</label>
        <Textarea
          placeholder="Additional context, history, motivations..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          disabled={isLoading || !formData.name}
          className="flex-1 bg-red-600 hover:bg-red-700"
        >
          {isLoading ? "Saving..." : "Create Profile"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}