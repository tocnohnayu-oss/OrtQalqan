import { ROOM_PRESETS } from './room-presets.mjs';
import { furniturePrimitives } from './furniture.mjs';
/** User-drawn orthogonal geometry in metres. It never feeds the fire calculation implicitly. */
const EPS = 0.00001;
export const emptyLayout = () => ({ version: 1, rooms: [], openings: [] });
export const round = value => Math.round(value * 100) / 100;
export const snap = value => Math.round(value * 4) / 4;
export const snapPoint = p => ({ x: snap(p.x), y: snap(p.y) });
export const rectPoints = (x, y, width, height) => [{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }];
export const signedArea = points => points.reduce((sum, p, i) => { const q = points[(i + 1) % points.length]; return sum + p.x * q.y - q.x * p.y; }, 0) / 2;
export const polygonArea = points => round(Math.abs(signedArea(points)));
export const edges = points => points.map((a, i) => ({ a, b: points[(i + 1) % points.length], index: i }));
export function roomBounds(points) {
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}
export function layoutBounds(layout, padding = 2) {
  if (!layout.rooms.length) return { x: -2, y: -2, width: 32, height: 22 };
  const box = roomBounds(layout.rooms.flatMap(r => r.points));
  return { x: box.x - padding, y: box.y - padding, width: Math.max(8, box.width + padding * 2), height: Math.max(6, box.height + padding * 2) };
}
function segmentsTouch(a, b, c, d) {
  const horizontal = Math.abs(a.y - b.y) < EPS, otherHorizontal = Math.abs(c.y - d.y) < EPS;
  const between = (v, x, y) => v >= Math.min(x, y) - EPS && v <= Math.max(x, y) + EPS;
  if (horizontal === otherHorizontal) return horizontal ? Math.abs(a.y - c.y) < EPS && Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)) <= Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) + EPS : Math.abs(a.x - c.x) < EPS && Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)) <= Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) + EPS;
  return horizontal ? between(c.x, a.x, b.x) && between(a.y, c.y, d.y) : between(a.x, c.x, d.x) && between(c.y, a.y, b.y);
}
export function validPolygon(points) {
  if (!Array.isArray(points) || points.length < 4 || points.length > 40 || points.some(p => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || Math.abs(p.x) > 200 || Math.abs(p.y) > 200)) return false;
  const segments = edges(points);
  if (segments.some(({ a, b }) => Math.hypot(a.x - b.x, a.y - b.y) < .25 - EPS || (Math.abs(a.x - b.x) > EPS && Math.abs(a.y - b.y) > EPS))) return false;
  if (polygonArea(points) < .25) return false;
  for (let i = 0; i < segments.length; i++) {
    const prev = points[(i + points.length - 1) % points.length], p = points[i], next = points[(i + 1) % points.length];
    if (Math.abs(prev.x - p.x) < EPS && Math.abs(next.x - p.x) < EPS || Math.abs(prev.y - p.y) < EPS && Math.abs(next.y - p.y) < EPS) return false;
    for (let j = i + 1; j < segments.length; j++) {
      if (j === i + 1 || i === 0 && j === segments.length - 1) continue;
      if (segmentsTouch(segments[i].a, segments[i].b, segments[j].a, segments[j].b)) return false;
    }
  }
  return true;
}
/** Close a drawn orthogonal contour; remove redundant collinear clicks. */
export function closeContour(points) {
  let result = points.map(p => ({ ...p }));
  if (result.length > 1 && result[0].x === result.at(-1).x && result[0].y === result.at(-1).y) result.pop();
  if (result.length > 2 && result[0].x !== result.at(-1).x && result[0].y !== result.at(-1).y) result.push({ x: result[0].x, y: result.at(-1).y });
  let changed = true;
  while (changed && result.length >= 4) {
    changed = false;
    for (let i = 0; i < result.length; i++) {
      const a = result[(i + result.length - 1) % result.length], b = result[i], c = result[(i + 1) % result.length];
      if (a.x === b.x && b.x === c.x || a.y === b.y && b.y === c.y) { result.splice(i, 1); changed = true; break; }
    }
  }
  return result;
}
/** Orthogonal polygons can be exactly decomposed into interior rectangles. */
function strips(points) {
  const xs = [...new Set(points.map(p => p.x))].sort((a, b) => a - b), result = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const mid = (xs[i] + xs[i + 1]) / 2;
    const ys = edges(points).filter(({ a, b }) => a.y === b.y && mid > Math.min(a.x, b.x) && mid < Math.max(a.x, b.x)).map(e => e.a.y).sort((a, b) => a - b);
    for (let j = 0; j < ys.length - 1; j += 2) result.push({ x: xs[i], y: ys[j], width: xs[i + 1] - xs[i], height: ys[j + 1] - ys[j] });
  }
  return result;
}
const boxesOverlap = (a, b) => Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > EPS && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > EPS;
export function interiorsOverlap(a, b) {
  if (!boxesOverlap(roomBounds(a), roomBounds(b))) return false;
  const aa = strips(a), bb = strips(b);
  return aa.some(x => bb.some(y => boxesOverlap(x, y)));
}
export function labelPoint(points) {
  const largest = labelBounds(points);
  return largest ? { x: largest.x + largest.width / 2, y: largest.y + largest.height / 2 } : points[0];
}
export function labelBounds(points) { return strips(points).sort((a, b) => b.width * b.height - a.width * a.height)[0] || roomBounds(points); }
export function placementIssue(layout, room) {
  if (!validPolygon(room.points)) return 'invalidShape';
  if (layout.rooms.some(r => r.id !== room.id && interiorsOverlap(r.points, room.points))) return 'overlap';
  return null;
}
export function moveVertex(points, index, point) {
  const next = points.map(p => ({ ...p })), prev = (index + points.length - 1) % points.length, after = (index + 1) % points.length;
  if (points[prev].x === points[index].x) next[prev].x = point.x; else next[prev].y = point.y;
  if (points[after].x === points[index].x) next[after].x = point.x; else next[after].y = point.y;
  next[index] = { ...point };
  return next;
}
export function rotateRoom(room, direction = 1) {
  const box = roomBounds(room.points), cx = box.x + box.width / 2, cy = box.y + box.height / 2, sign = direction < 0 ? -1 : 1;
  return { ...room, rotation: ((room.rotation || 0) + sign * 90 + 360) % 360,
    points: room.points.map(p => ({ x: round(cx - sign * (p.y - cy)), y: round(cy + sign * (p.x - cx)) })) };
}
export function nearestWall(room, point) {
  let best = null;
  for (const { a, b, index } of edges(room.points)) {
    const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (length * length)));
    const distance = Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
    if (!best || distance < best.distance) best = { edge: index, position: t, distance, length };
  }
  return best;
}
export function openingFits(room, opening) {
  const a = room.points[opening.edge], b = room.points[(opening.edge + 1) % room.points.length];
  if (!a || !b || !Number.isFinite(opening.width) || opening.width < .4 || opening.width > 6 || !Number.isFinite(opening.position)) return false;
  const length = Math.hypot(b.x - a.x, b.y - a.y), half = opening.width / length / 2;
  return opening.position >= half - EPS && opening.position <= 1 - half + EPS;
}
export function openingsConflict(a, b) {
  return a.roomId === b.roomId && a.edge === b.edge && Math.abs(a.position - b.position) < EPS;
}
export function openingCollision(layout, opening) {
  const room = layout.rooms.find(r => r.id === opening.roomId);
  if (!room || !openingFits(room, opening)) return true;
  const a = room.points[opening.edge], b = room.points[(opening.edge + 1) % room.points.length], length = Math.hypot(b.x - a.x, b.y - a.y);
  return layout.openings.some(o => o.id !== opening.id && o.roomId === opening.roomId && o.edge === opening.edge && Math.abs(o.position - opening.position) * length < (o.width + opening.width) / 2 + .05);
}
/** Preserve openings during a wall edit; reject a wall shorter than its door/window. */
export function fitOpenings(room, openings) {
  const result = [];
  for (const opening of openings) {
    if (opening.roomId !== room.id) { result.push(opening); continue; }
    const a = room.points[opening.edge], b = room.points[(opening.edge + 1) % room.points.length];
    if (!a || !b) return null;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length < opening.width) return null;
    const margin = opening.width / length / 2;
    result.push({ ...opening, position: Math.max(margin, Math.min(1 - margin, opening.position)) });
  }
  return result;
}
export function openingGeometry(room, opening) {
  const a = room.points[opening.edge], b = room.points[(opening.edge + 1) % room.points.length], length = Math.hypot(b.x - a.x, b.y - a.y);
  const u = { x: (b.x - a.x) / length, y: (b.y - a.y) / length }, direction = (signedArea(room.points) >= 0 ? 1 : -1) * (opening.swing === 'out' ? -1 : 1);
  const normal = { x: -u.y * direction, y: u.x * direction }, center = { x: a.x + (b.x - a.x) * opening.position, y: a.y + (b.y - a.y) * opening.position };
  const start = { x: center.x - u.x * opening.width / 2, y: center.y - u.y * opening.width / 2 }, end = { x: center.x + u.x * opening.width / 2, y: center.y + u.y * opening.width / 2 };
  const hinge = opening.hinge === 'end' ? end : start, opposite = opening.hinge === 'end' ? start : end;
  const leaf = { x: hinge.x + normal.x * opening.width, y: hinge.y + normal.y * opening.width };
  const cross = (opposite.x - hinge.x) * normal.y - (opposite.y - hinge.y) * normal.x;
  return { start, end, normal, hinge, leaf, center, arc: `M${opposite.x} ${opposite.y}A${opening.width} ${opening.width} 0 0 ${cross > 0 ? 1 : 0} ${leaf.x} ${leaf.y}` };
}
export function validateLayout(layout, zoneIds) {
  if (!layout || layout.version !== 1 || !Array.isArray(layout.rooms) || layout.rooms.length > 120 || !Array.isArray(layout.openings) || layout.openings.length > 400) return false;
  if (layout.example !== undefined && typeof layout.example !== 'boolean') return false;
  const ids = new Set(), linked = new Set();
  for (const room of layout.rooms) {
    if (!room || typeof room.id !== 'string' || !room.id || ids.has(room.id) || typeof room.name !== 'string' || room.name.length > 160 || typeof room.nameKk !== 'string' || room.nameKk.length > 160 || !validPolygon(room.points)) return false;
    ids.add(room.id);
    if (room.preset !== undefined && !Object.hasOwn(ROOM_PRESETS, room.preset)) return false;
    if (room.autoOpenings !== undefined && typeof room.autoOpenings !== 'boolean') return false;
    if (room.rotation !== undefined && ![0,90,180,270].includes(room.rotation)) return false;
    if (room.zoneId !== undefined) {
      if (typeof room.zoneId !== 'string' || !room.zoneId || linked.has(room.zoneId) || zoneIds && !zoneIds.has(room.zoneId)) return false;
      linked.add(room.zoneId);
    }
  }
  if (layout.rooms.some((r, i) => layout.rooms.slice(i + 1).some(other => interiorsOverlap(r.points, other.points)))) return false;
  for (const opening of layout.openings) {
    if (!opening || typeof opening.id !== 'string' || !opening.id || ids.has(opening.id) || !Number.isInteger(opening.edge) || opening.edge < 0 || !['door', 'window'].includes(opening.type) || !['start', 'end'].includes(opening.hinge) || !['in', 'out'].includes(opening.swing)) return false;
    const room = layout.rooms.find(r => r.id === opening.roomId);
    if (opening.auto !== undefined && typeof opening.auto !== 'boolean') return false;
    if (!room || !openingFits(room, opening) || openingCollision(layout, opening)) return false;
    ids.add(opening.id);
  }
  return true;
}
/** @param {import('./types').Floor} floor @param {import('./types').FloorLayout} layout */
export function applyFloorLayout(floor, layout, useAreas = false) {
  if (!validateLayout(layout)) throw Error('Invalid floor layout');
  const next = structuredClone(floor);
  for (const room of layout.rooms) {
    if (!room.zoneId) continue;
    let zone = next.zones.find(z => z.id === room.zoneId);
    if (!zone) {
      zone = { id: room.zoneId, name: room.name, nameKk: room.nameKk, area: 0, hazard: 'special', category: 'public', sensitive: false, temperature: 'unknown', automatic: 'unknown', existing: 0 };
      next.zones.push(zone);
    }
    zone.name = room.name; zone.nameKk = room.nameKk;
    if (useAreas) zone.area = polygonArea(room.points);
  }
  if (next.zones.length > 100) throw Error('Too many calculation zones');
  next.layout = structuredClone(layout);
  return next;
}

