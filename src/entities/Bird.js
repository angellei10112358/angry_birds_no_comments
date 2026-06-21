import { addBody, removeBody } from '../engine/physics.js';

const { Bodies, Body, Vector } = Matter;

const BIRD_TYPES = {
  red: { radius: 14, label: 'bird', color: '#E53935' },
  yellow: { radius: 13, label: 'bird', color: '#FDD835' },
  blue: { radius: 10, label: 'bird', color: '#1E88E5' },
  black: { radius: 16, label: 'bird', color: '#333' },
  white: { radius: 15, label: 'bird', color: '#ECEFF1' }
};

let birdId = 0;

function createBird(type, x, y) {
  const config = BIRD_TYPES[type] || BIRD_TYPES.red;
  const body = Bodies.circle(x, y, config.radius, {
    restitution: 0.3,
    friction: 0.5,
    density: 0.002,
    label: 'bird',
    birdType: type,
    birdId: ++birdId,
    usedAbility: false,
    isLaunched: false,
    isDead: false
  });
  body.circleRadius = config.radius;
  return body;
}

function spawnBird(type, x, y) {
  const bird = createBird(type, x, y);
  addBody(bird);
  return bird;
}

function removeBird(bird) {
  bird.isDead = true;
  removeBody(bird);
}

function useAbility(bird, physics) {
  if (bird.usedAbility || !bird.isLaunched) return;
  bird.usedAbility = true;
  const vel = bird.velocity;
  const speed = Vector.magnitude(vel);

  switch (bird.birdType) {
    case 'yellow':
      Body.setVelocity(bird, {
        x: vel.x * 2.5,
        y: vel.y * 2.5
      });
      break;
    case 'blue':
      splitBlue(bird, physics);
      break;
    case 'black':
      explodeBlack(bird, physics);
      break;
    case 'white':
      dropEgg(bird, physics);
      break;
  }
}

function splitBlue(original, physics) {
  const pos = original.position;
  const vel = original.velocity;
  const spawnOffset = 15;
  const angles = [-0.3, 0, 0.3];
  const spawned = [];
  for (const angle of angles) {
    const b = createBird('blue', pos.x + Math.cos(angle) * spawnOffset, pos.y + Math.sin(angle) * spawnOffset);
    Body.setVelocity(b, {
      x: vel.x + Math.cos(angle) * 3,
      y: vel.y + Math.sin(angle) * 3
    });
    b.isLaunched = true;
    b.usedAbility = true;
    addBody(b);
    spawned.push(b);
  }
  original.isDead = true;
  removeBody(original);
  return spawned;
}

function explodeBlack(bird, physics) {
  const pos = bird.position;
  const bodies = physics.getAllBodies();
  const explosionRadius = 120;
  const force = 0.03;
  for (const b of bodies) {
    if (b.isStatic) continue;
    const dist = Vector.magnitude(Vector.sub(b.position, pos));
    if (dist < explosionRadius) {
      const dir = Vector.normalise(Vector.sub(b.position, pos));
      const strength = force * (1 - dist / explosionRadius);
      Body.applyForce(b, b.position, { x: dir.x * strength, y: dir.y * strength });
    }
  }
  bird.isDead = true;
  bird._exploded = true;
  removeBody(bird);
}

function dropEgg(bird, physics) {
  const pos = bird.position;
  const egg = Bodies.circle(pos.x, pos.y + 20, 6, {
    restitution: 0.2,
    friction: 0.5,
    density: 0.01,
    label: 'egg',
    isEgg: true
  });
  Body.setVelocity(egg, { x: bird.velocity.x * 0.3, y: 8 });
  addBody(egg);
  Body.setVelocity(bird, { x: bird.velocity.x * 0.6, y: -6 });
}

function getNextBirdInQueue(queue) {
  return queue.length > 0 ? queue[0] : null;
}

export { createBird, spawnBird, removeBird, useAbility, BIRD_TYPES, getNextBirdInQueue };
