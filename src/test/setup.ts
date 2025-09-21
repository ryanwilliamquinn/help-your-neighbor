import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for Jest environment
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextEncoder, TextDecoder });

// Polyfill fetch for Jest environment with a simple mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        users: [
          {
            id: 'alice-001',
            email: 'alice@example.com',
            name: 'Alice Johnson',
            phone: '555-0101',
            generalArea: 'Downtown',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        groups: [
          {
            id: 'group-001',
            name: 'Downtown Neighbors',
            createdBy: 'alice-001',
            createdAt: '2024-01-01T01:00:00.000Z',
          },
        ],
        groupMembers: [
          {
            groupId: 'group-001',
            userId: 'alice-001',
            joinedAt: '2024-01-01T01:00:00.000Z',
          },
        ],
        requests: [],
        invites: [
          {
            id: 'invite-001',
            token: 'sample-invite-token-123',
            groupId: 'group-001',
            email: 'newuser@example.com',
            createdAt: '2024-01-01T02:00:00.000Z',
            expiresAt: '2026-01-01T02:00:00.000Z',
          },
        ],
        currentUser: null,
        lastUpdated: '2024-01-01T00:00:00.000Z',
      }),
  })
) as jest.Mock;
