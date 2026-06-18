import { Router } from 'express';
import { getDashboardStats } from '../controllers/analytics.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Endpoint analítico centralizado e protegido por sessão ativa
router.get('/dashboard', authenticateJWT, getDashboardStats);

export default router;