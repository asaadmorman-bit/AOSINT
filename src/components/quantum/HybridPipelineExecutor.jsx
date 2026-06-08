import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Loader2, CheckCircle2, AlertCircle, Clock, DollarSign, Zap } from "lucide-react";

export default function HybridPipelineExecutor({ pipelineId, pipeline }) {
    const [selectedExecution, setSelectedExecution] = useState(null);
    const [inputData, setInputData] = useState("{}");
    const [showExecutionDetails, setShowExecutionDetails] = useState(false);

    const { data: executions, refetch } = useQuery({
        queryKey: ['hybrid_executions', pipelineId],
        queryFn: async () => {
            const traces = await base44.entities.HybridExecutionTrace.list();
            return traces.filter(t => t.pipeline_id === pipelineId).sort((a, b) => 
                new Date(b.created_date) - new Date(a.created_date)
            );
        },
        enabled: !!pipelineId
    });

    const executePipelineMutation = useMutation({
        mutationFn: async (inputPayload) => {
            return await base44.functions.invoke('executeHybridPipeline', {
                pipelineId,
                inputData: inputPayload
            });
        },
        onSuccess: () => refetch()
    });

    const handleExecute = async () => {
        try {
            const parsedInput = JSON.parse(inputData);
            executePipelineMutation.mutate(parsedInput);
        } catch (err) {
            alert('Invalid JSON input');
        }
    };

    const getStatusColor = (status) => {
        return status === 'completed' ? 'bg-green-500/20 text-green-300' :
               status === 'failed' ? 'bg-red-500/20 text-red-300' :
               status === 'running' ? 'bg-blue-500/20 text-blue-300' :
               'bg-gray-500/20 text-gray-300';
    };

    return (
        <div className="space-y-6">
            {/* Execution Input */}
            <Card className="p-6 border-blue-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40">
                <h3 className="text-lg font-bold text-white mb-4">Execute Pipeline</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Input Data (JSON)</label>
                        <textarea
                            value={inputData}
                            onChange={(e) => setInputData(e.target.value)}
                            placeholder='{"param1": "value1"}'
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-blue-500 resize-none"
                            rows={4}
                        />
                    </div>
                    <Button
                        onClick={handleExecute}
                        disabled={executePipelineMutation.isPending}
                        className="w-full gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    >
                        {executePipelineMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Executing...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Execute Pipeline
                            </>
                        )}
                    </Button>
                </div>
            </Card>

            {/* Pipeline Stats */}
            {pipeline && (
                <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 border-slate-600/50 bg-slate-900/20">
                        <p className="text-xs text-gray-400 mb-1">Executions</p>
                        <p className="text-2xl font-bold text-cyan-400">{pipeline.execution_count || 0}</p>
                    </Card>
                    <Card className="p-4 border-slate-600/50 bg-slate-900/20">
                        <p className="text-xs text-gray-400 mb-1">Success Rate</p>
                        <p className="text-2xl font-bold text-green-400">{pipeline.success_rate || 0}%</p>
                    </Card>
                    <Card className="p-4 border-slate-600/50 bg-slate-900/20">
                        <p className="text-xs text-gray-400 mb-1">Estimated Cost</p>
                        <p className="text-2xl font-bold text-yellow-400">${pipeline.estimated_cost_usd || 0}</p>
                    </Card>
                </div>
            )}

            {/* Execution History */}
            <Card className="p-6 border-slate-600/50 bg-slate-900/20">
                <h3 className="text-lg font-bold text-white mb-4">Execution History</h3>
                {executions && executions.length === 0 ? (
                    <p className="text-sm text-gray-400">No executions yet</p>
                ) : (
                    <div className="space-y-3">
                        {executions?.map((execution) => (
                            <div
                                key={execution.id}
                                onClick={() => setSelectedExecution(execution.id)}
                                className="p-4 rounded-lg border border-slate-600/50 hover:border-cyan-500/50 cursor-pointer transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {execution.status === 'completed' ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                                        ) : execution.status === 'running' ? (
                                            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-red-400" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-white">{execution.execution_id}</p>
                                            <p className="text-xs text-gray-400">
                                                <Clock className="w-3 h-3 inline mr-1" />
                                                {new Date(execution.created_date).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={getStatusColor(execution.status)}>
                                            {execution.status}
                                        </Badge>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-white">{execution.total_runtime_seconds}s</p>
                                            <p className="text-xs text-yellow-400 flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" />
                                                ${execution.total_cost_usd?.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Step Details on Hover */}
                                {selectedExecution === execution.id && execution.step_executions && (
                                    <div className="mt-4 pt-4 border-t border-slate-600/50 space-y-2">
                                        <p className="text-xs font-medium text-gray-300 mb-2">Step Execution Trace</p>
                                        {(Array.isArray(execution.step_executions) ? execution.step_executions : JSON.parse(execution.step_executions || '[]')).map((step, idx) => (
                                            <div key={idx} className="pl-4 border-l border-slate-600/50 py-1">
                                                <p className="text-xs font-medium text-white">{step.step_name}</p>
                                                <p className="text-xs text-gray-400">
                                                    {step.status === 'completed' ? '✓' : '✗'} {step.duration_seconds?.toFixed(2)}s
                                                </p>
                                                {step.error_message && (
                                                    <p className="text-xs text-red-400 mt-1">{step.error_message}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}