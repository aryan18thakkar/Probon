import { taskService } from '../services/taskService.js';

export const taskController = {
  createTask(req, res, next) {
    try {
      const task = taskService.createTask({
        ...req.body,
        createdById: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: 'Task created.',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  getTasks(req, res, next) {
    try {
      const { projectId, assignedToId, status, taskType, priority, milestoneId, allAccessible } = req.query;
      const tasks = taskService.getTasks({
        projectId: projectId ? parseInt(projectId, 10) : undefined,
        assignedToId: assignedToId ? parseInt(assignedToId, 10) : undefined,
        milestoneId: milestoneId ? parseInt(milestoneId, 10) : undefined,
        userProjectTasks: (allAccessible === 'true' || allAccessible === true) ? req.user.id : undefined,
        status,
        taskType,
        priority,
      });

      res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      next(error);
    }
  },

  getMyTasks(req, res, next) {
    try {
      const { status, taskType, priority } = req.query;
      const tasks = taskService.getTasks({
        userId: req.user.id,
        status,
        taskType,
        priority,
      });

      res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      next(error);
    }
  },

  getTaskById(req, res, next) {
    try {
      const taskId = parseInt(req.params.id, 10);
      const task = taskService.getTaskById(taskId);
      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  updateTask(req, res, next) {
    try {
      const taskId = parseInt(req.params.id, 10);
      const updated = taskService.updateTask(taskId, req.body, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Task updated.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  submitEvidence(req, res, next) {
    try {
      const taskId = parseInt(req.params.id, 10);
      const { evidence } = req.body;
      const updated = taskService.submitEvidence(taskId, evidence, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Evidence submitted for verification.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteTask(req, res, next) {
    try {
      const taskId = parseInt(req.params.id, 10);
      const result = taskService.deleteTask(taskId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
