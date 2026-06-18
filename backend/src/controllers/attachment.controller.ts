import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';

export const addAttachmentToVulnerability = async (req: Request, res: Response) => {
  const { vulnerabilityId } = req.params;
  const { id: userId, role } = req.user!;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado ou formato rejeitado pelo filtro.' });
  }

  try {
    // 1. Valida se a vulnerabilidade existe
    const vulnerability = await prisma.vulnerability.findUnique({
      where: { id: vulnerabilityId as string}
    });

    if (!vulnerability) {
      return res.status(404).json({ error: 'Vulnerabilidade alvo não encontrada.' });
    }

    // 2. BARREIRA DO RBAC: Se for DEV, valida se ele está alocado no projeto dessa vulnerabilidade
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
        return res.status(403).json({ error: 'Acesso negado: Você não possui gerência sobre este escopo.' });
      }
    }

    // 3. Persistência dos Metadados do Arquivo no Banco de Dados
    // Preparado para S3: Altere o 'fileUrl' para 'file.location' quando migrar para o multer-s3
    const fileUrl = `/uploads/${file.filename}`; 

    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.originalname,
        fileUrl: fileUrl,
        fileType: file.mimetype,
        fileSize: file.size,
        vulnerabilityId: vulnerabilityId as string
      }
    });

    // 4. Registro no rastro imutável de Auditoria do sistema
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'ATTACHMENT_CREATE',
        target: 'Attachment',
        targetId: attachment.id,
        details: `Anexo "${file.originalname}" adicionado à vulnerabilidade: ${vulnerabilityId}`
      }
    });

    return res.status(201).json(attachment);

  } catch (error) {
    console.error('Erro ao salvar anexo:', error);
    return res.status(500).json({ error: 'Erro crítico interno ao processar e salvar evidência.' });
  }
};