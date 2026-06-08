import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metaToken = Deno.env.get('META_GRAPH_API_TOKEN');
    if (!metaToken) {
      return Response.json({
        error: 'META_GRAPH_API_TOKEN not configured',
        message: 'Set META_GRAPH_API_TOKEN in environment variables to enable social media sync'
      }, { status: 400 });
    }

    // Fetch all active social media feed configs
    const configs = await base44.entities.SocialMediaFeedConfig.filter(
      { sync_enabled: true },
      '-last_sync',
      100
    );

    const results = [];

    for (const config of configs) {
      const platform = config.platform;
      const endpoint = platform === 'instagram'
        ? `https://graph.instagram.com/v18.0/${config.account_id}/ig_hashtag_search`
        : `https://graph.facebook.com/v18.0/${config.account_id}/posts`;

      try {
        // Build query parameters
        const params = new URLSearchParams({
          access_token: metaToken,
          fields: 'id,message,story,permalink_url,created_time,type,picture,link',
          limit: 50
        });

        // Add hashtag search if monitoring hashtags (Instagram)
        if (config.hashtags && config.hashtags.length > 0 && platform === 'instagram') {
          // For Instagram hashtag search
          const hashtagParams = new URLSearchParams({
            user_id: config.account_id,
            fields: `id,name`,
            access_token: metaToken
          });
          // Fetch hashtag IDs first
          const hashtagRes = await fetch(
            `https://graph.instagram.com/v18.0/ig_hashtag_search?${hashtagParams}`
          );
          const hashtagData = await hashtagRes.json();
          // Then get recent posts for each hashtag
          const posts = [];
          if (hashtagData.data) {
            for (const hashtag of hashtagData.data) {
              const postParams = new URLSearchParams({
                user_id: config.account_id,
                fields: 'id,caption,media_type,media_url,timestamp,permalink',
                access_token: metaToken
              });
              const postsRes = await fetch(
                `https://graph.instagram.com/v18.0/${hashtag.id}/recent_media?${postParams}`
              );
              const postsData = await postsRes.json();
              if (postsData.data) posts.push(...postsData.data);
            }
          }

          // Post to feed channel
          if (posts.length > 0) {
            for (const post of posts) {
              await base44.entities.FeedMessage.create({
                channel_id: config.feed_channel_id,
                channel_slug: 'social-media-intel',
                content: `**Instagram Post**\n\n${post.caption || 'No caption'}\n\n[View Post](${post.permalink})`,
                message_type: 'alert',
                severity: 'info',
                author_name: config.account_name,
                author_email: user.email,
                source_ref: `instagram-${post.id}`
              });
            }
          }
        } else if (platform === 'facebook') {
          // Facebook posts fetch
          const postsRes = await fetch(`${endpoint}?${params}`);
          const postsData = await postsRes.json();

          if (postsData.data && postsData.data.length > 0) {
            for (const post of postsData.data) {
              const shouldInclude = !config.keywords || config.keywords.length === 0 ||
                config.keywords.some(kw => (post.message || '').toLowerCase().includes(kw.toLowerCase()));

              if (shouldInclude) {
                await base44.entities.FeedMessage.create({
                  channel_id: config.feed_channel_id,
                  channel_slug: 'social-media-intel',
                  content: `**Facebook Post**\n\n${post.message || post.story || 'No text'}\n\n[View Post](${post.permalink_url})`,
                  message_type: 'alert',
                  severity: 'info',
                  author_name: config.account_name,
                  author_email: user.email,
                  source_ref: `facebook-${post.id}`
                });
              }
            }
          }
        }

        // Update last sync time
        await base44.entities.SocialMediaFeedConfig.update(config.id, {
          last_sync: new Date().toISOString()
        });

        results.push({ config_id: config.id, status: 'synced', posts_added: 0 });
      } catch (err) {
        results.push({ config_id: config.id, status: 'failed', error: err.message });
      }
    }

    return Response.json({ synced: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});