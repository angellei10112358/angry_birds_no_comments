import { createPhysics } from './engine/physics.js';
import { createRenderer } from './engine/renderer.js';
import { createInput } from './systems/input.js';
import { createAudio } from './systems/audio.js';
import { createScore } from './systems/score.js';
import { createState } from './systems/state.js';
import { createHUD } from './ui/hud.js';
import { createSlingshot, SLINGSHOT_POS } from './entities/Slingshot.js';
import { createBird } from './entities/Bird.js';
import { createPig } from './entities/Pig.js';
import { createBlock } from './entities/Block.js';
import { levels } from './levels/levels.js';

const canvas = document.getElementById('game');
const physics = createPhysics();
const renderer = createRenderer(canvas);
const input = createInput(canvas, renderer);
const audio = createAudio();
const score = createScore();
const state = createState();
const hud = createHUD(renderer);
const slingshot = createSlingshot();

const game = {
  pigs: [],
  blocks: [],
  activeBirds: [],
  birdQueue: [],
  currentBird: null,
  currentLevel: 0,
  settleTimer: 0,
  settling: false,
  birdFired: false
};

let scale = renderer.resize();
window.addEventListener('resize', () => {
  scale = renderer.resize();
});

let menuBlink = 0;

physics.setCollisionHandler((bodyA, bodyB) => {
  handleCollision(bodyA, bodyB);
});

function loadLevel(levelIndex) {
  physics.clear();
  game.pigs = [];
  game.blocks = [];
  game.activeBirds = [];
  game.currentBird = null;
  game.birdQueue = [];
  game.settleTimer = 0;
  game.settling = false;
  game.birdFired = false;

  const level = levels[levelIndex];
  game.currentLevel = levelIndex;
  game.birdQueue = [...level.birds];

  score.reset(level.stars);

  for (const bData of level.blocks) {
    const block = createBlock(bData.type, bData.x, bData.y, bData.w, bData.h, bData.angle);
    physics.addBody(block.body);
    game.blocks.push(block);
  }
  for (const pData of level.pigs) {
    const pig = createPig(pData.x, pData.y, pData.radius);
    physics.addBody(pig.body);
    game.pigs.push(pig);
  }
  loadNextBird();
}

function loadNextBird() {
  if (game.birdQueue.length === 0) {
    const alive = game.pigs.filter(p => p.isAlive());
    if (alive.length > 0) {
      score.remainingBirdBonus(0);
      state.set(state.STATES.GAME_OVER);
      audio.lose();
      hud.showGameOver(score.getScore());
    }
    return;
  }

  const birdType = game.birdQueue.shift();
  const bird = createBird(birdType);
  bird.setState('loaded');
  game.activeBirds.push(bird);
  game.currentBird = bird;
  game.birdFired = false;
  slingshot.loadBird(bird);

  bird.setOnSettle(() => {
    game.settling = true;
    game.settleTimer = 0;
  });

  bird.setOnAbility((clones) => {
    if (birdType === 'blue' && clones) {
      for (const clone of clones) {
        physics.addBody(clone);
        const cloneBird = {
          body: clone,
          getState: () => 'flying',
          setState: () => {},
          getType: () => 'blue_clone',
          isAbilityAvailable: () => false,
          activateAbility: () => {},
          update: () => {},
          setOnSettle: () => {},
          setOnAbility: () => {},
          draw: (ctx) => {
            const pos = clone.position;
            ctx.save();
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 11, 0, Math.PI * 2);
            ctx.fillStyle = '#5dade2';
            ctx.fill();
            ctx.strokeStyle = '#2e86c1';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
          }
        };
        cloneBird.alive = true;
        cloneBird.update = () => {
          if (clone.position.x > 2400 || clone.position.y > 650 || clone.position.x < -200) {
            cloneBird.alive = false;
            physics.removeBody(clone);
          }
        };
        game.activeBirds.push(cloneBird);
      }
    }
    if (birdType === 'white') {
      const pos = bird.body.position;
      const egg = Matter.Bodies.circle(pos.x, pos.y + 20, 6, {
        restitution: 0.2, friction: 0.5, density: 0.005, label: 'egg'
      });
      Matter.Body.setVelocity(egg, { x: 0, y: 4 });
      egg.gameData = { type: 'egg' };
      physics.addBody(egg);
      const eggObj = {
        body: egg,
        getState: () => 'flying',
        setState: () => {},
        getType: () => 'egg',
        isAbilityAvailable: () => false,
        activateAbility: () => {},
        alive: true,
        update: () => {
          if (egg.position.y > 600 || egg.position.x > 2400 || !game.pigs.some(p => p.isAlive())) {
            eggObj.alive = false;
            physics.removeBody(egg);
          }
        },
        setOnSettle: () => {},
        setOnAbility: () => {},
        draw: (ctx) => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(egg.position.x, egg.position.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#f5deb3';
          ctx.fill();
          ctx.strokeStyle = '#d2b48c';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        }
      };
      game.activeBirds.push(eggObj);
    }
  });

  hud.update({
    score: score.getScore(),
    levelName: levels[game.currentLevel].name,
    levelId: levels[game.currentLevel].id,
    birdQueue: game.birdQueue
  });
}

