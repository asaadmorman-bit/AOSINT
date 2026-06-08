import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Link2, TrendingUp, Brain } from "lucide-react";

export default function CorrelationInsights({ siemAlertId }) {
  const { data: correlationAnalysis, isLoading } = useQuery({
    queryKey: ['correlation_analysis', siemAlertId],
    queryFn: async () => {
      const analyses = await base44.entities.CorrelationAnalysis.list(undefined, 50).catch(() => []);
      return analyses.find(a => a.siem_alert_id === siemAlertId);
    }
  });

  const { data: relatedAlerts } = useQuery({
    queryKey: ['related_alerts', correlationAnalysis?.primary_asosint_alert_id],
    queryFn: () => {
      if (!correlationAnalysis?.primary_asosint_alert_id) return Promise.resolve([]);
      return base44.entities.OsintAlert.list(undefined, 20).catch(() => []);
    }
  });

  const severityColor = (score) => {
    if (score >= 80) return 'bg-red-100 text-red-800';
    if (score >= 60) return 'bg-orange-100 text-orange-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  if (isLoading) {
    return <p className="text-sm text-gray-500">Analyzing correlations...</p>;
  }

  if (!correlationAnalysis) {
    return null;
  }

  const isSuspicious = correlationAnalysis.confidence_score > 65 && correlationAnalysis.false_positive_risk < 30;
  const isFalsePositiveRisk = correlationAnalysis.false_positive_risk > 60;

  return (
    <div className="space-y-4">
      {/* Primary Correlation Alert */}
      {isSuspicious && (
        <Alert className="border-red-300 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 text-sm">
            <strong>High Confidence Correlation:</strong> {correlationAnalysis.analysis_reasoning?.slice(0, 150)}...
          </AlertDescription>
        </Alert>
      )}

      {isFalsePositiveRisk && (
        <Alert className="border-yellow-300 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 text-sm">
            <strong>False Positive Risk:</strong> {correlationAnalysis.false_positive_risk}% probability this is a false alert
          </AlertDescription>
        </Alert>
      )}

      {/* Correlation Strength */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4" /> AI Correlation Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Confidence Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Correlation Confidence</span>
              <Badge className={severityColor(correlationAnalysis.confidence_score)}>
                {correlationAnalysis.confidence_score}%
              </Badge>
            </div>
            <Progress value={correlationAnalysis.confidence_score} className="h-2" />
          </div>

          {/* False Positive Risk */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">False Positive Risk</span>
              <Badge className={correlationAnalysis.false_positive_risk > 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                {correlationAnalysis.false_positive_risk}%
              </Badge>
            </div>
            <Progress value={correlationAnalysis.false_positive_risk} className="h-2" />
          </div>

          {/* Correlation Type */}
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-600 mb-2">Correlation Type</p>
            <Badge className="capitalize bg-blue-100 text-blue-800">
              {correlationAnalysis.correlation_type?.replace(/_/g, ' ')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Threat Attribution */}
      {correlationAnalysis.threat_attribution?.likely_threat_actor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Threat Attribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-semibold">{correlationAnalysis.threat_attribution.likely_threat_actor}</p>
              <p className="text-xs text-gray-600">
                Confidence: {correlationAnalysis.threat_attribution.attribution_confidence}%
              </p>
            </div>

            {correlationAnalysis.threat_attribution.ttps_matched?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2">Matched TTPs</p>
                <div className="flex flex-wrap gap-1">
                  {correlationAnalysis.threat_attribution.ttps_matched.slice(0, 5).map((ttp, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {ttp}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pattern Insights */}
      {correlationAnalysis.pattern_insights?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Identified Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {correlationAnalysis.pattern_insights.slice(0, 4).map((insight, idx) => (
                <li key={idx} className="text-sm flex gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Temporal Analysis */}
      {correlationAnalysis.temporal_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Temporal Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Time Delta:</span>
              <span className="font-semibold">{correlationAnalysis.temporal_analysis.time_delta_minutes} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pattern:</span>
              <span className="font-semibold">{correlationAnalysis.temporal_analysis.temporal_pattern}</span>
            </div>
            {correlationAnalysis.temporal_analysis.is_within_campaign_window && (
              <div className="pt-2 border-t flex items-center gap-2 text-blue-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Within known campaign window</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Correlation Chain */}
      {correlationAnalysis.correlation_chain?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Link2 className="w-4 h-4" /> Entity Relationships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {correlationAnalysis.correlation_chain.slice(0, 5).map((entity, idx) => (
                <div key={idx} className="text-xs p-2 bg-gray-50 rounded border">
                  <p className="font-semibold">{entity.entity_value}</p>
                  <p className="text-gray-600">{entity.entity_type} → {entity.relationship}</p>
                  <div className="mt-1">
                    <Progress value={entity.evidence_strength} className="h-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Action */}
      {correlationAnalysis.recommended_action && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-sm">Recommended Action</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{correlationAnalysis.recommended_action}</p>
          </CardContent>
        </Card>
      )}

      {/* Analysis Reasoning */}
      {correlationAnalysis.analysis_reasoning && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Analysis Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-700 leading-relaxed">
              {correlationAnalysis.analysis_reasoning}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}