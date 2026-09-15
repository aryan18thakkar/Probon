import { chatService } from '../services/chatService.js';

export const chatController = {
  getChannels(req, res, next) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const channels = chatService.getChannels(projectId);
      res.status(200).json({
        success: true,
        data: channels,
      });
    } catch (error) {
      next(error);
    }
  },

  getMessages(req, res, next) {
    try {
      const channelId = parseInt(req.params.channelId, 10);
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
      const messages = chatService.getMessages(channelId, limit);
      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  },

  sendMessage(req, res, next) {
    try {
      const channelId = parseInt(req.params.channelId, 10);
      const { message } = req.body;
      const sent = chatService.sendMessage({
        channelId,
        senderId: req.user.id,
        message,
      });

      res.status(201).json({
        success: true,
        data: sent,
      });
    } catch (error) {
      next(error);
    }
  },
};
