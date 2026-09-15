import { Router } from 'express';
import { classController } from '../controllers/classController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', classController.getUserClasses);
router.get('/:id', classController.getClassById);
router.post('/', authorizeRoles('teacher'), classController.createClass);
router.post('/join', classController.joinClass);
router.delete('/:id/students/:studentId', authorizeRoles('teacher'), classController.removeStudent);

export default router;
