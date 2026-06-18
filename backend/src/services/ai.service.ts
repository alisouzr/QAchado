import axios from 'axios';

// Variável unificada para evitar o erro de referência
const AI_API_URL = process.env.AI_API_URL || 'http://127.0.0.1:8000';

export class AIService {
  /**
   * 1. SUMMARIZE
   */
  static async resumirAchado(title: string, description: string, impact?: string) {
    try {
      const response = await axios.post(`${AI_API_URL}/ai/summarize`, {
        title,
        description,
        impact: impact || '',
        text: `${title}: ${description}`
      });
      return response.data.summary || response.data.text || '';
    } catch (error) {
      console.error('[IA Service] Erro ao sumarizar achado:', error);
      return null;
    }
  }

  /**
   * 2. REMEDIATION
   */
  static async obterRemediacao(title: string, description: string) {
    try {
      const response = await axios.post(`${AI_API_URL}/ai/remediation`, {
        title,
        description,
        text: description
      });
      // Corrigido de reremediation para remediation conforme mapeado no Python
      return response.data.remediation || '';
    } catch (error) {
      console.error('[IA Service] Erro ao requisitar remediação:', error);
      return null;
    }
  }

  /**
   * 3. EXECUTIVE SUMMARY
   */
  static async gerarSumarioExecutivo(vulnerabilidades: any[]): Promise<string> {
    try {
      const findingsStrings = vulnerabilidades.map(
        v => `[Severidade: ${v.severity}] Título: ${v.title} - Descrição: ${v.description}`
      );

      // Corrigido de AI_SERVICE_URL para AI_API_URL
      const response = await axios.post(`${AI_API_URL}/ai/executive-summary`, {
        findings: findingsStrings
      });

      return response.data.executive_summary || response.data.summary || '';
    } catch (error) {
      console.error('[IA Service] Erro ao computar resumo executivo:', error);
      return 'Não foi possível compilar o resumo executivo automatizado.';
    }
  }

  /**
   * 4. DUPLICATE CHECK
   */
  static async checarDuplicidade(novoTitulo: string, vulnerabilidadesExistentes: string[]): Promise<boolean> {
    try {
      const response = await axios.post(`${AI_API_URL}/ai/duplicate-check`, {
        title: novoTitulo,
        existing: vulnerabilidadesExistentes
      });
      return !!response.data.is_duplicate;
    } catch (error) {
      console.error('[IA Service] Erro ao validar duplicidade de achados:', error);
      return false;
    }
  }
}