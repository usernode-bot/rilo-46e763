const { test } = require('node:test');
const assert = require('node:assert/strict');
const { summarize } = require('../public/insights');
test('monthly new words include gaps, cross years, and exclude sounds/signs', () => {
  const data = summarize([
    { kind: 'word', said_on: '2025-12-31', language_name: 'English', mastered: true },
    { kind: 'word', said_on: '2026-02-01', language_name: 'Spanish', mastered: false },
    { kind: 'word', said_on: '2026-02-07', language_name: null },
    { kind: 'sound', said_on: '2026-02-07', language_name: 'English', mastered: true },
    { kind: 'sign', said_on: '2026-02-07', language_name: 'ASL', mastered: true },
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
test('onboarding picks are already learned: growth starts at their month, empty', () => {
  const data = summarize([
    { kind: 'word', said_on: '2026-10-09', language_name: 'English', already_learned: true, mastery: 'emerging' },
    { kind: 'sound', said_on: '2026-10-09', language_name: 'English', already_learned: true, mastery: 'practicing' },
    { kind: 'word', said_on: '2026-11-05', language_name: 'English', mastery: 'emerging' },
    { kind: 'word', said_on: '2026-11-20', language_name: 'Spanish', mastery: 'emerging' },
  ], '2026-12-03');
  // The onboarding month shows 0 new and 0 total; only later firsts grow.
  assert.deepEqual(data.growth.map(m => [m.key, m.added, m.total]),
    [['2026-10', 0, 0], ['2026-11', 2, 2], ['2026-12', 0, 2]]);
  assert.equal(data.growth.length, 3);
  assert.equal(data.thisWeek, 0);
  // The batch still counts in the total and the mastery tiles.
  assert.equal(data.total, 4);
  assert.deepEqual(data.mastery, { emerging: 3, practicing: 1, mastered: 0 });
});
test('empty records produce honest zero metrics and a six month chart', () => {
  const data = summarize([], '2026-01-01');
  assert.equal(data.months.length, 6);
  assert.ok(data.months.every(m => m.count === 0));
  assert.equal(data.counts.mastered, 0);
  assert.deepEqual(data.languages, []);
});
