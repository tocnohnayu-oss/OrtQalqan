/** Original vector artwork for OrtQalqan. */
export function BrandMark({className=''}:{className?:string}){
  return <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 3 43 10v13c0 7-4 13-10 17l-9 5C12 39 5 33 5 23V10Z" fill="#b64c32"/><path d="M25 10c2 7-5 9-4 14 2-1 3-3 3-5 5 4 8 7 7 11-1 5-4 7-8 7-5 0-9-3-9-8 0-7 8-10 11-19Z" fill="#fffdf8"/><path d="M24 27c0 3-4 4-3 7 1 3 6 3 6-1 0-2-2-4-3-6Z" fill="#b64c32"/><path d="M9 12 24 6l15 6" stroke="#d8a28b" strokeWidth="1"/></svg>;
}

export function CampusIllustration(){
  return <svg className="campus-illustration" viewBox="0 0 540 260" fill="none" aria-hidden="true">
    <path d="m40 183 207-68 244 76-209 64Z" fill="#e9e6dc"/>
    <path d="m49 199 210-68m-189 79 210-68m-190 80 210-69m-190 79 210-68" stroke="#d8d4c8" strokeWidth=".8"/>
    <path d="M67 96 254 36l215 67-188 61Z" fill="#fffdfa" stroke="#4a4a41" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="m67 96 214 68v74L67 170Z" fill="#f0e8d9" stroke="#4a4a41" strokeWidth="1.4"/>
    <path d="m281 164 188-61v74l-188 61Z" fill="#dcd8c6" stroke="#4a4a41" strokeWidth="1.4"/>
    <path d="m67 118 214 68 188-61M67 143l214 68 188-61" stroke="#b2ac9b" strokeWidth=".9"/>
    <path d="m74 94 180-57 208 65" stroke="#bf5139" strokeWidth="4" strokeLinejoin="round"/>
    <path d="m108 88 150-47 165 52-151 47Z" fill="#eceadf" stroke="#aaa693" strokeWidth=".8"/>
    <path d="m172 88 78-25 83 26-78 25Z" fill="#c8d0bd" stroke="#787e6e"/>
    <path d="m192 82 83 26m-61-33 82 26m-61-33 82 26m-99-6 78-25" stroke="#fffdf8" strokeWidth="1.6"/>
    {[0,1,2].map(row=><g key={row} transform={`matrix(1 .317 0 1 86 ${106+row*24})`}>{[0,1,2,3,4,5,6,7].map(col=><g key={col} transform={`translate(${col*23} 0)`}><rect width="14" height="12" fill={row===0?'#a9b6aa':'#b6bfb0'} stroke="#727c70" strokeWidth=".7"/><path d="M7 0v12" stroke="#e9ede4" strokeWidth="1"/></g>)}</g>)}
    {[0,1,2].map(row=><g key={row} transform={`matrix(1 -.325 0 1 300 ${170+row*23})`}>{[0,1,2,3,4,5,6].map(col=><g key={col} transform={`translate(${col*22} 0)`}><rect width="13" height="12" fill="#8e9b89" stroke="#65705f" strokeWidth=".7"/><path d="M6.5 0v12" stroke="#dce4d3" strokeWidth="1"/></g>)}</g>)}
    <path d="m166 177 44 14v27l-44-14Z" fill="#526257" stroke="#4a4a41"/><path d="m188 184v27" stroke="#b6c5b5"/>
    <path d="m153 175 33-11 53 17-34 11Z" fill="#bf5139" stroke="#733f31"/><path d="m153 175 52 17v5l-52-17Z" fill="#a3432e"/>
    <path d="m163 207 45 14-23 8-45-14Z" fill="#d4cebe" stroke="#a9a08d" strokeWidth=".7"/>
    <path d="m154 215 32 10m-24-17 45 14" stroke="#a9a08d" strokeWidth=".7"/>
    <g transform="translate(86 188)"><path d="m4 18-2 19m12-16 4 19" stroke="#404940" strokeWidth="4" strokeLinecap="round"/><path d="M1 5c1-6 18-5 18 2l-1 14H2Z" fill="#f7f2e8" stroke="#4d5549"/><circle cx="10" cy="-3" r="6" fill="#c8a58b"/><path d="M3-7c1-7 15-5 15 1l-16 1" fill="#bf5139"/><path d="m2 8-8 9m24-8 8 5" stroke="#5c6354" strokeWidth="3" strokeLinecap="round"/><path d="m21 10 10 2-1 13-10-2Z" fill="#c8d0ae" stroke="#525d48"/></g>
    <g transform="translate(421 201)"><path d="M0 17V-10" stroke="#7d826b" strokeWidth="2"/><ellipse cy="-22" rx="16" ry="22" fill="#bdc7a0" stroke="#889575"/><path d="M0-37v28m0-11 8-8m-8 2-7-7" stroke="#8a9775"/></g>
    <g transform="translate(455 191)"><path d="M0 13V-7" stroke="#7d826b" strokeWidth="2"/><ellipse cy="-18" rx="11" ry="16" fill="#d5d9b6" stroke="#a1aa87"/></g>
    <g transform="translate(363 225)"><path d="m0 0 0-29 13-4v28Z" fill="#bf5139" stroke="#7f4532"/><path d="m13-33 5 3v29l-5-4" fill="#e1b09b" stroke="#7f4532"/><path d="m4-24 5-1v11l-5 1Z" fill="#f7e9dc"/><path d="m4-9 5-1" stroke="#f7e9dc"/></g>
    <path d="M34 116V71h31M483 148v48h-31" stroke="#b4b0a0" strokeWidth="1"/><circle cx="34" cy="116" r="3" fill="#bf5139"/><path d="m476 52 12 4m-8-10 2 16" stroke="#bf5139" strokeWidth="1.3"/><path d="m41 231 18-6m-12-8 5 15" stroke="#b9baa8"/>
  </svg>;
}

