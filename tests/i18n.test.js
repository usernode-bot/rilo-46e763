const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  STRINGS, SERVER_ERRORS_ES, IDEAS, BATCH, bandFor, bandOrder, ideasFor,
} = require('../public/i18n');

function typeOf(value) {
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function assertSameShape(en, es, at) {
  assert.equal(typeOf(es), typeOf(en), at + ' has the same type');
  if (Array.isArray(en)) {
    assert.equal(es.length, en.length, at + ' has the same length');
    en.forEach((v, i) => assertSameShape(v, es[i], at + '[' + i + ']'));
  } else if (en && typeof en === 'object') {
    assert.deepEqual(Object.keys(es).sort(), Object.keys(en).sort(), at + ' has the same keys');
    Object.keys(en).forEach((key) => assertSameShape(en[key], es[key], at + '.' + key));
  }
}

function walkStrings(value, at, visit) {
  if (typeof value === 'string') return visit(value, at);
  if (typeof value === 'function') {
    const outs = [];
    [[3, 'Leo', 'Palabras'], ['Palabras', 'Leo', 3]].forEach((args) => {
      try { outs.push(value.apply(null, args)); } catch (e) { /* wrong sample args */ }
    });
    assert.ok(outs.length > 0, at + ' can be called');
    return outs.forEach((out, i) => visit(out, at + '() call ' + (i + 1)));
  }
  if (Array.isArray(value)) return value.forEach((v, i) => walkStrings(v, at + '[' + i + ']', visit));
  if (value && typeof value === 'object') {
    return Object.keys(value).forEach((key) => walkStrings(value[key], at + '.' + key, visit));
  }
}

test('English and Spanish have the same keys and types', () => {
  assertSameShape(STRINGS.en, STRINGS.es, 'STRINGS');
  assert.equal(STRINGS.en.months.length, 12);
  assert.equal(STRINGS.es.monthsShort.length, 12);
});

test('no user-facing string either language contains an em dash', () => {
  ['en', 'es'].forEach((lang) => {
    walkStrings(STRINGS[lang], lang, (value, at) => {
      assert.equal(typeof value, 'string', at + ' builds a string');
      assert.ok(value.indexOf('—') === -1, at + ' has no em dash');
    });
  });
});

test('Spanish and English ages read the expected way', () => {
  assert.equal(STRINGS.es.formatAge(0, 'Leo'), 'Menos de 1 mes');
  assert.equal(STRINGS.es.formatAge(1, 'Leo'), '1 mes');
  assert.equal(STRINGS.es.formatAge(15, 'Leo'), '1 año y 3 meses');
  assert.equal(STRINGS.es.formatAge(24, 'Leo'), '2 años');
  assert.equal(STRINGS.en.formatAge(0, 'Leo'), 'Under 1 month');
  assert.equal(STRINGS.en.formatAge(1, 'Leo'), '1 month');
  assert.equal(STRINGS.en.formatAge(15, 'Leo'), '1 year 3 months');
  assert.equal(STRINGS.en.formatAge(24, 'Leo'), '2 years');
});

test('the idea catalogue is complete and bilingual', () => {
  const categories = ['people', 'animals', 'food', 'transport', 'play', 'body', 'home', 'outside', 'actions', 'words'];
  const ids = new Set();
  IDEAS.forEach((idea) => {
    assert.ok(!ids.has(idea.id), 'id ' + idea.id + ' is unique');
    ids.add(idea.id);
    assert.ok([12, 18, 24, 36].includes(idea.band), idea.id + ' has a band');
    assert.ok(['word', 'sound', 'sign'].includes(idea.kind), idea.id + ' has a kind');
    assert.ok(categories.includes(idea.category), idea.id + ' has a category');
    ['en', 'es'].forEach((lang) => {
      const words = idea[lang];
      assert.ok(words && typeof words.label === 'string', idea.id + ' has a ' + lang + ' label');
      assert.ok(words.label.length >= 1 && words.label.length <= 60, idea.id + ' label length');
      if (idea.kind === 'sound' || idea.kind === 'sign') {
        assert.ok(typeof words.sounds_like === 'string' && words.sounds_like.length <= 80,
          idea.id + ' has a ' + lang + ' sound or gesture');
      }
    });
  });
  [12, 18, 24, 36].forEach((band) => {
    const of = IDEAS.filter((idea) => idea.band === band);
    assert.equal(of.filter((idea) => idea.kind === 'word').length, 24, 'band ' + band + ' words');
    assert.equal(of.filter((idea) => idea.kind === 'sound').length, 9, 'band ' + band + ' sounds');
    assert.equal(of.filter((idea) => idea.kind === 'sign').length, 3, 'band ' + band + ' signs');
  });
  // Every idea offered before this change is still in the catalogue.
  const labels = new Set(IDEAS.filter((idea) => idea.en).map((idea) => idea.en.label));
  ['mama', 'dada', 'ball', 'milk', 'water', 'bye', 'no', 'uh-oh', 'kitty', 'dog', 'book', 'more',
    'cow', 'cat', 'sheep', 'duck', 'car', 'ambulance', 'horn', 'all done', 'eat']
    .forEach((label) => assert.ok(labels.has(label), 'keeps ' + label));
  ['mama', 'dada', 'ball', 'milk', 'water', 'bye', 'no', 'uh-oh', 'kitty', 'dog', 'book', 'more']
    .forEach((label) => assert.ok(IDEAS.some((idea) => idea.kind === 'word' && idea.en.label === label), 'word ' + label));
  ['cow', 'dog', 'cat', 'sheep', 'duck', 'car', 'ambulance', 'horn']
    .forEach((label) => assert.ok(IDEAS.some((idea) => idea.kind === 'sound' && idea.en.label === label), 'sound ' + label));
  ['more', 'milk', 'all done', 'bye', 'eat']
    .forEach((label) => assert.ok(IDEAS.some((idea) => idea.kind === 'sign' && idea.en.label === label), 'sign ' + label));
});

test('age bands and their order follow the child', () => {
  assert.equal(bandFor(-1), 12);
  assert.equal(bandFor(0), 12);
  assert.equal(bandFor(14), 12);
  assert.equal(bandFor(15), 18);
  assert.equal(bandFor(20), 18);
  assert.equal(bandFor(21), 24);
  assert.equal(bandFor(29), 24);
  assert.equal(bandFor(30), 36);
  assert.equal(bandFor(60), 36);
  assert.deepEqual(bandOrder(12), [12, 18, 24, 36]);
  assert.deepEqual(bandOrder(18), [18, 12, 24, 36]);
  assert.deepEqual(bandOrder(24), [24, 18, 12, 36]);
  assert.deepEqual(bandOrder(36), [36, 24, 18, 12]);
});

test('ideas for an 18-month-old start at 18 months and come in dozens', () => {
  const list = ideasFor(18);
  assert.equal(list.length, 144);
  assert.equal(list[0].band, 18);
  assert.equal(new Set(list.map((idea) => idea.id)).size, 144, 'no idea repeats');
  for (let i = 0; i < list.length; i += BATCH) {
    const batch = list.slice(i, i + BATCH);
    assert.equal(batch.filter((idea) => idea.kind === 'word').length, 8, 'batch ' + i / BATCH + ' words');
    assert.equal(batch.filter((idea) => idea.kind === 'sound').length, 3, 'batch ' + i / BATCH + ' sounds');
    assert.equal(batch.filter((idea) => idea.kind === 'sign').length, 1, 'batch ' + i / BATCH + ' signs');
  }
});

test('every server error the page can show has a Spanish wording', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  const messages = new Set();
  const re = /error:\s*'([^']+)'/g;
  let match;
  while ((match = re.exec(source))) messages.add(match[1]);
  assert.ok(messages.size > 5, 'found the server messages');
  messages.forEach((message) => {
    if (message === 'account_required') return;
    assert.ok(SERVER_ERRORS_ES[message], 'Spanish wording for: ' + message);
  });
});