function handleCollision(bodyA, bodyB) {
  const vx = bodyA.velocity.x - bodyB.velocity.x;
  const vy = bodyA.velocity.y - bodyB.velocity.y;
  const speed = Math.sqrt(vx * vx + vy * vy);
  if (speed < 1.5) return;

  impactEntity(bodyA, bodyB, speed);
  impactEntity(bodyB, bodyA, speed);
}

function impactEntity(target, source, speed) {
  const d = target.gameData;
  if (!d) return;

  let damage = speed * 2;

  const sd = source.gameData;
  if (sd && sd.type === 'bird') {
    const bt = sd.birdType;
    if (d.type === 'block') {
      if (bt === 'yellow' && d.blockType === 'wood') damage *= 2.5;
      else if (bt === 'blue' && d.blockType === 'ice') damage *= 2.5;
      else if (bt === 'black' && d.blockType === 'stone') damage *= 3;
    }
  }

  if (d.type === 'pig') {
    const pig = game.pigs.find(p => p.body === target);
    if (pig && pig.isAlive()) {
      pig.takeDamage(damage);
      audio.hit();
      if (!pig.isAlive()) {
        score.addPigKill();
        audio.pigDie();
        physics.removeBody(target);
        renderer.camera.shake(120);
        checkWin();
      }
    }
  } else if (d.type === 'block') {
    const block = game.blocks.find(b => b.body === target);
    if (block && block.isAlive()) {
      block.takeDamage(damage);
      audio.hit();
      if (!block.isAlive()) {
        score.addBlockDestroy();
        audio.destroy();
        physics.removeBody(target);
        renderer.camera.shake(80);
      }
    }
  } else if (d.type === 'egg') {
    const dist = 100;
    const bodies = physics.getBodies();
    for (const b of bodies) {
      if (b === target || b.label === 'ground' || b.label === 'wall' || b.label === 'ceiling') continue;
      const dx = b.position.x - target.position.x;
      const dy = b.position.y - target.position.y;
      const d2 = Math.sqrt(dx * dx + dy * dy);
      if (d2 < dist && d2 > 0) {
        const force = (1 - d2 / dist) * 0.04;
        Matter.Body.applyForce(b, b.position, {
          x: (dx / d2) * force,
          y: (dy / d2) * force
        });
      }
    }
    renderer.camera.shake(200);
    physics.removeBody(target);
  }
}

function checkWin() {
  const alive = game.pigs.filter(p => p.isAlive());
  if (alive.length > 0) return;
  const birdsLeft = game.birdQueue.length;
  score.remainingBirdBonus(birdsLeft);
  state.set(state.STATES.LEVEL_COMPLETE);
  audio.win();
  const starsCount = score.getStars();
  hud.showLevelComplete(starsCount, score.getScore());
}

