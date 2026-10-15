export interface Setor {
  id: string;
  nome: string;
}

export interface Equipamento {
  id: string;
  nome: string;
  setorId: string;
  codigoPatrimonio?: string;
  setor?: Setor | null;
}

export interface Tecnico {
  id: string;
  nome: string;
  matricula: string;
  chamadosAltaAbertos: number;
}

export type Urgencia = 'Alta' | 'Media' | 'Baixa';
export type TipoChamado = 'Corretiva' | 'Preventiva';
export type StatusChamado = 'Aberto' | 'Em Andamento' | 'Concluído';

export interface Chamado {
  id: string;
  equipamentoId: string;
  tecnicoId: string | null;
  urgencia: Urgencia;
  tipo: TipoChamado;
  status: StatusChamado;
  descricao: string;
  criadoEm: string;
  atribuidoEm: string | null;
  finalizadoEm: string | null;
  equipamento?: Equipamento | null;
  tecnico?: Tecnico | null;
  laudo?: string;
  causaRaiz?: string;
  pecasTrocadas?: string;
}
