import { GAME_W, GAME_H } from '../engine/renderer.js';

const btnStyle = {
  font: 'bold 14px Arial',
  fill: '#fff',
  bg: 'rgba(0,0,0,0.5)',
  radius: 5,
  padding: 8
};

let buttons = [];
let buttonClickHandler = null;

function draw(ctx, score, currentLevel, birdsRemaining, birdQueue) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, GAME_W, 45);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Level ${currentLevel}`, 15, 22);

  ctx.textAlign = 'center';
  ctx.fillText(`Score: ${score}`, GAME_W / 2, 22);

  drawBirdQueue(ctx, birdQueue);

  buttons = [];
  const btnW = 60, btnH = 28;
  const btnY = 8;

  drawButton(ctx, 'Restart', GAME_W - 170, btnY, btnW, btnH, 'restart');
  drawButton(ctx, 'Menu', GAME_W - 100, btnY, btnW, btnH, 'menu');

  ctx.restore();
}

function drawBirdQueue(ctx, queue) {
  const startX = GAME_W / 2 + 80;
  const colors = { red: '#E53935', yellow: '#FDD835', blue: '#1E88E5', black: '#333', white: '#ECEFF1' };
  for (let i = 0; i < Math.min(queue.length, 7); i++) {
    const x = startX + i * 25;
    const color = colors[queue[i]] || '#E53935';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, 22, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawButton(ctx, text, x, y, w, h, action) {
  ctx.fillStyle = btnStyle.bg;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, btnStyle.radius);
  ctx.fill();
  ctx.fillStyle = btnStyle.fill;
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);
  buttons.push({ x, y, w, h, action });
}

function showLevelComplete(ctx, score, stars, onRestart, onNext) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  const cx = GAME_W / 2, cy = GAME_H / 2;

  ctx.fillStyle = '#4CAF50';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Level Complete!', cx, cy - 80);

  ctx.fillStyle = '#FFD700';
  for (let i = 0; i < 3; i++) {
    ctx.font = `${i < stars ? 'bold 40px' : 'normal 32px'} Arial`;
    ctx.fillStyle = i < stars ? '#FFD700' : '#555';
    ctx.fillText('★', cx - 50 + i * 50, cy - 20);
  }

  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.fillText(`Score: ${score}`, cx, cy + 30);

  const btnW = 120, btnH = 40;
  const btnY = cy + 70;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.roundRect(cx - 130, btnY, btnW, btnH, 5);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Restart', cx - 70, btnY + btnH / 2);

  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.roundRect(cx + 10, btnY, btnW, btnH, 5);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Next Level', cx + 70, btnY + btnH / 2);

  buttons.push({ x: cx - 130, y: btnY, w: btnW, h: btnH, action: 'complete_restart' });
  buttons.push({ x: cx + 10, y: btnY, w: btnW, h: btnH, action: 'next_level' });

  ctx.restore();
}

function showGameOver(ctx, onRestart) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  const cx = GAME_W / 2, cy = GAME_H / 2;

  ctx.fillStyle = '#E53935';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Game Over', cx, cy - 40);

  const btnW = 140, btnH = 40;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.roundRect(cx - btnW / 2, cy + 20, btnW, btnH, 5);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Try Again', cx, cy + 40);

  buttons.push({ x: cx - btnW / 2, y: cy + 20, w: btnW, h: btnH, action: 'gameover_restart' });

  ctx.restore();
}

function showMenu(ctx, onStart) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  const cx = GAME_W / 2, cy = GAME_H / 2;

  ctx.fillStyle = '#E53935';
  ctx.font = 'bold 56px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Angry Birds', cx, cy - 80);

  ctx.fillStyle = '#fff';
  ctx.font = '18px Arial';
  ctx.fillText('A Canvas + Matter.js Tribute', cx, cy - 30);

  const btnW = 160, btnH = 50;
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.roundRect(cx - btnW / 2, cy + 20, btnW, btnH, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('Play', cx, cy + 45);

  buttons.push({ x: cx - btnW / 2, y: cy + 20, w: btnW, h: btnH, action: 'start_game' });

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.font = '12px Arial';
  ctx.fillText('Drag birds from the slingshot to aim and release to fire!', cx, cy + 110);

  ctx.restore();
}

function handleClick(mx, my, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const px = (mx - rect.left) * scaleX;
  const py = (my - rect.top) * scaleY;

  for (const btn of buttons) {
    if (px >= btn.x && px <= btn.x + btn.w && py >= btn.y && py <= btn.y + btn.h) {
      return btn.action;
    }
  }
  return null;
}

function clearButtons() {
  buttons = [];
}

export { draw, showLevelComplete, showGameOver, showMenu, handleClick, clearButtons };
