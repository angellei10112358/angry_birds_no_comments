# Angry Birds (No Comments)

A browser-based Angry Birds clone built with HTML5 Canvas and Matter.js physics engine.

**Play online:** https://angellei10112358.github.io/angry_birds_no_comments/

## Features

- Physics-based slingshot mechanics with trajectory prediction
- 5 bird types with unique special abilities
- 3 destructible material types (wood, ice, stone)
- 3 levels with increasing difficulty
- Score tracking with 1-3 star rating
- Camera follow system
- Programmatic audio via Web Audio API
- Touch and mouse support
- Mobile responsive

## How to Play

1. Click and drag on the bird in the slingshot
2. Pull back to aim (further back = harder launch)
3. Release to fire
4. Click/tap while bird is in flight to activate special ability
5. Destroy all pigs to clear the level

## Bird Types

- **Red Bird** — Standard, no special ability
- **Yellow Bird** — Click to speed boost (effective against wood)
- **Blue Bird** — Click to split into 3 (effective against ice)
- **Black Bird** — Click to explode on impact (effective against stone)
- **White Bird** — Click to drop an egg and bounce upward

## Tech Stack

- HTML5 Canvas (rendering)
- Matter.js (physics engine, via CDN)
- Web Audio API (sound effects)
- Zero build tools, ready for GitHub Pages

## Development

No build step required. Serve the root directory with any static file server:

```bash
npx serve .
```

## License

MIT
