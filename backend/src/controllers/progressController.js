import { progressService } from '../services/progressService.js';

export const progressController = {
  getDashboard(req, res, next) {
    try {
      const data = progressService.getUserDashboard(req.user.id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  getContributions(req, res, next) {
    try {
      const contributions = progressService.getUserContributions(req.user.id);
      res.status(200).json({
        success: true,
        data: contributions,
      });
    } catch (error) {
      next(error);
    }
  },
};
