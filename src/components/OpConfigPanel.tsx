import React, { useState } from 'react';
import { OPConfig, EngravingPattern } from '../types';
import { HIWIN_GUIDE_CATALOG, getHiwinModel } from '../data/hiwinCatalog';
import { calculateTheoreticalCaliper, getEngravingJointLabels } from '../utils/calculations';
import { 
  Sliders, 
  FileSpreadsheet, 
  Layers, 
  Lock, 
  Unlock, 
  CheckCircle, 
  Plus, 
  Minus,
  ArrowRight,
  Stamp,
  Hash,
  ShoppingBag,
  FileText
} from 'lucide-react';

interface OpConfigPanelProps {
  config: OPConfig;
  numberOfSets: number;
  onChangeConfig: (newConfig: OPConfig) => void;
  onChangeNumberOfSets: (newCount: number) => void;
  onResetDefaults?: () => void;
}

export const OpConfigPanel: React.FC<OpConfigPanelProps> = ({
  config,
  numberOfSets,
  onChangeConfig,
  onChangeNumberOfSets,
}) => {
  const [showAdvancedTolerances, setShowAdvancedTolerances] = useState(false);
  const [isManualHoleUnlocked, setIsManualHoleUnlocked] = useState(false);
  const [activeSetPreview, setActiveSetPreview] = useState<number>(1); // 1-based set preview (1 = A, 2 = B, etc.)
  const [activeJointTab, setActiveJointTab] = useState<number>(1); // 1-based joint tab (1, 2, 3...)

  const selectedModel = getHiwinModel(config.modelId);
  const currentPattern = config.engravingPattern || 'LETTERS_NUMBERS';

  const handleModelChange = (modelId: string) => {
    const model = getHiwinModel(modelId);
    if (model) {
      const diameter = config.measurementReference === 'through_hole' 
        ? model.throughHoleDiameter 
        : model.counterboreDiameter;

      onChangeConfig({
        ...config,
        modelId: model.id,
        holeDiameter: diameter,
      });
    } else {
      onChangeConfig({
        ...config,
        modelId: 'CUSTOM',
      });
    }
  };

  const handleReferenceChange = (reference: 'counterbore' | 'through_hole') => {
    const diameter = reference === 'through_hole'
      ? selectedModel.throughHoleDiameter
      : selectedModel.counterboreDiameter;

    onChangeConfig({
      ...config,
      measurementReference: reference,
      holeDiameter: diameter,
    });
  };

  const numberOfJoints = config.piecesPerGuide > 1 ? config.piecesPerGuide - 1 : (config.nominalEJoints?.length ? Math.floor(config.nominalEJoints.length / 2) : 1);
  const numberOfPieces = numberOfJoints + 1;

  const handleJointsChange = (newJoints: number) => {
    const validJoints = Math.max(0, Math.min(10, newJoints));
    const newPieces = validJoints + 1;
    
    let updatedNominals = [...config.nominalEJoints];
    if (updatedNominals.length < validJoints * 2) {
      while (updatedNominals.length < validJoints * 2) {
        updatedNominals.push(30);
      }
    } else if (updatedNominals.length > validJoints * 2 && validJoints > 0) {
      updatedNominals = updatedNominals.slice(0, validJoints * 2);
    }
    if (validJoints === 0) {
      updatedNominals = [];
    }

    onChangeConfig({
      ...config,
      piecesPerGuide: newPieces,
      nominalEJoints: updatedNominals,
    });

    if (activeJointTab > validJoints && validJoints > 0) {
      setActiveJointTab(1);
    }
  };

  const handlePatternChange = (pattern: EngravingPattern) => {
    onChangeConfig({
      ...config,
      engravingPattern: pattern
    });
  };

  const caliperInit = calculateTheoreticalCaliper(config.nominalEInicial, config.holeDiameter);
  const caliperFinal = calculateTheoreticalCaliper(config.nominalEFinal, config.holeDiameter);

  // Active joint calculations for cards & diagram
  const currentSetIdx = Math.min(numberOfSets, Math.max(1, activeSetPreview));
  const currentJointIdx = Math.min(numberOfJoints, Math.max(1, activeJointTab));
  
  const activeLabels = getEngravingJointLabels(currentJointIdx, currentSetIdx, currentPattern);
  
  const jointAIndex = (currentJointIdx - 1) * 2;
  const jointBIndex = (currentJointIdx - 1) * 2 + 1;
  const nominalEmendaA = config.nominalEJoints[jointAIndex] ?? config.nominalEJoints[0] ?? 30;
  const nominalEmendaB = config.nominalEJoints[jointBIndex] ?? config.nominalEJoints[1] ?? config.nominalEJoints[0] ?? 30;
  const caliperEmendaA = calculateTheoreticalCaliper(nominalEmendaA, config.holeDiameter);
  const caliperEmendaB = calculateTheoreticalCaliper(nominalEmendaB, config.holeDiameter);

  const lettersList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  const currentSetLetter = lettersList[(currentSetIdx - 1) % lettersList.length] || 'A';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl relative space-y-5">
      
      {/* ========================================================================= */}
      {/* 1. SEÇÃO PRINCIPAL DE CONFIGURAÇÃO (OP, ITEM, PEDIDO, GRAVAÇÃO E MODELO) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-4 border-b border-slate-800">
        
        {/* CARD 1: OP, ITEM E PEDIDO DE VENDA (3 CAMPOS EMPILHADOS) */}
        <div className="md:col-span-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2.5 flex flex-col justify-between shadow-inner">
          <label className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 pb-1 border-b border-slate-800/80">
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Dados da Produção</span>
          </label>

          {/* Campo 1: OP (Sem texto fixo inicial, apenas placeholder de exemplo 053-01-001) */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <FileText className="w-3 h-3 text-cyan-400" />
                <span>OP (Ordem de Produção):</span>
              </span>
            </div>
            <input
              type="text"
              value={config.opNumber}
              onChange={(e) => onChangeConfig({ ...config, opNumber: e.target.value })}
              placeholder="053-01-001"
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Campo 2: ITEM */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Hash className="w-3 h-3 text-cyan-400" />
                <span>Item:</span>
              </span>
            </div>
            <input
              type="text"
              value={config.itemNumber || ''}
              onChange={(e) => onChangeConfig({ ...config, itemNumber: e.target.value })}
              placeholder="01"
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Campo 3: PEDIDO DE VENDA */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <ShoppingBag className="w-3 h-3 text-cyan-400" />
                <span>Pedido de Venda:</span>
              </span>
            </div>
            <input
              type="text"
              value={config.salesOrder || ''}
              onChange={(e) => onChangeConfig({ ...config, salesOrder: e.target.value })}
              placeholder="PV-001"
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* CARD 2: PADRÃO DE GRAVAÇÃO DA FRESA / MARCAÇÃO NAS GUIAS */}
        <div className="md:col-span-4 bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2.5 flex flex-col justify-between shadow-inner">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Stamp className="w-3.5 h-3.5" />
              <span>Gravação na Fresa</span>
            </label>
            <span className="text-[10px] text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800/60 font-mono">
              Marcação Guia
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <span className="text-[11px] text-slate-300 block font-medium">Formato de Gravação das Emendas:</span>
            
            <div className="grid grid-cols-1 gap-1.5 font-mono text-xs">
              
              {/* Option 1: Padrão Letras e Números (A1-A1, A2-A2... / Conj. B: B1-B1, B2-B2...) */}
              <button
                type="button"
                onClick={() => handlePatternChange('LETTERS_NUMBERS')}
                className={`p-2 rounded-md border text-left flex items-center justify-between transition-colors ${
                  currentPattern === 'LETTERS_NUMBERS' || currentPattern === 'A1_A2'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div>
                  <span className="block text-xs font-bold text-amber-300">Padrão Letras e Números</span>
                  <span className="text-[10px] font-sans text-slate-400">
                    Conj. A: A1-A1, A2-A2 · Conj. B: B1-B1, B2-B2
                  </span>
                </div>
                <span className="text-[10px] bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-700/50">
                  Principal
                </span>
              </button>

              {/* Option 2: Padrão de Letras (A-A, B-B, C-C...) */}
              <button
                type="button"
                onClick={() => handlePatternChange('LETTERS_ONLY')}
                className={`p-2 rounded-md border text-left flex items-center justify-between transition-colors ${
                  currentPattern === 'LETTERS_ONLY' || currentPattern === 'AA_BB'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div>
                  <span className="block text-xs font-bold text-amber-300">Padrão de Letras</span>
                  <span className="text-[10px] font-sans text-slate-400">
                    A-A, B-B, C-C, D-D (Letras Casadas)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans">
                  Letras
                </span>
              </button>

              {/* Option 3: Padrão Sequencial Letras e Números (A1-B1, A2-B2... / Conj. B: C1-D1, C2-D2...) */}
              <button
                type="button"
                onClick={() => handlePatternChange('SEQUENTIAL_LETTERS_NUMBERS')}
                className={`p-2 rounded-md border text-left flex items-center justify-between transition-colors ${
                  currentPattern === 'SEQUENTIAL_LETTERS_NUMBERS' || currentPattern === 'AB_CD'
                    ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div>
                  <span className="block text-xs font-bold text-amber-300">Padrão Sequencial Letras e Números</span>
                  <span className="text-[10px] font-sans text-slate-400">
                    Conj. A: A1-B1, A2-B2 · Conj. B: C1-D1, C2-D2
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans">
                  Seq.
                </span>
              </button>

            </div>
          </div>

          {/* Resumo da Gravação dos Conjuntos */}
          <div className="bg-slate-900/90 p-2 rounded border border-slate-800 text-[10px] space-y-1">
            <span className="text-slate-400 block font-medium">Marcações na Fresa ({numberOfSets} conj. / {numberOfJoints} em.):</span>
            <div className="flex flex-wrap gap-1.5 font-mono">
              {Array.from({ length: Math.min(numberOfSets, 4) }).map((_, sIdx) => {
                const sNum = sIdx + 1;
                const sLetter = lettersList[sIdx % lettersList.length];
                const marks = Array.from({ length: numberOfJoints }).map((__, jIdx) => {
                  const l = getEngravingJointLabels(jIdx + 1, sNum, currentPattern);
                  return `[${l.leftMark}|${l.rightMark}]`;
                }).join(' ');

                return (
                  <span key={sNum} className="bg-slate-950 px-1.5 py-0.5 rounded border border-amber-900/60 text-amber-300">
                    <strong>{sNum}°-{sLetter}:</strong> {marks}
                  </span>
                );
              })}
              {numberOfSets > 4 && (
                <span className="text-slate-500 text-[10px] self-center">+{numberOfSets - 4} conj.</span>
              )}
            </div>
          </div>
        </div>

        {/* CARD 3: MODELO DA GUIA LINEAR & CONJUNTOS / EMENDAS */}
        <div className="md:col-span-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2.5 flex flex-col justify-between shadow-inner">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
            <label className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Modelo da Guia & Peças</span>
            </label>
            <span className="text-[10px] text-cyan-300/80 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/60 font-mono">
              {numberOfPieces} Peças / Guia
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-300 block mb-1 font-medium">Catálogo HIWIN:</span>
            <select
              value={config.modelId}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full bg-slate-900 border border-cyan-700/60 rounded-md px-2 py-1.5 text-xs text-cyan-200 font-medium focus:outline-none focus:border-cyan-400 cursor-pointer shadow-inner"
            >
              <optgroup label="Série Pesada (HIWIN HG)">
                {HIWIN_GUIDE_CATALOG.filter(m => m.series === 'HG').map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} — D={m.counterboreDiameter}mm ({m.boltSize})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Perfil Baixo (HIWIN EG)">
                {HIWIN_GUIDE_CATALOG.filter(m => m.series === 'EG').map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} — D={m.counterboreDiameter}mm ({m.boltSize})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Guias de Rolos (HIWIN RG)">
                {HIWIN_GUIDE_CATALOG.filter(m => m.series === 'RG').map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} — D={m.counterboreDiameter}mm ({m.boltSize})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Miniatura (HIWIN MGN)">
                {HIWIN_GUIDE_CATALOG.filter(m => m.series === 'MGN').map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} — D={m.counterboreDiameter}mm ({m.boltSize})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Outros / Personalizado">
                <option value="CUSTOM">Personalizado / Outro Fabricante</option>
              </optgroup>
            </select>
          </div>

          {/* Stepper Quantidade de Conjuntos & Emendas */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900">
            {/* Conjuntos */}
            <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
                <span>Conjuntos:</span>
                <span className="text-cyan-400 font-mono">{numberOfSets}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChangeNumberOfSets(Math.max(1, numberOfSets - 1))}
                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="26"
                  value={numberOfSets}
                  onChange={(e) => onChangeNumberOfSets(Math.max(1, Math.min(26, parseInt(e.target.value) || 1)))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-xs font-mono text-center font-bold text-white"
                />
                <button
                  type="button"
                  onClick={() => onChangeNumberOfSets(Math.min(26, numberOfSets + 1))}
                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Emendas */}
            <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
                <span>Emendas:</span>
                <span className="text-emerald-400 font-mono">{numberOfJoints}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleJointsChange(numberOfJoints - 1)}
                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={numberOfJoints}
                  onChange={(e) => handleJointsChange(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-xs font-mono text-center font-bold text-white"
                />
                <button
                  type="button"
                  onClick={() => handleJointsChange(numberOfJoints + 1)}
                  className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 4: DIÂMETRO DO FURO & METROLOGIA */}
        <div className="md:col-span-2 bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2.5 flex flex-col justify-between shadow-inner">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
            <label className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <span>Furo (Ø)</span>
            </label>

            <button
              type="button"
              onClick={() => setIsManualHoleUnlocked(!isManualHoleUnlocked)}
              className="text-[11px] text-slate-400 hover:text-cyan-300 underline flex items-center gap-1"
            >
              {isManualHoleUnlocked ? (
                <>
                  <Lock className="w-3 h-3 text-cyan-400" />
                  <span>Travar</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3 text-slate-400" />
                  <span>Editar</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="1"
                max="50"
                disabled={!isManualHoleUnlocked}
                value={config.holeDiameter}
                onChange={(e) => onChangeConfig({ ...config, holeDiameter: parseFloat(e.target.value) || 0 })}
                className={`w-full text-sm font-bold font-mono rounded-md px-2.5 py-1 border ${
                  !isManualHoleUnlocked
                    ? 'bg-slate-900 border-slate-800 text-cyan-300 cursor-not-allowed'
                    : 'bg-slate-900 border-cyan-500 text-white'
                }`}
              />
              <span className="absolute right-2 top-1.5 text-[10px] font-mono text-slate-400">mm</span>
            </div>

            <div className="text-[11px] text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800 flex items-center justify-between">
              <span>Raio r:</span>
              <strong className="text-cyan-300 font-bold">{(config.holeDiameter / 2).toFixed(2)} mm</strong>
            </div>
          </div>

          {/* Selector Rebaixo vs Passante */}
          <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => handleReferenceChange('counterbore')}
              className={`px-1 py-0.5 rounded transition-colors text-center font-medium ${
                config.measurementReference === 'counterbore'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              D ({selectedModel.counterboreDiameter})
            </button>
            <button
              type="button"
              onClick={() => handleReferenceChange('through_hole')}
              className={`px-1 py-0.5 rounded transition-colors text-center font-medium ${
                config.measurementReference === 'through_hole'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              d ({selectedModel.throughHoleDiameter})
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. DIAGRAMA ILUSTRATIVO DA GUIA COM LINHAS DE REFERÊNCIA PARA OS CARDS     */}
      {/* ========================================================================= */}
      <div className="space-y-0">
        
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <span>COTAS NOMINAIS DA OP VS LEITURA NO PAQUÍMETRO</span>
            </span>
            <span className="text-xs text-emerald-400 font-mono bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>OS VALORES EM VERDE INSERIR NO CERTIFICADO</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Seletor do Conjunto Ativo para Visualizar se numberOfSets > 1 */}
            {numberOfSets > 1 && (
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400 text-[11px] mr-1">Visualizar Conjunto:</span>
                {Array.from({ length: numberOfSets }).map((_, idx) => {
                  const sNum = idx + 1;
                  const sLetter = lettersList[idx % lettersList.length];
                  return (
                    <button
                      key={sNum}
                      type="button"
                      onClick={() => setActiveSetPreview(sNum)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        currentSetIdx === sNum
                          ? 'bg-cyan-600 text-white font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white bg-slate-900'
                      }`}
                    >
                      {sNum}° ({sLetter})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Seletor de Emendas se numberOfJoints > 1 */}
            {numberOfJoints > 1 && (
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400 text-[11px] mr-1">Emenda:</span>
                {Array.from({ length: numberOfJoints }).map((_, idx) => {
                  const jNum = idx + 1;
                  const lbl = getEngravingJointLabels(jNum, currentSetIdx, currentPattern);
                  return (
                    <button
                      key={jNum}
                      type="button"
                      onClick={() => setActiveJointTab(jNum)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        activeJointTab === jNum
                          ? 'bg-amber-600 text-white font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white bg-slate-900'
                      }`}
                    >
                      Em. {jNum} ({lbl.leftMark}-{lbl.rightMark})
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAdvancedTolerances(!showAdvancedTolerances)}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded border border-slate-800"
            >
              <Sliders className="w-3 h-3" />
              <span>{showAdvancedTolerances ? 'Ocultar Tolerâncias' : 'Configurar Tolerâncias'}</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ILUSTRAÇÃO TÉCNICA 2D DA GUIA LINEAR COM LINHAS DE PROJEÇÃO */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-slate-950 rounded-t-xl border-t border-x border-slate-800 p-4 pb-1 relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1 border-b border-slate-800/80 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="text-slate-200 font-bold">
                ESQUEMA DE EMENDA · {currentSetIdx}° CONJUNTO ({currentSetLetter})
              </span>
              <span className="text-slate-500">| Modelo: {selectedModel.name} (Furo Ø {config.holeDiameter}mm)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800 text-[10px]">
                Marcação na Fresa: [{activeLabels.leftMark} | {activeLabels.rightMark}] (Peça {currentJointIdx} com Peça {currentJointIdx + 1})
              </span>
              <span className="text-emerald-400 font-semibold hidden md:inline">
                Leitura no Paquímetro: Cota E - (Ø Furo / 2)
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto py-2">
            <svg viewBox="0 0 1000 155" className="w-full min-w-[760px] h-auto select-none" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
              <defs>
                <linearGradient id="railSteelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="30%" stopColor="#94a3b8" />
                  <stop offset="70%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
                <linearGradient id="railTrackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="holeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <marker id="arrowCyan" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#06b6d4" />
                </marker>
                <marker id="arrowEmerald" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#10b981" />
                </marker>
              </defs>

              {/* RAIL SEGMENT 1 (LADO ESQUERDO / PEÇA k) */}
              <g id="rail-left">
                {/* Main Body */}
                <rect x="40" y="32" width="458" height="48" rx="3" fill="url(#railSteelGrad)" stroke="#334155" strokeWidth="1.5" />
                {/* Raceway / Grooves */}
                <rect x="40" y="46" width="458" height="5" fill="url(#railTrackGrad)" />
                <rect x="40" y="60" width="458" height="5" fill="url(#railTrackGrad)" />
                <rect x="40" y="33" width="458" height="3" fill="#cbd5e1" opacity="0.6" />
                
                {/* Hole 1: Initial Left Hole (Center at X=120) */}
                <g transform="translate(120, 56)">
                  <circle r="16" fill="url(#holeGrad)" stroke="#0ea5e9" strokeWidth="1.5" />
                  <circle r="9" fill="#020617" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2,2" />
                  <line x1="-19" y1="0" x2="19" y2="0" stroke="#0284c7" strokeWidth="0.75" strokeDasharray="3,2" />
                  <line x1="0" y1="-19" x2="0" y2="19" stroke="#0284c7" strokeWidth="0.75" strokeDasharray="3,2" />
                </g>

                {/* Intermediate decorative Hole (X=280) */}
                <g transform="translate(280, 56)" opacity="0.45">
                  <circle r="16" fill="url(#holeGrad)" stroke="#475569" strokeWidth="1" />
                  <circle r="9" fill="#020617" stroke="#64748b" strokeWidth="1" />
                </g>

                {/* Hole 2: Splice Left Hole (Emenda Face A, Center at X=420) */}
                <g transform="translate(420, 56)">
                  <circle r="16" fill="url(#holeGrad)" stroke="#10b981" strokeWidth="1.5" />
                  <circle r="9" fill="#020617" stroke="#34d399" strokeWidth="1" strokeDasharray="2,2" />
                  <line x1="-19" y1="0" x2="19" y2="0" stroke="#059669" strokeWidth="0.75" strokeDasharray="3,2" />
                  <line x1="0" y1="-19" x2="0" y2="19" stroke="#059669" strokeWidth="0.75" strokeDasharray="3,2" />
                </g>

                {/* Engraving Stamp On Rail A face */}
                <rect x="466" y="38" width="28" height="15" rx="2" fill="#451a03" stroke="#f59e0b" strokeWidth="1" />
                <text x="480" y="49" fill="#fbbf24" fontSize="9" fontFamily="monospace" fontWeight="black" textAnchor="middle">
                  {activeLabels.leftMark}
                </text>

                {/* Label Guia A */}
                <text x="50" y="24" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  PEÇA {currentJointIdx} · GRAVAÇÃO FRESA: [{activeLabels.leftMark}]
                </text>
              </g>

              {/* SPLICE LINE / JUNTA RETIFICADA NO CENTRO (X = 500) */}
              <g id="splice-joint">
                <line x1="500" y1="18" x2="500" y2="88" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4,2" />
                <rect x="400" y="8" width="200" height="17" rx="3" fill="#451a03" stroke="#f59e0b" strokeWidth="1" />
                <text x="500" y="20" fill="#fbbf24" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  ⚡ EMENDA {currentJointIdx}: [{activeLabels.leftMark} | {activeLabels.rightMark}]
                </text>
              </g>

              {/* RAIL SEGMENT 2 (LADO DIREITO / PEÇA k+1) */}
              <g id="rail-right">
                {/* Main Body */}
                <rect x="502" y="32" width="458" height="48" rx="3" fill="url(#railSteelGrad)" stroke="#334155" strokeWidth="1.5" />
                {/* Raceway / Grooves */}
                <rect x="502" y="46" width="458" height="5" fill="url(#railTrackGrad)" />
                <rect x="502" y="60" width="458" height="5" fill="url(#railTrackGrad)" />
                <rect x="502" y="33" width="458" height="3" fill="#cbd5e1" opacity="0.6" />

                {/* Engraving Stamp On Rail B face */}
                <rect x="506" y="38" width="28" height="15" rx="2" fill="#451a03" stroke="#f59e0b" strokeWidth="1" />
                <text x="520" y="49" fill="#fbbf24" fontSize="9" fontFamily="monospace" fontWeight="black" textAnchor="middle">
                  {activeLabels.rightMark}
                </text>

                {/* Hole 3: Splice Right Hole (Emenda Face B, Center at X=580) */}
                <g transform="translate(580, 56)">
                  <circle r="16" fill="url(#holeGrad)" stroke="#10b981" strokeWidth="1.5" />
                  <circle r="9" fill="#020617" stroke="#34d399" strokeWidth="1" strokeDasharray="2,2" />
                  <line x1="-19" y1="0" x2="19" y2="0" stroke="#059669" strokeWidth="0.75" strokeDasharray="3,2" />
                  <line x1="0" y1="-19" x2="0" y2="19" stroke="#059669" strokeWidth="0.75" strokeDasharray="3,2" />
                </g>

                {/* Intermediate decorative Hole (X=720) */}
                <g transform="translate(720, 56)" opacity="0.45">
                  <circle r="16" fill="url(#holeGrad)" stroke="#475569" strokeWidth="1" />
                  <circle r="9" fill="#020617" stroke="#64748b" strokeWidth="1" />
                </g>

                {/* Hole 4: Final Right Hole (Center at X=880) */}
                <g transform="translate(880, 56)">
                  <circle r="16" fill="url(#holeGrad)" stroke="#0ea5e9" strokeWidth="1.5" />
                  <circle r="9" fill="#020617" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2,2" />
                  <line x1="-19" y1="0" x2="19" y2="0" stroke="#0284c7" strokeWidth="0.75" strokeDasharray="3,2" />
                  <line x1="0" y1="-19" x2="0" y2="19" stroke="#0284c7" strokeWidth="0.75" strokeDasharray="3,2" />
                </g>

                {/* Label Guia B */}
                <text x="960" y="24" fill="#94a3b8" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                  PEÇA {currentJointIdx + 1} · GRAVAÇÃO FRESA: [{activeLabels.rightMark}]
                </text>
              </g>

              {/* ============================================================== */}
              {/* DIMENSION LINES & REFERENCE CALLOUTS POINTING TO 4 CARDS BELOW */}
              {/* ============================================================== */}

              {/* 1. COTA E ESQUERDA (INICIAL) -> Card 1 */}
              <g id="dim-cota-e-inicial">
                <line x1="40" y1="80" x2="40" y2="118" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="120" y1="72" x2="120" y2="118" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="44" y1="100" x2="116" y2="100" stroke="#06b6d4" strokeWidth="1.5" markerStart="url(#arrowCyan)" markerEnd="url(#arrowCyan)" />
                <rect x="46" y="88" width="68" height="15" rx="3" fill="#083344" stroke="#06b6d4" strokeWidth="0.75" />
                <text x="80" y="99" fill="#22d3ee" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  E = {config.nominalEInicial}mm
                </text>
                <line x1="125" y1="112" x2="125" y2="152" stroke="#06b6d4" strokeWidth="2" strokeDasharray="3,2" />
                <circle cx="125" cy="150" r="3.5" fill="#06b6d4" />
                <text x="125" y="140" fill="#67e8f9" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  ⬇ CARD 1 (ESQUERDA)
                </text>
              </g>

              {/* 2. COTA E EMENDA FACE A -> Card 2 */}
              <g id="dim-cota-e-emenda-a">
                <line x1="420" y1="72" x2="420" y2="118" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="500" y1="80" x2="500" y2="118" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="424" y1="100" x2="496" y2="100" stroke="#10b981" strokeWidth="1.5" markerStart="url(#arrowEmerald)" markerEnd="url(#arrowEmerald)" />
                <rect x="426" y="88" width="68" height="15" rx="3" fill="#064e3b" stroke="#10b981" strokeWidth="0.75" />
                <text x="460" y="99" fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  E = {nominalEmendaA}mm
                </text>
                <line x1="375" y1="112" x2="375" y2="152" stroke="#10b981" strokeWidth="2" strokeDasharray="3,2" />
                <circle cx="375" cy="150" r="3.5" fill="#10b981" />
                <text x="375" y="140" fill="#6ee7b7" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  ⬇ CARD 2 ({activeLabels.leftMark})
                </text>
              </g>

              {/* 3. COTA E EMENDA FACE B -> Card 3 */}
              <g id="dim-cota-e-emenda-b">
                <line x1="500" y1="80" x2="500" y2="118" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="580" y1="72" x2="580" y2="118" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="504" y1="100" x2="576" y2="100" stroke="#10b981" strokeWidth="1.5" markerStart="url(#arrowEmerald)" markerEnd="url(#arrowEmerald)" />
                <rect x="506" y="88" width="68" height="15" rx="3" fill="#064e3b" stroke="#10b981" strokeWidth="0.75" />
                <text x="540" y="99" fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  E = {nominalEmendaB}mm
                </text>
                <line x1="625" y1="112" x2="625" y2="152" stroke="#10b981" strokeWidth="2" strokeDasharray="3,2" />
                <circle cx="625" cy="150" r="3.5" fill="#10b981" />
                <text x="625" y="140" fill="#6ee7b7" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  ⬇ CARD 3 ({activeLabels.rightMark})
                </text>
              </g>

              {/* 4. COTA E DIREITA (FINAL) -> Card 4 */}
              <g id="dim-cota-e-final">
                <line x1="880" y1="72" x2="880" y2="118" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="960" y1="80" x2="960" y2="118" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="884" y1="100" x2="956" y2="100" stroke="#06b6d4" strokeWidth="1.5" markerStart="url(#arrowCyan)" markerEnd="url(#arrowCyan)" />
                <rect x="886" y="88" width="68" height="15" rx="3" fill="#083344" stroke="#06b6d4" strokeWidth="0.75" />
                <text x="920" y="99" fill="#22d3ee" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  E = {config.nominalEFinal}mm
                </text>
                <line x1="875" y1="112" x2="875" y2="152" stroke="#06b6d4" strokeWidth="2" strokeDasharray="3,2" />
                <circle cx="875" cy="150" r="3.5" fill="#06b6d4" />
                <text x="875" y="140" fill="#67e8f9" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  ⬇ CARD 4 (DIREITA)
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* ------------------------------------------------------------------------------------------------- */}
        {/* OS 4 CARDS DE REFERÊNCIA ORDENADOS DA ESQUERDA PARA A DIREITA (CONECTADOS ÀS LINHAS ACIMA)        */}
        {/* Card 1: Cota E Esquerda (Inicial)                                                                 */}
        {/* Card 2: Cota E Emenda Face A (Peça k) com marcação de gravação                                    */}
        {/* Card 3: Cota E Emenda Face B (Peça k+1) com marcação de gravação                                  */}
        {/* Card 4: Cota E Direita (Final)                                                                    */}
        {/* ------------------------------------------------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-b-xl border-b border-x border-slate-800">
          
          {/* ========================================================================= */}
          {/* CARD 1: COTA E ESQUERDA (INICIAL)                                         */}
          {/* ========================================================================= */}
          <div className="bg-slate-900/90 border border-cyan-800/80 rounded-lg p-3 relative overflow-hidden group shadow-lg flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-cyan-500"></div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center text-[10px] font-mono font-black text-cyan-300">
                    1
                  </span>
                  <span className="text-xs font-bold text-cyan-200">COTA E ESQUERDA</span>
                </div>
                <span className="text-[10px] text-cyan-400 uppercase font-mono font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
                  Ponta Inicial
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center mt-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Valor OP (E):</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={config.nominalEInicial}
                      onChange={(e) => onChangeConfig({ ...config, nominalEInicial: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-2.5 py-1 text-sm font-bold font-mono text-cyan-300"
                    />
                    <span className="absolute right-2 top-1 text-[10px] text-slate-500 font-mono">mm</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-cyan-800/60 rounded p-1.5 text-right">
                  <span className="text-[10px] text-slate-400 block">Valor Paquímetro:</span>
                  <span className="text-sm font-black font-mono text-cyan-400">
                    {caliperInit.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">mm</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>Fórmula: {config.nominalEInicial} - {(config.holeDiameter/2).toFixed(1)} =</span>
              <strong className="text-cyan-300 font-bold">{caliperInit.toFixed(2)} mm</strong>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 2: COTA E EMENDA (FACE A - PEÇA k)                                    */}
          {/* ========================================================================= */}
          <div className="bg-slate-900/90 border border-emerald-800/80 rounded-lg p-3 relative overflow-hidden group shadow-lg flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-[10px] font-mono font-black text-emerald-300">
                    2
                  </span>
                  <span className="text-xs font-bold text-emerald-200">
                    COTA E EMENDA [{activeLabels.leftMark}]
                  </span>
                </div>
                <span className="text-[10px] text-amber-300 uppercase font-mono font-bold bg-amber-950/90 px-1.5 py-0.5 rounded border border-amber-700/80">
                  Fresa: [{activeLabels.leftMark}]
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center mt-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">
                    Valor OP (Peça {currentJointIdx}):
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={nominalEmendaA}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const joints = [...config.nominalEJoints];
                        joints[jointAIndex] = val;
                        onChangeConfig({ ...config, nominalEJoints: joints });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded px-2.5 py-1 text-sm font-bold font-mono text-emerald-300"
                    />
                    <span className="absolute right-2 top-1 text-[10px] text-slate-500 font-mono">mm</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-emerald-800/60 rounded p-1.5 text-right">
                  <span className="text-[10px] text-slate-400 block">Valor Paquímetro:</span>
                  <span className="text-sm font-black font-mono text-emerald-400">
                    {caliperEmendaA.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">mm</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>Fórmula: {nominalEmendaA} - {(config.holeDiameter/2).toFixed(1)} =</span>
              <strong className="text-emerald-300 font-bold">{caliperEmendaA.toFixed(2)} mm</strong>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 3: COTA E EMENDA (FACE B - PEÇA k+1)                                  */}
          {/* ========================================================================= */}
          <div className="bg-slate-900/90 border border-emerald-800/80 rounded-lg p-3 relative overflow-hidden group shadow-lg flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-[10px] font-mono font-black text-emerald-300">
                    3
                  </span>
                  <span className="text-xs font-bold text-emerald-200">
                    COTA E EMENDA [{activeLabels.rightMark}]
                  </span>
                </div>
                <span className="text-[10px] text-amber-300 uppercase font-mono font-bold bg-amber-950/90 px-1.5 py-0.5 rounded border border-amber-700/80">
                  Fresa: [{activeLabels.rightMark}]
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center mt-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">
                    Valor OP (Peça {currentJointIdx + 1}):
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={nominalEmendaB}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const joints = [...config.nominalEJoints];
                        joints[jointBIndex] = val;
                        onChangeConfig({ ...config, nominalEJoints: joints });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded px-2.5 py-1 text-sm font-bold font-mono text-emerald-300"
                    />
                    <span className="absolute right-2 top-1 text-[10px] text-slate-500 font-mono">mm</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-emerald-800/60 rounded p-1.5 text-right">
                  <span className="text-[10px] text-slate-400 block">Valor Paquímetro:</span>
                  <span className="text-sm font-black font-mono text-emerald-400">
                    {caliperEmendaB.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">mm</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>Tolerância máx: <strong className="text-amber-300">0.10 mm (1 déc.)</strong></span>
              <strong className="text-emerald-300 font-bold">{caliperEmendaB.toFixed(2)} mm</strong>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 4: COTA E DIREITA (FINAL)                                            */}
          {/* ========================================================================= */}
          <div className="bg-slate-900/90 border border-cyan-800/80 rounded-lg p-3 relative overflow-hidden group shadow-lg flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-cyan-500"></div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center text-[10px] font-mono font-black text-cyan-300">
                    4
                  </span>
                  <span className="text-xs font-bold text-cyan-200">COTA E DIREITA</span>
                </div>
                <span className="text-[10px] text-cyan-400 uppercase font-mono font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
                  Ponta Final
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 items-center mt-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">Valor OP (E):</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={config.nominalEFinal}
                      onChange={(e) => onChangeConfig({ ...config, nominalEFinal: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-2.5 py-1 text-sm font-bold font-mono text-cyan-300"
                    />
                    <span className="absolute right-2 top-1 text-[10px] text-slate-500 font-mono">mm</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-cyan-800/60 rounded p-1.5 text-right">
                  <span className="text-[10px] text-slate-400 block">Valor Paquímetro:</span>
                  <span className="text-sm font-black font-mono text-cyan-400">
                    {caliperFinal.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">mm</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
              <span>Fórmula: {config.nominalEFinal} - {(config.holeDiameter/2).toFixed(1)} =</span>
              <strong className="text-cyan-300 font-bold">{caliperFinal.toFixed(2)} mm</strong>
            </div>
          </div>

        </div>

        {/* Advanced Tolerances Config Drawer */}
        {showAdvancedTolerances && (
          <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-300 font-medium block mb-1">Tolerância Pontas (Inicial/Final)</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">±</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5.0"
                  value={config.endToleranceMax}
                  onChange={(e) => onChangeConfig({ ...config, endToleranceMax: parseFloat(e.target.value) || 1.0, endToleranceMin: -(parseFloat(e.target.value) || 1.0) })}
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white"
                />
                <span className="text-slate-400">mm (Padrão: 1.0 ~ 2.0 mm)</span>
              </div>
            </div>

            <div>
              <span className="text-slate-300 font-medium block mb-1">Tolerância Face da Emenda (Individual)</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">±</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1.0"
                  value={config.jointTolerance}
                  onChange={(e) => onChangeConfig({ ...config, jointTolerance: parseFloat(e.target.value) || 0.10 })}
                  className="w-20 bg-slate-900 border border-amber-600 rounded px-2 py-1 font-mono text-amber-300 font-bold"
                />
                <span className="text-slate-400">mm (1 décimo = 0.10 mm)</span>
              </div>
            </div>

            <div>
              <span className="text-slate-300 font-medium block mb-1">Tolerância Total do Passo na Emenda</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">±</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="2.0"
                  value={config.jointTotalPitchTolerance}
                  onChange={(e) => onChangeConfig({ ...config, jointTotalPitchTolerance: parseFloat(e.target.value) || 0.20 })}
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-white"
                />
                <span className="text-slate-400">mm (Soma A + B máx: 0.20 mm)</span>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
