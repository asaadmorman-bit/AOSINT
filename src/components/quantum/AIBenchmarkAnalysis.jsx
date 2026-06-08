import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Zap, Target, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function AIBenchmarkAnalysis() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    const { data: analysis, isLoading, error, refetch } = useQuery({
        queryKey: ['quantumBenchmarkAnalysis'],
        queryFn: async () => {
            if (!isAnalyzing) return null;
            const response = await base44.functions.invoke('analyzeQuantumBenchmarks', {});
            return response.data;
        },
        enabled: false,
        staleTime: Infinity
    });

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        await refetch();
    };

    if (!analysisResult && analysis) {
        setAnalysisResult(analysis);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">AI-Powered Quantum Benchmark Analysis</h2>
                <Button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Zap className="w-4 h-4" />
                            Analyze Benchmarks
                        </>
                    )}
                </Button>
            </div>

            {error && (
                <Card className="p-4 border-red-500/30 bg-red-500/5">
                    <div className="flex gap-2 text-red-400">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{error.message}</span>
                    </div>
                </Card>
            )}

            {analysisResult && (
                <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
                            <div className="text-sm text-gray-400 mb-2">Total Benchmarks</div>
                            <div className="text-2xl font-bold text-cyan-400">{analysisResult.summary.totalBenchmarks}</div>
                        </Card>
                        <Card className="p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                            <div className="text-sm text-gray-400 mb-2">Avg Speedup</div>
                            <div className="text-2xl font-bold text-violet-400">{analysisResult.summary.avgSpeedup}x</div>
                        </Card>
                        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
                            <div className="text-sm text-gray-400 mb-2">Advantage Rate</div>
                            <div className="text-2xl font-bold text-emerald-400">{analysisResult.summary.advantageRate}%</div>
                        </Card>
                        <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
                            <div className="text-sm text-gray-400 mb-2">Use Cases</div>
                            <div className="text-2xl font-bold text-orange-400">{analysisResult.summary.cryptanalysisBenchmarks + analysisResult.summary.networkOptBenchmarks}</div>
                        </Card>
                    </div>

                    {analysisResult.analysis && (
                        <>
                            {/* Trend Analysis */}
                            <Card className="p-6 border-cyan-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                                    Performance Trends
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">Overall Trend</p>
                                        <p className="text-white">{analysisResult.analysis.trend_analysis?.overall_trend}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">Cryptanalysis</p>
                                            <p className="text-white text-sm">{analysisResult.analysis.trend_analysis?.cryptanalysis_trend}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">Network Optimization</p>
                                            <p className="text-white text-sm">{analysisResult.analysis.trend_analysis?.network_opt_trend}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Scalability Predictions */}
                            <Card className="p-6 border-violet-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-violet-400" />
                                    Scalability Predictions
                                </h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                            <p className="text-xs text-gray-400 mb-1">2x Problem Size</p>
                                            <p className="text-sm text-white">{analysisResult.analysis.scalability_predictions?.["2x_problem_size"]}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                            <p className="text-xs text-gray-400 mb-1">4x Problem Size</p>
                                            <p className="text-sm text-white">{analysisResult.analysis.scalability_predictions?.["4x_problem_size"]}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                        <p className="text-xs text-gray-400 mb-1">Critical Size Projection</p>
                                        <p className="text-sm text-white">{analysisResult.analysis.scalability_predictions?.predicted_critical_size}</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Comparative Analysis */}
                            <Card className="p-6 border-emerald-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <ArrowRight className="w-5 h-5 text-emerald-400" />
                                    Quantum vs Classical Comparison
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">Performance Gap</p>
                                        <p className="text-white">{analysisResult.analysis.comparative_analysis?.quantum_advantage_gap}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">Cryptanalysis Performance</p>
                                            <p className="text-white text-sm">{analysisResult.analysis.comparative_analysis?.cryptanalysis_performance}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">Network Optimization</p>
                                            <p className="text-white text-sm">{analysisResult.analysis.comparative_analysis?.network_optimization_performance}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Critical Insights */}
                            {analysisResult.analysis.critical_insights && analysisResult.analysis.critical_insights.length > 0 && (
                                <Card className="p-6 border-orange-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-orange-400" />
                                        Critical Insights
                                    </h3>
                                    <ul className="space-y-2">
                                        {analysisResult.analysis.critical_insights.map((insight, idx) => (
                                            <li key={idx} className="flex gap-2 text-sm text-gray-300">
                                                <span className="text-orange-400 shrink-0">•</span>
                                                <span>{insight}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </Card>
                            )}

                            {/* Recommendations */}
                            {analysisResult.analysis.recommendations && analysisResult.analysis.recommendations.length > 0 && (
                                <Card className="p-6 border-green-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40">
                                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                                        Recommendations
                                    </h3>
                                    <ol className="space-y-2">
                                        {analysisResult.analysis.recommendations.map((rec, idx) => (
                                            <li key={idx} className="flex gap-3 text-sm text-gray-300">
                                                <span className="font-bold text-green-400 shrink-0">{idx + 1}.</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </Card>
                            )}
                        </>
                    )}
                </>
            )}

            {!analysisResult && !isLoading && (
                <Card className="p-12 border-gray-700/50 bg-gradient-to-br from-slate-800/20 to-slate-900/20 text-center">
                    <Zap className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
                    <p className="text-gray-400 mb-4">Run AI analysis to get deep insights into quantum benchmark performance</p>
                    <Button
                        onClick={handleAnalyze}
                        className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                    >
                        <Zap className="w-4 h-4" />
                        Start Analysis
                    </Button>
                </Card>
            )}
        </div>
    );
}