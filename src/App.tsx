import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './store/AppContext';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { AlunoPedido } from './pages/aluno/AlunoPedido';
import { AlunoFeedback } from './pages/aluno/AlunoFeedback';
import { AdminPainel } from './pages/admin/AdminPainel';
import { AdminCardapio } from './pages/admin/AdminCardapio';
import { AdminRelatorios } from './pages/admin/AdminRelatorios';
import { AdminFeedback } from './pages/admin/AdminFeedback';
import { AdminConfiguracoes } from './pages/admin/AdminConfiguracoes';

function ProtectedRoute({ children, allowedPerfil }: { children: React.ReactNode, allowedPerfil: 'ADMIN' | 'ALUNO' }) {
  const { perfil } = useAppContext();
  
  if (!perfil) {
    return <Navigate to="/" replace />;
  }
  
  if (perfil !== allowedPerfil) {
    return <Navigate to={perfil === 'ADMIN' ? '/admin' : '/aluno'} replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            
            {/* Rotas Aluno */}
            <Route path="aluno" element={
              <ProtectedRoute allowedPerfil="ALUNO">
                <AlunoPedido />
              </ProtectedRoute>
            } />
            <Route path="aluno/feedback" element={
              <ProtectedRoute allowedPerfil="ALUNO">
                <AlunoFeedback />
              </ProtectedRoute>
            } />
            
            {/* Rotas Admin */}
            <Route path="admin" element={
              <ProtectedRoute allowedPerfil="ADMIN">
                <AdminPainel />
              </ProtectedRoute>
            } />
            <Route path="admin/cardapio" element={
              <ProtectedRoute allowedPerfil="ADMIN">
                <AdminCardapio />
              </ProtectedRoute>
            } />
            <Route path="admin/relatorios" element={
              <ProtectedRoute allowedPerfil="ADMIN">
                <AdminRelatorios />
              </ProtectedRoute>
            } />
            <Route path="admin/feedback" element={
              <ProtectedRoute allowedPerfil="ADMIN">
                <AdminFeedback />
              </ProtectedRoute>
            } />
            <Route path="admin/configuracoes" element={
              <ProtectedRoute allowedPerfil="ADMIN">
                <AdminConfiguracoes />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

