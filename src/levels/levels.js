const levels = [
  {
    id: 1,
    birds: ['red', 'red', 'yellow'],
    pigs: [
      { x: 700, y: 520, radius: 18 }
    ],
    blocks: [
      { type: 'wood', x: 680, y: 500, w: 20, h: 80, angle: 0 },
      { type: 'wood', x: 720, y: 500, w: 20, h: 80, angle: 0 },
      { type: 'wood', x: 700, y: 440, w: 60, h: 20, angle: 0 }
    ],
    stars: { two: 10000, three: 20000 }
  },
  {
    id: 2,
    birds: ['red', 'yellow', 'blue', 'red'],
    pigs: [
      { x: 750, y: 520, radius: 18 },
      { x: 850, y: 520, radius: 15 }
    ],
    blocks: [
      { type: 'wood', x: 730, y: 500, w: 20, h: 80, angle: 0 },
      { type: 'wood', x: 770, y: 500, w: 20, h: 80, angle: 0 },
      { type: 'stone', x: 750, y: 440, w: 60, h: 20, angle: 0 },
      { type: 'stone', x: 840, y: 500, w: 20, h: 80, angle: 0 },
      { type: 'stone', x: 860, y: 500, w: 20, h: 80, angle: 0 },
      { type: 'ice', x: 850, y: 440, w: 40, h: 20, angle: 0 }
    ],
    stars: { two: 15000, three: 30000 }
  },
  {
    id: 3,
    birds: ['red', 'yellow', 'blue', 'black', 'white'],
    pigs: [
      { x: 700, y: 520, radius: 15 },
      { x: 800, y: 520, radius: 18 },
      { x: 900, y: 520, radius: 20 }
    ],
    blocks: [
      { type: 'stone', x: 690, y: 500, w: 20, h: 80, angle: 0 },
      { type: 'stone', x: 710, y: 500, w: 20, h: 80, angle: 0 },
      { type: 'stone', x: 700, y: 440, w: 40, h: 20, angle: 0 },
      { type: 'wood', x: 790, y: 500, w: 20, h: 80, angle: 0 },
      { type: 'wood', x: 810, y: 500, w: 20, h: 80, angle: 0 },
      { type: 'ice', x: 800, y: 440, w: 40, h: 20, angle: 0 },
      { type: 'ice', x: 790, y: 380, w: 20, h: 80, angle: 0 },
      { type: 'ice', x: 810, y: 380, w: 20, h: 80, angle: 0 },
      { type: 'ice', x: 800, y: 320, w: 40, h: 20, angle: 0 },
      { type: 'stone', x: 890, y: 500, w: 20, h: 80, angle: 0 },
      { type: 'stone', x: 910, y: 500, w: 20, h: 80, angle: 0 },
      { type: 'stone', x: 900, y: 440, w: 40, h: 20, angle: 0 }
    ],
    stars: { two: 25000, three: 50000 }
  }
];

function getLevel(id) {
  return levels.find(l => l.id === id);
}

function getLevelCount() {
  return levels.length;
}

export { levels, getLevel, getLevelCount };
