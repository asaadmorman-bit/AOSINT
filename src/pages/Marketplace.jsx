import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Search, Filter, Star, TrendingUp, Zap, Code2, BookOpen, Shield, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { id: "all", label: "All Apps", icon: Smartphone },
  { id: "integration_connector", label: "Integrations", icon: Zap },
  { id: "analytics_extension", label: "Analytics", icon: TrendingUp },
  { id: "agent_plugin", label: "Agents", icon: Code2 },
  { id: "compliance_pack", label: "Compliance", icon: Shield },
  { id: "training_module", label: "Training", icon: BookOpen },
];

export default function Marketplace() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");

  const { data: apps, isLoading } = useQuery({
    queryKey: ["marketplace_apps"],
    queryFn: () => base44.asServiceRole.entities.App.filter({ status: "published" }),
  });

  const filteredApps = useMemo(() => {
    let result = apps || [];

    // Filter by category
    if (category !== "all") {
      result = result.filter(app => app.category === category);
    }

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(app =>
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        (app.tags || []).some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === "popular") {
      result.sort((a, b) => (b.install_count || 0) - (a.install_count || 0));
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.published_date) - new Date(a.published_date));
    } else if (sortBy === "rating") {
      result.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    }

    return result;
  }, [apps, search, category, sortBy]);

  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#0d1220] to-[#0a0e1a] border-b border-white/5 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">SOINT Marketplace</h1>
          <p className="text-gray-400 mb-6">Extend SOINT with integrations, analytics, agents, and more</p>
          
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search apps..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
            <Link to={createPageUrl("DeveloperDashboard")}>
              <Button className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20">
                Publish App
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Categories & Sort */}
      <div className="border-b border-white/5 bg-[#0d1220] sticky top-0 z-10 px-8">
        <div className="max-w-6xl mx-auto py-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap text-sm transition-colors ${
                    category === cat.id
                      ? "bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-white/5">
            <span className="text-xs text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 rounded text-xs px-2 py-1 text-gray-300"
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading apps...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No apps found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApps.map(app => (
              <Link key={app.id} to={createPageUrl(`MarketplaceAppDetail?app_id=${app.app_id}`)}>
                <div className="bg-[#0d1117] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all hover:shadow-lg cursor-pointer h-full flex flex-col">
                  {/* Icon */}
                  {app.icon_url && (
                    <img src={app.icon_url} alt={app.name} className="w-12 h-12 rounded-lg mb-3" />
                  )}

                  {/* Name & Description */}
                  <h3 className="font-bold text-sm mb-1">{app.name}</h3>
                  <p className="text-xs text-gray-400 mb-4 flex-1">{app.description}</p>

                  {/* Meta */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">By {app.developer_name}</span>
                      {app.average_rating > 0 && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-3 h-3 fill-yellow-400" />
                          {app.average_rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">{app.install_count || 0} installs</span>
                      <span className="px-2 py-1 rounded bg-white/5 text-gray-400">
                        {app.pricing_model === "free" ? "Free" : `$${app.price_usd}`}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}