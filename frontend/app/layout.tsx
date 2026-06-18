import './globals.css'
import { AuthProvider } from '@/app/context/AuthContext'
import MainLayout from '@/app/components/MainLayout'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-black">
        <AuthProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </AuthProvider>
      </body>
    </html>
  )
}