import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { execute, queryOne, transaction } from '../config/database.js';

function generateAvatar(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export const authService = {
  async register({ name, username, email, password, role = 'student', classCode }) {
    if (!name || !username || !email || !password) {
      const err = new Error('Name, username, email, and password are required.');
      err.statusCode = 400;
      throw err;
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      const err = new Error('Full name must be between 2 and 100 characters.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(normalizedEmail)) {
      const err = new Error('Please provide a valid email address.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedUsername = username.trim().toLowerCase().replace(/^@/, '');
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(normalizedUsername)) {
      const err = new Error('Username must be 3-30 characters and contain only letters, numbers, hyphens, and underscores.');
      err.statusCode = 400;
      throw err;
    }

    // Password complexity: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const hasMinLen = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\\/~`';]/.test(password);

    if (!hasMinLen || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      const err = new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      err.statusCode = 400;
      throw err;
    }

    const validRole = role === 'teacher' ? 'teacher' : 'student';

    // Check unique email and username
    const existingEmail = queryOne('SELECT id FROM users WHERE email = ?;', [normalizedEmail]);
    if (existingEmail) {
      const err = new Error('An account with this email already exists.');
      err.statusCode = 409;
      throw err;
    }

    const existingUsername = queryOne('SELECT id FROM users WHERE username = ?;', [normalizedUsername]);
    if (existingUsername) {
      const err = new Error('Username is already taken. Please choose another.');
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const avatar = generateAvatar(trimmedName);

    return transaction(() => {
      const userInsert = execute(
        `INSERT INTO users (name, username, email, password_hash, role, avatar, xp, points, rank, email_verified)
         VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'Level 1', 0);`,
        [trimmedName, normalizedUsername, normalizedEmail, passwordHash, validRole, avatar]
      );

      const userId = Number(userInsert.lastInsertRowid);

      // If user is joining with an optional class code
      if (classCode) {
        const foundClass = queryOne('SELECT id FROM classes WHERE code = ?;', [classCode.trim().toUpperCase()]);
        if (foundClass) {
          execute(
            `INSERT OR IGNORE INTO class_members (class_id, user_id, role)
             VALUES (?, ?, ?);`,
            [foundClass.id, userId, validRole]
          );
        }
      }

      // Add initial welcome notification
      execute(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, 'Welcome to ProjNaN!', 'Your account has been created. Start collaborating or join a class.', 'system');`,
        [userId]
      );

      const newUser = queryOne(
        'SELECT id, name, username, email, role, avatar, xp, points, rank, bio, github_username, email_verified, created_at FROM users WHERE id = ?;',
        [userId]
      );

      const token = generateToken(newUser);

      return {
        user: newUser,
        token,
      };
    });
  },

  async login({ email, password }) {
    if (!email || !password) {
      const err = new Error('Email and password are required.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = queryOne(
      'SELECT id, name, username, email, password_hash, role, avatar, xp, points, rank, bio, github_username, email_verified FROM users WHERE email = ?;',
      [normalizedEmail]
    );

    if (!user) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    // Exclude password_hash
    const { password_hash, ...safeUser } = user;
    const token = generateToken(safeUser);

    return {
      user: safeUser,
      token,
    };
  },

  getCurrentUser(userId) {
    const user = queryOne(
      'SELECT id, name, username, email, role, avatar, xp, points, rank, bio, github_username, email_verified, created_at FROM users WHERE id = ?;',
      [userId]
    );

    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    // Include quick counts
    const classCount = queryOne('SELECT COUNT(*) as count FROM class_members WHERE user_id = ?;', [userId])?.count || 0;
    const teamCount = queryOne('SELECT COUNT(*) as count FROM team_members WHERE user_id = ?;', [userId])?.count || 0;

    return {
      ...user,
      stats: {
        classes: classCount,
        teams: teamCount,
      },
    };
  },
};
