import type { Zone } from '../domain/types';
export type Scene='inspection'|'classroom'|'library'|'server'|'lab'|'gym'|'winter'|'systems';
export function sceneForZone(zone:Pick<Zone,'name'|'nameKk'>):Scene{
  const n=`${zone.name} ${zone.nameKk}`.toLowerCase();
  if(/сервер/.test(n))return 'server';
  if(/лаборат|зертхан/.test(n))return 'lab';
  if(/библио|кітап|медиа/.test(n))return 'library';
  if(/спорт/.test(n))return 'gym';
  if(/учеб|кабинет|оқу/.test(n))return 'classroom';
  return 'inspection';
}
function Person({x=245,y=116,flip=false}:{x?:number;y?:number;flip?:boolean}){
  return <g transform={`translate(${x} ${y}) scale(${flip?-1:1} 1)`}>
    <path d="m-9 32-5 37m18-37 7 37" stroke="#3f4942" strokeWidth="9" strokeLinecap="round"/><path d="m-15 69-8 3m34-3 8 2" stroke="#343e35" strokeWidth="5" strokeLinecap="round"/>
    <path d="M-16-5q17-13 31 0l2 36q-14 11-33 0Z" fill="#eee9da" stroke="#65715e" strokeWidth="1.7"/><path d="m-1-5-3 37" stroke="#b9bca9"/><path d="M-13 4h10v5h-10" fill="#b94f35"/>
    <path d="m-16 2-8 20 18 9m21-28 12 15-15 12" stroke="#b49b80" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m-5 15 22-1 3 28-23 1Z" fill="#fffdf2" stroke="#626f58" strokeWidth="1.5"/><path d="m0 25 4 3 6-7m-9 14h13" stroke="#879b72" strokeWidth="1.6"/>
    <circle cy="-20" r="12" fill="#cbb092"/><path d="M-11-20c-9-16 21-22 23-5l-6-2-13 8Z" fill="#485148"/><path d="M9-18v6" stroke="#967e68"/>
  </g>;
}
function Plant(){return <g transform="translate(36 140)"><path d="M0 4v-39" stroke="#9ba187" strokeWidth="2"/><path d="M0-19c-37-15-23-35-10-16 6 8 9 19 10 16m1-3c5-31 31-38 24-16-4 10-14 15-24 16" fill="#c0cbab" stroke="#9ca98b"/><path d="m-12 4 4 24h18l4-24Z" fill="#d7c7af" stroke="#a6a18c"/></g>;}

