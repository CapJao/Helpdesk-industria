import { useEffect, useState } from 'react'
import { api, ApiError } from '../services/api'
import type { Equipamento, TrocaHistorico } from '../types'
import { ModalDialog } from './ModalDialog'

interface PartsHistoryModalProps {
  equipamento: Equipamento
  onClose: () => void
}

type HistoryState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; trocas: TrocaHistorico[] }

export const PartsHistoryModal = ({ equipamento, onClose }: PartsHistoryModalProps) => {
  const [state, setState] = useState<HistoryState>({ status: 'loading' })
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    api.getHistoricoPecas(equipamento.id, controller.signal)
      .then((trocas) => {
        if (controller.signal.aborted) return
        setState({ status: 'success', trocas })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          status: 'error',
          message: error instanceof ApiError && error.statusCode === 404
            ? 'O histórico de peças não está disponível para este equipamento.'
            : error instanceof Error ? error.message : 'Tente novamente mais tarde.',
        })
      })
    return () => controller.abort()
  }, [equipamento.id, tentativa])

  const handleTentarNovamente = () => {
    setState({ status: 'loading' })
    setTentativa((atual) => atual + 1)
  }

  return (
    <ModalDialog title={`Histórico de peças: ${equipamento.nome}`} onClose={onClose}>
      <div className="modal-body parts-history-body" aria-live="polite" aria-busy={state.status === 'loading'}>
        {state.status === 'loading' && <p role="status" className="parts-muted">Carregando histórico...</p>}
        {state.status === 'error' && (
          <div className="parts-history-error">
            <p role="alert" className="parts-error">Não foi possível carregar o histórico. {state.message}</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleTentarNovamente}>Tentar novamente</button>
          </div>
        )}
        {state.status === 'success' && state.trocas.length === 0 && <p className="parts-muted">Nenhuma troca registrada</p>}
        {state.status === 'success' && state.trocas.length > 0 && (
          <ol className="parts-history-list">
            {state.trocas.map((troca) => (
              <li key={troca.id} className="parts-history-item">
                <div className="parts-section-header">
                  <h4>{troca.pecaNome}</h4>
                  <span>Quantidade: {troca.quantidade}</span>
                </div>
                <time dateTime={troca.registradoEm} className="parts-muted">
                  {new Date(troca.registradoEm).toLocaleString('pt-BR')}
                </time>
                {troca.observacao && <p>{troca.observacao}</p>}
                <dl className="parts-history-details">
                  <div><dt>Chamado</dt><dd>{troca.chamado.id}</dd></div>
                  <div><dt>Manutenção</dt><dd>{troca.chamado.tipo} · Urgência {troca.chamado.urgencia}</dd></div>
                  <div><dt>Técnico</dt><dd>{troca.tecnico?.nome ?? 'Sem técnico atribuído'}</dd></div>
                  <div><dt>Causa raiz</dt><dd>{troca.chamado.causaRaiz || 'Não informada'}</dd></div>
                </dl>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>
      </div>
    </ModalDialog>
  )
}
