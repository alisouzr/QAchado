import { PrismaClient } from '@prisma/client';
import { authLocalStorage } from './auth-context.js';
import { NotificationService } from '../services/notification.service.js';

const basePrisma = new PrismaClient();
const CHAT_WEBHOOK_URL = process.env.CHAT_WEBHOOK_URL || '';

export const prisma = basePrisma.$extends({
  query: {
    vulnerability: {
      async update({ model, operation, args, query }) {
        const context = authLocalStorage.getStore();
        const userId = context?.userId || 'SYSTEM'; // Fallback se alterado por script/cron

        // 1. Busca o estado atual antes de atualizar (Trazendo o status e o dev atribuído antigo)
        const previousState = await basePrisma.vulnerability.findUnique({
          where: { id: args.where.id },
          select: { 
            status: true,
            assignedToId: true
          }
        });

        // 2. Executa a atualização original no banco de dados
        const result = await query(args);

        // 3. Busca o novo estado pós-atualização incluindo os dados do Dev para a notificação
        const updatedState = await basePrisma.vulnerability.findUnique({
          where: { id: result.id },
          include: { assignedTo: true }
        });

        if (previousState && updatedState) {
          
          // --- FLUXO A: TRILHA DE AUDITORIA DE STATUS (Já existente no seu código) ---
          if (previousState.status !== updatedState.status) {
            await basePrisma.auditLog.create({
              data: {
                userId: userId,
                action: 'VULNERABILITY_STATUS_CHANGE',
                target: 'Vulnerability',
                targetId: updatedState.id,
                details: `Status alterado de "${previousState.status}" para "${updatedState.status}"`
              }
            });

            // GATILHO DE NOTIFICAÇÃO: Mudou para "REMEDIATED" (Pronto para Reteste)
            if (updatedState.status === 'REMEDIATED') {
              const msg = `🚨 *Vulnerabilidade pronta para reteste (Remediada)!* \n*ID:* \`${updatedState.id}\`\n*Título:* ${updatedState.title}\n*Severidade:* ${updatedState.severity}`;
              
              // Dispara para o canal do Slack/Teams
              await NotificationService.sendChatWebhook(CHAT_WEBHOOK_URL, msg);
              
              // Dispara e-mail para o time de qualidade/segurança
              await NotificationService.sendEmail(
                'qa-team@company.com',
                `[Reteste] Vulnerabilidade Corrigida: ${updatedState.title}`,
                `<p>A vulnerabilidade <strong>${updatedState.title}</strong> foi marcada como <strong>REMEDIATED</strong> e está pronta para validação.</p>`
              );
            }
          }

          // --- FLUXO B: GATILHO DE ATRIBUIÇÃO DE DESENVOLVEDOR ---
          if (previousState.assignedToId !== updatedState.assignedToId && updatedState.assignedTo) {
            const dev = updatedState.assignedTo;
            const msg = `🧑‍💻 *Nova tarefa atribuída!* \nO desenvolvedor *${dev.name}* foi associado à vulnerabilidade: *${updatedState.title}*.`;
            
            // Dispara para o canal geral do time
            await NotificationService.sendChatWebhook(CHAT_WEBHOOK_URL, msg);
            
            // Dispara e-mail direto para a caixa de entrada do Dev que recebeu a tarefa
            await NotificationService.sendEmail(
              dev.email,
              `[Security] Nova vulnerabilidade atribuída: ${updatedState.title}`,
              `<h3>Olá, ${dev.name}.</h3>
               <p>Você foi alocado como encarregado da correção do seguinte achado de segurança:</p>
               <ul>
                 <li><strong>Título:</strong> ${updatedState.title}</li>
                 <li><strong>Severidade:</strong> ${updatedState.severity}</li>
               </ul>
               <p>Por favor, acesse o portal para analisar os detalhes e iniciar a mitigação.</p>`
            );
          }
        }

        return result;
      }
    }
  }
});