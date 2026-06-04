export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, subject, message } = req.body;

  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    console.log('Contact submission:', { firstName, lastName, email, subject, message });

    return res.status(200).json({
      success: true,
      message: 'Message received! We\'ll get back to you within 48 hours.'
    });
  } catch (error) {
    console.error('Contact error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
