import * as physics from './engine/physics.js';
import * as renderer from './engine/renderer.js';
import * as input from './systems/input.js';
import * as audio from './systems/audio.js';
import * as score from './systems/score.js';
import * as hud from './ui/hud.js';
import { State, setState, onState, getState } from './systems/state.js';
import { spawnPig, damagePig } from './entities/Pig.js';
import { spawnBlock, damageBlock } from './entities/Block.js';
import { spawnBird, useAbility } from './entities/Bird.js';
import * as slingshot from './entities/Slingshot.js';
import { getLevel, getLevelCount } from './levels/levels.js';

const { Body } = Matter;

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
let lastLaunchTime = 0;

const FIXED_DT = 1 / 60;

function init() {
  renderer.init();
  audio.init();
  input.init(renderer.canvas, renderer.GAME_W, renderer.GAME_H);
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
  renderer.useScreenSpace();
  hud.showMenu(renderer.ctx, () => {
    startGame(1);
  });
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
  Body.setStatic(bird, true);
  currentBirdBody = bird;
  slingshot.setBird(bird);

  renderer.setCamera(slingshot.SLINGSHOT_X, 300);
}

function setupInputHandlers() {
  input.on('down', (sx, sy) => {
    if (inUIState) {
      audio.resume();
      const action = hud.handleClick(sx, sy);
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
      lastLaunchTime = performance.now();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && getState() === State.PLAYING) {
      if (currentBirdBody && currentBirdBody.isLaunched && !currentBirdBody.usedAbility && !slingshot.isBirdLoaded()) {
        if (performance.now() - lastLaunchTime < 300) return;
        useBirdAbility(currentBirdBody);
      }
    }
  });
}

function useBirdAbility(bird) {
  const birdPos = { x: bird.position.x, y: bird.position.y };
  const birdType = bird.birdType;
  const result = useAbility(bird, physics);
  if (birdType === 'black') {
    explosions.push({ x: birdPos.x, y: birdPos.y, radius: 120, timer: 300 });
    audio.playExplosion();
    blastNearby(birdPos.x, birdPos.y, 120);
  } else if (birdType === 'blue') {
    if (result && result.length) {
      for (const b of result) launchedBirds.push(b);
    }
    currentBirdBody = null;
  }
}

function blastNearby(x, y, radius) {
  for (const p of [...pigs]) {
    const dx = p.position.x - x;
    const dy = p.position.y - y;
    if (Math.sqrt(dx * dx + dy * dy) < radius) {
      physics.removeBody(p);
      pigs = pigs.filter(pg => pg !== p);
      score.addPigKill();
      audio.playPigDeath();
    }
  }
  for (const b of [...blocks]) {
    const dx = b.position.x - x;
    const dy = b.position.y - y;
    if (Math.sqrt(dx * dx + dy * dy) < radius) {
      physics.removeBody(b);
      blocks = blocks.filter(bl => bl !== b);
      score.addBlockBreak(b.blockType);
    }
  }
  checkWinCondition();
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
        physics.removeBody(b);
        audio.playExplosion();
        blastNearby(b.position.x, b.position.y, 80);
      }
    }
  });

  canvasClickForAbility();
}

function canvasClickForAbility() {
  renderer.canvas.addEventListener('pointerdown', (e) => {
    if (getState() !== State.PLAYING) return;
    if (!currentBirdBody || !currentBirdBody.isLaunched || currentBirdBody.usedAbility) return;
    if (performance.now() - lastLaunchTime < 300) return;
    if (slingshot.isBirdLoaded()) return;
    useBirdAbility(currentBirdBody);
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
