import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import {
  storage,
  User,
  Group,
  Invite,
  Request as RequestType,
} from './storage.js';
import { createSession, requireAuth } from './auth.js';

interface AuthenticatedRequest extends express.Request {
  user: User;
}

const app = express();
const PORT = 3002;

// Middleware
app.use(morgan('combined')); // Log all HTTP requests
app.use(cors());
app.use(express.json());

// Helper function to validate email
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to generate invite token
function generateToken(): string {
  return Math.random().toString(36).substr(2, 20);
}

// Initialize storage
await storage.load();

// Auth endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters' });
    }

    const data = storage.getData();
    const existingUser = data.users.find((u) => u.email === email);

    if (existingUser) {
      return res
        .status(400)
        .json({ error: 'User already exists with this email' });
    }

    const newUser: User = {
      id: storage.generateId(),
      email,
      name: '',
      phone: '',
      generalArea: '',
      createdAt: new Date().toISOString(),
    };

    data.users.push(newUser);
    await storage.save();

    const sessionToken = createSession(newUser);

    res.json({
      user: newUser,
      session: sessionToken,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const data = storage.getData();
    const user = data.users.find((u) => u.email === email);

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (password.length === 0) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const sessionToken = createSession(user);

    res.json({
      user,
      session: sessionToken,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/signout', async (req, res) => {
  try {
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User endpoints
app.get('/api/user/current', requireAuth, async (req, res) => {
  res.json((req as AuthenticatedRequest).user);
});

// Move /api/user/requests BEFORE the parameterized route to avoid conflicts
app.get('/api/user/requests', requireAuth, async (req, res) => {
  console.log('🚀 START OF /api/user/requests ROUTE');
  try {
    const user = (req as AuthenticatedRequest).user;
    console.log('🚀 user:', user);
    const data = storage.getData();

    const userRequests = data.requests.filter((r) => r.userId === user.id);
    console.log('🚀 Found user requests:', userRequests.length);
    res.json(userRequests);
  } catch (error) {
    console.log('🚀 ERROR in /api/user/requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Batch user lookup endpoint
app.post('/api/users/batch', requireAuth, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ error: 'userIds must be an array' });
    }

    const data = storage.getData();
    const users = data.users.filter((user) => userIds.includes(user.id));
    res.json(users);
  } catch (error) {
    console.log('🚀 ERROR in /api/users/batch:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user/:userId', requireAuth, async (req, res) => {
  try {
    const data = storage.getData();
    const user = data.users.find((u) => u.id === req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { name, phone, generalArea } = req.body;
    const data = storage.getData();

    const userIndex = data.users.findIndex((u) => u.id === user.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    data.users[userIndex] = {
      ...data.users[userIndex],
      name: name || data.users[userIndex].name,
      phone: phone || data.users[userIndex].phone,
      generalArea: generalArea || data.users[userIndex].generalArea,
    };

    await storage.save();
    res.json(data.users[userIndex]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Group endpoints
app.post('/api/groups', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    const user = (req as AuthenticatedRequest).user;

    const trimmedName = name?.trim();
    if (!trimmedName) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const newGroup: Group = {
      id: storage.generateId(),
      name: trimmedName,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };

    const data = storage.getData();
    data.groups.push(newGroup);

    // Add creator as group member
    data.groupMembers.push({
      groupId: newGroup.id,
      userId: user.id,
      joinedAt: new Date().toISOString(),
    });

    await storage.save();
    res.json(newGroup);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/groups', requireAuth, async (req, res) => {
  console.log('getting api groups');
  try {
    const user = (req as AuthenticatedRequest).user;
    const data = storage.getData();

    const userGroupIds = data.groupMembers
      .filter((member) => member.userId === user.id)
      .map((member) => member.groupId);

    const userGroups = data.groups.filter((group) =>
      userGroupIds.includes(group.id)
    );
    res.json(userGroups);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/groups/:groupId/members', requireAuth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const user = (req as AuthenticatedRequest).user;
    const data = storage.getData();

    // Verify user is member of this group
    const userMembership = data.groupMembers.find(
      (gm) => gm.groupId === groupId && gm.userId === user.id
    );

    if (!userMembership) {
      return res
        .status(403)
        .json({ error: 'You are not a member of this group' });
    }

    const memberUserIds = data.groupMembers
      .filter((gm) => gm.groupId === groupId)
      .map((gm) => gm.userId);

    const members = data.users.filter((user) =>
      memberUserIds.includes(user.id)
    );
    res.json(members);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/groups/:groupId/leave', requireAuth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const user = (req as AuthenticatedRequest).user;
    const data = storage.getData();

    const group = data.groups.find((g) => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.createdBy === user.id) {
      return res
        .status(400)
        .json({ error: 'Group creators cannot leave their own group' });
    }

    const membershipIndex = data.groupMembers.findIndex(
      (gm) => gm.groupId === groupId && gm.userId === user.id
    );

    if (membershipIndex === -1) {
      return res
        .status(400)
        .json({ error: 'You are not a member of this group' });
    }

    data.groupMembers.splice(membershipIndex, 1);
    await storage.save();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete(
  '/api/groups/:groupId/members/:userId',
  requireAuth,
  async (req, res) => {
    try {
      const { groupId, userId } = req.params;
      const user = (req as AuthenticatedRequest).user;
      const data = storage.getData();

      const group = data.groups.find((g) => g.id === groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (group.createdBy !== user.id) {
        return res
          .status(403)
          .json({ error: 'Only group creators can remove members' });
      }

      if (userId === user.id) {
        return res
          .status(400)
          .json({ error: 'Group creators cannot remove themselves' });
      }

      const membershipIndex = data.groupMembers.findIndex(
        (gm) => gm.groupId === groupId && gm.userId === userId
      );

      if (membershipIndex === -1) {
        return res
          .status(400)
          .json({ error: 'User is not a member of this group' });
      }

      data.groupMembers.splice(membershipIndex, 1);
      await storage.save();
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Request endpoints
app.post('/api/requests', requireAuth, async (req, res) => {
  try {
    const { itemDescription, storePreference, neededBy, pickupNotes, groupId } =
      req.body;
    const user = (req as AuthenticatedRequest).user;

    if (!itemDescription?.trim()) {
      return res.status(400).json({ error: 'Item description is required' });
    }

    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    const data = storage.getData();
    const group = data.groups.find((g) => g.id === groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Verify user is member of this group
    const userMembership = data.groupMembers.find(
      (gm) => gm.groupId === groupId && gm.userId === user.id
    );

    if (!userMembership) {
      return res
        .status(403)
        .json({ error: 'You are not a member of this group' });
    }

    const newRequest: RequestType = {
      id: storage.generateId(),
      userId: user.id,
      itemDescription: itemDescription.trim(),
      pickupNotes: pickupNotes.trim() || '',
      storePreference: storePreference?.trim() || '',
      neededBy: neededBy,
      groupId,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    data.requests.push(newRequest);
    await storage.save();
    res.json(newRequest);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test route to verify basic routing works
app.get('/api/test', (req, res) => {
  console.log('TEST ROUTE HIT');
  res.json({ message: 'Test route working' });
});

app.get('/api/groups/:groupId/requests', requireAuth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const user = (req as AuthenticatedRequest).user;
    const data = storage.getData();

    // Verify user is member of this group
    const userMembership = data.groupMembers.find(
      (gm) => gm.groupId === groupId && gm.userId === user.id
    );

    if (!userMembership) {
      return res
        .status(403)
        .json({ error: 'You are not a member of this group' });
    }

    const groupRequests = data.requests.filter((r) => r.groupId === groupId);
    res.json(groupRequests);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/requests/:requestId/claim', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const user = (req as AuthenticatedRequest).user;
    const data = storage.getData();

    const requestIndex = data.requests.findIndex((r) => r.id === requestId);
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = data.requests[requestIndex];

    if (request.status !== 'open') {
      return res
        .status(400)
        .json({ error: 'Request is not available for claiming' });
    }

    if (request.requesterId === user.id) {
      return res
        .status(400)
        .json({ error: 'You cannot claim your own request' });
    }

    // Verify user is member of the same group
    const userMembership = data.groupMembers.find(
      (gm) => gm.groupId === request.groupId && gm.userId === user.id
    );

    if (!userMembership) {
      return res
        .status(403)
        .json({ error: 'You are not a member of this group' });
    }

    await storage.save();
    res.json(data.requests[requestIndex]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/requests/:requestId/fulfill', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const user = (req as AuthenticatedRequest).user;
    const data = storage.getData();

    const requestIndex = data.requests.findIndex((r) => r.id === requestId);
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = data.requests[requestIndex];

    if (request.status !== 'claimed') {
      return res
        .status(400)
        .json({ error: 'Request must be claimed before it can be fulfilled' });
    }

    if (request.helperId !== user.id) {
      return res
        .status(403)
        .json({ error: 'Only the helper can fulfill this request' });
    }

    data.requests[requestIndex] = {
      ...request,
      status: 'fulfilled',
      fulfilledAt: new Date().toISOString(),
    };

    await storage.save();
    res.json(data.requests[requestIndex]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/requests/:requestId', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const user = (req as AuthenticatedRequest).user;
    const data = storage.getData();

    const requestIndex = data.requests.findIndex((r) => r.id === requestId);
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = data.requests[requestIndex];

    if (request.userId !== user.id) {
      return res
        .status(403)
        .json({ error: 'You can only delete your own requests' });
    }

    data.requests.splice(requestIndex, 1);
    await storage.save();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invite endpoints
app.post('/api/invites', requireAuth, async (req, res) => {
  try {
    const { groupId, email } = req.body;
    const user = (req as AuthenticatedRequest).user;

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const data = storage.getData();
    const group = data.groups.find((g) => g.id === groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.createdBy !== user.id) {
      return res
        .status(403)
        .json({ error: 'Only group creators can send invites' });
    }

    const newInvite: Invite = {
      id: storage.generateId(),
      groupId,
      email,
      token: generateToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      createdAt: new Date().toISOString(),
    };

    data.invites.push(newInvite);
    await storage.save();

    res.json(newInvite);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/invites/validate/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const data = storage.getData();

    const invite = data.invites.find((i) => i.token === token && !i.usedAt);
    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invite token' });
    }

    if (new Date() > new Date(invite.expiresAt)) {
      return res.status(400).json({ error: 'Invite has expired' });
    }

    const group = data.groups.find((g) => g.id === invite.groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ group, invite });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/invites/:token/join', requireAuth, async (req, res) => {
  try {
    const { token } = req.params;
    const user = (req as AuthenticatedRequest).user;
    const data = storage.getData();

    const invite = data.invites.find((i) => i.token === token && !i.usedAt);
    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invite token' });
    }

    if (new Date() > new Date(invite.expiresAt)) {
      return res.status(400).json({ error: 'Invite has expired' });
    }

    const group = data.groups.find((g) => g.id === invite.groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is already a member
    const existingMembership = data.groupMembers.find(
      (gm) => gm.groupId === group.id && gm.userId === user.id
    );

    if (existingMembership) {
      return res
        .status(400)
        .json({ error: 'You are already a member of this group' });
    }

    // Add user to group
    data.groupMembers.push({
      groupId: group.id,
      userId: user.id,
      joinedAt: new Date().toISOString(),
    });

    // Mark invite as used
    invite.usedAt = new Date().toISOString();

    await storage.save();
    res.json(group);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT);

// Graceful shutdown
process.on('SIGTERM', async () => {
  process.exit(0);
});
