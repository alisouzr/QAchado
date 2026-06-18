import { Router } from 'express';
import { getVulnerabilityRecidivismReport } from '../controllers/bi.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Endpoint de integração corporativa
router.get('/trends/recidivism', authenticateJWT, getVulnerabilityRecidivismReport);

export default router;