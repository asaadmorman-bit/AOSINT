import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      rule_name,
      threat_filters, // { threat_actors: [], sectors: [], severities: ['high', 'critical'], geographic: [] }
      target_channel_id,
      target_server_id,
      enabled = true
    } = await req.json();

    if (!rule_name || !target_channel_id || !threat_filters) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create alert rule in database
    const rule = await base44.asServiceRole.entities.AlertRule.create({
      name: rule_name,
      rule_type: 'discord_alert',
      filters: JSON.stringify(threat_filters),
      target_channel_id,
      target_server_id,
      enabled,
      created_by: user.email,
      created_date: new Date().toISOString()
    });

    return Response.json({
      success: true,
      rule_id: rule.id,
      rule_name: rule.name,
      filters: threat_filters,
      enabled,
      message: 'Alert rule created successfully. Threats matching these attributes will be sent to Discord.'
    });
  } catch (error) {
    console.error('Error creating alert rule:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});