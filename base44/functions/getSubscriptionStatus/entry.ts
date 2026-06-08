import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await base44.entities.Subscription.filter({ user_email: user.email });
    
    if (subscriptions.length === 0) {
      return Response.json({ 
        tier: 'community',
        status: 'none',
        trial_active: false,
        message: 'No active subscription'
      });
    }

    const sub = subscriptions[0];
    const now = new Date();
    const trialEndsAt = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
    const trialActive = trialEndsAt && now < trialEndsAt;

    return Response.json({
      tier: sub.tier,
      status: sub.status,
      billing_period: sub.billing_period,
      trial_active: trialActive,
      trial_days_remaining: trialActive ? Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24)) : 0,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      cancel_at_period_end: sub.cancel_at_period_end,
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});