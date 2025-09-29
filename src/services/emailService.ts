import type { EmailDigest, Request, User, Group } from '../types';

export interface EmailService {
  sendDailyDigest(digest: EmailDigest): Promise<string>;
  sendImmediateNotification(
    request: Request,
    recipients: User[]
  ): Promise<string>;
  sendInvitationEmail(
    recipientEmail: string,
    inviterName: string,
    group: Group,
    inviteToken: string
  ): Promise<string>;
  sendTestEmail(to: string, subject: string, content: string): Promise<string>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

// Email service factory
import { MockEmailService } from './mockEmailService';

function createEmailService(): EmailService {
  // For now, always use MockEmailService
  // In the future, this could check environment variables to use real email providers
  return new MockEmailService();
}

// Export singleton instance
export const emailService: EmailService = createEmailService();
