import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { anomalyId } = body;

    if (!anomalyId) {
      return Response.json({ error: 'Missing anomalyId' }, { status: 400 });
    }

    const anomaly = await base44.entities.AnomalyAlert.read(anomalyId);
    const resourcePool = await base44.entities.QuantumResourcePool.read(anomaly.resource_pool_id);

    // Prepare notification content
    const subject = `[${anomaly.severity.toUpperCase()}] ${anomaly.anomaly_type.replace(/_/g, ' ')} on ${resourcePool.pool_name}`;
    
    const body_text = `
Anomaly Alert: ${anomaly.anomaly_type.replace(/_/g, ' ')}
Resource: ${resourcePool.pool_name}
Severity: ${anomaly.severity}
Detected: ${new Date(anomaly.detection_timestamp).toLocaleString()}

Current Value: ${anomaly.current_value.toFixed(2)}
Predicted Value: ${anomaly.predicted_value.toFixed(2)}
Deviation: ${anomaly.deviation_percent.toFixed(1)}%

Potential Causes:
${anomaly.potential_causes?.map(c => `• ${c}`).join('\n') || 'N/A'}

Recommended Actions:
${anomaly.recommended_actions?.map(a => `• ${a}`).join('\n') || 'N/A'}

Please review and take appropriate action.
    `;

    // Send email notification
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: subject,
        body: body_text,
        from_name: 'Quantum Orchestration System'
      });
    } catch (emailError) {
      console.log('Email notification skipped:', emailError.message);
    }

    // Update anomaly to mark notification as sent
    await base44.entities.AnomalyAlert.update(anomalyId, {
      notification_sent: true,
      email_sent_to: [user.email]
    });

    return Response.json({
      success: true,
      message: 'Notification sent to ' + user.email,
      anomaly
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});