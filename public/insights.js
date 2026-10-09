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
    // The onboarding batch (quick-start picks) is already learned: it stays
    // in every total but never counts as growth. Split it off once.
    var flagged = entries.filter(function (e) { return e.already_learned === true; });
    var grown = entries.filter(function (e) { return e.already_learned !== true; });
    var first = words.reduce(function (min, e) { return e.said_on.slice(0, 7) < min ? e.said_on.slice(0, 7) : min; }, current);
    // Always show at least six months; long histories remain available.
    var start = Math.min(end - 5, monthIndex(first));
    var months = [];
    for (var i = start; i <= end; i++) {
      var key = monthKey(i);
      months.push({ key: key, count: words.filter(function (e) { return e.said_on.slice(0, 7) === key; }).length });
    }

    // Everything the child has: words, sounds and signs together.
    // growth: each month's new entries and the running total at its end.
    // With an onboarding batch, growth starts in the month the family began
    // using Rilo (the earliest flagged entry), that first month left empty,
    // and only firsts added after it are charted; a grown entry dated before
    // it (an edit can back-date) still stretches the chart back to itself.
    // Without one, the old rule stands: from the first entry, at least
    // seven months shown.
    var firstAll = grown.reduce(function (min, e) { return e.said_on.slice(0, 7) < min ? e.said_on.slice(0, 7) : min; }, current);
    var gStart;
    if (flagged.length) {
      var baseline = flagged.reduce(function (min, e) { return e.said_on.slice(0, 7) < min ? e.said_on.slice(0, 7) : min; }, current);
      gStart = Math.min(monthIndex(baseline), monthIndex(firstAll));
    } else {
      gStart = Math.min(end - 6, monthIndex(firstAll));
    }
    var running = 0;
    var growth = [];
    for (var g = gStart; g <= end; g++) {
      var gKey = monthKey(g);
      var added = grown.filter(function (e) { return e.said_on.slice(0, 7) === gKey; }).length;
      running += added;
      growth.push({ key: gKey, added: added, total: running });
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
      thisMonth: entries.filter(function (e) { return e.said_on.slice(0, 7) === current; }),
      total: entries.length,
      thisWeek: grown.filter(function (e) { return e.said_on >= weekStart && e.said_on <= today; }).length,
      growth: growth, byLanguage: languageList, mastery: mastery };
  }

  var api = { summarize: summarize, masteryOf: masteryOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RiloInsights = api;
})(typeof window !== 'undefined' ? window : globalThis);
