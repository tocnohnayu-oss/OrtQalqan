import type { BuildingKind } from '../domain/types';

/** Original type illustrations, never a reconstruction of the active building. */
export function ObjectSketch({kind='other'}:{kind?:BuildingKind}){
  return <svg className="object-sketch" data-kind={kind} viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <path d="M11 79h74" stroke="#253b42" strokeWidth="2"/>
    {kind==='education'?<>
      <path d="M18 42h60v37H18Z" fill="#eee7d7" stroke="#253b42" strokeWidth="2"/><path d="M34 27h28v52H34Z" fill="#fffdf8" stroke="#253b42" strokeWidth="2"/>
      <path d="m29 28 19-15 19 15Z" fill="#b5452b"/><circle cx="48" cy="39" r="6" stroke="#253b42" strokeWidth="1.6"/><path d="M48 35v4l3 2M44 79V59h9v20" stroke="#253b42" strokeWidth="2"/>
      <path d="M24 51h4m-4 10h4m-4 10h4m40-20h4m-4 10h4m-4 10h4" stroke="#81988b" strokeWidth="4"/>
    </>:kind==='office'?<>
      <path d="M23 19h42v60H23Z" fill="#fffdf8" stroke="#253b42" strokeWidth="2"/><path d="M65 38h15v41H65Z" fill="#ead7c7" stroke="#253b42" strokeWidth="2"/>
      <path d="M23 19h42v8H23Z" fill="#b5452b"/><path d="M31 36h6m8 0h6m-20 11h6m8 0h6m-20 11h6m8 0h6" stroke="#80968b" strokeWidth="4"/><path d="M40 79V67h10v12M71 48h4m-4 10h4m-4 10h4" stroke="#253b42" strokeWidth="2"/>
    </>:kind==='retail'?<>
      <path d="M17 44h62v35H17Z" fill="#fffdf8" stroke="#253b42" strokeWidth="2"/><path d="M16 27h64l6 17H10Z" fill="#b5452b" stroke="#253b42" strokeWidth="2"/>
      <path d="m29 28-3 15m20-15v15m19-15 3 15" stroke="#f2d5be" strokeWidth="5"/><path d="M25 53h23v17H25Zm34 26V53h13v26" fill="#dae3dc" stroke="#253b42" strokeWidth="2"/><path d="M21 22h54" stroke="#253b42" strokeWidth="2"/>
    </>:kind==='warehouse'?<>
      <path d="M15 39 48 17l33 22v40H15Z" fill="#fffdf8" stroke="#253b42" strokeWidth="2"/><path d="m10 40 38-26 38 26" stroke="#b5452b" strokeWidth="5"/>
      <path d="M26 48h31v31H26Z" fill="#d9e1d8" stroke="#253b42" strokeWidth="2"/><path d="M28 55h27m-27 7h27m-27 7h27M66 63h12v16H66Z" stroke="#7d9183" strokeWidth="2"/><path d="M44 79v-6h13v6" stroke="#253b42" strokeWidth="2"/>
    </>:kind==='industrial'?<>
      <path d="M19 46V18h10v31" fill="#e5d2c0" stroke="#253b42" strokeWidth="2"/><path d="M15 79V49l21-14v14l22-14v14l23-14v44Z" fill="#fffdf8" stroke="#253b42" strokeWidth="2"/>
      <path d="m15 49 21-14v14l22-14v14l23-14" stroke="#b5452b" strokeWidth="3"/><path d="M25 62h9m10 0h9m10 0h9" stroke="#82998c" strokeWidth="6"/><path d="M49 79V69h11v10" stroke="#253b42" strokeWidth="2"/>
    </>:<>
      <path d="M24 20h42l14 14v45H24Z" fill="#e9dfce" stroke="#253b42" strokeWidth="2"/><path d="M16 13h43l14 14v45H16Z" fill="#fffdf8" stroke="#253b42" strokeWidth="2"/><path d="M59 13v14h14" fill="#b5452b"/>
      <path d="M28 37h31v23H28Zm0 13h31M44 37v13" stroke="#253b42" strokeWidth="2.5"/><path d="M28 65h18" stroke="#81988b" strokeWidth="2"/>
    </>}
    <path d="M7 65v14m0 0h9M82 18h7m-3.5-3.5v7" stroke="#b5452b" strokeWidth="1.5"/>
  </svg>;
}
