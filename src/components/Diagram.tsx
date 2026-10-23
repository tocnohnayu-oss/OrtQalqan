import { useId } from 'react';
import type { Floor, Snapshot, Language, Zone } from '../domain/types';
import { translator } from '../locales';

type RoomBox={zone:Zone;x:number;y:number;width:number;height:number;top:boolean;kind:string};
function roomKind(z:Zone){
  const n=`${z.name} ${z.nameKk}`.toLowerCase();
  if(/сервер|server/.test(n))return 'server';
  if(/спорт|gym/.test(n))return 'gym';
  if(/библиот|кітап|медиа/.test(n))return 'library';
  if(/лаборат|зертхан/.test(n))return 'lab';
  if(/актов|мәжіліс/.test(n))return 'assembly';
  return 'classroom';
}

function Furniture({box}:{box:RoomBox}){
  const {x,y,width:w,height:h,kind}=box,color='#9b9e8d',light='#d7d8c9';
  if(kind==='gym')return <g className="plan-furniture" fill="none" stroke="#c4b8a1" strokeWidth="1.2">
    <rect x={x+17} y={y+23} width={w-34} height={h-45} fill="#f1ecdf"/>
    <rect x={x+24} y={y+30} width={w-48} height={h-59}/><path d={`M${x+w/2} ${y+30}v${h-59}`}/><circle cx={x+w/2} cy={y+h/2} r={Math.min(25,(h-70)/2)}/>
    <path d={`M${x+24} ${y+h/2-31}h48v62h-48M${x+w-24} ${y+h/2-31}h-48v62h48`}/><path d={`M${x+72} ${y+h/2-31}q32 31 0 62M${x+w-72} ${y+h/2-31}q-32 31 0 62`}/>
    <path d={`M${x+12} ${y+h/2-9}v18m0-9h10M${x+w-12} ${y+h/2-9}v18m0-9h-10`} stroke={color} strokeWidth="2"/>
  </g>;
  if(kind==='server')return <g className="plan-furniture">{Array.from({length:Math.max(1,Math.floor((w-40)/40))},(_,i)=><g key={i} transform={`translate(${x+22+i*40} ${y+33})`}><rect width="25" height={h-67} rx="2" fill="#e5e8df" stroke={color}/>{Array.from({length:Math.floor((h-77)/13)},(_,j)=><g key={j}><path d={`M4 ${9+j*13}h17`} stroke="#adb4a8"/><circle cx="19" cy={5+j*13} r="1.3" fill="#8f9f85"/></g>)}</g>)}</g>;
  if(kind==='library')return <g className="plan-furniture">{Array.from({length:Math.max(1,Math.floor((w-54)/49))},(_,i)=><g key={i} transform={`translate(${x+23+i*49} ${y+26})`}><rect width="18" height={h-57} fill="#e7e8d9" stroke={color}/><path d={`M9 0v${h-57}`} stroke={color}/>{Array.from({length:Math.floor((h-60)/9)},(_,j)=><path key={j} d={`M2 ${5+j*9}h14`} stroke={light} strokeWidth="2"/>)}</g>)}</g>;
  if(kind==='assembly')return <g className="plan-furniture"><rect x={x+20} y={y+26} width="45" height={h-52} rx="25" fill="#e6e3d5" stroke={color}/>{Array.from({length:Math.max(1,Math.floor((w-105)/34))},(_,i)=><g key={i}>{Array.from({length:Math.max(1,Math.floor((h-45)/25))},(_,j)=><g key={j} transform={`translate(${x+90+i*34} ${y+26+j*25})`}><rect width="14" height="13" rx="3" fill="#eeeee3" stroke={color}/><path d="M-2 2v10m18-10v10" stroke={color}/></g>)}</g>)}</g>;
  const lab=kind==='lab',cols=Math.max(1,Math.floor((w-32)/(lab?80:57))),rows=Math.max(1,Math.floor((h-56)/(lab?52:46)));
  return <g className="plan-furniture"><path d={`M${x+19} ${y+14}h${w-38}`} stroke="#a2aa94" strokeWidth="4"/>
    {Array.from({length:cols},(_,i)=>Array.from({length:rows},(_,j)=>{
      const dx=x+24+i*(w-40)/cols,dy=y+32+j*(h-45)/rows;
      return <g key={`${i}-${j}`} transform={`translate(${dx} ${dy})`}><rect width={lab?55:34} height={lab?23:19} rx="2" fill={lab?'#e4e6d6':'#ece9dd'} stroke={color}/>{lab?<><circle cx="11" cy="11" r="3" stroke={color} fill="none"/><circle cx="42" cy="11" r="3" stroke={color} fill="none"/><path d="M22 0v23" stroke={light}/></>:<path d="M17 1v17" stroke={light}/>}<path d={`M5 ${lab?28:24}h${lab?10:7}m${lab?23:10} 0h${lab?10:7}`} stroke={color} strokeWidth="3" strokeLinecap="round"/></g>;
    }))}</g>;
}

