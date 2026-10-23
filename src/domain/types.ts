export type Language = 'ru' | 'kk';
export type Hazard = 'A' | 'AE' | 'E' | 'B' | 'C' | 'D' | 'special';
export type Marker = { id: string; x: number; y: number; type: 'OP' | 'OU'; zoneId: string };
export type Zone = {
  id: string; name: string; nameKk: string; area: number; hazard: Hazard;
  category: 'public' | 'AB' | 'V' | 'GD'; sensitive: boolean;
  temperature: 'normal' | 'cold' | 'unknown'; automatic: 'no' | 'yes' | 'unknown';
  existing: number; notes?: string;
};
export type Floor = { id: string; name: string; nameKk: string; zones: Zone[]; plan?: string; markers: Marker[] };
export type Building = { id: string; name: string; nameKk: string; address: string; addressKk: string; inspector: string; date: string; demo: boolean; revision: number; floors: Floor[] };
export type CalculationRow = { zoneId: string; floorId: string; type: 'OP' | 'OU' | null; count: number; area: number; rate: number; issues: string[]; rules: string[] };
export type Snapshot = { id: string; createdAt: string; revision: number; rulesVersion: string; building: Building; rows: CalculationRow[]; floorExtras: { floorId: string; type: 'OP' | 'OU'; count: number }[]; totalOP: number; totalOU: number; incomplete: boolean; preliminary: true };
