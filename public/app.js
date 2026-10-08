/* Rilo's client. Renders the whole screen into #app — setup, loading,
 * error, and the entries list — and opens the add/edit sheet, the child
 * sheet, the delete confirm and the toasts through the platform's
 * native UI kit (unNative), with a plain fallback when it is absent.
 *
 * Class names are written as whole literals so the Tailwind compiler sees
 * them (see the note in public/index.html). */
(function () {
  'use strict';

  // ── Page context ──────────────────────────────────────────────────────
  // The iframe carries `?token=`; every API call forwards it. The page's
  // demo flag is passed on to the app's own API calls, and a staging
  // preview's chosen moment travels as `x-usernode-now`.
  var pageQuery = new URLSearchParams(location.search);
  var TOKEN = pageQuery.get('token') || '';
  var WITH_DEMO = pageQuery.get('demo') === '1';

  var app = document.getElementById('app');

  var ICON_PLUS =
    '<svg viewBox="0 0 24 24" class="h-5 w-5 flex-none" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var ICON_PENCIL =
    '<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function api(path, opts) {
    opts = opts || {};
    var search = [];
    if (WITH_DEMO) search.push('demo=1');
    var url = path + (search.length ? (path.indexOf('?') === -1 ? '?' : '&') + search.join('&') : '');
    var headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (TOKEN) headers['x-usernode-token'] = TOKEN;
    if (window.usernode && window.usernode.previewNow) {
      headers['x-usernode-now'] = window.usernode.now().toISOString();
    }
    return fetch(url, Object.assign({}, opts, { headers: headers })).then(function (res) {
      return res.text().then(function (text) {
        var body = {};
        try { body = text ? JSON.parse(text) : {}; } catch (e) { body = {}; }
        if (!res.ok) {
          var err = new Error(body.error || 'Something went wrong. Try again.');
          err.status = res.status;
          err.code = body.error;
          throw err;
        }
        return body;
      });
    });
  }

  // ── Dates and ages ────────────────────────────────────────────────────
  // "Now" comes from the bridge so a staging preview's chosen moment rules
  // the default date, the header age and the date picker's max.
  function nowDate() {
    return window.usernode && window.usernode.now ? window.usernode.now() : new Date();
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayIso() {
    var d = nowDate();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function parseIso(iso) {
    if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    var parts = iso.split('-');
    return { y: Number(parts[0]), m: Number(parts[1]), d: Number(parts[2]) };
  }
  // Whole months between the birthday and a date: the same formula the
  // server's ages are checked against.
  function ageMonths(birthday, on) {
    var b = parseIso(birthday);
    var t = parseIso(on);
    if (!b || !t) return 0;
    return (t.y - b.y) * 12 + (t.m - b.m) - (t.d < b.d ? 1 : 0);
  }
  function formatAge(months, name) {
    if (months < 0) return 'Before ' + name + "'s birthday";
    if (months === 0) return 'Under 1 month';
    var y = Math.floor(months / 12);
    var m = months % 12;
    var yPart = y === 1 ? '1 year' : y > 1 ? y + ' years' : '';
    var mPart = m === 1 ? '1 month' : m > 1 ? m + ' months' : '';
    if (!y) return mPart;
    if (!m) return yPart;
    return yPart + ' ' + mPart;
  }
  var shortFmt, longFmt;
  function fmtShort(iso) {
    var d = new Date(iso + 'T00:00:00');
    var opts = { month: 'short', day: 'numeric' };
    if (d.getFullYear() !== nowDate().getFullYear()) opts.year = 'numeric';
    shortFmt = shortFmt || {};
    var key = opts.year || 'none';
    shortFmt[key] = shortFmt[key] ||
      new Intl.DateTimeFormat(navigator.language || 'en', opts);
    return shortFmt[key].format(d);
  }
  function fmtLong(iso) {
    longFmt = longFmt || new Intl.DateTimeFormat(navigator.language || 'en', { month: 'long', day: 'numeric' });
    return longFmt.format(new Date(iso + 'T00:00:00'));
  }

  // The birth month and year, two selects: month and year is all a birthday
  // needs to be here, and a select works on every phone (the creator's ask).
  function monthSelectHtml(id, mm) {
    return '<select id="' + id + '" class="field">' + MONTH_NAMES.map(function (m, i) {
      var v = pad(i + 1);
      return '<option value="' + v + '"' + (mm === v ? ' selected' : '') + '>' + m + '</option>';
    }).join('') + '</select>';
  }
  function yearSelectHtml(id, yyyy) {
    var opts = [];
    for (var y = nowDate().getFullYear(); y >= 1990; y--) {
      opts.push('<option value="' + y + '"' + (yyyy === y ? ' selected' : '') + '>' + y + '</option>');
    }
    return '<select id="' + id + '" class="field">' + opts.join('') + '</select>';
  }

  // ── Words for things ─────────────────────────────────────────────────
  var KINDS = {
    word: {
      one: 'Word', many: 'Words', the: 'The word',
      eg: 'e.g. ball',
      how: function (name) { return 'How ' + name + ' says it'; },
      verb: 'says', empty: 'No words yet.', add: 'Add a word',
      unit: ['word', 'words'], icon: 'words',
    },
    sound: {
      one: 'Sound', many: 'Sounds', the: 'The animal or thing',
      eg: 'e.g. cow or car',
      how: function (name) { return 'The sound ' + name + ' makes'; },
      verb: 'makes', empty: 'No sounds yet.', add: 'Add a sound',
      unit: ['sound', 'sounds'], icon: 'animals',
    },
    sign: {
      one: 'Sign', many: 'Signs', the: 'The sign',
      eg: 'e.g. more',
      how: function (name) { return 'How ' + name + ' signs it'; },
      verb: null, empty: 'No signs yet.', add: 'Add a sign',
      unit: ['sign', 'signs'], icon: 'body',
    },
  };

  // The quick start: common entries a parent can tap in one go instead of
  // adding everything by hand (the creator's ask). Each pick is saved as an
  // ordinary first dated today. Sounds are anything that makes a sound,
  // animals and things alike — a car goes vroom, a horn goes beep beep
  // (the creator's ask), so the group is "Sounds", not "Animal sounds".
  var QUICK_STARTS = [
    { group: 'Words', kind: 'word', items: [
      { label: 'mama' }, { label: 'dada' }, { label: 'ball' }, { label: 'milk' },
      { label: 'water' }, { label: 'bye' }, { label: 'no' }, { label: 'uh-oh' },
      { label: 'kitty' }, { label: 'dog' }, { label: 'book' }, { label: 'more' },
    ] },
    { group: 'Sounds', kind: 'sound', items: [
      { label: 'cow', sounds_like: 'moo' },
      { label: 'dog', sounds_like: 'woof woof' },
      { label: 'cat', sounds_like: 'meow' },
      { label: 'sheep', sounds_like: 'baa' },
      { label: 'duck', sounds_like: 'quack' },
      { label: 'car', sounds_like: 'vroom' },
      { label: 'ambulance', sounds_like: 'wee-o wee-o' },
      { label: 'horn', sounds_like: 'beep beep' },
    ] },
    { group: 'Signs', kind: 'sign', items: [
      { label: 'more', sounds_like: 'Taps fingertips together' },
      { label: 'milk', sounds_like: 'Squeezes a fist' },
      { label: 'all done', sounds_like: 'Twists both hands' },
      { label: 'bye', sounds_like: 'Opens and closes a hand' },
      { label: 'eat', sounds_like: 'Taps fingers to mouth' },
    ] },
  ];

  // Categories are inferred from entry labels, including Spanish.
  // Phrases checked whole first, then single words. Order inside the lists
  // does not matter; the first category whose list matches wins.
  var CAT_PHRASES = {
    'all done': 'actions', 'uh-oh': 'actions', 'uh oh': 'actions',
    'night-night': 'home', 'night night': 'home',
  };
  var CAT_WORDS = {
    people: ['mama', 'mamá', 'mamma', 'mom', 'mommy', 'mum', 'dada', 'dad', 'daddy',
      'papa', 'papá', 'baba', 'nana', 'grandma', 'grandpa', 'abuela', 'abuelo',
      'baby', 'sister', 'brother', 'tia', 'tía', 'tío', 'tio'],
    animals: ['dog', 'cat', 'kitty', 'puppy', 'cow', 'duck', 'sheep', 'pig',
      'horse', 'bird', 'bear', 'lion', 'fish', 'bunny', 'owl', 'gato', 'perro',
      'pato', 'oveja', 'vaca', 'moo', 'woof', 'meow', 'quack'],
    food: ['milk', 'agua', 'water', 'juice', 'banana', 'plátano', 'apple', 'cheese',
      'bread', 'egg', 'cookie', 'snack', 'eat', 'drink', 'leche'],
    transport: ['car', 'coche', 'bus', 'truck', 'train', 'plane', 'boat',
      'ambulance', 'horn', 'vroom', 'beep', 'wee-o', 'weeo'],
    play: ['ball', 'pelota', 'book', 'libro', 'blocks', 'bubbles', 'doll', 'puzzle', 'teddy'],
    body: ['hand', 'nose', 'feet', 'toes', 'head', 'eyes', 'ears', 'hair',
      'tummy', 'mouth', 'shoes', 'socks', 'hat'],
    home: ['bed', 'cup', 'door', 'light', 'phone', 'blanket', 'bath', 'sleep',
      'spoon', 'house', 'night'],
    outside: ['tree', 'flower', 'moon', 'star', 'sun', 'rain', 'sky', 'snow', 'leaf'],
    actions: ['more', 'bye', 'hi', 'hello', 'hola', 'adiós', 'adios', 'no', 'yes',
      'please', 'sorry', 'up', 'down', 'kiss', 'hug', 'done', 'uh', 'oh'],
  };
  function inferCategory(label) {
    var text = String(label || '').toLowerCase();
    for (var phrase in CAT_PHRASES) {
      if (text.indexOf(phrase) !== -1) return CAT_PHRASES[phrase];
    }
    var tokens = text.split(/[^a-záéíóúñü]+/).filter(Boolean);
    for (var i = 0; i < tokens.length; i++) {
      for (var cat in CAT_WORDS) {
        if (CAT_WORDS[cat].indexOf(tokens[i]) !== -1) return cat;
      }
    }
    return 'words';
  }

  // The sun badge on a block: this first is mastered, said in full.
  var MAST_BADGE =
    '<span class="mast"><svg viewBox="0 0 24 24" class="text-on-sun" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5 9.5 18 20 6.5"/></svg></span>';

  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // ── State ────────────────────────────────────────────────────────────
  var state = {
    screen: 'loading', // loading | error | app | quickstart
    loadError: null,
    child: null,
    languages: [],
    entries: [],
    page: ['insights', 'profile', 'log'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'words',
    search: '', filter: '',
    tab: null, // null shows the kind cards; 'word' | 'sound' | 'sign' shows that kind's list
    sessionLangs: [], // languages created this session, still unused
    quickPick: {}, // quick-start picks: item id -> true
  };

  function countKind(kind) {
    return state.entries.filter(function (e) { return e.kind === kind; }).length;
  }

  function languagesUsed() {
    var names = {};
    var n = 0;
    state.entries.forEach(function (e) {
      if (e.language_name && !names[e.language_name]) { names[e.language_name] = true; n += 1; }
    });
    return n;
  }

  function mostUsedLanguageId() {
    var used = state.languages.filter(function (l) { return l.uses > 0; })
      .sort(function (a, b) { return b.uses - a.uses; });
    return used.length ? used[0].id : null;
  }

  function defaultLanguageId(kind) {
    var sameKind = state.entries.filter(function (e) { return e.kind === kind && e.language_id; });
    if (sameKind.length) return sameKind[0].language_id; // entries are newest first
    return mostUsedLanguageId();
  }

  // ── Presenting: the kit, with a plain fallback ────────────────────────
  function presentSheet(contentEl, onDismiss) {
    if (window.unNative && window.unNative.presentSheet) {
      return window.unNative.presentSheet({ contentEl: contentEl, onDismiss: onDismiss });
    }
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:40';
    var backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:absolute;inset:0;background:rgb(0 0 0 / .4)';
    var card = document.createElement('div');
    card.style.cssText =
      'position:absolute;left:0;right:0;bottom:0;max-height:100%;overflow-y:auto;' +
      'background:rgb(var(--surface));border-radius:16px 16px 0 0;padding:8px 16px 24px';
    card.appendChild(contentEl);
    wrap.append(backdrop, card);
    document.body.appendChild(wrap);
    var dismissed = false;
    function close() {
      if (dismissed) return;
      dismissed = true;
      wrap.remove();
      if (onDismiss) onDismiss();
    }
    backdrop.addEventListener('click', close);
    return { dismiss: close, el: card };
  }

  function toast(message) {
    if (window.unNative && window.unNative.toast) {
      window.unNative.toast(message);
      return;
    }
    var el = document.createElement('div');
    el.textContent = message;
    el.style.cssText =
      'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:60;' +
      'background:rgb(var(--fg));color:rgb(var(--ground));padding:8px 16px;' +
      'border-radius:999px;font-size:14px;white-space:nowrap';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2200);
  }

  // Resolves true only when the person chose the destructive button.
  function confirmDialog(title, message) {
    if (window.unNative && window.unNative.alert) {
      return window.unNative.alert({
        title: title,
        message: message,
        buttons: [
          { label: 'Cancel', style: 'cancel' },
          { label: 'Delete', style: 'destructive' },
        ],
      }).then(function (result) {
        var button = result && result.button;
        if (button && typeof button === 'object') return button.label === 'Delete';
        var buttons = [{ label: 'Cancel' }, { label: 'Delete' }];
        return buttons[button] && buttons[button].label === 'Delete';
      });
    }
    return Promise.resolve(window.confirm(title + ' ' + message));
  }

  // ── Screens ──────────────────────────────────────────────────────────
  function render() {
    if (state.screen === 'loading') app.innerHTML = loadingHtml();
    else if (state.screen === 'error') app.innerHTML = errorHtml();
    else if (!state.child) app.innerHTML = setupHtml();
    else if (state.screen === 'quickstart') app.innerHTML = quickstartHtml();
    else app.innerHTML = mainHtml();
    bind();
  }

  function loadingHtml() {
    return '' +
'<main data-screen="loading" class="mx-auto w-full max-w-md px-4 pb-32 pt-4">' +
'  <div class="skeleton h-9 w-44"></div>' +
'  <div class="skeleton mt-3 h-5 w-56"></div>' +
'  <div class="skeleton mt-5 h-16 w-full rounded-xl"></div>' +
'  <div class="kind-grid mt-4">' +
'    <div class="skeleton col-span-2 h-32 rounded-2xl"></div>' +
'    <div class="skeleton h-32 rounded-2xl"></div>' +
'    <div class="skeleton h-32 rounded-2xl"></div>' +
'  </div>' +
'</main>';
  }

  function errorHtml() {
    var who = state.child && state.child.name ? esc(state.child.name) + "'s" : 'the';
    return '' +
'<main data-screen="error" class="mx-auto w-full max-w-md px-4 py-10">' +
'  <div class="state-error">' +
'    <p class="text-body font-medium">Couldn’t load ' + who + ' entries.</p>' +
'    <p class="text-body text-muted">Nothing you saved is lost. Check your connection and try again.</p>' +
'    <button type="button" id="retry" class="btn-secondary mt-2">Retry</button>' +
'  </div>' +
'</main>';
  }

  function setupHtml() {
    var now = nowDate();
    return '' +
'<main data-screen="setup" class="mx-auto w-full max-w-md px-4 py-10">' +
'  <h1 class="font-rounded text-title">Start tracking</h1>' +
'  <p class="mt-1 text-body text-muted">Tell Rilo whose words these are. The birth month lets every entry show how old the child was.</p>' +
'  <form id="setup-form" class="mt-6 flex flex-col gap-4" novalidate>' +
'    <div>' +
'      <label class="mb-1 block text-small font-medium" for="setup-name">Name</label>' +
'      <input id="setup-name" class="field" type="text" maxlength="40" autocomplete="off" placeholder="e.g. Leo">' +
'    </div>' +
'    <div class="grid grid-cols-2 gap-3">' +
'      <div>' +
'        <label class="mb-1 block text-small font-medium" for="setup-month">Birth month</label>' +
          monthSelectHtml('setup-month', pad(now.getMonth() + 1)) +
'      </div>' +
'      <div>' +
'        <label class="mb-1 block text-small font-medium" for="setup-year">Birth year</label>' +
          yearSelectHtml('setup-year', now.getFullYear()) +
'      </div>' +
'    </div>' +
'    <p id="setup-error" hidden class="text-small text-danger"></p>' +
'    <button type="submit" class="btn-primary">Start tracking</button>' +
'  </form>' +
'</main>';
  }

  // The quick start, straight after setup: tap what the child already does,
  // save them all dated today, or skip and add entries one at a time.
  function quickstartHtml() {
    var name = state.child.name;
    var n = Object.keys(state.quickPick).length;
    return '' +
'<main data-screen="quickstart" class="mx-auto w-full max-w-md px-4 pb-32 pt-4">' +
'  <h1 class="font-rounded text-title">What does ' + esc(name) + ' already do?</h1>' +
'  <p class="mt-1 text-body text-muted">Tap everything ' + esc(name) +
      ' already says or signs. Rilo saves them dated today, ' + esc(fmtLong(todayIso())) +
      '. You can edit or delete any of them later.</p>' +
    QUICK_STARTS.map(function (group) {
      return '<p class="section-label mt-6">' + esc(group.group) + '</p>' +
'<div class="flex flex-wrap gap-2">' +
        group.items.map(function (item, i) {
          var id = group.kind + '-' + i;
          var text = item.sounds_like && group.kind === 'sound'
            ? item.label + ' · ' + item.sounds_like
            : item.label;
          return '<button type="button" class="chip' +
            (state.quickPick[id] ? ' chip-on' : '') +
            '" data-quick="' + id + '" aria-pressed="' + !!state.quickPick[id] + '">' +
            esc(text) + '</button>';
        }).join('') +
'</div>';
    }).join('') +
'  <p data-form-error hidden class="mt-4 text-small text-danger"></p>' +
'</main>' +
'<div class="bar un-safe-bottom"><div class="mx-auto w-full max-w-md px-4 pb-4 pt-3">' +
'  <div class="flex gap-2">' +
'    <button type="button" id="quick-add" class="btn-primary flex-1"' + (n ? '' : ' disabled') + '>' +
      (n ? (n === 1 ? 'Add 1 entry' : 'Add ' + n + ' entries') : 'Add entries') + '</button>' +
'    <button type="button" id="quick-skip" class="btn-secondary">Skip</button>' +
'  </div>' +
'</div></div>';
  }

  // Editorial screens share the existing record forms and API.
  var ART = {
    sun: '<path d="M31 18c18-2 31 11 30 28S46 73 30 70 5 56 7 40 15 20 31 18Z"/><path d="M22 35v2m21-2v2m-10 2-2 6 4 1m-15 5c6 9 16 10 24 0"/><g stroke="rgb(var(--sun))" stroke-width="7"><path d="M17 45h1m28 1h1"/></g><path d="M34 10c-5-4 4-6 0-11M49 13c1-7 7-5 7-12M62 24c7 0 7-7 14-7M67 39c6-4 9 1 15-2M65 55c8-3 9 4 16 2M56 66c7 3 4 9 11 12M42 75c6 5 0 9 3 15M26 75c-5 6 2 8-2 15M13 69c-6 2-4 8-10 9M4 56c-7 4-9-2-14 1M0 40c-7-4-9 1-14-3M6 24c-8 0-6-8-13-8M20 13c-7-1-3-8-7-12"/>',
    bottle: '<path d="M29 17c-1-7 1-14 5-14 5 0 5 6 4 10l5 8M25 26c-8 13-13 33-12 47 1 8 7 10 22 10s22-3 22-10c1-20-3-36-12-48M17 39c12 5 26 5 36 0"/><path d="M24 25c7 3 15 3 23-1" stroke="rgb(var(--sun))" stroke-width="10"/>',
    duck: '<path d="M43 20c-13-2-23 7-23 19 0 5 2 10 1 13-9 1-21-13-25-5-3 13 9 31 30 33 21 2 38-10 38-24 0-9-12-10-12-20 0-8-4-14-9-16Z"/><path d="m54 38 19 2-15 9" fill="rgb(var(--sign))"/><path d="M42 34v1"/>',
    hand: '<path d="M29 79 12 60c-5-6-1-12 5-9l9 8-11-31c-3-8 4-11 7-4l8 20-6-32c-1-7 6-9 8-1l5 31 1-34c0-8 7-9 8 0l1 34 6-27c2-7 8-5 7 2l-4 34 7-12c5-7 11-2 7 5L57 70l-2 11"/><path d="M78 18c7 7 10 18 6 27M88 11c10 10 14 24 9 37" stroke="rgb(var(--sign))"/>',
    sprout: '<path d="M37 79V49c-1-22 7-35 21-42 8 17-1 35-21 42M37 57C17 58 6 45 6 28c20-3 34 7 31 29M22 81c10-5 20-3 30 0"/><path d="M9 67 0 70m64-47 9-7" stroke="rgb(var(--sun))"/>',
    star: '<path d="m35 5 10 26 28 3-21 19 6 28-24-14-24 14 5-29L-4 34l28-3Z" fill="rgb(var(--sun))"/>',
    apple: '<path d="M33 29C8 14-7 36 0 57c7 27 22 31 32 23 13 9 28 2 35-24 6-22-13-36-34-27Z" fill="rgb(var(--fruit))"/><path d="M33 29c-1-11-4-16-9-22m9 19c0-15 8-21 20-22-1 13-8 21-20 22"/>',
    car: '<path d="M1 63V48c0-8 5-12 13-12h6l10-19c4-7 24-7 31 0l11 19h8c10 0 15 5 15 15v12Z" fill="rgb(var(--sign-soft))"/><path d="M44 15v21m-23 0h52"/><circle cx="22" cy="64" r="10" fill="rgb(var(--surface))"/><circle cx="75" cy="64" r="10" fill="rgb(var(--surface))"/>',
    bubble: '<path d="M10 16C28 0 64 5 72 28c9 25-15 43-40 38L12 79l2-20C-1 48-4 30 10 16Z"/>',
    book: '<path d="M40 24C25 9 9 10 0 14v57c13-5 28-3 40 9 11-12 26-14 40-9V14c-14-5-27-1-40 10Zm0 0v55"/>',
    bars: '<path d="M12 75V48m27 27V12m28 63V32"/>',
    profile: '<circle cx="40" cy="25" r="16"/><path d="M12 76c0-32 56-32 56 0Z"/>',
  };
  function art(name, text) {
    var shape = ART[name] || ART.bubble;
    return '<svg class="illustration" viewBox="-18 -10 120 110" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + shape + (text ? '<text x="36" y="43" text-anchor="middle" fill="currentColor" stroke="none" font-size="22" font-family="sans-serif">' + esc(text) + '</text>' : '') + '</svg>';
  }
  function entryArt(e) {
    if (e.kind === 'sign') return art('hand');
    if (e.kind === 'sound') return art(e.category === 'transport' ? 'car' : 'duck');
    return art({ food: 'bottle', transport: 'car', play: 'book', actions: 'hand', outside: 'sprout', animals: 'duck' }[e.category] || 'bubble');
  }
  function latest(kind) { return state.entries.filter(function(e) { return e.kind === kind; }).sort(function(a,b) { return b.said_on.localeCompare(a.said_on) || b.id-a.id; })[0]; }
  function navigate(page, kind, filter) {
    state.page = page; state.tab = kind || null; state.filter = filter || ''; state.search = '';
    if (location.hash !== '#' + page) history.replaceState(null, '', location.pathname + location.search + '#' + page);
    render(); window.scrollTo({ top: 0 });
    var title = app.querySelector('h1'); if (title) title.focus({ preventScroll: true });
  }
  function navHtml() {
    return '<nav class="bottom-nav" aria-label="Main navigation">' +
      '<button data-page="words"' + (state.page === 'words' || state.page === 'log' ? ' aria-current="page"' : '') + '>' + art('book') + '<span>Words</span></button>' +
      '<button data-page="insights"' + (state.page === 'insights' ? ' aria-current="page"' : '') + '>' + art('bars') + '<span>Insights</span></button>' +
      '<button id="add-first" class="nav-add" aria-label="Add a word, sound or sign">' + ICON_PLUS + '</button>' +
      '<button data-page="profile"' + (state.page === 'profile' ? ' aria-current="page"' : '') + '>' + art('profile') + '<span>Profile</span></button></nav>';
  }
  function mainHtml() {
    var content = state.page === 'insights' ? insightsHtml() : state.page === 'profile' ? profileHtml() : state.page === 'log' ? logHtml() : homeHtml();
    return '<main data-screen="app" class="editorial-main" data-page="' + state.page + '">' + content + '</main>' + navHtml();
  }
  function headerHtml(title, subtitle, edit) {
    return '<header class="page-header"><div><h1 tabindex="-1">' + esc(title) + '</h1><p>' + esc(subtitle) + '</p></div>' + (edit ? '<button id="edit-child" class="edit-profile" aria-label="Edit child profile">' + ICON_PENCIL + '</button>' : '') + '</header>';
  }
  function homeHtml() {
    var last = latest('word');
    return headerHtml(state.child.name + '’s words', formatAge(ageMonths(state.child.birthday, todayIso()), state.child.name) + ' today', true) +
      '<section class="word-hero tone-butter" aria-label="Total spoken words"><div><strong class="hero-count">' + countKind('word') + '</strong><h2>total words</h2><p>' + (last ? 'latest: ' + esc(last.label) + ' · ' + esc(fmtShort(last.said_on)) : 'A little word, a big beginning') + '</p></div><div class="hero-sun">' + art('sun') + '</div></section>' + cardsHtml() +
      '<section class="recent-section"><div class="section-heading"><h2>Recent words</h2><button data-log="all">See all <span aria-hidden="true">›</span></button></div>' +
      (state.entries.length ? '<ul class="list recent-list">' + state.entries.slice().sort(function(a,b) { return b.said_on.localeCompare(a.said_on) || b.id-a.id; }).slice(0,5).map(rowHtml).join('') + '</ul>' : '<div class="state-empty"><p>Your word story starts here.</p><button class="btn-primary" data-add-kind="word">Add a word</button></div>') + '</section>';
  }
  function cardsHtml() {
    return '<div class="kind-grid">' + ['word','sound','sign'].map(function(kind) {
      var last = latest(kind);
      return '<button class="kind-card tone-' + kind + '" data-kind-card="' + kind + '">' + art({word:'bottle',sound:'duck',sign:'hand'}[kind]) + '<strong>' + countKind(kind) + '</strong><h2>' + KINDS[kind].many + '</h2><p>Latest: ' + (last ? esc(last.label) : 'Not yet') + '</p></button>';
    }).join('') + '</div>';
  }
  function selectedEntries() {
    return state.entries.filter(function(e) {
      return (!state.tab || e.kind === state.tab) &&
        (!state.search || (e.label + ' ' + (e.sounds_like || '') + ' ' + (e.language_name || '')).toLowerCase().includes(state.search.toLowerCase())) &&
        (state.filter !== 'mastered' || (e.kind === 'word' && e.mastered === true)) &&
        (state.filter !== 'month' || e.said_on.slice(0,7) === todayIso().slice(0,7)) &&
        (!state.filter.startsWith('language:') || (e.kind === 'word' && (e.language_name || 'Not assigned').toLowerCase() === state.filter.slice(9).toLowerCase()));
    }).sort(function(a,b) { return b.said_on.localeCompare(a.said_on) || b.id-a.id; });
  }
  function logHtml() {
    return headerHtml(state.tab ? KINDS[state.tab].many : 'Word collection', state.filter ? (state.filter === 'mastered' ? 'Mastered spoken words' : state.filter === 'month' ? 'Entries learned this month' : 'Spoken words · ' + state.filter.slice(9)) : 'Every little way to communicate', false) +
      '<button class="btn-secondary" data-page="words">‹ Back to words</button><label class="sr-only" for="word-search">Search entries</label><input id="word-search" class="field log-search" type="search" placeholder="Search words, sounds or signs" value="' + esc(state.search) + '">' +
      '<div class="log-filters" aria-label="Filter entries">' + ['all','word','sound','sign'].map(function(kind) { return '<button class="chip ' + ((state.tab || 'all') === kind ? 'chip-on' : '') + '" data-log="' + kind + '" aria-pressed="' + ((state.tab || 'all') === kind) + '">' + (kind === 'all' ? 'All' : KINDS[kind].many) + '</button>'; }).join('') + (state.filter ? '<button class="chip" data-clear-filter>Clear insight filter</button>' : '') + '</div><div id="firsts-area" aria-live="polite">' + listHtml() + '</div>';
  }
  function listHtml() {
    var rows = selectedEntries();
    if (!rows.length) return '<div class="state-empty"><p>No matching entries.</p><p class="text-muted">Try another filter or add something new.</p><button class="btn-primary" data-add-kind="' + (state.tab || 'word') + '">Add an entry</button></div>';
    var groups = new Map();
    rows.forEach(function(e) { var age = ageMonths(state.child.birthday,e.said_on); if (!groups.has(age)) groups.set(age,[]); groups.get(age).push(e); });
    return Array.from(groups.keys()).sort(function(a,b) { return b-a; }).map(function(age) { var group=groups.get(age); return '<section><div class="age-heading"><h2>' + esc(formatAge(age,state.child.name)) + '</h2><span>' + group.length + (group.length === 1 ? ' entry' : ' entries') + '</span></div><ul class="list">' + group.map(rowHtml).join('') + '</ul></section>'; }).join('');
  }
  function chartHtml(months) {
    var shown = months.slice(-12), max = Math.max(4, ...shown.map(function(m) { return m.count; })), top = Math.ceil(max/4)*4;
    var points = shown.map(function(m,i) { return { x: 40+i*410/(shown.length-1), y: 145-m.count*120/top, m:m }; });
    var line = points.map(function(p) { return p.x + ',' + p.y; }).join(' ');
    var marks = [0,1,2,3,4].map(function(i) { var y=145-i*30; return '<text x="27" y="' + (y+4) + '" text-anchor="end">' + (top*i/4) + '</text>'; }).join('');
    return '<svg class="growth-chart" viewBox="0 0 480 190" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">New spoken words learned each month</title><desc id="chart-desc">' + esc(shown.map(function(m) { return m.key + ': ' + m.count; }).join('; ')) + '</desc><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgb(var(--sign))" stop-opacity=".28"/><stop offset="100%" stop-color="rgb(var(--sign))" stop-opacity=".04"/></linearGradient></defs>' + marks + '<path class="chart-axis" d="M40 25V145H470"/><polygon points="40,145 ' + line + ' 450,145" fill="url(#chart-fill)"/><polyline points="' + line + '" fill="none" stroke="rgb(var(--accent))" stroke-width="2.7"/>' + points.map(function(p,i) { var label=MONTH_NAMES[Number(p.m.key.slice(5))-1].slice(0,3); return '<circle cx="' + p.x + '" cy="' + p.y + '" r="4.5" fill="rgb(var(--accent))"/><text class="chart-value" x="' + p.x + '" y="' + (p.y-10) + '" text-anchor="middle">' + p.m.count + '</text>' + (shown.length<=6 || i%2===0 || i===shown.length-1 ? '<text x="' + p.x + '" y="168" text-anchor="middle">' + label + '</text>' : ''); }).join('') + '</svg><details class="chart-table"><summary>Monthly word counts' + (months.length>12 ? ' · full history' : '') + '</summary><table><thead><tr><th>Month</th><th>New words</th></tr></thead><tbody>' + months.map(function(m) { return '<tr><td>' + m.key + '</td><td>' + m.count + '</td></tr>'; }).join('') + '</tbody></table></details>';
  }
  function statCard(n,label,icon,tone,filter,wide) {
    return '<button class="stat-card tone-' + tone + (wide ? ' stat-wide' : '') + '" data-insight-filter="' + esc(filter) + '">' + art(icon, icon === 'bubble' ? label === 'English' ? 'EN' : label === 'Spanish' ? 'ES' : label.slice(0,2).toUpperCase() : '') + '<div><strong>' + n + '</strong><h3>' + esc(label) + '</h3><p>' + (label === 'Signs' ? 'Signs logged' : label === 'Sounds' ? 'Sounds logged' : 'Words') + '</p></div></button>';
  }
  var SUGGESTIONS = [
    { title: 'Everyday words', sub: 'Foods, toys, favorite things', icon:'apple', tone:'word', kind:'word', detail: 'Name something your child is looking at during meals or play. Pause so they can respond, then repeat their attempt naturally. Try one familiar word in each language your family uses.' },
    { title: 'Sound imitation', sub: 'Animals, vehicles, environmental sounds', icon:'car', tone:'sound', kind:'sound', detail: 'Take turns making a favorite animal or vehicle sound. Try a playful moo, woof or vroom with a toy or picture. Leave a pause for your child to join in and follow their interests.' },
    { title: 'Simple gestures', sub: 'Signs for more, help, all done', icon:'hand', tone:'sign', kind:'sign', detail: 'Pair a familiar gesture with a spoken word in your everyday routine. Model more or all done at snack time without asking your child to perform. Respond to any way they choose to communicate.' },
  ];
  function suggestionsHtml() {
    return '<div class="suggestion-grid">' + SUGGESTIONS.map(function(s,i) { return '<button class="suggestion-card tone-' + s.tone + '" data-suggestion="' + i + '">' + art(s.icon) + '<h3>' + s.title + '</h3><p>' + s.sub + '</p></button>'; }).join('') + '</div>';
  }
  function insightsHtml() {
    var data = window.RiloInsights.summarize(state.entries,todayIso());
    var english=data.languages.find(function(l) {return /^(english|en|inglés|ingles)$/i.test(l.name);});
    var spanish=data.languages.find(function(l) {return /^(spanish|es|español|espanol)$/i.test(l.name);});
    var other=data.languages.filter(function(l) {return l!==english && l!==spanish;});
    var monthWords=data.thisMonth.filter(function(e) { return e.kind==='word'; }).length;
    var monthSigns=data.thisMonth.filter(function(e) { return e.kind==='sign'; }).length;
    var monthSounds=data.thisMonth.filter(function(e) { return e.kind==='sound'; }).length;
    return headerHtml('Word insights','A look at ' + state.child.name + '’s language growth',false) +
      '<section class="growth-card tone-butter"><div class="growth-heading"><div><h2>Growth over time</h2><p>New words learned each month</p></div>' + art('sprout') + '</div>' + chartHtml(data.months) + '</section>' +
      '<div class="insight-primary">' + statCard(english ? english.count : 0,'English','bubble','word','language:' + (english ? english.name : 'English')) + statCard(spanish ? spanish.count : 0,'Spanish','bubble','sound','language:' + (spanish ? spanish.name : 'Spanish')) + statCard(data.counts.sign,'Signs','hand','sign','sign') + '</div>' +
      (other.length ? '<div class="other-languages">' + other.map(function(l) {return statCard(l.count,l.name,'bubble','sound','language:' + l.name,true);}).join('') + '</div>' : '') +
      '<div class="insight-secondary">' + statCard(data.counts.sound,'Sounds','duck','sign','sound',true) + statCard(data.counts.mastered,'Mastered','star','butter','mastered',true) + '</div>' +
      '<section><div class="section-heading"><h2>What to try next</h2><button data-suggestion="all">See all <span aria-hidden="true">›</span></button></div>' + suggestionsHtml() + '</section>' +
      '<section class="month-section"><h2>This month</h2><div class="month-list tone-butter">' + [ [monthWords + ' new spoken ' + (monthWords===1?'word':'words'),'bars','word'],[monthSounds + ' new ' + (monthSounds===1?'sound':'sounds'),'duck','sound'],[monthSigns + ' new ' + (monthSigns===1?'sign':'signs'),'hand','sign'] ].map(function(row) { return '<button data-month-kind="' + row[2] + '">' + art(row[1]) + '<span>' + row[0] + '</span><span aria-hidden="true">›</span></button>'; }).join('') + '</div></section>';
  }
  function profileHtml() {
    return headerHtml('Profile', 'A little about ' + state.child.name, false) + '<section class="profile-card tone-butter">' + art('sun') + '<h2>' + esc(state.child.name) + '</h2><p>' + esc(formatAge(ageMonths(state.child.birthday,todayIso()),state.child.name)) + ' today</p><p>Born ' + esc(MONTH_NAMES[Number(state.child.birthday.slice(5,7))-1]) + ' ' + esc(state.child.birthday.slice(0,4)) + '</p><button id="edit-child" class="btn-primary">Edit child profile</button></section><section class="profile-about"><h2>Your language story</h2><p>' + state.entries.length + ' entries · ' + languagesUsed() + ' languages</p><p>Spoken words, sounds and signs are tracked separately. A mastered word is one you have marked as mastered.</p><button class="btn-secondary" data-page="insights">View word insights</button></section>';
  }
  function openSuggestion(value) {
    var choices = value === 'all' ? SUGGESTIONS : [SUGGESTIONS[Number(value)]];
    var content = document.createElement('div'); content.className='suggestion-sheet p-5';
    content.innerHTML = '<h2 class="font-rounded text-title">' + (value === 'all' ? 'What to try next' : choices[0].title) + '</h2><p class="text-muted mt-2">Small play ideas to follow your child’s interests.</p>' + choices.map(function(s) { return '<section class="mt-5"><h3 class="font-rounded text-heading">' + s.title + '</h3><p class="text-body mt-2">' + s.detail + '</p><button class="btn-secondary mt-3" data-play-add="' + s.kind + '">Log a ' + s.kind + '</button></section>'; }).join('') + '<button class="btn-primary mt-5 w-full" data-close-play>Done</button>';
    var sheet=presentSheet(content);
    content.querySelector('[data-close-play]').addEventListener('click',function() {sheet.dismiss();});
    content.querySelectorAll('[data-play-add]').forEach(function(b) {b.addEventListener('click',function() {sheet.dismiss();openEntrySheet(null,b.dataset.playAdd);});});
  }

  function rowHtml(e) {
    var k = KINDS[e.kind];
    // Whole literals so the Tailwind extractor sees the classes (a class
    // built by concatenation is invisible to it and gets tree-shaken).
    var blkClass = { word: 'blk-word', sound: 'blk-sound', sign: 'blk-sign' }[e.kind];
    var subParts = [];
    if (e.sounds_like) {
      subParts.push(e.kind === 'sign'
        ? esc(e.sounds_like)
        : '<span class="says">“' + esc(e.sounds_like) + '”</span>');
    }
    if (e.is_demo) subParts.push('Staging demo');
    var sub = subParts.length
      ? '<span class="mt-0.5 block truncate text-small text-muted">' + subParts.join(' · ') + '</span>'
      : '';
    var aria = k.one + ': ' + e.label +
      (e.sounds_like ? ', ' + (k.verb ? k.verb + ' ' : '') + e.sounds_like : '') +
      (e.mastered ? ', mastered' : '') +
      (e.language_name ? ', ' + e.language_name : '') + ', ' + fmtLong(e.said_on);
    return '' +
'<li class="list-row first-row p-0">' +
'  <button type="button" class="row-btn" data-entry="' + e.id + '" aria-label="' + esc(aria) + '">' +
'    <span class="blk ' + blkClass + '" aria-hidden="true">' + entryArt(e) + (e.mastered ? MAST_BADGE : '') + '</span>' +
'    <span class="min-w-0 flex-1">' +
'      <span class="entry-title block truncate">' + esc(e.label) + '</span>' +
      '<span class="type-pill tone-' + e.kind + '">' + k.one + '</span>' + sub +
'    </span>' +
'    <span class="flex-none text-right text-small text-muted">' +
'      <span class="block">' + esc(fmtShort(e.said_on)) + '</span>' +
    (e.language_name ? '<span class="block">' + esc(e.language_name) + '</span>' : '') +
'    </span><span class="row-chevron" aria-hidden="true">›</span>' +
'  </button>' +
'</li>';
  }

  // ── Events on the rendered screen ─────────────────────────────────────
  function bind() {
    app.querySelectorAll('button[data-page]').forEach(function(btn) { btn.addEventListener('click',function() {navigate(btn.dataset.page);}); });
    app.querySelectorAll('[data-log]').forEach(function(btn) { btn.addEventListener('click',function() {navigate('log',btn.dataset.log==='all' ? null : btn.dataset.log);}); });
    app.querySelectorAll('[data-insight-filter]').forEach(function(btn) { btn.addEventListener('click',function() {var f=btn.dataset.insightFilter; navigate('log', ['sign','sound'].includes(f) ? f : 'word', ['sign','sound'].includes(f) ? '' : f);}); });
    app.querySelectorAll('[data-month-kind]').forEach(function(btn) { btn.addEventListener('click',function() {navigate('log',btn.dataset.monthKind,'month');}); });
    app.querySelectorAll('[data-suggestion]').forEach(function(btn) {btn.addEventListener('click',function() {openSuggestion(btn.dataset.suggestion);});});
    var search=app.querySelector('#word-search');
    if(search) search.addEventListener('input',function() {state.search=search.value;app.querySelector('#firsts-area').innerHTML=listHtml();bindEntryRows();});
    var clear=app.querySelector('[data-clear-filter]');
    if(clear) clear.addEventListener('click',function() {state.filter='';render();});
    var retry = app.querySelector('#retry');
    if (retry) retry.addEventListener('click', loadState);

    var setupForm = app.querySelector('#setup-form');
    if (setupForm) setupForm.addEventListener('submit', onSetupSubmit);

    app.querySelectorAll('[data-kind-card]').forEach(function(btn) {
      btn.addEventListener('click',function() {navigate('log',btn.dataset.kindCard);});
    });

    var addFirst = app.querySelector('#add-first');
    if (addFirst) addFirst.addEventListener('click', function () { openEntrySheet(null); });
    app.querySelectorAll('[data-add-kind]').forEach(function (btn) {
      btn.onclick = function () { openEntrySheet(null, btn.getAttribute('data-add-kind')); };
    });

    var quickAdd = app.querySelector('#quick-add');
    if (quickAdd) quickAdd.addEventListener('click', onQuickAdd);
    var quickSkip = app.querySelector('#quick-skip');
    if (quickSkip) quickSkip.addEventListener('click', function () {
      state.screen = 'app';
      render();
    });
    app.querySelectorAll('[data-quick]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var id = chip.getAttribute('data-quick');
        if (state.quickPick[id]) delete state.quickPick[id];
        else state.quickPick[id] = true;
        render();
      });
    });

    var editChild = app.querySelector('#edit-child');
    if (editChild) editChild.addEventListener('click', openChildSheet);

    bindEntryRows();
  }
  function bindEntryRows() {
    app.querySelectorAll('[data-entry]').forEach(function(btn) {
      btn.onclick=function() {var entry=state.entries.find(function(e) {return e.id===Number(btn.dataset.entry);});if(entry) openEntrySheet(entry);};
    });
    app.querySelectorAll('#firsts-area [data-add-kind]').forEach(function(btn) {
      btn.onclick=function() {openEntrySheet(null,btn.dataset.addKind);};
    });
  }

  function showFormError(el, err) {
    el.textContent = err && err.code === 'account_required'
      ? 'Make an account to keep entries.'
      : (err && err.message) || 'Something went wrong. Try again.';
    el.hidden = false;
  }

  async function onSetupSubmit(event) {
    event.preventDefault();
    var nameEl = app.querySelector('#setup-name');
    var errEl = app.querySelector('#setup-error');
    errEl.hidden = true;
    var name = nameEl.value.trim();
    if (!name) {
      errEl.textContent = "Add the child's name.";
      errEl.hidden = false;
      return;
    }
    var birthMonth = app.querySelector('#setup-year').value + '-' +
      app.querySelector('#setup-month').value;
    var button = app.querySelector('#setup-form button[type="submit"]');
    button.disabled = true;
    try {
      var child = await api('/api/child', {
        method: 'PUT',
        body: JSON.stringify({ name: name, birth_month: birthMonth }),
      });
      state.child = child;
      state.quickPick = {};
      // Straight into the quick start, so a family arriving with a child
      // who already talks can load what they know in one go.
      state.screen = 'quickstart';
      render();
    } catch (err) {
      showFormError(errEl, err);
      button.disabled = false;
    }
  }

  async function onQuickAdd() {
    var errEl = app.querySelector('[data-form-error]');
    errEl.hidden = true;
    var items = [];
    QUICK_STARTS.forEach(function (group) {
      group.items.forEach(function (item, i) {
        if (state.quickPick[group.kind + '-' + i]) {
          items.push({
            kind: group.kind,
            label: item.label,
            sounds_like: item.sounds_like || '',
            category: inferCategory(item.label),
          });
        }
      });
    });
    var button = app.querySelector('#quick-add');
    button.disabled = true;
    try {
      var saved = await api('/api/quick-start', {
        method: 'POST',
        body: JSON.stringify({ items: items }),
      });
      state.entries = saved.entries || [];
      state.screen = 'app';
      render();
      toast('Added ' + items.length + (items.length === 1 ? ' entry' : ' entries'));
    } catch (err) {
      showFormError(errEl, err);
      button.disabled = false;
    }
  }

  async function loadState() {
    state.screen = 'loading';
    state.loadError = null;
    render();
    try {
      var data = await api('/api/state');
      state.child = data.child;
      state.languages = data.languages || [];
      state.entries = data.entries || [];
      state.screen = 'app';
    } catch (err) {
      state.screen = 'error';
      state.loadError = err;
    }
    render();
  }

  // A quiet refresh after a write: the screen stays as it is, the data
  // underneath is replaced.
  async function refreshState() {
    var data = await api('/api/state');
    state.child = data.child;
    state.languages = data.languages || [];
    state.entries = data.entries || [];
    render();
  }

  // ── The child sheet ──────────────────────────────────────────────────
  function openChildSheet() {
    var name = state.child.name;
    var mm = state.child.birthday.slice(5, 7);
    var yyyy = Number(state.child.birthday.slice(0, 4));
    var content = document.createElement('form');
    content.novalidate = true;
    content.className = 'pt-1';
    content.innerHTML = '' +
'<div class="relative mb-4 flex items-center justify-between">' +
'  <button type="button" class="min-h-11 px-1 font-medium text-fg" data-cancel>Cancel</button>' +
'  <h2 class="absolute left-1/2 -translate-x-1/2 font-rounded text-heading">Edit details</h2>' +
'</div>' +
'<label class="mb-1 block text-small font-medium" for="child-name">Name</label>' +
'<input id="child-name" class="field" type="text" maxlength="40" autocomplete="off" value="' + esc(name) + '">' +
'<label class="mb-1 mt-4 block text-small font-medium" for="child-month">Birth month</label>' +
    monthSelectHtml('child-month', mm) +
'<label class="mb-1 mt-4 block text-small font-medium" for="child-year">Birth year</label>' +
    yearSelectHtml('child-year', yyyy) +
'<p class="mt-1 text-small text-muted">Ages count from the birth month.</p>' +
'<p data-form-error hidden class="mt-2 text-small text-danger"></p>' +
'<button type="submit" class="btn-primary mt-4 w-full">Save changes</button>';
    var errEl = content.querySelector('[data-form-error]');
    var sheet = presentSheet(content, null);
    content.querySelector('[data-cancel]').addEventListener('click', function () { sheet.dismiss(); });
    content.addEventListener('submit', async function (event) {
      event.preventDefault();
      errEl.hidden = true;
      var nextName = content.querySelector('#child-name').value.trim();
      if (!nextName) {
        errEl.textContent = "Add the child's name.";
        errEl.hidden = false;
        return;
      }
      var birthMonth = content.querySelector('#child-year').value + '-' +
        content.querySelector('#child-month').value;
      var button = content.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        var child = await api('/api/child', {
          method: 'PUT',
          body: JSON.stringify({ name: nextName, birth_month: birthMonth }),
        });
        state.child = child;
        render();
        sheet.dismiss();
        toast('Details saved');
      } catch (err) {
        showFormError(errEl, err);
        button.disabled = false;
      }
    });
    content.querySelector('#child-name').focus({ preventScroll: true });
  }

  // ── The add / edit sheet ─────────────────────────────────────────────
  function openEntrySheet(entry, presetKind) {
    if (!state.child) return;
    var isEdit = !!entry;
    var form = {
      kind: isEdit
        ? entry.kind
        : (presetKind || state.tab || 'word'),
      languageId: isEdit ? (entry.language_id || null) : defaultLanguageId(
        presetKind || state.tab || 'word'),
      // A first word is usually said partially at first, so "still
      // learning" is the default; the toggle marks it mastered when the
      // whole word is there (the creator's ask).
      mastered: isEdit ? entry.mastered === true : false,
      newLang: false,
    };

    var content = document.createElement('form');
    content.novalidate = true;
    content.className = 'pt-1';
    content.innerHTML = entrySheetHtml(entry, form);
    var sheet = presentSheet(content, null);
    var errEl = content.querySelector('[data-form-error]');

    function labels() {
      var k = KINDS[form.kind];
      var name = state.child.name;
      content.querySelector('[data-kind-title]').textContent = isEdit ? 'Edit entry' : 'Add an entry';
      content.querySelector('[data-label-the]').textContent = k.the;
      content.querySelector('[data-label-input]').placeholder = k.eg;
      content.querySelector('[data-label-how]').innerHTML = esc(k.how(name)) +
        ' <span class="font-normal text-muted">optional</span>';
      content.querySelectorAll('[data-kind]').forEach(function (btn) {
        btn.classList.toggle('on', btn.getAttribute('data-kind') === form.kind);
        btn.setAttribute('aria-checked', String(btn.getAttribute('data-kind') === form.kind));
      });
    }

    function mastery() {
      content.querySelectorAll('[data-mastery]').forEach(function (btn) {
        var on = (btn.getAttribute('data-mastery') === 'yes') === form.mastered;
        btn.classList.toggle('on', on);
        btn.setAttribute('aria-checked', String(on));
      });
    }

    function chips() {
      var holder = content.querySelector('[data-lang-area]');
      if (form.newLang) {
        holder.innerHTML = '' +
'<div class="flex items-center gap-2">' +
'  <input data-new-lang-name class="field flex-1" type="text" maxlength="30" autocomplete="off" placeholder="e.g. Spanish">' +
'  <button type="button" class="btn-secondary" data-new-lang-add>Add</button>' +
'</div>';
        var input = holder.querySelector('[data-new-lang-name]');
        input.focus({ preventScroll: true });
        var submit = async function () {
          var value = input.value.trim();
          if (!value) { input.focus(); return; }
          try {
            var lang = await api('/api/languages', {
              method: 'POST',
              body: JSON.stringify({ name: value }),
            });
            if (!state.languages.some(function (l) { return l.id === lang.id; })) {
              state.languages.push(Object.assign({ uses: 0, is_demo: false }, lang));
              state.sessionLangs.push(lang.id);
            }
            form.languageId = lang.id;
            form.newLang = false;
            chips();
          } catch (err) {
            toast(err.code === 'account_required'
              ? 'Make an account to keep entries.'
              : (err.message || 'Could not add the language.'));
          }
        };
        holder.querySelector('[data-new-lang-add]').addEventListener('click', submit);
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); submit(); }
        });
        return;
      }
      holder.innerHTML = '<div class="flex flex-wrap gap-2">' + chipListHtml(form) + '</div>';
      holder.querySelectorAll('[data-lang]').forEach(function (chip) {
        chip.addEventListener('click', function () {
          var id = Number(chip.getAttribute('data-lang'));
          form.languageId = form.languageId === id ? null : id;
          chips();
        });
      });
      holder.querySelector('[data-new-lang]').addEventListener('click', function () {
        form.newLang = true;
        chips();
      });
    }

    function ageHint() {
      var hint = content.querySelector('[data-age-hint]');
      var value = content.querySelector('[data-date]').value;
      if (!value) { hint.hidden = true; return; }
      hint.textContent = state.child.name + ' was ' +
        formatAge(ageMonths(state.child.birthday, value), state.child.name);
      hint.hidden = false;
    }

    labels();
    chips();
    mastery();
    ageHint();

    content.querySelector('[data-cancel]').addEventListener('click', function () { sheet.dismiss(); });
    content.querySelectorAll('[data-kind]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        form.kind = btn.getAttribute('data-kind');
        if (!isEdit) form.languageId = defaultLanguageId(form.kind);
        labels();
        chips();
      });
    });
    content.querySelectorAll('[data-mastery]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        form.mastered = btn.getAttribute('data-mastery') === 'yes';
        mastery();
      });
    });
    content.querySelector('[data-date]').addEventListener('change', ageHint);

    content.addEventListener('submit', async function (event) {
      event.preventDefault();
      errEl.hidden = true;
      var payload = {
        kind: form.kind,
        label: content.querySelector('[data-label-input]').value,
        sounds_like: content.querySelector('[data-how-input]').value,
        language_id: form.languageId,
        said_on: content.querySelector('[data-date]').value,
        note: content.querySelector('[data-note]').value,
        mastered: form.mastered,
      };
      var k = KINDS[form.kind];
      if (!payload.label.trim()) {
        errEl.textContent = form.kind === 'sound'
          ? 'Name the animal or thing.'
          : form.kind === 'sign' ? 'Write the sign.' : 'Write the word.';
        errEl.hidden = false;
        return;
      }
      if (!payload.said_on) {
        errEl.textContent = 'Pick a date.';
        errEl.hidden = false;
        return;
      }
      // The category picks the illustration on the block; it follows the
      // word itself, so it is not a field the parent fills in.
      payload.category = inferCategory(payload.label);
      var button = content.querySelector('[data-save]');
      button.disabled = true;
      try {
        if (isEdit) {
          await api('/api/entries/' + entry.id, { method: 'PATCH', body: JSON.stringify(payload) });
        } else {
          await api('/api/entries', { method: 'POST', body: JSON.stringify(payload) });
        }
        sheet.dismiss();
        toast(isEdit ? 'Saved' : 'Added ' + payload.label.trim());
        refreshState().catch(function () {});
      } catch (err) {
        showFormError(errEl, err);
        button.disabled = false;
      }
    });

    if (isEdit) {
      content.querySelector('[data-delete]').addEventListener('click', async function () {
        var ok = await confirmDialog(
          'Delete “' + entry.label + '”?',
          'This removes it from ' + state.child.name + "'s entries.");
        if (!ok) return;
        try {
          await api('/api/entries/' + entry.id, { method: 'DELETE' });
          sheet.dismiss();
          toast('Deleted ' + entry.label);
          refreshState().catch(function () {});
        } catch (err) {
          showFormError(errEl, err);
        }
      });
    }

    if (!isEdit) content.querySelector('[data-label-input]').focus({ preventScroll: true });
  }

  function entrySheetHtml(entry, form) {
    var isEdit = !!entry;
    var today = todayIso();
    var kinds = ['word', 'sound', 'sign'];
    var dots = { word: 'bg-word', sound: 'bg-sound', sign: 'bg-sign' };
    return '' +
'<div class="relative mb-4 flex items-center justify-between">' +
'  <button type="button" class="min-h-11 px-1 font-medium text-fg" data-cancel>Cancel</button>' +
'  <h2 class="absolute left-1/2 -translate-x-1/2 font-rounded text-heading" data-kind-title></h2>' +
'</div>' +
'<div class="seg grid-cols-3" role="radiogroup" aria-label="Entry type">' +
  kinds.map(function (kind) {
    return '<button type="button" role="radio" aria-checked="false" data-kind="' + kind + '" class="' +
      (form.kind === kind ? 'on' : '') + '">' +
      '<span class="flex items-center gap-1.5"><i class="inline-block h-2 w-2 rounded-sm ' + dots[kind] + '" aria-hidden="true"></i>' +
      KINDS[kind].one + '</span></button>';
  }).join('') +
'</div>' +
'<label class="mb-1 mt-4 block text-small font-medium" data-label-the></label>' +
'<input data-label-input class="field" type="text" maxlength="60" autocomplete="off" value="' + (isEdit ? esc(entry.label) : '') + '">' +
'<label class="mb-1 mt-4 block text-small font-medium" data-label-how></label>' +
'<input data-how-input class="field says" type="text" maxlength="80" autocomplete="off" value="' + (isEdit ? esc(entry.sounds_like || '') : '') + '">' +
'<label class="mb-1 mt-4 block text-small font-medium">Mastery</label>' +
'<div class="seg grid-cols-2" role="radiogroup" aria-label="Mastery">' +
'<button type="button" role="radio" aria-checked="false" data-mastery="no">Still learning</button>' +
'<button type="button" role="radio" aria-checked="false" data-mastery="yes">Mastered</button>' +
'</div>' +
'<p class="mt-1 text-small text-muted">Mastered means ' + esc(state.child.name) + ' says the whole ' +
  (form.kind === 'sign' ? 'sign' : 'word') + ', not part of it.</p>' +
'<label class="mb-1 mt-4 block text-small font-medium">Language <span class="font-normal text-muted">optional</span></label>' +
'<div data-lang-area></div>' +
'<label class="mb-1 mt-4 block text-small font-medium" for="entry-date">Date</label>' +
'<input id="entry-date" data-date class="field" type="date" value="' + (isEdit ? esc(entry.said_on) : today) +
  '" min="' + esc(state.child.birthday) + '" max="' + today + '">' +
'<p data-age-hint class="mt-1 text-small text-muted"></p>' +
'<label class="mb-1 mt-4 block text-small font-medium" for="entry-note">Note <span class="font-normal text-muted">optional</span></label>' +
'<textarea id="entry-note" data-note class="field min-h-20" maxlength="280" placeholder="e.g. asked for it at bath time">' +
  (isEdit ? esc(entry.note || '') : '') + '</textarea>' +
'<p data-form-error hidden class="mt-2 text-small text-danger"></p>' +
'<button type="submit" class="btn-primary mt-4 w-full" data-save>' + (isEdit ? 'Save changes' : 'Add entry') + '</button>' +
    (isEdit
      ? '<button type="button" class="btn-secondary mt-2 w-full text-danger" data-delete>Delete entry</button>'
      : '');
  }

  // Language chips: the ones in use, most used first, then any created this
  // session, then the entry's own language so an edit never loses it.
  function chipListHtml(form) {
    var ids = {};
    var list = [];
    state.languages
      .filter(function (l) { return l.uses > 0; })
      .sort(function (a, b) { return b.uses - a.uses || a.name.localeCompare(b.name); })
      .forEach(function (l) { if (!ids[l.id]) { ids[l.id] = true; list.push(l); } });
    state.languages.forEach(function (l) {
      if (l.uses === 0 && state.sessionLangs.indexOf(l.id) !== -1 && !ids[l.id]) {
        ids[l.id] = true; list.push(l);
      }
    });
    if (form.languageId && !ids[form.languageId]) {
      var own = state.languages.find(function (l) { return l.id === form.languageId; });
      if (own) list.push(own);
    }
    return list.map(function (l) {
      return '<button type="button" class="chip ' + (form.languageId === l.id ? 'chip-on' : '') +
        '" data-lang="' + l.id + '">' + esc(l.name) + '</button>';
    }).join('') +
      '<button type="button" class="chip border-dashed text-muted" data-new-lang>' +
      '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>' +
      'New language</button>';
  }

  loadState();
})();
