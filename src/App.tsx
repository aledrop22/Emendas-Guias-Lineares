/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { OPConfig, InspectionSet } from './types';
import { generateInitialSets, checkSetOverallStatus } from './utils/calculations';
import { Header } from './components/Header';
import { SpreadsheetView } from './components/SpreadsheetView';
import { RailVisualizer } from './components/RailVisualizer';
import { FresaView } from './components/FresaView';
import { CertificateModal } from './components/CertificateModal';
import { CaliperGuideModal } from './components/CaliperGuideModal';
import { ImportExportModal } from './components/ImportExportModal';

const STORAGE_KEY_CONFIG = 'proguide_op_config_v1';
const STORAGE_KEY_SETS = 'proguide_sets_v1';

const DEFAULT_CONFIG: OPConfig = {
  opNumber: '',
  itemNumber: '',
  salesOrder: '',
  client: '',
  inspectorName: '',
  inspectionDate: new Date().toISOString().slice(0, 10),
  engravingPattern: 'LETTERS_NUMBERS',
  modelId: 'HG30', // Hole D = 14.0 mm, exact match to spreadsheet!
  holeDiameter: 14.0,
  measurementReference: 'counterbore',
  nominalEInicial: 20.0,
  nominalEFinal: 20.0,
  piecesPerGuide: 2, // 2 pieces = 1 joint (Emenda A e B)
  nominalEJoints: [30.0, 30.0],
  endToleranceMin: -1.0,
  endToleranceMax: 1.0,
  jointTolerance: 0.10, // 1 décimo per face
  jointTotalPitchTolerance: 0.20
};

