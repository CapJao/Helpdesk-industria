import type { Chamado, Equipamento, Setor, Tecnico, ConclusaoChamado, TrocaHistorico } from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.erro || data.message || `Erro ${response.status}: Falha na operação.`;
    throw new ApiError(errorMsg, response.status);
  }

  return data as T;
}

export const api = {
  getSetores: () => request<Setor[]>('/setores'),
  createSetor: (nome: string) => request<Setor>('/setores', {
    method: 'POST',
    body: JSON.stringify({ nome }),
  }),

  getEquipamentos: () => request<Equipamento[]>('/equipamentos'),
  createEquipamento: (dados: { nome: string; setorId: string; codigoPatrimonio?: string }) =>
    request<Equipamento>('/equipamentos', {
      method: 'POST',
      body: JSON.stringify(dados),
    }),

  getHistoricoPecas: (equipamentoId: string, signal?: AbortSignal) =>
    request<TrocaHistorico[]>(`/equipamentos/${encodeURIComponent(equipamentoId)}/pecas`, { signal }),

  getTecnicos: () => request<Tecnico[]>('/tecnicos'),

  getChamados: () => request<Chamado[]>('/chamados'),
  createChamado: (dados: {
    equipamentoId: string;
    urgencia: string;
    tipo?: string;
    descricao?: string;
  }) =>
    request<Chamado>('/chamados', {
      method: 'POST',
      body: JSON.stringify(dados),
    }),

  atribuirChamado: (chamadoId: string, tecnicoId: string) =>
    request<Chamado>(`/chamados/${chamadoId}/atribuir`, {
      method: 'PATCH',
      body: JSON.stringify({ tecnicoId }),
    }),

  concluirChamado: (chamadoId: string, dados: ConclusaoChamado) =>
    request<Chamado>(`/chamados/${chamadoId}/concluir`, {
      method: 'PATCH',
      body: JSON.stringify(dados),
    }),
};
