// Netlify Serverless Function to create Stripe Subscription for recurring payments
// This handles monthly memberships that auto-renew until canceled

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

    const { items, customerEmail } = await request.json();

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items in cart' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Map membership names to whether they're recurring
    const recurringMemberships = [
      'Individual Membership',
      'Family Membership', 
      'Premium Membership',
      'Senior Membership'
    ];

    // Separate one-time and recurring items
    const recurringItems = items.filter(item => 
      recurringMemberships.includes(item.name)
    );
    
    const oneTimeItems = items.filter(item => 
      !recurringMemberships.includes(item.name)
    );

    // If all items are one-time, use regular checkout
    if (recurringItems.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No recurring items',
        message: 'Use regular checkout for one-time purchases'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create Stripe Checkout Session with subscription mode
    const lineItems = recurringItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: `Elevate Fitness - ${item.name} (Recurring Monthly)`,
        },
        unit_amount: Math.round(item.price * 100),
        recurring: {
          interval: 'month',
          interval_count: 1,
        },
      },
      quantity: 1,
    }));

    // Add one-time items if any
    const oneTimeLineItems = oneTimeItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: `Elevate Fitness - ${item.name}`,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: 1,
    }));

    // Build form data for Stripe API
    const formData = new URLSearchParams({
      'success_url': `${request.headers.get('origin')}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${request.headers.get('origin')}/memberships.html`,
      'mode': recurringItems.length > 0 ? 'subscription' : 'payment',
      'allow_promotion_codes': 'true',
      'billing_address_collection': 'required',
    });

    // Add customer email if provided
    if (customerEmail) {
      formData.append('customer_email', customerEmail);
    }

    // Add line items
    [...lineItems, ...oneTimeLineItems].forEach((item, index) => {
      formData.append(`line_items[${index}][price_data][currency]`, item.price_data.currency);
      formData.append(`line_items[${index}][price_data][product_data][name]`, item.price_data.product_data.name);
      formData.append(`line_items[${index}][price_data][product_data][description]`, item.price_data.product_data.description);
      formData.append(`line_items[${index}][price_data][unit_amount]`, item.price_data.unit_amount);
      
      if (item.price_data.recurring) {
        formData.append(`line_items[${index}][price_data][recurring][interval]`, item.price_data.recurring.interval);
        formData.append(`line_items[${index}][price_data][recurring][interval_count]`, item.price_data.recurring.interval_count);
      }
      
      formData.append(`line_items[${index}][quantity]`, item.quantity);
    });

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.json();
      throw new Error(errorData.error?.message || 'Stripe API error');
    }

    const session = await stripeResponse.json();

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Stripe subscription error:', error);
    return new Response(JSON.stringify({ 
      error: 'Payment processing error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
