import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ArrowLeft, Check, ChevronDown, DoorOpen, Hand, HelpCircle, Maximize2, Minus, MousePointer2, Plus, Redo2, Square, Trash2, Undo2, Waypoints, X, Columns2, RotateCw, RotateCcw } from 'lucide-react';
import type { BuildingKind, Floor, FloorLayout, Language, LayoutOpening, LayoutRoom, Point, RoomPreset } from '../domain/types';
import { closeContour, emptyLayout, fitOpenings, layoutBounds, moveVertex, nearestWall, openingCollision, placementIssue, polygonArea, rectPoints, roomBounds, rotateRoom, round, snap, snapPoint, validateLayout } from '../domain/layout.mjs';
import { planWords } from '../locales/plan';
import { PlanDrawing, PlanGrid } from './PlanDrawing';
import { RoomKitPreview } from './RoomFurniture';
import { BUILDING_KITS, ROOM_PRESETS, presetForZone } from '../domain/room-presets.mjs';
import { decorateBlocks } from '../domain/block-layout.mjs';
import { kindNames } from '../data/templates';

type Tool='select'|'rectangle'|'contour'|'door'|'window'|'pan';
type View={x:number;y:number;width:number;height:number};
type Drag={kind:'move'|'vertex'|'rectangle'|'pan';start:Point;client:Point;view:View;room?:LayoutRoom;index?:number;scale:{x:number;y:number}};
const uid=()=>crypto.randomUUID();

function initialLayout(floor:Floor):FloorLayout {
  const layout=structuredClone(floor.layout||emptyLayout()) as FloorLayout;
  return {...layout,rooms:layout.rooms.map(r=>{const z=floor.zones.find(z=>z.id===r.zoneId);return z?{...r,name:z.name,nameKk:z.nameKk}:r;})};
}

