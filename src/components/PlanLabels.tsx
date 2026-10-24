import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import type { FloorLayout, Language, LayoutRoom, Snapshot, Zone } from '../domain/types';
import { labelBounds, labelPoint, polygonArea } from '../domain/layout.mjs';
import { placePlanLabels } from '../domain/plan-labels.mjs';
import { planWords } from '../locales/plan';

export type PlanViewport = { width:number;height:number;topInset?:number };
export type PlanView = { x:number;y:number;width:number;height:number };

export function usePlanViewport(ref:RefObject<SVGSVGElement|null>) {
  const [viewport,setViewport]=useState<PlanViewport>({width:0,height:0});
  const [,setFonts]=useState(0);
  useLayoutEffect(()=>{
    const svg=ref.current;if(!svg)return;
    const measure=()=>{const box=svg.getBoundingClientRect();setViewport(previous=>previous.width===box.width&&previous.height===box.height?previous:{width:box.width,height:box.height});};
    measure();const observer=new ResizeObserver(measure);observer.observe(svg);return()=>observer.disconnect();
  },[ref]);
  useEffect(()=>{let active=true;document.fonts.ready.then(()=>{if(active)setFonts(value=>value+1);});return()=>{active=false;};},[]);
  return viewport;
}

let context:CanvasRenderingContext2D|null=null;
const textWidth=(text:string,size:number,weight=400)=>{context??=document.createElement('canvas').getContext('2d');if(!context)return text.length*size*.62;context.font=`${weight} ${size}px Noto,Arial,sans-serif`;return context.measureText(text).width;};

export function PlanLabels({layout,zones,language,selected,view,viewport,showCounts=false,snapshot,stale=false,onRoomDown,onHiddenChange}:{layout:FloorLayout;zones:Zone[];language:Language;selected:string;view:PlanView;viewport:PlanViewport;showCounts?:boolean;snapshot?:Snapshot;stale?:boolean;onRoomDown?:(event:React.PointerEvent,room:LayoutRoom)=>void;onHiddenChange?:(hidden:number)=>void}) {
  const p=planWords(language);
  const items=layout.rooms.map(room=>{
    const zone=zones.find(zone=>zone.id===room.zoneId),row=snapshot?.rows.find(row=>row.zoneId===room.zoneId),name=language==='kk'?zone?.nameKk||room.nameKk:zone?.name||room.name;
    const count=showCounts&&room.zoneId&&!stale?(row?.type?`${row.type==='OP'?'ОП':'ОУ'} ${row.count}`:p.countsManual):'';
    return {id:room.id,name,detail:`${polygonArea(room.points)} ${p.sqm}${count?' · '+count:''}`,count,row,center:labelPoint(room.points),bounds:labelBounds(room.points),priority:room.id===selected||room.zoneId===selected?10:room.zoneId?1:0};
  });
  const result=placePlanLabels(items,view,viewport,textWidth);
  useEffect(()=>{onHiddenChange?.(result.hidden);},[result.hidden,onHiddenChange]);
  if(!viewport.width)return null;
  return <g className="plan-label-layer" aria-hidden="true" data-hidden-labels={result.hidden} transform={`translate(${view.x-result.offsetX/result.scale} ${view.y-result.offsetY/result.scale}) scale(${1/result.scale})`}>
    {result.labels.map(label=>{const item=items[label.index],room=layout.rooms[label.index],active=item.priority===10,x=label.x+label.width/2;
      const end={x:Math.max(label.x,Math.min(label.x+label.width,label.anchor.x)),y:Math.max(label.y,Math.min(label.y+label.height,label.anchor.y))};
      return <g key={label.id} className={`plan-label ${active?'is-selected':''} ${label.callout?'is-callout':''}`} data-plan-room={room.id} data-room-id={room.id} onPointerDown={event=>onRoomDown?.(event,room)}>
        <title>{item.name}, {item.detail}</title>
        {label.callout&&<g className="plan-label-leader" pointerEvents="none"><path d={`M${label.anchor.x} ${label.anchor.y}L${end.x} ${end.y}`}/><circle cx={label.anchor.x} cy={label.anchor.y} r={2.2}/></g>}
        <rect className="plan-label-paper" x={label.x} y={label.y} width={label.width} height={label.height}/>
        <text className="plan-room-name" x={x} y={label.y+7+label.size} fontSize={label.size} textAnchor="middle" pointerEvents="none">{label.nameLines.map((line,index)=><tspan key={index} x={x} dy={index?label.size+3:0}>{line}</tspan>)}</text>
        <text className={`plan-room-detail ${item.count?(item.row?.type?'plan-count':'plan-count-manual'):''}`} x={x} y={label.y+7+label.nameLines.length*(label.size+3)+label.detailSize} fontSize={label.detailSize} textAnchor="middle" pointerEvents="none">{label.detailLines.map((line,index)=><tspan key={index} x={x} dy={index?label.detailSize+3:0}>{line}</tspan>)}</text>
      </g>;
    })}
  </g>;
}
