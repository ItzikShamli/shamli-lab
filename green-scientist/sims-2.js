/* Green Scientist — simulations for class 3 (dry ice) and class 4 (light). */
(function () {
  'use strict';
  const GS = window.GS;
  const { h, toast, celebrate } = GS;
  const { s, svgBox, text, loop, controls, btn, seg, message, arrow } = GS.simKit;

  // =====================================================================
  // 🧊 States of matter: water (solid → liquid → gas) and dry ice (solid → gas, skipping liquid)
  // =====================================================================
  GS.sim('states', (box, g, done) => {
    const W = 600, H = 380, L = 70, R = 410, T = 60, B = 340;
    const svg = svgBox(W, H);
    s('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#f4f9ff' }, svg);
    s('path', { d: 'M' + (L - 6) + ' ' + (T - 20) + ' V' + (B + 6) + ' H' + (R + 6) + ' V' + (T - 20), fill: 'none', stroke: '#9fb7cf', 'stroke-width': 8, 'stroke-linejoin': 'round' }, svg);
    const label = text(svg, (L + R) / 2, 26, '', { 'font-size': 24, 'font-weight': 800, fill: '#23324a' });
    // thermometer
    s('rect', { x: 490, y: 50, width: 34, height: 270, rx: 17, fill: '#fff', stroke: '#c9d6e8', 'stroke-width': 3 }, svg);
    s('circle', { cx: 507, cy: 330, r: 26, fill: '#e24b4b' }, svg);
    const merc = s('rect', { x: 499, y: 300, width: 16, height: 30, rx: 8, fill: '#e24b4b' }, svg);
    const tempText = text(svg, 507, 372, '', { 'font-size': 15, 'font-weight': 700, fill: '#23324a' });
    const N = 40, parts = [];
    const pg = s('g', {}, svg);
    for (let i = 0; i < N; i++) {
      const c = i % 8, r = Math.floor(i / 8);
      parts.push({ lx: L + 34 + c * 43, ly: B - 18 - r * 26, x: L + 34 + c * 43, y: B - 18 - r * 26, vx: 0, vy: 0, ph: Math.random() * 6.28, el: s('circle', { r: 11 }, pg) });
    }
    let mode = 'water', level = 0;
    const seen = new Set(['w0']);
    const say = message(box);
    const STATES = {
      water: [
        { t: '🧊 מוצק: קרח', temp: 'מתחת ל-0°', fill: 0.15, msg: 'ב{{מוצק}} החלקיקים צפופים ומסודרים. הם רק רועדים במקום, ולכן לקרח יש צורה קבועה.' },
        { t: '💧 נוזל: מים', temp: 'בין 0° ל-100°', fill: 0.5, msg: 'חיממנו, והקרח {{נמס}}. ב{{נוזל}} החלקיקים קרובים, אבל מחליקים זה ליד זה. לכן מים זורמים ולוקחים את צורת הכלי.' },
        { t: '♨️ גז: אדים', temp: 'מעל 100°', fill: 0.92, msg: 'חיממנו עוד, והמים {{התאדו}}. ב{{גז}} החלקיקים רחוקים ועפים מהר לכל הכיוונים, וממלאים את כל המקום.' }
      ],
      dry: [
        { t: '🧊 מוצק: קרח יבש', temp: 'מתחת ל-78- מעלות', fill: 0.04, msg: 'זה {{קרח יבש}}: פחמן דו־חמצני מוצק. הוא קר מאוד מאוד, הרבה יותר מקרח רגיל.' },
        null,
        { t: '☁️ גז: פחמן דו־חמצני', temp: 'בטמפרטורת החדר', fill: 0.5, msg: 'וואו! הקרח היבש {{דילג על הנוזל}} והפך ישר מ{{מוצק לגז}}. קוראים לזה {{המראה}}. בגלל זה הוא "יבש": אין שלולית!' }
      ]
    };
    function setLevel(n, note) {
      level = n;
      const st = STATES[mode][level];
      label.textContent = st.t;
      tempText.textContent = st.temp;
      const hgt = 30 + st.fill * 240;
      merc.setAttribute('y', 330 - hgt); merc.setAttribute('height', hgt);
      say(note || st.msg, level === 2 && mode === 'dry' ? 'good' : '');
      parts.forEach((p) => {
        p.el.setAttribute('fill', mode === 'water' ? '#3f8cff' : '#9aa6b2');
        const sp = level === 2 ? 240 : 50;
        const a = Math.random() * 6.28;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
      });
      seen.add((mode === 'water' ? 'w' : 'd') + level);
      if (seen.has('w1') && seen.has('w2') && seen.has('d2')) { celebrate(); done(); GS.showAfter(); }
    }
    loop(box, (dt, t) => {
      parts.forEach((p) => {
        if (level === 0) {
          p.x += (p.lx + 2.5 * Math.sin(t * 13 + p.ph) - p.x) * 0.25;
          p.y += (p.ly + 2.5 * Math.cos(t * 11 + p.ph) - p.y) * 0.25;
        } else {
          const top = level === 1 ? B - 150 : T;
          if (level === 1) { p.vy += 260 * dt; p.vx += (Math.random() - 0.5) * 300 * dt; }
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.x < L + 12) { p.x = L + 12; p.vx = Math.abs(p.vx); }
          if (p.x > R - 12) { p.x = R - 12; p.vx = -Math.abs(p.vx); }
          if (p.y > B - 12) { p.y = B - 12; p.vy = -Math.abs(p.vy) * (level === 1 ? 0.6 : 1); }
          if (p.y < top + 12) { p.y = top + 12; p.vy = Math.abs(p.vy); }
          if (level === 1) { const sp = Math.hypot(p.vx, p.vy); if (sp > 90) { p.vx *= 90 / sp; p.vy *= 90 / sp; } }
        }
        p.el.setAttribute('cx', p.x.toFixed(1)); p.el.setAttribute('cy', p.y.toFixed(1));
      });
    });
    box.appendChild(svg);
    const c = controls();
    c.appendChild(seg([{ t: '💧 מים וקרח', v: 'water' }, { t: '🧊 קרח יבש', v: 'dry' }], 'water', (v) => {
      mode = v;
      setLevel(0, v === 'dry' ? 'החלפנו לקרח יבש. עכשיו מחממים ורואים מה קורה. האם יהיה נוזל?' : null);
    }));
    c.appendChild(btn('❄️ מקררים', () => {
      if (level === 0) { say('זה כבר הכי קר שיש כאן 🥶'); return; }
      if (mode === 'dry') setLevel(0, 'קיררנו מאוד, והגז הפך {{ישר בחזרה למוצק}}. ככה מייצרים קרח יבש: מקררים פחמן דו־חמצני מאוד, ודוחסים את הפתיתים.');
      else setLevel(level - 1, level === 2 ? 'קיררנו, והאדים {{התעבו}} בחזרה לטיפות מים (כמו טיפות על מכסה של סיר).' : 'קיררנו, והמים {{קפאו}} לקרח.');
    }));
    c.appendChild(btn('🔥 מחממים', () => {
      if (level === 2) { say('זה כבר גז. החלקיקים עפים הכי מהר 💨'); return; }
      setLevel(mode === 'dry' ? 2 : level + 1);
    }, 'primary'));
    box.appendChild(c);
    setLevel(0);
  });

  // =====================================================================
  // ☁️ Dry ice in water: safety first, then fog, then a soap bubble full of cloud
  // =====================================================================
  GS.sim('dryIce', (box, g, done) => {
    const W = 600, H = 430, table = 380, gx1 = 225, gx2 = 375, gTop = 170, water = 235;
    const svg = svgBox(W, H);
    const defs = s('defs', {}, svg);
    const grad = s('radialGradient', { id: 'fogGrad' }, defs);
    s('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': 0.95 }, grad);
    s('stop', { offset: '100%', 'stop-color': '#ffffff', 'stop-opacity': 0 }, grad);
    const bub = s('radialGradient', { id: 'bubGrad', cx: '35%', cy: '30%' }, defs);
    s('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': 0.7 }, bub);
    s('stop', { offset: '60%', 'stop-color': '#c7e9ff', 'stop-opacity': 0.25 }, bub);
    s('stop', { offset: '100%', 'stop-color': '#b39cff', 'stop-opacity': 0.45 }, bub);
    s('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#2b3a55' }, svg);
    s('rect', { x: 0, y: table, width: W, height: H - table, fill: '#8a6a4a' }, svg);
    const fogBack = s('g', {}, svg);
    s('rect', { x: gx1 + 6, y: water, width: gx2 - gx1 - 12, height: table - water - 6, fill: '#7cc6fe', opacity: 0.55 }, svg);
    const bubbles = s('g', {}, svg);
    const chunk = s('rect', { x: 280, y: 120, width: 40, height: 30, rx: 6, fill: '#eef3f7', stroke: '#c9d4de', 'stroke-width': 2, opacity: 0 }, svg);
    s('path', { d: 'M' + gx1 + ' ' + gTop + ' L' + (gx1 + 6) + ' ' + table + ' H' + (gx2 - 6) + ' L' + gx2 + ' ' + gTop, fill: 'none', stroke: '#e6f4ff', 'stroke-width': 6, opacity: 0.9 }, svg);
    const soapBubble = s('ellipse', { cx: 300, cy: gTop, rx: 0, ry: 0, fill: 'url(#bubGrad)', stroke: '#ffffff', 'stroke-opacity': 0.8, 'stroke-width': 2, class: 'tap' }, svg);
    const fogFront = s('g', {}, svg);
    const hand = text(svg, 300, 80, '', { 'font-size': 54 });
    let stage = 'safety', size = 0, warm = 1, bubbleR = 0, soap = false, popped = false;
    const fog = [], rises = [];
    const say = message(box);
    function puff(x, y, vx, vy, r, layer) { fog.push({ x, y, vx, vy, r, life: 1, layer }); }
    loop(box, (dt) => {
      if (stage === 'drop') {
        const y = +chunk.getAttribute('y') + 260 * dt;
        chunk.setAttribute('y', Math.min(y, table - 40));
        if (y >= table - 40) stage = 'fizz';
      }
      if (stage === 'fizz' && size > 0) {
        size = Math.max(0, size - dt * 0.03 * warm);
        const w = 12 + 28 * size, hh = 8 + 22 * size;
        chunk.setAttribute('width', w); chunk.setAttribute('height', hh); chunk.setAttribute('x', 300 - w / 2); chunk.setAttribute('y', table - 10 - hh);
        if (Math.random() < dt * 25 * warm * (0.3 + size)) rises.push({ x: 300 + (Math.random() - 0.5) * 30, y: table - 20, r: 3 + Math.random() * 4 });
        if (!soap && Math.random() < dt * 18 * warm * (0.3 + size)) puff(gx1 + 20 + Math.random() * (gx2 - gx1 - 40), water - 4, (Math.random() - 0.5) * 30, -20, 18 + Math.random() * 10, 'back');
        if (soap && !popped && bubbleR < 1) bubbleR = Math.min(1, bubbleR + dt * 0.12 * warm * (0.4 + size));
        if (size === 0) { stage = 'gone'; say('הקרח היבש נעלם לגמרי! הוא הפך כולו ל{{גז}}, בלי להשאיר שלולית. זו {{המראה}}.', 'good'); }
      }
      // bubbles of gas rising in the water
      bubbles.innerHTML = '';
      for (let i = rises.length - 1; i >= 0; i--) {
        const b = rises[i]; b.y -= 90 * dt; b.x += (Math.random() - 0.5) * 20 * dt;
        if (b.y < water) { rises.splice(i, 1); continue; }
        s('circle', { cx: b.x, cy: b.y, r: b.r, fill: 'none', stroke: '#ffffff', 'stroke-width': 2, opacity: 0.8 }, bubbles);
      }
      // fog: rises a little, spills over the rim, falls (it's heavy and cold) and spreads on the table
      fogBack.innerHTML = ''; fogFront.innerHTML = '';
      for (let i = fog.length - 1; i >= 0; i--) {
        const f = fog[i];
        f.life -= dt * (f.layer === 'burst' ? 0.25 : 0.18);
        if (f.life <= 0) { fog.splice(i, 1); continue; }
        if (f.y < gTop + 6 && f.x > gx1 - 4 && f.x < gx2 + 4 && f.layer !== 'burst') { f.vx += (f.x < 300 ? -1 : 1) * 160 * dt; }
        const outside = f.x < gx1 - 2 || f.x > gx2 + 2;
        if (outside || f.layer === 'burst') f.vy += 70 * dt; else if (f.y > gTop - 10) f.vy -= 10 * dt;
        if (f.y > table - f.r * 0.4) { f.y = table - f.r * 0.4; f.vy = 0; f.vx *= 1 + dt * 0.8; }
        f.x += f.vx * dt; f.y += f.vy * dt; f.r += dt * 6;
        s('circle', { cx: f.x.toFixed(1), cy: f.y.toFixed(1), r: f.r.toFixed(1), fill: 'url(#fogGrad)', opacity: Math.min(1, f.life * 1.4).toFixed(2) }, outside || f.layer === 'burst' ? fogFront : fogBack);
      }
      // the soap bubble
      if (soap && !popped) {
        soapBubble.setAttribute('rx', (bubbleR * 120).toFixed(1));
        soapBubble.setAttribute('ry', (bubbleR * 100).toFixed(1));
        soapBubble.setAttribute('cy', (gTop - bubbleR * 80).toFixed(1));
        if (bubbleR > 0.2) for (let k = 0; k < 2; k++) {
          const a = Math.random() * 6.28, rr = Math.random() * bubbleR * 85;
          s('circle', { cx: 300 + Math.cos(a) * rr * 1.2, cy: gTop - bubbleR * 80 + Math.sin(a) * rr, r: 16 + bubbleR * 22, fill: 'url(#fogGrad)', opacity: 0.6 }, fogFront);
        }
        if (bubbleR >= 1 && !pop.shown) { pop.shown = true; say('הבועה מלאה {{בענן}}! לחצו על הבועה (או על "מפוצצים") כדי לשחרר אותו ☁️'); }
      }
    });
    function pop() {
      if (!soap || popped || bubbleR < 0.3) return;
      popped = true;
      for (let k = 0; k < 40; k++) {
        const a = Math.random() * 6.28, sp = 60 + Math.random() * 120;
        puff(300 + Math.cos(a) * bubbleR * 80, gTop - bubbleR * 80 + Math.sin(a) * bubbleR * 60, Math.cos(a) * sp, Math.sin(a) * sp * 0.6, 20 + Math.random() * 16, 'burst');
      }
      soapBubble.setAttribute('rx', 0); soapBubble.setAttribute('ry', 0);
      say('פוף! 💥 שחררנו את הענן לחופשי ☁️☁️☁️ שימו לב: הענן {{יורד למטה}}, כי פחמן דו־חמצני קר כבד יותר מהאוויר.', 'good');
      celebrate(); done(); GS.showAfter();
    }
    soapBubble.addEventListener('click', pop);
    const c = controls();
    const safety = h('div', { class: 'choice-row' }, h('b', null, 'איך מחזיקים קרח יבש?'),
      btn('✋ ביד', () => {
        hand.textContent = '✋';
        say('אאוץ׳! 🥶 קרח יבש קר כל כך, שמגע ארוך בעור גורם ל{{כווית קור}}. לא נוגעים ביד!', 'bad');
      }),
      btn('🧤 כפפות ומלקחיים', () => {
        hand.textContent = '🧤';
        stage = 'ready'; size = 1;
        chunk.setAttribute('opacity', 1); chunk.setAttribute('x', 280); chunk.setAttribute('y', 120); chunk.setAttribute('width', 40); chunk.setAttribute('height', 30);
        safety.remove(); c.appendChild(actions);
        say('נכון! עם {{כפפות ומלקחיים}} שומרים על הידיים. עכשיו מכניסים את הקרח היבש למים.', 'good');
      }, 'primary'));
    const actions = h('div', { class: 'choice-row' },
      btn('⬇️ מכניסים למים', () => {
        if (stage !== 'ready') return;
        stage = 'drop'; hand.textContent = '';
        say('בלופ! 🫧 הקרח היבש הופך לגז, והגז יוצא {{בבועות}}. הגז הקר מקרר את האוויר מעל המים, ונוצר {{ערפל לבן}} שגולש החוצה.');
      }, 'primary'),
      btn('♨️ מים חמים', () => {
        if (stage !== 'fizz') { say('קודם מכניסים את הקרח היבש למים.'); return; }
        warm = 2.2; say('במים חמים הקרח היבש מתחמם מהר יותר, אז יוצא {{יותר גז ויותר ערפל}}!');
      }),
      btn('🧼 מוסיפים סבון', () => {
        if (stage !== 'fizz') { say(stage === 'gone' ? 'הקרח היבש כבר נגמר. התחילו מחדש.' : 'קודם מכניסים את הקרח היבש למים.'); return; }
        soap = true; popped = false; bubbleR = 0.05; pop.shown = false;
        say('הסבון יוצר שכבה שתופסת את הגז, ו{{בועה גדולה}} מתנפחת, מלאה בענן!');
      }),
      btn('📌 מפוצצים', pop),
      btn('🔄 מההתחלה', () => {
        stage = 'ready'; size = 1; warm = 1; soap = false; popped = false; bubbleR = 0; fog.length = 0; rises.length = 0;
        soapBubble.setAttribute('rx', 0); soapBubble.setAttribute('ry', 0);
        chunk.setAttribute('opacity', 1); chunk.setAttribute('x', 280); chunk.setAttribute('y', 120); chunk.setAttribute('width', 40); chunk.setAttribute('height', 30);
        hand.textContent = '🧤'; say('מוכנים שוב. מכניסים את הקרח היבש למים.');
      }));
    box.appendChild(svg);
    c.appendChild(safety);
    box.appendChild(c);
    say('לפני שמתחילים ניסוי עם קרח יבש: בוחרים איך מחזיקים אותו.');
  });

  // =====================================================================
  // 🔦 Laser and mirrors: turn the mirror until the beam hits the target. Angle in = angle out.
  // =====================================================================
  GS.sim('mirror', (box, g, done) => {
    const W = 600, H = 420;
    const LEVELS = [
      { laser: [40, 340, 0], mirrors: [{ x: 430, y: 340, a: 20 }], target: [430, 70], walls: [] },
      { laser: [40, 90, 0], mirrors: [{ x: 320, y: 90, a: 20 }], target: [130, 360], walls: [] },
      { laser: [40, 360, 0], mirrors: [{ x: 480, y: 360, a: 100 }, { x: 480, y: 80, a: 0 }], target: [110, 80], walls: [[300, 140, 300, 320]] }
    ];
    let lv = 0, sel = 0, won = false;
    const svg = svgBox(W, H);
    const say = message(box);
    const levelLabel = h('div', { class: 'hint' });
    function rad(d) { return d * Math.PI / 180; }
    function draw() {
      const L = LEVELS[lv];
      svg.innerHTML = '';
      s('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#14182b' }, svg);
      L.walls.forEach((w) => s('line', { x1: w[0], y1: w[1], x2: w[2], y2: w[3], stroke: '#6b5a4a', 'stroke-width': 14, 'stroke-linecap': 'round' }, svg));
      text(svg, L.target[0], L.target[1], '🎯', { 'font-size': 44 });
      // laser box
      s('rect', { x: L.laser[0] - 30, y: L.laser[1] - 14, width: 44, height: 28, rx: 6, fill: '#888' }, svg);
      // trace the beam
      let p = [L.laser[0] + 14, L.laser[1]], d = [Math.cos(rad(L.laser[2])), Math.sin(rad(L.laser[2]))];
      const pts = [p.slice()];
      let hit = false, firstAngles = null;
      for (let bounce = 0; bounce < 6; bounce++) {
        let best = Infinity, kind = null, mi = -1;
        L.mirrors.forEach((m, i) => {
          const ux = Math.cos(rad(m.a)) * 50, uy = Math.sin(rad(m.a)) * 50;
          const t = segHit(p, d, [m.x - ux, m.y - uy], [m.x + ux, m.y + uy]);
          if (t != null && t < best) { best = t; kind = 'mirror'; mi = i; }
        });
        L.walls.forEach((w) => { const t = segHit(p, d, [w[0], w[1]], [w[2], w[3]], 7); if (t != null && t < best) { best = t; kind = 'wall'; } });
        const tt = circleHit(p, d, L.target, 24); if (tt != null && tt < best) { best = tt; kind = 'target'; }
        const tb = boundsHit(p, d); if (tb < best) { best = tb; kind = 'edge'; }
        const q = [p[0] + d[0] * best, p[1] + d[1] * best];
        pts.push(q);
        if (kind !== 'mirror') { hit = kind === 'target'; break; }
        const m = L.mirrors[mi];
        let n = [-Math.sin(rad(m.a)), Math.cos(rad(m.a))];
        if (n[0] * d[0] + n[1] * d[1] > 0) n = [-n[0], -n[1]];
        const dot = d[0] * n[0] + d[1] * n[1];
        const nd = [d[0] - 2 * dot * n[0], d[1] - 2 * dot * n[1]];
        if (!firstAngles) firstAngles = { at: q, n, din: d, dout: nd, ang: Math.round(Math.acos(Math.min(1, -dot)) * 180 / Math.PI) };
        p = q; d = nd;
      }
      s('polyline', { points: pts.map((x) => x.join(',')).join(' '), fill: 'none', stroke: '#ff3b3b', 'stroke-width': 9, opacity: 0.25, 'stroke-linejoin': 'round' }, svg);
      s('polyline', { points: pts.map((x) => x.join(',')).join(' '), fill: 'none', stroke: '#ff5a5a', 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, svg);
      if (firstAngles) {
        const { at, n, din, dout, ang } = firstAngles;
        s('line', { x1: at[0], y1: at[1], x2: at[0] + n[0] * 90, y2: at[1] + n[1] * 90, stroke: '#ffffff', 'stroke-width': 2, 'stroke-dasharray': '6 6', opacity: 0.7 }, svg);
        const inDir = [-din[0], -din[1]];
        const p1 = [at[0] + inDir[0] * 60, at[1] + inDir[1] * 60], p2 = [at[0] + dout[0] * 60, at[1] + dout[1] * 60];
        text(svg, (p1[0] + at[0] + n[0] * 40) / 2 + n[0] * 10, (p1[1] + at[1] + n[1] * 40) / 2 + n[1] * 10, ang + '°', { 'font-size': 18, fill: '#ffd34d', 'font-weight': 800 });
        text(svg, (p2[0] + at[0] + n[0] * 40) / 2 + n[0] * 10, (p2[1] + at[1] + n[1] * 40) / 2 + n[1] * 10, ang + '°', { 'font-size': 18, fill: '#7fe0a0', 'font-weight': 800 });
      }
      L.mirrors.forEach((m, i) => {
        const ux = Math.cos(rad(m.a)) * 50, uy = Math.sin(rad(m.a)) * 50;
        const gm = s('g', { class: 'tap' }, svg);
        s('line', { x1: m.x - ux, y1: m.y - uy, x2: m.x + ux, y2: m.y + uy, stroke: i === sel ? '#9fd8ff' : '#cfe8ff', 'stroke-width': i === sel ? 10 : 8, 'stroke-linecap': 'round' }, gm);
        s('circle', { cx: m.x, cy: m.y, r: 36, fill: i === sel && L.mirrors.length > 1 ? 'rgba(159,216,255,.15)' : 'transparent' }, gm);
        gm.addEventListener('click', () => { sel = i; draw(); });
      });
      if (hit && !won) {
        won = true;
        celebrate();
        if (lv < LEVELS.length - 1) {
          say('פגיעה! 🎯 שימו לב למספרים: {{זווית הפגיעה שווה לזווית ההחזרה}}. עוברים לשלב הבא?', 'good');
          nextBtn.classList.remove('hidden');
        } else {
          say('אלופים! 🏆 העברתם את הקרן בין שתי מראות, מסביב לקיר. ככה עובד גם {{פריסקופ}} בצוללת.', 'good');
          done(); GS.showAfter();
        }
      }
    }
    function segHit(p, d, a, b, pad) {
      const ex = b[0] - a[0], ey = b[1] - a[1];
      const den = d[0] * ey - d[1] * ex;
      if (Math.abs(den) < 1e-9) return null;
      const t = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / den;
      const u = ((a[0] - p[0]) * d[1] - (a[1] - p[1]) * d[0]) / den;
      return t > 1 && u >= 0 && u <= 1 ? Math.max(0, t - (pad || 0)) : null;
    }
    function circleHit(p, d, c, r) {
      const fx = p[0] - c[0], fy = p[1] - c[1];
      const b = fx * d[0] + fy * d[1], cc = fx * fx + fy * fy - r * r;
      const disc = b * b - cc;
      if (disc < 0) return null;
      const t = -b - Math.sqrt(disc);
      return t > 1 ? t : null;
    }
    function boundsHit(p, d) {
      let t = Infinity;
      if (d[0] > 0) t = Math.min(t, (W - p[0]) / d[0]); if (d[0] < 0) t = Math.min(t, -p[0] / d[0]);
      if (d[1] > 0) t = Math.min(t, (H - p[1]) / d[1]); if (d[1] < 0) t = Math.min(t, -p[1] / d[1]);
      return t;
    }
    function rotate(delta) { if (won) return; LEVELS[lv].mirrors[sel].a += delta; draw(); }
    function startLevel(n) {
      lv = n; sel = 0; won = false; nextBtn.classList.add('hidden');
      levelLabel.textContent = 'שלב ' + (lv + 1) + ' מתוך ' + LEVELS.length + (LEVELS[lv].mirrors.length > 1 ? ' · לוחצים על מראה כדי לבחור אותה' : '');
      say(['מסובבים את המראה עד שקרן הלייזר פוגעת במטרה 🎯', 'עכשיו המטרה למטה. לאיזה כיוון צריך לסובב?', 'קיר באמצע! צריך שתי מראות כדי לעקוף אותו.'][lv]);
      draw();
    }
    box.appendChild(svg);
    box.appendChild(levelLabel);
    const c = controls();
    c.appendChild(btn('↻ מסובבים', () => rotate(2.5), 'primary'));
    c.appendChild(btn('↺ מסובבים', () => rotate(-2.5), 'primary'));
    const nextBtn = btn('לשלב הבא ←', () => startLevel(lv + 1), 'primary big');
    nextBtn.classList.add('hidden');
    c.appendChild(nextBtn);
    box.appendChild(c);
    box.appendChild(h('p', { class: 'hint' }, '⚠️ בבית: אף פעם לא מכוונים לייזר לעיניים, גם לא דרך מראה.'));
    startLevel(0);
  });

  // =====================================================================
  // 🌈 Why things have colors + mixing colored lights
  // =====================================================================
  GS.sim('colors', (box, g, done) => {
    const RAYS = ['#ff3b3b', '#ff9f1a', '#ffe14d', '#3ddc5a', '#3b82ff', '#9b5cff'];
    const OBJ = {
      apple: { name: 'תפוח אדום', e: '🍎', out: ['#ff3b3b'], msg: 'האור הלבן מגיע עם {{כל הצבעים}}. התפוח "בולע" את כולם ו{{מחזיר רק את האדום}}. לכן העין רואה אדום.' },
      leaf: { name: 'עלה ירוק', e: '🍃', out: ['#3ddc5a'], msg: 'העלה מחזיר לעין {{רק את הירוק}}, ובולע את שאר הצבעים.' },
      banana: { name: 'בננה צהובה', e: '🍌', out: ['#ffe14d', '#ff9f1a', '#3ddc5a'], msg: 'הבננה מחזירה {{צהוב}} (ועוד קצת צבעים קרובים). השאר נבלעים.' },
      paper: { name: 'דף לבן', e: '📄', out: RAYS, msg: 'דף לבן {{מחזיר את כל הצבעים}}. כשכל הצבעים מגיעים יחד לעין, רואים לבן!' },
      black: { name: 'כדור שחור', e: '🎱', out: [], msg: 'שחור {{בולע את כל הצבעים}} ולא מחזיר כמעט כלום. האור שנבלע הופך לחום, ולכן דברים שחורים מתחממים בשמש ☀️.' }
    };
    const FILL = { apple: '#e02d2d', leaf: '#2fae4a', banana: '#ffd43b', paper: '#ffffff', black: '#151515' };
    let obj = 'apple', on = true;
    const tried = new Set();
    let mixDone = false;
    const svg = svgBox(600, 320);
    const say = message(box);
    function draw() {
      svg.innerHTML = '';
      s('rect', { x: 0, y: 0, width: 600, height: 320, rx: 24, fill: on ? '#eef3fb' : '#05060a' }, svg);
      text(svg, 60, 120, on ? '💡' : '🌑', { 'font-size': 56 });
      text(svg, 540, 110, '👁️', { 'font-size': 50, opacity: on ? 1 : 0.35 });
      if (on) {
        RAYS.forEach((c, i) => {
          s('line', { x1: 90, y1: 110 + i * 3, x2: 275, y2: 205 + i * 4, stroke: c, 'stroke-width': 4, opacity: 0.9 }, svg);
        });
        OBJ[obj].out.forEach((c, i) => {
          const a = arrow(s('g', {}, svg), 330, 200 - i * 4, 505, 120 - i * 4, c, 4);
          a.setAttribute('opacity', 0.95);
        });
      }
      const ob = text(svg, 300, 220, OBJ[obj].e, { 'font-size': 84, opacity: on ? 1 : 0.06 });
      ob.setAttribute('class', 'tap');
      s('rect', { x: 240, y: 278, width: 120, height: 18, rx: 9, fill: on ? FILL[obj] : '#111', stroke: '#999', 'stroke-width': 1 }, svg);
      text(svg, 300, 307, on ? OBJ[obj].name : '', { 'font-size': 16, 'font-weight': 700, fill: '#23324a' });
    }
    function choose(k) {
      obj = k; tried.add(k); draw();
      if (!on) say('האור כבוי… {{בלי אור לא רואים כלום}}! הדליקו את המנורה.', 'bad');
      else say(OBJ[k].msg, k === 'black' ? '' : 'good');
      check();
    }
    function check() { if (tried.size >= 3 && mixDone) { celebrate(); done(); GS.showAfter(); } }
    box.appendChild(svg);
    const c = controls();
    c.appendChild(seg([{ t: '💡 אור דולק', v: true }, { t: '🌑 חושך', v: false }], true, (v) => {
      on = v; draw();
      say(on ? 'יש אור! הקרניים פוגעות בחפץ וחוזרות לעין, ולכן אנחנו {{רואים}} אותו.' : 'חושך מוחלט: האור לא פוגע בחפץ ולא חוזר לעין, ולכן {{לא רואים כלום}}.', on ? 'good' : 'bad');
    }));
    c.appendChild(seg(Object.keys(OBJ).map((k) => ({ t: OBJ[k].e + ' ' + OBJ[k].name, v: k })), 'apple', choose));
    box.appendChild(c);

    // Part 2: mixing colored lights on a wall
    box.appendChild(h('h3', { class: 'sim-sub' }, '🔦 מערבבים אורות צבעוניים'));
    const mix = svgBox(600, 300);
    const lights = { r: false, g: false, b: false };
    const mixMsg = h('div', { class: 'sim-msg' }, 'מדליקים פנסים צבעוניים על קיר חשוך. מה קורה במקום שבו הם נפגשים?');
    function drawMix() {
      mix.innerHTML = '';
      s('rect', { x: 0, y: 0, width: 600, height: 300, rx: 24, fill: '#000' }, mix);
      const grp = s('g', { style: 'isolation:isolate' }, mix);
      const C = { r: ['#ff0000', 250, 120], g: ['#00ff00', 350, 120], b: ['#0000ff', 300, 200] };
      Object.keys(C).forEach((k) => { if (lights[k]) s('circle', { cx: C[k][1], cy: C[k][2], r: 95, fill: C[k][0], style: 'mix-blend-mode:screen' }, grp); });
      const on3 = Object.keys(lights).filter((k) => lights[k]);
      const names = { r: 'אדום', g: 'ירוק', b: 'כחול' };
      let t = 'מדליקים פנסים צבעוניים על קיר חשוך. מה קורה במקום שבו הם נפגשים?';
      const key = on3.sort().join('');
      const RESULT = { gr: '{{אדום + ירוק = צהוב}}! 💛', br: '{{אדום + כחול = סגול־ורוד}} (מג׳נטה) 💜', bg: '{{ירוק + כחול = תכלת}} 🩵', bgr: 'כל שלושת האורות יחד = {{לבן}}! 🤍 כך גם המסך של הטלפון יוצר את כל הצבעים: מנקודות קטנטנות של אדום, ירוק וכחול.' };
      if (on3.length === 1) t = 'אור ' + names[on3[0]] + '. הדליקו עוד אחד!';
      if (RESULT[key]) t = RESULT[key];
      mixMsg.innerHTML = ''; mixMsg.appendChild(GS.fmt(t));
      mixMsg.className = 'sim-msg' + (on3.length === 3 ? ' good' : '');
      if (on3.length === 3 && !mixDone) { mixDone = true; check(); }
    }
    box.appendChild(mix);
    box.appendChild(mixMsg);
    const c2 = controls();
    [['r', '🔴 אדום'], ['g', '🟢 ירוק'], ['b', '🔵 כחול']].forEach(([k, label]) => {
      const b = btn(label, () => { lights[k] = !lights[k]; b.classList.toggle('primary', lights[k]); b.classList.toggle('ghost', !lights[k]); drawMix(); });
      c2.appendChild(b);
    });
    box.appendChild(c2);
    draw(); drawMix();
    say('בוחרים חפץ ורואים {{איזה צבע חוזר לעין}}. נסו גם לכבות את האור!');
  });

  // =====================================================================
  // 🔮 Kaleidoscope: three mirrors repeat one small picture again and again
  // =====================================================================
  GS.sim('kaleidoscope', (box, g, done) => {
    const SIZE = 600, C = SIZE / 2, RMAX = 280;
    const canvas = h('canvas', { width: SIZE, height: SIZE, class: 'kaleido' });
    const ctx = canvas.getContext('2d');
    const COLORS = ['#ff5d73', '#ffcb2e', '#4cc96b', '#4a8df0', '#b06bff', '#ff8f3f', '#3fd0d4', '#ffffff'];
    let beads = [], spinning = true, drawn = 0, finished = false;
    const say = message(box);
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function addBead(r, a) {
      beads.push({ r, a, size: rnd(14, 34), color: COLORS[Math.floor(Math.random() * COLORS.length)], shape: Math.floor(Math.random() * 3), rot: rnd(0, 6.28) });
      if (beads.length > 70) beads.shift();
    }
    function shake() { beads = []; for (let i = 0; i < 26; i++) addBead(rnd(20, RMAX - 10), rnd(0, 60)); }
    function fold(a) { a = ((a % 60) + 60) % 60; return a > 30 ? 60 - a : a; }
    function drawBead(b) {
      const a = fold(b.a) * Math.PI / 180;
      const x = Math.cos(a) * b.r, y = Math.sin(a) * b.r;
      ctx.save(); ctx.translate(x, y); ctx.rotate(b.rot);
      ctx.fillStyle = b.color; ctx.globalAlpha = 0.85;
      ctx.beginPath();
      if (b.shape === 0) ctx.arc(0, 0, b.size / 2, 0, 6.28);
      else if (b.shape === 1) { ctx.moveTo(0, -b.size / 2); ctx.lineTo(b.size / 2, b.size / 2); ctx.lineTo(-b.size / 2, b.size / 2); ctx.closePath(); }
      else ctx.rect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
      ctx.fill(); ctx.restore();
    }
    function render() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.save();
      ctx.beginPath(); ctx.arc(C, C, RMAX + 12, 0, 6.28); ctx.fillStyle = '#10142a'; ctx.fill(); ctx.clip();
      ctx.translate(C, C);
      for (let k = 0; k < 6; k++) {
        ctx.save(); ctx.rotate(k * Math.PI / 3);
        beads.forEach(drawBead);
        ctx.scale(1, -1);
        beads.forEach(drawBead);
        ctx.restore();
      }
      ctx.restore();
      ctx.lineWidth = 10; ctx.strokeStyle = '#7a5cff'; ctx.beginPath(); ctx.arc(C, C, RMAX + 12, 0, 6.28); ctx.stroke();
    }
    loop(box, (dt) => {
      if (spinning) beads.forEach((b) => { b.a += dt * 9 * (b.r / RMAX + 0.4); b.rot += dt; });
      render();
    });
    function pointer(e) {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * SIZE / r.width - C, y = (e.clientY - r.top) * SIZE / r.height - C;
      const rr = Math.hypot(x, y);
      if (rr > RMAX) return;
      addBead(rr, Math.atan2(y, x) * 180 / Math.PI);
      drawn++;
      if (drawn === 12 && !finished) { finished = true; celebrate(); say('יצרתם דוגמה משלכם! כל נקודה שציירתם הופיעה {{12 פעמים}}, בזכות המראות. 🌟', 'good'); done(); GS.showAfter(); }
    }
    let down = false;
    canvas.addEventListener('pointerdown', (e) => { down = true; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); pointer(e); e.preventDefault(); });
    canvas.addEventListener('pointermove', (e) => { if (down && Math.random() < 0.5) pointer(e); });
    canvas.addEventListener('pointerup', () => { down = false; });
    canvas.style.touchAction = 'none';
    box.appendChild(canvas);
    const c = controls();
    c.appendChild(btn('🫨 מנערים', () => { shake(); say('ניערנו! החרוזים זזו, והמראות יצרו {{דוגמה חדשה}}. אף פעם לא תראו את אותה דוגמה פעמיים.'); if (!finished) { finished = true; done(); GS.showAfter(); } }, 'primary'));
    const sb = btn('⏸ עוצרים', () => { spinning = !spinning; sb.textContent = spinning ? '⏸ עוצרים' : '🔄 מסובבים'; });
    c.appendChild(sb);
    c.appendChild(btn('🧽 מנקים', () => { beads = []; say('ריק. ציירו באצבע בתוך העיגול ✍️'); }));
    box.appendChild(c);
    shake();
    say('ציירו באצבע בתוך העיגול, או נערו. כל חרוז מופיע שוב ושוב, כי {{האור קופץ בין המראות}}.');
  });

  // =====================================================================
  // Drawings
  // =====================================================================
  GS.art.matter = () => {
    const panel = (x, label, dots) => '<g><rect x="' + x + '" y="30" width="96" height="120" rx="12" fill="#fff" stroke="#9fb7cf" stroke-width="3"/>' + dots +
      '<text x="' + (x + 48) + '" y="178" font-size="17" font-weight="700" text-anchor="middle" fill="#23324a">' + label + '</text></g>';
    let solid = '', liquid = '', gas = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) solid += '<circle cx="' + (25 + c * 18) + '" cy="' + (88 + r * 18) + '" r="8" fill="#3f8cff"/>';
    [[18, 128], [36, 136], [55, 126], [74, 135], [28, 112], [48, 110], [68, 116], [86, 128], [40, 92], [62, 98]].forEach((p) => { liquid += '<circle cx="' + (112 + p[0]) + '" cy="' + p[1] + '" r="8" fill="#3f8cff"/>'; });
    [[20, 50], [70, 44], [44, 80], [80, 100], [24, 120], [60, 132]].forEach((p) => { gas += '<circle cx="' + (214 + p[0]) + '" cy="' + p[1] + '" r="8" fill="#3f8cff"/>'; });
    return '<svg viewBox="0 0 320 200" class="art-svg"><rect width="320" height="200" rx="20" fill="#f4f9ff"/>' +
      panel(8, '🧊 מוצק', solid) + panel(112, '💧 נוזל', liquid) + panel(216, '♨️ גז', gas) + '</svg>';
  };

  GS.art.sublimation = () => '<svg viewBox="0 0 320 200" class="art-svg"><rect width="320" height="200" rx="20" fill="#eef3f8"/>' +
    '<rect x="30" y="110" width="70" height="50" rx="8" fill="#ffffff" stroke="#c9d4de" stroke-width="3"/><text x="65" y="185" font-size="15" text-anchor="middle" font-weight="700">מוצק</text>' +
    '<text x="160" y="70" font-size="15" text-anchor="middle" fill="#8a96a3" text-decoration="line-through">נוזל 💧</text>' +
    '<path d="M105 130 C 150 125, 180 120, 215 110" stroke="#4cc96b" stroke-width="5" fill="none"/><polygon points="222,108 206,102 210,118" fill="#4cc96b"/>' +
    '<text x="160" y="150" font-size="16" text-anchor="middle" font-weight="800" fill="#2f9e4d">המראה!</text>' +
    '<g fill="#c4cdd6"><circle cx="250" cy="100" r="9"/><circle cx="282" cy="80" r="9"/><circle cx="262" cy="130" r="9"/><circle cx="292" cy="118" r="9"/></g>' +
    '<text x="270" y="185" font-size="15" text-anchor="middle" font-weight="700">גז</text></svg>';

  GS.art.seeing = () => '<svg viewBox="0 0 320 200" class="art-svg"><rect width="320" height="200" rx="20" fill="#eef3fb"/>' +
    '<text x="40" y="60" font-size="40" text-anchor="middle">☀️</text><text x="160" y="160" font-size="48" text-anchor="middle">🍎</text><text x="280" y="70" font-size="40" text-anchor="middle">👁️</text>' +
    '<g stroke="#ffb703" stroke-width="4"><line x1="60" y1="70" x2="140" y2="128"/><line x1="66" y1="58" x2="150" y2="118"/></g><polygon points="146,132 132,122 140,116" fill="#ffb703"/>' +
    '<g stroke="#e02d2d" stroke-width="4"><line x1="182" y1="120" x2="252" y2="80"/></g><polygon points="262,74 246,76 252,88" fill="#e02d2d"/>' +
    '<text x="95" y="120" font-size="13" text-anchor="middle" fill="#a06d00">אור פוגע</text><text x="230" y="125" font-size="13" text-anchor="middle" fill="#b42323">וחוזר לעין</text></svg>';

  GS.art.reflection = () => '<svg viewBox="0 0 320 200" class="art-svg"><rect width="320" height="200" rx="20" fill="#14182b"/>' +
    '<line x1="60" y1="170" x2="260" y2="170" stroke="#cfe8ff" stroke-width="8" stroke-linecap="round"/>' +
    '<line x1="160" y1="170" x2="160" y2="40" stroke="#fff" stroke-width="2" stroke-dasharray="6 6" opacity=".7"/>' +
    '<line x1="60" y1="60" x2="160" y2="170" stroke="#ff5a5a" stroke-width="4"/><line x1="160" y1="170" x2="260" y2="60" stroke="#ff5a5a" stroke-width="4"/>' +
    '<path d="M136 144 A 36 36 0 0 1 160 134" stroke="#ffd34d" stroke-width="3" fill="none"/><path d="M160 134 A 36 36 0 0 1 184 144" stroke="#7fe0a0" stroke-width="3" fill="none"/>' +
    '<text x="120" y="128" font-size="13" fill="#ffd34d" text-anchor="middle">זווית פגיעה</text><text x="204" y="128" font-size="13" fill="#7fe0a0" text-anchor="middle">זווית החזרה</text>' +
    '<text x="160" y="30" font-size="14" fill="#fff" text-anchor="middle">שוות!</text><text x="160" y="194" font-size="12" fill="#cfe8ff" text-anchor="middle">מראה</text></svg>';

  GS.art.prism = () => {
    const cols = ['#ff3b3b', '#ff9f1a', '#ffe14d', '#3ddc5a', '#3b82ff', '#9b5cff'];
    let rays = '';
    cols.forEach((c, i) => { rays += '<line x1="190" y1="105" x2="305" y2="' + (70 + i * 16) + '" stroke="' + c + '" stroke-width="6"/>'; });
    return '<svg viewBox="0 0 320 200" class="art-svg"><rect width="320" height="200" rx="20" fill="#10142a"/>' +
      '<line x1="10" y1="120" x2="150" y2="108" stroke="#fff" stroke-width="7"/>' + rays +
      '<polygon points="160,40 220,160 100,160" fill="#bfe3ff" opacity=".45" stroke="#e6f4ff" stroke-width="3"/>' +
      '<text x="60" y="150" font-size="14" fill="#fff" text-anchor="middle">אור לבן</text><text x="270" y="190" font-size="14" fill="#fff" text-anchor="middle">כל הצבעים!</text></svg>';
  };

  GS.art.kaleido = () => '<svg viewBox="0 0 320 200" class="art-svg"><rect width="320" height="200" rx="20" fill="#f3eefe"/>' +
    '<rect x="20" y="80" width="170" height="44" rx="22" fill="#b06bff"/><circle cx="190" cy="102" r="22" fill="#7a5cff"/><circle cx="24" cy="102" r="10" fill="#ffcb2e"/>' +
    '<text x="105" y="70" font-size="14" text-anchor="middle" font-weight="700">צינור</text>' +
    '<polygon points="265,50 300,115 230,115" fill="#e6f4ff" stroke="#7a9cc6" stroke-width="5"/>' +
    '<circle cx="262" cy="96" r="6" fill="#ff5d73"/><circle cx="252" cy="104" r="5" fill="#4cc96b"/><circle cx="272" cy="104" r="5" fill="#4a8df0"/>' +
    '<text x="265" y="140" font-size="13" text-anchor="middle" font-weight="700">3 מראות</text><text x="265" y="158" font-size="13" text-anchor="middle" font-weight="700">במשולש</text>' +
    '<text x="105" y="160" font-size="13" text-anchor="middle">מסתכלים כאן 👁️ ← חרוזים בקצה</text></svg>';
})();
