import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get HubSpot access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('hubspot');

    // Fetch all tracked deals from ASOSINT
    const trackedDeals = await base44.entities.HubSpotThreatDeal.list(undefined, 500).catch(() => []);

    if (trackedDeals.length === 0) {
      return Response.json({ success: true, updated_count: 0, message: 'No deals to sync' });
    }

    let updatedCount = 0;
    let failedCount = 0;

    // Sync each deal with HubSpot
    for (const deal of trackedDeals) {
      try {
        // Fetch deal details from HubSpot
        const response = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${deal.hubspot_deal_id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error(`Failed to fetch deal ${deal.hubspot_deal_id}`);
          failedCount++;
          continue;
        }

        const hubspotDeal = await response.json();
        const properties = hubspotDeal.properties;

        // Update ASOSINT deal record with latest HubSpot data
        await base44.entities.HubSpotThreatDeal.update(deal.id, {
          deal_stage: properties.dealstage,
          deal_amount: properties.amount ? parseFloat(properties.amount) : deal.deal_amount,
          follow_up_required: properties.dealstage !== 'won' && properties.dealstage !== 'lost',
          follow_up_notes: properties.notes,
          last_activity: new Date().toISOString(),
          status: mapDealStatus(properties.dealstage)
        });

        updatedCount++;
      } catch (error) {
        console.error('Error syncing deal:', error);
        failedCount++;
      }
    }

    return Response.json({
      success: true,
      updated_count: updatedCount,
      failed_count: failedCount,
      total_synced: trackedDeals.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error syncing HubSpot deals:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function mapDealStatus(dealStage) {
  const stageMap = {
    'won': 'won',
    'lost': 'lost',
    'negotiation': 'created',
    'presentation_scheduled': 'created',
    'qualified_to_buy': 'created',
    'decision_pending': 'created'
  };
  return stageMap[dealStage] || 'created';
}