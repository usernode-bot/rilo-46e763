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

    // weeks: the last eight Monday weeks, mirroring growth's rules. Only
    // dated firsts are new; already-learned picks stay in baseline and out
    // of the running total. A week's total counts every dated first up to
    // its Sunday, so the weekly numbers line up with the monthly ones.
    // When the family onboarded with quick-start picks, the series starts
    // at the earliest entry's week, like growth starts at its month.
    var mondayOf = function (d) {
      var m = new Date(d + 'T00:00:00Z');
      m.setUTCDate(m.getUTCDate() - ((m.getUTCDay() + 6) % 7));
      return m;
    };
    var thisMonday = mondayOf(today);
    var weeks = [];
    for (var w = 7; w >= 0; w--) {
      var wStart = new Date(thisMonday);
      wStart.setUTCDate(wStart.getUTCDate() - w * 7);
      var wEnd = new Date(wStart);
      wEnd.setUTCDate(wEnd.getUTCDate() + 6);
      var s = wStart.toISOString().slice(0, 10);
      var e = wEnd.toISOString().slice(0, 10);
      weeks.push({ start: s, end: e,
        added: entries.filter(function (x) { return dated(x) && x.said_on >= s && x.said_on <= e; }).length,
        baseline: entries.filter(function (x) { return !dated(x) && x.said_on >= s && x.said_on <= e; }).length,
        total: entries.filter(function (x) { return dated(x) && x.said_on <= e; }).length });
    }
    if (anyLearned) {
      var firstMonday = mondayOf(entries.reduce(function (min, x) { return x.said_on < min ? x.said_on : min; }, today)).toISOString().slice(0, 10);
      while (weeks.length && weeks[0].start < firstMonday) weeks.shift();
    }

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
