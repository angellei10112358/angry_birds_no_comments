const SLING_X = 200;
const SLING_Y = 490;
const MAX_DRAG = 150;
const LAUNCH_FACTOR = 0.08;

export const SLINGSHOT_POS = { x: SLING_X, y: SLING_Y };

export function createSlingshot() {
  let bird = null;
  let isDragging = false;
  let dragStart = null;
  let dragCurrent = null;
  let onRelease = null;

  function loadBird(birdObj) {
    bird = birdObj;
    if (!bird) return;
    Matter.Body.setPosition(bird.body, { x: SLING_X, y: SLING_Y + 10 });
    Matter.Body.setVelocity(bird.body, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(bird.body, 0);
    bird.body.isSleeping = false;
  }

  function startDrag(worldX, worldY) {
    if (!bird) return false;
    const dx = worldX - SLING_X;
    const dy = worldY - SLING_Y;
    if (dx * dx + dy * dy < 2500) {
      isDragging = true;
      dragStart = { x: worldX, y: worldY };
      dragCurrent = { x: worldX, y: worldY };
      bird.setState('dragging');
      return true;
    }
    return false;
  }

  function moveDrag(worldX, worldY) {
    if (!isDragging || !bird) return;
    let dx = worldX - SLING_X;
    let dy = worldY - SLING_Y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > MAX_DRAG) {
      dx = (dx / dist) * MAX_DRAG;
      dy = (dy / dist) * MAX_DRAG;
    }
    dragCurrent = { x: SLING_X + dx, y: SLING_Y + dy };
    Matter.Body.setPosition(bird.body, { x: SLING_X + dx, y: SLING_Y + dy });
    Matter.Body.setVelocity(bird.body, { x: 0, y: 0 });
  }

  function endDrag() {
    if (!isDragging || !bird) return;
    isDragging = false;
    const releaseX = dragCurrent.x;
    const releaseY = dragCurrent.y;
    const dx = SLING_X - releaseX;
    const dy = SLING_Y - releaseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 10) {
      Matter.Body.setPosition(bird.body, { x: SLING_X, y: SLING_Y + 10 });
      return;
    }
    const vx = dx * LAUNCH_FACTOR;
    const vy = dy * LAUNCH_FACTOR;
    Matter.Body.setVelocity(bird.body, { x: vx, y: vy });
    bird.setState('flying');
    if (onRelease) onRelease(bird);
    bird = null;
  }

  function getTrajectoryPoints() {
    if (!isDragging || !dragCurrent) return [];
    const dx = SLING_X - dragCurrent.x;
    const dy = SLING_Y - dragCurrent.y;
    const vx = dx * LAUNCH_FACTOR;
    const vy = dy * LAUNCH_FACTOR;
    const points = [];
    const g = 1.8;
    for (let t = 0; t < 60; t += 2) {
      const px = SLING_X + vx * t;
      const py = SLING_Y + 10 + vy * t + 0.5 * g * t * t;
      points.push({ x: px, y: py });
      if (py > 540) break;
    }
    return points;
  }

  function draw(ctx) {
    const forkX = SLING_X;
    const forkY = SLING_Y - 30;
    const leftForkX = forkX - 15;
    const rightForkX = forkX + 15;

    ctx.save();

    ctx.strokeStyle = '#5C3A1E';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(forkX - 8, forkY + 90);
    ctx.quadraticCurveTo(forkX - 22, forkY + 40, leftForkX, forkY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(forkX + 8, forkY + 90);
    ctx.quadraticCurveTo(forkX + 22, forkY + 40, rightForkX, forkY);
    ctx.stroke();

    ctx.strokeStyle = '#3a2210';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(leftForkX, forkY);
    ctx.lineTo(rightForkX, forkY + 20);
    ctx.stroke();

    const baseX = forkX;
    const baseY = forkY + 100;
    ctx.strokeStyle = '#5C3A1E';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(baseX - 5, baseY);
    ctx.lineTo(baseX + 5, baseY);
    ctx.stroke();

    if (isDragging && bird) {
      const bx = bird.body.position.x;
      const by = bird.body.position.y;

      ctx.strokeStyle = '#3a2210';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(leftForkX, forkY);
      ctx.lineTo(bx, by);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rightForkX, forkY);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }

    if (!isDragging && bird) {
      ctx.strokeStyle = '#3a2210';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(leftForkX, forkY);
      ctx.lineTo(forkX, forkY + 10);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rightForkX, forkY);
      ctx.lineTo(forkX, forkY + 10);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawTrajectoryPreview(ctx, trajPoints) {
    if (!isDragging || trajPoints.length === 0) return;
    ctx.save();
    for (let i = 0; i < trajPoints.length; i++) {
      const alpha = 1 - (i / trajPoints.length) * 0.75;
      const r = 3.5 - (i / trajPoints.length) * 2.5;
      ctx.beginPath();
      ctx.arc(trajPoints[i].x, trajPoints[i].y, Math.max(1.5, r), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }
    ctx.restore();
  }

  function isBirdLoaded() {
    return bird !== null;
  }

  function getBird() {
    return bird;
  }

  function getDragState() {
    return { isDragging, dragCurrent };
  }

  function setReleaseCallback(cb) {
    onRelease = cb;
  }

  return {
    loadBird, startDrag, moveDrag, endDrag,
    getTrajectoryPoints, draw, drawTrajectoryPreview,
    isBirdLoaded, getBird, getDragState, setReleaseCallback
  };
}
