// Netlify Function for password management
// Handles password setting for migrated customers and login authentication

export default async (request, context) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { action, email, password, token } = await request.json();

    switch (action) {
      case 'check-password-required':
        return await checkPasswordRequired(email);
      
      case 'set-password':
        return await setPassword(email, password);
      
      case 'verify-password':
        return await verifyPassword(email, password);
      
      case 'request-reset':
        return await requestPasswordReset(email);
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ 
      error: 'Authentication error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function checkPasswordRequired(email) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    // Check if customer exists in Stripe
    const response = await fetch(
      `https://api.stripe.com/v1/customers/search?query=email:'${encodeURIComponent(email)}'&limit=1`,
      {
        headers: { 'Authorization': `Bearer ${stripeKey}` }
      }
    );

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const customer = data.data[0];
      const isMigrated = customer.metadata?.migrated_from_wix === 'true';
      const hasPassword = customer.metadata?.has_password === 'true';

      return new Response(JSON.stringify({
        exists: true,
        needsPassword: isMigrated && !hasPassword,
        isMigrated: isMigrated,
        customerId: customer.id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      exists: false,
      needsPassword: false
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    throw new Error('Failed to check customer status');
  }
}

async function setPassword(email, password) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // Hash password (in production, use bcrypt or similar)
    const crypto = require('crypto');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Find customer
    const searchResponse = await fetch(
      `https://api.stripe.com/v1/customers/search?query=email:'${encodeURIComponent(email)}'&limit=1`,
      {
        headers: { 'Authorization': `Bearer ${stripeKey}` }
      }
    );

    const searchData = await searchResponse.json();

    if (!searchData.data || searchData.data.length === 0) {
      return new Response(JSON.stringify({ error: 'Customer not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const customerId = searchData.data[0].id;

    // Update customer metadata with password hash
    const updateResponse = await fetch(
      `https://api.stripe.com/v1/customers/${customerId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'metadata[password_hash]': passwordHash,
          'metadata[has_password]': 'true',
          'metadata[password_set_date]': new Date().toISOString()
        })
      }
    );

    if (!updateResponse.ok) {
      throw new Error('Failed to set password');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Password set successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    throw new Error('Failed to set password');
  }
}

async function verifyPassword(email, password) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    // Hash provided password
    const crypto = require('crypto');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Find customer
    const searchResponse = await fetch(
      `https://api.stripe.com/v1/customers/search?query=email:'${encodeURIComponent(email)}'&limit=1`,
      {
        headers: { 'Authorization': `Bearer ${stripeKey}` }
      }
    );

    const searchData = await searchResponse.json();

    if (!searchData.data || searchData.data.length === 0) {
      return new Response(JSON.stringify({ 
        valid: false,
        error: 'Customer not found'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const customer = searchData.data[0];
    const storedHash = customer.metadata?.password_hash;

    if (!storedHash) {
      return new Response(JSON.stringify({ 
        valid: false,
        needsPassword: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isValid = storedHash === passwordHash;

    return new Response(JSON.stringify({
      valid: isValid,
      customerId: isValid ? customer.id : null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    throw new Error('Failed to verify password');
  }
}

async function requestPasswordReset(email) {
  // In production, send email with reset link
  // For now, return success (customer can set new password)
  
  return new Response(JSON.stringify({
    success: true,
    message: 'Password reset instructions would be sent to email'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