export function SceneIllustration({scene='inspection',className=''}:{scene?:Scene;className?:string}){
  return <svg className={`scene-illustration ${className}`} viewBox="0 0 340 215" fill="none" aria-hidden="true">
    <path d="m18 166 146-48 163 51-145 44Z" fill="#eeeae0"/><path d="m44 168 124-39 129 40m-237 9 120-40m-94 48 120-40m-94 48 120-40" stroke="#d7d5c7" strokeWidth=".7"/>
    {scene==='classroom'&&<>
      <path d="M59 34h176v85H59Z" fill="#e3e7da" stroke="#73816b" strokeWidth="1.7"/><path d="M65 40h164v73H65Z" stroke="#a4b195"/><path d="m83 83 29-28 29 28Zm76-24h47m-47 14h34m-34 14h42" stroke="#fafbf2" strokeWidth="2.4"/><path d="M69 119h156" stroke="#afb79f" strokeWidth="5"/>
      {[[69,140],[145,160],[213,139]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><path d="m-8 0 38-12 40 13-38 13Z" fill="#fdf9ef" stroke="#8e9981"/><path d="M-8 0v29m78-28v29M30 12v30" stroke="#8e9981" strokeWidth="2"/><path d="m18 24 24 8v16l-24-8Z" fill="#c9d1b8" stroke="#8f9f7d"/></g>)}
      <path d="M267 60v66" stroke="#d6d7c9"/><Plant/>
    </>}
    {scene==='library'&&<>
      {[0,1].map(i=><g key={i} transform={`translate(${56+i*103} ${33+i*12})`}><path d="M0 0h84v124H0Z" fill="#e4e7d6" stroke="#80916f" strokeWidth="1.6"/>{[0,1,2].map(j=><g key={j} transform={`translate(7 ${8+j*37})`}>{[0,1,2,3,4,5,6].map(k=><rect key={k} x={k*10} y={(k%3)*3} width="7" height={28-(k%3)*3} fill={['#b9c4a4','#cdb89f','#a9b9b0'][k%3]} stroke="#8f9d80" strokeWidth=".6"/>)}<path d="M-5 30h79" stroke="#8f9d80"/></g>)}</g>)}
      <path d="m93 160 65-21 64 21-66 21Z" fill="#fcf8ed" stroke="#88977a"/><path d="M93 160v26m129-26v26m-66-5v24" stroke="#88977a" strokeWidth="2"/><path d="m134 155 20-5 21 7-21 7Z" fill="#fdfcf4" stroke="#b1b79e"/><path d="m154 150v14" stroke="#b1b79e"/><Person x={276} y={103} flip/>
    </>}
    {scene==='server'&&<>
      {[0,1].map(i=><g key={i} transform={`translate(${65+i*69} ${32+i*11})`}><path d="M0 0h53v133H0Z" fill="#dce3dc" stroke="#637966" strokeWidth="1.8"/><path d="M6 6h41v120H6Z" stroke="#9cac9b"/>{[0,1,2,3,4,5,6].map(j=><g key={j}><rect x="9" y={12+j*16} width="35" height="10" rx="1" fill="#b1c1b6" stroke="#829989" strokeWidth=".7"/><path d={`M13 ${17+j*16}h19`} stroke="#e9eee2"/><circle cx="39" cy={17+j*16} r="1.4" fill={j===3?'#b94f35':'#778c72'}/></g>)}</g>)}
      <path d="M50 184c60 21 30-5 98 13 20 5 40-4 47-18" stroke="#9eac98" strokeWidth="2"/><path d="M45 165V31h165v101" stroke="#bdc8b6" strokeWidth="3"/><Person x={264} y={102}/>
    </>}
    {scene==='lab'&&<>
      <path d="M60 32h94v93H60Z" fill="#e8ece0" stroke="#9da98e"/><path d="M107 32v93M60 79h94" stroke="#f9fcf3" strokeWidth="4"/>
      <path d="m74 143 102-33 116 36-102 33Z" fill="#fffdf5" stroke="#829379" strokeWidth="1.5"/><path d="M74 143v33l116 36v-33m102-33v33l-102 33" fill="#e5e7d7" stroke="#829379" strokeWidth="1.5"/><path d="m96 155 77 24v20l-77-24Zm105 21 70-22v20l-70 22Z" stroke="#b0bba0"/>
      <path d="M149 85h9v15l13 21c4 8-32 10-28 1l12-22V85" fill="#eef5e8" stroke="#879b77" strokeWidth="1.4"/><path d="M147 112h20l5 10c-3 5-30 4-29 0Z" fill="#bfd1b0"/><path d="M192 98h14v23c0 8-14 9-14 1Z" fill="#e1ece9" stroke="#829f98"/><path d="M225 91v40m-8-28h16m-13 7h10" stroke="#9eaf97" strokeWidth="2"/><path d="m67 130 18-5 13 4-18 6Z" fill="#bd5940"/><Plant/>
    </>}
    {scene==='gym'&&<>
      <path d="M48 162 164 124l136 41-119 38Z" fill="#e9e0cd" stroke="#b5ad96"/><path d="m62 163 102-33 120 36-104 31Z" stroke="#fbf9e9" strokeWidth="2"/><path d="m163 131 17 65" stroke="#fbf9e9" strokeWidth="2"/><ellipse cx="174" cy="163" rx="25" ry="10" transform="rotate(16 174 163)" stroke="#fbf9e9" strokeWidth="2"/>
      <path d="M235 43v111" stroke="#8c9c82" strokeWidth="4"/><path d="M195 29h77v46h-77Z" fill="#f9f9ed" stroke="#879a7b" strokeWidth="2"/><path d="M216 43h32v24h-32Z" stroke="#a1b090"/><ellipse cx="234" cy="75" rx="17" ry="4" stroke="#b65238" strokeWidth="2"/><path d="m220 78 7 22h13l9-22m-22 0 5 22m9-22-4 22" stroke="#c1bda9"/>
      <circle cx="104" cy="152" r="17" fill="#c37c4e" stroke="#8f6844"/><path d="M87 152h34m-17-17c-8 11-8 22 0 34m0-34c8 11 8 22 0 34" stroke="#8f6844"/><path d="M44 79v54h65" stroke="#c7cbb9" strokeWidth="3"/>
    </>}
    {scene==='winter'&&<>
      <path d="M64 29h146v123H64Z" fill="#dbe8e6" stroke="#819b90" strokeWidth="2"/><path d="M137 29v123M64 91h146" stroke="#f8faf1" strokeWidth="5"/><path d="m75 128 24-18 19 15 31-26 49 28" fill="#eef3ec" stroke="#c6d6cb"/>
      {[[88,53],[165,61],[181,115],[110,105]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`} stroke="#fffdf3" strokeWidth="1.4"><path d="M0-6V6m-6-6H6m-10-4 8 8m0-8-8 8"/></g>)}
      <path d="M244 51v66c-20 10-2 33 12 18 7-7 4-15-1-18V51c0-12-11-12-11 0Z" fill="#fffdf2" stroke="#89977f" strokeWidth="2"/><path d="M250 83v38" stroke="#b95338" strokeWidth="5"/><circle cx="250" cy="127" r="7" fill="#b95338"/><path d="M262 61h10m-10 15h7m-7 15h10" stroke="#a7b19d"/>
      <path d="M65 166h142v21H65Z" fill="#dfdfd0" stroke="#a1a88f"/>{Array.from({length:10},(_,i)=><path key={i} d={`M${73+i*13} 169v14`} stroke="#b6bda4"/>)}
    </>}
    {(scene==='inspection'||scene==='systems')&&<>
      <path d="M64 30h91v140H64Z" fill="#e5e9da" stroke="#8b9b79" strokeWidth="1.7"/><path d="M70 36h79v134H70Z" stroke="#c0c9af"/><path d="M133 101h10" stroke="#7b9068" strokeWidth="3"/>
      <path d="M172 48h61v73h-61Z" fill="#fffdf2" stroke="#a1ad8b"/>{[0,1,2].map(i=><g key={i} transform={`translate(181 ${65+i*17})`}><path d="m0 0 3 3 5-7m5 3h26" stroke={i===2?'#ba5638':'#93a57e'} strokeWidth="1.6"/></g>)}
      <Person x={264} y={105} flip/>
      {scene==='systems'&&<><path d="M41 23h254M112 23v-14m82 14v12" stroke="#a4b394" strokeWidth="3"/><ellipse cx="194" cy="37" rx="11" ry="4" fill="#c8d4bb" stroke="#8ea47d"/><path d="m188 48-8 13m14-12v16m6-17 8 13" stroke="#a2bab1" strokeDasharray="3 3"/></>}
      {scene==='inspection'&&<Plant/>}
    </>}
    <path d="M20 64V34h23M303 151v29h-24" stroke="#c1c5b0" strokeWidth="1"/><path d="m313 32 9 3m-6-7 3 10" stroke="#bc573d" strokeWidth="1.3"/>
  </svg>;
}
