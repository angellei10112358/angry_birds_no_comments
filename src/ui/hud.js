export function createHUD(renderer) {
  const ctx = renderer.ctx;
  let score = 0;
  let levelName = '';
  let levelId = 1;
  let birdQueue = [];
  let onPause = null;
  let onRestart = null;
  let onNextLevel = null;
  let onMenu = null;
  let stars = 0;
  let totalScore = 0;
  let animStars = 0;
  let animTimer = 0;
  let showResult = false;
  let resultType = '';

  function update(gameState) {
    score = gameState.score;
    levelName = gameState.levelName;
    levelId = gameState.levelId;
    birdQueue = gameState.birdQueue || [];
  }

  function showLevelComplete(starsCount, finalScore) {
    showResult = true;
    resultType = 'win';
    stars = starsCount;
    totalScore = finalScore;
    animStars = 0;
    animTimer = 0;
  }

  function showGameOver(finalScore) {
    showResult = true;
    resultType = 'lose';
    stars = 0;
    totalScore = finalScore;
    animStars = 0;
    animTimer = 0;
  }

  function hideResult() {
    showResult = false;
  }

  function isResultVisible() {
    return showResult;
  }

  function updateResult(dt) {
    if (!showResult) return;
    animTimer += dt;
    if (animTimer > 500 && animStars < stars) {
      animStars++;
      animTimer = 0;
    }
  }

  function draw() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scale = renderer.getScale();

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (showResult) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, h);

      const boxW = 400 * scale;
      const boxH = resultType === 'win' ? 320 * scale : 240 * scale;
      const bx = (w - boxW) / 2;
      const by = (h - boxH) / 2;

      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      roundRect(ctx, bx, by, boxW, boxH, 16 * scale);
      ctx.fill();

      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      roundRect(ctx, bx, by, boxW, boxH, 16 * scale);
      ctx.stroke();

      const titleText = resultType === 'win' ? 'Level Complete!' : 'Game Over';
      ctx.font = `bold ${28 * scale}px Arial, sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(titleText, w / 2, by + 40 * scale);

      if (resultType === 'win') {
        for (let i = 0; i < 3; i++) {
          const sx = w / 2 + (i - 1) * 60 * scale;
          const sy = by + 90 * scale;
          if (i < animStars) {
            ctx.font = `${36 * scale}px Arial, sans-serif`;
            ctx.fillStyle = '#f1c40f';
            ctx.fillText('★', sx, sy);
          } else {
            ctx.font = `${36 * scale}px Arial, sans-serif`;
            ctx.fillStyle = '#555';
            ctx.fillText('☆', sx, sy);
          }
        }
      } else {
        ctx.font = `${20 * scale}px Arial, sans-serif`;
        ctx.fillStyle = '#e74c3c';
        ctx.textAlign = 'center';
        ctx.fillText('Better luck next time!', w / 2, by + 90 * scale);
      }

      ctx.font = `bold ${22 * scale}px Arial, sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(`Score: ${totalScore}`, w / 2, by + 140 * scale);

      const btnY = by + boxH - 60 * scale;
      const btnW = 140 * scale;
      const btnH = 44 * scale;

      if (resultType === 'win') {
        const nextBtnX = w / 2 + 10 * scale;
        drawButton(ctx, nextBtnX - btnW / 2, btnY, btnW, btnH, '#27ae60', 'Next Level', scale);
      }

      const replayBtnX = resultType === 'win' ? w / 2 - 160 * scale : w / 2 - btnW / 2;
      drawButton(ctx, replayBtnX, btnY, btnW, btnH, '#f39c12', 'Replay', scale);

      if (resultType === 'win') {
        const menuBtnX = w / 2 + 170 * scale;
        drawButton(ctx, menuBtnX - btnW / 2, btnY, btnW, btnH, '#e74c3c', 'Menu', scale);
      }

      ctx.restore();

      if (resultType !== 'win') {
        const rpx = w / 2 - btnW / 2;
        if (isClicked(rpx, btnY, btnW, btnH)) {
          hideResult();
          if (onRestart) onRestart();
        }
      }

      return;
    }

    ctx.font = `bold ${18 * scale}px Arial, sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Level ${levelId}: ${levelName}`, 20, 20);

    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${score}`, w - 20, 20);

    const pauseSize = 36 * scale;
    const pauseX = w - pauseSize - 16;
    const pauseY = 6;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = `${pauseSize}px Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('❚❚', pauseX, pauseY);

    if (birdQueue.length > 0) {
      const startX = 20;
      const byY = 50;
      ctx.font = `${14 * scale}px Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.textAlign = 'left';
      ctx.fillText('Birds:', startX, byY);

      for (let i = 0; i < birdQueue.length; i++) {
        const bx = startX + 60 + i * 30 * scale;
        const by2 = byY + 6;
        const br = 10 * scale;
        const colors = {
          red: '#e74c3c', yellow: '#f1c40f', blue: '#5dade2',
          black: '#566573', white: '#f0f0f0'
        };
        ctx.beginPath();
        ctx.arc(bx, by2 + br, br, 0, Math.PI * 2);
        ctx.fillStyle = colors[birdQueue[i]] || '#888';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  let clickHandled = false;
  let clickX = 0;
  let clickY = 0;

  function isClicked(rx, ry, rw, rh) {
    return clickX >= rx && clickX <= rx + rw && clickY >= ry && clickY <= ry + rh;
  }

  function handleClick(x, y) {
    clickX = x;
    clickY = y;
    clickHandled = true;

    if (showResult) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scale = renderer.getScale();
      const boxW = 400 * scale;
      const boxH = resultType === 'win' ? 320 * scale : 240 * scale;
      const bx = (w - boxW) / 2;
      const by = (h - boxH) / 2;
      const btnW = 140 * scale;
      const btnH = 44 * scale;
      const btnY = by + boxH - 60 * scale;

      if (resultType === 'win') {
        const replayBtnX = w / 2 - 160 * scale;
        const nextBtnX = w / 2 + 10 * scale;
        const menuBtnX = w / 2 + 170 * scale;
        if (isClicked(replayBtnX, btnY, btnW, btnH)) {
          hideResult();
          if (onRestart) onRestart();
          return;
        }
        if (isClicked(nextBtnX, btnY, btnW, btnH)) {
          hideResult();
          if (onNextLevel) onNextLevel();
          return;
        }
        if (isClicked(menuBtnX - btnW / 2, btnY, btnW, btnH)) {
          hideResult();
          if (onMenu) onMenu();
          return;
        }
      } else {
        const replayBtnX = w / 2 - btnW / 2;
        if (isClicked(replayBtnX, btnY, btnW, btnH)) {
          hideResult();
          if (onRestart) onRestart();
          return;
        }
      }
      return;
    }

    const scale = renderer.getScale();
    const pauseSize = 36 * scale;
    const pauseX = window.innerWidth - pauseSize - 16;
    const pauseY = 6;

    if (x >= pauseX - pauseSize && x <= pauseX + 10 && y >= pauseY && y <= pauseY + pauseSize + 10) {
      if (onPause) onPause();
    }
  }

  function setCallbacks(callbacks) {
    if (callbacks.onPause) onPause = callbacks.onPause;
    if (callbacks.onRestart) onRestart = callbacks.onRestart;
    if (callbacks.onNextLevel) onNextLevel = callbacks.onNextLevel;
    if (callbacks.onMenu) onMenu = callbacks.onMenu;
  }

  return {
    update, draw, updateResult,
    showLevelComplete, showGameOver, hideResult, isResultVisible,
    handleClick, setCallbacks
  };
}

function drawButton(ctx, x, y, w, h, color, text, scale) {
  ctx.fillStyle = color;
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, 8 * scale);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${16 * scale}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}
