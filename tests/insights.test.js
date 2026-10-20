const { test } = require('node:test');
const assert = require('node:assert/strict');
const { summarize, groupConcepts } = require('../public/insights');
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

test('groupConcepts groups by concept_id and stands alone without one', () => {
  const water = { id: 1, kind: 'word', label: 'water', concept_id: 7, said_on: '2026-05-03', language_name: 'English', mastery: 'mastered', mastered: true };
  const agua = { id: 5, kind: 'word', label: 'agua', concept_id: 7, said_on: '2026-10-05', language_name: 'Spanish', mastery: 'emerging', mastered: false };
  const duck = { id: 9, kind: 'sound', label: 'duck', concept_id: null, said_on: '2026-10-01', language_name: 'English', mastery: 'emerging' };
  const groups = groupConcepts([agua, water, duck]);
  assert.equal(groups.length, 2);
  const pair = groups.find(g => g.key === 'c7');
  assert.equal(pair.title, water);
  assert.deepEqual(pair.entries, [water, agua]);
  assert.equal(pair.first_on, '2026-05-03');
  assert.equal(pair.kind, 'word');
  // A null concept_id stands alone.
  assert.deepEqual(groups.find(g => g.key === 'e9').entries, [duck]);
});

test('totals count a concept once, whatever its languages', () => {
  const data = summarize([
    { id: 1, kind: 'word', label: 'water', concept_id: 7, said_on: '2026-05-03', language_name: 'English', mastery: 'mastered', mastered: true },
    { id: 5, kind: 'word', label: 'agua', concept_id: 7, said_on: '2026-10-05', language_name: 'Spanish', mastery: 'emerging' },
    { id: 9, kind: 'sound', label: 'duck', concept_id: null, said_on: '2026-10-01', language_name: 'English', mastery: 'emerging' },
  ], '2026-10-08');
  // water and agua share one concept: two concepts, three entries.
  assert.equal(data.total, 2);
  // October's growth counts duck only: agua is not a new word.
  assert.deepEqual(data.growth.slice(-2).map(m => [m.key, m.added, m.total]),
    [['2026-09', 0, 1], ['2026-10', 1, 2]]);
  // Adding agua this week to an older concept is not "+1 this week".
  assert.equal(data.thisWeek, 0);
});

test('mastery and languages stay per language', () => {
  const data = summarize([
    { id: 1, kind: 'word', label: 'water', concept_id: 7, said_on: '2026-05-03', language_name: 'English', mastery: 'mastered', mastered: true },
    { id: 5, kind: 'word', label: 'agua', concept_id: 7, said_on: '2026-10-05', language_name: 'Spanish', mastery: 'emerging' },
    { id: 9, kind: 'sound', label: 'duck', concept_id: null, said_on: '2026-10-01', language_name: 'English', mastery: 'emerging' },
  ], '2026-10-08');
  assert.deepEqual(data.mastery, { emerging: 2, practicing: 0, mastered: 1 });
  assert.deepEqual(data.byLanguage.map(l => [l.name, l.count]),
    [['English', 2], ['Spanish', 1]]);
});

