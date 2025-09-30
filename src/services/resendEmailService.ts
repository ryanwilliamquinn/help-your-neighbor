import { Resend } from 'resend';
import type { EmailService, EmailTemplate } from './emailService';
import type { EmailDigest, Request, User, Group } from '../types';
import { getEnvVar } from '../utils/env';

export class ResendEmailService implements EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    const apiKey = getEnvVar('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    this.resend = new Resend(apiKey);
    this.fromEmail = getEnvVar('FROM_EMAIL') || 'noreply@your-domain.com';
  }

  async sendInvitationEmail(
    recipientEmail: string,
    inviterName: string,
    group: Group,
    inviteToken: string
  ): Promise<string> {
    const template = this.generateInvitationTemplate(
      recipientEmail,
      inviterName,
      group,
      inviteToken
    );

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: recipientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      return data?.id || 'sent';
    } catch (error) {
      console.error('Failed to send invitation email via Resend:', error);
      throw error;
    }
  }

  async sendDailyDigest(digest: EmailDigest): Promise<string> {
    const template = this.generateDailyDigestTemplate(digest);

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: digest.user.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      return data?.id || 'sent';
    } catch (error) {
      console.error('Failed to send daily digest via Resend:', error);
      throw error;
    }
  }

  async sendImmediateNotification(
    request: Request,
    recipients: User[]
  ): Promise<string> {
    const template = this.generateImmediateNotificationTemplate(request);

    try {
      const recipientEmails = recipients.map((user) => user.email);
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: recipientEmails,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      return data?.id || 'sent';
    } catch (error) {
      console.error('Failed to send immediate notification via Resend:', error);
      throw error;
    }
  }

  async sendTestEmail(
    to: string,
    subject: string,
    content: string
  ): Promise<string> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html: `<p>${content}</p>`,
        text: content,
      });

      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      return data?.id || 'sent';
    } catch (error) {
      console.error('Failed to send test email via Resend:', error);
      throw error;
    }
  }

  private generateInvitationTemplate(
    recipientEmail: string,
    inviterName: string,
    group: Group,
    inviteToken: string
  ): EmailTemplate {
    const appUrl = getEnvVar('APP_URL') || 'http://localhost:5173';
    const joinUrl = `${appUrl}/join/${inviteToken}`;

    const subject = `${inviterName} invited you to join "${group.name}"`;

    const html = `
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
                "${group.name}"
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
                Join "${group.name}" →
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

    const text = `
${subject}

Hi there!

${inviterName} has invited you to join the "${group.name}" group on A Cup of Sugar.

A Cup of Sugar is a community platform where neighbors help each other with everyday needs. You can request items you need or offer help to others in your group.

To accept this invitation and join "${group.name}", visit:
${joinUrl}

Note: This invitation will expire in 7 days.

If you have any questions, feel free to reach out to ${inviterName}.

Best regards,
The A Cup of Sugar Team

---
This email was sent to ${recipientEmail}
© ${new Date().getFullYear()} A Cup of Sugar
    `.trim();

    return { subject, html, text };
  }

  private generateDailyDigestTemplate(digest: EmailDigest): EmailTemplate {
    const subject = `Daily Digest: ${digest.openRequests.length} new request${digest.openRequests.length === 1 ? '' : 's'} in your groups`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
              Daily Digest
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
              ${new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">

            <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 20px;">
              New Requests (${digest.openRequests.length})
            </h2>

            ${digest.openRequests
              .map(
                (request: Request) => `
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 15px 0; background: #f7fafc;">
                <h3 style="margin: 0 0 10px 0; color: #2d3748; font-size: 16px;">
                  ${request.itemDescription}
                </h3>
                <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px;">
                  <strong>Store:</strong> ${request.storePreference || 'Any store'}
                </p>
                <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px;">
                  <strong>Needed by:</strong> ${new Date(request.neededBy).toLocaleDateString()}
                </p>
                ${
                  request.pickupNotes
                    ? `
                  <p style="margin: 0; color: #4a5568; font-size: 14px;">
                    <strong>Notes:</strong> ${request.pickupNotes}
                  </p>
                `
                    : ''
                }
              </div>
            `
              )
              .join('')}

          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #a0aec0; font-size: 12px;">
            <p style="margin: 0;">
              © ${new Date().getFullYear()} A Cup of Sugar
            </p>
          </div>

        </body>
      </html>
    `;

    const text = `
${subject}

${new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})}

NEW REQUESTS (${digest.openRequests.length}):

${digest.openRequests
  .map(
    (request: Request) => `
• ${request.itemDescription}
  Store: ${request.storePreference || 'Any store'}
  Needed by: ${new Date(request.neededBy).toLocaleDateString()}
  ${request.pickupNotes ? `Notes: ${request.pickupNotes}` : ''}
`
  )
  .join('\n')}

---
© ${new Date().getFullYear()} A Cup of Sugar
    `.trim();

    return { subject, html, text };
  }

  private generateImmediateNotificationTemplate(
    request: Request
  ): EmailTemplate {
    const subject = `New Request: ${request.itemDescription}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
              New Request Alert 🚨
            </h1>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">

            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; background: #f7fafc;">
              <h2 style="margin: 0 0 15px 0; color: #2d3748; font-size: 20px;">
                ${request.itemDescription}
              </h2>
              <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 16px;">
                <strong>Store Preference:</strong> ${request.storePreference || 'Any store'}
              </p>
              <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 16px;">
                <strong>Needed by:</strong> ${new Date(request.neededBy).toLocaleDateString()}
              </p>
              ${
                request.pickupNotes
                  ? `
                <p style="margin: 10px 0 0 0; color: #4a5568; font-size: 16px;">
                  <strong>Pickup Notes:</strong> ${request.pickupNotes}
                </p>
              `
                  : ''
              }
            </div>

            <p style="text-align: center; margin: 30px 0 20px 0; color: #4a5568; font-size: 16px;">
              Someone in your group needs help! Log in to A Cup of Sugar to claim this request.
            </p>

          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #a0aec0; font-size: 12px;">
            <p style="margin: 0;">
              © ${new Date().getFullYear()} A Cup of Sugar
            </p>
          </div>

        </body>
      </html>
    `;

    const text = `
${subject}

Someone in your group needs help!

ITEM NEEDED: ${request.itemDescription}
STORE PREFERENCE: ${request.storePreference || 'Any store'}
NEEDED BY: ${new Date(request.neededBy).toLocaleDateString()}
${request.pickupNotes ? `PICKUP NOTES: ${request.pickupNotes}` : ''}

Log in to A Cup of Sugar to claim this request and A Cup of Sugar.

---
© ${new Date().getFullYear()} A Cup of Sugar
    `.trim();

    return { subject, html, text };
  }
}
