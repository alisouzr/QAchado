// app/projetos/page.tsx
"use client"
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { projectService, ProjectData } from '@/app/services/projectService';
import { aiService } from '@/app/services/aiService';
import { Folder, ChevronRight, ChevronDown, Plus, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ProjetosList() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [projetos, setProjetos] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [projetoExpandido, setProjetoExpandido] = useState<string | null>(null);

  // Estados da IA por projeto
  const [aiResults, setAiResults] = useState<Record<string, string>>({});
  const [aiLoadingIds, setAiLoadingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role !== 'QA') {
      router.push('/');
    }
  }, [user, router]);

  // Carregar Projetos e preencher os Resumos da IA
  useEffect(() => {
    if (user?.role === 'QA') {
      projectService.getAll()
        .then((data: ProjectData[]) => {
          setProjetos(data);
          const initialAiData: Record<string, string> = {};
          data.forEach((proj: ProjectData) => {
            if (proj.aiSummary) initialAiData[proj.id!] = proj.aiSummary;
          });
          setAiResults(initialAiData);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  // Dispara a IA, exibe na tela E SALVA no banco!
  const handleOpenAI = async (projeto: ProjectData) => {
    setAiLoadingIds(prev => ({ ...prev, [projeto.id!]: true }));
    try {
      const response = await aiService.generateSummary(projeto.description);
      
      // 1. Atualiza na tela (React state)
      setAiResults(prev => ({ ...prev, [projeto.id!]: response }));
      
      // 2. Salva no banco de dados para não perder no F5
      await projectService.update(projeto.id!, { aiSummary: response });
      
    } catch (error) {
      setAiResults(prev => ({ ...prev, [projeto.id!]: "Erro ao processar IA." }));
    } finally {
      setAiLoadingIds(prev => ({ ...prev, [projeto.id!]: false }));
    }
  };

  if (!user || user.role !== 'QA') return null;
  if (loading) return <div className="flex h-full items-center justify-center font-bold text-slate-500">Carregando projetos...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black mb-1">Projetos</h1>
          <p className="text-sm text-slate-500 font-medium">Gerencie seus escopos de teste</p>
        </div>
        <Link href="/projetos/novo" className="bg-[#4062f6] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
          <Plus size={18} /> Novo Projeto
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {projetos.map((projeto) => (
          <div key={projeto.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-blue-300 transition-all">
            <button 
              onClick={() => setProjetoExpandido(projetoExpandido === projeto.id ? null : (projeto.id as string))}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Folder size={24} className="text-blue-500" />
                <h2 className="text-lg font-bold text-black">{projeto.name}</h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="bg-red-50 text-red-600 font-bold text-xs px-3 py-1.5 rounded-full border border-red-100">{projeto.achadosCount} Achados</span>
                {projetoExpandido === projeto.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </div>
            </button>

            {projetoExpandido === projeto.id && (
              <div className="p-6 bg-slate-50 border-t flex flex-col gap-4 animate-in fade-in duration-200">
                <p className="text-slate-700 text-sm leading-relaxed">
                  <strong className="text-black block mb-1 uppercase text-xs">Descrição:</strong> {projeto.description}
                </p>

                <div className="mt-2 border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <strong className="text-black uppercase text-xs">Resumo gerado pela IA:</strong>
                    <button 
                      onClick={() => handleOpenAI(projeto)}
                      className="flex items-center gap-1.5 text-xs bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-600 px-3 py-1.5 rounded-md font-bold transition-colors"
                    >
                      {aiLoadingIds[projeto.id!] ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />} 
                      {aiResults[projeto.id!] ? 'Recarregar IA' : 'Gerar Resumo'}
                    </button>
                  </div>
                  
                  {aiResults[projeto.id!] && (
                    <div className="bg-[#eef1f6] p-4 rounded-lg text-sm text-black leading-relaxed font-medium">
                      {aiResults[projeto.id!]}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <Link href={`/projetos/${projeto.id}`} className="flex items-center gap-2 bg-[#1e2330] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">
                    Acessar Kanban <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}