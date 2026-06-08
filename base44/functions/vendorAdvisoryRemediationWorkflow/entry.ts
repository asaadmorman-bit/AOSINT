import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Mission set → human-readable task instructions
const MISSION_SET_TASKS = {
  C2: 'Verify command and control systems are patched and comms continuity is maintained post-fix.',
  ISR: 'Ensure ISR sensor platforms and collection systems are updated; validate data integrity after patch.',
  SIGINT: 'Coordinate with SIGINT operators to schedule downtime window; validate signal collection resumes after patch.',
  EW: 'Confirm EW system firmware versions post-patch; run electronic check-out procedures.',
  logistics: 'Update logistics management software; test supply chain integration points after remediation.',
  comms: 'Patch comms infrastructure in a maintenance window; test encrypted channels post-update.',
  cyber: 'Apply patch to cyber toolsets; run post-patch vulnerability rescan to confirm closure.',
  HUMINT: 'Notify HUMINT system administrators; validate source protection systems remain intact after patch.',
  strike: 'Coordinate with strike planning staff; ensure targeting software is updated and validated.',
  default: 'Apply the vendor fix per the advisory instructions and verify system functionality post-remediation.'
};

function getTaskInstructions(missionSets = []) {
  if (!missionSets.length) return MISSION_SET_TASKS.default;
  const lines = missionSets.map(ms => {
    const key = Object.keys(MISSION_SET_TASKS).find(k => k.toLowerCase() === ms.toLowerCase()) || 'default';
    return `[${ms.toUpperCase()}] ${MISSION_SET_TASKS[key]}`;
  });
  return lines.join('\n');
}

function buildDiscordEmbed(advisory, tasks, matchedFindings) {
  const severityColors = { critical: 0xFF0000, high: 0xFF6600, medium: 0xFFCC00, low: 0x0066FF, informational: 0x00CC00 };
  const color = severityColors[advisory.severity] || 0x808080;

  const fields = [
    { name: '🔒 Advisory ID', value: advisory.advisory_id || advisory.id, inline: true },
    { name: '🏭 Vendor', value: advisory.vendor_name, inline: true },
    { name: '⚠️ Severity', value: advisory.severity?.toUpperCase(), inline: true },
    { name: '🛠️ Fix Type', value: advisory.fix_type || 'pending', inline: true },
    { name: '🎯 Affected Domain', value: advisory.affected_domain || 'digital', inline: true },
    { name: '📋 Findings Updated', value: `${matchedFindings} finding(s) → in_remediation`, inline: true },
    { name: '✅ Tasks Created', value: `${tasks.length} task(s) assigned`, inline: true },
  ];

  if (advisory.mission_sets?.length) {
    fields.push({ name: '🎖️ Mission Sets', value: advisory.mission_sets.join(', '), inline: false });
  }

  if (advisory.cve_ids?.length) {
    fields.push({ name: '🔑 CVEs', value: advisory.cve_ids.join(', '), inline: false });
  }

  if (advisory.fix_reference) {
    fields.push({ name: '🔗 Fix Reference', value: advisory.fix_reference, inline: false });
  }

  return {
    embeds: [{
      title: `🔧 Remediation Workflow Triggered: ${advisory.title}`,
      description: advisory.description?.slice(0, 300) || 'Automated remediation workflow has been initiated.',
      color,
      fields,
      footer: { text: 'ASOSINT Remediation Engine • Auto-generated' },
      timestamp: new Date().toISOString()
    }]
  };
}

