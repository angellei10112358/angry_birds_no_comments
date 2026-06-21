const { Bodies } = Matter;

const MATERIALS = {
  wood: { hp: 100, density: 0.004, color: '#b5651d', stroke: '#8b4513', breakColor: '#8b5e3c' },
  ice: { hp: 50, density: 0.002, color: '#b0e0e6', stroke: '#87ceeb', breakColor: '#d4f1f9' },
  stone: { hp: 200, density: 0.008, color: '#808080', stroke: '#606060', breakColor: '#a0a0a0' }
};

export function createBlock(type, x, y, w, h, angle) {
  const mat = MATERIALS[type] || MATERIALS.wood;
  const body = Bodies.rectangle(x, y, w, h, {
    density: mat.density,
    friction: 0.6,
    restitution: 0.1,
    angle: angle || 0,
    label: 'block'
  });

  let health = mat.hp;
  let alive = true;
  let damaged = false;
  let flashTimer = 0;

  body.gameData = { type: 'block', blockType: type, health, maxHealth: mat.hp };

  function takeDamage(amount) {
    if (!alive) return;
    health -= amount;
    flashTimer = 100;
    body.gameData.health = health;
    if (health < mat.hp * 0.5) {
      damaged = true;
    }
    if (health <= 0) {
      alive = false;
    }
  }

  function isAlive() {
    return alive;
  }

  function getHealth() {
    return health;
  }

  function update(dt) {
    if (flashTimer > 0) {
      flashTimer -= dt;
    }
  }

  function draw(ctx) {
    if (!alive) return;
    const verts = body.vertices;
    const flash = flashTimer > 0 && Math.floor(flashTimer / 50) % 2 === 0;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < verts.length; i++) {
      ctx.lineTo(verts[i].x, verts[i].y);
    }
    ctx.closePath();

    if (flash) {
      ctx.fillStyle = '#fff';
    } else if (damaged) {
      ctx.fillStyle = mat.breakColor;
    } else {
      ctx.fillStyle = mat.color;
    }
    ctx.fill();
    ctx.strokeStyle = mat.stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (damaged && !flash) {
      const cx = (verts[0].x + verts[2].x) / 2;
      const cy = (verts[0].y + verts[2].y) / 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - 4);
      ctx.lineTo(cx + 4, cy + 4);
      ctx.moveTo(cx + 4, cy - 4);
      ctx.lineTo(cx - 4, cy + 4);
      ctx.stroke();
    }

    ctx.restore();
  }

  return { body, type, takeDamage, isAlive, getHealth, update, draw };
}
