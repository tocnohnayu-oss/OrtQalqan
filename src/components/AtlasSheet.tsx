import type { BuildingKind, LayoutRoom, RoomPreset } from '../domain/types';
import { ROOM_PRESETS } from '../domain/room-presets.mjs';
import { rectPoints } from '../domain/layout.mjs';
import { RoomFurniture } from './RoomFurniture';

const themes:Record<BuildingKind,RoomPreset[]>={education:['classroom','library'],office:['office','meeting'],retail:['shop','storage'],warehouse:['storage','loading'],industrial:['workshop','storage'],other:['generic','meeting']};
function Tile({preset,x,y,width,height}:{preset:RoomPreset;x:number;y:number;width:number;height:number}){
  const kit=ROOM_PRESETS[preset],scale=Math.min(width/kit.width,height/kit.height),room:LayoutRoom={id:'illustration',name:'',nameKk:'',preset,points:rectPoints(0,0,kit.width,kit.height)};
  return <g transform={`translate(${x+(width-kit.width*scale)/2} ${y+(height-kit.height*scale)/2}) scale(${scale})`}><rect width={kit.width} height={kit.height} fill="#fffdf8" stroke="#253b42" strokeWidth=".16"/><RoomFurniture room={room}/></g>;
}
/** A catalog of schematic room blocks. Decorative artwork, never the active floor plan. */
export function AtlasSheet({kind='other'}:{kind?:BuildingKind}){
  const presets=themes[kind];
  return <svg viewBox="0 0 340 228" fill="none" aria-hidden="true" className="drafting-illustration" data-kind={kind}>
    <path d="M33 200h265" stroke="#c3c5b8"/>
    <g transform="rotate(-7 137 112)"><path d="M38 32h189v157H38Z" fill="#e2d8c5" stroke="#98a293"/><path d="M50 20h154l22 22v138H50Z" fill="#fffdf8" stroke="#253b42" strokeWidth="2"/><path d="M204 20v22h22" fill="#f1dfce" stroke="#253b42" strokeWidth="1.5"/>
      <path d="M65 39h54M65 45h33" stroke="#b5452b" strokeWidth="2"/><Tile preset={presets[0]} x={67} y={60} width={140} height={92}/><path d="M67 164h35m10 0h13m12 0h70" stroke="#a8b1a3"/>
    </g>
    <g transform="rotate(8 247 153)"><path d="M184 105h118v99H184Z" fill="#eee4d3"/><path d="M177 97h124v99H177Z" fill="#fffdf8" stroke="#253b42" strokeWidth="2"/><path d="M177 97h33v5h-33Z" fill="#b5452b"/><Tile preset={presets[1]} x={190} y={113} width={96} height={65}/><path d="M190 186h35m5 0h12" stroke="#94a18e"/>
    </g>
    <g transform="rotate(25 269 69)"><path d="M263 11h10v115l-5 17-5-17Z" fill="#b5452b" stroke="#843c2b" strokeWidth="1.5"/><path d="M263 11h10v14h-10Z" fill="#253b42"/><path d="M263 126h10l-5 17Z" fill="#d9b88c"/><path d="m266.5 138 1.5 5 1.5-5" fill="#253b42"/><path d="M266 29v89" stroke="#dc9b7d"/>
    </g>
    <path d="M23 53V35h18M306 187v23h-20M19 167h13m-6.5-6.5v13" stroke="#87998d" strokeWidth="1.5"/>
  </svg>;
}
