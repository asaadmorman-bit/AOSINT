import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

export default function FeedSubscriptionManager({ dashboardId }) {
  const queryClient = useQueryClient();

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['dashboard_subscriptions', dashboardId],
    queryFn: () => base44.entities.DashboardFeedSubscription.filter({
      dashboard_id: dashboardId
    }, '-created_at', 50),
    initialData: [],
  });

  const toggleSubscriptionMutation = useMutation({
    mutationFn: ({ subscriptionId, isEnabled }) =>
      base44.entities.DashboardFeedSubscription.update(subscriptionId, {
        is_enabled: !isEnabled
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard_subscriptions', dashboardId] });
    }
  });

  const deleteSubscriptionMutation = useMutation({
    mutationFn: (subscriptionId) =>
      base44.entities.DashboardFeedSubscription.delete(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard_subscriptions', dashboardId] });
    }
  });

  if (isLoading) return <p className="text-xs text-gray-600">Loading subscriptions...</p>;

  return (
    <div className="space-y-3">
      {subscriptions.length === 0 ? (
        <p className="text-xs text-gray-600">No feed subscriptions configured.</p>
      ) : (
        subscriptions.map(sub => (
          <Card key={sub.id} className="hover:bg-gray-50">
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {sub.feed_type.replace(/_/g, ' ')}
                    </Badge>
                    {sub.is_enabled ? (
                      <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 text-xs">Inactive</Badge>
                    )}
                  </div>

                  <div className="mt-2 space-y-1">
                    {sub.severity_filter && sub.severity_filter.length > 0 && (
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">Severity:</span> {sub.severity_filter.join(', ')}
                      </p>
                    )}
                    {sub.threat_type_filter && sub.threat_type_filter.length > 0 && (
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">Types:</span> {sub.threat_type_filter.join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Daily Limit:</span> {sub.max_threats_per_day} threats
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleSubscriptionMutation.mutate({
                      subscriptionId: sub.id,
                      isEnabled: sub.is_enabled
                    })}
                    disabled={toggleSubscriptionMutation.isPending}
                    className="h-8 w-8 p-0"
                  >
                    {sub.is_enabled ? (
                      <ToggleRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteSubscriptionMutation.mutate(sub.id)}
                    disabled={deleteSubscriptionMutation.isPending}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    {deleteSubscriptionMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}