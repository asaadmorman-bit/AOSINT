import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { databaseId, findings } = await req.json();
    if (!databaseId) return Response.json({ error: 'databaseId is required' }, { status: 400 });
    if (!findings || !Array.isArray(findings) || findings.length === 0) {
      return Response.json({ error: 'findings array is required' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('notion');

    const results = [];
    for (const finding of findings) {
      const body = {
        parent: { database_id: databaseId },
        properties: {
          "Title": {
            title: [{ text: { content: finding.title || 'Untitled Finding' } }]
          },
          "Severity": {
            select: { name: (finding.severity || 'medium').charAt(0).toUpperCase() + (finding.severity || 'medium').slice(1) }
          },
          "Domain": {
            select: { name: (finding.domain || 'cyber').charAt(0).toUpperCase() + (finding.domain || 'cyber').slice(1) }
          },
          "Status": {
            select: { name: (finding.status || 'active').charAt(0).toUpperCase() + (finding.status || 'active').slice(1) }
          },
          "Source": {
            rich_text: [{ text: { content: finding.source || '' } }]
          },
          "Description": {
            rich_text: [{ text: { content: (finding.description || '').slice(0, 2000) } }]
          },
          "Tags": {
            multi_select: (finding.tags || []).slice(0, 10).map(t => ({ name: String(t).slice(0, 100) }))
          },
          "Logged By": {
            rich_text: [{ text: { content: user.email || '' } }]
          },
          "Logged At": {
            date: { start: new Date().toISOString() }
          },
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: finding.description || '' } }]
            }
          }
        ]
      };

      const res = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        results.push({ title: finding.title, success: false, error: data.message || 'Unknown error' });
      } else {
        results.push({ title: finding.title, success: true, pageId: data.id, url: data.url });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return Response.json({ success: true, logged: successCount, total: findings.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});