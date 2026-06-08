import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch scheduled posts ready to send
    const scheduledPosts = await base44.asServiceRole.entities.LinkedInScheduledPost.filter({
      status: 'scheduled',
    });

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return Response.json({ message: 'No scheduled posts to send', posts: [] });
    }

    const now = new Date();
    const readyPosts = scheduledPosts.filter(p => new Date(p.scheduled_for) <= now);

    if (readyPosts.length === 0) {
      return Response.json({ message: 'No posts ready yet', posts: [] });
    }

    // Get LinkedIn access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('linkedin');

    // Get user's LinkedIn profile
    const profileRes = await fetch('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      throw new Error('Failed to fetch LinkedIn profile');
    }

    const profile = await profileRes.json();
    const userUrn = profile.id;

    const results = [];

    // Process each ready post
    for (const scheduledPost of readyPosts) {
      try {
        const postedIds = [];

        // Post to personal profile if enabled
        if (scheduledPost.post_to_personal) {
          const personalPost = await postToLinkedInWithMedia(
            accessToken,
            userUrn,
            scheduledPost.content,
            scheduledPost.media_urls,
            'member'
          );
          if (personalPost.success) {
            postedIds.push(personalPost.postId);
          }
        }

        // Post to selected company pages
        if (scheduledPost.company_pages && scheduledPost.company_pages.length > 0) {
          for (const orgPage of scheduledPost.company_pages) {
            try {
              const orgPost = await postToLinkedInWithMedia(
                accessToken,
                orgPage.org_id,
                scheduledPost.content,
                scheduledPost.media_urls,
                'organization'
              );
              if (orgPost.success) {
                postedIds.push(orgPost.postId);
              }
            } catch (orgError) {
              console.error(`Failed to post to org ${orgPage.org_name}:`, orgError.message);
            }
          }
        }

        // Update scheduled post status
        await base44.asServiceRole.entities.LinkedInScheduledPost.update(scheduledPost.id, {
          status: 'posted',
          posted_at: new Date().toISOString(),
          linkedin_post_ids: postedIds,
        });

        results.push({
          title: scheduledPost.title,
          status: 'posted',
          posted_count: postedIds.length,
        });
      } catch (error) {
        console.error(`Error posting scheduled post ${scheduledPost.id}:`, error);
        await base44.asServiceRole.entities.LinkedInScheduledPost.update(scheduledPost.id, {
          status: 'failed',
          error_message: error.message,
        });

        results.push({
          title: scheduledPost.title,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return Response.json({
      success: true,
      processed: results.length,
      results,
      message: `Processed ${results.length} scheduled LinkedIn posts`,
    });
  } catch (error) {
    console.error('Error in postThreatIntelToLinkedIn:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function postToLinkedInWithMedia(accessToken, targetUrn, content, mediaUrls, type) {
  const payload = {
    author: `urn:li:${type}:${targetUrn}`,
    commentary: content,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
  };

  // Register media if provided
  if (mediaUrls && mediaUrls.length > 0) {
    const mediaAssets = [];
    for (const mediaUrl of mediaUrls.slice(0, 1)) {
      // LinkedIn supports max 1 image per post in v2
      try {
        const mediaAsset = await registerMedia(accessToken, mediaUrl, type === 'member' ? 'PERSONAL' : 'ORGANIZATION');
        if (mediaAsset) {
          mediaAssets.push(mediaAsset);
        }
      } catch (mediaError) {
        console.warn('Failed to register media:', mediaError.message);
      }
    }

    if (mediaAssets.length > 0) {
      payload.content = {
        media: mediaAssets,
      };
    }
  }

  const response = await fetch('https://api.linkedin.com/v2/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': '202401',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  return {
    success: true,
    postId: result.id,
  };
}

async function registerMedia(accessToken, mediaUrl, mediaCategory) {
  // Fetch image from URL
  const imgRes = await fetch(mediaUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${mediaUrl}`);

  const buffer = await imgRes.arrayBuffer();
  const contentType = imgRes.headers.get('content-type') || 'image/jpeg';

  // Register asset
  const registerRes = await fetch(
    'https://api.linkedin.com/v2/assets?action=registerUpload',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401',
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: `urn:li:${mediaCategory === 'PERSONAL' ? 'person' : 'organization'}`,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: `urn:li:${mediaCategory === 'PERSONAL' ? 'person' : 'organization'}`,
            },
          ],
        },
      }),
    }
  );

  if (!registerRes.ok) throw new Error('Failed to register media upload');

  const { value } = await registerRes.json();
  const uploadUrl = value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = value.asset;

  // Upload image
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: buffer,
  });

  if (!uploadRes.ok) throw new Error('Failed to upload media');

  return {
    status: 'READY',
    media: asset,
  };
}