import { describe, it, expect } from '@jest/globals';
import type { Request, User, RequestStatus } from './index';
import { RequestStatus as RequestStatusEnum } from './index';

describe('Request Interface with Enhanced User Data', () => {
  const mockCreator: User = {
    id: 'creator-123',
    email: 'creator@example.com',
    name: 'Request Creator',
    phone: '+1234567890',
    generalArea: 'Downtown',
    isAdmin: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
  };

  const mockHelper: User = {
    id: 'helper-456',
    email: 'helper@example.com',
    name: 'Request Helper',
    phone: '+0987654321',
    generalArea: 'Uptown',
    isAdmin: false,
    createdAt: new Date('2024-01-02T00:00:00Z'),
  };

  it('should allow creating a Request with embedded creator and helper data', () => {
    const request: Request = {
      id: 'req-123',
      userId: 'creator-123',
      groupId: 'group-789',
      itemDescription: 'Test item',
      storePreference: 'Test store',
      neededBy: new Date('2024-12-31T10:00:00Z'),
      pickupNotes: 'Test notes',
      status: RequestStatusEnum.CLAIMED,
      claimedBy: 'helper-456',
      claimedAt: new Date('2024-01-15T12:00:00Z'),
      createdAt: new Date('2024-01-15T09:00:00Z'),
      creator: mockCreator,
      helper: mockHelper,
    };

    // Verify all required fields are present
    expect(request.id).toBe('req-123');
    expect(request.userId).toBe('creator-123');
    expect(request.groupId).toBe('group-789');
    expect(request.itemDescription).toBe('Test item');
    expect(request.status).toBe('claimed');

    // Verify optional fields work correctly
    expect(request.storePreference).toBe('Test store');
    expect(request.pickupNotes).toBe('Test notes');
    expect(request.claimedBy).toBe('helper-456');
    expect(request.claimedAt).toEqual(new Date('2024-01-15T12:00:00Z'));

    // Verify embedded user data
    expect(request.creator).toBeDefined();
    expect(request.creator?.id).toBe('creator-123');
    expect(request.creator?.name).toBe('Request Creator');
    expect(request.creator?.email).toBe('creator@example.com');

    expect(request.helper).toBeDefined();
    expect(request.helper?.id).toBe('helper-456');
    expect(request.helper?.name).toBe('Request Helper');
    expect(request.helper?.email).toBe('helper@example.com');
  });

  it('should allow creating a Request without optional creator and helper data', () => {
    const request: Request = {
      id: 'req-456',
      userId: 'creator-123',
      groupId: 'group-789',
      itemDescription: 'Test item without user data',
      neededBy: new Date('2024-12-31T10:00:00Z'),
      status: RequestStatusEnum.OPEN,
      createdAt: new Date('2024-01-15T09:00:00Z'),
      // creator and helper are optional
    };

    expect(request.creator).toBeUndefined();
    expect(request.helper).toBeUndefined();
    expect(request.claimedBy).toBeUndefined();
    expect(request.claimedAt).toBeUndefined();
  });

  it('should allow creating a Request with only creator data (open request)', () => {
    const request: Request = {
      id: 'req-789',
      userId: 'creator-123',
      groupId: 'group-789',
      itemDescription: 'Open request with creator data',
      neededBy: new Date('2024-12-31T10:00:00Z'),
      status: RequestStatusEnum.OPEN,
      createdAt: new Date('2024-01-15T09:00:00Z'),
      creator: mockCreator,
      // No helper for open request
    };

    expect(request.creator).toBeDefined();
    expect(request.creator?.name).toBe('Request Creator');
    expect(request.helper).toBeUndefined();
    expect(request.claimedBy).toBeUndefined();
  });

  it('should support all RequestStatus values', () => {
    const openRequest: Request = {
      id: 'req-open',
      userId: 'creator-123',
      groupId: 'group-789',
      itemDescription: 'Open request',
      neededBy: new Date('2024-12-31T10:00:00Z'),
      status: RequestStatusEnum.OPEN,
      createdAt: new Date('2024-01-15T09:00:00Z'),
    };

    const claimedRequest: Request = {
      ...openRequest,
      id: 'req-claimed',
      status: RequestStatusEnum.CLAIMED,
      claimedBy: 'helper-456',
      claimedAt: new Date(),
    };

    const fulfilledRequest: Request = {
      ...claimedRequest,
      id: 'req-fulfilled',
      status: RequestStatusEnum.FULFILLED,
    };

    const expiredRequest: Request = {
      ...openRequest,
      id: 'req-expired',
      status: RequestStatusEnum.EXPIRED,
    };

    expect(openRequest.status).toBe('open');
    expect(claimedRequest.status).toBe('claimed');
    expect(fulfilledRequest.status).toBe('fulfilled');
    expect(expiredRequest.status).toBe('expired');
  });

  it('should maintain type safety for embedded user fields', () => {
    const request: Request = {
      id: 'req-type-test',
      userId: 'creator-123',
      groupId: 'group-789',
      itemDescription: 'Type safety test',
      neededBy: new Date('2024-12-31T10:00:00Z'),
      status: RequestStatusEnum.CLAIMED,
      claimedBy: 'helper-456',
      createdAt: new Date('2024-01-15T09:00:00Z'),
      creator: mockCreator,
      helper: mockHelper,
    };

    // TypeScript should enforce User interface properties
    if (request.creator) {
      expect(typeof request.creator.id).toBe('string');
      expect(typeof request.creator.email).toBe('string');
      expect(typeof request.creator.name).toBe('string');
      expect(typeof request.creator.phone).toBe('string');
      expect(typeof request.creator.generalArea).toBe('string');
      expect(request.creator.createdAt).toBeInstanceOf(Date);
    }

    if (request.helper) {
      expect(typeof request.helper.id).toBe('string');
      expect(typeof request.helper.email).toBe('string');
      expect(typeof request.helper.name).toBe('string');
      expect(typeof request.helper.phone).toBe('string');
      expect(typeof request.helper.generalArea).toBe('string');
      expect(request.helper.createdAt).toBeInstanceOf(Date);
    }
  });

  it('should allow partial user data (graceful degradation)', () => {
    // Test scenario where user data might be partially available
    const requestWithPartialData: Request = {
      id: 'req-partial',
      userId: 'creator-123',
      groupId: 'group-789',
      itemDescription: 'Request with partial user data',
      neededBy: new Date('2024-12-31T10:00:00Z'),
      status: RequestStatusEnum.CLAIMED,
      claimedBy: 'helper-456',
      createdAt: new Date('2024-01-15T09:00:00Z'),
      creator: mockCreator,
      // helper intentionally undefined (maybe user was deleted)
    };

    expect(requestWithPartialData.creator).toBeDefined();
    expect(requestWithPartialData.helper).toBeUndefined();
    expect(requestWithPartialData.claimedBy).toBe('helper-456'); // Still have the ID
  });
});

describe('RequestStatus Enum', () => {
  it('should provide correct string values', () => {
    expect(RequestStatusEnum.OPEN).toBe('open');
    expect(RequestStatusEnum.CLAIMED).toBe('claimed');
    expect(RequestStatusEnum.FULFILLED).toBe('fulfilled');
    expect(RequestStatusEnum.EXPIRED).toBe('expired');
  });

  it('should allow type-safe status assignment', () => {
    const validStatus: RequestStatus = RequestStatusEnum.OPEN;
    expect(validStatus).toBe('open');

    // This tests that the type system works correctly
    const statusFromString: RequestStatus = 'claimed';
    expect(statusFromString).toBe('claimed');
  });
});
