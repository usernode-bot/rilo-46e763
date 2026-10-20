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

  // A dated entry is one learned on a known day: not a quick-start pick
  // (already learned) and not an "I don't remember" first (undated, whose
  // said_on is a sort-only day). Totals and counts include the undated
  // ones; growth and "this week" never do.
  function isDated(e) {
    return e.already_learned !== true && e.noticed_unknown !== true;
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
      // a quick-start pick, and "undated" only when every language on it was
      // saved with "I don't remember"; otherwise it is filed at its first
      // dated language (a mixed card shows that language's day).
      var datedEntries = g.entries.filter(function (e) { return isDated(e); });
      g.already_learned = datedEntries.length === 0 &&
        g.entries.every(function (e) { return e.already_learned === true; });
      g.undated = datedEntries.length === 0 && !g.already_learned;
      var pool = datedEntries.length ? datedEntries : g.entries;
      g.first_on = pool.reduce(function (min, e) {
        return e.said_on < min ? e.said_on : min;
      }, pool[0].said_on);
      return g;
    });
  }

  function summarize(entries, today) {
    // "Dated" firsts are the ones learned on a known day. Quick-start picks
    // are flagged already_learned and "I don't remember" firsts are flagged
    // noticed_unknown: both count in totals, languages and mastery, but
    // never as something new learned this week, this month or on the chart.
    function dated(e) { return isDated(e); }
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
    var first = words.filter(function (e) { return dated(e); })
      .reduce(function (min, e) { return e.said_on.slice(0, 7) < min ? e.said_on.slice(0, 7) : min; }, current);
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
    // Undated cards carry a sort-only day: they sit out of the chart
    // entirely, so they never pull its start earlier either.
    var datedGroups = groups.filter(function (g) { return !g.undated; });
    var firstAll = datedGroups.reduce(function (min, g) { return g.first_on.slice(0, 7) < min ? g.first_on.slice(0, 7) : min; }, current);
    var gStart = anyLearned ? monthIndex(firstAll) : Math.min(end - 6, monthIndex(firstAll));
    var running = 0;
    var growth = [];
    for (var g = gStart; g <= end; g++) {
      var gKey = monthKey(g);
      var added = datedGroups.filter(function (c) { return !c.already_learned && c.first_on.slice(0, 7) === gKey; }).length;
      var baseline = datedGroups.filter(function (c) { return c.already_learned && c.first_on.slice(0, 7) === gKey; }).length;
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
        added: datedGroups.filter(function (x) { return !x.already_learned && x.first_on >= s && x.first_on <= e; }).length,
        baseline: datedGroups.filter(function (x) { return x.already_learned && x.first_on >= s && x.first_on <= e; }).length,
        total: datedGroups.filter(function (x) { return !x.already_learned && x.first_on <= e; }).length });
    }
    if (anyLearned) {
      var firstMonday = mondayOf(datedGroups.reduce(function (min, x) { return x.first_on < min ? x.first_on : min; }, today)).toISOString().slice(0, 10);
      while (weeks.length && weeks[0].start < firstMonday) weeks.shift();
    }


    return { counts: counts, languages: Array.from(languages.values()), months: months,
      thisMonth: entries.filter(function (e) { return dated(e) && e.said_on.slice(0, 7) === current; }),
      total: groups.length,
      thisWeek: datedGroups.filter(function (c) { return !c.already_learned && c.first_on >= weekStart && c.first_on <= today; }).length,
      growth: growth, weeks: weeks, byLanguage: languageList, mastery: mastery,
      alreadyLearned: groups.filter(function (c) { return c.already_learned; }).length,
      undated: groups.filter(function (c) { return c.undated; }).length,
      acrossLanguages: acrossLanguages };
  }

  var api = { summarize: summarize, masteryOf: masteryOf, groupConcepts: groupConcepts, isDated: isDated };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RiloInsights = api;
})(typeof window !== 'undefined' ? window : globalThis);