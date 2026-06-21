import * as physics from './engine/physics.js';
import * as renderer from './engine/renderer.js';
import * as input from './systems/input.js';
import * as audio from './systems/audio.js';
import * as score from './systems/score.js';
import * as hud from './ui/hud.js';
import { State, setState, onState, getState } from './systems/state.js';
import { spawnPig, removePig, damagePig } from './entities/Pig.js';
import { spawnBlock, removeBlock, damageBlock } from './entities/Block.js';
import { spawnBird, removeBird, useAbility } from './entities/Bird.js';
import * as slingshot from './entities/Slingshot.js';
import { getLevel, getLevelCount } from './levels/levels.js';

let worldBodies = [];
let pigs = [];
let blocks = [];
let birdQueue = [];
let currentLevelId = 1;
let currentBirdBody = null;
let launchedBirds = [];
let usedBirds = [];
let gameRunning = false;
let lastTime = 0;
let animFrameId = null;

let explosions = [];

let inUIState = false;

const FIXED_DT = 1 / 60;

function init() {
  renderer.init();
  audio.init();
  input.init(renderer.canvas);
  setupInputHandlers();
  setupStateHandlers();
  setupCollisionHandling();
  showMenu();
}

function setupStateHandlers() {
  onState(State.LEVEL_COMPLETE, () => {
    inUIState = true;
    const remaining = birdQueue.length + (slingshot.isBirdLoaded() && currentBirdBody ? 1 : 0);
    score.addRemainingBirdBonus(remaining);
    audio.playWin();
  });
  onState(State.GAME_OVER, () => {
    inUIState = true;
    audio.playLose();
  });
  onState(State.MENU, () => {
    inUIState = true;
  });
  onState(State.PLAYING, () => {
    inUIState = false;
  });
}

function showMenu() {
  setState(State.MENU);
  gameRunning = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  renderer.beginFrame();
  hud.showMenu(renderer.canvas, renderer.ctx, () => {
    startGame(1);
  });
  renderer.endFrame();
}

function startGame(levelId) {
  cleanupLevel();
  physics.init();
  currentLevelId = levelId;
  loadLevel(levelId);
  setState(State.PLAYING);
  gameRunning = true;
  lastTime = performance.now();
  if (animFrameId) cancelAnimationFrame(animFrameId);
  gameLoop(lastTime);
}

function cleanupLevel() {
  inUIState = false;
  explosions = [];
  launchedBirds = [];
  usedBirds = [];
  birdQueue = [];
  pigs = [];
  blocks = [];
  worldBodies = [];
  currentBirdBody = null;
  hud.clearButtons();
  physics.destroy();
  slingshot.setBird(null);
}

function loadLevel(levelId) {
  const level = getLevel(levelId);
  if (!level) return;

  score.reset(level.stars);
  birdQueue = [...level.birds];

  for (const p of level.pigs) {
    const pig = spawnPig(p.x, p.y, p.radius);
    pigs.push(pig);
  }

  for (const b of level.blocks) {
    const block = spawnBlock(b.type, b.x, b.y, b.w, b.h, b.angle);
    blocks.push(block);
  }

  spawnNextBird();
}

function spawnNextBird() {
  if (birdQueue.length === 0) return;
  const type = birdQueue.shift();
  const bird = spawnBird(type, slingshot.SLINGSHOT_X, slingshot.SLINGSHOT_Y);
  bird.isStatic = true;
  currentBirdBody = bird;
  slingshot.setBird(bird);

  renderer.setCamera(slingshot.SLINGSHOT_X, 300);
}

function setupInputHandlers() {
  input.on('down', (sx, sy) => {
    if (inUIState) {
      const action = hud.handleClick(sx, sy, renderer.canvas, renderer.ctx);
      if (action === 'start_game') {
        startGame(1);
      } else if (action === 'restart' || action === 'complete_restart' || action === 'gameover_restart') {
        startGame(currentLevelId);
      } else if (action === 'next_level') {
        const next = currentLevelId + 1;
        if (next <= getLevelCount()) {
          startGame(next);
        } else {
          showMenu();
        }
      } else if (action === 'menu') {
        showMenu();
      }
      return;
    }
    if (getState() !== State.PLAYING) return;
    if (!currentBirdBody || !slingshot.isBirdLoaded()) return;
    const wx = sx + renderer.getCamera().x - renderer.GAME_W / 2;
    const wy = sy + renderer.getCamera().y - renderer.GAME_H / 2;
    slingshot.handlePointerDown(wx, wy);
  });

  input.on('move', (sx, sy) => {
    if (inUIState) return;
    if (!slingshot.getDragState().isDragging) return;
    const wx = sx + renderer.getCamera().x - renderer.GAME_W / 2;
    const wy = sy + renderer.getCamera().y - renderer.GAME_H / 2;
    slingshot.handlePointerMove(wx, wy);
  });

  input.on('up', () => {
    if (inUIState) return;
    if (!slingshot.getDragState().isDragging) return;
    slingshot.handlePointerUp();
    if (currentBirdBody && currentBirdBody.isLaunched) {
      audio.playLaunch();
      launchedBirds.push(currentBirdBody);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && getState() === State.PLAYING) {
      if (currentBirdBody && currentBirdBody.isLaunched && !currentBirdBody.usedAbility) {
        useBirdAbility(currentBirdBody);
      }
    }
  });
}

