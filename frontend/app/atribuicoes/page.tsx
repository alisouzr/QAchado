"use client"
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext'; 
import { useRouter } from 'next/navigation';
import { vulnerabilityService, VulnerabilityData } from '@/app/services/vulnerabilityService';
import { projectService, ProjectData } from '@/app/services/projectService';
import { Paperclip } from 'lucide-react'; // Ícone para evidências

export default function MinhasAtribuicoes() {
  const { user } = useAuth();
  const router = useRouter();

  const [assignments, setAssignments] = useState<VulnerabilityData[]>([]);
  const [projetos, setProjetos] = useState<ProjectData[]>([]); // Para buscar o nome do projeto
  const [selectedTask, setSelectedTask] = useState<VulnerabilityData | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role === 'DEV') {
      const getInitials = (name: string) => {
        if (!name) return 'ND';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
      };
      const initials = getInitials(user.name);

      // Busca as vulnerabilidades E os projetos simultaneamente
      Promise.all([
        vulnerabilityService.getByAssignee(initials),
        projectService.getAll()
      ])
      .then(([vulnsData, projetosData]) => {
        setAssignments(vulnsData);
        setProjetos(projetosData);
        if (vulnsData.length > 0) {
          setSelectedTask(vulnsData[0]);
          setNewStatus(vulnsData[0].status || 'ATRIBUÍDO');
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, router]);

  const handleSelectTask = (task: VulnerabilityData) => {
    setSelectedTask(task);
    setNewStatus(task.status || 'ATRIBUÍDO'); 
  };

  const handleSubmitStatus = async () => {
    if (!selectedTask || !selectedTask.id) return;
    setIsUpdating(true);

    try {
      await vulnerabilityService.updateStatus(selectedTask.id, newStatus);
      setAssignments(prev => prev.map(task => 
        task.id === selectedTask.id ? { ...task, status: newStatus as any } : task
      ));
      setSelectedTask(prev => prev ? { ...prev, status: newStatus as any } : null);
      
      alert(`Status atualizado para "${newStatus}"! O QA já pode ver no Kanban.`);
    } catch (error) {
      alert("Erro ao atualizar o status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'ABERTO': return 'bg-red-100 text-red-700 border-red-200';
      case 'ATRIBUÍDO': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'EM PROGRESSO': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PRONTO PARA RETESTE': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-600';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  // Puxa o nome real do projeto cruzando o ID
  const getProjectName = (id: string) => {
    const proj = projetos.find(p => p.id === id);
    return proj ? proj.name : `Projeto ID: ${id}`;
  };

  if (!user || user.role !== 'DEV') return null;
  if (loading) return <div className="flex h-full items-center justify-center font-bold text-slate-500">Buscando suas atribuições...</div>;

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col animate-in fade-in duration-300">
      <h1 className="text-2xl font-bold text-black mb-6">
        Minhas Atribuições {selectedTask && <span className="text-slate-400 font-normal">/ {selectedTask.cve || 'Nova'}</span>}
      </h1>
      
      <div className="flex flex-1 gap-6 items-start">
        
        {/* LADO ESQUERDO: LISTA */}
        <div className="w-1/3 flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase text-slate-500 mb-2">Suas Tarefas ({assignments.length})</h2>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh] pr-2 pb-10">
            {assignments.map(task => (
              <div 
                key={task.id}
                onClick={() => handleSelectTask(task)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedTask?.id === task.id 
                    ? 'border-blue-600 bg-blue-50 shadow-md ring-1 ring-blue-600' 
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <p className="text-xs font-bold text-slate-500 mb-1">{task.cve || 'CVE-PENDENTE'}</p>
                <p className="text-sm font-bold text-black mb-3 line-clamp-2">{task.title}</p>
                <span className={`text-xs font-bold px-2 py-1 rounded border ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
            ))}
            {assignments.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-center text-slate-500 text-sm font-medium">
                Você não possui nenhuma vulnerabilidade atribuída no momento.
              </div>
            )}
          </div>
        </div>

        {/* LADO DIREITO: DETALHES COMPLETOS */}
        <div className="w-2/3">
          {selectedTask ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
              
              {/* Cabeçalho de Badges Informativos */}
              <div className="flex gap-4 mb-6 flex-wrap">
                <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg flex-1">
                  <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Projeto Relacionado</span>
                  <span className="text-sm font-bold text-black truncate block">{getProjectName(selectedTask.projetoId)}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
                  <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Severidade</span>
                  <span className="text-sm font-bold flex items-center gap-1.5 text-black">
                    <span className={`w-2 h-2 rounded-full ${getSeverityColor(selectedTask.severity)}`}></span> 
                    {selectedTask.severity}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
                  <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Reportado Por</span>
                  <span className="text-sm font-bold text-black">{selectedTask.reportadoPor || 'QA'}</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-black mb-1 uppercase">Título da Falha</h3>
                <p className="text-xl font-bold text-black">{selectedTask.title}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-black mb-2 uppercase">Descrição Técnica</h3>
                <div className="bg-[#eef1f6] p-4 rounded-lg text-sm text-black leading-relaxed whitespace-pre-wrap">
                  {selectedTask.description}
                </div>
              </div>

              {selectedTask.recomendacao && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-black mb-2 uppercase">Recomendação de Correção</h3>
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-black leading-relaxed whitespace-pre-wrap">
                    {selectedTask.recomendacao}
                  </div>
                </div>
              )}

              {selectedTask.comentarios && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-black mb-2 uppercase">Comentários Adicionais</h3>
                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg text-sm text-black leading-relaxed whitespace-pre-wrap">
                    {selectedTask.comentarios}
                  </div>
                </div>
              )}

              {/* Área de Evidências */}
              <div className="mb-8 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-black mb-3 uppercase">Evidências Anexadas</h3>
                {/* 
                  Como estamos usando Mock com LocalStorage e não é recomendado salvar 
                  arquivos grandes (Base64/Files) lá, exibimos este placeholder. 
                  Quando o backend for acoplado, você mapearia "selectedTask.evidencias" aqui. 
                */}
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100 font-medium">
                  <Paperclip size={18} /> As evidências de imagem/texto estarão disponíveis via link de download após a integração com a API.
                </div>
              </div>

              {/* Formulário de Ação */}
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-black mb-2 uppercase">Ação: Atualizar Status do Kanban</h3>
                
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-slate-300 text-black bg-white rounded-md px-3 py-3 text-sm mb-4 outline-none focus:border-blue-500 cursor-pointer font-bold"
                >
                  <option value="ATRIBUÍDO">Atribuído (Pausado / Na fila)</option>
                  <option value="EM PROGRESSO">Em Progresso (Estou codificando a solução)</option>
                  <option value="PRONTO PARA RETESTE">Pronto para Reteste (Devolver para validação do QA)</option>
                </select>
                
                <button 
                  onClick={handleSubmitStatus}
                  disabled={isUpdating || newStatus === selectedTask.status}
                  className="w-full bg-[#4062f6] text-white px-4 py-3.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isUpdating ? 'Salvando Alteração...' : 'Salvar Alteração no Banco'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex items-center justify-center h-64 text-slate-400 font-medium">
              Selecione uma tarefa na lista ao lado para ver os detalhes e iniciar a correção.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}