import React from 'react';
import { Cpu, Layers, Plus, History } from 'lucide-react';
import type { Equipamento, Setor, Chamado } from '../types';

interface EquipmentsViewProps {
  equipamentos: Equipamento[];
  setores: Setor[];
  chamados: Chamado[];
  onOpenNovoEquipamento: () => void;
  onOpenNovoSetor: () => void;
  onOpenHistorico: (equipamento: Equipamento) => void;
  onAbrirChamadoParaEquipamento: (equipamentoId: string) => void;
}

export const EquipmentsView: React.FC<EquipmentsViewProps> = ({
  equipamentos,
  setores: _setores,
  chamados,
  onOpenNovoEquipamento,
  onOpenNovoSetor,
  onOpenHistorico,
  onAbrirChamadoParaEquipamento,
}) => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Parque Fabril & Setores
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Equipamentos industriais cadastrados e vinculados às suas respectivas linhas de produção.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={onOpenNovoSetor}>
            <Layers size={14} />
            <span>Novo Setor</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={onOpenNovoEquipamento}>
            <Plus size={14} />
            <span>Novo Equipamento</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {equipamentos.map((eq) => {
          const chamadosAtivo = chamados.filter((c) => c.equipamentoId === eq.id);
          const abertos = chamadosAtivo.filter((c) => c.status !== 'Concluído').length;
          const temAlta = chamadosAtivo.some((c) => c.urgencia === 'Alta' && c.status !== 'Concluído');

          return (
            <div
              key={eq.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '1.1rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.9rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: 'var(--bg-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                      }}
                    >
                      <Cpu size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {eq.nome}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {eq.setor ? eq.setor.nome : 'Sem setor'}
                      </div>
                    </div>
                  </div>

                  {eq.codigoPatrimonio && (
                    <span className="patrimonio-pill">{eq.codigoPatrimonio}</span>
                  )}
                </div>

                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '4px',
                      padding: '0.35rem 0.6rem',
                      fontSize: '0.75rem',
                      flex: 1,
                    }}
                  >
                    <div style={{ color: 'var(--text-muted)' }}>Em Aberto</div>
                    <strong style={{ color: temAlta ? 'var(--danger-text)' : abertos > 0 ? 'var(--warning-text)' : 'var(--success-text)', fontSize: '0.95rem' }}>
                      {abertos}
                    </strong>
                  </div>
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '4px',
                      padding: '0.35rem 0.6rem',
                      fontSize: '0.75rem',
                      flex: 1,
                    }}
                  >
                    <div style={{ color: 'var(--text-muted)' }}>Total Registrado</div>
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
                      {chamadosAtivo.length}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="equipment-actions" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpenHistorico(eq)}>
                  <History size={14} aria-hidden="true" />
                  <span>Histórico de peças</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onAbrirChamadoParaEquipamento(eq.id)}
                >
                  <Plus size={14} />
                  <span>Abrir Chamado</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
