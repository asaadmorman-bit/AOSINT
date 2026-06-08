import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { algorithmType, useCase, executionType, quantumBackend, problemSize, priority } = await req.json();

    if (!algorithmType || !executionType) {
      return Response.json({ error: 'algorithmType and executionType required' }, { status: 400 });
    }

    // Create orchestration job
    const jobId = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Estimate qubits and runtime based on problem size
    const qubitEstimate = Math.min(Math.ceil(Math.log2(problemSize || 1000)) * 10, 5000);
    const runtimeEstimate = problemSize ? Math.ceil(Math.log2(problemSize) * 5) : 30;

    const job = await base44.entities.QuantumOrchestrationJob.create({
      job_name: `${algorithmType.replace(/_/g, " ")} - ${useCase}`,
      job_id: jobId,
      algorithm_type: algorithmType,
      use_case: useCase,
      execution_type: executionType,
      quantum_backend: quantumBackend || 'simulator',
      problem_size: problemSize || 1000,
      qubits_required: qubitEstimate,
      estimated_runtime_seconds: runtimeEstimate,
      priority: priority || 'normal',
      status: 'queued',
      queue_position: Math.floor(Math.random() * 5) + 1,
      submission_time: new Date().toISOString(),
      input_parameters: JSON.stringify({
        algorithm: algorithmType,
        problem_size: problemSize,
        use_case: useCase
      })
    });

    // Check available resource pools
    const pools = await base44.entities.QuantumResourcePool.list();
    const suitablePool = pools.find(p => 
      p.available_qubits >= qubitEstimate && 
      p.status === 'available'
    );

    let resourceAllocation = {
      allocated_pool: suitablePool ? suitablePool.id : 'queued_for_next_available',
      estimated_wait_minutes: suitablePool ? suitablePool.estimated_queue_wait_minutes || 5 : 30,
      recommended_backend: suitablePool ? suitablePool.pool_name : 'simulator_fallback',
      qubits_allocated: suitablePool ? Math.min(qubitEstimate, suitablePool.available_qubits) : 0
    };

    // Update job with resource allocation
    await base44.entities.QuantumOrchestrationJob.update(job.id, {
      resource_allocation: JSON.stringify(resourceAllocation),
      status: suitablePool ? 'running' : 'queued',
      start_time: suitablePool ? new Date().toISOString() : null
    });

    return Response.json({
      success: true,
      job_id: jobId,
      orchestration_id: job.id,
      status: suitablePool ? 'executing' : 'queued',
      resource_allocation: resourceAllocation,
      estimated_completion: new Date(Date.now() + (runtimeEstimate + resourceAllocation.estimated_wait_minutes * 60) * 1000).toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});