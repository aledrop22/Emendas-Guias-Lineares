import { OPConfig, InspectionSet, JointEnd, ToleranceStatus, EngravingPattern } from '../types';

/**
 * Returns the engraving identification marks for linear guide splices
 * Dynamic progression by set (Conjunto 1 = A, Conjunto 2 = B, Conjunto 3 = C...)
 * and by joint (Emenda 1, 2, 3...)
 */
export function getEngravingJointLabels(
  jointIndex: number, // 1-based index (1, 2, 3, 4...)
  setIdentifier: number | string = 1, // 1 or 'A', 2 or 'B', etc.
  pattern: EngravingPattern = 'LETTERS_NUMBERS'
): { leftMark: string; rightMark: string; pairLabel: string } {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  
  // Resolve set letter & set zero-based index
  let setIndex = 0;
  let setLetter = 'A';
  if (typeof setIdentifier === 'number') {
    setIndex = Math.max(0, setIdentifier - 1);
    setLetter = letters[setIndex % letters.length] || 'A';
  } else if (typeof setIdentifier === 'string') {
    const cleanStr = setIdentifier.trim().toUpperCase();
    const foundIdx = letters.indexOf(cleanStr);
    if (foundIdx >= 0) {
      setIndex = foundIdx;
      setLetter = cleanStr;
    } else {
      setLetter = cleanStr || 'A';
    }
  }

  const jNum = Math.max(1, jointIndex);
  const jIdx = jNum - 1;

  switch (pattern) {
    case 'LETTERS_ONLY':
    case 'AA_BB': {
      // Padrão de Letras: Emenda 1 = A-A, Emenda 2 = B-B... ou por conjunto
      const letterIdx = (setIndex * 4 + jIdx) % letters.length;
      const letter = letters[letterIdx] || `L${jNum}`;
      return {
        leftMark: letter,
        rightMark: letter,
        pairLabel: `Emenda ${jNum} (${letter} - ${letter})`
      };
    }

    case 'SEQUENTIAL_LETTERS_NUMBERS':
    case 'AB_CD': {
      // Padrão Sequencial Letras e Números (A1-B1, A2-B2... / C1-D1, C2-D2...)
      const baseIdx = (setIndex * 2) % letters.length;
      const leftChar = letters[baseIdx] || 'A';
      const rightChar = letters[(baseIdx + 1) % letters.length] || 'B';
      const leftMark = `${leftChar}${jNum}`;
      const rightMark = `${rightChar}${jNum}`;
      return {
        leftMark,
        rightMark,
        pairLabel: `Emenda ${jNum} (${leftMark} - ${rightMark})`
      };
    }

    case 'NUMERIC': {
      const numStr = `${jNum}`;
      return {
        leftMark: numStr,
        rightMark: numStr,
        pairLabel: `Emenda ${jNum} (${numStr} - ${numStr})`
      };
    }

    case 'LETTERS_NUMBERS':
    case 'A1_A2':
    default: {
      // Padrão Letras e Números (Mais usado):
      // Conjunto 1 (A): A1-A1, A2-A2, A3-A3...
      // Conjunto 2 (B): B1-B1, B2-B2, B3-B3...
      // Conjunto 3 (C): C1-C1, C2-C2, C3-C3...
      const mark = `${setLetter}${jNum}`;
      return {
        leftMark: mark,
        rightMark: mark,
        pairLabel: `Emenda ${jNum} (${mark} - ${mark})`
      };
    }
  }
}

/**
 * Calculates theoretical caliper reading (Valor Paquímetro)
 * Formula: E - (HoleDiameter / 2)
 */
export function calculateTheoreticalCaliper(cotaE: number, holeDiameter: number): number {
  return Number((cotaE - holeDiameter / 2).toFixed(3));
}

/**
 * Calculates Final Cota E from Nominal and Variation
 */
export function calculateFinalCotaE(nominal: number, variation: number): number {
  return Number((nominal + (variation || 0)).toFixed(3));
}

/**
 * Calculates variation from a measured caliper value
 * Variation = MeasuredCaliper - TheoreticalCaliper
 */
export function calculateVariationFromCaliper(
  measuredCaliper: number,
  nominalE: number,
  holeDiameter: number
): number {
  const theoretical = calculateTheoreticalCaliper(nominalE, holeDiameter);
  return Number((measuredCaliper - theoretical).toFixed(3));
}

