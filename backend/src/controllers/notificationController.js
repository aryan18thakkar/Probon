import { notificationService } from '../services/notificationService.js';

export const notificationController = {
  getNotifications(req, res, next) {
    try {
      const { unreadOnly, limit } = req.query;
      const data = notificationService.getUserNotifications(req.user.id, {
        unreadOnly: unreadOnly === 'true' || unreadOnly === true,
        limit: limit ? parseInt(limit, 10) : 50,
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  markAsRead(req, res, next) {
    try {
      const notificationId = parseInt(req.params.id, 10);
      const result = notificationService.markAsRead(notificationId, req.user.id);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  markAllAsRead(req, res, next) {
    try {
      const result = notificationService.markAllAsRead(req.user.id);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteNotification(req, res, next) {
    try {
      const notificationId = parseInt(req.params.id, 10);
      const result = notificationService.deleteNotification(notificationId, req.user.id);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },
};
