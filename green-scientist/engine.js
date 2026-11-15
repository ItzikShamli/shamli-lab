/* Green Scientist (המדען הירוק) — the engine.
 * Modules (one per class) live in modules/*.js and call GS.register({...}).
 * Interactive simulations live in sims.js and call GS.sim(name, fn).
 * Everything here is plain JS, no build step.
 */
(function () {
  'use strict';

  // Keep in sync with CACHE_VERSION in sw.js (tests check this).
  const VERSION = '1.0.0';
  const STORE = 'green-scientist:v1';

  const modules = [];
  const sims = {};
  const art = {};
  const GS = window.GS = {
    VERSION,
    modules, sims, art,
    register(m) { modules.push(m); },
    sim(name, fn) { sims[name] = fn; },
    h, fmt, toast, celebrate, shuffle
  };

  // ---------- Sections of a module ----------
  const SECTIONS = [
    { id: 'learn', icon: '📖', title: 'לומדים', sub: 'מה למדנו בכיתה' },
    { id: 'play', icon: '🎮', title: 'משחקים', sub: 'מנסים בעצמנו' },
    { id: 'quiz', icon: '❓', title: 'חידון', sub: 'בודקים מה זוכרים' },
    { id: 'home', icon: '🏠', title: 'ניסויים בבית', sub: 'עושים יחד עם ההורים' },
    { id: 'enrich', icon: '🚀', title: 'העשרה', sub: 'לסקרנים במיוחד' },
    { id: 'talk', icon: '💬', title: 'מדברים על זה', sub: 'שאלות לשיחה' }
  ];

  // ---------- Saved progress ----------
  let prog = {};
  try { prog = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { prog = {}; }
  if (!prog.m || typeof prog.m !== 'object') prog.m = {};
  function mp(id) {
    const p = prog.m[id] || (prog.m[id] = {});
    p.seen = p.seen || {}; p.games = p.games || {}; p.home = p.home || {};
    p.quizBest = p.quizBest | 0;
    return p;
  }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(prog)); } catch (e) { /* private mode */ } }

  // ---------- Tiny DOM builder ----------
  function h(tag, attrs) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k === 'text') e.textContent = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
        else if (k === 'style') e.setAttribute('style', v);
        else e.setAttribute(k, v === true ? '' : v);
      }
    }
    for (let i = 2; i < arguments.length; i++) add(e, arguments[i]);
    return e;
  }
  function add(e, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach((x) => add(e, x)); return; }
    e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  // Content text: {{word}} becomes a highlighted key word. Everything else is plain text.
  function fmt(s) {
    return h('span', { html: esc(s).replace(/\{\{(.+?)\}\}/g, '<b class="term">$1</b>') });
  }
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // ---------- Feedback ----------
  let toastTimer = null;
  function toast(text, kind) {
    const t = document.getElementById('toast');
    t.className = 'toast show ' + (kind || '');
    t.textContent = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = 'toast'; }, 3200);
  }
  function celebrate() {
    const fx = document.getElementById('fx');
    const colors = ['#4cc96b', '#ffcb2e', '#4a8df0', '#ff6b6b', '#b06bff'];
    for (let i = 0; i < 50; i++) {
      const c = h('div', { class: 'confetti' });
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
      c.style.animationDelay = (Math.random() * 0.4) + 's';
      fx.appendChild(c);
      setTimeout(() => c.remove(), 4000);
    }
  }

  // ---------- Pictures: emoji, drawn art, or a real photo (with a fallback when offline) ----------
  function picEl(pic, cls) {
    if (!pic) return null;
    if (typeof pic === 'string') return h('div', { class: 'pic emoji ' + (cls || '') }, pic);
    if (pic.art && art[pic.art]) return h('div', { class: 'pic art ' + (cls || ''), html: art[pic.art]() });
    if (pic.photo) {
      const fig = h('figure', { class: 'pic photo ' + (cls || '') });
      const img = h('img', { src: pic.photo, alt: pic.alt || '', loading: 'lazy' });
      img.addEventListener('error', () => {
        fig.classList.add('failed');
        img.remove();
        fig.insertBefore(h('div', { class: 'photo-fallback' }, pic.fallback || '🖼️'), fig.firstChild);
      });
      fig.appendChild(img);
      if (pic.caption || pic.credit) {
        fig.appendChild(h('figcaption', null, pic.caption || '', pic.credit ? h('span', { class: 'credit' }, ' · ' + pic.credit) : null));
      }
      return fig;
    }
    return null;
  }

  // ---------- Layout ----------
  const app = () => document.getElementById('app');
  function page(title, backHash, color) {
    const root = app();
    root.innerHTML = '';
    document.querySelectorAll('#fx .confetti').forEach((c) => c.remove());
    document.documentElement.style.setProperty('--accent', color || '#2f9e4d');
    const head = h('header', { class: 'top' },
      backHash != null ? h('a', { class: 'back', href: backHash, 'aria-label': 'חזרה' }, '→') : h('span', { class: 'logo' }, '🌱'),
      h('h1', null, title)
    );
    const main = h('main', { class: 'content' });
    root.appendChild(head);
    root.appendChild(main);
    window.scrollTo(0, 0);
    return main;
  }

  function moduleById(id) { return modules.find((m) => m.id === id); }
  function sortedModules() { return modules.slice().sort((a, b) => (a.week || 0) - (b.week || 0)); }

  function quizStars(m) {
    const best = mp(m.id).quizBest, n = (m.quiz || []).length || 1;
    const r = best / n;
    return r >= 0.9 ? 3 : r >= 0.7 ? 2 : r > 0 ? 1 : 0;
  }
  function moduleProgress(m) {
    const p = mp(m.id);
    let done = 0;
    SECTIONS.forEach((s) => { if (sectionDone(m, s.id)) done++; });
    return { done, total: SECTIONS.length, stars: quizStars(m), p };
  }
  function sectionDone(m, sid) {
    const p = mp(m.id);
    if (sid === 'quiz') return p.quizBest > 0;
    if (sid === 'play') return (m.games || []).length > 0 && (m.games || []).every((g) => p.games[g.id]);
    if (sid === 'home') return Object.keys(p.home).some((k) => p.home[k]);
    return !!p.seen[sid];
  }
  function starsEl(n) {
    return h('span', { class: 'stars', 'aria-label': n + ' כוכבים' }, [0, 1, 2].map((i) => h('span', { class: i < n ? 'on' : '' }, '★')));
  }

  // ---------- Home: pick a module ----------
  function renderHome() {
    const main = page('המדען הירוק', null);
    main.appendChild(h('p', { class: 'lead' },
      'כל שבוע בחוג לומדים משהו חדש. בחרו את המפגש, ותגלו יחד מה למדנו: קוראים, משחקים, עונים על חידון ועושים ניסויים בבית.'));
    const grid = h('div', { class: 'module-grid' });
    sortedModules().forEach((m) => {
      const pr = moduleProgress(m);
      grid.appendChild(h('a', { class: 'module-card', href: '#/m/' + m.id, style: '--c:' + (m.color || '#2f9e4d') },
        h('div', { class: 'mc-emoji' }, m.emoji),
        h('div', { class: 'mc-body' },
          h('div', { class: 'mc-week' }, 'מפגש ' + m.week),
          h('div', { class: 'mc-title' }, m.title),
          h('div', { class: 'mc-sub' }, m.subtitle || ''),
          h('div', { class: 'mc-progress' },
            h('span', { class: 'bar' }, h('span', { style: 'width:' + Math.round(pr.done / pr.total * 100) + '%' })),
            starsEl(pr.stars))
        )
      ));
    });
    main.appendChild(grid);
    main.appendChild(h('p', { class: 'hint' }, 'ההתקדמות נשמרת במכשיר הזה. גרסה ' + VERSION));
  }

  // ---------- A module: its sections ----------
  function renderModule(m) {
    const main = page(m.emoji + ' ' + m.title, '#/', m.color);
    main.appendChild(h('div', { class: 'hero' },
      h('div', { class: 'hero-week' }, 'מפגש ' + m.week + (m.date ? ' · ' + m.date : '')),
      m.summary ? h('p', { class: 'hero-summary' }, fmt(m.summary)) : null,
      m.keyWords ? h('div', { class: 'chips' }, m.keyWords.map((k) => h('span', { class: 'chip' }, k))) : null
    ));
    const grid = h('div', { class: 'section-grid' });
    SECTIONS.forEach((s) => {
      if (!hasSection(m, s.id)) return;
      grid.appendChild(h('a', { class: 'section-card' + (sectionDone(m, s.id) ? ' done' : ''), href: '#/m/' + m.id + '/' + s.id },
        h('span', { class: 'sc-icon' }, s.icon),
        h('span', { class: 'sc-title' }, s.title),
        h('span', { class: 'sc-sub' }, sectionSub(m, s)),
        sectionDone(m, s.id) ? h('span', { class: 'sc-check' }, '✓') : null
      ));
    });
    main.appendChild(grid);
  }
  function hasSection(m, sid) {
    const k = { learn: 'learn', play: 'games', quiz: 'quiz', home: 'home', enrich: 'enrich', talk: 'talk' }[sid];
    return Array.isArray(m[k]) && m[k].length > 0;
  }
  function sectionSub(m, s) {
    const p = mp(m.id);
    if (s.id === 'quiz') return p.quizBest ? 'השיא: ' + p.quizBest + ' מתוך ' + m.quiz.length : m.quiz.length + ' שאלות';
    if (s.id === 'play') return Object.keys(p.games).filter((k) => p.games[k]).length + ' מתוך ' + m.games.length + ' משחקים';
    if (s.id === 'home') return Object.keys(p.home).filter((k) => p.home[k]).length + ' מתוך ' + m.home.length + ' ניסויים';
    if (s.id === 'learn') return m.learn.length + ' כרטיסים';
    return s.sub;
  }

  function renderSection(m, sid, sub) {
    const s = SECTIONS.find((x) => x.id === sid);
    if (!s || !hasSection(m, sid)) { location.hash = '#/m/' + m.id; return; }
    const back = sub != null && sid === 'play' ? '#/m/' + m.id + '/play' : '#/m/' + m.id;
    const main = page(s.icon + ' ' + s.title + ' · ' + m.title, back, m.color);
    ({ learn: renderLearn, play: renderPlay, quiz: renderQuiz, home: renderHomeActivities, enrich: renderEnrich, talk: renderTalk })[sid](m, main, sub);
  }

  // ---------- 📖 Learn: one card at a time (easy to read aloud) ----------
  function cardEl(c) {
    return h('article', { class: 'card' },
      picEl(c.pic),
      c.title ? h('h2', null, c.title) : null,
      (c.text || []).map((t) => h('p', null, fmt(t))),
      c.list ? h('ul', null, c.list.map((t) => h('li', null, fmt(t)))) : null,
      c.facts ? h('dl', { class: 'facts' }, c.facts.map((f) => [h('dt', null, f[0]), h('dd', null, fmt(f[1]))])) : null,
      c.ask ? askEl(c.ask) : null,
      c.link ? h('p', { class: 'link' }, h('a', { href: c.link.href, target: '_blank', rel: 'noopener' }, c.link.text)) : null
    );
  }
  function askEl(ask) {
    const ans = h('div', { class: 'ask-answer hidden' }, fmt(ask.a));
    return h('div', { class: 'ask' },
      h('div', { class: 'ask-q' }, '💬 ', fmt(ask.q)),
      ask.a ? h('button', { class: 'btn small ghost', onclick: (e) => { ans.classList.remove('hidden'); e.target.remove(); } }, 'הצגת תשובה') : null,
      ans);
  }

  function renderLearn(m, main) {
    let i = 0;
    const holder = h('div', { class: 'pager' });
    const dots = h('div', { class: 'dots' });
    const prev = h('button', { class: 'btn ghost', onclick: () => go(i - 1) }, '→ הקודם');
    const next = h('button', { class: 'btn primary', onclick: () => go(i + 1) }, 'הבא ←');
    main.appendChild(holder);
    main.appendChild(h('div', { class: 'pager-nav' }, prev, dots, next));
    function go(n) {
      if (n >= m.learn.length) {
        mp(m.id).seen.learn = true; save(); celebrate();
        toast('כל הכבוד! סיימתם את כל הכרטיסים 🎉', 'good');
        location.hash = '#/m/' + m.id;
        return;
      }
      i = Math.max(0, n);
      holder.innerHTML = '';
      holder.appendChild(cardEl(m.learn[i]));
      dots.innerHTML = '';
      m.learn.forEach((_, k) => dots.appendChild(h('button', { class: 'dot' + (k === i ? ' on' : ''), 'aria-label': 'כרטיס ' + (k + 1), onclick: () => go(k) })));
      prev.disabled = i === 0;
      next.textContent = i === m.learn.length - 1 ? 'סיימנו ✓' : 'הבא ←';
      holder.scrollIntoView({ block: 'start' });
      window.scrollTo(0, 0);
    }
    go(0);
  }

  // ---------- 🎮 Games ----------
  function renderPlay(m, main, gameId) {
    if (gameId) {
      const g = m.games.find((x) => x.id === gameId);
      if (!g) { location.hash = '#/m/' + m.id + '/play'; return; }
      main.appendChild(h('div', { class: 'game-head' }, h('span', { class: 'gh-emoji' }, g.emoji), h('h2', null, g.title)));
      if (g.intro) main.appendChild(h('p', { class: 'lead' }, fmt(g.intro)));
      const box = h('div', { class: 'game-box' });
      main.appendChild(box);
      const done = () => {
        if (!mp(m.id).games[g.id]) { mp(m.id).games[g.id] = true; save(); }
      };
      const runner = g.type === 'sim' ? sims[g.sim] : WIDGETS[g.type];
      if (runner) runner(box, g, done); else box.appendChild(h('p', null, 'המשחק לא נמצא.'));
      if (g.after) main.appendChild(h('div', { class: 'after hidden', id: 'after' }, h('h3', null, '🧠 מה למדנו מזה?'), h('p', null, fmt(g.after))));
      return;
    }
    const p = mp(m.id);
    const list = h('div', { class: 'tile-grid' });
    m.games.forEach((g) => list.appendChild(h('a', { class: 'tile' + (p.games[g.id] ? ' done' : ''), href: '#/m/' + m.id + '/play/' + g.id },
      h('span', { class: 'tile-emoji' }, g.emoji),
      h('span', { class: 'tile-title' }, g.title),
      h('span', { class: 'tile-sub' }, g.kind || ''),
      p.games[g.id] ? h('span', { class: 'sc-check' }, '✓') : null)));
    main.appendChild(list);
  }
  function showAfter() { const a = document.getElementById('after'); if (a) a.classList.remove('hidden'); }
  GS.showAfter = showAfter;

  // Generic games used by many modules.
  const WIDGETS = {
    // Tap an item, then tap the box it belongs in.
    sort(box, g, done) {
      let selected = null, left = g.items.length;
      const pool = h('div', { class: 'pool' });
      const bins = h('div', { class: 'bins', style: '--n:' + g.bins.length });
      const binEls = {};
      g.bins.forEach((b) => {
        const inner = h('div', { class: 'bin-items' });
        const el = h('button', { class: 'bin', onclick: () => drop(b.id, el, inner) },
          h('span', { class: 'bin-label' }, (b.emoji ? b.emoji + ' ' : '') + b.label), inner);
        binEls[b.id] = el;
        bins.appendChild(el);
      });
      shuffle(g.items).forEach((it) => {
        const chip = h('button', { class: 'chip-item', onclick: () => select(chip, it) }, it.e ? h('span', { class: 'ci-e' }, it.e) : null, it.t);
        pool.appendChild(chip);
      });
      box.appendChild(h('p', { class: 'how' }, g.how || 'בוחרים פריט, ואז לוחצים על הקופסה שהוא שייך אליה.'));
      box.appendChild(pool);
      box.appendChild(bins);
      function select(chip, it) {
        pool.querySelectorAll('.chip-item').forEach((c) => c.classList.remove('sel'));
        selected = { chip, it };
        chip.classList.add('sel');
      }
      function drop(binId, el, inner) {
        if (!selected) { toast('קודם בוחרים פריט למעלה 👆'); return; }
        const { chip, it } = selected;
        if (it.bin === binId) {
          chip.remove();
          inner.appendChild(h('span', { class: 'in-bin' }, (it.e ? it.e + ' ' : '') + it.t));
          selected = null; left--;
          if (it.why) toast('✓ ' + it.why, 'good'); else toast('נכון! ✓', 'good');
          if (!left) { celebrate(); toast('מעולה! הכול במקום הנכון 🎉', 'good'); done(); showAfter(); }
        } else {
          el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
          toast(it.hint || 'לא בדיוק. נסו קופסה אחרת 🙂', 'bad');
        }
      }
    },

    // Tap the items in the right order.
    order(box, g, done) {
      let next = 0;
      const slots = h('ol', { class: 'slots' });
      g.items.forEach((it, i) => slots.appendChild(h('li', { class: 'slot' }, h('span', { class: 'slot-n' }, String(i + 1)))));
      const pool = h('div', { class: 'pool' });
      shuffle(g.items.map((it, i) => ({ it, i }))).forEach(({ it, i }) => {
        const chip = h('button', { class: 'chip-item', onclick: () => {
          if (i === next) {
            const slot = slots.children[next];
            slot.classList.add('filled');
            slot.appendChild(h('span', null, (it.e ? it.e + ' ' : '') + it.t));
            chip.remove(); next++;
            if (it.why) toast('✓ ' + it.why, 'good');
            if (next === g.items.length) { celebrate(); toast('בדיוק בסדר הנכון! 🎉', 'good'); done(); showAfter(); }
          } else {
            chip.classList.remove('shake'); void chip.offsetWidth; chip.classList.add('shake');
            toast(g.hint || 'עוד לא. מי בא עכשיו?', 'bad');
          }
        } }, it.e ? h('span', { class: 'ci-e' }, it.e) : null, it.t);
        pool.appendChild(chip);
      });
      box.appendChild(h('p', { class: 'how' }, g.how || 'לוחצים לפי הסדר.'));
      box.appendChild(pool);
      box.appendChild(slots);
    },

    // Match each thing on the right with its partner on the left.
    match(box, g, done) {
      let pickA = null, left = g.pairs.length;
      const colA = h('div', { class: 'match-col' }), colB = h('div', { class: 'match-col' });
      const items = g.pairs.map((p, i) => ({ p, i }));
      shuffle(items).forEach(({ p, i }) => {
        const a = h('button', { class: 'match-item', onclick: () => {
          if (a.classList.contains('ok')) return;
          colA.querySelectorAll('.match-item').forEach((x) => x.classList.remove('sel'));
          a.classList.add('sel'); pickA = { el: a, i };
        } }, fmt(p.a));
        colA.appendChild(a);
      });
      shuffle(items).forEach(({ p, i }) => {
        const b = h('button', { class: 'match-item', onclick: () => {
          if (b.classList.contains('ok')) return;
          if (!pickA) { toast('קודם בוחרים בטור הימני 👉'); return; }
          if (pickA.i === i) {
            pickA.el.classList.remove('sel'); pickA.el.classList.add('ok', 'c' + (i % 6)); b.classList.add('ok', 'c' + (i % 6));
            pickA = null; left--;
            if (p.why) toast('✓ ' + p.why, 'good');
            if (!left) { celebrate(); toast('כל הזוגות נמצאו! 🎉', 'good'); done(); showAfter(); }
          } else {
            b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
            toast('זה לא הזוג. נסו שוב 🙂', 'bad');
          }
        } }, fmt(p.b));
        colB.appendChild(b);
      });
      box.appendChild(h('p', { class: 'how' }, g.how || 'בוחרים משהו בטור הימני, ואז את בן הזוג שלו בטור השמאלי.'));
      box.appendChild(h('div', { class: 'match' }, colA, colB));
    }
  };
  GS.widgets = WIDGETS;

  // ---------- ❓ Quiz ----------
  function renderQuiz(m, main) {
    const qs = m.quiz;
    let i = 0, score = 0, firstTry = true;
    const missed = [];
    const wrap = h('div', { class: 'quiz' });
    main.appendChild(wrap);
    show();
    function show() {
      wrap.innerHTML = '';
      if (i >= qs.length) return finish();
      const q = qs[i];
      firstTry = true;
      wrap.appendChild(h('div', { class: 'quiz-top' },
        h('span', null, 'שאלה ' + (i + 1) + ' מתוך ' + qs.length),
        h('span', { class: 'quiz-score' }, '⭐ ' + score)));
      wrap.appendChild(h('div', { class: 'quiz-bar' }, h('span', { style: 'width:' + Math.round(i / qs.length * 100) + '%' })));
      const card = h('div', { class: 'card quiz-card' }, picEl(q.pic, 'small'), h('h2', null, fmt(q.q)));
      const opts = h('div', { class: 'options' + (q.o.some((o) => o.length > 24) ? ' long' : '') });
      const why = h('div', { class: 'why hidden' });
      const nextBtn = h('button', { class: 'btn primary hidden', onclick: () => { i++; show(); } }, i === qs.length - 1 ? 'לתוצאות ←' : 'לשאלה הבאה ←');
      shuffle(q.o.map((t, k) => ({ t, k }))).forEach(({ t, k }) => {
        const b = h('button', { class: 'option', onclick: () => {
          if (b.disabled) return;
          if (k === q.a) {
            b.classList.add('right');
            opts.querySelectorAll('.option').forEach((x) => { x.disabled = true; });
            if (firstTry) { score++; toast('נכון! ⭐', 'good'); } else { toast('נכון! 👍', 'good'); }
            if (!firstTry) missed.push(q);
            why.classList.remove('hidden');
            why.appendChild(h('b', null, '💡 ')); why.appendChild(fmt(q.why || ''));
            if (!q.why) why.classList.add('hidden');
            nextBtn.classList.remove('hidden');
            wrap.querySelector('.quiz-score').textContent = '⭐ ' + score;
          } else {
            b.classList.add('wrong'); b.disabled = true;
            firstTry = false;
            toast('לא בדיוק. נסו שוב 🙂', 'bad');
          }
        } }, fmt(t));
        opts.appendChild(b);
      });
      card.appendChild(opts);
      card.appendChild(why);
      card.appendChild(h('div', { class: 'quiz-next' }, nextBtn));
      wrap.appendChild(card);
    }
    function finish() {
      const p = mp(m.id);
      const isBest = score > p.quizBest;
      if (isBest) { p.quizBest = score; save(); }
      const stars = quizStars(m);
      celebrate();
      wrap.appendChild(h('div', { class: 'card result' },
        h('div', { class: 'result-emoji' }, score === qs.length ? '🏆' : score >= qs.length * 0.7 ? '🌟' : '💪'),
        h('h2', null, score + ' מתוך ' + qs.length + ' בניסיון הראשון'),
        h('div', { class: 'big-stars' }, starsEl(stars)),
        h('p', null, score === qs.length ? 'מושלם! אתם מדענים אמיתיים.' : score >= qs.length * 0.7 ? 'יפה מאוד! עוד קצת ותגיעו לשלמות.' : 'התחלה טובה. אפשר לחזור לכרטיסים ולנסות שוב.'),
        isBest && score ? h('p', { class: 'hint' }, 'שיא חדש! 🎉') : null,
        missed.length ? h('div', { class: 'missed' }, h('h3', null, 'כדאי לחזור על:'),
          h('ul', null, missed.map((q) => h('li', null, fmt(q.q), h('br'), h('small', null, '✓ ', fmt(q.o[q.a])))))) : null,
        h('div', { class: 'row-btns' },
          h('button', { class: 'btn primary', onclick: () => { i = 0; score = 0; missed.length = 0; show(); } }, 'עוד פעם 🔁'),
          h('a', { class: 'btn ghost', href: '#/m/' + m.id }, 'חזרה למפגש'))
      ));
    }
  }

  // ---------- 🏠 Experiments at home ----------
  function renderHomeActivities(m, main) {
    const p = mp(m.id);
    main.appendChild(h('p', { class: 'lead' }, 'ניסויים קטנים לעשות יחד. כל ניסוי עם רשימת ציוד, שלבים ושאלות לשאול בזמן הניסוי.'));
    m.home.forEach((a) => {
      const body = h('div', { class: 'act-body hidden' },
        a.goal ? h('p', { class: 'goal' }, '🎯 ', fmt(a.goal)) : null,
        a.materials ? [h('h3', null, '🧰 מה צריך'), h('ul', { class: 'materials' }, a.materials.map((t) => h('li', null, fmt(t))))] : null,
        a.steps ? [h('h3', null, '👣 מה עושים'), h('ol', { class: 'steps' }, a.steps.map((t) => h('li', null, fmt(t))))] : null,
        a.ask ? [h('h3', null, '💬 שואלים בזמן הניסוי'), h('ul', null, a.ask.map((t) => h('li', null, fmt(t))))] : null,
        a.why ? [h('h3', null, '🧠 למה זה קורה?'), h('p', null, fmt(a.why))] : null,
        a.more ? [h('h3', null, '➕ רוצים עוד?'), h('p', null, fmt(a.more))] : null,
        a.safety ? h('p', { class: 'safety' }, '⚠️ ', fmt(a.safety)) : null
      );
      const check = h('button', { class: 'btn ' + (p.home[a.id] ? 'done' : 'ghost'), onclick: () => {
        p.home[a.id] = !p.home[a.id]; save();
        check.className = 'btn ' + (p.home[a.id] ? 'done' : 'ghost');
        check.textContent = p.home[a.id] ? '✓ עשינו את זה' : 'סמנו שעשינו';
        if (p.home[a.id]) { celebrate(); toast('איזה מדענים! 🧪', 'good'); }
      } }, p.home[a.id] ? '✓ עשינו את זה' : 'סמנו שעשינו');
      const head = h('button', { class: 'act-head', onclick: () => { body.classList.toggle('hidden'); head.classList.toggle('open'); } },
        h('span', { class: 'act-emoji' }, a.emoji),
        h('span', { class: 'act-title' }, a.title, h('small', null, [a.time, a.level].filter(Boolean).join(' · '))),
        h('span', { class: 'act-arrow' }, '⌄'));
      main.appendChild(h('section', { class: 'activity' + (p.home[a.id] ? ' done' : '') }, head, body, h('div', { class: 'act-foot' }, check)));
    });
  }

  // ---------- 🚀 Enrichment: all cards on one page ----------
  function renderEnrich(m, main) {
    m.enrich.forEach((c) => main.appendChild(cardEl(c)));
    mp(m.id).seen.enrich = true; save();
  }

  // ---------- 💬 Talk about it ----------
  function renderTalk(m, main) {
    main.appendChild(h('p', { class: 'lead' }, 'שאלות פתוחות לשיחה: בארוחת ערב, באוטו או לפני השינה. הכי טוב: תנו לילד להסביר לכם, כאילו הוא המורה!'));
    m.talk.forEach((t) => main.appendChild(h('div', { class: 'card talk' }, askEl({ q: t.q, a: t.hint ? 'רמז להורים: ' + t.hint : '' }))));
    mp(m.id).seen.talk = true; save();
  }

  // ---------- Routing ----------
  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (parts[0] === 'm') {
      const m = moduleById(parts[1]);
      if (!m) { renderHome(); return; }
      if (!parts[2]) renderModule(m); else renderSection(m, parts[2], parts[3]);
      return;
    }
    renderHome();
  }

  // ---------- Updates and offline ----------
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    let hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) { hadController = true; return; }
      // A new version arrived: reload when we're on the home screen of the app (never mid-quiz).
      const reloadWhenHome = () => { if (!location.hash || location.hash === '#/') location.reload(); };
      reloadWhenHome();
      window.addEventListener('hashchange', reloadWhenHome);
    });
    navigator.serviceWorker.register('sw.js').then((reg) => {
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
    }).catch(() => {});
  }

  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', () => { route(); registerSW(); });
})();
