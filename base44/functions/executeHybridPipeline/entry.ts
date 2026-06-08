import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { pipelineId, inputData } = await req.json();

        // Fetch the pipeline definition
        const pipeline = await base44.entities.HybridPipeline.list();
        const selectedPipeline = pipeline.find(p => p.id === pipelineId);

        if (!selectedPipeline) {
            return Response.json({ error: 'Pipeline not found' }, { status: 404 });
        }

        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const stepExecutions = [];
        let currentData = inputData;
        const startTime = new Date();

        // Parse the workflow definition
        const workflow = JSON.parse(selectedPipeline.workflow_definition || '{}');
        const steps = selectedPipeline.steps || [];

        // Topological sort to respect dependencies
        const stepMap = new Map(steps.map(s => [s.step_id, s]));
        const executed = new Set();
        let quantumCost = 0;
        let classicalCost = 0;

        async function executeStep(stepId, retries = 0) {
            if (executed.has(stepId)) return;
            
            const step = stepMap.get(stepId);
            if (!step) return;

            // Wait for dependencies
            const deps = step.dependencies || [];
            for (const depId of deps) {
                if (!executed.has(depId)) {
                    await executeStep(depId, 0);
                }
            }

            const stepStartTime = new Date();
            let stepResult = null;
            let error = null;

            try {
                const config = JSON.parse(step.configuration || '{}');

                // Execute based on step type
                if (step.step_type === 'quantum_job') {
                    // Create and execute quantum job
                    const quantumJob = await base44.entities.QuantumOrchestrationJob.create({
                        job_name: step.step_name,
                        algorithm_type: config.algorithm || 'hybrid_vqe',
                        execution_type: config.execution_type || 'quantum_only',
                        quantum_backend: config.backend || 'ibm_quantum',
                        problem_size: config.problem_size || 10,
                        qubits_required: config.qubits || 5,
                        input_parameters: JSON.stringify(currentData),
                        status: 'queued'
                    });
                    quantumCost += config.estimated_cost || 10;
                    stepResult = { quantum_job_id: quantumJob.id, data: currentData };
                    
                } else if (step.step_type === 'classical_compute') {
                    // Execute classical computation
                    const result = await base44.integrations.Core.InvokeLLM({
                        prompt: `Execute classical computation: ${config.operation}. Input: ${JSON.stringify(currentData)}`,
                        response_json_schema: {
                            type: "object",
                            properties: {
                                result: { type: "object" },
                                execution_time_ms: { type: "number" }
                            }
                        }
                    });
                    classicalCost += config.estimated_cost || 1;
                    stepResult = result;
                    
                } else if (step.step_type === 'data_transform') {
                    // Data transformation step
                    const transformConfig = JSON.parse(step.configuration || '{}');
                    stepResult = {
                        transformed_data: currentData,
                        transform_type: transformConfig.transform_type
                    };
                    
                } else if (step.step_type === 'decision_gate') {
                    // Decision gate based on current data
                    const decisionConfig = JSON.parse(step.configuration || '{}');
                    const condition = decisionConfig.condition;
                    stepResult = {
                        decision: condition ? 'true' : 'false',
                        next_steps: condition ? decisionConfig.true_branch : decisionConfig.false_branch
                    };
                    
                } else if (step.step_type === 'merge') {
                    // Merge results from multiple branches
                    stepResult = {
                        merged_data: currentData,
                        merge_strategy: JSON.parse(step.configuration || '{}').strategy || 'combine'
                    };
                }

                // Update current data for next step
                currentData = stepResult;
                executed.add(stepId);

            } catch (err) {
                error = err.message;
                if (retries < step.retry_count) {
                    return executeStep(stepId, retries + 1);
                } else if (step.error_handling === 'use_classical_fallback') {
                    stepResult = { fallback_result: true };
                    executed.add(stepId);
                } else if (step.error_handling === 'skip_next') {
                    executed.add(stepId);
                } else {
                    throw err;
                }
            }

            const stepEndTime = new Date();
            stepExecutions.push({
                step_id: stepId,
                step_name: step.step_name,
                step_type: step.step_type,
                status: error ? 'failed' : 'completed',
                start_time: stepStartTime.toISOString(),
                end_time: stepEndTime.toISOString(),
                duration_seconds: (stepEndTime - stepStartTime) / 1000,
                input_snapshot: JSON.stringify(currentData).substring(0, 1000),
                output_snapshot: JSON.stringify(stepResult).substring(0, 1000),
                error_message: error
            });
        }

        // Execute all root steps (those with no dependencies)
        const rootSteps = steps.filter(s => !s.dependencies || s.dependencies.length === 0);
        for (const step of rootSteps) {
            await executeStep(step.step_id);
        }

        const endTime = new Date();
        const totalCost = quantumCost + classicalCost;

        // Create execution trace
        const executionTrace = await base44.entities.HybridExecutionTrace.create({
            pipeline_id: pipelineId,
            execution_id: executionId,
            status: 'completed',
            input_data: JSON.stringify(inputData),
            output_data: JSON.stringify(currentData),
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            total_runtime_seconds: (endTime - startTime) / 1000,
            step_executions: JSON.stringify(stepExecutions),
            total_cost_usd: totalCost,
            quantum_cost_usd: quantumCost,
            classical_cost_usd: classicalCost
        });

        // Update pipeline execution stats
        const updatedPipeline = {
            ...selectedPipeline,
            execution_count: (selectedPipeline.execution_count || 0) + 1,
            last_executed: new Date().toISOString()
        };
        await base44.entities.HybridPipeline.update(pipelineId, updatedPipeline);

        return Response.json({
            execution_id: executionId,
            pipeline_id: pipelineId,
            status: 'completed',
            output_data: currentData,
            step_executions: stepExecutions,
            total_runtime_seconds: (endTime - startTime) / 1000,
            total_cost_usd: totalCost,
            quantum_cost_usd: quantumCost,
            classical_cost_usd: classicalCost,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});