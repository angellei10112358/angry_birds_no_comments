const { Bodies, Body } = Matter;

const BIRD_RADIUS = 14;
const BIRD_COLORS = {
  red: { body: '#e74c3c', stroke: '#c0392b', eye: '#fff', pupil: '#222', beak: '#f39c12' },
  yellow: { body: '#f1c40f', stroke: '#d4a017', eye: '#fff', pupil: '#222', beak: '#e67e22' },
  blue: { body: '#5dade2', stroke: '#2e86c1', eye: '#fff', pupil: '#222', beak: '#f39c12' },
  black: { body: '#566573', stroke: '#2c3e50', eye: '#fff', pupil: '#222', beak: '#e67e22' },
  white: { body: '#f0f0f0', stroke: '#bdc3c7', eye: '#222', pupil: '#fff', beak: '#e67e22' }
};

const ABILITY_DAMAGE = {
  red: 1,
  yellow: 2.5,
  blue: 1.2,
  black: 3,
  white: 1.5
};

export function createBird(type) {
  const colors = BIRD_COLORS[type] || BIRD_COLORS.red;
  const body = Bodies.circle(0, 0, BIRD_RADIUS, {
    restitution: 0.3,
    friction: 0.5,
    density: 0.003,
    label: 'bird'
  });

  let state = 'waiting';
  let abilityUsed = false;
  let settledTimer = 0;
  let onSettle = null;
  let onAbility = null;

  body.gameData = { type: 'bird', birdType: type, damageMult: ABILITY_DAMAGE[type] };

  function setState(newState) {
    state = newState;
    if (newState === 'flying') {
      settledTimer = 0;
    }
  }

  function getState() {
    return state;
  }

  function isAbilityAvailable() {
    return state === 'flying' && !abilityUsed;
  }

  function activateAbility(engine) {
    if (!isAbilityAvailable()) return;
    abilityUsed = true;

    switch (type) {
      case 'yellow':
        Body.setVelocity(body, {
          x: body.velocity.x * 2.5,
          y: body.velocity.y * 1.2
        });
        break;

      case 'blue': {
        const pos = body.position;
        const vel = body.velocity;
        const clones = [];
        for (let angle = -0.3; angle <= 0.3; angle += 0.3) {
          const clone = Bodies.circle(pos.x, pos.y, BIRD_RADIUS * 0.8, {
            restitution: 0.3,
            friction: 0.5,
            density: 0.002,
            label: 'bird'
          });
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          Body.setVelocity(clone, {
            x: vel.x * cos - vel.y * sin,
            y: vel.x * sin + vel.y * cos
          });
          clone.gameData = { type: 'bird', birdType: 'blue', damageMult: 0.8 };
          clone.renderColor = colors.body;
          clones.push(clone);
        }
        if (onAbility) onAbility(clones);
        break;
      }

      case 'black': {
        const pos = body.position;
        const force = 0.03;
        const bodies = engine.world.bodies;
        for (const b of bodies) {
          if (b.label === 'ground' || b.label === 'wall' || b.label === 'ceiling') continue;
          if (b === body) continue;
          const dx = b.position.x - pos.x;
          const dy = b.position.y - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200 && dist > 0) {
            const power = (1 - dist / 200) * force;
            Body.applyForce(b, b.position, {
              x: (dx / dist) * power,
              y: (dy / dist) * power
            });
          }
        }
        if (onAbility) onAbility(null);
        break;
      }

      case 'white': {
        Body.setVelocity(body, {
          x: body.velocity.x,
          y: body.velocity.y - 5
        });
        if (onAbility) onAbility(null);
        break;
      }

      default:
        break;
    }

    if (onAbility && type !== 'blue' && type !== 'black' && type !== 'white') {
      onAbility(null);
    }
  }

  let totalFlightTime = 0;

  function update(dt) {
    if (state === 'flying') {
      totalFlightTime += dt;
      const speed = Math.sqrt(
        body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y
      );
      const settled = speed < 0.5;
      const stuck = totalFlightTime > 10000;
      if (settled || stuck || body.position.y > 620 || body.position.x > 2300 || body.position.x < -100) {
        settledTimer += dt;
        if (settledTimer > 800) {
          state = 'settled';
          if (onSettle) onSettle();
        }
      } else {
        settledTimer = 0;
      }
    }
  }

  function setOnSettle(cb) {
    onSettle = cb;
  }

  function setOnAbility(cb) {
    onAbility = cb;
  }

  function getType() {
    return type;
  }

  function draw(ctx) {
    if (state === 'waiting') return;
    const pos = body.position;
    const r = body.circleRadius || BIRD_RADIUS;

    ctx.save();

    const grad = ctx.createRadialGradient(pos.x - r * 0.3, pos.y - r * 0.3, 1, pos.x, pos.y, r);
    grad.addColorStop(0, lighten(colors.body, 30));
    grad.addColorStop(1, colors.body);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const eyeOff = r * 0.35;
    const eyeR = r * 0.22;
    ctx.fillStyle = colors.eye;
    ctx.beginPath();
    ctx.arc(pos.x - eyeOff, pos.y - r * 0.2, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pos.x + eyeOff, pos.y - r * 0.2, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.pupil;
    ctx.beginPath();
    ctx.arc(pos.x - eyeOff + 1.5, pos.y - r * 0.15, eyeR * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pos.x + eyeOff + 1.5, pos.y - r * 0.15, eyeR * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.beak;
    ctx.beginPath();
    ctx.moveTo(pos.x + r * 0.6, pos.y + r * 0.1);
    ctx.lineTo(pos.x + r * 0.9, pos.y + r * 0.2);
    ctx.lineTo(pos.x + r * 0.6, pos.y + r * 0.35);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(pos.x - r * 0.55, pos.y - r * 0.4, r * 0.15, 0.5, 2.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pos.x + r * 0.55, pos.y - r * 0.4, r * 0.15, 3.8, 5.8);
    ctx.stroke();

    ctx.restore();
  }

  return {
    body, getType, getState, setState,
    isAbilityAvailable, activateAbility,
    update, setOnSettle, setOnAbility, draw
  };
}

function lighten(hex, amt) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  let num = parseInt(c, 16);
  let r = Math.min(255, (num >> 16) + amt);
  let g = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  let b = Math.min(255, (num & 0x0000FF) + amt);
  return `rgb(${r},${g},${b})`;
}
