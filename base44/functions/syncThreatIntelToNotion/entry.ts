import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notionRichText(text) {
  return [{ type: "text", text: { content: String(text || "").slice(0, 2000) } }];
}

function notionSelect(value) {
  return value ? { name: String(value) } : null;
}

function notionDate(value) {
  if (!value) return null;
  try { return { start: new Date(value).toISOString() }; } catch { return null; }
}

// ─── Notion API helpers ───────────────────────────────────────────────────────

async function notionRequest(method, path, body, accessToken) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Notion API error: ${json.message || JSON.stringify(json)}`);
  return json;
}

// Search for an existing database by title within a parent page
async function findDatabase(accessToken, title) {
  const result = await notionRequest("POST", "/search", {
    query: title,
    filter: { value: "database", property: "object" },
  }, accessToken);
  return result.results?.find(db => db.title?.[0]?.plain_text === title) || null;
}

// Create a database if it doesn't exist
async function ensureDatabase(accessToken, parentPageId, title, properties) {
  const existing = await findDatabase(accessToken, title);
  if (existing) return existing.id;

  const db = await notionRequest("POST", "/databases", {
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: title } }],
    properties,
  }, accessToken);
  return db.id;
}

// Query all pages in a database (handles pagination)
async function queryDatabase(accessToken, dbId) {
  let results = [];
  let cursor = undefined;
  do {
    const res = await notionRequest("POST", `/databases/${dbId}/query`, {
      ...(cursor ? { start_cursor: cursor } : {}),
    }, accessToken);
    results = results.concat(res.results || []);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return results;
}

// ─── Upsert helper ─────────────────────────────────────────────────────────────
// Uses "Source ID" property as dedup key. Creates or updates the page.
async function upsertPage(accessToken, dbId, sourceId, properties) {
  const existing = await notionRequest("POST", `/databases/${dbId}/query`, {
    filter: { property: "Source ID", rich_text: { equals: sourceId } },
    page_size: 1,
  }, accessToken);

  if (existing.results?.length > 0) {
    const pageId = existing.results[0].id;
    await notionRequest("PATCH", `/pages/${pageId}`, { properties }, accessToken);
    return { action: "updated", pageId };
  } else {
    const page = await notionRequest("POST", "/pages", {
      parent: { database_id: dbId },
      properties,
    }, accessToken);
    return { action: "created", pageId: page.id };
  }
}

// ─── Database schemas ─────────────────────────────────────────────────────────

const INDICATOR_SCHEMA = {
  "Name":          { title: {} },
  "Source ID":     { rich_text: {} },
  "Type":          { select: { options: [
    { name: "ip_address", color: "blue" }, { name: "domain", color: "green" },
    { name: "hash", color: "gray" }, { name: "url", color: "yellow" },
    { name: "cve", color: "red" }, { name: "email", color: "purple" },
    { name: "ttps", color: "orange" }, { name: "actor", color: "pink" },
  ]}},
  "Severity":      { select: { options: [
    { name: "critical", color: "red" }, { name: "high", color: "orange" },
    { name: "medium", color: "yellow" }, { name: "low", color: "blue" },
    { name: "informational", color: "gray" },
  ]}},
  "Status":        { select: { options: [
    { name: "active", color: "red" }, { name: "investigating", color: "yellow" },
    { name: "resolved", color: "green" }, { name: "false_positive", color: "gray" },
  ]}},
  "Threat Category": { select: {} },
  "Confidence":    { number: { format: "percent" } },
  "Value":         { rich_text: {} },
  "Feed Name":     { rich_text: {} },
  "First Seen":    { date: {} },
  "Last Seen":     { date: {} },
  "Notes":         { rich_text: {} },
};

const ALERT_SCHEMA = {
  "Name":          { title: {} },
  "Source ID":     { rich_text: {} },
  "Alert Type":    { select: { options: [
    { name: "credential_leak", color: "red" }, { name: "domain_compromise", color: "orange" },
    { name: "ip_reputation", color: "yellow" }, { name: "threat_actor_mention", color: "purple" },
    { name: "correlation_cluster", color: "blue" }, { name: "suspicious_activity", color: "gray" },
    { name: "new_indicator", color: "green" },
  ]}},
  "Severity":      { select: { options: [
    { name: "critical", color: "red" }, { name: "high", color: "orange" },
    { name: "medium", color: "yellow" }, { name: "low", color: "blue" },
  ]}},
  "Status":        { select: { options: [
    { name: "new", color: "red" }, { name: "acknowledged", color: "yellow" },
    { name: "in_progress", color: "blue" }, { name: "resolved", color: "green" },
    { name: "false_positive", color: "gray" },
  ]}},
  "Confidence":    { number: { format: "percent" } },
  "Triggered At":  { date: {} },
  "Description":   { rich_text: {} },
};

const ACTOR_SCHEMA = {
  "Name":          { title: {} },
  "Source ID":     { rich_text: {} },
  "Actor Type":    { select: { options: [
    { name: "nation_state", color: "red" }, { name: "criminal", color: "orange" },
    { name: "hacktivist", color: "yellow" }, { name: "insider", color: "purple" },
    { name: "hybrid", color: "blue" }, { name: "unknown", color: "gray" },
  ]}},
  "Status":        { select: { options: [
    { name: "active", color: "red" }, { name: "dormant", color: "yellow" },
    { name: "dissolved", color: "gray" }, { name: "unknown", color: "default" },
  ]}},
  "Attributed Country": { rich_text: {} },
  "Confidence":    { number: { format: "percent" } },
  "First Observed": { date: {} },
  "Last Active":   { date: {} },
  "Notes":         { rich_text: {} },
};

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { accessToken } = await base44.asServiceRole.connectors.getConnection("notion");

  // Get the parent page ID from request body, or use a search to find/create one
  const body = await req.json().catch(() => ({}));
  const parentPageId = body.parent_page_id;

  if (!parentPageId) {
    return Response.json({ error: "parent_page_id is required. Please provide the ID of the Notion page to create the databases in." }, { status: 400 });
  }

  const results = { indicators: { created: 0, updated: 0 }, alerts: { created: 0, updated: 0 }, actors: { created: 0, updated: 0 }, errors: [] };

  // ── Ensure all 3 databases exist ────────────────────────────────────────────
  const [indicatorsDbId, alertsDbId, actorsDbId] = await Promise.all([
    ensureDatabase(accessToken, parentPageId, "🔍 Threat Indicators", INDICATOR_SCHEMA),
    ensureDatabase(accessToken, parentPageId, "🚨 OSINT Alerts", ALERT_SCHEMA),
    ensureDatabase(accessToken, parentPageId, "👤 Threat Actors", ACTOR_SCHEMA),
  ]);

  // ── Fetch data from ASOSINT ──────────────────────────────────────────────────
  const [indicators, alerts, actors] = await Promise.all([
    base44.asServiceRole.entities.ThreatIndicator.list("-updated_date", 200),
    base44.asServiceRole.entities.OsintAlert.list("-updated_date", 200),
    base44.asServiceRole.entities.ThreatActor.list("-updated_date", 200),
  ]);

  // ── Sync Threat Indicators ────────────────────────────────────────────────────
  for (const ind of indicators) {
    try {
      const props = {
        "Name":           { title: notionRichText(ind.title || ind.value || "Untitled") },
        "Source ID":      { rich_text: notionRichText(ind.id) },
        "Type":           { select: notionSelect(ind.indicator_type) },
        "Severity":       { select: notionSelect(ind.severity) },
        "Status":         { select: notionSelect(ind.status) },
        "Threat Category":{ select: notionSelect(ind.threat_category) },
        "Confidence":     { number: ind.confidence ? ind.confidence / 100 : null },
        "Value":          { rich_text: notionRichText(ind.value) },
        "Feed Name":      { rich_text: notionRichText(ind.feed_name) },
        "Notes":          { rich_text: notionRichText(ind.notes) },
      };
      if (ind.first_seen) props["First Seen"] = { date: notionDate(ind.first_seen) };
      if (ind.last_seen)  props["Last Seen"]  = { date: notionDate(ind.last_seen) };

      const r = await upsertPage(accessToken, indicatorsDbId, ind.id, props);
      results.indicators[r.action]++;
    } catch (e) {
      results.errors.push(`Indicator ${ind.id}: ${e.message}`);
    }
  }

  // ── Sync OSINT Alerts ──────────────────────────────────────────────────────────
  for (const alert of alerts) {
    try {
      const props = {
        "Name":        { title: notionRichText(alert.title || "Alert") },
        "Source ID":   { rich_text: notionRichText(alert.id) },
        "Alert Type":  { select: notionSelect(alert.alert_type) },
        "Severity":    { select: notionSelect(alert.severity) },
        "Status":      { select: notionSelect(alert.status) },
        "Confidence":  { number: alert.confidence_score ? alert.confidence_score / 100 : null },
        "Description": { rich_text: notionRichText(alert.description) },
      };
      if (alert.triggered_at) props["Triggered At"] = { date: notionDate(alert.triggered_at) };

      const r = await upsertPage(accessToken, alertsDbId, alert.id, props);
      results.alerts[r.action]++;
    } catch (e) {
      results.errors.push(`Alert ${alert.id}: ${e.message}`);
    }
  }

  // ── Sync Threat Actors ────────────────────────────────────────────────────────
  for (const actor of actors) {
    try {
      const props = {
        "Name":               { title: notionRichText(actor.name) },
        "Source ID":          { rich_text: notionRichText(actor.id) },
        "Actor Type":         { select: notionSelect(actor.actor_type) },
        "Status":             { select: notionSelect(actor.status) },
        "Attributed Country": { rich_text: notionRichText(actor.attributed_country) },
        "Confidence":         { number: actor.confidence ? actor.confidence / 100 : null },
        "Notes":              { rich_text: notionRichText(actor.notes) },
      };
      if (actor.first_observed) props["First Observed"] = { date: notionDate(actor.first_observed) };
      if (actor.last_active)    props["Last Active"]    = { date: notionDate(actor.last_active) };

      const r = await upsertPage(accessToken, actorsDbId, actor.id, props);
      results.actors[r.action]++;
    } catch (e) {
      results.errors.push(`Actor ${actor.id}: ${e.message}`);
    }
  }

  return Response.json({
    success: true,
    databases: {
      indicators: indicatorsDbId,
      alerts: alertsDbId,
      actors: actorsDbId,
    },
    results,
    synced_at: new Date().toISOString(),
  });
});