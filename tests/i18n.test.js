// The two languages and the ideas catalogue must stay in step: same keys,
// no em dashes, an age band for every child, and a batch of a dozen ideas.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const RiloI18n = require('../public/i18n.js');

const { STRINGS, IDEAS } = RiloI18n;
const CATEGORIES = ['people', 'animals', 'food', 'transport', 'play', 'body', 'home', 'outside', 'actions', 'words'];

test('English and Spanish share every key and its type', () => {
  const enKeys = Object.keys(STRINGS.en).sort();
  const esKeys = Object.keys(STRINGS.es).sort();
  assert.deepStrictEqual(esKeys, enKeys);
  enKeys.forEach((key) => {
    const en = STRINGS.en[key];
    const es = STRINGS.es[key];
    if (Array.isArray(en) || Array.isArray(es)) {
      assert.ok(Array.isArray(en) && Array.isArray(es), key + ' is an array in both');
      if (key === 'monthNames') {
        assert.strictEqual(en.length, 12);
        assert.strictEqual(es.length, 12);
      }
    } else if (typeof en === 'function') {
      assert.strictEqual(typeof es, 'function', key + ' is a function in both');
    } else {
      assert.strictEqual(typeof es, 'string', key + ' is a string in both');
    }
  });
});

test('no string uses an em dash', () => {
  const samples = { n: 3, name: 'Leo', band: 18, kind: 'words', when: '12 de octubre', entryCount: 2 };
  ['en', 'es'].forEach((lang) => {
    Object.keys(STRINGS[lang]).forEach((key) => {
      const value = STRINGS[lang][key];
      const text = typeof value === 'function'
        ? value(samples.n, samples.name, samples.band, samples.kind, samples.when)
        : value;
      if (typeof text === 'string') {
        assert.ok(text.indexOf('—') === -1, key + ' (' + lang + ') has an em dash');
      } else if (Array.isArray(text)) {
        text.forEach((item) => assert.ok(String(item).indexOf('—') === -1, key + ' has an em dash'));
      }
    });
  });
});

test('ages read the Spanish way, and English keeps its wording', () => {
  assert.strictEqual(STRINGS.es.formatAge(0, 'Leo'), 'Menos de 1 mes');
  assert.strictEqual(STRINGS.es.formatAge(1, 'Leo'), '1 mes');
  assert.strictEqual(STRINGS.es.formatAge(15, 'Leo'), '1 año y 3 meses');
  assert.strictEqual(STRINGS.es.formatAge(24, 'Leo'), '2 años');
  assert.strictEqual(STRINGS.en.formatAge(0, 'Leo'), 'Under 1 month');
  assert.strictEqual(STRINGS.en.formatAge(15, 'Leo'), '1 year 3 months');
  assert.strictEqual(STRINGS.en.formatAge(24, 'Leo'), '2 years');
});

test('every idea has both languages, a kind and a category', () => {
  const ids = new Set();
  IDEAS.forEach((idea) => {
    assert.ok(!ids.has(idea.id), 'unique id: ' + idea.id);
    ids.add(idea.id);
    assert.ok([12, 18, 24, 36].indexOf(idea.band) !== -1, idea.id + ' has a band');
    assert.ok(['word', 'sound', 'sign'].indexOf(idea.kind) !== -1, idea.id + ' has a kind');
    assert.ok(CATEGORIES.indexOf(idea.category) !== -1, idea.id + ' has a server category');
    ['en', 'es'].forEach((lang) => {
      const text = idea[lang];
      assert.ok(text && typeof text.label === 'string', idea.id + ' has a ' + lang + ' label');
      assert.ok(text.label.length >= 1 && text.label.length <= 60, idea.id + ' label length');
      if (idea.kind !== 'word') {
        assert.ok(typeof text.sounds_like === 'string' && text.sounds_like.length >= 1,
          idea.id + ' has a ' + lang + ' sound');
        assert.ok(text.sounds_like.length <= 80);
      }
    });
  });
  [12, 18, 24, 36].forEach((band) => {
    const of = IDEAS.filter((idea) => idea.band === band);
    assert.strictEqual(of.filter((i) => i.kind === 'word').length, 24, band + ' months: words');
    assert.strictEqual(of.filter((i) => i.kind === 'sound').length, 9, band + ' months: sounds');
    assert.strictEqual(of.filter((i) => i.kind === 'sign').length, 3, band + ' months: signs');
  });
});

test('the ideas offered before this change are all still there', () => {
  const before = {
    word: ['mama', 'dada', 'ball', 'milk', 'water', 'bye', 'no', 'uh-oh', 'kitty', 'dog', 'book', 'more'],
    sound: ['cow', 'dog', 'cat', 'sheep', 'duck', 'car', 'ambulance', 'horn'],
    sign: ['more', 'milk', 'all done', 'bye', 'eat'],
  };
  Object.keys(before).forEach((kind) => {
    before[kind].forEach((label) => {
      assert.ok(IDEAS.some((i) => i.kind === kind && i.en.label === label), kind + ': ' + label);
    });
  });
});

test('the age band follows whole months', () => {
  assert.strictEqual(RiloI18n.bandFor(-1), 12);
  assert.strictEqual(RiloI18n.bandFor(0), 12);
  assert.strictEqual(RiloI18n.bandFor(14), 12);
  assert.strictEqual(RiloI18n.bandFor(15), 18);
  assert.strictEqual(RiloI18n.bandFor(20), 18);
  assert.strictEqual(RiloI18n.bandFor(21), 24);
  assert.strictEqual(RiloI18n.bandFor(29), 24);
  assert.strictEqual(RiloI18n.bandFor(30), 36);
  assert.strictEqual(RiloI18n.bandFor(60), 36);
});

test('bands go from the child\'s own outward: younger first, then older', () => {
  assert.deepStrictEqual(RiloI18n.bandOrder(12), [12, 18, 24, 36]);
  assert.deepStrictEqual(RiloI18n.bandOrder(18), [18, 12, 24, 36]);
  assert.deepStrictEqual(RiloI18n.bandOrder(24), [24, 18, 12, 36]);
  assert.deepStrictEqual(RiloI18n.bandOrder(36), [36, 24, 18, 12]);
});

test('ideas come a dozen at a time, eight words, three sounds and a sign', () => {
  const ideas = RiloI18n.ideasFor(18);
  assert.strictEqual(ideas.length, 144);
  assert.strictEqual(new Set(ideas.map((i) => i.id)).size, 144);
  assert.strictEqual(ideas[0].band, 18);
  for (let b = 0; b < 12; b++) {
    const batch = ideas.slice(b * 12, b * 12 + 12);
    assert.strictEqual(batch.filter((i) => i.kind === 'word').length, 8, 'batch ' + b + ' words');
    assert.strictEqual(batch.filter((i) => i.kind === 'sound').length, 3, 'batch ' + b + ' sounds');
    assert.strictEqual(batch.filter((i) => i.kind === 'sign').length, 1, 'batch ' + b + ' signs');
  }
  assert.strictEqual(RiloI18n.BATCH, 12);
});

test('every message the server can send has a Spanish wording', () => {
  const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  const found = new Set();
  const pattern = /error: (['"])((?:\\.|(?!\1).)*)\1/g;
  let match;
  while ((match = pattern.exec(server)) !== null) found.add(match[2]);
  assert.ok(found.size > 10, 'found the server messages');
  found.forEach((message) => {
    if (message === 'account_required') return;
    assert.ok(RiloI18n.SERVER_ERRORS_ES[message], 'Spanish for: ' + message);
  });
});
