let score = 0;
let levelStars = { two: 0, three: 0 };
let pigPoints = 5000;
let blockPoints = { wood: 500, stone: 1000, ice: 300 };
let remainingBirdBonus = 10000;

function reset(stars) {
  score = 0;
  levelStars = stars || { two: 10000, three: 20000 };
}

function addPigKill() {
  score += pigPoints;
}

function addBlockBreak(type) {
  score += blockPoints[type] || 500;
}

function addRemainingBirdBonus(count) {
  score += count * remainingBirdBonus;
}

function getScore() {
  return score;
}

function getStars() {
  if (score >= levelStars.three) return 3;
  if (score >= levelStars.two) return 2;
  return score > 0 ? 1 : 0;
}

function setStarsThreshold(stars) {
  levelStars = stars;
}

export { reset, addPigKill, addBlockBreak, addRemainingBirdBonus, getScore, getStars, setStarsThreshold };
