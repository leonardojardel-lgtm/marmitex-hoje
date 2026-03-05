import React from 'react';
import { CardapioDia } from '../types';
import { X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CardapioModalProps {
  cardapios: CardapioDia[];
  onClose: () => void;
}

export function CardapioModal({ cardapios, onClose }: CardapioModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-text-primary">Cardápio Semanal Completo</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral rounded-lg">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {cardapios.map(cardapio => (
            <div key={cardapio.id} className="border border-border rounded-xl p-4">
              <h3 className="text-lg font-bold text-text-primary capitalize mb-2">
                {cardapio.diaSemana}, {format(parseISO(cardapio.data), "dd 'de' MMMM", { locale: ptBR })}
              </h3>
              {cardapio.opcoes.length === 0 ? (
                <p className="text-text-muted text-sm">Nenhum prato cadastrado.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cardapio.opcoes.map(opcao => (
                    <div key={opcao.id} className="bg-neutral/50 p-3 rounded-lg">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${opcao.tipo === 'REGULAR' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {opcao.tipo}
                      </span>
                      <p className="font-bold text-text-primary mt-1">{opcao.nomePrato}</p>
                      {opcao.descricao && <p className="text-sm text-text-muted">{opcao.descricao}</p>}
                      {opcao.alergenos && <p className="text-xs text-danger mt-1">Alérgenos: {opcao.alergenos}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
