import { useState, useEffect, useCallback } from 'react';
import { Kanban, Users, Cpu } from 'lucide-react';
import { api, ApiError } from './services/api';
import type { Chamado, Equipamento, Setor, Tecnico, Urgencia, TipoChamado, ConclusaoChamado } from './types';
import { ChamadoDetailsModal } from './components/ChamadoDetailsModal'
import { AssignChamadoModal } from './components/AssignChamadoModal'
import { PartsHistoryModal } from './components/PartsHistoryModal'
import { Navbar } from './components/Navbar';
import { KpiCards } from './components/KpiCards';
import { KanbanBoard } from './components/KanbanBoard';
import { TechniciansView } from './components/TechniciansView';
import { EquipmentsView } from './components/EquipmentsView';
import {
  ModalNovoChamado,
  ModalNovoEquipamento,
  ModalNovoSetor,
  ModalConcluirChamado,
} from './components/Modals';
import { ToastContainer, type ToastMessage } from './components/Toast';

export function App() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [activeTab, setActiveTab] = useState<'kanban' | 'tecnicos' | 'equipamentos'>('kanban');

  // Modais
  const [isNovoChamadoOpen, setIsNovoChamadoOpen] = useState(false);
  const [isNovoEquipamentoOpen, setIsNovoEquipamentoOpen] = useState(false);
  const [isNovoSetorOpen, setIsNovoSetorOpen] = useState(false);
  const [concluirTargetChamado, setConcluirTargetChamado] = useState<Chamado | null>(null);
  const [detalhesChamadoId, setDetalhesChamadoId] = useState<string | null>(null)
  const [atribuirTargetChamado, setAtribuirTargetChamado] = useState<Chamado | null>(null)
  const detalhesChamado = chamados.find((chamado) => chamado.id === detalhesChamadoId)
  const [historicoEquipamento, setHistoricoEquipamento] = useState<Equipamento | null>(null)
  const [initialEquipamentoId, setInitialEquipamentoId] = useState<string | undefined>();

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const carregarDados = useCallback(async () => {
    try {
      const [s, eq, t, ch] = await Promise.all([
        api.getSetores(),
        api.getEquipamentos(),
        api.getTecnicos(),
        api.getChamados(),
      ]);
      setSetores(s);
      setEquipamentos(eq);
      setTecnicos(t);
      setChamados(ch);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 10000);
    return () => clearInterval(interval);
  }, [carregarDados]);

  // Ações de Chamado
  const handleAtribuir = async (chamadoId: string, tecnicoId: string) => {
    try {
      const atualizado = await api.atribuirChamado(chamadoId, tecnicoId);
      setChamados((atuais) => atuais.map((chamado) => chamado.id === atualizado.id ? atualizado : chamado))
      await carregarDados();
      addToast(
        'success',
        'Chamado Atribuído',
        `Ordem assumida pelo técnico ${atualizado.tecnico?.nome}.`
      );
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 422) {
        addToast('error', 'Regra de Negócio Violada (RN N1)', err.message);
      } else {
        addToast('error', 'Falha na Atribuição', err.message || 'Erro desconhecido');
      }
      throw err
    }
  };

  const handleConcluir = async (chamadoId: string, dados: ConclusaoChamado) => {
    const atualizado = await api.concluirChamado(chamadoId, dados)
    setChamados((atuais) => atuais.map((chamado) => chamado.id === atualizado.id ? atualizado : chamado))
    await carregarDados()
    addToast('success', 'Chamado Concluído', 'Ordem de serviço finalizada e vaga liberada para o técnico.')
  }

  const handleCreateChamado = async (dados: {
    equipamentoId: string;
    urgencia: Urgencia;
    tipo: TipoChamado;
    descricao: string;
  }) => {
    await api.createChamado(dados);
    await carregarDados();
    addToast(
      dados.urgencia === 'Alta' ? 'warning' : 'success',
      dados.urgencia === 'Alta' ? 'Chamado Crítico Aberto' : 'Chamado Criado',
      `Urgência: ${dados.urgencia}. Adicionado à fila de triagem.`
    );
  };

  const handleCreateEquipamento = async (dados: { nome: string; setorId: string; codigoPatrimonio?: string }) => {
    const eq = await api.createEquipamento(dados);
    await carregarDados();
    addToast('success', 'Equipamento Salvo', `${eq.nome} adicionado ao parque fabril.`);
  };

  const handleCreateSetor = async (nome: string) => {
    const s = await api.createSetor(nome);
    await carregarDados();
    addToast('success', 'Setor Criado', `Linha/setor ${s.nome} cadastrado.`);
  };

  const handleAbrirParaEquipamento = (eqId: string) => {
    setInitialEquipamentoId(eqId);
    setIsNovoChamadoOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        onOpenNovoChamado={() => {
          setInitialEquipamentoId(undefined);
          setIsNovoChamadoOpen(true);
        }}
        onOpenNovoEquipamento={() => setIsNovoEquipamentoOpen(true)}
        onOpenNovoSetor={() => setIsNovoSetorOpen(true)}
      />

      <nav className="nav-tabs-bar">
        <div className="nav-tabs-container">
          <button
            className={`tab-btn ${activeTab === 'kanban' ? 'active' : ''}`}
            onClick={() => setActiveTab('kanban')}
          >
            <Kanban size={16} />
            <span>Quadro de Chamados</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'tecnicos' ? 'active' : ''}`}
            onClick={() => setActiveTab('tecnicos')}
          >
            <Users size={16} />
            <span>Carga da Equipe (RN Crítica)</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'equipamentos' ? 'active' : ''}`}
            onClick={() => setActiveTab('equipamentos')}
          >
            <Cpu size={16} />
            <span>Parque Fabril</span>
          </button>
        </div>
      </nav>

      <main className="main-container">
        <KpiCards chamados={chamados} />

        {activeTab === 'kanban' && (
          <KanbanBoard
            chamados={chamados}
            tecnicos={tecnicos}
            setores={setores}
            onAtribuir={handleAtribuir}
            onOpenDetalhes={(chamado) => setDetalhesChamadoId(chamado.id)}
            onOpenAtribuir={setAtribuirTargetChamado}
            onOpenConcluir={(c) => setConcluirTargetChamado(c)}
          />
        )}

        {activeTab === 'tecnicos' && (
          <TechniciansView
            tecnicos={tecnicos}
            chamados={chamados}
            onOpenConcluir={(c) => setConcluirTargetChamado(c)}
          />
        )}

        {activeTab === 'equipamentos' && (
          <EquipmentsView
            equipamentos={equipamentos}
            setores={setores}
            chamados={chamados}
            onOpenNovoEquipamento={() => setIsNovoEquipamentoOpen(true)}
            onOpenNovoSetor={() => setIsNovoSetorOpen(true)}
            onAbrirChamadoParaEquipamento={handleAbrirParaEquipamento}
            onOpenHistorico={setHistoricoEquipamento}
          />
        )}
      </main>

      {/* Modais */}
      {detalhesChamado && (
        <ChamadoDetailsModal
          chamado={detalhesChamado}
          onClose={() => setDetalhesChamadoId(null)}
          onAtribuir={() => {
            setDetalhesChamadoId(null)
            setAtribuirTargetChamado(detalhesChamado)
          }}
          onConcluir={() => {
            setDetalhesChamadoId(null)
            setConcluirTargetChamado(detalhesChamado)
          }}
        />
      )}
      {atribuirTargetChamado && (
        <AssignChamadoModal
          key={atribuirTargetChamado.id}
          chamado={atribuirTargetChamado}
          tecnicos={tecnicos}
          onClose={() => setAtribuirTargetChamado(null)}
          onSubmit={handleAtribuir}
        />
      )}
      <ModalNovoChamado
        isOpen={isNovoChamadoOpen}
        equipamentos={equipamentos}
        initialEquipamentoId={initialEquipamentoId}
        onClose={() => setIsNovoChamadoOpen(false)}
        onSubmit={handleCreateChamado}
      />

      <ModalNovoEquipamento
        isOpen={isNovoEquipamentoOpen}
        setores={setores}
        onClose={() => setIsNovoEquipamentoOpen(false)}
        onSubmit={handleCreateEquipamento}
      />

      <ModalNovoSetor
        isOpen={isNovoSetorOpen}
        onClose={() => setIsNovoSetorOpen(false)}
        onSubmit={handleCreateSetor}
      />

      {historicoEquipamento && (
        <PartsHistoryModal
          key={historicoEquipamento.id}
          equipamento={historicoEquipamento}
          onClose={() => setHistoricoEquipamento(null)}
        />
      )}

      <ModalConcluirChamado
        key={concluirTargetChamado?.id ?? 'fechado'}
        chamado={concluirTargetChamado}
        onClose={() => setConcluirTargetChamado(null)}
        onSubmit={handleConcluir}
      />

      {/* Notificações Flutuantes */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
