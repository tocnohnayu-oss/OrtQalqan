/** Portable schematic fittings shared by SVG, PDF and room-kit previews. These are symbols, not an inventory. */
/**
 * @typedef {{tag:'rect',attrs:{x:number,y:number,width:number,height:number,fill:string,stroke:string,strokeWidth:number,rx?:number,transform?:string}} | {tag:'circle',attrs:{cx:number,cy:number,r:number,fill:string,stroke:string,strokeWidth:number,transform?:string}} | {tag:'path',attrs:{d:string,fill:string,stroke:string,strokeWidth:number,strokeDasharray?:string,transform?:string}}} FurnitureShape
 * @param {import('./types').LayoutRoom} room
 * @returns {FurnitureShape[]}
 */
export function furniturePrimitives(room) {
  if (!room.rotation) return rawFurniture(room);
  const points=room.points,x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y)),w=Math.max(...points.map(p=>p.x))-x,h=Math.max(...points.map(p=>p.y))-y,cx=x+w/2,cy=y+h/2;
  const angle=-room.rotation*Math.PI/180,cos=Math.cos(angle),sin=Math.sin(angle);
  const local={...room,points:points.map(p=>({x:Math.round((cx+(p.x-cx)*cos-(p.y-cy)*sin)*1000)/1000,y:Math.round((cy+(p.x-cx)*sin+(p.y-cy)*cos)*1000)/1000}))};
  return rawFurniture(local).map(shape=>({...shape,attrs:{...shape.attrs,transform:`rotate(${room.rotation} ${cx} ${cy})`}}));
}
function rawFurniture(room) {
  const points=room.points,x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y)),w=Math.max(...points.map(p=>p.x))-x,h=Math.max(...points.map(p=>p.y))-y;
  if(w<1.6||h<1.6)return [];
  const shapes=[],stroke='#a7ad9f',fill='#e8e7da',dark='#c2c9ba';
  const rect=(x,y,width,height,extra={})=>({tag:'rect',attrs:{x,y,width,height,fill,stroke,strokeWidth:.025,...extra}});
  const path=(d,extra={})=>({tag:'path',attrs:{d,fill:'none',stroke,strokeWidth:.035,...extra}});
  const circle=(cx,cy,r,extra={})=>({tag:'circle',attrs:{cx,cy,r,fill,stroke,strokeWidth:.025,...extra}});
  function inside(point){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
  function group(gx,gy,gw,gh,items){if([[gx+.01,gy+.01],[gx+gw-.01,gy+.01],[gx+gw-.01,gy+gh-.01],[gx+.01,gy+gh-.01]].every(([x,y])=>inside({x,y})))shapes.push(...items);}
  const grid=(dx,dy,gw,gh,make)=>{const cols=Math.max(1,Math.min(8,Math.floor((w-.9)/dx))),rows=Math.max(1,Math.min(8,Math.floor((h-1.5)/dy)));for(let col=0;col<cols;col++)for(let row=0;row<rows;row++){const gx=x+.5+col*(w-.9)/cols,gy=y+1.1+row*(h-1.5)/rows;group(gx,gy,gw,gh,make(gx,gy));}};
  if(room.preset==='classroom'){
    group(x+.8,y+.22,w-1.6,.12,[rect(x+.8,y+.22,w-1.6,.12,{fill:'#b3c1ab',stroke:'#8e9d87'})]);
    grid(1.7,1.4,1.15,.98,(gx,gy)=>[rect(gx,gy,1.15,.58,{fill:'#e8decc'}),path(`M${gx+.575} ${gy}v.58`),rect(gx+.08,gy+.74,.36,.18,{fill:dark}),rect(gx+.71,gy+.74,.36,.18,{fill:dark})]);
  }else if(room.preset==='library'||room.preset==='shop'){
    const cols=Math.min(8,Math.max(1,Math.floor((w-1)/1.8))),rh=Math.max(.8,h-1.6);
    for(let i=0;i<cols;i++){const gx=x+.5+i*(w-1)/cols,gy=y+.6;const items=[rect(gx,gy,.65,rh,{fill:'#dce3cf'}),path(`M${gx+.325} ${gy}v${rh}`)];for(let j=0;j<Math.min(26,Math.floor(rh/.18));j++)items.push(path(`M${gx+.06} ${gy+.1+j*.18}h.53`,{stroke:'#b6bca9',strokeWidth:.04}));group(gx,gy,.65,rh,items);}
    if(room.preset==='shop')group(x+w-2.2,y+h-1.1,1.7,.55,[rect(x+w-2.2,y+h-1.1,1.7,.55,{fill:'#d5d8ca'})]);
  }else if(room.preset==='lab'){
    grid(2.5,1.8,1.8,1.25,(gx,gy)=>[rect(gx,gy,1.8,.75,{fill:'#dfe4d3'}),circle(gx+.3,gy+.35,.13,{fill:'#f8f5eb'}),circle(gx+1.5,gy+.35,.13,{fill:'#f8f5eb'}),path(`M${gx+.9} ${gy}v.75`),circle(gx+.35,gy+1.08,.15),circle(gx+1.45,gy+1.08,.15)]);
  }else if(room.preset==='gym'){
    const gx=x+.7,gy=y+.7,gw=w-1.4,gh=h-1.4;
    group(gx,gy,gw,gh,[rect(gx,gy,gw,gh,{fill:'#f1ecdf',stroke:'#c3b390',strokeWidth:.04}),path(`M${gx+gw/2} ${gy}v${gh}`,{stroke:'#c3b390'}),circle(gx+gw/2,gy+gh/2,Math.min(gh*.22,1.2),{fill:'none',stroke:'#c3b390'}),path(`M${gx} ${gy+gh*.28}h${gw*.2}v${gh*.44}h${-gw*.2}M${gx+gw} ${gy+gh*.28}h${-gw*.2}v${gh*.44}h${gw*.2}`,{stroke:'#c3b390'}),path(`M${gx+.1} ${gy+gh/2-.3}v.6m${gw-.2}-.6v.6`,{stroke:'#a89876',strokeWidth:.07})]);
  }else if(room.preset==='office'||room.preset==='generic'){
    grid(2.3,1.8,1.6,1.15,(gx,gy)=>[rect(gx,gy,1.6,.75,{fill:'#e9dfce'}),rect(gx+.55,gy+.1,.45,.3,{fill:'#bccdc5'}),path(`M${gx+.65} ${gy+.48}h.28`),rect(gx+.6,gy+.9,.4,.23,{fill:dark})]);
  }else if(room.preset==='meeting'){
    const tw=Math.max(.8,w-2),th=Math.max(.7,Math.min(1.4,h-1.8)),tx=x+(w-tw)/2,ty=y+(h-th)/2,chairs=Math.min(8,Math.max(2,Math.floor(tw/.75)));
    const items=[rect(tx,ty,tw,th,{fill:'#e5ddcc',rx:.18})];for(let i=0;i<chairs;i++){const cx=tx+(i+.5)*tw/chairs;items.push(rect(cx-.2,ty-.4,.4,.25,{fill:dark}),rect(cx-.2,ty+th+.15,.4,.25,{fill:dark}));}group(tx-.05,ty-.45,tw+.1,th+.9,items);
  }else if(room.preset==='server'){
    grid(1.5,1.8,.7,1.2,(gx,gy)=>[rect(gx,gy,.7,1.2,{fill:'#c5cec4'}),...[.2,.4,.6,.8,1].map(k=>path(`M${gx+.08} ${gy+k}h.54`,{stroke:'#9daa9c',strokeWidth:.045})),circle(gx+.57,gy+.1,.035,{fill:'#8fa18d'})]);
  }else if(room.preset==='storage'||room.preset==='loading'){
    grid(1.7,1.6,1.15,1.05,(gx,gy)=>[rect(gx,gy,1.15,1.05,{fill:'#dccbab',stroke:'#b4a181'}),path(`M${gx+.15} ${gy+.1}v.85m.43-.85v.85m.42-.85v.85`,{stroke:'#c2ae88'})]);
  }else if(room.preset==='workshop'){
    grid(2.6,2.2,1.6,1.5,(gx,gy)=>[rect(gx,gy,1.6,1.5,{fill:'#d4decf'}),rect(gx+.15,gy+.15,1.3,.8,{fill:'#c1cdbb'}),circle(gx+.8,gy+.55,.26,{fill:'#dee5d6'}),path(`M${gx+.2} ${gy+1.3}h1.2`,{stroke:'#bda77c',strokeWidth:.12})]);
  }else if(room.preset==='stairs'){
    const gx=x+.45,gy=y+.45,gw=w-.9,gh=h-.9,steps=Math.min(25,Math.max(6,Math.round(gh/.28)));group(gx,gy,gw,gh,[rect(gx,gy,gw,gh,{fill:'#e7e8da'}),...Array.from({length:steps},(_,i)=>path(`M${gx} ${gy+(i+1)*gh/steps}h${gw}`)),path(`M${gx+gw*.55} ${gy+gh-.3}V${gy+.3}l-.16 .25m.16-.25 .16 .25`,{stroke:'#7f9078',strokeWidth:.05})]);
  }else if(room.preset==='toilet'){
    const cols=Math.min(4,Math.max(1,Math.floor((w-.6)/.9)));for(let i=0;i<cols;i++){const gx=x+.3+i*(w-.6)/cols,gy=y+.35;group(gx,gy,.72,1.2,[rect(gx,gy,.72,1.2,{fill:'#f1eee3'}),rect(gx+.2,gy+.15,.32,.25,{fill:'#dae0d3'}),circle(gx+.36,gy+.65,.2,{fill:'#fffdf8'})]);}
  }else if(room.preset==='corridor')shapes.push(path(`M${x+.7} ${y+h/2}H${x+w-.7}`,{stroke:'#c9c3b5',strokeWidth:.025,strokeDasharray:'.16 .14'}));
  return shapes;
}
