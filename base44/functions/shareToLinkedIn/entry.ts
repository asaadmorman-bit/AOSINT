import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { content, groupIds = [], organizationIds = [], postToFeed = true } = await req.json();
    if (!content) return Response.json({ error: 'content is required' }, { status: 400 });
    if (!postToFeed && (!groupIds || groupIds.length === 0) && (!organizationIds || organizationIds.length === 0)) {
      return Response.json({ error: 'Must post to feed, select groups, or select organizations' }, { status: 400 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('linkedin');

    // Get the LinkedIn member profile (sub = person URN)
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await profileRes.json();
    const personUrn = `urn:li:person:${profile.sub}`;

    const results = { feed: null, groups: [], organizations: [] };

    // Post to personal feed if enabled
    if (postToFeed) {
      const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author: personUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: content },
              shareMediaCategory: 'NONE',
            }
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
        })
      });

      if (!postRes.ok) {
        const err = await postRes.text();
        return Response.json({ error: `LinkedIn feed post error: ${err}` }, { status: 500 });
      }
      results.feed = true;
    }

    // Post to groups if selected
    for (const groupId of groupIds) {
      const groupPostRes = await fetch('https://api.linkedin.com/v2/posts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author: personUrn,
          commentary: { text: content },
          lifecycleState: 'PUBLISHED',
          distribution: {
            feedDistribution: 'MAIN_FEED',
            targetEntities: [groupId],
            thirdPartyMailOptIn: false
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        })
      });

      if (groupPostRes.ok) {
        results.groups.push({ groupId, success: true });
      } else {
        results.groups.push({ groupId, success: false, error: await groupPostRes.text() });
      }
    }

    // Post to organizations if selected
    for (const orgId of organizationIds) {
      const orgUrn = `urn:li:organization:${orgId}`;
      const orgPostRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          author: orgUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: { text: content },
              shareMediaCategory: 'NONE',
            }
          },
          visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
        })
      });

      if (orgPostRes.ok) {
        results.organizations.push({ orgId, success: true });
      } else {
        results.organizations.push({ orgId, success: false, error: await orgPostRes.text() });
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});