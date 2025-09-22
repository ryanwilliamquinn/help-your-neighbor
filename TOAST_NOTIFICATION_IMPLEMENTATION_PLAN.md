# Toast Notification System Implementation Plan

## Overview

Replace all `alert()` calls with a modern toast notification system. Keep it simple with standard duration and integrate with existing error handling infrastructure.

## Implementation Strategy

### Phase 1: Core Toast System

#### 1. Create Toast Context and Provider

**File:** `src/contexts/ToastContext.tsx`

```typescript
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number; // Optional override, default 4000ms
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}
```

**Features:**

- Auto-generate unique IDs for toasts
- Auto-remove toasts after 4 seconds (standard duration)
- Manual removal capability
- Queue management (max 5 toasts visible)

#### 2. Create Toast Components

**File:** `src/components/Toast/Toast.tsx`

- Individual toast component with icon, message, and close button
- Smooth animations (slide in from right, fade out)
- Semantic colors: success (green), error (red), warning (orange), info (blue)

**File:** `src/components/Toast/ToastContainer.tsx`

- Container that renders all active toasts
- Fixed position: top-right corner
- Stack toasts vertically with gap

**File:** `src/components/Toast/Toast.css`

- Styling consistent with app's gradient theme
- Responsive design
- Accessibility-friendly (focus states, screen reader support)

#### 3. Create Toast Hook

**File:** `src/hooks/useToast.ts`

```typescript
interface ToastMethods {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}
```

**API Design:**

```typescript
const toast = useToast();
toast.success('Request created successfully!');
toast.error('Failed to create request');
```

### Phase 2: Integration

#### 4. Update App.tsx

Add ToastProvider and ToastContainer to the app root:

```typescript
function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="App">
          {/* existing content */}
        </div>
        <ToastContainer />
      </ToastProvider>
    </BrowserRouter>
  );
}
```

#### 5. Integrate with AsyncErrorBoundary

**File:** `src/components/AsyncErrorBoundary.tsx`

- Modify to use toast notifications for errors instead of full-screen error UI
- Keep error boundary for critical failures, use toasts for recoverable errors
- Add toast context integration

### Phase 3: Replace Alert Usage

#### 6. Update DashboardPage.tsx

**Current alerts to replace:**

- Line 120-122: `alert()` in `handleCreateRequest` catch block

**Current TODOs to implement:**

- Line 100: Dashboard data loading error
- Line 119: Request creation error

**Implementation:**

```typescript
const toast = useToast();

// Replace alert in handleCreateRequest
catch (error) {
  console.error('Failed to create request:', error);
  toast.error(
    error instanceof Error ? error.message : 'Failed to create request'
  );
}

// Add toast for dashboard loading error
catch (error) {
  console.error('Failed to load dashboard data:', error);
  toast.error('Unable to load dashboard data. Please refresh the page.');
}
```

#### 7. Add Success Feedback

Enhance user experience by adding success toasts for:

- Request created successfully
- Request claimed successfully
- Request fulfilled successfully
- Request deleted successfully

### Phase 4: Form Validation Enhancement

#### 8. Update CreateRequestForm.tsx

**File:** `src/components/CreateRequestForm/CreateRequestForm.tsx`

- Add toast feedback for form submission success/failure
- Keep existing validation, add toast notifications for better UX

#### 9. Update Other Components

**Files to enhance:**

- `src/pages/Profile/ProfilePage.tsx` - Profile update feedback
- `src/pages/Groups/GroupsPage.tsx` - Group creation/joining feedback
- `src/pages/Invite/InvitePage.tsx` - Invitation process feedback

**Pattern for all updates:**

```typescript
// Add to component
const toast = useToast();

// In success cases
toast.success('Operation completed successfully!');

// In error cases
toast.error(error instanceof Error ? error.message : 'Operation failed');
```

## Technical Specifications

### Toast Styling Requirements

- **Duration:** 4 seconds standard for all toasts
- **Position:** Top-right corner, 20px from edges
- **Animation:** 300ms slide-in from right, 200ms fade-out
- **Colors:**
  - Success: #27ae60 (existing app green)
  - Error: #e74c3c
  - Warning: #f39c12
  - Info: #3498db
- **Typography:** Inherit from app's existing font stack
- **Icons:** Use simple Unicode symbols (✅ ❌ ⚠️ ℹ️)
- **Max width:** 400px
- **Max visible:** 5 toasts (older ones auto-dismissed)

### Accessibility Requirements

- **ARIA labels:** Proper role="alert" for errors
- **Keyboard navigation:** Focusable close buttons
- **Screen readers:** Announce toast messages
- **High contrast:** Support system preferences
- **Reduced motion:** Respect prefers-reduced-motion

### Testing Requirements

#### Unit Tests

**File:** `src/components/Toast/Toast.test.tsx`

- Toast component rendering
- Auto-dismiss timing
- Manual dismiss functionality

**File:** `src/hooks/useToast.test.ts`

- Hook functionality
- Toast queue management
- Context integration

#### Integration Tests

**File:** `src/pages/Dashboard/DashboardPage.test.tsx`

- Update existing tests to verify toast usage instead of alerts
- Mock toast context in tests

### Error Categorization

| Scenario              | Toast Type | Message Pattern                                    |
| --------------------- | ---------- | -------------------------------------------------- |
| **Network failure**   | Error      | "Unable to connect. Please check your connection." |
| **Validation error**  | Error      | Use server error message                           |
| **Success operation** | Success    | "{Action} completed successfully!"                 |
| **Permission denied** | Error      | "You don't have permission for this action."       |
| **Server error**      | Error      | "Something went wrong. Please try again."          |

## Implementation Order

1. **Create core toast system** (Context, Components, Hook)
2. **Add CSS styling** and animations
3. **Integrate with App.tsx**
4. **Replace alert() in DashboardPage.tsx**
5. **Add success feedback** for operations
6. **Update other components** with toast integration
7. **Write comprehensive tests**
8. **Update AsyncErrorBoundary** integration

## Files to Create

- `src/contexts/ToastContext.tsx`
- `src/components/Toast/Toast.tsx`
- `src/components/Toast/ToastContainer.tsx`
- `src/components/Toast/Toast.css`
- `src/hooks/useToast.ts`
- `src/components/Toast/Toast.test.tsx`
- `src/hooks/useToast.test.ts`

## Files to Modify

- `src/components/App.tsx` (add ToastProvider)
- `src/pages/Dashboard/DashboardPage.tsx` (replace alert, add toasts)
- `src/pages/Profile/ProfilePage.tsx` (add toast feedback)
- `src/pages/Groups/GroupsPage.tsx` (add toast feedback)
- `src/pages/Invite/InvitePage.tsx` (add toast feedback)
- `src/components/CreateRequestForm/CreateRequestForm.tsx` (add toast feedback)
- `src/components/AsyncErrorBoundary.tsx` (optional integration)
- Test files for updated components

## Success Criteria

- ✅ Zero `alert()` calls in codebase
- ✅ Consistent toast feedback for all operations
- ✅ All tests passing
- ✅ Accessible toast notifications
- ✅ Clean, maintainable code structure
- ✅ TypeScript strict compliance
- ✅ No console errors
- ✅ Smooth animations and professional UX

## Notes for Implementation

- Use existing app color scheme and typography
- Maintain existing error handling patterns where possible
- Keep toast API simple and intuitive
- Ensure no breaking changes to existing functionality
- Follow existing code conventions and patterns
- Add comprehensive JSDoc comments for API methods
