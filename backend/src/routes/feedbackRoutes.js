import { Router } from 'express';
import { feedbackController } from '../controllers/feedbackController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', feedbackController.createFeedback);
router.get('/project/:projectId', feedbackController.getProjectFeedback);
router.delete('/:id', feedbackController.deleteFeedback);

export default router;
