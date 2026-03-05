import { CardapioDia, Pedido, Feedback, Configuracoes } from '../types';

const API_BASE = '/api';

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao fazer login');
    return res.json();
  },

  async register(name: string, email: string, password: string, turma: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, turma }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao registrar');
    return res.json();
  },

  async logout() {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`);
    if (!res.ok) return null;
    return res.json();
  },

  // Menus
  async getMenus() {
    const res = await fetch(`${API_BASE}/menus`);
    if (!res.ok) throw new Error('Erro ao buscar cardápios');
    return res.json();
  },

  async saveMenu(menu: CardapioDia) {
    const res = await fetch(`${API_BASE}/menus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menu),
    });
    if (!res.ok) throw new Error('Erro ao salvar cardápio');
    return res.json();
  },

  // Orders
  async getOrders() {
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) throw new Error('Erro ao buscar pedidos');
    return res.json();
  },

  async createOrder(order: Partial<Pedido>) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao criar pedido');
    return res.json();
  },

  async cancelOrder(id: string, motivo?: string, adminId?: string) {
    const res = await fetch(`${API_BASE}/orders/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo, adminId }),
    });
    if (!res.ok) throw new Error('Erro ao cancelar pedido');
    return res.json();
  },

  // Feedbacks
  async getFeedbacks() {
    const res = await fetch(`${API_BASE}/feedbacks`);
    if (!res.ok) throw new Error('Erro ao buscar feedbacks');
    return res.json();
  },

  async sendFeedback(feedback: Partial<Feedback>) {
    const res = await fetch(`${API_BASE}/feedbacks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });
    if (!res.ok) throw new Error('Erro ao enviar feedback');
    return res.json();
  }
};
