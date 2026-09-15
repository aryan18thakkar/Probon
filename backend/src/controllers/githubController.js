import { githubService } from '../services/githubService.js';

export const githubController = {
  connectRepository(req, res, next) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const { repoUrl, defaultBranch } = req.body;
      const repo = githubService.connectRepository({
        projectId,
        repoUrl,
        defaultBranch,
      });

      res.status(200).json({
        success: true,
        message: 'GitHub repository linked successfully.',
        data: repo,
      });
    } catch (error) {
      next(error);
    }
  },

  getRepository(req, res, next) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const repo = githubService.getRepository(projectId);
      res.status(200).json({
        success: true,
        data: repo,
      });
    } catch (error) {
      next(error);
    }
  },

  async syncRepository(req, res, next) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const result = await githubService.syncRepository(projectId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  getProjectActivities(req, res, next) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 25;
      const activities = githubService.getProjectActivities(projectId, limit);
      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  },

  recordActivity(req, res, next) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      githubService.recordManualActivity({
        projectId,
        ...req.body,
        userId: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: 'Activity recorded.',
      });
    } catch (error) {
      next(error);
    }
  },
};
