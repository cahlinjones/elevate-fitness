// Netlify Serverless Function to create Stripe Checkout Session
// This runs on Netlify's servers, keeping your Stripe secret key safe

export default async (request, context) => {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get the Stripe secret key from environment variables (set in Netlify dashboard)
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    // Parse the request body to get cart items
    const { items } = await request.json();

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items in cart' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert cart items to Stripe line items format
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: `Elevate FitX - ${item.name}`,
        },
        unit_amount: Math.round(item.price * 100), // Convert dollars to cents
      },
      quantity: 1,
    }));

    // Create Stripe Checkout Session
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'success_url': `${request.headers.get('origin')}/success.html`,
        'cancel_url': `${request.headers.get('origin')}/memberships.html`,
        'mode': 'payment',
        ...Object.fromEntries(
          lineItems.flatMap((item, index) => [
            [`line_items[${index}][price_data][currency]`, item.price_data.currency],
            [`line_items[${index}][price_data][product_data][name]`, item.price_data.product_data.name],
            [`line_items[${index}][price_data][product_data][description]`, item.price_data.product_data.description],
            [`line_items[${index}][price_data][unit_amount]`, item.price_data.unit_amount],
            [`line_items[${index}][quantity]`, item.quantity],
          ])
        ),
      }),
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.json();
      throw new Error(errorData.error?.message || 'Stripe API error');
    }

    const session = await stripeResponse.json();

    // Return the checkout URL to redirect the user to Stripe
    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return new Response(JSON.stringify({ 
      error: 'Payment processing error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
