import { screenToWorld, worldToScreen, getCamera, GAME_W, GAME_H } from '../engine/renderer.js';
import { engine } from '../engine/physics.js';

const { Body, Vector } = Matter;

const SLINGSHOT_X = 200;
const SLINGSHOT_Y = 480;
const MAX_DRAG_DIST = 100;
const LAUNCH_FORCE = 0.008;

let currentBird = null;
let isDragging = false;
let dragStart = null;
let dragCurrent = null;
let trajectoryPoints = [];
let launchCallback = null;
let birdLoaded = true;

function setBird(bird) {
  currentBird = bird;
  birdLoaded = true;
  if (bird) {
    Body.setPosition(bird, { x: SLINGSHOT_X, y: SLINGSHOT_Y });
    Body.setVelocity(bird, { x: 0, y: 0 });
    Body.setAngularVelocity(bird, 0);
  }
}

function getBird() {
  return currentBird;
}

function onLaunch(cb) {
  launchCallback = cb;
}

function handlePointerDown(wx, wy) {
  if (!currentBird || !birdLoaded) return;
  const dx = wx - SLINGSHOT_X;
  const dy = wy - SLINGSHOT_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 50) {
    isDragging = true;
    dragStart = { x: wx, y: wy };
    dragCurrent = { x: wx, y: wy };
    currentBird.isStatic = true;
  }
}

function handlePointerMove(wx, wy) {
  if (!isDragging || !currentBird) return;
  let dx = wx - SLINGSHOT_X;
  let dy = wy - SLINGSHOT_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > MAX_DRAG_DIST) {
    dx = (dx / dist) * MAX_DRAG_DIST;
    dy = (dy / dist) * MAX_DRAG_DIST;
  }
  dragCurrent = { x: SLINGSHOT_X + dx, y: SLINGSHOT_Y + dy };
  Body.setPosition(currentBird, { x: SLINGSHOT_X + dx, y: SLINGSHOT_Y + dy });

  const launchVel = {
    x: (SLINGSHOT_X - dragCurrent.x) * LAUNCH_FORCE,
    y: (SLINGSHOT_Y - dragCurrent.y) * LAUNCH_FORCE
  };
  calculateTrajectory(SLINGSHOT_X, SLINGSHOT_Y, launchVel);
}

function handlePointerUp() {
  if (!isDragging || !currentBird) return;
  isDragging = false;
  const launchVel = {
    x: (SLINGSHOT_X - dragCurrent.x) * LAUNCH_FORCE,
    y: (SLINGSHOT_Y - dragCurrent.y) * LAUNCH_FORCE
  };
  const speed = Math.sqrt(launchVel.x * launchVel.x + launchVel.y * launchVel.y);
  if (speed > 0.5) {
    currentBird.isStatic = false;
    Body.setVelocity(currentBird, launchVel);
    currentBird.isLaunched = true;
    birdLoaded = false;
    trajectoryPoints = [];
    if (launchCallback) launchCallback(currentBird);
  } else {
    Body.setPosition(currentBird, { x: SLINGSHOT_X, y: SLINGSHOT_Y });
    currentBird.isStatic = false;
  }
}

function calculateTrajectory(startX, startY, velocity) {
  trajectoryPoints = [];
  const gravity = engine.gravity.y * 1.2;
  const steps = 40;
  const dt = 2;
  for (let i = 0; i < steps; i++) {
    const t = i * dt;
    const x = startX + velocity.x * t * 60;
    const y = startY + velocity.y * t * 60 + 0.5 * gravity * t * t * 60;
    if (y > 560) break;
    trajectoryPoints.push({ x, y });
  }
}

function getTrajectoryPoints() {
  return trajectoryPoints;
}

function getDragState() {
  return { isDragging, dragCurrent, SLINGSHOT_X, SLINGSHOT_Y };
}

function isBirdLoaded() {
  return birdLoaded;
}

export {
  setBird, getBird, onLaunch,
  handlePointerDown, handlePointerMove, handlePointerUp,
  getTrajectoryPoints, getDragState, isBirdLoaded,
  SLINGSHOT_X, SLINGSHOT_Y, MAX_DRAG_DIST
};
