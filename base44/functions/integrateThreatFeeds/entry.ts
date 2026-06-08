import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedType, feedUrl, taxiiUsername, taxiiPassword, mispApiKey, mispUrl } = await req.json();

    if (!feedType || !['stix', 'taxii', 'misp', 'generic'].includes(feedType)) {
      return Response.json({ error: 'Invalid feedType' }, { status: 400 });
    }

    let indicators = [];

    try {
      if (feedType === 'stix') {
        // Fetch and parse STIX bundle
        const response = await fetch(feedUrl);
        if (!response.ok) throw new Error(`Failed to fetch STIX feed: ${response.status}`);
        
        const stixBundle = await response.json();
        indicators = extractFromSTIX(stixBundle);
      } 
      else if (feedType === 'taxii') {
        // TAXII 2.0 API integration
        if (!feedUrl || !taxiiUsername || !taxiiPassword) {
          throw new Error('TAXII requires feedUrl, taxiiUsername, and taxiiPassword');
        }

        const basicAuth = btoa(`${taxiiUsername}:${taxiiPassword}`);
        const response = await fetch(feedUrl, {
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Accept': 'application/taxii+json;version=2.0',
          },
        });

        if (!response.ok) throw new Error(`TAXII API error: ${response.status}`);
        
        const taxiiData = await response.json();
        indicators = extractFromTAXII(taxiiData);
      } 
      else if (feedType === 'misp') {
        // MISP API integration
        if (!mispUrl || !mispApiKey) {
          throw new Error('MISP requires mispUrl and mispApiKey');
        }

        const response = await fetch(`${mispUrl}/attributes/search`, {
          method: 'POST',
          headers: {
            'Authorization': mispApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            limit: 1000,
            searchall: false,
            type: ['ip-dst', 'ip-src', 'domain', 'url', 'md5', 'sha1', 'sha256'],
          }),
        });

        if (!response.ok) throw new Error(`MISP API error: ${response.status}`);
        
        const mispData = await response.json();
        indicators = extractFromMISP(mispData);
      } 
      else if (feedType === 'generic') {
        // Generic CSV/JSON feed
        const response = await fetch(feedUrl);
        if (!response.ok) throw new Error(`Failed to fetch feed: ${response.status}`);
        
        const content = await response.text();
        indicators = parseGenericFeed(content);
      }
    } catch (feedError) {
      return Response.json({
        error: `Feed integration error: ${feedError.message}`,
        feedType,
        status: 'failed',
      }, { status: 400 });
    }

    // Enrich indicators and store them
    const enrichedIndicators = indicators.map(ind => ({
      ...ind,
      ingested_date: new Date().toISOString(),
      source: feedType,
      feed_url: feedUrl,
    }));

    // Store as ThreatIndicator records
    if (enrichedIndicators.length > 0) {
      try {
        await base44.asServiceRole.entities.ThreatIndicator.bulkCreate(
          enrichedIndicators.slice(0, 500) // Limit to prevent oversized payloads
        );
      } catch (storeError) {
        console.error('Error storing indicators:', storeError.message);
        // Continue even if storage fails
      }
    }

    // Correlate with existing threat detection rules
    const existingRules = await base44.asServiceRole.entities.ThreatDetectionRule.list();
    const correlations = correlateWithRules(enrichedIndicators, existingRules);

    return Response.json({
      status: 'success',
      feedType,
      feedUrl,
      indicatorsIngested: enrichedIndicators.length,
      summary: {
        by_type: aggregateByType(enrichedIndicators),
        by_severity: aggregateBySeverity(enrichedIndicators),
        by_source: aggregateBySource(enrichedIndicators),
      },
      correlations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function extractFromSTIX(stixBundle) {
  const indicators = [];
  if (!stixBundle.objects) return indicators;

  stixBundle.objects.forEach(obj => {
    if (obj.type === 'indicator') {
      indicators.push({
        indicator_type: extractIndicatorType(obj.pattern),
        indicator_value: extractIndicatorValue(obj.pattern),
        threat_level: obj.labels?.includes('malicious-activity') ? 'high' : 'medium',
        source: 'STIX',
        detected_date: obj.created,
        description: obj.name,
        metadata: JSON.stringify({
          stix_id: obj.id,
          valid_from: obj.valid_from,
          pattern: obj.pattern,
        }),
      });
    }
  });
  return indicators;
}

function extractFromTAXII(taxiiData) {
  const indicators = [];
  
  if (taxiiData.objects) {
    taxiiData.objects.forEach(obj => {
      if (obj.type === 'indicator') {
        indicators.push({
          indicator_type: extractIndicatorType(obj.pattern),
          indicator_value: extractIndicatorValue(obj.pattern),
          threat_level: 'medium',
          source: 'TAXII',
          detected_date: obj.created,
          description: obj.name,
          metadata: JSON.stringify({
            taxii_id: obj.id,
            pattern: obj.pattern,
          }),
        });
      } else if (obj.type === 'malware') {
        indicators.push({
          indicator_type: 'malware_name',
          indicator_value: obj.name,
          threat_level: 'high',
          source: 'TAXII',
          detected_date: obj.created,
          description: obj.description,
          metadata: JSON.stringify(obj),
        });
      }
    });
  }
  
  return indicators;
}

function extractFromMISP(mispData) {
  const indicators = [];
  
  if (mispData.response && Array.isArray(mispData.response)) {
    mispData.response.forEach(attr => {
      indicators.push({
        indicator_type: attr.type,
        indicator_value: attr.value,
        threat_level: determineThreatLevel(attr.distribution, attr.to_ids),
        source: 'MISP',
        detected_date: new Date(attr.timestamp * 1000).toISOString(),
        description: attr.comment || `MISP attribute: ${attr.type}`,
        metadata: JSON.stringify({
          misp_id: attr.id,
          event_id: attr.event_id,
          to_ids: attr.to_ids,
          distribution: attr.distribution,
        }),
      });
    });
  }
  
  return indicators;
}

function parseGenericFeed(content) {
  const indicators = [];
  
  try {
    // Try JSON first
    const json = JSON.parse(content);
    if (Array.isArray(json)) {
      return json.map(item => ({
        indicator_type: item.type || 'unknown',
        indicator_value: item.value || item.ioc || '',
        threat_level: item.severity || 'medium',
        source: 'Generic Feed',
        detected_date: item.date || new Date().toISOString(),
        description: item.description || '',
        metadata: JSON.stringify(item),
      }));
    }
  } catch {
    // Try CSV parsing
    const lines = content.split('\n');
    const headers = lines[0]?.split(',').map(h => h.trim()) || [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length > 0) {
        indicators.push({
          indicator_type: values[0] || 'unknown',
          indicator_value: values[1] || '',
          threat_level: values[2] || 'medium',
          source: 'Generic Feed',
          detected_date: new Date().toISOString(),
          description: values[3] || '',
          metadata: JSON.stringify({ raw: lines[i] }),
        });
      }
    }
  }
  
  return indicators;
}

function extractIndicatorType(pattern) {
  if (!pattern) return 'unknown';
  if (pattern.includes('ipv4-addr')) return 'ip-address';
  if (pattern.includes('domain-name')) return 'domain';
  if (pattern.includes('url')) return 'url';
  if (pattern.includes('file:hashes')) return 'hash';
  if (pattern.includes('email-addr')) return 'email';
  return 'unknown';
}

function extractIndicatorValue(pattern) {
  if (!pattern) return '';
  const match = pattern.match(/'([^']+)'/);
  return match ? match[1] : '';
}

