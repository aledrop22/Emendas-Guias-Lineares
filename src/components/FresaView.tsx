import React, { useState } from 'react';
import { InspectionSet, OPConfig, EngravingPattern } from '../types';
import { HIWIN_GUIDE_CATALOG, getHiwinModel } from '../data/hiwinCatalog';
import { 
  calculateTheoreticalCaliper, 
  getEngravingJointLabels 
} from '../utils/calculations';
import { 
  Stamp, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Printer, 
  Layers, 
  FileSpreadsheet, 
  Hash, 
  ShoppingBag, 
  User, 
  ArrowRight, 
  Sparkles,
  CheckCheck,
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';

interface FresaViewProps {
  sets: InspectionSet[];
  config: OPConfig;
  onUpdateConfig: (newConfig: OPConfig) => void;
  onUpdateSet: (setIndex: number, updatedSet: InspectionSet) => void;
  onChangeNumberOfSets: (newCount: number) => void;
}

export const FresaView: React.FC<FresaViewProps> = ({
  sets,
  config,
  onUpdateConfig,
  onUpdateSet,
  onChangeNumberOfSets
}) => {
  const [selectedSetIndex, setSelectedSetIndex] = useState<number>(0);
  const [activeJointIndex, setActiveJointIndex] = useState<number>(1);
  const [millingOperator, setMillingOperator] = useState<string>('Operador Fresa');
  const [laserOperator, setLaserOperator] = useState<string>('Operador Laser');

  const selectedModel = getHiwinModel(config.modelId);
  const currentPattern = config.engravingPattern || 'LETTERS_NUMBERS';

  const numberOfJoints = config.piecesPerGuide > 1 
    ? config.piecesPerGuide - 1 
    : (config.nominalEJoints?.length ? Math.floor(config.nominalEJoints.length / 2) : 1);
  const numberOfPieces = numberOfJoints + 1;

  const currentSet = sets[selectedSetIndex] || sets[0] || {
    id: 'set-1',
    setNumber: 1,
    letter: 'A',
    name: '1° CONJUNTO - A',
    cotaEInicial: { nominal: 20, variation: 0 },
    cotaEFinal: { nominal: 20, variation: 0 },
    jointEnds: []
  };

  const currentSetNumber = currentSet.setNumber || selectedSetIndex + 1;
  const currentSetLetter = currentSet.letter || String.fromCharCode(65 + (selectedSetIndex % 26));

  // Current joint markings
  const validJointIdx = Math.min(numberOfJoints, Math.max(1, activeJointIndex));
  const activeLabels = getEngravingJointLabels(validJointIdx, currentSetLetter, currentPattern);

  // Check if a specific joint in a set is laser engraved
  const isJointLaserEngraved = (set: InspectionSet, jointIdx: number): boolean => {
    const endA = set.jointEnds?.find(j => j.jointIndex === jointIdx && j.side === 'A');
    const endB = set.jointEnds?.find(j => j.jointIndex === jointIdx && j.side === 'B');
    return Boolean(endA?.isLaserEngraved || endB?.isLaserEngraved);
  };

  const getJointLaserTimestamp = (set: InspectionSet, jointIdx: number): string | undefined => {
    const endA = set.jointEnds?.find(j => j.jointIndex === jointIdx && j.side === 'A');
    return endA?.laserTimestamp;
  };

  // Check if a specific joint in a set is milling marked
  const isJointMillingMarked = (set: InspectionSet, jointIdx: number): boolean => {
    const endA = set.jointEnds?.find(j => j.jointIndex === jointIdx && j.side === 'A');
    const endB = set.jointEnds?.find(j => j.jointIndex === jointIdx && j.side === 'B');
    return Boolean(endA?.isMillingMarked || endB?.isMillingMarked);
  };

  const getJointMillingTimestamp = (set: InspectionSet, jointIdx: number): string | undefined => {
    const endA = set.jointEnds?.find(j => j.jointIndex === jointIdx && j.side === 'A');
    return endA?.millingTimestamp;
  };

  // Toggle milling check for a specific joint
  const handleToggleMillingJoint = (setIdx: number, jointIdx: number) => {
    const targetSet = sets[setIdx];
    if (!targetSet) return;

    const newSet = JSON.parse(JSON.stringify(targetSet)) as InspectionSet;
    const isCurrentlyMarked = isJointMillingMarked(newSet, jointIdx);
    const nowStr = new Date().toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    // Ensure joint ends exist
    if (!newSet.jointEnds) newSet.jointEnds = [];

    // Find or create end A and B
    let endA = newSet.jointEnds.find(j => j.jointIndex === jointIdx && j.side === 'A');
    if (!endA) {
      endA = {
        id: `joint-${jointIdx}-A`,
        label: `Emenda ${jointIdx}A`,
        jointIndex: jointIdx,
        side: 'A',
        nominalE: config.nominalEJoints[(jointIdx - 1) * 2] || 30,
        variation: 0
      };
      newSet.jointEnds.push(endA);
    }

    let endB = newSet.jointEnds.find(j => j.jointIndex === jointIdx && j.side === 'B');
    if (!endB) {
      endB = {
        id: `joint-${jointIdx}-B`,
        label: `Emenda ${jointIdx}B`,
        jointIndex: jointIdx,
        side: 'B',
        nominalE: config.nominalEJoints[(jointIdx - 1) * 2 + 1] || 30,
        variation: 0
      };
      newSet.jointEnds.push(endB);
    }

    // Toggle
    const nextState = !isCurrentlyMarked;
    endA.isMillingMarked = nextState;
    endA.millingTimestamp = nextState ? nowStr : undefined;
    endA.millingOperator = nextState ? millingOperator : undefined;

    endB.isMillingMarked = nextState;
    endB.millingTimestamp = nextState ? nowStr : undefined;
    endB.millingOperator = nextState ? millingOperator : undefined;

    // Check if entire set is completed
    let allJointsMarked = true;
    for (let j = 1; j <= numberOfJoints; j++) {
      if (!isJointMillingMarked(newSet, j)) {
        allJointsMarked = false;
        break;
      }
    }
    newSet.isMillingCompleted = allJointsMarked;

    onUpdateSet(setIdx, newSet);
  };

  // Toggle laser check for a specific joint
  const handleToggleLaserJoint = (setIdx: number, jointIdx: number) => {
    const targetSet = sets[setIdx];
    if (!targetSet) return;

    const newSet = JSON.parse(JSON.stringify(targetSet)) as InspectionSet;
    const isCurrentlyEngraved = isJointLaserEngraved(newSet, jointIdx);
    const nowStr = new Date().toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    // Ensure joint ends exist
    if (!newSet.jointEnds) newSet.jointEnds = [];

    // Find or create end A and B
    let endA = newSet.jointEnds.find(j => j.jointIndex === jointIdx && j.side === 'A');
    if (!endA) {
      endA = {
        id: `joint-${jointIdx}-A`,
        label: `Emenda ${jointIdx}A`,
        jointIndex: jointIdx,
        side: 'A',
        nominalE: config.nominalEJoints[(jointIdx - 1) * 2] || 30,
        variation: 0
      };
      newSet.jointEnds.push(endA);
    }

    let endB = newSet.jointEnds.find(j => j.jointIndex === jointIdx && j.side === 'B');
    if (!endB) {
      endB = {
        id: `joint-${jointIdx}-B`,
        label: `Emenda ${jointIdx}B`,
        jointIndex: jointIdx,
        side: 'B',
        nominalE: config.nominalEJoints[(jointIdx - 1) * 2 + 1] || 30,
        variation: 0
      };
      newSet.jointEnds.push(endB);
    }

    // Toggle
    const nextState = !isCurrentlyEngraved;
    endA.isLaserEngraved = nextState;
    endA.laserTimestamp = nextState ? nowStr : undefined;
    endA.laserOperator = nextState ? laserOperator : undefined;

    endB.isLaserEngraved = nextState;
    endB.laserTimestamp = nextState ? nowStr : undefined;
    endB.laserOperator = nextState ? laserOperator : undefined;

    // Check if entire set is completed
    let allJointsEngraved = true;
    for (let j = 1; j <= numberOfJoints; j++) {
      if (!isJointLaserEngraved(newSet, j)) {
        allJointsEngraved = false;
        break;
      }
    }
    newSet.isLaserCompleted = allJointsEngraved;

    onUpdateSet(setIdx, newSet);
  };

  // Toggle entire set for milling
  const handleToggleEntireMillingSet = (setIdx: number) => {
    const targetSet = sets[setIdx];
    if (!targetSet) return;

    const newSet = JSON.parse(JSON.stringify(targetSet)) as InspectionSet;
    const isCompleted = Boolean(newSet.isMillingCompleted);
    const nextState = !isCompleted;
    const nowStr = new Date().toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    if (!newSet.jointEnds) newSet.jointEnds = [];

    for (let j = 1; j <= numberOfJoints; j++) {
      let endA = newSet.jointEnds.find(e => e.jointIndex === j && e.side === 'A');
      if (!endA) {
        endA = {
          id: `joint-${j}-A`,
          label: `Emenda ${j}A`,
          jointIndex: j,
          side: 'A',
          nominalE: config.nominalEJoints[(j - 1) * 2] || 30,
          variation: 0
        };
        newSet.jointEnds.push(endA);
      }
      let endB = newSet.jointEnds.find(e => e.jointIndex === j && e.side === 'B');
      if (!endB) {
        endB = {
          id: `joint-${j}-B`,
          label: `Emenda ${j}B`,
          jointIndex: j,
          side: 'B',
          nominalE: config.nominalEJoints[(j - 1) * 2 + 1] || 30,
          variation: 0
        };
        newSet.jointEnds.push(endB);
      }

      endA.isMillingMarked = nextState;
      endA.millingTimestamp = nextState ? nowStr : undefined;
      endA.millingOperator = nextState ? millingOperator : undefined;

      endB.isMillingMarked = nextState;
      endB.millingTimestamp = nextState ? nowStr : undefined;
      endB.millingOperator = nextState ? millingOperator : undefined;
    }

    newSet.isMillingCompleted = nextState;
    onUpdateSet(setIdx, newSet);
  };

  // Toggle entire set for laser
  const handleToggleEntireLaserSet = (setIdx: number) => {
    const targetSet = sets[setIdx];
    if (!targetSet) return;

    const newSet = JSON.parse(JSON.stringify(targetSet)) as InspectionSet;
    const isCompleted = Boolean(newSet.isLaserCompleted);
    const nextState = !isCompleted;
    const nowStr = new Date().toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    if (!newSet.jointEnds) newSet.jointEnds = [];

    for (let j = 1; j <= numberOfJoints; j++) {
      let endA = newSet.jointEnds.find(e => e.jointIndex === j && e.side === 'A');
      if (!endA) {
        endA = {
          id: `joint-${j}-A`,
          label: `Emenda ${j}A`,
          jointIndex: j,
          side: 'A',
          nominalE: config.nominalEJoints[(j - 1) * 2] || 30,
          variation: 0
        };
        newSet.jointEnds.push(endA);
      }
      let endB = newSet.jointEnds.find(e => e.jointIndex === j && e.side === 'B');
      if (!endB) {
        endB = {
          id: `joint-${j}-B`,
          label: `Emenda ${j}B`,
          jointIndex: j,
          side: 'B',
          nominalE: config.nominalEJoints[(j - 1) * 2 + 1] || 30,
          variation: 0
        };
        newSet.jointEnds.push(endB);
      }

      endA.isLaserEngraved = nextState;
      endA.laserTimestamp = nextState ? nowStr : undefined;
      endA.laserOperator = nextState ? laserOperator : undefined;

      endB.isLaserEngraved = nextState;
      endB.laserTimestamp = nextState ? nowStr : undefined;
      endB.laserOperator = nextState ? laserOperator : undefined;
    }

    newSet.isLaserCompleted = nextState;
    onUpdateSet(setIdx, newSet);
  };

  // Mark all sets as completed for milling
  const handleMarkAllMilling = (completed: boolean) => {
    const nowStr = new Date().toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    sets.forEach((set, sIdx) => {
      const newSet = JSON.parse(JSON.stringify(set)) as InspectionSet;
      if (!newSet.jointEnds) newSet.jointEnds = [];

      for (let j = 1; j <= numberOfJoints; j++) {
        let endA = newSet.jointEnds.find(e => e.jointIndex === j && e.side === 'A');
        if (!endA) {
          endA = {
            id: `joint-${j}-A`,
            label: `Emenda ${j}A`,
            jointIndex: j,
            side: 'A',
            nominalE: config.nominalEJoints[(j - 1) * 2] || 30,
            variation: 0
          };
          newSet.jointEnds.push(endA);
        }
        let endB = newSet.jointEnds.find(e => e.jointIndex === j && e.side === 'B');
        if (!endB) {
          endB = {
            id: `joint-${j}-B`,
            label: `Emenda ${j}B`,
            jointIndex: j,
            side: 'B',
            nominalE: config.nominalEJoints[(j - 1) * 2 + 1] || 30,
            variation: 0
          };
          newSet.jointEnds.push(endB);
        }

        endA.isMillingMarked = completed;
        endA.millingTimestamp = completed ? nowStr : undefined;
        endA.millingOperator = completed ? millingOperator : undefined;

        endB.isMillingMarked = completed;
        endB.millingTimestamp = completed ? nowStr : undefined;
        endB.millingOperator = completed ? millingOperator : undefined;
      }

      newSet.isMillingCompleted = completed;
      onUpdateSet(sIdx, newSet);
    });
  };

  // Mark all sets as completed for laser
  const handleMarkAllLaser = (completed: boolean) => {
    const nowStr = new Date().toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    sets.forEach((set, sIdx) => {
      const newSet = JSON.parse(JSON.stringify(set)) as InspectionSet;
      if (!newSet.jointEnds) newSet.jointEnds = [];

      for (let j = 1; j <= numberOfJoints; j++) {
        let endA = newSet.jointEnds.find(e => e.jointIndex === j && e.side === 'A');
        if (!endA) {
          endA = {
            id: `joint-${j}-A`,
            label: `Emenda ${j}A`,
            jointIndex: j,
            side: 'A',
            nominalE: config.nominalEJoints[(j - 1) * 2] || 30,
            variation: 0
          };
          newSet.jointEnds.push(endA);
        }
        let endB = newSet.jointEnds.find(e => e.jointIndex === j && e.side === 'B');
        if (!endB) {
          endB = {
            id: `joint-${j}-B`,
            label: `Emenda ${j}B`,
            jointIndex: j,
            side: 'B',
            nominalE: config.nominalEJoints[(j - 1) * 2 + 1] || 30,
            variation: 0
          };
          newSet.jointEnds.push(endB);
        }

        endA.isLaserEngraved = completed;
        endA.laserTimestamp = completed ? nowStr : undefined;
        endA.laserOperator = completed ? laserOperator : undefined;

        endB.isLaserEngraved = completed;
        endB.laserTimestamp = completed ? nowStr : undefined;
        endB.laserOperator = completed ? laserOperator : undefined;
      }

      newSet.isLaserCompleted = completed;
      onUpdateSet(sIdx, newSet);
    });
  };

  // Metrology calculations for active joint
  const jointAIndex = (validJointIdx - 1) * 2;
  const jointBIndex = (validJointIdx - 1) * 2 + 1;
  const nominalEmendaA = config.nominalEJoints[jointAIndex] ?? config.nominalEJoints[0] ?? 30;
  const nominalEmendaB = config.nominalEJoints[jointBIndex] ?? config.nominalEJoints[1] ?? config.nominalEJoints[0] ?? 30;
  const caliperEmendaA = calculateTheoreticalCaliper(nominalEmendaA, config.holeDiameter);
  const caliperEmendaB = calculateTheoreticalCaliper(nominalEmendaB, config.holeDiameter);

  // Overall Statistics for both Milling and Laser
  const totalJointsInBatch = sets.length * numberOfJoints;
  let totalMillingMarkedJoints = 0;
  let totalLaserEngravedJoints = 0;
  let completedMillingSetsCount = 0;
  let completedLaserSetsCount = 0;

  sets.forEach(set => {
    let setAllMillingMarked = true;
    let setAllLaserEngraved = true;
    for (let j = 1; j <= numberOfJoints; j++) {
      if (isJointMillingMarked(set, j)) {
        totalMillingMarkedJoints++;
      } else {
        setAllMillingMarked = false;
      }
      if (isJointLaserEngraved(set, j)) {
        totalLaserEngravedJoints++;
      } else {
        setAllLaserEngraved = false;
      }
    }
    if (setAllMillingMarked && numberOfJoints > 0) {
      completedMillingSetsCount++;
    }
    if (setAllLaserEngraved && numberOfJoints > 0) {
      completedLaserSetsCount++;
    }
  });

  // Progress: 0-50% for milling, 50-100% for laser
  const millingProgress = totalJointsInBatch > 0 
    ? (totalMillingMarkedJoints / totalJointsInBatch) * 50 
    : 0;
  const laserProgress = totalJointsInBatch > 0 
    ? (totalLaserEngravedJoints / totalJointsInBatch) * 50 
    : 0;
  const totalProgress = millingProgress + laserProgress;

  const isCurrentJointMillingMarked = isJointMillingMarked(currentSet, validJointIdx);
  const currentJointMillingTimestamp = getJointMillingTimestamp(currentSet, validJointIdx);
  const isCurrentJointLaserEngraved = isJointLaserEngraved(currentSet, validJointIdx);
  const currentJointLaserTimestamp = getJointLaserTimestamp(currentSet, validJointIdx);

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* 1. CABEÇALHO RÁPIDO DO FRESADOR & DADOS ESSENCIAIS                         */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Stamp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white uppercase tracking-tight">
                  Instruções de Fresa & Gravação a Laser
                </h2>
                <span className="text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded">
                  Fresa + Gravação
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Identificação de emendas das guias, cotas de usinagem e checklist de gravação na máquina laser
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Imprimir Ficha de Fresa</span>
          </button>
        </div>

        {/* Form Fields: Dados da Produção, Gravação na Fresa, Modelo da Guia & Peças, Furo */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pt-4">
          
          {/* DADOS DA PRODUÇÃO */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <User className="w-3 h-3 text-cyan-400" />
              <span>DADOS DA PRODUÇÃO</span>
            </span>
            <div className="space-y-1.5">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">OP (Ordem de Produção):</span>
                <input
                  type="text"
                  value={config.opNumber || ''}
                  onChange={(e) => onUpdateConfig({ ...config, opNumber: e.target.value })}
                  placeholder="053-01-001"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5"># Item:</span>
                <input
                  type="text"
                  value={config.itemNumber || ''}
                  onChange={(e) => onUpdateConfig({ ...config, itemNumber: e.target.value })}
                  placeholder="01"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Pedido de Venda:</span>
                <input
                  type="text"
                  value={config.salesOrder || ''}
                  onChange={(e) => onUpdateConfig({ ...config, salesOrder: e.target.value })}
                  placeholder="PV-001"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* GRAVAÇÃO NA FRESA */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <Stamp className="w-3 h-3 text-amber-400" />
              <span>GRAVAÇÃO NA FRESA</span>
            </span>
            <div className="space-y-1.5">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Formato de Gravação das Emendas:</span>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ ...config, engravingPattern: 'LETTERS_NUMBERS' })}
                    className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                      currentPattern === 'LETTERS_NUMBERS'
                        ? 'bg-amber-950 border-amber-700 text-amber-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    Padrão Letras e Números
                    <span className="block text-[9px] text-slate-500 font-normal">Conj. A: A1-A1, A2-A2 - Conj. B: B1-B1, B2-B2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ ...config, engravingPattern: 'LETTERS_ONLY' })}
                    className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                      currentPattern === 'LETTERS_ONLY'
                        ? 'bg-amber-950 border-amber-700 text-amber-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    Padrão de Letras
                    <span className="block text-[9px] text-slate-500 font-normal">A-A, B-B, C-C, D-D (Letras Casadas)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ ...config, engravingPattern: 'SEQUENTIAL' })}
                    className={`w-full text-left px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                      currentPattern === 'SEQUENTIAL'
                        ? 'bg-amber-950 border-amber-700 text-amber-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    Padrão Sequencial Letras e Números
                    <span className="block text-[9px] text-slate-500 font-normal">Conj. A: A1-B1, A2-B2 - Conj. B: C1-D1, C2-D2</span>
                  </button>
                </div>
              </div>
              <div className="pt-1">
                <span className="text-[10px] text-slate-400 block mb-0.5">Marcações na Fresa (1 conj. / {numberOfJoints} em.):</span>
                <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono text-cyan-300">
                  {currentSetNumber}°-{currentSetLetter}: {Array.from({ length: numberOfJoints }).map((_, j) => {
                    const jNum = j + 1;
                    const lbl = getEngravingJointLabels(jNum, currentSetLetter, currentPattern);
                    return `[${lbl.leftMark} ${lbl.rightMark}]`;
                  }).join(' ')}
                </div>
              </div>
            </div>
          </div>

          {/* MODELO DA GUIA & PEÇAS */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>MODELO DA GUIA & PEÇAS</span>
            </span>
            <div className="space-y-1.5">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Catálogo HIWIN:</span>
                <select
                  value={config.modelId}
                  onChange={(e) => {
                    const m = getHiwinModel(e.target.value);
                    onUpdateConfig({
                      ...config,
                      modelId: m.id,
                      holeDiameter: config.measurementReference === 'through_hole' ? m.throughHoleDiameter : m.counterboreDiameter
                    });
                  }}
                  className="w-full bg-slate-900 border border-cyan-700/60 rounded px-2 py-1 text-xs text-cyan-200 font-medium focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {HIWIN_GUIDE_CATALOG.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} - D={m.counterboreDiameter}mm
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Conjuntos:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onChangeNumberOfSets(Math.max(1, sets.length - 1))}
                      className="bg-slate-800 hover:bg-slate-700 text-white w-6 h-6 rounded text-xs font-bold"
                    >
                      -
                    </button>
                    <span className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-cyan-300 text-center flex-1">
                      {sets.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => onChangeNumberOfSets(sets.length + 1)}
                      className="bg-slate-800 hover:bg-slate-700 text-white w-6 h-6 rounded text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Emendas:</span>
                  <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-cyan-300 text-center">
                    {numberOfJoints}
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {numberOfPieces} Peças / Guia
              </div>
            </div>
          </div>

          {/* FURO (Ø) */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>FURO (Ø)</span>
            </span>
            <div className="space-y-1.5">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Diâmetro:</span>
                <input
                  type="number"
                  value={config.holeDiameter}
                  onChange={(e) => onUpdateConfig({ ...config, holeDiameter: parseFloat(e.target.value) || 14 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Raio r:</span>
                <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-cyan-300">
                  {(config.holeDiameter / 2).toFixed(2)} mm
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ ...config, holeDiameter: selectedModel.counterboreDiameter })}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono font-bold"
                >
                  D({selectedModel.counterboreDiameter})
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateConfig({ ...config, holeDiameter: selectedModel.throughHoleDiameter })}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono font-bold"
                >
                  d({selectedModel.throughHoleDiameter})
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. ESQUEMA TÉCNICO VISUAL COM MARCAÇÃO DE FRESA                           */}
      {/* ========================================================================= */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
        
        {/* Navigation & Joint Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Esquema da Fresa:
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {sets.map((s, idx) => {
                const sLetter = s.letter || String.fromCharCode(65 + (idx % 26));
                const sNum = idx + 1;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSetIndex(idx)}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                      selectedSetIndex === idx
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sNum}° ({sLetter})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emenda selector within current set */}
          {numberOfJoints > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Emenda:</span>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                {Array.from({ length: numberOfJoints }).map((_, j) => {
                  const jNum = j + 1;
                  const lbl = getEngravingJointLabels(jNum, currentSetLetter, currentPattern);

                  return (
                    <button
                      key={jNum}
                      type="button"
                      onClick={() => setActiveJointIndex(jNum)}
                      className={`px-2.5 py-1 rounded font-mono transition-colors ${
                        validJointIdx === jNum
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      Em. {jNum} [{lbl.leftMark}-{lbl.rightMark}]
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SVG DRAWING FOR THE MILLING MACHINIST                       */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 relative overflow-hidden">
          
          <div className="flex items-center justify-between text-xs font-mono mb-2 pb-1 border-b border-slate-900">
            <div className="flex items-center gap-2">
              <span className="text-slate-200 font-bold">
                {currentSetNumber}° CONJUNTO ({currentSetLetter}) · EMENDA {validJointIdx} DE {numberOfJoints}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">
                União da Peça {validJointIdx} com a Peça {validJointIdx + 1}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 flex items-center gap-1">
                <Stamp className="w-3 h-3 text-amber-400" />
                MARCAÇÃO DA FRESA
              </span>
              {isCurrentJointMillingMarked && (
                <span className="text-[10px] font-bold font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  MARCADO ({currentJointMillingTimestamp || 'OK'})
                </span>
              )}
            </div>
          </div>

          <div className="w-full overflow-x-auto py-2">
            <svg viewBox="0 0 1000 170" className="w-full min-w-[760px] h-auto select-none">
              <defs>
                <linearGradient id="fresaSteelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="30%" stopColor="#64748b" />
                  <stop offset="70%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <marker id="arrowCyanFresa" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#06b6d4" />
                </marker>
                <marker id="arrowGreenFresa" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#10b981" />
                </marker>
              </defs>

              {/* RAIL SEGMENT 1 (PEÇA k) */}
              <g id="rail-piece-1">
                <rect x="50" y="45" width="445" height="52" rx="3" fill="url(#fresaSteelGrad)" stroke="#334155" strokeWidth="1.5" />
                <rect x="50" y="60" width="445" height="6" fill="#0f172a" />
                <rect x="50" y="76" width="445" height="6" fill="#0f172a" />

                {/* Splice Hole (Face A) */}
                <g transform="translate(420, 71)">
                  <circle r="17" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                  <circle r="10" fill="#020617" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3,2" />
                  <line x1="-20" y1="0" x2="20" y2="0" stroke="#059669" strokeWidth="1" strokeDasharray="3,2" />
                  <line x1="0" y1="-20" x2="0" y2="20" stroke="#059669" strokeWidth="1" strokeDasharray="3,2" />
                </g>

                {/* Intermediate decorative Hole */}
                <g transform="translate(240, 71)" opacity="0.4">
                  <circle r="17" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                  <circle r="10" fill="#020617" stroke="#94a3b8" strokeWidth="1" />
                </g>

                {/* Initial Hole */}
                <g transform="translate(100, 71)" opacity="0.5">
                  <circle r="17" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1" />
                  <circle r="10" fill="#020617" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,2" />
                </g>

                {/* ENGRAVING STAMP FACE A (Dynamic Color: Green if Milling marked, Amber if Pending) */}
                <g transform="translate(450, 48)">
                  <rect 
                    x="0" 
                    y="0" 
                    width="38" 
                    height="22" 
                    rx="3" 
                    fill={isCurrentJointMillingMarked ? '#064e3b' : '#451a03'} 
                    stroke={isCurrentJointMillingMarked ? '#10b981' : '#f59e0b'} 
                    strokeWidth="1.5" 
                  />
                  <text 
                    x="19" 
                    y="15" 
                    fill={isCurrentJointMillingMarked ? '#6ee7b7' : '#fbbf24'} 
                    fontSize="11" 
                    fontFamily="monospace" 
                    fontWeight="900" 
                    textAnchor="middle"
                  >
                    {activeLabels.leftMark}
                  </text>
                </g>

                <text x="60" y="34" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold">
                  PEÇA {validJointIdx} · GRAVAÇÃO: [{activeLabels.leftMark}]
                </text>
              </g>

              {/* SPLICE LINE / JUNTA RETIFICADA NO CENTRO */}
              <g id="splice-line">
                <line x1="500" y1="25" x2="500" y2="105" stroke="#f59e0b" strokeWidth="3" strokeDasharray="4,2" />
                <rect 
                  x="400" 
                  y="12" 
                  width="200" 
                  height="22" 
                  rx="4" 
                  fill={isCurrentJointMillingMarked ? '#064e3b' : '#713f12'} 
                  stroke={isCurrentJointMillingMarked ? '#10b981' : '#f59e0b'} 
                  strokeWidth="1.5" 
                />
                <text 
                  x="500" 
                  y="27" 
                  fill={isCurrentJointMillingMarked ? '#d1fae5' : '#fef08a'} 
                  fontSize="10" 
                  fontFamily="monospace" 
                  fontWeight="bold" 
                  textAnchor="middle"
                >
                  ⚡ EMENDA {validJointIdx}: [{activeLabels.leftMark} | {activeLabels.rightMark}]
                </text>
              </g>

              {/* RAIL SEGMENT 2 (PEÇA k+1) */}
              <g id="rail-piece-2">
                <rect x="505" y="45" width="445" height="52" rx="3" fill="url(#fresaSteelGrad)" stroke="#334155" strokeWidth="1.5" />
                <rect x="505" y="60" width="445" height="6" fill="#0f172a" />
                <rect x="505" y="76" width="445" height="6" fill="#0f172a" />

                {/* ENGRAVING STAMP FACE B (Dynamic Color: Green if Milling marked, Amber if Pending) */}
                <g transform="translate(512, 48)">
                  <rect 
                    x="0" 
                    y="0" 
                    width="38" 
                    height="22" 
                    rx="3" 
                    fill={isCurrentJointMillingMarked ? '#064e3b' : '#451a03'} 
                    stroke={isCurrentJointMillingMarked ? '#10b981' : '#f59e0b'} 
                    strokeWidth="1.5" 
                  />
                  <text 
                    x="19" 
                    y="15" 
                    fill={isCurrentJointMillingMarked ? '#6ee7b7' : '#fbbf24'} 
                    fontSize="11" 
                    fontFamily="monospace" 
                    fontWeight="900" 
                    textAnchor="middle"
                  >
                    {activeLabels.rightMark}
                  </text>
                </g>

                {/* Splice Hole (Face B) */}
                <g transform="translate(580, 71)">
                  <circle r="17" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                  <circle r="10" fill="#020617" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3,2" />
                  <line x1="-20" y1="0" x2="20" y2="0" stroke="#059669" strokeWidth="1" strokeDasharray="3,2" />
                  <line x1="0" y1="-20" x2="0" y2="20" stroke="#059669" strokeWidth="1" strokeDasharray="3,2" />
                </g>

                {/* Intermediate decorative Hole */}
                <g transform="translate(760, 71)" opacity="0.4">
                  <circle r="17" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                  <circle r="10" fill="#020617" stroke="#94a3b8" strokeWidth="1" />
                </g>

                {/* Final Hole */}
                <g transform="translate(900, 71)" opacity="0.5">
                  <circle r="17" fill="#0f172a" stroke="#0ea5e9" strokeWidth="1" />
                  <circle r="10" fill="#020617" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,2" />
                </g>

                <text x="940" y="34" fill="#94a3b8" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  PEÇA {validJointIdx + 1} · GRAVAÇÃO: [{activeLabels.rightMark}]
                </text>
              </g>

              {/* ========================================================= */}
              {/* DIMENSIONS: COTA E NOMINAL DA FRESA E LEITURA NO PAQUÍMETRO */}
              {/* ========================================================= */}
              
              {/* Dimension Face A */}
              <g id="dim-face-a">
                <line x1="420" y1="88" x2="420" y2="135" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="500" y1="97" x2="500" y2="135" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="424" y1="120" x2="496" y2="120" stroke="#10b981" strokeWidth="1.5" markerStart="url(#arrowGreenFresa)" markerEnd="url(#arrowGreenFresa)" />
                
                <rect x="360" y="130" width="130" height="34" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                <text x="425" y="144" fill="#d1fae5" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  Cota E ({activeLabels.leftMark}): {nominalEmendaA} mm
                </text>
                <text x="425" y="157" fill="#6ee7b7" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  Paquímetro: {caliperEmendaA.toFixed(2)} mm
                </text>
              </g>

              {/* Dimension Face B */}
              <g id="dim-face-b">
                <line x1="500" y1="97" x2="500" y2="135" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="580" y1="88" x2="580" y2="135" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="504" y1="120" x2="576" y2="120" stroke="#10b981" strokeWidth="1.5" markerStart="url(#arrowGreenFresa)" markerEnd="url(#arrowGreenFresa)" />

                <rect x="510" y="130" width="130" height="34" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                <text x="575" y="144" fill="#d1fae5" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  Cota E ({activeLabels.rightMark}): {nominalEmendaB} mm
                </text>
                <text x="575" y="157" fill="#6ee7b7" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  Paquímetro: {caliperEmendaB.toFixed(2)} mm
                </text>
              </g>

            </svg>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. CHECKLIST & CONFERÊNCIA - FRESA (50%) + GRAVAÇÃO LASER (50%)         */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
        
        {/* Header with Progress Bar & Batch Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>Checklist: Fresa (50%) + Gravação Laser (50%)</span>
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {totalProgress.toFixed(0)}% Concluído
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Fresa: {totalMillingMarkedJoints}/{totalJointsInBatch} marcadas · Laser: {totalLaserEngravedJoints}/{totalJointsInBatch} gravadas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400">Operador Fresa:</span>
              <input
                type="text"
                value={millingOperator}
                onChange={(e) => setMillingOperator(e.target.value)}
                placeholder="Nome do Operador..."
                className="bg-transparent text-amber-300 font-medium focus:outline-none w-28 text-xs font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400">Operador Laser:</span>
              <input
                type="text"
                value={laserOperator}
                onChange={(e) => setLaserOperator(e.target.value)}
                placeholder="Nome do Operador..."
                className="bg-transparent text-cyan-300 font-medium focus:outline-none w-28 text-xs font-mono"
              />
            </div>

            <button
              type="button"
              onClick={() => handleMarkAllMilling(true)}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Marcar Fresa
            </button>

            <button
              type="button"
              onClick={() => handleMarkAllLaser(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Marcar Laser
            </button>

            <button
              type="button"
              onClick={() => { handleMarkAllMilling(false); handleMarkAllLaser(false); }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
            >
              Desmarcar Tudo
            </button>
          </div>

        </div>

        {/* Visual Progress Bar - Divided: 50% Milling + 50% Laser */}
        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 flex">
          <div 
            className="bg-gradient-to-r from-amber-500 to-amber-400 h-3 transition-all duration-500"
            style={{ width: `${millingProgress}%` }}
          ></div>
          <div 
            className="bg-gradient-to-r from-cyan-500 via-emerald-500 to-emerald-400 h-3 transition-all duration-500"
            style={{ width: `${laserProgress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>Fresa: {millingProgress.toFixed(0)}%</span>
          <span>Gravação Laser: {laserProgress.toFixed(0)}%</span>
        </div>

        {/* Two Matrix Grids Side by Side: Milling and Laser */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* CHECKLIST DA FRESA (Marcação Manual) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-900/50">
              <Stamp className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                Checklist da Fresa (Marcação Manual)
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                {totalMillingMarkedJoints} / {totalJointsInBatch}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sets.map((set, sIdx) => {
                const sNum = sIdx + 1;
                const sLetter = set.letter || String.fromCharCode(65 + (sIdx % 26));
                const isSetDone = Boolean(set.isMillingCompleted);

                return (
                  <div 
                    key={set.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isSetDone 
                        ? 'bg-amber-950/30 border-amber-800/80 ring-1 ring-amber-500/20' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Card Set Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                          isSetDone 
                            ? 'bg-amber-500 text-slate-950' 
                            : 'bg-slate-800 text-amber-300'
                        }`}>
                          {sLetter}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {sNum}° - {sLetter}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleEntireMillingSet(sIdx)}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-colors ${
                          isSetDone
                            ? 'bg-amber-900/60 text-amber-300 border border-amber-700 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-700'
                            : 'bg-slate-800 text-slate-300 hover:bg-amber-800 hover:text-white'
                        }`}
                      >
                        {isSetDone ? '✓ OK' : 'Marcar'}
                      </button>
                    </div>

                    {/* List of Joint Rows for this Set */}
                    <div className="space-y-1.5">
                      {Array.from({ length: numberOfJoints }).map((_, j) => {
                        const jNum = j + 1;
                        const lbl = getEngravingJointLabels(jNum, sLetter, currentPattern);
                        const isDone = isJointMillingMarked(set, jNum);
                        const timestamp = getJointMillingTimestamp(set, jNum);

                        return (
                          <div 
                            key={jNum}
                            onClick={() => handleToggleMillingJoint(sIdx, jNum)}
                            className={`p-1.5 rounded border cursor-pointer select-none transition-all flex items-center justify-between ${
                              isDone
                                ? 'bg-amber-950/60 border-amber-700/80 hover:bg-amber-900/50'
                                : 'bg-slate-900/80 border-slate-800 hover:border-amber-600/80 hover:bg-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              )}
                              <div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-slate-200">
                                    Em. {jNum}
                                  </span>
                                  <span className={`text-[9px] font-mono font-black px-1 py-0.5 rounded border ${
                                    isDone 
                                      ? 'bg-amber-900 text-amber-200 border-amber-600' 
                                      : 'bg-amber-950 text-amber-300 border-amber-800'
                                  }`}>
                                    [{lbl.leftMark}]
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className={`text-[9px] font-bold block ${
                                isDone ? 'text-amber-300' : 'text-amber-400'
                              }`}>
                                {isDone ? 'MARCADO' : 'PENDENTE'}
                              </span>
                              {isDone && timestamp && (
                                <span className="text-[8px] text-slate-400 font-mono block">
                                  {timestamp}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* CHECKLIST DA GRAVAÇÃO LASER (Qualidade) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-emerald-900/50">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
                Checklist da Gravação Laser (Qualidade)
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {totalLaserEngravedJoints} / {totalJointsInBatch}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sets.map((set, sIdx) => {
                const sNum = sIdx + 1;
                const sLetter = set.letter || String.fromCharCode(65 + (sIdx % 26));
                const isSetDone = Boolean(set.isLaserCompleted);

                return (
                  <div 
                    key={set.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isSetDone 
                        ? 'bg-emerald-950/30 border-emerald-800/80 ring-1 ring-emerald-500/20' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Card Set Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                          isSetDone 
                            ? 'bg-emerald-500 text-slate-950' 
                            : 'bg-slate-800 text-emerald-300'
                        }`}>
                          {sLetter}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {sNum}° - {sLetter}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleEntireLaserSet(sIdx)}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-colors ${
                          isSetDone
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-700'
                            : 'bg-slate-800 text-slate-300 hover:bg-emerald-800 hover:text-white'
                        }`}
                      >
                        {isSetDone ? '✓ OK' : 'Marcar'}
                      </button>
                    </div>

                    {/* List of Joint Rows for this Set */}
                    <div className="space-y-1.5">
                      {Array.from({ length: numberOfJoints }).map((_, j) => {
                        const jNum = j + 1;
                        const lbl = getEngravingJointLabels(jNum, sLetter, currentPattern);
                        const isDone = isJointLaserEngraved(set, jNum);
                        const timestamp = getJointLaserTimestamp(set, jNum);

                        return (
                          <div 
                            key={jNum}
                            onClick={() => handleToggleLaserJoint(sIdx, jNum)}
                            className={`p-1.5 rounded border cursor-pointer select-none transition-all flex items-center justify-between ${
                              isDone
                                ? 'bg-emerald-950/60 border-emerald-700/80 hover:bg-emerald-900/50'
                                : 'bg-slate-900/80 border-slate-800 hover:border-emerald-600/80 hover:bg-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              )}
                              <div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-slate-200">
                                    Em. {jNum}
                                  </span>
                                  <span className={`text-[9px] font-mono font-black px-1 py-0.5 rounded border ${
                                    isDone 
                                      ? 'bg-emerald-900 text-emerald-200 border-emerald-600' 
                                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                  }`}>
                                    [{lbl.leftMark}]
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className={`text-[9px] font-bold block ${
                                isDone ? 'text-emerald-300' : 'text-emerald-400'
                              }`}>
                                {isDone ? 'GRAVADO' : 'PENDENTE'}
                              </span>
                              {isDone && timestamp && (
                                <span className="text-[8px] text-slate-400 font-mono block">
                                  {timestamp}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
