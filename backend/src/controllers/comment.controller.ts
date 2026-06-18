import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';

export const addCommentToVulnerability = async (req: Request, res: Response) => {
  const { vulnerabilityId } = req.params as { vulnerabilityId: string };
  const { content } = req.body;
  const { id: userId, role } = req.user!;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'O conteúdo do comentário não pode ser vazio.' });
  }

  try {
    // 1. Valida se a vulnerabilidade existe
    const vulnerability = await prisma.vulnerability.findUnique({
      where: { id: vulnerabilityId }
    });

    if (!vulnerability) {
      return res.status(404).json({ error: 'Vulnerabilidade não encontrada.' });
    }

    // 2. Barreira do RBAC para DEV
    if (role === Role.DEV) {
      const access = await prisma.projectDev.findUnique({
        where: {
          projectId_userId: {
            projectId: vulnerability.projectId,
            userId: userId
          }
        }
      });

      if (!access) {
        return res.status(403).json({ error: 'Acesso negado: Você não faz parte deste projeto.' });
      }
    }

    // 3. Cria o comentário
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        vulnerabilityId: vulnerabilityId,
        userId: userId
      },
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      }
    });

    return res.status(201).json(comment);

  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar comentário.' });
  }
};