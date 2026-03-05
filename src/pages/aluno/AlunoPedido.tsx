import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { useHorario } from '../../hooks/useHorario';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, AlertCircle, CheckCircle2, Edit2, XCircle, Star, UtensilsCrossed, Calendar, FileText, Eye } from 'lucide-react';
import { TipoRefeicao } from '../../types';
import { CardapioModal } from '../../components/CardapioModal';
import { ShareButton } from '../../components/ShareButton';

export function AlunoPedido() {
  const { configuracoes, cardapios, pedidos, salvarPedido, cancelarPedido, user } = useAppContext();
  const { getAgoraSP, isAposCorte } = useHorario();
  const navigate = useNavigate();

  const agora = getAgoraSP();
  const dataAlvo = addDays(agora, 1);
  const dataAlvoStr = format(dataAlvo, 'yyyy-MM-dd');
  const horaAtual = format(agora, 'HH:mm');
  const aposCorte = isAposCorte(configuracoes.horarioCorte);

  const cardapioAlvo = cardapios.find(c => c.data === dataAlvoStr);
  const isPublicado = cardapioAlvo?.status === 'PUBLICADO';

  // Get weekly menu if after cutoff
  const inicioSemana = startOfWeek(agora, { weekStartsOn: 1 }); // Monday
  const fimSemana = endOfWeek(agora, { weekStartsOn: 1 }); // Sunday
  
  const cardapioSemanal = cardapios.filter(c => 
    c.status === 'PUBLICADO' && 
    isWithinInterval(parseISO(c.data), { start: inicioSemana, end: fimSemana })
  ).sort((a, b) => a.data.localeCompare(b.data));

  // Find if user already has an active order for tomorrow
  // In the real DB version, 'pedidos' should already be filtered for the user by the backend/context
  const meuPedido = pedidos.find(p => p.data === dataAlvoStr && p.status !== 'CANCELADO');
  const mostrarSemanal = aposCorte || !!meuPedido;
  
  // Find PDF for the week
  const pdfSemanal = cardapioSemanal.find(c => c.pdfUrl)?.pdfUrl;

  const [numeroTicket, setNumeroTicket] = useState(meuPedido?.numeroTicket || '');
  const [tipo, setTipo] = useState<TipoRefeicao>(meuPedido?.tipo || 'REGULAR');
  const [opcaoId, setOpcaoId] = useState(meuPedido?.opcaoId || '');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [visualizando, setVisualizando] = useState(false);

  useEffect(() => {
    if (cardapioAlvo && isPublicado) {
      const opcoesFiltradas = cardapioAlvo.opcoes.filter(o => o.tipo === tipo);
      if (opcoesFiltradas.length > 0 && !opcoesFiltradas.find(o => o.id === opcaoId)) {
        setOpcaoId(opcoesFiltradas[0].id);
      }
    }
  }, [tipo, cardapioAlvo, isPublicado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    
    if (aposCorte) {
      setErro(`Pedidos encerrados para amanhã. Horário limite: ${configuracoes.horarioCorte}.`);
      return;
    }
    if (!isPublicado) {
      setErro('Cardápio de amanhã ainda não foi publicado.');
      return;
    }
    if (numeroTicket.trim().length === 0) {
      setErro('Número do ticket é obrigatório.');
      return;
    }
    if (!opcaoId) {
      setErro('Selecione um prato.');
      return;
    }

    const opcaoSelecionada = cardapioAlvo?.opcoes.find(o => o.id === opcaoId);
    if (!opcaoSelecionada) return;

    setLoading(true);
    try {
      await salvarPedido({
        data: dataAlvoStr,
        numeroTicket: numeroTicket.trim(),
        tipo,
        opcaoId,
        opcaoNome: opcaoSelecionada.nomePrato,
        status: 'ATIVO',
        criadoPor: 'ALUNO',
      });
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (aposCorte) {
      setErro(`Não é possível cancelar pedidos após o horário limite (${configuracoes.horarioCorte}).`);
      return;
    }
    if (meuPedido?.id) {
      setLoading(true);
      try {
        await cancelarPedido(meuPedido.id);
      } catch (err: any) {
        setErro(err.message || 'Erro ao cancelar pedido');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Bloco A - Status */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            {format(agora, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-2 text-text-muted mt-1">
            <Clock size={18} />
            <span>Hora atual: {horaAtual} (SP)</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`px-4 py-2 rounded-full font-medium flex items-center gap-2 ${aposCorte ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
            {aposCorte ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
            {aposCorte ? 'Pedidos Encerrados' : 'Pedidos Abertos'}
          </div>
          <ShareButton url={window.location.href} title="Cardápio da Semana" />
        </div>
      </div>

      {!isPublicado && !aposCorte && (
        <div className="bg-danger/10 border-l-4 border-danger p-4 rounded-r-xl flex items-start gap-3">
          <AlertCircle className="text-danger shrink-0 mt-0.5" />
          <p className="text-danger font-medium">Cardápio de amanhã ainda não foi publicado.</p>
        </div>
      )}

      {aposCorte && (
        <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-r-xl flex items-start gap-3">
          <AlertCircle className="text-warning shrink-0 mt-0.5" />
          <p className="text-warning font-medium">Pedidos encerrados para amanhã. Horário limite: {configuracoes.horarioCorte}.</p>
        </div>
      )}

      {/* Bloco C - Pedido Existente */}
      {meuPedido && meuPedido.status === 'ATIVO' ? (
        <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-primary">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <CheckCircle2 className="text-success" /> Seu Pedido Confirmado para Amanhã
            </h3>
            <span className="text-sm text-text-muted">Feito às {meuPedido.hora}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6 bg-neutral p-4 rounded-xl">
            <div>
              <p className="text-sm text-text-muted">Nome</p>
              <p className="font-medium text-text-primary">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Turma</p>
              <p className="font-medium text-text-primary">{user?.turma}</p>
            </div>
            {meuPedido.numeroTicket && (
              <div className="col-span-2">
                <p className="text-sm text-text-muted">Nº do Ticket</p>
                <p className="font-medium text-text-primary">{meuPedido.numeroTicket}</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-sm text-text-muted">Prato ({meuPedido.tipo})</p>
              <p className="font-medium text-text-primary">{meuPedido.opcaoNome}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!aposCorte ? (
              <button 
                onClick={handleCancelar}
                disabled={loading}
                className="flex-1 min-h-[48px] flex items-center justify-center gap-2 bg-danger/10 text-danger font-medium rounded-xl hover:bg-danger/20 transition-colors disabled:opacity-50"
              >
                <XCircle size={20} /> {loading ? 'Cancelando...' : 'Cancelar Pedido'}
              </button>
            ) : (
              <button 
                onClick={() => navigate('/aluno/feedback')}
                className="w-full min-h-[48px] flex items-center justify-center gap-2 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors shadow-sm"
              >
                <Star size={20} /> Avaliar Refeição
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Bloco B - Formulário */
        !aposCorte && isPublicado && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-md border border-border space-y-6">
            <h3 className="text-xl font-bold text-text-primary">Fazer Pedido para Amanhã</h3>
            
            {erro && (
              <div className="bg-danger/10 text-danger p-3 rounded-xl text-sm font-medium">
                {erro}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Nome</label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="w-full h-12 px-4 rounded-xl border border-border bg-neutral text-text-muted cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Turma</label>
                <input
                  type="text"
                  value={user?.turma || ''}
                  disabled
                  className="w-full h-12 px-4 rounded-xl border border-border bg-neutral text-text-muted cursor-not-allowed"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-text-primary">Número do Ticket *</label>
                <input
                  type="text"
                  value={numeroTicket}
                  onChange={e => setNumeroTicket(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Ex: 12345"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-text-primary">Tipo de Refeição *</label>
              <div className="grid grid-cols-2 gap-4">
                {(['REGULAR', 'VEGETARIANO'] as TipoRefeicao[]).map(t => (
                  <label 
                    key={t}
                    className={`flex items-center justify-center gap-2 h-14 rounded-xl border-2 cursor-pointer transition-all ${tipo === t ? 'border-primary bg-secondary/30 text-primary-dark font-bold' : 'border-border text-text-muted hover:border-primary/50'}`}
                  >
                    <input 
                      type="radio" 
                      name="tipo" 
                      value={t} 
                      checked={tipo === t} 
                      onChange={() => setTipo(t)} 
                      className="hidden"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${tipo === t ? 'border-primary' : 'border-text-muted'}`}>
                      {tipo === t && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    {t === 'REGULAR' ? 'Regular' : 'Vegetariano'}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">Prato *</label>
              <select
                value={opcaoId}
                onChange={e => setOpcaoId(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                required
              >
                <option value="" disabled>Selecione um prato...</option>
                {cardapioAlvo?.opcoes.filter(o => o.tipo === tipo).map(opcao => (
                  <option key={opcao.id} value={opcao.id}>
                    {opcao.nomePrato}
                  </option>
                ))}
              </select>
              
              {/* Prato Details */}
              {opcaoId && cardapioAlvo?.opcoes.find(o => o.id === opcaoId) && (
                <div className="mt-3 p-4 bg-neutral rounded-xl text-sm">
                  <p className="text-text-muted mb-1">
                    {cardapioAlvo.opcoes.find(o => o.id === opcaoId)?.descricao}
                  </p>
                  {cardapioAlvo.opcoes.find(o => o.id === opcaoId)?.alergenos && (
                    <span className="inline-block px-2 py-1 bg-warning/20 text-warning-dark rounded text-xs font-medium mt-2">
                      Alérgenos: {cardapioAlvo.opcoes.find(o => o.id === opcaoId)?.alergenos}
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary text-white font-bold text-lg rounded-xl hover:bg-primary-dark transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : <>Enviar Pedido <CheckCircle2 size={24} /></>}
            </button>
          </form>
        )
      )}

      {/* Bloco D - Cardápio do Dia ou Semanal */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          {mostrarSemanal ? <Calendar className="text-primary" /> : <UtensilsCrossed className="text-primary" />}
          {mostrarSemanal ? 'Cardápio da Semana' : 'Cardápio de Amanhã'}
          
          <div className="ml-auto flex items-center gap-2">
            {pdfSemanal && (
              <button 
                onClick={() => window.open(pdfSemanal, '_blank')}
                className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
              >
                <FileText size={18} /> Ver PDF
              </button>
            )}
            <button 
              onClick={() => setVisualizando(true)}
              className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
            >
              <Eye size={18} /> Ver Completo
            </button>
          </div>
        </h3>
        
        {!mostrarSemanal ? (
          // Mostrar apenas o cardápio de amanhã se não passou do horário de corte e não tem pedido
          isPublicado && cardapioAlvo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cardapioAlvo.opcoes.map(opcao => (
                <div key={opcao.id} className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors">
                  {opcao.imageUrl && (
                    <img src={opcao.imageUrl} alt={opcao.nomePrato} className="w-full h-40 object-cover rounded-lg mb-3" referrerPolicy="no-referrer" />
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-text-primary">{opcao.nomePrato}</h4>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${opcao.tipo === 'REGULAR' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {opcao.tipo}
                    </span>
                  </div>
                  {opcao.descricao && <p className="text-sm text-text-muted mb-3">{opcao.descricao}</p>}
                  {opcao.alergenos && (
                    <span className="text-xs font-medium bg-warning/10 text-warning px-2 py-1 rounded">
                      Alérgenos: {opcao.alergenos}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-center py-8">Nenhum cardápio disponível para amanhã.</p>
          )
        ) : (
          // Mostrar o cardápio semanal se passou do horário de corte ou já fez pedido
          cardapioSemanal.length > 0 ? (
            <div className="space-y-6">
              {cardapioSemanal.map(dia => (
                <div key={dia.id} className="border border-border rounded-xl overflow-hidden">
                  <div className="bg-neutral px-4 py-3 border-b border-border flex justify-between items-center">
                    <h4 className="font-bold text-text-primary capitalize">{dia.diaSemana}</h4>
                    <span className="text-sm text-text-muted">{format(parseISO(dia.data), 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dia.opcoes.map(opcao => (
                      <div key={opcao.id} className="flex gap-4">
                        {opcao.imageUrl && (
                          <img src={opcao.imageUrl} alt={opcao.nomePrato} className="w-20 h-20 object-cover rounded-lg shrink-0" referrerPolicy="no-referrer" />
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${opcao.tipo === 'REGULAR' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                              {opcao.tipo.substring(0, 3)}
                            </span>
                            <h5 className="font-bold text-text-primary text-sm">{opcao.nomePrato}</h5>
                          </div>
                          {opcao.descricao && <p className="text-xs text-text-muted line-clamp-2 mb-1">{opcao.descricao}</p>}
                          {opcao.alergenos && (
                            <span className="text-[10px] font-medium text-warning">
                              Alérgenos: {opcao.alergenos}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-center py-8">Nenhum cardápio publicado para esta semana.</p>
          )
        )}
      </div>
      {visualizando && (
        <CardapioModal cardapios={cardapioSemanal} onClose={() => setVisualizando(false)} />
      )}
    </div>
  );
}


