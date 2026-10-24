import { useId } from 'react';
import type { BuildingKind } from '../domain/types';

/** Original typological drawings. No facade is presented as a survey of a real building. */
export function ObjectIllustration({kind='other',className=''}:{kind?:BuildingKind;className?:string}) {
  const id=useId().replaceAll(':','');
  return <svg className={`object-illustration ${className}`} viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <defs><pattern id={`oq-hatch-${id}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0v6" stroke="#d4cfc2" strokeWidth="1"/></pattern></defs>
    <path d="m20 152 175-42 106 36-176 31Z" fill="#eee9dd"/><path d="M18 159h284M34 20v126m-4-112h8m-8 100h8" stroke="#c3bcad" strokeWidth=".8"/>
    {kind==='office'?<>
      <path d="m84 29 77-14 60 20-77 16Z" fill="#fffdf8" stroke="#454a43"/><path d="M84 29v111l60 23V51Z" fill="#ece6d8" stroke="#454a43"/><path d="m144 51 77-16v111l-77 17Z" fill="#d8dfda" stroke="#454a43"/>
      {[0,1,2,3,4,5].map(i=><g key={i}><path d={`m94 ${42+i*17} 40 15m21-7 56-12`} stroke="#899a96" strokeWidth="6"/><path d={`m110 ${40+i*17}v13m66-10v13m20-17v13`} stroke="#fffdf8" strokeWidth="1.6"/></g>)}
      <path d="m211 101 58 18-39 9-19-6Z" fill="#c06447" stroke="#454a43"/><path d="M230 128v32l39-9v-32" fill="#e8dfd0" stroke="#454a43"/><path d="m235 138 27-6v15l-27 6Z" fill="#91a4a1"/><path d="m105 143 20 8v-24l-20-8Z" fill="#4e635f"/>
    </>:kind==='warehouse'?<>
      <path d="m50 95 69-51 118 34 38 49-77 26Z" fill="#d9d5c8" stroke="#454a43" strokeWidth="1.3"/><path d="m50 95 70-16 78 74-77 21-71-26Z" fill="#f6eedf" stroke="#454a43"/><path d="m121 79 77 74 77-26-38-49Z" fill={`url(#oq-hatch-${id})`} stroke="#454a43"/>
      <path d="m51 95 69-16 117-1" stroke="#b45137" strokeWidth="3"/><path d="m69 119 32 12v34l-32-12Z" fill="#a4b2ac" stroke="#697970"/><path d="m74 128 22 8m-22-1 22 8m-22-1 22 8" stroke="#d9e0d8"/><path d="m145 113 18 17v26l-18-17Z" fill="#b8b09c"/>
      <path d="m215 150 23-7 17 6-23 8Z" fill="#bda282" stroke="#6b6154"/><path d="m215 150 17 7v13l-17-7Zm17 7 23-8v13l-23 8Z" fill="#dcc7a7" stroke="#6b6154"/>
    </>:kind==='retail'?<>
      <path d="m53 73 129-29 88 32-128 33Z" fill="#fbf7ed" stroke="#454a43"/><path d="m53 73 89 36v60l-89-36Z" fill="#ede5d4" stroke="#454a43"/><path d="m142 109 128-33v60l-128 33Z" fill="#e3e3d6" stroke="#454a43"/>
      <path d="m62 97 68 27v33l-68-27Zm94 23 101-27v33l-101 27Z" fill="#b1c1bb" stroke="#5c736e"/>
      <path d="m58 88 86 34 120-31-6-13-115 30-80-32Z" fill="#c26346" stroke="#7d4939"/>
      {[0,1,2,3,4,5].map(i=><path key={i} d={`m${157+i*18} ${105-i*4.7} 3 13`} stroke="#f6e9d3" strokeWidth="7"/>)}
      <path d="m185 112 30-8v39l-30 8Z" fill="#647c77" stroke="#454a43"/><path d="m198 112v30" stroke="#e7ecdf"/><path d="m98 66 69-16 39 14-68 17Z" fill="#f4e5cf" stroke="#bda784"/>
    </>:kind==='industrial'?<>
      <path d="M63 84V26l16-4v65m155 13V39l14-3v68" fill="#ddd7c9" stroke="#454a43"/><path d="m55 92 39-26 13 31 40-27 15 32 42-27 69 39-104 42Z" fill="#f4ecdf" stroke="#454a43"/><path d="m55 92 114 44v33L55 125Z" fill="#ded8c9" stroke="#454a43"/><path d="m169 136 104-22v33l-104 22Z" fill="#bfcac2" stroke="#454a43"/>
      {[0,1,2].map(i=><g key={i}><path d={`m${64+i*37} ${101+i*14} 20 8v12l-20-8Z`} fill="#8b9f98" stroke="#5a6c64"/><path d={`m${184+i*26} ${143-i*5.5} 16-4v12l-16 4Z`} fill="#eff2e7" stroke="#5a6c64"/></g>)}
      <path d="m210 153 28-7v16l-28 7Z" fill="#b45137"/><path d="m67 22 9-3m160 17 11-3" stroke="#b45137" strokeWidth="4"/>
    </>:kind==='education'?<>
      <path d="m48 83 104-23 118 39-105 26Z" fill="#fdf9ef" stroke="#454a43"/><path d="m48 83 117 42v42L48 125Z" fill="#eee4d1" stroke="#454a43"/><path d="m165 125 105-26v43l-105 25Z" fill="#dbdecc" stroke="#454a43"/>
      <path d="m107 65 51-12 74 24-50 13Z" fill="#f8f2e5" stroke="#454a43"/><path d="M107 65V39l51-12 74 24v26l-50 13-75-25Z" fill="#d9dacc" stroke="#454a43"/><path d="m107 39 75 25 50-13-74-24Z" fill="#fffdf8" stroke="#454a43"/>
      {[0,1,2,3,4,5].map(i=><g key={i}><path d={`m${57+i*17} ${94+i*6} 10 4v11l-10-4Zm0 17 10 4v11l-10-4Z`} fill="#a3b5aa" stroke="#5e7466" strokeWidth=".6"/><path d={`m${174+i*15} ${132-i*3.8} 9-2v11l-9 2Z`} fill="#a3b5aa" stroke="#5e7466" strokeWidth=".6"/></g>)}
      <path d="m116 138 25 9v16l-25-9Z" fill="#51665b"/><path d="m106 135 20-5 28 10-20 5Z" fill="#b45137"/><path d="M151 50V13m0 0 23 6-23 5" stroke="#b45137" strokeWidth="1.4" fill="#cf9475"/>
    </>:<>
      <path d="m61 92 106-27 96 36-106 31Z" fill="#fbf8f0" stroke="#454a43"/><path d="M61 92v43l96 36v-39m0 39 106-30v-40" stroke="#454a43" strokeWidth="1.5"/><path d="m61 135 106-27 96 33m-96-76v43" stroke="#b2a995" strokeDasharray="4 4"/><path d="m90 103 43-11 38 14-43 12Zm81 3 54-14m-92 0v-12m38 26v20" stroke="#b45137" strokeWidth="1.6"/><path d="M61 92V49m0 0 106-27 96 36v43m-96-36V22m-106 27 96 36 106-27" stroke="#a9b8af" strokeDasharray="5 5"/>
    </>}
    <path d="M289 33v15m-7-7h14" stroke="#b45137"/><text x="35" y="174" fill="#8c8679" fontSize="7" fontFamily="monospace">OQ / {({education:'ED',office:'OF',retail:'RT',warehouse:'WH',industrial:'IN',other:'XX'} as const)[kind]}</text>
  </svg>;
}
