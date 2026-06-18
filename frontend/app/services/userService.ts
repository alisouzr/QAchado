// app/services/userService.ts

const USE_MOCK = true;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface DeveloperProfile {
  id: string;
  name: string;
  initials: string;
  specialty: string;
  cargaAtual?: number; 
}

export const userService = {
  async getAvailableDevs(): Promise<DeveloperProfile[]> {
    if (!USE_MOCK) {
      const response = await fetch(`${API_BASE_URL}/users/devs`);
      return await response.json();
    }

    // 1. Puxa os devs do banco de usuários (Cria um mock inicial se estiver vazio)
    let devsDB = JSON.parse(localStorage.getItem('user_db') || '[]');
    if (devsDB.length === 0) {
      devsDB = [
        { id: 'd1', name: 'Aliny Souza Ramos', initials: 'AS', specialty: 'Frontend / Next.js' },
        { id: 'd2', name: 'Lucas Mendes', initials: 'LM', specialty: 'Backend / Node.js' },
        { id: 'd3', name: 'Dev DV', initials: 'DV', specialty: 'Segurança / Cloud' },
      ];
      localStorage.setItem('user_db', JSON.stringify(devsDB));
    }

    // 2. Puxa as vulnerabilidades para calcular a carga de trabalho de cada um
    const falhas = JSON.parse(localStorage.getItem('vuln_db') || '[]');

    // 3. Mapeia os devs e calcula a carga (Só conta as que NÃO estão concluídas/abertas)
    return devsDB.map((dev: DeveloperProfile) => {
      const carga = falhas.filter((f: any) => 
        f.assigneeInitials === dev.initials && 
        ['ATRIBUÍDO', 'EM PROGRESSO', 'PRONTO PARA RETESTE'].includes(f.status)
      ).length;

      return { ...dev, cargaAtual: carga };
    });
  }
};