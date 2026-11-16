/* Green Scientist — simulations for class 5 (vacuum and low pressure) and class 6 (electric circuit). */
(function () {
  'use strict';
  const GS = window.GS;
  const { h, toast, celebrate } = GS;
  const { s, svgBox, text, loop, controls, btn, seg, message, arrow } = GS.simKit;

  // =====================================================================
  // 🕯️ Candle under a jar: the pressure inside drops, and the outside air pushes the water in
  // =====================================================================
  GS.sim('candleJar', (box, g, done) => {
    const W = 600, H = 420, plateY = 350, jx1 = 215, jx2 = 385, jTop = 110, rim = plateY + 12;
    const svg = svgBox(W, H);
    s('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#f6efe3' }, svg);
    s('rect', { x: 0, y: 392, width: W, height: 28, fill: '#c9a982' }, svg);
    s('ellipse', { cx: 300, cy: 380, rx: 250, ry: 22, fill: '#e9eef3', stroke: '#c5ced8', 'stroke-width': 3 }, svg);
    const waterOut = s('rect', { x: 62, y: plateY, width: 476, height: 30, rx: 10, fill: '#7cc6fe', opacity: 0.75 }, svg);
    const waterIn = s('rect', { x: jx1 + 4, y: plateY, width: jx2 - jx1 - 8, height: 30, fill: '#5bb3f5', opacity: 0.85 }, svg);
    // candle
    s('rect', { x: 286, y: 270, width: 28, height: 82, rx: 4, fill: '#fff4d6', stroke: '#e6d3a0', 'stroke-width': 2 }, svg);
    s('line', { x1: 300, y1: 270, x2: 300, y2: 260, stroke: '#333', 'stroke-width': 3 }, svg);
    const flame = s('ellipse', { cx: 300, cy: 246, rx: 9, ry: 18, fill: '#ffb703' }, svg);
    const flameCore = s('ellipse', { cx: 300, cy: 252, rx: 4, ry: 9, fill: '#fff3b0' }, svg);
    const smoke = s('g', {}, svg);
    const air = s('g', {}, svg);
    const pushes = s('g', { opacity: 0 }, svg);
    arrow(pushes, 120, 300, 120, 342, '#2f66c0', 6); arrow(pushes, 480, 300, 480, 342, '#2f66c0', 6);
    text(pushes, 120, 288, 'האוויר בחוץ דוחף', { 'font-size': 14, fill: '#2f66c0', 'font-weight': 700 });
    text(pushes, 480, 288, 'האוויר בחוץ דוחף', { 'font-size': 14, fill: '#2f66c0', 'font-weight': 700 });
    const jar = s('g', {}, svg);
    s('path', { d: 'M' + jx1 + ' ' + rim + ' V' + (jTop + 30) + ' Q' + jx1 + ' ' + jTop + ' ' + (jx1 + 30) + ' ' + jTop + ' H' + (jx2 - 30) + ' Q' + jx2 + ' ' + jTop + ' ' + jx2 + ' ' + (jTop + 30) + ' V' + rim, fill: 'rgba(200,230,255,.18)', stroke: '#9fc6e6', 'stroke-width': 5 }, jar);
    const gauge = text(svg, 300, 30, '', { 'font-size': 17, 'font-weight': 800, fill: '#23324a' });
    const parts = [];
    for (let i = 0; i < 26; i++) parts.push({ x: jx1 + 20 + Math.random() * 130, y: jTop + 20 + Math.random() * 200, a: Math.random() * 6.28, el: s('circle', { r: 5, fill: '#9ec9ff' }, air) });
    let jarY = -230, covered = false, oxygen = 1, heat = 0, level = 0, lit = true, t0 = 0, finished = false;
    const say = message(box);
    loop(box, (dt, t) => {
      if (covered && jarY < 0) jarY = Math.min(0, jarY + 400 * dt);
      jar.setAttribute('transform', 'translate(0,' + jarY.toFixed(1) + ')');
      const inside = covered && jarY === 0;
      if (lit) {
        const f = inside ? Math.max(0, oxygen) : 1;
        const flick = 1 + Math.sin(t * 23) * 0.08;
        flame.setAttribute('ry', (18 * f * flick + 0.01).toFixed(1)); flame.setAttribute('rx', (9 * f + 0.01).toFixed(1));
        flame.setAttribute('cy', (264 - 18 * f).toFixed(1));
        flameCore.setAttribute('ry', (9 * f * flick + 0.01).toFixed(1)); flameCore.setAttribute('cy', (264 - 12 * f).toFixed(1));
        if (inside) {
          oxygen -= dt * 0.22; heat = Math.min(1, heat + dt * 0.5);
          if (oxygen <= 0) {
            lit = false; t0 = t;
            flame.setAttribute('ry', 0); flameCore.setAttribute('ry', 0);
            say('הנר כבה! הוא {{שרף את החמצן}} שבצנצנת. ועכשיו, האוויר החם בפנים מתחיל להתקרר… הסתכלו על המים!');
          }
        }
      } else if (inside) {
        heat = Math.max(0, heat - dt * 0.35);
        level = Math.min(1, level + dt * 0.28);
        if (t - t0 < 2.5 && Math.random() < dt * 6) smoke.appendChild(s('circle', { cx: 300 + (Math.random() - 0.5) * 6, cy: 255, r: 4, fill: '#999', opacity: 0.5 }));
        if (level >= 1 && !finished) {
          finished = true;
          say('המים {{נכנסו לצנצנת}}! בפנים נוצר {{תת־לחץ}} (ואקום חלקי), והאוויר בחוץ, שהלחץ שלו גבוה יותר, {{דחף}} את המים פנימה.', 'good');
          celebrate(); done(); GS.showAfter();
        }
      }
      smoke.querySelectorAll('circle').forEach((c) => {
        const y = +c.getAttribute('cy') - 30 * dt;
        c.setAttribute('cy', y); c.setAttribute('r', +c.getAttribute('r') + dt * 6); c.setAttribute('opacity', Math.max(0, +c.getAttribute('opacity') - dt * 0.15));
        if (+c.getAttribute('opacity') <= 0) c.remove();
      });
      const rise = level * 75;
      waterIn.setAttribute('y', (plateY - rise).toFixed(1)); waterIn.setAttribute('height', (30 + rise).toFixed(1));
      waterOut.setAttribute('y', (plateY + level * 6).toFixed(1));
      pushes.setAttribute('opacity', (level > 0.05 ? 0.4 + 0.6 * Math.abs(Math.sin(t * 3)) : 0).toFixed(2));
      const sp = 40 + heat * 160 - level * 20;
      parts.forEach((p) => {
        p.a += (Math.random() - 0.5) * 3 * dt;
        p.x += Math.cos(p.a) * sp * dt; p.y += Math.sin(p.a) * sp * dt;
        const top = inside ? jTop + 12 : 30, bottom = plateY - rise - 8;
        if (p.x < jx1 + 10 || p.x > jx2 - 10) { p.a = Math.PI - p.a; p.x = Math.max(jx1 + 10, Math.min(jx2 - 10, p.x)); }
        if (p.y < top + jarY * (inside ? 0 : 1) || p.y > bottom) { p.a = -p.a; p.y = Math.max(top, Math.min(bottom, p.y)); }
        p.el.setAttribute('cx', p.x.toFixed(1)); p.el.setAttribute('cy', p.y.toFixed(1));
        p.el.setAttribute('fill', heat > 0.5 ? '#ffb3a1' : '#9ec9ff');
        p.el.setAttribute('opacity', inside || jarY > -10 ? 1 : 0);
      });
      gauge.textContent = inside ? 'לחץ האוויר בצנצנת: ' + (level > 0.1 ? 'נמוך ⬇️' : heat > 0.3 ? 'האוויר חם ומתפשט' : 'רגיל') : '';
    });
    box.appendChild(svg);
    const c = controls();
    c.appendChild(btn('🫙 מכסים בצנצנת', () => {
      if (covered) return;
      covered = true;
      say('כיסינו את הנר בצנצנת, ושפתה בתוך המים. עכשיו הנר יכול להשתמש רק בחמצן שבתוך הצנצנת…');
    }, 'primary'));
    c.appendChild(btn('🔄 מההתחלה', () => {
      covered = false; jarY = -230; oxygen = 1; heat = 0; level = 0; lit = true; finished = false; smoke.innerHTML = '';
      say('נר דולק על צלחת עם מים. מה יקרה כשנכסה אותו בצנצנת הפוכה?');
    }));
    box.appendChild(c);
    box.appendChild(h('p', { class: 'hint' }, '⚠️ ניסוי עם אש עושים רק עם מבוגר.'));
    say('נר דולק על צלחת עם מים. מה יקרה כשנכסה אותו בצנצנת הפוכה?');
  });

  // =====================================================================
  // 🫁 Breathing: the diaphragm goes down, the lungs get bigger, pressure inside drops, air comes in
  // =====================================================================
  GS.sim('lungs', (box, g, done) => {
    const W = 600, H = 420;
    const svg = svgBox(W, H);
    s('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#fff4f1' }, svg);
    s('path', { d: 'M180 400 Q160 210 230 150 Q300 120 370 150 Q440 210 420 400 Z', fill: '#ffe0d1', stroke: '#f2b8a0', 'stroke-width': 4 }, svg);
    s('rect', { x: 290, y: 30, width: 20, height: 120, rx: 8, fill: '#f6a9a0' }, svg);
    text(svg, 300, 22, '👃', { 'font-size': 28 });
    const lungL = s('ellipse', { cx: 250, cy: 240, rx: 52, ry: 80, fill: '#ff8fa3' }, svg);
    const lungR = s('ellipse', { cx: 350, cy: 240, rx: 52, ry: 80, fill: '#ff8fa3' }, svg);
    s('path', { d: 'M300 150 L262 190 M300 150 L338 190', stroke: '#e0707f', 'stroke-width': 10, 'stroke-linecap': 'round' }, svg);
    for (let i = 0; i < 4; i++) s('path', { d: 'M205 ' + (180 + i * 40) + ' Q300 ' + (165 + i * 40) + ' 395 ' + (180 + i * 40), stroke: '#e8c1ad', 'stroke-width': 4, fill: 'none', opacity: 0.6 }, svg);
    const dia = s('path', { d: '', stroke: '#c0392b', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }, svg);
    text(svg, 470, 330, 'סרעפת', { 'font-size': 16, 'font-weight': 700, fill: '#c0392b' });
    s('line', { x1: 430, y1: 330, x2: 400, y2: 330, stroke: '#c0392b', 'stroke-width': 2 }, svg);
    const flow = s('g', {}, svg);
    const label = text(svg, 300, 245, '', { 'font-size': 16, 'font-weight': 800, fill: '#7a1f2b' });
    let b = 0, target = 0, did = new Set();
    const say = message(box);
    loop(box, (dt, t) => {
      const old = b;
      b += (target - b) * Math.min(1, dt * 2.2);
      const sc = 1 + b * 0.22;
      lungL.setAttribute('rx', (52 * sc).toFixed(1)); lungL.setAttribute('ry', (80 * sc).toFixed(1));
      lungR.setAttribute('rx', (52 * sc).toFixed(1)); lungR.setAttribute('ry', (80 * sc).toFixed(1));
      const dy = 330 + b * 40, curve = 290 + b * 70;
      dia.setAttribute('d', 'M195 ' + dy + ' Q300 ' + curve + ' 405 ' + dy);
      const v = b - old;
      flow.innerHTML = '';
      if (Math.abs(v) > 0.0015) {
        const phase = (t * 3) % 1;
        for (let k = 0; k < 3; k++) {
          const y = v > 0 ? 40 + ((phase + k / 3) % 1) * 100 : 140 - ((phase + k / 3) % 1) * 100;
          arrow(flow, 300, y - (v > 0 ? 14 : -14), 300, y, '#3b82ff', 5);
        }
        label.textContent = v > 0 ? 'תת־לחץ ⬇️' : 'לחץ גבוה ⬆️';
      } else label.textContent = '';
    });
    box.appendChild(svg);
    const c = controls();
    c.appendChild(btn('😮‍💨 שואפים', () => {
      target = 1; did.add('in');
      say('ה{{סרעפת}} יורדת למטה, ובית החזה מתרחב. הריאות גדלות, והלחץ בתוכן {{יורד}}: נוצר {{תת־לחץ}}. האוויר מבחוץ נדחף פנימה! 🌬️', 'good');
      if (did.size === 2) { done(); GS.showAfter(); }
    }, 'primary'));
    c.appendChild(btn('💨 נושפים', () => {
      target = 0; did.add('out');
      say('הסרעפת עולה, הריאות קטנות, והלחץ בתוכן {{עולה}}. האוויר נדחף החוצה.');
      if (did.size === 2) { done(); GS.showAfter(); }
    }));
    box.appendChild(c);
    say('לוחצים על "שואפים" ומסתכלים על הסרעפת ועל הריאות. ואחר כך "נושפים". נסו לנשום יחד עם הציור!');
  });

  // =====================================================================
  // 🥤 Straw challenge: suck to hold a piece of paper, stop sucking to drop it in the box
  // =====================================================================
  GS.sim('straw', (box, g, done) => {
    const W = 600, H = 380, table = 330;
    const svg = svgBox(W, H);
    s('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#eef7ee' }, svg);
    s('rect', { x: 0, y: table, width: W, height: H - table, fill: '#d8b98f' }, svg);
    const bx = 470;
    s('rect', { x: bx - 60, y: table - 70, width: 120, height: 70, rx: 8, fill: '#c98f4f' }, svg);
    s('rect', { x: bx - 66, y: table - 76, width: 132, height: 14, rx: 6, fill: '#a86f34' }, svg);
    const inBoxTxt = text(svg, bx, table - 30, '0', { 'font-size': 26, 'font-weight': 800, fill: '#fff' });
    const papers = [];
    const COLORS = ['#ff5d73', '#ffcb2e', '#4a8df0', '#4cc96b', '#b06bff'];
    for (let i = 0; i < 5; i++) {
      const p = { x: 70 + i * 62, y: table - 5, home: [70 + i * 62, table - 5], state: 'table', el: s('rect', { width: 44, height: 10, rx: 2, fill: COLORS[i], class: 'tap' }, svg) };
      p.hit = s('rect', { width: 62, height: 60, fill: 'transparent', class: 'tap' }, svg);
      p.hit.addEventListener('click', () => goTo(p));
      papers.push(p);
    }
    const straw = s('g', {}, svg);
    s('rect', { x: -7, y: -260, width: 14, height: 260, rx: 5, fill: '#ff8fd1', stroke: '#e06bb3', 'stroke-width': 2 }, straw);
    for (let k = 0; k < 8; k++) s('line', { x1: -7, y1: -250 + k * 32, x2: 7, y2: -238 + k * 32, stroke: '#fff', 'stroke-width': 3 }, straw);
    const flowG = s('g', {}, svg);
    const boxHit = s('rect', { x: bx - 70, y: table - 160, width: 140, height: 160, fill: 'transparent', class: 'tap' }, svg);
    boxHit.addEventListener('click', () => { sx = bx; sy = table - 110; overBox = true; });
    let sx = 300, sy = 150, cx = 300, cy = 150, suck = false, held = null, overBox = false, inBox = 0;
    const say = message(box);
    function goTo(p) {
      if (p.state !== 'table') return;
      overBox = false;
      sx = p.x + 22; sy = p.y - 2;
      if (held) return;
      setTimeout(() => {
        if (Math.hypot(cx - sx, cy - sy) > 20) return;
        if (!suck) { say('הקשית נוגעת בנייר, אבל {{בלי לשאוב}} הוא לא נדבק. לוחצים "שואבים"!', 'bad'); return; }
        held = p; p.state = 'held';
        sy = 150;
        say('הנייר {{נדבק}} לקשית! כששואבים, הלחץ בתוך הקשית יורד, ו{{האוויר מבחוץ דוחף}} את הנייר אל הקשית. עכשיו לוחצים על הקופסה.', 'good');
      }, 650);
    }
    function setSuck(v) {
      suck = v;
      if (!v && held) {
        const p = held; held = null;
        if (overBox && Math.abs(cx - bx) < 40) {
          p.state = 'box'; inBox++; inBoxTxt.textContent = inBox;
          p.el.setAttribute('opacity', 0); p.hit.remove();
          say(inBox >= 3 ? 'הצלחתם! 🎉 העברתם ' + inBox + ' פיסות נייר רק בעזרת {{תת־לחץ}}. בדיוק כמו אתגר הסיום בחוג!' : 'הפסקנו לשאוב, הלחץ חזר להיות רגיל, והנייר נפל לקופסה! עוד ' + (3 - inBox) + '…', 'good');
          if (inBox === 3) { celebrate(); done(); GS.showAfter(); }
        } else {
          p.state = 'table';
          say('הפסקנו לשאוב באמצע הדרך, והנייר נפל. מנסים שוב!', 'bad');
        }
      }
    }
    loop(box, (dt, t) => {
      cx += (sx - cx) * Math.min(1, dt * 5); cy += (sy - cy) * Math.min(1, dt * 5);
      straw.setAttribute('transform', 'translate(' + cx.toFixed(1) + ',' + cy.toFixed(1) + ')');
      papers.forEach((p) => {
        if (p.state === 'held') { p.x = cx - 22; p.y = cy + 2; }
        else if (p.state === 'table') { p.x += (p.home[0] - p.x) * 0.2; p.y += (p.home[1] - p.y) * 0.2; }
        p.el.setAttribute('x', p.x.toFixed(1)); p.el.setAttribute('y', p.y.toFixed(1));
        p.hit.setAttribute && p.hit.setAttribute('x', p.home[0] - 9); p.hit.setAttribute && p.hit.setAttribute('y', p.home[1] - 45);
      });
      flowG.innerHTML = '';
      if (suck) for (let k = 0; k < 3; k++) {
        const y = cy - ((t * 120 + k * 80) % 240);
        s('circle', { cx: cx, cy: y, r: 3, fill: '#fff', opacity: 0.9 }, flowG);
      }
    });
    box.appendChild(svg);
    const c = controls();
    const sb = btn('😮 שואבים: לא', () => { setSuck(!suck); sb.textContent = '😮 שואבים: ' + (suck ? 'כן' : 'לא'); sb.classList.toggle('primary', suck); sb.classList.toggle('ghost', !suck); });
    c.appendChild(sb);
    box.appendChild(c);
    box.appendChild(h('p', { class: 'hint' }, 'איך משחקים: לוחצים "שואבים", לוחצים על פיסת נייר, ואז על הקופסה. כדי לשחרר את הנייר, מפסיקים לשאוב.'));
    say('האתגר מהחוג: מעבירים 3 פיסות נייר לקופסה, רק עם קשית ו{{תת־לחץ}}!');
  });

  // =====================================================================
  // 🏓 Venturi cannon: fast air in a narrow tube has low pressure. It pulls balls in and shoots them out.
  // =====================================================================
  GS.sim('venturi', (box, g, done) => {
    const W = 600, H = 360, cy = 130;
    const svg = svgBox(W, H);
    s('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#eaf4ff' }, svg);
    const tube = 'M70 90 H220 L270 116 H330 L380 90 H540 V170 H380 L330 144 H270 L220 170 H70 Z';
    s('path', { d: tube, fill: '#ffffff', stroke: '#7a9cc6', 'stroke-width': 4, opacity: 0.9 }, svg);
    s('rect', { x: 288, y: 144, width: 24, height: 130, fill: '#ffffff', stroke: '#7a9cc6', 'stroke-width': 4 }, svg);
    s('rect', { x: 240, y: 270, width: 120, height: 60, rx: 10, fill: '#d6e6f7', stroke: '#7a9cc6', 'stroke-width': 3 }, svg);
    text(svg, 40, cy, '🌀', { 'font-size': 44 });
    const meterWide = s('rect', { x: 130, y: 40, width: 20, height: 40, fill: '#4a8df0' }, svg);
    const meterNarrow = s('rect', { x: 290, y: 40, width: 20, height: 40, fill: '#4a8df0' }, svg);
    text(svg, 140, 30, 'לחץ', { 'font-size': 13, 'font-weight': 700 }); text(svg, 300, 30, 'לחץ', { 'font-size': 13, 'font-weight': 700 });
    const airG = s('g', {}, svg), ballG = s('g', {}, svg);
    const shotTxt = text(svg, 560, 300, '', { 'font-size': 18, 'font-weight': 800, fill: '#2f66c0' });
    let speed = 0, shots = 0;
    const particles = [];
    const balls = [];
    for (let i = 0; i < 6; i++) balls.push({ x: 260 + (i % 3) * 30, y: 312 - Math.floor(i / 3) * 22, home: [260 + (i % 3) * 30, 312 - Math.floor(i / 3) * 22], st: 'box', vx: 0, vy: 0 });
    const say = message(box);
    function halfWidth(x) { if (x < 220) return 40; if (x < 270) return 40 - (x - 220) * 0.52; if (x < 330) return 14; if (x < 380) return 14 + (x - 330) * 0.52; return 40; }
    loop(box, (dt) => {
      if (Math.random() < speed * dt * 30) particles.push({ x: 75, y: cy + (Math.random() - 0.5) * 70 });
      airG.innerHTML = '';
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i], hw = halfWidth(p.x);
        p.x += speed * 200 * (40 / hw) * dt;
        p.y = cy + Math.max(-hw + 3, Math.min(hw - 3, p.y - cy)) * 1;
        if (p.x > 600) { particles.splice(i, 1); continue; }
        s('line', { x1: p.x - 6 - speed * 4 * (40 / hw), y1: p.y, x2: p.x, y2: p.y, stroke: '#7fb3ff', 'stroke-width': 3, 'stroke-linecap': 'round' }, airG);
      }
      meterWide.setAttribute('height', 40 - speed * 4); meterWide.setAttribute('y', 40 + speed * 4);
      meterNarrow.setAttribute('height', Math.max(4, 40 - speed * 12)); meterNarrow.setAttribute('y', 40 + Math.min(36, speed * 12));
      ballG.innerHTML = '';
      balls.forEach((b, i) => {
        if (b.st === 'box') {
          const lift = speed >= 3 && i === balls.findIndex((x) => x.st === 'box') && !balls.some((x) => x.st === 'up' || x.st === 'tube');
          if (speed >= 2) { b.x = b.home[0] + (Math.random() - 0.5) * 2 * speed; b.y = b.home[1] - Math.random() * speed * 2; } else { b.x = b.home[0]; b.y = b.home[1]; }
          if (lift) { b.st = 'up'; b.x = 300; b.y = 262; }
        } else if (b.st === 'up') {
          b.y -= 260 * dt;
          if (speed < 3) { b.st = 'fall'; }
          if (b.y <= cy) { b.st = 'tube'; b.y = cy; }
        } else if (b.st === 'fall') {
          b.y += 300 * dt; if (b.y >= b.home[1]) { b.st = 'box'; }
        } else if (b.st === 'tube') {
          b.x += 520 * dt;
          if (b.x > 540) { b.st = 'fly'; b.vx = 320; b.vy = -150; }
        } else if (b.st === 'fly') {
          b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 420 * dt;
          if (b.y > 340 || b.x > 620) {
            b.st = 'box'; shots++; shotTxt.textContent = '🏓 × ' + shots;
            if (shots === 3) { celebrate(); say('בום! 🏓🏓🏓 {{אוויר מהיר}} בחלק הצר יוצר {{לחץ נמוך}}, הוא "שואב" את הכדורים למעלה, והזרם יורה אותם החוצה!', 'good'); done(); GS.showAfter(); }
          }
        }
        s('circle', { cx: b.x.toFixed(1), cy: b.y.toFixed(1), r: 10, fill: '#fff', stroke: '#f08c2e', 'stroke-width': 3 }, ballG);
      });
    });
    box.appendChild(svg);
    const c = controls();
    c.appendChild(seg([{ t: '⏹ כבוי', v: 0 }, { t: '🌬️ חלש', v: 1 }, { t: '💨 בינוני', v: 2 }, { t: '🌪️ חזק', v: 3 }], 0, (v) => {
      speed = v;
      say(['האוויר עומד. הלחץ בכל הצינור שווה.',
        'זרם חלש. בחלק הצר האוויר זז {{מהר יותר}}, והלחץ שם יורד קצת. רואים במדים למעלה?',
        'יותר מהר! הלחץ בחלק הצר ירד עוד, והכדורים כבר רועדים… אבל עוד לא מספיק.',
        'זרם חזק! הלחץ בחלק הצר נמוך מאוד, ו{{האוויר מתחת דוחף}} את הכדורים למעלה, לתוך הזרם. אש! 🏓'][v], v === 3 ? 'good' : '');
    }));
    box.appendChild(c);
    say('זה {{צינור ונטורי}}: צינור שבאמצע שלו יש חלק צר. מדליקים את המפוח ובודקים מה קורה לכדורים.');
  });

  // =====================================================================
  // ⚡ Electric circuit: close the switch, electrons flow, the bulb lights and the buzzer buzzes
  // =====================================================================
  function buzzer() {
    let ctx = null, osc = null, gain = null, timer = null;
    return {
      on() {
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          if (!ctx) ctx = new AC();
          if (ctx.state === 'suspended') ctx.resume();
          if (osc) return;
          osc = ctx.createOscillator(); gain = ctx.createGain();
          osc.type = 'square'; osc.frequency.value = 520; gain.gain.value = 0;
          osc.connect(gain); gain.connect(ctx.destination); osc.start();
          let k = 0;
          timer = setInterval(() => { if (gain) gain.gain.value = (k++ % 2) ? 0 : 0.04; }, 180);
        } catch (e) { /* no sound */ }
      },
      off() {
        clearInterval(timer); timer = null;
        if (osc) { try { osc.stop(); } catch (e) { /* already stopped */ } osc.disconnect(); osc = null; }
      }
    };
  }

  GS.sim('circuit', (box, g, done) => {
    const W = 600, H = 380;
    const svg = svgBox(W, H);
    s('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#f5f7fb' }, svg);
    // loop: battery on the left side, switch top-left, bulb top-right, buzzer right side
    const P = [[110, 290], [110, 90], [490, 90], [490, 290], [110, 290]];
    const wire = s('polyline', { points: P.map((p) => p.join(',')).join(' '), fill: 'none', stroke: '#c2410c', 'stroke-width': 6, 'stroke-linejoin': 'round' }, svg);
    // switch gap
    s('rect', { x: 200, y: 80, width: 70, height: 20, fill: '#f5f7fb' }, svg);
    s('circle', { cx: 200, cy: 90, r: 7, fill: '#555' }, svg); s('circle', { cx: 270, cy: 90, r: 7, fill: '#555' }, svg);
    const lever = s('line', { x1: 200, y1: 90, x2: 262, y2: 58, stroke: '#555', 'stroke-width': 7, 'stroke-linecap': 'round' }, svg);
    text(svg, 235, 120, 'מתג', { 'font-size': 14, 'font-weight': 700, fill: '#555' });
    // battery
    s('rect', { x: 70, y: 150, width: 80, height: 110, rx: 10, fill: '#2b2f3a' }, svg);
    s('rect', { x: 70, y: 150, width: 80, height: 40, rx: 10, fill: '#e0a800' }, svg);
    s('rect', { x: 98, y: 140, width: 24, height: 12, rx: 3, fill: '#999' }, svg);
    text(svg, 110, 172, '+', { 'font-size': 26, 'font-weight': 900, fill: '#2b2f3a' });
    text(svg, 110, 238, '−', { 'font-size': 30, 'font-weight': 900, fill: '#fff' });
    // bulb on top wire
    const bulbG = s('g', {}, svg);
    const glow = s('circle', { cx: 380, cy: 60, r: 0, fill: '#ffe066', opacity: 0.55 }, bulbG);
    const glass = s('circle', { cx: 380, cy: 60, r: 26, fill: '#eef3f8', stroke: '#9aa6b2', 'stroke-width': 3 }, bulbG);
    s('rect', { x: 368, y: 82, width: 24, height: 14, rx: 3, fill: '#9aa6b2' }, bulbG);
    const fil = s('path', { d: 'M368 66 l6 -10 l6 10 l6 -10 l6 10', stroke: '#7a6a50', 'stroke-width': 2.5, fill: 'none' }, bulbG);
    // buzzer on right wire
    const buzzG = s('g', {}, svg);
    s('rect', { x: 465, y: 165, width: 50, height: 50, rx: 25, fill: '#1f2937' }, buzzG);
    s('circle', { cx: 490, cy: 190, r: 8, fill: '#4b5563' }, buzzG);
    const waves = s('g', { opacity: 0 }, buzzG);
    text(waves, 545, 190, '🔊', { 'font-size': 26 });
    const elG = s('g', {}, svg);
    let closed = false, dev = 'bulb', heardBulb = false, heardBuzz = false;
    const bz = buzzer();
    const watcher = setInterval(() => { if (!box.isConnected) { bz.off(); clearInterval(watcher); } }, 500);
    // electrons along the loop (from − at the bottom of the battery, around, back to +)
    const path = [[110, 290], [490, 290], [490, 90], [110, 90], [110, 150]];
    const segs = [];
    let total = 0;
    for (let i = 0; i + 1 < path.length; i++) { const L = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]); segs.push(L); total += L; }
    function at(d) { d = ((d % total) + total) % total; for (let i = 0; i < segs.length; i++) { if (d <= segs[i]) { const u = d / segs[i]; return [path[i][0] + (path[i + 1][0] - path[i][0]) * u, path[i][1] + (path[i + 1][1] - path[i][1]) * u]; } d -= segs[i]; } return path[0]; }
    const electrons = [];
    for (let i = 0; i < 26; i++) electrons.push({ d: (i / 26) * total, el: s('circle', { r: 5, fill: '#3b82ff' }, elG) });
    const say = message(box);
    function update() {
      const hasBulb = dev !== 'buzz', hasBuzz = dev !== 'bulb';
      bulbG.setAttribute('opacity', hasBulb ? 1 : 0.15);
      buzzG.setAttribute('opacity', hasBuzz ? 1 : 0.15);
      lever.setAttribute('x2', closed ? 270 : 262); lever.setAttribute('y2', closed ? 90 : 58);
      const lit = closed && hasBulb;
      glow.setAttribute('r', lit ? 48 : 0);
      glass.setAttribute('fill', lit ? '#fff3a3' : '#eef3f8');
      fil.setAttribute('stroke', lit ? '#ff9f1a' : '#7a6a50');
      waves.setAttribute('opacity', closed && hasBuzz ? 1 : 0);
      if (closed && hasBuzz) bz.on(); else bz.off();
      if (closed && hasBulb) heardBulb = true;
      if (closed && hasBuzz) heardBuzz = true;
      if (closed) say(dev === 'both' ? 'המעגל סגור! האלקטרונים עוברים {{דרך הנורה וגם דרך הזמזם}}, ומפעילים את שניהם. 💡🔔' : dev === 'bulb' ? 'המעגל {{סגור}}! האלקטרונים זורמים מהצד ה"צפוף" של הסוללה (−), עוברים בנורה ו{{מדליקים אותה}} 💡, וחוזרים לצד השני (+).' : 'המעגל סגור! האלקטרונים עוברים בזמזם, והוא {{מזמזם}} 🔔.', 'good');
      else say('המעגל {{פתוח}}: יש רווח במתג, האלקטרונים לא יכולים לעבור, ולכן שום דבר לא עובד.');
      if (heardBulb && heardBuzz && !update.done) { update.done = true; celebrate(); done(); GS.showAfter(); }
    }
    loop(box, (dt) => {
      electrons.forEach((e) => {
        if (closed) e.d += dt * 90;
        const p = at(e.d);
        e.el.setAttribute('cx', p[0].toFixed(1)); e.el.setAttribute('cy', p[1].toFixed(1));
        e.el.setAttribute('opacity', closed ? 1 : 0.45);
      });
      if (closed && dev !== 'bulb') buzzG.setAttribute('transform', 'translate(' + ((Math.random() - 0.5) * 2).toFixed(1) + ',0)');
    });
    box.appendChild(svg);
    const c = controls();
    const sw = btn('🔌 סוגרים את המעגל', () => { closed = !closed; sw.textContent = closed ? '✋ פותחים את המעגל' : '🔌 סוגרים את המעגל'; update(); }, 'primary big');
    c.appendChild(seg([{ t: '💡 נורה', v: 'bulb' }, { t: '🔔 זמזם', v: 'buzz' }, { t: '💡+🔔 שניהם', v: 'both' }], 'bulb', (v) => { dev = v; update(); }));
    c.appendChild(sw);
    box.appendChild(c);
    update();
  });

  // =====================================================================
  // 🔩 Conductor or insulator? Put each thing in the gap and see if the bulb lights
  // =====================================================================
  GS.sim('conductors', (box, g, done) => {
    const ITEMS = [
      { e: '🔩', t: 'מסמר', yes: true }, { e: '🪙', t: 'מטבע', yes: true }, { e: '📎', t: 'אטב משרדי', yes: true },
      { e: '🔑', t: 'מפתח', yes: true }, { e: '✨', t: 'נייר כסף', yes: true }, { e: '🥄', t: 'כפית מתכת', yes: true },
      { e: '🧱', t: 'קוביית לגו', yes: false }, { e: '🪵', t: 'מקל עץ', yes: false }, { e: '📄', t: 'נייר', yes: false },
      { e: '🎈', t: 'בלון גומי', yes: false }, { e: '🧦', t: 'גרב', yes: false }, { e: '🫙', t: 'צנצנת זכוכית', yes: false }
    ];
    const svg = svgBox(600, 300);
    s('rect', { x: 0, y: 0, width: 600, height: 300, rx: 24, fill: '#f5f7fb' }, svg);
    s('polyline', { points: '250,240 110,240 110,70 490,70 490,240 350,240', fill: 'none', stroke: '#c2410c', 'stroke-width': 6, 'stroke-linejoin': 'round' }, svg);
    s('rect', { x: 70, y: 120, width: 80, height: 90, rx: 10, fill: '#2b2f3a' }, svg);
    s('rect', { x: 70, y: 120, width: 80, height: 32, rx: 10, fill: '#e0a800' }, svg);
    const glow = s('circle', { cx: 300, cy: 50, r: 0, fill: '#ffe066', opacity: 0.55 }, svg);
    const glass = s('circle', { cx: 300, cy: 50, r: 24, fill: '#eef3f8', stroke: '#9aa6b2', 'stroke-width': 3 }, svg);
    s('polygon', { points: '238,232 262,232 262,248 238,248', fill: '#666' }, svg);
    s('polygon', { points: '338,232 362,232 362,248 338,248', fill: '#666' }, svg);
    const slot = text(svg, 300, 238, '❔', { 'font-size': 46 });
    text(svg, 300, 285, 'מה שמים ברווח?', { 'font-size': 15, 'font-weight': 700, fill: '#555' });
    const lists = h('div', { class: 'cond-lists' },
      h('div', null, h('b', null, '✅ מוליכים חשמל'), h('div', { class: 'cond-yes' })),
      h('div', null, h('b', null, '⛔ לא מוליכים (מבודדים)'), h('div', { class: 'cond-no' })));
    const tested = new Set();
    const say = message(box);
    function test(it) {
      slot.textContent = it.e;
      glow.setAttribute('r', it.yes ? 44 : 0);
      glass.setAttribute('fill', it.yes ? '#fff3a3' : '#eef3f8');
      if (!tested.has(it.t)) {
        tested.add(it.t);
        lists.querySelector(it.yes ? '.cond-yes' : '.cond-no').appendChild(h('span', { class: 'in-bin' }, it.e + ' ' + it.t));
      }
      say(it.yes ? it.e + ' ' + it.t + ': הנורה דולקת! 💡 זו {{מתכת}}, והיא {{מוליכה חשמל}}: האלקטרונים עוברים דרכה בקלות.' : it.e + ' ' + it.t + ': הנורה כבויה. החומר הזה {{לא מוליך חשמל}}. קוראים לו {{מבודד}}.', it.yes ? 'good' : '');
      const yes = [...tested].filter((t) => ITEMS.find((x) => x.t === t).yes).length;
      if (tested.size >= 6 && yes >= 2 && tested.size - yes >= 2 && !test.done) { test.done = true; celebrate(); done(); GS.showAfter(); }
    }
    box.appendChild(svg);
    const pool = h('div', { class: 'pool' });
    ITEMS.forEach((it) => pool.appendChild(h('button', { class: 'chip-item', onclick: () => test(it) }, h('span', { class: 'ci-e' }, it.e), it.t)));
    box.appendChild(pool);
    box.appendChild(lists);
    say('בודקים מה עובר את הרווח במעגל: שמים כל דבר ברווח ורואים אם הנורה נדלקת. בדקו לפחות 6!');
  });

  // =====================================================================
  // 🔋 Electrons move from "crowded" to "less crowded" — and light the bulb on the way
  // =====================================================================
  GS.sim('electronFlow', (box, g, done) => {
    const W = 600, H = 340;
    const svg = svgBox(W, H);
    s('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#f5f7fb' }, svg);
    const A = { x1: 30, x2: 230, y1: 120, y2: 310 }, B = { x1: 370, x2: 570, y1: 120, y2: 310 };
    s('rect', { x: A.x1, y: A.y1, width: A.x2 - A.x1, height: A.y2 - A.y1, rx: 18, fill: '#dbe8ff', stroke: '#7a9cc6', 'stroke-width': 4 }, svg);
    s('rect', { x: B.x1, y: B.y1, width: B.x2 - B.x1, height: B.y2 - B.y1, rx: 18, fill: '#fff3e0', stroke: '#d9a066', 'stroke-width': 4 }, svg);
    const cntA = text(svg, 130, 100, '', { 'font-size': 17, 'font-weight': 800 });
    const cntB = text(svg, 470, 100, '', { 'font-size': 17, 'font-weight': 800 });
    s('rect', { x: 230, y: 205, width: 140, height: 20, fill: '#c2410c' }, svg);
    const gate = s('rect', { x: 250, y: 196, width: 14, height: 38, rx: 4, fill: '#555' }, svg);
    const glow = s('circle', { cx: 330, cy: 175, r: 0, fill: '#ffe066', opacity: 0.6 }, svg);
    const glass = s('circle', { cx: 330, cy: 175, r: 22, fill: '#eef3f8', stroke: '#9aa6b2', 'stroke-width': 3 }, svg);
    s('rect', { x: 320, y: 195, width: 20, height: 12, fill: '#9aa6b2' }, svg);
    const eg = s('g', {}, svg);
    const es = [];
    function spawn(n, room) { for (let i = 0; i < n; i++) es.push({ room, x: room.x1 + 20 + Math.random() * (room.x2 - room.x1 - 40), y: room.y1 + 20 + Math.random() * (room.y2 - room.y1 - 40), a: Math.random() * 6.28, el: s('circle', { r: 7, fill: '#3b82ff' }, eg) }); }
    spawn(30, A); spawn(4, B);
    let open = false, rate = 0, moved = 0, finishedOnce = false, acc = 0;
    const say = message(box);
    loop(box, (dt) => {
      const nA = es.filter((e) => e.room === A).length, nB = es.filter((e) => e.room === B).length;
      cntA.textContent = 'צפוף: ' + nA; cntB.textContent = 'פחות צפוף: ' + nB;
      const diff = nA - nB;
      rate = open && diff > 1 ? diff * 0.35 : 0;
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        const e = es.find((x) => x.room === A && !x.travel);
        if (e) { e.travel = true; e.room = null; e.x = 230; e.y = 215; }
      }
      const glowR = es.some((e) => e.travel) ? 30 + Math.min(30, rate * 5) : 0;
      glow.setAttribute('r', glowR.toFixed(1)); glass.setAttribute('fill', glowR ? '#fff3a3' : '#eef3f8');
      es.forEach((e) => {
        if (e.travel) {
          e.x += 220 * dt; e.y = 215;
          if (e.x >= 390) { e.travel = false; e.room = B; e.x = 395; moved++; }
        } else {
          const r = e.room;
          e.a += (Math.random() - 0.5) * 4 * dt;
          e.x += Math.cos(e.a) * 70 * dt; e.y += Math.sin(e.a) * 70 * dt;
          if (e.x < r.x1 + 10 || e.x > r.x2 - 10) { e.a = Math.PI - e.a; e.x = Math.max(r.x1 + 10, Math.min(r.x2 - 10, e.x)); }
          if (e.y < r.y1 + 10 || e.y > r.y2 - 10) { e.a = -e.a; e.y = Math.max(r.y1 + 10, Math.min(r.y2 - 10, e.y)); }
        }
        e.el.setAttribute('cx', e.x.toFixed(1)); e.el.setAttribute('cy', e.y.toFixed(1));
      });
      if (open && diff <= 1 && !es.some((e) => e.travel) && moved > 0 && !finishedOnce) {
        finishedOnce = true;
        say('הזרימה נעצרה, והנורה כבתה. עכשיו אין צד "צפוף", אז לאלקטרונים אין לאן לזרום. ככה בדיוק {{סוללה נגמרת}} 🪫. לחצו "טוענים" כדי למלא אותה שוב!', '');
        celebrate(); done(); GS.showAfter();
      }
    });
    box.appendChild(svg);
    const c = controls();
    const gb = btn('🚪 פותחים את הדרך', () => {
      open = !open; gb.textContent = open ? '✋ סוגרים את הדרך' : '🚪 פותחים את הדרך';
      gate.setAttribute('y', open ? 150 : 196);
      if (open) say('הדרך פתוחה! האלקטרונים זזים מהמקום ה{{צפוף}} למקום ה{{פחות צפוף}}, ובדרך הם עוברים בנורה ו{{מדליקים אותה}}. 💡', 'good');
    }, 'primary');
    c.appendChild(gb);
    c.appendChild(btn('🔋 טוענים את הסוללה', () => {
      es.forEach((e) => { if (e.room === B) { e.room = A; e.x = A.x1 + 20 + Math.random() * 160; } });
      const nB = es.filter((e) => e.room === B).length;
      for (let i = 0; i < 4 - nB; i++) { const e = es.find((x) => x.room === A); if (e) { e.room = B; e.x = B.x1 + 30; } }
      finishedOnce = false;
      say('טענו! המטען דחס שוב את האלקטרונים לצד אחד. עכשיו יש שוב צד "צפוף", והם מוכנים לזרום.');
    }));
    box.appendChild(c);
    say('משמאל: הרבה אלקטרונים, צפוף להם. מימין: מעט אלקטרונים. מה יקרה כשנפתח את הדרך ביניהם?');
  });

  // =====================================================================
  // ⚛️ The atom: a nucleus in the middle, electrons going around it
  // =====================================================================
  GS.sim('atom', (box, g, done) => {
    const W = 600, H = 420, cx = 300, cy = 210;
    const svg = svgBox(W, H);
    s('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#0f1630' }, svg);
    const orbits = [[180, 70, 0], [180, 70, 60], [180, 70, -60]];
    orbits.forEach((o) => s('ellipse', { cx, cy, rx: o[0], ry: o[1], fill: 'none', stroke: '#7fa7ff', 'stroke-opacity': 0.45, 'stroke-width': 2, transform: 'rotate(' + o[2] + ' ' + cx + ' ' + cy + ')' }, svg));
    const nuc = s('g', { class: 'tap' }, svg);
    [[0, 0, 'p'], [16, 6, 'n'], [-14, 8, 'n'], [6, -15, 'p'], [-6, 16, 'p'], [14, -10, 'n'], [-15, -8, 'p'], [2, 18, 'n']].forEach((q) => {
      s('circle', { cx: cx + q[0], cy: cy + q[1], r: 13, fill: q[2] === 'p' ? '#ff5d73' : '#b9c2cc', stroke: '#0f1630', 'stroke-width': 2 }, nuc);
    });
    s('circle', { cx, cy, r: 44, fill: 'transparent' }, nuc);
    const els = orbits.map((o, i) => ({ o, a: i * 2.1, g: s('g', { class: 'tap' }, svg) }));
    els.forEach((e) => {
      s('circle', { cx: 0, cy: 0, r: 12, fill: '#3b82ff' }, e.g);
      text(e.g, 0, 1, '−', { 'font-size': 18, 'font-weight': 900, fill: '#fff' });
      s('circle', { cx: 0, cy: 0, r: 26, fill: 'transparent' }, e.g);
      e.g.addEventListener('click', () => tell('e'));
    });
    nuc.addEventListener('click', () => tell('n'));
    const seen = new Set();
    const say = message(box);
    function tell(k) {
      seen.add(k);
      say(k === 'n'
        ? 'זה {{הגרעין}}: מרכז האטום. הוא עשוי מחלקיקים צפופים, {{פרוטונים}} (אדומים) ו{{נייטרונים}} (אפורים).'
        : 'זה {{אלקטרון}} ⚡: חלקיק קטנטן שמסתובב סביב הגרעין, מהר מאוד. כשאלקטרונים {{זזים ממקום למקום}}, זה חשמל!', 'good');
      if (seen.size === 2 && !tell.done) { tell.done = true; celebrate(); done(); GS.showAfter(); }
    }
    loop(box, (dt) => {
      els.forEach((e, i) => {
        e.a += dt * (1.6 + i * 0.3);
        const x = e.o[0] * Math.cos(e.a), y = e.o[1] * Math.sin(e.a), r = e.o[2] * Math.PI / 180;
        e.g.setAttribute('transform', 'translate(' + (cx + x * Math.cos(r) - y * Math.sin(r)).toFixed(1) + ',' + (cy + x * Math.sin(r) + y * Math.cos(r)).toFixed(1) + ')');
      });
    });
    box.appendChild(svg);
    box.appendChild(h('p', { class: 'hint' }, 'הציור מוגדל מאוד מאוד: אטום כל כך קטן, שבנקודה אחת של עיפרון יש מיליארדים של אטומים.'));
    say('זה {{אטום}}, אבן הבניין הקטנה ביותר של כל דבר. לחצו על המרכז ועל החלקיק הכחול שמסתובב.');
  });

  // =====================================================================
  // Drawings
  // =====================================================================
  GS.art.pressure = () => {
    let arrows = '';
    const A = (x1, y1, x2, y2) => { arrows += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#3b82ff" stroke-width="5" stroke-linecap="round"/>'; };
    [[160, 20, 160, 55], [120, 20, 120, 55], [200, 20, 200, 55], [40, 100, 85, 100], [280, 100, 235, 100], [160, 180, 160, 145], [40, 70, 85, 80], [280, 130, 235, 120]].forEach((a) => A.apply(null, a));
    return '<svg viewBox="0 0 320 200" class="art-svg"><rect width="320" height="200" rx="20" fill="#eaf4ff"/>' + arrows +
      '<rect x="95" y="62" width="130" height="78" rx="14" fill="#fff" stroke="#7a9cc6" stroke-width="3"/><text x="160" y="108" font-size="40" text-anchor="middle">🧒</text>' +
      '<text x="160" y="196" font-size="13" text-anchor="middle" fill="#2f66c0">האוויר לוחץ מכל הכיוונים</text></svg>';
  };

  GS.art.candle = () => '<svg viewBox="0 0 320 200" class="art-svg"><rect width="320" height="200" rx="20" fill="#f6efe3"/>' +
    '<ellipse cx="160" cy="180" rx="130" ry="12" fill="#e9eef3" stroke="#c5ced8" stroke-width="2"/><rect x="40" y="166" width="240" height="12" rx="4" fill="#7cc6fe"/>' +
    '<rect x="112" y="128" width="96" height="50" fill="#5bb3f5" opacity=".85"/>' +
    '<rect x="150" y="110" width="20" height="56" rx="3" fill="#fff4d6" stroke="#e6d3a0" stroke-width="2"/>' +
    '<path d="M108 178 V58 Q108 40 126 40 H194 Q212 40 212 58 V178" fill="rgba(200,230,255,.2)" stroke="#9fc6e6" stroke-width="4"/>' +
    '<line x1="70" y1="130" x2="70" y2="160" stroke="#2f66c0" stroke-width="4"/><polygon points="70,166 63,154 77,154" fill="#2f66c0"/>' +
    '<line x1="250" y1="130" x2="250" y2="160" stroke="#2f66c0" stroke-width="4"/><polygon points="250,166 243,154 257,154" fill="#2f66c0"/>' +
    '<text x="160" y="28" font-size="13" text-anchor="middle" fill="#23324a">המים עלו לתוך הצנצנת!</text></svg>';

  GS.art.atom = () => '<svg viewBox="0 0 320 200" class="art-svg"><rect width="320" height="200" rx="20" fill="#0f1630"/>' +
    '<g fill="none" stroke="#7fa7ff" stroke-opacity=".5" stroke-width="2"><ellipse cx="160" cy="100" rx="110" ry="40"/><ellipse cx="160" cy="100" rx="110" ry="40" transform="rotate(60 160 100)"/><ellipse cx="160" cy="100" rx="110" ry="40" transform="rotate(-60 160 100)"/></g>' +
    '<circle cx="153" cy="96" r="10" fill="#ff5d73"/><circle cx="167" cy="96" r="10" fill="#b9c2cc"/><circle cx="160" cy="108" r="10" fill="#ff5d73"/>' +
    '<circle cx="270" cy="100" r="8" fill="#3b82ff"/><circle cx="105" cy="15" r="8" fill="#3b82ff"/><circle cx="105" cy="185" r="8" fill="#3b82ff"/>' +
    '<text x="200" y="125" font-size="12" fill="#fff">גרעין</text><text x="250" y="80" font-size="12" fill="#9fc0ff">אלקטרון</text></svg>';

  GS.art.circuit = () => '<svg viewBox="0 0 320 200" class="art-svg"><rect width="320" height="200" rx="20" fill="#f5f7fb"/>' +
    '<polyline points="60,150 60,50 260,50 260,150 60,150" fill="none" stroke="#c2410c" stroke-width="5"/>' +
    '<rect x="35" y="80" width="50" height="60" rx="6" fill="#2b2f3a"/><rect x="35" y="80" width="50" height="20" rx="6" fill="#e0a800"/>' +
    '<circle cx="200" cy="38" r="30" fill="#ffe066" opacity=".5"/><circle cx="200" cy="38" r="16" fill="#fff3a3" stroke="#9aa6b2" stroke-width="2"/>' +
    '<g fill="#3b82ff"><circle cx="110" cy="150" r="5"/><circle cx="160" cy="150" r="5"/><circle cx="210" cy="150" r="5"/><circle cx="260" cy="110" r="5"/><circle cx="130" cy="50" r="5"/></g>' +
    '<text x="160" y="180" font-size="13" text-anchor="middle" fill="#23324a">מעגל סגור: הנורה דולקת</text></svg>';

  GS.art.openClosed = () => '<svg viewBox="0 0 320 200" class="art-svg"><rect width="320" height="200" rx="20" fill="#f5f7fb"/>' +
    '<g><polyline points="40,140 40,60 70,60" fill="none" stroke="#c2410c" stroke-width="4"/><line x1="70" y1="60" x2="96" y2="40" stroke="#555" stroke-width="5"/><polyline points="100,60 140,60 140,140 40,140" fill="none" stroke="#c2410c" stroke-width="4"/>' +
    '<circle cx="120" cy="48" r="11" fill="#eef3f8" stroke="#9aa6b2" stroke-width="2"/><text x="90" y="175" font-size="13" text-anchor="middle">פתוח: כבוי</text></g>' +
    '<g><polyline points="180,140 180,60 280,60 280,140 180,140" fill="none" stroke="#c2410c" stroke-width="4"/>' +
    '<circle cx="260" cy="48" r="20" fill="#ffe066" opacity=".55"/><circle cx="260" cy="48" r="11" fill="#fff3a3" stroke="#9aa6b2" stroke-width="2"/><text x="230" y="175" font-size="13" text-anchor="middle">סגור: דולק!</text></g></svg>';
})();
