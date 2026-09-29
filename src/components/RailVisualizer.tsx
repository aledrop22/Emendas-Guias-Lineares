import React, { useState } from 'react';
import { InspectionSet, OPConfig } from '../types';
import { 
  calculateTheoreticalCaliper, 
  calculateFinalCotaE, 
  checkEndCotaTolerance, 
  checkJointTolerance,
  checkJointPairTolerance,
  checkSetOverallStatus,
  formatVariation, 
  formatMm,
  getEngravingJointLabels
} from '../utils/calculations';
import { Layers, CheckCircle2, AlertTriangle, XCircle, Gauge, ArrowRight } from 'lucide-react';

interface RailVisualizerProps {
  sets: InspectionSet[];
  config: OPConfig;
  selectedSetId?: string;
  onUpdateSet?: (setIndex: number, updatedSet: InspectionSet) => void;
}

export const RailVisualizer: React.FC<RailVisualizerProps> = ({
  sets,
  config,
  selectedSetId,
  onUpdateSet
}) => {
  const [activeSetId, setActiveSetId] = useState(selectedSetId || sets[0]?.id || 'set-1');

  // Find index and active set
  const activeSetIndex = sets.findIndex(s => s.id === activeSetId);
  const currentSet = activeSetIndex >= 0 ? sets[activeSetIndex] : sets[0];
  if (!currentSet) return null;

  const numPieces = Math.max(1, config.piecesPerGuide);
  const numJoints = numPieces - 1;

  // 1. Initial Cota calculations from OP & Set Variation
  const initNominal = config.nominalEInicial;
  const initVariation = currentSet.cotaEInicial?.variation || 0;
  const initFinal = calculateFinalCotaE(initNominal, initVariation);
  const initTheoreticalPaq = calculateTheoreticalCaliper(initNominal, config.holeDiameter);
  const initRealPaq = Number((initFinal - config.holeDiameter / 2).toFixed(2));
  const initToleranceStat = checkEndCotaTolerance(initVariation, config.endToleranceMax);

  // 2. Final Cota calculations from OP & Set Variation
  const finalNominal = config.nominalEFinal;
  const finalVariation = currentSet.cotaEFinal?.variation || 0;
  const finalFinal = calculateFinalCotaE(finalNominal, finalVariation);
  const finalTheoreticalPaq = calculateTheoreticalCaliper(finalNominal, config.holeDiameter);
  const finalRealPaq = Number((finalFinal - config.holeDiameter / 2).toFixed(2));
  const finalToleranceStat = checkEndCotaTolerance(finalVariation, config.endToleranceMax);

  const overallStatus = checkSetOverallStatus(currentSet, config);

  // SVG Layout dimensions
  const pieceWidth = 280; // width per rail piece
  const jointGap = 6; // gap between pieces
  const leftMargin = 70;
  const topY = 130;
  const railHeight = 60;
  const svgTotalWidth = leftMargin * 2 + numPieces * pieceWidth + numJoints * jointGap;
  const svgTotalHeight = 350;

  return (
    <div className="space-y-6">
      
      {/* Set Selector Matching User Image */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-display">
            DIAGRAMA ESQUEMÁTICO DA GUIA COM EMENDA:
          </span>
        </div>

        {/* Dynamic Buttons for all selected sets */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
          {sets.map(s => {
            const isSelected = (currentSet.id === s.id);
            const setStat = checkSetOverallStatus(s, config);
            return (
              <button
                key={s.id}
                onClick={() => setActiveSetId(s.id)}
                className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40 ring-1 ring-cyan-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{s.name}</span>
                {setStat.status === 'OK' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                {setStat.status === 'WARNING' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                {setStat.status === 'REJECTED' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Blueprint Stage */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

        {/* Blueprint Title Bar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">
              Metrologia Dimensional de Guia Linear com Junta Retificada
            </span>
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <span>{currentSet.name}</span>
              <span className="text-slate-400 font-sans font-normal text-sm">
                — Modelo HIWIN {config.modelId} (Furo Ø {config.holeDiameter} mm | Raio r = {(config.holeDiameter/2).toFixed(1)} mm)
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 text-slate-300">
              Configuração: <strong className="text-cyan-300">{numPieces} {numPieces === 1 ? 'Peça' : 'Peças'}</strong> / <strong className="text-emerald-400">{numJoints} {numJoints === 1 ? 'Emenda' : 'Emendas'}</strong>
            </span>
            {overallStatus.status === 'OK' && (
              <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 rounded-lg border border-emerald-800 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Aprovado
              </span>
            )}
            {overallStatus.status === 'WARNING' && (
              <span className="px-2.5 py-1 bg-amber-950 text-amber-300 rounded-lg border border-amber-800 flex items-center gap-1 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" /> No Limite
              </span>
            )}
            {overallStatus.status === 'REJECTED' && (
              <span className="px-2.5 py-1 bg-rose-950 text-rose-300 rounded-lg border border-rose-800 flex items-center gap-1 font-bold animate-pulse">
                <XCircle className="w-3.5 h-3.5" /> Reprovado
              </span>
            )}
          </div>
        </div>

        {/* 2D SVG Blueprint */}
        <div className="relative z-10 w-full overflow-x-auto py-2">
          <svg 
            viewBox={`0 0 ${svgTotalWidth} ${svgTotalHeight}`} 
            className="w-full min-w-[760px] h-auto drop-shadow-2xl"
          >
            <defs>
              <linearGradient id="railGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>

            {/* Render Each Rail Piece */}
            {Array.from({ length: numPieces }).map((_, pIdx) => {
              const pieceLeft = leftMargin + pIdx * (pieceWidth + jointGap);
              const pieceRight = pieceLeft + pieceWidth;
              const isFirst = (pIdx === 0);
              const isLast = (pIdx === numPieces - 1);

              const holeInitX = pieceLeft + 80;
              const holeFinalX = pieceRight - 80;
              const holeMidX = pieceLeft + pieceWidth / 2;

              return (
                <g key={`piece-${pIdx}`}>
                  {/* Rail Body */}
                  <rect 
                    x={pieceLeft} 
                    y={topY} 
                    width={pieceWidth} 
                    height={railHeight} 
                    rx={4} 
                    fill="url(#railGrad)" 
                    stroke="#64748b" 
                    strokeWidth="2" 
                  />
                  
                  {/* Piece Title */}
                  <text 
                    x={pieceLeft + pieceWidth / 2} 
                    y={topY + 36} 
                    fill="#94a3b8" 
                    fontSize="13" 
                    fontWeight="bold" 
                    textAnchor="middle" 
                    fontFamily="Chakra Petch"
                  >
                    PEÇA {pIdx + 1}
                  </text>

                  {/* Initial Hole on Piece 1 */}
                  {isFirst && (
                    <g>
                      <circle cx={holeInitX} cy={topY + 30} r="22" fill="#0f172a" stroke="#0ea5e9" strokeWidth="2" />
                      <circle cx={holeInitX} cy={topY + 30} r="13" fill="#020617" stroke="#38bdf8" strokeWidth="1.5" />
                      <line x1={holeInitX - 8} y1={topY + 30} x2={holeInitX + 8} y2={topY + 30} stroke="#38bdf8" strokeWidth="1" />
                      <line x1={holeInitX} y1={topY + 22} x2={holeInitX} y2={topY + 38} stroke="#38bdf8" strokeWidth="1" />
                      <text x={holeInitX} y={topY + 76} fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="IBM Plex Mono">
                        Furo 1 (D={config.holeDiameter})
                      </text>

                      {/* Dimension: Cota E Inicial */}
                      <line x1={pieceLeft} y1="48" x2={holeInitX} y2="48" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
                      <line x1={pieceLeft} y1="36" x2={pieceLeft} y2="135" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
                      <line x1={holeInitX} y1="36" x2={holeInitX} y2="135" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
                      <circle cx={pieceLeft} cy="48" r="3" fill="#38bdf8" />
                      <circle cx={holeInitX} cy="48" r="3" fill="#38bdf8" />

                      {/* Blue E Inicial Badge */}
                      <rect x={pieceLeft + 2} y="30" width="112" height="24" rx="4" fill="#0369a1" fillOpacity="0.95" stroke="#38bdf8" strokeWidth="1" />
                      <text x={pieceLeft + 58} y="46" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="IBM Plex Mono">
                        E Inicial: {initFinal.toFixed(2)}
                      </text>

                      {/* Paquímetro Jaw for Initial */}
                      <path d={`M ${pieceLeft} 92 L ${pieceLeft} 74 L ${holeInitX - 13} 74 L ${holeInitX - 13} 92`} fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                      <rect x={pieceLeft + 4} y="76" width="102" height="18" rx="3" fill="#881337" fillOpacity="0.95" stroke="#f43f5e" strokeWidth="1" />
                      <text x={pieceLeft + 55} y="89" fill="#fda4af" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="IBM Plex Mono">
                        Paq: {initRealPaq.toFixed(2)}
                      </text>
                    </g>
                  )}

                  {/* Hole on left of intermediate piece */}
                  {!isFirst && (
                    <g>
                      <circle cx={holeInitX} cy={topY + 30} r="22" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                      <circle cx={holeInitX} cy={topY + 30} r="13" fill="#020617" stroke="#34d399" strokeWidth="1.5" />
                      <line x1={holeInitX - 8} y1={topY + 30} x2={holeInitX + 8} y2={topY + 30} stroke="#34d399" strokeWidth="1" />
                      <line x1={holeInitX} y1={topY + 22} x2={holeInitX} y2={topY + 38} stroke="#34d399" strokeWidth="1" />
                      <text x={holeInitX} y={topY + 76} fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="IBM Plex Mono">
                        Furo Emenda {pIdx}B
                      </text>
                    </g>
                  )}

                  {/* Middle hole if piece is wide enough */}
                  {numPieces <= 3 && (
                    <g>
                      <circle cx={holeMidX} cy={topY + 30} r="20" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                      <circle cx={holeMidX} cy={topY + 30} r="12" fill="#020617" stroke="#64748b" strokeWidth="1" />
                    </g>
                  )}

                  {/* Hole on right of piece before joint */}
                  {!isLast && (
                    <g>
                      <circle cx={holeFinalX} cy={topY + 30} r="22" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                      <circle cx={holeFinalX} cy={topY + 30} r="13" fill="#020617" stroke="#34d399" strokeWidth="1.5" />
                      <line x1={holeFinalX - 8} y1={topY + 30} x2={holeFinalX + 8} y2={topY + 30} stroke="#34d399" strokeWidth="1" />
                      <line x1={holeFinalX} y1={topY + 22} x2={holeFinalX} y2={topY + 38} stroke="#34d399" strokeWidth="1" />
                      <text x={holeFinalX} y={topY + 76} fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="IBM Plex Mono">
                        Furo Emenda {pIdx + 1}A
                      </text>
                    </g>
                  )}

                  {/* Final Hole on Last Piece */}
                  {isLast && (
                    <g>
                      <circle cx={holeFinalX} cy={topY + 30} r="22" fill="#0f172a" stroke="#0ea5e9" strokeWidth="2" />
                      <circle cx={holeFinalX} cy={topY + 30} r="13" fill="#020617" stroke="#38bdf8" strokeWidth="1.5" />
                      <line x1={holeFinalX - 8} y1={topY + 30} x2={holeFinalX + 8} y2={topY + 30} stroke="#38bdf8" strokeWidth="1" />
                      <line x1={holeFinalX} y1={topY + 22} x2={holeFinalX} y2={topY + 38} stroke="#38bdf8" strokeWidth="1" />
                      <text x={holeFinalX} y={topY + 76} fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="IBM Plex Mono">
                        Furo Final (D={config.holeDiameter})
                      </text>

                      {/* Dimension: Cota E Final */}
                      <line x1={holeFinalX} y1="48" x2={pieceRight} y2="48" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
                      <line x1={holeFinalX} y1="36" x2={holeFinalX} y2="135" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
                      <line x1={pieceRight} y1="36" x2={pieceRight} y2="135" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
                      <circle cx={holeFinalX} cy="48" r="3" fill="#38bdf8" />
                      <circle cx={pieceRight} cy="48" r="3" fill="#38bdf8" />

                      {/* Blue E Final Badge */}
                      <rect x={pieceRight - 114} y="30" width="112" height="24" rx="4" fill="#0369a1" fillOpacity="0.95" stroke="#38bdf8" strokeWidth="1" />
                      <text x={pieceRight - 58} y="46" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="IBM Plex Mono">
                        E Final: {finalFinal.toFixed(2)}
                      </text>

                      {/* Paquímetro Jaw for Final */}
                      <path d={`M ${holeFinalX + 13} 92 L ${holeFinalX + 13} 74 L ${pieceRight} 74 L ${pieceRight} 92`} fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                      <rect x={pieceRight - 106} y="76" width="102" height="18" rx="3" fill="#881337" fillOpacity="0.95" stroke="#f43f5e" strokeWidth="1" />
                      <text x={pieceRight - 55} y="89" fill="#fda4af" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="IBM Plex Mono">
                        Paq: {finalRealPaq.toFixed(2)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Render Each Joint & Dimensions between Piece j and Piece j+1 */}
            {Array.from({ length: numJoints }).map((_, jIdx) => {
              const jointIndex = jIdx + 1;
              const pieceLeftA = leftMargin + jIdx * (pieceWidth + jointGap);
              const pieceRightA = pieceLeftA + pieceWidth;
              const jointCenterX = pieceRightA + jointGap / 2;
              const pieceLeftB = pieceRightA + jointGap;

              const holeAX = pieceRightA - 80;
              const holeBX = pieceLeftB + 80;

              // Strictly sync with OP nominals & Set variations
              const sideA = currentSet.jointEnds[(jointIndex - 1) * 2];
              const sideB = currentSet.jointEnds[(jointIndex - 1) * 2 + 1];

              const nomA = config.nominalEJoints[(jointIndex - 1) * 2] ?? config.nominalEJoints[0] ?? 30;
              const nomB = config.nominalEJoints[(jointIndex - 1) * 2 + 1] ?? config.nominalEJoints[1] ?? config.nominalEJoints[0] ?? 30;

              const varA = sideA?.variation || 0;
              const varB = sideB?.variation || 0;

              const finalA = calculateFinalCotaE(nomA, varA);
              const finalB = calculateFinalCotaE(nomB, varB);
              const jointTotalPitch = (finalA + finalB);

              const realPaqA = Number((finalA - config.holeDiameter / 2).toFixed(2));
              const realPaqB = Number((finalB - config.holeDiameter / 2).toFixed(2));

              const engraving = getEngravingJointLabels(jointIndex, currentSet.letter || activeSetIndex + 1, config.engravingPattern);

              return (
                <g key={`joint-group-${jIdx}`}>
                  {/* Dotted Yellow Joint Line */}
                  <line 
                    x1={jointCenterX} 
                    y1="16" 
                    x2={jointCenterX} 
                    y2={topY + railHeight + 45} 
                    stroke="#eab308" 
                    strokeWidth="2" 
                    strokeDasharray="6 3" 
                  />
                  
                  {/* Joint Top Badge */}
                  <rect 
                    x={jointCenterX - 75} 
                    y="12" 
                    width="150" 
                    height="22" 
                    rx="4" 
                    fill="#713f12" 
                    fillOpacity="0.95" 
                    stroke="#eab308" 
                    strokeWidth="1.5" 
                  />
                  <text 
                    x={jointCenterX} 
                    y="27" 
                    fill="#fef08a" 
                    fontSize="10" 
                    fontWeight="bold" 
                    textAnchor="middle" 
                    fontFamily="IBM Plex Mono"
                  >
                    EMENDA {jointIndex} [{engraving.leftMark} | {engraving.rightMark}]
                  </text>

                  {/* Engraving Stamp On Rail Face Left */}
                  <rect x={pieceRightA - 30} y={topY + 6} width="24" height="14" rx="2" fill="#451a03" stroke="#f59e0b" strokeWidth="1" />
                  <text x={pieceRightA - 18} y={topY + 17} fill="#fbbf24" fontSize="9" fontFamily="monospace" fontWeight="black" textAnchor="middle">
                    {engraving.leftMark}
                  </text>

                  {/* Engraving Stamp On Rail Face Right */}
                  <rect x={pieceLeftB + 6} y={topY + 6} width="24" height="14" rx="2" fill="#451a03" stroke="#f59e0b" strokeWidth="1" />
                  <text x={pieceLeftB + 18} y={topY + 17} fill="#fbbf24" fontSize="9" fontFamily="monospace" fontWeight="black" textAnchor="middle">
                    {engraving.rightMark}
                  </text>

                  {/* Cota E Emenda A (Left of joint) */}
                  <line x1={holeAX} y1="48" x2={jointCenterX} y2="48" stroke="#10b981" strokeWidth="2" />
                  <line x1={holeAX} y1="36" x2={holeAX} y2="135" stroke="#10b981" strokeWidth="1" opacity="0.6" />
                  <circle cx={holeAX} cy="48" r="3" fill="#10b981" />
                  <circle cx={jointCenterX} cy="48" r="3" fill="#10b981" />

                  <rect x={jointCenterX - 105} y="30" width="100" height="24" rx="4" fill="#065f46" fillOpacity="0.95" stroke="#10b981" strokeWidth="1" />
                  <text x={jointCenterX - 55} y="46" fill="#d1fae5" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="IBM Plex Mono">
                    E {engraving.leftMark}: {finalA.toFixed(2)}
                  </text>

                  {/* Paquímetro reading Emenda A */}
                  <rect x={jointCenterX - 105} y="76" width="100" height="18" rx="3" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                  <text x={jointCenterX - 55} y="89" fill="#a7f3d0" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="IBM Plex Mono">
                    Paq: {realPaqA.toFixed(2)}
                  </text>

                  {/* Cota E Emenda B (Right of joint) */}
                  <line x1={jointCenterX} y1="48" x2={holeBX} y2="48" stroke="#10b981" strokeWidth="2" />
                  <line x1={holeBX} y1="36" x2={holeBX} y2="135" stroke="#10b981" strokeWidth="1" opacity="0.6" />
                  <circle cx={jointCenterX} cy="48" r="3" fill="#10b981" />
                  <circle cx={holeBX} cy="48" r="3" fill="#10b981" />

                  <rect x={jointCenterX + 5} y="30" width="100" height="24" rx="4" fill="#065f46" fillOpacity="0.95" stroke="#10b981" strokeWidth="1" />
                  <text x={jointCenterX + 55} y="46" fill="#d1fae5" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="IBM Plex Mono">
                    E {engraving.rightMark}: {finalB.toFixed(2)}
                  </text>

                  {/* Paquímetro reading Emenda B */}
                  <rect x={jointCenterX + 5} y="76" width="100" height="18" rx="3" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                  <text x={jointCenterX + 55} y="89" fill="#a7f3d0" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="IBM Plex Mono">
                    Paq: {realPaqB.toFixed(2)}
                  </text>

                  {/* Total Joint Pitch Dimension Below */}
                  <g transform="translate(0, 245)">
                    <line x1={holeAX} y1="20" x2={holeBX} y2="20" stroke="#10b981" strokeWidth="2" />
                    <line x1={holeAX} y1="10" x2={holeAX} y2="30" stroke="#10b981" strokeWidth="2" />
                    <line x1={holeBX} y1="10" x2={holeBX} y2="30" stroke="#10b981" strokeWidth="2" />
                    <rect x={jointCenterX - 105} y="28" width="210" height="24" rx="4" fill="#022c22" stroke="#059669" strokeWidth="1.5" />
                    <text x={jointCenterX} y="44" fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="IBM Plex Mono">
                      Passo Emenda {jointIndex} = {jointTotalPitch.toFixed(2)} mm
                    </text>
                  </g>
                </g>
              );
            })}

          </svg>
        </div>

        {/* Dynamic Dimensional Data Summary for Selected Set (Transferred directly from Matriz) */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-display flex items-center gap-1.5">
              <Gauge className="w-4 h-4" />
              <span>Valores Metrológicos Consolidados da Matriz — {currentSet.name}</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Fórmula: Valor Paquímetro = Cota E - ({config.holeDiameter}/2) = Cota E - {(config.holeDiameter/2).toFixed(1)} mm
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* E Inicial */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Cota "E" INICIAL</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  initToleranceStat.status === 'OK'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : initToleranceStat.status === 'WARNING'
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-rose-950 text-rose-300 border-rose-800 font-bold'
                }`}>
                  {initToleranceStat.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[9px] text-slate-400 block">Nominal OP:</span>
                  <strong className="text-slate-200">{initNominal.toFixed(2)} mm</strong>
                </div>
                <div>
                  <span className="text-[9px] text-rose-400 block">Variação (Δ):</span>
                  <strong className="text-rose-300">{formatVariation(initVariation)} mm</strong>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-400 block font-bold">Cota Final (Verde):</span>
                  <strong className="text-emerald-400 font-black">{initFinal.toFixed(2)} mm</strong>
                </div>
                <div>
                  <span className="text-[9px] text-cyan-400 block font-bold">Leitura Paquímetro:</span>
                  <strong className="text-cyan-300 font-black">{initRealPaq.toFixed(2)} mm</strong>
                </div>
              </div>
            </div>

            {/* Joints Summary */}
            {Array.from({ length: numJoints }).map((_, jIdx) => {
              const jointIndex = jIdx + 1;
              const sideA = currentSet.jointEnds[(jointIndex - 1) * 2];
              const sideB = currentSet.jointEnds[(jointIndex - 1) * 2 + 1];

              const nomA = config.nominalEJoints[(jointIndex - 1) * 2] ?? config.nominalEJoints[0] ?? 30;
              const nomB = config.nominalEJoints[(jointIndex - 1) * 2 + 1] ?? config.nominalEJoints[1] ?? config.nominalEJoints[0] ?? 30;

              const varA = sideA?.variation || 0;
              const varB = sideB?.variation || 0;

              const finalA = calculateFinalCotaE(nomA, varA);
              const finalB = calculateFinalCotaE(nomB, varB);
              const realPaqA = Number((finalA - config.holeDiameter / 2).toFixed(2));
              const realPaqB = Number((finalB - config.holeDiameter / 2).toFixed(2));

              const pairStat = checkJointPairTolerance(varA, varB, config.jointTolerance, config.jointTotalPitchTolerance);

              const engraving = getEngravingJointLabels(jointIndex, currentSet.letter || activeSetIndex + 1, config.engravingPattern);

              return (
                <div key={`joint-card-${jIdx}`} className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span>Emenda {jointIndex}</span>
                      <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                        [{engraving.leftMark} | {engraving.rightMark}]
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      pairStat.status === 'OK'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800 font-bold'
                    }`}>
                      {pairStat.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="text-[9px] text-emerald-400 block font-bold">Face {engraving.leftMark} (Peça {jointIndex}):</span>
                      <strong className="text-emerald-300">{finalA.toFixed(2)} mm</strong>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Paq: {realPaqA.toFixed(2)} mm</span>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="text-[9px] text-emerald-400 block font-bold">Face {engraving.rightMark} (Peça {jointIndex + 1}):</span>
                      <strong className="text-emerald-300">{finalB.toFixed(2)} mm</strong>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Paq: {realPaqB.toFixed(2)} mm</span>
                    </div>
                  </div>
                  <div className="pt-1 text-[10px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800">
                    <span>Passo Total da Junta:</span>
                    <strong className="text-emerald-400">{(finalA + finalB).toFixed(2)} mm</strong>
                  </div>
                </div>
              );
            })}

            {/* E Final */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Cota "E" FINAL</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  finalToleranceStat.status === 'OK'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : finalToleranceStat.status === 'WARNING'
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-rose-950 text-rose-300 border-rose-800 font-bold'
                }`}>
                  {finalToleranceStat.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[9px] text-slate-400 block">Nominal OP:</span>
                  <strong className="text-slate-200">{finalNominal.toFixed(2)} mm</strong>
                </div>
                <div>
                  <span className="text-[9px] text-rose-400 block">Variação (Δ):</span>
                  <strong className="text-rose-300">{formatVariation(finalVariation)} mm</strong>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-400 block font-bold">Cota Final (Verde):</span>
                  <strong className="text-emerald-400 font-black">{finalFinal.toFixed(2)} mm</strong>
                </div>
                <div>
                  <span className="text-[9px] text-cyan-400 block font-bold">Leitura Paquímetro:</span>
                  <strong className="text-cyan-300 font-black">{finalRealPaq.toFixed(2)} mm</strong>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Metrology Formula Guide Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-cyan-900/40">
            <span className="text-xs font-bold text-cyan-300 block mb-1">Como o Paquímetro Mede</span>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              Valor Medido = Cota E - (Diâmetro / 2)
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Para Cota E de {config.nominalEInicial}mm e furo de {config.holeDiameter}mm (raio {(config.holeDiameter/2).toFixed(1)}mm):
              <strong className="text-cyan-300 block">{config.nominalEInicial} - {(config.holeDiameter/2).toFixed(1)} = {initTheoreticalPaq.toFixed(2)} mm</strong>
            </p>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-amber-900/40">
            <span className="text-xs font-bold text-amber-300 block mb-1">Regra de Tolerância da Emenda</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Máximo de <strong className="text-amber-300">0.10 mm (1 décimo)</strong> por face de emenda.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Pode haver 1 décimo no Lado A e 1 décimo no Lado B (total máximo 2 décimos no passo), mas nenhuma face individual pode exceder 1 décimo!
            </p>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-emerald-900/40">
            <span className="text-xs font-bold text-emerald-300 block mb-1">Certificado de Qualidade</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              No certificado são gravados os <strong>valores finais em verde</strong> (Nominal + Variação encontrada).
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Se a variação for 0.00, a cota final permanece perfeitamente nominal.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
