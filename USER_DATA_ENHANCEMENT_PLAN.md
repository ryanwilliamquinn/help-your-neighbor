# User Data Enhancement Plan - Dashboard Requests

## Overview

Add creator and helper user information to request displays on the dashboard screen. Show who created each request and who accepted/helped with it.

## Current State

- Dashboard shows requests without creator names
- Helper names are partially implemented but inefficiently loaded
- No user data caching or batch loading
- Sequential API calls cause performance issues

## Pre-Alpha Status

Since we have no real users yet, we can make breaking changes freely:

- No backward compatibility required
- API interfaces can be redesigned
- Database schema can be modified
- UI components can be restructured

## Implementation Plan

### 1. API Service Enhancements

**Location**: `src/services/index.ts`, `src/services/httpApiService.ts`, `src/services/mockApiService.ts`

**Add new method to ApiService interface**:

```typescript
// Add to ApiService interface
getUsersByIds(userIds: string[]): Promise<User[]>
```

**Implementation in HttpApiService**:

```typescript
async getUsersByIds(userIds: string[]): Promise<User[]> {
  return this.request<User[]>('/users/batch', {
    method: 'POST',
    body: JSON.stringify({ userIds }),
  });
}
```

**Implementation in MockApiService**:

```typescript
async getUsersByIds(userIds: string[]): Promise<User[]> {
  await this.delay();
  if (!this.currentUser) {
    throw new Error('No authenticated user');
  }

  const users = this.db.getUsers();
  return users.filter(user => userIds.includes(user.id));
}
```

### 2. Enhanced Request Interface

**Location**: `src/types/index.ts:25`

**Modify Request interface to include user data**:

```typescript
export interface Request {
  id: string;
  userId: string;
  groupId: string;
  itemDescription: string;
  storePreference?: string;
  neededBy: Date;
  pickupNotes?: string;
  status: RequestStatus;
  claimedBy?: string;
  claimedAt?: Date;
  createdAt: Date;
  // NEW: Add user data directly to request objects
  creator?: User;
  helper?: User;
}
```

### 3. Dashboard Data Loading Optimization

**Location**: `src/pages/Dashboard/DashboardPage.tsx:27-67`

**Replace current inefficient loading**:

```typescript
const loadDashboardData = useCallback(async (): Promise<void> => {
  try {
    setLoadingData(true);

    // Load user's groups first
    const groups = await apiService.getUserGroups();
    setUserGroups(groups);

    // Load all requests
    const userRequests = await apiService.getUserRequests();
    const allGroupRequests: Request[] = [];
    for (const group of groups) {
      const groupRequests = await apiService.getGroupRequests(group.id);
      const otherMemberRequests = groupRequests.filter(
        (req) => req.userId !== user?.id
      );
      allGroupRequests.push(...otherMemberRequests);
    }

    // NEW: Batch load all user data
    const allRequests = [...userRequests, ...allGroupRequests];
    const allUserIds = [
      ...allRequests.map((req) => req.userId), // creators
      ...allRequests
        .filter((req) => req.claimedBy)
        .map((req) => req.claimedBy!), // helpers
    ].filter((id, index, array) => array.indexOf(id) === index); // remove duplicates

    const allUsers = await apiService.getUsersByIds(allUserIds);
    const usersMap = allUsers.reduce(
      (map, user) => {
        map[user.id] = user;
        return map;
      },
      {} as Record<string, User>
    );

    // Attach user data to requests
    const enhancedUserRequests = userRequests.map((req) => ({
      ...req,
      creator: usersMap[req.userId],
      helper: req.claimedBy ? usersMap[req.claimedBy] : undefined,
    }));

    const enhancedGroupRequests = allGroupRequests.map((req) => ({
      ...req,
      creator: usersMap[req.userId],
      helper: req.claimedBy ? usersMap[req.claimedBy] : undefined,
    }));

    setUserRequests(enhancedUserRequests);
    setGroupRequests(enhancedGroupRequests);
  } finally {
    setLoadingData(false);
  }
}, [user?.id]);
```

### 4. State Management Simplification

**Location**: `src/pages/Dashboard/DashboardPage.tsx:25`

**Remove helperUsers state** (no longer needed):

```typescript
// REMOVE this line:
// const [helperUsers, setHelperUsers] = useState<Record<string, User>>({});

// Keep only these states:
const [userRequests, setUserRequests] = useState<Request[]>([]);
const [groupRequests, setGroupRequests] = useState<Request[]>([]);
```

### 5. RequestCard Component Updates

**Location**: `src/components/RequestCard/RequestCard.tsx:5`

