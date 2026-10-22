import type { Chamado } from '../types'
import { ModalDialog } from './ModalDialog'

interface ChamadoDetailsModalProps {
  chamado: Chamado
  onClose: () => void
  onAtribuir: () => void
  onConcluir: () => void
}

const formatDate = (value: string | null) => value ? new Date(value).toLocaleString('pt-BR') : 'Não registrado'

export const ChamadoDetailsModal = ({ chamado, onClose, onAtribuir, onConcluir }: ChamadoDetailsModalProps) => (
  <ModalDialog title={`Detalhes do chamado #${chamado.id.slice(0, 8)}`} onClose={onClose}>
    <div className="modal-body chamado-details">
      <h4>{chamado.equipamento?.nome ?? 'Equipamento não informado'}</h4>
      <dl className="parts-history-details">
        <div><dt>Status</dt><dd>{chamado.status}</dd></div>
        <div><dt>Urgência</dt><dd>{chamado.urgencia}</dd></div>
        <div><dt>Tipo</dt><dd>{chamado.tipo}</dd></div>
        <div><dt>Setor</dt><dd>{chamado.equipamento?.setor?.nome ?? 'Não informado'}</dd></div>
        <div><dt>Patrimônio</dt><dd>{chamado.equipamento?.codigoPatrimonio || 'Não informado'}</dd></div>
        <div><dt>Técnico</dt><dd>{chamado.tecnico?.nome ?? 'Sem técnico atribuído'}</dd></div>
        <div><dt>Aberto em</dt><dd>{formatDate(chamado.criadoEm)}</dd></div>
        <div><dt>Atribuído em</dt><dd>{formatDate(chamado.atribuidoEm)}</dd></div>
        <div><dt>Concluído em</dt><dd>{formatDate(chamado.finalizadoEm)}</dd></div>
      </dl>
      <section>
        <h4>Descrição do problema</h4>
        <p>{chamado.descricao || 'Nenhuma descrição informada.'}</p>
      </section>
      {chamado.status === 'Concluído' && (
        <>
          <section><h4>Laudo técnico</h4><p>{chamado.laudo || 'Não informado'}</p></section>
          <section><h4>Causa raiz</h4><p>{chamado.causaRaiz || 'Não informada'}</p></section>
          <section>
            <h4>Peças substituídas</h4>
            {chamado.trocas?.length ? (
              <ul className="ticket-parts-list">
                {chamado.trocas.map((troca) => (
                  <li key={troca.id}>
                    {troca.quantidade} × {troca.pecaNome}
                    {troca.observacao && <p>{troca.observacao}</p>}
                  </li>
                ))}
              </ul>
            ) : <p>{chamado.pecasTrocadas || 'Nenhuma peça substituída.'}</p>}
          </section>
        </>
      )}
    </div>
    <div className="modal-actions">
      <button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>
      {chamado.status !== 'Concluído' && (
        <>
          <button type="button" className="btn btn-secondary" onClick={onAtribuir}>
            {chamado.tecnicoId ? 'Reatribuir técnico' : 'Atribuir técnico'}
          </button>
          <button type="button" className="btn btn-success" onClick={onConcluir}>Concluir chamado</button>
        </>
      )}
    </div>
  </ModalDialog>
)
