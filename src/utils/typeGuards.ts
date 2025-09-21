// Type guards for runtime validation of localStorage data

import type {
  User,
  Group,
  GroupMember,
  Request,
  Invite,
  RequestStatus,
} from '../types';

// Utility function to check if value is a valid date
function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

// Utility function to check if value is a date string that can be parsed
function isDateString(value: unknown): value is string {
  return typeof value === 'string' && !isNaN(Date.parse(value));
}

// Utility function to safely convert a value to Date
function safeToDate(value: unknown): Date {
  if (isValidDate(value)) return value;
  if (isDateString(value)) return new Date(value);
  return new Date(); // fallback to current date
}

// Type guard for RequestStatus
function isRequestStatus(value: unknown): value is RequestStatus {
  return (
    typeof value === 'string' &&
    ['open', 'claimed', 'fulfilled', 'expired'].includes(value)
  );
}

// Type guard for User
export function isUser(obj: unknown): obj is User {
  if (!obj || typeof obj !== 'object') return false;

  const user = obj as Record<string, unknown>;

  return (
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.name === 'string' &&
    typeof user.phone === 'string' &&
    typeof user.generalArea === 'string' &&
    (isValidDate(user.createdAt) || isDateString(user.createdAt))
  );
}

// Type guard for Group
export function isGroup(obj: unknown): obj is Group {
  if (!obj || typeof obj !== 'object') return false;

  const group = obj as Record<string, unknown>;

  return (
    typeof group.id === 'string' &&
    typeof group.name === 'string' &&
    typeof group.createdBy === 'string' &&
    (isValidDate(group.createdAt) || isDateString(group.createdAt))
  );
}

// Type guard for GroupMember
export function isGroupMember(obj: unknown): obj is GroupMember {
  if (!obj || typeof obj !== 'object') return false;

  const member = obj as Record<string, unknown>;

  return (
    typeof member.groupId === 'string' &&
    typeof member.userId === 'string' &&
    (isValidDate(member.joinedAt) || isDateString(member.joinedAt))
  );
}

// Type guard for Request
export function isRequest(obj: unknown): obj is Request {
  if (!obj || typeof obj !== 'object') return false;

  const request = obj as Record<string, unknown>;

  return (
    typeof request.id === 'string' &&
    typeof request.userId === 'string' &&
    typeof request.groupId === 'string' &&
    typeof request.itemDescription === 'string' &&
    (request.storePreference === undefined ||
      typeof request.storePreference === 'string') &&
    (isValidDate(request.neededBy) || isDateString(request.neededBy)) &&
    (request.pickupNotes === undefined ||
      typeof request.pickupNotes === 'string') &&
    isRequestStatus(request.status) &&
    (request.claimedBy === undefined ||
      typeof request.claimedBy === 'string') &&
    (request.claimedAt === undefined ||
      isValidDate(request.claimedAt) ||
      isDateString(request.claimedAt)) &&
    (isValidDate(request.createdAt) || isDateString(request.createdAt))
  );
}

// Type guard for Invite
export function isInvite(obj: unknown): obj is Invite {
  if (!obj || typeof obj !== 'object') return false;

  const invite = obj as Record<string, unknown>;

  return (
    typeof invite.id === 'string' &&
    typeof invite.groupId === 'string' &&
    typeof invite.email === 'string' &&
    typeof invite.token === 'string' &&
    (isValidDate(invite.expiresAt) || isDateString(invite.expiresAt)) &&
    (invite.usedAt === undefined ||
      isValidDate(invite.usedAt) ||
      isDateString(invite.usedAt)) &&
    (isValidDate(invite.createdAt) || isDateString(invite.createdAt))
  );
}

// Validation functions that ensure proper types and fix Date objects
export function validateUser(obj: unknown): User {
  if (!isUser(obj)) {
    throw new Error('Invalid user data structure');
  }

  return {
    ...obj,
    createdAt: safeToDate(obj.createdAt),
  };
}

export function validateGroup(obj: unknown): Group {
  if (!isGroup(obj)) {
    throw new Error('Invalid group data structure');
  }

  return {
    ...obj,
    createdAt: safeToDate(obj.createdAt),
  };
}

export function validateGroupMember(obj: unknown): GroupMember {
  if (!isGroupMember(obj)) {
    throw new Error('Invalid group member data structure');
  }

  return {
    ...obj,
    joinedAt: safeToDate(obj.joinedAt),
  };
}

export function validateRequest(obj: unknown): Request {
  if (!isRequest(obj)) {
    throw new Error('Invalid request data structure');
  }

  return {
    ...obj,
    neededBy: safeToDate(obj.neededBy),
    claimedAt: obj.claimedAt ? safeToDate(obj.claimedAt) : undefined,
    createdAt: safeToDate(obj.createdAt),
  };
}

export function validateInvite(obj: unknown): Invite {
  if (!isInvite(obj)) {
    throw new Error('Invalid invite data structure');
  }

  return {
    ...obj,
    expiresAt: safeToDate(obj.expiresAt),
    usedAt: obj.usedAt ? safeToDate(obj.usedAt) : undefined,
    createdAt: safeToDate(obj.createdAt),
  };
}

// Array validation functions
export function validateUsers(data: unknown[]): User[] {
  return data.map(validateUser);
}

export function validateGroups(data: unknown[]): Group[] {
  return data.map(validateGroup);
}

export function validateGroupMembers(data: unknown[]): GroupMember[] {
  return data.map(validateGroupMember);
}

export function validateRequests(data: unknown[]): Request[] {
  return data.map(validateRequest);
}

export function validateInvites(data: unknown[]): Invite[] {
  return data.map(validateInvite);
}