export default function App() {
  const [config, setConfig] = useState<OPConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved config', e);
      }
    }
    return DEFAULT_CONFIG;
  });

  const [sets, setSets] = useState<InspectionSet[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved sets', e);
      }
    }
    return generateInitialSets(2, 20, 30);
  });

  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'diagram' | 'fresa'>('spreadsheet');
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(sets));
  }, [sets]);

  // Handle changing total number of sets (e.g., 2 sets, 5 sets, etc.)
  const handleChangeNumberOfSets = (targetCount: number) => {
    const validCount = Math.max(1, Math.min(26, targetCount));
    if (validCount === sets.length) return;

    if (validCount < sets.length) {
      setSets(sets.slice(0, validCount));
    } else {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
      const jointsCount = Math.max(0, config.piecesPerGuide - 1);
      const newSets = [...sets];

      for (let i = sets.length; i < validCount; i++) {
        const nextNumber = i + 1;
        const nextLetter = letters[i] || `X${nextNumber}`;

        const jointEnds = [];
        for (let j = 1; j <= jointsCount; j++) {
          jointEnds.push({
            id: `joint-${nextNumber}-${j}-A`,
            label: jointsCount === 1 ? `Cota E Emenda A` : `Cota E Emenda ${j}A`,
            jointIndex: j,
            side: 'A' as const,
            nominalE: config.nominalEJoints[0] ?? 30,
            variation: 0,
            rawCaliperInput: null
          });
          jointEnds.push({
            id: `joint-${nextNumber}-${j}-B`,
            label: jointsCount === 1 ? `Cota E Emenda B` : `Cota E Emenda ${j}B`,
            jointIndex: j,
            side: 'B' as const,
            nominalE: config.nominalEJoints[1] ?? config.nominalEJoints[0] ?? 30,
            variation: 0,
            rawCaliperInput: null
          });
        }

        newSets.push({
          id: `set-${nextNumber}`,
          setNumber: nextNumber,
          letter: nextLetter,
          name: `${nextNumber}° CONJUNTO - ${nextLetter}`,
          cotaEInicial: {
            nominal: config.nominalEInicial,
            variation: 0,
            rawCaliperInput: null
          },
          cotaEFinal: {
            nominal: config.nominalEFinal,
            variation: 0,
            rawCaliperInput: null
          },
          jointEnds,
          serialNumber: `GL-${nextNumber.toString().padStart(3, '0')}`
        });
      }

      setSets(newSets);
    }
  };

  // Handle when piecesPerGuide or nominal values change to update all sets smoothly
  const handleConfigChange = (newConfig: OPConfig) => {
    // If piecesPerGuide changed, reconfigure joint ends for all sets while preserving existing variations if any
    if (newConfig.piecesPerGuide !== config.piecesPerGuide) {
      const jointsCount = Math.max(0, newConfig.piecesPerGuide - 1);
      const updatedSets = sets.map((s, sIdx) => {
        const newJointEnds = [];
        for (let j = 1; j <= jointsCount; j++) {
          const prevA = s.jointEnds.find(je => je.jointIndex === j && je.side === 'A');
          const prevB = s.jointEnds.find(je => je.jointIndex === j && je.side === 'B');

          newJointEnds.push({
            id: `joint-${sIdx + 1}-${j}-A`,
            label: jointsCount === 1 ? `Cota E Emenda A` : `Cota E Emenda ${j}A`,
            jointIndex: j,
            side: 'A' as const,
            nominalE: newConfig.nominalEJoints[0] ?? 30,
            variation: prevA?.variation || 0,
            rawCaliperInput: prevA?.rawCaliperInput || null
          });

          newJointEnds.push({
            id: `joint-${sIdx + 1}-${j}-B`,
            label: jointsCount === 1 ? `Cota E Emenda B` : `Cota E Emenda ${j}B`,
            jointIndex: j,
            side: 'B' as const,
            nominalE: newConfig.nominalEJoints[1] ?? newConfig.nominalEJoints[0] ?? 30,
            variation: prevB?.variation || 0,
            rawCaliperInput: prevB?.rawCaliperInput || null
          });
        }
        return {
          ...s,
          jointEnds: newJointEnds
        };
      });
      setSets(updatedSets);
    }
    setConfig(newConfig);
  };

  const handleUpdateSet = (index: number, updatedSet: InspectionSet) => {
    const newSets = [...sets];
    newSets[index] = updatedSet;
    setSets(newSets);
  };

  const handleAddSet = () => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
    const nextNumber = sets.length + 1;
    const nextLetter = letters[sets.length] || `X${nextNumber}`;
    const jointsCount = Math.max(0, config.piecesPerGuide - 1);

    const jointEnds = [];
    for (let j = 1; j <= jointsCount; j++) {
      jointEnds.push({
        id: `joint-${nextNumber}-${j}-A`,
        label: `Cota E Emenda ${j} - A`,
        jointIndex: j,
        side: 'A' as const,
        nominalE: config.nominalEJoints[0] ?? 30,
        variation: 0,
        rawCaliperInput: null
      });
      jointEnds.push({
        id: `joint-${nextNumber}-${j}-B`,
        label: `Cota E Emenda ${j} - B`,
        jointIndex: j,
        side: 'B' as const,
        nominalE: config.nominalEJoints[1] ?? config.nominalEJoints[0] ?? 30,
        variation: 0,
        rawCaliperInput: null
      });
    }

    const newSet: InspectionSet = {
      id: `set-${Date.now()}`,
      setNumber: nextNumber,
      letter: nextLetter,
      name: `${nextNumber}° CONJUNTO - ${nextLetter}`,
      cotaEInicial: {
        nominal: config.nominalEInicial,
        variation: 0,
        rawCaliperInput: null
      },
      cotaEFinal: {
        nominal: config.nominalEFinal,
        variation: 0,
        rawCaliperInput: null
      },
      jointEnds,
      serialNumber: `GL-${nextNumber.toString().padStart(3, '0')}`
    };

    setSets([...sets, newSet]);
  };

  const handleRemoveSet = (index: number) => {
    if (sets.length <= 1) return;
    const newSets = sets.filter((_, i) => i !== index);
    setSets(newSets);
  };

  const handleDuplicateSet = (index: number) => {
    const target = sets[index];
    const newSet = JSON.parse(JSON.stringify(target)) as InspectionSet;
    const nextNumber = sets.length + 1;
    newSet.id = `set-${Date.now()}`;
    newSet.setNumber = nextNumber;
    newSet.name = `${nextNumber}° CONJUNTO - Cópia de ${target.letter}`;
    newSet.serialNumber = `GL-${nextNumber.toString().padStart(3, '0')}`;
    setSets([...sets, newSet]);
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    setSets(generateInitialSets(2, 20, 30));
  };

  const handleImportData = (newConfig: OPConfig, newSets: InspectionSet[]) => {
    setConfig(newConfig);
    setSets(newSets);
  };

  // Compute Overall Stats
  let totalErrors = 0;
  let totalWarnings = 0;
  let passedCount = 0;

  sets.forEach(s => {
    const stat = checkSetOverallStatus(s, config);
    if (stat.status === 'REJECTED') totalErrors += stat.errorCount || 1;
    else if (stat.status === 'WARNING') totalWarnings += stat.warningCount || 1;
    else passedCount++;
  });

  const overallVerdict: 'OK' | 'WARNING' | 'REJECTED' = 
    totalErrors > 0 ? 'REJECTED' : totalWarnings > 0 ? 'WARNING' : 'OK';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500/30">
      
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCertificate={() => setIsCertificateOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onAddSet={handleAddSet}
        overallStatus={{
          status: overallVerdict,
          errorCount: totalErrors,
          warningCount: totalWarnings,
          totalSets: sets.length,
          passedSets: passedCount
        }}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Tab Content Views */}
        {activeTab === 'spreadsheet' && (
          <SpreadsheetView
            sets={sets}
            config={config}
            onUpdateSet={handleUpdateSet}
            onAddSet={handleAddSet}
            onRemoveSet={handleRemoveSet}
            onDuplicateSet={handleDuplicateSet}
          />
        )}

        {activeTab === 'diagram' && (
          <RailVisualizer
            sets={sets}
            config={config}
            onUpdateSet={handleUpdateSet}
          />
        )}

        {activeTab === 'fresa' && (
          <FresaView
            sets={sets}
            config={config}
            onUpdateConfig={handleConfigChange}
            onUpdateSet={handleUpdateSet}
            onChangeNumberOfSets={handleChangeNumberOfSets}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-800 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>
            Inspetor Metrológico de Guias Lineares · Padrão HIWIN Standard & ISO Metrology
          </span>
          <span className="font-mono text-slate-400">
            Tolerâncias: Pontas ±{config.endToleranceMax}mm | Emendas máx ±{config.jointTolerance}mm
          </span>
        </div>
      </footer>

      {/* Modals */}
      <CertificateModal
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        sets={sets}
        config={config}
      />

      <CaliperGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <ImportExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        config={config}
        sets={sets}
        onImportData={handleImportData}
        onResetDefaults={handleResetDefaults}
      />

    </div>
  );
}
