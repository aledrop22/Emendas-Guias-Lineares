import React from 'react';
import { X, HelpCircle, CheckCircle, AlertTriangle, Ruler } from 'lucide-react';

interface CaliperGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CaliperGuideModal: React.FC<CaliperGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-auto text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-bold">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Guia Metrológico: Como Medir no Paquímetro
              </h2>
              <p className="text-xs text-slate-400">
                Fundamentos do cálculo de Cota E e tolerâncias de emendas
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          
          <div className="bg-slate-950 p-4 rounded-xl border border-cyan-900/40 space-y-2">
            <span className="text-sm font-bold text-cyan-300 block">
              1. Por que o Paquímetro Mede (Cota E - Diâmetro / 2)?
            </span>
            <p>
              A <strong>Cota E</strong> é a distância de centro (da face extrema ou da emenda até a linha de centro do primeiro furo de fixação).
            </p>
            <p>
              Como não é possível apoiar o bico do paquímetro no ar no centro do furo, o operador apoia o encosto do paquímetro na <strong>face da guia</strong> e o bico móvel na <strong>parede interna do rebaixo do furo</strong>.
            </p>
            <div className="p-2.5 bg-slate-900 rounded border border-slate-800 font-mono text-cyan-200">
              Valor no Paquímetro = Cota E Nominal - (Diâmetro do Rebaixo / 2)
            </div>
            <p className="text-[11px] text-slate-400">
              Exemplo: Cota E = 20.00 mm e Furo D = 14.00 mm (Raio = 7.00 mm) → Leitura teórica no paquímetro = <strong>13.00 mm</strong>.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/40 space-y-2">
            <span className="text-sm font-bold text-amber-300 block">
              2. Regra Rigorosa de 1 Décimo na Emenda
            </span>
            <p>
              Nas emendas (juntas retificadas), a precisão é crítica para evitar o impacto e travamento das esferas/rolos dos patins durante a transição entre um trilho e outro.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
              <li><strong>Tolerância por face de emenda:</strong> Máximo de <strong className="text-amber-300">0.10 mm (1 décimo)</strong>.</li>
              <li><strong>Soma da emenda (Passo):</strong> Lado A + Lado B pode totalizar até 0.20 mm, mas nenhum dos lados pode isoladamente passar de 0.10 mm.</li>
              <li>Se o valor medido for exatamente o valor nominal teórico, a variação é <strong>0.00</strong> (Perfeito).</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/40 space-y-2">
            <span className="text-sm font-bold text-emerald-300 block">
              3. O que vai para o Certificado (Colunas em Verde)?
            </span>
            <p>
              O cliente final e o controle de qualidade precisam receber o <strong>Valor Final Real</strong> das cotas da guia (Cota E Inicial, Cota E Final e Cotas das Emendas).
            </p>
            <p>
              O sistema calcula automaticamente: <code className="text-emerald-300 font-mono">Cota Final = Cota Nominal da OP + Variação Medida</code> e gera o documento oficial com 1 clique no botão <strong>Certificado (Verde)</strong>.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
          >
            Entendido, Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
