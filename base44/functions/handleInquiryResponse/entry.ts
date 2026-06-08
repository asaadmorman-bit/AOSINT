import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { inquiryId, response, status } = await req.json();

    if (!inquiryId || !response) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the inquiry in HubSpot
    const updated = await base44.asServiceRole.entities.HubSpotInquiry.update(inquiryId, {
      ai_response_generated: true,
      generated_response: response,
      response_sent: true,
      response_sent_at: new Date().toISOString(),
      status: status || 'responded',
    });

    return Response.json({ success: true, updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});