**Simplify props interface**:

```typescript
interface RequestCardProps {
  request: Request; // Now includes creator and helper data
  isOwnRequest?: boolean;
  onClaim?: (requestId: string) => Promise<void>;
  onFulfill?: (requestId: string) => Promise<void>;
  onDelete?: (requestId: string) => Promise<void>;
  currentUserId?: string;
  isProcessing?: boolean;
  // REMOVE: helperUser prop (now in request.helper)
}
```

**Update component to use embedded user data**:

```typescript
// Replace line 129-143 with:
{request.claimedBy && request.helper &&
  (request.status === 'claimed' || request.status === 'fulfilled') && (
    <div className="claimed-info">
      <span className="claimed-badge">
        {isOwnRequest
          ? `${request.status === 'fulfilled' ? 'Fulfilled by' : 'Being helped by'} ${request.helper.name}`
          : `${request.status === 'fulfilled' ? 'Fulfilled by you' : 'Claimed by you'}`}
      </span>
      {request.claimedAt && (
        <span className="claimed-date">
          on {formatDate(request.claimedAt)}
        </span>
      )}
    </div>
  )}

{/* NEW: Add creator information */}
{!isOwnRequest && request.creator && (
  <div className="creator-info">
    <span className="creator-name">Posted by {request.creator.name}</span>
  </div>
)}
```

### 6. RequestList Component Updates

**Location**: `src/components/RequestList/RequestList.tsx`

**Simplify props interface**:

```typescript
interface RequestListProps {
  requests: Request[]; // Now includes user data
  isOwnRequests?: boolean;
  onClaim?: (requestId: string) => Promise<void>;
  onFulfill?: (requestId: string) => Promise<void>;
  onDelete?: (requestId: string) => Promise<void>;
  currentUserId?: string;
  isProcessing?: boolean;
  emptyMessage?: string;
  emptySubMessage?: string;
  // REMOVE: helperUsers prop (now embedded in requests)
}
```

**Update RequestCard usage**:

```typescript
<RequestCard
  key={request.id}
  request={request} // Now contains creator and helper data
  isOwnRequest={isOwnRequests}
  onClaim={onClaim}
  onFulfill={onFulfill}
  onDelete={onDelete}
  currentUserId={currentUserId}
  isProcessing={isProcessing}
  // REMOVE: helperUser prop
/>
```

### 7. Dashboard Component Updates

**Location**: `src/pages/Dashboard/DashboardPage.tsx:194-202, 216-227`

**Update RequestList component usage**:

```typescript
// Remove helperUsers prop from both RequestList components:
<RequestList
  requests={userRequests}
  isOwnRequests={true}
  onFulfill={handleFulfillRequest}
  onDelete={handleDeleteRequest}
  currentUserId={user?.id}
  isProcessing={isFulfillingRequest || isDeletingRequest}
  // REMOVE: helperUsers={helperUsers}
/>

<RequestList
  requests={groupRequests}
  isOwnRequests={false}
  onClaim={handleClaimRequest}
  onFulfill={handleFulfillRequest}
  currentUserId={user?.id}
  isProcessing={isClaimingRequest || isFulfillingRequest}
  emptyMessage="No requests from your group members right now."
  emptySubMessage="Check back later!"
  // REMOVE: helperUsers={helperUsers}
/>
```

### 8. CSS Styling

**Location**: `src/components/RequestCard/RequestCard.css`

**Add styles for creator info**:

```css
.creator-info {
  margin-top: 8px;
  font-size: 0.875rem;
  color: #666;
}

.creator-name {
  font-style: italic;
}
```

## Implementation Phases

1. **Phase 1**: Add getUsersByIds API method to both service implementations
2. **Phase 2**: Update Request interface to include creator and helper User objects
3. **Phase 3**: Refactor dashboard data loading to use batch user loading
4. **Phase 4**: Update RequestCard component to use embedded user data
5. **Phase 5**: Update RequestList and remove helperUsers prop passing
6. **Phase 6**: Add CSS styling for creator information
7. **Phase 7**: Test and refine user experience

## Expected Benefits

- **Performance**: Single batch API call instead of multiple sequential calls
- **Simplicity**: User data embedded in request objects, no complex prop passing
- **User Experience**: Clear visibility of who created and who is helping with each request
- **Maintainability**: Cleaner component interfaces and data flow

## Testing Considerations

- Test batch user loading with various user ID combinations
- Test UI rendering with missing user data (graceful degradation)
- Test performance with large numbers of requests and users
- Verify creator and helper names display correctly in all scenarios
