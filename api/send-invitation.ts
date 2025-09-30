import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recipientEmail, inviterName, groupName, inviteToken } = req.body;

    // Validate required fields
    if (!recipientEmail || !inviterName || !groupName || !inviteToken) {
      return res.status(400).json({
        error:
          'Missing required fields: recipientEmail, inviterName, groupName, inviteToken',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Get environment variables
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || 'noreply@acupofsugar.org';
    const appUrl = process.env.APP_URL || 'https://acupofsugar.org';

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Create invitation email content
    const joinUrl = `${appUrl}/join/${inviteToken}`;
    const subject = `${inviterName} invited you to join "${groupName}"`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
              You're Invited! 🎉
            </h1>
          </div>

          <div style="background: white; padding: 40px 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">

            <div style="text-align: center; margin-bottom: 30px;">
              <p style="font-size: 18px; margin: 0 0 10px 0; color: #2d3748;">
                <strong>${inviterName}</strong> has invited you to join
              </p>
              <h2 style="color: #667eea; margin: 0; font-size: 24px; font-weight: 600;">
                "${groupName}"
              </h2>
            </div>

            <div style="background: #f7fafc; padding: 25px; border-radius: 8px; border-left: 4px solid #667eea; margin: 30px 0;">
              <h3 style="margin: 0 0 15px 0; color: #2d3748; font-size: 18px;">
                What is A Cup of Sugar?
              </h3>
              <p style="margin: 0; color: #4a5568; line-height: 1.6;">
                A Cup of Sugar is a community platform where neighbors help each other with everyday needs.
                Request items you need or offer help to others in your group.
              </p>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${joinUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                Join "${groupName}" →
              </a>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 30px; margin-top: 30px;">
              <p style="color: #718096; font-size: 14px; text-align: center; margin: 0 0 15px 0;">
                <strong>Note:</strong> This invitation will expire in 7 days.
              </p>
              <p style="color: #718096; font-size: 14px; text-align: center; margin: 0;">
                If you can't click the button above, copy and paste this link into your browser:<br>
                <span style="word-break: break-all; color: #667eea;">${joinUrl}</span>
              </p>
            </div>

          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #a0aec0; font-size: 12px;">
            <p style="margin: 0;">
              This email was sent to ${recipientEmail}
            </p>
            <p style="margin: 5px 0 0 0;">
              © ${new Date().getFullYear()} A Cup of Sugar
            </p>
          </div>

        </body>
      </html>
    `;

    const textContent = `
${subject}

Hi there!

${inviterName} has invited you to join the "${groupName}" group on A Cup of Sugar.

A Cup of Sugar is a community platform where neighbors help each other with everyday needs. You can request items you need or offer help to others in your group.

To accept this invitation and join "${groupName}", visit:
${joinUrl}

Note: This invitation will expire in 7 days.

If you have any questions, feel free to reach out to ${inviterName}.

Best regards,
The A Cup of Sugar Team

---
This email was sent to ${recipientEmail}
© ${new Date().getFullYear()} A Cup of Sugar
    `.trim();

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `A Cup of Sugar <${fromEmail}>`,
        to: [recipientEmail],
        subject: subject,
        html: htmlContent,
        text: textContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Resend API error:', errorData);
      return res.status(500).json({ error: 'Failed to send invitation email' });
    }

    const emailResult = await emailResponse.json();
    console.log('Invitation email sent successfully:', emailResult.id);

    return res.status(200).json({
      success: true,
      message: 'Invitation email sent successfully',
      emailId: emailResult.id,
    });
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
