import { Router } from 'express';
import { exportVulnerabilityReport } from '../controllers/report.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/export', authenticateJWT, exportVulnerabilityReport);

export default router;