export function EquipmentIllustration({type='OP',compact=false}:{type?:'OP'|'OU';compact?:boolean}){
  const color=type==='OP'?'#bf5139':'#537c8b';
  return <svg className={`equipment-illustration ${compact?'compact':''}`} viewBox="0 0 96 140" fill="none" aria-hidden="true">
    <ellipse cx="47" cy="129" rx="30" ry="5" fill="#dedacd"/>
    <path d="M35 32c-10 5-12 12-12 22v60c0 13 44 13 44 0V54c0-10-3-17-13-22" fill="#faf7ef" stroke="#343d35" strokeWidth="1.8"/>
    <path d="M25 69h40v40c-9 7-31 8-40 0Z" fill={color}/>
    <path d="M27 56v51m6-53v55" stroke="#e4dccd" strokeWidth="1.2"/><path d="M58 54v61" stroke="#d1c8b6" strokeWidth="1.3"/>
    <path d="M37 22h16v13H37Z" fill="#d0d4c5" stroke="#343d35" strokeWidth="1.5"/>
    <path d="M30 18h32l-9 6H32Z" fill="#343d35"/><path d="m39 18 21-8 8 3-17 10" fill={color} stroke="#343d35" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M54 28c18 0 22 9 22 21v44" stroke="#343d35" strokeWidth="5" strokeLinecap="round"/>
    <path d={type==='OU'?'m73 80-6 21h20l-7-21Z':'M72 83h9v21h-9Z'} fill={type==='OU'?'#343d35':'#c7c8b8'} stroke="#343d35" strokeWidth="1.3"/>
    <rect x="32" y="78" width="25" height="21" rx="1" fill="#fff9ee"/><path d="M37 83h15m-15 4h15m-15 4h8" stroke="#b7af9d" strokeWidth="1"/>
    <circle cx="33" cy="30" r="6" fill="#f9f7ee" stroke="#343d35" strokeWidth="1.2"/><path d="m33 30 3-3" stroke="#bf5139" strokeWidth="1.5"/>
    <path d="M25 119c11 6 28 6 40 0" stroke="#343d35" strokeWidth="1.5"/>
    {!compact&&<><path d="M8 41h11M8 114h11M13 41v73" stroke="#aaa995" strokeWidth=".8"/><path d="m11 44 4-6m-4 79 4-6" stroke="#aaa995"/><path d="M69 65h18M84 61v8" stroke="#aaa995" strokeWidth=".8"/></>}
  </svg>;
}
