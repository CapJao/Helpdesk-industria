import React from 'react';
import { AlertCircle, Flame, Clock, CheckCircle2 } from 'lucide-react';
import type { Chamado } from '../types';

interface KpiCardsProps {
  chamados: Chamado[];
}

export const KpiCards: React.FC<KpiCardsProps> = ({ chamados }) => {
  const abertos = chamados.filter((c) => c.status === 'Aberto').length;
  const emAndamento = chamados.filter((c) => c.status === 'Em Andamento').length;
  const concluidos = chamados.filter((c) => c.status === 'Concluído').length;
  const altasAtivas = chamados.filter(
    (c) => c.urgencia === 'Alta' && c.status !== 'Concluído'
  ).length;

  return (
    <div className="kpi-row">
      <div className="kpi-card">
        <div>
          <div className="kpi-label">Fila de Triagem</div>
          <div className="kpi-number">{abertos}</div>
        </div>
        <div className="kpi-icon-wrapper" style={{ background: '#f1f5f9', color: '#475569' }}>
          <AlertCircle size={20} />
        </div>
      </div>

      <div className="kpi-card">
        <div>
          <div className="kpi-label">Urgência Alta (Crítico)</div>
          <div className="kpi-number" style={{ color: altasAtivas > 0 ? 'var(--danger-text)' : 'inherit' }}>
            {altasAtivas}
          </div>
        </div>
        <div
          className="kpi-icon-wrapper"
          style={{
            background: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            border: '1px solid var(--danger-border)',
          }}
        >
          <Flame size={20} />
        </div>
      </div>

      <div className="kpi-card">
        <div>
          <div className="kpi-label">Em Atendimento</div>
          <div className="kpi-number" style={{ color: 'var(--warning-text)' }}>
            {emAndamento}
          </div>
        </div>
        <div
          className="kpi-icon-wrapper"
          style={{
            background: 'var(--warning-bg)',
            color: 'var(--warning-text)',
            border: '1px solid var(--warning-border)',
          }}
        >
          <Clock size={20} />
        </div>
      </div>

      <div className="kpi-card">
        <div>
          <div className="kpi-label">Concluídos</div>
          <div className="kpi-number" style={{ color: 'var(--success-text)' }}>
            {concluidos}
          </div>
        </div>
        <div
          className="kpi-icon-wrapper"
          style={{
            background: 'var(--success-bg)',
            color: 'var(--success-text)',
            border: '1px solid var(--success-border)',
          }}
        >
          <CheckCircle2 size={20} />
        </div>
      </div>
    </div>
  );
};
