import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchQuery, entityType, limit = 50 } = await req.json();

    if (!searchQuery || searchQuery.length < 2) {
      return Response.json({ error: 'Search query too short' }, { status: 400 });
    }

    const results = {
      organizations: [],
      entities: [],
      threat_actors: [],
      lea_intelligence: [],
      total: 0
    };

    // Search across different entity types
    const searchFilters = [
      {
        type: 'organizations',
        entity: 'Entity',
        fields: ['indicator_value', 'label'],
        filter: { entity_type: 'organization' }
      },
      {
        type: 'entities',
        entity: 'Entity',
        fields: ['indicator_value', 'label'],
        filter: {}
      },
      {
        type: 'threat_actors',
        entity: 'ThreatActor',
        fields: ['name', 'aliases']
      },
      {
        type: 'lea_intelligence',
        entity: 'LEAIntelligence',
        fields: ['entity_name', 'title', 'aliases']
      }
    ];

    for (const search of searchFilters) {
      if (entityType && entityType !== search.type) continue;

      try {
        const entities = await base44.entities[search.entity].list(undefined, 1000).catch(() => []);
        const filtered = entities
          .filter(e => {
            const searchLower = searchQuery.toLowerCase();
            return search.fields.some(field => {
              const value = e[field];
              if (Array.isArray(value)) {
                return value.some(v => v?.toLowerCase?.().includes(searchLower));
              }
              return value?.toLowerCase?.().includes(searchLower);
            });
          })
          .slice(0, limit);

        results[search.type] = filtered;
        results.total += filtered.length;
      } catch (error) {
        console.error(`Error searching ${search.type}:`, error);
      }
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});