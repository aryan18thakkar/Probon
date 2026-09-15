import { Router } from 'express';
import { projectController } from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', projectController.getAllProjects);
router.get('/my', projectController.getUserProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);

// Milestones
router.post('/:id/milestones', projectController.createMilestone);
router.put('/:id/milestones/:mId', projectController.updateMilestone);

export default router;
