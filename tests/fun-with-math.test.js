// Run with: node tests/fun-with-math.test.js   (plain Node, no npm needed)
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const L = require('../learning-lab/fun-with-math/logic.js');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('ok   ' + name); }
  catch (e) { console.error('FAIL ' + name + '\n     ' + e.message); process.exitCode = 1; }
}

// Seeded random so failures can be reproduced.
function rngFrom(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

test('every question is valid, on every track and stage', () => {
  for (const level of Object.keys(L.TRACKS)) {
    L.TRACKS[level].forEach((stage, i) => {
      const profile = { level, stage: i };
      const rng = rngFrom(1000 + i);
      let prev = null, prevType = null;
      for (let k = 0; k < 3000; k++) {
        const q = L.nextQuestion(profile, prev, rng);
        assert.notStrictEqual(q.type, prevType, 'same kind twice in a row');
        assert.ok(stage.types.includes(q.type), 'type ' + q.type + ' not allowed in ' + stage.id);
        assert.ok(q.say && typeof q.say === 'string', 'needs something to say');
        assert.ok(q.choices.includes(q.answer), 'answer must be a choice');
        assert.strictEqual(new Set(q.choices).size, q.choices.length, 'choices must differ');
        assert.notStrictEqual(q.key, prev, 'same question twice in a row');
        if (q.type === 'compare') {
          assert.ok(q.left >= 1 && q.left <= stage.max && q.right >= 1 && q.right <= stage.max);
          assert.notStrictEqual(q.left, q.right, 'sides are never the same');
          const moreSide = q.left > q.right ? 'left' : 'right';
          assert.strictEqual(q.answer, q.ask === 'more' ? moreSide : (moreSide === 'left' ? 'right' : 'left'));
          assert.ok(Math.abs(q.left - q.right) >= (stage.gap || 2) || stage.max < 3);
          assert.deepStrictEqual(q.choices, ['left', 'right']);
          if (q.ask === 'fewer') assert.ok(stage.fewer);
        } else if (q.type === 'parity') {
          assert.deepStrictEqual(q.choices, ['even', 'odd']);
          assert.strictEqual(q.answer, q.n % 2 ? 'odd' : 'even');
          assert.ok(q.n >= 1 && q.n <= stage.max);
        } else if (q.type === 'pattern') {
          assert.strictEqual(q.choices.length, 3);
          assert.ok(q.seq.length >= 4 && q.seq.length <= 9);
          const unitLen = q.kind.length;
          // The answer really continues the pattern.
          const unit = q.seq.slice(0, unitLen);
          assert.strictEqual(q.answer, unit[q.seq.length % unitLen]);
          q.seq.forEach((p, i) => assert.strictEqual(p, unit[i % unitLen]));
          assert.ok(stage.patterns.includes(q.kind));
        } else if (q.type === 'bigger') {
          assert.strictEqual(q.choices.length, 2);
          assert.notStrictEqual(q.choices[0], q.choices[1]);
          assert.strictEqual(q.answer, q.ask === 'bigger' ? Math.max(...q.choices) : Math.min(...q.choices));
          q.choices.forEach((c) => assert.ok(c >= 1 && c <= stage.max));
        } else {
          assert.strictEqual(q.choices.length, 3);
          q.choices.forEach((c) => assert.ok(Number.isInteger(c) && c >= 0 && c <= stage.max, 'choice out of range: ' + c + ' ' + q.type));
        }
        if (q.type === 'next' || q.type === 'missing') {
          const known = q.seq.filter((x) => x !== null);
          assert.strictEqual(known.length, 3);
          const full = q.seq.map((x) => x === null ? q.answer : x);
          full.forEach((x, i) => { if (i) assert.strictEqual(x, full[i - 1] + 1); });
          assert.ok(full[0] >= 1 && full[3] <= stage.max);
          assert.strictEqual(q.seq.indexOf(null) === 3, q.type === 'next');
        }
        if (q.type === 'numpattern') {
          const full = q.seq.slice(0, 3).concat([q.answer]);
          full.forEach((x, i) => { assert.ok(x >= 0 && x <= stage.max); if (i) assert.strictEqual(x - full[i - 1], q.step); });
          assert.ok(stage.steps.includes(q.step) || q.step === 1);
        }
        if (q.type === 'change') {
          assert.strictEqual(q.answer, q.n + q.dir);
          assert.ok(q.answer >= 1 && q.n >= 1);
        }
        if (q.type === 'quick') assert.ok(q.n >= 1 && q.n <= Math.min(6, stage.quickMax));
        if (q.type === 'add' && stage.addMax) assert.ok(q.answer <= stage.addMax);
        if (q.type === 'count' || q.type === 'match') {
          assert.ok(q.n >= 1 && q.n <= stage.max);
          assert.strictEqual(q.answer, q.n);
          q.choices.forEach((c) => assert.ok(c >= 1));
        }
        if (q.type === 'add') {
          assert.strictEqual(q.answer, q.a + q.b);
          assert.ok(q.a >= 1 && q.b >= 1 && q.answer <= stage.max);
        }
        prevType = q.type;
        if (q.type === 'sub') {
          assert.strictEqual(q.answer, q.a - q.b);
          assert.ok(q.b >= 1 && q.answer >= 1 && q.a <= stage.max);
        }
        prev = q.key;
      }
    });
  }
});

test('all question types show up', () => {
  const seen = new Set();
  const rng = rngFrom(7);
  for (const level of Object.keys(L.TRACKS)) {
    L.TRACKS[level].forEach((s, i) => { for (let k = 0; k < 200; k++) seen.add(L.nextQuestion({ level, stage: i }, null, rng).type); });
  }
  assert.deepStrictEqual([...seen].sort(), Object.keys(L.MAKERS).sort());
});

test('the 20 stage really practices numbers over 10', () => {
  const rng = rngFrom(3);
  let big = 0, sums = 0;
  for (let k = 0; k < 1000; k++) {
    const q = L.nextQuestion({ level: 'big', stage: 3 }, null, rng);
    if (q.type !== 'add' && q.type !== 'sub') continue;
    sums++;
    if (Math.max(q.a, q.answer) > 10) big++;
  }
  assert.ok(big > sums / 2, 'only ' + big + ' of ' + sums + ' went past 10');
});

test('gets harder after a streak, easier after misses, stays in bounds', () => {
  const p = { level: 'big', stage: 0, streak: 0, misses: 0 };
  for (let i = 0; i < L.LEVEL_UP_STREAK - 1; i++) assert.strictEqual(L.recordFirstTry(p, true), null);
  assert.strictEqual(L.recordFirstTry(p, true), 'up');
  assert.strictEqual(p.stage, 1);
  for (let i = 0; i < L.LEVEL_DOWN_MISSES - 1; i++) assert.strictEqual(L.recordFirstTry(p, false), null);
  assert.strictEqual(L.recordFirstTry(p, false), 'down');
  assert.strictEqual(p.stage, 0);
  for (let i = 0; i < 10; i++) L.recordFirstTry(p, false);
  assert.strictEqual(p.stage, 0, 'never below the first stage');
  for (let i = 0; i < 100; i++) L.recordFirstTry(p, true);
  assert.strictEqual(p.stage, L.TRACKS.big.length - 1, 'never past the last stage');
  // A wrong answer breaks the streak.
  const q = { level: 'little', stage: 0 };
  for (let i = 0; i < 4; i++) L.recordFirstTry(q, true);
  L.recordFirstTry(q, false);
  for (let i = 0; i < 4; i++) assert.strictEqual(L.recordFirstTry(q, true), null);
});

test('saved data is repaired safely', () => {
  const d = L.normalizeData({ profiles: [{ id: 'a', name: 'X', level: 'weird', stage: 99, coins: -5 }, null, { name: 'no id' }] });
  assert.strictEqual(d.profiles.length, 1);
  assert.strictEqual(d.profiles[0].level, 'little');
  assert.strictEqual(d.profiles[0].stage, L.TRACKS.little.length - 1);
  assert.strictEqual(d.profiles[0].coins, 0);
  assert.ok(d.rewards.length > 0, 'default rewards kept');
  assert.deepStrictEqual(L.normalizeData('garbage').profiles, []);
  const prices = L.defaultData().rewards.map((r) => r.name + '=' + r.price).join(', ');
  assert.strictEqual(prices, 'Ice cream=100, Pokémon game=200, Lego game=300');
});

test('version 1 sample rewards become the prize list; edited rewards are kept', () => {
  const v1 = { version: 1, voiceURI: 'en-voice', profiles: [], rewards: [
    { id: 'r1', emoji: '🍦', name: 'Ice cream', price: 10 },
    { id: 'r2', emoji: '📺', name: 'Show time', price: 15 },
    { id: 'r3', emoji: '📖', name: 'Extra bedtime story', price: 5 }] };
  const d = L.normalizeData(JSON.parse(JSON.stringify(v1)));
  assert.deepStrictEqual(d.rewards.map((r) => r.price), [100, 200, 300]);
  assert.strictEqual(d.voiceURI, null, 'old English voice choice is cleared');
  assert.strictEqual(d.version, 2);
  v1.rewards[0].price = 12;
  assert.strictEqual(L.normalizeData(v1).rewards[0].price, 12, 'a parent-edited list is not replaced');
  // Already on version 2: rewards and voice are left alone.
  const v2 = L.normalizeData({ version: 2, voiceURI: 'he-voice', rewards: [{ id: 'x', emoji: '🎁', name: 'X', price: 7 }] });
  assert.strictEqual(v2.voiceURI, 'he-voice');
  assert.strictEqual(v2.rewards[0].price, 7);
});

test('everything spoken is Hebrew words (no English, no digits)', () => {
  const lines = [].concat(L.SAY.praise, L.SAY.retry, [L.SAY.harder, L.SAY.roundDone, L.SAY.whoPlays, L.SAY.noPlayers, L.SAY.test]);
  const rng = rngFrom(11);
  for (const level of Object.keys(L.TRACKS)) {
    L.TRACKS[level].forEach((s, i) => { for (let k = 0; k < 400; k++) lines.push(L.nextQuestion({ level, stage: i }, null, rng).say); });
  }
  lines.forEach((t) => assert.ok(/[\u0590-\u05FF]/.test(t) && !/[A-Za-z0-9]/.test(t), 'not Hebrew-only: ' + t));
  assert.strictEqual(L.numWord(12), 'שתים עשרה');
  assert.strictEqual(L.dotsPhrase(2), 'שתי נקודות');
  assert.strictEqual(L.dotsPhrase(1), 'נקודה אחת');
});

test('coins add up and never go below zero', () => {
  const d = L.defaultData();
  const p = { id: 'p1', coins: 0 };
  L.addCoins(d, p, 5, 'x');
  L.addCoins(d, p, -3, 'y');
  assert.strictEqual(p.coins, 2);
  L.addCoins(d, p, -10, 'z');
  assert.strictEqual(p.coins, 0);
  assert.strictEqual(d.log.length, 3);
});

test('coins: 1 right away, ½ after one wrong, 0 after two or more', () => {
  assert.strictEqual(L.coinsForAnswer(0), 1);
  assert.strictEqual(L.coinsForAnswer(1), 0.5);
  assert.strictEqual(L.coinsForAnswer(2), 0);
  assert.strictEqual(L.coinsForAnswer(5), 0);
  const d = L.defaultData();
  const p = { id: 'p', coins: 0 };
  L.addCoins(d, p, 0.5, 'x'); L.addCoins(d, p, 0.5, 'x'); L.addCoins(d, p, 0.5, 'x');
  assert.strictEqual(p.coins, 1.5);
  assert.strictEqual(L.formatCoins(p.coins), '1½');
  assert.strictEqual(L.formatCoins(0.5), '½');
  assert.strictEqual(L.formatCoins(12), '12');
  assert.strictEqual(L.formatCoins(0), '0');
  L.addCoins(d, p, -1, 'x');
  assert.strictEqual(p.coins, 0.5);
  assert.strictEqual(L.normalizeData({ version: 2, profiles: [{ id: 'a', coins: 7.5 }] }).profiles[0].coins, 7.5, 'half coins survive saving');
});

test('reward pictures: emoji or a small photo, junk is dropped', () => {
  const ok = 'data:image/jpeg;base64,' + 'A'.repeat(100);
  const d = L.normalizeData({ version: 2, rewards: [
    { id: 'a', name: 'A', price: 5, emoji: '🚲', image: ok },
    { id: 'b', name: 'B', price: 5, emoji: '', image: 'javascript:alert(1)' },
    { id: 'c', name: 'C', price: 5, image: 'data:image/jpeg;base64,' + 'A'.repeat(L.MAX_IMAGE_CHARS) }] });
  assert.strictEqual(d.rewards[0].image, ok);
  assert.strictEqual(d.rewards[1].image, null);
  assert.strictEqual(d.rewards[1].emoji, '🎁');
  assert.strictEqual(d.rewards[2].image, null, 'too big');
});

test('grown-up question is hard for a little kid', () => {
  const rng = rngFrom(9);
  for (let i = 0; i < 100; i++) {
    const g = L.adultQuestion(rng);
    assert.ok(g.a >= 6 && g.a <= 9 && g.b >= 6 && g.b <= 9 && g.answer === g.a * g.b);
  }
});

test('voice choice prefers a Premium/Enhanced Hebrew voice and ignores other languages', () => {
  const voices = [
    { name: 'Samantha (Enhanced)', lang: 'en-US', voiceURI: 'com.apple.voice.enhanced.en-US.Samantha' },
    { name: 'Bubbles', lang: 'en-US', voiceURI: 'com.apple.speech.synthesis.voice.Bubbles' },
    { name: 'Carmit', lang: 'he-IL', voiceURI: 'com.apple.voice.compact.he-IL.Carmit' },
    { name: 'Carmit (Enhanced)', lang: 'he-IL', voiceURI: 'com.apple.voice.enhanced.he-IL.Carmit' },
    { name: 'Hebrew Premium', lang: 'he_IL', voiceURI: 'com.apple.voice.premium.he-IL.X' },
    { name: 'Old', lang: 'iw-IL', voiceURI: 'iw' }
  ];
  assert.strictEqual(L.pickVoice(voices).name, 'Hebrew Premium');
  assert.strictEqual(L.pickVoice(voices.slice(0, 4)).name, 'Carmit (Enhanced)');
  assert.strictEqual(L.pickVoice(voices.slice(0, 3)).name, 'Carmit');
  assert.strictEqual(L.pickVoice(voices, 'iw').name, 'Old', 'saved choice wins');
  assert.strictEqual(L.pickVoice(voices.slice(0, 2)), null, 'no Hebrew voice → none');
  assert.deepStrictEqual(L.hebrewVoices(voices).map((v) => v.lang).every((l) => /^(he|iw)/i.test(l)), true);
});

test('app version matches the service worker cache version', () => {
  const dir = path.join(__dirname, '../learning-lab/fun-with-math');
  const app = fs.readFileSync(path.join(dir, 'app.js'), 'utf8').match(/APP_VERSION = '([^']+)'/)[1];
  const sw = fs.readFileSync(path.join(dir, 'sw.js'), 'utf8').match(/CACHE_VERSION = '([^']+)'/)[1];
  assert.strictEqual(app, sw);
});

test('every file the service worker caches exists', () => {
  const dir = path.join(__dirname, '../learning-lab/fun-with-math');
  const sw = fs.readFileSync(path.join(dir, 'sw.js'), 'utf8');
  const list = JSON.parse(sw.match(/const FILES = (\[[\s\S]*?\]);/)[1].replace(/'/g, '"'));
  list.filter((f) => f !== './').forEach((f) => assert.ok(fs.existsSync(path.join(dir, f)), 'missing ' + f));
  // ...and every local file the page loads is cached.
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]).filter((u) => !/^https?:|^#/.test(u));
  refs.forEach((r) => assert.ok(list.includes('./' + r), 'not cached for offline: ' + r));
});

console.log('\n' + passed + ' tests passed' + (process.exitCode ? ', some FAILED' : ''));
