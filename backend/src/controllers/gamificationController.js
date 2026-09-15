import { gamificationService } from '../services/gamificationService.js';

export const gamificationController = {
  getArena(req, res, next) {
    try {
      const challenges = gamificationService.getArenaChallenges(req.user.id);
      res.status(200).json({
        success: true,
        data: challenges,
      });
    } catch (error) {
      next(error);
    }
  },

  acceptChallenge(req, res, next) {
    try {
      const challengeId = parseInt(req.params.id, 10);
      const result = gamificationService.acceptChallenge(req.user.id, challengeId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  completeChallenge(req, res, next) {
    try {
      const challengeId = parseInt(req.params.id, 10);
      const { evidence } = req.body;
      const result = gamificationService.completeChallenge(req.user.id, challengeId, evidence);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  getLeaderboard(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const leaderboard = gamificationService.getLeaderboard(limit);
      res.status(200).json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      next(error);
    }
  },
};
