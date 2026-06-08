import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@15.8.0';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'));

const PRICING = {
  pro: { monthly: 7900, annual: 94800 },
  enterprise: { monthly: 120000, annual: 1440000 },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier, billingPeriod } = await req.json();

    if (!PRICING[tier]) {
      return Response.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Check existing subscription
    let subscription = await base44.entities.Subscription.filter({ user_email: user.email });
    let stripeCustomerId = subscription[0]?.stripe_customer_id;

    // Create or get Stripe customer
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: { user_email: user.email },
      });
      stripeCustomerId = customer.id;
    }

    const amount = PRICING[tier][billingPeriod];
    const recurringInterval = billingPeriod === 'monthly' ? 'month' : 'year';

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Subscription`,
              metadata: { tier, billingPeriod },
            },
            unit_amount: amount,
            recurring: {
              interval: recurringInterval,
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: { tier, user_email: user.email },
      },
      success_url: `${req.headers.get('origin')}/Dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/Pricing`,
    });

    return Response.json({ session_id: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});