import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role === 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('hubspot');

    // Fetch recent contacts with notes/messages (inquiries)
    const contactsResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts?limit=100&archived=false',
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    if (!contactsResponse.ok) {
      throw new Error(`Failed to fetch HubSpot contacts: ${contactsResponse.statusText}`);
    }

    const { results: contacts } = await contactsResponse.json();
    let processedInquiries = 0;

    // Process each contact for inquiries
    for (const contact of contacts) {
      const contactId = contact.id;
      const email = contact.properties.email;
      const name = contact.properties.firstname + ' ' + contact.properties.lastname;
      const company = contact.properties.company;

      // Check if contact has recent notes (inquiries)
      const notesResponse = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?associations=notes`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );

      if (!notesResponse.ok) continue;

      const contactDetail = await notesResponse.json();
      const notes = contactDetail.associations?.notes?.results || [];

      // Process new notes as inquiries
      for (const noteAssoc of notes) {
        const noteId = noteAssoc.id;

        // Check if inquiry already exists
        const existing = await base44.entities.HubSpotInquiry.list(undefined, 1).catch(() => []);
        if (existing.some(i => i.hubspot_contact_id === contactId && i.inquiry_source === 'hubspot_note')) {
          continue;
        }

        // Create inquiry record
        const inquiry = await base44.entities.HubSpotInquiry.create({
          hubspot_contact_id: contactId,
          contact_email: email,
          contact_name: name,
          company_name: company,
          inquiry_type: 'general_inquiry',
          inquiry_subject: 'New contact message',
          inquiry_message: noteAssoc.message || 'Contact inquiry received',
          inquiry_source: 'hubspot_note',
          priority: 'medium',
          status: 'new',
          inquiry_received_at: new Date().toISOString(),
          tags: ['hubspot_sync']
        });

        // Generate AI response
        try {
          const response = await base44.integrations.Core.InvokeLLM({
            prompt: `You are a threat intelligence specialist responding to a customer inquiry. Generate a professional, helpful response.

Customer: ${name}
Company: ${company}
Email: ${email}
Inquiry: ${noteAssoc.message || 'Customer inquiry'}

Generate a brief, professional response (2-3 sentences) that acknowledges their inquiry and offers to help with threat intelligence needs.`,
            add_context_from_internet: false
          });

          // Update inquiry with generated response
          await base44.entities.HubSpotInquiry.update(inquiry.id, {
            generated_response: response,
            ai_response_generated: true,
            status: 'responded'
          });

          // Send response via HubSpot
          await sendHubSpotMessage(accessToken, contactId, response);
          processedInquiries++;
        } catch (e) {
          console.log('AI response generation failed:', e.message);
        }
      }
    }

    return Response.json({
      success: true,
      inquiries_processed: processedInquiries,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error monitoring HubSpot inquiries:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function sendHubSpotMessage(accessToken, contactId, message) {
  // Create engagement (note) with the response
  const noteData = {
    associations: [
      {
        types: [{ associationCategory: 'HUBSPOT_DEFINED', associationType: 'contact_to_note' }],
        id: contactId
      }
    ],
    properties: {
      hs_note_body: message,
      hs_internal_note_body: 'Auto-generated response from threat intelligence system'
    }
  };

  const response = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(noteData)
  });

  if (!response.ok) {
    console.error('Failed to send HubSpot message:', response.statusText);
  }

  return response.ok;
}