function useBirdAbility(bird) {
  useAbility(bird, physics);
  if (bird.birdType === 'black') {
    explosions.push({ x: bird.position.x, y: bird.position.y, radius: 120, timer: 300 });
    audio.playExplosion();
  } else if (bird.birdType === 'blue') {
  } else if (bird.birdType === 'white') {
  }
}

function setupCollisionHandling() {
  physics.onCollision((bodyA, bodyB, impulse) => {
    if (impulse < 1) return;

    const bodies = [bodyA, bodyB];
    for (const b of bodies) {
      if (b.label === 'pig') {
        const wasAlive = pigs.includes(b);
        if (wasAlive && damagePig(b, impulse * 3)) {
          pigs = pigs.filter(p => p !== b);
          score.addPigKill();
          audio.playPigDeath();
          checkWinCondition();
        } else if (wasAlive) {
          audio.playHit();
        }
      } else if (b.label === 'block') {
        const wasAlive = blocks.includes(b);
        if (wasAlive && damageBlock(b, impulse * 2)) {
          blocks = blocks.filter(bl => bl !== b);
          score.addBlockBreak(b.blockType);
          audio.playBreak();
        } else if (wasAlive) {
          audio.playHit();
        }
      } else if (b.label === 'egg') {
        if (impulse > 3) {
          physics.removeBody(b);
          explosions.push({ x: b.position.x, y: b.position.y, radius: 80, timer: 200 });
          audio.playExplosion();
          const nearby = [];
          for (const p of pigs) {
            const dx = p.position.x - b.position.x;
            const dy = p.position.y - b.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) nearby.push(p);
          }
          for (const p of nearby) {
            if (pigs.includes(p)) {
              pigs = pigs.filter(pg => pg !== p);
              score.addPigKill();
              audio.playPigDeath();
              physics.removeBody(p);
            }
          }
          checkWinCondition();
          for (const bl of blocks) {
            const dx = bl.position.x - b.position.x;
            const dy = bl.position.y - b.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
              if (blocks.includes(bl)) {
                blocks = blocks.filter(bx => bx !== bl);
                score.addBlockBreak(bl.blockType);
                physics.removeBody(bl);
              }
            }
          }
        }
      }
    }

    if (bodyA.label === 'bird' && bodyA.isLaunched && !bodyA.usedAbility) {
      if (bodyA.birdType === 'white' || bodyA.birdType === 'black') {
      }
    }
    if (bodyB.label === 'bird' && bodyB.isLaunched && !bodyB.usedAbility) {
      if (bodyB.birdType === 'white' || bodyB.birdType === 'black') {
      }
    }
  });

  canvasClickForAbility();
}

function canvasClickForAbility() {
  renderer.canvas.addEventListener('click', (e) => {
    if (getState() !== State.PLAYING) return;
    if (currentBirdBody && currentBirdBody.isLaunched && !currentBirdBody.usedAbility) {
      useBirdAbility(currentBirdBody);
    }
  });
  renderer.canvas.addEventListener('touchend', (e) => {
    if (getState() !== State.PLAYING) return;
    if (currentBirdBody && currentBirdBody.isLaunched && !currentBirdBody.usedAbility) {
      useBirdAbility(currentBirdBody);
    }
  });
}

function checkWinCondition() {
  if (pigs.length === 0) {
    setState(State.LEVEL_COMPLETE);
  }
}

