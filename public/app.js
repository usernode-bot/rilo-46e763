/* Rilo's client. Renders the whole screen into #app — setup, loading,
 * error, and the firsts list — and opens the add/edit sheet, the child
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

  // ── Words for things ─────────────────────────────────────────────────
  var KINDS = {
    word: {
      one: 'Word', many: 'Words', the: 'The word',
      how: function (name) { return 'How ' + name + ' says it'; },
      verb: 'says', empty: 'No words yet.', add: 'Add a word',
    },
    sound: {
      one: 'Animal sound', many: 'Sounds', the: 'The animal',
      how: function (name) { return 'The sound ' + name + ' makes'; },
      verb: 'makes', empty: 'No sounds yet.', add: 'Add a sound',
    },
    sign: {
      one: 'Sign', many: 'Signs', the: 'The sign',
      how: function (name) { return 'How ' + name + ' signs it'; },
      verb: null, empty: 'No signs yet.', add: 'Add a sign',
    },
  };

  // ── State ────────────────────────────────────────────────────────────
  var state = {
    screen: 'loading', // loading | error | app
    loadError: null,
    child: null,
    languages: [],
    entries: [],
    tab: 'all',
    sessionLangs: [], // languages created this session, still unused
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
    else app.innerHTML = mainHtml();
    bind();
  }

  function loadingHtml() {
    return '' +
'<main data-screen="loading" class="mx-auto w-full max-w-md px-4 pb-32 pt-4">' +
'  <div class="skeleton h-9 w-44"></div>' +
'  <div class="skeleton mt-3 h-5 w-56"></div>' +
'  <div class="skeleton mt-5 h-16 w-full rounded-xl"></div>' +
'  <div class="skeleton mt-6 h-5 w-36"></div>' +
'  <div class="mt-2 flex flex-col gap-2">' +
'    <div class="skeleton h-16 w-full rounded-xl"></div>' +
'    <div class="skeleton h-16 w-full rounded-xl"></div>' +
'    <div class="skeleton h-16 w-full rounded-xl"></div>' +
'  </div>' +
'</main>';
  }

  function errorHtml() {
    var who = state.child && state.child.name ? esc(state.child.name) + "'s" : 'the';
    return '' +
'<main data-screen="error" class="mx-auto w-full max-w-md px-4 py-10">' +
'  <div class="state-error">' +
'    <p class="text-body font-medium">Couldn’t load ' + who + ' firsts.</p>' +
'    <p class="text-body text-muted">Nothing you saved is lost. Check your connection and try again.</p>' +
'    <button type="button" id="retry" class="btn-secondary mt-2">Retry</button>' +
'  </div>' +
'</main>';
  }

  function setupHtml() {
    return '' +
'<main data-screen="setup" class="mx-auto w-full max-w-md px-4 py-10">' +
'  <h1 class="font-rounded text-title">Start tracking</h1>' +
'  <p class="mt-1 text-body text-muted">Tell Rilo whose firsts these are. The birthday is what lets every first show how old the child was.</p>' +
'  <form id="setup-form" class="mt-6 flex flex-col gap-4" novalidate>' +
'    <div>' +
'      <label class="mb-1 block text-small font-medium" for="setup-name">Name</label>' +
'      <input id="setup-name" class="field" type="text" maxlength="40" autocomplete="off" placeholder="e.g. Leo">' +
'    </div>' +
'    <div>' +
'      <label class="mb-1 block text-small font-medium" for="setup-birthday">Birthday</label>' +
'      <input id="setup-birthday" class="field" type="date" max="' + todayIso() + '">' +
'    </div>' +
'    <p id="setup-error" hidden class="text-small text-danger"></p>' +
'    <button type="submit" class="btn-primary">Start tracking</button>' +
'  </form>' +
'</main>';
  }

  function mainHtml() {
    var name = state.child.name;
    var monthsToday = ageMonths(state.child.birthday, todayIso());
    var n = state.entries.length;
    var countLine = '';
    if (n) {
      var langs = languagesUsed();
      countLine = n + (n === 1 ? ' first' : ' firsts') + ' in ' + langs +
        (langs === 1 ? ' language' : ' languages');
    }
    return '' +
'<main data-screen="app" class="mx-auto w-full max-w-md px-4 pb-32 pt-4">' +
'  <header>' +
'    <div class="flex items-start justify-between gap-3">' +
'      <div class="min-w-0">' +
'        <h1 class="font-rounded text-title">' + esc(name) + "'s firsts</h1>" +
'        <p class="mt-0.5 text-body text-muted">' + esc(formatAge(monthsToday, name)) + ' today</p>' +
'      </div>' +
'      <button type="button" id="edit-child" class="btn-secondary" aria-label="Edit ' + esc(name) + "'s name and birthday\">" + ICON_PENCIL +
'      </button>' +
'    </div>' +
    (countLine
      ? '<p class="mt-2 flex flex-wrap items-center gap-2 text-small text-muted">' +
        (state.child.is_demo ? '<span class="tag">Staging demo</span>' : '') +
        '<span>' + countLine + '</span></p>'
      : '') +
'  </header>' +
'  ' + segHtml() +
'  <div id="firsts-area">' + listHtml() + '</div>' +
'</main>' +
'<div class="bar un-safe-bottom"><div class="mx-auto w-full max-w-md px-4 pb-4 pt-3">' +
'  <button type="button" id="add-first" class="btn-primary w-full">' + ICON_PLUS + 'Add a first</button>' +
'</div></div>';
  }

  function segHtml() {
    var tabs = [
      { key: 'all', label: 'All', count: state.entries.length, dot: '' },
      { key: 'word', label: 'Words', count: countKind('word'), dot: 'bg-word' },
      { key: 'sound', label: 'Sounds', count: countKind('sound'), dot: 'bg-sound' },
      { key: 'sign', label: 'Signs', count: countKind('sign'), dot: 'bg-sign' },
    ];
    return '<div class="seg mt-4" role="tablist" aria-label="Show">' + tabs.map(function (t) {
      return '<button type="button" role="tab" aria-selected="' + (state.tab === t.key) +
        '" data-tab="' + t.key + '" class="' + (state.tab === t.key ? 'on' : '') + '">' +
        '<b class="flex items-center gap-1.5">' +
        (t.dot ? '<i class="inline-block h-2 w-2 rounded-sm ' + t.dot + '" aria-hidden="true"></i>' : '') +
        t.label + '</b><span>' + t.count + '</span></button>';
    }).join('') + '</div>';
  }

  function listHtml() {
    var rows = state.tab === 'all'
      ? state.entries
      : state.entries.filter(function (e) { return e.kind === state.tab; });
    if (!rows.length) return emptyHtml(rows === state.entries);
    var map = new Map();
    rows.forEach(function (e) {
      var age = ageMonths(state.child.birthday, e.said_on);
      if (!map.has(age)) map.set(age, []);
      map.get(age).push(e);
    });
    return Array.from(map.keys()).sort(function (a, b) { return b - a; }).map(function (age) {
      var g = map.get(age);
      return '' +
'<section>' +
'  <div class="flex items-baseline justify-between px-1 pb-2 pt-6">' +
'    <h2 class="font-rounded text-heading">' + esc(formatAge(age, state.child.name)) + '</h2>' +
'    <span class="text-small text-muted">' + (g.length === 1 ? '1 first' : g.length + ' firsts') + '</span>' +
'  </div>' +
'  <ul class="list">' + g.map(rowHtml).join('') + '</ul>' +
'</section>';
    }).join('');
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
      (e.language_name ? ', ' + e.language_name : '') + ', ' + fmtLong(e.said_on);
    return '' +
'<li class="list-row first-row p-0">' +
'  <button type="button" class="row-btn" data-entry="' + e.id + '" aria-label="' + esc(aria) + '">' +
'    <span class="blk font-rounded ' + blkClass + '" aria-hidden="true">' + esc(e.label.charAt(0).toUpperCase()) + '</span>' +
'    <span class="min-w-0 flex-1">' +
'      <span class="block truncate text-body font-semibold">' + esc(e.label) + '</span>' +
      sub +
'    </span>' +
'    <span class="flex-none text-right text-small text-muted">' +
'      <span class="block">' + esc(fmtShort(e.said_on)) + '</span>' +
    (e.language_name ? '<span class="block">' + esc(e.language_name) + '</span>' : '') +
'    </span>' +
'  </button>' +
'</li>';
  }

  function emptyHtml(noFirstsAtAll) {
    if (noFirstsAtAll) {
      return '' +
'<div class="state-empty mt-6">' +
'  <p class="text-body font-medium">No firsts yet.</p>' +
'  <p class="text-body text-muted">Add the first word, animal sound or sign ' + esc(state.child.name) + ' makes.</p>' +
'  <button type="button" class="btn-primary mt-2" data-add>' + ICON_PLUS + 'Add a first</button>' +
'</div>';
    }
    var k = KINDS[state.tab];
    return '' +
'<div class="state-empty mt-6">' +
'  <p class="text-body font-medium">' + esc(k.empty) + '</p>' +
'  <button type="button" class="btn-primary mt-2" data-add-kind="' + state.tab + '">' + ICON_PLUS + esc(k.add) + '</button>' +
'</div>';
  }

  // ── Events on the rendered screen ─────────────────────────────────────
  function bind() {
    var retry = app.querySelector('#retry');
    if (retry) retry.addEventListener('click', loadState);

    var setupForm = app.querySelector('#setup-form');
    if (setupForm) setupForm.addEventListener('submit', onSetupSubmit);

    app.querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.tab = btn.getAttribute('data-tab');
        render();
      });
    });

    var addFirst = app.querySelector('#add-first');
    if (addFirst) addFirst.addEventListener('click', function () { openEntrySheet(null); });
    app.querySelectorAll('[data-add]').forEach(function (btn) {
      btn.addEventListener('click', function () { openEntrySheet(null); });
    });
    app.querySelectorAll('[data-add-kind]').forEach(function (btn) {
      btn.addEventListener('click', function () { openEntrySheet(null, btn.getAttribute('data-add-kind')); });
    });

    var editChild = app.querySelector('#edit-child');
    if (editChild) editChild.addEventListener('click', openChildSheet);

    app.querySelectorAll('[data-entry]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = Number(btn.getAttribute('data-entry'));
        var entry = state.entries.find(function (e) { return e.id === id; });
        if (entry) openEntrySheet(entry);
      });
    });
  }

  function showFormError(el, err) {
    el.textContent = err && err.code === 'account_required'
      ? 'Make an account to keep firsts.'
      : (err && err.message) || 'Something went wrong. Try again.';
    el.hidden = false;
  }

  async function onSetupSubmit(event) {
    event.preventDefault();
    var nameEl = app.querySelector('#setup-name');
    var birthdayEl = app.querySelector('#setup-birthday');
    var errEl = app.querySelector('#setup-error');
    errEl.hidden = true;
    var name = nameEl.value.trim();
    var birthday = birthdayEl.value;
    if (!name || !birthday) {
      errEl.textContent = name ? 'Pick a birthday.' : "Add the child's name.";
      errEl.hidden = false;
      return;
    }
    var button = app.querySelector('#setup-form button[type="submit"]');
    button.disabled = true;
    try {
      var child = await api('/api/child', {
        method: 'PUT',
        body: JSON.stringify({ name: name, birthday: birthday }),
      });
      state.child = child;
      state.screen = 'app';
      render();
      toast('Details saved');
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
'<label class="mb-1 mt-4 block text-small font-medium" for="child-birthday">Birthday</label>' +
'<input id="child-birthday" class="field" type="date" value="' + esc(state.child.birthday) + '" max="' + todayIso() + '">' +
'<p class="mt-1 text-small text-muted">Ages count from the birthday.</p>' +
'<p data-form-error hidden class="mt-2 text-small text-danger"></p>' +
'<button type="submit" class="btn-primary mt-4 w-full">Save changes</button>';
    var errEl = content.querySelector('[data-form-error]');
    var sheet = presentSheet(content, null);
    content.querySelector('[data-cancel]').addEventListener('click', function () { sheet.dismiss(); });
    content.addEventListener('submit', async function (event) {
      event.preventDefault();
      errEl.hidden = true;
      var nextName = content.querySelector('#child-name').value.trim();
      var birthday = content.querySelector('#child-birthday').value;
      if (!nextName || !birthday) {
        errEl.textContent = nextName ? 'Pick a birthday.' : "Add the child's name.";
        errEl.hidden = false;
        return;
      }
      var button = content.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        var child = await api('/api/child', {
          method: 'PUT',
          body: JSON.stringify({ name: nextName, birthday: birthday }),
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
        : (presetKind || (state.tab !== 'all' ? state.tab : 'word')),
      languageId: isEdit ? (entry.language_id || null) : defaultLanguageId(
        presetKind || (state.tab !== 'all' ? state.tab : 'word')),
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
      content.querySelector('[data-kind-title]').textContent = isEdit ? 'Edit first' : 'Add a first';
      content.querySelector('[data-label-the]').textContent = k.the;
      content.querySelector('[data-label-how]').innerHTML = esc(k.how(name)) +
        ' <span class="font-normal text-muted">optional</span>';
      content.querySelectorAll('[data-kind]').forEach(function (btn) {
        btn.classList.toggle('on', btn.getAttribute('data-kind') === form.kind);
        btn.setAttribute('aria-checked', String(btn.getAttribute('data-kind') === form.kind));
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
              ? 'Make an account to keep firsts.'
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
      };
      var k = KINDS[form.kind];
      if (!payload.label.trim()) {
        errEl.textContent = 'Write the ' + (form.kind === 'word' ? 'word' : form.kind === 'sound' ? 'animal' : 'sign') + '.';
        errEl.hidden = false;
        return;
      }
      if (!payload.said_on) {
        errEl.textContent = 'Pick a date.';
        errEl.hidden = false;
        return;
      }
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
          'This removes it from ' + state.child.name + "'s firsts.");
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
'<div class="seg grid-cols-3" role="radiogroup" aria-label="Kind of first">' +
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
'<button type="submit" class="btn-primary mt-4 w-full" data-save>' + (isEdit ? 'Save changes' : 'Add first') + '</button>' +
    (isEdit
      ? '<button type="button" class="btn-secondary mt-2 w-full text-danger" data-delete>Delete first</button>'
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
