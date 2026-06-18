// app/page.tsx
"use client"
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/app/context/AuthContext'; 
import { useRouter } from 'next/navigation';
import { dashboardService, DashboardData } from '@/app/services/dashboardService';

export default function Dashboard() {
  const { user, toggleAvailability } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredLegend, setHoveredLegend] = useState<number | null>(null);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  useEffect(() => {
    if (user) {
      // Garante que as iniciais sejam geradas caso o AuthContext não as envie (ex: "Aliny Souza Ramos" -> "AS")
      const getInitials = (name: string) => {
        if (!name) return 'ND';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
      };
      
      const initials = user.initials || getInitials(user.name);

      // Enviando as iniciais corretas para o backend/mock
      dashboardService.getDashboardOverview({ role: user.role!, initials })
        .then((dashboardData) => setData(dashboardData))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!user) return null;
  if (loading || !data) return <div className="flex h-full items-center justify-center font-bold text-slate-500">Carregando métricas...</div>;

  const isQA = user.role === 'QA';

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-black">
          Dashboard {isQA ? '- Visão Geral (Global)' : '- Visão do Desenvolvedor'}
        </h1>
        
        {isQA ? (
          <button onClick={() => router.push('/projetos/novo')} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            + Adicionar Projeto
          </button>
        ) : (
          <button onClick={toggleAvailability} className={`font-bold px-4 py-2 rounded-md transition-colors ${user.isAvailable ? 'bg-green-600 text-white hover:bg-green-700 border border-green-700' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'}`}>
            {user.isAvailable ? '✅ Estou Disponível' : 'Declarar Disponibilidade'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-black font-bold text-sm uppercase text-slate-500">{isQA ? 'Projetos Totais' : 'Meus Projetos Ativos'}</p>
          <p className="text-4xl font-bold mt-2 text-black">{data.metrics.totalProjects}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-black font-bold text-sm uppercase text-slate-500">{isQA ? 'Vulnerabilidades Abertas' : 'Minhas Tarefas Pendentes'}</p>
          <p className="text-4xl font-bold mt-2 text-black">{data.metrics.openVulnerabilities}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-black font-bold text-sm uppercase text-slate-500">{isQA ? 'Vulnerabilidades Críticas' : 'Tarefas Críticas P/ Mim'}</p>
          <p className="text-4xl font-bold mt-2 text-black">{data.metrics.criticalVulnerabilities}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-medium mb-4 text-black">{isQA ? 'Vulnerabilidades por Severidade' : 'Minhas Atribuições por Severidade'}</h3>
          <div className="h-64 flex items-center">
            <div className="flex-1 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.pieData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                    {data.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/3 flex flex-col gap-4 justify-center pl-2 pr-4">
              {data.pieData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between cursor-default p-2 rounded-md hover:bg-slate-50 transition-colors" onMouseEnter={() => setHoveredLegend(index)} onMouseLeave={() => setHoveredLegend(null)}>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-sm shadow-sm" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-sm font-semibold text-black">{entry.name}</span>
                  </div>
                  <span className={`text-sm font-bold text-slate-500 transition-opacity duration-300 ${hoveredLegend === index ? 'opacity-100' : 'opacity-0'}`}>({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-medium mb-4 text-black">{isQA ? 'Progresso Geral' : 'Meu Progresso'}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.lineData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{fill: 'black'}} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{fill: 'black'}} />
                <Tooltip />
                <Line type="monotone" dataKey="dev" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}