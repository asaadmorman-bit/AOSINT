import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Returns the Mapbox public token to the authenticated frontend.
 * Mapbox pk. tokens are public-safe but we still gate on auth to avoid scraping.
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = Deno.env.get('MAPBOX_TOKEN');
  if (!token) {
    return Response.json({ error: 'MAPBOX_TOKEN not configured' }, { status: 500 });
  }
  return Response.json({ token });
});