function drawMenu() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.ctx.save();
  renderer.ctx.setTransform(1, 0, 0, 1, 0, 0);
  renderer.ctx.fillStyle = '#1a1a2e';
  renderer.ctx.fillRect(0, 0, w, h);

  renderer.ctx.beginPath();
  renderer.ctx.arc(w * 0.3, h * 0.55, 60 * scale, 0, Math.PI * 2);
  renderer.ctx.fillStyle = '#e74c3c';
  renderer.ctx.fill();
  renderer.ctx.fillStyle = '#fff';
  renderer.ctx.beginPath();
  renderer.ctx.arc(w * 0.3 - 18 * scale, h * 0.55 - 12 * scale, 10 * scale, 0, Math.PI * 2);
  renderer.ctx.fill();
  renderer.ctx.beginPath();
  renderer.ctx.arc(w * 0.3 + 18 * scale, h * 0.55 - 12 * scale, 10 * scale, 0, Math.PI * 2);
  renderer.ctx.fill();
  renderer.ctx.fillStyle = '#222';
  renderer.ctx.beginPath();
  renderer.ctx.arc(w * 0.3 - 15 * scale, h * 0.55 - 10 * scale, 5 * scale, 0, Math.PI * 2);
  renderer.ctx.fill();
  renderer.ctx.beginPath();
  renderer.ctx.arc(w * 0.3 + 15 * scale, h * 0.55 - 10 * scale, 5 * scale, 0, Math.PI * 2);
  renderer.ctx.fill();
  renderer.ctx.fillStyle = '#f39c12';
  renderer.ctx.beginPath();
  renderer.ctx.moveTo(w * 0.3 + 30 * scale, h * 0.55 + 5 * scale);
  renderer.ctx.lineTo(w * 0.3 + 48 * scale, h * 0.55 + 10 * scale);
  renderer.ctx.lineTo(w * 0.3 + 30 * scale, h * 0.55 + 20 * scale);
  renderer.ctx.closePath();
  renderer.ctx.fill();

  renderer.ctx.font = `bold ${52 * scale}px Arial, sans-serif`;
  renderer.ctx.fillStyle = '#e74c3c';
  renderer.ctx.textAlign = 'center';
  renderer.ctx.textBaseline = 'middle';
  renderer.ctx.fillText('Angry Birds', w / 2, h * 0.4);

  renderer.ctx.font = `${18 * scale}px Arial, sans-serif`;
  renderer.ctx.fillStyle = 'rgba(255,255,255,0.7)';
  renderer.ctx.fillText('Drag to aim. Release to fire. Click for ability.', w / 2, h * 0.48);

  menuBlink += 16;
  const alpha = 0.4 + Math.abs(Math.sin(menuBlink * 0.003)) * 0.6;
  renderer.ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  renderer.ctx.font = `bold ${24 * scale}px Arial, sans-serif`;
  renderer.ctx.fillText('Click to Play', w / 2, h * 0.6);

  const by = h * 0.68;
  const bh = 50 * scale;
  const bw = 200 * scale;
  renderer.ctx.fillStyle = '#f39c12';
  renderer.ctx.beginPath();
  roundRect2(renderer.ctx, w / 2 - bw / 2, by, bw, bh, 10 * scale);
  renderer.ctx.fill();
  renderer.ctx.fillStyle = '#fff';
  renderer.ctx.font = `bold ${20 * scale}px Arial, sans-serif`;
  renderer.ctx.fillText('Play', w / 2, by + bh / 2);

  renderer.ctx.restore();
}

