// Netlify Serverless Function to get customer subscription info
// This allows logged-in users to view their active memberships

export default async (request, context) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const { customerEmail } = await request.json();

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: 'Customer email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Search for customer by email
    const customersResponse = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(customerEmail)}&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      }
    );

    if (!customersResponse.ok) {
      throw new Error('Failed to fetch customer');
    }

    const customersData = await customersResponse.json();

    if (customersData.data.length === 0) {
      return new Response(JSON.stringify({ 
        subscriptions: [],
        payments: [],
        message: 'No customer found with this email'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const customerId = customersData.data[0].id;

    // Get active subscriptions
    const subscriptionsResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active`,
      {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      }
    );

    // Get payment history
    const paymentsResponse = await fetch(
      `https://api.stripe.com/v1/charges?customer=${customerId}&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      }
    );

    const subscriptionsData = await subscriptionsResponse.json();
    const paymentsData = await paymentsResponse.json();

    // Format subscription data
    const subscriptions = subscriptionsData.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      planName: sub.items.data[0]?.price?.product?.name || 'Membership',
      amount: sub.items.data[0]?.price?.unit_amount / 100,
      interval: sub.items.data[0]?.price?.recurring?.interval,
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toLocaleDateString(),
      nextBillingDate: new Date(sub.current_period_end * 1000).toLocaleDateString(),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    }));

    // Format payment history
    const payments = paymentsData.data.map(charge => ({
      id: charge.id,
      amount: charge.amount / 100,
      date: new Date(charge.created * 1000).toLocaleDateString(),
      description: charge.description || 'Payment',
      status: charge.status,
      receiptUrl: charge.receipt_url,
    }));

    return new Response(JSON.stringify({ 
      subscriptions,
      payments,
      customerName: customersData.data[0].name || customerEmail,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get customer info error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to retrieve customer information',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
