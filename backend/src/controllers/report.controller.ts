import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';
import { generateMarkdownReport, generateDocxReport } from '../services/report.service.js';

export const exportVulnerabilityReport = async (req: Request, res: Response) => {
  const { id: userId, role } = req.user!;
  const format = req.query.format as string; // 'markdown' ou 'docx'
  const projectId = req.query.projectId as string | undefined;

  if (format !== 'markdown' && format !== 'docx') {
    return res.status(400).json({ error: "Formato inválido. Use '?format=markdown' ou '?format=docx'" });
  }

  try {
    const whereClause: any = {};
    if (projectId) whereClause.projectId = projectId;

    // BARREIRA DO RBAC: Filtro estrito caso a role seja DEV
    if (role === Role.DEV) {
      const userProjects = await prisma.projectDev.findMany({
        where: { userId },
        select: { projectId: true }
      });
      const allowedIds = userProjects.map(p => p.projectId);

      if (projectId && !allowedIds.includes(projectId)) {
        return res.status(403).json({ error: 'Acesso negado ao escopo deste projeto.' });
      }
      whereClause.projectId = { in: allowedIds };
    }

    // Busca os dados consolidados do Prisma carregando o relacionamento com o Projeto
    const vulnerabilities = await prisma.vulnerability.findMany({
      where: whereClause,
      include: { project: { select: { name: true } } },
      orderBy: { severity: 'desc' }
    });

    // Mapeia para a estrutura homogênea que o serviço de relatórios espera
    const formattedData = vulnerabilities.map(v => ({
      title: v.title,
      description: v.description,
      severity: v.severity,
      recommendation: v.recommendation,
      status: v.status,
      cve: v.cve,
      projectName: v.project.name
    }));

    // Despacha com base no formato requisitado
    if (format === 'markdown') {
      const mdContent = generateMarkdownReport(formattedData);
      
      // Configura os headers para forçar o download do arquivo de texto
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="vulnerability_report.md"');
      return res.send(mdContent);
    } 
    
    if (format === 'docx') {
      const docxBuffer = generateDocxReport(formattedData);
      
      // Configura os headers para transferência de stream binária de arquivos do Microsoft Word
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename="vulnerability_report.docx"');
      return res.send(docxBuffer);
    }

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Erro crítico ao processar exportação de relatório.' });
  }
};