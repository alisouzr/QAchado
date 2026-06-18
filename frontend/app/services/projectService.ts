// app/services/projectService.ts

const USE_MOCK = true; 
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ProjectData {
  id?: string;
  name: string;
  description: string;
  achadosCount?: number;
  aiSummary?: string;
}

export const projectService = {
  async getAll() {
    if (!USE_MOCK) {
      const response = await fetch(`${API_BASE_URL}/projetos`);
      return await response.json();
    }
    const db = localStorage.getItem('project_db');
    let projetos: ProjectData[] = [];
    
    if (!db) {
      projetos = [
        { id: '1', name: 'Projeto Alpha - Core Banking', description: 'Sistema principal core bancário.' },
        { id: '2', name: 'App Mobile V2', description: 'Novo aplicativo em Flutter.' }
      ];
      localStorage.setItem('project_db', JSON.stringify(projetos));
    } else {
      projetos = JSON.parse(db);
    }

    const vulns = JSON.parse(localStorage.getItem('vuln_db') || '[]');
    return projetos.map(projeto => {
      const count = vulns.filter((v: any) => v.projetoId === projeto.id && v.status !== 'CONCLUÍDO').length;
      return { ...projeto, achadosCount: count };
    });
  },

  async create(data: ProjectData) {
    if (!USE_MOCK) {
      const response = await fetch(`${API_BASE_URL}/projetos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    }
    const projetos = JSON.parse(localStorage.getItem('project_db') || '[]');
    const novoProjeto = { ...data, id: Date.now().toString() };
    projetos.push(novoProjeto);
    localStorage.setItem('project_db', JSON.stringify(projetos));
    return { ...novoProjeto, achadosCount: 0 };
  },

  // --- NOVA FUNÇÃO: ATUALIZAR PROJETO ---
  async update(id: string, data: Partial<ProjectData>) {
    if (!USE_MOCK) {
      // Usamos PATCH para atualizar apenas os campos enviados (neste caso, o aiSummary)
      const response = await fetch(`${API_BASE_URL}/projetos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Falha ao atualizar projeto.');
      return await response.json();
    }

    const projetos = JSON.parse(localStorage.getItem('project_db') || '[]');
    const atualizados = projetos.map((p: any) => p.id === id ? { ...p, ...data } : p);
    localStorage.setItem('project_db', JSON.stringify(atualizados));
  }
};