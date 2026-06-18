"use client"
import { LayoutDashboard, Folder, ShieldAlert, FileText, Settings, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname.startsWith(path);
  };

  const linkBaseClass = "flex items-center gap-2 p-2 rounded-md font-medium text-black hover:bg-slate-200 transition-colors";
  const activeClass = "bg-blue-100 text-blue-700 hover:bg-blue-200";

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-8 px-2">
        <ShieldAlert className="text-blue-600" />
        <span className="font-bold text-xl text-black">QAchado</span>
      </div>
      
      <div className="mb-6 px-2">
        <p className="text-xs font-bold text-slate-400 uppercase">Logado como</p>
        <p className="font-bold text-black">{user?.name}</p>
        <span className="bg-slate-200 text-xs px-2 py-0.5 rounded text-slate-700">{user?.role}</span>
      </div>
      
      <nav className="flex flex-col gap-2 flex-1">
        <Link href="/" className={`${linkBaseClass} ${pathname === '/' ? activeClass : ''}`}>
          <LayoutDashboard size={20} /> Dashboard
        </Link>
        
        {/* ESCONDIDO DO DEV */}
        {user?.role === 'QA' && (
          <>
            <Link href="/projetos" className={`${linkBaseClass} ${isActive('/projetos') ? activeClass : ''}`}>
              <Folder size={20} /> Projetos
            </Link>
            
            <Link href="/vulnerabilidades/nova" className={`${linkBaseClass} ${isActive('/vulnerabilidades') ? activeClass : ''}`}>
              <ShieldAlert size={20} /> Cadastro de Falhas
            </Link>

            <Link href="/devs" className={`${linkBaseClass} ${isActive('/devs-disponiveis') ? activeClass : ''}`}>
              <Users size={20} /> Devs Disponíveis
            </Link>
          </>
        )}
        
        {/* VISÍVEL PARA AMBOS */}
        {user?.role === 'DEV' && (
          <Link href="/atribuicoes" className={`${linkBaseClass} ${isActive('/minhas-atribuicoes') ? activeClass : ''}`}>
            <FileText size={20} /> Minhas Atribuições
          </Link>
        )}

        {/* Botão de Logout */}
        <button onClick={logout} className="text-left text-red-600 font-medium p-2 hover:bg-red-50 rounded-md mt-2">
          Sair
        </button>
      </nav>
    </aside>
  )
}