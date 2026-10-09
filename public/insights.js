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

  // One card per word: a concept groups the entries that carry the same
  // word (or sound or sign) in different languages, and each entry keeps
  // its own language, mastery and journey. An entry without a concept_id
  // (an old cached state, or a moment between deploy and backfill) stands
  // alone. Entries are sorted by id, so the title is the first language
  // entered, and the card sits in the log at the earliest of its dates.
  function groupConcepts(entries) {
    var map = new Map();
    var orphans = [];
    entries.forEach(function (e) {
      if (e.concept_id != null) {
        if (!map.has(e.concept_id)) map.set(e.concept_id, []);
        map.get(e.concept_id).push(e);
      } else {
        orphans.push(e);
      }
    });
    var concepts = Array.from(map.keys()).map(function (key) {
      var list = map.get(key).slice().sort(function (a, b) { return a.id - b.id; });
      return { key: key, kind: list[0].kind, title: list[0], entries: list,
        first_on: list.reduce(function (min, e) { return e.said_on < min ? e.said_on : min; }, list[0].said_on) };
    });
    orphans.forEach(function (e, i) {
      concepts.push({ key: 'e' + (e.id != null ? e.id : i), kind: e.kind, title: e, entries: [e], first_on: e.said_on });
    });
    return concepts;
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
    var first = words.reduce(function (min, e) { return e.said_on.slice(0, 7) < min ? e.said_on.slice(0, 7) : min; }, current);
    // Always show at least six months; long histories remain available.
    var start = Math.min(end - 5, monthIndex(first));
    var months = [];
    for (var i = start; i <= end; i++) {
      var key = monthKey(i);
      months.push({ key: key, count: words.filter(function (e) { return e.said_on.slice(0, 7) === key; }).length });
    }

    // Everything the child has: one card per word, however many languages
    // it carries. growth counts each card once, at the date its first
    // language was noticed; mastery and languages stay per entry.
    var concepts = groupConcepts(entries);
    var gFirst = concepts.reduce(function (min, c) { return c.first_on.slice(0, 7) < min ? c.first_on.slice(0, 7) : min; }, current);
    var gStart = Math.min(end - 6, monthIndex(gFirst));
    var running = 0;
    var growth = [];
    for (var g = gStart; g <= end; g++) {
      var gKey = monthKey(g);
      var added = concepts.filter(function (c) { return c.first_on.slice(0, 7) === gKey; }).length;
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

    // The words a child has in more than one language, newest first, each
    // listed once with every language and its own stage under it.
    var acrossLanguages = concepts
      .filter(function (c) { return c.entries.length >= 2; })
      .sort(function (a, b) { return b.first_on.localeCompare(a.first_on); })
      .map(function (c) {
        return {
          key: c.key, kind: c.kind, label: c.title.label, first_on: c.first_on,
          languages: c.entries.map(function (e) {
            return { id: e.id, label: e.label, language_name: e.language_name || null, mastery: masteryOf(e) };
          }),
        };
      });

    return { counts: counts, languages: Array.from(languages.values()), months: months,
      thisMonth: entries.filter(function (e) { return e.said_on.slice(0, 7) === current; }),
      total: concepts.length,
      thisWeek: concepts.filter(function (c) { return c.first_on >= weekStart && c.first_on <= today; }).length,
      growth: growth, byLanguage: languageList, mastery: mastery, acrossLanguages: acrossLanguages };
  }

  var api = { summarize: summarize, masteryOf: masteryOf, groupConcepts: groupConcepts };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RiloInsights = api;
})(typeof window !== 'undefined' ? window : globalThis);
