"use client"
import { useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Simulação de um Banco de Dados de usuários registrados
const MOCK_DB = [
  { email: 'felipe@qachado.com', password: '123', role: 'QA', name: 'Felipe Silva (QA)' },
  { email: 'aliny@qachado.com', password: '123', role: 'DEV', name: 'Aliny Souza Ramos' }
];

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();

  // Estados da interface
  const [selectedRole, setSelectedRole] = useState<'QA' | 'DEV' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Função para lidar com o envio do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Limpa erros anteriores

    // Busca o usuário no "Banco de Dados"
    const user = MOCK_DB.find(
      (u) => u.email === email && u.password === password && u.role === selectedRole
    );

    if (user) {
      // Se acertou tudo, faz o login e manda pro Dashboard
      login(user.role as 'QA' | 'DEV', user.name);
      router.push('/');
    } else {
      // Se errou, mostra mensagem de erro
      setError('E-mail ou senha incorretos, ou perfil inválido.');
    }
  };

  // Função para voltar para a seleção de perfil
  const handleBack = () => {
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 w-full max-w-md">
        
        {/* Cabeçalho do Card (Fixo) */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <ShieldAlert size={48} className="text-blue-600" />
          <h1 className="font-bold text-2xl text-black">QAchado</h1>
          <p className="text-slate-500 text-sm">Faça login para continuar</p>
        </div>

        {/* PASSO 1: Escolher o Perfil */}
        {!selectedRole && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <button 
              onClick={() => setSelectedRole('QA')}
              className="w-full bg-[#4062f6] text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Entrar como Administrador / QA
            </button>
            
            <button 
              onClick={() => setSelectedRole('DEV')}
              className="w-full bg-[#1e2330] text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              Entrar como Desenvolvedor
            </button>
          </div>
        )}

        {/* PASSO 2: Formulário de E-mail e Senha */}
        {selectedRole && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={handleBack} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                <ArrowLeft size={20} className="text-slate-500" />
              </button>
              <h2 className="font-bold text-black text-sm uppercase">
                Login - {selectedRole === 'QA' ? 'Administrador / QA' : 'Desenvolvedor'}
              </h2>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-black mb-1">E-mail</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full border border-slate-300 text-black bg-white rounded-md px-3 py-2 outline-none focus:border-blue-500" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-1">Senha</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-300 text-black bg-white rounded-md px-3 py-2 outline-none focus:border-blue-500" 
              />
            </div>

            <button 
              type="submit"
              className={`w-full text-white font-bold py-3 rounded-lg mt-2 transition-colors shadow-sm ${
                selectedRole === 'QA' ? 'bg-[#4062f6] hover:bg-blue-700' : 'bg-[#1e2330] hover:bg-slate-800'
              }`}
            >
              Entrar
            </button>
          </form>
        )}

        {/* Link para Cadastro */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Não possui uma conta?{' '}
            <Link href="/cadastro" className="text-blue-600 font-bold hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}