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
import { ServerlessEmailService } from './serverlessEmailService';
import { isTest, isDevelopment } from '../utils/env';

function createEmailService(): EmailService {
  // In test environment, always use MockEmailService
  if (isTest()) {
    return new MockEmailService();
  }

  // In development, use MockEmailService for safety
  if (isDevelopment()) {
    return new MockEmailService();
  }

  // In production, use serverless email service
  try {
    return new ServerlessEmailService();
  } catch (error) {
    console.error('Failed to initialize serverless email service:', error);
    console.log('Falling back to MockEmailService');
    return new MockEmailService();
  }
}

// Export singleton instance
export const emailService: EmailService = createEmailService();

// Debug helper for development
export function getLastSentEmail() {
  if (emailService instanceof MockEmailService) {
    return emailService.getLastEmail();
  }
  return null;
}

// Helper to check which email service is being used
export function getEmailServiceType(): 'serverless' | 'mock' {
  // Need to import ServerlessEmailService for instanceof check
  return emailService instanceof ServerlessEmailService ? 'serverless' : 'mock';
}
