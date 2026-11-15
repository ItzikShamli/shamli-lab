/* Fun With Math — screens, sound, voice, coins. Logic lives in logic.js (window.FWM). */
(function () {
  'use strict';

  // Keep in sync with CACHE_VERSION in sw.js (tests check this).
  const APP_VERSION = '1.1.0';

  const L = window.FWM;
  const $ = (id) => document.getElementById(id);

  // ---------- Saved data ----------
  let memoryStore = null;
  function load() {
    try {
      const raw = localStorage.getItem(L.STORAGE_KEY);
      return L.normalizeData(raw ? JSON.parse(raw) : null);
    } catch (e) {
      return L.normalizeData(memoryStore);
    }
  }
  function save() {
    try { localStorage.setItem(L.STORAGE_KEY, JSON.stringify(data)); }
    catch (e) { memoryStore = JSON.parse(JSON.stringify(data)); }
  }
  let data = load();

  // ---------- Small DOM helpers ----------
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  let currentScreen = 'start';
  function show(name) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $('screen-' + name).classList.add('active');
    currentScreen = name;
    if (name !== 'done') document.querySelectorAll('.confetti').forEach((c) => c.remove());
    maybeReloadForUpdate();
  }

  // ---------- Sound effects (Web Audio, no files needed) ----------
  const Sound = {
    ctx: null,
    unlock() {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        if (!this.ctx) this.ctx = new AC();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const b = this.ctx.createBuffer(1, 1, 22050);
        const s = this.ctx.createBufferSource();
        s.buffer = b; s.connect(this.ctx.destination); s.start(0);
      } catch (e) { /* no sound is fine */ }
    },
    tone(freq, start, dur, type, vol) {
      if (!this.ctx) return;
      try {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime + start;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type || 'sine';
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(t); o.stop(t + dur + 0.05);
      } catch (e) { /* ignore */ }
    },
    right() { [523, 659, 784].forEach((f, i) => this.tone(f, i * 0.09, 0.25, 'triangle', 0.2)); },
    wrong() { this.tone(220, 0, 0.18, 'sine', 0.15); this.tone(180, 0.15, 0.25, 'sine', 0.15); },
    coin() { this.tone(988, 0, 0.08, 'square', 0.08); this.tone(1319, 0.08, 0.22, 'square', 0.08); },
    fanfare() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, i * 0.12, 0.3, 'triangle', 0.2)); },
    tap() { this.tone(660, 0, 0.06, 'sine', 0.08); }
  };

  // ---------- Voice (speech synthesis) ----------
  const Voice = {
    ok: 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
    voice: null,
    talking: 0,
    init() {
      if (!this.ok) return;
      this.refresh();
      const again = () => this.refresh();
      if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', again);
      else speechSynthesis.onvoiceschanged = again;
    },
    list() { return this.ok ? speechSynthesis.getVoices() : []; },
    refresh() { if (this.ok) this.voice = L.pickVoice(this.list(), data.voiceURI); },
    unlock() {
      if (!this.ok) return;
      try {
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        speechSynthesis.speak(u);
      } catch (e) { /* ignore */ }
    },
    say(text, queue) {
      if (!this.ok || !text) return;
      if (!this.voice) this.refresh();
      const u = new SpeechSynthesisUtterance(text);
      if (this.voice) { u.voice = this.voice; u.lang = this.voice.lang; } else { u.lang = L.VOICE_LANG; }
      u.rate = 0.85;
      u.pitch = 1.05;
      const btn = $('btn-say');
      u.onstart = () => { this.talking++; btn.classList.add('talking'); };
      u.onend = u.onerror = () => { this.talking = Math.max(0, this.talking - 1); if (!this.talking) btn.classList.remove('talking'); };
      if (!queue && (speechSynthesis.speaking || speechSynthesis.pending)) {
        speechSynthesis.cancel();
        this.talking = 0; btn.classList.remove('talking');
        // Safari sometimes drops a speak() that comes right after cancel().
        setTimeout(() => speechSynthesis.speak(u), 80);
      } else {
        speechSynthesis.speak(u);
      }
    }
  };

  // ---------- Pictures of numbers ----------
  // Dots in rows of 5, tens in their own block (orange ten, purple ones).
  function dotsEl(n, size) {
    const wrap = el('div', 'frames' + (size ? ' ' + size : ''));
    if (n > 10) wrap.style.flexDirection = 'column';
    if (n === 0) {
      const f = el('div', 'frame short'); f.style.setProperty('--n', 1);
      f.appendChild(el('span', 'dot empty'));
      wrap.appendChild(f);
      return wrap;
    }
    let left = n, block = 0;
    while (left > 0) {
      const k = Math.min(10, left);
      const f = el('div', 'frame' + (block ? ' second' : ''));
      if (k < 5) { f.classList.add('short'); f.style.setProperty('--n', k); }
      for (let i = 0; i < k; i++) f.appendChild(el('span', 'dot'));
      wrap.appendChild(f);
      left -= k; block++;
    }
    return wrap;
  }

  // A pile of objects (emoji). `gone` = how many at the end are crossed out.
  function objectsEl(n, emoji, opts) {
    opts = opts || {};
    const box = el('div', 'objects' + (opts.small ? ' sm' : ''));
    const cols = Math.min(5, Math.max(1, opts.cols || n));
    if (cols < 5) box.classList.add('cols-' + cols);
    if (opts.size) box.style.setProperty('font-size', opts.size + 'px');
    for (let i = 0; i < n; i++) {
      const o = el('span', 'obj', emoji);
      if (opts.size) o.style.fontSize = opts.size + 'px';
      if (opts.gone && i >= n - opts.gone) o.classList.add('gone');
      box.appendChild(o);
    }
    return box;
  }

  function numberWithDots(n, cls) {
    const t = el('div', cls || 'term');
    t.appendChild(el('div', 'numeral', String(n)));
    t.appendChild(dotsEl(n));
    return t;
  }

  // ---------- Game state ----------
  let profile = null;
  let round = null;
  let q = null;
  let busy = false;

  function renderProgress() {
    const p = $('progress');
    clear(p);
    for (let i = 0; i < L.ROUND_LENGTH; i++) {
      const s = el('span');
      if (i < round.i) s.classList.add('done');
      else if (i === round.i) s.classList.add('now');
      p.appendChild(s);
    }
  }
  function renderJar() { $('jar-count').textContent = String(profile.coins); }

  function startRound(p) {
    profile = p;
    round = { i: 0, coins: 0, prevKey: null };
    $('who').textContent = p.avatar;
    renderJar();
    show('game');
    nextQuestion();
  }

  function nextQuestion() {
    if (round.i >= L.ROUND_LENGTH) { finishRound(); return; }
    q = L.nextQuestion(profile, round.prevKey);
    round.prevKey = q.key;
    round.firstTry = true;
    busy = false;
    renderProgress();
    renderQuestion();
    Voice.say(q.say);
  }

  function renderQuestion() {
    const qa = $('question'), an = $('answers');
    clear(qa); clear(an);
    qa.style.gap = '';
    an.classList.remove('locked'); qa.classList.remove('locked');

    if (q.type === 'count') {
      qa.appendChild(objectsEl(q.n, q.item));
      q.choices.forEach((c) => an.appendChild(answerBtn(c, numberWithDots(c, 'term'))));
    } else if (q.type === 'match') {
      const big = el('div', 'numeral', String(q.n));
      big.style.fontSize = '190px';
      big.style.color = '#fff';
      big.style.textShadow = '0 8px 0 var(--shadow)';
      qa.appendChild(big);
      q.choices.forEach((c) => an.appendChild(answerBtn(c, dotsEl(c, 'big'))));
    } else if (q.type === 'more') {
      ['left', 'right'].forEach((side) => {
        const n = side === 'left' ? q.left : q.right;
        const g = el('button', 'group');
        g.setAttribute('aria-label', side);
        g.appendChild(objectsEl(n, q.item, { size: n > 5 ? 54 : 64 }));
        g.addEventListener('click', () => answer(g, side));
        qa.appendChild(g);
      });
      qa.style.gap = '90px';
      return;
    } else if (q.type === 'sub') {
      qa.appendChild(takeAwayEl());
      q.choices.forEach((c) => an.appendChild(answerBtn(c, numberWithDots(c, 'term'))));
    } else if (q.type === 'add') {
      qa.appendChild(termEl(q.a));
      qa.appendChild(el('div', 'op', q.op));
      qa.appendChild(termEl(q.b));
      qa.appendChild(el('div', 'op', '='));
      qa.appendChild(el('div', 'qmark', '?'));
      q.choices.forEach((c) => an.appendChild(answerBtn(c, numberWithDots(c, 'term'))));
    }
  }

  // One side of a + sum: the number with matching objects or dots.
  function termEl(n) {
    const t = el('div', 'term');
    t.appendChild(el('div', 'numeral', String(n)));
    if (q.answer <= 10) {
      const item = round.item || (round.item = L.pick(Math.random, L.ITEMS).e);
      t.appendChild(objectsEl(n, item, { size: 40, cols: Math.min(5, n) }));
    } else {
      t.appendChild(dotsEl(n, 'q'));
    }
    return t;
  }

  // Take-away: the sum on top, ONE picture of the first number below it.
  // After a moment the ones being taken away hop off and fade with a red ✕;
  // the ones that stay are what's left. Numbers sit next to their own group.
  function takeAwayEl() {
    const wrap = el('div', 'sub-wrap' + (q.a > 10 ? ' teens' : ''));
    const eq = el('div', 'sub-eq');
    eq.appendChild(el('div', 'numeral', String(q.a)));
    eq.appendChild(el('div', 'op', '−'));
    eq.appendChild(el('div', 'numeral away-num', String(q.b)));
    eq.appendChild(el('div', 'op', '='));
    eq.appendChild(el('div', 'qmark', '?'));
    wrap.appendChild(eq);

    const pic = el('div', 'sub-pic');
    const stay = q.a - q.b;
    const step = Math.min(0.15, 1.2 / q.b); // all gone within ~2.8s
    let keepBox, awayBox;
    if (q.a <= 10) {
      const item = L.pick(Math.random, L.ITEMS).e;
      keepBox = objectsEl(stay, item, { size: 52, cols: Math.min(5, stay) });
      awayBox = objectsEl(q.b, item, { size: 52, cols: Math.min(5, q.b) });
      awayBox.querySelectorAll('.obj').forEach((o, i) => { o.classList.add('away'); o.style.setProperty('--d', (0.9 + i * step) + 's'); });
    } else {
      keepBox = dotsEl(stay, 'q');
      awayBox = dotsEl(q.b, 'q');
      awayBox.querySelectorAll('.dot').forEach((o, i) => { o.classList.add('away'); o.style.setProperty('--d', (0.9 + i * step) + 's'); });
    }
    keepBox.classList.add('keep');
    awayBox.classList.add('away-box');
    pic.appendChild(keepBox);
    pic.appendChild(awayBox);
    wrap.appendChild(pic);
    return wrap;
  }

  function answerBtn(value, content) {
    const b = el('button', 'answer');
    b.setAttribute('aria-label', String(value));
    b.appendChild(content);
    b.addEventListener('click', () => answer(b, value));
    return b;
  }

  function answer(btn, value) {
    if (busy) return;
    if (value === q.answer) {
      busy = true;
      btn.classList.add('right');
      $('answers').classList.add('locked');
      $('question').classList.add('locked');
      Sound.right();
      let change = null;
      if (round.firstTry) {
        change = L.recordFirstTry(profile, true);
        L.addCoins(data, profile, L.COIN_PER_RIGHT, 'right answer');
        round.coins += L.COIN_PER_RIGHT;
        flyCoin(btn);
      }
      save();
      Voice.say(L.pick(Math.random, L.PRAISE));
      round.i++;
      renderProgress();
      round.item = null;
      let wait = 1500;
      if (change === 'up') {
        wait += 1700;
        setTimeout(() => {
          levelUpFx();
          Voice.say(L.SAY.harder, true);
        }, 900);
      }
      setTimeout(nextQuestion, wait);
    } else {
      btn.classList.add('wrong');
      Sound.wrong();
      if (round.firstTry) {
        round.firstTry = false;
        L.recordFirstTry(profile, false);
        save();
      }
      Voice.say(L.pick(Math.random, L.RETRY));
    }
  }

  function finishRound() {
    L.addCoins(data, profile, L.ROUND_BONUS, 'round bonus');
    round.coins += L.ROUND_BONUS;
    save();
    const dc = $('done-coins');
    clear(dc);
    dc.appendChild(el('span', 'coin'));
    dc.appendChild(el('span', null, '+' + round.coins));
    renderPrizes($('done-prizes'), profile.coins);
    show('done');
    Sound.fanfare();
    confetti();
    Voice.say(L.SAY.roundDone);
  }

  // ---------- Prize list (pictures only, for the kids) ----------
  // Each prize: its picture, a bar filling up with the kid's coins, and its price.
  function renderPrizes(box, coins) {
    clear(box);
    data.rewards.slice().sort((a, b) => a.price - b.price).slice(0, 4).forEach((w) => {
      const ready = coins >= w.price;
      const p = el('div', 'prize' + (ready ? ' ready' : ''));
      p.appendChild(el('div', 'prize-pic', w.emoji));
      const bar = el('div', 'prize-bar');
      const fill = el('div', 'prize-fill');
      fill.style.width = Math.min(100, Math.round(coins / w.price * 100)) + '%';
      bar.appendChild(fill);
      p.appendChild(bar);
      const price = el('div', 'prize-price');
      price.appendChild(el('span', 'coin small'));
      price.appendChild(el('span', null, String(w.price)));
      p.appendChild(price);
      box.appendChild(p);
    });
  }

  // ---------- Effects ----------
  function flyCoin(fromEl) {
    const jar = $('jar');
    const a = fromEl.getBoundingClientRect();
    const b = jar.getBoundingClientRect();
    const c = el('span', 'coin fly-coin');
    c.style.left = (a.left + a.width / 2 - 23) + 'px';
    c.style.top = (a.top + a.height / 2 - 23) + 'px';
    $('fx').appendChild(c);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      c.style.transform = 'translate(' + (b.left + 20 - a.left - a.width / 2 + 23) + 'px,' + (b.top + 19 - a.top - a.height / 2 + 23) + 'px) scale(.8)';
    }));
    setTimeout(() => {
      c.remove();
      Sound.coin();
      renderJar();
      jar.classList.remove('bump'); void jar.offsetWidth; jar.classList.add('bump');
    }, 820);
  }

  function confetti() {
    const colors = ['#ff6b6b', '#ffcb2e', '#4cc96b', '#4a8df0', '#b06bff', '#ff8fd1'];
    for (let i = 0; i < 70; i++) {
      const c = el('div', 'confetti');
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = (1.8 + Math.random() * 1.8) + 's';
      c.style.animationDelay = (Math.random() * 0.6) + 's';
      $('fx').appendChild(c);
      setTimeout(() => c.remove(), 4500);
    }
  }

  function levelUpFx() {
    Sound.fanfare();
    const s = el('div', 'levelup', '🌟');
    $('fx').appendChild(s);
    setTimeout(() => s.remove(), 1700);
  }

  // ---------- Who is playing? ----------
  function renderProfiles() {
    const g = $('profile-grid');
    clear(g);
    data.profiles.forEach((p) => {
      const c = el('button', 'profile-card');
      c.setAttribute('aria-label', p.name);
      c.appendChild(el('span', 'pic', p.avatar));
      c.appendChild(el('span', 'name', p.name));
      const mc = el('span', 'mini-coins');
      mc.appendChild(el('span', 'coin small'));
      mc.appendChild(el('span', null, String(p.coins)));
      c.appendChild(mc);
      c.addEventListener('click', () => { Sound.tap(); startRound(p); });
      g.appendChild(c);
    });
    const add = el('button', 'profile-card add' + (data.profiles.length ? '' : ' bounce'));
    add.setAttribute('aria-label', 'Add a player');
    add.appendChild(el('span', 'pic', '+'));
    add.addEventListener('click', () => openGate('add'));
    g.appendChild(add);
  }

  function goProfiles(speak) {
    renderProfiles();
    show('profiles');
    if (speak) Voice.say(data.profiles.length ? L.SAY.whoPlays : L.SAY.noPlayers);
  }

  // ---------- Grown-up gate ----------
  let gate = null;
  function openGate(target) {
    gate = { target: target, q: L.adultQuestion(), typed: '' };
    $('gate-q').textContent = gate.q.a + ' × ' + gate.q.b + ' = ?';
    $('gate-display').textContent = '';
    $('gate-display').classList.remove('bad');
    show('gate');
  }
  function buildGatePad() {
    const pad = $('gate-pad');
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].forEach((k) => {
      const b = el('button', null, k);
      b.addEventListener('click', () => gateKey(k));
      pad.appendChild(b);
    });
  }
  function gateKey(k) {
    if (!gate) return;
    const d = $('gate-display');
    d.classList.remove('bad');
    if (k === '⌫') gate.typed = gate.typed.slice(0, -1);
    else if (k === '✓') {
      if (parseInt(gate.typed, 10) === gate.q.answer) {
        const t = gate.target; gate = null;
        if (t === 'add') openEdit(null, 'profiles');
        else openParent();
        return;
      }
      void d.offsetWidth; d.classList.add('bad');
      gate.q = L.adultQuestion(); gate.typed = '';
      $('gate-q').textContent = gate.q.a + ' × ' + gate.q.b + ' = ?';
    } else if (gate.typed.length < 3) gate.typed += k;
    d.textContent = gate.typed;
  }

  // ---------- Parent screen ----------
  const LEVEL_NAMES = { little: 'Little (counting)', big: 'Big (adding & taking away)' };

  function openParent() { renderParent(); show('parent'); }

  function renderParent() {
    $('app-version').textContent = APP_VERSION;
    // Players
    const pp = $('parent-profiles');
    clear(pp);
    if (!data.profiles.length) pp.appendChild(el('p', 'hint', 'No players yet.'));
    data.profiles.forEach((p) => {
      const r = el('div', 'row');
      r.appendChild(el('span', 'pic', p.avatar));
      const info = el('div', 'grow');
      info.appendChild(el('div', 'title', p.name));
      info.appendChild(el('div', 'sub', LEVEL_NAMES[p.level] + ' · step ' + (p.stage + 1) + ' of ' + L.TRACKS[p.level].length));
      r.appendChild(info);
      const pill = el('div', 'coins-pill');
      pill.appendChild(el('span', 'coin small'));
      pill.appendChild(el('span', null, String(p.coins)));
      r.appendChild(pill);
      r.appendChild(btn('Spend', 'primary', () => openSpend(p)));
      r.appendChild(btn('+1', '', () => { L.addCoins(data, p, 1, 'parent added'); save(); renderParent(); }));
      r.appendChild(btn('−1', '', () => { if (p.coins > 0) { L.addCoins(data, p, -1, 'parent removed'); save(); renderParent(); } }));
      r.appendChild(btn('Edit', '', () => openEdit(p, 'parent')));
      r.appendChild(btn('Delete', 'danger', () => {
        if (confirm('Delete ' + p.name + ' and their ' + p.coins + ' coins?')) {
          data.profiles = data.profiles.filter((x) => x.id !== p.id);
          save(); renderParent();
        }
      }));
      pp.appendChild(r);
    });

    // Rewards
    const rr = $('parent-rewards');
    clear(rr);
    data.rewards.forEach((w) => {
      const r = el('div', 'row');
      const em = el('input', 'remoji'); em.value = w.emoji; em.maxLength = 4;
      em.addEventListener('change', () => { w.emoji = em.value.trim() || '🎁'; save(); });
      const nm = el('input', 'rname'); nm.value = w.name; nm.maxLength = 30;
      nm.addEventListener('change', () => { w.name = nm.value.trim() || w.name; save(); });
      const pr = el('input', 'price'); pr.type = 'number'; pr.inputMode = 'numeric'; pr.min = '1'; pr.max = '999'; pr.value = w.price;
      pr.addEventListener('change', () => { const v = parseInt(pr.value, 10); if (v > 0) { w.price = Math.min(999, v); save(); } else pr.value = w.price; });
      const coin = el('span', 'coin small');
      r.appendChild(em); r.appendChild(nm); r.appendChild(pr); r.appendChild(coin);
      r.appendChild(btn('Delete', 'danger', () => {
        if (confirm('Delete the reward "' + w.name + '"?')) {
          data.rewards = data.rewards.filter((x) => x.id !== w.id); save(); renderParent();
        }
      }));
      rr.appendChild(r);
    });

    // Voices
    const sel = $('voice-select');
    clear(sel);
    const auto = el('option', null, 'Automatic (best Hebrew voice)'); auto.value = '';
    sel.appendChild(auto);
    const voices = L.hebrewVoices(Voice.list());
    $('voice-missing').classList.toggle('hidden', voices.length > 0);
    voices.forEach((v) => {
      const o = el('option', null, v.name + ' (' + v.lang + ')');
      o.value = v.voiceURI;
      sel.appendChild(o);
    });
    sel.value = data.voiceURI || '';
    if (sel.value !== (data.voiceURI || '')) sel.value = '';

    // Log
    const lg = $('parent-log');
    clear(lg);
    const recent = data.log.slice(-20).reverse();
    if (!recent.length) lg.appendChild(el('div', null, 'Nothing yet.'));
    recent.forEach((e) => {
      const p = data.profiles.find((x) => x.id === e.profileId);
      const when = new Date(e.t);
      const t = when.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
        when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      lg.appendChild(el('div', null, t + ' · ' + (p ? p.avatar + ' ' + p.name : '(deleted)') + ' · ' +
        (e.delta > 0 ? '+' : '') + e.delta + ' · ' + e.reason));
    });
  }

  function btn(label, kind, fn) {
    const b = el('button', 'text-btn' + (kind ? ' ' + kind : ''), label);
    b.addEventListener('click', fn);
    return b;
  }

  // Spend coins on a reward
  let spendFor = null;
  function openSpend(p) { spendFor = p; renderSpend(); $('spend-sheet').classList.remove('hidden'); }
  function renderSpend() {
    const p = spendFor;
    $('spend-title').textContent = p.avatar + ' ' + p.name + ' has ' + p.coins + ' coins';
    const list = $('spend-list');
    clear(list);
    if (!data.rewards.length) list.appendChild(el('p', 'hint', 'Add a reward first.'));
    data.rewards.forEach((w) => {
      const r = el('div', 'row');
      r.appendChild(el('span', 'pic', w.emoji));
      const info = el('div', 'grow');
      info.appendChild(el('div', 'title', w.name));
      info.appendChild(el('div', 'sub', w.price + ' coins'));
      r.appendChild(info);
      const b = btn('Buy', 'primary', () => {
        if (p.coins < w.price) return;
        L.addCoins(data, p, -w.price, 'reward: ' + w.emoji + ' ' + w.name);
        save();
        Sound.coin();
        renderSpend(); renderParent();
      });
      if (p.coins < w.price) { b.disabled = true; b.style.opacity = '.4'; }
      r.appendChild(b);
      list.appendChild(r);
    });
  }

  // ---------- Add / edit a player ----------
  let editing = null;
  function openEdit(p, returnTo) {
    editing = { id: p ? p.id : null, name: p ? p.name : '', avatar: p ? p.avatar : L.AVATARS[0], level: p ? p.level : 'little', returnTo: returnTo };
    $('edit-title').textContent = p ? 'Edit player' : 'New player';
    $('edit-name').value = editing.name;
    const av = $('edit-avatars');
    clear(av);
    L.AVATARS.forEach((a) => {
      const b = el('button', a === editing.avatar ? 'sel' : '', a);
      b.addEventListener('click', () => {
        editing.avatar = a;
        av.querySelectorAll('button').forEach((x) => x.classList.toggle('sel', x === b));
      });
      av.appendChild(b);
    });
    document.querySelectorAll('.level-btn').forEach((b) => b.classList.toggle('sel', b.dataset.level === editing.level));
    show('profile-edit');
  }
  function saveEdit() {
    const name = $('edit-name').value.trim();
    if (!name) { $('edit-name').focus(); $('edit-name').style.borderColor = 'var(--red)'; return; }
    $('edit-name').style.borderColor = '';
    if (editing.id) {
      const p = data.profiles.find((x) => x.id === editing.id);
      if (p) {
        if (p.level !== editing.level) { p.level = editing.level; p.stage = 0; p.streak = 0; p.misses = 0; }
        p.name = name; p.avatar = editing.avatar;
      }
    } else {
      data.profiles.push({ id: L.newId('p'), name: name, avatar: editing.avatar, level: editing.level, stage: 0, streak: 0, misses: 0, coins: 0, created: Date.now() });
    }
    save();
    closeEdit();
  }
  function closeEdit() {
    const back = editing ? editing.returnTo : 'profiles';
    editing = null;
    if (back === 'parent') openParent(); else goProfiles(false);
  }

  // ---------- Updates (new version from GitHub Pages) ----------
  let pendingReload = false;
  function maybeReloadForUpdate() {
    if (pendingReload && (currentScreen === 'start' || currentScreen === 'profiles')) {
      pendingReload = false;
      location.reload();
    }
  }
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    let hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) { hadController = true; return; } // first install: nothing to refresh
      pendingReload = true;
      maybeReloadForUpdate();
    });
    navigator.serviceWorker.register('sw.js').then((reg) => {
      // Home Screen apps resume without reloading, so check for a new version when we come back.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    }).catch(() => {});
  }

  // ---------- Wire up ----------
  function init() {
    Voice.init();
    buildGatePad();

    $('btn-start').addEventListener('click', () => {
      Sound.unlock();
      Voice.unlock();
      Voice.refresh();
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      goProfiles(true);
    });
    $('btn-parent').addEventListener('click', () => openGate('parent'));
    $('btn-home').addEventListener('click', () => { if (window.speechSynthesis) speechSynthesis.cancel(); goProfiles(false); });
    $('btn-say').addEventListener('click', () => { if (q) Voice.say(q.say); });
    $('btn-again').addEventListener('click', () => startRound(profile));
    $('btn-done-home').addEventListener('click', () => goProfiles(true));
    $('btn-gate-cancel').addEventListener('click', () => { gate = null; goProfiles(false); });
    $('btn-parent-close').addEventListener('click', () => goProfiles(false));
    $('btn-add-profile').addEventListener('click', () => openEdit(null, 'parent'));
    $('btn-edit-cancel').addEventListener('click', closeEdit);
    $('btn-edit-save').addEventListener('click', saveEdit);
    document.querySelectorAll('.level-btn').forEach((b) => b.addEventListener('click', () => {
      editing.level = b.dataset.level;
      document.querySelectorAll('.level-btn').forEach((x) => x.classList.toggle('sel', x === b));
    }));
    $('btn-spend-close').addEventListener('click', () => { $('spend-sheet').classList.add('hidden'); spendFor = null; });
    $('btn-add-reward').addEventListener('click', () => {
      const name = $('new-reward-name').value.trim();
      const price = parseInt($('new-reward-price').value, 10);
      if (!name || !(price > 0)) return;
      data.rewards.push({ id: L.newId('r'), emoji: $('new-reward-emoji').value.trim() || '🎁', name: name, price: Math.min(999, price) });
      $('new-reward-name').value = ''; $('new-reward-price').value = ''; $('new-reward-emoji').value = '';
      save(); renderParent();
    });
    $('voice-select').addEventListener('change', (e) => {
      data.voiceURI = e.target.value || null;
      save(); Voice.refresh();
    });
    $('btn-voice-test').addEventListener('click', () => { Sound.unlock(); Voice.say(L.SAY.test); });

    // Stop pinch-zoom (double-tap zoom is already off via touch-action in the CSS).
    document.addEventListener('gesturestart', (e) => e.preventDefault());

    registerSW();
  }

  // For automated tests only.
  window.__FWM_TEST__ = {
    get data() { return data; }, get q() { return q; }, get round() { return round; },
    get screen() { return currentScreen; }, APP_VERSION: APP_VERSION
  };

  init();
})();
