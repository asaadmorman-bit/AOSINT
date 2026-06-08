import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await req.json();
        const {
            taskType,
            problemDescription,
            problemSize,
            desiredSolutionQuality,
            timeConstraint,
            budgetConstraint
        } = payload;

        // Fetch available resources and benchmarks for context
        const resources = await base44.entities.QuantumResourcePool.list();
        const benchmarks = await base44.entities.DARPAQuantumBenchmark.list();
        const comparisons = await base44.entities.QuantumPerformanceComparison.list();

        const contextData = {
            availableBackends: resources.map(r => ({
                name: r.pool_name,
                type: r.pool_type,
                qubits: r.total_qubits,
                status: r.status,
                cost: r.cost_per_minute_usd,
                gateFidelity: r.gate_fidelity
            })),
            historicalBenchmarks: benchmarks.slice(0, 10).map(b => ({
                name: b.benchmark_name,
                algorithm: b.benchmark_standard,
                score: b.metric_quantum_score,
                advantage: b.advantage_demonstrated
            })),
            performanceData: comparisons.slice(0, 5).map(c => ({
                speedup: c.speedup_factor,
                quality: c.quantum_solution_quality,
                cost: c.total_cost_quantum_usd
            }))
        };

        const recommendationPrompt = `You are a quantum computing expert. Recommend the optimal quantum algorithm and backend for this task:

Task Type: ${taskType}
Problem Description: ${problemDescription}
Problem Size (qubits needed): ${problemSize}
Desired Solution Quality: ${desiredSolutionQuality}% accuracy
Time Constraint: ${timeConstraint} seconds
Budget Constraint: $${budgetConstraint}

Available Resources:
${JSON.stringify(contextData.availableBackends, null, 2)}

Historical Performance Data:
${JSON.stringify(contextData.historicalBenchmarks, null, 2)}

Provide:
1. Recommended algorithm (e.g., Shor's, QAOA, VQE, Grover's) with justification
2. Recommended backend selection with reasoning
3. Expected performance metrics (speedup, solution quality, runtime)
4. Probability of quantum advantage for this problem
5. Risk assessment and mitigation strategies
6. Alternative approaches if primary recommendation fails`;

        const recommendation = await base44.integrations.Core.InvokeLLM({
            prompt: recommendationPrompt,
            add_context_from_internet: false,
            response_json_schema: {
                type: "object",
                properties: {
                    primary_recommendation: {
                        type: "object",
                        properties: {
                            algorithm: { type: "string" },
                            backend: { type: "string" },
                            justification: { type: "string" },
                            estimated_qubits: { type: "number" }
                        }
                    },
                    performance_prediction: {
                        type: "object",
                        properties: {
                            expected_runtime_seconds: { type: "number" },
                            expected_quality_score: { type: "number" },
                            predicted_speedup: { type: "number" },
                            confidence_level: { type: "number" }
                        }
                    },
                    quantum_advantage: {
                        type: "object",
                        properties: {
                            probability_percent: { type: "number" },
                            advantage_type: { type: "string" },
                            breakeven_problem_size: { type: "string" },
                            classical_baseline_hours: { type: "number" }
                        }
                    },
                    resource_requirements: {
                        type: "object",
                        properties: {
                            estimated_cost_usd: { type: "number" },
                            coherence_time_requirement: { type: "string" },
                            gate_fidelity_requirement: { type: "number" }
                        }
                    },
                    risk_assessment: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                risk: { type: "string" },
                                mitigation: { type: "string" },
                                severity: { type: "string" }
                            }
                        }
                    },
                    alternatives: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                algorithm: { type: "string" },
                                backend: { type: "string" },
                                advantages: { type: "string" },
                                disadvantages: { type: "string" }
                            }
                        }
                    }
                }
            }
        });

        return Response.json({
            taskInput: { taskType, problemDescription, problemSize, desiredSolutionQuality },
            recommendation,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});