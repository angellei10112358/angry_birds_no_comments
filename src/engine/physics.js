const { Engine, World, Bodies, Body, Events, Composite, Vector } = Matter;

export function createPhysics() {
  const engine = Engine.create({
    gravity: { x: 0, y: 1.8 },
    timing: { timeScale: 1 }
  });
  const world = engine.world;

  const ground = Bodies.rectangle(1200, 580, 3000, 80, {
    isStatic: true, friction: 0.8, label: 'ground'
  });
  const leftWall = Bodies.rectangle(-20, 320, 40, 640, {
    isStatic: true, label: 'wall'
  });
  const rightWall = Bodies.rectangle(2420, 320, 40, 640, {
    isStatic: true, label: 'wall'
  });
  const ceiling = Bodies.rectangle(1200, -20, 3000, 40, {
    isStatic: true, label: 'ceiling'
  });
  World.add(world, [ground, leftWall, rightWall, ceiling]);

  let collisionHandler = null;

  Events.on(engine, 'collisionStart', (event) => {
    if (collisionHandler) {
      for (const pair of event.pairs) {
        collisionHandler(pair.bodyA, pair.bodyB);
      }
    }
  });

  function setCollisionHandler(handler) {
    collisionHandler = handler;
  }

  function step(delta) {
    Engine.update(engine, delta);
  }

  function clear() {
    Composite.clear(world, false);
    World.add(world, [ground, leftWall, rightWall, ceiling]);
    collisionHandler = null;
  }

  function addBody(body) {
    World.add(world, body);
  }

  function removeBody(body) {
    Composite.remove(world, body);
  }

  function getBodies() {
    return Composite.allBodies(world);
  }

  return { engine, world, step, clear, addBody, removeBody, getBodies, setCollisionHandler };
}
