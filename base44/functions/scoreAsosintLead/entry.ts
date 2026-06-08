import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadData, leadType } = await req.json();

    if (!leadData || !leadType) {
      return Response.json({ error: 'Missing lead data or type' }, { status: 400 });
    }

    // Build detailed prompt for AI lead scoring
    const scoringPrompt = buildScoringPrompt(leadData, leadType);

    // Use LLM to score the lead
    const scoreResult = await base44.integrations.Core.InvokeLLM({
      prompt: scoringPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          tier: {
            type: 'string',
            enum: ['hot', 'warm', 'cold'],
            description: 'Lead tier classification'
          },
          justification: {
            type: 'string',
            description: 'Detailed explanation for the score'
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            description: 'Confidence in the scoring (0-100)'
          }
        }
      }
    });

    return Response.json({
      success: true,
      tier: scoreResult.tier,
      justification: scoreResult.justification,
      confidence: scoreResult.confidence
    });
  } catch (error) {
    console.error('Error scoring lead:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildScoringPrompt(leadData, leadType) {
  return `You are an expert sales and intelligence analyst tasked with evaluating the business and operational value of a security threat intelligence lead.

LEAD INFORMATION:
Type: ${leadType}
Name: ${leadData.name || 'Unknown'}
Company/Organization: ${leadData.company || leadData.organization || 'N/A'}
Threat Level: ${leadData.threat_level || leadData.severity || 'Unknown'}
Description: ${leadData.description || 'N/A'}
Known Activities: ${Array.isArray(leadData.known_activities) ? leadData.known_activities.join(', ') : (leadData.known_activities || 'N/A')}
Geographic Focus: ${Array.isArray(leadData.geographic_focus) ? leadData.geographic_focus.join(', ') : (leadData.geographic_focus || 'N/A')}
Source Agency: ${leadData.source_agency || 'N/A'}
Aliases: ${Array.isArray(leadData.aliases) ? leadData.aliases.join(', ') : (leadData.aliases || 'N/A')}
Watch List Status: ${leadData.watch_list_status ? 'Yes' : 'No'}

SCORING CRITERIA:
You must evaluate this lead based on:
1. THREAT LEVEL: Critical and High threat levels are more valuable (hot candidates)
2. ENTITY TYPE: Threat actors and organizations often represent higher-value leads
3. GEOGRAPHIC FOCUS: Multiple regions or strategic areas increase value
4. ACTIVITY PATTERNS: Known criminal/terrorist activities indicate immediate relevance
5. WATCH LIST STATUS: Listed entities are higher priority
6. INTELLIGENCE FRESHNESS: Recent threats or updates increase urgency
7. FOLLOW-UP POTENTIAL: Ability to generate meaningful sales/intelligence engagement

CLASSIFICATION RULES:
- HOT: Critical threat level OR high threat + watch list status OR threat actor + multiple regions + known activities
- WARM: Medium threat level OR high threat without watch list + limited activities OR organization type with some relevance
- COLD: Low threat level OR limited available intelligence OR minimal follow-up potential

Provide a JSON response with:
1. tier: 'hot', 'warm', or 'cold'
2. justification: Explain the score in 1-2 sentences focused on sales/follow-up potential
3. confidence: Your confidence level (0-100) in this assessment`;
}