/**
 * Checks tolerance for initial and final end Cotas (tolerance: 1mm to 2mm)
 */
export function checkEndCotaTolerance(
  variation: number,
  maxTolerance: number = 1.0
): ToleranceStatus {
  const absVar = Math.abs(variation || 0);
  const roundedAbs = Number(absVar.toFixed(3));

  if (roundedAbs === 0) {
    return {
      status: 'OK',
      message: 'Perfeito (0.00 mm)',
      delta: variation
    };
  }

  if (roundedAbs <= maxTolerance * 0.75) {
    return {
      status: 'OK',
      message: `Dentro da tolerância (±${maxTolerance.toFixed(1)} mm)`,
      delta: variation
    };
  }

  if (roundedAbs <= maxTolerance) {
    return {
      status: 'WARNING',
      message: `No limite de tolerância (${variation > 0 ? '+' : ''}${variation.toFixed(2)} mm)`,
      delta: variation
    };
  }

  return {
    status: 'REJECTED',
    message: `Fora de tolerância! Excedeu ±${maxTolerance.toFixed(1)} mm`,
    delta: variation
  };
}

/**
 * Checks tolerance for Joint (Emenda) Cota (strict 0.10 mm = 1 décimo per face)
 */
export function checkJointTolerance(
  variation: number,
  limit: number = 0.10
): ToleranceStatus {
  const absVar = Math.abs(variation || 0);
  const roundedAbs = Number(absVar.toFixed(3));

  if (roundedAbs === 0) {
    return {
      status: 'OK',
      message: 'Perfeito (0.00 mm)',
      delta: variation
    };
  }

  // 1 tenth tolerance (0.10 mm)
  if (roundedAbs <= limit * 0.8) {
    return {
      status: 'OK',
      message: `Dentro da tolerância (máx ±${limit.toFixed(2)} mm)`,
      delta: variation
    };
  }

  if (roundedAbs <= limit + 0.0001) {
    return {
      status: 'WARNING',
      message: `No limite de 1 décimo (${variation > 0 ? '+' : ''}${variation.toFixed(2)} mm)`,
      delta: variation
    };
  }

  return {
    status: 'REJECTED',
    message: `FORA DA TOLERÂNCIA! Excede 1 décimo (±${limit.toFixed(2)} mm)`,
    delta: variation
  };
}

/**
 * Checks the full Joint assembly (combined Side A + Side B)
 */
export function checkJointPairTolerance(
  varA: number,
  varB: number,
  individualLimit: number = 0.10,
  combinedLimit: number = 0.20
): { status: 'OK' | 'WARNING' | 'REJECTED'; message: string; totalDelta: number } {
  const absA = Math.abs(varA || 0);
  const absB = Math.abs(varB || 0);
  const totalDelta = Number(((varA || 0) + (varB || 0)).toFixed(3));
  const absTotal = Math.abs(totalDelta);

  if (absA > individualLimit + 0.0001) {
    return {
      status: 'REJECTED',
      message: `Lado A ultrapassou o limite de 1 décimo (${varA.toFixed(2)} mm)`,
      totalDelta
    };
  }

  if (absB > individualLimit + 0.0001) {
    return {
      status: 'REJECTED',
      message: `Lado B ultrapassou o limite de 1 décimo (${varB.toFixed(2)} mm)`,
      totalDelta
    };
  }

  if (absTotal > combinedLimit + 0.0001) {
    return {
      status: 'REJECTED',
      message: `Variação total do passo da emenda (${totalDelta.toFixed(2)} mm) excedeu ${combinedLimit.toFixed(2)} mm`,
      totalDelta
    };
  }

  if (absTotal === 0 && absA === 0 && absB === 0) {
    return {
      status: 'OK',
      message: 'Emenda 100% Zerada / Nominal',
      totalDelta
    };
  }

  return {
    status: 'OK',
    message: `Emenda Aprovada (Variação Total: ${totalDelta >= 0 ? '+' : ''}${totalDelta.toFixed(2)} mm)`,
    totalDelta
  };
}

/**
 * Checks overall status for an inspection set
 */
