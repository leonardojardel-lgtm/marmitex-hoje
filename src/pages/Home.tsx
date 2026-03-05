import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../store/AppContext';
import { User, ShieldAlert, Eye, LogIn, UserPlus } from 'lucide-react';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { CardapioModal } from '../components/CardapioModal';
import { ShareButton } from '../components/ShareButton';
import { api } from '../services/api';

export function Home() {
  const { cardapios, setUser, setPerfil } = useAppContext();
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<'SELECT' | 'LOGIN_ALUNO' | 'REGISTER_ALUNO' | 'LOGIN_ADMIN'>('SELECT');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [turma, setTurma] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [visualizando, setVisualizando] = useState(false);

  const hoje = new Date();
  const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
  const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });

  const cardapioSemanal = cardapios.filter(c =>
    c.status === 'PUBLICADO' &&
    isWithinInterval(parseISO(c.data), { start: inicioSemana, end: fimSemana })
  ).sort((a, b) => a.data.localeCompare(b.data));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const { user } = await api.login(email, password);
      setUser(user);
      navigate(user.role === 'ADMIN' ? '/admin' : '/aluno');
    } catch (err: any) {
      setErro(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const { user } = await api.register(name, email, password, turma);
      setUser(user);
      navigate('/aluno');
    } catch (err: any) {
      setErro(err.message || 'Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = (isAdmin: boolean) => (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-md border-2 border-primary w-full max-w-md">
      <h2 className="text-2xl font-bold text-text-primary mb-4">
        {isAdmin ? 'Login Admin' : 'Login Aluno'}
      </h2>
      <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
        {erro && <p className="text-danger text-sm">{erro}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('SELECT');
              setErro('');
            }}
            className="flex-1 h-12 rounded-xl bg-neutral text-text-primary font-medium hover:bg-gray-200 transition-colors"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 h-12 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </form>
      {!isAdmin && (
        <p className="mt-4 text-sm text-text-muted">
          Não tem conta? <button onClick={() => setMode('REGISTER_ALUNO')} className="text-primary hover:underline">Cadastre-se</button>
        </p>
      )}
    </div>
  );

  const renderRegisterForm = () => (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-md border-2 border-primary w-full max-w-md">
      <h2 className="text-2xl font-bold text-text-primary mb-4">Cadastro Aluno</h2>
      <form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
        <input
          type="text"
          placeholder="Nome Completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
        <input
          type="text"
          placeholder="Turma (ex: 9A)"
          value={turma}
          onChange={(e) => setTurma(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-12 px-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
        {erro && <p className="text-danger text-sm">{erro}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN_ALUNO');
              setErro('');
            }}
            className="flex-1 h-12 rounded-xl bg-neutral text-text-primary font-medium hover:bg-gray-200 transition-colors"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 h-12 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="text-center mb-12">
        <span className="text-6xl mb-4 block">🍱</span>
        <h1 className="text-4xl font-bold text-text-primary tracking-tight mb-2">Marmitex Hoje</h1>
        <p className="text-text-muted text-lg">Selecione seu perfil para continuar</p>
      </div>

      {mode === 'SELECT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <button
            onClick={() => setMode('LOGIN_ALUNO')}
            className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-primary transition-all duration-200 group"
          >
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <User size={40} className="text-primary-dark" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Sou Aluno</h2>
            <p className="text-text-muted text-center mt-2">Fazer pedidos e avaliar refeições</p>
          </button>

          <button
            onClick={() => setMode('LOGIN_ADMIN')}
            className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-primary transition-all duration-200 group"
          >
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldAlert size={40} className="text-primary-dark" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Sou Admin</h2>
            <p className="text-text-muted text-center mt-2">Gerenciar cardápios e relatórios</p>
          </button>
        </div>
      )}

      {mode === 'LOGIN_ALUNO' && renderLoginForm(false)}
      {mode === 'LOGIN_ADMIN' && renderLoginForm(true)}
      {mode === 'REGISTER_ALUNO' && renderRegisterForm()}

      <button
        onClick={() => setVisualizando(true)}
        className="mt-12 flex items-center gap-2 text-primary font-medium hover:underline"
      >
        <Eye size={20} /> Visualizar Cardápio Semanal
      </button>

      <div className="mt-8">
        <ShareButton url={window.location.href} title="Cardápio da Semana" />
      </div>

      {visualizando && (
        <CardapioModal cardapios={cardapioSemanal} onClose={() => setVisualizando(false)} />
      )}
    </div>
  );
}
