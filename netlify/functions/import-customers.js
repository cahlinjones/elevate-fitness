// Netlify Function to import customer data from Wix to Stripe
// This handles bulk customer migration including subscriptions and order history

export default async (request, context) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const adminKey = process.env.ADMIN_IMPORT_KEY; // Set this in Netlify to secure imports

    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const { customers, adminPassword } = await request.json();

    // Verify admin authorization
    if (adminPassword !== adminKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const results = {
      successful: [],
      failed: [],
      total: customers.length
    };

    // Process each customer
    for (const customer of customers) {
      try {
        // Check if customer already exists in Stripe
        const searchResponse = await fetch(
          `https://api.stripe.com/v1/customers/search?query=email:'${encodeURIComponent(customer.email)}'`,
          {
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
            },
          }
        );

        const searchData = await searchResponse.json();
        let stripeCustomerId;

        if (searchData.data && searchData.data.length > 0) {
          // Customer exists, use existing ID
          stripeCustomerId = searchData.data[0].id;
          results.successful.push({
            email: customer.email,
            status: 'existed',
            customerId: stripeCustomerId
          });
        } else {
          // Create new customer in Stripe
          const customerData = new URLSearchParams({
            email: customer.email,
            name: customer.name || '',
            phone: customer.phone || '',
            'metadata[wix_customer_id]': customer.wixId || '',
            'metadata[imported_date]': new Date().toISOString(),
            'metadata[migrated_from_wix]': 'true',
            'metadata[has_password]': 'false',
          });

          // Add address if provided
          if (customer.address) {
            if (customer.address.line1) customerData.append('address[line1]', customer.address.line1);
            if (customer.address.city) customerData.append('address[city]', customer.address.city);
            if (customer.address.state) customerData.append('address[state]', customer.address.state);
            if (customer.address.postal_code) customerData.append('address[postal_code]', customer.address.postal_code);
            if (customer.address.country) customerData.append('address[country]', customer.address.country);
          }

          const createResponse = await fetch('https://api.stripe.com/v1/customers', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: customerData,
          });

          if (!createResponse.ok) {
            throw new Error('Failed to create customer in Stripe');
          }

          const newCustomer = await createResponse.json();
          stripeCustomerId = newCustomer.id;

          results.successful.push({
            email: customer.email,
            status: 'created',
            customerId: stripeCustomerId
          });
        }

        // If customer has active subscription, create it in Stripe
        if (customer.subscription && customer.subscription.isActive) {
          await createSubscription(
            stripeSecretKey,
            stripeCustomerId,
            customer.subscription
          );
        }

        // Log historical orders as metadata (for reference)
        if (customer.orderHistory && customer.orderHistory.length > 0) {
          await logOrderHistory(
            stripeSecretKey,
            stripeCustomerId,
            customer.orderHistory
          );
        }

      } catch (error) {
        results.failed.push({
          email: customer.email,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      message: 'Import completed',
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Import error:', error);
    return new Response(JSON.stringify({
      error: 'Import failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Helper function to create subscription for migrated customer
async function createSubscription(stripeKey, customerId, subscription) {
  try {
    // Map Wix plan names to Stripe prices
    const planMapping = {
      'Individual Membership': { amount: 4900, name: 'Individual Membership' },
      'Family Membership': { amount: 12900, name: 'Family Membership' },
      'Premium Membership': { amount: 9900, name: 'Premium Membership' },
      'Senior Membership': { amount: 3500, name: 'Senior Membership' }
    };

    const plan = planMapping[subscription.planName];
    if (!plan) {
      console.log(`Unknown plan: ${subscription.planName}`);
      return;
    }

    // Create subscription with current period dates preserved
    const subData = new URLSearchParams({
      customer: customerId,
      'items[0][price_data][currency]': 'usd',
      'items[0][price_data][product_data][name]': plan.name,
      'items[0][price_data][unit_amount]': plan.amount,
      'items[0][price_data][recurring][interval]': 'month',
      'metadata[migrated_from_wix]': 'true',
      'metadata[original_start_date]': subscription.startDate || '',
    });

    // If renewal date provided, set billing cycle anchor
    if (subscription.nextRenewalDate) {
      const renewalTimestamp = Math.floor(new Date(subscription.nextRenewalDate).getTime() / 1000);
      subData.append('billing_cycle_anchor', renewalTimestamp);
      subData.append('proration_behavior', 'none');
    }

    const response = await fetch('https://api.stripe.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: subData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create subscription');
    }

    return await response.json();
  } catch (error) {
    console.error('Subscription creation error:', error);
    throw error;
  }
}

// Helper function to log historical orders
async function logOrderHistory(stripeKey, customerId, orders) {
  try {
    // Store order history in customer metadata (first 5 orders)
    const recentOrders = orders.slice(0, 5);
    const metadata = {};

    recentOrders.forEach((order, index) => {
      metadata[`order_${index + 1}_date`] = order.date;
      metadata[`order_${index + 1}_amount`] = order.amount;
      metadata[`order_${index + 1}_item`] = order.item;
    });

    const response = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(metadata),
    });

    return await response.json();
  } catch (error) {
    console.error('Order history logging error:', error);
    // Non-critical, so we don't throw
  }
}
