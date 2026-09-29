import React from 'react';
import { 
  FileCheck, 
  Table, 
  Layers, 
  Eye, 
  PlusCircle, 
  Download, 
  Upload, 
  Calculator, 
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Stamp
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'spreadsheet' | 'diagram' | 'fresa';
  setActiveTab: (tab: 'spreadsheet' | 'diagram' | 'fresa') => void;
  onOpenCertificate: () => void;
  onOpenHelp: () => void;
  onOpenExport: () => void;
  onAddSet: () => void;
  overallStatus: {
    status: 'OK' | 'WARNING' | 'REJECTED';
    errorCount: number;
    warningCount: number;
    totalSets: number;
    passedSets: number;
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenCertificate,
  onOpenHelp,
  onOpenExport,
  onAddSet,
  overallStatus
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 text-white font-black text-base tracking-wider font-display">
            GL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg tracking-tight text-white">
                INSPETOR DE GUIAS LINEARES
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-medium">
                Cota E & Emendas
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Controle metrológico de paquímetro com catálogo HIWIN
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('spreadsheet')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'spreadsheet'
                ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Matriz</span>
          </button>

          <button
            onClick={() => setActiveTab('diagram')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'diagram'
                ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Diagrama Técnico</span>
          </button>

          <button
            onClick={() => setActiveTab('fresa')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'fresa'
                ? 'bg-amber-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/50'
            }`}
          >
            <Stamp className="w-3.5 h-3.5 text-amber-400" />
            <span>Fresa & Gravação</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Quick status summary */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            {overallStatus.status === 'OK' && (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{overallStatus.passedSets}/{overallStatus.totalSets} Aprovados</span>
              </span>
            )}
            {overallStatus.status === 'WARNING' && (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{overallStatus.warningCount} no Limite</span>
              </span>
            )}
            {overallStatus.status === 'REJECTED' && (
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <XCircle className="w-3.5 h-3.5" />
                <span>{overallStatus.errorCount} Fora Tolerância</span>
              </span>
            )}
          </div>

          <button
            onClick={onOpenHelp}
            title="Como medir no paquímetro"
            className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenExport}
            title="Exportar / Backup de Dados"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onAddSet}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors border border-slate-700 whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ Conjunto</span>
          </button>

          <button
            onClick={onOpenCertificate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all shadow-md shadow-emerald-900/30 whitespace-nowrap"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Certificado (Verde)</span>
          </button>
        </div>

      </div>
    </header>
  );
};
