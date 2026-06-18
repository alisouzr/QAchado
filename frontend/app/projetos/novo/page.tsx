// app/projetos/novo/page.tsx
"use client"
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext'; 
import { useRouter } from 'next/navigation';
import { projectService } from '@/app/services/projectService';
import { aiService } from '@/app/services/aiService';

export default function NovoProjeto() {
  const { user } = useAuth();
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [resumoIA, setResumoIA] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role !== 'QA') {
      router.push('/');
    }
  }, [user, router]);

  const handleGerarResumo = async () => {
    if (!descricao) {
      alert("Preencha a descrição antes de gerar o resumo.");
      return;
    }
    setIsGenerating(true);
    try {
      const novoResumo = await aiService.generateSummary(descricao);
      setResumoIA(novoResumo);
    } catch (e) {
      alert("Erro ao gerar resumo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert("O nome do projeto é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    try {
      // SALVANDO O RESUMO DA IA JUNTO COM O PROJETO
      await projectService.create({ 
        name: nome, 
        description: descricao, 
        aiSummary: resumoIA 
      });
      router.push('/projetos'); 
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      alert("Erro ao criar o projeto.");
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'QA') return null;

  return (
    <div className="max-w-3xl mx-auto mt-4">
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        
        <div className="mb-8 border-b border-slate-100 pb-6">
          <h1 className="text-2xl font-bold text-black mb-1">Criar Novo Projeto</h1>
          <p className="text-sm text-slate-500 font-medium">Defina o escopo para atribuição de achados.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-bold text-black mb-2">Nome do Projeto</label>
            <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: API de Pagamentos" className="w-full border border-slate-300 text-black bg-white rounded-md px-4 py-3 text-sm outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-2">Descrição</label>
            <textarea rows={5} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Qual o propósito deste sistema?" className="w-full border border-slate-300 text-black bg-white rounded-md px-4 py-3 text-sm resize-none outline-none focus:border-blue-500" />
          </div>

          <div className="col-span-12">
            <label className="block text-sm font-bold text-black mb-1">Resumo gerado pela IA</label>
            <div className="flex gap-2">
              <textarea rows={2} value={resumoIA} onChange={(e) => setResumoIA(e.target.value)} className="text-black flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="O resumo aparecerá aqui..." />
              <button type="button" onClick={handleGerarResumo} disabled={isGenerating} className="bg-blue-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-blue-700 disabled:bg-slate-400">
                {isGenerating ? 'Gerando...' : 'Gerar Resumo'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 mt-4 pt-6 border-t border-slate-50">
            <button type="button" onClick={() => router.push('/projetos')} className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="bg-[#4062f6] text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Salvando...' : 'Salvar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}