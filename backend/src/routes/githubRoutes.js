import { Router } from 'express';
import { githubController } from '../controllers/githubController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/:projectId/connect', githubController.connectRepository);
router.get('/:projectId', githubController.getRepository);
router.get('/:projectId/status', githubController.getSyncStatus);
router.post('/:projectId/sync', githubController.syncRepository);
router.get('/:projectId/activities', githubController.getProjectActivities);
router.get('/:projectId/commits', githubController.getCommits);
router.get('/:projectId/pull-requests', githubController.getPullRequests);
router.get('/:projectId/issues', githubController.getIssues);
router.post('/:projectId/activities', githubController.recordActivity);

export default router;