function determineThreatLevel(distribution, toIds) {
  if (toIds === true) return 'high';
  if (distribution === 0) return 'critical';
  return 'medium';
}

function aggregateByType(indicators) {
  const agg = {};
  indicators.forEach(ind => {
    agg[ind.indicator_type] = (agg[ind.indicator_type] || 0) + 1;
  });
  return agg;
}

function aggregateBySeverity(indicators) {
  const agg = {};
  indicators.forEach(ind => {
    agg[ind.threat_level] = (agg[ind.threat_level] || 0) + 1;
  });
  return agg;
}

function aggregateBySource(indicators) {
  const agg = {};
  indicators.forEach(ind => {
    agg[ind.source] = (agg[ind.source] || 0) + 1;
  });
  return agg;
}

function correlateWithRules(indicators, rules) {
  const correlations = [];
  
  rules.forEach(rule => {
    const matchedIndicators = indicators.filter(ind => {
      // Simple pattern matching - can be enhanced
      const ruleConditions = tryParseJSON(rule.conditions) || {};
      return ind.threat_level === ruleConditions.threat_level || 
             ind.indicator_type === ruleConditions.indicator_type;
    });

    if (matchedIndicators.length > 0) {
      correlations.push({
        rule_name: rule.rule_name,
        rule_id: rule.id,
        matched_count: matchedIndicators.length,
        matched_types: [...new Set(matchedIndicators.map(i => i.indicator_type))],
        recommendation: `${matchedIndicators.length} indicators match rule "${rule.rule_name}" - consider activating/reviewing this rule`,
      });
    }
  });
  
  return correlations;
}

function tryParseJSON(str) {
  try {
    return typeof str === 'string' ? JSON.parse(str) : str;
  } catch {
    return null;
  }
}