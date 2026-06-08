import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threatId, threatType, threatData } = await req.json();

    if (!threatId || !threatType || !threatData) {
      return Response.json({ error: 'Missing required threat data' }, { status: 400 });
    }

    // Get HubSpot access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('hubspot');

    // Prepare deal data
    const dealData = {
      properties: {
        dealname: threatData.title || threatData.name || 'Threat Investigation',
        dealstage: 'negotiation',
        description: formatThreatDescription(threatData, threatType),
        amount: calculateDealAmount(threatData.severity || 'medium'),
        priority: mapThreatToPriority(threatData.severity),
        pipeline: 'default',
        hubspot_owner_id: null, // Will be assigned based on routing
        closedate: getFollowUpDate(),
        custom_threat_id: threatId,
        custom_threat_type: threatType,
        custom_threat_severity: threatData.severity || 'medium'
      }
    };

    // Create deal in HubSpot
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dealData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('HubSpot API error:', error);
      return Response.json(
        { error: `Failed to create deal: ${response.statusText}` },
        { status: response.status }
      );
    }

    const deal = await response.json();

    // Store deal tracking in ASOSINT
    const dealRecord = await base44.entities.HubSpotThreatDeal.create({
      threat_id: threatId,
      threat_type: threatType,
      threat_title: threatData.title || threatData.name || 'Threat',
      threat_severity: threatData.severity || 'medium',
      hubspot_deal_id: deal.id,
      hubspot_deal_url: `https://app.hubapi.com/crm/deals/${deal.id}`,
      deal_name: dealData.properties.dealname,
      deal_stage: 'negotiation',
      deal_amount: dealData.properties.amount,
      follow_up_required: true,
      synced_at: new Date().toISOString(),
      status: 'created',
      tags: ['auto_created', threatType]
    });

    // Generate AI forecast for the deal
    try {
      await base44.functions.invoke('forecastDealOutcome', {
        dealId: dealRecord.id,
        dealData: {
          hubspot_deal_id: deal.id,
          deal_name: dealData.properties.dealname,
          threat_title: threatData.title || threatData.name || 'Threat',
          threat_severity: threatData.severity || 'medium',
          deal_stage: 'negotiation',
          deal_amount: dealData.properties.amount,
          associated_contact_company: threatData.organization,
          last_activity: new Date().toISOString()
        }
      });
    } catch (forecastError) {
      console.warn('Deal forecasting failed, continuing without forecast:', forecastError.message);
    }

    return Response.json({
      success: true,
      deal_id: deal.id,
      deal_url: dealRecord.hubspot_deal_url,
      tracking_id: dealRecord.id
    });
  } catch (error) {
    console.error('Error creating HubSpot deal:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function formatThreatDescription(threatData, threatType) {
  let desc = `Threat Type: ${threatType}\n`;
  if (threatData.description) desc += `Description: ${threatData.description}\n`;
  if (threatData.severity) desc += `Severity: ${threatData.severity}\n`;
  if (threatData.source_agency) desc += `Source: ${threatData.source_agency}\n`;
  if (threatData.geographic_focus) desc += `Geographic Focus: ${threatData.geographic_focus.join(', ')}\n`;
  return desc;
}

function mapThreatToPriority(severity) {
  const severityMap = {
    critical: 'HIGH',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW'
  };
  return severityMap[severity] || 'MEDIUM';
}

function calculateDealAmount(severity) {
  const amountMap = {
    critical: 50000,
    high: 35000,
    medium: 20000,
    low: 10000
  };
  return amountMap[severity] || 20000;
}

function getFollowUpDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14); // 14-day follow-up
  return date.toISOString().split('T')[0];
}