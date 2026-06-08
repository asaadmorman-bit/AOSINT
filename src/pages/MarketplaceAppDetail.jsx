import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Star, Download, Heart, Share2, ExternalLink, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketplaceAppDetail() {
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState("");
  const [showInstall, setShowInstall] = useState(false);

  // Get app_id from URL params
  const params = new URLSearchParams(window.location.search);
  const appId = params.get("app_id");

  const { data: app, isLoading } = useQuery({
    queryKey: ["marketplace_app", appId],
    queryFn: () => base44.asServiceRole.entities.App.filter({ app_id: appId }).then(r => r?.[0]),
  });

  const { data: reviews } = useQuery({
    queryKey: ["app_reviews", appId],
    queryFn: () => base44.asServiceRole.entities.AppReview.filter({ app_id: appId, status: "published" }),
  });

  const { data: user } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => base44.auth.me(),
  });

  const { data: tenants } = useQuery({
    queryKey: ["my_tenants"],
    queryFn: () => base44.entities.Tenant.list(),
  });

  const installMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke("installApp", {
        app_id: appId,
        tenant_id: selectedTenant,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app_installs"] });
      setShowInstall(false);
    },
  });

  if (isLoading) return <div className="text-center py-12">Loading...</div>;
  if (!app) return <div className="text-center py-12">App not found</div>;

  const tierOrder = ["community", "pro", "enterprise", "gov"];

  return (
    <div className="min-h-screen bg-[#060a0f] text-white">
      {/* Header */}
      <div className="bg-[#0d1220] border-b border-white/5 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-6">
            {app.icon_url && <img src={app.icon_url} alt={app.name} className="w-24 h-24 rounded-xl" />}
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{app.name}</h1>
              <p className="text-gray-400 mt-2">By {app.developer_name}</p>

              <div className="flex items-center gap-4 mt-4">
                {app.average_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.round(app.average_rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-400">
                      {app.average_rating.toFixed(1)} ({app.review_count || 0} reviews)
                    </span>
                  </div>
                )}
                <span className="text-sm text-gray-500">{app.install_count || 0} installs</span>
              </div>

              <div className="flex gap-2 mt-6">
                {selectedTenant ? (
                  <Button
                    onClick={() => installMutation.mutate()}
                    disabled={installMutation.isPending}
                    className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20"
                  >
                    {installMutation.isPending ? "Installing..." : "Install"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowInstall(true)}
                    className="bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 hover:bg-[#00d4ff]/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Install
                  </Button>
                )}
                <Button variant="ghost" size="icon">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-72">
              <div className="text-2xl font-bold mb-4">
                {app.pricing_model === "free" ? "Free" : `$${app.price_usd}${app.price_unit ? ` ${app.price_unit}` : ""}`}
              </div>

              {app.tier_required !== "community" && (
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm text-yellow-400 mb-4">
                  <Lock className="w-4 h-4" />
                  Requires {app.tier_required} tier
                </div>
              )}

              {app.usage_limit && (
                <div className="space-y-2 text-sm text-gray-400 mb-4">
                  {app.usage_limit.api_calls_per_month && (
                    <p>• {app.usage_limit.api_calls_per_month.toLocaleString()} API calls/month</p>
                  )}
                  {app.usage_limit.data_ingestion_gb_per_month && (
                    <p>• {app.usage_limit.data_ingestion_gb_per_month}GB data/month</p>
                  )}
                  {app.usage_limit.concurrent_instances && (
                    <p>• {app.usage_limit.concurrent_instances} concurrent instances</p>
                  )}
                </div>
              )}

              <Button className="w-full bg-white text-black hover:bg-gray-100">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="grid grid-cols-3 gap-8">
          {/* Main */}
          <div className="col-span-2">
            {app.banner_url && <img src={app.banner_url} alt={app.name} className="w-full rounded-xl mb-8" />}

            <div className="prose prose-invert max-w-none mb-8">
              <h2 className="text-xl font-bold mb-4">Overview</h2>
              <p className="text-gray-300 whitespace-pre-wrap">{app.long_description}</p>
            </div>

            {app.permissions_required && app.permissions_required.length > 0 && (
              <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6 mb-8">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#00d4ff]" />
                  Permissions Required
                </h3>
                <ul className="space-y-2">
                  {app.permissions_required.map(perm => (
                    <li key={perm} className="text-sm text-gray-400 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4">Reviews</h3>
                <div className="space-y-4">
                  {reviews.slice(0, 3).map(review => (
                    <div key={review.id} className="bg-[#0d1117] border border-white/5 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-sm">{review.reviewer_name}</p>
                          <p className="text-xs text-gray-500">{review.reviewer_organization}</p>
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">{review.review_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#0d1117] border border-white/5 rounded-xl p-6">
              <h4 className="font-bold mb-4">Details</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="font-bold capitalize">{app.category}</p>
                </div>
                <div>
                  <p className="text-gray-500">Version</p>
                  <p className="font-bold">{app.version}</p>
                </div>
                {app.documentation_url && (
                  <div>
                    <a href={app.documentation_url} target="_blank" className="text-[#00d4ff] hover:underline flex items-center gap-1">
                      Documentation <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {app.support_email && (
                  <div>
                    <p className="text-gray-500">Support</p>
                    <a href={`mailto:${app.support_email}`} className="text-[#00d4ff] hover:underline">{app.support_email}</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Install Modal */}
      {showInstall && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0d1117] border border-white/5 rounded-xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Select Tenant</h3>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white mb-6"
            >
              <option value="">Choose a tenant...</option>
              {tenants?.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowInstall(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => installMutation.mutate()}
                disabled={!selectedTenant || installMutation.isPending}
                className="flex-1 bg-[#00d4ff]/10 text-[#00d4ff]"
              >
                {installMutation.isPending ? "Installing..." : "Install"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}