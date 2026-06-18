"use client"
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { userService, DeveloperProfile } from '@/app/services/userService';
import { vulnerabilityService, VulnerabilityData } from '@/app/services/vulnerabilityService';
import { X, ShieldAlert } from 'lucide-react';

export default function DevsDisponiveis() {
  const { user } = useAuth();
  const router = useRouter();

  const [devs, setDevs] = useState<DeveloperProfile[]>([]);
  const [openVulns, setOpenVulns] = useState<VulnerabilityData[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Modal
  const [selectedDev, setSelectedDev] = useState<DeveloperProfile | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role === 'DEV') {
      alert("Acesso Negado: Tela exclusiva para perfil QA.");
      router.push('/');
    }
  }, [user, router]);

  // Função para carregar os Devs e as Falhas Abertas
  const fetchData = async () => {
    try {
      const [devsData, vulnsData] = await Promise.all([
        userService.getAvailableDevs(),
        vulnerabilityService.getOpenVulnerabilities()
      ]);
      setDevs(devsData);
      setOpenVulns(vulnsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'QA') fetchData();
  }, [user]);

  // Função disparada ao clicar em "Atribuir" dentro do Modal
  const handleAssign = async (vulnId: string) => {
    if (!selectedDev) return;
    try {
      // Faz a atualização no banco
      await vulnerabilityService.assignToDev(vulnId, selectedDev.initials);
      
      // Recarrega as listas para atualizar a Carga do Dev e remover a falha da lista do modal
      await fetchData();
      
      // Se não houver mais falhas abertas, fecha o modal automaticamente
      if (openVulns.length <= 1) setSelectedDev(null);
      
      alert(`Vulnerabilidade atribuída com sucesso para ${selectedDev.name}!`);
    } catch (error) {
      alert("Erro ao atribuir vulnerabilidade.");
    }
  };

  if (user?.role !== 'QA') return null;
  if (loading) return <div className="flex h-full items-center justify-center font-bold text-slate-500">Carregando desenvolvedores...</div>;

  return (
    <div className="max-w-5xl mx-auto relative">
      <h1 className="text-2xl font-bold text-black mb-2">Desenvolvedores Disponíveis</h1>
      <p className="text-slate-600 mb-8 font-medium">Gerencie a alocação de novas vulnerabilidades para a equipe.</p>

      {/* Tabela de Devs */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-sm font-bold text-black uppercase">Nome do Desenvolvedor</th>
              <th className="p-4 text-sm font-bold text-black uppercase">Especialidade</th>
              <th className="p-4 text-sm font-bold text-black uppercase">Carga Atual</th>
              <th className="p-4 text-sm font-bold text-black uppercase w-48">Ação</th>
            </tr>
          </thead>
          <tbody>
            {devs.map((dev) => (
              <tr key={dev.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-4 text-sm font-bold text-black flex items-center gap-2">
                  <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded font-bold">{dev.initials}</span>
                  {dev.name}
                </td>
                <td className="p-4 text-sm text-slate-600 font-medium">{dev.specialty}</td>
                <td className="p-4">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                    dev.cargaAtual && dev.cargaAtual > 3 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                  }`}>
                    {dev.cargaAtual} Tarefas
                  </span>
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => setSelectedDev(dev)}
                    className="w-full bg-blue-50 text-blue-700 border border-blue-100 px-3 py-2 rounded-md text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    Atribuir Vulnerabilidade
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE ATRIBUIÇÃO */}
      {selectedDev && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Cabeçalho do Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-black">Atribuir para {selectedDev.name}</h2>
                <p className="text-xs text-slate-500 font-medium">Selecione uma vulnerabilidade aberta na lista abaixo.</p>
              </div>
              <button onClick={() => setSelectedDev(null)} className="p-2 bg-white hover:bg-slate-200 text-slate-600 rounded-full transition-colors border border-slate-200 shadow-sm">
                <X size={20} />
              </button>
            </div>

            {/* Corpo do Modal - Lista de Falhas */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {openVulns.length === 0 ? (
                <div className="text-center py-12">
                  <ShieldAlert size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-600 font-bold">Tudo limpo!</p>
                  <p className="text-sm text-slate-500">Não há nenhuma vulnerabilidade com status ABERTO no momento.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {openVulns.map((vuln) => (
                    <div key={vuln.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between hover:border-blue-300 transition-colors">
                      <div className="flex-1 pr-4">
                        <p className="text-xs font-bold text-slate-500 mb-1">{vuln.cve || 'CVE-PENDENTE'}</p>
                        <h3 className="text-sm font-bold text-black mb-2">{vuln.title}</h3>
                        <span className="text-xs font-bold flex items-center gap-1.5 text-black">
                          <span className={`w-2 h-2 rounded-full ${
                            vuln.severity === 'Critical' ? 'bg-red-600' :
                            vuln.severity === 'High' ? 'bg-orange-500' :
                            vuln.severity === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></span> 
                          {vuln.severity}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleAssign(vuln.id!)}
                        className="bg-[#4062f6] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
                      >
                        Atribuir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}