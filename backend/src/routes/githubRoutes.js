import { Router } from 'express';
import { githubController } from '../controllers/githubController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/:projectId/connect', githubController.connectRepository);
router.get('/:projectId', githubController.getRepository);
router.post('/:projectId/sync', githubController.syncRepository);
router.get('/:projectId/activities', githubController.getProjectActivities);
router.post('/:projectId/activities', githubController.recordActivity);

export default router;
