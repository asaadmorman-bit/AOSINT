import Stripe from 'npm:stripe@14.0.0';

/**
 * Syncs ASOSINT pricing tiers to Stripe products and prices
 * Run this once to create/update Stripe products based on website pricing
 */

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') || '');

Deno.serve(async (req) => {
  try {
    // Pricing from website (pages/Pricing.jsx)
    const pricingConfig = [
      {
        name: 'Community',
        description: 'Free forever - No credit card needed',
        monthlyPrice: 0,
        annualPrice: 0,
        tier: 'community',
      },
      {
        name: 'Pro',
        description: 'Most popular - $79/month per user or $948/year (save 20%)',
        monthlyPrice: 7900, // $79 in cents
        annualPrice: 948_00, // $948 in cents
        tier: 'pro',
      },
      {
        name: 'Enterprise',
        description: '$1,200/month or $14,400/year (save 20%)',
        monthlyPrice: 120_000, // $1,200 in cents
        annualPrice: 1_440_000, // $14,400 in cents
        tier: 'enterprise',
      },
      {
        name: 'Gov / CI',
        description: '$5,000/month or $55,000/year (customizable for agency needs)',
        monthlyPrice: 500_000, // $5,000 in cents
        annualPrice: 5_500_000, // $55,000 in cents (customizable)
        tier: 'gov',
      },
    ];

    const results = {
      created: [],
      updated: [],
      skipped: [],
      errors: [],
    };

    for (const config of pricingConfig) {
      try {
        // Find or create product
        const productList = await stripe.products.list({ limit: 100 });
        let product = productList.data.find(p => p.metadata.tier === config.tier);

        if (!product) {
          product = await stripe.products.create({
            name: `ASOSINT ${config.name}`,
            description: config.description,
            type: 'service',
            metadata: {
              tier: config.tier,
              asosint_tier: config.tier,
            },
          });
          results.created.push({ type: 'product', name: product.name, id: product.id });
        } else {
          results.updated.push({ type: 'product', name: product.name, id: product.id });
        }

        // Skip free tier pricing in Stripe (no payment needed)
        if (config.monthlyPrice === 0 && config.annualPrice === 0) {
          results.skipped.push({ tier: config.tier, reason: 'Free tier - no Stripe pricing needed' });
          continue;
        }

        // Create monthly price
        if (config.monthlyPrice > 0) {
          const priceList = await stripe.prices.list({
            product: product.id,
            type: 'recurring',
            recurring: { interval: 'month' },
            limit: 10,
          });

          let monthlyPrice = priceList.data.find(p => p.recurring?.interval === 'month' && !p.recurring?.interval_count);

          if (!monthlyPrice) {
            monthlyPrice = await stripe.prices.create({
              product: product.id,
              unit_amount: config.monthlyPrice,
              currency: 'usd',
              recurring: {
                interval: 'month',
              },
              metadata: {
                billing_cycle: 'monthly',
              },
            });
            results.created.push({ type: 'price', interval: 'monthly', tier: config.tier, id: monthlyPrice.id });
          }
        }

        // Create annual price (if applicable)
        if (config.annualPrice && config.annualPrice > 0) {
          const priceList = await stripe.prices.list({
            product: product.id,
            type: 'recurring',
            recurring: { interval: 'year' },
            limit: 10,
          });

          let annualPrice = priceList.data.find(p => p.recurring?.interval === 'year');

          if (!annualPrice) {
            annualPrice = await stripe.prices.create({
              product: product.id,
              unit_amount: config.annualPrice,
              currency: 'usd',
              recurring: {
                interval: 'year',
              },
              metadata: {
                billing_cycle: 'annual',
                savings: '20%',
              },
            });
            results.created.push({ type: 'price', interval: 'annual', tier: config.tier, id: annualPrice.id });
          }
        }
      } catch (e) {
        results.errors.push({ tier: config.tier, error: e.message });
      }
    }

    return Response.json({
      success: results.errors.length === 0,
      message: `Stripe products synced successfully`,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});