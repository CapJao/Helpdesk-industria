import React, { useState } from 'react';
import { Search, Clock, Check, UserCheck } from 'lucide-react';
import type { Chamado, Setor, Tecnico } from '../types';

interface KanbanBoardProps {
  chamados: Chamado[];
  tecnicos: Tecnico[];
  setores: Setor[];
  onAtribuir: (chamadoId: string, tecnicoId: string) => Promise<void>;
  onOpenConcluir: (chamado: Chamado) => void;
}

function formatRelativeTime(isoDate: string): string {
  if (!isoDate) return '-';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `Há ${diffHoras} h`;
  const diffDias = Math.floor(diffHoras / 24);
  return `Há ${diffDias} d`;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  chamados,
  tecnicos,
  setores,
  onAtribuir,
  onOpenConcluir,
}) => {
  const [search, setSearch] = useState('');
  const [urgenciaFiltro, setUrgenciaFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [setorFiltro, setSetorFiltro] = useState('');
  const [selectedTecnicos, setSelectedTecnicos] = useState<{ [key: string]: string }>({});
  const [loadingAtribuir, setLoadingAtribuir] = useState<string | null>(null);

  // Filtragem
  const filteredChamados = chamados.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const eq = (c.equipamento?.nome || '').toLowerCase();
      const pat = (c.equipamento?.codigoPatrimonio || '').toLowerCase();
      const desc = (c.descricao || '').toLowerCase();
      const tec = (c.tecnico?.nome || '').toLowerCase();
      if (!eq.includes(q) && !pat.includes(q) && !desc.includes(q) && !tec.includes(q)) {
        return false;
      }
    }
    if (urgenciaFiltro && c.urgencia !== urgenciaFiltro) return false;
    if (tipoFiltro && c.tipo !== tipoFiltro) return false;
    if (setorFiltro && c.equipamento?.setorId !== setorFiltro) return false;
    return true;
  });

  const abertos = filteredChamados.filter((c) => c.status === 'Aberto');
  const emAndamento = filteredChamados.filter((c) => c.status === 'Em Andamento');
  const concluidos = filteredChamados.filter((c) => c.status === 'Concluído');

  const handleSelectTecnico = (chamadoId: string, tecnicoId: string) => {
    setSelectedTecnicos((prev) => ({ ...prev, [chamadoId]: tecnicoId }));
  };

  const handleAtribuirClick = async (chamado: Chamado) => {
    const tecId = selectedTecnicos[chamado.id] || chamado.tecnicoId || '';
    if (!tecId) return;
    try {
      setLoadingAtribuir(chamado.id);
      await onAtribuir(chamado.id, tecId);
    } finally {
      setLoadingAtribuir(null);
    }
  };

  const renderCard = (c: Chamado) => {
    const isConcluido = c.status === 'Concluído';
    const isAlta = c.urgencia === 'Alta';

    const tecSelecionado = selectedTecnicos[c.id] || c.tecnicoId || '';

    return (
      <div key={c.id} className="ticket-card">
        <div className="ticket-top">
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span className={`badge badge-${c.urgencia.toLowerCase()}`}>
              {c.urgencia}
            </span>
            <span className="badge badge-tipo">{c.tipo}</span>
          </div>
          {c.equipamento?.codigoPatrimonio && (
            <span className="patrimonio-pill">{c.equipamento.codigoPatrimonio}</span>
          )}
        </div>

        <div>
          <div className="ticket-equip-title">{c.equipamento?.nome || 'Equipamento'}</div>
          <div className="ticket-sector-name">{c.equipamento?.setor?.nome || 'Setor'}</div>
        </div>

        {c.descricao && <div className="ticket-description">{c.descricao}</div>}

        {c.laudo && (
          <div
            style={{
              background: 'var(--success-bg)',
              border: '1px solid var(--success-border)',
              padding: '0.4rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: 'var(--success-text)',
            }}
          >
            <strong>Laudo:</strong> {c.laudo}
            {c.pecasTrocadas && (
              <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                Peças: {c.pecasTrocadas}
              </div>
            )}
          </div>
        )}

        <div className="ticket-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={12} />
            <span>{formatRelativeTime(c.criadoEm)}</span>
          </div>

          {c.tecnico && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
              <UserCheck size={12} />
              <span>{c.tecnico.nome}</span>
            </div>
          )}
        </div>

        {!isConcluido && (
          <div className="assign-controls">
            <select
              className="assign-select"
              value={tecSelecionado}
              onChange={(e) => handleSelectTecnico(c.id, e.target.value)}
            >
              <option value="">Atribuir técnico...</option>
              {tecnicos.map((t) => {
                const isCurrent = c.tecnicoId === t.id;
                const limiteAtingido = t.chamadosAltaAbertos >= 2 && isAlta && !isCurrent;
                return (
                  <option
                    key={t.id}
                    value={t.id}
                    disabled={limiteAtingido}
                  >
                    {t.nome} [{t.chamadosAltaAbertos}/2 Alta] {limiteAtingido ? '(Lotado)' : ''}
                  </option>
                );
              })}
            </select>

            <button
              className="btn btn-secondary btn-sm"
              disabled={!tecSelecionado || loadingAtribuir === c.id}
              onClick={() => handleAtribuirClick(c)}
              title="Atribuir Técnico"
            >
              {loadingAtribuir === c.id ? '...' : 'Atribuir'}
            </button>

            <button
              className="btn btn-success btn-sm"
              onClick={() => onOpenConcluir(c)}
              title="Concluir Chamado"
            >
              <Check size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Filtros em linha */}
      <div className="filter-row">
        <div className="search-input-box">
          <Search size={15} className="search-icon-pos" />
          <input
            type="text"
            placeholder="Buscar equipamento, patrimônio ou problema..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            className="filter-select"
            value={urgenciaFiltro}
            onChange={(e) => setUrgenciaFiltro(e.target.value)}
          >
            <option value="">Todas as Urgências</option>
            <option value="Alta">Alta</option>
            <option value="Media">Média</option>
            <option value="Baixa">Baixa</option>
          </select>

          <select
            className="filter-select"
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
          >
            <option value="">Todos os Tipos</option>
            <option value="Corretiva">Corretiva</option>
            <option value="Preventiva">Preventiva</option>
          </select>

          <select
            className="filter-select"
            value={setorFiltro}
            onChange={(e) => setSetorFiltro(e.target.value)}
          >
            <option value="">Todos os Setores</option>
            {setores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Colunas do Kanban */}
      <div className="kanban-board">
        {/* Coluna 1: Abertos */}
        <div className="kanban-column">
          <div className="column-header">
            <h3>Fila de Triagem</h3>
            <span className="column-count">{abertos.length}</span>
          </div>
          <div className="cards-container">
            {abertos.length ? (
              abertos.map(renderCard)
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                Nenhum chamado aberto na fila
              </div>
            )}
          </div>
        </div>

        {/* Coluna 2: Em Andamento */}
        <div className="kanban-column">
          <div className="column-header">
            <h3>Em Atendimento</h3>
            <span className="column-count">{emAndamento.length}</span>
          </div>
          <div className="cards-container">
            {emAndamento.length ? (
              emAndamento.map(renderCard)
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                Nenhum chamado em atendimento
              </div>
            )}
          </div>
        </div>

        {/* Coluna 3: Concluídos */}
        <div className="kanban-column">
          <div className="column-header">
            <h3>Concluídos</h3>
            <span className="column-count">{concluidos.length}</span>
          </div>
          <div className="cards-container">
            {concluidos.length ? (
              concluidos.map(renderCard)
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                Nenhum chamado concluído
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
