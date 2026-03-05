import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../store/AppContext';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, FileSpreadsheet, BarChart3, Calendar, Users, Utensils, Leaf } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

export function AdminRelatorios() {
  const { pedidos } = useAppContext();
  const hoje = new Date();
  const [dataInicio, setDataInicio] = useState(format(startOfWeek(hoje, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfWeek(hoje, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [turmaFiltro, setTurmaFiltro] = useState('Todas');
  const [statusFiltro, setStatusFiltro] = useState('Todos');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');

  const turmasUnicas = useMemo(() => {
    const turmas = new Set(pedidos.map(p => p.turma));
    return Array.from(turmas).sort();
  }, [pedidos]);

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(p => {
      const dataPedido = parseISO(p.data);
      const inicio = parseISO(dataInicio);
      const fim = parseISO(dataFim);
      const inRange = isWithinInterval(dataPedido, { start: inicio, end: fim });
      const matchTurma = turmaFiltro === 'Todas' || p.turma === turmaFiltro;
      const matchStatus = statusFiltro === 'Todos' || p.status === statusFiltro;
      const matchTipo = tipoFiltro === 'Todos' || p.tipo === tipoFiltro;
      return inRange && matchTurma && matchStatus && matchTipo;
    });
  }, [pedidos, dataInicio, dataFim, turmaFiltro, statusFiltro, tipoFiltro]);

  const metricas = useMemo(() => {
    const total = pedidosFiltrados.length;
    const regular = pedidosFiltrados.filter(p => p.tipo === 'REGULAR').length;
    const vegetariano = pedidosFiltrados.filter(p => p.tipo === 'VEGETARIANO').length;
    
    // Agrupar por dia para achar o pico
    const porDia = pedidosFiltrados.reduce((acc, p) => {
      acc[p.data] = (acc[p.data] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const diasComPedidos = Object.keys(porDia).length;
    const mediaDiaria = diasComPedidos > 0 ? Math.round(total / diasComPedidos) : 0;
    
    let diaPico = '-';
    let maxPedidos = 0;
    (Object.entries(porDia) as [string, number][]).forEach(([data, qtd]) => {
      if (qtd > maxPedidos) {
        maxPedidos = qtd;
        diaPico = format(parseISO(data), 'dd/MM/yyyy');
      }
    });

    return { total, regular, vegetariano, mediaDiaria, diaPico, maxPedidos };
  }, [pedidosFiltrados]);

  const dadosGrafico = useMemo(() => {
    const porTurma = pedidosFiltrados.reduce((acc, p) => {
      if (!acc[p.turma]) {
        acc[p.turma] = { turma: p.turma, Regular: 0, Vegetariano: 0 };
      }
      if (p.tipo === 'REGULAR') acc[p.turma].Regular++;
      else acc[p.turma].Vegetariano++;
      return acc;
    }, {} as Record<string, { turma: string, Regular: number, Vegetariano: number }>);

    return (Object.values(porTurma) as { turma: string, Regular: number, Vegetariano: number }[]).sort((a, b) => a.turma.localeCompare(b.turma));
  }, [pedidosFiltrados]);

  const pratosPopulares = useMemo(() => {
    const contagem: Record<string, number> = {};
    pedidosFiltrados.forEach(p => {
      contagem[p.opcaoNome] = (contagem[p.opcaoNome] || 0) + 1;
    });
    return Object.entries(contagem)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [pedidosFiltrados]);

  const exportarCSV = () => {
    if (pedidosFiltrados.length === 0) return;
    
    const cabecalhos = ['ID', 'Data', 'Hora', 'Nome', 'Turma', 'Ticket', 'Tipo', 'Prato', 'Status', 'Criado Por', 'Motivo Admin'];
    const linhas = pedidosFiltrados.map(p => [
      p.id, p.data, p.hora, p.nomeSolicitante, p.turma, p.numeroTicket || '', p.tipo, p.opcaoNome, p.status, p.criadoPor, p.motivoAdmin || ''
    ]);
    
    const conteudoCSV = [
      cabecalhos.join(';'),
      ...linhas.map(linha => linha.map(col => `"${col}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pedidos_marmitex_${dataInicio}_a_${dataFim}.csv`;
    link.click();
  };

  const exportarXLSX = () => {
    if (pedidosFiltrados.length === 0) return;

    const dados = pedidosFiltrados.map(p => ({
      ID: p.id,
      Data: p.data,
      Hora: p.hora,
      Nome: p.nomeSolicitante,
      Turma: p.turma,
      Ticket: p.numeroTicket || '',
      Tipo: p.tipo,
      Prato: p.opcaoNome,
      Status: p.status,
      'Criado Por': p.criadoPor,
      'Motivo Admin': p.motivoAdmin || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
    XLSX.writeFile(wb, `pedidos_marmitex_${dataInicio}_a_${dataFim}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-text-primary">Relatórios e Exportação</h2>
        <div className="flex gap-2">
          <button onClick={exportarCSV} className="h-10 px-4 bg-white border border-border text-text-primary font-medium rounded-xl hover:bg-neutral transition-colors flex items-center gap-2 shadow-sm text-sm">
            <Download size={16} /> Exportar CSV
          </button>
          <button onClick={exportarXLSX} className="h-10 px-4 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2 shadow-sm text-sm">
            <FileSpreadsheet size={16} /> Exportar XLSX
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-border grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">Data Início</label>
          <input
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">Data Fim</label>
          <input
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
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
          <label className="text-xs font-medium text-text-muted">Status</label>
          <select
            value={statusFiltro}
            onChange={e => setStatusFiltro(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border focus:ring-2 focus:ring-primary outline-none text-sm bg-white"
          >
            <option value="Todos">Todos</option>
            <option value="ATIVO">Ativo</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-text-muted">Tipo</label>
          <select
            value={tipoFiltro}
            onChange={e => setTipoFiltro(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border focus:ring-2 focus:ring-primary outline-none text-sm bg-white"
          >
            <option value="Todos">Todos</option>
            <option value="REGULAR">Regular</option>
            <option value="VEGETARIANO">Vegetariano</option>
          </select>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-center">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Users size={18} /> <span className="text-sm font-medium">Total de Pedidos</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{metricas.total}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-center">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Calendar size={18} /> <span className="text-sm font-medium">Média Diária</span>
          </div>
          <p className="text-3xl font-bold text-text-primary">{metricas.mediaDiaria}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-center">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <BarChart3 size={18} /> <span className="text-sm font-medium">Dia de Pico</span>
          </div>
          <p className="text-xl font-bold text-text-primary">{metricas.diaPico}</p>
          <p className="text-xs text-text-muted mt-1">{metricas.maxPedidos} pedidos</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-center">
          <div className="flex items-center gap-2 text-text-muted mb-2">
            <Utensils size={18} /> <span className="text-sm font-medium">Distribuição</span>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1 text-sm font-bold text-blue-600">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> {metricas.regular} Reg
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500" /> {metricas.vegetariano} Veg
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
          <h3 className="text-lg font-bold text-text-primary mb-6">Pedidos por Turma</h3>
          <div className="h-[400px] w-full">
            {dadosGrafico.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="turma" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                  <Tooltip 
                    cursor={{ fill: '#F3F4F6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Regular" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Vegetariano" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                Nenhum dado para exibir no período selecionado.
              </div>
            )}
          </div>
        </div>

        {/* Pratos Mais Populares */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
          <h3 className="text-lg font-bold text-text-primary mb-6">Pratos Mais Populares</h3>
          <div className="space-y-4">
            {pratosPopulares.length > 0 ? (
              pratosPopulares.map((prato, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-neutral rounded-xl">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-primary">{index + 1}º</span>
                    <span className="font-medium text-text-primary">{prato.nome}</span>
                  </div>
                  <span className="text-sm font-bold text-text-muted">{prato.quantidade} pedidos</span>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-text-muted">
                Nenhum pedido encontrado no período selecionado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
