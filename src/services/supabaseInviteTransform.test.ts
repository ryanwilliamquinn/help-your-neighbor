// Test the invitation data transformation logic
// This tests the core logic that handles different Supabase join response formats

describe('Supabase Invitation Data Transformation', () => {
  // Extract the transformation logic for testing (mirrors supabaseApiService.ts)
  const transformInviteData = (invite: {
    id: string;
    group_id: string;
    groups: { name: string }[] | { name: string } | null;
    users: { name: string }[] | { name: string } | null;
    email: string;
    token: string;
    expires_at: string;
    created_at: string;
  }): {
    id: string;
    groupId: string;
    groupName: string;
    inviterName: string;
    email: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
  } => {
    let groupName = 'Unknown Group';
    let inviterName = 'Unknown User';

    if (Array.isArray(invite.groups) && invite.groups.length > 0) {
      groupName = invite.groups[0].name;
    } else if (invite.groups && !Array.isArray(invite.groups)) {
      groupName = invite.groups.name;
    }

    if (Array.isArray(invite.users) && invite.users.length > 0) {
      inviterName = invite.users[0].name;
    } else if (invite.users && !Array.isArray(invite.users)) {
      inviterName = invite.users.name;
    }

    return {
      id: invite.id,
      groupId: invite.group_id,
      groupName,
      inviterName,
      email: invite.email,
      token: invite.token,
      expiresAt: new Date(invite.expires_at),
      createdAt: new Date(invite.created_at),
    };
  };

  const createMockInviteData = (
    groups: { name: string }[] | { name: string } | null,
    users: { name: string }[] | { name: string } | null,
    overrides: Partial<{
      id: string;
      group_id: string;
      email: string;
      token: string;
      expires_at: string;
      created_at: string;
    }> = {}
  ): {
    id: string;
    group_id: string;
    email: string;
    token: string;
    expires_at: string;
    created_at: string;
    groups: { name: string }[] | { name: string } | null;
    users: { name: string }[] | { name: string } | null;
  } => ({
    id: 'invite-123',
    group_id: 'group-456',
    email: 'test@example.com',
    token: 'token-789',
    expires_at: '2024-12-31T23:59:59.000Z',
    created_at: '2024-01-01T00:00:00.000Z',
    groups,
    users,
    ...overrides,
  });

  it('should handle array format joins correctly', () => {
    const mockData = [
      createMockInviteData([{ name: 'Test Group' }], [{ name: 'John Doe' }]),
    ];

    const result = mockData.map(transformInviteData);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'invite-123',
      groupId: 'group-456',
      groupName: 'Test Group',
      inviterName: 'John Doe',
      email: 'test@example.com',
      token: 'token-789',
      expiresAt: new Date('2024-12-31T23:59:59.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    });
  });

  it('should handle single object format joins correctly', () => {
    const mockData = [
      createMockInviteData({ name: 'Test Group' }, { name: 'John Doe' }),
    ];

    const result = mockData.map(transformInviteData);

    expect(result).toHaveLength(1);
    expect(result[0].groupName).toBe('Test Group');
    expect(result[0].inviterName).toBe('John Doe');
  });

  it('should handle empty arrays gracefully', () => {
    const mockData = [createMockInviteData([], [])];

    const result = mockData.map(transformInviteData);

    expect(result).toHaveLength(1);
    expect(result[0].groupName).toBe('Unknown Group');
    expect(result[0].inviterName).toBe('Unknown User');
  });

  it('should handle null joins gracefully', () => {
    const mockData = [createMockInviteData(null, null)];

    const result = mockData.map(transformInviteData);

    expect(result).toHaveLength(1);
    expect(result[0].groupName).toBe('Unknown Group');
    expect(result[0].inviterName).toBe('Unknown User');
  });

  it('should handle mixed scenarios correctly', () => {
    const mockData = [
      // Array with data
      createMockInviteData([{ name: 'Group 1' }], [{ name: 'User 1' }]),
      // Single object
      createMockInviteData({ name: 'Group 2' }, { name: 'User 2' }),
      // Empty array
      createMockInviteData([], []),
      // Null values
      createMockInviteData(null, null),
    ];

    const result = mockData.map(transformInviteData);

    expect(result).toHaveLength(4);

    expect(result[0].groupName).toBe('Group 1');
    expect(result[0].inviterName).toBe('User 1');

    expect(result[1].groupName).toBe('Group 2');
    expect(result[1].inviterName).toBe('User 2');

    expect(result[2].groupName).toBe('Unknown Group');
    expect(result[2].inviterName).toBe('Unknown User');

    expect(result[3].groupName).toBe('Unknown Group');
    expect(result[3].inviterName).toBe('Unknown User');
  });

  it('should convert dates correctly', () => {
    const mockData = [
      createMockInviteData([{ name: 'Test Group' }], [{ name: 'John Doe' }], {
        expires_at: '2024-12-31T23:59:59.999Z',
        created_at: '2024-01-01T12:30:45.123Z',
      }),
    ];

    const result = mockData.map(transformInviteData);

    expect(result[0].expiresAt).toBeInstanceOf(Date);
    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[0].expiresAt.toISOString()).toBe('2024-12-31T23:59:59.999Z');
    expect(result[0].createdAt.toISOString()).toBe('2024-01-01T12:30:45.123Z');
  });

  it('should handle partial data gracefully', () => {
    const mockData = [
      createMockInviteData(
        [{ name: 'Test Group' }],
        [] // Empty users array
      ),
      createMockInviteData(
        [], // Empty groups array
        [{ name: 'John Doe' }]
      ),
    ];

    const result = mockData.map(transformInviteData);

    expect(result).toHaveLength(2);
    expect(result[0].groupName).toBe('Test Group');
    expect(result[0].inviterName).toBe('Unknown User');
    expect(result[1].groupName).toBe('Unknown Group');
    expect(result[1].inviterName).toBe('John Doe');
  });

  it('should handle arrays with multiple items by taking the first', () => {
    const mockData = [
      createMockInviteData(
        [{ name: 'First Group' }, { name: 'Second Group' }],
        [{ name: 'First User' }, { name: 'Second User' }]
      ),
    ];

    const result = mockData.map(transformInviteData);

    expect(result[0].groupName).toBe('First Group'); // Takes first item
    expect(result[0].inviterName).toBe('First User'); // Takes first item
  });
});
