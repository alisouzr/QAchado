import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import { authenticateJWT } from './middlewares/auth.middleware.js';
import { authorizeRoles, checkProjectAccess } from './middlewares/rbac.middleware.js';
import { Role } from '@prisma/client';
import vulnerabilityRoutes from './routes/vulnerability.routes.js';

const app = express();

// Middlewares Globais
app.use(cors());
app.use(express.json());

// 1. Rotas Públicas de Autenticação
app.use('/api/auth', authRoutes);
app.use('/api/vulnerabilities', vulnerabilityRoutes);
// 2. Rotas Protegidas de Projetos e Vulnerabilidades (Seu endpoint antigo refatorado com RBAC real)
app.get(
  '/api/projects/:projectId/vulnerabilities',
  authenticateJWT,                         // Garante que está logado via JWT
  authorizeRoles(Role.ADMIN, Role.QA, Role.DEV), // Permite a entrada dessas roles
  checkProjectAccess,                      // Bloqueia DEVs se não estiverem alocados no projeto
  async (req, res) => {
    try {
      const projectId = req.params.projectId as string;
      
      // Busca as vulnerabilidades usando o Prisma Client
      const { prisma } = await import('./lib/prisma.js');
      const vulnerabilities = await prisma.vulnerability.findMany({ 
        where: { projectId } 
      });
      
      return res.json(vulnerabilities);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar vulnerabilidades.' });
    }
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[SERVER] Security Management API rodando na porta ${PORT}`));
