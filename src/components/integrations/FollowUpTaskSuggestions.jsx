import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Phone, CheckCircle2, AlertTriangle } from "lucide-react";

export default function FollowUpTaskSuggestions({ deal, forecast, followUpTasks = [] }) {
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);

  const scheduleTaskMutation = useMutation({
    mutationFn: (taskId) => base44.functions.invoke('scheduleFollowUpInHubSpot', { taskId, dealId: deal.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow_up_tasks'] });
    }
  });

  const skipTaskMutation = useMutation({
    mutationFn: (taskId) => 
      base44.entities.FollowUpTask.update(taskId, { status: 'skipped' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow_up_tasks'] });
    }
  });

  if (!forecast || (forecast.trend !== 'declining' && forecast.win_probability > 40)) {
    return null;
  }

  const relevantTasks = followUpTasks.filter(t => t.deal_id === deal.id && t.status === 'suggested');
  const isAtRisk = forecast.win_probability < 40 || forecast.trend === 'declining';

  if (!isAtRisk) return null;

  return (
    <div className="border-l-4 border-orange-500 bg-orange-50 p-3 rounded space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-orange-900">At-Risk Deal - Follow-up Recommended</p>
            <p className="text-xs text-orange-800 mt-0.5">
              {forecast.trend === 'declining' ? 'Deal momentum is declining' : 'Win probability is low'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="text-orange-600 hover:text-orange-700 h-6 px-2"
        >
          {showDetails ? 'Hide' : 'Show'} Actions
        </Button>
      </div>

      {showDetails && (
        <div className="space-y-2 mt-3 pt-3 border-t border-orange-200">
          {relevantTasks.length > 0 ? (
            <div className="space-y-2">
              {relevantTasks.map(task => (
                <div key={task.id} className="bg-white border border-orange-200 rounded p-2">
                  <div className="flex items-start gap-2">
                    {task.task_type === 'email' ? (
                      <Mail className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    ) : (
                      <Phone className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900">{task.subject}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.content.split('\n')[0]}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => scheduleTaskMutation.mutate(task.id)}
                      disabled={scheduleTaskMutation.isPending}
                      className="text-xs h-6"
                    >
                      {scheduleTaskMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      )}
                      Schedule
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => skipTaskMutation.mutate(task.id)}
                      disabled={skipTaskMutation.isPending}
                      className="text-xs h-6"
                    >
                      Skip
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-orange-800">No suggested actions yet. Generate follow-up tasks to get recommendations.</p>
          )}
        </div>
      )}
    </div>
  );
}