import React, { useRef, useState } from 'react';
import { ModalDialog } from './ModalDialog'
import { Plus, Trash2 } from 'lucide-react';
import type { Equipamento, Setor, Chamado, Urgencia, TipoChamado, ConclusaoChamado } from '../types';

interface ModalNovoChamadoProps {
  isOpen: boolean;
  equipamentos: Equipamento[];
  initialEquipamentoId?: string;
  onClose: () => void;
  onSubmit: (dados: {
    equipamentoId: string;
    urgencia: Urgencia;
    tipo: TipoChamado;
    descricao: string;
  }) => Promise<void>;
}

export const ModalNovoChamado: React.FC<ModalNovoChamadoProps> = ({
  isOpen,
  equipamentos,
  initialEquipamentoId,
  onClose,
  onSubmit,
}) => {
  const [equipamentoId, setEquipamentoId] = useState(initialEquipamentoId || (equipamentos[0]?.id ?? ''));
  const [urgencia, setUrgencia] = useState<Urgencia>('Alta');
  const [tipo, setTipo] = useState<TipoChamado>('Corretiva');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('')

  React.useEffect(() => {
    if (initialEquipamentoId) setEquipamentoId(initialEquipamentoId);
    else if (equipamentos.length && !equipamentoId) setEquipamentoId(equipamentos[0].id);
  }, [initialEquipamentoId, equipamentos]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return
    setErro('')
    if (!equipamentoId) return;
    try {
      setLoading(true);
      await onSubmit({ equipamentoId, urgencia, tipo, descricao });
      setDescricao('');
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.')
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalDialog title="Abrir Ordem de Serviço" onClose={onClose} busy={loading}>
        <form onSubmit={handleSubmit}>
          <fieldset className="modal-body parts-fields" disabled={loading}>
            {erro && <p className="parts-error" role="alert">{erro}</p>}
            <div className="form-field">
              <label>Equipamento / Máquina *</label>
              <select
                className="form-select"
                value={equipamentoId}
                onChange={(e) => setEquipamentoId(e.target.value)}
                required
              >
                {equipamentos.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nome} ({eq.setor ? eq.setor.nome : '-'}) {eq.codigoPatrimonio ? `[${eq.codigoPatrimonio}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-field">
                <label>Urgência *</label>
                <select
                  className="form-select"
                  value={urgencia}
                  onChange={(e) => setUrgencia(e.target.value as Urgencia)}
                >
                  <option value="Alta">🚨 Alta (Máquina Parada)</option>
                  <option value="Media">⚠️ Média (Operação Degrada)</option>
                  <option value="Baixa">🟢 Baixa (Rotina)</option>
                </select>
              </div>

              <div className="form-field">
                <label>Tipo de Manutenção *</label>
                <select
                  className="form-select"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoChamado)}
                >
                  <option value="Corretiva">🛠️ Corretiva</option>
                  <option value="Preventiva">🛡️ Preventiva</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label>Descrição do Problema / Sintoma</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Descreva o defeito constatado na máquina..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </fieldset>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" disabled={loading} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Abrindo...' : 'Abrir Chamado'}
            </button>
          </div>
        </form>
    </ModalDialog>
  );
};

interface ModalNovoEquipamentoProps {
  isOpen: boolean;
  setores: Setor[];
  onClose: () => void;
  onSubmit: (dados: { nome: string; setorId: string; codigoPatrimonio?: string }) => Promise<void>;
}

export const ModalNovoEquipamento: React.FC<ModalNovoEquipamentoProps> = ({
  isOpen,
  setores,
  onClose,
  onSubmit,
}) => {
  const [nome, setNome] = useState('');
  const [setorId, setSetorId] = useState(setores[0]?.id ?? '');
  const [codigoPatrimonio, setCodigoPatrimonio] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('')

  React.useEffect(() => {
    if (setores.length && !setorId) setSetorId(setores[0].id);
  }, [setores]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return
    setErro('')
    if (!nome.trim() || !setorId) return;
    try {
      setLoading(true);
      await onSubmit({ nome: nome.trim(), setorId, codigoPatrimonio: codigoPatrimonio.trim() || undefined });
      setNome('');
      setCodigoPatrimonio('');
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.')
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalDialog title="Cadastrar Equipamento" onClose={onClose} busy={loading}>
        <form onSubmit={handleSubmit}>
          <fieldset className="modal-body parts-fields" disabled={loading}>
            {erro && <p className="parts-error" role="alert">{erro}</p>}
            <div className="form-field">
              <label>Nome do Equipamento / Máquina *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Torno CNC 03, Esteira 04..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>Setor / Linha de Produção *</label>
              <select
                className="form-select"
                value={setorId}
                onChange={(e) => setSetorId(e.target.value)}
                required
              >
                {setores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Código de Patrimônio (Opcional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: EQP-0003"
                value={codigoPatrimonio}
                onChange={(e) => setCodigoPatrimonio(e.target.value)}
              />
            </div>
          </fieldset>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" disabled={loading} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Equipamento'}
            </button>
          </div>
        </form>
    </ModalDialog>
  );
};

interface ModalNovoSetorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (nome: string) => Promise<void>;
}

export const ModalNovoSetor: React.FC<ModalNovoSetorProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('')

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return
    setErro('')
    if (!nome.trim()) return;
    try {
      setLoading(true);
      await onSubmit(nome.trim());
      setNome('');
      onClose();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.')
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalDialog title="Cadastrar Novo Setor" onClose={onClose} busy={loading}>
        <form onSubmit={handleSubmit}>
          <fieldset className="modal-body parts-fields" disabled={loading}>
            {erro && <p className="parts-error" role="alert">{erro}</p>}
            <div className="form-field">
              <label>Nome do Setor / Linha *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Usinagem, Pintura, Linha 2..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
          </fieldset>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" disabled={loading} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Setor'}
            </button>
          </div>
        </form>
    </ModalDialog>
  );
};

interface ModalConcluirChamadoProps {
  chamado: Chamado | null;
  onClose: () => void;
  onSubmit: (chamadoId: string, dados: ConclusaoChamado) => Promise<void>;
}

export const ModalConcluirChamado: React.FC<ModalConcluirChamadoProps> = ({
  chamado,
  onClose,
  onSubmit,
}) => {
  const [laudo, setLaudo] = useState('');
  const [causaRaiz, setCausaRaiz] = useState('Desgaste Natural / Fim de vida útil');
  const [trocas, setTrocas] = useState<{ id: string; pecaNome: string; quantidade: string; observacao: string }[]>([])
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false);
  const proximaPecaId = useRef(0)

  if (!chamado) return null;

  const handleAdicionarPeca = () => {
    const id = String(proximaPecaId.current++)
    setTrocas((atuais) => [...atuais, { id, pecaNome: '', quantidade: '1', observacao: '' }])
  }

  const handleAlterarPeca = (id: string, campo: 'pecaNome' | 'quantidade' | 'observacao', valor: string) => {
    setTrocas((atuais) => atuais.map((troca) => troca.id === id ? { ...troca, [campo]: valor } : troca))
  }

  const handleRemoverPeca = (id: string) => {
    setTrocas((atuais) => atuais.filter((troca) => troca.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setErro('')
    const pecas = trocas.map((troca) => ({
      pecaNome: troca.pecaNome.trim(),
      quantidade: Number(troca.quantidade),
      ...(troca.observacao.trim() ? { observacao: troca.observacao.trim() } : {}),
    }))
    const temPecaInvalida = pecas.some((troca) =>
      !troca.pecaNome || !Number.isInteger(troca.quantidade) || troca.quantidade < 1 || troca.quantidade > 2147483647
    )
    if (!laudo.trim() || temPecaInvalida) {
      setErro('Preencha o laudo e informe nome e quantidade válida para cada peça.')
      return
    }
    try {
      setLoading(true)
      await onSubmit(chamado.id, {
        laudo: laudo.trim(),
        causaRaiz,
        trocas: pecas,
        pecasTrocadas: pecas.map((troca) =>
          `${troca.quantidade} × ${troca.pecaNome}${troca.observacao ? ` (${troca.observacao})` : ''}`
        ).join('; '),
      })
      onClose()
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível concluir o chamado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalDialog title={`Concluir Chamado: ${chamado.equipamento?.nome ?? 'Equipamento'}`} onClose={onClose} busy={loading}>
      <form onSubmit={handleSubmit}>
        <fieldset className="modal-body parts-fields" disabled={loading}>
          {erro && <p className="parts-error" role="alert">{erro}</p>}
          <div className="form-field">
            <label htmlFor="concluir-laudo">Laudo Técnico / Ação Executada *</label>
            <textarea
              id="concluir-laudo"
              autoFocus
              className="form-textarea"
              rows={3}
              placeholder="Descreva o que foi corrigido..."
              value={laudo}
              onChange={(e) => setLaudo(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="concluir-causa">Causa Raiz da Falha</label>
            <select
              id="concluir-causa"
              className="form-select"
              value={causaRaiz}
              onChange={(e) => setCausaRaiz(e.target.value)}
            >
              <option value="Desgaste Natural / Fim de vida útil">Desgaste Natural / Fim de vida útil</option>
              <option value="Falha Mecânica">Falha Mecânica (fadiga, quebra)</option>
              <option value="Falha Elétrica / Eletrônica">Falha Elétrica / Eletrônica (sensor, motor)</option>
              <option value="Falha Operacional">Falha Operacional / Erro de operação</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <section className="parts-editor" aria-labelledby="pecas-titulo">
            <div className="parts-section-header">
              <h4 id="pecas-titulo">Peças substituídas</h4>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAdicionarPeca}>
                <Plus size={14} aria-hidden="true" /> Adicionar peça
              </button>
            </div>
            {trocas.length === 0 && <p className="parts-muted">Nenhuma peça adicionada. Você pode concluir sem registrar trocas.</p>}
            {trocas.map((troca, index) => (
              <div key={troca.id} className="part-editor-row">
                <div className="parts-section-header">
                  <h5>Peça {index + 1}</h5>
                  <button type="button" className="btn btn-secondary btn-sm" aria-label={`Remover peça ${index + 1}`} onClick={() => handleRemoverPeca(troca.id)}>
                    <Trash2 size={14} aria-hidden="true" /> Remover
                  </button>
                </div>
                <div className="part-name-quantity">
                  <div className="form-field">
                    <label htmlFor={`peca-nome-${troca.id}`}>Nome da peça {index + 1}</label>
                    <input
                      id={`peca-nome-${troca.id}`}
                      className="form-input"
                      value={troca.pecaNome}
                      maxLength={100}
                      required
                      onChange={(e) => handleAlterarPeca(troca.id, 'pecaNome', e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor={`peca-qtd-${troca.id}`}>Quantidade {index + 1}</label>
                    <input
                      id={`peca-qtd-${troca.id}`}
                      className="form-input"
                      type="number"
                      min={1}
                      max={2147483647}
                      step={1}
                      required
                      value={troca.quantidade}
                      onChange={(e) => handleAlterarPeca(troca.id, 'quantidade', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor={`peca-obs-${troca.id}`}>Observação {index + 1} (opcional)</label>
                  <textarea
                    id={`peca-obs-${troca.id}`}
                    className="form-textarea"
                    rows={2}
                    maxLength={500}
                    value={troca.observacao}
                    onChange={(e) => handleAlterarPeca(troca.id, 'observacao', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </section>
        </fieldset>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" disabled={loading} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-success" disabled={loading}>
            {loading ? 'Concluindo...' : 'Concluir Ordem de Serviço'}
          </button>
        </div>
      </form>
    </ModalDialog>
  )
}
