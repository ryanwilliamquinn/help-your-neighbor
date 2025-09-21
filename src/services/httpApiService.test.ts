import { HttpApiService } from './httpApiService';
import type { CreateRequestForm } from '../types';

// Mock fetch globally
global.fetch = jest.fn();

describe('HttpApiService', () => {
  let httpApiService: HttpApiService;

  beforeEach(() => {
    httpApiService = new HttpApiService();
    (fetch as jest.Mock).mockClear();
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createRequest', () => {
    it('should map frontend form fields to server API fields', async () => {
      const mockResponse = {
        id: 'request-123',
        title: 'Test Item',
        description:
          'Store: Test Store\nNotes: Test notes\nNeeded by: 2024-01-15T10:00',
        requesterId: 'user-123',
        groupId: 'group-123',
        status: 'open',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const formData: CreateRequestForm = {
        itemDescription: 'Test Item',
        storePreference: 'Test Store',
        neededBy: '2024-01-15T10:00',
        pickupNotes: 'Test notes',
        groupId: 'group-123',
      };

      const result = await httpApiService.createRequest(formData);

      // Verify the correct API endpoint was called
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3002/api/requests',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            title: 'Test Item',
            description:
              'Store: Test Store\nNotes: Test notes\nNeeded by: 2024-01-15T10:00',
            groupId: 'group-123',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle optional fields correctly', async () => {
      const mockResponse = {
        id: 'request-123',
        title: 'Test Item',
        description: 'Needed by: 2024-01-15T10:00',
        requesterId: 'user-123',
        groupId: 'group-123',
        status: 'open',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const formData: CreateRequestForm = {
        itemDescription: 'Test Item',
        neededBy: '2024-01-15T10:00',
        groupId: 'group-123',
      };

      const result = await httpApiService.createRequest(formData);

      // Verify the request body only includes needed by for description
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3002/api/requests',
        expect.objectContaining({
          body: JSON.stringify({
            title: 'Test Item',
            description: 'Needed by: 2024-01-15T10:00',
            groupId: 'group-123',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when server returns error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Title is required' }),
      });

      const formData: CreateRequestForm = {
        itemDescription: '',
        neededBy: '2024-01-15T10:00',
        groupId: 'group-123',
      };

      await expect(httpApiService.createRequest(formData)).rejects.toThrow(
        'Title is required'
      );
    });
  });

  describe('authentication', () => {
    it('should include Authorization header when session token exists', async () => {
      // Set up a session token
      localStorage.setItem('session-token', 'test-token-123');

      // Create new instance to pick up the token
      httpApiService = new HttpApiService();

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await httpApiService.getUserRequests();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3002/api/user/requests',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );
    });
  });
});
