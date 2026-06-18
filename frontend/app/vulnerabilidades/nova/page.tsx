"use client"
import { Image as ImageIcon, FileText, UploadCloud, X } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext'; 
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { vulnerabilityService } from '@/app/services/vulnerabilityService';
import { projectService, ProjectData } from '@/app/services/projectService'; 

export default function NovaVulnerabilidade() {
  const { user } = useAuth();
  const router = useRouter();

  // Estados da Lista de Projetos (Para o Select)
  const [projetosList, setProjetosList] = useState<ProjectData[]>([]);

  // Estados dos Campos do Formulário
  const [projeto, setProjeto] = useState('');
  const [titulo, setTitulo] = useState('Reflected XSS on Login');
  const [descricao, setDescricao] = useState('Stale JWTs can be reused by an attacker...');
  const [recomendacao, setRecomendacao] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [severidade, setSeveridade] = useState('Critical');

  // Estados do Drag and Drop de Evidências
  const [evidencias, setEvidencias] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Efeito 1: Proteção de Rota
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Efeito 2: Carregar os Projetos Dinamicamente ao abrir a tela
  useEffect(() => {
    if (user) {
      projectService.getAll()
        .then((data) => setProjetosList(data))
        .catch((error) => console.error("Erro ao carregar projetos:", error));
    }
  }, [user]);

  // Função assíncrona conectada ao service
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projeto) {
      alert("Por favor, selecione um Projeto Relacionado.");
      return;
    }

    try {
      await vulnerabilityService.create({
        title: titulo,
        description: descricao,
        severity: severidade,
        projetoId: projeto,
        recomendacao,
        comentarios,
        reportadoPor: user?.name || 'QA',
      });

      alert('Vulnerabilidade cadastrada com sucesso!');
      router.push(`/projetos/${projeto}`);
      
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Ocorreu um erro ao tentar salvar a vulnerabilidade.");
    }
  };

  // --- Funções de Drag & Drop ---
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) processFiles(e.target.files);
  };
  const processFiles = (files: FileList) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'text/plain'];
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => allowedTypes.includes(file.type));
    if (validFiles.length !== newFiles.length) alert("Apenas PNG, JPG e TXT são permitidos.");
    setEvidencias(prev => [...prev, ...validFiles]);
  };
  const removeFile = (indexToRemove: number) => {
    setEvidencias(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
      <h1 className="text-2xl font-bold mb-8 uppercase tracking-tight text-black border-b border-slate-100 pb-4">
        Cadastro de Vulnerabilidade
      </h1>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-6">
        
        <div className="col-span-4">
          <label className="block text-sm font-bold text-black mb-1">Projeto Relacionado</label>
          <select 
            required
            value={projeto}
            onChange={(e) => setProjeto(e.target.value)}
            className="w-full border border-slate-300 text-black bg-white rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">Selecione o projeto...</option>
            {/* Renderizando a lista de projetos do banco (Mock/API) */}
            {projetosList.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="col-span-8">
          <label className="block text-sm font-bold text-black mb-1">Título</label>
          <input 
            type="text" 
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full border border-slate-300 text-black bg-white rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500" 
          />
        </div>

        <div className="col-span-12">
          <label className="block text-sm font-bold text-black mb-1">Descrição</label>
          <textarea 
            rows={4} 
            required
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full border border-slate-300 text-black bg-white rounded-md px-3 py-2 text-sm resize-none outline-none focus:border-blue-500"
          />
        </div>

        <div className="col-span-6">
          <label className="block text-sm font-bold text-black mb-1">Recomendação de Correção</label>
          <textarea 
            rows={3} 
            value={recomendacao}
            onChange={(e) => setRecomendacao(e.target.value)}
            placeholder="Descreva a sugestão técnica para o desenvolvedor..."
            className="w-full border border-slate-300 text-black bg-white rounded-md px-3 py-2 text-sm resize-none outline-none focus:border-blue-500"
          />
        </div>

        <div className="col-span-6">
          <label className="block text-sm font-bold text-black mb-1">Comentários (Opcional)</label>
          <textarea 
            rows={3} 
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            placeholder="Adicione observações, links externos ou contexto extra..."
            className="w-full border border-slate-300 text-black bg-white rounded-md px-3 py-2 text-sm resize-none outline-none focus:border-blue-500"
          />
        </div>

        <div className="col-span-3">
          <label className="block text-sm font-bold text-black mb-1">Severidade</label>
          <select 
            value={severidade}
            onChange={(e) => setSeveridade(e.target.value)}
            className="w-full border border-slate-300 text-black bg-white rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="Critical">Crítico</option>
            <option value="High">Alta</option>
            <option value="Medium">Média</option>
            <option value="Low">Baixa</option>
          </select>
        </div>
        
        <div className="col-span-4">
          <label className="block text-sm font-bold text-black mb-1">Reportado por (QA)</label>
          <input 
            type="text" 
            readOnly
            value={user?.name || 'QA'}
            className="w-full border border-slate-200 text-slate-500 bg-slate-50 rounded-md px-3 py-2 text-sm outline-none cursor-not-allowed font-medium" 
          />
        </div>
        
        <div className="col-span-5 flex items-end">
           <button 
             type="submit"
             className="w-full bg-[#4062f6] text-white px-8 py-2.5 rounded-md text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
           >
              Submit Vulnerability
           </button>
        </div>

        {/* Evidências */}
        <div className="col-span-12 pt-4 border-t border-slate-100 mt-2">
          <h3 className="text-sm font-bold text-black mb-3 uppercase">Evidence</h3>
          <div 
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors cursor-pointer ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <input type="file" multiple accept=".png, .jpg, .jpeg, .txt" className="hidden" ref={fileInputRef} onChange={handleFileInput} />
            <UploadCloud size={40} className={`mb-3 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
            <p className="text-sm font-bold text-black text-center">Arraste e solte arquivos aqui ou <span className="text-blue-600">clique para procurar</span></p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Suporta: PNG, JPG, TXT</p>
          </div>
          {evidencias.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {evidencias.map((file, index) => {
                const isImage = file.type.startsWith('image/');
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div className="p-2 bg-slate-100 rounded text-slate-600">{isImage ? <ImageIcon size={20} /> : <FileText size={20} />}</div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-black truncate" title={file.name}>{file.name}</p>
                      <p className="text-[10px] font-medium text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button type="button" onClick={() => removeFile(index)} className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded transition-colors"><X size={16} /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}