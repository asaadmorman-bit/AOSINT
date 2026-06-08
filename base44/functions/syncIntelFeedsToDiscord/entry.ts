import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Syncs all Intel Feed channels to a Discord server as Discord channels.
 * Creates a category per tier, then creates a text channel per FeedChannel under it.
 * Saves each created Discord channel as a DiscordThreatChannel record so pushFeedMessageToDiscord can route to it.
 */

const TIER_CATEGORIES = {
  community: "📡 Community Intel",
  pro: "🔵 Pro Intel",
  enterprise: "🟣 Enterprise Intel",
  gov: "🟡 Gov / CI Intel",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const { discord_server_id } = await req.json();
    if (!discord_server_id) return Response.json({ error: 'discord_server_id required' }, { status: 400 });

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    if (!botToken) return Response.json({ error: 'DISCORD_BOT_TOKEN not set' }, { status: 500 });

    // Verify bot has access
    const guildRes = await fetch(`https://discord.com/api/v10/guilds/${discord_server_id}`, {
      headers: { 'Authorization': `Bot ${botToken}` }
    });
    if (!guildRes.ok) {
      return Response.json({ error: `Bot cannot access guild ${discord_server_id}` }, { status: 400 });
    }

    // Load all active feed channels
    const feedChannels = await base44.asServiceRole.entities.FeedChannel.filter({ is_active: true });

    // Get existing Discord channels in the guild to avoid duplicates
    const existingRes = await fetch(`https://discord.com/api/v10/guilds/${discord_server_id}/channels`, {
      headers: { 'Authorization': `Bot ${botToken}` }
    });
    const existingDiscordChannels = existingRes.ok ? await existingRes.json() : [];
    const existingNames = new Set(existingDiscordChannels.map(c => c.name.toLowerCase()));

    // Also load existing DiscordThreatChannel records for this server to avoid duplicate DB entries
    const existingRecords = await base44.asServiceRole.entities.DiscordThreatChannel.filter({ discord_server_id });
    const existingRecordSlugs = new Set(existingRecords.map(r => r.channel_name?.toLowerCase()));

    const results = [];
    const tiers = ["community", "pro", "enterprise", "gov"];

    for (const tier of tiers) {
      const tierChannels = feedChannels.filter(fc => fc.min_tier === tier);
      if (!tierChannels.length) continue;

      // Create or find the category channel for this tier
      let categoryId = null;
      const categoryName = TIER_CATEGORIES[tier];
      const existingCategory = existingDiscordChannels.find(c => c.type === 4 && c.name === categoryName);

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const catRes = await fetch(`https://discord.com/api/v10/guilds/${discord_server_id}/channels`, {
          method: 'POST',
          headers: { 'Authorization': `Bot ${botToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: categoryName, type: 4 }) // 4 = GUILD_CATEGORY
        });
        if (catRes.ok) {
          const cat = await catRes.json();
          categoryId = cat.id;
        }
      }

      // Create a Discord text channel for each feed channel in this tier
      for (const fc of tierChannels) {
        const discordName = fc.slug; // slugs are already discord-safe (lowercase, hyphens)

        // Skip if already exists in Discord
        if (existingNames.has(discordName)) {
          // If no DB record, create one linking the existing Discord channel to this feed
          if (!existingRecordSlugs.has(discordName)) {
            const existing = existingDiscordChannels.find(c => c.name.toLowerCase() === discordName);
            if (existing) {
              await base44.asServiceRole.entities.DiscordThreatChannel.create({
                server_id: discord_server_id,
                discord_server_id,
                discord_channel_id: existing.id,
                channel_name: discordName,
                channel_type: 'custom',
                threat_name: fc.name,
                is_custom: false,
                created_by: user.email,
              });
            }
          }
          results.push({ name: discordName, status: 'already_exists' });
          continue;
        }

        // Create the Discord channel
        const body = {
          name: discordName,
          type: 0, // GUILD_TEXT
          topic: fc.description || fc.name,
        };
        if (categoryId) body.parent_id = categoryId;

        const chRes = await fetch(`https://discord.com/api/v10/guilds/${discord_server_id}/channels`, {
          method: 'POST',
          headers: { 'Authorization': `Bot ${botToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (chRes.ok) {
          const ch = await chRes.json();
          // Save to DiscordThreatChannel so pushFeedMessageToDiscord can route messages
          await base44.asServiceRole.entities.DiscordThreatChannel.create({
            server_id: discord_server_id,
            discord_server_id,
            discord_channel_id: ch.id,
            channel_name: discordName,
            channel_type: 'custom',
            threat_name: fc.name,
            is_custom: false,
            created_by: user.email,
          });
          results.push({ name: discordName, status: 'created', discord_channel_id: ch.id });
        } else {
          const err = await chRes.text();
          results.push({ name: discordName, status: 'failed', error: err });
        }
      }
    }

    const created = results.filter(r => r.status === 'created').length;
    const skipped = results.filter(r => r.status === 'already_exists').length;
    const failed = results.filter(r => r.status === 'failed').length;

    // Check if all failed with Missing Permissions
    const permError = results.every(r => r.status === 'failed' && r.error?.includes('50013'));
    if (permError) {
      return Response.json({
        error: "Bot is missing 'Manage Channels' permission on your Discord server. Go to Server Settings → Roles → find the bot role → enable 'Manage Channels', then try again."
      });
    }

    return Response.json({
      success: true,
      created,
      skipped,
      failed,
      results,
      message: `Synced: ${created} created, ${skipped} already existed${failed ? `, ${failed} failed` : ''}.`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});