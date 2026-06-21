export function createInput(canvas, renderer) {
  const handlers = [];
  let pointerId = null;

  function getWorldPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : e.changedTouches[0].clientX;
    const clientY = e.clientY !== undefined ? e.clientY : e.changedTouches[0].clientY;
    const scale = renderer.getScale();
    const offX = (canvas.width / devicePixelRatio / scale - renderer.LOGICAL_W) / 2;
    const offY = (canvas.height / devicePixelRatio / scale - renderer.LOGICAL_H) / 2;
    return {
      x: (clientX - rect.left) / scale - offX + renderer.camera.x,
      y: (clientY - rect.top) / scale - offY + renderer.camera.y
    };
  }

  function getScreenPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : e.changedTouches[0].clientX;
    const clientY = e.clientY !== undefined ? e.clientY : e.changedTouches[0].clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function onPointerDown(e) {
    e.preventDefault();
    if (pointerId !== null) return;
    pointerId = e.pointerId !== undefined ? e.pointerId : (e.touches ? e.touches[0].identifier : 1);
    const wpos = getWorldPos(e);
    const spos = getScreenPos(e);
    for (const h of handlers) {
      if (h.onDown) h.onDown(wpos.x, wpos.y, spos.x, spos.y);
    }
  }

  function onPointerMove(e) {
    e.preventDefault();
    const pos = getWorldPos(e);
    for (const h of handlers) {
      if (h.onMove) h.onMove(pos.x, pos.y);
    }
  }

  function onPointerUp(e) {
    e.preventDefault();
    pointerId = null;
    for (const h of handlers) {
      if (h.onUp) h.onUp();
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });

  function addHandler(handler) {
    handlers.push(handler);
  }

  function removeHandler(handler) {
    const idx = handlers.indexOf(handler);
    if (idx >= 0) handlers.splice(idx, 1);
  }

  function clearHandlers() {
    handlers.length = 0;
  }

  return { addHandler, removeHandler, clearHandlers };
}
