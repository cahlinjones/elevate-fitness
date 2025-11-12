// Netlify Serverless Function to create Stripe Customer Portal session
// This allows customers to manage/cancel their subscriptions themselves

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
        error: 'No customer found with this email'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const customerId = customersData.data[0].id;

    // Create billing portal session
    const portalResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'customer': customerId,
        'return_url': `${request.headers.get('origin')}/dashboard.html`,
      }),
    });

    if (!portalResponse.ok) {
      const errorData = await portalResponse.json();
      throw new Error(errorData.error?.message || 'Failed to create portal session');
    }

    const portalData = await portalResponse.json();

    return new Response(JSON.stringify({ 
      url: portalData.url
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Customer portal error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create customer portal session',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
