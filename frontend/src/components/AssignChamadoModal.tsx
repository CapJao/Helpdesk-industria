import { useState } from 'react'
import type { Chamado, Tecnico } from '../types'
import { ModalDialog } from './ModalDialog'

interface AssignChamadoModalProps {
  chamado: Chamado
  tecnicos: Tecnico[]
  onClose: () => void
  onSubmit: (chamadoId: string, tecnicoId: string) => Promise<void>
}

export const AssignChamadoModal = ({ chamado, tecnicos, onClose, onSubmit }: AssignChamadoModalProps) => {
  const [tecnicoId, setTecnicoId] = useState(chamado.tecnicoId ?? '')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (loading || !tecnicoId) return
    setErro('')
    setLoading(true)
    try {
      await onSubmit(chamado.id, tecnicoId)
      onClose()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível atribuir o chamado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalDialog title="Atribuir chamado" onClose={onClose} busy={loading}>
      <form onSubmit={handleSubmit}>
        <fieldset className="modal-body parts-fields" disabled={loading}>
          <p>{chamado.equipamento?.nome} · Chamado #{chamado.id.slice(0, 8)}</p>
          <p className="parts-muted">O chamado vai para Em Atendimento após a confirmação do técnico.</p>
          {erro && <p role="alert" className="parts-error">{erro}</p>}
          <div className="form-field">
            <label htmlFor="atribuir-tecnico">Técnico responsável</label>
            <select id="atribuir-tecnico" className="form-select" value={tecnicoId} required onChange={(event) => setTecnicoId(event.target.value)}>
              <option value="">Selecione o técnico</option>
              {tecnicos.map((tecnico) => {
                const lotado = chamado.urgencia === 'Alta' && tecnico.chamadosAltaAbertos >= 2 && chamado.tecnicoId !== tecnico.id
                return <option key={tecnico.id} value={tecnico.id} disabled={lotado}>{tecnico.nome}{lotado ? ' (Limite de chamados Alta)' : ''}</option>
              })}
            </select>
          </div>
        </fieldset>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading || !tecnicoId}>{loading ? 'Atribuindo...' : 'Confirmar atribuição'}</button>
        </div>
      </form>
    </ModalDialog>
  )
}
