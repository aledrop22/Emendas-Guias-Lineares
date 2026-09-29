import { HiwinGuideModel } from '../types';

export const HIWIN_GUIDE_CATALOG: HiwinGuideModel[] = [
  // HG Series (Série Pesada / Esferas 4 carreiras)
  {
    id: 'HG15',
    series: 'HG',
    name: 'HG15 (HGR15R / HGR15T)',
    fullName: 'HIWIN HG15 - Guia Linear Pesada (Parafuso M4)',
    boltSize: 'M4',
    counterboreDiameter: 7.5, // D
    throughHoleDiameter: 4.5, // d
    counterboreDepth: 5.3, // h
    standardPitch: 60.0, // P
    minE: 6.0,
    standardE: 20.0,
    railWidth: 15.0,
    railHeight: 15.0,
    description: 'Guia linear para cargas elevadas e alta rigidez. Furo rebaixo D=7.5mm / d=4.5mm.'
  },
  {
    id: 'HG20',
    series: 'HG',
    name: 'HG20 (HGR20R / HGR20T)',
    fullName: 'HIWIN HG20 - Guia Linear Pesada (Parafuso M5)',
    boltSize: 'M5',
    counterboreDiameter: 9.5, // D
    throughHoleDiameter: 6.0, // d
    counterboreDepth: 8.5, // h
    standardPitch: 60.0,
    minE: 7.0,
    standardE: 20.0,
    railWidth: 20.0,
    railHeight: 17.5,
    description: 'Guia linear para máquinas CNC e automação. Furo rebaixo D=9.5mm / d=6.0mm.'
  },
  {
    id: 'HG25',
    series: 'HG',
    name: 'HG25 (HGR25R / HGR25T)',
    fullName: 'HIWIN HG25 - Guia Linear Pesada (Parafuso M6)',
    boltSize: 'M6',
    counterboreDiameter: 11.0, // D
    throughHoleDiameter: 7.0, // d
    counterboreDepth: 9.0, // h
    standardPitch: 60.0,
    minE: 8.0,
    standardE: 20.0,
    railWidth: 23.0,
    railHeight: 22.0,
    description: 'Guia linear industrial padrão para centros de usinagem. Furo rebaixo D=11.0mm / d=7.0mm.'
  },
  {
    id: 'HG30',
    series: 'HG',
    name: 'HG30 (HGR30R / HGR30T)',
    fullName: 'HIWIN HG30 - Guia Linear Pesada (Parafuso M8)',
    boltSize: 'M8',
    counterboreDiameter: 14.0, // D (14mm - exatamente o da planilha!)
    throughHoleDiameter: 9.0, // d
    counterboreDepth: 12.0, // h
    standardPitch: 80.0,
    minE: 9.0,
    standardE: 20.0,
    railWidth: 28.0,
    railHeight: 26.0,
    description: 'Guia linear para altas cargas industriais. Furo rebaixo D=14.0mm / d=9.0mm.'
  },
  {
    id: 'HG35',
    series: 'HG',
    name: 'HG35 (HGR35R / HGR35T)',
    fullName: 'HIWIN HG35 - Guia Linear Pesada (Parafuso M8)',
    boltSize: 'M8',
    counterboreDiameter: 14.0, // D
    throughHoleDiameter: 9.0, // d
    counterboreDepth: 12.0, // h
    standardPitch: 80.0,
    minE: 9.0,
    standardE: 20.0,
    railWidth: 34.0,
    railHeight: 29.0,
    description: 'Guia linear para solicitações dinâmicas elevadas. Furo rebaixo D=14.0mm / d=9.0mm.'
  },
  {
    id: 'HG45',
    series: 'HG',
    name: 'HG45 (HGR45R / HGR45T)',
    fullName: 'HIWIN HG45 - Guia Linear Extra Pesada (Parafuso M12)',
    boltSize: 'M12',
    counterboreDiameter: 20.0, // D
    throughHoleDiameter: 14.0, // d
    counterboreDepth: 17.0, // h
    standardPitch: 105.0,
    minE: 12.0,
    standardE: 22.5,
    railWidth: 45.0,
    railHeight: 38.0,
    description: 'Guia linear para grandes centros de usinagem e prensas. Furo rebaixo D=20.0mm / d=14.0mm.'
  },
  {
    id: 'HG55',
    series: 'HG',
    name: 'HG55 (HGR55R / HGR55T)',
    fullName: 'HIWIN HG55 - Guia Linear Extra Pesada (Parafuso M14)',
    boltSize: 'M14',
    counterboreDiameter: 23.0, // D
    throughHoleDiameter: 16.0, // d
    counterboreDepth: 20.0, // h
    standardPitch: 120.0,
    minE: 14.0,
    standardE: 30.0,
    railWidth: 53.0,
    railHeight: 44.0,
    description: 'Guia linear para cargas superpesadas. Furo rebaixo D=23.0mm / d=16.0mm.'
  },
  {
    id: 'HG65',
    series: 'HG',
    name: 'HG65 (HGR65R / HGR65T)',
    fullName: 'HIWIN HG65 - Guia Linear Carga Máxima (Parafuso M16)',
    boltSize: 'M16',
    counterboreDiameter: 26.0, // D
    throughHoleDiameter: 18.0, // d
    counterboreDepth: 22.0, // h
    standardPitch: 150.0,
    minE: 15.0,
    standardE: 35.0,
    railWidth: 63.0,
    railHeight: 53.0,
    description: 'Guia linear máxima para equipamentos de laminação e pesados. Furo rebaixo D=26.0mm.'
  },

  // EG Series (Perfil Baixo / Low Profile)
  {
    id: 'EG15',
    series: 'EG',
    name: 'EG15 (EGR15R / EGR15U)',
    fullName: 'HIWIN EG15 - Perfil Baixo Compacto (Parafuso M3/M4)',
    boltSize: 'M3',
    counterboreDiameter: 6.0,
    throughHoleDiameter: 3.5,
    counterboreDepth: 4.5,
    standardPitch: 60.0,
    minE: 6.0,
    standardE: 20.0,
    railWidth: 15.0,
    railHeight: 12.5,
    description: 'Guia linear perfil baixo para espaços reduzidos. Furo rebaixo D=6.0mm.'
  },
  {
    id: 'EG20',
    series: 'EG',
    name: 'EG20 (EGR20R / EGR20U)',
    fullName: 'HIWIN EG20 - Perfil Baixo Compacto (Parafuso M5)',
    boltSize: 'M5',
    counterboreDiameter: 9.5,
    throughHoleDiameter: 6.0,
    counterboreDepth: 8.5,
    standardPitch: 60.0,
    minE: 7.0,
    standardE: 20.0,
    railWidth: 20.0,
    railHeight: 15.5,
    description: 'Guia linear perfil baixo. Furo rebaixo D=9.5mm.'
  },
  {
    id: 'EG25',
    series: 'EG',
    name: 'EG25 (EGR25R / EGR25U)',
    fullName: 'HIWIN EG25 - Perfil Baixo Compacto (Parafuso M6)',
    boltSize: 'M6',
    counterboreDiameter: 11.0,
    throughHoleDiameter: 7.0,
    counterboreDepth: 9.0,
    standardPitch: 60.0,
    minE: 8.0,
    standardE: 20.0,
    railWidth: 23.0,
    railHeight: 18.0,
    description: 'Guia linear perfil baixo para automação e pick-and-place. Furo rebaixo D=11.0mm.'
  },
  {
    id: 'EG30',
    series: 'EG',
    name: 'EG30 (EGR30R / EGR30U)',
    fullName: 'HIWIN EG30 - Perfil Baixo Compacto (Parafuso M8)',
    boltSize: 'M8',
    counterboreDiameter: 14.0,
    throughHoleDiameter: 9.0,
    counterboreDepth: 12.0,
    standardPitch: 80.0,
    minE: 9.0,
    standardE: 20.0,
    railWidth: 28.0,
    railHeight: 23.0,
    description: 'Guia linear perfil baixo para alta carga. Furo rebaixo D=14.0mm.'
  },

  // RG Series (Rolos Cilíndricos / Roller Type Ultra Rigidity)
  {
    id: 'RG25',
    series: 'RG',
    name: 'RG25 (RGR25R)',
    fullName: 'HIWIN RG25 - Guia de Rolos Alta Rigidez (Parafuso M6)',
    boltSize: 'M6',
    counterboreDiameter: 11.0,
    throughHoleDiameter: 7.0,
    counterboreDepth: 9.0,
    standardPitch: 30.0,
    minE: 8.0,
    standardE: 15.0,
    railWidth: 23.0,
    railHeight: 24.5,
    description: 'Guia com rolos cruzados para máxima rigidez. Furo rebaixo D=11.0mm.'
  },
  {
    id: 'RG30',
    series: 'RG',
    name: 'RG30 (RGR30R)',
    fullName: 'HIWIN RG30 - Guia de Rolos Alta Rigidez (Parafuso M8)',
    boltSize: 'M8',
    counterboreDiameter: 14.0,
    throughHoleDiameter: 9.0,
    counterboreDepth: 12.0,
    standardPitch: 40.0,
    minE: 9.0,
    standardE: 20.0,
    railWidth: 28.0,
    railHeight: 28.0,
    description: 'Guia com rolos para máquinas-ferramenta pesadas. Furo rebaixo D=14.0mm.'
  },
  {
    id: 'RG35',
    series: 'RG',
    name: 'RG35 (RGR35R)',
    fullName: 'HIWIN RG35 - Guia de Rolos Alta Rigidez (Parafuso M8)',
    boltSize: 'M8',
    counterboreDiameter: 14.0,
    throughHoleDiameter: 9.0,
    counterboreDepth: 12.0,
    standardPitch: 40.0,
    minE: 9.0,
    standardE: 20.0,
    railWidth: 34.0,
    railHeight: 32.0,
    description: 'Guia com rolos industriais. Furo rebaixo D=14.0mm.'
  },
  {
    id: 'RG45',
    series: 'RG',
    name: 'RG45 (RGR45R)',
    fullName: 'HIWIN RG45 - Guia de Rolos Extra Pesada (Parafuso M12)',
    boltSize: 'M12',
    counterboreDiameter: 20.0,
    throughHoleDiameter: 14.0,
    counterboreDepth: 17.0,
    standardPitch: 52.5,
    minE: 12.0,
    standardE: 22.5,
    railWidth: 45.0,
    railHeight: 40.0,
    description: 'Guia de rolos pesada para retíficas e fresadoras. Furo rebaixo D=20.0mm.'
  },

  // MGN Miniature Series
  {
    id: 'MGN09',
    series: 'MGN',
    name: 'MGN09 (MGNR09R)',
    fullName: 'HIWIN MGN09 - Guia Miniatura (Parafuso M3)',
    boltSize: 'M3',
    counterboreDiameter: 6.0,
    throughHoleDiameter: 3.5,
    counterboreDepth: 3.5,
    standardPitch: 20.0,
    minE: 5.0,
    standardE: 10.0,
    railWidth: 9.0,
    railHeight: 6.5,
    description: 'Guia linear miniatura para semicondutores e impressoras 3D. Furo rebaixo D=6.0mm.'
  },
  {
    id: 'MGN12',
    series: 'MGN',
    name: 'MGN12 (MGNR12R)',
    fullName: 'HIWIN MGN12 - Guia Miniatura (Parafuso M3)',
    boltSize: 'M3',
    counterboreDiameter: 6.0,
    throughHoleDiameter: 3.5,
    counterboreDepth: 3.5,
    standardPitch: 25.0,
    minE: 5.0,
    standardE: 10.0,
    railWidth: 12.0,
    railHeight: 8.0,
    description: 'Guia miniatura compacta. Furo rebaixo D=6.0mm.'
  },
  {
    id: 'MGN15',
    series: 'MGN',
    name: 'MGN15 (MGNR15R)',
    fullName: 'HIWIN MGN15 - Guia Miniatura (Parafuso M3)',
    boltSize: 'M3',
    counterboreDiameter: 6.0,
    throughHoleDiameter: 3.5,
    counterboreDepth: 3.5,
    standardPitch: 40.0,
    minE: 6.0,
    standardE: 15.0,
    railWidth: 15.0,
    railHeight: 10.0,
    description: 'Guia miniatura de alta capacidade. Furo rebaixo D=6.0mm.'
  },

  // Custom
  {
    id: 'CUSTOM',
    series: 'CUSTOM',
    name: 'Personalizado / Outro Fabricante',
    fullName: 'Modelo Personalizado (Configuração Livre de Diâmetro e Passo)',
    boltSize: 'Custom',
    counterboreDiameter: 14.0,
    throughHoleDiameter: 9.0,
    counterboreDepth: 12.0,
    standardPitch: 80.0,
    minE: 10.0,
    standardE: 20.0,
    railWidth: 28.0,
    railHeight: 26.0,
    description: 'Insira os valores de furo e passo sob medida para guias especiais ou de outros fabricantes.'
  }
];

export function getHiwinModel(modelId: string): HiwinGuideModel {
  return HIWIN_GUIDE_CATALOG.find((m) => m.id === modelId) || HIWIN_GUIDE_CATALOG[3]; // Default HG30
}
