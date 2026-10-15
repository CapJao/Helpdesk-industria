import React from 'react';
import { Wrench, Plus, Layers, Cpu } from 'lucide-react';

interface NavbarProps {
  onOpenNovoChamado: () => void;
  onOpenNovoEquipamento: () => void;
  onOpenNovoSetor: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNovoChamado,
  onOpenNovoEquipamento,
  onOpenNovoSetor,
}) => {
  return (
    <header className="app-navbar">
      <div className="navbar-container">
        <div className="brand-wrapper">
          <div className="brand-logo">
            <Wrench size={20} />
          </div>
          <div>
            <div className="brand-title">
              Helpdesk Industrial
              <span className="brand-badge">CMMS N1</span>
            </div>
          </div>
        </div>

        <div className="navbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={onOpenNovoSetor}>
            <Layers size={14} />
            <span>Setor</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onOpenNovoEquipamento}>
            <Cpu size={14} />
            <span>Equipamento</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={onOpenNovoChamado}>
            <Plus size={16} />
            <span>Abrir Chamado</span>
          </button>
        </div>
      </div>
    </header>
  );
};
