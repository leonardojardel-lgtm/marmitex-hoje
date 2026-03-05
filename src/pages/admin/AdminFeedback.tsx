import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../store/AppContext';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Star, Trophy, MessageSquare, TrendingUp, Sparkles, Utensils } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { summarizeFeedbacks } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';

export function AdminFeedback() {
  const { feedbacks } = useAppContext();
  const hoje = new Date();
  const [dataInicio, setDataInicio] = useState(format(startOfWeek(hoje, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfWeek(hoje, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [resumoAI, setResumoAI] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const feedbacksFiltrados = useMemo(() => {
    return feedbacks.filter(f => {
      const dataF = parseISO(f.data);
      const inicio = parseISO(dataInicio);
      const fim = parseISO(dataFim);
      return isWithinInterval(dataF, { start: inicio, end: fim });
    });
  }, [feedbacks, dataInicio, dataFim]);

  const handleResumir = async () => {
    if (feedbacksFiltrados.length === 0) return;
    setLoadingAI(true);
    try {
      const resumo = await summarizeFeedbacks(feedbacksFiltrados);
      setResumoAI(resumo);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar resumo.');
    } finally {
      setLoadingAI(false);
    }
  };

  const metricas = useMemo(() => {
    const total = feedbacksFiltrados.length;
    const mediaGeral = total > 0 ? (feedbacksFiltrados.reduce((acc, f) => acc + f.nota, 0) / total).toFixed(1) : '0.0';

    const porPrato = feedbacksFiltrados.reduce((acc, f) => {
      if (!acc[f.opcaoNome]) {
        acc[f.opcaoNome] = { nome: f.opcaoNome, soma: 0, qtd: 0, notas: [0,0,0,0,0], comentarios: [] };
      }
      acc[f.opcaoNome].soma += f.nota;
      acc[f.opcaoNome].qtd += 1;
      acc[f.opcaoNome].notas[f.nota - 1] += 1;
      if (f.comentario && f.comentario.trim() !== '') {
        acc[f.opcaoNome].comentarios.push(f.comentario);
      }
      return acc;
    }, {} as Record<string, { nome: string, soma: number, qtd: number, notas: number[], comentarios: string[] }>);

    const ranking = (Object.values(porPrato) as { nome: string, soma: number, qtd: number, notas: number[], comentarios: string[] }[]).map(p => ({
      ...p,
      media: (p.soma / p.qtd).toFixed(1)
    })).sort((a, b) => parseFloat(b.media) - parseFloat(a.media));

    const favorito = ranking.length > 0 ? ranking[0] : null;

    return { total, mediaGeral, ranking, favorito };
  }, [feedbacksFiltrados]);

  const dadosGrafico = useMemo(() => {
    const porDia = feedbacksFiltrados.reduce((acc, f) => {
      if (!acc[f.data]) {
        acc[f.data] = { data: f.data, soma: 0, qtd: 0 };
      }
      acc[f.data].soma += f.nota;
      acc[f.data].qtd += 1;
      return acc;
    }, {} as Record<string, { data: string, soma: number, qtd: number }>);

    return (Object.values(porDia) as { data: string, soma: number, qtd: number }[]).map(d => ({
      data: format(parseISO(d.data), 'dd/MM'),
      media: parseFloat((d.soma / d.qtd).toFixed(1)),
      total: d.qtd
    })).sort((a, b) => a.data.localeCompare(b.data));
  }, [feedbacksFiltrados]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-text-primary">Painel de Feedback</h2>
        
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-border">
          <input
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
            className="h-8 px-2 rounded border-none focus:ring-0 outline-none text-sm bg-transparent"
          />
          <span className="text-text-muted">até</span>
          <input
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
            className="h-8 px-2 rounded border-none focus:ring-0 outline-none text-sm bg-transparent"
          />
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-center">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Star size={18} className="text-warning" /> <span className="text-sm font-medium">Média Geral</span>
          </div>
          <p className="text-4xl font-bold text-text-primary">{metricas.mediaGeral}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-center">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <MessageSquare size={18} className="text-blue-500" /> <span className="text-sm font-medium">Total de Avaliações</span>
          </div>
          <p className="text-4xl font-bold text-text-primary">{metricas.total}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 p-6 rounded-2xl shadow-sm border border-yellow-200 flex flex-col justify-center relative overflow-hidden">
          <Trophy size={80} className="absolute -right-4 -bottom-4 text-yellow-500/20" />
          <div className="flex items-center gap-2 text-yellow-800 mb-2 relative z-10">
            <Trophy size={18} /> <span className="text-sm font-bold">Prato Favorito</span>
          </div>
          <div className="relative z-10">
            {metricas.favorito ? (
              <>
                <p className="text-xl font-bold text-yellow-900 truncate" title={metricas.favorito.nome}>{metricas.favorito.nome}</p>
                <p className="text-sm text-yellow-700 mt-1 font-medium">⭐ {metricas.favorito.media} ({metricas.favorito.qtd} avaliações)</p>
              </>
            ) : (
              <p className="text-sm text-yellow-700">Sem dados suficientes</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
          <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" /> Nota Média por Dia
          </h3>
          <div className="h-[300px] w-full">
            {dadosGrafico.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                  <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                  <Tooltip 
                    cursor={{ stroke: '#E5E7EB', strokeWidth: 2 }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="media" stroke="#F97316" strokeWidth={3} dot={{ r: 4, fill: '#F97316', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                Nenhum dado para exibir.
              </div>
            )}
          </div>
        </div>

        {/* Ranking */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col">
          <h3 className="text-lg font-bold text-text-primary mb-4">Ranking de Pratos</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {metricas.ranking.length > 0 ? (
              metricas.ranking.map((prato, index) => (
                <div key={prato.nome} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-neutral/50 transition-colors">
                  <div className="flex items-center gap-3 w-1/2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-neutral text-text-muted'}`}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-text-primary truncate" title={prato.nome}>{prato.nome}</span>
                  </div>
                  <div className="flex items-center gap-4 w-1/2 justify-end">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-warning fill-warning" />
                      <span className="font-bold text-text-primary">{prato.media}</span>
                    </div>
                    <span className="text-xs text-text-muted w-16 text-right">{prato.qtd} aval.</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-text-muted">Nenhum prato avaliado no período.</div>
            )}
          </div>
        </div>
      </div>

      {/* Comentários Recentes */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-text-primary">Comentários Recentes</h3>
          <button 
            onClick={handleResumir} 
            disabled={loadingAI || feedbacksFiltrados.length === 0} 
            className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-xl font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            <Sparkles size={18} /> {loadingAI ? 'Analisando...' : 'Resumir com IA'}
          </button>
        </div>

        {resumoAI && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
              <Sparkles size={16}/> Resumo da IA
            </h4>
            <div className="text-sm text-text-primary markdown-body">
              <ReactMarkdown>{resumoAI}</ReactMarkdown>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feedbacksFiltrados.filter(f => f.comentario).length > 0 ? (
            feedbacksFiltrados.filter(f => f.comentario).slice(0, 9).map(f => (
              <div key={f.id} className="p-4 rounded-xl border border-border bg-neutral/30">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-text-primary text-sm">Aluno de {f.turma}</p>
                    <p className="text-xs text-text-muted">{format(parseISO(f.data), 'dd/MM/yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm border border-border">
                    <Star size={12} className="text-warning fill-warning" />
                    <span className="text-xs font-bold">{f.nota}</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-primary mb-2">{f.opcaoNome}</p>
                <p className="text-sm text-text-primary italic">"{f.comentario}"</p>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-text-muted">
              Nenhum comentário recebido no período.
            </div>
          )}
        </div>
      </div>
      {/* Feedbacks por Prato */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
        <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
          <Utensils size={20} className="text-primary" /> Feedbacks por Prato
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metricas.ranking.length > 0 ? (
            metricas.ranking.map((prato) => (
              <div key={prato.nome} className="border border-border rounded-xl p-5 bg-neutral/30 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-text-primary text-lg pr-4">{prato.nome}</h4>
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-border shrink-0">
                    <Star size={16} className="text-warning fill-warning" />
                    <span className="font-bold text-sm">{prato.media}</span>
                    <span className="text-xs text-text-muted">({prato.qtd})</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  {prato.comentarios.length > 0 ? (
                    <div>
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Comentários Frequentes</p>
                      <ul className="space-y-3">
                        {prato.comentarios.slice(0, 3).map((comentario, idx) => (
                          <li key={idx} className="text-sm text-text-primary bg-white p-3 rounded-lg border border-border italic shadow-sm">
                            "{comentario}"
                          </li>
                        ))}
                      </ul>
                      {prato.comentarios.length > 3 && (
                        <p className="text-xs font-medium text-primary mt-3 text-center bg-primary/5 py-1.5 rounded-lg">
                          + {prato.comentarios.length - 3} outros comentários
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-white rounded-lg border border-border border-dashed p-4">
                      <p className="text-sm text-text-muted italic">Nenhum comentário para este prato.</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-text-muted">Nenhum prato avaliado no período.</div>
          )}
        </div>
      </div>
    </div>
  );
}
