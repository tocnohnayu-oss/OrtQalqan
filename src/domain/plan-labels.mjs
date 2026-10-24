/** Screen-space typography. Nothing here changes a room or a calculation. */
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const overlaps = (a, b, gap = 4) => a.x < b.x + b.width + gap && a.x + a.width + gap > b.x && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
const contains = (box, point) => point.x >= box.x - 3 && point.x <= box.x + box.width + 3 && point.y >= box.y - 3 && point.y <= box.y + box.height + 3;
const estimate = (text, size) => Array.from(text).reduce((width, c) => width + size * (/\s/u.test(c) ? .3 : /[ilI1.,:·]/u.test(c) ? .3 : /[MWШЩЖЮӨ]/u.test(c) ? .85 : .59), 0);

export function wrapPlanText(text, width, measure, maxLines = 2) {
  const words = String(text).trim().split(/\s+/u), lines = [];
  let line = '';
  for (const word of words) {
    if (measure(line ? `${line} ${word}` : word) <= width) { line = line ? `${line} ${word}` : word; continue; }
    if (line) { lines.push(line); line = ''; }
    let part = '';
    for (const char of Array.from(word)) {
      if (part && measure(part + char) > width) { lines.push(part); part = ''; }
      part += char;
    }
    line = part;
  }
  if (line) lines.push(line);
  const truncated = lines.length > maxLines;
  if (truncated) {
    lines.length = maxLines;
    let last = lines.at(-1);
    while (last && measure(last + '…') > width) last = Array.from(last).slice(0, -1).join('');
    lines[maxLines - 1] = last + '…';
  }
  return { lines, truncated };
}

/** Try an interior label, then nearby leader labels; never overlap other labels. */
export function placePlanLabels(items, view, viewport, measure = estimate) {
  const { width, height } = viewport;
  const scale = Math.min(width / view.width, height / view.height);
  if (!Number.isFinite(scale) || scale <= 0 || width < 40 || height < 40) return { labels: [], hidden: 0, scale: 1, offsetX: 0, offsetY: 0 };
  const offsetX = (width - view.width * scale) / 2, offsetY = (height - view.height * scale) / 2;
  const labels = [];
  let hidden = 0;
  const size = clamp(.46 * scale, 14, 18), detailSize = clamp(.34 * scale, 12, 14), padding = 7;
  const build = (item, contentWidth) => {
    const name = wrapPlanText(item.name, contentWidth, text => measure(text, size, 600));
    const detail = wrapPlanText(item.detail, contentWidth, text => measure(text, detailSize, 400));
    return { nameLines: name.lines, detailLines: detail.lines, truncated: name.truncated, width: Math.ceil(Math.max(30, ...name.lines.map(text => measure(text, size, 600)), ...detail.lines.map(text => measure(text, detailSize, 400))) + padding * 2), height: Math.ceil(name.lines.length * (size + 3) + detail.lines.length * (detailSize + 3) + padding * 2 - 1), size, detailSize };
  };
  const ordered = items.map((item, index) => ({ ...item, index })).sort((a, b) => (b.priority || 0) - (a.priority || 0) || a.bounds.width * a.bounds.height - b.bounds.width * b.bounds.height || a.index - b.index);
  for (const item of ordered) {
    const anchor = { x: offsetX + (item.center.x - view.x) * scale, y: offsetY + (item.center.y - view.y) * scale };
    if (anchor.x < 0 || anchor.y < 0 || anchor.x > width || anchor.y > height) continue;
    const full = build(item, Math.min(166, width - 30)), availableWidth = item.bounds.width * scale - 16, availableHeight = item.bounds.height * scale - 16;
    const inner = availableWidth >= 60 ? build(item, Math.min(166, availableWidth)) : null;
    const candidates = [];
    if (inner && inner.height <= availableHeight && (!inner.truncated || full.truncated)) candidates.push({ ...inner, x: anchor.x - inner.width / 2, y: anchor.y - inner.height / 2, callout: false });
    const dx = Math.min(item.bounds.width * scale / 2, 35) + full.width / 2 + 9, dy = Math.min(item.bounds.height * scale / 2, 35) + full.height / 2 + 9;
    for (const [x, y] of [[dx, 0], [-dx, 0], [0, -dy], [0, dy], [dx, -full.height - 6], [-dx, -full.height - 6], [dx, full.height + 6], [-dx, full.height + 6]]) {
      candidates.push({ ...full, x: clamp(anchor.x + x - full.width / 2, 7, width - full.width - 7), y: clamp(anchor.y + y - full.height / 2, 7, height - full.height - 7), callout: true });
    }
    const placed = candidates.find(candidate => candidate.x >= 6 && candidate.y >= 6 && candidate.x + candidate.width <= width - 6 && candidate.y + candidate.height <= height - 6 && (!candidate.callout || !contains(candidate, anchor)) && !labels.some(label => overlaps(candidate, label)) && !items.some(other => other.id !== item.id && contains(candidate, {x:offsetX+(other.center.x-view.x)*scale,y:offsetY+(other.center.y-view.y)*scale})));
    if (placed) labels.push({ ...placed, id: item.id, anchor, index: item.index });
    else hidden++;
  }
  return { labels, hidden, scale, offsetX, offsetY };
}
