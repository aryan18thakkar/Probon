import crypto from 'crypto';
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
    const verificationToken = crypto.randomBytes(32).toString('hex');

    return transaction(() => {
      const userInsert = execute(
        `INSERT INTO users (name, username, email, password_hash, role, avatar, xp, points, rank, email_verified, verification_token)
         VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'Level 1', 0, ?);`,
        [trimmedName, normalizedUsername, normalizedEmail, passwordHash, validRole, avatar, verificationToken]
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
        verificationToken,
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

  verifyEmail(token) {
    if (!token || typeof token !== 'string') {
      const err = new Error('Verification token is required.');
      err.statusCode = 400;
      throw err;
    }

    const user = queryOne('SELECT id, email, email_verified FROM users WHERE verification_token = ?;', [token.trim()]);
    if (!user) {
      const err = new Error('Invalid or expired verification token.');
      err.statusCode = 400;
      throw err;
    }

    execute('UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?;', [user.id]);

    return {
      success: true,
      message: 'Email verified successfully.',
    };
  },

  resendVerification(userId) {
    const user = queryOne('SELECT id, email, email_verified FROM users WHERE id = ?;', [userId]);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      throw err;
    }

    if (user.email_verified) {
      return {
        success: true,
        message: 'Your email address is already verified.',
      };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    execute('UPDATE users SET verification_token = ? WHERE id = ?;', [verificationToken, userId]);

    return {
      success: true,
      message: 'Verification link sent to your email address.',
      verificationToken,
    };
  },

  forgotPassword(email) {
    if (!email || !email.trim()) {
      const err = new Error('Email address is required.');
      err.statusCode = 400;
      throw err;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = queryOne('SELECT id, email FROM users WHERE email = ?;', [normalizedEmail]);

    if (!user) {
      // Return success message to prevent user enumeration
      return {
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour expiration

    execute(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?;',
      [resetToken, expires, user.id]
    );

    return {
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.',
      resetToken, // included for dev workflow
    };
  },

  async resetPassword({ token, newPassword }) {
    if (!token || !newPassword) {
      const err = new Error('Reset token and new password are required.');
      err.statusCode = 400;
      throw err;
    }

    const user = queryOne(
      'SELECT id, email, reset_password_expires FROM users WHERE reset_password_token = ?;',
      [token.trim()]
    );

    if (!user) {
      const err = new Error('Invalid or expired password reset token.');
      err.statusCode = 400;
      throw err;
    }

    if (user.reset_password_expires && new Date(user.reset_password_expires) < new Date()) {
      const err = new Error('Password reset token has expired. Please request a new one.');
      err.statusCode = 400;
      throw err;
    }

    // Password complexity check
    const hasMinLen = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\\/~`';]/.test(newPassword);

    if (!hasMinLen || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      const err = new Error(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      );
      err.statusCode = 400;
      throw err;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    execute(
      'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?;',
      [passwordHash, user.id]
    );

    return {
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    };
  },
};
