import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      businessName,
      niche,
      services,
      websiteUrl,
      currentProblems,
      phone,
    } = req.body;

    if (!firstName || !lastName || !email || !businessName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine recommended package based on services and website status
    let recommendation = {
      tier: 'Scale + Growth',
      price: '$1,850',
      reason: 'Based on your business needs, this package gives you everything to establish and grow your online presence.',
      stripeLink: null
    };

    // Simple logic to recommend package
    const hasEcommerce = services.includes('E-Commerce Store');
    const hasBranding = services.includes('Branding & Identity');
    const hasWebsite = websiteUrl && !websiteUrl.includes('starting fresh');

    if (hasBranding && hasEcommerce) {
      recommendation = {
        tier: 'Full Agency',
        price: '$4,500',
        reason: 'You need branding, e-commerce, and ongoing support. The Full Agency package handles everything with a dedicated manager.',
        stripeLink: null
      };
    } else if (!hasWebsite) {
      recommendation = {
        tier: 'Launch + Essentials',
        price: '$750',
        reason: 'Since you\'re starting fresh, this package gets you a professional website fast, then you can grow from there.',
        stripeLink: null
      };
    }

    // Save to Supabase
    const { error } = await supabase
      .from('quote_requests')
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone || null,
          business_name: businessName,
          industry_niche: niche || null,
          services: services,
          website_url: websiteUrl,
          has_website: websiteUrl && !websiteUrl.includes('starting fresh'),
          current_problems: currentProblems || null,
          recommended_package: recommendation.tier,
          status: 'new',
          source: 'website',
          submitted_at: new Date().toISOString(),
        }
      ]);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save quote request' });
    }

    console.log('Quote request saved:', { businessName, email, services });

    return res.status(200).json({
      success: true,
      message: 'Quote request received successfully',
      recommendation: recommendation
    });

  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
