let canvas;
let handlers = { down: [], move: [], up: [] };
let gameW = 1600, gameH = 600;

function init(canvasEl, gameWidth, gameHeight) {
  canvas = canvasEl;
  gameW = gameWidth || 1600;
  gameH = gameHeight || 600;
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
  return {
    x: (e.clientX - rect.left) / rect.width * gameW,
    y: (e.clientY - rect.top) / rect.height * gameH
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