test('acrossLanguages lists multi-language words once, newest first', () => {
  const linked = [
    { id: 1, kind: 'word', label: 'water', concept_id: 7, said_on: '2026-05-03', language_name: 'English', mastery: 'mastered' },
    { id: 5, kind: 'word', label: 'agua', concept_id: 7, said_on: '2026-10-05', language_name: 'Spanish', mastery: 'emerging' },
    { id: 9, kind: 'sound', label: 'duck', concept_id: null, said_on: '2026-10-01', language_name: 'English', mastery: 'emerging' },
  ];
  const data = summarize(linked, '2026-10-08');
  assert.equal(data.acrossLanguages.length, 1);
  assert.deepEqual(data.acrossLanguages[0].title, 'water');
  assert.deepEqual(data.acrossLanguages[0].languages, [
    { id: 1, label: 'water', kind: 'word', language_name: 'English', mastery: 'mastered' },
    { id: 5, label: 'agua', kind: 'word', language_name: 'Spanish', mastery: 'emerging' },
  ]);
  const alone = summarize([
    { id: 1, kind: 'word', label: 'ball', concept_id: null, said_on: '2026-10-01', language_name: 'English', mastery: 'emerging' },
  ], '2026-10-08');
  assert.deepEqual(alone.acrossLanguages, []);
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
test('weeks are eight Mondays ending with this week', () => {
  // 2026-10-09 is a Friday: the current week is the one starting 2026-10-05.
  const data = summarize([], '2026-10-09');
  assert.deepEqual(data.weeks.map(w => w.start),
    ['2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05']);
  assert.equal(data.weeks[7].end, '2026-10-11');
  assert.ok(data.weeks.every(w => w.added === 0 && w.baseline === 0 && w.total === 0));
});
test('weekly added and running total span the window', () => {
  const data = summarize([
    { kind: 'word', said_on: '2026-09-23', mastery: 'emerging' },
    { kind: 'word', said_on: '2026-10-06', mastery: 'emerging' },
    { kind: 'word', said_on: '2026-07-10', mastery: 'emerging' },
  ], '2026-10-09');
  const w = data.weeks;
  // A first from before the eight weeks is in every week's total only.
  assert.equal(w[0].total, 1);
  assert.equal(w[0].added, 0);
  // 2026-09-23 lands in the week starting 2026-09-21.
  assert.equal(w[5].added, 1);
  assert.equal(w[5].total, 2);
  // 2026-10-06 lands in the current week, which ends on its Sunday.
  assert.equal(w[7].added, 1);
  assert.equal(w[7].total, 3);
});
test('an onboarding batch is a weekly baseline, and earlier weeks drop', () => {
  const data = summarize([
    { kind: 'word', said_on: '2026-10-06', already_learned: true, mastery: 'emerging' },
    { kind: 'word', said_on: '2026-10-08', language_name: 'English', mastery: 'emerging' },
  ], '2026-10-09');
  // The series starts at the onboarding week, like growth starts at its month.
  assert.equal(data.weeks.length, 1);
  assert.deepEqual(data.weeks[0], { start: '2026-10-05', end: '2026-10-11', added: 1, baseline: 1, total: 1 });
});
test('weeks stay eight with no entries, and the week starts on Monday', () => {
  assert.equal(summarize([], '2026-01-01').weeks.length, 8);
  // Monday today: the current week is just today.
  assert.equal(summarize([], '2026-10-05').weeks[7].start, '2026-10-05');
  // Sunday today: the week still starts the Monday before.
  assert.equal(summarize([], '2026-10-11').weeks[7].start, '2026-10-05');
});

test('a card with only undated firsts is undated, not already learned', () => {
  const groups = groupConcepts([
    { id: 1, kind: 'word', label: 'agua', concept_id: 4, said_on: '2026-10-20', language_name: 'Spanish', noticed_unknown: true },
    { id: 2, kind: 'word', label: 'water', concept_id: 4, said_on: '2026-10-20', language_name: 'English', noticed_unknown: true },
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].undated, true);
  assert.equal(groups[0].already_learned, false);
});

test('a card with one dated language is filed at that day', () => {
  const groups = groupConcepts([
    { id: 1, kind: 'word', label: 'water', concept_id: 4, said_on: '2026-05-03', language_name: 'English' },
    { id: 2, kind: 'word', label: 'agua', concept_id: 4, said_on: '2026-10-20', language_name: 'Spanish', noticed_unknown: true },
  ]);
  assert.equal(groups[0].undated, false);
  assert.equal(groups[0].first_on, '2026-05-03');
});

test('undated firsts count in totals but stay out of growth and this week', () => {
  const data = summarize([
    { id: 1, kind: 'word', label: 'water', concept_id: 4, said_on: '2026-10-05', language_name: 'English', mastery: 'mastered' },
    { id: 2, kind: 'word', label: 'agua', concept_id: 4, said_on: '2026-10-20', language_name: 'Spanish', noticed_unknown: true, mastery: 'emerging' },
    { id: 3, kind: 'word', label: 'dog', concept_id: 5, said_on: '2026-10-20', language_name: 'English', noticed_unknown: true, mastery: 'practicing' },
  ], '2026-10-21');
  // The mixed card counts once at its dated day; the undated card counts once
  // in the total only.
  assert.equal(data.total, 2);
  assert.equal(data.undated, 1);
  assert.equal(data.thisWeek, 0);
  assert.equal(data.thisMonth.length, 1);
  assert.deepEqual(data.growth.slice(-2).map(m => [m.key, m.added, m.total]),
    [['2026-09', 0, 0], ['2026-10', 1, 1]]);
  assert.ok(data.weeks.every(w => w.added === 0 && w.baseline === 0 && w.total === 0 ||
    w.total === 1));
  assert.equal(data.weeks[7].total, 1);
  // Languages and mastery count every entry, dated or not.
  assert.deepEqual(data.byLanguage.map(l => [l.name, l.count]),
    [['English', 2], ['Spanish', 1]]);
  assert.deepEqual(data.mastery, { emerging: 1, practicing: 1, mastered: 1 });
});

test('a card may hold a word and a sound: kinds lists each, title first', () => {
  const groups = groupConcepts([
    { id: 2, kind: 'word', label: 'car', concept_id: 7, said_on: '2026-10-20', language_name: 'English' },
    { id: 1, kind: 'sound', label: 'car', concept_id: 7, said_on: '2026-09-02', language_name: 'English' },
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].title.id, 1);
  assert.equal(groups[0].kind, 'sound');
  assert.deepEqual(groups[0].kinds, ['sound', 'word']);
  // A card of one kind lists just that kind.
  const alone = groupConcepts([
    { id: 3, kind: 'word', label: 'ball', concept_id: 8, said_on: '2026-10-01' },
  ]);
  assert.deepEqual(alone[0].kinds, ['word']);
});

test('a card holding a word and a sound counts once in totals', () => {
  const data = summarize([
    { id: 1, kind: 'sound', label: 'car', concept_id: 7, said_on: '2026-10-19', language_name: 'English', mastery: 'emerging' },
    { id: 2, kind: 'word', label: 'car', concept_id: 7, said_on: '2026-10-20', language_name: 'English', mastery: 'practicing' },
  ], '2026-10-20');
  assert.equal(data.total, 1);
  assert.equal(data.thisWeek, 1);
  // By-kind counts still count every entry on its own.
  assert.deepEqual(data.counts, { word: 1, sound: 1, sign: 0, mastered: 0 });
});

test('acrossLanguages carries the kinds on a mixed card', () => {
  const data = summarize([
    { id: 1, kind: 'sound', label: 'car', concept_id: 7, said_on: '2026-09-02', language_name: 'English', mastery: 'emerging' },
    { id: 2, kind: 'word', label: 'car', concept_id: 7, said_on: '2026-10-20', language_name: 'English', mastery: 'practicing' },
  ], '2026-10-20');
  assert.equal(data.acrossLanguages.length, 1);
  assert.deepEqual(data.acrossLanguages[0].kinds, ['sound', 'word']);
  assert.deepEqual(data.acrossLanguages[0].languages.map(l => [l.label, l.kind]),
    [['car', 'sound'], ['car', 'word']]);
});