async function pushToDiscord(botToken, serverId, message) {
  // Find a remediation/vuln/alerts channel in the server
  const chanRes = await fetch(`https://discord.com/api/v10/guilds/${serverId}/channels`, {
    headers: { Authorization: `Bot ${botToken}` }
  });
  if (!chanRes.ok) return { success: false, reason: 'Could not fetch channels' };

  const channels = await chanRes.json();
  const targetChannel = channels.find(c =>
    c.type === 0 && (
      c.name.includes('remediat') ||
      c.name.includes('vuln') ||
      c.name.includes('alert') ||
      c.name.includes('security') ||
      c.name.includes('intel')
    )
  ) || channels.find(c => c.type === 0); // fallback: first text channel

  if (!targetChannel) return { success: false, reason: 'No suitable channel found' };

  const msgRes = await fetch(`https://discord.com/api/v10/channels/${targetChannel.id}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });

  return { success: msgRes.ok, channel: targetChannel.name, status: msgRes.status };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Support both direct invocation and entity automation payload
    const payload = await req.json();
    const advisoryData = payload.data || payload;
    const advisoryId = payload.event?.entity_id || payload.advisory_id || advisoryData.id;

    if (!advisoryId) {
      return Response.json({ error: 'advisory_id is required' }, { status: 400 });
    }

    // Fetch the full advisory record (in case payload is partial)
    const advisory = advisoryData.vendor_name
      ? advisoryData
      : (await base44.asServiceRole.entities.VendorAdvisory.list()).find(a => a.id === advisoryId);

    if (!advisory) {
      return Response.json({ error: `VendorAdvisory ${advisoryId} not found` }, { status: 404 });
    }

    // Only trigger if fix_available=true OR status='applied'
    const shouldTrigger = advisory.fix_available === true || advisory.status === 'applied';
    if (!shouldTrigger) {
      return Response.json({
        skipped: true,
        reason: 'Advisory has no fix available and status is not applied',
        advisory_id: advisoryId
      });
    }

    const missionSets = advisory.mission_sets || [];
    const matchedAssetIds = advisory.matched_assets || [];
    const taskInstructions = getTaskInstructions(missionSets);
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const createdTasks = [];
    let findingsUpdated = 0;

    // --- 1. Find all VulnerabilityFindings linked to matched assets ---
    const allFindings = await base44.asServiceRole.entities.VulnerabilityFinding.list('-created_date', 200);
    const linkedFindings = allFindings.filter(f =>
      matchedAssetIds.includes(f.asset_id) &&
      ['open', 'in_remediation'].includes(f.status)
    );

    // Also match by CVE if available
    const cveIds = advisory.cve_ids || [];
    const cveFindings = allFindings.filter(f =>
      cveIds.length > 0 &&
      f.cve_id && cveIds.some(c => c.toLowerCase() === f.cve_id.toLowerCase()) &&
      ['open', 'in_remediation'].includes(f.status)
    );

    // Deduplicate
    const findingsToUpdate = [...new Map(
      [...linkedFindings, ...cveFindings].map(f => [f.id, f])
    ).values()];

    // --- 2. Update findings → in_remediation ---
    for (const finding of findingsToUpdate) {
      await base44.asServiceRole.entities.VulnerabilityFinding.update(finding.id, {
        status: 'in_remediation',
        remediation_guidance: advisory.fix_instructions || advisory.fix_reference || finding.remediation_guidance,
        patch_available: true,
        patch_reference: advisory.fix_reference || finding.patch_reference
      });
      findingsUpdated++;
    }

    // --- 3. Fetch assets to get owner/assigned_to info ---
    const assetMap = {};
    if (matchedAssetIds.length > 0) {
      const assets = await base44.asServiceRole.entities.Asset.list('-created_date', 200);
      for (const a of assets) {
        if (matchedAssetIds.includes(a.id)) assetMap[a.id] = a;
      }
    }

    // --- 4. Create remediation tasks per matched asset ---
    const assigneesSeen = new Set();
    for (const assetId of matchedAssetIds) {
      const asset = assetMap[assetId];
      const assignee = asset?.owner || advisory.notes?.match(/assigned_to:\s*(\S+)/)?.[1] || null;

      // Deduplicate tasks by assignee to avoid spam
      const dedupeKey = `${assetId}-${assignee || 'unassigned'}`;
      if (assigneesSeen.has(dedupeKey)) continue;
      assigneesSeen.add(dedupeKey);

      const task = await base44.asServiceRole.entities.AgentTask.create({
        title: `[REMEDIATION] ${advisory.vendor_name}: ${advisory.title}`,
        description: [
          `Advisory: ${advisory.advisory_id || advisoryId}`,
          `Severity: ${advisory.severity?.toUpperCase()}`,
          `Asset: ${asset?.name || assetId}`,
          `Fix Type: ${advisory.fix_type || 'See advisory'}`,
          advisory.fix_reference ? `Fix Reference: ${advisory.fix_reference}` : null,
          '',
          'Mission-Specific Instructions:',
          taskInstructions,
          '',
          advisory.fix_instructions ? `Fix Instructions:\n${advisory.fix_instructions}` : null
        ].filter(Boolean).join('\n'),
        assigned_to: assignee,
        status: 'pending',
        priority: advisory.severity === 'critical' ? 'critical' : advisory.severity === 'high' ? 'high' : 'medium',
        due_date: dueDate,
        tags: ['remediation', 'vendor-advisory', ...(missionSets || []), advisory.vendor_name?.toLowerCase()].filter(Boolean)
      });
      createdTasks.push(task);
    }

    // If no matched assets but advisory has assignee in notes, create a single generic task
    if (matchedAssetIds.length === 0) {
      const task = await base44.asServiceRole.entities.AgentTask.create({
        title: `[REMEDIATION] ${advisory.vendor_name}: ${advisory.title}`,
        description: [
          `Advisory: ${advisory.advisory_id || advisoryId}`,
          `Severity: ${advisory.severity?.toUpperCase()}`,
          `Affected Products: ${(advisory.affected_products || []).join(', ') || 'See advisory'}`,
          `Fix Type: ${advisory.fix_type || 'See advisory'}`,
          advisory.fix_reference ? `Fix Reference: ${advisory.fix_reference}` : null,
          '',
          'Mission-Specific Instructions:',
          taskInstructions,
          '',
          advisory.fix_instructions ? `Fix Instructions:\n${advisory.fix_instructions}` : null
        ].filter(Boolean).join('\n'),
        status: 'pending',
        priority: advisory.severity === 'critical' ? 'critical' : advisory.severity === 'high' ? 'high' : 'medium',
        due_date: dueDate,
        tags: ['remediation', 'vendor-advisory', ...(missionSets || [])].filter(Boolean)
      });
      createdTasks.push(task);
    }

    // --- 5. Update VendorAdvisory status to in_remediation ---
    await base44.asServiceRole.entities.VendorAdvisory.update(advisoryId, {
      status: 'in_remediation'
    });

    // --- 6. Send Discord notification ---
    const discordBotToken = Deno.env.get('DISCORD_BOT_TOKEN');
    const discordResults = [];

    if (discordBotToken) {
      const servers = await base44.asServiceRole.entities.DiscordThreatServer.list('-created_date', 20);
      const discordMsg = buildDiscordEmbed(advisory, createdTasks, findingsUpdated);

      for (const server of servers) {
        if (!server.is_active || !server.discord_server_id) continue;
        const result = await pushToDiscord(discordBotToken, server.discord_server_id, discordMsg);
        discordResults.push({ server: server.name, ...result });
      }
    }

    return Response.json({
      success: true,
      advisory_id: advisoryId,
      advisory_title: advisory.title,
      tasks_created: createdTasks.length,
      findings_updated: findingsUpdated,
      discord_notifications: discordResults,
      summary: `Remediation workflow triggered: ${createdTasks.length} task(s) created, ${findingsUpdated} finding(s) moved to in_remediation.`
    });

  } catch (error) {
    console.error('Remediation workflow error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});