import { prisma } from '../lib/prisma.js';

export const AuditService = {
  /**
   * Registra uma ação de exportação de relatório no rastro de auditoria
   */
  async logExport(userId: string, reportType: 'DOCX' | 'PDF' | 'BI_FLAT', details: string) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId,
          action: 'VULNERABILITY_EXPORT',
          target: 'Report',
          details: `Exportação do tipo [${reportType}] realizada. ${details}`
        }
      });
    } catch (error) {
      // Falhas no log de auditoria não devem quebrar a experiência do usuário final, mas devem ser monitoradas
      console.error('Falha crítica ao gravar log de auditoria de exportação:', error);
    }
  }
};