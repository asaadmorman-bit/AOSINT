import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@15.8.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    const base44 = createClientFromRequest(req);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscription = session.subscription;
        const email = session.customer_details?.email;

        if (subscription) {
          const sub = await stripe.subscriptions.retrieve(subscription);
          
          await base44.asServiceRole.entities.Subscription.create({
            user_email: email,
            tier: sub.metadata?.tier || 'pro',
            stripe_customer_id: sub.customer,
            stripe_subscription_id: sub.id,
            stripe_payment_method_id: sub.default_payment_method,
            trial_starts_at: new Date(sub.trial_start * 1000).toISOString(),
            trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            status: sub.status,
            billing_period: sub.items.data[0]?.plan?.interval || 'monthly',
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const subs = await base44.asServiceRole.entities.Subscription.filter({ stripe_subscription_id: sub.id });
        
        if (subs.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const subs = await base44.asServiceRole.entities.Subscription.filter({ stripe_subscription_id: sub.id });
        
        if (subs.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subs = await base44.asServiceRole.entities.Subscription.filter({ stripe_customer_id: invoice.customer });
        
        if (subs.length > 0) {
          await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
            status: 'past_due',
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subs = await base44.asServiceRole.entities.Subscription.filter({ stripe_customer_id: invoice.customer });
        
        if (subs.length > 0 && subs[0].status === 'past_due') {
          await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
            status: 'active',
          });
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});