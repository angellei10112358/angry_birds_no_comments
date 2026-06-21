export function createScore() {
  let score = 0;
  let birdsUsed = 0;
  let blocksDestroyed = 0;
  let pigsKilled = 0;
  let levelStars = { two: 0, three: 0 };

  function reset(stars) {
    score = 0;
    birdsUsed = 0;
    blocksDestroyed = 0;
    pigsKilled = 0;
    levelStars = stars || { two: 0, three: 0 };
  }

  function addPigKill() {
    pigsKilled++;
    score += 5000;
  }

  function addBlockDestroy() {
    blocksDestroyed++;
    score += 500;
  }

  function useBird() {
    birdsUsed++;
  }

  function remainingBirdBonus(birdsLeft) {
    score += birdsLeft * 10000;
  }

  function getScore() {
    return score;
  }

  function getStars() {
    if (score >= levelStars.three) return 3;
    if (score >= levelStars.two) return 2;
    return score > 0 ? 1 : 0;
  }

  function getBirdsUsed() {
    return birdsUsed;
  }

  return { reset, addPigKill, addBlockDestroy, useBird, remainingBirdBonus, getScore, getStars, getBirdsUsed };
}
