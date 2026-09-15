import { Router } from 'express';
import { chatController } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/projects/:projectId/channels', chatController.getChannels);
router.get('/channels/:channelId/messages', chatController.getMessages);
router.post('/channels/:channelId/messages', chatController.sendMessage);

export default router;
