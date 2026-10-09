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
test('empty records produce honest zero metrics and a six month chart', () => {
  const data = summarize([], '2026-01-01');
  assert.equal(data.months.length, 6);
  assert.ok(data.months.every(m => m.count === 0));
  assert.equal(data.counts.mastered, 0);
  assert.deepEqual(data.languages, []);
});
test('an onboarding batch is a baseline, not new this week', () => {
  const data = summarize([
    { kind: 'word', said_on: '2026-10-09', already_learned: true, mastery: 'emerging' },
    { kind: 'sound', said_on: '2026-10-09', already_learned: true, mastery: 'practicing' },
    { kind: 'sign', said_on: '2026-10-09', already_learned: true, mastery: 'mastered' },
    { kind: 'word', said_on: '2026-10-20', language_name: 'English', mastery: 'emerging' },
  ], '2026-10-25');
  // Growth starts at the onboarding month with no padding, and the chart
  // counts only dated firsts: the batch is the baseline, never new.
  assert.deepEqual(data.growth, [{ key: '2026-10', added: 1, baseline: 3, total: 1 }]);
  assert.equal(data.alreadyLearned, 3);
  // The batch stays in the totals, by language and mastery counts.
  assert.equal(data.total, 4);
  assert.equal(data.thisWeek, 1);
  assert.equal(data.thisMonth.length, 1);
  assert.deepEqual(data.mastery, { emerging: 2, practicing: 1, mastered: 1 });
});
test('later months grow from the baseline month', () => {
  const data = summarize([
    { kind: 'word', said_on: '2026-09-10', already_learned: true, mastery: 'practicing' },
    { kind: 'word', said_on: '2026-09-20', already_learned: true, mastery: 'emerging' },
    { kind: 'word', said_on: '2026-10-01', language_name: 'English', mastery: 'emerging' },
  ], '2026-10-05');
  assert.deepEqual(data.growth.map(m => [m.key, m.added, m.baseline, m.total]),
    [['2026-09', 0, 2, 0], ['2026-10', 1, 0, 1]]);
  assert.equal(data.alreadyLearned, 2);
});
test('a backdated first starts the chart earlier than onboarding', () => {
  const data = summarize([
    { kind: 'word', said_on: '2026-10-09', already_learned: true, mastery: 'emerging' },
    { kind: 'word', said_on: '2026-08-15', language_name: 'English', mastery: 'emerging' },
  ], '2026-10-25');
  assert.deepEqual(data.growth.map(m => [m.key, m.added, m.baseline, m.total]),
    [['2026-08', 1, 0, 1], ['2026-09', 0, 0, 1], ['2026-10', 0, 1, 1]]);
});
test('weekly buckets start on Mondays and carry history', () => {
  const data = summarize([
    { kind: 'word', said_on: '2026-06-15', language_name: 'English', mastery: 'emerging' },
    { kind: 'word', said_on: '2026-10-01', language_name: 'English', mastery: 'emerging' },
    { kind: 'word', said_on: '2026-10-08', language_name: 'Spanish', mastery: 'emerging' },
  ], '2026-10-09'); // a Friday, so the current week starts Monday 2026-10-05
  assert.equal(data.weeks.length, 8);
  assert.deepEqual(data.weeks.map(w => w.key),
    ['2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05']);
  assert.ok(data.weeks.every(w => new Date(w.key + 'T00:00:00Z').getUTCDay() === 1));
  // History older than the window is folded into the first bar's total.
  assert.deepEqual(data.weeks[0].total, 1);
  assert.deepEqual(data.weeks[7].total, 3);
});
test('already-learned picks are a weekly baseline, never new', () => {
  const data = summarize([
    { kind: 'word', said_on: '2026-09-28', already_learned: true, mastery: 'emerging' },
    { kind: 'sound', said_on: '2026-09-28', already_learned: true, mastery: 'practicing' },
    { kind: 'word', said_on: '2026-10-08', language_name: 'English', mastery: 'emerging' },
  ], '2026-10-09');
  const batch = data.weeks.find(w => w.key === '2026-09-28');
  assert.deepEqual([batch.added, batch.baseline], [0, 2]);
  assert.deepEqual([data.weeks[data.weeks.length - 1].added, data.weeks[data.weeks.length - 1].total], [1, 1]);
});
test('the weekly series starts at the onboarding week', () => {
  const data = summarize([
    { kind: 'word', said_on: '2026-09-25', already_learned: true, mastery: 'emerging' },
    { kind: 'sound', said_on: '2026-09-25', already_learned: true, mastery: 'practicing' },
  ], '2026-10-09');
  // Weeks before the family started are not shown: three buckets, not eight.
  assert.deepEqual(data.weeks.map(w => w.key), ['2026-09-21', '2026-09-28', '2026-10-05']);
  assert.deepEqual([data.weeks[0].added, data.weeks[0].baseline, data.weeks[0].total], [0, 2, 0]);
});
test('sounds and signs count in weekly buckets', () => {
  const data = summarize([
    { kind: 'sound', said_on: '2026-10-07', mastery: 'emerging' },
    { kind: 'sign', said_on: '2026-10-07', mastery: 'practicing' },
    { kind: 'word', said_on: '2026-10-08', language_name: 'English', mastery: 'emerging' },
  ], '2026-10-09');
  assert.deepEqual([data.weeks[data.weeks.length - 1].added, data.weeks[data.weeks.length - 1].total], [3, 3]);
});
