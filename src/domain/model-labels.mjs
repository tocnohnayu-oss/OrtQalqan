/** Place projected 3D room names in CSS pixels. Camera movement never changes source data. */
export function placeModelLabels(items, {width, height}, selected='') {
  if (!Number.isFinite(width)||!Number.isFinite(height)||width<120||height<100) return {labels:[],hidden:items.length};
  const gap=7,margin=12,placed=[],budget=Math.min(32,Math.max(3,Math.floor(width*height/9500)));
  const visible=items.filter(item=>[item.x,item.y,item.depth].every(Number.isFinite)&&item.depth>=-1&&item.depth<=1&&item.x>=margin&&item.x<=width-margin&&item.y>=margin&&item.y<=height-margin);
  const ordered=[...visible].sort((a,b)=>Number(b.id===selected)-Number(a.id===selected)||(b.priority||0)-(a.priority||0)||a.depth-b.depth);
  const overlap=(a,b)=>a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y;
  for (const item of ordered) {
    if (placed.length>=budget) break;
    const w=Math.min(width-2*margin,180,Math.max(96,Array.from(item.name||'').length*7.5+30)),h=50;
    const offsets=[[0,-h/2],[0,-h-16],[0,16],[-w/2-14,-h/2],[w/2+14,-h/2]];
    const candidates=offsets.map(([dx,dy])=>({x:Math.max(margin,Math.min(width-margin-w,item.x-w/2+dx)),y:item.y+dy,width:w,height:h}));
    const box=candidates.find(candidate=>candidate.y>=margin&&candidate.y+candidate.height<=height-margin&&!placed.some(label=>overlap(candidate,label)));
    if (box) placed.push({...box,id:item.id,anchor:{x:item.x,y:item.y}});
  }
  return {labels:placed,hidden:items.length-placed.length};
}
