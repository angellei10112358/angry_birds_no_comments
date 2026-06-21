const { Engine, World, Bodies, Body, Events, Composite, Vector, Sleeping } = Matter;

let engine, world;
let ground, leftWall, rightWall, ceiling;
let collisionHandlers = [];
const WORLD_W = 3200;
const GROUND_Y = 560;
const WALL_THICKNESS = 50;

function init() {
  engine = Engine.create({
    gravity: { x: 0, y: 1.2 },
    enableSleeping: true
  });
  world = engine.world;

  ground = Bodies.rectangle(WORLD_W / 2, GROUND_Y + WALL_THICKNESS / 2, WORLD_W + 200, WALL_THICKNESS, { isStatic: true, label: 'ground' });
  leftWall = Bodies.rectangle(-WALL_THICKNESS / 2, 300, WALL_THICKNESS, 600, { isStatic: true, label: 'wall' });
  rightWall = Bodies.rectangle(WORLD_W + WALL_THICKNESS / 2, 300, WALL_THICKNESS, 600, { isStatic: true, label: 'wall' });
  ceiling = Bodies.rectangle(WORLD_W / 2, -WALL_THICKNESS / 2, WORLD_W + 200, WALL_THICKNESS, { isStatic: true, label: 'ceiling' });

  Composite.add(world, [ground, leftWall, rightWall, ceiling]);

  Events.on(engine, 'collisionStart', handleCollisions);

  engine.timing.timeScale = 1;
}

function handleCollisions(event) {
  const pairs = event.pairs;
  const processed = new Set();
  for (const pair of pairs) {
    const { bodyA, bodyB } = pair;
    const contact = pair.collision;
    const relativeVelocity = Vector.sub(bodyA.velocity, bodyB.velocity);
    const speed = Vector.magnitude(relativeVelocity);
    const impulse = speed * 2;
    const idA = bodyA.id, idB = bodyB.id;
    const key = idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
    if (processed.has(key)) continue;
    processed.add(key);
    collisionHandlers.forEach(fn => fn(bodyA, bodyB, impulse, contact));
  }
}

function onCollision(fn) {
  collisionHandlers.push(fn);
}

function step(dt) {
  Engine.update(engine, dt * 1000);
}

function addBody(body) {
  Composite.add(world, body);
}

function removeBody(body) {
  Composite.remove(world, body);
}

function clearWorld() {
  collisionHandlers = [];
  Composite.clear(world, false);
  World.clear(world, false);
  Engine.clear(engine);
  Sleeping.all(engine);
}

function getAllBodies() {
  return Composite.allBodies(world);
}

function destroy() {
  clearWorld();
  Events.off(engine, 'collisionStart', handleCollisions);
  engine = null;
  world = null;
}

export { init, step, addBody, removeBody, clearWorld, destroy, onCollision, getAllBodies, engine, world, WORLD_W, GROUND_Y };
