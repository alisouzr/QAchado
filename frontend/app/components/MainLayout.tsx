"use client"
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { useAuth } from '@/app/context/AuthContext';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Rotas públicas que não devem ter a Sidebar
  const isPublicRoute = pathname === '/login' || pathname === '/cadastro';

  if (isPublicRoute) {
    return <main className="flex-1 w-full h-screen">{children}</main>;
  }

  // Se não estiver logado e não for rota pública, idealmente você redirecionaria pro /login.
  // Aqui vamos apenas mostrar a estrutura.
  return (
    <div className="flex h-screen w-full">
      {user && <Sidebar />}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}