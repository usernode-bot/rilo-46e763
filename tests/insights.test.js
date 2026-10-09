const { test } = require('node:test');
const assert = require('node:assert/strict');
const { summarize, groupConcepts } = require('../public/insights');
test('monthly new words include gaps, cross years, and exclude sounds/signs', () => {
  const data = summarize([
    { id: 1, kind: 'word', said_on: '2025-12-31', language_name: 'English', mastered: true },
    { id: 2, kind: 'word', said_on: '2026-02-01', language_name: 'Spanish', mastered: false },
    { id: 3, kind: 'word', said_on: '2026-02-07', language_name: null },
    { id: 4, kind: 'sound', said_on: '2026-02-07', language_name: 'English', mastered: true },
    { id: 5, kind: 'sign', said_on: '2026-02-07', language_name: 'ASL', mastered: true },
  ], '2026-02-08');
  assert.deepEqual(data.counts, { word: 3, sound: 1, sign: 1, mastered: 1 });
  assert.deepEqual(data.months.slice(-3).map(m => [m.key, m.count]), [['2025-12', 1], ['2026-01', 0], ['2026-02', 2]]);
  assert.deepEqual(data.languages, [{ name: 'English', count: 1 }, { name: 'Spanish', count: 1 }, { name: 'Not assigned', count: 1 }]);
  assert.equal(data.thisMonth.length, 4);
});
test('growth is a running total of every entry, with mastery stages and all languages', () => {
  const data = summarize([
    { kind: 'word', said_on: '2026-01-10', language_name: 'English', mastery: 'mastered', mastered: true },
    { kind: 'sign', said_on: '2026-03-02', language_name: 'ASL', mastery: 'practicing' },
    { kind: 'word', said_on: '2026-03-05', language_name: 'Spanish', mastered: false },
    { kind: 'sound', said_on: '2026-03-06', language_name: null, mastered: true },
  ], '2026-03-08');
  assert.equal(data.total, 4);
  assert.equal(data.thisWeek, 3);
  assert.deepEqual(data.growth.slice(-3).map(m => [m.key, m.added, m.total]),
    [['2026-01', 1, 1], ['2026-02', 0, 1], ['2026-03', 3, 4]]);
  assert.ok(data.growth.length >= 7);
  // A row from before the redesign maps its boolean.
  assert.deepEqual(data.mastery, { emerging: 1, practicing: 1, mastered: 2 });
  assert.deepEqual(data.byLanguage.map(l => [l.name, l.count]),
    [['ASL', 1], ['English', 1], ['Spanish', 1], ['No language', 1]]);
});
test('empty records produce honest zero metrics and a six month chart', () => {
  const data = summarize([], '2026-01-01');
  assert.equal(data.months.length, 6);
  assert.ok(data.months.every(m => m.count === 0));
  assert.equal(data.counts.mastered, 0);
  assert.deepEqual(data.languages, []);
});

test('groupConcepts groups entries by concept_id, titling with the first language', () => {
  const water = { id: 1, kind: 'word', label: 'water', concept_id: 7, said_on: '2026-05-03', language_name: 'English', mastery: 'mastered' };
  const agua = { id: 5, kind: 'word', label: 'agua', concept_id: 7, said_on: '2026-10-05', language_name: 'Spanish', mastery: 'emerging' };
  const alone = { id: 9, kind: 'sound', label: 'duck', concept_id: null, said_on: '2026-10-01', language_name: null };
  const concepts = groupConcepts([agua, alone, water]);
  assert.equal(concepts.length, 2);
  const linked = concepts.find(c => c.entries.length === 2);
  assert.equal(linked.key, 7);
  assert.equal(linked.title.label, 'water');
  assert.deepEqual(linked.entries.map(e => e.id), [1, 5]);
  assert.equal(linked.first_on, '2026-05-03');
  assert.equal(concepts.find(c => c.entries.length === 1).key, 'e9');
});

test('totals count a word once, however many languages it has', () => {
  const data = summarize([
    { id: 1, kind: 'word', label: 'water', concept_id: 7, said_on: '2026-05-03', language_name: 'English', mastery: 'mastered', mastered: true },
    { id: 5, kind: 'word', label: 'agua', concept_id: 7, said_on: '2026-10-05', language_name: 'Spanish', mastery: 'emerging' },
    { id: 6, kind: 'word', label: 'duck', concept_id: 8, said_on: '2026-10-03', language_name: 'English', mastery: 'practicing' },
  ], '2026-10-08');
  assert.equal(data.total, 2);
  // Agua joins an older card, so October gains one, not two.
  const oct = data.growth.find(m => m.key === '2026-10');
  assert.equal(oct.added, 1);
  // Adding a language to an existing card is not a new word this week.
  assert.equal(data.thisWeek, 1);
});

test('mastery and languages stay per language', () => {
  const data = summarize([
    { id: 1, kind: 'word', label: 'water', concept_id: 7, said_on: '2026-05-03', language_name: 'English', mastery: 'mastered', mastered: true },
    { id: 5, kind: 'word', label: 'agua', concept_id: 7, said_on: '2026-10-05', language_name: 'Spanish', mastery: 'emerging' },
  ], '2026-10-08');
  assert.deepEqual(data.mastery, { emerging: 1, practicing: 0, mastered: 1 });
  assert.deepEqual(data.byLanguage.map(l => [l.name, l.count]), [['English', 1], ['Spanish', 1]]);
});

test('acrossLanguages lists each multi-language card once, newest first', () => {
  const water = { id: 1, kind: 'word', label: 'water', concept_id: 7, said_on: '2026-05-03', language_name: 'English', mastery: 'mastered' };
  const agua = { id: 5, kind: 'word', label: 'agua', concept_id: 7, said_on: '2026-10-05', language_name: 'Spanish', mastery: 'emerging' };
  const single = { id: 6, kind: 'word', label: 'duck', concept_id: 8, said_on: '2026-10-01', language_name: 'English', mastery: 'practicing' };
  const data = summarize([agua, single, water], '2026-10-08');
  assert.equal(data.acrossLanguages.length, 1);
  assert.deepEqual(data.acrossLanguages[0].languages.map(l => [l.label, l.language_name, l.mastery]),
    [['water', 'English', 'mastered'], ['agua', 'Spanish', 'emerging']]);
  const none = summarize([single], '2026-10-08');
  assert.deepEqual(none.acrossLanguages, []);
});
