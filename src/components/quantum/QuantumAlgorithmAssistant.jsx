import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, ChevronDown, AlertTriangle, CheckCircle2, TrendingUp, Lightbulb, Target, Eye } from "lucide-react";

const TASK_TYPES = [
    "cryptanalysis",
    "network_optimization",
    "resource_allocation",
    "pattern_search",
    "threat_simulation",
    "hybrid_vqe"
];

export default function QuantumAlgorithmAssistant() {
    const [taskType, setTaskType] = useState("cryptanalysis");
    const [problemDescription, setProblemDescription] = useState("");
    const [problemSize, setProblemSize] = useState(10);
    const [desiredQuality, setDesiredQuality] = useState(85);
    const [timeConstraint, setTimeConstraint] = useState(300);
    const [budget, setBudget] = useState(1000);
    const [isLoading, setIsLoading] = useState(false);
    const [recommendation, setRecommendation] = useState(null);
    const [error, setError] = useState(null);
    const [expandedSection, setExpandedSection] = useState("recommendation");

    const handleGetRecommendation = async () => {
        if (!problemDescription.trim()) {
            setError("Please describe your problem");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await base44.functions.invoke('recommendQuantumAlgorithm', {
                taskType,
                problemDescription,
                problemSize: parseInt(problemSize),
                desiredSolutionQuality: parseInt(desiredQuality),
                timeConstraint: parseInt(timeConstraint),
                budgetConstraint: parseInt(budget)
            });
            setRecommendation(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Input Section */}
            <Card className="p-6 border-cyan-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-cyan-400" />
                    Problem Definition
                </h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Task Type</label>
                        <select
                            value={taskType}
                            onChange={(e) => setTaskType(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                        >
                            {TASK_TYPES.map(type => (
                                <option key={type} value={type}>
                                    {type.replace(/_/g, ' ').toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Problem Description</label>
                        <textarea
                            value={problemDescription}
                            onChange={(e) => setProblemDescription(e.target.value)}
                            placeholder="Describe your problem in detail (e.g., factor a 2048-bit RSA number, optimize network routing for 100 nodes...)"
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 resize-none"
                            rows={4}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Problem Size (qubits): {problemSize}
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="1000"
                                value={problemSize}
                                onChange={(e) => setProblemSize(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Solution Quality: {desiredQuality}%
                            </label>
                            <input
                                type="range"
                                min="50"
                                max="100"
                                value={desiredQuality}
                                onChange={(e) => setDesiredQuality(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Max Runtime (seconds): {timeConstraint}
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="3600"
                                step="10"
                                value={timeConstraint}
                                onChange={(e) => setTimeConstraint(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Budget (USD): ${budget}
                            </label>
                            <input
                                type="range"
                                min="100"
                                max="10000"
                                step="100"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <Button
                        onClick={handleGetRecommendation}
                        disabled={isLoading}
                        className="w-full gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4" />
                                Get AI Recommendation
                            </>
                        )}
                    </Button>
                </div>
            </Card>

            {/* Recommendation Results */}
            {recommendation && recommendation.recommendation && (
                <div className="space-y-4">
                    {/* Primary Recommendation */}
                    <Card className="p-6 border-green-500/20 bg-gradient-to-br from-green-500/5 to-slate-900/40">
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedSection(expandedSection === "recommendation" ? null : "recommendation")}
                        >
                            <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                                Recommended Algorithm & Backend
                            </h3>
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === "recommendation" ? "rotate-180" : ""}`} />
                        </div>

                        {expandedSection === "recommendation" && (
                            <div className="mt-4 space-y-3">
                                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                    <p className="text-xs text-gray-400 mb-1">Algorithm</p>
                                    <p className="text-lg font-bold text-green-400">{recommendation.recommendation.primary_recommendation?.algorithm}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                    <p className="text-xs text-gray-400 mb-1">Recommended Backend</p>
                                    <p className="text-lg font-bold text-green-400">{recommendation.recommendation.primary_recommendation?.backend}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                    <p className="text-xs text-gray-400 mb-1">Justification</p>
                                    <p className="text-sm text-gray-300">{recommendation.recommendation.primary_recommendation?.justification}</p>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Performance Prediction */}
                    <Card className="p-6 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-slate-900/40">
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedSection(expandedSection === "performance" ? null : "performance")}
                        >
                            <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                Performance Prediction
                            </h3>
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === "performance" ? "rotate-180" : ""}`} />
                        </div>

                        {expandedSection === "performance" && (
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                    <p className="text-xs text-gray-400 mb-1">Expected Runtime</p>
                                    <p className="text-lg font-bold text-blue-400">{recommendation.recommendation.performance_prediction?.expected_runtime_seconds.toFixed(2)}s</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                    <p className="text-xs text-gray-400 mb-1">Quality Score</p>
                                    <p className="text-lg font-bold text-blue-400">{recommendation.recommendation.performance_prediction?.expected_quality_score.toFixed(1)}%</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                    <p className="text-xs text-gray-400 mb-1">Predicted Speedup</p>
                                    <p className="text-lg font-bold text-blue-400">{recommendation.recommendation.performance_prediction?.predicted_speedup.toFixed(2)}x</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                    <p className="text-xs text-gray-400 mb-1">Confidence</p>
                                    <p className="text-lg font-bold text-blue-400">{recommendation.recommendation.performance_prediction?.confidence_level.toFixed(0)}%</p>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Quantum Advantage */}
                    <Card className="p-6 border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-slate-900/40">
                        <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedSection(expandedSection === "advantage" ? null : "advantage")}
                        >
                            <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                                <Target className="w-5 h-5 text-violet-400" />
                                Quantum Advantage Analysis
                            </h3>
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === "advantage" ? "rotate-180" : ""}`} />
                        </div>

                        {expandedSection === "advantage" && (
                            <div className="mt-4 space-y-3">
                                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                    <p className="text-xs text-gray-400 mb-1">Probability of Quantum Advantage</p>
                                    <p className="text-2xl font-bold text-violet-400">{recommendation.recommendation.quantum_advantage?.probability_percent.toFixed(1)}%</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                    <p className="text-xs text-gray-400 mb-1">Advantage Type</p>
                                    <p className="text-sm text-gray-300">{recommendation.recommendation.quantum_advantage?.advantage_type}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                    <p className="text-xs text-gray-400 mb-1">Breakeven Problem Size</p>
                                    <p className="text-sm text-gray-300">{recommendation.recommendation.quantum_advantage?.breakeven_problem_size}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                    <p className="text-xs text-gray-400 mb-1">Classical Baseline</p>
                                    <p className="text-sm text-gray-300">{recommendation.recommendation.quantum_advantage?.classical_baseline_hours.toFixed(2)} hours</p>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Risks */}
                    {recommendation.recommendation.risk_assessment && recommendation.recommendation.risk_assessment.length > 0 && (
                        <Card className="p-6 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-slate-900/40">
                            <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => setExpandedSection(expandedSection === "risks" ? null : "risks")}
                            >
                                <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                                    Risk Assessment
                                </h3>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === "risks" ? "rotate-180" : ""}`} />
                            </div>

                            {expandedSection === "risks" && (
                                <div className="mt-4 space-y-3">
                                    {recommendation.recommendation.risk_assessment.map((risk, idx) => (
                                        <div key={idx} className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                            <div className="flex items-start gap-2">
                                                <Badge className={`shrink-0 ${
                                                    risk.severity === 'critical' ? 'bg-red-500/30 text-red-300' :
                                                    risk.severity === 'high' ? 'bg-orange-500/30 text-orange-300' :
                                                    'bg-yellow-500/30 text-yellow-300'
                                                }`}>{risk.severity}</Badge>
                                            </div>
                                            <p className="text-sm font-medium text-white mt-2">{risk.risk}</p>
                                            <p className="text-xs text-gray-400 mt-1">Mitigation: {risk.mitigation}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Alternatives */}
                    {recommendation.recommendation.alternatives && recommendation.recommendation.alternatives.length > 0 && (
                        <Card className="p-6 border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-slate-900/40">
                            <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => setExpandedSection(expandedSection === "alternatives" ? null : "alternatives")}
                            >
                                <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                                    <Eye className="w-5 h-5 text-cyan-400" />
                                    Alternative Approaches
                                </h3>
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === "alternatives" ? "rotate-180" : ""}`} />
                            </div>

                            {expandedSection === "alternatives" && (
                                <div className="mt-4 space-y-3">
                                    {recommendation.recommendation.alternatives.map((alt, idx) => (
                                        <div key={idx} className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50">
                                            <p className="font-medium text-white text-sm">{alt.algorithm} on {alt.backend}</p>
                                            <p className="text-xs text-green-400 mt-1">✓ {alt.advantages}</p>
                                            <p className="text-xs text-red-400 mt-1">✗ {alt.disadvantages}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}