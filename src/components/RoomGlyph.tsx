import type { RoomPreset } from '../domain/types';

/** A symbol of the user-selected room preset, never an inventory or a floor plan. */
export function RoomGlyph({preset,placed=false,marked=false}:{preset?:RoomPreset;placed?:boolean;marked?:boolean}){
  const symbol=placed?preset||'generic':marked?'marker':'unplaced';
  const drawing=(()=>{switch(symbol){
    case 'classroom':return <><path d="M5 5h22v5H5zM8 14h6v5H8zM19 14h6v5h-6zM8 23h6v4H8zM19 23h6v4h-6z"/><path className="room-glyph-accent" d="M8 8h16"/></>;
    case 'library':return <><path d="M5 5h6v22H5zM14 5h6v22h-6zM23 5h4v22h-4zM5 11h6M5 17h6M5 23h6M14 11h6M14 17h6M14 23h6M23 11h4M23 17h4M23 23h4"/></>;
    case 'server':return <><path d="M6 5h8v22H6zM19 5h8v22h-8zM6 12h8M6 19h8M19 12h8M19 19h8"/><path className="room-glyph-accent" d="M9 8h2M9 15h2M22 8h2M22 15h2M9 23h2M22 23h2"/></>;
    case 'lab':return <><path d="M11 5h10M13 5v9L6 25q-1 2 2 2h16q3 0 2-2l-7-11V5M10 20h12"/><path className="room-glyph-accent" d="M12 24h8"/></>;
    case 'gym':return <><path d="M4 7h24v18H4zM16 7v18M4 12h5v8H4M28 12h-5v8h5"/><circle cx="16" cy="16" r="4"/></>;
    case 'office':return <><path d="M5 8h22v11H5zM8 19v8M24 19v8M10 12h8v4h-8zM12 5h4v3M20 13h3"/><path className="room-glyph-accent" d="M13 23h6"/></>;
    case 'meeting':return <><rect x="8" y="8" width="16" height="16" rx="3"/><path d="M12 4v2M20 4v2M12 26v2M20 26v2M4 12h2M4 20h2M26 12h2M26 20h2"/><path className="room-glyph-accent" d="M12 16h8"/></>;
    case 'shop':return <><path d="M5 6h22v6H5zM7 6v6M12 6v6M17 6v6M22 6v6M7 12v15h18V12M11 18h10v5H11z"/></>;
    case 'storage':return <><path d="M5 15h10v12H5zM17 15h10v12H17zM11 4h10v9H11zM10 15v4M22 15v4M16 4v4"/><path className="room-glyph-accent" d="M8 23h4M20 23h4"/></>;
    case 'workshop':return <><path d="M4 27V14l8-5v7l8-5v6h8v10zM23 17V5h4v12M8 21h3M16 21h3M23 22h2"/></>;
    case 'loading':return <><path d="M4 14h16v11H4zM20 18h5l3 4v3h-8M7 9h11M15 6l3 3-3 3"/><circle cx="9" cy="26" r="2"/><circle cx="24" cy="26" r="2"/></>;
    case 'corridor':return <><path d="M5 5v22M27 5v22M5 10h5v5H5M27 17h-5v5h5"/><path className="room-glyph-accent" d="M16 25V8M12 12l4-4 4 4"/></>;
    case 'stairs':return <><path d="M5 27h6v-6h6v-6h6V9h5M5 19V5h16"/><path className="room-glyph-accent" d="M5 5l4 4M5 5l4-1"/></>;
    case 'toilet':return <><path d="M5 5h22v22H5zM16 5v22"/><circle cx="10.5" cy="12" r="2"/><circle cx="21.5" cy="12" r="2"/><path d="M8 22v-5h5v5M19 22v-5h5v5"/></>;
    case 'marker':return <><path d="M24 13c0 6-8 14-8 14S8 19 8 13a8 8 0 1 1 16 0Z"/><circle cx="16" cy="13" r="3"/></>;
    case 'unplaced':return <><path d="M12 5H5v7M20 5h7v7M27 20v7h-7M12 27H5v-7" strokeDasharray="3 3"/><path d="M12 16h8M16 12v8"/></>;
    default:return <><path d="M5 5h22v22H5zM5 20h6v7M20 5v6h7"/><path className="room-glyph-accent" d="M12 16h8"/></>;
  }})();
  return <svg className={`room-glyph ${placed?'is-placed':'is-unplaced'}`} data-room-glyph={symbol} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true" focusable="false">{drawing}</svg>;
}
