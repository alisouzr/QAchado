// app/services/dashboardService.ts

const USE_MOCK = true; // <--- BACKEND DEV: Mude para false
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface DashboardData {
  metrics: {
    totalProjects: number;
    openVulnerabilities: number;
    criticalVulnerabilities: number;
  };
  pieData: { name: string; value: number; color: string }[];
  lineData: { name: string; dev: number }[];
}

export const dashboardService = {
  
  // Agora recebe o objeto user inteiro para saber a role e as iniciais
  async getDashboardOverview(user: { role: string, initials?: string }): Promise<DashboardData> {
    if (!USE_MOCK) {
      // IMPLEMENTAÇÃO REAL (Integração Backend)
      const roleParam = user.role;
      const initialsParam = user.initials || '';
      const response = await fetch(`${API_BASE_URL}/dashboard?role=${roleParam}&initials=${initialsParam}`);
      if (!response.ok) throw new Error('Falha ao buscar dados do dashboard.');
      return await response.json();
    }

    // IMPLEMENTAÇÃO MOCK (Calculando em tempo real com o banco)
    const isQA = user.role === 'QA';
    const vulns = JSON.parse(localStorage.getItem('vuln_db') || '[]');
    const projetos = JSON.parse(localStorage.getItem('project_db') || '[]');

    // Filtra as falhas relevantes para quem está logado
    const activeVulns = vulns.filter((v: any) => {
      if (v.status === 'CONCLUÍDO') return false;
      if (isQA) return true; // QA vê tudo que não tá concluído
      return v.assigneeInitials === user.initials; // Dev vê só as dele
    });

    // Calcula os cards
    const totalProjects = isQA ? projetos.length : [...new Set(activeVulns.map((v: any) => v.projetoId))].length;
    const openVulnerabilities = activeVulns.length;
    const criticalVulnerabilities = activeVulns.filter((v: any) => v.severity === 'Critical').length;

    // Calcula o gráfico de Pizza
    const countSeverity = (sev: string) => activeVulns.filter((v: any) => v.severity === sev).length;

    return {
      metrics: {
        totalProjects,
        openVulnerabilities,
        criticalVulnerabilities,
      },
      pieData: [
        { name: 'Crítica', value: countSeverity('Critical'), color: '#ef4444' },
        { name: 'Alta', value: countSeverity('High'), color: '#f97316' },
        { name: 'Média', value: countSeverity('Medium'), color: '#eab308' },
        { name: 'Baixa', value: countSeverity('Low'), color: '#22c55e' },
      ],
      // Gráfico de linhas simulado (pois exigiria salvar histórico de datas no mock)
      lineData: [
        { name: 'Jan', dev: Math.floor(Math.random() * 10) }, 
        { name: 'Fev', dev: Math.floor(Math.random() * 20) }, 
        { name: 'Mar', dev: Math.floor(Math.random() * 30) },
        { name: 'Apr', dev: Math.floor(Math.random() * 40) }, 
        { name: 'May', dev: openVulnerabilities }, // Último mês reflete a carga atual
      ]
    };
  }
};