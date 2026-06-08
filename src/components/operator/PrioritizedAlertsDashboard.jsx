import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Zap, TrendingUp, CheckCircle2, ArrowUp, Loader2 } from "lucide-react";

export default function PrioritizedAlertsDashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch priority analysis results
  const { data: priorityAnalysis, isLoading, refetch } = useQuery({
    queryKey: ['alert_priority_analysis'],
    queryFn: () => base44.entities.AlertPriorityAnalysis.list('-analysis_timestamp', 100),
    initialData: [],
  });

  // Trigger analysis function
  const analyzePriorities = async () => {
    setIsAnalyzing(true);
    try {
      await base44.functions.invoke('analyzeAlertPriorities');
      await refetch();
    } catch (error) {
      console.error('Error analyzing priorities:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Organize by priority and action required
  const organizationByPriority = useMemo(() => {
    const grouped = {
      critical: { immediate: [], routine: [] },
      high: { immediate: [], routine: [] },
      medium: { immediate: [], routine: [] },
      low: { immediate: [], routine: [] }
    };

    priorityAnalysis.forEach(item => {
      const priority = item.ai_recommended_priority || 'medium';
      const bucket = item.immediate_action_required ? 'immediate' : 'routine';
      if (grouped[priority]) {
        grouped[priority][bucket].push(item);
      }
    });

    return grouped;
  }, [priorityAnalysis]);

  const immediateActionItems = useMemo(() => {
    return priorityAnalysis.filter(item => item.immediate_action_required === true);
  }, [priorityAnalysis]);

  const criticalItems = useMemo(() => {
    return priorityAnalysis.filter(item => item.ai_recommended_priority === 'critical');
  }, [priorityAnalysis]);

  if (isLoading) {
    return <p className="text-gray-500">Loading prioritized alerts...</p>;
  }

  const priorityColors = {
    critical: 'bg-red-600 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-blue-500 text-white'
  };

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{immediateActionItems.length}</p>
              <p className="text-xs text-gray-600 mt-2">Require Immediate Action</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{criticalItems.length}</p>
              <p className="text-xs text-gray-600 mt-2">Critical Priority</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{priorityAnalysis.length}</p>
              <p className="text-xs text-gray-600 mt-2">Total Analyzed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={analyzePriorities}
              disabled={isAnalyzing}
              size="sm"
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Re-Analyze
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Immediate Action Required Alert */}
      {immediateActionItems.length > 0 && (
        <Alert className="border-red-300 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{immediateActionItems.length} alerts require immediate operator attention</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Immediate Action Items - Prominently Displayed */}
      {immediateActionItems.length > 0 && (
        <Card className="border-red-500 bg-gradient-to-r from-red-50 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Zap className="w-5 h-5" /> Immediate Action Required
            </CardTitle>
            <CardDescription>High-confidence intelligence requiring operator response</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {immediateActionItems.map(item => (
              <div key={item.id} className="border-l-4 border-red-600 bg-white p-4 rounded-r">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.alert_id}</p>
                    <p className="text-sm text-gray-700 mt-1">{item.priority_justification}</p>
                  </div>
                  <Badge className="bg-red-600">
                    {item.ai_recommended_priority?.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xs space-y-1 mt-2">
                  <p><strong>Confidence:</strong> {item.confidence_score}% | <strong>Actionability:</strong> {item.actionability_score}%</p>
                  {item.current_event_context && (
                    <p><strong>Context:</strong> {item.current_event_context}</p>
                  )}
                  {item.recommended_actions && item.recommended_actions.length > 0 && (
                    <div>
                      <p className="font-semibold">Recommended Actions:</p>
                      <ul className="list-disc list-inside ml-2">
                        {item.recommended_actions.slice(0, 3).map((action, idx) => (
                          <li key={idx} className="text-xs">{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Priority Breakdown */}
      {['critical', 'high', 'medium', 'low'].map(priority => {
        const { immediate, routine } = organizationByPriority[priority];
        const totalInPriority = immediate.length + routine.length;

        if (totalInPriority === 0) return null;

        return (
          <Card key={priority}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className={priorityColors[priority]}>
                  {priority.toUpperCase()}
                </Badge>
                <span className="text-sm">{totalInPriority} items</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {immediate.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-red-600 mb-2">
                    <AlertTriangle className="w-4 h-4 inline mr-1" /> Immediate Action
                  </p>
                  <div className="space-y-2">
                    {immediate.map(item => (
                      <div key={item.id} className="border rounded p-2 bg-gray-50">
                        <div className="flex justify-between items-start text-xs">
                          <div className="flex-1">
                            <p className="font-semibold">{item.alert_id}</p>
                            <p className="text-gray-600 mt-1 line-clamp-2">{item.priority_justification}</p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="font-semibold">{item.confidence_score}%</p>
                            <p className="text-gray-600">confidence</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {routine.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    <CheckCircle2 className="w-4 h-4 inline mr-1" /> Routine Priority
                  </p>
                  <div className="space-y-2">
                    {routine.slice(0, 5).map(item => (
                      <div key={item.id} className="border rounded p-2 text-xs bg-gray-50">
                        <div className="flex justify-between">
                          <p className="font-semibold">{item.alert_id}</p>
                          <p className="text-gray-600">{item.confidence_score}%</p>
                        </div>
                      </div>
                    ))}
                    {routine.length > 5 && (
                      <p className="text-xs text-gray-500 text-center py-2">
                        +{routine.length - 5} more items
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {priorityAnalysis.length === 0 && (
        <Alert>
          <AlertDescription>
            No alerts analyzed yet. Click "Re-Analyze" to generate AI-driven priority recommendations.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}