import { Router } from 'express';
import { taskController } from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', taskController.getTasks);
router.get('/my', taskController.getMyTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.post('/:id/evidence', taskController.submitEvidence);
router.post('/:id/verify', authorizeRoles('teacher'), taskController.confirmVerification);
router.delete('/:id', taskController.deleteTask);

export default router;

