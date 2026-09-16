import { feedbackService } from '../services/feedbackService.js';

export const feedbackController = {
  createFeedback(req, res, next) {
    try {
      const { projectId, teamId, userId, comment, rating, type } = req.body;
      const feedback = feedbackService.createFeedback({
        projectId: parseInt(projectId, 10),
        teamId: teamId ? parseInt(teamId, 10) : null,
        userId: userId ? parseInt(userId, 10) : null,
        authorId: req.user.id,
        comment,
        rating,
        type,
      });

      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully.',
        data: feedback,
      });
    } catch (error) {
      next(error);
    }
  },

  getProjectFeedback(req, res, next) {
    try {
      const { projectId } = req.params;
      const feedbackList = feedbackService.getProjectFeedback(parseInt(projectId, 10));

      res.status(200).json({
        success: true,
        data: feedbackList,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteFeedback(req, res, next) {
    try {
      const feedbackId = parseInt(req.params.id, 10);
      const result = feedbackService.deleteFeedback(feedbackId, req.user.id, req.user.role);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },
};
