let canvas, ctx;
let cameraX = 0, cameraY = 0;
let targetCameraX = 0, targetCameraY = 0;
let scale = 1;
const GAME_W = 1600, GAME_H = 600;

function init() {
  canvas = document.createElement('canvas');
  canvas.width = GAME_W;
  canvas.height = GAME_H;
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

function resize() {
  const maxW = window.innerWidth;
  const maxH = window.innerHeight;
  const gameAspect = GAME_W / GAME_H;
  const winAspect = maxW / maxH;
  let w, h;
  if (winAspect > gameAspect) {
    h = maxH;
    w = h * gameAspect;
  } else {
    w = maxW;
    h = w / gameAspect;
  }
  scale = w / GAME_W;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  canvas.width = GAME_W * devicePixelRatio;
  canvas.height = GAME_H * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function setCamera(x, y) {
  targetCameraX = x;
  targetCameraY = y;
}

function updateCamera() {
  cameraX += (targetCameraX - cameraX) * 0.08;
  cameraY += (targetCameraY - cameraY) * 0.08;
}

function beginFrame() {
  ctx.clearRect(0, 0, GAME_W, GAME_H);
  ctx.save();
  ctx.translate(GAME_W / 2 - cameraX, GAME_H / 2 - cameraY);
}

function endFrame() {
  ctx.restore();
}

function drawBackground() {
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(-1000, -1000, 5000, 2000);

  ctx.fillStyle = '#5a8f3c';
  ctx.fillRect(-1000, 560, 5000, 200);

  const gx = 80;
  for (let x = -1000; x < 3000; x += gx) {
    ctx.fillStyle = '#4a7f2c';
    ctx.fillRect(x, 560, 2, 40);
    ctx.fillRect(x + gx / 2, 560, 2, 25);
  }
}

function drawSlingshot(slingshotX, slingshotY) {
  ctx.strokeStyle = '#5C3A1E';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(slingshotX - 10, slingshotY - 20);
  ctx.lineTo(slingshotX - 10, slingshotY + 80);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(slingshotX + 10, slingshotY - 20);
  ctx.lineTo(slingshotX + 10, slingshotY + 80);
  ctx.stroke();

  ctx.fillStyle = '#5C3A1E';
  ctx.fillRect(slingshotX - 15, slingshotY - 30, 30, 15);
}

function drawRubberBand(x1, y1, x2, y2) {
  ctx.strokeStyle = '#3C1A0E';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawTrajectory(points) {
  for (let i = 0; i < points.length; i++) {
    const alpha = 1 - i / points.length;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBird(bird) {
  const pos = bird.position;
  const r = bird.circleRadius || 15;
  const colors = { red: '#E53935', yellow: '#FDD835', blue: '#1E88E5', black: '#333', white: '#ECEFF1' };
  const color = colors[bird.birdType] || '#E53935';

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(bird.angle || 0);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  if (bird.birdType === 'black') {
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(-4, -5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(4, -5, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(-3, -5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(5, -5, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FF9800';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-5, 5);
  ctx.lineTo(5, 5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawPig(pig) {
  const pos = pig.position;
  const r = pig.circleRadius || 18;
  ctx.save();
  ctx.translate(pos.x, pos.y);

  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#388E3C';
  ctx.beginPath();
  ctx.arc(-6, -4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(6, -4, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(-5, -5, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(7, -5, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(-4, -5, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, -5, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2E7D32';
  ctx.beginPath();
  ctx.ellipse(2, 4, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(2, 3, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBlock(block) {
  const pos = block.position;
  const w = block.bounds.max.x - block.bounds.min.x;
  const h = block.bounds.max.y - block.bounds.min.y;
  const colors = { wood: '#8D6E63', stone: '#78909C', ice: '#B3E5FC' };
  const strokes = { wood: '#6D4C41', stone: '#546E7A', ice: '#81D4FA' };
  const tp = block.blockType || 'wood';
  const color = colors[tp] || '#8D6E63';
  const stroke = strokes[tp] || '#6D4C41';

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(block.angle || 0);

  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  if (block.hp !== undefined) {
    const maxHp = block.maxHp || 100;
    const ratio = block.hp / maxHp;
    if (ratio < 0.5) {
      ctx.strokeStyle = '#E53935';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2);
      ctx.lineTo(w / 2, h / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w / 2, -h / 2);
      ctx.lineTo(-w / 2, h / 2);
      ctx.stroke();
    }
    if (ratio < 0.25) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }
  }

  ctx.restore();
}

function drawExplosion(x, y, radius) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, 'rgba(255,255,200,0.8)');
  grad.addColorStop(0.3, 'rgba(255,150,50,0.6)');
  grad.addColorStop(0.6, 'rgba(255,80,0,0.3)');
  grad.addColorStop(1, 'rgba(255,80,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function worldToScreen(wx, wy) {
  return {
    x: wx - cameraX + GAME_W / 2,
    y: wy - cameraY + GAME_H / 2
  };
}

function screenToWorld(sx, sy) {
  return {
    x: sx + cameraX - GAME_W / 2,
    y: sy + cameraY - GAME_H / 2
  };
}

function getCamera() {
  return { x: cameraX, y: cameraY };
}

function useScreenSpace() {
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

export {
  init, resize, beginFrame, endFrame, useScreenSpace,
  drawBackground, drawSlingshot, drawRubberBand, drawTrajectory,
  drawBird, drawPig, drawBlock, drawExplosion,
  setCamera, updateCamera, worldToScreen, screenToWorld, getCamera,
  GAME_W, GAME_H, scale, canvas, ctx
};
