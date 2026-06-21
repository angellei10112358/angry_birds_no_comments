let canvas;
let handlers = { down: [], move: [], up: [] };

function init(canvasEl) {
  canvas = canvasEl;
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.style.touchAction = 'none';
}

function onDown(e) {
  e.preventDefault();
  const pos = getPos(e);
  handlers.down.forEach(fn => fn(pos.x, pos.y, e));
}

function onMove(e) {
  e.preventDefault();
  const pos = getPos(e);
  handlers.move.forEach(fn => fn(pos.x, pos.y, e));
}

function onUp(e) {
  e.preventDefault();
  const pos = getPos(e);
  handlers.up.forEach(fn => fn(pos.x, pos.y, e));
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function on(event, fn) {
  if (handlers[event]) handlers[event].push(fn);
}

function off(event, fn) {
  if (handlers[event]) {
    handlers[event] = handlers[event].filter(h => h !== fn);
  }
}

function destroy() {
  canvas.removeEventListener('pointerdown', onDown);
  canvas.removeEventListener('pointermove', onMove);
  canvas.removeEventListener('pointerup', onUp);
  canvas.removeEventListener('pointercancel', onUp);
  handlers = { down: [], move: [], up: [] };
}

export { init, on, off, destroy };
