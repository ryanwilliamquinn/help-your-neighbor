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
import { ResendEmailService } from './resendEmailService';
import { getEnvVar, isTest } from '../utils/env';

function createEmailService(): EmailService {
  // In test environment, always use MockEmailService
  if (isTest()) {
    return new MockEmailService();
  }

  // Check if Resend is configured
  const resendApiKey = getEnvVar('RESEND_API_KEY');

  if (resendApiKey) {
    try {
      return new ResendEmailService();
    } catch (error) {
      console.error('Failed to initialize Resend email service:', error);
      console.log('Falling back to MockEmailService');
    }
  }

  // Fallback to MockEmailService for development
  return new MockEmailService();
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
export function getEmailServiceType(): 'resend' | 'mock' {
  return emailService instanceof ResendEmailService ? 'resend' : 'mock';
}
