import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { Role, Status } from '@prisma/client';

export const getDashboardStats = async (req: Request, res: Response) => {
  const { id: userId, role } = req.user!;
  
  // Condição base para aplicar o isolamento do RBAC
  const projectFilter: any = {};

  try {
    // BARREIRA DO RBAC: Se for DEV, restringe as queries apenas aos projetos alocados
    if (role === Role.DEV) {
      const devProjects = await prisma.projectDev.findMany({
        where: { userId },
        select: { projectId: true }
      });
      const allowedProjectIds = devProjects.map(p => p.projectId);
      
      // Se o DEV não estiver em nenhum projeto, retorna dados zerados imediatamente
      if (allowedProjectIds.length === 0) {
        return res.json({
          byStatus: [],
          bySeverity: [],
          topVulnerableProjects: [],
          averageResolutionTimeHours: 0
        });
      }
      
      projectFilter.projectId = { in: allowedProjectIds };
    }

    // 1. Agrupamento por Status
    const byStatus = await prisma.vulnerability.groupBy({
      by: ['status'],
      where: projectFilter,
      _count: { _all: true }
    });

    // 2. Agrupamento por Severidade
    const bySeverity = await prisma.vulnerability.groupBy({
      by: ['severity'],
      where: projectFilter,
      _count: { _all: true }
    });

    // 3. Top Projetos com Mais Vulnerabilidades (Apenas Ativas)
    const topProjectsRaw = await prisma.vulnerability.groupBy({
      by: ['projectId'],
      where: {
        ...projectFilter,
        status: { notIn: [Status.REMEDIATED, Status.FALSE_POSITIVE, Status.ACCEPTED_RISK] }
      },
      _count: { _all: true },
      orderBy: {
        _count: { projectId: 'desc' }
      },
      take: 5
    });

    // Hidratação dos dados dos projetos para incluir o nome visível
    const topVulnerableProjects = await Promise.all(
      topProjectsRaw.map(async (item) => {
        const project = await prisma.project.findUnique({
          where: { id: item.projectId },
          select: { name: true }
        });
        return {
          projectId: item.projectId,
          projectName: project?.name || 'Desconhecido',
          count: item._count._all
        };
      })
    );

    // 4. Tempo Médio de Resolução (Criação vs Modificação para Remediado via AuditLog)
    // Procuramos os logs de auditoria que registaram a transição para REMEDIATED
    const remediationLogs = await prisma.auditLog.findMany({
      where: {
        action: 'VULNERABILITY_UPDATE',
        details: { contains: `"statusNovo":"REMEDIATED"` },
        targetId: role === Role.DEV ? {
          in: await prisma.vulnerability.findMany({
            where: projectFilter,
            select: { id: true }
          }).then(list => list.map(v => v.id))
        } : undefined
      },
      select: { targetId: true, createdAt: true }
    });

    let totalHours = 0;
    let resolvedCount = 0;

    if (remediationLogs.length > 0) {
      // Extrai os IDs das vulnerabilidades remediadas detetadas nos logs
      const targetIds = remediationLogs.map(log => log.targetId).filter((id): id is string => id !== null);

      const vulnerabilitiesCreated = await prisma.vulnerability.findMany({
        where: { id: { in: targetIds } },
        select: { id: true, createdAt: true }
      });

      const creationMap = new Map(vulnerabilitiesCreated.map(v => [v.id, v.createdAt]));

      remediationLogs.forEach(log => {
        if (log.targetId) {
          const creationDate = creationMap.get(log.targetId);
          if (creationDate) {
            const diffInMs = log.createdAt.getTime() - creationDate.getTime();
            const diffInHours = diffInMs / (1000 * 60 * 60);
            totalHours += diffInHours;
            resolvedCount++;
          }
        }
      });
    }

    const averageResolutionTimeHours = resolvedCount > 0 ? parseFloat((totalHours / resolvedCount).toFixed(2)) : 0;

    // Resposta Unificada para consumo de gráficos no frontend (ex: Chart.js / Recharts)
    return res.json({
      byStatus: byStatus.map(item => ({ status: item.status, count: item._count._all })),
      bySeverity: bySeverity.map(item => ({ severity: item.severity, count: item._count._all })),
      topVulnerableProjects,
      averageResolutionTimeHours
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao gerar dados analíticos do painel.' });
  }
};