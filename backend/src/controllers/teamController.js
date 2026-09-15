import { teamService } from '../services/teamService.js';

export const teamController = {
  createTeam(req, res, next) {
    try {
      const { name, classId, leaderId } = req.body;
      const team = teamService.createTeam({
        name,
        classId,
        leaderId: leaderId || req.user.id,
      });

      res.status(201).json({
        success: true,
        message: 'Team created successfully.',
        data: team,
      });
    } catch (error) {
      next(error);
    }
  },

  getUserTeams(req, res, next) {
    try {
      const teams = teamService.getUserTeams(req.user.id);
      res.status(200).json({
        success: true,
        data: teams,
      });
    } catch (error) {
      next(error);
    }
  },

  getTeamById(req, res, next) {
    try {
      const teamId = parseInt(req.params.id, 10);
      const team = teamService.getTeamById(teamId);
      res.status(200).json({
        success: true,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  },

  addMember(req, res, next) {
    try {
      const teamId = parseInt(req.params.id, 10);
      const { userId, role } = req.body;
      const updated = teamService.addMember({
        teamId,
        userId,
        role,
        requesterId: req.user.id,
      });

      res.status(200).json({
        success: true,
        message: 'Member added to team.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  removeMember(req, res, next) {
    try {
      const teamId = parseInt(req.params.id, 10);
      const userId = parseInt(req.params.userId, 10);
      const result = teamService.removeMember({
        teamId,
        userId,
        requesterId: req.user.id,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
