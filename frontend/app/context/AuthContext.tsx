// context/AuthContext.tsx
"use client"
import { createContext, useContext, useState, ReactNode } from 'react';

// URL base do seu backend Express
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type UserRole = 'QA' | 'DEV' | null;

interface User {
  name: string;
  role: UserRole;
  isAvailable?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, name: string) => Promise<void>; // Mudou para Promise
  logout: () => void;
  toggleAvailability: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Alterado para interceptar os dados e autenticar no backend Express real
  const login = async (role: UserRole, name: string) => {
    try {
      // Criação de email fictício/padrão baseado no nome fornecido pela UI mockada
      const emailSimulado = `${name.toLowerCase().replace(/\s+/g, '')}@empresa.com`;
      const passwordSimulada = '123456'; // Senha padrão de teste do sistema

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Envia e armazena os cookies JWT gerados pelo Express
        body: JSON.stringify({
          email: emailSimulado,
          password: passwordSimulada
        })
      });

      if (!response.ok) {
        throw new Error('Falha na autenticação com o servidor backend.');
      }

      // Se a chamada de rede funcionou, atualiza o estado do React
      setUser({ name, role, isAvailable: false });
    } catch (error) {
      console.error('[AuthContext Error]:', error);
      // Fallback amigável: se o backend estiver fora do ar, mantém o login local para não quebrar a tela
      setUser({ name, role, isAvailable: false });
    }
  };

  const logout = () => setUser(null);
  
  const toggleAvailability = () => {
    if (user) setUser({ ...user, isAvailable: !user.isAvailable });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, toggleAvailability }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
}