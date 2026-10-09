/* Pure record calculations, shared by the browser and regression tests. */
(function (root) {
  'use strict';

  // The stage an entry is at. Rows from before the three-stage redesign carry
  // only the boolean, so it still answers.
  function masteryOf(e) {
    if (e.mastery === 'emerging' || e.mastery === 'practicing' || e.mastery === 'mastered') return e.mastery;
    return e.mastered === true ? 'mastered' : 'emerging';
  }

  function monthIndex(key) {
    var parts = key.split('-').map(Number);
    return parts[0] * 12 + parts[1] - 1;
  }
  function monthKey(i) {
    var y = Math.floor(i / 12), m = i % 12 + 1;
    return y + '-' + String(m).padStart(2, '0');
  }
  function addDays(iso, n) {
    var d = new Date(iso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }
  function mondayOf(iso) {
    var d = new Date(iso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
    return d.toISOString().slice(0, 10);
  }

  function summarize(entries, today) {
    // "Dated" firsts are the ones learned on a known day. Quick-start picks
    // are flagged already_learned: they count in totals, languages and
    // mastery, but never as something new learned this week or this month.
    function dated(e) { return e.already_learned !== true; }
    var words = entries.filter(function (e) { return e.kind === 'word'; });
    var counts = { word: words.length, sound: 0, sign: 0, mastered: 0 };
    var languages = new Map();
    entries.forEach(function (e) { if (e.kind !== 'word') counts[e.kind] += 1; });
    words.forEach(function (e) {
      if (e.mastered === true) counts.mastered += 1;
      var name = e.language_name || 'Not assigned';
      var key = name.toLocaleLowerCase();
      if (!languages.has(key)) languages.set(key, { name: name, count: 0 });
      languages.get(key).count += 1;
    });
    var current = today.slice(0, 7);
    var end = monthIndex(current);
    var first = words.reduce(function (min, e) { return e.said_on.slice(0, 7) < min ? e.said_on.slice(0, 7) : min; }, current);
    // Always show at least six months; long histories remain available.
    var start = Math.min(end - 5, monthIndex(first));
    var months = [];
    for (var i = start; i <= end; i++) {
      var key = monthKey(i);
      months.push({ key: key, count: words.filter(function (e) { return dated(e) && e.said_on.slice(0, 7) === key; }).length });
    }

    // Everything the child has: words, sounds and signs together.
    // growth: each month's new entries and the running total at its end.
    // When the family onboarded with quick-start picks, growth starts in
    // that first month with no padding before it, the chart counts only
    // dated firsts (the onboarding month starts empty), and each month also
    // carries how many were already learned there. Otherwise, at least
    // seven months are shown, as before.
    var anyLearned = entries.some(function (e) { return !dated(e); });
    var firstAll = entries.reduce(function (min, e) { return e.said_on.slice(0, 7) < min ? e.said_on.slice(0, 7) : min; }, current);
    var gStart = anyLearned ? monthIndex(firstAll) : Math.min(end - 6, monthIndex(firstAll));
    var running = 0;
    var growth = [];
    for (var g = gStart; g <= end; g++) {
      var gKey = monthKey(g);
      var added = entries.filter(function (e) { return dated(e) && e.said_on.slice(0, 7) === gKey; }).length;
      var baseline = entries.filter(function (e) { return !dated(e) && e.said_on.slice(0, 7) === gKey; }).length;
      running += added;
      growth.push({ key: gKey, added: added, baseline: baseline, total: running });
    }

    // The same series at a week's grain: the last eight weeks, each starting
    // on a Monday, with the monthly rules carried over. Only dated firsts
    // count as added; an onboarding batch is the baseline of its week; and
    // when the family onboarded with quick-start picks the series starts in
    // that week, with no empty weeks before it. History older than the
    // window is seeded into the first bar, so the last weekly total always
    // matches the count behind the Total badge.
    var weekBase = addDays(mondayOf(today), -49);
    if (anyLearned) {
      var firstDate = entries.reduce(function (min, e) { return e.said_on < min ? e.said_on : min; }, today);
      var firstWeek = mondayOf(firstDate);
      if (firstWeek > weekBase) weekBase = firstWeek;
    }
    var weekRunning = entries.filter(function (e) { return dated(e) && e.said_on < weekBase; }).length;
    var weekCount = Math.min(8, Math.max(1, Math.round((Date.parse(mondayOf(today)) - Date.parse(weekBase)) / (7 * 86400000)) + 1));
    var weeks = [];
    for (var w = 0; w < weekCount; w++) {
      var mon = addDays(weekBase, w * 7);
      var sun = addDays(mon, 6);
      var wAdded = entries.filter(function (e) { return dated(e) && e.said_on >= mon && e.said_on <= sun; }).length;
      var wBaseline = entries.filter(function (e) { return !dated(e) && e.said_on >= mon && e.said_on <= sun; }).length;
      weekRunning += wAdded;
      weeks.push({ key: mon, added: wAdded, baseline: wBaseline, total: weekRunning });
    }

    var byLanguage = new Map();
    entries.forEach(function (e) {
      var name = e.language_name || 'No language';
      var key = name.toLocaleLowerCase();
      if (!byLanguage.has(key)) byLanguage.set(key, { name: name, count: 0, assigned: !!e.language_name });
      byLanguage.get(key).count += 1;
    });
    var languageList = Array.from(byLanguage.values()).sort(function (a, b) {
      if (a.assigned !== b.assigned) return a.assigned ? -1 : 1;
      return b.count - a.count || a.name.localeCompare(b.name);
    });

    var mastery = { emerging: 0, practicing: 0, mastered: 0 };
    entries.forEach(function (e) { mastery[masteryOf(e)] += 1; });

    var weekAgo = new Date(today + 'T00:00:00Z');
    weekAgo.setUTCDate(weekAgo.getUTCDate() - 6);
    var weekStart = weekAgo.toISOString().slice(0, 10);

    return { counts: counts, languages: Array.from(languages.values()), months: months,
      thisMonth: entries.filter(function (e) { return dated(e) && e.said_on.slice(0, 7) === current; }),
      total: entries.length,
      thisWeek: entries.filter(function (e) { return dated(e) && e.said_on >= weekStart && e.said_on <= today; }).length,
      growth: growth, weeks: weeks, byLanguage: languageList, mastery: mastery,
      alreadyLearned: entries.filter(function (e) { return !dated(e); }).length };
  }

  var api = { summarize: summarize, masteryOf: masteryOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RiloInsights = api;
})(typeof window !== 'undefined' ? window : globalThis);
