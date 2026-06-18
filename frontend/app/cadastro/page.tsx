"use client"
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function Cadastro() {
  // Estados para guardar os valores digitados no formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState('DEV'); // Inicia como DEV por padrão
  const [senha, setSenha] = useState('');
  const [especialidade, setEspecialidade] = useState('');

  // Função disparada ao clicar em "Criar Conta"
  const handleCadastro = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ---------------------------------------------------------
    // TODO PARA A EQUIPE DE BACKEND:
    // Aqui você fará a chamada para a API de registro (ex: POST /users)
    // Os dados já estão prontos no objeto abaixo:
    // ---------------------------------------------------------
    const novoUsuario = {
      name: nome,
      email: email,
      role: perfil,
      password: senha,
      // Só envia a especialidade se for DEV
      specialty: perfil === 'DEV' ? especialidade : undefined 
    };

    console.log("Dados prontos para envio:", novoUsuario);
    alert("Backend: Os dados do formulário foram capturados com sucesso! Verifique o console.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 py-10">
      <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 w-full max-w-md">
        
        <div className="flex flex-col items-center gap-2 mb-8">
          <ShieldAlert size={48} className="text-blue-600" />
          <h1 className="font-bold text-2xl text-black">Cadastro</h1>
          <p className="text-slate-500 text-sm">Crie sua conta no QAchado</p>
        </div>

        <form onSubmit={handleCadastro} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-black mb-1">Nome Completo</label>
            <input 
              type="text" 
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full border border-slate-300 text-black bg-white rounded-md px-3 py-2 outline-none focus:border-blue-500 transition-colors" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-1">E-mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full border border-slate-300 text-black bg-white rounded-md px-3 py-2 outline-none focus:border-blue-500 transition-colors" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-1">Perfil de Acesso</label>
            <select 
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
              className="w-full border border-slate-300 text-black bg-white rounded-md px-3 py-2 outline-none focus:border-blue-500 cursor-pointer font-medium"
            >
              <option value="DEV">Desenvolvedor</option>
              <option value="QA">Administrador / QA</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">Atenção: Apenas perfis QA podem cadastrar novos projetos.</p>
          </div>

          {/* RENDERIZAÇÃO CONDICIONAL: Aparece apenas se o perfil for 'DEV' */}
          {perfil === 'DEV' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-bold text-black mb-1">Sua Especialidade</label>
              <input 
                type="text" 
                required={perfil === 'DEV'} // Torna obrigatório apenas se o campo estiver visível
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value)}
                placeholder="Ex: Frontend / Next.js"
                className="w-full border border-slate-300 text-black bg-white rounded-md px-3 py-2 outline-none focus:border-blue-500 transition-colors" 
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-black mb-1">Senha</label>
            <input 
              type="password" 
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Crie uma senha forte"
              className="w-full border border-slate-300 text-black bg-white rounded-md px-3 py-2 outline-none focus:border-blue-500 transition-colors" 
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#4062f6] text-white font-bold py-3 rounded-lg mt-4 hover:bg-blue-700 transition-colors shadow-sm"
          >
            Criar Conta
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Já possui uma conta?{' '}
            <Link href="/login" className="text-blue-600 font-bold hover:underline">
              Fazer Login
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}