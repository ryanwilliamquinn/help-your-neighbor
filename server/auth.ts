import { Request, Response, NextFunction } from 'express';
import { User, storage, Session } from './storage.js';

// Simple session management using persistent storage
// In production, this would use JWT tokens or session middleware

export function generateSessionToken(): string {
  return 'session-' + Math.random().toString(36).substr(2, 16);
}

export function createSession(user: User): string {
  const token = generateSessionToken();
  const session: Session = {
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
  };

  const sessions = storage.getSessions();
  sessions.push(session);
  storage.setSessions(sessions);
  storage.save(); // Persist to file

  return token;
}

export function getSessionUser(token: string): User | null {
  const sessions = storage.getSessions();
  const session = sessions.find(
    (s) => s.token === token && new Date() < new Date(s.expiresAt)
  );

  if (!session) {
    return null;
  }

  const users = storage.getUsers();
  return users.find((u) => u.id === session.userId) || null;
}

export function clearSession(token: string): void {
  const sessions = storage.getSessions();
  const filteredSessions = sessions.filter((s) => s.token !== token);
  storage.setSessions(filteredSessions);
  storage.save(); // Persist to file
}

// Middleware to extract current user from Authorization header
export async function getCurrentUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return getSessionUser(token);
}

// Middleware to require authentication
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  (req as Request & { user: User }).user = user;
  next();
}
