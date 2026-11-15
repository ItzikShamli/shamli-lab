/* Fun With Math — game logic (no DOM).
 * Works in the browser (window.FWM) and in Node (module.exports) so it can be tested.
 */
(function (root) {
  'use strict';

  // ---------- Settings ----------
  var ROUND_LENGTH = 10;        // questions per round
  var COIN_PER_RIGHT = 1;       // coin for a right answer on the first try
  var ROUND_BONUS = 3;          // bonus coins for finishing a round
  var LEVEL_UP_STREAK = 5;      // right-first-try in a row to get harder
  var LEVEL_DOWN_MISSES = 3;    // wrong-first-try in a row to get easier

  // Each track is a list of stages, easiest first.
  var TRACKS = {
    little: [
      { id: 'L1', max: 5,  types: ['count', 'more', 'match'] },
      { id: 'L2', max: 7,  types: ['count', 'more', 'match'] },
      { id: 'L3', max: 10, types: ['count', 'more', 'match'] }
    ],
    big: [
      { id: 'B1', max: 5,  types: ['add'] },
      { id: 'B2', max: 10, types: ['add'] },
      { id: 'B3', max: 10, types: ['add', 'sub'] },
      { id: 'B4', max: 20, types: ['add', 'sub'] }
    ]
  };

  var ITEMS = [
    { e: '🍎', one: 'apple', many: 'apples' },
    { e: '🍓', one: 'strawberry', many: 'strawberries' },
    { e: '⭐', one: 'star', many: 'stars' },
    { e: '🐞', one: 'ladybug', many: 'ladybugs' },
    { e: '🐟', one: 'fish', many: 'fish' },
    { e: '🎈', one: 'balloon', many: 'balloons' },
    { e: '🍪', one: 'cookie', many: 'cookies' },
    { e: '🌸', one: 'flower', many: 'flowers' },
    { e: '🐥', one: 'chick', many: 'chicks' },
    { e: '🚗', one: 'car', many: 'cars' },
    { e: '🦋', one: 'butterfly', many: 'butterflies' },
    { e: '🍌', one: 'banana', many: 'bananas' }
  ];

  var AVATARS = ['🦁', '🐯', '🐰', '🦊', '🐼', '🐨', '🐸', '🐵',
                 '🦄', '🦖', '🐙', '🦈', '🐧', '🦉', '🐶', '🐱',
                 '🐢', '🐝', '🚀', '⚽'];

  var PRAISE = ['Great job!', 'Yes!', 'Awesome!', 'You got it!', 'Super!', 'Well done!'];
  var RETRY = ['Try again!', 'Almost! Try again.', 'Oops! Try again.'];

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

  function itemName(item, n) { return n === 1 ? item.one : item.many; }

  // ---------- Question makers ----------
  function makeCount(rng, stage) {
    var item = pick(rng, ITEMS);
    var n = randInt(rng, 1, stage.max);
    return {
      type: 'count', item: item.e, n: n, answer: n,
      choices: numberChoices(rng, n, 1, stage.max),
      say: 'How many ' + item.many + '?',
      key: 'count:' + n
    };
  }

  function makeMore(rng, stage) {
    var item = pick(rng, ITEMS);
    var a = randInt(rng, 1, stage.max);
    var b;
    // Make the difference clear for little kids: at least 2 apart when possible.
    var minGap = stage.max >= 5 ? 2 : 1;
    var guard = 0;
    do { b = randInt(rng, 1, stage.max); } while (Math.abs(a - b) < minGap && guard++ < 100);
    if (a === b) b = a === 1 ? 2 : a - 1;
    return {
      type: 'more', item: item.e, left: a, right: b,
      answer: a > b ? 'left' : 'right',
      choices: ['left', 'right'],
      say: 'Which side has more ' + item.many + '?',
      key: 'more:' + a + ':' + b
    };
  }

  function makeMatch(rng, stage) {
    var n = randInt(rng, 1, stage.max);
    return {
      type: 'match', n: n, answer: n,
      choices: numberChoices(rng, n, 1, stage.max),
      say: 'Find ' + n + (n === 1 ? ' dot.' : ' dots.'),
      key: 'match:' + n
    };
  }

  function makeAdd(rng, stage) {
    var sum = randInt(rng, 2, stage.max);
    // Bias toward bigger sums at the 20 stage so it actually practices teens.
    if (stage.max > 10 && rng() < 0.6) sum = randInt(rng, 11, stage.max);
    var a = randInt(rng, 1, sum - 1);
    var b = sum - a;
    return {
      type: 'add', a: a, b: b, op: '+', answer: sum,
      choices: numberChoices(rng, sum, 0, stage.max),
      say: a + ' plus ' + b + '. How many?',
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
      say: a + ' take away ' + b + '. How many are left?',
      key: 'sub:' + a + ':' + b
    };
  }

  var MAKERS = { count: makeCount, more: makeMore, match: makeMatch, add: makeAdd, sub: makeSub };

  function getStage(profile) {
    var track = TRACKS[profile.level] || TRACKS.little;
    var i = Math.max(0, Math.min(track.length - 1, profile.stage | 0));
    return track[i];
  }

  // Make the next question, never the exact same one twice in a row.
  function nextQuestion(profile, prevKey, rng) {
    rng = rng || Math.random;
    var stage = getStage(profile);
    var q, guard = 0;
    do {
      var type = pick(rng, stage.types);
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

  function defaultData() {
    return {
      version: 1,
      profiles: [],
      rewards: [
        { id: 'r1', emoji: '🍦', name: 'Ice cream', price: 10 },
        { id: 'r2', emoji: '📺', name: 'Show time', price: 15 },
        { id: 'r3', emoji: '📖', name: 'Extra bedtime story', price: 5 }
      ],
      log: [],
      voiceURI: null
    };
  }

  function normalizeData(d) {
    var base = defaultData();
    if (!d || typeof d !== 'object') return base;
    var out = {
      version: 1,
      profiles: Array.isArray(d.profiles) ? d.profiles.filter(function (p) { return p && p.id; }) : [],
      rewards: Array.isArray(d.rewards) ? d.rewards.filter(function (r) { return r && r.id; }) : base.rewards,
      log: Array.isArray(d.log) ? d.log.slice(-300) : [],
      voiceURI: typeof d.voiceURI === 'string' ? d.voiceURI : null
    };
    out.profiles.forEach(function (p) {
      p.name = String(p.name || '').slice(0, 20);
      p.avatar = p.avatar || AVATARS[0];
      p.level = p.level === 'big' ? 'big' : 'little';
      var track = TRACKS[p.level];
      p.stage = Math.max(0, Math.min(track.length - 1, p.stage | 0));
      p.streak = p.streak | 0; p.misses = p.misses | 0;
      p.coins = Math.max(0, p.coins | 0);
    });
    return out;
  }

  function newId(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function addCoins(data, profile, delta, reason) {
    profile.coins = Math.max(0, (profile.coins | 0) + delta);
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

  function voiceScore(v) {
    var lang = String(v.lang || '').replace('_', '-').toLowerCase();
    if (lang.indexOf('en') !== 0) return -1;
    var name = String(v.name || '');
    var id = name + ' ' + String(v.voiceURI || '');
    if (NOVELTY.test(name) || /speech\.synthesis\.voice\./i.test(id)) return -1;
    var s = 1;
    if (/premium/i.test(id)) s += 40;
    else if (/enhanced/i.test(id)) s += 30;
    if (/eloquence/i.test(id)) s -= 5;
    if (lang === 'en-us') s += 6;
    else if (lang === 'en-gb' || lang === 'en-au') s += 4;
    if (/samantha|ava|allison|susan|zoe|karen|serena/i.test(name)) s += 2;
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

  function englishVoices(voices) {
    return (voices || []).filter(function (v) { return voiceScore(v) > 0; })
      .sort(function (a, b) { return voiceScore(b) - voiceScore(a); });
  }

  var api = {
    ROUND_LENGTH: ROUND_LENGTH, COIN_PER_RIGHT: COIN_PER_RIGHT, ROUND_BONUS: ROUND_BONUS,
    LEVEL_UP_STREAK: LEVEL_UP_STREAK, LEVEL_DOWN_MISSES: LEVEL_DOWN_MISSES,
    TRACKS: TRACKS, ITEMS: ITEMS, AVATARS: AVATARS, PRAISE: PRAISE, RETRY: RETRY,
    STORAGE_KEY: STORAGE_KEY,
    randInt: randInt, pick: pick, shuffle: shuffle, numberChoices: numberChoices,
    nextQuestion: nextQuestion, getStage: getStage, recordFirstTry: recordFirstTry,
    defaultData: defaultData, normalizeData: normalizeData, newId: newId, addCoins: addCoins,
    adultQuestion: adultQuestion, pickVoice: pickVoice, voiceScore: voiceScore,
    englishVoices: englishVoices, itemName: itemName
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FWM = api;
})(typeof self !== 'undefined' ? self : this);
