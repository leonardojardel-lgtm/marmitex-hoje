import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../store/AppContext';
import { useHorario } from '../../hooks/useHorario';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter, Plus, Edit2, XCircle, Users, Utensils, Leaf, AlertCircle, Zap } from 'lucide-react';
import { TipoRefeicao, StatusPedido } from '../../types';

export function AdminPainel() {
  const { pedidos, cardapios, configuracoes, salvarPedido, cancelarPedido, salvarCardapio } = useAppContext();
  const { getAgoraSP, isAposCorte } = useHorario();
  const agora = getAgoraSP();
  const hojeStr = format(agora, 'yyyy-MM-dd');
  const aposCorte = isAposCorte(configuracoes.horarioCorte);

  const [dataFiltro, setDataFiltro] = useState(hojeStr);
  const [turmaFiltro, setTurmaFiltro] = useState('Todas');
  const [tipoFiltro, setTipoFiltro] = useState<TipoRefeicao | 'Todos'>('Todos');
  const [statusFiltro, setStatusFiltro] = useState<StatusPedido | 'Todos'>('ATIVO');
  const [busca, setBusca] = useState('');

  // Modal states
  const [modalAberto, setModalAberto] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState<any>(null);
  const [motivoAdmin, setMotivoAdmin] = useState('');
  const [erroModal, setErroModal] = useState('');

  // Ações Rápidas
  const handleAcaoRapida = (status: 'PUBLICADO' | 'VAZIO') => {
    const inicioSemana = startOfWeek(agora, { weekStartsOn: 1 });
    const fimSemana = endOfWeek(agora, { weekStartsOn: 1 });
    
    cardapios.forEach(c => {
      if (isWithinInterval(parseISO(c.data), { start: inicioSemana, end: fimSemana })) {
        salvarCardapio({ ...c, status });
      }
    });
    alert(`Cardápios da semana atual foram definidos como ${status === 'PUBLICADO' ? 'Publicados' : 'Vazios'}.`);
  };

  // Derived data
  const turmasUnicas = useMemo(() => {
    const turmas = new Set(pedidos.map(p => p.turma));
    return Array.from(turmas).sort();
  }, [pedidos]);

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(p => {
      const matchData = p.data === dataFiltro;
      const matchTurma = turmaFiltro === 'Todas' || p.turma === turmaFiltro;
      const matchTipo = tipoFiltro === 'Todos' || p.tipo === tipoFiltro;
      const matchStatus = statusFiltro === 'Todos' || p.status === statusFiltro;
      const matchBusca = p.nomeSolicitante.toLowerCase().includes(busca.toLowerCase());
      return matchData && matchTurma && matchTipo && matchStatus && matchBusca;
    }).sort((a, b) => a.turma.localeCompare(b.turma) || a.nomeSolicitante.localeCompare(b.nomeSolicitante));
  }, [pedidos, dataFiltro, turmaFiltro, tipoFiltro, statusFiltro, busca]);

  const totais = useMemo(() => {
    const ativos = pedidosFiltrados.filter(p => p.status === 'ATIVO');
    return {
      geral: ativos.length,
      regular: ativos.filter(p => p.tipo === 'REGULAR').length,
      vegetariano: ativos.filter(p => p.tipo === 'VEGETARIANO').length,
    };
  }, [pedidosFiltrados]);

  const limparFiltros = () => {
    setDataFiltro(hojeStr);
    setTurmaFiltro('Todas');
    setTipoFiltro('Todos');
    setStatusFiltro('ATIVO');
    setBusca('');
  };

  const handleAbrirModal = (pedido?: any) => {
    setPedidoEditando(pedido || {
      nomeSolicitante: '',
      turma: '',
      numeroTicket: '',
      tipo: 'REGULAR',
      opcaoId: '',
      data: dataFiltro,
    });
    setMotivoAdmin('');
    setErroModal('');
    setModalAberto(true);
  };

  const handleSalvarPedido = (e: React.FormEvent) => {
    e.preventDefault();
    if (aposCorte && !motivoAdmin) {
      setErroModal('Motivo é obrigatório após o horário de corte.');
      return;
    }
    if (!pedidoEditando.numeroTicket || pedidoEditando.numeroTicket.trim().length === 0) {
      setErroModal('Número do ticket é obrigatório.');
      return;
    }

    const cardapioDia = cardapios.find(c => c.data === pedidoEditando.data);
    if (!cardapioDia || cardapioDia.status !== 'PUBLICADO') {
      setErroModal('Cardápio não publicado para esta data.');
      return;
    }

    const opcao = cardapioDia.opcoes.find(o => o.tipo === pedidoEditando.tipo);
    if (!opcao) {
      setErroModal('Opção não encontrada no cardápio.');
      return;
    }

    salvarPedido({
      ...pedidoEditando,
      numeroTicket: pedidoEditando.numeroTicket?.trim() || undefined,
      opcaoId: opcao.id,
      opcaoNome: opcao.nomePrato,
      hora: format(agora, 'HH:mm'),
      status: 'ATIVO',
      criadoPor: 'ADMIN',
      motivoAdmin: aposCorte ? motivoAdmin : undefined,
    });
    setModalAberto(false);
  };

  const handleCancelarPedido = (id: string) => {
    if (aposCorte) {
      const motivo = prompt('Motivo do cancelamento (obrigatório após horário de corte):');
      if (!motivo) return;
      cancelarPedido(id, 'admin', motivo, true);
    } else {
      if (confirm('Deseja realmente cancelar este pedido?')) {
        cancelarPedido(id);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-text-primary">Painel de Pedidos</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleAcaoRapida('PUBLICADO')}
            className="h-12 px-6 bg-success text-white font-medium rounded-xl hover:bg-success-dark transition-colors flex items-center gap-2 shadow-sm"
          >
            <Zap size={20} /> Publicar Semana
          </button>
          <button
            onClick={() => handleAcaoRapida('VAZIO')}
            className="h-12 px-6 bg-danger text-white font-medium rounded-xl hover:bg-danger-dark transition-colors flex items-center gap-2 shadow-sm"
          >
            <XCircle size={20} /> Limpar Semana
          </button>
          <button
            onClick={() => handleAbrirModal()}
            className="h-12 px-6 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={20} /> Criar Pedido Manual
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">Data</label>
          <input
            type="date"
            value={dataFiltro}
            onChange={e => setDataFiltro(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">Turma</label>
          <select
            value={turmaFiltro}
            onChange={e => setTurmaFiltro(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border focus:ring-2 focus:ring-primary outline-none text-sm bg-white"
          >
            <option value="Todas">Todas</option>
            {turmasUnicas.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">Tipo</label>
          <select
            value={tipoFiltro}
            onChange={e => setTipoFiltro(e.target.value as any)}
            className="w-full h-10 px-3 rounded-lg border border-border focus:ring-2 focus:ring-primary outline-none text-sm bg-white"
          >
            <option value="Todos">Todos</option>
            <option value="REGULAR">Regular</option>
            <option value="VEGETARIANO">Vegetariano</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">Status</label>
          <select
            value={statusFiltro}
            onChange={e => setStatusFiltro(e.target.value as any)}
            className="w-full h-10 px-3 rounded-lg border border-border focus:ring-2 focus:ring-primary outline-none text-sm bg-white"
          >
            <option value="Todos">Todos</option>
            <option value="ATIVO">Ativos</option>
            <option value="CANCELADO">Cancelados</option>
          </select>
        </div>
        <button
          onClick={limparFiltros}
          className="h-10 px-4 bg-neutral text-text-primary font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Filter size={16} /> Limpar Filtros
        </button>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-text-muted">Total Geral</p>
            <p className="text-2xl font-bold text-text-primary">{totais.geral}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <Utensils size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-text-muted">Regulares</p>
            <p className="text-2xl font-bold text-text-primary">{totais.regular}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <Leaf size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-text-muted">Vegetarianos</p>
            <p className="text-2xl font-bold text-text-primary">{totais.vegetariano}</p>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome do aluno..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral text-text-muted font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Turma</th>
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Prato</th>
                <th className="px-6 py-4">Hora</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-text-muted">
                    Nenhum pedido encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map(pedido => (
                  <tr key={pedido.id} className="hover:bg-neutral/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-text-primary">{pedido.nomeSolicitante}</td>
                    <td className="px-6 py-4">{pedido.turma}</td>
                    <td className="px-6 py-4">{pedido.numeroTicket || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${pedido.tipo === 'REGULAR' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {pedido.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 truncate max-w-[200px]" title={pedido.opcaoNome}>{pedido.opcaoNome}</td>
                    <td className="px-6 py-4">{pedido.hora}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${pedido.status === 'ATIVO' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        {pedido.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {pedido.status === 'ATIVO' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleAbrirModal(pedido)} className="p-2 text-text-muted hover:text-primary transition-colors" title="Editar">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleCancelarPedido(pedido.id)} className="p-2 text-text-muted hover:text-danger transition-colors" title="Cancelar">
                            <XCircle size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar/Editar */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-xl font-bold text-text-primary">
                {pedidoEditando.id ? 'Editar Pedido' : 'Criar Pedido Manual'}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-text-muted hover:text-text-primary">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSalvarPedido} className="p-6 space-y-4">
              {erroModal && (
                <div className="bg-danger/10 text-danger p-3 rounded-xl text-sm font-medium">
                  {erroModal}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-primary">Data</label>
                  <input
                    type="date"
                    value={pedidoEditando.data}
                    onChange={e => setPedidoEditando({...pedidoEditando, data: e.target.value})}
                    className="w-full h-12 px-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-primary">Turma</label>
                  <input
                    type="text"
                    value={pedidoEditando.turma}
                    onChange={e => setPedidoEditando({...pedidoEditando, turma: e.target.value})}
                    className="w-full h-12 px-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-primary">Nome do Aluno</label>
                  <input
                    type="text"
                    value={pedidoEditando.nomeSolicitante}
                    onChange={e => setPedidoEditando({...pedidoEditando, nomeSolicitante: e.target.value})}
                    className="w-full h-12 px-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-text-primary">Nº do Ticket *</label>
                  <input
                    type="text"
                    value={pedidoEditando.numeroTicket || ''}
                    onChange={e => setPedidoEditando({...pedidoEditando, numeroTicket: e.target.value})}
                    className="w-full h-12 px-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ex: 12345"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">Tipo</label>
                <select
                  value={pedidoEditando.tipo}
                  onChange={e => setPedidoEditando({...pedidoEditando, tipo: e.target.value})}
                  className="w-full h-12 px-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none bg-white"
                  required
                >
                  <option value="REGULAR">Regular</option>
                  <option value="VEGETARIANO">Vegetariano</option>
                </select>
              </div>

              {aposCorte && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-danger flex items-center gap-1">
                    <AlertCircle size={16} /> Motivo (Após Horário Limite) *
                  </label>
                  <input
                    type="text"
                    value={motivoAdmin}
                    onChange={e => setMotivoAdmin(e.target.value)}
                    className="w-full h-12 px-3 rounded-xl border border-danger focus:ring-2 focus:ring-danger outline-none"
                    placeholder="Ex: Aluno chegou atrasado"
                    required
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 h-12 bg-neutral text-text-primary font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
