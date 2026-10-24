export type Language = 'ru' | 'kk';
export type BuildingKind = 'education' | 'office' | 'retail' | 'warehouse' | 'industrial' | 'other';
export type Hazard = 'A' | 'AE' | 'E' | 'B' | 'C' | 'D' | 'special';
export type Marker = { id: string; x: number; y: number; type: 'OP' | 'OU'; zoneId: string };
export type CheckAnswer = 'unknown' | 'ok' | 'attention' | 'na';
export type Inspection = { access: CheckAnswer; marking: CheckAnswer; passport: CheckAnswer; checkedOn?: string };
export type Asset = {
  id: string; label: string; model: string; type: 'OP' | 'OU';
  condition: 'unknown' | 'available' | 'service' | 'unusable'; nextService: string;
};
export type Point = { x:number; y:number };
export type RoomPreset = 'classroom'|'library'|'lab'|'gym'|'office'|'meeting'|'server'|'shop'|'storage'|'workshop'|'loading'|'corridor'|'stairs'|'toilet'|'generic';
export type LayoutRoom = { id:string; zoneId?:string; name:string; nameKk:string; points:Point[]; preset?:RoomPreset; autoOpenings?:boolean };
export type LayoutOpening = { id:string; roomId:string; edge:number; position:number; width:number; type:'door'|'window'; hinge:'start'|'end'; swing:'in'|'out'; auto?:boolean };
export type FloorLayout = { version:1; rooms:LayoutRoom[]; openings:LayoutOpening[]; example?:boolean };
export type Zone = {
  id: string; name: string; nameKk: string; area: number; hazard: Hazard;
  category: 'public' | 'AB' | 'V' | 'GD'; sensitive: boolean;
  temperature: 'normal' | 'cold' | 'unknown'; automatic: 'no' | 'yes' | 'unknown';
  existing: number; notes?: string; inspection?: Inspection; assets?: Asset[];
};
export type Floor = { id: string; name: string; nameKk: string; zones: Zone[]; plan?: string; markers: Marker[]; layout?:FloorLayout };
export type Building = { id: string; name: string; nameKk: string; address: string; addressKk: string; inspector: string; date: string; demo: boolean; revision: number; floors: Floor[]; kind?: BuildingKind; usage?: 'public'|'storage'|'production'|'unknown' };
export type CalculationRow = { zoneId: string; floorId: string; type: 'OP' | 'OU' | null; count: number; area: number; rate: number; issues: string[]; rules: string[] };
export type Snapshot = { id: string; createdAt: string; revision: number; rulesVersion: string; building: Building; rows: CalculationRow[]; floorExtras: { floorId: string; type: 'OP' | 'OU'; count: number }[]; totalOP: number; totalOU: number; incomplete: boolean; preliminary: true };
