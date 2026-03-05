import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../store/AppContext';
import { useHorario } from '../../hooks/useHorario';
import { format } from 'date-fns';
import { Star, ArrowLeft, CheckCircle2 } from 'lucide-react';

export function AlunoFeedback() {
  const { configuracoes, pedidos, feedbacks, salvarFeedback } = useAppContext();
  const { getAgoraSP, isAposCorte } = useHorario();
  const navigate = useNavigate();

  const agora = getAgoraSP();
  const hojeStr = format(agora, 'yyyy-MM-dd');
  const aposCorte = isAposCorte(configuracoes.horarioCorte);

  const meuPedidoId = sessionStorage.getItem('meuPedidoId');
  const meuPedido = pedidos.find(p => p.id === meuPedidoId && p.data === hojeStr && p.status === 'ATIVO');
  const feedbackExistente = feedbacks.find(f => f.pedidoId === meuPedidoId);

  const [nota, setNota] = useState<number>(0);
  const [comentario, setComentario] = useState('');
  const [enviado, setEnviado] = useState(!!feedbackExistente);
  const [erro, setErro] = useState('');

  if (!aposCorte) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-20 h-20 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto mb-4">
          <Star size={40} />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Avaliação Indisponível</h2>
        <p className="text-text-muted mb-6">A avaliação da refeição só estará disponível após as {configuracoes.horarioCorte}.</p>
        <button onClick={() => navigate('/aluno')} className="text-primary font-medium hover:underline flex items-center justify-center gap-2 mx-auto">
          <ArrowLeft size={20} /> Voltar para Pedidos
        </button>
      </div>
    );
  }

  if (!meuPedido) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Nenhum pedido encontrado</h2>
        <p className="text-text-muted mb-6">Você não tem um pedido ativo para hoje.</p>
        <button onClick={() => navigate('/aluno')} className="text-primary font-medium hover:underline flex items-center justify-center gap-2 mx-auto">
          <ArrowLeft size={20} /> Voltar
        </button>
      </div>
    );
  }

  if (enviado) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 bg-white rounded-2xl shadow-sm border border-border p-8">
        <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Avaliação Enviada!</h2>
        <p className="text-text-muted mb-6">Obrigado pelo seu feedback. Ele nos ajuda a melhorar nossas refeições.</p>
        <button onClick={() => navigate('/aluno')} className="h-12 px-6 bg-neutral text-text-primary font-medium rounded-xl hover:bg-gray-200 transition-colors">
          Voltar para o Início
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nota === 0) {
      setErro('Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    salvarFeedback({
      pedidoId: meuPedido.id,
      opcaoId: meuPedido.opcaoId,
      opcaoNome: meuPedido.opcaoNome,
      data: hojeStr,
      nomeSolicitante: meuPedido.nomeSolicitante,
      turma: meuPedido.turma,
      nota: nota as 1 | 2 | 3 | 4 | 5,
      comentario: comentario.trim() || undefined,
    });

    setEnviado(true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/aluno')} className="text-text-muted hover:text-primary font-medium flex items-center gap-2 mb-6 transition-colors">
        <ArrowLeft size={20} /> Voltar
      </button>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-border">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Avaliar Refeição</h2>
        <p className="text-text-muted mb-8">Como estava o seu <strong className="text-text-primary">{meuPedido.opcaoNome}</strong> hoje?</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {erro && (
            <div className="bg-danger/10 text-danger p-3 rounded-xl text-sm font-medium text-center">
              {erro}
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNota(star)}
                  className={`p-2 transition-transform hover:scale-110 focus:outline-none ${nota >= star ? 'text-warning' : 'text-gray-300'}`}
                >
                  <Star size={48} fill={nota >= star ? 'currentColor' : 'none'} strokeWidth={1.5} />
                </button>
              ))}
            </div>
            <span className="text-sm font-medium text-text-muted">
              {nota === 0 ? 'Selecione uma nota' : 
               nota === 1 ? 'Muito Ruim' : 
               nota === 2 ? 'Ruim' : 
               nota === 3 ? 'Regular' : 
               nota === 4 ? 'Bom' : 'Excelente!'}
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Comentário (opcional)</label>
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              maxLength={200}
              rows={4}
              className="w-full p-4 rounded-xl border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              placeholder="O que você achou da refeição? Deixe sua opinião..."
            />
            <div className="text-right text-xs text-text-muted">
              {comentario.length}/200
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-14 bg-primary text-white font-bold text-lg rounded-xl hover:bg-primary-dark transition-colors shadow-md"
          >
            Enviar Avaliação
          </button>
        </form>
      </div>
    </div>
  );
}
