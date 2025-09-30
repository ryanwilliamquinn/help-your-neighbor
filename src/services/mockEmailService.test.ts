import { MockEmailService } from './mockEmailService';
import type { EmailDigest, Request, User } from '../types';

// Mock console.log to avoid test output noise
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

const mockUser: User = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Test User',
  phone: '555-1234',
  generalArea: 'Test Area',
  isAdmin: false,
  createdAt: new Date('2024-01-01'),
};

const mockRequest: Request = {
  id: 'request-1',
  userId: 'user-1',
  groupId: 'group-1',
  itemDescription: 'Test groceries',
  storePreference: 'Whole Foods',
  neededBy: new Date('2024-01-15'),
  pickupNotes: 'Front door delivery',
  status: 'open',
  createdAt: new Date('2024-01-01'),
};

const mockDigest: EmailDigest = {
  user: mockUser,
  openRequests: [mockRequest],
  dashboardUrl: 'https://example.com/dashboard',
};

describe('MockEmailService', () => {
  let emailService: MockEmailService;

  beforeEach(() => {
    emailService = new MockEmailService();
    emailService.clearSentEmails();
    jest.clearAllMocks();
  });

  describe('sendDailyDigest', () => {
    it('sends a daily digest email', async () => {
      const emailId = await emailService.sendDailyDigest(mockDigest);

      expect(emailId).toMatch(/^mock-daily-\d+$/);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[MockEmailService] Daily digest sent to user@example.com:',
        'Your A Cup of Sugar Daily Update - 1 Open Request'
      );

      const sentEmails = emailService.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      const sentEmail = sentEmails[0];
      expect(sentEmail.to).toBe('user@example.com');
      expect(sentEmail.subject).toBe(
        'Your A Cup of Sugar Daily Update - 1 Open Request'
      );
      expect(sentEmail.html).toContain('Test groceries');
      expect(sentEmail.html).toContain('Whole Foods');
      expect(sentEmail.html).toContain('Front door delivery');
      expect(sentEmail.text).toContain('Test groceries');
      expect(sentEmail.id).toBe(emailId);
    });

    it('handles multiple requests in digest', async () => {
      const multipleRequestsDigest: EmailDigest = {
        ...mockDigest,
        openRequests: [
          mockRequest,
          {
            ...mockRequest,
            id: 'request-2',
            itemDescription: 'Pharmacy items',
            storePreference: 'CVS',
          },
        ],
      };

      const emailId = await emailService.sendDailyDigest(
        multipleRequestsDigest
      );

      expect(emailId).toMatch(/^mock-daily-\d+$/);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[MockEmailService] Daily digest sent to user@example.com:',
        'Your A Cup of Sugar Daily Update - 2 Open Requests'
      );

      const sentEmails = emailService.getSentEmails();
      const sentEmail = sentEmails[0];
      expect(sentEmail.html).toContain('Test groceries');
      expect(sentEmail.html).toContain('Pharmacy items');
      expect(sentEmail.html).toContain('Whole Foods');
      expect(sentEmail.html).toContain('CVS');
    });

    it('handles singular vs plural in subject line', async () => {
      // Test single request
      await emailService.sendDailyDigest(mockDigest);
      let sentEmails = emailService.getSentEmails();
      expect(sentEmails[0].subject).toBe(
        'Your A Cup of Sugar Daily Update - 1 Open Request'
      );

      emailService.clearSentEmails();

      // Test multiple requests
      const multipleRequestsDigest: EmailDigest = {
        ...mockDigest,
        openRequests: [mockRequest, { ...mockRequest, id: 'request-2' }],
      };
      const emailId = await emailService.sendDailyDigest(
        multipleRequestsDigest
      );
      expect(emailId).toMatch(/^mock-daily-\d+$/);
      sentEmails = emailService.getSentEmails();
      expect(sentEmails[0].subject).toBe(
        'Your A Cup of Sugar Daily Update - 2 Open Requests'
      );
    });
  });

  describe('sendImmediateNotification', () => {
    it('sends immediate notification to multiple recipients', async () => {
      const recipients: User[] = [
        mockUser,
        {
          ...mockUser,
          id: 'user-2',
          email: 'user2@example.com',
          name: 'Test User 2',
        },
      ];

      const emailId = await emailService.sendImmediateNotification(
        mockRequest,
        recipients
      );

      expect(emailId).toMatch(/^mock-immediate-\d+$/);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[MockEmailService] Immediate notification sent to 2 recipients:',
        'New Request in Your Group: Test groceries'
      );

      const sentEmails = emailService.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      const sentEmail = sentEmails[0];
      expect(sentEmail.to).toEqual(['user@example.com', 'user2@example.com']);
      expect(sentEmail.subject).toBe(
        'New Request in Your Group: Test groceries'
      );
      expect(sentEmail.html).toContain('Test groceries');
      expect(sentEmail.html).toContain('Someone'); // Default fallback since creator isn't populated
      expect(sentEmail.id).toBe(emailId);
    });

    it('includes request details in notification', async () => {
      await emailService.sendImmediateNotification(mockRequest, [mockUser]);

      const sentEmails = emailService.getSentEmails();
      const sentEmail = sentEmails[0];

      expect(sentEmail.html).toContain('Test groceries');
      expect(sentEmail.html).toContain('Whole Foods');
      expect(sentEmail.html).toContain('Front door delivery');
      expect(sentEmail.html).toContain(
        new Date(mockRequest.neededBy).toLocaleDateString()
      );
      expect(sentEmail.text).toContain('Test groceries');
      expect(sentEmail.text).toContain('Whole Foods');
      expect(sentEmail.text).toContain('Someone'); // Default fallback since creator isn't populated
    });
  });

  describe('sendTestEmail', () => {
    it('sends a test email', async () => {
      const emailId = await emailService.sendTestEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test content</p>'
      );

      expect(emailId).toMatch(/^mock-test-\d+$/);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[MockEmailService] Test email sent to test@example.com:',
        'Test Subject'
      );

      const sentEmails = emailService.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      const sentEmail = sentEmails[0];
      expect(sentEmail.to).toBe('test@example.com');
      expect(sentEmail.subject).toBe('Test Subject');
      expect(sentEmail.html).toBe('<p>Test content</p>');
      expect(sentEmail.text).toBe('Test content'); // HTML stripped
      expect(sentEmail.id).toBe(emailId);
    });

    it('strips HTML tags for text version', async () => {
      await emailService.sendTestEmail(
        'test@example.com',
        'Test',
        '<div><h1>Title</h1><p>Content with <strong>bold</strong> text</p></div>'
      );

      const sentEmails = emailService.getSentEmails();
      const sentEmail = sentEmails[0];
      expect(sentEmail.text).toBe('TitleContent with bold text');
    });
  });

  describe('helper methods', () => {
    it('getSentEmails returns copy of sent emails', async () => {
      await emailService.sendTestEmail('test@example.com', 'Test', 'Content');

      const sentEmails1 = emailService.getSentEmails();
      const sentEmails2 = emailService.getSentEmails();

      expect(sentEmails1).toEqual(sentEmails2);
      expect(sentEmails1).not.toBe(sentEmails2); // Different array instances
    });

    it('getLastEmail returns the most recent email', async () => {
      await emailService.sendTestEmail(
        'test1@example.com',
        'Test 1',
        'Content 1'
      );
      await emailService.sendTestEmail(
        'test2@example.com',
        'Test 2',
        'Content 2'
      );

      const lastEmail = emailService.getLastEmail();
      expect(lastEmail.to).toBe('test2@example.com');
      expect(lastEmail.subject).toBe('Test 2');
    });

    it('clearSentEmails removes all sent emails', async () => {
      await emailService.sendTestEmail('test@example.com', 'Test', 'Content');
      expect(emailService.getSentEmails()).toHaveLength(1);

      emailService.clearSentEmails();
      expect(emailService.getSentEmails()).toHaveLength(0);
    });
  });

  describe('email template generation', () => {
    it('generates proper HTML structure for daily digest', async () => {
      await emailService.sendDailyDigest(mockDigest);

      const sentEmails = emailService.getSentEmails();
      const { html } = sentEmails[0];

      expect(html).toContain('font-family: Arial, sans-serif');
      expect(html).toContain('Your Daily A Cup of Sugar Update');
      expect(html).toContain('Hi Test User');
      expect(html).toContain('View Dashboard');
      expect(html).toContain('email preferences');
    });

    it('generates proper HTML structure for immediate notification', async () => {
      await emailService.sendImmediateNotification(mockRequest, [mockUser]);

      const sentEmails = emailService.getSentEmails();
      const { html } = sentEmails[0];

      expect(html).toContain('font-family: Arial, sans-serif');
      expect(html).toContain('New Help Request');
      expect(html).toContain('Your Group');
      expect(html).toContain('Claim Request');
      expect(html).toContain('View Dashboard');
      expect(html).toContain('email preferences');
    });

    it('handles requests without optional fields', async () => {
      const minimalRequest: Request = {
        ...mockRequest,
        storePreference: undefined,
        pickupNotes: undefined,
      };

      await emailService.sendImmediateNotification(minimalRequest, [mockUser]);

      const sentEmails = emailService.getSentEmails();
      const { html, text } = sentEmails[0];

      expect(html).toContain('Test groceries');
      expect(html).not.toContain('Store:');
      expect(html).not.toContain('Notes:');
      expect(text).toContain('Test groceries');
      expect(text).not.toContain('Store:');
      expect(text).not.toContain('Notes:');
    });
  });
});
