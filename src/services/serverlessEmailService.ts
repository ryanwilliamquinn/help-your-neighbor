import type { EmailService } from './emailService';
import type { EmailDigest, Request, User, Group } from '../types';

export class ServerlessEmailService implements EmailService {
  private baseUrl: string;

  constructor() {
    // Use the same domain as the app, or fallback to localhost for development
    if (typeof window !== 'undefined') {
      this.baseUrl = window.location.origin;
    } else {
      this.baseUrl = 'http://localhost:3000'; // fallback for SSR
    }
  }

  async sendInvitationEmail(
    recipientEmail: string,
    inviterName: string,
    group: Group,
    inviteToken: string
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/send-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail,
          inviterName,
          groupName: group.name,
          inviteToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return result.emailId || 'sent';
    } catch (error) {
      console.error(
        'Failed to send invitation email via serverless function:',
        error
      );
      throw error;
    }
  }

  async sendDailyDigest(digest: EmailDigest): Promise<string> {
    // For now, fall back to console logging
    // You could create another serverless function for daily digests
    console.log('Daily digest would be sent:', {
      user: digest.user.email,
      requestCount: digest.openRequests.length,
    });
    return 'digest-logged';
  }

  async sendImmediateNotification(
    request: Request,
    recipients: User[]
  ): Promise<string> {
    // For now, fall back to console logging
    // You could create another serverless function for immediate notifications
    console.log('Immediate notification would be sent:', {
      request: request.itemDescription,
      recipientCount: recipients.length,
    });
    return 'notification-logged';
  }

  async sendTestEmail(
    to: string,
    subject: string,
    content: string
  ): Promise<string> {
    // Simple test email - could use a generic serverless endpoint
    console.log('Test email would be sent:', { to, subject, content });
    return 'test-logged';
  }
}
