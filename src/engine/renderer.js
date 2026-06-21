const LOGICAL_W = 960;
const LOGICAL_H = 640;

class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeTime = 0;
  }

  follow(x, y) {
    this.targetX = x - LOGICAL_W * 0.35;
    this.targetY = y - LOGICAL_H * 0.5;
  }

  snapTo(x, y) {
    this.x = x - LOGICAL_W * 0.35;
    this.y = y - LOGICAL_H * 0.5;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  shake(duration) {
    this.shakeTime = duration || 200;
  }

  update(dt) {
    this.x += (this.targetX - this.x) * Math.min(1, dt * 0.003);
    this.y += (this.targetY - this.y) * Math.min(1, dt * 0.003);
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const intensity = this.shakeTime > 0 ? Math.min(1, this.shakeTime / 50) * 6 : 0;
      this.shakeX = (Math.random() - 0.5) * intensity * 2;
      this.shakeY = (Math.random() - 0.5) * intensity * 2;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  constrain(minX, maxX) {
    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(-50, Math.min(50, this.y));
    this.targetX = Math.max(minX, Math.min(maxX, this.targetX));
  }

  apply(ctx) {
    ctx.save();
    ctx.translate(Math.round(this.shakeX), Math.round(this.shakeY));
    ctx.translate(-Math.round(this.x), -Math.round(this.y));
  }

  restore(ctx) {
    ctx.restore();
  }

  screenToWorld(sx, sy, canvas, scale) {
    const offX = (canvas.width / scale - LOGICAL_W) / 2;
    const offY = (canvas.height / scale - LOGICAL_H) / 2;
    return {
      x: (sx - offX) + this.x,
      y: (sy - offY) + this.y
    };
  }

  worldToScreen(wx, wy, scale) {
    return {
      x: (wx - this.x) * scale,
      y: (wy - this.y) * scale
    };
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const camera = new Camera();

  function resize() {
    const scaleX = window.innerWidth / LOGICAL_W;
    const scaleY = window.innerHeight / LOGICAL_H;
    const scale = Math.min(scaleX, scaleY);
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(devicePixelRatio, devicePixelRatio);
    return scale;
  }

  function clear() {
    ctx.fillStyle = '#4dc9f6';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  }

  function drawBackground() {
    camera.apply(ctx);
    ctx.fillStyle = '#7ec850';
    ctx.fillRect(0, 540, 2400, 100);

    const grad = ctx.createLinearGradient(0, 0, 0, 540);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(1, '#4dc9f6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2400, 540);

    for (let i = 0; i < 24; i += 1) {
      const cx = i * 100 + 20;
      ctx.fillStyle = '#6ab840';
      ctx.beginPath();
      ctx.ellipse(cx, 540, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    camera.restore(ctx);
  }

  function drawBody(body, color, strokeColor) {
    const verts = body.vertices;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < verts.length; i++) {
      ctx.lineTo(verts[i].x, verts[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = color || '#888';
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCircle(x, y, radius, color, strokeColor, lineWidth) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth || 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLine(x1, y1, x2, y2, color, width) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawTrajectory(points) {
    ctx.save();
    for (let i = 0; i < points.length; i++) {
      const alpha = 1 - (i / points.length) * 0.7;
      const radius = 3 - (i / points.length) * 2;
      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, Math.max(1, radius), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawText(text, x, y, color, size) {
    ctx.save();
    ctx.font = `bold ${size || 16}px Arial, sans-serif`;
    ctx.fillStyle = color || '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function getScale() {
    const scaleX = window.innerWidth / LOGICAL_W;
    const scaleY = window.innerHeight / LOGICAL_H;
    return Math.min(scaleX, scaleY);
  }

  return {
    ctx, camera, LOGICAL_W, LOGICAL_H,
    resize, clear, drawBackground,
    drawBody, drawCircle, drawLine,
    drawTrajectory, drawText, getScale
  };
}
