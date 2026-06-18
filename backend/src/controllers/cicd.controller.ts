import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';

export const handleSonarQubeWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    // O SonarQube envia chaves estruturadas como 'project' e 'qualityGate'
    if (!payload || !payload.project) {
      return res.status(400).json({ error: 'Payload inválido ou fora do padrão aceito.' });
    }

    const { key: projectKey, name: projectName } = payload.project;
    const qualityGateStatus = payload.qualityGate?.status; // Ex: 'ERROR' ou 'OK'

    // 1. Localiza ou cria dinamicamente o Projeto em nosso banco usando o identificador do Sonar
    let project = await prisma.project.findFirst({
      where: { name: projectName }
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: projectName,
          description: `Projeto integrado automaticamente via pipeline CI/CD (Chave: ${projectKey})`
        }
      });
    }

    // 2. Se o Quality Gate falhou, criamos automaticamente os apontamentos de vulnerabilidade
    if (qualityGateStatus === 'ERROR' || qualityGateStatus === 'FAILED') {
      
      // Busca o primeiro usuário ADMIN do sistema para assinar como relator (reportedById) da automação
      let systemUser = await prisma.user.findFirst({
        where: { role: Role.ADMIN }
      });

      // Caso não exista nenhum Admin criado (ambiente de testes zerado), busca qualquer usuário ativo
      if (!systemUser) {
        systemUser = await prisma.user.findFirst();
      }

      // Se mesmo assim o banco estiver 100% vazio de usuários, lança erro para evitar quebra silenciosa
      if (!systemUser) {
        return res.status(422).json({ 
          error: 'Impossível registrar vulnerabilidade automática: Nenhum usuário cadastrado no sistema para assinar o relatório.' 
        });
      }

      // Itera sobre as condições que falharam no SonarQube para salvar como achados
      const failedConditions = payload.qualityGate?.conditions?.filter((c: any) => c.status === 'ERROR') || [];
      
      for (const condition of failedConditions) {
        await prisma.vulnerability.create({
          data: {
            title: `Falha de Quality Gate no SonarQube: Métrica [${condition.metric}] excedida`,
            description: `A esteira de CI/CD identificou uma quebra de política de código no projeto ${projectName}. Valor observado: ${condition.value} (Limite aceitável da métrica: ${condition.errorThreshold}).`,
            severity: 'HIGH',
            status: 'OPEN',
            projectId: project.id,
            reportedById: systemUser.id, // <-- RESOLVIDO: Vincula ao ID do usuário do sistema
            recommendation: 'Acessar o painel do SonarQube para analisar as linhas exatas do código afetado, revisar as regras de Clean Code violadas e aplicar a correção recomendada na política interna.' // <-- RESOLVIDO: Texto obrigatório preenchido
          }
        });
      }

      // Cria rastro na tabela AuditLog identificando o disparo automatizado
      await prisma.auditLog.create({
        data: {
          userId: systemUser.id, // Assina com o usuário encontrado
          action: 'VULNERABILITY_CREATE',
          target: 'Project',
          targetId: project.id,
          details: `Injeção automatizada via CI/CD executada. O projeto "${projectName}" quebrou o Quality Gate do SonarQube.`
        }
      });
    }

    return res.status(200).json({ success: true, message: 'Webhook do CI/CD processado com sucesso.' });

  } catch (error) {
    console.error('Erro ao processar Webhook do CI/CD:', error);
    return res.status(500).json({ error: 'Falha interna ao realizar ingestão de dados da esteira automatizada.' });
  }
};