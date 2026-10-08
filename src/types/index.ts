export interface HiwinGuideModel {
  id: string;
  series: 'HG' | 'EG' | 'RG' | 'MGN' | 'MGW' | 'WE' | 'QH' | 'QE' | 'CUSTOM';
  name: string;
  fullName: string;
  boltSize: string; // e.g. M8
  counterboreDiameter: number; // D (rebaixo do furo) in mm, e.g. 14.0 for HG30
  throughHoleDiameter: number; // d (furo passante) in mm, e.g. 9.0 for HG30
  counterboreDepth: number; // h in mm, e.g. 12.0
  standardPitch: number; // P in mm, e.g. 80.0
  minE: number; // E min in mm, e.g. 9.0
  standardE: number; // Standard E in mm, e.g. 20.0
  railWidth: number; // WR in mm, e.g. 28.0
  railHeight: number; // HR in mm, e.g. 26.0
  description: string;
}

export type MeasurementReferenceType = 'counterbore' | 'through_hole'; // D (rebaixo) or d (passante)

export interface JointEnd {
  id: string;
  label: string; // e.g. "Emenda 1 - Lado A", "Emenda 1 - Lado B"
  jointIndex: number; // 1-based index of the joint
  side: 'A' | 'B';
  nominalE: number; // e.g. 30.0 mm
  variation: number; // entered variation e.g. +0.05, 0, -0.1
  rawCaliperInput?: number | null; // direct caliper reading if entered
  isManuallyEdited?: boolean;
  isLaserEngraved?: boolean;
  laserTimestamp?: string;
  laserOperator?: string;
  isMillingMarked?: boolean; // Marcação manual na fresa
  millingTimestamp?: string;
  millingOperator?: string;
}

export interface InspectionSet {
  id: string;
  setNumber: number; // 1, 2, 3...
  letter: string; // A, B, C, D, E, F...
  name: string; // "1° CONJUNTO - A"
  cotaEInicial: {
    nominal: number; // e.g. 20.0
    variation: number; // e.g. 0.0 or +0.1
    rawCaliperInput?: number | null;
  };
  cotaEFinal: {
    nominal: number; // e.g. 20.0
    variation: number; // e.g. 0.0 or -0.2
    rawCaliperInput?: number | null;
  };
  jointEnds: JointEnd[]; // e.g. 2 ends for 1 joint, 4 ends for 2 joints
  serialNumber?: string;
  notes?: string;
  isLaserCompleted?: boolean;
  isMillingCompleted?: boolean; // Marcações manuais na fresa concluídas
}

export type EngravingPattern = 'LETTERS_NUMBERS' | 'LETTERS_ONLY' | 'SEQUENTIAL_LETTERS_NUMBERS' | 'AA_BB' | 'A1_A2' | 'AB_CD' | 'NUMERIC';

export interface OPConfig {
  opNumber: string;
  itemNumber: string; // Item da OP
  salesOrder: string; // Pedido de Venda
  client: string;
  inspectorName: string;
  inspectionDate: string;
  engravingPattern: EngravingPattern; // Padrão de gravação da fresa (A-A / B-B, etc.)
  modelId: string;
  customModelName?: string;
  holeDiameter: number; // D in mm (e.g. 14.0)
  measurementReference: MeasurementReferenceType; // Default 'counterbore'
  
  // Nominal Cotas for the batch
  nominalEInicial: number; // e.g. 20.0 mm
  nominalEFinal: number; // e.g. 20.0 mm
  
  // Pieces and Joints configuration
  piecesPerGuide: number; // e.g. 2 pieces = 1 joint, 3 pieces = 2 joints, 4 pieces = 3 joints
  nominalEJoints: number[]; // Nominal E for each joint face (default 30.0 mm)

  // Tolerances
  endToleranceMin: number; // -1.0 mm or -2.0 mm
  endToleranceMax: number; // +1.0 mm or +2.0 mm
  jointTolerance: number; // 0.10 mm (1 décimo per face)
  jointTotalPitchTolerance: number; // 0.20 mm (sum of both sides variation)
}

export interface ToleranceStatus {
  status: 'OK' | 'WARNING' | 'REJECTED';
  message: string;
  delta: number;
}
