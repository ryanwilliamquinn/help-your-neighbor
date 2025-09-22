import { describe, it, expect, beforeEach } from '@jest/globals';
import { MockApiService } from './mockApiService';
import { TestStorageDB } from '../lib/testStorage';
import { StorageFactory } from '../lib/storage';

describe('MockApiService', () => {
  let apiService: MockApiService;
  let storage: TestStorageDB;

  beforeEach(() => {
    // Reset storage factory and create fresh storage for each test
    StorageFactory.reset();
    storage = TestStorageDB.createClean();
    apiService = new MockApiService(storage);
  });

  describe('Authentication', () => {
    it('should sign up a new user successfully', async () => {
      const response = await apiService.signUp(
        'test@example.com',
        'password123'
      );

      expect(response.user).toBeDefined();
      expect(response.user.email).toBe('test@example.com');
      expect(response.session).toBe('mock-session-token');
    });

    it('should get user by ID', async () => {
      const signupResponse = await apiService.signUp(
        'testuser@example.com',
        'password123'
      );
      const userId = signupResponse.user.id;

      const user = await apiService.getUserById(userId);
      expect(user.id).toBe(userId);
      expect(user.email).toBe('testuser@example.com');
    });

    it('should reject getUserById with invalid ID', async () => {
      await apiService.signUp('test1@example.com', 'password123');

      await expect(apiService.getUserById('invalid-id')).rejects.toThrow(
        'User not found'
      );
    });

    it('should get multiple users by IDs', async () => {
      // Create multiple users
      const user1Response = await apiService.signUp(
        'user1@example.com',
        'password123'
      );
      await apiService.signOut();
      const user2Response = await apiService.signUp(
        'user2@example.com',
        'password123'
      );
      await apiService.signOut();
      const user3Response = await apiService.signUp(
        'user3@example.com',
        'password123'
      );

      const userIds = [user1Response.user.id, user2Response.user.id];
      const users = await apiService.getUsersByIds(userIds);

      expect(users).toHaveLength(2);
      expect(users.find((u) => u.id === user1Response.user.id)).toBeDefined();
      expect(users.find((u) => u.id === user2Response.user.id)).toBeDefined();
      expect(users.find((u) => u.email === 'user1@example.com')).toBeDefined();
      expect(users.find((u) => u.email === 'user2@example.com')).toBeDefined();
      // user3 should not be included
      expect(users.find((u) => u.id === user3Response.user.id)).toBeUndefined();
    });

    it('should handle empty userIds array', async () => {
      await apiService.signUp('test@example.com', 'password123');

      const users = await apiService.getUsersByIds([]);
      expect(users).toHaveLength(0);
    });

    it('should handle non-existent user IDs gracefully', async () => {
      const user1Response = await apiService.signUp(
        'existing@example.com',
        'password123'
      );

      const users = await apiService.getUsersByIds([
        user1Response.user.id,
        'non-existent-id',
      ]);
      expect(users).toHaveLength(1);
      expect(users[0].id).toBe(user1Response.user.id);
    });

    it('should require authenticated user for getUsersByIds', async () => {
      // Ensure no user is signed in
      await apiService.signOut();

      await expect(apiService.getUsersByIds(['some-id'])).rejects.toThrow(
        'No authenticated user'
      );
    });

    it('should reject signup with invalid email', async () => {
      await expect(
        apiService.signUp('invalid-email', 'password123')
      ).rejects.toThrow('Invalid email format');
    });

    it('should reject signup with short password', async () => {
      await expect(
        apiService.signUp('shortpassword@example.com', '123')
      ).rejects.toThrow('Password must be at least 6 characters');
    });

    it('should sign in existing user', async () => {
      // First create a user
      await apiService.signUp('signin-test@example.com', 'password123');

      // Sign out
      await apiService.signOut();

      // Sign in again
      const response = await apiService.signIn(
        'signin-test@example.com',
        'password123'
      );
      expect(response.user.email).toBe('signin-test@example.com');
    });

    it('should reject signin with non-existent user', async () => {
      await expect(
        apiService.signIn('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('Groups', () => {
    beforeEach(async () => {
      // Create and sign in a user for group tests
      await apiService.signUp('creator@example.com', 'password123');
    });

    it('should create a group successfully', async () => {
      const group = await apiService.createGroup('Test Group');

      expect(group.name).toBe('Test Group');
      expect(group.id).toBeDefined();
      expect(group.createdBy).toBeDefined();

      // Check that creator is automatically added as member
      const members = await apiService.getGroupMembers(group.id);
      expect(members).toHaveLength(1);
      expect(members[0].email).toBe('creator@example.com');
    });

    it('should create invite and allow joining group', async () => {
      const group = await apiService.createGroup('Test Group');
      const invite = await apiService.createInvite(
        group.id,
        'invitee@example.com'
      );

      expect(invite.token).toBeDefined();
      expect(invite.email).toBe('invitee@example.com');

      // Sign out creator and create new user
      await apiService.signOut();
      await apiService.signUp('invitee@example.com', 'password123');

      // Join group using invite
      const joinedGroup = await apiService.joinGroup(invite.token);
      expect(joinedGroup.id).toBe(group.id);

      // Check members count
      const members = await apiService.getGroupMembers(group.id);
      expect(members).toHaveLength(2);
    });

    it('should validate invite and return group info', async () => {
      const group = await apiService.createGroup('Test Group');
      const invite = await apiService.createInvite(
        group.id,
        'invitee@example.com'
      );

      // Validate the invite
      const validation = await apiService.validateInvite(invite.token);
      expect(validation.group.id).toBe(group.id);
      expect(validation.group.name).toBe('Test Group');
      expect(validation.invite.token).toBe(invite.token);
    });

    it('should reject invalid invite token', async () => {
      await expect(apiService.validateInvite('invalid-token')).rejects.toThrow(
        'Invalid or expired invite token'
      );
    });

    it('should work when invitation link is used with file storage (fixed scenario)', async () => {
      // This demonstrates that invitations work now with file storage
      // Using the sample invitation token from test data

      const storageWithSampleData = TestStorageDB.createWithSampleData();
      const newApiService = new MockApiService(storageWithSampleData);

      // Use the sample invitation from test data
      const sampleToken = 'sample-invite-token-123';

      // This should now work because the invitation exists in the test data
      const validation = await newApiService.validateInvite(sampleToken);
      expect(validation.group.name).toBe('Downtown Neighbors');
      expect(validation.invite.token).toBe(sampleToken);
      expect(validation.invite.email).toBe('newuser@example.com');
    });
  });

  describe('Requests', () => {
    let groupId: string;

    beforeEach(async () => {
      // Create user and group for request tests
      await apiService.signUp('requester@example.com', 'password123');
      const group = await apiService.createGroup('Test Group');
      groupId = group.id;
    });

    it('should create a request successfully', async () => {
      const requestForm = {
        itemDescription: 'Milk and bread',
        storePreference: 'Grocery Store',
        neededBy: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        pickupNotes: 'Please call when ready',
        groupId,
      };

      const request = await apiService.createRequest(requestForm);

      expect(request.itemDescription).toBe('Milk and bread');
      expect(request.storePreference).toBe('Grocery Store');
      expect(request.status).toBe('open');
      expect(request.groupId).toBe(groupId);
    });

    it('should get group requests', async () => {
      const requestForm = {
        itemDescription: 'Test item',
        neededBy: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        groupId,
      };

      await apiService.createRequest(requestForm);
      const requests = await apiService.getGroupRequests(groupId);

      expect(requests).toHaveLength(1);
      expect(requests[0].itemDescription).toBe('Test item');
    });

    it('should get user requests', async () => {
      const requestForm = {
        itemDescription: 'My test item',
        neededBy: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        groupId,
      };

      await apiService.createRequest(requestForm);
      const userRequests = await apiService.getUserRequests();

      expect(userRequests).toHaveLength(1);
      expect(userRequests[0].itemDescription).toBe('My test item');
      expect(userRequests[0].userId).toBe(
        await apiService.getCurrentUser().then((u) => u.id)
      );
    });

    it('should allow deleting own requests', async () => {
      const requestForm = {
        itemDescription: 'Test item to delete',
        neededBy: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        groupId,
      };

      const createdRequest = await apiService.createRequest(requestForm);

      // Verify request exists
      let userRequests = await apiService.getUserRequests();
      expect(userRequests).toHaveLength(1);

      // Delete the request
      await apiService.deleteRequest(createdRequest.id);

      // Verify request is deleted
      userRequests = await apiService.getUserRequests();
      expect(userRequests).toHaveLength(0);
    });

    it('should not allow deleting others requests', async () => {
      const requestForm = {
        itemDescription: 'Someone elses request',
        neededBy: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        groupId,
      };

      const createdRequest = await apiService.createRequest(requestForm);

      // Switch to different user
      await apiService.signOut();
      await apiService.signUp('other@example.com', 'password123');

      // Try to delete the request - should fail
      await expect(apiService.deleteRequest(createdRequest.id)).rejects.toThrow(
        'You can only delete your own requests'
      );
    });

    it('should not allow deleting fulfilled requests', async () => {
      const requestForm = {
        itemDescription: 'Test fulfilled request',
        neededBy: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        groupId,
      };

      const createdRequest = await apiService.createRequest(requestForm);

      // Create another user to claim and fulfill
      await apiService.signOut();
      await apiService.signUp('helper@example.com', 'password123');

      // Add helper to group (simplified for test)
      const groupMembers = storage.getGroupMembers();
      const users = storage.getUsers();
      const helperUser = users.find((u) => u.email === 'helper@example.com');

      if (helperUser) {
        groupMembers.push({
          groupId,
          userId: helperUser.id,
          joinedAt: new Date(),
        });
        storage.setGroupMembers(groupMembers);
      }

      // Claim and fulfill the request
      await apiService.claimRequest(createdRequest.id);
      await apiService.fulfillRequest(createdRequest.id);

      // Switch back to original user
      await apiService.signOut();
      await apiService.signIn('requester@example.com', 'password123');

      // Try to delete fulfilled request - should fail
      await expect(apiService.deleteRequest(createdRequest.id)).rejects.toThrow(
        'Cannot delete a fulfilled request'
      );
    });

    it('should allow claiming and fulfilling requests', async () => {
      // Create request
      const requestForm = {
        itemDescription: 'Test item',
        neededBy: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        groupId,
      };

      const request = await apiService.createRequest(requestForm);

      // Create another user to claim the request
      await apiService.signOut();
      await apiService.signUp('helper@example.com', 'password123');

      // Add helper to group by creating an invite from the original group
      // We need to simulate getting the invite from the group creator
      // For this test, we'll create a direct membership
      const groupMembers = storage.getGroupMembers();
      const users = storage.getUsers();
      const helperUser = users.find((u) => u.email === 'helper@example.com');

      if (helperUser) {
        groupMembers.push({
          groupId,
          userId: helperUser.id,
          joinedAt: new Date(),
        });
        storage.setGroupMembers(groupMembers);
      }

      // Claim request
      const claimedRequest = await apiService.claimRequest(request.id);
      expect(claimedRequest.status).toBe('claimed');
      expect(claimedRequest.claimedBy).toBeDefined();

      // Fulfill request
      const fulfilledRequest = await apiService.fulfillRequest(request.id);
      expect(fulfilledRequest.status).toBe('fulfilled');
    });

    it('should allow unclaiming a claimed request', async () => {
      // Create request as original user
      const requestForm = {
        itemDescription: 'Test item for unclaiming',
        neededBy: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        groupId,
      };

      const request = await apiService.createRequest(requestForm);

      // Create helper user and join group
      await apiService.signOut();
      await apiService.signUp('helper2@example.com', 'password123');

      // Add helper to group
      const groupMembers = storage.getGroupMembers();
      const users = storage.getUsers();
      const helperUser = users.find((u) => u.email === 'helper2@example.com');

      if (helperUser) {
        groupMembers.push({
          groupId,
          userId: helperUser.id,
          joinedAt: new Date(),
        });
        storage.setGroupMembers(groupMembers);
      }

      const claimedRequest = await apiService.claimRequest(request.id);
      expect(claimedRequest.status).toBe('claimed');
      expect(claimedRequest.claimedBy).toBeDefined();

      // Unclaim the request
      const unclaimedRequest = await apiService.unclaimRequest(request.id);
      expect(unclaimedRequest.status).toBe('open');
      expect(unclaimedRequest.claimedBy).toBeUndefined();
      expect(unclaimedRequest.claimedAt).toBeUndefined();
    });

    it('should not allow unclaiming a request not claimed by the user', async () => {
      // Create request as original user
      const requestForm = {
        itemDescription: 'Test item for unclaim error',
        neededBy: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        groupId,
      };

      const request = await apiService.createRequest(requestForm);

      // Create helper user and join group
      await apiService.signOut();
      await apiService.signUp('helper3@example.com', 'password123');

      // Add helper to group
      const groupMembers = storage.getGroupMembers();
      const users = storage.getUsers();
      const helperUser = users.find((u) => u.email === 'helper3@example.com');

      if (helperUser) {
        groupMembers.push({
          groupId,
          userId: helperUser.id,
          joinedAt: new Date(),
        });
        storage.setGroupMembers(groupMembers);
      }

      await apiService.claimRequest(request.id);

      // Switch back to original user and try to unclaim (should fail)
      await apiService.signOut();
      await apiService.signIn('requester@example.com', 'password123');

      await expect(apiService.unclaimRequest(request.id)).rejects.toThrow(
        'You can only unclaim requests that you have claimed'
      );
    });

    it('should not allow unclaiming an open request', async () => {
      // Create request
      const requestForm = {
        itemDescription: 'Test item for unclaim open error',
        neededBy: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        groupId,
      };

      const request = await apiService.createRequest(requestForm);

      // Try to unclaim an open request (should fail)
      await expect(apiService.unclaimRequest(request.id)).rejects.toThrow(
        'Request is not claimed'
      );
    });
  });
});
