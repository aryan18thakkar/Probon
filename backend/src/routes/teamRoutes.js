import { Router } from 'express';
import { teamController } from '../controllers/teamController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', teamController.getUserTeams);
router.get('/:id', teamController.getTeamById);
router.post('/', teamController.createTeam);
router.post('/:id/members', teamController.addMember);
router.delete('/:id/members/:userId', teamController.removeMember);

export default router;
