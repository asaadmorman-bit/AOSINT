import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch DARPA benchmark data
        const benchmarks = await base44.entities.DARPAQuantumBenchmark.list();
        const comparisons = await base44.entities.QuantumPerformanceComparison.list();
        const jobs = await base44.entities.QuantumOrchestrationJob.list();

        // Filter for cryptanalysis and network optimization
        const relevantBenchmarks = benchmarks.filter(b => 
            benchmarks.some(bench => bench.orchestration_job_id && 
                jobs.some(j => j.id === bench.orchestration_job_id && 
                    ['cryptanalysis', 'network_optimization'].includes(j.algorithm_type)
                )
            )
        );

        const relevantComparisons = comparisons.filter(c =>
            jobs.some(j => j.id === c.orchestration_job_id && 
                ['cryptanalysis', 'network_optimization'].includes(j.algorithm_type)
            )
        );

        // Prepare data summary for analysis
        const dataSummary = {
            totalBenchmarks: relevantBenchmarks.length,
            cryptanalysisBenchmarks: relevantBenchmarks.filter(b => b.benchmark_name?.includes('cryptanalysis')).length,
            networkOptBenchmarks: relevantBenchmarks.filter(b => b.benchmark_name?.includes('network')).length,
            comparisons: relevantComparisons.map(c => ({
                speedup: c.speedup_factor,
                quality: c.quantum_solution_quality,
                advantage: c.advantage_achieved,
                cost: c.total_cost_quantum_usd
            })),
            avgSpeedup: relevantComparisons.length > 0 
                ? (relevantComparisons.reduce((sum, c) => sum + (c.speedup_factor || 0), 0) / relevantComparisons.length).toFixed(2)
                : 0,
            advantageRate: relevantComparisons.length > 0
                ? ((relevantComparisons.filter(c => c.advantage_achieved).length / relevantComparisons.length) * 100).toFixed(1)
                : 0
        };

        // Use LLM to analyze quantum benchmark trends and scalability
        const analysisResponse = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze these DARPA quantum benchmark results and provide insights:

${JSON.stringify(dataSummary, null, 2)}

Please provide:
1. Performance trend analysis: Identify upward/downward trends in quantum advantage
2. Scalability prediction: Project performance at 2x and 4x problem size based on current curves
3. Comparative analysis: Compare quantum vs classical performance for cryptanalysis and network optimization
4. Critical insights: Identify any bottlenecks or exceptional performance patterns
5. Recommendations: Suggest next steps for achieving quantum advantage

Format the response with clear sections and quantitative projections where possible.`,
            add_context_from_internet: false,
            response_json_schema: {
                type: "object",
                properties: {
                    trend_analysis: {
                        type: "object",
                        properties: {
                            overall_trend: { type: "string" },
                            cryptanalysis_trend: { type: "string" },
                            network_opt_trend: { type: "string" },
                            trend_confidence: { type: "number" }
                        }
                    },
                    scalability_predictions: {
                        type: "object",
                        properties: {
                            "2x_problem_size": { type: "string" },
                            "4x_problem_size": { type: "string" },
                            predicted_critical_size: { type: "string" },
                            prediction_uncertainty: { type: "string" }
                        }
                    },
                    comparative_analysis: {
                        type: "object",
                        properties: {
                            quantum_advantage_gap: { type: "string" },
                            cryptanalysis_performance: { type: "string" },
                            network_optimization_performance: { type: "string" },
                            cost_efficiency_verdict: { type: "string" }
                        }
                    },
                    critical_insights: {
                        type: "array",
                        items: { type: "string" }
                    },
                    recommendations: {
                        type: "array",
                        items: { type: "string" }
                    }
                }
            }
        });

        return Response.json({
            summary: dataSummary,
            analysis: analysisResponse,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});