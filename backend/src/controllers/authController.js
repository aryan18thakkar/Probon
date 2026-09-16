import { authService } from '../services/authService.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { name, username, email, password, role, classCode } = req.body;
      const result = await authService.register({
        name,
        username,
        email,
        password,
        role,
        classCode,
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      res.status(200).json({
        success: true,
        message: 'Signed in successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  me(req, res, next) {
    try {
      const user = authService.getCurrentUser(req.user.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  logout(req, res) {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  },

  verifyEmail(req, res, next) {
    try {
      const token = req.body.token || req.query.token;
      const result = authService.verifyEmail(token);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  resendVerification(req, res, next) {
    try {
      const result = authService.resendVerification(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = authService.forgotPassword(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword({ token, newPassword });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
