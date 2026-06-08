import React from "react";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PatternSearchFilter({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  patterns,
}) {
  const patternTypes = [...new Set(patterns.map((p) => p.pattern_type))];
  const confidenceRanges = [
    { label: "All Confidence", value: 0 },
    { label: "50%+", value: 50 },
    { label: "70%+", value: 70 },
    { label: "80%+", value: 80 },
    { label: "90%+", value: 90 },
  ];

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 space-y-4">
      <div className="flex gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patterns by name or description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-3 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-3 gap-4">
        {/* Behavior Type Filter */}
        <div>
          <label className="block text-xs text-gray-400 mb-2 font-semibold">
            Behavior Type
          </label>
          <select
            value={filters.behaviorType}
            onChange={(e) =>
              onFiltersChange({ ...filters, behaviorType: e.target.value })
            }
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Types</option>
            {patternTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Confidence Filter */}
        <div>
          <label className="block text-xs text-gray-400 mb-2 font-semibold">
            Minimum Confidence
          </label>
          <select
            value={filters.confidenceMin}
            onChange={(e) =>
              onFiltersChange({ ...filters, confidenceMin: Number(e.target.value) })
            }
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
          >
            {confidenceRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Results Count */}
        <div className="flex items-end">
          <div className="w-full bg-slate-900/50 border border-slate-700/50 rounded px-3 py-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">
              <span className="text-white font-bold">Results</span>
            </span>
            <span className="text-lg font-bold text-cyan-400">
              {patterns.filter(
                (p) =>
                  (searchQuery === "" ||
                    p.pattern_name
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    p.description
                      ?.toLowerCase()
                      .includes(searchQuery.toLowerCase())) &&
                  (filters.behaviorType === "all" ||
                    p.pattern_type === filters.behaviorType) &&
                  (p.confidence_score || 0) >= filters.confidenceMin
              ).length}
            </span>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchQuery ||
        filters.behaviorType !== "all" ||
        filters.confidenceMin > 0) && (
        <div className="text-xs text-gray-400">
          <span>Active filters: </span>
          {searchQuery && (
            <span className="bg-slate-700/50 px-2 py-1 rounded mr-1">
              Search: "{searchQuery}"
            </span>
          )}
          {filters.behaviorType !== "all" && (
            <span className="bg-slate-700/50 px-2 py-1 rounded mr-1">
              Type: {filters.behaviorType}
            </span>
          )}
          {filters.confidenceMin > 0 && (
            <span className="bg-slate-700/50 px-2 py-1 rounded">
              Confidence: {filters.confidenceMin}%+
            </span>
          )}
        </div>
      )}
    </div>
  );
}