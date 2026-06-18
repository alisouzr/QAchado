import type { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

// 1. Valida se a Role do usuário está na lista de permissões estáticas da rota
export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado: privilégios insuficientes.' });
    }

    return next();
  };
};

// 2. Middleware dinâmico para validação granular do acesso de DEV a projetos específicos
export const checkProjectAccess = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  const { id: userId, role } = req.user;
  
  // Regra de Negócio: Admins e QAs têm acesso global irrestrito
  if (role === Role.ADMIN || role === Role.QA) {
    return next();
  }

  // O ID do projeto pode vir dos parâmetros da URL (:projectId ou :id) ou do corpo da requisição
  const projectId = req.params.projectId || req.params.id || req.body.projectId;

  if (!projectId) {
    return res.status(400).json({ error: 'Identificador do projeto não mapeado na requisição.' });
  }

  try {
    // Verifica se o DEV está explicitamente associado à tabela pivot do projeto
    const membership = await prisma.projectDev.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Acesso negado: Você não está alocado a este projeto.' });
    }

    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno ao validar permissões do projeto.' });
  }
};