function roundRect2(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

let lastTime = performance.now();
let accumulator = 0;
const FIXED_DT = 1000 / 60;

function gameLoop(time) {
  const delta = Math.min(time - lastTime, 100);
  lastTime = time;
  scale = renderer.getScale();
  const currentState = state.get();

  renderer.clear();

  if (currentState === state.STATES.MENU) {
    drawMenu();
    requestAnimationFrame(gameLoop);
    return;
  }

  if (currentState === state.STATES.PLAYING) {
    accumulator += delta;
    while (accumulator >= FIXED_DT) {
      physics.step(FIXED_DT);
      accumulator -= FIXED_DT;
    }
  }

  renderer.drawBackground();

  const cam = renderer.camera;
  if (game.currentBird && game.currentBird.getState() === 'flying' && game.birdFired) {
    const pos = game.currentBird.body.position;
    cam.follow(pos.x, pos.y);
  } else {
    cam.follow(SLINGSHOT_POS.x, SLINGSHOT_POS.y);
  }
  cam.constrain(0, 1500);
  cam.update(delta);

  cam.apply(renderer.ctx);
  slingshot.draw(renderer.ctx);

  if (slingshot.getDragState().isDragging) {
    const pts = slingshot.getTrajectoryPoints();
    if (renderer.ctx) {
      slingshot.drawTrajectoryPreview(renderer.ctx, pts);
    }
  }

  for (const block of game.blocks) {
    block.update(delta);
    block.draw(renderer.ctx);
  }
  for (const pig of game.pigs) {
    pig.update(delta);
    pig.draw(renderer.ctx);
  }
  for (const bird of game.activeBirds) {
    const bs = bird.getState();
    if (bs !== 'loaded' && bs !== 'waiting') {
      bird.update(delta);
      bird.draw(renderer.ctx);
    }
  }

  game.activeBirds = game.activeBirds.filter(b => b.alive !== false);

  const loadedBird = slingshot.getBird();
  if (loadedBird) {
    loadedBird.draw(renderer.ctx);
  }

  cam.restore(renderer.ctx);

  if (game.settling) {
    game.settleTimer += delta;
    if (game.settleTimer > 1500) {
      game.settling = false;
      game.settleTimer = 0;
      slingshot.loadBird(null);
      if (state.get() === state.STATES.PLAYING) {
        const alivePigs = game.pigs.filter(p => p.isAlive());
        if (alivePigs.length > 0) {
          loadNextBird();
        }
      }
    }
  }

  const level = levels[game.currentLevel];
  hud.update({
    score: score.getScore(),
    levelName: level ? level.name : '',
    levelId: level ? level.id : 0,
    birdQueue: game.birdQueue
  });
  if (currentState === state.STATES.PAUSED) {
    renderer.ctx.save();
    renderer.ctx.setTransform(1, 0, 0, 1, 0, 0);
    renderer.ctx.fillStyle = 'rgba(0,0,0,0.6)';
    renderer.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    renderer.ctx.font = `bold ${36 * scale}px Arial, sans-serif`;
    renderer.ctx.fillStyle = '#fff';
    renderer.ctx.textAlign = 'center';
    renderer.ctx.textBaseline = 'middle';
    renderer.ctx.fillText('Paused', window.innerWidth / 2, window.innerHeight * 0.35);

    const btnW = 180 * scale;
    const btnH = 50 * scale;
    const resumeY = window.innerHeight * 0.45;
    const quitY = window.innerHeight * 0.55;

    renderer.ctx.fillStyle = '#27ae60';
    renderer.ctx.beginPath();
    roundRect2(renderer.ctx, window.innerWidth / 2 - btnW / 2, resumeY, btnW, btnH, 10 * scale);
    renderer.ctx.fill();
    renderer.ctx.fillStyle = '#fff';
    renderer.ctx.font = `bold ${20 * scale}px Arial, sans-serif`;
    renderer.ctx.fillText('Resume', window.innerWidth / 2, resumeY + btnH / 2);

    renderer.ctx.fillStyle = '#e74c3c';
    renderer.ctx.beginPath();
    roundRect2(renderer.ctx, window.innerWidth / 2 - btnW / 2, quitY, btnW, btnH, 10 * scale);
    renderer.ctx.fill();
    renderer.ctx.fillStyle = '#fff';
    renderer.ctx.fillText('Quit', window.innerWidth / 2, quitY + btnH / 2);

    renderer.ctx.restore();
  }

  if (currentState !== state.STATES.PAUSED) {
    hud.updateResult(delta);
    hud.draw();
  }

  requestAnimationFrame(gameLoop);
}

input.addHandler({
  onDown: (wx, wy, sx, sy) => {
    audio.init();
    const cs = state.get();
    if (cs === state.STATES.MENU) {
      state.set(state.STATES.PLAYING);
      loadLevel(0);
      return;
    }
    if (cs === state.STATES.LEVEL_COMPLETE || cs === state.STATES.GAME_OVER) {
      hud.handleClick(sx, sy);
      return;
    }
    if (cs === state.STATES.PAUSED) {
      const btnW = 180 * scale;
      const btnH = 50 * scale;
      const resumeY = window.innerHeight * 0.45;
      const quitY = window.innerHeight * 0.55;
      const cx = sx;
      const cy = sy;
      if (cx >= window.innerWidth / 2 - btnW / 2 && cx <= window.innerWidth / 2 + btnW / 2) {
        if (cy >= resumeY && cy <= resumeY + btnH) {
          state.set(state.STATES.PLAYING);
          return;
        }
        if (cy >= quitY && cy <= quitY + btnH) {
          state.set(state.STATES.MENU);
          return;
        }
      }
      return;
    }
    if (cs !== state.STATES.PLAYING) return;

    hud.handleClick(sx, sy);
    if (hud.isResultVisible()) return;

    if (slingshot.isBirdLoaded() && game.currentBird && game.currentBird.getState() === 'loaded') {
      if (slingshot.startDrag(wx, wy)) return;
    }
    if (game.currentBird && game.currentBird.isAbilityAvailable()) {
      game.currentBird.activateAbility(physics.engine);
      audio.ability();
    }
  },
  onMove: (wx, wy) => {
    slingshot.moveDrag(wx, wy);
  },
  onUp: () => {
    const wasDragging = slingshot.getDragState().isDragging;
    slingshot.endDrag();
    if (wasDragging && game.currentBird && game.currentBird.getState() === 'flying') {
      game.birdFired = true;
      score.useBird();
      audio.launch();
    }
  }
});

hud.setCallbacks({
  onRestart: () => {
    state.set(state.STATES.PLAYING);
    loadLevel(game.currentLevel);
  },
  onNextLevel: () => {
    if (game.currentLevel + 1 < levels.length) {
      state.set(state.STATES.PLAYING);
      loadLevel(game.currentLevel + 1);
    } else {
      state.set(state.STATES.MENU);
    }
  },
  onMenu: () => {
    state.set(state.STATES.MENU);
  },
  onPause: () => {
    state.set(state.STATES.PAUSED);
  }
});

requestAnimationFrame(gameLoop);
