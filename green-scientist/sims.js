/* Green Scientist — interactive simulations and drawings.
 * Each simulation: GS.sim(name, (box, game, done) => {...}). Call done() when the child has
 * really tried the idea (not just opened it). Animations stop by themselves when the page changes.
 */
(function () {
  'use strict';
  const GS = window.GS;
  const { h, toast, celebrate } = GS;
  const NS = 'http://www.w3.org/2000/svg';

  function s(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function svgBox(w, hgt, cls) {
    return s('svg', { viewBox: '0 0 ' + w + ' ' + hgt, class: 'sim-svg ' + (cls || ''), preserveAspectRatio: 'xMidYMid meet' });
  }
  function text(parent, x, y, str, attrs) {
    const t = s('text', Object.assign({ x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, attrs || {}), parent);
    t.textContent = str;
    return t;
  }
  function loop(box, fn) {
    let last = performance.now();
    function frame(now) {
      if (!box.isConnected) return; // left the page
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (fn(dt, now / 1000) === false) return; // finished
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function controls() { return h('div', { class: 'sim-controls' }); }
  function btn(label, onclick, cls) { return h('button', { class: 'btn ' + (cls || 'ghost'), onclick }, label); }
  function seg(options, value, onchange) {
    const wrap = h('div', { class: 'seg' });
    options.forEach((o) => {
      const b = h('button', { class: 'seg-btn' + (o.v === value ? ' on' : ''), onclick: () => {
        wrap.querySelectorAll('.seg-btn').forEach((x) => x.classList.remove('on'));
        b.classList.add('on'); onchange(o.v);
      } }, o.t);
      wrap.appendChild(b);
    });
    return wrap;
  }
  function message(box) {
    const m = h('div', { class: 'sim-msg' });
    box.appendChild(m);
    return (t, kind) => { m.className = 'sim-msg ' + (kind || ''); m.textContent = ''; m.appendChild(GS.fmt(t)); };
  }
  function arrow(parent, x1, y1, x2, y2, color, width) {
    const g = s('g', {}, parent);
    s('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': width || 6, 'stroke-linecap': 'round' }, g);
    const a = Math.atan2(y2 - y1, x2 - x1), L = 16;
    s('polygon', { points: [x2, y2, x2 - L * Math.cos(a - 0.5), y2 - L * Math.sin(a - 0.5), x2 - L * Math.cos(a + 0.5), y2 - L * Math.sin(a + 0.5)].join(','), fill: color }, g);
    return g;
  }

  // Shared with sims-2.js and later simulation files.
  GS.simKit = { s, svgBox, text, loop, controls, btn, seg, message, arrow };

  // =====================================================================
  // 🪐 Solar system: planets go around the Sun, the Moon goes around the Earth.
  // =====================================================================
  GS.sim('orbit', (box, g, done) => {
    const W = 600, H = 600, cx = 300, cy = 300;
    const svg = svgBox(W, H, 'square');
    s('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#0b1530' }, svg);
    for (let i = 0; i < 90; i++) s('circle', { cx: Math.random() * W, cy: Math.random() * H, r: Math.random() * 1.4 + 0.3, fill: '#fff', opacity: 0.6 }, svg);
    const bodies = [
      { id: 'mercury', name: 'כוכב חמה', color: '#b5a99a', size: 5, orbit: 52, period: 0.24, fact: 'הכי קרוב לשמש וגם הכי קטן מכל כוכבי הלכת.' },
      { id: 'venus', name: 'נוגה', color: '#e8c27a', size: 8, orbit: 80, period: 0.62, fact: 'כוכב הלכת הכי חם. בערב ובבוקר הוא נראה בשמיים כמו "כוכב" בוהק מאוד, אבל הוא כוכב לכת.' },
      { id: 'earth', name: 'כדור הארץ', color: '#3f8cff', size: 8.5, orbit: 110, period: 1, fact: 'הבית שלנו! כוכב לכת שמסתובב סביב השמש. סיבוב שלם אחד לוקח שנה.' },
      { id: 'mars', name: 'מאדים', color: '#d8572a', size: 6.5, orbit: 140, period: 1.88, fact: 'כוכב הלכת האדום, הרביעי מהשמש. סיבוב אחד סביב השמש לוקח לו כמעט שנתיים שלנו.' },
      { id: 'jupiter', name: 'צדק', color: '#d9a066', size: 19, orbit: 185, period: 11.9, fact: 'הענק של מערכת השמש: כל שאר כוכבי הלכת היו נכנסים בתוכו.' },
      { id: 'saturn', name: 'שבתאי', color: '#e6cf8b', size: 15, orbit: 228, period: 29.5, ring: true, fact: 'מפורסם בטבעות שלו, שעשויות מהמון חתיכות קרח וסלע.' },
      { id: 'uranus', name: 'אורנוס', color: '#8fd6e0', size: 10, orbit: 262, period: 84, fact: 'מסתובב "על הצד", כמו כדור שמתגלגל על הרצפה.' },
      { id: 'neptune', name: 'נפטון', color: '#4b6bdb', size: 10, orbit: 290, period: 165, fact: 'הכי רחוק מהשמש. סיבוב אחד סביבה לוקח לו 165 שנים!' }
    ];
    bodies.forEach((b) => s('circle', { cx, cy, r: b.orbit, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.13, 'stroke-width': 1.5 }, svg));
    const glow = s('circle', { cx, cy, r: 34, fill: '#ffcf3f', opacity: 0.25 }, svg);
    const sun = s('circle', { cx, cy, r: 24, fill: '#ffcf3f', class: 'tap' }, svg);
    const found = new Set();
    const info = h('div', { class: 'sim-msg' }, 'לוחצים על השמש, על כוכבי הלכת או על הירח כדי לגלות עליהם עוד. גלו לפחות 5!');
    function tell(id, name, fact) {
      info.innerHTML = '';
      info.appendChild(h('b', null, name + ': '));
      info.appendChild(GS.fmt(fact));
      found.add(id);
      if (found.size === 5) { celebrate(); toast('גיליתם 5! אתם חוקרי חלל 🚀', 'good'); done(); GS.showAfter(); }
    }
    sun.addEventListener('click', () => tell('sun', 'השמש', 'השמש היא {{כוכב}}: כדור ענק של גז לוהט שמאיר וחם בעצמו. כל כוכבי הלכת מסתובבים סביבה.'));
    bodies.forEach((b) => {
      b.g = s('g', { class: 'tap' }, svg);
      if (b.ring) s('ellipse', { cx: 0, cy: 0, rx: b.size * 1.9, ry: b.size * 0.6, fill: 'none', stroke: '#e6cf8b', 'stroke-width': 3 }, b.g);
      s('circle', { cx: 0, cy: 0, r: b.size, fill: b.color }, b.g);
      s('circle', { cx: 0, cy: 0, r: Math.max(b.size + 10, 20), fill: 'transparent' }, b.g);
      b.angle = Math.random() * Math.PI * 2;
      b.g.addEventListener('click', () => tell(b.id, b.name, b.fact + ' זה {{כוכב לכת}}: הוא לא מאיר בעצמו. אנחנו רואים אותו כי השמש מאירה עליו.'));
    });
    const earth = bodies[2];
    const moon = s('g', { class: 'tap' }, svg);
    s('circle', { cx: 0, cy: 0, r: 3.5, fill: '#ddd' }, moon);
    s('circle', { cx: 0, cy: 0, r: 14, fill: 'transparent' }, moon);
    let moonAngle = 0;
    moon.addEventListener('click', () => tell('moon', 'הירח', 'הירח מסתובב סביב כדור הארץ, לא סביב השמש ישירות. הוא לא כוכב ולא כוכב לכת. קוראים לו {{ירח}}.'));
    let speed = 1, playing = true;
    loop(box, (dt) => {
      if (!playing) return;
      bodies.forEach((b) => {
        b.angle -= dt * speed * (2 * Math.PI) / (6 * Math.pow(b.period, 0.55));
        b.x = cx + b.orbit * Math.cos(b.angle); b.y = cy + b.orbit * Math.sin(b.angle);
        b.g.setAttribute('transform', 'translate(' + b.x.toFixed(1) + ',' + b.y.toFixed(1) + ')');
      });
      moonAngle -= dt * speed * 2 * Math.PI / 1.2;
      moon.setAttribute('transform', 'translate(' + (earth.x + 18 * Math.cos(moonAngle)).toFixed(1) + ',' + (earth.y + 18 * Math.sin(moonAngle)).toFixed(1) + ')');
      glow.setAttribute('r', 34 + Math.sin(performance.now() / 400) * 3);
    });
    box.appendChild(svg);
    box.appendChild(info);
    const c = controls();
    const pb = btn('⏸ עצירה', () => { playing = !playing; pb.textContent = playing ? '⏸ עצירה' : '▶ המשך'; });
    c.appendChild(pb);
    c.appendChild(seg([{ t: '🐢 לאט', v: 0.4 }, { t: 'רגיל', v: 1 }, { t: '🐇 מהר', v: 3 }], 1, (v) => { speed = v; }));
    box.appendChild(c);
    box.appendChild(h('p', { class: 'hint' }, 'הציור לא בקנה מידה אמיתי: באמת המרחקים עצומים, והשמש הרבה יותר גדולה.'));
  });

  // =====================================================================
  // 🔺 Triangle vs square: push from the side. The square folds, the triangle holds.
  // =====================================================================
  GS.sim('shapes', (box, g, done) => {
    const W = 600, H = 320, L = 150;
    const svg = svgBox(W, H);
    s('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#fff7e6' }, svg);
    s('line', { x1: 20, y1: 270, x2: 580, y2: 270, stroke: '#c9b48a', 'stroke-width': 4 }, svg);
    const sq = s('g', {}, svg), tri = s('g', {}, svg);
    const pushA = s('g', { opacity: 0 }, svg), pushB = s('g', { opacity: 0 }, svg);
    let angle = 90, target = 90, diag = false, wob = 0;
    const say = message(box);
    function stick(p, a, b) { s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#b07a3b', 'stroke-width': 7, 'stroke-linecap': 'round' }, p); }
    function gum(p, a, c) { s('circle', { cx: a[0], cy: a[1], r: 12, fill: c }, p); }
    function draw() {
      sq.innerHTML = ''; tri.innerHTML = '';
      const r = angle * Math.PI / 180;
      const bl = [380, 270], br = [380 + L, 270];
      const tl = [bl[0] + L * Math.cos(r), 270 - L * Math.sin(r)], tr = [tl[0] + L, tl[1]];
      stick(sq, bl, br); stick(sq, br, tr); stick(sq, tr, tl); stick(sq, tl, bl);
      if (diag) stick(sq, bl, tr);
      [bl, br, tr, tl].forEach((p, i) => gum(sq, p, ['#ff5d73', '#4cc96b', '#ffcb2e', '#4a8df0'][i]));
      const t0 = [70, 270], t1 = [70 + L, 270], t2 = [70 + L / 2 + wob, 270 - L * 0.866];
      stick(tri, t0, t1); stick(tri, t1, t2); stick(tri, t2, t0);
      [t0, t1, t2].forEach((p, i) => gum(tri, p, ['#ff5d73', '#4cc96b', '#ffcb2e'][i]));
    }
    pushA.appendChild(arrow(s('g', {}, pushA), 300, 150, 360, 150, '#e24b4b', 7));
    pushB.appendChild(arrow(s('g', {}, pushB), 10, 170, 64, 170, '#e24b4b', 7));
    loop(box, () => {
      if (Math.abs(angle - target) > 0.3) angle += (target - angle) * 0.08;
      wob *= 0.85;
      draw();
    });
    function press() {
      pushA.setAttribute('opacity', 1); pushB.setAttribute('opacity', 1);
      setTimeout(() => { pushA.setAttribute('opacity', 0); pushB.setAttribute('opacity', 0); }, 900);
      wob = 6;
      if (diag) {
        target = 90;
        say('עם הקיסם באלכסון הריבוע הפך ל{{שני משולשים}}, ועכשיו גם הוא חזק! 💪 בגלל זה בונים כיפות ממשולשים.', 'good');
        celebrate(); done(); GS.showAfter();
      } else {
        target = 32;
        say('הריבוע נמעך והפך למעוין 😮, אבל המשולש נשאר בדיוק אותו משולש. {{משולש לא משנה צורה}} כשלוחצים עליו.', '');
      }
    }
    say('לוחצים על "דוחפים מהצד" ורואים מה קורה לכל צורה.');
    box.appendChild(svg);
    const c = controls();
    c.appendChild(btn('👉 דוחפים מהצד', press, 'primary'));
    c.appendChild(btn('➕ קיסם באלכסון לריבוע', () => { diag = true; target = 90; say('הוספנו קיסם באלכסון. עכשיו דוחפים שוב!'); }));
    c.appendChild(btn('🔄 מההתחלה', () => { diag = false; target = 90; say('לוחצים על "דוחפים מהצד" ורואים מה קורה לכל צורה.'); }));
    box.appendChild(c);
  });

  // =====================================================================
  // 🦘 Jumping on Mars and on the Moon: weaker gravity, higher jumps, "lighter" body.
  // =====================================================================
  GS.sim('marsJump', (box, g, done) => {
    let kg = 20, cm = 30;
    const places = [
      { name: 'כדור הארץ', e: '🌍', g: 1, ground: '#7bc96f', sky: '#bfe3ff' },
      { name: 'מאדים', e: '🔴', g: 0.38, ground: '#c9663b', sky: '#f2c6a0' },
      { name: 'הירח', e: '🌙', g: 0.165, ground: '#b9b9b9', sky: '#2a2f45' }
    ];
    const W = 600, H = 380, top = 40, ground = 330;
    const svg = svgBox(W, H);
    const cols = places.map((p, i) => {
      const x0 = i * 200;
      s('rect', { x: x0 + 4, y: 0, width: 192, height: H, rx: 18, fill: p.sky }, svg);
      s('rect', { x: x0 + 4, y: ground, width: 192, height: H - ground, fill: p.ground }, svg);
      text(svg, x0 + 100, 20, p.e + ' ' + p.name, { 'font-size': 20, 'font-weight': 700, fill: i === 2 ? '#fff' : '#23324a' });
      const mark = s('line', { x1: x0 + 30, x2: x0 + 170, y1: ground, y2: ground, stroke: '#fff', 'stroke-width': 3, 'stroke-dasharray': '8 6', opacity: 0 }, svg);
      const label = text(svg, x0 + 100, ground - 10, '', { 'font-size': 18, 'font-weight': 700, fill: i === 2 ? '#fff' : '#23324a' });
      const kid = text(svg, x0 + 100, ground - 28, '🧒', { 'font-size': 44 });
      return { p, mark, label, kid, x0 };
    });
    const out = h('div', { class: 'sim-msg' });
    function heights() { return places.map((p) => cm / p.g); }
    function update() {
      out.innerHTML = '';
      const hs = heights();
      out.appendChild(h('div', { class: 'jump-table' }, places.map((p, i) => h('div', null,
        h('b', null, p.e + ' ' + p.name), h('br'),
        'מרגישים כמו ', h('b', null, Math.round(kg * p.g) + ' ק״ג'), h('br'),
        'קופצים ', h('b', null, Math.round(hs[i]) + ' ס״מ')))));
    }
    function jump() {
      const hs = heights(), max = Math.max.apply(null, hs);
      const scale = (ground - top - 70) / max;
      const t0 = performance.now();
      const dur = hs.map((x) => 0.9 + Math.sqrt(x / max) * 1.6);
      cols.forEach((c, i) => {
        c.mark.setAttribute('y1', ground - 28 - hs[i] * scale); c.mark.setAttribute('y2', ground - 28 - hs[i] * scale);
        c.mark.setAttribute('opacity', 0);
        c.label.textContent = '';
      });
      loop(box, function step() {
        const t = (performance.now() - t0) / 1000;
        let all = true;
        cols.forEach((c, i) => {
          const u = Math.min(1, t / dur[i]);
          if (u < 1) all = false;
          const y = 4 * u * (1 - u) * hs[i] * scale;
          c.kid.setAttribute('y', ground - 28 - y);
          if (u > 0.45) { c.mark.setAttribute('opacity', 1); c.label.textContent = Math.round(hs[i]) + ' ס״מ'; c.label.setAttribute('y', ground - 28 - hs[i] * scale - 34); }
        });
        if (all) { done(); GS.showAfter(); return false; }
      });
    }
    box.appendChild(svg);
    box.appendChild(out);
    const c = controls();
    const kgLabel = h('span', { class: 'num' }, kg + ' ק״ג');
    const cmLabel = h('span', { class: 'num' }, cm + ' ס״מ');
    c.appendChild(h('div', { class: 'stepper' }, h('span', null, 'כמה אני שוקל:'),
      btn('−', () => { kg = Math.max(10, kg - 2); kgLabel.textContent = kg + ' ק״ג'; update(); }), kgLabel,
      btn('+', () => { kg = Math.min(80, kg + 2); kgLabel.textContent = kg + ' ק״ג'; update(); })));
    c.appendChild(h('div', { class: 'stepper' }, h('span', null, 'כמה גבוה אני קופץ בבית:'),
      btn('−', () => { cm = Math.max(10, cm - 5); cmLabel.textContent = cm + ' ס״מ'; update(); }), cmLabel,
      btn('+', () => { cm = Math.min(80, cm + 5); cmLabel.textContent = cm + ' ס״מ'; update(); })));
    c.appendChild(btn('🦘 קופצים!', jump, 'primary'));
    box.appendChild(c);
    update();
  });

  // =====================================================================
  // 🧱 Push the wall: action and reaction. On skates you roll back; in shoes friction holds you.
  // =====================================================================
  GS.sim('pushWall', (box, g, done) => {
    const W = 600, H = 300, floor = 250, wallX = 520;
    const svg = svgBox(W, H);
    s('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#eef6ff' }, svg);
    s('rect', { x: 0, y: floor, width: W, height: H - floor, fill: '#d9c7a7' }, svg);
    s('rect', { x: wallX, y: 30, width: 70, height: floor - 30, fill: '#b85c38' }, svg);
    for (let r = 0; r < 7; r++) for (let k = 0; k < 2; k++) s('rect', { x: wallX + (r % 2 ? 0 : 18) + k * 36, y: 34 + r * 31, width: 34, height: 28, fill: 'none', stroke: '#8f4426', 'stroke-width': 2 }, svg);
    const kid = s('g', {}, svg);
    const body = text(kid, 0, -45, '🧒', { 'font-size': 64 });
    const feet = text(kid, 0, -6, '🛼', { 'font-size': 30 });
    const hand = s('line', { x1: 18, y1: -60, x2: 40, y2: -60, stroke: '#f2b58b', 'stroke-width': 9, 'stroke-linecap': 'round' }, kid);
    const arrows = s('g', { opacity: 0 }, svg);
    let x = wallX - 52, vx = 0, skates = true;
    const say = message(box);
    function placeKid() { kid.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + floor + ')'); }
    loop(box, (dt) => {
      if (vx) {
        x -= vx * dt;
        vx = Math.max(0, vx - (skates ? 90 : 2000) * dt);
        if (x < 40) { x = 40; vx = 0; }
      }
      placeKid();
    });
    function push(strength) {
      if (x < wallX - 60) { x = wallX - 52; vx = 0; }
      arrows.innerHTML = '';
      const len = strength === 'strong' ? 110 : 55;
      arrow(arrows, wallX - 28 - len, 95, wallX - 4, 95, '#e24b4b', strength === 'strong' ? 9 : 6);
      text(arrows, wallX - 60 - len / 2, 70, 'פעולה: אני דוחף את הקיר', { 'font-size': 16, fill: '#b42323', 'font-weight': 700 });
      arrow(arrows, wallX - 4, 140, wallX - 28 - len, 140, '#2f66c0', strength === 'strong' ? 9 : 6);
      text(arrows, wallX - 60 - len / 2, 165, 'תגובה: הקיר דוחף אותי', { 'font-size': 16, fill: '#2f66c0', 'font-weight': 700 });
      arrows.setAttribute('opacity', 1);
      setTimeout(() => arrows.setAttribute('opacity', 0), 1800);
      hand.setAttribute('x2', 52);
      setTimeout(() => hand.setAttribute('x2', 40), 300);
      if (skates) {
        vx = strength === 'strong' ? 260 : 130;
        say(strength === 'strong'
          ? 'דחיפה חזקה → {{הקיר דוחף בחזרה חזק}}, ונוסעים רחוק אחורה! 🛼💨'
          : 'דחיפה עדינה → הקיר דוחף בחזרה בעדינות, ונוסעים קצת אחורה.', 'good');
        if (strength === 'strong') { done(); GS.showAfter(); }
      } else {
        vx = 30;
        say('בנעליים כמעט לא זזים: {{החיכוך}} עם הרצפה מחזיק אותנו. אבל הקיר עדיין דוחף אותנו בחזרה! מרגישים את זה בידיים.', '');
      }
    }
    placeKid();
    say('עומדים ליד הקיר. לוחצים על דחיפה ומסתכלים על החיצים: פעולה ותגובה.');
    box.appendChild(svg);
    const c = controls();
    c.appendChild(seg([{ t: '🛼 על גלגיליות', v: true }, { t: '👟 בנעליים', v: false }], true, (v) => { skates = v; feet.textContent = v ? '🛼' : '👟'; x = wallX - 52; vx = 0; }));
    c.appendChild(btn('✋ דחיפה עדינה', () => push('soft')));
    c.appendChild(btn('💪 דחיפה חזקה', () => push('strong'), 'primary'));
    box.appendChild(c);
  });

  // =====================================================================
  // 🎈 Balloon rocket on a string: air goes one way, the balloon goes the other way.
  // =====================================================================
  GS.sim('balloon', (box, g, done) => {
    const W = 600, H = 260, y = 90;
    const svg = svgBox(W, H);
    s('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#f3fbff' }, svg);
    text(svg, 22, y - 30, '🪑', { 'font-size': 40 }); text(svg, 578, y - 30, '🪑', { 'font-size': 40 });
    s('line', { x1: 30, y1: y, x2: 570, y2: y, stroke: '#888', 'stroke-width': 2 }, svg);
    const rocket = s('g', {}, svg);
    s('rect', { x: -30, y: -6, width: 60, height: 12, rx: 6, fill: '#ffd34d' }, rocket);
    const balloon = s('ellipse', { cx: 0, cy: 40, rx: 30, ry: 22, fill: '#ff5d73' }, rocket);
    const nozzle = s('polygon', { points: '30,40 44,32 44,48', fill: '#d9445a' }, rocket);
    const puffs = s('g', {}, svg);
    let air = 0, x = 470, vx = 0, best = 0, lastDist = 0, startX = 470, flying = false;
    const particles = [];
    const say = message(box);
    function shape() {
      const rx = 22 + air * 9, ry = 16 + air * 6;
      balloon.setAttribute('rx', rx); balloon.setAttribute('ry', ry); balloon.setAttribute('cy', 16 + ry);
      nozzle.setAttribute('points', [rx, 16 + ry, rx + 14, 8 + ry, rx + 14, 24 + ry].join(','));
    }
    loop(box, (dt) => {
      if (flying) {
        if (air > 0) {
          air = Math.max(0, air - dt * 2.2);
          vx += 520 * dt;
          for (let k = 0; k < 2; k++) particles.push({ x: x + 22 + air * 9 + 14, y: y + 30 + air * 6, vx: 160 + Math.random() * 80, vy: (Math.random() - 0.5) * 60, life: 0.6 });
        }
        vx = Math.max(0, vx - 140 * dt);
        x -= vx * dt;
        if (x < 70) { x = 70; vx = 0; }
        if (air === 0 && vx === 0) {
          flying = false;
          lastDist = Math.round((startX - x) / 5);
          best = Math.max(best, lastDist);
          say('הבלון נסע ' + lastDist + ' ס״מ. ' + (lastDist >= 60 ? 'וואו! עם הרבה אוויר הוא {{נדחף חזק יותר}} ונוסע רחוק יותר. 🚀' : 'נסו לנפח יותר: יותר אוויר שנדחף החוצה = דחיפה חזקה יותר לבלון.'), 'good');
          if (lastDist >= 40) { done(); GS.showAfter(); }
        }
        shape();
      }
      puffs.innerHTML = '';
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        s('circle', { cx: p.x, cy: p.y, r: 4 + (0.6 - p.life) * 10, fill: '#9ec9ff', opacity: p.life }, puffs);
      }
      rocket.setAttribute('transform', 'translate(' + x.toFixed(1) + ',' + y + ')');
    });
    shape();
    say('מנפחים את הבלון (כמה פעמים שרוצים), ואז משחררים. לאן הולך האוויר? ולאן נוסע הבלון?');
    box.appendChild(svg);
    const c = controls();
    c.appendChild(btn('🎈 מנפחים', () => {
      if (flying) return;
      if (x < 300) { x = 470; }
      air = Math.min(5, air + 1); shape();
      say('בבלון יש ' + air + ' נשיפות אוויר. ' + (air < 5 ? 'אפשר עוד!' : 'מלא לגמרי!'));
    }, 'ghost'));
    c.appendChild(btn('🚀 משחררים!', () => {
      if (flying) return;
      if (air < 1) { say('קודם מנפחים 🙂'); return; }
      startX = x; vx = 0; flying = true;
      say('האוויר נדחף החוצה {{ימינה}} ➡️, והאוויר דוחף את הבלון {{שמאלה}} ⬅️. פעולה ותגובה!');
    }, 'primary'));
    box.appendChild(c);
  });

  // =====================================================================
  // 🚁 Helicopter from above: without the tail rotor the body spins the other way.
  // =====================================================================
  GS.sim('helicopter', (box, g, done) => {
    const W = 600, H = 420, cx = 260, cy = 210;
    const svg = svgBox(W, H);
    s('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#e9f6e5' }, svg);
    for (let i = 0; i < 14; i++) text(svg, 20 + Math.random() * 440, 20 + Math.random() * 380, '🌳', { 'font-size': 26, opacity: 0.5 });
    const heli = s('g', {}, svg);
    const shadowScale = s('g', {}, heli);
    s('rect', { x: 20, y: -7, width: 150, height: 14, rx: 7, fill: '#4a8df0' }, shadowScale);
    const tailRotor = s('g', { transform: 'translate(170,0)' }, shadowScale);
    s('rect', { x: -4, y: -22, width: 8, height: 44, rx: 4, fill: '#333' }, tailRotor);
    s('ellipse', { cx: 0, cy: 0, rx: 70, ry: 48, fill: '#2f66c0' }, shadowScale);
    s('ellipse', { cx: -30, cy: 0, rx: 26, ry: 30, fill: '#bfe3ff' }, shadowScale);
    const rotor = s('g', {}, shadowScale);
    s('rect', { x: -150, y: -7, width: 300, height: 14, rx: 7, fill: '#222', opacity: 0.85 }, rotor);
    s('rect', { x: -7, y: -150, width: 14, height: 300, rx: 7, fill: '#222', opacity: 0.85 }, rotor);
    s('circle', { cx: 0, cy: 0, r: 12, fill: '#555' }, rotor);
    const tailAir = s('g', { opacity: 0 }, shadowScale);
    arrow(tailAir, 170, 30, 170, 80, '#7fb3ff', 6);
    // altitude meter
    s('rect', { x: 540, y: 40, width: 30, height: 340, rx: 15, fill: '#fff', stroke: '#c9d6e8' }, svg);
    const alt = s('rect', { x: 544, y: 376, width: 22, height: 0, rx: 11, fill: '#4cc96b' }, svg);
    text(svg, 555, 22, '⬆️ גובה', { 'font-size': 16, 'font-weight': 700 });
    let mainOn = false, tailOn = true, rotorAng = 0, rotorSpeed = 0, bodyAng = 0, bodyW = 0, height = 0;
    let sawSpin = false, sawStable = false;
    const say = message(box);
    loop(box, (dt) => {
      rotorSpeed += ((mainOn ? 900 : 0) - rotorSpeed) * Math.min(1, dt * 1.5);
      rotorAng = (rotorAng - rotorSpeed * dt) % 360; // rotor turns one way…
      const spinUp = rotorSpeed / 900;
      if (!tailOn) bodyW += spinUp * 140 * dt; // …so the body is pushed the other way
      bodyW *= tailOn ? Math.pow(0.05, dt) : Math.pow(0.85, dt);
      bodyW = Math.min(bodyW, 260);
      bodyAng = (bodyAng + bodyW * dt) % 360;
      height += ((mainOn && rotorSpeed > 600 ? 1 : 0) - height) * dt * 0.8;
      alt.setAttribute('height', (height * 330).toFixed(1));
      alt.setAttribute('y', (376 - height * 330).toFixed(1));
      rotor.setAttribute('transform', 'rotate(' + rotorAng.toFixed(1) + ')');
      tailRotor.firstChild.setAttribute('transform', tailOn && mainOn ? 'rotate(' + ((performance.now() / 2) % 360) + ')' : '');
      tailAir.setAttribute('opacity', tailOn && mainOn ? 0.9 : 0);
      const sc = 1 + height * 0.15;
      heli.setAttribute('transform', 'translate(' + cx + ',' + cy + ') rotate(' + bodyAng.toFixed(1) + ') scale(' + sc.toFixed(3) + ')');
      if (mainOn && !tailOn && bodyW > 120 && !sawSpin) {
        sawSpin = true;
        say('😵 {{סחרור!}} הלהבים מסתובבים לכיוון אחד, ובתגובה גוף המסוק מסתובב לכיוון ההפוך. עכשיו הדליקו את המדחף האחורי!', 'bad');
        check();
      }
      if (mainOn && tailOn && rotorSpeed > 700 && bodyW < 5 && sawSpin && !sawStable) {
        sawStable = true;
        say('😎 יציב! המדחף האחורי דוחף אוויר הצידה, וזה {{מבטל את הסחרור}}. ככה המסוק טס ישר.', 'good');
        check();
      }
    });
    function check() { if (sawSpin && sawStable) { celebrate(); done(); GS.showAfter(); } }
    say('מדליקים את הרוטור הראשי. הלהבים דוחפים אוויר למטה ⬇️, והאוויר דוחף את המסוק למעלה ⬆️. אחר כך נסו לכבות את המדחף האחורי.');
    box.appendChild(svg);
    const c = controls();
    const mb = btn('⚙️ רוטור ראשי: כבוי', () => {
      mainOn = !mainOn; mb.textContent = '⚙️ רוטור ראשי: ' + (mainOn ? 'פועל' : 'כבוי'); mb.classList.toggle('primary', mainOn); mb.classList.toggle('ghost', !mainOn);
      if (mainOn) say('המסוק עולה! הלהבים דוחפים אוויר {{למטה}}, והאוויר דוחף אותם {{למעלה}}.' + (tailOn ? ' עכשיו נסו לכבות את המדחף האחורי 👀' : ''));
    });
    const tb = btn('🌀 מדחף אחורי: פועל', () => {
      tailOn = !tailOn; tb.textContent = '🌀 מדחף אחורי: ' + (tailOn ? 'פועל' : 'כבוי'); tb.classList.toggle('primary', tailOn); tb.classList.toggle('ghost', !tailOn);
      if (!tailOn && !mainOn) say('המדחף האחורי כבוי. עכשיו מדליקים את הרוטור הראשי וצופים בגוף המסוק…');
    }, 'primary');
    c.appendChild(mb); c.appendChild(tb);
    box.appendChild(c);
    box.appendChild(h('p', { class: 'hint' }, 'מבט מלמעלה על המסוק. הפס הירוק מראה כמה גבוה הוא טס.'));
  });

  // =====================================================================
  // 🪃 Throw a boomerang: tilt, spin and aim decide if it comes back.
  // =====================================================================
  GS.sim('boomerang', (box, g, done) => {
    const W = 600, H = 440, sx = 300, sy = 400;
    const svg = svgBox(W, H);
    s('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#9fd77f' }, svg);
    for (let i = 0; i < 30; i++) text(svg, Math.random() * W, Math.random() * H, '🌱', { 'font-size': 14, opacity: 0.4 });
    text(svg, sx, sy + 8, '🧒', { 'font-size': 40 });
    const trail = s('polyline', { points: '', fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-dasharray': '6 8', opacity: 0.8 }, svg);
    const shadow = s('ellipse', { cx: 0, cy: 0, rx: 16, ry: 6, fill: '#000', opacity: 0.15 }, svg);
    const boom = text(svg, sx, sy - 30, '🪃', { 'font-size': 36 });
    const end = text(svg, 0, 0, '', { 'font-size': 40 });
    let tilt = null, spin = null, aim = null, tries = 0, busy = false;
    const say = message(box);
    function path(kind) {
      const pts = [];
      const N = 120;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        let x, y, z;
        if (kind === 'ok') { // a circle that comes back to the thrower
          // out and up, curving left, then all the way back to the thrower
          const r = 150;
          x = sx - r * (1 - Math.cos(t * 2 * Math.PI)) * 0.9;
          y = sy - 30 - 2.4 * r * (0.5 * Math.sin(t * Math.PI) + 0.5 * Math.pow(Math.sin(t * Math.PI), 2)) * 0.75;
          z = Math.sin(t * Math.PI) * 0.6;
        } else if (kind === 'low') {
          const u = Math.min(t * 4, 1); x = sx + 10 * u; y = sy - 30 - 60 * u; z = 0.2 * (1 - u);
        } else if (kind === 'flat' || kind === 'high') {
          const u = t; x = sx + 60 * u; y = sy - 30 - 300 * Math.min(u * 1.4, 1); z = u < 0.6 ? u * 1.6 : Math.max(0, 0.96 - (u - 0.6) * 2.4);
        } else { // weak spin: goes forward, no curve, drops
          const u = t; x = sx + 20 * u; y = sy - 30 - 190 * u; z = Math.max(0, 0.4 - u * 0.45);
        }
        pts.push([x, y, z]);
      }
      return pts;
    }
    function outcome() {
      if (aim === 'low') return { kind: 'low', end: '💥', msg: 'זרקנו לכיוון האדמה, והבומרנג נתקע באדמה מהר. מכוונים {{קצת מעל האופק}}.' };
      if (tilt === 'flat') return { kind: 'flat', end: '💥', msg: 'זרקנו אותו שוכב, כמו צלחת מעופפת. הוא טיפס גבוה מדי ונפל. מחזיקים אותו {{כמעט עומד, מוטה קצת}}.' };
      if (aim === 'high') return { kind: 'high', end: '🍂', msg: 'זרקנו גבוה מדי לשמיים. הבומרנג טיפס, איבד מהירות ונפל. מכוונים {{קצת מעל האופק}}.' };
      if (spin === 'weak') return { kind: 'weak', end: '🍂', msg: 'בלי מספיק סיבוב הבומרנג לא מסתובב במעגל, הוא רק נופל. מסובבים {{חזק}} עם תנועה של שורש כף היד.' };
      return { kind: 'ok', end: '🙌', msg: 'הוא חזר!!! 🎉 הכנפיים מסתובבות כמו להבי מסוק, והסיבוב מעגל את המסלול בחזרה אליכם.' };
    }
    function throwIt() {
      if (busy) return;
      if (!tilt || !spin || !aim) { say('בוחרים קודם הטיה, סיבוב וכיוון 👇'); return; }
      busy = true; tries++;
      const o = outcome(), pts = path(o.kind);
      const t0 = performance.now(), dur = o.kind === 'ok' ? 3.2 : 1.8;
      end.textContent = '';
      trail.setAttribute('points', '');
      const shown = [];
      loop(box, function step() {
        const u = Math.min(1, (performance.now() - t0) / 1000 / dur);
        const p = pts[Math.round(u * (pts.length - 1))];
        shown.push(p[0].toFixed(0) + ',' + p[1].toFixed(0));
        trail.setAttribute('points', shown.join(' '));
        boom.setAttribute('x', p[0]); boom.setAttribute('y', p[1] - p[2] * 40);
        boom.setAttribute('transform', 'rotate(' + ((performance.now() / (spin === 'strong' ? 1.2 : 6)) % 360) + ' ' + p[0] + ' ' + (p[1] - p[2] * 40) + ')');
        boom.setAttribute('font-size', 30 + p[2] * 22);
        shadow.setAttribute('cx', p[0]); shadow.setAttribute('cy', p[1] + 10);
        if (u >= 1) {
          busy = false;
          end.setAttribute('x', p[0]); end.setAttribute('y', p[1] - 30); end.textContent = o.end;
          if (o.kind === 'ok') { celebrate(); say(o.msg + (tries > 1 ? ' ראיתם? {{מי שמתמיד – מצליח}} 💪' : ''), 'good'); done(); GS.showAfter(); }
          else say(o.msg + ' נסו שוב!', 'bad');
          return false;
        }
      });
    }
    box.appendChild(svg);
    const c = controls();
    c.appendChild(h('div', { class: 'choice-row' }, h('b', null, 'איך מחזיקים:'),
      seg([{ t: '🥏 שוכב כמו צלחת', v: 'flat' }, { t: '🪃 כמעט עומד, מוטה קצת', v: 'tilted' }], null, (v) => { tilt = v; })));
    c.appendChild(h('div', { class: 'choice-row' }, h('b', null, 'כמה סיבוב:'),
      seg([{ t: '🐢 סיבוב חלש', v: 'weak' }, { t: '🌀 סיבוב חזק', v: 'strong' }], null, (v) => { spin = v; })));
    c.appendChild(h('div', { class: 'choice-row' }, h('b', null, 'לאן מכוונים:'),
      seg([{ t: '⬇️ לאדמה', v: 'low' }, { t: '➡️ קצת מעל האופק', v: 'level' }, { t: '⬆️ גבוה לשמיים', v: 'high' }], null, (v) => { aim = v; })));
    c.appendChild(btn('🪃 זורקים!', throwIt, 'primary big'));
    box.appendChild(c);
    say('בוחרים איך זורקים, ולוחצים "זורקים!". לא חזר? משנים משהו ומנסים שוב.');
  });

  // =====================================================================
  // Drawings used on cards
  // =====================================================================
  GS.art.dome = () => {
    // A geodesic dome seen from the front: rings of points joined into triangles.
    const W = 320, H = 200, cx = 160, base = 180, R = 140;
    const rings = [[], [], [], []];
    const counts = [9, 7, 5, 3];
    const heights = [0, 0.42, 0.75, 0.95];
    rings.forEach((r, k) => {
      const yk = base - heights[k] * R * 1.15;
      const half = R * Math.cos(Math.asin(heights[k] * 0.98));
      for (let i = 0; i < counts[k]; i++) r.push([cx - half + (2 * half * i) / (counts[k] - 1), yk]);
    });
    let lines = '';
    const L = (a, b) => { lines += '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '"/>'; };
    rings.forEach((r) => { for (let i = 0; i + 1 < r.length; i++) L(r[i], r[i + 1]); });
    for (let k = 0; k + 1 < rings.length; k++) {
      const a = rings[k], b = rings[k + 1];
      a.forEach((p, i) => {
        const j = Math.round(i * (b.length - 1) / (a.length - 1));
        L(p, b[j]);
        if (j + 1 < b.length && i + 1 < a.length && Math.round((i + 1) * (b.length - 1) / (a.length - 1)) !== j) L(a[i + 1], b[j]);
        if (j - 1 >= 0 && Math.round((i - 1) * (b.length - 1) / (a.length - 1)) !== j && i > 0) L(a[i - 1], b[j]);
      });
    }
    let dots = '';
    rings.forEach((r) => r.forEach((p, i) => { dots += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="6" fill="' + ['#ff5d73', '#4cc96b', '#ffcb2e', '#4a8df0'][i % 4] + '"/>'; }));
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="art-svg"><rect width="' + W + '" height="' + H + '" rx="20" fill="#f6d7bd"/>' +
      '<rect y="' + base + '" width="' + W + '" height="' + (H - base) + '" fill="#c9663b"/>' +
      '<g stroke="#b07a3b" stroke-width="4" stroke-linecap="round">' + lines + '</g>' + dots + '</svg>';
  };

  GS.art.mars = () => '<svg viewBox="0 0 320 200" class="art-svg"><rect width="320" height="200" rx="20" fill="#0b1530"/>' +
    '<circle cx="160" cy="100" r="78" fill="#c1440e"/><circle cx="160" cy="100" r="78" fill="url(#shade)"/>' +
    '<ellipse cx="160" cy="30" rx="30" ry="9" fill="#fff" opacity=".85"/>' +
    '<circle cx="130" cy="90" r="12" fill="#9b350c"/><circle cx="185" cy="120" r="8" fill="#9b350c"/><circle cx="175" cy="75" r="5" fill="#9b350c"/>' +
    '<path d="M100 115 Q160 100 215 118" stroke="#8a2f0a" stroke-width="6" fill="none"/>' +
    '<defs><radialGradient id="shade" cx="35%" cy="35%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".45"/></radialGradient></defs></svg>';

  GS.art.starPlanet = () => '<svg viewBox="0 0 320 200" class="art-svg"><rect width="320" height="200" rx="20" fill="#0b1530"/>' +
    '<circle cx="110" cy="100" r="46" fill="#ffcf3f"/><circle cx="110" cy="100" r="60" fill="#ffcf3f" opacity=".2"/>' +
    '<ellipse cx="110" cy="100" rx="150" ry="55" fill="none" stroke="#fff" stroke-opacity=".35" stroke-dasharray="6 6"/>' +
    '<circle cx="245" cy="132" r="14" fill="#3f8cff"/>' +
    '<text x="110" y="168" fill="#fff" font-size="16" text-anchor="middle">כוכב (שמש)</text>' +
    '<text x="245" y="166" fill="#fff" font-size="16" text-anchor="middle">כוכב לכת</text></svg>';

  GS.art.helicopter = () => '<svg viewBox="0 0 320 200" class="art-svg"><rect width="320" height="200" rx="20" fill="#e6f3ff"/>' +
    '<rect x="40" y="38" width="200" height="8" rx="4" fill="#333"/><rect x="136" y="42" width="8" height="22" fill="#555"/>' +
    '<ellipse cx="140" cy="88" rx="58" ry="30" fill="#2f66c0"/><path d="M98 80 a30 26 0 0 1 30 -18 v40 h-34 z" fill="#bfe3ff"/>' +
    '<rect x="190" y="82" width="90" height="10" rx="5" fill="#2f66c0"/><circle cx="282" cy="87" r="16" fill="none" stroke="#333" stroke-width="4"/>' +
    '<rect x="100" y="118" width="80" height="6" rx="3" fill="#555"/>' +
    '<g fill="#7fb3ff"><polygon points="70,150 80,180 90,150"/><polygon points="130,150 140,180 150,150"/><polygon points="190,150 200,180 210,150"/></g>' +
    '<g fill="#4cc96b"><polygon points="20,40 30,10 40,40"/></g><text x="30" y="58" font-size="12" text-anchor="middle" fill="#2f9e4d">עילוי</text>' +
    '<text x="140" y="195" font-size="13" text-anchor="middle" fill="#2f66c0">הלהבים דוחפים אוויר למטה</text>' +
    '<text x="282" y="125" font-size="12" text-anchor="middle" fill="#333">מדחף</text><text x="282" y="140" font-size="12" text-anchor="middle" fill="#333">אחורי</text></svg>';

  GS.art.actionReaction = () => '<svg viewBox="0 0 320 200" class="art-svg"><rect width="320" height="200" rx="20" fill="#eef6ff"/>' +
    '<rect x="250" y="20" width="50" height="160" fill="#b85c38"/><rect y="170" width="320" height="30" fill="#d9c7a7"/>' +
    '<text x="190" y="140" font-size="56" text-anchor="middle">🧒</text>' +
    '<line x1="150" y1="70" x2="232" y2="70" stroke="#e24b4b" stroke-width="7" stroke-linecap="round"/><polygon points="246,70 230,62 230,78" fill="#e24b4b"/>' +
    '<line x1="246" y1="100" x2="164" y2="100" stroke="#2f66c0" stroke-width="7" stroke-linecap="round"/><polygon points="150,100 166,92 166,108" fill="#2f66c0"/>' +
    '<text x="70" y="70" font-size="15" text-anchor="middle" fill="#b42323" font-weight="700">פעולה</text>' +
    '<text x="70" y="104" font-size="15" text-anchor="middle" fill="#2f66c0" font-weight="700">תגובה</text></svg>';

  GS.art.boomerangPath = () => '<svg viewBox="0 0 320 200" class="art-svg"><rect width="320" height="200" rx="20" fill="#9fd77f"/>' +
    '<path d="M160 180 C 60 170, 40 40, 140 25 C 240 15, 260 150, 168 178" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="8 8"/>' +
    '<text x="160" y="186" font-size="30" text-anchor="middle">🧒</text><text x="140" y="32" font-size="30" text-anchor="middle">🪃</text></svg>';
})();
