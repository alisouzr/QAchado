// app/services/aiService.ts

const USE_MOCK = false; // <--- Mude para false para integrar com o backend real
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const aiService = {
  async askSummary(title: string, description: string): Promise<string> {
    if (!USE_MOCK) {
      const response = await fetch(`${API_BASE_URL}/ai/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // -> ADICIONADO PARA ENVIO SEGURO DE COOKIES/TOKENS
        body: JSON.stringify({ title, description })
      });
      const data = await response.json();
      return data.summary || '';
    }
    await new Promise(r => setTimeout(r, 1000));
    return `[Mock] Resumo automático para o achado: ${title}. Trata-se de uma falha que expõe dados sensíveis.`;
  },

  async askRemediation(title: string, description: string): Promise<string> {
    if (!USE_MOCK) {
      const response = await fetch(`${API_BASE_URL}/ai/remediation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // -> ADICIONADO PARA ENVIO SEGURO DE COOKIES/TOKENS
        body: JSON.stringify({ title, description })
      });
      const data = await response.json();
      return data.remediation || '';
    }
    await new Promise(r => setTimeout(r, 1200));
    return `[Mock] Recomendação: Implementar sanitização rígida no input e habilitar políticas de CSP adequadas.`;
  }
};