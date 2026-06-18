"use client"
import { useState, useMemo, useEffect, use } from 'react';
import { vulnerabilityService, VulnerabilityData } from '@/app/services/vulnerabilityService';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react'; 

export default function ProjetoKanban({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const { id: projectId } = use(params);

  const [tasks, setTasks] = useState<VulnerabilityData[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Estados do Modal de Detalhes
  const [selectedTask, setSelectedTask] = useState<VulnerabilityData | null>(null);
  const [modalStatus, setModalStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  // Função isolada para recarregar as tarefas
  const fetchTasks = async () => {
    try {
      const data = await vulnerabilityService.getByProject(projectId);
      setTasks(data);
    } catch (error) {
      console.error("Erro ao buscar vulnerabilidades:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchTasks();
  }, [projectId, user]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (task.cve && task.cve.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSeverity = severityFilter === '' || task.severity === severityFilter;
      const matchesAssignee = assigneeFilter === '' || task.assigneeInitials === assigneeFilter;
      return matchesSearch && matchesSeverity && matchesAssignee;
    });
  }, [tasks, searchQuery, severityFilter, assigneeFilter]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-600';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  // Abrir o Modal
  const handleOpenTask = (task: VulnerabilityData) => {
    setSelectedTask(task);
    setModalStatus(task.status || 'ABERTO');
  };

  // Atualizar o Status via Modal
  const handleUpdateStatus = async () => {
    if (!selectedTask) return;
    setIsUpdating(true);
    
    try {
      await vulnerabilityService.updateStatus(selectedTask.id!, modalStatus);
      await fetchTasks(); // Recarrega o kanban para mover (ou sumir) o card
      setSelectedTask(null); // Fecha o modal
    } catch (error) {
      alert("Erro ao atualizar o status.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null; 
  if (loading) return <div className="flex h-full items-center justify-center font-bold text-slate-500">Carregando painel do projeto...</div>;

  return (
    <div className="flex flex-col h-full relative">
      
      {/* --- CABEÇALHO E FILTROS --- */}
      <div className="flex gap-4 mb-6 items-center flex-wrap">
        <h1 className="text-2xl font-bold text-black mr-auto">Projetos / Projeto {projectId}</h1>
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="border border-slate-300 text-black bg-white rounded-md px-3 py-2 text-sm outline-none cursor-pointer">
          <option value="">Todas as Severidades</option>
          <option value="Critical">Crítica</option>
          <option value="High">Alta</option>
          <option value="Medium">Média</option>
          <option value="Low">Baixa</option>
        </select>
        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="border border-slate-300 text-black bg-white rounded-md px-3 py-2 text-sm outline-none cursor-pointer">
          <option value="">Todos os Responsáveis</option>
          <option value="AJ">Ahmad J. (AJ)</option>
          <option value="ND">Não Definido (ND)</option>
        </select>
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Pesquisar por nome, CVE..." className="border border-slate-300 text-black bg-white rounded-md px-3 py-2 text-sm outline-none min-w-[250px]" />
      </div>

      {/* --- BOARD KANBAN --- */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        
        <div className="bg-red-50/50 rounded-lg p-3 min-w-[300px] border border-red-100 flex flex-col min-h-[500px]">
          <h2 className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded mb-4 w-max shadow-sm">ABERTO</h2>
          {filteredTasks.filter(t => t.status === 'ABERTO').map(task => (
            <TaskCard key={task.id} task={task} getSeverityColor={getSeverityColor} onClick={() => handleOpenTask(task)} />
          ))}
        </div>

        <div className="bg-orange-50/50 rounded-lg p-3 min-w-[300px] border border-orange-100 flex flex-col min-h-[500px]">
          <h2 className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded mb-4 w-max shadow-sm">ATRIBUÍDO</h2>
          {filteredTasks.filter(t => t.status === 'ATRIBUÍDO').map(task => (
            <TaskCard key={task.id} task={task} getSeverityColor={getSeverityColor} onClick={() => handleOpenTask(task)} />
          ))}
        </div>
        
        <div className="bg-blue-50/50 rounded-lg p-3 min-w-[300px] border border-blue-100 flex flex-col min-h-[500px]">
          <h2 className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded mb-4 w-max shadow-sm">EM PROGRESSO</h2>
          {filteredTasks.filter(t => t.status === 'EM PROGRESSO' || t.status === 'Em Correção').map(task => (
            <TaskCard key={task.id} task={task} getSeverityColor={getSeverityColor} onClick={() => handleOpenTask(task)} />
          ))}
        </div>

        <div className="bg-green-50/50 rounded-lg p-3 min-w-[300px] border border-green-100 flex flex-col min-h-[500px]">
          <h2 className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded mb-4 w-max shadow-sm">PRONTO PARA RETESTE</h2>
          {filteredTasks.filter(t => t.status === 'PRONTO PARA RETESTE').map(task => (
            <TaskCard key={task.id} task={task} getSeverityColor={getSeverityColor} onClick={() => handleOpenTask(task)} />
          ))}
        </div>

      </div>

      {/* --- MODAL DE DETALHES --- */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Cabecalho Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div>
                <p className="text-sm font-bold text-slate-500 mb-1">{selectedTask.cve || 'CVE-PENDENTE'}</p>
                <h2 className="text-xl font-bold text-black">{selectedTask.title}</h2>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Corpo Scrollavel */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Badges Info */}
              <div className="flex gap-4">
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
                <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
                  <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Responsável Atual</span>
                  <span className="text-sm font-bold text-black">{selectedTask.assigneeInitials || 'Não Definido'}</span>
                </div>
              </div>

              {/* Textos da Vulnerabilidade */}
              <div>
                <h3 className="text-sm font-bold text-black mb-2 uppercase">Descrição</h3>
                <div className="bg-[#eef1f6] p-4 rounded-lg text-sm text-black leading-relaxed whitespace-pre-wrap">
                  {selectedTask.description}
                </div>
              </div>

              {selectedTask.recomendacao && (
                <div>
                  <h3 className="text-sm font-bold text-black mb-2 uppercase">Recomendação de Correção</h3>
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-black leading-relaxed whitespace-pre-wrap">
                    {selectedTask.recomendacao}
                  </div>
                </div>
              )}

              {selectedTask.comentarios && (
                <div>
                  <h3 className="text-sm font-bold text-black mb-2 uppercase">Comentários</h3>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-sm text-black leading-relaxed whitespace-pre-wrap">
                    {selectedTask.comentarios}
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé de Ações */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-bold text-black mb-1">Alterar Status Atual</label>
                <select 
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full border border-slate-300 text-black bg-white rounded-md px-3 py-2.5 text-sm outline-none cursor-pointer font-medium"
                >
                  <option value="ABERTO">Aberto</option>
                  <option value="ATRIBUÍDO">Atribuído</option>
                  <option value="EM PROGRESSO">Em Progresso (Retornar para o Dev)</option>
                  <option value="PRONTO PARA RETESTE">Pronto para Reteste</option>
                  <option value="CONCLUÍDO">Concluído (Finalizar e Remover do Board)</option>
                </select>
              </div>
              <button 
                onClick={handleUpdateStatus}
                disabled={isUpdating}
                className="bg-[#4062f6] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isUpdating ? 'Salvando...' : 'Salvar e Mover Card'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

function TaskCard({ task, getSeverityColor, onClick }: { task: VulnerabilityData, getSeverityColor: any, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white p-4 rounded-md shadow-sm border border-slate-200 mb-3 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
    >
      <p className="text-xs font-bold text-slate-500 mb-1">{task.cve || 'CVE-PENDENTE'}</p>
      <p className="text-sm font-semibold text-black leading-tight mb-4">{task.title}</p>
      
      <div className="flex justify-between items-center mt-auto border-t border-slate-100 pt-3">
        <span className="text-xs font-bold flex items-center gap-1.5 text-black">
          <span className={`w-2 h-2 rounded-full ${getSeverityColor(task.severity)}`}></span> 
          {task.severity}
        </span>
        <span className="bg-slate-100 text-black text-xs px-2 py-1.5 rounded font-bold border border-slate-200">
          {task.assigneeInitials || 'ND'}
        </span>
      </div>
    </div>
  )
}