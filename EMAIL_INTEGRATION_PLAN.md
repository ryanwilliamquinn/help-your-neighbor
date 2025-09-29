# Email Integration Plan for Help Your Neighbor

## Overview

Implementation plan for email notifications with user-configurable frequency settings, profile integration, and dashboard links.

## Requirements

- Users decide email frequency: disabled, daily digest, or immediate notifications
- Configuration in user profile settings
- Emails contain only open requests
- Emails include links back to dashboard

## 1. Database Schema Design

### New Email Preferences Table

```sql
CREATE TABLE user_email_preferences (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  frequency VARCHAR(20) NOT NULL DEFAULT 'disabled' CHECK (frequency IN ('disabled', 'daily', 'immediate')),
  last_daily_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_prefs_daily ON user_email_preferences(frequency, last_daily_sent)
WHERE frequency = 'daily';
```

### Email Send Log Table

```sql
CREATE TABLE email_send_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL,
  request_ids UUID[] NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_provider_id VARCHAR(255)
);
```

## 2. TypeScript Interface Updates

**Add to src/types/index.ts:**

```typescript
export interface EmailPreferences {
  userId: string;
  frequency: 'disabled' | 'daily' | 'immediate';
  lastDailySent?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailPreferencesForm {
  frequency: 'disabled' | 'daily' | 'immediate';
}

export interface EmailDigest {
  user: User;
  openRequests: Request[];
  dashboardUrl: string;
}
```

## 3. Email Service Architecture

### Email Provider Options

- **Recommended**: Resend - excellent deliverability, simple API
- **Alternative**: SendGrid - established provider with good free tier
- **Backup**: Cloudflare Email Workers

### Service Structure

- `EmailService` interface for provider abstraction
- `ResendEmailService` implementation
- `MockEmailService` for development/testing
- Email template system with HTML/text versions

### New API Service Methods

```typescript
// Add to ApiService interface
getEmailPreferences: () => Promise<EmailPreferences>;
updateEmailPreferences: (preferences: EmailPreferencesForm) =>
  Promise<EmailPreferences>;
sendImmediateNotification: (requestId: string) => Promise<void>;
```

## 4. Email Templates & Content

### Daily Digest Email

- **Subject**: "Your Help Your Neighbor Daily Update - [X] Open Requests"
- **Content**: Grouped by group membership
- **Request Details**: Item description, needed by date, store preference
- **CTA**: "View Dashboard" button
- **Footer**: Unsubscribe link

### Immediate Notification Email

- **Subject**: "New Request in [Group Name]: [Item Description]"
- **Content**: Single request details
- **CTAs**: "Claim Request" | "View Dashboard" buttons
- **Footer**: Unsubscribe link

## 5. Scheduling System for Daily Emails

### Implementation Options

1. **Supabase Edge Functions** (Recommended)
   - Schedule with `pg_cron` extension
   - Daily function at 8 AM user's timezone
   - Processes all users with `frequency = 'daily'`

2. **External Cron Service**
   - Vercel Cron or GitHub Actions
   - Hits API endpoint daily
   - Good fallback option

### Daily Process Flow

1. Query users with `frequency = 'daily'` and `last_daily_sent < today`
2. For each user, get their group's open requests
3. If requests exist, send digest email
4. Update `last_daily_sent` timestamp

## 6. User Profile Email Configuration

### Integration Points

- Add email preferences section to existing `UserProfileForm`
- Radio button options: "Never", "Daily Summary", "Immediate Notifications"
- Help text explaining each option
- Save to new `updateEmailPreferences` API method

### UI Location

- Extend existing profile page at `src/pages/Profile/ProfilePage.tsx`
- Add new `EmailPreferencesSection` component
- Consistent styling with current form design

### Component Structure

```typescript
// New component: src/components/Profile/EmailPreferencesSection.tsx
interface EmailPreferencesSectionProps {
  preferences: EmailPreferences;
  onUpdate: (preferences: EmailPreferencesForm) => Promise<void>;
}
```

## 7. Implementation Phases & Testing Strategy

### Phase 1: Foundation (Week 1)

- [ ] Database schema migration
- [ ] TypeScript interfaces
- [ ] Email preferences API endpoints
- [ ] User profile UI updates
- [ ] Mock email service for development

### Phase 2: Email Service (Week 2)

- [ ] Resend integration
- [ ] Email template system
- [ ] Immediate notification triggers
- [ ] Testing with real email delivery

### Phase 3: Daily Digest (Week 3)

- [ ] Supabase Edge Function for scheduling
- [ ] Daily digest logic
- [ ] Email deduplication
- [ ] Timezone handling

### Phase 4: Polish & Testing (Week 4)

- [ ] End-to-end testing
- [ ] Email preview system
- [ ] Unsubscribe handling
- [ ] Performance optimization

### Testing Strategy

- Unit tests for email service interfaces
- Integration tests for API endpoints
- Manual testing with multiple email addresses
- Load testing for daily digest processing
- Email deliverability testing

## 8. Integration Triggers

### Immediate Notifications

- **Trigger**: `createRequest` method in API service
- **Condition**: Find group members with `frequency = 'immediate'`
- **Action**: Send notification email to each member
- **Implementation**: Add to `src/services/supabaseApiService.ts`

### Daily Digest

- **Trigger**: Scheduled function (8 AM daily)
- **Condition**: Users with `frequency = 'daily'` and pending requests
- **Action**: Aggregate and send digest email
- **Implementation**: New Supabase Edge Function

## 9. Security & Privacy Considerations

- Rate limiting on email sends (prevent spam)
- Email validation before sending
- Secure unsubscribe tokens
- GDPR-compliant email preferences
- No sensitive data in email content (just request summaries)
- Email address validation and sanitization

## 10. File Structure

### New Files to Create

```
src/
├── services/
│   ├── emailService.ts          # Email service interface
│   ├── resendEmailService.ts    # Resend implementation
│   └── mockEmailService.ts      # Development mock
├── components/
│   └── Profile/
│       └── EmailPreferencesSection.tsx
├── templates/
│   ├── dailyDigestEmail.ts      # Email template
│   └── immediateNotificationEmail.ts
└── types/
    └── email.ts                 # Email-specific types

supabase/
├── functions/
│   └── daily-email-digest/      # Edge function
└── migrations/
    └── 008_email_preferences.sql
```

## 11. Environment Variables

```env
# Add to .env files
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM_ADDRESS=noreply@helpyourneighbor.com
DASHBOARD_BASE_URL=https://your-domain.com
```

## 12. Next Steps

1. Review and approve this plan
2. Set up Resend account and get API key
3. Start with Phase 1 implementation
4. Create database migration for email preferences
5. Update TypeScript interfaces
6. Begin building email preferences UI

---

**Status**: Planning Complete ✅
**Ready for Implementation**: Phase 1
**Estimated Timeline**: 4 weeks
