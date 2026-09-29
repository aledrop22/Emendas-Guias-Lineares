import React, { useState } from 'react';
import { InspectionSet, OPConfig, JointEnd } from '../types';
import { 
  calculateTheoreticalCaliper, 
  calculateFinalCotaE, 
  checkEndCotaTolerance, 
  checkJointTolerance,
  checkJointPairTolerance,
  checkSetOverallStatus,
  formatMm,
  formatVariation,
  getEngravingJointLabels
} from '../utils/calculations';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  Trash2, 
  Copy, 
  Maximize2, 
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

interface SpreadsheetViewProps {
  sets: InspectionSet[];
  config: OPConfig;
  onUpdateSet: (setIndex: number, updatedSet: InspectionSet) => void;
  onAddSet: () => void;
  onRemoveSet: (setIndex: number) => void;
  onDuplicateSet: (setIndex: number) => void;
  onSelectSetForDiagram?: (set: InspectionSet) => void;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  sets,
  config,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onDuplicateSet,
  onSelectSetForDiagram
}) => {
  // Input mode: either 'variation' (type deviation, default 0) or 'caliper' (type direct measured paquímetro reading)
  const [inputMode, setInputMode] = useState<'variation' | 'caliper'>('variation');
  const [activeSetModal, setActiveSetModal] = useState<number | null>(null);

  const theoreticalInitCaliper = calculateTheoreticalCaliper(config.nominalEInicial, config.holeDiameter);
  const theoreticalFinalCaliper = calculateTheoreticalCaliper(config.nominalEFinal, config.holeDiameter);
  const theoreticalJointCaliper = calculateTheoreticalCaliper(config.nominalEJoints[0] ?? 30, config.holeDiameter);

  // Quick variation updater for a specific value
  const handleVariationChange = (
    setIndex: number, 
    field: 'cotaEInicial' | 'cotaEFinal' | { jointId: string }, 
    valueStr: string
  ) => {
    const currentSet = sets[setIndex];
    const newSet = JSON.parse(JSON.stringify(currentSet)) as InspectionSet;
    const num = valueStr === '' ? 0 : parseFloat(valueStr);
    const validNum = isNaN(num) ? 0 : num;

    if (field === 'cotaEInicial') {
      newSet.cotaEInicial.variation = validNum;
      newSet.cotaEInicial.rawCaliperInput = Number((theoreticalInitCaliper + validNum).toFixed(3));
    } else if (field === 'cotaEFinal') {
      newSet.cotaEFinal.variation = validNum;
      newSet.cotaEFinal.rawCaliperInput = Number((theoreticalFinalCaliper + validNum).toFixed(3));
    } else {
      const joint = newSet.jointEnds.find(j => j.id === field.jointId);
      if (joint) {
        joint.variation = validNum;
        const targetNominal = joint.nominalE || config.nominalEJoints[0] || 30;
        const targetCaliper = calculateTheoreticalCaliper(targetNominal, config.holeDiameter);
        joint.rawCaliperInput = Number((targetCaliper + validNum).toFixed(3));
      }
    }

    onUpdateSet(setIndex, newSet);
  };

  // Direct caliper reading updater
  const handleCaliperChange = (
    setIndex: number,
    field: 'cotaEInicial' | 'cotaEFinal' | { jointId: string },
    caliperStr: string
  ) => {
    const currentSet = sets[setIndex];
    const newSet = JSON.parse(JSON.stringify(currentSet)) as InspectionSet;
    const caliperVal = caliperStr === '' ? null : parseFloat(caliperStr);

    if (field === 'cotaEInicial') {
      newSet.cotaEInicial.rawCaliperInput = caliperVal;
      if (caliperVal !== null && !isNaN(caliperVal)) {
        newSet.cotaEInicial.variation = Number((caliperVal - theoreticalInitCaliper).toFixed(3));
      } else {
        newSet.cotaEInicial.variation = 0;
      }
    } else if (field === 'cotaEFinal') {
      newSet.cotaEFinal.rawCaliperInput = caliperVal;
      if (caliperVal !== null && !isNaN(caliperVal)) {
        newSet.cotaEFinal.variation = Number((caliperVal - theoreticalFinalCaliper).toFixed(3));
      } else {
        newSet.cotaEFinal.variation = 0;
      }
    } else {
      const joint = newSet.jointEnds.find(j => j.id === field.jointId);
      if (joint) {
        joint.rawCaliperInput = caliperVal;
        const targetNominal = joint.nominalE || config.nominalEJoints[0] || 30;
        const targetCaliper = calculateTheoreticalCaliper(targetNominal, config.holeDiameter);
        if (caliperVal !== null && !isNaN(caliperVal)) {
          joint.variation = Number((caliperVal - targetCaliper).toFixed(3));
        } else {
          joint.variation = 0;
        }
      }
    }

    onUpdateSet(setIndex, newSet);
  };

  const handleClearSet = (setIndex: number) => {
    const currentSet = sets[setIndex];
    const newSet = JSON.parse(JSON.stringify(currentSet)) as InspectionSet;
    newSet.cotaEInicial.variation = 0;
    newSet.cotaEInicial.rawCaliperInput = null;
    newSet.cotaEFinal.variation = 0;
    newSet.cotaEFinal.rawCaliperInput = null;
    newSet.jointEnds.forEach(j => {
      j.variation = 0;
      j.rawCaliperInput = null;
    });
    onUpdateSet(setIndex, newSet);
  };

  return (
    <div className="space-y-6">
      
      {/* Control Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        
        {/* Visual guidance summary */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-rose-300">
              Colunas em Vermelho: Digitação da Variação (Vazio = 0.00)
            </span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold text-emerald-300">
              Colunas em Verde: Valor Final do Certificado
            </span>
          </div>
        </div>

        {/* Input mode toggle & Quick buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Modo de Entrada:</span>
          <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setInputMode('variation')}
              className={`px-3 py-1 rounded-md transition-colors ${
                inputMode === 'variation'
                  ? 'bg-rose-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Digitar Variação (Δ mm)
            </button>
            <button
              onClick={() => setInputMode('caliper')}
              className={`px-3 py-1 rounded-md transition-colors ${
                inputMode === 'caliper'
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Digitar Paquímetro Direto
            </button>
          </div>
        </div>

      </div>

      {/* Conjuntos Grid (Rendered in pairs 1° - A with 2° - B, 3° - C with 4° - D, etc.) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {sets.map((set, setIndex) => {
          const overallStatus = checkSetOverallStatus(set, config);
          
          // Initial Cota E
          const initNominal = config.nominalEInicial;
          const initVar = set.cotaEInicial.variation || 0;
          const initFinal = calculateFinalCotaE(initNominal, initVar);
          const initStatus = checkEndCotaTolerance(initVar, config.endToleranceMax);
          const initCaliperMeasured = (theoreticalInitCaliper + initVar);

          // Final Cota E
          const finalNominal = config.nominalEFinal;
          const finalVar = set.cotaEFinal.variation || 0;
          const finalFinal = calculateFinalCotaE(finalNominal, finalVar);
          const finalStatus = checkEndCotaTolerance(finalVar, config.endToleranceMax);
          const finalCaliperMeasured = (theoreticalFinalCaliper + finalVar);

          return (
            <div 
              key={set.id}
              className={`bg-slate-900/95 border rounded-xl overflow-hidden shadow-xl transition-all ${
                overallStatus.status === 'REJECTED' 
                  ? 'border-rose-700/80 ring-1 ring-rose-600/30' 
                  : overallStatus.status === 'WARNING'
                  ? 'border-amber-700/70'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              
              {/* Set Header Bar */}
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center font-display font-bold text-white text-xs">
                    {set.letter}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                      <span>{set.name}</span>
                      {set.serialNumber && (
                        <span className="text-[11px] text-slate-400 font-mono font-normal">
                          [{set.serialNumber}]
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {config.piecesPerGuide} peças / {config.piecesPerGuide - 1} emenda(s)
                    </p>
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div className="flex items-center gap-2">
                  {overallStatus.status === 'OK' && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> OK
                    </span>
                  )}
                  {overallStatus.status === 'WARNING' && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800 font-mono">
                      <AlertTriangle className="w-3.5 h-3.5" /> ATENÇÃO
                    </span>
                  )}
                  {overallStatus.status === 'REJECTED' && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800 font-mono animate-pulse">
                      <XCircle className="w-3.5 h-3.5" /> FORA TOLERÂNCIA
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleClearSet(setIndex)}
                    title="Zerar variações deste conjunto"
                    className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDuplicateSet(setIndex)}
                    title="Duplicar conjunto"
                    className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {sets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveSet(setIndex)}
                      title="Excluir conjunto"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Table Body (Exact reproduction of spreadsheet format) */}
              <div className="p-4 space-y-4 overflow-x-auto">
                
                {/* 1. Pontas: Cota E Inicial & Cota E Final */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Pontas Extremas (Tolerância: ±{config.endToleranceMax.toFixed(1)} mm)</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Ref. Paquímetro: {theoreticalInitCaliper.toFixed(2)} mm
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Cota E Inicial */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-200">Cota "E" INICIAL</span>
                        {initVar !== 0 && (
                          <span className={`text-[10px] font-mono font-medium ${
                            initStatus.status === 'OK' ? 'text-emerald-400' : initStatus.status === 'WARNING' ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {initStatus.message}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 items-center text-center font-mono">
                        {/* Nominal OP */}
                        <div className="bg-slate-900/90 py-1.5 px-2 rounded border border-slate-800">
                          <span className="text-[9px] text-slate-400 block uppercase">Nominal OP</span>
                          <span className="text-xs font-bold text-slate-300">{initNominal.toFixed(2)}</span>
                        </div>

                        {/* Variação (RED INPUT) */}
                        <div className="bg-rose-950/40 p-1 rounded border-2 border-rose-600/80 shadow-sm shadow-rose-950/50">
                          <span className="text-[9px] text-rose-300 font-bold block uppercase">
                            {inputMode === 'variation' ? 'Variação' : 'Paquímetro'}
                          </span>
                          {inputMode === 'variation' ? (
                            <input
                              type="number"
                              step="0.01"
                              value={set.cotaEInicial.variation === 0 ? '' : set.cotaEInicial.variation}
                              placeholder="0.00"
                              onChange={(e) => handleVariationChange(setIndex, 'cotaEInicial', e.target.value)}
                              className="w-full bg-slate-950 border border-rose-600 rounded px-1.5 py-0.5 text-xs font-bold text-rose-300 text-center focus:outline-none focus:ring-1 focus:ring-rose-400"
                            />
                          ) : (
                            <input
                              type="number"
                              step="0.01"
                              value={set.cotaEInicial.rawCaliperInput ?? initCaliperMeasured.toFixed(2)}
                              onChange={(e) => handleCaliperChange(setIndex, 'cotaEInicial', e.target.value)}
                              className="w-full bg-slate-950 border border-cyan-500 rounded px-1.5 py-0.5 text-xs font-bold text-cyan-300 text-center focus:outline-none focus:ring-1 focus:ring-cyan-400"
                            />
                          )}
                        </div>

                        {/* Final (GREEN CERTIFICATE VALUE) */}
                        <div className="bg-emerald-950/60 py-1.5 px-2 rounded border-2 border-emerald-600/80 shadow-sm shadow-emerald-950/50">
                          <span className="text-[9px] text-emerald-300 font-bold block uppercase">Final Cert.</span>
                          <span className="text-xs font-black text-emerald-300">{initFinal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Quick variation buttons */}
                      <div className="flex items-center justify-between gap-1 mt-2 pt-1 border-t border-slate-900 text-[10px] text-slate-400">
                        <span>Paquímetro Real: <strong className="text-cyan-300 font-mono">{initCaliperMeasured.toFixed(2)}</strong></span>
                        <div className="flex items-center gap-1">
                          {[-0.1, 0, 0.1].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => handleVariationChange(setIndex, 'cotaEInicial', step.toString())}
                              className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-mono"
                            >
                              {step === 0 ? '0' : step > 0 ? `+${step}` : step}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cota E Final */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-200">Cota "E" FINAL</span>
                        {finalVar !== 0 && (
                          <span className={`text-[10px] font-mono font-medium ${
                            finalStatus.status === 'OK' ? 'text-emerald-400' : finalStatus.status === 'WARNING' ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {finalStatus.message}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 items-center text-center font-mono">
                        {/* Nominal OP */}
                        <div className="bg-slate-900/90 py-1.5 px-2 rounded border border-slate-800">
                          <span className="text-[9px] text-slate-400 block uppercase">Nominal OP</span>
                          <span className="text-xs font-bold text-slate-300">{finalNominal.toFixed(2)}</span>
                        </div>

                        {/* Variação (RED INPUT) */}
                        <div className="bg-rose-950/40 p-1 rounded border-2 border-rose-600/80 shadow-sm shadow-rose-950/50">
                          <span className="text-[9px] text-rose-300 font-bold block uppercase">
                            {inputMode === 'variation' ? 'Variação' : 'Paquímetro'}
                          </span>
                          {inputMode === 'variation' ? (
                            <input
                              type="number"
                              step="0.01"
                              value={set.cotaEFinal.variation === 0 ? '' : set.cotaEFinal.variation}
                              placeholder="0.00"
                              onChange={(e) => handleVariationChange(setIndex, 'cotaEFinal', e.target.value)}
                              className="w-full bg-slate-950 border border-rose-600 rounded px-1.5 py-0.5 text-xs font-bold text-rose-300 text-center focus:outline-none focus:ring-1 focus:ring-rose-400"
                            />
                          ) : (
                            <input
                              type="number"
                              step="0.01"
                              value={set.cotaEFinal.rawCaliperInput ?? finalCaliperMeasured.toFixed(2)}
                              onChange={(e) => handleCaliperChange(setIndex, 'cotaEFinal', e.target.value)}
                              className="w-full bg-slate-950 border border-cyan-500 rounded px-1.5 py-0.5 text-xs font-bold text-cyan-300 text-center focus:outline-none focus:ring-1 focus:ring-cyan-400"
                            />
                          )}
                        </div>

                        {/* Final (GREEN CERTIFICATE VALUE) */}
                        <div className="bg-emerald-950/60 py-1.5 px-2 rounded border-2 border-emerald-600/80 shadow-sm shadow-emerald-950/50">
                          <span className="text-[9px] text-emerald-300 font-bold block uppercase">Final Cert.</span>
                          <span className="text-xs font-black text-emerald-300">{finalFinal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Quick variation buttons */}
                      <div className="flex items-center justify-between gap-1 mt-2 pt-1 border-t border-slate-900 text-[10px] text-slate-400">
                        <span>Paquímetro Real: <strong className="text-cyan-300 font-mono">{finalCaliperMeasured.toFixed(2)}</strong></span>
                        <div className="flex items-center gap-1">
                          {[-0.1, 0, 0.1].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => handleVariationChange(setIndex, 'cotaEFinal', step.toString())}
                              className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-mono"
                            >
                              {step === 0 ? '0' : step > 0 ? `+${step}` : step}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 2. Emendas: Cota E Emenda A & Cota E Emenda B (Tolerance 1/10 mm per side) */}
                {set.jointEnds.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Emendas da Guia (Tolerância Rigorosa: Máx ±0.10 mm por Face)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Ref. Paquímetro: {theoreticalJointCaliper.toFixed(2)} mm
                      </span>
                    </div>

                    {/* Joint pairs */}
                    {Array.from({ length: Math.ceil(set.jointEnds.length / 2) }).map((_, jointIdx) => {
                      const sideA = set.jointEnds[jointIdx * 2];
                      const sideB = set.jointEnds[jointIdx * 2 + 1];
                      if (!sideA || !sideB) return null;

                      const nomA = sideA.nominalE || config.nominalEJoints[0] || 30;
                      const nomB = sideB.nominalE || config.nominalEJoints[1] || config.nominalEJoints[0] || 30;

                      const varA = sideA.variation || 0;
                      const varB = sideB.variation || 0;

                      const finalA = calculateFinalCotaE(nomA, varA);
                      const finalB = calculateFinalCotaE(nomB, varB);

                      const statA = checkJointTolerance(varA, config.jointTolerance);
                      const statB = checkJointTolerance(varB, config.jointTolerance);
                      const pairStat = checkJointPairTolerance(varA, varB, config.jointTolerance, config.jointTotalPitchTolerance);

                      const caliperA = calculateTheoreticalCaliper(nomA, config.holeDiameter) + varA;
                      const caliperB = calculateTheoreticalCaliper(nomB, config.holeDiameter) + varB;

                      const engraving = getEngravingJointLabels(jointIdx + 1, config.engravingPattern);

                      return (
                        <div key={`joint-pair-${jointIdx}`} className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-3 space-y-2.5">
                          
                          {/* Joint Header & Step status */}
                          <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-300">
                                Emenda {jointIdx + 1} (Junta entre Peça {jointIdx + 1} e {jointIdx + 2})
                              </span>
                              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
                                Fresa: [{engraving.leftMark} | {engraving.rightMark}]
                              </span>
                            </div>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              pairStat.status === 'OK'
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                : 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse font-bold'
                            }`}>
                              {pairStat.message}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            
                            {/* Lado A */}
                            <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-slate-200">
                                  Cota "E" Emenda {engraving.leftMark} (Lado A)
                                </span>
                                <span className={`text-[9px] font-mono ${
                                  statA.status === 'OK' ? 'text-emerald-400' : statA.status === 'WARNING' ? 'text-amber-400' : 'text-rose-400 font-bold'
                                }`}>
                                  {formatVariation(varA)} mm
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 items-center text-center font-mono">
                                <div className="bg-slate-950 py-1 px-1.5 rounded border border-slate-800">
                                  <span className="text-[8px] text-slate-400 block uppercase">Nominal</span>
                                  <span className="text-xs font-bold text-slate-300">{nomA.toFixed(2)}</span>
                                </div>

                                <div className="bg-rose-950/40 p-0.5 rounded border-2 border-rose-600/80 shadow-sm shadow-rose-950/50">
                                  <span className="text-[8px] text-rose-300 font-bold block uppercase">Variação</span>
                                  {inputMode === 'variation' ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={sideA.variation === 0 ? '' : sideA.variation}
                                      placeholder="0.00"
                                      onChange={(e) => handleVariationChange(setIndex, { jointId: sideA.id }, e.target.value)}
                                      className="w-full bg-slate-950 border border-rose-600 rounded px-1 py-0.5 text-xs font-bold text-rose-300 text-center focus:outline-none"
                                    />
                                  ) : (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={sideA.rawCaliperInput ?? caliperA.toFixed(2)}
                                      onChange={(e) => handleCaliperChange(setIndex, { jointId: sideA.id }, e.target.value)}
                                      className="w-full bg-slate-950 border border-cyan-500 rounded px-1 py-0.5 text-xs font-bold text-cyan-300 text-center focus:outline-none"
                                    />
                                  )}
                                </div>

                                <div className="bg-emerald-950/60 py-1 px-1.5 rounded border-2 border-emerald-600/80 shadow-sm shadow-emerald-950/50">
                                  <span className="text-[8px] text-emerald-300 font-bold block uppercase">Final Cert.</span>
                                  <span className="text-xs font-black text-emerald-300">{finalA.toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1.5 pt-1 border-t border-slate-950">
                                <span>Paquímetro: <strong className="text-cyan-300">{caliperA.toFixed(2)}</strong></span>
                                <div className="flex items-center gap-0.5">
                                  {[-0.1, -0.05, 0, 0.05, 0.1].map(btn => (
                                    <button
                                      key={btn}
                                      type="button"
                                      onClick={() => handleVariationChange(setIndex, { jointId: sideA.id }, btn.toString())}
                                      className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[8px]"
                                    >
                                      {btn === 0 ? '0' : btn > 0 ? `+${btn}` : btn}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Lado B */}
                            <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-slate-200">
                                  Cota "E" Emenda {engraving.rightMark} (Lado B)
                                </span>
                                <span className={`text-[9px] font-mono ${
                                  statB.status === 'OK' ? 'text-emerald-400' : statB.status === 'WARNING' ? 'text-amber-400' : 'text-rose-400 font-bold'
                                }`}>
                                  {formatVariation(varB)} mm
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 items-center text-center font-mono">
                                <div className="bg-slate-950 py-1 px-1.5 rounded border border-slate-800">
                                  <span className="text-[8px] text-slate-400 block uppercase">Nominal</span>
                                  <span className="text-xs font-bold text-slate-300">{nomB.toFixed(2)}</span>
                                </div>

                                <div className="bg-rose-950/40 p-0.5 rounded border-2 border-rose-600/80 shadow-sm shadow-rose-950/50">
                                  <span className="text-[8px] text-rose-300 font-bold block uppercase">Variação</span>
                                  {inputMode === 'variation' ? (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={sideB.variation === 0 ? '' : sideB.variation}
                                      placeholder="0.00"
                                      onChange={(e) => handleVariationChange(setIndex, { jointId: sideB.id }, e.target.value)}
                                      className="w-full bg-slate-950 border border-rose-600 rounded px-1 py-0.5 text-xs font-bold text-rose-300 text-center focus:outline-none"
                                    />
                                  ) : (
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={sideB.rawCaliperInput ?? caliperB.toFixed(2)}
                                      onChange={(e) => handleCaliperChange(setIndex, { jointId: sideB.id }, e.target.value)}
                                      className="w-full bg-slate-950 border border-cyan-500 rounded px-1 py-0.5 text-xs font-bold text-cyan-300 text-center focus:outline-none"
                                    />
                                  )}
                                </div>

                                <div className="bg-emerald-950/60 py-1 px-1.5 rounded border-2 border-emerald-600/80 shadow-sm shadow-emerald-950/50">
                                  <span className="text-[8px] text-emerald-300 font-bold block uppercase">Final Cert.</span>
                                  <span className="text-xs font-black text-emerald-300">{finalB.toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1.5 pt-1 border-t border-slate-950">
                                <span>Paquímetro: <strong className="text-cyan-300">{caliperB.toFixed(2)}</strong></span>
                                <div className="flex items-center gap-0.5">
                                  {[-0.1, -0.05, 0, 0.05, 0.1].map(btn => (
                                    <button
                                      key={btn}
                                      type="button"
                                      onClick={() => handleVariationChange(setIndex, { jointId: sideB.id }, btn.toString())}
                                      className="px-1 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[8px]"
                                    >
                                      {btn === 0 ? '0' : btn > 0 ? `+${btn}` : btn}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                          </div>

                        </div>
                      );
                    })}

                  </div>
                )}

              </div>

            </div>
          );
        })}
      </div>

      {/* Add New Set Button at bottom */}
      <div className="text-center pt-4">
        <button
          onClick={onAddSet}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-slate-950"
        >
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>Adicionar Novo Conjunto à Ordem de Produção</span>
        </button>
      </div>

    </div>
  );
};
