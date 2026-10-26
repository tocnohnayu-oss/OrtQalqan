/** Session-only view data. This module never edits Building or writes browser storage. */
export function modelGeometryKey(building){
  return JSON.stringify(building.floors.map(floor=>[floor.id,floor.layout?.rooms.map(room=>[room.id,room.zoneId,room.preset,room.rotation,room.points])||[],floor.layout?.openings||[]]));
}
export function modelLocation(building,zoneId){
  for(const floor of building.floors){const zone=floor.zones.find(zone=>zone.id===zoneId),room=floor.layout?.rooms.find(room=>room.zoneId===zoneId);if(zone&&room)return {floorId:floor.id,zoneId:zone.id};}
  return null;
}
export function validModelCamera(camera){
  return !!camera&&[camera.position,camera.target].every(vector=>Array.isArray(vector)&&vector.length===3&&vector.every(value=>Number.isFinite(value)&&Math.abs(value)<1e6))
    &&['aspect','near','far','minDistance','maxDistance'].every(key=>Number.isFinite(camera[key])&&camera[key]>0&&camera[key]<1e6)
    &&camera.near<camera.far&&camera.minDistance<camera.maxDistance;
}
/** @param {import('./types').Building} building
 * @param {{floorId:string,zoneId:string,cut:boolean,height:number,labelsOn:boolean,expanded:boolean,camera:object|null}} view */
export function captureModelSession(building,view){
  return {buildingId:building.id,geometry:modelGeometryKey(building),floorId:view.floorId,zoneId:view.zoneId,
    cut:view.cut,height:view.height,labelsOn:view.labelsOn,expanded:view.expanded,camera:validModelCamera(view.camera)?structuredClone(view.camera):null};
}
/** @param {import('./types').Building} building @param {ReturnType<typeof captureModelSession>|null} session @param {string} floorId */
export function restoreModelSession(building,session,floorId){
  const empty={zoneId:'',cut:false,height:3,labelsOn:true,expanded:false,camera:null};
  if(!session||session.buildingId!==building.id)return empty;
  const sameFloor=session.floorId===floorId,floor=building.floors.find(floor=>floor.id===floorId);
  const height=Number.isFinite(session.height)&&session.height>=2&&session.height<=6?session.height:3;
  return {zoneId:sameFloor&&floor?.zones.some(zone=>zone.id===session.zoneId)?session.zoneId:'',cut:session.cut===true,height,
    labelsOn:session.labelsOn!==false,expanded:session.expanded===true,
    camera:sameFloor&&height===session.height&&session.geometry===modelGeometryKey(building)&&validModelCamera(session.camera)?structuredClone(session.camera):null};
}