const escapeXML = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
/** Standalone vector export, independent of the browser DOM. */
export function layoutSVG(layout, language, zones = []) {
  if (!validateLayout(layout)) throw Error('Invalid floor layout');
  const box = layoutBounds(layout), parts = [];
  for (const room of layout.rooms) {
    const zone = zones.find(z => z.id === room.zoneId), name = language === 'kk' ? zone?.nameKk || room.nameKk : zone?.name || room.name;
    const center = labelPoint(room.points);
    parts.push(`<polygon points="${room.points.map(p => `${p.x},${p.y}`).join(' ')}" fill="${room.zoneId ? '#fffdf8' : '#f1eee6'}" stroke="#343934" stroke-width=".16"/>`);
    for(const shape of furniturePrimitives(room))parts.push(`<${shape.tag} ${Object.entries(shape.attrs).map(([key,value])=>`${key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}="${escapeXML(value)}"`).join(' ')}/>`);
    parts.push(`<text x="${center.x}" y="${center.y}" text-anchor="middle" font-family="Arial,sans-serif" font-size=".42" fill="#343934">${escapeXML(name)}</text><text x="${center.x}" y="${center.y + .55}" text-anchor="middle" font-family="Arial,sans-serif" font-size=".32" fill="#74776d">${polygonArea(room.points)} м²</text>`);
  }
  for (const opening of layout.openings) {
    const room = layout.rooms.find(r => r.id === opening.roomId), g = openingGeometry(room, opening);
    parts.push(`<path d="M${g.start.x} ${g.start.y}L${g.end.x} ${g.end.y}" stroke="#fffdf8" stroke-width=".26"/>`);
    if (opening.type === 'door') parts.push(`<path d="M${g.hinge.x} ${g.hinge.y}L${g.leaf.x} ${g.leaf.y} ${g.arc}" fill="none" stroke="#687065" stroke-width=".035"/>`);
    else parts.push(`<path d="M${g.start.x} ${g.start.y}L${g.end.x} ${g.end.y}" stroke="#6d8d91" stroke-width=".08"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.width} ${box.height}" width="1400" height="${Math.round(1400 * box.height / box.width)}"><title>OrtQalqan · ${language === 'kk' ? 'Пайдаланушы жасаған жоспар' : 'План, построенный пользователем'}</title><rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="#fffdf8"/>${parts.join('')}</svg>`;
}
