import { projectService } from '../services/projectService.js';

export const projectController = {
  createProject(req, res, next) {
    try {
      const { name, description, teamId, classId, goals, tags } = req.body;
      const project = projectService.createProject({
        name,
        description,
        teamId: teamId !== undefined && teamId !== null ? parseInt(teamId, 10) : undefined,
        classId: classId !== undefined && classId !== null ? parseInt(classId, 10) : undefined,
        goals,
        tags,
        userId: req.user?.id,
        userRole: req.user?.role,
      });

      res.status(201).json({
        success: true,
        message: 'Project created successfully.',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  },

  getAllProjects(req, res, next) {
    try {
      const { classId, search, status } = req.query;
      const projects = projectService.getAllProjects({
        classId: classId ? parseInt(classId, 10) : undefined,
        search,
        status,
      });

      res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  },

  getUserProjects(req, res, next) {
    try {
      const projects = projectService.getUserProjects(req.user.id);
      res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  },

  getProjectById(req, res, next) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const project = projectService.getProjectById(projectId);
      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  },

  updateProject(req, res, next) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const updated = projectService.updateProject(projectId, req.body);
      res.status(200).json({
        success: true,
        message: 'Project updated.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  createMilestone(req, res, next) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const milestone = projectService.createMilestone(projectId, req.body);
      res.status(201).json({
        success: true,
        message: 'Milestone created.',
        data: milestone,
      });
    } catch (error) {
      next(error);
    }
  },

  updateMilestone(req, res, next) {
    try {
      const milestoneId = parseInt(req.params.mId, 10);
      const milestone = projectService.updateMilestone(milestoneId, req.body);
      res.status(200).json({
        success: true,
        message: 'Milestone updated.',
        data: milestone,
      });
    } catch (error) {
      next(error);
    }
  },
};
