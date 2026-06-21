import { engine } from '../engine/physics.js';

const { Body, Sleeping } = Matter;

const SLINGSHOT_X = 200;
const SLINGSHOT_Y = 480;
const MAX_DRAG_DIST = 120;
const LAUNCH_FORCE = 0.035;

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
    Body.setStatic(currentBird, true);
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
    Body.setStatic(currentBird, false);
    Sleeping.set(currentBird, false);
    Body.setVelocity(currentBird, launchVel);
    currentBird.isLaunched = true;
    birdLoaded = false;
    trajectoryPoints = [];
    if (launchCallback) launchCallback(currentBird);
  } else {
    Body.setPosition(currentBird, { x: SLINGSHOT_X, y: SLINGSHOT_Y });
    Body.setStatic(currentBird, false);
  }
}

function calculateTrajectory(startX, startY, velocity) {
  trajectoryPoints = [];
  const g = engine.gravity.y * 0.001 * 16.67;
  let vx = velocity.x, vy = velocity.y;
  let x = startX, y = startY;
  for (let i = 0; i < 100; i++) {
    x += vx;
    vy += g;
    y += vy;
    if (y > 560) break;
    if (i % 3 === 0) trajectoryPoints.push({ x, y });
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
