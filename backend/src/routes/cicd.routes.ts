import { Router } from 'express';
import { handleSonarQubeWebhook } from '../controllers/cicd.controller.js';

const router = Router();

// Endpoint público para recebimento de requisições HTTP POST das esteiras de CI/CD
router.post('/sonarqube', handleSonarQubeWebhook);

export default router;