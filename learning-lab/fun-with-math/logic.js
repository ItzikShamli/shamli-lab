/* Fun With Math — game logic (no DOM).
 * Works in the browser (window.FWM) and in Node (module.exports) so it can be tested.
 */
(function (root) {
  'use strict';

  // ---------- Settings ----------
  var ROUND_LENGTH = 10;        // questions per round
  var COIN_PER_RIGHT = 1;       // coin for a right answer on the first try
  // Coins for a right answer by how many wrong taps came before it:
  // right away = 1, after one wrong = ½, after two or more wrong = 0.
  var COINS_BY_WRONG = [1, 0.5, 0];
  var ROUND_BONUS = 3;          // bonus coins for finishing a round
  var LEVEL_UP_STREAK = 5;      // right-first-try in a row to get harder
  var LEVEL_DOWN_MISSES = 3;    // wrong-first-try in a row to get easier

  // Each track is a list of stages, easiest first.
  // `types` may repeat a type to make it come up more often.
  // Options: addMax (biggest sum for little-kid adding), quickMax (biggest quick-look number),
  // equal (compare can be "the same"), gap (smallest difference in compare), fewer / smaller
  // (also ask for the smaller side/number), messy (scattered counting), patterns (picture
  // pattern kinds), steps (number-pattern steps).
  var TRACKS = {
    little: [
      { id: 'L1', max: 5, gap: 2, patterns: ['AB'],
        types: ['count', 'count', 'compare', 'match', 'bigger', 'next', 'pattern'] },
      { id: 'L2', max: 7, gap: 2, equal: true, fewer: true, addMax: 5, quickMax: 4, patterns: ['AB'],
        types: ['count', 'compare', 'match', 'bigger', 'next', 'pattern', 'change', 'add', 'quick'] },
      { id: 'L3', max: 10, gap: 2, equal: true, fewer: true, smaller: true, addMax: 5, quickMax: 6,
        patterns: ['AB', 'AAB', 'ABB'],
        types: ['count', 'compare', 'match', 'bigger', 'next', 'missing', 'pattern', 'change', 'add', 'quick'] },
      { id: 'L4', max: 10, gap: 1, equal: true, fewer: true, smaller: true, messy: true, addMax: 5, quickMax: 6,
        patterns: ['AB', 'AAB', 'ABB', 'ABC'],
        types: ['count', 'compare', 'match', 'bigger', 'next', 'missing', 'pattern', 'change', 'add', 'quick'] }
    ],
    big: [
      { id: 'B1', max: 5, steps: [1], patterns: ['AB', 'ABB'],
        types: ['add', 'add', 'add', 'numpattern', 'pattern'] },
      { id: 'B2', max: 10, steps: [1, 2], patterns: ['ABB', 'ABC'],
        types: ['add', 'add', 'add', 'parity', 'numpattern', 'pattern'] },
      { id: 'B3', max: 10, steps: [1, 2, -1], patterns: ['ABC', 'AABB'],
        types: ['add', 'add', 'sub', 'sub', 'parity', 'numpattern', 'pattern'] },
      { id: 'B4', max: 20, steps: [2, 5, -1, -2], patterns: ['ABC', 'AABB', 'ABBC'],
        types: ['add', 'add', 'sub', 'sub', 'parity', 'numpattern', 'pattern'] }
    ]
  };

  // `many` is the Hebrew plural, used in the spoken questions.
  // f: the Hebrew noun is feminine (for "one more came" / "one left").
  var ITEMS = [
    { e: '🍎', many: 'תפוחים' },
    { e: '🍓', many: 'תותים' },
    { e: '⭐', many: 'כוכבים' },
    { e: '🐞', many: 'חיפושיות', f: true },
    { e: '🐟', many: 'דגים' },
    { e: '🎈', many: 'בלונים' },
    { e: '🍪', many: 'עוגיות', f: true },
    { e: '🌸', many: 'פרחים' },
    { e: '🐥', many: 'אפרוחים' },
    { e: '🚗', many: 'מכוניות', f: true },
    { e: '🦋', many: 'פרפרים' },
    { e: '🍌', many: 'בננות', f: true }
  ];

  // Pictures for patterns: clearly different colors and shapes.
  var PATTERN_PICS = ['🔴', '🟦', '⭐', '🟢', '🔺', '🍎', '🍌', '🐸', '🌸', '🚗', '🎈', '🟣'];

  // Numbers as spoken words, so the voice never has to guess the Hebrew form.
  // NUM: counting form ("שלוש ועוד שתיים"). DOTS: before the feminine noun נקודות.
  var NUM = ['אפס', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר',
             'אחת עשרה', 'שתים עשרה', 'שלוש עשרה', 'ארבע עשרה', 'חמש עשרה', 'שש עשרה',
             'שבע עשרה', 'שמונה עשרה', 'תשע עשרה', 'עשרים'];
  function numWord(n) { return NUM[n] != null ? NUM[n] : String(n); }
  function dotsPhrase(n) {
    if (n === 1) return 'נקודה אחת';
    if (n === 2) return 'שתי נקודות';
    return numWord(n) + ' נקודות';
  }

  var AVATARS = ['🦁', '🐯', '🐰', '🦊', '🐼', '🐨', '🐸', '🐵',
                 '🦄', '🦖', '🐙', '🦈', '🐧', '🦉', '🐶', '🐱',
                 '🐢', '🐝', '🚀', '⚽'];

  // Spoken lines (Hebrew). Plural "you" so they fit every kid.
  var SAY = {
    praise: ['כל הכבוד!', 'יופי!', 'מעולה!', 'נכון מאוד!', 'מצוין!', 'וואו!'],
    retry: ['נסו שוב!', 'כמעט! נסו שוב.', 'אופס! נסו שוב.'],
    harder: 'וואו! עכשיו קצת יותר קשה!',
    roundDone: 'כל הכבוד! הנה מטבעות לצנצנת!',
    whoPlays: 'מי משחק? לחצו על התמונה שלכם.',
    noPlayers: 'שלום! בקשו ממבוגר להוסיף אתכם.',
    test: 'שלום! בואו נשחק חשבון!'
  };
  var PRAISE = SAY.praise;
  var RETRY = SAY.retry;

  // ---------- Random helpers ----------
  function randInt(rng, lo, hi) { // inclusive
    return lo + Math.floor(rng() * (hi - lo + 1));
  }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function shuffle(rng, arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Three different numbers in [lo, hi], one of them the answer, the others close to it.
  function numberChoices(rng, answer, lo, hi, count) {
    count = count || 3;
    var set = [answer];
    var spread = 1;
    var guard = 0;
    while (set.length < count && guard++ < 200) {
      var d = randInt(rng, 1, spread) * (rng() < 0.5 ? -1 : 1);
      var c = answer + d;
      if (c >= lo && c <= hi && set.indexOf(c) === -1) set.push(c);
      if (guard % 6 === 0) spread++;
    }
    // Fallback (tiny ranges): fill from the range.
    for (var v = lo; set.length < count && v <= hi; v++) {
      if (set.indexOf(v) === -1) set.push(v);
    }
    return shuffle(rng, set);
  }


  // ---------- Question makers ----------
  function makeCount(rng, stage) {
    var item = pick(rng, ITEMS);
    var n = randInt(rng, 1, stage.max);
    return {
      type: 'count', item: item.e, n: n, answer: n,
      messy: !!stage.messy && rng() < 0.6,
      choices: numberChoices(rng, n, 1, stage.max),
      say: 'כמה ' + item.many + ' יש?',
      key: 'count:' + n
    };
  }

  // Two groups: which side has more (or fewer)? Later the sides can be the same → "=".
  function makeCompare(rng, stage) {
    var item = pick(rng, ITEMS);
    var ask = stage.fewer && rng() < 0.45 ? 'fewer' : 'more';
    var a = randInt(rng, 1, stage.max), b;
    var same = stage.equal && rng() < 0.22;
    if (same) {
      b = a;
    } else {
      var minGap = stage.gap || 2, guard = 0;
      do { b = randInt(rng, 1, stage.max); } while (Math.abs(a - b) < minGap && guard++ < 100);
      if (a === b) b = a === 1 ? 2 : a - 1;
    }
    var answer = same ? 'same' : ((ask === 'more') === (a > b) ? 'left' : 'right');
    var say = 'באיזה צד יש ' + (ask === 'more' ? 'יותר ' : 'פחות ') + item.many + '?';
    if (stage.equal) say += ' ואם יש אותו דבר, לחצו על השווה.';
    return {
      type: 'compare', ask: ask, item: item.e, left: a, right: b, answer: answer,
      choices: stage.equal ? ['left', 'right', 'same'] : ['left', 'right'],
      say: say, key: 'compare:' + ask + ':' + a + ':' + b
    };
  }

  // Two numbers (with dots): which is bigger / smaller?
  function makeBigger(rng, stage) {
    var a = randInt(rng, 1, stage.max), b, guard = 0;
    do { b = randInt(rng, 1, stage.max); } while (a === b && guard++ < 50);
    if (a === b) b = a === 1 ? 2 : a - 1;
    var ask = stage.smaller && rng() < 0.4 ? 'smaller' : 'bigger';
    return {
      type: 'bigger', ask: ask, choices: [a, b],
      answer: ask === 'bigger' ? Math.max(a, b) : Math.min(a, b),
      say: ask === 'bigger' ? 'איזה מספר גדול יותר?' : 'איזה מספר קטן יותר?',
      key: 'bigger:' + ask + ':' + a + ':' + b
    };
  }

  // Counting up: 2, 3, 4, ? (next) or 2, ?, 4, 5 (missing).
  function makeSequence(rng, stage, missing) {
    var start = randInt(rng, 1, stage.max - 3);
    var seq = [start, start + 1, start + 2, start + 3];
    var hide = missing ? randInt(rng, 1, 2) : 3;
    var answer = seq[hide];
    seq[hide] = null;
    return {
      type: missing ? 'missing' : 'next', seq: seq, answer: answer,
      choices: numberChoices(rng, answer, 1, stage.max),
      say: missing ? 'איזה מספר חסר?' : 'מה המספר הבא?',
      key: (missing ? 'missing:' : 'next:') + start + ':' + hide
    };
  }
  function makeNext(rng, stage) { return makeSequence(rng, stage, false); }
  function makeMissing(rng, stage) { return makeSequence(rng, stage, true); }

  // Number patterns for the big kids: 2, 4, 6, ? or 9, 8, 7, ?
  function makeNumPattern(rng, stage) {
    var step = pick(rng, stage.steps || [1]);
    var lo = step > 0 ? 0 : -3 * step;
    var hi = step > 0 ? stage.max - 3 * step : stage.max;
    if (hi < lo) { step = 1; lo = 0; hi = stage.max - 3; }
    var start = randInt(rng, lo, hi);
    var seq = [start, start + step, start + 2 * step];
    var answer = start + 3 * step;
    var set = [answer];
    // Good wrong answers: off by one, and "the same step the wrong way".
    [answer + 1, answer - 1, start + step, answer + step, answer - 2].forEach(function (c) {
      if (set.length < 3 && c >= 0 && c <= stage.max && set.indexOf(c) === -1 && rng() < 0.7) set.push(c);
    });
    var choices = set.length === 3 ? shuffle(rng, set) : numberChoices(rng, answer, 0, stage.max);
    return {
      type: 'numpattern', step: step, seq: seq.concat([null]), answer: answer, choices: choices,
      say: 'מה המספר הבא?',
      key: 'numpattern:' + start + ':' + step
    };
  }

  // A few of the same thing; then one more comes, or one goes away. How many now?
  function makeChange(rng, stage) {
    var item = pick(rng, ITEMS);
    var max = Math.min(stage.max, 6);
    var dir = rng() < 0.5 ? 1 : -1;
    var n = dir > 0 ? randInt(rng, 1, max - 1) : randInt(rng, 2, max);
    var answer = n + dir;
    var say = dir > 0
      ? (item.f ? 'עוד אחת הגיעה! ' : 'עוד אחד הגיע! ') + 'כמה ' + item.many + ' יש עכשיו?'
      : (item.f ? 'אחת הלכה! ' : 'אחד הלך! ') + 'כמה ' + item.many + ' נשארו?';
    return {
      type: 'change', item: item.e, n: n, dir: dir, answer: answer,
      choices: numberChoices(rng, answer, 1, max),
      say: say, key: 'change:' + n + ':' + dir
    };
  }

  // Dots shown like a dice face for a moment, then covered: how many did you see?
  function makeQuick(rng, stage) {
    var max = Math.min(6, stage.quickMax || 6);
    var n = randInt(rng, 1, max);
    return {
      type: 'quick', n: n, answer: n,
      choices: numberChoices(rng, n, 1, Math.max(max, 4)),
      say: 'הסתכלו טוב! כמה נקודות ראיתם?',
      key: 'quick:' + n
    };
  }

  // Picture patterns: 🔴🟦🔴🟦 ? (AB), AAB, ABB, ABC, AABB, ABBC
  function makePattern(rng, stage) {
    var kind = pick(rng, stage.patterns || ['AB']);
    var pics = shuffle(rng, PATTERN_PICS).slice(0, 4);
    var unit = kind.split('').map(function (ch) { return pics[ch.charCodeAt(0) - 65]; });
    var shown = Math.min(9, unit.length * 2 + randInt(rng, 0, unit.length - 1)); // fits the screen
    var seq = [];
    for (var i = 0; i < shown; i++) seq.push(unit[i % unit.length]);
    var answer = unit[shown % unit.length];
    // Choices: the pictures in the pattern, plus another one if the pattern only has two.
    var opts = [];
    unit.forEach(function (u) { if (opts.indexOf(u) === -1) opts.push(u); });
    if (opts.length < 3) opts.push(pics[3]);
    return {
      type: 'pattern', kind: kind, seq: seq, answer: answer,
      choices: shuffle(rng, opts.slice(0, 3).indexOf(answer) === -1 ? [answer].concat(opts.slice(0, 2)) : opts.slice(0, 3)),
      say: 'מה בא אחר כך?',
      key: 'pattern:' + seq.join('')
    };
  }

  // Odd or even: the dots are lined up in pairs, so you can see if one is left alone.
  function makeParity(rng, stage) {
    var n = randInt(rng, 1, stage.max);
    return {
      type: 'parity', n: n, answer: n % 2 === 0 ? 'even' : 'odd',
      choices: ['even', 'odd'],
      say: 'האם ' + numWord(n) + ' זוגי או אי-זוגי?',
      key: 'parity:' + n
    };
  }

  function makeMatch(rng, stage) {
    var n = randInt(rng, 1, stage.max);
    return {
      type: 'match', n: n, answer: n,
      choices: numberChoices(rng, n, 1, stage.max),
      say: 'איפה יש ' + dotsPhrase(n) + '?',
      key: 'match:' + n
    };
  }

  function makeAdd(rng, stage) {
    var max = stage.addMax || stage.max;
    var sum = randInt(rng, 2, max);
    // Bias toward bigger sums at the 20 stage so it actually practices teens.
    if (max > 10 && rng() < 0.6) sum = randInt(rng, 11, max);
    var a = randInt(rng, 1, sum - 1);
    var b = sum - a;
    return {
      type: 'add', a: a, b: b, op: '+', answer: sum,
      choices: numberChoices(rng, sum, stage.addMax ? 1 : 0, max),
      say: numWord(a) + ' ועוד ' + numWord(b) + '. כמה זה ביחד?',
      key: 'add:' + a + ':' + b
    };
  }

  function makeSub(rng, stage) {
    var a = randInt(rng, 2, stage.max);
    if (stage.max > 10 && rng() < 0.6) a = randInt(rng, 11, stage.max);
    var b = randInt(rng, 1, a - 1);
    var ans = a - b;
    return {
      type: 'sub', a: a, b: b, op: '−', answer: ans,
      choices: numberChoices(rng, ans, 0, stage.max),
      say: numWord(a) + ' פחות ' + numWord(b) + '. כמה נשאר?',
      key: 'sub:' + a + ':' + b
    };
  }

  var MAKERS = {
    count: makeCount, compare: makeCompare, match: makeMatch, add: makeAdd, sub: makeSub,
    bigger: makeBigger, next: makeNext, missing: makeMissing, numpattern: makeNumPattern,
    change: makeChange, quick: makeQuick, pattern: makePattern, parity: makeParity
  };

  function getStage(profile) {
    var track = TRACKS[profile.level] || TRACKS.little;
    var i = Math.max(0, Math.min(track.length - 1, profile.stage | 0));
    return track[i];
  }

  // Make the next question: never the same kind twice in a row (so it stays varied).
  function nextQuestion(profile, prevKey, rng) {
    rng = rng || Math.random;
    var stage = getStage(profile);
    var prevType = prevKey ? String(prevKey).split(':')[0] : null;
    var types = stage.types.filter(function (t) { return t !== prevType; });
    if (!types.length) types = stage.types;
    var q, guard = 0;
    do {
      var type = pick(rng, types);
      q = MAKERS[type](rng, stage);
    } while (q.key === prevKey && guard++ < 20);
    q.stage = stage.id;
    return q;
  }

  // ---------- Getting harder / easier ----------
  // Call once per question with whether the FIRST tap was right.
  // Returns 'up', 'down' or null. Mutates profile.stage/streak/misses.
  function recordFirstTry(profile, wasRight) {
    var track = TRACKS[profile.level] || TRACKS.little;
    profile.streak = profile.streak | 0;
    profile.misses = profile.misses | 0;
    profile.stage = profile.stage | 0;
    if (wasRight) {
      profile.streak++; profile.misses = 0;
      if (profile.streak >= LEVEL_UP_STREAK && profile.stage < track.length - 1) {
        profile.stage++; profile.streak = 0;
        return 'up';
      }
    } else {
      profile.misses++; profile.streak = 0;
      if (profile.misses >= LEVEL_DOWN_MISSES && profile.stage > 0) {
        profile.stage--; profile.misses = 0;
        return 'down';
      }
    }
    return null;
  }

  // ---------- Saved data ----------
  var STORAGE_KEY = 'fun-with-math:data:v1';
  var DATA_VERSION = 2;

  function defaultRewards() {
    return [
      { id: 'p100', emoji: '🍦', name: 'Ice cream', price: 100 },
      { id: 'p200', emoji: '🎮', name: 'Pokémon game', price: 200 },
      { id: 'p300', emoji: '🧱', name: 'Lego game', price: 300 }
    ];
  }

  function defaultData() {
    return {
      version: DATA_VERSION,
      profiles: [],
      rewards: defaultRewards(),
      log: [],
      voiceURI: null
    };
  }

  // Version 1 came with sample rewards (10/15/5 coins). If nobody changed them, swap in the prize list.
  var V1_SAMPLE_REWARDS = 'r1|Ice cream|10,r2|Show time|15,r3|Extra bedtime story|5';
  function isUntouchedV1Rewards(rewards) {
    return rewards.map(function (r) { return r.id + '|' + r.name + '|' + r.price; }).join(',') === V1_SAMPLE_REWARDS;
  }

  function normalizeData(d) {
    var base = defaultData();
    if (!d || typeof d !== 'object') return base;
    var out = {
      version: DATA_VERSION,
      profiles: Array.isArray(d.profiles) ? d.profiles.filter(function (p) { return p && p.id; }) : [],
      rewards: Array.isArray(d.rewards) ? d.rewards.filter(function (r) { return r && r.id; }) : base.rewards,
      log: Array.isArray(d.log) ? d.log.slice(-300) : [],
      voiceURI: typeof d.voiceURI === 'string' ? d.voiceURI : null
    };
    if ((d.version | 0) < 2) {
      if (isUntouchedV1Rewards(out.rewards)) out.rewards = defaultRewards();
      out.voiceURI = null; // the saved voice was an English one
    }
    out.rewards.forEach(function (r) {
      r.price = Math.max(1, Math.min(9999, r.price | 0));
      r.emoji = typeof r.emoji === 'string' && r.emoji.trim() ? r.emoji.trim().slice(0, 16) : '🎁';
      r.image = cleanImage(r.image);
    });
    out.profiles.forEach(function (p) {
      p.name = String(p.name || '').slice(0, 20);
      p.avatar = p.avatar || AVATARS[0];
      p.level = p.level === 'big' ? 'big' : 'little';
      var track = TRACKS[p.level];
      p.stage = Math.max(0, Math.min(track.length - 1, p.stage | 0));
      p.streak = p.streak | 0; p.misses = p.misses | 0;
      p.coins = Math.max(0, halves(p.coins));
    });
    return out;
  }

  function halves(x) { return Math.round((Number(x) || 0) * 2) / 2; }

  function coinsForAnswer(wrongTaps) {
    wrongTaps = Math.max(0, wrongTaps | 0);
    return COINS_BY_WRONG[Math.min(wrongTaps, COINS_BY_WRONG.length - 1)];
  }

  // 12.5 → "12½", 0.5 → "½", 3 → "3"
  function formatCoins(n) {
    n = halves(n);
    var whole = Math.floor(n);
    var half = n - whole >= 0.5;
    if (!half) return String(whole);
    return (whole ? String(whole) : '') + '½';
  }

  // A reward's picture: an emoji, or a small photo saved as a data URL.
  var MAX_IMAGE_CHARS = 150000;
  function cleanImage(img) {
    return typeof img === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(img) && img.length <= MAX_IMAGE_CHARS ? img : null;
  }

  function newId(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function addCoins(data, profile, delta, reason) {
    profile.coins = Math.max(0, halves(halves(profile.coins) + delta));
    data.log.push({ t: Date.now(), profileId: profile.id, delta: delta, reason: reason || '' });
    if (data.log.length > 300) data.log = data.log.slice(-300);
    return profile.coins;
  }

  // Grown-up gate question: a × b with a, b in 6..9.
  function adultQuestion(rng) {
    rng = rng || Math.random;
    var a = randInt(rng, 6, 9), b = randInt(rng, 6, 9);
    return { a: a, b: b, answer: a * b };
  }

  // ---------- Voice choice ----------
  var NOVELTY = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|pipe organ)\b/i;

  var VOICE_LANG = 'he-IL';

  // Hebrew voices only ("he", or the old code "iw"). Premium > Enhanced > the rest.
  function voiceScore(v) {
    var lang = String(v.lang || '').replace('_', '-').toLowerCase();
    if (!(lang === 'he' || lang === 'iw' || lang.indexOf('he-') === 0 || lang.indexOf('iw-') === 0)) return -1;
    var name = String(v.name || '');
    var id = name + ' ' + String(v.voiceURI || '');
    if (NOVELTY.test(name) || /speech\.synthesis\.voice\./i.test(id)) return -1;
    var s = 1;
    if (/premium/i.test(id)) s += 40;
    else if (/enhanced/i.test(id)) s += 30;
    if (/eloquence/i.test(id)) s -= 5;
    if (/carmit/i.test(name)) s += 2;
    if (v.localService) s += 1;
    return s;
  }

  function pickVoice(voices, savedURI) {
    voices = voices || [];
    if (savedURI) {
      for (var i = 0; i < voices.length; i++) if (voices[i].voiceURI === savedURI) return voices[i];
    }
    var best = null, bestScore = 0;
    voices.forEach(function (v) {
      var s = voiceScore(v);
      if (s > bestScore) { best = v; bestScore = s; }
    });
    return best;
  }

  function hebrewVoices(voices) {
    return (voices || []).filter(function (v) { return voiceScore(v) > 0; })
      .sort(function (a, b) { return voiceScore(b) - voiceScore(a); });
  }

  var api = {
    ROUND_LENGTH: ROUND_LENGTH, COIN_PER_RIGHT: COIN_PER_RIGHT, ROUND_BONUS: ROUND_BONUS,
    LEVEL_UP_STREAK: LEVEL_UP_STREAK, LEVEL_DOWN_MISSES: LEVEL_DOWN_MISSES,
    TRACKS: TRACKS, ITEMS: ITEMS, PATTERN_PICS: PATTERN_PICS, MAKERS: MAKERS, AVATARS: AVATARS, PRAISE: PRAISE, RETRY: RETRY, SAY: SAY,
    STORAGE_KEY: STORAGE_KEY, DATA_VERSION: DATA_VERSION, VOICE_LANG: VOICE_LANG,
    numWord: numWord, dotsPhrase: dotsPhrase, defaultRewards: defaultRewards,
    COINS_BY_WRONG: COINS_BY_WRONG, coinsForAnswer: coinsForAnswer, formatCoins: formatCoins, halves: halves,
    cleanImage: cleanImage, MAX_IMAGE_CHARS: MAX_IMAGE_CHARS,
    randInt: randInt, pick: pick, shuffle: shuffle, numberChoices: numberChoices,
    nextQuestion: nextQuestion, getStage: getStage, recordFirstTry: recordFirstTry,
    defaultData: defaultData, normalizeData: normalizeData, newId: newId, addCoins: addCoins,
    adultQuestion: adultQuestion, pickVoice: pickVoice, voiceScore: voiceScore,
    hebrewVoices: hebrewVoices
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FWM = api;
})(typeof self !== 'undefined' ? self : this);
