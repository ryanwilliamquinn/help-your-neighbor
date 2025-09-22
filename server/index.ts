import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { randomUUID, randomBytes } from 'crypto';
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

// CORS configuration - restrict to known origins in production
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (error: Error | null, success?: boolean) => void
  ): void {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // Alternative dev port
      'http://localhost:4173', // Vite preview
      // Add production domains here when deploying
      // 'https://your-domain.com',
      // 'https://www.your-domain.com'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked origin ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies/auth headers
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Add request size limit

// Input validation helpers
function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6;
}

function validateRequired(value: unknown, fieldName: string): string {
  if (!value || (typeof value === 'string' && !value.trim())) {
    throw new Error(`${fieldName} is required`);
  }
  return typeof value === 'string' ? value.trim() : String(value);
}

function sanitizeInput(input: string): string {
  if (!input) return '';
  // Basic sanitization - remove HTML tags and trim
  return input
    .trim()
    .replace(/<script.*?>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '');
}

function validateStringLength(
  value: string,
  fieldName: string,
  minLength: number = 1,
  maxLength: number = 1000
): string {
  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(
      `${fieldName} must be no more than ${maxLength} characters`
    );
  }
  return sanitizeInput(trimmed);
}

// Helper function to generate invite token
function generateToken(): string {
  // Use Node.js crypto module for secure token generation
  try {
    return randomUUID();
  } catch {
    // Fallback to crypto.randomBytes if randomUUID is not available
    try {
      return randomBytes(16).toString('hex');
    } catch {
      // This fallback should only be used in development environments
      return Math.random().toString(36).substr(2, 20);
    }
  }
}

// Initialize storage
await storage.load();

// Auth endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
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
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const data = storage.getData();
    const user = data.users.find((u) => u.email === email.trim());

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const sessionToken = createSession(user);

    res.json({
      user,
      session: sessionToken,
    });
  } catch (error) {
    console.error('Signin error:', error);
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
  try {
    const user = (req as AuthenticatedRequest).user;
    const data = storage.getData();

    const userRequests = data.requests.filter((r) => r.userId === user.id);
    res.json(userRequests);
  } catch (error) {
    console.error(
      'Error fetching user requests:',
      error instanceof Error ? error.message : 'Unknown error'
    );
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
    console.error(
      'Error in batch user lookup:',
      error instanceof Error ? error.message : 'Unknown error'
    );
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

    // Validate input
    const validatedName = name
      ? validateStringLength(name, 'Name', 1, 100)
      : data.users[userIndex].name;
    const validatedPhone = phone
      ? validateStringLength(phone, 'Phone', 10, 20)
      : data.users[userIndex].phone;
    const validatedArea = generalArea
      ? validateStringLength(generalArea, 'General area', 1, 100)
      : data.users[userIndex].generalArea;

    data.users[userIndex] = {
      ...data.users[userIndex],
      name: validatedName,
      phone: validatedPhone,
      generalArea: validatedArea,
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

    // Validate required fields
    const validatedItemDescription = validateStringLength(
      validateRequired(itemDescription, 'Item description'),
      'Item description',
      3,
      500
    );

    const validatedGroupId = validateRequired(groupId, 'Group ID');

    // Validate optional fields
    const validatedStorePreference = storePreference
      ? validateStringLength(storePreference, 'Store preference', 1, 100)
      : '';

    const validatedPickupNotes = pickupNotes
      ? validateStringLength(pickupNotes, 'Pickup notes', 1, 500)
      : '';

    // Validate date
    if (!neededBy) {
      return res.status(400).json({ error: 'Needed by date is required' });
    }

    const neededByDate = new Date(neededBy);
    if (isNaN(neededByDate.getTime())) {
      return res.status(400).json({ error: 'Invalid needed by date' });
    }

    if (neededByDate <= new Date()) {
      return res
        .status(400)
        .json({ error: 'Needed by date must be in the future' });
    }

    const data = storage.getData();
    const group = data.groups.find((g) => g.id === validatedGroupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Verify user is member of this group
    const userMembership = data.groupMembers.find(
      (gm) => gm.groupId === validatedGroupId && gm.userId === user.id
    );

    if (!userMembership) {
      return res
        .status(403)
        .json({ error: 'You are not a member of this group' });
    }

    const newRequest: RequestType = {
      id: storage.generateId(),
      userId: user.id,
      itemDescription: validatedItemDescription,
      pickupNotes: validatedPickupNotes,
      storePreference: validatedStorePreference,
      neededBy: neededByDate.toISOString(),
      groupId: validatedGroupId,
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

    // Validate requestId
    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    const data = storage.getData();

    const requestIndex = data.requests.findIndex((r) => r.id === requestId);
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = data.requests[requestIndex];

    // Atomic check and update to prevent race conditions
    if (request.status !== 'open') {
      return res
        .status(400)
        .json({ error: 'Request is not available for claiming' });
    }

    if (request.userId === user.id) {
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

    // Double-check the status hasn't changed (simple race condition protection)
    const latestData = storage.getData();
    const latestRequest = latestData.requests.find((r) => r.id === requestId);

    if (!latestRequest || latestRequest.status !== 'open') {
      return res
        .status(409)
        .json({ error: 'Request was claimed by someone else' });
    }

    // Update with atomic operation
    const updatedRequest = {
      ...latestRequest,
      status: 'claimed',
      claimedBy: user.id,
      claimedAt: new Date().toISOString(),
    };

    const latestRequestIndex = latestData.requests.findIndex(
      (r) => r.id === requestId
    );
    latestData.requests[latestRequestIndex] = updatedRequest;

    await storage.save();
    res.json(updatedRequest);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/requests/:requestId/unclaim', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const user = (req as AuthenticatedRequest).user;

    // Validate requestId
    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ error: 'Invalid request ID' });
    }

    const data = storage.getData();

    const requestIndex = data.requests.findIndex((r) => r.id === requestId);
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = data.requests[requestIndex];

    if (request.status !== 'claimed') {
      return res.status(400).json({ error: 'Request is not claimed' });
    }

    if (request.claimedBy !== user.id) {
      return res
        .status(403)
        .json({ error: 'You can only unclaim requests that you have claimed' });
    }

    // Double-check the status hasn't changed (race condition protection)
    const latestData = storage.getData();
    const latestRequest = latestData.requests.find((r) => r.id === requestId);

    if (
      !latestRequest ||
      latestRequest.status !== 'claimed' ||
      latestRequest.claimedBy !== user.id
    ) {
      return res.status(409).json({
        error: 'Request status has changed, please refresh and try again',
      });
    }

    // Update with atomic operation
    const updatedRequest = {
      ...latestRequest,
      status: 'open',
      claimedBy: undefined,
      claimedAt: undefined,
    };

    const latestRequestIndex = latestData.requests.findIndex(
      (r) => r.id === requestId
    );
    latestData.requests[latestRequestIndex] = updatedRequest;

    await storage.save();
    res.json(updatedRequest);
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

    if (request.claimedBy !== user.id) {
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
