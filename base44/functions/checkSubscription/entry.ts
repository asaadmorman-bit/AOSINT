import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TIER_ORDER = ["community", "pro", "enterprise", "gov"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Look up active subscription for this user
    const subs = await base44.asServiceRole.entities.Subscription.filter({ user_email: user.email });
    const trialSignups = await base44.asServiceRole.entities.TrialSignup.filter({ email: user.email });

    let tier = "community";
    let status = "none";
    let trialExpiresAt = null;

    // First check user's own subscription_tier field (set by admin)
    if (user.subscription_tier && user.subscription_tier !== "community") {
      tier = user.subscription_tier;
      status = "active";
    } else if (subs && subs.length > 0) {
      const activeSub = subs.find(s => s.status === "active" || s.status === "trialing");
      if (activeSub) {
        tier = activeSub.tier;
        status = activeSub.status;
        trialExpiresAt = activeSub.trial_ends_at || null;
      }
    } else if (trialSignups && trialSignups.length > 0) {
      // Fall back to TrialSignup record
      const ts = trialSignups[0];
      if (ts.status === "approved" || ts.status === "pending") {
        tier = ts.tier;
        status = "trialing";
        trialExpiresAt = ts.trial_expires || null;
      }
    }

    // Also: admin/superuser roles always get gov tier
    if (user.role === "admin" || user.role === "superuser") {
      tier = "gov";
      status = status === "none" ? "active" : status;
    }

    // Check if trial is expired
    if (status === "trialing" && trialExpiresAt && new Date(trialExpiresAt) < new Date()) {
      tier = "community";
      status = "expired";
    }

    // Check if requesting access to a specific channel/tier
    const body = await req.json().catch(() => ({}));
    const { required_tier } = body;

    let hasAccess = true;
    if (required_tier) {
      const userTierIndex = TIER_ORDER.indexOf(tier);
      const requiredIndex = TIER_ORDER.indexOf(required_tier);
      hasAccess = userTierIndex >= requiredIndex;
    }

    return Response.json({ tier, status, trialExpiresAt, hasAccess });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});