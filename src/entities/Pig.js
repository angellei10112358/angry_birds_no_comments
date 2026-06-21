const { Bodies } = Matter;

const PIG_HP = {
  small: 30,
  medium: 60,
  large: 100
};

export function createPig(x, y, radius) {
  const size = radius <= 14 ? 'small' : radius <= 18 ? 'medium' : 'large';
  const hp = PIG_HP[size];

  const body = Bodies.circle(x, y, radius, {
    restitution: 0.2,
    friction: 0.6,
    density: 0.002,
    label: 'pig'
  });

  let alive = true;
  let health = hp;
  let flashTimer = 0;

  body.gameData = { type: 'pig', health, maxHealth: hp, size };

  function takeDamage(amount) {
    if (!alive) return;
    health -= amount;
    flashTimer = 100;
    body.gameData.health = health;
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
    const pos = body.position;
    const r = body.circleRadius;
    const flash = flashTimer > 0 && Math.floor(flashTimer / 50) % 2 === 0;

    ctx.save();

    const grad = ctx.createRadialGradient(pos.x - r * 0.3, pos.y - r * 0.3, 1, pos.x, pos.y, r);
    if (flash) {
      grad.addColorStop(0, '#ff8888');
      grad.addColorStop(1, '#cc3333');
    } else {
      grad.addColorStop(0, '#8fdf5e');
      grad.addColorStop(1, '#4a8f2a');
    }
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#3a6f1a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const eyeOff = r * 0.35;
    const eyeR = r * 0.18;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(pos.x - eyeOff, pos.y - r * 0.15, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pos.x + eyeOff, pos.y - r * 0.15, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(pos.x - eyeOff + 1, pos.y - r * 0.12, eyeR * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pos.x + eyeOff + 1, pos.y - r * 0.12, eyeR * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3a6f1a';
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y + r * 0.25, r * 0.25, r * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3a6f1a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pos.x - r * 0.55, pos.y - r * 0.1, r * 0.15, 0.5, 2.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pos.x + r * 0.55, pos.y - r * 0.1, r * 0.15, 3.8, 5.8);
    ctx.stroke();

    ctx.restore();
  }

  return { body, takeDamage, isAlive, getHealth, update, draw, getSize: () => size };
}
