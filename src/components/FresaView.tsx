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
  const [operatorName, setOperatorName] = useState<string>('Operador Laser');

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
    endA.laserOperator = nextState ? operatorName : undefined;

    endB.isLaserEngraved = nextState;
    endB.laserTimestamp = nextState ? nowStr : undefined;
    endB.laserOperator = nextState ? operatorName : undefined;

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

  // Toggle entire set
  const handleToggleEntireSet = (setIdx: number) => {
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
      endA.laserOperator = nextState ? operatorName : undefined;

      endB.isLaserEngraved = nextState;
      endB.laserTimestamp = nextState ? nowStr : undefined;
      endB.laserOperator = nextState ? operatorName : undefined;
    }

    newSet.isLaserCompleted = nextState;
    onUpdateSet(setIdx, newSet);
  };

  // Mark all sets as completed
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
        endA.laserOperator = completed ? operatorName : undefined;

        endB.isLaserEngraved = completed;
        endB.laserTimestamp = completed ? nowStr : undefined;
        endB.laserOperator = completed ? operatorName : undefined;
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

  // Overall Laser Statistics
  const totalJointsInBatch = sets.length * numberOfJoints;
  let totalEngravedJoints = 0;
  let completedSetsCount = 0;

  sets.forEach(set => {
    let setAllEngraved = true;
    for (let j = 1; j <= numberOfJoints; j++) {
      if (isJointLaserEngraved(set, j)) {
        totalEngravedJoints++;
      } else {
        setAllEngraved = false;
      }
    }
    if (setAllEngraved && numberOfJoints > 0) {
      completedSetsCount++;
    }
  });

  const progressPercent = totalJointsInBatch > 0 
    ? Math.round((totalEngravedJoints / totalJointsInBatch) * 100) 
    : 0;

  const isCurrentJointEngraved = isJointLaserEngraved(currentSet, validJointIdx);
  const currentJointTimestamp = getJointLaserTimestamp(currentSet, validJointIdx);

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

        {/* Form Fields: Cliente, Item, OP, PV, Modelo, Conjuntos, Emendas e Padrão */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          
          {/* Campo 1: Nome do Cliente */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <User className="w-3 h-3 text-cyan-400" />
              <span>Nome do Cliente:</span>
            </span>
            <input
              type="text"
              value={config.client || ''}
              onChange={(e) => onUpdateConfig({ ...config, client: e.target.value })}
              placeholder="Digite o nome do cliente..."
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Campo 2: Item da OP */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <Hash className="w-3 h-3 text-cyan-400" />
              <span>Número do Item:</span>
            </span>
            <input
              type="text"
              value={config.itemNumber || ''}
              onChange={(e) => onUpdateConfig({ ...config, itemNumber: e.target.value })}
              placeholder="Ex: 01"
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Campo 3: Modelo da Guia (HIWIN) */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Modelo da Guia Linear:</span>
            </span>
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
                  {m.name} (Ø {m.counterboreDiameter}mm)
                </option>
              ))}
            </select>
          </div>

          {/* Campo 4: Quantidade de Conjuntos & Emendas */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span>Conjuntos & Emendas:</span>
              <span className="text-amber-400 font-mono font-bold text-xs">
                {sets.length} conj. / {numberOfJoints} em. ({numberOfPieces} peças)
              </span>
            </span>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => onUpdateConfig({
                  ...config,
                  engravingPattern: config.engravingPattern === 'LETTERS_NUMBERS' ? 'LETTERS_ONLY' : 'LETTERS_NUMBERS'
                })}
                className="bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-900/60 px-2 py-1 rounded text-[10px] font-mono font-bold text-center"
              >
                Padrão: {currentPattern === 'LETTERS_ONLY' ? 'A-A, B-B' : 'A1-A1, B1-B1'}
              </button>
              <div className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-400 text-center font-mono">
                Furo Ø {config.holeDiameter}mm
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. ESQUEMA TÉCNICO VISUAL COM MARCAÇÃO DE FRESA & STATUS LASER            */}
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
                const isSetDone = Boolean(s.isLaserCompleted);

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSetIndex(idx)}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                      selectedSetIndex === idx
                        ? 'bg-amber-600 text-white shadow-md'
                        : isSetDone
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{sNum}° ({sLetter})</span>
                    {isSetDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
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
                  const isDone = isJointLaserEngraved(currentSet, jNum);

                  return (
                    <button
                      key={jNum}
                      type="button"
                      onClick={() => setActiveJointIndex(jNum)}
                      className={`px-2.5 py-1 rounded font-mono transition-colors flex items-center gap-1 ${
                        validJointIdx === jNum
                          ? 'bg-cyan-600 text-white font-bold'
                          : isDone
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Em. {jNum} [{lbl.leftMark}-{lbl.rightMark}]</span>
                      {isDone && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Direct Laser Toggle Button for current viewed Joint */}
          <button
            type="button"
            onClick={() => handleToggleLaserJoint(selectedSetIndex, validJointIdx)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
              isCurrentJointEngraved
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/40'
                : 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
            }`}
          >
            {isCurrentJointEngraved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ GRAVADO A LASER ({activeLabels.leftMark}-{activeLabels.rightMark})</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4" />
                <span>MARCAR COMO GRAVADO NA LASER [{activeLabels.leftMark}-{activeLabels.rightMark}]</span>
              </>
            )}
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SVG DRAWING FOR THE MILLING MACHINIST & LASER ENGRAVER       */}
        {/* Letters change dynamically from Amber to Emerald Green!       */}
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
              <span className="text-[10px] text-slate-400">Status no Laser:</span>
              {isCurrentJointEngraved ? (
                <span className="text-[10px] font-bold font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  CONFERIDO & GRAVADO ({currentJointTimestamp || 'OK'})
                </span>
              ) : (
                <span className="text-[10px] font-bold font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  MARCAÇÃO DA FRESA (AGUARDANDO LASER)
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

                {/* ENGRAVING STAMP FACE A (Dynamic Color: Green if Laser checked, Amber if Pending) */}
                <g transform="translate(450, 48)">
                  <rect 
                    x="0" 
                    y="0" 
                    width="38" 
                    height="22" 
                    rx="3" 
                    fill={isCurrentJointEngraved ? '#064e3b' : '#451a03'} 
                    stroke={isCurrentJointEngraved ? '#10b981' : '#f59e0b'} 
                    strokeWidth="1.5" 
                  />
                  <text 
                    x="19" 
                    y="15" 
                    fill={isCurrentJointEngraved ? '#6ee7b7' : '#fbbf24'} 
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
                  fill={isCurrentJointEngraved ? '#064e3b' : '#713f12'} 
                  stroke={isCurrentJointEngraved ? '#10b981' : '#f59e0b'} 
                  strokeWidth="1.5" 
                />
                <text 
                  x="500" 
                  y="27" 
                  fill={isCurrentJointEngraved ? '#d1fae5' : '#fef08a'} 
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

                {/* ENGRAVING STAMP FACE B (Dynamic Color: Green if Laser checked, Amber if Pending) */}
                <g transform="translate(512, 48)">
                  <rect 
                    x="0" 
                    y="0" 
                    width="38" 
                    height="22" 
                    rx="3" 
                    fill={isCurrentJointEngraved ? '#064e3b' : '#451a03'} 
                    stroke={isCurrentJointEngraved ? '#10b981' : '#f59e0b'} 
                    strokeWidth="1.5" 
                  />
                  <text 
                    x="19" 
                    y="15" 
                    fill={isCurrentJointEngraved ? '#6ee7b7' : '#fbbf24'} 
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
      {/* 3. CHECKLIST & CONFERÊNCIA DE GRAVAÇÃO A LASER POR CONJUNTO E EMENDA      */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
        
        {/* Header with Progress Bar & Batch Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span>Checklist de Gravação a Laser & Conferência</span>
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {totalEngravedJoints} / {totalJointsInBatch} Emendas Gravadas ({progressPercent}%)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {sets.length - completedSetsCount > 0 
                ? `Faltam gravar ${sets.length - completedSetsCount} conjunto(s) na máquina laser.`
                : '✓ Todos os conjuntos deste lote foram conferidos e gravados a laser com sucesso!'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400">Operador:</span>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Nome do Operador..."
                className="bg-transparent text-cyan-300 font-medium focus:outline-none w-28 text-xs font-mono"
              />
            </div>

            <button
              type="button"
              onClick={() => handleMarkAllLaser(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Marcar Todos
            </button>

            <button
              type="button"
              onClick={() => handleMarkAllLaser(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
            >
              Desmarcar
            </button>
          </div>

        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div 
            className="bg-gradient-to-r from-cyan-500 via-emerald-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Matrix Grid of All Sets and Their Joints */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-2">
          {sets.map((set, sIdx) => {
            const sNum = sIdx + 1;
            const sLetter = set.letter || String.fromCharCode(65 + (sIdx % 26));
            const isSetDone = Boolean(set.isLaserCompleted);

            return (
              <div 
                key={set.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSetDone 
                    ? 'bg-emerald-950/30 border-emerald-800/80 ring-1 ring-emerald-500/20' 
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Card Set Header */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                      isSetDone 
                        ? 'bg-emerald-500 text-slate-950' 
                        : 'bg-slate-800 text-cyan-300'
                    }`}>
                      {sLetter}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {sNum}° CONJUNTO - {sLetter}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {numberOfPieces} peças · {numberOfJoints} emenda(s)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleEntireSet(sIdx)}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                      isSetDone
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-700'
                        : 'bg-slate-800 text-slate-300 hover:bg-emerald-800 hover:text-white'
                    }`}
                  >
                    {isSetDone ? '✓ Conjunto OK' : 'Marcar Conjunto'}
                  </button>
                </div>

                {/* List of Joint Rows for this Set */}
                <div className="space-y-2">
                  {Array.from({ length: numberOfJoints }).map((_, j) => {
                    const jNum = j + 1;
                    const lbl = getEngravingJointLabels(jNum, sLetter, currentPattern);
                    const isDone = isJointLaserEngraved(set, jNum);
                    const timestamp = getJointLaserTimestamp(set, jNum);

                    return (
                      <div 
                        key={jNum}
                        onClick={() => handleToggleLaserJoint(sIdx, jNum)}
                        className={`p-2 rounded-lg border cursor-pointer select-none transition-all flex items-center justify-between ${
                          isDone
                            ? 'bg-emerald-950/60 border-emerald-700/80 hover:bg-emerald-900/50'
                            : 'bg-slate-900/80 border-slate-800 hover:border-amber-600/80 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-amber-500 shrink-0" />
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-200">
                                Emenda {jNum}
                              </span>
                              <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded border ${
                                isDone 
                                  ? 'bg-emerald-900 text-emerald-200 border-emerald-600' 
                                  : 'bg-amber-950 text-amber-300 border-amber-800'
                              }`}>
                                [{lbl.leftMark} | {lbl.rightMark}]
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Peça {jNum} com Peça {jNum + 1}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-[10px] font-bold block ${
                            isDone ? 'text-emerald-300' : 'text-amber-400'
                          }`}>
                            {isDone ? 'GRAVADO A LASER' : 'PENDENTE'}
                          </span>
                          {isDone && timestamp && (
                            <span className="text-[9px] text-slate-400 font-mono block">
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
  );
};
