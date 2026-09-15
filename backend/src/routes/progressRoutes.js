import { Router } from 'express';
import { progressController } from '../controllers/progressController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', progressController.getDashboard);
router.get('/contributions', progressController.getContributions);

export default router;
