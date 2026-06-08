import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Play, Save, X, ArrowRight, GitBranch } from "lucide-react";

const STEP_TYPES = [
    { type: "quantum_job", label: "Quantum Job", color: "bg-purple-500/20 border-purple-500/50" },
    { type: "classical_compute", label: "Classical Compute", color: "bg-blue-500/20 border-blue-500/50" },
    { type: "data_transform", label: "Data Transform", color: "bg-cyan-500/20 border-cyan-500/50" },
    { type: "decision_gate", label: "Decision Gate", color: "bg-yellow-500/20 border-yellow-500/50" },
    { type: "merge", label: "Merge", color: "bg-green-500/20 border-green-500/50" }
];

export default function HybridWorkflowBuilder({ onSave, existingPipeline = null }) {
    const [pipelineName, setPipelineName] = useState(existingPipeline?.name || "");
    const [pipelineType, setPipelineType] = useState(existingPipeline?.pipeline_type || "quantum_to_classical");
    const [steps, setSteps] = useState(existingPipeline?.steps || []);
    const [selectedStep, setSelectedStep] = useState(null);
    const [connections, setConnections] = useState([]);
    const [editingStep, setEditingStep] = useState(null);
    const canvasRef = useRef(null);

    const addStep = (stepType) => {
        const newStep = {
            step_id: `step_${Date.now()}`,
            step_type: stepType,
            step_name: `${stepType.replace(/_/g, ' ')}`,
            configuration: "{}",
            dependencies: [],
            timeout_seconds: 300,
            retry_count: 0,
            error_handling: "fail_fast"
        };
        setSteps([...steps, newStep]);
    };

    const updateStep = (stepId, updates) => {
        setSteps(steps.map(s => s.step_id === stepId ? { ...s, ...updates } : s));
        setEditingStep(null);
    };

    const deleteStep = (stepId) => {
        setSteps(steps.filter(s => s.step_id !== stepId));
        setConnections(connections.filter(c => c.from !== stepId && c.to !== stepId));
        setSelectedStep(null);
    };

    const connectSteps = (fromId, toId) => {
        if (!connections.find(c => c.from === fromId && c.to === toId)) {
            setConnections([...connections, { from: fromId, to: toId }]);
            const toStep = steps.find(s => s.step_id === toId);
            if (toStep && !toStep.dependencies.includes(fromId)) {
                updateStep(toId, {
                    dependencies: [...toStep.dependencies, fromId]
                });
            }
        }
    };

    const handleSave = async () => {
        const workflowDef = {
            steps: steps.map(s => s.step_id),
            connections: connections
        };

        const pipelineData = {
            name: pipelineName,
            description: `${pipelineType} hybrid workflow`,
            pipeline_type: pipelineType,
            steps: steps,
            workflow_definition: JSON.stringify(workflowDef),
            input_schema: "{}",
            output_schema: "{}",
            status: "validated"
        };

        onSave(pipelineData);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="p-6 border-cyan-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Pipeline Name</label>
                        <input
                            type="text"
                            value={pipelineName}
                            onChange={(e) => setPipelineName(e.target.value)}
                            placeholder="e.g., Quantum-Classical Optimization"
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Pipeline Type</label>
                        <select
                            value={pipelineType}
                            onChange={(e) => setPipelineType(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                        >
                            <option value="quantum_to_classical">Quantum → Classical</option>
                            <option value="classical_to_quantum">Classical → Quantum</option>
                            <option value="alternating">Alternating</option>
                            <option value="parallel_fusion">Parallel Fusion</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Canvas Area */}
            <Card className="p-6 border-slate-600/50 bg-slate-900/20 min-h-[400px]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Workflow Canvas</h3>
                    <div className="flex gap-2">
                        <Button onClick={handleSave} size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700">
                            <Save className="w-4 h-4" />
                            Save Pipeline
                        </Button>
                    </div>
                </div>

                {/* Canvas with steps */}
                <div ref={canvasRef} className="relative bg-slate-800/30 rounded-lg p-6 min-h-[350px] border border-slate-700/50">
                    {steps.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            <p>Add steps to build your workflow</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {steps.map((step, idx) => {
                                const stepTypeConfig = STEP_TYPES.find(st => st.type === step.step_type);
                                return (
                                    <div key={step.step_id} className="space-y-2">
                                        <div
                                            onClick={() => setSelectedStep(step.step_id)}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                selectedStep === step.step_id
                                                    ? "border-cyan-400 shadow-lg shadow-cyan-400/20"
                                                    : "border-slate-600"
                                            } ${stepTypeConfig?.color}`}
                                        >
                                            <p className="font-bold text-sm text-white">{step.step_name}</p>
                                            <Badge variant="outline" className="text-xs mt-2">
                                                {step.step_type.replace(/_/g, ' ')}
                                            </Badge>
                                            {step.dependencies.length > 0 && (
                                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                                    <ArrowRight className="w-3 h-3" />
                                                    {step.dependencies.length} dependency
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                onClick={() => setEditingStep(step.step_id)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs text-cyan-400 hover:text-cyan-300 w-full"
                                            >
                                                Configure
                                            </Button>
                                            <Button
                                                onClick={() => deleteStep(step.step_id)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs text-red-400 hover:text-red-300 p-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Add Step Buttons */}
                <div className="mt-6 space-y-3">
                    <p className="text-sm font-medium text-gray-300">Add Step Type</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {STEP_TYPES.map(st => (
                            <Button
                                key={st.type}
                                onClick={() => addStep(st.type)}
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1"
                            >
                                <Plus className="w-3 h-3" />
                                {st.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Step Configuration */}
            {editingStep && (
                <Card className="p-6 border-yellow-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">
                            Configure: {steps.find(s => s.step_id === editingStep)?.step_name}
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingStep(null)}
                            className="text-gray-400 hover:text-gray-200"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Step Name</label>
                            <input
                                type="text"
                                defaultValue={steps.find(s => s.step_id === editingStep)?.step_name}
                                onChange={(e) => updateStep(editingStep, { step_name: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Configuration (JSON)</label>
                            <textarea
                                defaultValue={steps.find(s => s.step_id === editingStep)?.configuration}
                                onChange={(e) => updateStep(editingStep, { configuration: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 font-mono text-xs resize-none"
                                rows={4}
                                placeholder='{"key": "value"}'
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Timeout (seconds)</label>
                                <input
                                    type="number"
                                    defaultValue={steps.find(s => s.step_id === editingStep)?.timeout_seconds}
                                    onChange={(e) => updateStep(editingStep, { timeout_seconds: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Retry Count</label>
                                <input
                                    type="number"
                                    defaultValue={steps.find(s => s.step_id === editingStep)?.retry_count}
                                    onChange={(e) => updateStep(editingStep, { retry_count: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Error Handling</label>
                            <select
                                defaultValue={steps.find(s => s.step_id === editingStep)?.error_handling}
                                onChange={(e) => updateStep(editingStep, { error_handling: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                            >
                                <option value="fail_fast">Fail Fast</option>
                                <option value="skip_next">Skip Next</option>
                                <option value="use_classical_fallback">Use Classical Fallback</option>
                                <option value="retry">Retry</option>
                            </select>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}