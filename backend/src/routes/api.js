import { Router } from 'express';
import authRoutes from './authRoutes.js';
import classRoutes from './classRoutes.js';
import teamRoutes from './teamRoutes.js';
import projectRoutes from './projectRoutes.js';
import taskRoutes from './taskRoutes.js';
import githubRoutes from './githubRoutes.js';
import progressRoutes from './progressRoutes.js';
import chatRoutes from './chatRoutes.js';
import gamificationRoutes from './gamificationRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';

const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ProjNaN Educational API',
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/classes', classRoutes);
apiRouter.use('/teams', teamRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/tasks', taskRoutes);
apiRouter.use('/github', githubRoutes);
apiRouter.use('/progress', progressRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/gamification', gamificationRoutes);
apiRouter.use('/feedback', feedbackRoutes);

export default apiRouter;
