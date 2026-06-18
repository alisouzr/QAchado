// app/services/projectService.ts

const USE_MOCK = false; // <--- Mude para false para usar o backend real
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ProjectData {
  id?: string;
  name: string;
  description: string;
  status?: 'ATIVO' | 'CONCLUÍDO' | 'ARQUIVADO';
  vulnerabilitiesCount?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export const projectService = {
  
  async getAll(): Promise<ProjectData[]> {
    if (!USE_MOCK) {
      const response = await fetch(`${API_BASE_URL}/projetos`, {
        credentials: 'include' // -> ADICIONADO PARA INTEGRAÇÃO COM COOKIES DE SESSÃO
      });
      if (!response.ok) throw new Error('Falha ao buscar projetos.');
      return await response.json();
    }

    return JSON.parse(localStorage.getItem('project_db') || '[]');
  },

  async getById(id: string): Promise<ProjectData> {
    if (!USE_MOCK) {
      const response = await fetch(`${API_BASE_URL}/projetos/${id}`, {
        credentials: 'include' // -> ADICIONADO PARA INTEGRAÇÃO COM COOKIES DE SESSÃO
      });
      if (!response.ok) throw new Error('Projeto não encontrado.');
      return await response.json();
    }

    const projetos = JSON.parse(localStorage.getItem('project_db') || '[]');
    return projetos.find((p: ProjectData) => p.id === id);
  },

  async create(data: ProjectData): Promise<ProjectData> {
    if (!USE_MOCK) {
      const response = await fetch(`${API_BASE_URL}/projetos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // -> ADICIONADO PARA INTEGRAÇÃO COM COOKIES DE SESSÃO
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Falha ao criar projeto.');
      return await response.json();
    }

    const novoProjeto = {
      ...data,
      id: Date.now().toString(),
      status: 'ATIVO' as const,
      vulnerabilitiesCount: { critical: 0, high: 0, medium: 0, low: 0 }
    };

    const projetos = JSON.parse(localStorage.getItem('project_db') || '[]');
    projetos.push(novoProjeto);
    localStorage.setItem('project_db', JSON.stringify(projetos));
    return novoProjeto;
  }
};