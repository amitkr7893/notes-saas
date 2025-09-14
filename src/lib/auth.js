import jwt from 'jsonwebtoken';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET;

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// wrapper for API routes
export function withAuth(handler, options = {}) {
  return async (req, res) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Missing token' });
      const payload = verifyToken(token);
      req.user = payload; // { userId, tenantId, role }
      if (options.roles && !options.roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      return handler(req, res);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