export function checkSetOverallStatus(
  set: InspectionSet,
  config: OPConfig
): { status: 'OK' | 'WARNING' | 'REJECTED'; errorCount: number; warningCount: number } {
  let errorCount = 0;
  let warningCount = 0;

  // Check initial and final
  const statInit = checkEndCotaTolerance(set.cotaEInicial.variation, config.endToleranceMax);
  if (statInit.status === 'REJECTED') errorCount++;
  else if (statInit.status === 'WARNING') warningCount++;

  const statFinal = checkEndCotaTolerance(set.cotaEFinal.variation, config.endToleranceMax);
  if (statFinal.status === 'REJECTED') errorCount++;
  else if (statFinal.status === 'WARNING') warningCount++;

  // Check joint ends
  for (const j of set.jointEnds) {
    const statJ = checkJointTolerance(j.variation, config.jointTolerance);
    if (statJ.status === 'REJECTED') errorCount++;
    else if (statJ.status === 'WARNING') warningCount++;
  }

  // Check joint pairs
  for (let i = 0; i < set.jointEnds.length; i += 2) {
    const sideA = set.jointEnds[i];
    const sideB = set.jointEnds[i + 1];
    if (sideA && sideB) {
      const pairStat = checkJointPairTolerance(
        sideA.variation,
        sideB.variation,
        config.jointTolerance,
        config.jointTotalPitchTolerance
      );
      if (pairStat.status === 'REJECTED') errorCount++;
    }
  }

  if (errorCount > 0) return { status: 'REJECTED', errorCount, warningCount };
  if (warningCount > 0) return { status: 'WARNING', errorCount, warningCount };
  return { status: 'OK', errorCount, warningCount };
}

/**
 * Format numbers cleanly in mm
 */
export function formatMm(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined || isNaN(val)) return '0.00';
  return Number(val).toFixed(decimals);
}

/**
 * Format variation with explicit sign (+0.10, -0.05, 0.00)
 */
export function formatVariation(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val) || Math.abs(val) < 0.0001) {
    return '0.00';
  }
  const str = Number(val).toFixed(2);
  return val > 0 ? `+${str}` : str;
}

/**
 * Generate sets for a specific number of sets and pieces (joints = pieces - 1)
 */
export function generateSets(
  numberOfSets: number = 6,
  piecesCount: number = 2,
  nominalE: number = 20,
  nominalEmenda: number = 30
): InspectionSet[] {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  const count = Math.max(1, numberOfSets);
  const sets: InspectionSet[] = [];

  for (let i = 0; i < count; i++) {
    const letter = letters[i] || `X${i + 1}`;
    const jointEnds: JointEnd[] = [];

    const jointsCount = Math.max(0, piecesCount - 1);
    for (let j = 1; j <= jointsCount; j++) {
      jointEnds.push({
        id: `joint-${i + 1}-${j}-A`,
        label: jointsCount === 1 ? `Cota E Emenda A` : `Cota E Emenda ${j}A`,
        jointIndex: j,
        side: 'A',
        nominalE: nominalEmenda,
        variation: 0,
        rawCaliperInput: null
      });
      jointEnds.push({
        id: `joint-${i + 1}-${j}-B`,
        label: jointsCount === 1 ? `Cota E Emenda B` : `Cota E Emenda ${j}B`,
        jointIndex: j,
        side: 'B',
        nominalE: nominalEmenda,
        variation: 0,
        rawCaliperInput: null
      });
    }

    sets.push({
      id: `set-${i + 1}`,
      setNumber: i + 1,
      letter: letter,
      name: `${i + 1}° CONJUNTO - ${letter}`,
      cotaEInicial: {
        nominal: nominalE,
        variation: 0,
        rawCaliperInput: null
      },
      cotaEFinal: {
        nominal: nominalE,
        variation: 0,
        rawCaliperInput: null
      },
      jointEnds,
      serialNumber: `GL-${(i + 1).toString().padStart(3, '0')}`
    });
  }

  return sets;
}

/**
 * Generate default sets (compat wrapper)
 */
export function generateInitialSets(piecesCount: number = 2, nominalE: number = 20, nominalEmenda: number = 30): InspectionSet[] {
  return generateSets(6, piecesCount, nominalE, nominalEmenda);
}
