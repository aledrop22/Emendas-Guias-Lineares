import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { InspectionSet, OPConfig } from '../types';
import { 
  calculateFinalCotaE, 
  checkSetOverallStatus, 
  formatMm,
  formatVariation
} from '../utils/calculations';
import { 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Award,
  ShieldCheck
} from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  sets: InspectionSet[];
  config: OPConfig;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  sets,
  config
}) => {
  useEffect(() => {
    if (isOpen) {
      // Check if all are approved
      const allApproved = sets.every(s => checkSetOverallStatus(s, config).status !== 'REJECTED');
      if (allApproved) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  }, [isOpen, sets, config]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'Conjunto',
      'Identificacao',
      'Cota E Inicial (mm)',
      'Variacao E Inicial (mm)',
      ...sets[0]?.jointEnds.map(j => `${j.label} Final (mm)`) || [],
      'Cota E Final (mm)',
      'Variacao E Final (mm)',
      'Status Inspecao'
    ];

    const rows = sets.map(s => {
      const initFinal = calculateFinalCotaE(config.nominalEInicial, s.cotaEInicial.variation);
      const finalFinal = calculateFinalCotaE(config.nominalEFinal, s.cotaEFinal.variation);
      const stat = checkSetOverallStatus(s, config);
      const jointValues = s.jointEnds.map(j => calculateFinalCotaE(j.nominalE || 30, j.variation).toFixed(2));

      return [
        s.name,
        s.serialNumber || '',
        initFinal.toFixed(2),
        formatVariation(s.cotaEInicial.variation),
        ...jointValues,
        finalFinal.toFixed(2),
        formatVariation(s.cotaEFinal.variation),
        stat.status === 'OK' ? 'APROVADO' : stat.status === 'WARNING' ? 'APROVADO C/ RESSALVA' : 'REPROVADO'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Certificado_Guias_${config.opNumber || 'OP'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const overallApproval = sets.every(s => checkSetOverallStatus(s, config).status !== 'REJECTED');
  const rejectedCount = sets.filter(s => checkSetOverallStatus(s, config).status === 'REJECTED').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Certificado de Inspeção e Controle de Qualidade
              </h2>
              <p className="text-xs text-emerald-400 font-mono">
                Valores em verde extraídos para laudo de conformidade técnica
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-cyan-900/40"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Gerar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Document Sheet */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-slate-900 font-sans">
          
          {/* Certificate Header */}
          <div className="border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 bg-slate-900 text-white font-black flex items-center justify-center rounded text-sm font-display">
                    GL
                  </div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase font-display">
                    CERTIFICADO DE CONFORMIDADE METROLÓGICA
                  </h1>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Inspeção Dimensional de Guias Lineares com Emenda Retificada (Catálogo HIWIN)
                </p>
              </div>

              {/* Approval Stamp */}
              <div className="text-right">
                <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border-2 font-display font-black text-xs uppercase tracking-wider ${
                  overallApproval 
                    ? 'border-emerald-600 text-emerald-800 bg-emerald-50' 
                    : 'border-rose-600 text-rose-800 bg-rose-50'
                }`}>
                  {overallApproval ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>LOTE 100% APROVADO</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>LOTE COM {rejectedCount} REPROVAÇÃO(ÕES)</span>
                    </>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  Emissão: {config.inspectionDate || new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            {/* OP Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Ordem de Produção:</span>
                <strong className="text-sm font-mono text-slate-900">{config.opNumber || 'NÃO INFORMADA'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Cliente / Projeto:</span>
                <strong className="text-sm text-slate-900">{config.client || 'Geral'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Modelo da Guia:</span>
                <strong className="text-sm font-mono text-slate-900">HIWIN {config.modelId} (Ø {config.holeDiameter}mm)</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Inspetor Responsável:</span>
                <strong className="text-sm text-slate-900">{config.inspectorName || 'Controle de Qualidade'}</strong>
              </div>
            </div>
          </div>

          {/* Reference Tolerances Banner */}
          <div className="mb-6 p-3 bg-slate-100 border-l-4 border-slate-800 rounded-r text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-800">Parâmetros Normativos da OP:</span>
              <span className="text-slate-600 ml-2">
                Cota E Inicial Nominal: <strong className="font-mono">{config.nominalEInicial} mm</strong> | 
                Cota E Final Nominal: <strong className="font-mono">{config.nominalEFinal} mm</strong> | 
                Cota Emenda Nominal: <strong className="font-mono">{config.nominalEJoints[0] || 30} mm</strong>
              </span>
            </div>
            <div className="font-mono text-[11px] text-slate-700">
              Tol. Pontas: <strong className="text-slate-900">±{config.endToleranceMax}mm</strong> | Tol. Emenda: <strong className="text-slate-900">±{config.jointTolerance}mm (1 décimo)</strong>
            </div>
          </div>

          {/* Master Certificate Table (Green Values) */}
          <div className="border border-slate-300 rounded-lg overflow-hidden mb-6 shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold font-display uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3 border-r border-slate-700">Conjunto</th>
                  <th className="py-2.5 px-3 border-r border-slate-700">Identificação</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-700 bg-emerald-950 text-emerald-300">
                    Cota E Inicial (Verde)
                  </th>
                  {sets[0]?.jointEnds.map((j, idx) => (
                    <th key={idx} className="py-2.5 px-3 text-center border-r border-slate-700 bg-emerald-950 text-emerald-300">
                      {j.label} (Verde)
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-center border-r border-slate-700 bg-emerald-950 text-emerald-300">
                    Cota E Final (Verde)
                  </th>
                  <th className="py-2.5 px-3 text-center">Status / Laudo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {sets.map((set, idx) => {
                  const stat = checkSetOverallStatus(set, config);
                  const initFinal = calculateFinalCotaE(config.nominalEInicial, set.cotaEInicial.variation);
                  const finalFinal = calculateFinalCotaE(config.nominalEFinal, set.cotaEFinal.variation);

                  return (
                    <tr key={set.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-2 px-3 font-bold font-sans text-slate-900 border-r border-slate-200">
                        {set.name}
                      </td>
                      <td className="py-2 px-3 text-slate-600 border-r border-slate-200">
                        {set.serialNumber || `GL-${idx + 1}`}
                      </td>
                      
                      {/* E Inicial (Verde) */}
                      <td className="py-2 px-3 text-center border-r border-slate-200 bg-emerald-50/50">
                        <strong className="text-emerald-900 text-sm">{initFinal.toFixed(2)}</strong>
                        <span className="text-[10px] text-slate-500 block font-sans">
                          (Var: {formatVariation(set.cotaEInicial.variation)})
                        </span>
                      </td>

                      {/* Joint Ends (Verde) */}
                      {set.jointEnds.map((j) => {
                        const nom = j.nominalE || config.nominalEJoints[0] || 30;
                        const jFinal = calculateFinalCotaE(nom, j.variation);
                        return (
                          <td key={j.id} className="py-2 px-3 text-center border-r border-slate-200 bg-emerald-50/50">
                            <strong className="text-emerald-900 text-sm">{jFinal.toFixed(2)}</strong>
                            <span className="text-[10px] text-slate-500 block font-sans">
                              (Var: {formatVariation(j.variation)})
                            </span>
                          </td>
                        );
                      })}

                      {/* E Final (Verde) */}
                      <td className="py-2 px-3 text-center border-r border-slate-200 bg-emerald-50/50">
                        <strong className="text-emerald-900 text-sm">{finalFinal.toFixed(2)}</strong>
                        <span className="text-[10px] text-slate-500 block font-sans">
                          (Var: {formatVariation(set.cotaEFinal.variation)})
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 text-center font-sans font-bold">
                        {stat.status === 'OK' && (
                          <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                            ✓ APROVADO
                          </span>
                        )}
                        {stat.status === 'WARNING' && (
                          <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                            ⚠ NO LIMITE
                          </span>
                        )}
                        {stat.status === 'REJECTED' && (
                          <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                            ✕ REPROVADO
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Metrology & Quality Statement */}
          <div className="text-[11px] text-slate-600 leading-relaxed space-y-1 mb-10 border-t border-slate-200 pt-4">
            <p>
              <strong>Declaração de Conformidade Técnica:</strong> As medições constantes neste relatório foram aferidas por paquímetro digital calibrado com resolução milesimal/centesimal, respeitando o raio do rebaixo do parafuso (D/2) e a tolerância máxima admissível de 1/10 mm (0.10 mm) por face de junta retificada nas emendas.
            </p>
            <p className="text-slate-500">
              Este certificado atesta a compatibilidade e intercambiabilidade mecânica dos trilhos e patins conforme as especificações HIWIN Standard.
            </p>
          </div>

          {/* Signatures Row */}
          <div className="grid grid-cols-2 gap-12 pt-6 border-t border-slate-300">
            <div className="text-center">
              <div className="border-b border-slate-400 pb-1 mb-1.5 h-10 flex items-end justify-center font-serif italic text-slate-800">
                {config.inspectorName || '__________________________'}
              </div>
              <span className="text-xs font-bold text-slate-900 block">Inspetor Metrológico</span>
              <span className="text-[10px] text-slate-500">Assinatura & Carimbo</span>
            </div>

            <div className="text-center">
              <div className="border-b border-slate-400 pb-1 mb-1.5 h-10 flex items-end justify-center font-serif italic text-slate-800">
                Garantia da Qualidade (CQ)
              </div>
              <span className="text-xs font-bold text-slate-900 block">Engenharia / Controle de Qualidade</span>
              <span className="text-[10px] text-slate-500">Aprovação Final da OP</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
