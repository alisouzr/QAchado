// context/AuthContext.tsx
"use client"
import { createContext, useContext, useState, ReactNode } from 'react';

type UserRole = 'QA' | 'DEV' | null;

interface User {
  name: string;
  role: UserRole;
  isAvailable?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, name: string) => void;
  logout: () => void;
  toggleAvailability: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (role: UserRole, name: string) => setUser({ name, role, isAvailable: false });
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