import type { EmailDigest, Request, User } from '../types';

export interface EmailService {
  sendDailyDigest(digest: EmailDigest): Promise<string>;
  sendImmediateNotification(
    request: Request,
    recipients: User[]
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
