// Vercel Serverless Function for handling feedback emails
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface FeedbackRequest {
  subject: string;
  message: string;
  email: string;
  name: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subject, message, email, name }: FeedbackRequest = req.body;

    // Validate required fields
    if (!message || !email) {
      return res.status(400).json({ error: 'Message and email are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Prepare email content
    const emailSubject = subject
      ? `A Cup of Sugar Feedback: ${subject}`
      : 'A Cup of Sugar Feedback';

    const emailContent = `
New feedback received from A Cup of Sugar:

From: ${name || 'Anonymous'} (${email})
Subject: ${subject || 'General Feedback'}

Message:
${message}

---
Sent from A Cup of Sugar Feedback Form
Time: ${new Date().toISOString()}
    `.trim();

    // Use Resend API to send email
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'A Cup of Sugar <noreply@acupofsugar.org>',
        to: ['admin@acupofsugar.org'],
        subject: emailSubject,
        text: emailContent,
        reply_to: email, // Allow replying directly to the user
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Resend API error:', errorData);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    const result = await emailResponse.json();
    console.log('Email sent successfully:', result);

    return res.status(200).json({
      success: true,
      message: 'Feedback sent successfully',
    });
  } catch (error) {
    console.error('Feedback API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
