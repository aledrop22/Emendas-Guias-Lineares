import React, { useRef } from 'react';
import { OPConfig, InspectionSet } from '../types';
import { Download, Upload, RotateCcw, X, FileSpreadsheet, Check } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: OPConfig;
  sets: InspectionSet[];
  onImportData: (config: OPConfig, sets: InspectionSet[]) => void;
  onResetDefaults: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  config,
  sets,
  onImportData,
  onResetDefaults
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const data = {
      app: 'PRO-GUIDE-METROLOGY',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      config,
      sets
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `OP_${config.opNumber || 'Lote'}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.config && json.sets) {
          onImportData(json.config, json.sets);
          onClose();
        } else {
          alert('Arquivo JSON inválido para esta aplicação.');
        }
      } catch (err) {
        alert('Erro ao processar o arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-base font-bold text-white font-display">
            Gerenciamento de Dados & Backup da OP
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3 text-xs">
          
          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <Download className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-bold text-white block">Salvar Backup Completo (.json)</span>
                <span className="text-slate-400 text-[11px]">Baixar todos os conjuntos, cotas e configurações da OP</span>
              </div>
            </div>
          </button>

          {/* Import JSON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-bold text-white block">Importar Arquivo (.json)</span>
                <span className="text-slate-400 text-[11px]">Carregar OP ou medições salvas anteriormente</span>
              </div>
            </div>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          {/* Reset Defaults */}
          <button
            onClick={() => {
              if (confirm('Deseja restaurar os dados para a Matriz padrão inicial?')) {
                onResetDefaults();
                onClose();
              }
            }}
            className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all group text-rose-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-bold text-rose-300 block">Restaurar Padrão da Matriz</span>
                <span className="text-slate-400 text-[11px]">Voltar para HG30 com os conjuntos zerados</span>
              </div>
            </div>
          </button>

        </div>

        {/* Footer */}
        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
