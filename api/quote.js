module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, businessName, email, phone, niche, services, websiteUrl, currentProblems } = req.body;

    if (!firstName || !lastName || !email || !niche) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Quote request:', { firstName, lastName, businessName, email, niche, services });

    const tierMap = {
      'restaurant': { tier: 'Professional', price: '$2,500 - $4,500' },
      'law': { tier: 'Enterprise', price: '$5,000 - $10,000' },
      'fitness': { tier: 'Professional', price: '$2,500 - $4,500' },
      'beauty': { tier: 'Starter', price: '$1,500 - $3,000' },
      'realestate': { tier: 'Enterprise', price: '$5,000 - $10,000' },
      'health': { tier: 'Enterprise', price: '$5,000 - $10,000' },
      'tech': { tier: 'Enterprise', price: '$8,000 - $15,000' },
      'retail': { tier: 'Professional', price: '$3,000 - $5,500' },
      'default': { tier: 'Professional', price: '$2,500 - $4,500' }
    };

    const tier = tierMap[niche] || tierMap['default'];

    return res.status(200).json({
      success: true,
      recommendation: {
        tier: tier.tier,
        price: tier.price,
        reason: `Based on your ${niche} business needs with ${services} services.`
      }
    });
  } catch (error) {
    console.error('Quote error:', error);
    return res.status(500).json({ error: 'Failed to generate quote', details: error.message });
  }
};