export function PlanEditor({floor,language,buildingKind='other',onSave,onCancel,onDirtyChange}:{floor:Floor;language:Language;buildingKind?:BuildingKind;onSave:(layout:FloorLayout,useAreas:boolean)=>void;onCancel:()=>void;onDirtyChange:(dirty:boolean)=>void}) {
  const p=planWords(language),[initial]=useState(()=>initialLayout(floor));
  const [layout,setLayout]=useState<FloorLayout>(initial),[past,setPast]=useState<FloorLayout[]>([]),[future,setFuture]=useState<FloorLayout[]>([]);
  const [selected,setSelected]=useState(initial.rooms[0]?.id||''),[openingId,setOpeningId]=useState('');
  const [tool,setTool]=useState<Tool>('select');
  const [binding,setBinding]=useState(floor.zones.find(z=>!initial.rooms.some(r=>r.zoneId===z.id))?.id||'new');
  const [view,setView]=useState<View>(()=>initial.rooms.length?layoutBounds(initial):window.innerWidth<720?{x:-2,y:-2,width:18,height:18}:layoutBounds(initial));
  const [contour,setContour]=useState<Point[]>([]),[cursor,setCursor]=useState<Point|null>(null),[ghost,setGhost]=useState<LayoutRoom|null>(null);
  const [error,setError]=useState(''),[useAreas,setUseAreas]=useState(false);
  const svg=useRef<SVGSVGElement>(null),drag=useRef<Drag|null>(null),moved=useRef(false);
  const templateDrag=useRef<{preset:RoomPreset;start:Point}|null>(null);
  const [templatePreview,setTemplatePreview]=useState<LayoutRoom|null>(null);
  const selectedRoom=layout.rooms.find(r=>r.id===selected),opening=layout.openings.find(o=>o.id===openingId);
  const unplaced=floor.zones.filter(z=>!layout.rooms.some(r=>r.zoneId===z.id));
  const dirty=JSON.stringify(layout)!==JSON.stringify(initial);
  useEffect(()=>{onDirtyChange(dirty);return()=>onDirtyChange(false);},[dirty,onDirtyChange]);
  const commit=(next:FloorLayout)=>{if(JSON.stringify(next)===JSON.stringify(layout))return;setPast(h=>[...h,layout].slice(-50));setFuture([]);setLayout(next);setError('');};
  const undo=()=>{if(!past.length)return;setFuture(h=>[layout,...h]);setLayout(past[past.length-1]);setPast(h=>h.slice(0,-1));setError('');setOpeningId('');setContour([]);};
  const redo=()=>{if(!future.length)return;setPast(h=>[...h,layout].slice(-50));setLayout(future[0]);setFuture(h=>h.slice(1));setError('');setOpeningId('');};
  const point=(event:{clientX:number;clientY:number}):Point=>{const matrix=svg.current?.getScreenCTM();if(!matrix)return {x:0,y:0};const q=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());return {x:q.x,y:q.y};};
  const updateRoom=(next:LayoutRoom,regenerate=true)=>{
    const issue=placementIssue(layout,next);if(issue){setError(p[issue]);return false;}
    const openings=fitOpenings(next,layout.openings);if(!openings){setError(p.shortWall);return false;}
    const candidate={...layout,rooms:layout.rooms.map(r=>r.id===next.id?next:r),openings};
    const updated=(regenerate?decorateBlocks(candidate):candidate) as FloorLayout;
    if(!validateLayout(updated)){setError(p.shortWall);return false;}
    commit(updated);return true;
  };
  const addRoom=(points:Point[],preset?:RoomPreset)=>{
    if(layout.rooms.length>=120){setError(p.roomLimit);return;}
    const kit=preset?ROOM_PRESETS[preset]:undefined;
    const serial=layout.rooms.filter(r=>r.preset===preset).length+1;
    const zone=preset?unplaced.find(z=>presetForZone(z)===preset):floor.zones.find(z=>z.id===binding),common=preset?!!kit?.common:binding==='common';
    const room:LayoutRoom={id:uid(),zoneId:common?undefined:zone?.id||uid(),name:zone?.name||(kit?kit.name+(serial>1?' '+serial:''):undefined)||(common?'Коридор':`Помещение ${layout.rooms.length+1}`),nameKk:zone?.nameKk||(kit?kit.nameKk+(serial>1?' '+serial:''):undefined)||(common?'Дәліз':`Бөлме ${layout.rooms.length+1}`),points,preset:preset||(!common&&zone?presetForZone(zone) as RoomPreset:common?'corridor':undefined),autoOpenings:!!preset};
    const linked=new Set([...floor.zones.map(z=>z.id),...layout.rooms.map(r=>r.zoneId).filter(Boolean),room.zoneId].filter(Boolean));
    if(linked.size>100){setError(p.roomLimit);return;}
    const issue=placementIssue(layout,room);if(issue){setError(p[issue]);return;}
    commit(decorateBlocks({...layout,rooms:[...layout.rooms,room]}) as FloorLayout);setSelected(room.id);setOpeningId('');setTool('select');setContour([]);setCursor(null);setBinding(unplaced.find(z=>z.id!==zone?.id)?.id||'new');
  };
  const blockPoints=(preset:RoomPreset,at:Point)=>{const kit=ROOM_PRESETS[preset];return rectPoints(snap(at.x-kit.width/2),snap(at.y-kit.height/2),kit.width,kit.height);};
  const beginBlock=(event:PointerEvent<HTMLButtonElement>,preset:RoomPreset)=>{if(event.button!==0)return;moved.current=false;if(event.pointerType==='touch'&&!(event.target as Element).closest('.room-kit-preview'))return;event.preventDefault();templateDrag.current={preset,start:{x:event.clientX,y:event.clientY}};moved.current=false;event.currentTarget.setPointerCapture(event.pointerId);};
  const moveBlock=(event:PointerEvent<HTMLButtonElement>)=>{const active=templateDrag.current;if(!active)return;if(Math.hypot(event.clientX-active.start.x,event.clientY-active.start.y)>5)moved.current=true;const box=svg.current!.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom){setTemplatePreview(null);return;}const kit=ROOM_PRESETS[active.preset];setTemplatePreview({id:'block-preview',name:kit.name,nameKk:kit.nameKk,preset:active.preset,points:blockPoints(active.preset,point(event))});};
  const dropBlock=(event:PointerEvent<HTMLButtonElement>)=>{const active=templateDrag.current;if(!active)return;templateDrag.current=null;setTemplatePreview(null);if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);const box=svg.current!.getBoundingClientRect();if(moved.current&&event.clientX>=box.left&&event.clientX<=box.right&&event.clientY>=box.top&&event.clientY<=box.bottom)addRoom(blockPoints(active.preset,point(event)),active.preset);};
  const quickBlock=(preset:RoomPreset)=>{const kit=ROOM_PRESETS[preset],box=layout.rooms.length?roomBounds(layout.rooms.flatMap(r=>r.points)):null;addRoom(rectPoints(box?snap(box.x+box.width+.5):0,0,kit.width,kit.height),preset);setView(layoutBounds({rooms:[...layout.rooms,{points:rectPoints(box?snap(box.x+box.width+.5):0,0,kit.width,kit.height)}]}));};
  const rotate=(direction:number)=>{if(selectedRoom)updateRoom(rotateRoom(selectedRoom,direction) as LayoutRoom);};
  const remove=()=>{
    if(openingId){const target=layout.openings.find(o=>o.id===openingId);commit({...layout,rooms:layout.rooms.map(r=>r.id===target?.roomId?{...r,autoOpenings:false}:r),openings:layout.openings.filter(o=>o.id!==openingId)});setOpeningId('');return;}
    if(selectedRoom){commit({...layout,rooms:layout.rooms.filter(r=>r.id!==selectedRoom.id),openings:layout.openings.filter(o=>o.roomId!==selectedRoom.id)});setSelected('');}
  };
  const changeTool=(next:Tool)=>{setTool(next);setContour([]);setGhost(null);setCursor(null);setOpeningId('');setError('');};
  const capture=(event:PointerEvent,kind:Drag['kind'],room?:LayoutRoom,index?:number)=>{
    const inverse=svg.current!.getScreenCTM()!.inverse();
    drag.current={kind,start:snapPoint(point(event)),client:{x:event.clientX,y:event.clientY},view:{...view},room,index,scale:{x:inverse.a,y:inverse.d}};moved.current=false;
    svg.current?.setPointerCapture(event.pointerId);
  };
  const addOpening=(at:Point)=>{
    if(layout.openings.length>=400){setError(p.openingLimit);return;}
    const candidates=layout.rooms.map(room=>({room,wall:nearestWall(room,at)})).filter(x=>x.wall&&x.wall.distance<.65).sort((a,b)=>a.wall!.distance-b.wall!.distance||(a.room.id===selected?-1:1));
    const target=candidates[0];if(!target){setError(p.noWall);return;}
    const width=tool==='door'?.9:1.5,wall=target.wall!;if(wall.length<width){setError(p.shortWall);return;}
    const margin=width/wall.length/2;
    const added:LayoutOpening={id:uid(),roomId:target.room.id,edge:wall.edge,position:Math.max(margin,Math.min(1-margin,wall.position)),width,type:tool==='door'?'door':'window',hinge:'start',swing:'in'};
    if(openingCollision(layout,added)){setError(p.openingOverlap);return;}
    commit({...layout,rooms:layout.rooms.map(r=>r.id===target.room.id?{...r,autoOpenings:false}:r),openings:[...layout.openings,added]});setSelected(target.room.id);setOpeningId(added.id);setTool('select');
  };
  const down=(event:PointerEvent<SVGSVGElement>)=>{
    if(event.button!==0)return;const at=snapPoint(point(event));
    if(tool==='pan'){capture(event,'pan');return;}
    if(tool==='door'||tool==='window'){addOpening(at);return;}
    if(tool==='rectangle'){capture(event,'rectangle');return;}
    if(tool==='contour'){
      if(contour.length>=39){setError(p.invalidShape);return;}
      if(!contour.length){setContour([at]);return;}
      const last=contour[contour.length-1],next=Math.abs(at.x-last.x)>Math.abs(at.y-last.y)?{x:at.x,y:last.y}:{x:last.x,y:at.y};
      if(next.x===last.x&&next.y===last.y)return;
      if(contour.length>=3&&next.x===contour[0].x&&next.y===contour[0].y){addRoom(closeContour(contour));return;}
      setContour(c=>[...c,next]);return;
    }
    setSelected('');setOpeningId('');
  };
  const moving=(event:PointerEvent<SVGSVGElement>)=>{
    const at=snapPoint(point(event)),active=drag.current;
    if(tool==='contour'){const last=contour.at(-1);setCursor(last?(Math.abs(at.x-last.x)>Math.abs(at.y-last.y)?{x:at.x,y:last.y}:{x:last.x,y:at.y}):at);}
    if(!active)return;
    if(Math.hypot(event.clientX-active.client.x,event.clientY-active.client.y)>3)moved.current=true;
    if(active.kind==='pan'){setView({...active.view,x:active.view.x-(event.clientX-active.client.x)*active.scale.x,y:active.view.y-(event.clientY-active.client.y)*active.scale.y});return;}
    if(active.kind==='rectangle'){setGhost({id:'ghost',name:'',nameKk:'',points:rectPoints(Math.min(at.x,active.start.x),Math.min(at.y,active.start.y),Math.abs(at.x-active.start.x),Math.abs(at.y-active.start.y))});return;}
    if(!active.room)return;
    const points=active.kind==='vertex'?moveVertex(active.room.points,active.index,at):active.room.points.map(p=>({x:round(p.x+at.x-active.start.x),y:round(p.y+at.y-active.start.y)}));
    setGhost({...active.room,points});
  };
  const up=(event:PointerEvent<SVGSVGElement>)=>{
    const active=drag.current;drag.current=null;
    if(svg.current?.hasPointerCapture(event.pointerId))svg.current.releasePointerCapture(event.pointerId);
    if(!active){setGhost(null);return;}
    const at=snapPoint(point(event));setGhost(null);
    if(!moved.current)return;
    if(active.kind==='rectangle')addRoom(rectPoints(Math.min(at.x,active.start.x),Math.min(at.y,active.start.y),Math.abs(at.x-active.start.x),Math.abs(at.y-active.start.y)));
    else if(active.kind!=='pan'&&active.room){const points=active.kind==='vertex'?moveVertex(active.room.points,active.index,at):active.room.points.map(p=>({x:round(p.x+at.x-active.start.x),y:round(p.y+at.y-active.start.y)}));updateRoom({...active.room,points});}
  };
  const vertexDown=(event:PointerEvent,room:LayoutRoom,index:number)=>{if(tool!=='select')return;event.stopPropagation();event.preventDefault();capture(event,'vertex',room,index);};
  const roomDown=(event:PointerEvent,room:LayoutRoom)=>{if(tool!=='select')return;event.preventDefault();event.stopPropagation();setSelected(room.id);setOpeningId('');capture(event,'move',room);};
  const alterNumber=(key:'x'|'y'|'width'|'height',value:number)=>{
    if(!selectedRoom||!Number.isFinite(value))return false;
    const box=roomBounds(selectedRoom.points);
    if((key==='width'||key==='height')&&value<.5){setError(p.invalidShape);return false;}
    const points=selectedRoom.points.map(at=>({x:round(key==='x'?at.x+value-box.x:key==='width'?box.x+(at.x-box.x)*value/box.width:at.x),y:round(key==='y'?at.y+value-box.y:key==='height'?box.y+(at.y-box.y)*value/box.height:at.y)}));
    return updateRoom({...selectedRoom,points});
  };
  const alterOpening=(patch:Partial<LayoutOpening>)=>{
    if(!opening)return false;const next={...opening,...patch};
    if(openingCollision(layout,next)){setError(p.openingOverlap);return false;}
    commit({...layout,rooms:layout.rooms.map(r=>r.id===opening.roomId?{...r,autoOpenings:false}:r),openings:layout.openings.map(o=>o.id===opening.id?next:o)});return true;
  };
  const zoom=(factor:number)=>setView(v=>{const width=Math.max(6,Math.min(480,v.width*factor)),height=width*v.height/v.width;return {x:v.x+(v.width-width)/2,y:v.y+(v.height-height)/2,width,height};});
  const save=()=>{if(!validateLayout(layout)){setError(p.invalidShape);return;}onSave(layout,useAreas);};
  const sample=()=>{
    if(layout.rooms.length&&!window.confirm(p.sampleConfirm))return;
    const ids=[uid(),uid(),uid(),uid()],points=[rectPoints(0,0,8,6),rectPoints(8,0,6,6),rectPoints(0,8,5,5),[{x:5,y:8},{x:14,y:8},{x:14,y:13},{x:10,y:13},{x:10,y:11},{x:5,y:11}]];
    const rooms:LayoutRoom[]=points.map((points,i)=>({id:ids[i],zoneId:floor.zones[i]?.id||uid(),name:floor.zones[i]?.name||`Помещение ${i+1}`,nameKk:floor.zones[i]?.nameKk||`Бөлме ${i+1}`,points}));
    rooms.push({id:uid(),name:'Коридор',nameKk:'Дәліз',points:rectPoints(0,6,14,2)});
    const openings:LayoutOpening[]=ids.flatMap((roomId,i)=>[{id:uid(),roomId,edge:i<2?2:0,position:.5,width:.9,type:'door',hinge:'start',swing:'in'},{id:uid(),roomId,edge:i<2?0:2,position:.5,width:1.5,type:'window',hinge:'start',swing:'in'}] as LayoutOpening[]);
    const next:FloorLayout={version:1,example:true,rooms,openings};commit(next);setSelected(ids[0]);setOpeningId('');setView(layoutBounds(next));setTool('select');setContour([]);
  };
  const shown=ghost&&drag.current?.kind!=='rectangle'?{...layout,rooms:layout.rooms.map(r=>r.id===ghost.id?ghost:r)}:layout;
  const tools:{id:Tool;icon:typeof Square;label:string}[]=[{id:'select',icon:MousePointer2,label:p.select},{id:'rectangle',icon:Square,label:p.rectangle},{id:'contour',icon:Waypoints,label:p.contour},{id:'door',icon:DoorOpen,label:p.door},{id:'window',icon:Columns2,label:p.window},{id:'pan',icon:Hand,label:p.pan}];
  const hint=tool==='rectangle'?p.drawHint:tool==='contour'?p.contourHint:tool==='door'||tool==='window'?p.openingHint:tool==='pan'?p.panHint:p.selectHint;
  const bounds=selectedRoom?roomBounds(selectedRoom.points):null;
  return <div className="plan-editor" onKeyDown={event=>{
    if((event.target as HTMLElement).closest('input,select,textarea'))return;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();}
    else if(event.key==='Escape'&&(contour.length||tool!=='select')){event.preventDefault();event.stopPropagation();changeTool('select');}
    else if(event.key.toLowerCase()==='r'&&selectedRoom){event.preventDefault();rotate(event.shiftKey?-1:1);}
    else if(event.key==='Enter'&&contour.length>=3){event.preventDefault();addRoom(closeContour(contour));}
    else if((event.key==='Delete'||event.key==='Backspace')&&(selectedRoom||opening)){event.preventDefault();remove();}
  }}>
    <div className="editor-toolbar"><div className="editor-tools" aria-label={p.title}>{tools.map(({id,icon:Icon,label})=><button key={id} className={tool===id?'active':''} aria-pressed={tool===id} onClick={()=>changeTool(id)}><Icon size={17}/><span>{label}</span></button>)}</div><div className="editor-history"><button className="icon-button" aria-label={p.undo} disabled={!past.length} onClick={undo}><Undo2 size={18}/></button><button className="icon-button" aria-label={p.redo} disabled={!future.length} onClick={redo}><Redo2 size={18}/></button><details className="editor-help"><summary aria-label={p.helpTitle}><HelpCircle size={18}/></summary><div><strong>{p.helpTitle}</strong><p>{p.help}</p><button className="button subtle" onClick={event=>{sample();event.currentTarget.closest('details')?.removeAttribute('open');}}>{p.sample}</button></div></details></div></div>
    <div className="editor-workspace has-room-kits"><aside className="room-kits"><div className="room-kits-heading"><span>{p.kitTitle}</span><small>{kindNames[language][buildingKind]}</small></div><p>{p.kitHint}</p><div className="room-kit-list">{(BUILDING_KITS[buildingKind] as RoomPreset[]).map(preset=><button className="room-kit" key={preset} aria-label={`${p.addBlock}: ${language==='ru'?ROOM_PRESETS[preset].name:ROOM_PRESETS[preset].nameKk}`} onPointerDown={event=>beginBlock(event,preset)} onPointerMove={moveBlock} onPointerUp={dropBlock} onPointerCancel={()=>{templateDrag.current=null;setTemplatePreview(null);}} onClick={event=>{if(event.detail===0||!moved.current)quickBlock(preset);}}><RoomKitPreview preset={preset}/><span><strong>{language==='ru'?ROOM_PRESETS[preset].name:ROOM_PRESETS[preset].nameKk}</strong><small>{ROOM_PRESETS[preset].width} × {ROOM_PRESETS[preset].height} {p.metre}</small></span><Plus size={13}/></button>)}</div></aside><div className={`editor-canvas tool-${tool}`}>

      <div className="editor-canvas-caption"><span>{layout.example?p.sampleLabel:language==='ru'?floor.name:floor.nameKk}</span><span>{p.snap}</span></div>
      <svg ref={svg} className="floor-editor-svg" role="application" aria-label={p.title} tabIndex={0} viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} onPointerDown={down} onPointerMove={moving} onPointerUp={up} onPointerCancel={()=>{drag.current=null;setGhost(null);}}>
        <PlanGrid/><PlanDrawing layout={shown} zones={[]} language={language} editor selected={selected} onSelect={id=>{if(!moved.current&&tool==='select'){setSelected(id);setOpeningId('');}}} onRoomDown={roomDown} onVertexDown={vertexDown} openingId={openingId} onOpeningSelect={id=>{setOpeningId(id);setSelected(layout.openings.find(o=>o.id===id)?.roomId||'');}}/>
        {ghost&&drag.current?.kind==='rectangle'&&<path className="room-preview" d={ghost.points.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join(' ')+'Z'} fill="#e7c9b650" stroke="#b64c32" strokeWidth=".055" strokeDasharray=".2 .12" pointerEvents="none"/>}
        {templatePreview&&<g className="block-drag-preview" opacity=".65" pointerEvents="none"><PlanDrawing layout={{version:1,rooms:[templatePreview],openings:[]}} zones={[]} language={language}/></g>}
        {contour.length>0&&<><polyline points={[...contour,...cursor?[cursor]:[]].map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="#b64c32" strokeWidth=".1" pointerEvents="none"/>{contour.map((at,i)=><circle key={i} cx={at.x} cy={at.y} r=".1" fill="#b64c32" pointerEvents="none"/>)}</>}
      </svg>
      <div className="editor-canvas-bottom"><span>{hint}</span><div className="plan-zoom"><button aria-label={p.zoomOut} onClick={()=>zoom(1.25)}><Minus size={16}/></button><button aria-label={p.zoomIn} onClick={()=>zoom(.8)}><Plus size={16}/></button><button aria-label={p.fit} onClick={()=>setView(layoutBounds(layout))}><Maximize2 size={16}/></button></div></div>
      {contour.length>0&&<div className="contour-actions"><button className="button primary" disabled={contour.length<3} onClick={()=>addRoom(closeContour(contour))}><Check size={15}/>{p.finish}</button><button className="button subtle" onClick={()=>{setContour([]);setCursor(null);}}><X size={15}/>{p.cancelDraw}</button></div>}
    </div>
    <aside className="editor-properties">
      {(tool==='rectangle'||tool==='contour')?<><h3>{p.binding}</h3><label className="field"><span>{p.rooms}</span><select aria-label={p.binding} value={binding} onChange={e=>setBinding(e.target.value)}><option value="new">{p.createZone}</option><option value="common">{p.noZone}</option>{unplaced.map(z=><option key={z.id} value={z.id}>{language==='ru'?z.name:z.nameKk}</option>)}</select></label><p className="editor-note">{binding==='common'?p.commonHint:p.areasSeparate}</p><button className="button subtle" onClick={()=>{const box=layout.rooms.length?roomBounds(layout.rooms.flatMap(r=>r.points)):null;const x=box?snap(box.x+box.width+.5):0;addRoom(rectPoints(x,0,6,4));}}><Plus size={15}/>{language==='ru'?'Добавить 6 × 4 м':'6 × 4 м қосу'}</button></>:opening?<><h3>{p.openingProperties}</h3><NumberField label={p.openingWidth} value={opening.width} min={.4} max={6} onCommit={v=>alterOpening({width:v})}/>{opening.type==='door'&&<><label className="check-field"><input type="checkbox" checked={opening.hinge==='end'} onChange={e=>alterOpening({hinge:e.target.checked?'end':'start'})}/><span>{p.hinge}</span></label><label className="check-field"><input type="checkbox" checked={opening.swing==='out'} onChange={e=>alterOpening({swing:e.target.checked?'out':'in'})}/><span>{p.swing}</span></label></>}<button className="text-button danger" onClick={remove}><Trash2 size={15}/>{p.removeOpening}</button></>:selectedRoom&&bounds?<><h3>{p.properties}</h3><div className="editor-rotation"><span>{p.rotation}</span><div><button className="icon-button" aria-label={p.rotateLeft} title={p.rotateLeft} onClick={()=>rotate(-1)}><RotateCcw size={17}/></button><span>{selectedRoom.rotation||0}°</span><button className="icon-button" aria-label={p.rotateRight} title={p.rotateRight} onClick={()=>rotate(1)}><RotateCw size={17}/></button></div></div><label className="field"><span>{p.name}</span><input aria-label={p.name} maxLength={160} value={language==='ru'?selectedRoom.name:selectedRoom.nameKk} onChange={e=>commit({...layout,rooms:layout.rooms.map(r=>r.id===selectedRoom.id?{...r,...language==='ru'?{name:e.target.value}:{nameKk:e.target.value}}:r)})}/></label><div className="editor-field-pair">{(['width','height','x','y'] as const).map(key=><NumberField key={selectedRoom.id+key} label={p[key]} value={bounds[key]} min={key==='width'||key==='height'?.5:-200} max={200} onCommit={value=>alterNumber(key,value)}/>)}</div><div className="editor-area"><span>{p.area}</span><strong>{polygonArea(selectedRoom.points)} <small>{p.sqm}</small></strong></div><p className="editor-note">{selectedRoom.preset?p.connectHint:selectedRoom.zoneId?p.areasSeparate:p.commonHint}</p><button className="text-button danger" onClick={remove}><Trash2 size={14}/>{p.deleteRoom}</button><small className="editor-note">{p.deleteHint}</small></>:<><h3>{p.rooms}</h3><p className="editor-note">{layout.rooms.length?p.noSelection:p.drawFirst}</p></>}
      {layout.rooms.length>0&&<div className="editor-room-index"><h4>{p.roomList}</h4>{layout.rooms.map(room=><button key={room.id} className={selected===room.id?'active':''} onClick={()=>{setSelected(room.id);setOpeningId('');setTool('select');}}><span>{language==='ru'?room.name:room.nameKk}</span><small>{polygonArea(room.points)} {p.sqm}</small></button>)}</div>}
    </aside></div>
    {error&&<div className="editor-error" role="alert">{error}</div>}
    <div className="editor-footer"><label className="editor-sync"><input type="checkbox" checked={useAreas} onChange={e=>setUseAreas(e.target.checked)}/><span>{p.syncAreas}<small>{useAreas?p.syncHint:p.areasSeparate}</small></span></label><div><button className="button subtle" onClick={onCancel}><ArrowLeft size={15}/>{p.cancel}</button><button className="button primary" disabled={!layout.rooms.length||contour.length>0||!!ghost} onClick={save}><Check size={16}/>{p.save}</button></div></div>
  </div>;
}

function NumberField({label,value,min,max,onCommit}:{label:string;value:number;min:number;max:number;onCommit:(value:number)=>boolean}) {
  const [text,setText]=useState(String(round(value))),dirty=useRef(false);
  useEffect(()=>{setText(String(round(value)));dirty.current=false;},[value]);
  return <label className="field"><span>{label}</span><input type="number" aria-label={label} min={min} max={max} step=".01" value={text} onChange={e=>{dirty.current=true;setText(e.target.value);}} onBlur={()=>{const changed=dirty.current;dirty.current=false;const n=Number(text);if(changed&&text&&n>=min&&n<=max)onCommit(n);setText(String(round(value)));}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>;
}
