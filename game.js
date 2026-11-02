(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const arena = $('arena'), pEl = $('poteto'), tEl = $('tibo'), sEl = $('snack');
  const overlay = $('overlay'), startButton = $('start'), pauseButton = $('pause');
  const keys = new Set();
  let p, t, snack, score = 0, lives = 3, remaining = 45;
  let running = false, paused = false, last = 0, invulnerable = 0, frame = 0;
  let sound = true, audio;
  let jumpRemaining = 0, jumpCooldown = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const random = () => ({x: .12 + Math.random() * .76, y: .14 + Math.random() * .72});
  function place(el, v) { el.style.left = v.x * 100 + '%'; el.style.top = v.y * 100 + '%'; }
  function beep(frequency, seconds = .1) {
    if (!sound) return;
    try {
      audio ??= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = 'triangle'; oscillator.frequency.value = frequency;
      oscillator.connect(gain); gain.connect(audio.destination);
      gain.gain.setValueAtTime(.08, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + seconds);
      oscillator.start(); oscillator.stop(audio.currentTime + seconds);
    } catch (_) { /* Audio is optional on browsers that do not support it. */ }
  }
  function jump() {
    if (!running || paused || jumpCooldown > 0) return;
    jumpRemaining = .65; jumpCooldown = .95; beep(520, .12);
  }
  function newSnack() {
    let candidate;
    for (let attempt = 0; attempt < 100; attempt++) {
      candidate = random();
      if (Math.hypot(candidate.x - p.x, candidate.y - p.y) >= .17) break;
    }
    snack = candidate; place(sEl, snack);
  }
  function draw() {
    place(pEl, p); place(tEl, t);
    pEl.style.setProperty('--lift', (-Math.sin(Math.PI * jumpRemaining / .65) * 58) + 'px');
    pEl.style.setProperty('--tilt', (running && !paused && keys.size ? Math.sin(remaining * 22) * 6 : 0) + 'deg');
    tEl.style.setProperty('--tilt', (running && !paused ? Math.sin(remaining * 18) * 5 : 0) + 'deg');
    pEl.style.opacity = invulnerable > 0 && Math.floor(invulnerable * 8) % 2 === 0 ? '.45' : '1';
  }
  function finish(won) {
    running = false; paused = false; keys.clear(); pauseButton.disabled = true;
    overlay.hidden = false;
    $('headline').textContent = won ? '🎉 Poteto Escaped!' : '😵 Tibo Caught Poteto!';
    $('message').textContent = `Final score ${score} points. ${won ? 'You survived the chase!' : 'Give it another shot!'}`;
    startButton.textContent = 'Play Again'; beep(won ? 880 : 160, .3);
  }
  function start() {
    p = {x: .2, y: .5}; t = {x: .8, y: .5};
    score = 0; lives = 3; remaining = 45; invulnerable = 0; jumpRemaining = 0; jumpCooldown = 0; keys.clear();
    $('score').textContent = score; $('lives').textContent = lives; $('time').textContent = 45;
    newSnack(); draw(); overlay.hidden = true; running = true; paused = false;
    pauseButton.disabled = false; pauseButton.textContent = 'Pause';
    last = performance.now(); cancelAnimationFrame(frame); frame = requestAnimationFrame(tick);
    beep(550);
  }
  function pause() {
    if (!running) return;
    paused = !paused; keys.clear(); cancelAnimationFrame(frame);
    pauseButton.textContent = paused ? 'Resume' : 'Pause'; overlay.hidden = !paused;
    if (paused) {
      $('headline').textContent = 'Chase paused';
      $('message').textContent = 'Take a breather. Press P or Resume to keep running.';
      startButton.textContent = 'Resume';
    } else { last = performance.now(); frame = requestAnimationFrame(tick); }
  }
  function tick(now) {
    if (!running || paused) return;
    const dt = Math.min((now - last) / 1000, .045); last = now;
    remaining -= dt;
    if (remaining <= 0) { $('time').textContent = 0; finish(true); return; }
    $('time').textContent = Math.ceil(remaining);
    jumpRemaining = Math.max(0, jumpRemaining - dt);
    jumpCooldown = Math.max(0, jumpCooldown - dt);
    $('jump').textContent = jumpCooldown > 0 ? 'Hop recharging…' : 'Hop! ⤴';
    const w = arena.clientWidth, h = arena.clientHeight;
    const radius = pEl.offsetWidth / 2;
    const marginX = radius / w, marginY = radius / h;
    let dx = Number(keys.has('right')) - Number(keys.has('left'));
    let dy = Number(keys.has('down')) - Number(keys.has('up'));
    const norm = Math.hypot(dx, dy) || 1;
    // Scale movement to the arena so small touchscreens have the same difficulty.
    const scale = Math.min(w, h) / 500;
    p.x = clamp(p.x + dx / norm * 220 * scale * dt / w, marginX, 1 - marginX);
    p.y = clamp(p.y + dy / norm * 220 * scale * dt / h, marginY, 1 - marginY);
    const tx = (p.x - t.x) * w, ty = (p.y - t.y) * h;
    const distance = Math.hypot(tx, ty) || 1, chaseSpeed = (105 + Math.min(score * .55, 75)) * scale;
    t.x = clamp(t.x + tx / distance * chaseSpeed * dt / w, marginX, 1 - marginX);
    t.y = clamp(t.y + ty / distance * chaseSpeed * dt / h, marginY, 1 - marginY);
    if (Math.hypot((p.x - snack.x) * w, (p.y - snack.y) * h) < radius + 12) {
      score += 10; $('score').textContent = score; beep(740); newSnack();
    }
    invulnerable = Math.max(0, invulnerable - dt);
    if (invulnerable === 0 && jumpRemaining === 0 && Math.hypot((p.x - t.x) * w, (p.y - t.y) * h) < radius * 1.5) {
      lives--; $('lives').textContent = lives; beep(180, .2);
      if (lives <= 0) { draw(); finish(false); return; }
      invulnerable = 2.1; t = {x: p.x > .5 ? .12 : .88, y: p.y > .5 ? .12 : .88};
    }
    draw(); frame = requestAnimationFrame(tick);
  }
  startButton.addEventListener('click', () => paused ? pause() : start());
  pauseButton.addEventListener('click', pause);
  $('jump').addEventListener('pointerdown', e => { e.preventDefault(); jump(); });
  $('jump').addEventListener('click', jump);
  $('sound').addEventListener('click', () => {
    sound = !sound; $('sound').textContent = sound ? 'Sound on' : 'Sound off';
    $('sound').setAttribute('aria-pressed', String(sound)); beep(660);
  });
  const mapping = {arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right', w: 'up', a: 'left', s: 'down', d: 'right'};
  window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (key === 'enter' && e.target.tagName !== 'BUTTON' && (!running || paused)) {
      e.preventDefault(); paused ? pause() : start(); return;
    }
    if ((key === 'p' || key === 'escape') && !e.repeat) { e.preventDefault(); pause(); return; }
    if (e.code === 'Space' || key === ' ') { e.preventDefault(); if (!e.repeat) jump(); return; }
    if (mapping[key]) { e.preventDefault(); if (running && !paused) keys.add(mapping[key]); }
  });
  window.addEventListener('keyup', e => keys.delete(mapping[e.key.toLowerCase()]));
  window.addEventListener('blur', () => { keys.clear(); if (running && !paused) pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && running && !paused) pause(); });
  document.querySelectorAll('[data-dir]').forEach(button => {
    const dir = button.dataset.dir;
    button.addEventListener('pointerdown', e => {
      e.preventDefault(); if (running && !paused) keys.add(dir); button.setPointerCapture(e.pointerId);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, () => keys.delete(dir));
  });
  p = {x: .2, y: .5}; t = {x: .8, y: .5}; newSnack(); draw();
})();
