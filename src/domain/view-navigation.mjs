/** Camera coordinates only: these operations never change the floor geometry. */
export function screenPoint(view, rect, point) {
  const scale = Math.min(rect.width / view.width, rect.height / view.height);
  return {
    x: view.x + (point.x - rect.left - (rect.width - view.width * scale) / 2) / scale,
    y: view.y + (point.y - rect.top - (rect.height - view.height * scale) / 2) / scale,
  };
}

/** Keep the initial world anchor under the moving screen midpoint, including SVG letterboxing. */
export function navigateView(view, rect, start, current, ratio = 1) {
  if (!Number.isFinite(ratio) || ratio <= 0 || rect.width <= 0 || rect.height <= 0) return view;
  const factor = Math.min(Math.max(ratio, 4 / view.width, 3 / view.height), 480 / Math.max(view.width, view.height));
  const anchor = screenPoint(view, rect, start);
  const next = { x: 0, y: 0, width: view.width * factor, height: view.height * factor };
  const target = screenPoint(next, rect, current);
  return { ...next, x: anchor.x - target.x, y: anchor.y - target.y };
}
