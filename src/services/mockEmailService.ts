import type { EmailService, EmailTemplate } from './emailService';
import type { EmailDigest, Request, User } from '../types';

export class MockEmailService implements EmailService {
  private emails: Array<{
    to: string | string[];
    subject: string;
    html: string;
    text: string;
    sentAt: Date;
    id: string;
  }> = [];

  async sendDailyDigest(digest: EmailDigest): Promise<string> {
    const template = this.generateDailyDigestTemplate(digest);
    const emailId = `mock-daily-${Date.now()}`;

    this.emails.push({
      to: digest.user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      sentAt: new Date(),
      id: emailId,
    });

    console.log(
      `[MockEmailService] Daily digest sent to ${digest.user.email}:`,
      template.subject
    );
    return emailId;
  }

  async sendImmediateNotification(
    request: Request,
    recipients: User[]
  ): Promise<string> {
    const template = this.generateImmediateNotificationTemplate(request);
    const emailId = `mock-immediate-${Date.now()}`;
    const recipientEmails = recipients.map((user) => user.email);

    this.emails.push({
      to: recipientEmails,
      subject: template.subject,
      html: template.html,
      text: template.text,
      sentAt: new Date(),
      id: emailId,
    });

    console.log(
      `[MockEmailService] Immediate notification sent to ${recipientEmails.length} recipients:`,
      template.subject
    );
    return emailId;
  }

  async sendTestEmail(
    to: string,
    subject: string,
    content: string
  ): Promise<string> {
    const emailId = `mock-test-${Date.now()}`;

    this.emails.push({
      to,
      subject,
      html: content,
      text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      sentAt: new Date(),
      id: emailId,
    });

    console.log(`[MockEmailService] Test email sent to ${to}:`, subject);
    return emailId;
  }

  // Helper methods for development/testing
  getSentEmails() {
    return [...this.emails];
  }

  getLastEmail() {
    return this.emails[this.emails.length - 1];
  }

  clearSentEmails() {
    this.emails = [];
  }

  private generateDailyDigestTemplate(digest: EmailDigest): EmailTemplate {
    const requestCount = digest.openRequests.length;
    const subject = `Your Help Your Neighbor Daily Update - ${requestCount} Open Request${requestCount !== 1 ? 's' : ''}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Your Daily Help Your Neighbor Update</h2>
        <p>Hi ${digest.user.name},</p>
        <p>You have ${requestCount} open request${requestCount !== 1 ? 's' : ''} in your groups:</p>

        ${digest.openRequests
          .map(
            (request) => `
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <h4 style="margin: 0 0 8px 0; color: #374151;">${request.itemDescription}</h4>
            ${request.storePreference ? `<p style="margin: 4px 0; color: #6b7280;"><strong>Store:</strong> ${request.storePreference}</p>` : ''}
            <p style="margin: 4px 0; color: #6b7280;"><strong>Needed by:</strong> ${new Date(request.neededBy).toLocaleDateString()}</p>
            ${request.pickupNotes ? `<p style="margin: 4px 0; color: #6b7280;"><strong>Notes:</strong> ${request.pickupNotes}</p>` : ''}
          </div>
        `
          )
          .join('')}

        <div style="text-align: center; margin: 32px 0;">
          <a href="${digest.dashboardUrl}"
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Dashboard
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          You're receiving this because you opted in to daily email updates.
          You can change your email preferences in your profile settings.
        </p>
      </div>
    `;

    const text = `
Your Daily Help Your Neighbor Update

Hi ${digest.user.name},

You have ${requestCount} open request${requestCount !== 1 ? 's' : ''} in your groups:

${digest.openRequests
  .map(
    (request) => `
• ${request.itemDescription}
  ${request.storePreference ? `Store: ${request.storePreference}` : ''}
  Needed by: ${new Date(request.neededBy).toLocaleDateString()}
  ${request.pickupNotes ? `Notes: ${request.pickupNotes}` : ''}
`
  )
  .join('\n')}

View your dashboard: ${digest.dashboardUrl}

You're receiving this because you opted in to daily email updates.
You can change your email preferences in your profile settings.
    `;

    return { subject, html, text };
  }

  private generateImmediateNotificationTemplate(
    request: Request
  ): EmailTemplate {
    const groupName = 'Your Group'; // Would get actual group name in real implementation
    const subject = `New Request in ${groupName}: ${request.itemDescription}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Help Request</h2>
        <p>A new request has been posted in ${groupName}:</p>

        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; background-color: #f9fafb;">
          <h3 style="margin: 0 0 12px 0; color: #374151;">${request.itemDescription}</h3>
          ${request.storePreference ? `<p style="margin: 8px 0; color: #6b7280;"><strong>Store:</strong> ${request.storePreference}</p>` : ''}
          <p style="margin: 8px 0; color: #6b7280;"><strong>Needed by:</strong> ${new Date(request.neededBy).toLocaleDateString()}</p>
          ${request.pickupNotes ? `<p style="margin: 8px 0; color: #6b7280;"><strong>Notes:</strong> ${request.pickupNotes}</p>` : ''}
          <p style="margin: 8px 0; color: #6b7280;"><strong>Requested by:</strong> ${request.creator?.name || 'Someone'}</p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.VITE_DASHBOARD_BASE_URL || 'http://localhost:5173'}"
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 16px;">
            Claim Request
          </a>
          <a href="${process.env.VITE_DASHBOARD_BASE_URL || 'http://localhost:5173'}"
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Dashboard
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
          You're receiving this because you opted in to immediate email notifications.
          You can change your email preferences in your profile settings.
        </p>
      </div>
    `;

    const text = `
New Help Request in ${groupName}

${request.itemDescription}
${request.storePreference ? `Store: ${request.storePreference}` : ''}
Needed by: ${new Date(request.neededBy).toLocaleDateString()}
${request.pickupNotes ? `Notes: ${request.pickupNotes}` : ''}
Requested by: ${request.creator?.name || 'Someone'}

View your dashboard: ${process.env.VITE_DASHBOARD_BASE_URL || 'http://localhost:5173'}

You're receiving this because you opted in to immediate email notifications.
You can change your email preferences in your profile settings.
    `;

    return { subject, html, text };
  }
}
