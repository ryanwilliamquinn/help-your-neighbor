# Invitation Enhancement Plan

## Overview

Enhance the invitation system to use Option A (allow invites to non-users) with practical limits and email integration.

## Requirements Summary

- ✅ Send actual emails when invitations are created
- ✅ Maximum of 10 open invitations per user
- ✅ Maximum of 1 open invitation per email address per group
- ✅ Invitations valid for 7 days
- ✅ Inviters can see their open invitations (no notifications needed yet)

## Implementation Plan

### **Phase 1: Validation & Limits (First Priority)**

#### 1.1 Duplicate Invitation Prevention

- Check if there's already a pending invitation to the same email for the same group
- Show clear error message if duplicate exists
- Allow re-sending only after previous invitation expires/is used

#### 1.2 Open Invitation Limits

- Check total pending invitations sent by user across all groups
- Enforce 10 open invitation limit
- Show current count in UI (e.g., "7/10 invitations sent")
- Block new invitations when limit reached

#### 1.3 Enhanced UI Feedback

- Show invitation count/limits in groups page
- Better error messages for various scenarios
- Status indicators for invitation states

### **Phase 2: Email Integration**

#### 2.1 Actual Email Sending

- Integration with email service (Supabase has email auth features)
- Email templates for invitations
- Include group name, inviter name, and clear call-to-action

#### 2.2 Expiration Management

- Set 7-day expiration for all new invitations
- Background cleanup of expired invitations
- Update UI to show remaining time more clearly

### **Phase 3: Polish & Analytics**

#### 3.1 Better Invitation Management

- Allow canceling pending invitations
- Resend invitation option (creates new one, cancels old)
- Bulk invitation management

#### 3.2 Usage Insights

- Track invitation acceptance rates
- Show invitation history (sent/accepted/expired)

## Technical Considerations

### Database Changes Needed

- Update expiration logic (currently seems to be longer than 7 days)
- Add indexes for efficient duplicate checking
- Consider adding invitation tracking fields

### API Enhancements

- Add validation to `createInvite` endpoint
- Add invitation count/limit checking
- Email service integration

### UI Updates

- Invitation counter display
- Better error handling and messages
- Status indicators for different invitation states

## Current State

- ✅ Basic invitation system working
- ✅ Pending outgoing invitations display
- ✅ Auto-refresh after creating invitations
- ⏳ Ready to implement Phase 1 enhancements

## Next Steps

Start with Phase 1 (validation & limits) as it provides immediate value and prevents spam/abuse before moving to email integration in Phase 2.
