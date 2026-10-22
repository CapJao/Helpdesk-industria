import React, { useEffect, useRef, useState } from 'react';
import { Search, Clock, Check, UserCheck, GripVertical, MoveRight, Eye } from 'lucide-react';
import type { Chamado, Setor, Tecnico, StatusChamado } from '../types';

interface KanbanBoardProps {
  chamados: Chamado[];
  tecnicos: Tecnico[];
  setores: Setor[];
  onAtribuir: (chamadoId: string, tecnicoId: string) => Promise<void>;
  onOpenConcluir: (chamado: Chamado) => void;
  onOpenDetalhes: (chamado: Chamado) => void
  onOpenAtribuir: (chamado: Chamado) => void
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
  onOpenDetalhes,
  onOpenAtribuir,
}) => {
  const [search, setSearch] = useState('');
  const [urgenciaFiltro, setUrgenciaFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [setorFiltro, setSetorFiltro] = useState('');
  const [selectedTecnicos, setSelectedTecnicos] = useState<{ [key: string]: string }>({});
  const [loadingAtribuir, setLoadingAtribuir] = useState<string | null>(null);

  const [moverId, setMoverId] = useState<string | null>(null)
  const [erroAtribuicao, setErroAtribuicao] = useState('')
  const [avisoMovimento, setAvisoMovimento] = useState('')
  const [destinoArraste, setDestinoArraste] = useState<StatusChamado | null>(null)
  const [arrastando, setArrastando] = useState<{ chamado: Chamado; x: number; y: number } | null>(null)
  const ignorarClique = useRef(false)
  const dragRef = useRef<{
    chamado: Chamado; pointerId: number; origemX: number; origemY: number
    x: number; y: number; ativo: boolean; frame?: number
  } | null>(null)

  useEffect(() => () => {
    if (dragRef.current?.frame) cancelAnimationFrame(dragRef.current.frame)
  }, [])

  const handleMover = (chamado: Chamado, destino: StatusChamado | null) => {
    setMoverId(null)
    setErroAtribuicao('')
    if (!destino || destino === chamado.status || chamado.status === 'Concluído') return
    if (destino === 'Em Andamento') {
      onOpenAtribuir(chamado)
      return
    }
    if (destino === 'Concluído') {
      onOpenConcluir(chamado)
      return
    }
    setAvisoMovimento('Chamados em atendimento não podem voltar para a triagem.')
  }

  const obterDestino = (x: number, y: number) => {
    const column = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-status]')
    return (column?.dataset.status as StatusChamado | undefined) ?? null
  }

  const handleAutoScroll = () => {
    const drag = dragRef.current
    if (!drag?.ativo) return
    const deslocamento = drag.y < 80 ? -12 : drag.y > window.innerHeight - 80 ? 12 : 0
    if (deslocamento) {
      window.scrollBy(0, deslocamento)
      setDestinoArraste(obterDestino(drag.x, drag.y))
    }
    drag.frame = requestAnimationFrame(handleAutoScroll)
  }

  const handleDragStart = (event: React.PointerEvent<HTMLButtonElement>, chamado: Chamado) => {
    if (event.button !== 0 || chamado.status === 'Concluído' || loadingAtribuir) return
    ignorarClique.current = false
    dragRef.current = {
      chamado, pointerId: event.pointerId, origemX: event.clientX, origemY: event.clientY,
      x: event.clientX, y: event.clientY, ativo: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleDragMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    drag.x = event.clientX
    drag.y = event.clientY
    if (!drag.ativo) {
      if (Math.hypot(drag.x - drag.origemX, drag.y - drag.origemY) < 6) return
      drag.ativo = true
      setMoverId(null)
      handleAutoScroll()
    }
    setArrastando({ chamado: drag.chamado, x: drag.x, y: drag.y })
    setDestinoArraste(obterDestino(drag.x, drag.y))
  }

  const handleDragEnd = (event: React.PointerEvent<HTMLButtonElement>, cancelar = false) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (drag.frame) cancelAnimationFrame(drag.frame)
    dragRef.current = null
    setArrastando(null)
    setDestinoArraste(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (!drag.ativo) return
    ignorarClique.current = true
    if (!cancelar) handleMover(drag.chamado, obterDestino(event.clientX, event.clientY))
  }

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
    setErroAtribuicao('')
    try {
      setLoadingAtribuir(chamado.id);
      await onAtribuir(chamado.id, tecId);
    } catch (error) {
      setErroAtribuicao(error instanceof Error ? error.message : 'Não foi possível atribuir o chamado.')
    } finally {
      setLoadingAtribuir(null);
    }
  };

  const renderCard = (c: Chamado) => {
    const isConcluido = c.status === 'Concluído';
    const isAlta = c.urgencia === 'Alta';

    const tecSelecionado = selectedTecnicos[c.id] || c.tecnicoId || '';

    return (
      <article
        key={c.id}
        className={`ticket-card ${arrastando?.chamado.id === c.id ? 'ticket-card-dragging' : ''}`}
        tabIndex={0}
        aria-label={`Chamado ${c.id.slice(0, 8)}: ${c.equipamento?.nome ?? 'Equipamento'}`}
        aria-describedby="kanban-instrucoes"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('button, select, input, textarea, a')) return
          onOpenDetalhes(c)
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || !['Enter', ' '].includes(event.key)) return
          event.preventDefault()
          onOpenDetalhes(c)
        }}
      >
        <div className="ticket-top">
          {!isConcluido && (
            <button
              type="button"
              className="ticket-drag-handle"
              aria-label={`Arrastar chamado ${c.id.slice(0, 8)}`}
              title="Arraste para outra coluna ou clique para escolher o destino"
              disabled={loadingAtribuir === c.id}
              onPointerDown={(event) => handleDragStart(event, c)}
              onPointerMove={handleDragMove}
              onPointerUp={(event) => handleDragEnd(event)}
              onPointerCancel={(event) => handleDragEnd(event, true)}
              onLostPointerCapture={(event) => handleDragEnd(event, true)}
              onClick={() => {
                if (ignorarClique.current) { ignorarClique.current = false; return }
                setMoverId(moverId === c.id ? null : c.id)
              }}
            >
              <GripVertical size={18} aria-hidden="true" />
            </button>
          )}
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
          <button type="button" className="ticket-equip-title ticket-details-link" onClick={() => onOpenDetalhes(c)}>
            {c.equipamento?.nome || 'Equipamento'} <Eye size={14} aria-hidden="true" />
          </button>
          <div className="ticket-sector-name">{c.equipamento?.setor?.nome || 'Setor'}</div>
        </div>

        {c.descricao && <div className="ticket-description">{c.descricao}</div>}

        {(c.laudo || c.trocas?.length || c.pecasTrocadas) && (
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
            {c.laudo && <div><strong>Laudo:</strong> {c.laudo}</div>}
            {Boolean(c.trocas?.length) && (
              <ul className="ticket-parts-list" aria-label="Peças substituídas">
                {c.trocas?.map((troca) => (
                  <li key={troca.id}>
                    {troca.quantidade} × {troca.pecaNome}
                    {troca.observacao && <div>{troca.observacao}</div>}
                  </li>
                ))}
              </ul>
            )}
            {!c.trocas?.length && c.pecasTrocadas && (
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
              aria-label={`Técnico do chamado ${c.id.slice(0, 8)}`}
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
        {!isConcluido && (
          <>
            <button type="button" className="btn btn-secondary btn-sm ticket-move-button" aria-label="Mover chamado" aria-expanded={moverId === c.id} onClick={() => setMoverId(moverId === c.id ? null : c.id)}>
              <MoveRight size={14} aria-hidden="true" /> Mover
            </button>
            {moverId === c.id && (
              <div className="ticket-move-actions">
                {c.status === 'Aberto' && <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleMover(c, 'Em Andamento')}>Mover para Em Atendimento</button>}
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleMover(c, 'Concluído')}>Mover para Concluídos</button>
              </div>
            )}
          </>
        )}
      </article>
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

      <p id="kanban-instrucoes" className="kanban-instructions">Clique em um cartão para ver os detalhes. Arraste pela alça ou use Mover para mudar de etapa.</p>
      {erroAtribuicao && <p role="alert" className="parts-error">{erroAtribuicao}</p>}
      <p role="status" className="sr-only">{avisoMovimento}</p>
      {arrastando && (
        <div className="kanban-drag-preview" aria-hidden="true" style={{ left: Math.min(arrastando.x + 12, Math.max(8, window.innerWidth - 242)), top: Math.min(arrastando.y + 12, window.innerHeight - 56) }}>
          {arrastando.chamado.equipamento?.nome ?? 'Chamado'}
        </div>
      )}
      {/* Colunas do Kanban */}
      <div className="kanban-board">
        {/* Coluna 1: Abertos */}
        <div data-status="Aberto" className={`kanban-column ${destinoArraste === 'Aberto' ? 'kanban-drop-target' : ''}`}>
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
        <div data-status="Em Andamento" className={`kanban-column ${destinoArraste === 'Em Andamento' ? 'kanban-drop-target' : ''}`}>
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
        <div data-status="Concluído" className={`kanban-column ${destinoArraste === 'Concluído' ? 'kanban-drop-target' : ''}`}>
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
