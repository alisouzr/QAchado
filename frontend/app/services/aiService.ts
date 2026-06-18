// app/services/aiService.ts

const USE_MOCK = true; 

export const aiService = {
  // Agora a função recebe um contexto para a IA saber o que resumir
  async generateSummary(context: string): Promise<string> {
    if (!USE_MOCK) {
      // Implementação real da chamada para API da IA
      const response = await fetch('/api/ai/resumo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      });
      const data = await response.json();
      return data.resumo;
    }

    // Mock com retorno variável para simular o "reload"
    return new Promise((resolve) => {
      setTimeout(() => {
        const timestamp = new Date().toLocaleTimeString();
        resolve(`Resumo atualizado às ${timestamp}: O escopo foca em "${context.substring(0, 30)}...". Sugerimos forte validação nas camadas de entrada e saída de dados.`);
      }, 1500);
    });
  }
};