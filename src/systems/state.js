const State = {
  LOADING: 'LOADING',
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  GAME_OVER: 'GAME_OVER'
};

let currentState = State.LOADING;
let listeners = {};

function setState(newState, data) {
  const prev = currentState;
  currentState = newState;
  const handlers = listeners[newState] || [];
  handlers.forEach(fn => fn(newState, prev, data));
}

function onState(state, fn) {
  if (!listeners[state]) listeners[state] = [];
  listeners[state].push(fn);
}

function getState() {
  return currentState;
}

export { State, setState, onState, getState };
