import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Save, Trash2, Clock, Shield, History, AlertTriangle } from 'lucide-react';

export function AdminConfiguracoes() {
  const { configuracoes, salvarConfiguracoes, adminLogs } = useAppContext();
  
  const [horarioCorte, setHorarioCorte] = useState(configuracoes.horarioCorte);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagemConfig, setMensagemConfig] = useState('');
  const [mensagemSenha, setMensagemSenha] = useState('');

  const handleSalvarConfig = (e: React.FormEvent) => {
    e.preventDefault();
    salvarConfiguracoes({ ...configuracoes, horarioCorte });
    setMensagemConfig('Configurações salvas com sucesso!');
    setTimeout(() => setMensagemConfig(''), 3000);
  };

  const handleAlterarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (senhaAtual !== '1234') { // Mocking current password check
      setMensagemSenha('Senha atual incorreta.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setMensagemSenha('As novas senhas não coincidem.');
      return;
    }
    if (novaSenha.length < 4) {
      setMensagemSenha('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }
    
    // In a real app, we'd save the new password here.
    setMensagemSenha('Senha alterada com sucesso! (Mock)');
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
    setTimeout(() => setMensagemSenha(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-text-primary">Configurações</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configurações Gerais */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
          <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
            <Clock size={20} className="text-primary" /> Horários e Sistema
          </h3>
          
          <form onSubmit={handleSalvarConfig} className="space-y-4">
            {mensagemConfig && (
              <div className="bg-success/10 text-success p-3 rounded-xl text-sm font-medium">
                {mensagemConfig}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Horário Limite para Pedidos</label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={horarioCorte}
                  onChange={e => setHorarioCorte(e.target.value)}
                  className="flex-1 h-12 px-4 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none"
                  required
                />
                <button
                  type="submit"
                  className="h-12 px-6 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Save size={18} /> Salvar
                </button>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Após este horário, alunos não poderão fazer, editar ou cancelar pedidos.
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <label className="text-sm font-medium text-text-primary">Fuso Horário do Sistema</label>
              <div className="h-12 px-4 rounded-xl border border-border bg-neutral flex items-center text-text-muted mt-2 cursor-not-allowed">
                {configuracoes.fuso} (Fixo)
              </div>
              <p className="text-xs text-text-muted mt-1">
                Todos os cálculos de horário utilizam o fuso horário de São Paulo.
              </p>
            </div>
          </form>
        </div>

        {/* Segurança */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
          <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
            <Shield size={20} className="text-primary" /> Segurança
          </h3>
          
          <form onSubmit={handleAlterarSenha} className="space-y-4">
            {mensagemSenha && (
              <div className={`p-3 rounded-xl text-sm font-medium ${mensagemSenha.includes('sucesso') ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                {mensagemSenha}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-primary">Senha Atual</label>
              <input
                type="password"
                value={senhaAtual}
                onChange={e => setSenhaAtual(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-primary">Nova Senha</label>
              <input
                type="password"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-primary">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full h-12 bg-neutral text-text-primary font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} /> Alterar Senha
            </button>
          </form>
        </div>
      </div>

      {/* Log de Ações */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
        <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
          <History size={20} className="text-primary" /> Log de Ações Administrativas
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral text-text-muted font-medium border-b border-border">
              <tr>
                <th className="px-4 py-3">Data/Hora</th>
                <th className="px-4 py-3">Ação</th>
                <th className="px-4 py-3">ID Pedido</th>
                <th className="px-4 py-3">Motivo (Após Corte)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {adminLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-text-muted">
                    Nenhuma ação registrada.
                  </td>
                </tr>
              ) : (
                adminLogs.slice().reverse().slice(0, 50).map(log => (
                  <tr key={log.id} className="hover:bg-neutral/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {format(parseISO(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        log.acao === 'CRIAR' ? 'bg-success/10 text-success' :
                        log.acao === 'EDITAR' ? 'bg-blue-100 text-blue-700' :
                        'bg-danger/10 text-danger'
                      }`}>
                        {log.acao}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted truncate max-w-[150px]" title={log.pedidoId}>
                      {log.pedidoId.split('-')[0]}...
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      {log.aposHorarioCorte ? (
                        <span className="flex items-center gap-1">
                          <AlertTriangle size={14} className="text-warning" /> {log.motivo}
                        </span>
                      ) : (
                        <span className="text-text-muted italic">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