function checkLoseCondition() {
  if (birdQueue.length === 0 && !slingshot.isBirdLoaded() && launchedBirds.length > 0) {
    const allStopped = launchedBirds.every(b => {
      if (b.isDead) return true;
      const speed = Math.sqrt(b.velocity.x ** 2 + b.velocity.y ** 2);
      return speed < 0.3;
    });
    if (allStopped && pigs.length > 0) {
      setState(State.GAME_OVER);
    }
  }
}

function gameLoop(time) {
  if (!gameRunning) return;
  animFrameId = requestAnimationFrame(gameLoop);

  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  physics.step(FIXED_DT);

  updateLaunchedBird();

  checkLoseCondition();

  updateExplosions();

  renderer.updateCamera();
  renderer.beginFrame();
  renderer.drawBackground();
  renderer.drawSlingshot(slingshot.SLINGSHOT_X, slingshot.SLINGSHOT_Y);

  drawRubberBands();

  const traj = slingshot.getTrajectoryPoints();
  if (traj.length > 0) {
    renderer.drawTrajectory(traj);
  }

  for (const b of blocks) {
    if (b) renderer.drawBlock(b);
  }

  for (const p of pigs) {
    if (p) renderer.drawPig(p);
  }

  for (const b of launchedBirds) {
    if (b && !b.isDead && b !== currentBirdBody) renderer.drawBird(b);
  }

  if (currentBirdBody && !currentBirdBody.isDead) {
    renderer.drawBird(currentBirdBody);
  }

  for (const ex of explosions) {
    if (ex.timer > 0) renderer.drawExplosion(ex.x, ex.y, ex.radius);
  }

  renderer.endFrame();

  if (getState() === State.LEVEL_COMPLETE) {
    hud.showLevelComplete(
      renderer.ctx, score.getScore(), score.getStars(),
      () => startGame(currentLevelId),
      () => {
        const next = currentLevelId + 1;
        if (next <= getLevelCount()) {
          startGame(next);
        } else {
          showMenu();
        }
      }
    );
  } else if (getState() === State.GAME_OVER) {
    hud.showGameOver(renderer.ctx, () => startGame(currentLevelId));
  } else if (getState() === State.PLAYING) {
    hud.draw(renderer.ctx, score.getScore(), currentLevelId,
      birdQueue.length, birdQueue);
  }
}

function drawRubberBands() {
  const drag = slingshot.getDragState();
  if (drag.isDragging && drag.dragCurrent) {
    renderer.drawRubberBand(
      slingshot.SLINGSHOT_X - 10, slingshot.SLINGSHOT_Y - 20,
      drag.dragCurrent.x, drag.dragCurrent.y
    );
    renderer.drawRubberBand(
      slingshot.SLINGSHOT_X + 10, slingshot.SLINGSHOT_Y - 20,
      drag.dragCurrent.x, drag.dragCurrent.y
    );
  }
}

function updateLaunchedBird() {
  if (!currentBirdBody || !currentBirdBody.isLaunched || currentBirdBody.isDead) return;

  const pos = currentBirdBody.position;

  if (pos.x < -50 || pos.x > physics.WORLD_W + 50 || pos.y > physics.GROUND_Y + 100) {
    currentBirdBody.isDead = true;
    physics.removeBody(currentBirdBody);
    launchedBirds = launchedBirds.filter(b => b !== currentBirdBody);
    scheduleNextBird();
    return;
  }

  renderer.setCamera(pos.x, 300);

  const speed = Math.sqrt(
    currentBirdBody.velocity.x ** 2 + currentBirdBody.velocity.y ** 2
  );

  if (speed < 0.3 && pos.y > physics.GROUND_Y - 50) {
    setTimeout(() => {
      if (currentBirdBody && currentBirdBody.isLaunched && !currentBirdBody.isDead) {
        const spd = Math.sqrt(
          currentBirdBody.velocity.x ** 2 + currentBirdBody.velocity.y ** 2
        );
        if (spd < 0.3) {
          currentBirdBody.isDead = true;
          physics.removeBody(currentBirdBody);
          launchedBirds = launchedBirds.filter(b => b !== currentBirdBody);
          scheduleNextBird();
        }
      }
    }, 500);
  }
}

function scheduleNextBird() {
  if (birdQueue.length > 0 && pigs.length > 0) {
    setTimeout(() => {
      if (getState() === State.PLAYING) {
        spawnNextBird();
        renderer.setCamera(slingshot.SLINGSHOT_X, 300);
      }
    }, 800);
  }
}

function updateExplosions() {
  explosions = explosions.filter(ex => {
    ex.timer -= 16;
    return ex.timer > 0;
  });
}

init();
