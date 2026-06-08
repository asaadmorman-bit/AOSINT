import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siemConfigId, timeRange = 24 } = await req.json();

    if (!siemConfigId) {
      return Response.json({ error: 'SIEM config ID required' }, { status: 400 });
    }

    // Fetch SIEM configuration
    const configs = await base44.entities.SIEMConfiguration.list(undefined, 1).catch(() => []);
    const config = configs.find(c => c.id === siemConfigId);

    if (!config) {
      return Response.json({ error: 'SIEM configuration not found' }, { status: 404 });
    }

    if (!config.is_enabled || !config.ingest_siem_alerts) {
      return Response.json({ error: 'SIEM ingestion is disabled' }, { status: 403 });
    }

    // Get API key
    const apiKey = Deno.env.get(`SIEM_${config.siem_type.toUpperCase()}_API_KEY`);
    if (!apiKey) {
      return Response.json({ error: 'SIEM API key not configured' }, { status: 500 });
    }

    // Fetch alerts from SIEM based on type
    const alerts = await fetchAlertsFromSIEM(config, apiKey, timeRange);

    if (!alerts || alerts.length === 0) {
      return Response.json({ success: true, ingested_count: 0 });
    }

    // Enrich and ingest alerts
    const ingestedAlerts = [];
    for (const alert of alerts) {
      try {
        const mappedAlert = mapSIEMAlertToASOS INT(alert, config);

        // Check for correlation with existing ASOSINT alerts
        const correlatedAlerts = await findCorrelatedAlerts(base44, mappedAlert);

        const ingestionRecord = await base44.entities.SIEMAlertIngestion.create({
          ...mappedAlert,
          correlated_asosint_alerts: correlatedAlerts,
          raw_event: JSON.stringify(alert),
          ingestion_timestamp: new Date().toISOString(),
          tags: ['auto_ingested', config.siem_type]
        });

        // Perform AI-driven correlation analysis
        try {
          await base44.functions.invoke('analyzeAlertCorrelation', {
            siemAlertId: ingestionRecord.id,
            siemAlertData: mappedAlert
          });
        } catch (e) {
          console.log('Correlation analysis skipped:', e.message);
        }

        ingestedAlerts.push(ingestionRecord);
      } catch (error) {
        console.error('Error ingesting alert:', error);
      }
    }

    // Update SIEM config status
    await base44.entities.SIEMConfiguration.update(siemConfigId, {
      sync_status: 'healthy',
      last_sync: new Date().toISOString(),
      status_message: `Ingested ${ingestedAlerts.length} alerts`
    });

    return Response.json({
      success: true,
      ingested_count: ingestedAlerts.length,
      siem_type: config.siem_type
    });
  } catch (error) {
    console.error('Error ingesting from SIEM:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function fetchAlertsFromSIEM(config, apiKey, timeRange) {
  const startTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);
  const query = buildQueryBySIEMType(config.siem_type, startTime);

  const response = await fetch(config.endpoint_url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(query)
  });

  if (!response.ok) {
    throw new Error(`SIEM query failed: ${response.statusText}`);
  }

  const data = await response.json();
  return parseResponseBySIEMType(config.siem_type, data);
}

function buildQueryBySIEMType(siemType, startTime) {
  const isoTime = startTime.toISOString();

  switch (siemType) {
    case 'splunk':
      return {
        search: `earliest=${isoTime} index=${Deno.env.get('SPLUNK_INDEX') || 'main'} severity>=high`,
        output_mode: 'json',
        count: 100
      };
    case 'elastic':
      return {
        query: {
          bool: {
            must: [
              { range: { '@timestamp': { gte: isoTime } } },
              { range: { severity: { gte: 'high' } } }
            ]
          }
        },
        size: 100
      };
    case 'qradar':
      return {
        filter: `startTime > ${startTime.getTime()}`,
        fields: 'all'
      };
    default:
      return {
        time_range: { start: isoTime },
        limit: 100
      };
  }
}

function parseResponseBySIEMType(siemType, data) {
  switch (siemType) {
    case 'splunk':
      return data.results || [];
    case 'elastic':
      return data.hits?.hits?.map(h => h._source) || [];
    case 'qradar':
      return data.events || [];
    default:
      return Array.isArray(data) ? data : [];
  }
}

function mapSIEMAlertToASOS INT(alert, config) {
  return {
    siem_config_id: config.id,
    siem_alert_id: alert.alert_id || alert.id || alert._id,
    siem_type: config.siem_type,
    title: alert.title || alert.alert_name || alert.name || 'Unnamed Alert',
    description: alert.description || alert.message || '',
    severity: normalizeSeverity(alert.severity),
    alert_type: alert.alert_type || alert.event_type || 'unknown',
    source_ip: alert.source_ip || alert.src || alert.src_ip,
    destination_ip: alert.destination_ip || alert.dest || alert.dest_ip,
    hostname: alert.hostname || alert.host || alert.dest_hostname,
    user: alert.user || alert.username || alert.src_user,
    indicators: extractIndicators(alert),
    asosint_priority_level: 'medium'
  };
}

function normalizeSeverity(severity) {
  if (!severity) return 'medium';
  const normalizedSeverity = severity.toString().toLowerCase();
  if (normalizedSeverity.includes('critical') || normalizedSeverity === '4') return 'critical';
  if (normalizedSeverity.includes('high') || normalizedSeverity === '3') return 'high';
  if (normalizedSeverity.includes('medium') || normalizedSeverity === '2') return 'medium';
  return 'low';
}

function extractIndicators(alert) {
  const indicators = [];

  if (alert.source_ip || alert.src || alert.src_ip) {
    indicators.push({ type: 'ip', value: alert.source_ip || alert.src || alert.src_ip });
  }
  if (alert.destination_ip || alert.dest || alert.dest_ip) {
    indicators.push({ type: 'ip', value: alert.destination_ip || alert.dest || alert.dest_ip });
  }
  if (alert.domain) {
    indicators.push({ type: 'domain', value: alert.domain });
  }
  if (alert.url) {
    indicators.push({ type: 'url', value: alert.url });
  }
  if (alert.file_hash) {
    indicators.push({ type: 'hash', value: alert.file_hash });
  }

  return indicators;
}

async function findCorrelatedAlerts(base44, mappedAlert) {
  const correlated = [];

  // Search for correlated OSINT alerts
  try {
    const osintAlerts = await base44.entities.OsintAlert.list(undefined, 100).catch(() => []);
    osintAlerts.forEach(alert => {
      if (mappedAlert.indicators?.some(ind => 
        alert.title?.includes(ind.value) || alert.description?.includes(ind.value)
      )) {
        correlated.push(alert.id);
      }
    });
  } catch (e) {
    console.log('Could not search OSINT alerts');
  }

  return correlated;
}