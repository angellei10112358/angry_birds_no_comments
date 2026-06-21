import { addBody, removeBody } from '../engine/physics.js';

const { Bodies } = Matter;

const BLOCK_PROPS = {
  wood: { density: 0.002, hp: 100, restitution: 0.1, friction: 0.6 },
  stone: { density: 0.004, hp: 200, restitution: 0.05, friction: 0.8 },
  ice: { density: 0.001, hp: 50, restitution: 0.2, friction: 0.3 }
};

let blockId = 0;

function createBlock(type, x, y, w, h, angle) {
  const props = BLOCK_PROPS[type] || BLOCK_PROPS.wood;
  const body = Bodies.rectangle(x, y, w, h, {
    density: props.density,
    restitution: props.restitution,
    friction: props.friction,
    angle: angle || 0,
    label: 'block',
    blockType: type,
    blockId: ++blockId,
    hp: props.hp,
    maxHp: props.hp
  });
  return body;
}

function spawnBlock(type, x, y, w, h, angle) {
  const block = createBlock(type, x, y, w, h, angle);
  addBody(block);
  return block;
}

function removeBlock(block) {
  removeBody(block);
}

function damageBlock(block, amount) {
  const props = BLOCK_PROPS[block.blockType] || BLOCK_PROPS.wood;
  block.hp = (block.hp || props.hp) - amount;
  if (block.hp <= 0) {
    removeBlock(block);
    return true;
  }
  return false;
}

export { createBlock, spawnBlock, removeBlock, damageBlock, BLOCK_PROPS };
