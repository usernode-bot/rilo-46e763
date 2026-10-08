/* Pure record calculations, shared by the browser and regression tests. */
(function (root) {
  'use strict';
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
    var first = words.reduce(function (min, e) { return e.said_on.slice(0, 7) < min ? e.said_on.slice(0, 7) : min; }, current);
    var parts = current.split('-').map(Number);
    var end = parts[0] * 12 + parts[1] - 1;
    var startParts = first.split('-').map(Number);
    // Always show at least six months; long histories remain available.
    var start = Math.min(end - 5, startParts[0] * 12 + startParts[1] - 1);
    var months = [];
    for (var i = start; i <= end; i++) {
      var y = Math.floor(i / 12), m = i % 12 + 1;
      var key = y + '-' + String(m).padStart(2, '0');
      months.push({ key: key, count: words.filter(function (e) { return e.said_on.slice(0, 7) === key; }).length });
    }
    return { counts: counts, languages: Array.from(languages.values()), months: months,
      thisMonth: entries.filter(function (e) { return e.said_on.slice(0, 7) === current; }) };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { summarize: summarize };
  else root.RiloInsights = { summarize: summarize };
})(typeof window !== 'undefined' ? window : globalThis);
