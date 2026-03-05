import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';
import { useHorario } from '../../hooks/useHorario';
import { format, addDays, startOfWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, FileText, Trash2, Plus, Save, Utensils, Eye } from 'lucide-react';
import { CardapioDia, CardapioOpcao, TipoRefeicao, StatusCardapio } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { CardapioModal } from '../../components/CardapioModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function AdminCardapio() {
  const { cardapios, salvarCardapio, pedidos } = useAppContext();
  const { getAgoraSP } = useHorario();
  const agora = getAgoraSP();

  const [semanaAtual, setSemanaAtual] = useState(() => startOfWeek(agora, { weekStartsOn: 1 }));
  const [cardapiosSemana, setCardapiosSemana] = useState<CardapioDia[]>([]);
  const [visualizando, setVisualizando] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<{file: File, cardapioId: string} | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Generate week days
  const diasSemana = Array.from({ length: 5 }).map((_, i) => addDays(semanaAtual, i));

  useEffect(() => {
    const novosCardapios = diasSemana.map(dia => {
      const dataStr = format(dia, 'yyyy-MM-dd');
      const existente = cardapios.find(c => c.data === dataStr);
      if (existente) return { ...existente };
      
      const diaSemana = format(dia, 'EEEE', { locale: ptBR });
      return {
        id: uuidv4(),
        data: dataStr,
        diaSemana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
        status: 'VAZIO' as StatusCardapio,
        opcoes: [],
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
    });
    setCardapiosSemana(novosCardapios);
  }, [semanaAtual, cardapios]);

  const handleMudarSemana = (direcao: number) => {
    setSemanaAtual(addDays(semanaAtual, direcao * 7));
  };

  const handleAdicionarOpcao = (cardapioId: string, tipo: TipoRefeicao) => {
    setCardapiosSemana(prev => prev.map(c => {
      if (c.id !== cardapioId) return c;
      const novaOpcao: CardapioOpcao = {
        id: uuidv4(),
        cardapioId: c.id,
        tipo,
        nomePrato: '',
        descricao: '',
        alergenos: ''
      };
      return { ...c, opcoes: [...c.opcoes, novaOpcao] };
    }));
  };

  const handleRemoverOpcao = (cardapioId: string, opcaoId: string) => {
    setCardapiosSemana(prev => prev.map(c => {
      if (c.id !== cardapioId) return c;
      
      const temPedidos = pedidos.some(p => p.data === c.data && p.opcaoId === opcaoId && p.status === 'ATIVO');
      if (temPedidos) {
        alert('Não é possível remover este prato pois já existem pedidos ativos para ele.');
        return c;
      }

      return { ...c, opcoes: c.opcoes.filter(o => o.id !== opcaoId) };
    }));
  };

  const handleAtualizarOpcao = (cardapioId: string, opcaoId: string, campo: keyof CardapioOpcao, valor: string) => {
    setCardapiosSemana(prev => prev.map(c => {
      if (c.id !== cardapioId) return c;
      return {
        ...c,
        opcoes: c.opcoes.map(o => o.id === opcaoId ? { ...o, [campo]: valor } : o)
      };
    }));
  };

  const handleSalvarSemana = async () => {
    try {
      await Promise.all(cardapiosSemana.map(c => salvarCardapio(c)));
      alert('Cardápio da semana salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar cardápio:', error);
      alert('Erro ao salvar cardápio. Tente novamente.');
    }
  };

  const handleFileUpload = (cardapioId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Apenas arquivos PDF são permitidos.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB.');
      e.target.value = '';
      return;
    }

    setFileToUpload({ file, cardapioId });
    setShowConfirmationModal(true);
    e.target.value = '';
  };

  const confirmFileUpload = () => {
    if (!fileToUpload) return;
    const { file, cardapioId } = fileToUpload;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCardapiosSemana(prev => prev.map(c => {
        if (c.id !== cardapioId) return c;
        return { ...c, pdfUrl: event.target?.result as string, pdfNome: file.name };
      }));
    };
    reader.readAsDataURL(file);
    setShowConfirmationModal(false);
    setFileToUpload(null);
  };

  const handleExportarPDF = () => {
    const doc = new jsPDF();
    doc.text(`Cardápio Semanal: ${format(diasSemana[0], 'dd/MM')} a ${format(diasSemana[4], 'dd/MM')}`, 14, 15);

    const tableData = cardapiosSemana.flatMap(c => 
      c.opcoes.map(o => [
        c.diaSemana,
        o.tipo,
        o.nomePrato,
        o.descricao,
        o.alergenos
      ])
    );

    autoTable(doc, {
      head: [['Dia', 'Tipo', 'Prato', 'Descrição', 'Alérgenos']],
      body: tableData,
      startY: 25,
    });

    doc.save('cardapio_semanal.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-text-primary">Cardápio Semanal</h2>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-border">
          <button onClick={handleExportarPDF} className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors">
            <FileText size={18} /> Exportar PDF
          </button>
          <div className="w-px h-6 bg-border" />
          <button onClick={() => setVisualizando(true)} className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors">
            <Eye size={18} /> Visualizar
          </button>
          <div className="w-px h-6 bg-border" />
          <button onClick={() => handleMudarSemana(-1)} className="p-1 hover:bg-neutral rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium text-sm">
            {format(diasSemana[0], 'dd/MM')} a {format(diasSemana[4], 'dd/MM')}
          </span>
          <button onClick={() => handleMudarSemana(1)} className="p-1 hover:bg-neutral rounded-lg transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Cardápios da Semana */}
      <div className="space-y-8">
        {cardapiosSemana.map(cardapio => (
          <div key={cardapio.id} className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral/50">
              <div>
                <h3 className="text-xl font-bold text-text-primary capitalize">
                  {cardapio.diaSemana}, {format(parseISO(cardapio.data), "dd 'de' MMMM", { locale: ptBR })}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    cardapio.status === 'PUBLICADO' ? 'bg-success/10 text-success' :
                    cardapio.status === 'RASCUNHO' ? 'bg-warning/10 text-warning-dark' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    Status: {cardapio.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-border hover:border-primary transition-colors text-sm text-text-muted">
                  <FileText size={16} />
                  {cardapio.pdfNome || 'Upload PDF'}
                  <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(cardapio.id, e)} />
                </label>
                {cardapio.pdfUrl && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => window.open(cardapio.pdfUrl, '_blank')} className="p-2 text-primary hover:bg-primary/10 rounded-lg" title="Visualizar PDF">
                      <Eye size={20} />
                    </button>
                    <button onClick={() => window.open(cardapio.pdfUrl, '_blank')} className="p-2 text-primary hover:bg-primary/10 rounded-lg">
                      <FileText size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Utensils size={20} className="text-primary" /> Opções de Refeição
                </h4>
                <div className="flex gap-2">
                  <button onClick={() => handleAdicionarOpcao(cardapio.id, 'REGULAR')} className="text-xs font-medium bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 flex items-center gap-1">
                    <Plus size={14} /> Regular
                  </button>
                  <button onClick={() => handleAdicionarOpcao(cardapio.id, 'VEGETARIANO')} className="text-xs font-medium bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 flex items-center gap-1">
                    <Plus size={14} /> Vegano
                  </button>
                </div>
              </div>

              {cardapio.opcoes.length === 0 ? (
                <div className="text-center py-12 bg-neutral rounded-xl border-2 border-dashed border-border">
                  <p className="text-text-muted">Nenhum prato cadastrado para este dia.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cardapio.opcoes.map(opcao => (
                    <div key={opcao.id} className="p-4 rounded-xl border border-border bg-white relative group">
                      <button 
                        onClick={() => handleRemoverOpcao(cardapio.id, opcao.id)}
                        className="absolute top-4 right-4 text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remover prato"
                      >
                        <Trash2 size={18} />
                      </button>
                      
                      <div className="mb-3 flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${opcao.tipo === 'REGULAR' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {opcao.tipo}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-medium text-text-muted">Nome do Prato *</label>
                          <input
                            type="text"
                            value={opcao.nomePrato}
                            onChange={e => handleAtualizarOpcao(cardapio.id, opcao.id, 'nomePrato', e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-border focus:ring-2 focus:ring-primary outline-none text-sm font-medium"
                            placeholder="Ex: Strogonoff de Frango"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-text-muted">Descrição (opcional)</label>
                          <input
                            type="text"
                            value={opcao.descricao || ''}
                            onChange={e => handleAtualizarOpcao(cardapio.id, opcao.id, 'descricao', e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
                            placeholder="Acompanhamentos..."
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-text-muted">Alérgenos (opcional)</label>
                          <input
                            type="text"
                            value={opcao.alergenos || ''}
                            onChange={e => handleAtualizarOpcao(cardapio.id, opcao.id, 'alergenos', e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
                            placeholder="Ex: Glúten, Lactose"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        <div className="flex justify-end">
          <button
            onClick={handleSalvarSemana}
            className="h-12 px-8 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors shadow-sm flex items-center gap-2"
          >
            <Save size={20} /> Salvar Cardápio da Semana
          </button>
        </div>
      </div>

      {visualizando && (
        <CardapioModal cardapios={cardapiosSemana} onClose={() => setVisualizando(false)} />
      )}

      {showConfirmationModal && fileToUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-text-primary mb-4">Confirmar Upload</h3>
            <p className="text-text-muted mb-6">
              Deseja realmente fazer o upload do arquivo <strong>{fileToUpload.file.name}</strong> ({(fileToUpload.file.size / (1024 * 1024)).toFixed(2)} MB)?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowConfirmationModal(false); setFileToUpload(null); }}
                className="flex-1 h-12 rounded-xl bg-neutral text-text-primary font-medium hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmFileUpload}
                className="flex-1 h-12 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


