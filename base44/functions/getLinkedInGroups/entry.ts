import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('linkedin');

    // Fetch user's group memberships
    const groupsRes = await fetch('https://api.linkedin.com/v2/me/groupMemberships?q=state&state=JOINED&projection=(*,group:(id,name,description,memberCount))', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const groupsData = groupsRes.ok ? await groupsRes.json() : { elements: [] };
    const groups = (groupsData.elements || []).map(el => ({
      id: el.group?.id,
      name: el.group?.name || 'Unknown Group',
      description: el.group?.description || '',
      memberCount: el.group?.memberCount || 0,
      type: 'group'
    })).filter(g => g.id);

    // Fetch user's organizations/companies
    const orgsRes = await fetch('https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&projection=(*,organization:(id,name,primaryWebsiteUrl,logoUrl))', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const orgsData = orgsRes.ok ? await orgsRes.json() : { elements: [] };
    const organizations = (orgsData.elements || []).map(el => ({
      id: el.organization?.id,
      name: el.organization?.name || 'Unknown Org',
      url: el.organization?.primaryWebsiteUrl || '',
      logo: el.organization?.logoUrl || '',
      type: 'organization'
    })).filter(o => o.id);

    return Response.json({ groups, organizations });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});