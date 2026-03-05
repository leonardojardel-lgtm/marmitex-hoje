import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  PerfilUsuario,
  CardapioDia,
  Pedido,
  AdminLog,
  Feedback,
  Configuracoes
} from '../types';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: PerfilUsuario;
  turma?: string;
}

interface AppState {
  user: User | null;
  perfil: PerfilUsuario | null;
  configuracoes: Configuracoes;
  cardapios: CardapioDia[];
  pedidos: Pedido[];
  feedbacks: Feedback[];
  adminLogs: AdminLog[];
  loading: boolean;
}

interface AppContextType extends AppState {
  setPerfil: (perfil: PerfilUsuario | null) => void;
  setUser: (user: User | null) => void;
  salvarConfiguracoes: (config: Configuracoes) => void;
  salvarCardapio: (cardapio: CardapioDia) => Promise<void>;
  salvarPedido: (pedido: Partial<Pedido>) => Promise<void>;
  cancelarPedido: (id: string, adminId?: string, motivo?: string, aposHorarioCorte?: boolean) => Promise<void>;
  salvarFeedback: (feedback: Omit<Feedback, 'id' | 'criadoEm'>) => Promise<void>;
  refreshData: () => Promise<void>;
  logout: () => Promise<void>;
}

const defaultState: AppState = {
  user: null,
  perfil: null,
  configuracoes: { horarioCorte: '14:15', fuso: 'America/Sao_Paulo' },
  cardapios: [],
  pedidos: [],
  feedbacks: [],
  adminLogs: [],
  loading: true
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);

  const refreshData = async () => {
    try {
      const [menus, orders, feedbacks] = await Promise.all([
        api.getMenus(),
        state.user ? api.getOrders() : Promise.resolve([]),
        state.user ? api.getFeedbacks() : Promise.resolve([])
      ]);

      setState(s => ({
        ...s,
        cardapios: menus,
        pedidos: orders,
        feedbacks: feedbacks,
        loading: false
      }));
    } catch (error) {
      console.error('Error refreshing data:', error);
      setState(s => ({ ...s, loading: false }));
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { user } = await api.getMe();
        if (user) {
          setState(s => ({ ...s, user, perfil: user.role }));
        }
      } catch (error) {
        // Not authenticated
      } finally {
        // Load public data (menus) regardless of auth
        const menus = await api.getMenus().catch(() => []);
        setState(s => ({ ...s, cardapios: menus, loading: false }));
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (state.user) {
      refreshData();
    }
  }, [state.user]);

  const setPerfil = (perfil: PerfilUsuario | null) => setState(s => ({ ...s, perfil }));
  const setUser = (user: User | null) => setState(s => ({ ...s, user, perfil: user?.role || null }));

  const salvarConfiguracoes = (config: Configuracoes) => setState(s => ({ ...s, configuracoes: config }));

  const salvarCardapio = async (cardapio: CardapioDia) => {
    await api.saveMenu(cardapio);
    await refreshData();
  };

  const salvarPedido = async (pedido: Partial<Pedido>) => {
    await api.createOrder(pedido);
    await refreshData();
  };

  const cancelarPedido = async (id: string, adminId?: string, motivo?: string) => {
    await api.cancelOrder(id, motivo, adminId);
    await refreshData();
  };

  const salvarFeedback = async (feedback: Omit<Feedback, 'id' | 'criadoEm'>) => {
    await api.sendFeedback(feedback);
    await refreshData();
  };

  const logout = async () => {
    await api.logout();
    setState({ ...defaultState, loading: false, cardapios: state.cardapios }); // Keep menus
  };

  return (
    <AppContext.Provider value={{
      ...state,
      setPerfil,
      setUser,
      salvarConfiguracoes,
      salvarCardapio,
      salvarPedido,
      cancelarPedido,
      salvarFeedback,
      refreshData,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

