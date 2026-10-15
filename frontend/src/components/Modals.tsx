import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Equipamento, Setor, Chamado, Urgencia, TipoChamado } from '../types';

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

  React.useEffect(() => {
    if (initialEquipamentoId) setEquipamentoId(initialEquipamentoId);
    else if (equipamentos.length && !equipamentoId) setEquipamentoId(equipamentos[0].id);
  }, [initialEquipamentoId, equipamentos]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipamentoId) return;
    try {
      setLoading(true);
      await onSubmit({ equipamentoId, urgencia, tipo, descricao });
      setDescricao('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚡ Abrir Ordem de Serviço</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.2rem', border: 'none' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Abrindo...' : 'Abrir Chamado'}
            </button>
          </div>
        </form>
      </div>
    </div>
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

  React.useEffect(() => {
    if (setores.length && !setorId) setSetorId(setores[0].id);
  }, [setores]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !setorId) return;
    try {
      setLoading(true);
      await onSubmit({ nome: nome.trim(), setorId, codigoPatrimonio: codigoPatrimonio.trim() || undefined });
      setNome('');
      setCodigoPatrimonio('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚙️ Cadastrar Equipamento</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.2rem', border: 'none' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Equipamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    try {
      setLoading(true);
      await onSubmit(nome.trim());
      setNome('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🏭 Cadastrar Novo Setor</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.2rem', border: 'none' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
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
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Setor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ModalConcluirChamadoProps {
  chamado: Chamado | null;
  onClose: () => void;
  onSubmit: (chamadoId: string, dados: { laudo?: string; causaRaiz?: string; pecasTrocadas?: string }) => Promise<void>;
}

export const ModalConcluirChamado: React.FC<ModalConcluirChamadoProps> = ({
  chamado,
  onClose,
  onSubmit,
}) => {
  const [laudo, setLaudo] = useState('');
  const [causaRaiz, setCausaRaiz] = useState('Desgaste Natural / Fim de vida útil');
  const [pecasTrocadas, setPecasTrocadas] = useState('');
  const [loading, setLoading] = useState(false);

  if (!chamado) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSubmit(chamado.id, {
        laudo: laudo.trim() || 'Manutenção executada e máquina liberada.',
        causaRaiz,
        pecasTrocadas: pecasTrocadas.trim() || undefined,
      });
      setLaudo('');
      setPecasTrocadas('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✓ Concluir Chamado: {chamado.equipamento?.nome}</h3>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.2rem', border: 'none' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label>Laudo Técnico / Ação Executada *</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Descreva o que foi corrigido..."
                value={laudo}
                onChange={(e) => setLaudo(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>Causa Raiz da Falha</label>
              <select
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

            <div className="form-field">
              <label>Peças / Componentes Substituídos (Opcional - N2)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Rolamento 6204, Correia B42..."
                value={pecasTrocadas}
                onChange={(e) => setPecasTrocadas(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Concluindo...' : 'Concluir Ordem de Serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
