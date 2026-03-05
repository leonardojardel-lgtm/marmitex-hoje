export type PerfilUsuario = 'ADMIN' | 'ALUNO';
export type TipoRefeicao = 'REGULAR' | 'VEGETARIANO';
export type StatusPedido = 'ATIVO' | 'CANCELADO';
export type CriadorPedido = 'ALUNO' | 'ADMIN';
export type StatusCardapio = 'PUBLICADO' | 'RASCUNHO' | 'VAZIO';

export interface CardapioDia {
  id: string;
  data: string; // 'YYYY-MM-DD'
  diaSemana: string;
  status: StatusCardapio;
  pdfUrl?: string;
  pdfNome?: string;
  opcoes: CardapioOpcao[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface CardapioOpcao {
  id: string;
  cardapioId: string;
  tipo: TipoRefeicao;
  nomePrato: string;
  descricao?: string;
  alergenos?: string;
  imageUrl?: string;
}

export interface Pedido {
  id: string;
  data: string; // 'YYYY-MM-DD'
  hora: string; // 'HH:mm'
  nomeSolicitante: string;
  turma: string;
  numeroTicket: string;
  tipo: TipoRefeicao;
  opcaoId: string;
  opcaoNome: string;
  status: StatusPedido;
  criadoPor: CriadorPedido;
  motivoAdmin?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface AdminLog {
  id: string;
  acao: 'CRIAR' | 'EDITAR' | 'CANCELAR';
  pedidoId: string;
  adminId: string;
  motivo: string;
  timestamp: string;
  aposHorarioCorte: boolean;
}

export interface Feedback {
  id: string;
  pedidoId: string;
  opcaoId: string;
  opcaoNome: string;
  data: string;
  nomeSolicitante: string;
  turma: string;
  nota: 1 | 2 | 3 | 4 | 5;
  comentario?: string;
  criadoEm: string;
}

export interface Configuracoes {
  horarioCorte: string;
  fuso: 'America/Sao_Paulo';
}
