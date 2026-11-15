// Run with: node tests/green-scientist.test.js   (plain Node, no npm needed)
// Checks every module's content: ids, quiz answers, games, and that all files are cached offline.
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = path.join(__dirname, '../green-scientist');
let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('ok   ' + name); }
  catch (e) { console.error('FAIL ' + name + '\n     ' + e.message); process.exitCode = 1; }
}

// Load module files with a fake GS that just collects them.
const modules = [];
const sandbox = { GS: { register: (m) => modules.push(m) } };
vm.createContext(sandbox);
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const moduleFiles = [...html.matchAll(/<script src="(modules\/[^"]+)"/g)].map((m) => m[1]);
moduleFiles.forEach((f) => vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), sandbox, { filename: f }));

// Simulation names that sims.js provides.
const simFiles = [...html.matchAll(/<script src="(sims[^"]*\.js)"/g)].map((m) => m[1]);
const simsSrc = simFiles.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const SIMS = new Set([...simsSrc.matchAll(/GS\.sim\('([^']+)'/g)].map((m) => m[1]));
const ARTS = new Set([...simsSrc.matchAll(/GS\.art\.(\w+) =/g)].map((m) => m[1]));
const WIDGETS = ['sort', 'order', 'match'];

test('at least two modules load, with unique ids and weeks', () => {
  assert.ok(modules.length >= 2);
  assert.strictEqual(new Set(modules.map((m) => m.id)).size, modules.length);
  assert.strictEqual(new Set(modules.map((m) => m.week)).size, modules.length);
});

modules.forEach((m) => {
  test(m.id + ': has every section, and enough of each', () => {
    ['title', 'emoji', 'summary'].forEach((k) => assert.ok(m[k], 'missing ' + k));
    assert.ok(m.learn.length >= 8, 'learn cards: ' + m.learn.length);
    assert.ok(m.games.length >= 4, 'games: ' + m.games.length);
    assert.ok(m.quiz.length >= 12, 'quiz questions: ' + m.quiz.length);
    assert.ok(m.home.length >= 4, 'home experiments: ' + m.home.length);
    assert.ok(m.enrich.length >= 4, 'enrichment cards: ' + m.enrich.length);
    assert.ok(m.talk.length >= 5, 'talk questions: ' + m.talk.length);
  });

  test(m.id + ': every quiz question has a valid answer and an explanation', () => {
    m.quiz.forEach((q, i) => {
      assert.ok(q.q, 'question ' + i);
      assert.ok(Array.isArray(q.o) && q.o.length >= 2 && q.o.length <= 4, 'options ' + i);
      assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length, 'answer index ' + i);
      assert.strictEqual(new Set(q.o).size, q.o.length, 'duplicate options in ' + i);
      assert.ok(q.why, 'explanation for ' + i);
    });
  });

  test(m.id + ': games are all playable', () => {
    assert.strictEqual(new Set(m.games.map((g) => g.id)).size, m.games.length, 'game ids unique');
    m.games.forEach((g) => {
      assert.ok(g.title && g.emoji, g.id);
      if (g.type === 'sim') assert.ok(SIMS.has(g.sim), 'unknown simulation ' + g.sim);
      else assert.ok(WIDGETS.includes(g.type), 'unknown game type ' + g.type);
      if (g.type === 'sort') {
        const bins = new Set(g.bins.map((b) => b.id));
        g.items.forEach((it) => assert.ok(bins.has(it.bin), 'item ' + it.t + ' has no bin'));
        g.bins.forEach((b) => assert.ok(g.items.some((it) => it.bin === b.id), 'empty bin ' + b.id));
      }
      if (g.type === 'order') assert.ok(g.items.length >= 3);
      if (g.type === 'match') {
        assert.ok(g.pairs.length >= 3);
        assert.strictEqual(new Set(g.pairs.map((p) => p.b)).size, g.pairs.length, 'match answers must differ');
      }
    });
  });

  test(m.id + ': home experiments have materials and steps; pictures exist', () => {
    assert.strictEqual(new Set(m.home.map((a) => a.id)).size, m.home.length);
    m.home.forEach((a) => { assert.ok(a.materials && a.materials.length, a.id); assert.ok(a.steps && a.steps.length >= 3, a.id); assert.ok(a.why, a.id); });
    const pics = [].concat(m.learn, m.enrich, m.quiz).map((c) => c.pic).filter((p) => p && typeof p === 'object');
    pics.forEach((p) => {
      if (p.art) assert.ok(ARTS.has(p.art), 'unknown drawing ' + p.art);
      if (p.photo) { assert.ok(/^https:\/\//.test(p.photo), p.photo); assert.ok(p.fallback, 'photo needs a fallback for offline'); assert.ok(p.credit, 'photo needs a credit'); }
    });
  });

  test(m.id + ': {{key words}} are balanced', () => {
    const strings = [];
    (function walk(x) { if (typeof x === 'string') strings.push(x); else if (x && typeof x === 'object') Object.values(x).forEach(walk); })(m);
    strings.forEach((t) => {
      assert.strictEqual((t.match(/\{\{/g) || []).length, (t.match(/\}\}/g) || []).length, 'unbalanced: ' + t);
      assert.ok(!/\{\{[^}]*\{\{/.test(t), 'nested: ' + t);
    });
  });
});

test('version matches the service worker, and every file is cached for offline', () => {
  const eng = fs.readFileSync(path.join(dir, 'engine.js'), 'utf8').match(/const VERSION = '([^']+)'/)[1];
  const swSrc = fs.readFileSync(path.join(dir, 'sw.js'), 'utf8');
  assert.strictEqual(eng, swSrc.match(/const CACHE_VERSION = '([^']+)'/)[1]);
  const list = JSON.parse(swSrc.match(/const FILES = (\[[\s\S]*?\]);/)[1].replace(/'/g, '"'));
  list.filter((f) => f !== './').forEach((f) => assert.ok(fs.existsSync(path.join(dir, f)), 'missing ' + f));
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]).filter((u) => !/^https?:|^#/.test(u));
  refs.forEach((r) => assert.ok(list.includes('./' + r), 'not cached for offline: ' + r));
});

console.log('\n' + passed + ' tests passed' + (process.exitCode ? ', some FAILED' : ''));