function Door({x,y,up=false}:{x:number;y:number;up?:boolean}){
  const sign=up?1:-1;
  return <g fill="none"><path d={`M${x} ${y}h31`} stroke="#fffdf8" strokeWidth="9"/><path d={`M${x} ${y}v${sign*31}M${x+31} ${y}a31 31 0 0 ${up?1:0} -31 ${sign*31}`} stroke="#798373" strokeWidth="1.2"/></g>;
}

export function Diagram({floor,snapshot,selected,onSelect,language,stale}:{floor:Floor;snapshot:Snapshot;selected:string;onSelect:(id:string)=>void;language:Language;stale:boolean}){
  const t=translator(language),id=useId().replace(/:/g,''),topCount=Math.ceil(floor.zones.length/2);
  const width=Math.max(960,topCount*188+320),run=width-362,start=110,wing=start+run+24;
  const boxes:RoomBox[]=[];
  [floor.zones.slice(0,topCount),floor.zones.slice(topCount)].forEach((zones,side)=>{
    const proportions:Record<string,number>={classroom:1.7,library:1.3,server:.9,gym:2.4,lab:1.2,assembly:2};
    // A parameter edit must not move the walls underneath the inspector.
    const weights=zones.map(z=>proportions[roomKind(z)]||1.2),sum=weights.reduce((a,b)=>a+b,0);
    let current=start;
    zones.forEach((zone,i)=>{const roomWidth=(run-(zones.length-1)*8)*weights[i]/sum;boxes.push({zone,x:current,y:side===0?124:370,width:roomWidth,height:side===0?176:174,top:side===0,kind:roomKind(zone)});current+=roomWidth+8;});
  });
  return <svg className="floor-diagram architectural-plan" viewBox={`60 90 ${width-120} 565`} role="group" aria-label={`${language==='ru'?floor.name:floor.nameKk}. ${t('noScale')}`}>
    <defs><pattern id={`${id}-grid`} width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#e9e6dd" strokeWidth=".65"/></pattern><pattern id={`${id}-corridor`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V8" stroke="#dfdfd0" strokeWidth=".7"/></pattern></defs>
    <rect width={width} height="660" fill="#fbfaf5"/><rect x="30" y="45" width={width-60} height="564" fill={`url(#${id}-grid)`}/>
    <g className="plan-axis" stroke="#c9c9b8" strokeWidth=".8" strokeDasharray="4 5"><path d={`M83 82H${width-40}M83 576H${width-40}M82 80V578M${width-64} 80V578`}/></g>

    <path d={`M96 110H${wing}V214H${width-82}V558H96Z`} fill="#fffdf8" stroke="#39463a" strokeWidth="5" strokeLinejoin="miter"/>
    <path d={`M110 310H${wing+9}V356H110Z`} fill={`url(#${id}-corridor)`}/><path d={`M110 310H${wing+9}M110 356H${wing+9}`} stroke="#bfc4b4" strokeWidth="1.5"/>
    <text x={start+run/2} y="338" className="corridor-label" textAnchor="middle">{language==='ru'?'КОРИДОР':'ДӘЛІЗ'}</text>
    <g className="common-area"><rect x={wing+12} y="230" width={width-wing-110} height="124" fill="#edeedf" stroke="#98a38b"/>
      {Array.from({length:9},(_,i)=><path key={i} d={`M${wing+20} ${239+i*12}h${width-wing-126}`} stroke="#a1aa95"/>)}
      <path d={`M${wing+28} 340V245m-6 9 6-9 6 9`} stroke="#66745f" strokeWidth="1.5" fill="none"/><text x={wing+(width-wing-82)/2} y="381" textAnchor="middle" className="auxiliary-label">{language==='ru'?'ЛЕСТНИЦА':'БАСПАЛДАҚ'}</text>
      <path d={`M${wing+5} 399H${width-96}`} stroke="#bac2af"/><g transform={`translate(${wing+22} 429)`}><rect width="28" height="63" fill="#e9e7d8" stroke="#a5ad95"/><path d="M7 4v55m14-55v55" stroke="#bcc2ac"/></g>
      <text x={wing+(width-wing-82)/2} y="526" textAnchor="middle" className="entry-label">{language==='ru'?'ВХОД':'КІРЕБЕРІС'}</text>
      <path d={`M${width-168} 558h54`} stroke="#fbfaf5" strokeWidth="9"/><path d={`M${width-168} 558v-28m54 28v-28m-54 28a28 28 0 0 1 28-28m26 28a28 28 0 0 0-26-28`} stroke="#84917a" fill="none" strokeWidth="1.2"/>
    </g>
    {boxes.map((box,i)=>{
      const {zone:z,x,y,width:w,height:h,top}=box,active=z.id===selected,row=snapshot.rows.find(r=>r.zoneId===z.id),issue=!row?.type||row.issues.length>0;
      const label=language==='ru'?z.name:z.nameKk,doorX=x+Math.max(12,Math.min(w-43,w*.73));
      return <g key={z.id} role="button" tabIndex={0} aria-pressed={active} aria-label={`${label}, ${z.area} ${t('sqm')}`} onClick={()=>onSelect(z.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(z.id);}}} className={`plan-room ${active?'selected':''}`}>
        <rect className="room-fill" x={x} y={y} width={w} height={h} fill={active?'#f8e9dd':'#fffdf8'}/><Furniture box={box}/>
        {box.kind==='classroom'&&w>280&&<><path d={`M${x+w/2} ${y}v${h}`} stroke="#72816b" strokeWidth="2.5"/><Door x={x+w*.28} y={top?y+h:y} up={!top}/></>}
        <rect className="room-wall" x={x} y={y} width={w} height={h} fill="none" stroke={active?'#b44a30':'#5d6b55'} strokeWidth={active?3.3:2.6}/><Door x={doorX} y={top?y+h:y} up={!top}/>
        {[.2,.52,.79].filter(p=>w>140||p===.52).map((p,j)=><g key={j}><path d={`M${x+w*p-14} ${top?y:y+h}h28`} stroke="#e9efe9" strokeWidth="7"/><path d={`M${x+w*p-14} ${top?y:y+h}h28m-28 ${top?-3:3}h28`} stroke="#819d98" strokeWidth="1.5"/></g>)}
        <g className="room-caption" transform={`translate(${x+8} ${y+h/2-28})`}><rect width={w-16} height="66" rx="2" fill={active?'#fff6eb':'#fffdf8'} fillOpacity=".94"/><text x="10" y="17" className="room-number">{String(i+1).padStart(2,'0')}<tspan dx="10" className="room-hazard">{z.hazard==='special'?'?':z.hazard.replace('AE','A / E')}</tspan></text><foreignObject x="10" y="22" width={w-38} height="25"><div className="room-name">{label}</div></foreignObject><text x="10" y="58" className="room-area">{z.area.toLocaleString(language==='ru'?'ru-RU':'kk-KZ')} {t('sqm')}</text></g>
        <g className="equipment-map-tag" transform={`translate(${doorX-4} ${top?y+h-14:y+14})`}><rect x="-4" y="-13" width="68" height="27" rx="3" fill={active?'#b44a30':issue?'#e9d9ab':'#324d40'} stroke="#fffdf8" strokeWidth="2"/><path d="M3-5h7v15H3Zm1-5h5v5m0-5h6v9" fill="none" stroke={active||!issue?'#fffdf2':'#786128'} strokeWidth="1.3"/><text x="22" y="6" fill={active||!issue?'#fffdf2':'#786128'} className="equipment-tag-label">{stale?'—':row?.type?`${row.type==='OP'?'ОП':'ОУ'} ${row.count}`:'?'}</text></g>
      </g>;
    })}
    <g transform={`translate(${width-47} 95)`}><path d="M0 22V-3l-5 10 5-4 5 4Z" fill="#4b5e4e"/><text y="-12" textAnchor="middle" className="north-label">Y</text></g>
    <g className="plan-caption"><path d={`M96 598H${width-81}`} stroke="#b8beaa"/><text x="96" y="622">{t('illustrativePlan')}</text><text x={width-82} y="622" textAnchor="end">OQ / {String(snapshot.building.floors.findIndex(f=>f.id===floor.id)+1).padStart(2,'0')}</text><text x="96" y="643" className="plan-disclaimer">{t('notSchoolPlan')}</text></g>
  </svg>;
}
