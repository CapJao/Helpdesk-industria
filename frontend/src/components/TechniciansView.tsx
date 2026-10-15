import React from 'react';
import { ShieldAlert, User, Check } from 'lucide-react';
import type { Chamado, Tecnico } from '../types';

interface TechniciansViewProps {
  tecnicos: Tecnico[];
  chamados: Chamado[];
  onOpenConcluir: (chamado: Chamado) => void;
}

export const TechniciansView: React.FC<TechniciansViewProps> = ({
  tecnicos,
  chamados,
  onOpenConcluir,
}) => {
  return (
    <div>
      {/* Banner da Regra de Negócio Crítica */}
      <div className="alert-box">
        <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#2563eb' }} />
        <div>
          <strong style={{ color: '#1e3a8a' }}>Regra de Negócio Crítica (RN N1):</strong>
          <p style={{ marginTop: '0.2rem', color: '#1e40af', lineHeight: '1.4' }}>
            Nenhum técnico pode ter mais de <strong>2 chamados com urgência "Alta"</strong> em aberto
            (status <code>Aberto</code> ou <code>Em Andamento</code>) ao mesmo tempo.
            Tentativas de atribuição que excederem esse teto retornam <code>HTTP 422</code> pelo backend.
          </p>
        </div>
      </div>

      <div className="tecnicos-cards-grid">
        {tecnicos.map((t) => {
          const countAlta = t.chamadosAltaAbertos || 0;
          const pct = Math.min(100, (countAlta / 2) * 100);

          let barColor = 'var(--success-text)';
          let statusText = 'Disponível';
          let statusClass = 'badge-baixa';

          if (countAlta === 1) {
            barColor = 'var(--warning-text)';
            statusText = '1 Vaga Restante';
            statusClass = 'badge-media';
          } else if (countAlta >= 2) {
            barColor = 'var(--danger-text)';
            statusText = 'Capacidade Máxima';
            statusClass = 'badge-alta';
          }

          const chamadosTecnico = chamados.filter(
            (c) => c.tecnicoId === t.id && c.status !== 'Concluído'
          );

          return (
            <div key={t.id} className="tecnico-profile-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--bg-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <User size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {t.nome}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Matrícula: {t.matricula}
                    </div>
                  </div>
                </div>

                <span className={`badge ${statusClass}`}>
                  {statusText}
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <span>Carga de Chamados "Alta"</span>
                  <strong>{countAlta} / 2</strong>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }}></div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Chamados Ativos ({chamadosTecnico.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {chamadosTecnico.length ? (
                    chamadosTecnico.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '6px',
                          padding: '0.45rem 0.6rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.78rem',
                        }}
                      >
                        <div>
                          <strong>{c.equipamento?.nome}</strong>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            {c.urgencia} • {c.tipo}
                          </div>
                        </div>

                        <button
                          className="btn btn-success btn-sm"
                          style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem' }}
                          onClick={() => onOpenConcluir(c)}
                        >
                          <Check size={12} />
                          <span>Concluir</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                      Nenhum chamado ativo no momento
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
