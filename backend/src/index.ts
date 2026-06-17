import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma.js';

const app = express();
app.use(cors());
app.use(express.json());

// Exemplo de Middleware de RBAC para validação de acesso dos Devs
// QAs possuem acesso global; DEVs necessitam validação na tabela project_devs
app.get('/projects/:id/vulnerabilities', async (req, res) => {
  const { id: projectId } = req.params;
  const { userId, role } = req.headers; // Simulação simples vinda de um token JWT decodificado

  if (role === 'DEV') {
    const hasAccess = await prisma.projectDev.findUnique({
      where: { projectId_userId: { projectId, userId: String(userId) } }
    });
    if (!hasAccess) return res.status(403).json({ error: "Acesso negado a este projeto." });
  }

  const vulnerabilities = await prisma.vulnerability.findMany({ where: { projectId } });
  return res.json(vulnerabilities);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Security Management API rodando na porta ${PORT}`));