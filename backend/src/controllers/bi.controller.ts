import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';

export const getVulnerabilityRecidivismReport = async (req: Request, res: Response) => {
  const { id: userId, role } = req.user!;

  try {
    const whereClause: any = {
      assignedToId: { not: null }, // Foco em vulnerabilidades vinculadas a um Dev
      OR: [
        { cwe: { not: null } },
        { owaspTop10: { not: null } }
      ]
    };

    // BARREIRA DO RBAC SÊNIOR: Se for DEV, o relatório de BI restringe-se unicamente ao seu histórico pessoal
    if (role === Role.DEV) {
      whereClause.assignedToId = userId;
    }

    // Busca os dados necessários para o processamento de BI analítico
    const vulnerabilities = await prisma.vulnerability.findMany({
      where: whereClause,
      select: {
        id: true,
        cwe: true,
        owaspTop10: true,
        createdAt: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Estrutura de suporte para processar as reincidências
    // Chave: DevId_FamiliaVulnerabilidade
    const devFamilyHistory = new Map<string, number>();
    
    // Formato Tabular Plano (Flat JSON Array) ideal para PowerBI / Metabase
    const tabularData = vulnerabilities.map((vuln) => {
      const devId = vuln.assignedTo?.id || 'unknown';
      const devName = vuln.assignedTo?.name || 'Não Atribuído';
      
      // Identifica a família do achado baseado prioritariamente no CWE ou OWASP Top 10
      const vulnFamily = vuln.cwe || vuln.owaspTop10 || 'Outros';
      
      const trackingKey = `${devId}_${vulnFamily}`;
      
      // Recupera quantas vezes o dev já cometeu um erro dessa mesma família antes deste registro
      const ocorrenciasAnteriores = devFamilyHistory.get(trackingKey) || 0;
      
      // Incrementa o histórico para as próximas iterações
      devFamilyHistory.set(trackingKey, ocorrenciasAnteriores + 1);
      
      const dataCriacao = new Date(vuln.createdAt);
      
      // Montagem do registro denormalizado (Padrão Data Warehouse / Star Schema)
      return {
        vulnerabilidade_id: vuln.id,
        projeto_nome: vuln.project.name,
        desenvolvedor_id: devId,
        desenvolvedor_nome: devName,
        desenvolvedor_email: vuln.assignedTo?.email || 'N/A',
        familia_vulnerabilidade: vulnFamily,
        ano_mes: `${dataCriacao.getFullYear()}-${String(dataCriacao.getMonth() + 1).padStart(2, '0')}`,
        data_registro: dataCriacao.toISOString().split('T')[0],
        ocorrencia_sequencial: ocorrenciasAnteriores + 1,
        // Define se este registro já configura uma reincidência direta (segundo erro ou mais)
        eh_reincidencia: ocorrenciasAnteriores > 0 ? 1 : 0
      };
    });

    // Retorna a estrutura limpa e direta
    return res.json(tabularData);

  } catch (error) {
    console.error('Erro na extração de dados do Módulo BI:', error);
    return res.status(500).json({ error: 'Erro interno ao processar cubo de dados analíticos.' });
  }
};