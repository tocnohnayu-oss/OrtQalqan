import { FileImage, SquareDashed } from 'lucide-react';
import type { Floor } from '../domain/types';
import { layoutBounds } from '../domain/layout.mjs';

/** A quiet source preview; no labels, measurements or invented floor geometry. */
export function FloorThumbnail({floor}:{floor:Floor}) {
  if(floor.layout?.rooms.length){
    const box=layoutBounds(floor.layout,1);
    return <svg className="floor-thumbnail" data-floor-drawing={floor.id} viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} aria-hidden="true" focusable="false">
      {floor.layout.rooms.map(room=><path key={room.id} data-source-room={room.id} className={room.zoneId?'':'is-common'} d={room.points.map((point,i)=>`${i?'L':'M'}${point.x} ${point.y}`).join(' ')+'Z'}/>)}
    </svg>;
  }
  if(floor.plan)return <span className="floor-thumbnail floor-thumbnail-image" aria-hidden="true" data-floor-image={floor.id}><img src={floor.plan} alt=""/><FileImage size={12}/></span>;
  return <span className="floor-thumbnail floor-thumbnail-empty" aria-hidden="true" data-floor-empty={floor.id}><SquareDashed size={26}/></span>;
}
