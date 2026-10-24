import { furniturePrimitives } from '../domain/furniture.mjs';
import type { LayoutRoom, RoomPreset } from '../domain/types';
import { ROOM_PRESETS } from '../domain/room-presets.mjs';
import { rectPoints } from '../domain/layout.mjs';

export function RoomFurniture({room}:{room:LayoutRoom}) {
  return <g className="room-furniture" pointerEvents="none">{furniturePrimitives(room).map((shape,index)=>shape.tag==='rect'?<rect key={index} {...shape.attrs}/>:shape.tag==='circle'?<circle key={index} {...shape.attrs}/>:<path key={index} {...shape.attrs}/>)}</g>;
}
export function RoomKitPreview({preset}:{preset:RoomPreset}) {
  const kit=ROOM_PRESETS[preset],room:LayoutRoom={id:'preview',name:'',nameKk:'',preset,points:rectPoints(0,0,kit.width,kit.height)};
  return <svg className="room-kit-preview" viewBox={`-.2 -.2 ${kit.width+.4} ${kit.height+.4}`} aria-hidden="true"><rect width={kit.width} height={kit.height} fill="#fffdf7" stroke="#68745f" strokeWidth=".13"/><RoomFurniture room={room}/></svg>;
}
