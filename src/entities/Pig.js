import { addBody, removeBody } from '../engine/physics.js';

const { Bodies } = Matter;

let pigId = 0;

function createPig(x, y, radius) {
  const body = Bodies.circle(x, y, radius || 18, {
    restitution: 0.2,
    friction: 0.6,
    density: 0.001,
    label: 'pig',
    pigId: ++pigId,
    hp: 80,
    maxHp: 80
  });
  body.circleRadius = radius || 18;
  return body;
}

function spawnPig(x, y, radius) {
  const pig = createPig(x, y, radius);
  addBody(pig);
  return pig;
}

function removePig(pig) {
  removeBody(pig);
}

function damagePig(pig, amount) {
  pig.hp = (pig.hp || 80) - amount;
  if (pig.hp <= 0) {
    removePig(pig);
    return true;
  }
  return false;
}

export { createPig, spawnPig, removePig, damagePig };
