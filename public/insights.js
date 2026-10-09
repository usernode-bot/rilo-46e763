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

  // One card per word: a concept groups the entries that are the same word
  // in different languages. Mastery and dates stay on each entry; the group
  // only carries the word. An entry with no concept_id (an old cached state)
  // stands alone.
  function groupConcepts(entries) {
    var map = new Map();
    entries.forEach(function (e, i) {
      var key = e.concept_id != null ? 'c' + e.concept_id : 'e' + (e.id != null ? e.id : i);
      var g = map.get(key);
      if (!g) {
        g = { key: key, kind: e.kind, entries: [] };
        map.set(key, g);
      }
      g.entries.push(e);
    });
    return Array.from(map.values()).map(function (g) {
      g.entries.sort(function (a, b) { return (a.id || 0) - (b.id || 0); });
      g.title = g.entries[0];
      // A card is "already learned" only when every language on it came from
      // a quick-start pick; otherwise it is filed at its first dated language.
      var datedEntries = g.entries.filter(function (e) { return e.already_learned !== true; });
      g.already_learned = datedEntries.length === 0;
      var pool = g.already_learned ? g.entries : datedEntries;
      g.first_on = pool.reduce(function (min, e) {
        return e.said_on < min ? e.said_on : min;
      }, pool[0].said_on);
      return g;
    });
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

    // Everything the child has: words, sounds and signs together. A word
    // with several languages is counted once, at the date its first language
    // was noticed.
    // growth: each month's new entries and the running total at its end.
    // When the family onboarded with quick-start picks, growth starts in
    // that first month with no padding before it, the chart counts only
    // dated firsts (the onboarding month starts empty), and each month also
    // carries how many were already learned there. Otherwise, at least
    // seven months are shown, as before.
    var groups = groupConcepts(entries);
    var anyLearned = groups.some(function (g) { return g.already_learned; });
    var firstAll = groups.reduce(function (min, g) { return g.first_on.slice(0, 7) < min ? g.first_on.slice(0, 7) : min; }, current);
    var gStart = anyLearned ? monthIndex(firstAll) : Math.min(end - 6, monthIndex(firstAll));
    var running = 0;
    var growth = [];
    for (var g = gStart; g <= end; g++) {
      var gKey = monthKey(g);
      var added = groups.filter(function (c) { return !c.already_learned && c.first_on.slice(0, 7) === gKey; }).length;
      var baseline = groups.filter(function (c) { return c.already_learned && c.first_on.slice(0, 7) === gKey; }).length;
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

    // Words the child has in more than one language, newest first, each with
    // every language's own mastery stage.
    var acrossLanguages = groups
      .filter(function (c) { return c.entries.length > 1; })
      .sort(function (a, b) { return b.first_on.localeCompare(a.first_on); })
      .map(function (c) {
        return {
          key: c.key, title: c.title.label, kind: c.kind,
          languages: c.entries.map(function (e) {
            return { id: e.id, label: e.label, language_name: e.language_name || null, mastery: masteryOf(e) };
          }),
        };
      });

    return { counts: counts, languages: Array.from(languages.values()), months: months,
      thisMonth: entries.filter(function (e) { return dated(e) && e.said_on.slice(0, 7) === current; }),
      total: groups.length,
      thisWeek: groups.filter(function (c) { return !c.already_learned && c.first_on >= weekStart && c.first_on <= today; }).length,
      growth: growth, byLanguage: languageList, mastery: mastery,
      alreadyLearned: groups.filter(function (c) { return c.already_learned; }).length,
      acrossLanguages: acrossLanguages };
  }

  var api = { summarize: summarize, masteryOf: masteryOf, groupConcepts: groupConcepts };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RiloInsights = api;
})(typeof window !== 'undefined' ? window : globalThis);