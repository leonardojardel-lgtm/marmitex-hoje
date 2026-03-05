import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { LogOut, Menu, UtensilsCrossed, FileText, Settings, MessageSquare, Home } from 'lucide-react';

export function Layout() {
  const { perfil, logout, user } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const adminLinks = [
    { to: '/admin', icon: <Home size={20} />, label: 'Painel' },
    { to: '/admin/cardapio', icon: <UtensilsCrossed size={20} />, label: 'Cardápio' },
    { to: '/admin/relatorios', icon: <FileText size={20} />, label: 'Relatórios' },
    { to: '/admin/feedback', icon: <MessageSquare size={20} />, label: 'Feedback' },
    { to: '/admin/configuracoes', icon: <Settings size={20} />, label: 'Configurações' },
  ];

  return (
    <div className="min-h-screen bg-neutral flex flex-col">
      <header className="bg-primary text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(perfil === 'ADMIN' ? '/admin' : '/aluno')}>
            <span className="text-2xl">🍱</span>
            <h1 className="text-xl font-bold tracking-tight">Marmitex Hoje</h1>
          </div>
          
          {perfil && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-2">
                <span className="text-sm font-medium">
                  {user?.name || (perfil === 'ADMIN' ? 'Administrador' : 'Aluno')}
                </span>
                <span className="text-xs opacity-80 bg-white/20 px-2 py-0.5 rounded-full">
                  {perfil === 'ADMIN' ? 'Admin' : user?.turma || 'Aluno'}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </header>

      {perfil === 'ADMIN' && (
        <nav className="bg-white border-b border-border sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto hide-scrollbar">
            {adminLinks.map(link => (
              <button
                key={link.to}
                onClick={() => navigate(link.to)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  location.pathname === link.to 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-text-muted hover:text-text-primary hover:bg-neutral'
                }`}
              >
                {link.icon}
                {link.label}
              </button>
            ))}
          </div>
        </nav>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
