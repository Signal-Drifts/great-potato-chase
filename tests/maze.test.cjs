const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../maze.js');

function route(level) {
  const distance = core.distances(level.grid, level.target);
  const p = {...level.start}, result = [];
  while (p.x !== level.target.x || p.y !== level.target.y) {
    const next = Object.entries(core.directions).find(([direction, [dx, dy]]) =>
      core.canMove(level.grid, p.x, p.y, direction) && distance[p.y + dy][p.x + dx] === distance[p.y][p.x] - 1);
    assert(next, 'There must be a route to the hidden fry');
    const [direction, [dx, dy]] = next; result.push(direction); p.x += dx; p.y += dy;
  }
  return result;
}

test('all five increasingly large mazes are connected, enclosed, and solvable in time', () => {
  let priorSize = 0, priorFloor = 0;
  core.levels.forEach((_, i) => {
    const level = core.createLevel(i), distances = core.distances(level.grid, level.start);
    const floors = level.grid.flat().filter(cell => cell === 0).length;
    assert(level.size > priorSize && floors > priorFloor);
    for (let y = 0; y < level.size; y++) for (let x = 0; x < level.size; x++) {
      if (level.grid[y][x] === 0) assert(distances[y][x] >= 0, 'No isolated floor tiles');
      if (x === 0 || y === 0 || x === level.size - 1 || y === level.size - 1) assert.equal(level.grid[y][x], 1);
    }
    assert(route(level).length * .14 < 45, 'The shortest route must fit comfortably in 45 seconds');
    assert.notDeepEqual(level.target, level.start);
    assert.deepEqual(core.createLevel(i), level, 'Retries must preserve the same maze');
    priorSize = level.size; priorFloor = floors;
  });
});

function gameHarness() {
  let now = 0, scheduled = null;
  const handlers = {}, elements = {}, drawText = [], pad = [];
  const drawing = new Proxy({}, {get: (target, prop) => target[prop] || ((...args) => {
    if (prop === 'fillText') drawText.push(args[0]);
  })});
  const doc = {activeElement: null, hidden: false,
    getElementById: id => element(id),
    querySelectorAll: selector => selector === '.step' ? Array.from({length: 5}, (_, i) => element(`step-${i}`)) : pad,
    addEventListener() {}};
  function element(id) {
    return elements[id] ??= {id, textContent: '', hidden: false, disabled: false,
      clientWidth: 500, width: 500, height: 500, listeners: {}, classList: {toggle() {}},
      addEventListener(type, fn) { this.listeners[type] = fn; }, setAttribute() {},
      focus() { doc.activeElement = this; }, getContext: () => drawing};
  }
  class MockImage {
    constructor() { this.complete = true; this.naturalWidth = 1024; this.naturalHeight = 1536; }
    addEventListener() {}
  }
  const context = {document: doc, window: {PotatoMaze: core, devicePixelRatio: 1,
    addEventListener: (event, fn) => handlers[event] = fn}, Image: MockImage,
    performance: {now: () => now}, requestAnimationFrame: fn => { scheduled = fn; return 1; },
    cancelAnimationFrame: () => scheduled = null};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../game.js'), 'utf8'), context);
  function key(type, value) {
    handlers[type]({key: value, code: value, repeat: false, preventDefault() {}, stopPropagation() {}});
  }
  function advance(milliseconds) {
    now += milliseconds;
    const cb = scheduled; scheduled = null; if (cb) cb(now);
  }
  const keyboard = {up: 'ArrowUp', right: 'ArrowRight', down: 'ArrowDown', left: 'ArrowLeft'};
  function step(direction) {
    key('keydown', keyboard[direction]); advance(16); key('keyup', keyboard[direction]);
  }
  return {element, key, advance, step, doc, drawText, click: id => element(id).listeners.click()};
}

test('keyboard can win all five levels; each level resets the timer and waits for first movement', () => {
  const game = gameHarness();
  assert(!game.drawText.includes('🍟'), 'Fry must be hidden at the entrance');
  game.key('keydown', 'Enter'); game.advance(10000);
  assert.equal(game.element('time').textContent, 45);
  assert.equal(game.doc.activeElement.id, 'arena');
  for (let i = 0; i < 5; i++) {
    assert.equal(game.element('level').textContent, i + 1);
    for (const direction of route(core.createLevel(i))) game.step(direction);
    assert.equal(game.element('found').textContent, i + 1);
    assert.equal(game.element('overlay').hidden, false);
    if (i < 4) {
      assert.match(game.element('headline').textContent, /complete/);
      game.click('start'); assert.equal(game.element('time').textContent, 45);
      game.advance(10000); assert.equal(game.element('time').textContent, 45);
    }
  }
  assert.match(game.element('headline').textContent, /All five fries found/);
  game.click('start'); assert.equal(game.element('found').textContent, 0);
  assert.equal(game.element('level').textContent, 1);
});

test('walls cannot be crossed, pause freezes the clock, and three timeouts end the game', () => {
  const game = gameHarness(); game.click('start');
  game.step('left'); game.advance(5000);
  assert.equal(game.element('time').textContent, 45, 'Bumping the entrance wall must not start the timer');
  for (let attempt = 0; attempt < 3; attempt++) {
    game.step(route(core.createLevel(0))[0]); game.key('keydown', 'p');
    const time = game.element('time').textContent; game.advance(10000);
    assert.equal(game.element('time').textContent, time);
    game.key('keydown', 'p'); game.advance(46000);
    assert.equal(game.element('lives').textContent, 2 - attempt);
    assert.equal(game.element('time').textContent, 0);
    if (attempt < 2) { game.click('start'); assert.equal(game.element('time').textContent, 45); }
  }
  assert.equal(game.element('start').textContent, 'Restart Level 1');
});
