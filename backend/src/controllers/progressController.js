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
      const { limit, projectId, activityType } = req.query;
      const contributions = progressService.getUserContributions(req.user.id, {
        limit: limit ? parseInt(limit, 10) : 50,
        projectId: projectId ? parseInt(projectId, 10) : null,
        activityType,
      });
      res.status(200).json({
        success: true,
        data: contributions,
      });
    } catch (error) {
      next(error);
    }
  },

  getProjectContributions(req, res, next) {
    try {
      const { projectId } = req.params;
      const { limit } = req.query;
      const contributions = progressService.getProjectContributions(parseInt(projectId, 10), {
        limit: limit ? parseInt(limit, 10) : 50,
      });
      res.status(200).json({
        success: true,
        data: contributions,
      });
    } catch (error) {
      next(error);
    }
  },

  recordContribution(req, res, next) {
    try {
      const { projectId, taskId, activityType, points, xp, description, externalId, metadata } = req.body;
      const result = progressService.recordContribution({
        userId: req.user.id,
        projectId: parseInt(projectId, 10),
        taskId: taskId ? parseInt(taskId, 10) : null,
        activityType,
        points: points || 0,
        xp: xp || 0,
        description,
        externalId,
        metadata,
      });
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
