import { classService } from '../services/classService.js';

export const classController = {
  createClass(req, res, next) {
    try {
      const { name, description } = req.body;
      const created = classService.createClass({
        name,
        description,
        teacherId: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: 'Class created successfully.',
        data: created,
      });
    } catch (error) {
      next(error);
    }
  },

  joinClass(req, res, next) {
    try {
      const { code } = req.body;
      const joined = classService.joinClass({
        code,
        userId: req.user.id,
        role: req.user.role,
      });

      res.status(200).json({
        success: true,
        message: `Successfully joined ${joined.name}.`,
        data: joined,
      });
    } catch (error) {
      next(error);
    }
  },

  getUserClasses(req, res, next) {
    try {
      const classes = classService.getUserClasses(req.user.id);
      res.status(200).json({
        success: true,
        data: classes,
      });
    } catch (error) {
      next(error);
    }
  },

  getClassById(req, res, next) {
    try {
      const classId = parseInt(req.params.id, 10);
      const classData = classService.getClassById(classId, req.user.id);
      res.status(200).json({
        success: true,
        data: classData,
      });
    } catch (error) {
      next(error);
    }
  },

  removeStudent(req, res, next) {
    try {
      const classId = parseInt(req.params.id, 10);
      const studentId = parseInt(req.params.studentId, 10);
      const result = classService.removeStudentFromClass(classId, studentId, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
