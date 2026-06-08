import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siemConfigId, dataType, payload } = await req.json();

    if (!siemConfigId || !dataType || !payload) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch SIEM configuration
    const configs = await base44.entities.SIEMConfiguration.list(undefined, 1).catch(() => []);
    const config = configs.find(c => c.id === siemConfigId);

    if (!config) {
      return Response.json({ error: 'SIEM configuration not found' }, { status: 404 });
    }

    if (!config.is_enabled) {
      return Response.json({ error: 'SIEM connection is disabled' }, { status: 403 });
    }

    // Get API key from secrets
    const apiKey = Deno.env.get(`SIEM_${config.siem_type.toUpperCase()}_API_KEY`);
    if (!apiKey) {
      return Response.json({ error: 'SIEM API key not configured' }, { status: 500 });
    }

    // Format payload based on SIEM type
    const formattedPayload = formatPayloadBySIEMType(config.siem_type, dataType, payload);

    // Determine endpoint based on data type
    const endpoint = getEndpointForDataType(config, dataType);

    // Send to SIEM
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formattedPayload)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SIEM API error:', error);
      
      // Update SIEM config status
      await base44.entities.SIEMConfiguration.update(siemConfigId, {
        sync_status: 'error',
        status_message: `Failed to send ${dataType}: ${response.statusText}`
      });

      return Response.json(
        { error: `Failed to send to SIEM: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Update SIEM config status
    await base44.entities.SIEMConfiguration.update(siemConfigId, {
      sync_status: 'healthy',
      last_sync: new Date().toISOString(),
      status_message: 'Successfully synced'
    });

    return Response.json({
      success: true,
      message: `${dataType} sent to SIEM`,
      siem_type: config.siem_type
    });
  } catch (error) {
    console.error('Error sending to SIEM:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function formatPayloadBySIEMType(siemType, dataType, payload) {
  switch (siemType) {
    case 'splunk':
      return {
        event: payload,
        source: 'asosint',
        sourcetype: dataType,
        host: 'asosint-platform'
      };
    case 'elastic':
      return {
        '@timestamp': new Date().toISOString(),
        source: 'asosint',
        event: {
          kind: dataType,
          ...payload
        }
      };
    case 'qradar':
      return {
        payload: JSON.stringify(payload),
        source_ip: payload.source_ip || '0.0.0.0',
        event_name: dataType
      };
    case 'microsoft_sentinel':
      return {
        TimeGenerated: new Date().toISOString(),
        SourceSystem: 'ASOSINT',
        EventType: dataType,
        ...payload
      };
    case 'sumo_logic':
      return {
        timestamp: new Date().getTime(),
        source: 'asosint',
        sourceCategory: dataType,
        data: payload
      };
    default:
      return payload;
  }
}

function getEndpointForDataType(config, dataType) {
  const baseUrl = config.endpoint_url.replace(/\/$/, '');
  const indexName = dataType === 'threat_intelligence' ? config.threat_intel_index : config.event_index;

  switch (config.siem_type) {
    case 'splunk':
      return `${baseUrl}/services/collector`;
    case 'elastic':
      return `${baseUrl}/${indexName || 'asosint-events'}/_doc`;
    case 'qradar':
      return `${baseUrl}/api/siem/events`;
    case 'microsoft_sentinel':
      return `${baseUrl}/api/logs`;
    case 'sumo_logic':
      return `${baseUrl}/receiver/v1/http`;
    default:
      return `${baseUrl}/events`;
  }
}