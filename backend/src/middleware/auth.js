import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { queryOne } from '../config/database.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a Bearer token.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = queryOne(
      'SELECT id, name, username, email, role, avatar, xp, points, rank, bio, github_username FROM users WHERE id = ?;',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
}
