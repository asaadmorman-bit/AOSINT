import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId, leadType, leadData } = await req.json();

    if (!leadId || !leadType || !leadData) {
      return Response.json({ error: 'Missing required lead data' }, { status: 400 });
    }

    // Check if contact already exists
    const existingSync = await base44.entities.HubSpotLeadSync.list(undefined, 100).catch(() => []);
    if (existingSync.some(s => s.asosint_lead_id === leadId)) {
      return Response.json({ 
        error: 'Lead already synced', 
        lead_id: leadId 
      }, { status: 409 });
    }

    // Score the lead using AI
    let aiScore = { tier: 'unscored', justification: 'Scoring not performed', confidence: 0 };
    try {
      const scoreResponse = await base44.functions.invoke('scoreAsosintLead', {
        leadData,
        leadType
      });
      aiScore = scoreResponse.data;
    } catch (scoreError) {
      console.warn('Lead scoring failed, proceeding without AI score:', scoreError.message);
    }

    // Get HubSpot access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('hubspot');

    // Extract contact properties from lead data
    const contactProperties = extractContactProperties(leadData, leadType);

    // Create contact in HubSpot
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties: contactProperties })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('HubSpot API error:', error);
      
      // Log failed sync
      await base44.entities.HubSpotLeadSync.create({
        asosint_lead_id: leadId,
        lead_type: leadType,
        lead_name: leadData.name || 'Unknown',
        hubspot_contact_id: 'failed',
        status: 'failed',
        synced_at: new Date().toISOString(),
        tags: ['sync_failed']
      }).catch(() => {});

      return Response.json(
        { error: `Failed to create contact: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contact = await response.json();

    // Store sync mapping with AI score
    const syncRecord = await base44.entities.HubSpotLeadSync.create({
      asosint_lead_id: leadId,
      lead_type: leadType,
      lead_name: contactProperties.firstname ? `${contactProperties.firstname} ${contactProperties.lastname || ''}`.trim() : 'Unknown',
      lead_email: contactProperties.email,
      lead_phone: contactProperties.phone,
      lead_company: contactProperties.company,
      lead_description: contactProperties.notes,
      hubspot_contact_id: contact.id,
      hubspot_contact_url: `https://app.hubapi.com/crm/contacts/${contact.id}`,
      threat_level: leadData.threat_level || leadData.severity,
      ai_lead_tier: aiScore.tier,
      ai_score_justification: aiScore.justification,
      associated_properties: Object.entries(contactProperties).map(([k, v]) => ({
        property_name: k,
        property_value: String(v)
      })),
      synced_at: new Date().toISOString(),
      status: 'synced',
      tags: ['auto_synced', leadType, `tier_${aiScore.tier}`]
    });

    return Response.json({
      success: true,
      contact_id: contact.id,
      contact_url: syncRecord.hubspot_contact_url,
      sync_id: syncRecord.id
    });
  } catch (error) {
    console.error('Error creating HubSpot contact:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function extractContactProperties(leadData, leadType) {
  const properties = {
    email: leadData.email || null,
    phone: leadData.phone || null,
    company: leadData.company || leadData.organization || null,
    notes: formatLeadNotes(leadData, leadType),
    lifecyclestage: 'lead',
    source: `asosint_${leadType}`,
    hs_lead_status: 'NEW'
  };

  // Map name based on lead type
  if (leadType === 'person' && leadData.name) {
    const nameParts = leadData.name.split(' ');
    properties.firstname = nameParts[0];
    properties.lastname = nameParts.slice(1).join(' ') || null;
  } else if (leadData.name) {
    properties.firstname = leadData.name;
  }

  // Add threat level if available
  if (leadData.threat_level || leadData.severity) {
    properties.custom_threat_level = leadData.threat_level || leadData.severity;
  }

  // Add custom fields for OSINT context
  if (leadData.aliases) {
    properties.custom_aliases = Array.isArray(leadData.aliases) ? leadData.aliases.join(', ') : leadData.aliases;
  }

  if (leadData.description) {
    properties.notes = leadData.description;
  }

  return Object.fromEntries(Object.entries(properties).filter(([, v]) => v !== null));
}

function formatLeadNotes(leadData, leadType) {
  let notes = `ASOSINT Lead Source: ${leadType}\n`;
  
  if (leadData.description) {
    notes += `Description: ${leadData.description}\n`;
  }

  if (leadData.known_activities) {
    const activities = Array.isArray(leadData.known_activities) ? leadData.known_activities.join(', ') : leadData.known_activities;
    notes += `Activities: ${activities}\n`;
  }

  if (leadData.geographic_focus) {
    const regions = Array.isArray(leadData.geographic_focus) ? leadData.geographic_focus.join(', ') : leadData.geographic_focus;
    notes += `Geographic Focus: ${regions}\n`;
  }

  if (leadData.threat_level || leadData.severity) {
    notes += `Threat Level: ${leadData.threat_level || leadData.severity}\n`;
  }

  if (leadData.source_agency) {
    notes += `Source Agency: ${leadData.source_agency}\n`;
  }

  return notes.trim();
}