import { Router } from 'express';
import { gamificationController } from '../controllers/gamificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/arena', gamificationController.getArena);
router.post('/arena/:id/accept', gamificationController.acceptChallenge);
router.post('/arena/:id/complete', gamificationController.completeChallenge);
router.get('/leaderboard', gamificationController.getLeaderboard);
router.get('/achievements', gamificationController.getAchievements);

export default router;
