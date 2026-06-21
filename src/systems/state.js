const STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  GAME_OVER: 'GAME_OVER'
};

export function createState() {
  let current = STATES.MENU;
  const listeners = [];

  function get() {
    return current;
  }

  function set(newState) {
    if (current === newState) return;
    const prev = current;
    current = newState;
    for (const listener of listeners) {
      listener(newState, prev);
    }
  }

  function is(...states) {
    return states.includes(current);
  }

  function onStateChange(callback) {
    listeners.push(callback);
  }

  return { STATES, get, set, is, onStateChange };
}
