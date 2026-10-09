/* Rilo's client. Renders the whole screen into #app (welcome, quick start,
 * Home, Log, entry detail, Insights, profile, loading and error) and opens
 * the add/edit sheet, the child sheet, the delete confirm and the toasts
 * through the platform's native UI kit (unNative), with a plain fallback.
 *
 * The look is the creator's Rilo canvas: calm and airy, with the "Offset"
 * icon style (a fine ink line over a pastel shape printed 2px off-register)
 * and a cow mascot. Every icon is drawn by icon() from ICONS below. */
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

  // ── Offset icons ──────────────────────────────────────────────────────
  // Each icon is drawn on a 48-unit grid: `f` is the pastel shape (printed
  // 2 units down-right), `i` the ink line, `d` solid ink dots for eyes and
  // tiny details, and `t` the pastel the shape is printed in by default.
  var ICONS = {
    home: { t: 'sage', f: '<path d="M10 21 L24 9 L38 21 V40 H10Z"/>', i: '<path d="M7 22 L24 8 L41 22"/><path d="M11 19 V40 H37 V19"/><path d="M20 40 V31 a4 4 0 0 1 8 0 V40"/>' },
    log: { t: 'sage', f: '<rect x="10" y="7" width="27" height="34" rx="6"/>', i: '<path d="M30 6 H16 a6 6 0 0 0 -6 6 V35 a6 6 0 0 0 6 6 H31 a6 6 0 0 0 6 -6 V14"/><path d="M17 16 H30 M17 23 H30 M17 30 H24"/>' },
    plus: { i: '<path d="M24 12 V36 M12 24 H36"/>' },
    insights: { t: 'sage', f: '<rect x="19" y="11" width="10" height="28" rx="3"/>', i: '<path d="M8 40 H40"/><path d="M14 40 V28 M24 40 V11 M34 40 V21"/>' },
    child: { t: 'blush', f: '<circle cx="24" cy="17" r="8"/><path d="M10 40 c2 -8 8 -12 14 -12 s12 4 14 12Z"/>', i: '<circle cx="24" cy="16" r="8"/><path d="M9 40 c2 -8 8 -12 15 -12 s13 4 15 12"/>' },
    search: { t: 'sky', f: '<circle cx="21" cy="21" r="12"/>', i: '<path d="M30 14 A12 12 0 1 0 33 21"/><path d="M30 30 L39 39"/>' },
    sliders: { t: 'blush', f: '<circle cx="30" cy="15" r="5"/><circle cx="18" cy="33" r="5"/>', i: '<path d="M8 15 H25 M35 15 H40 M8 33 H13 M23 33 H40"/><circle cx="30" cy="15" r="4.5"/><circle cx="18" cy="33" r="4.5"/>' },
    edit: { t: 'butter', f: '<path d="M12 36 L30 18 L34 22 L16 40Z"/>', i: '<path d="M10 38 L12 30 L30 12 a3 3 0 0 1 4 0 L36 14 a3 3 0 0 1 0 4 L18 36 Z"/><path d="M26 16 L32 22"/>' },
    trash: { t: 'blush', f: '<rect x="13" y="15" width="22" height="24" rx="4"/>', i: '<path d="M8 13 H40"/><path d="M19 13 V9 H29 V13"/><path d="M12 13 L14 38 a3 3 0 0 0 3 3 H31 a3 3 0 0 0 3 -3 L36 13"/><path d="M21 20 V33 M27 20 V33"/>' },
    back: { t: 'sky', f: '<circle cx="24" cy="24" r="12"/>', i: '<path d="M28 10 L14 24 L28 38"/>' },
    close: { t: 'blush', f: '<circle cx="24" cy="24" r="13"/>', i: '<path d="M15 15 L33 33 M33 15 L15 33"/>' },
    arrow: { i: '<path d="M10 24 H36 M26 13 L37 24 L26 35"/>' },
    calendar: { t: 'butter', f: '<rect x="10" y="12" width="28" height="28" rx="5"/>', i: '<rect x="10" y="12" width="28" height="28" rx="5"/><path d="M10 20 H38 M17 8 V15 M31 8 V15"/>', d: '<circle cx="18" cy="29" r="2.2"/>' },
    check: { t: 'sage', f: '<circle cx="24" cy="24" r="14"/>', i: '<path d="M13 25 L20 32 L35 15"/>' },
    sparkle: { t: 'butter', f: '<path d="M24 7 C25 16 29 20 38 22 C29 24 25 28 24 39 C23 28 19 24 10 22 C19 20 23 16 24 7Z"/>', i: '<path d="M24 7 C25 16 29 20 38 22 C29 24 25 28 24 39 C23 28 19 24 10 22 C19 20 23 16 24 7Z"/><path d="M39 6 V12 M36 9 H42"/>' },
    heart: { t: 'blush', f: '<path d="M24 39 C11 31 7 23 10 16 C13 10 21 10 24 17 C27 10 35 10 38 16 C41 23 37 31 24 39Z"/>', i: '<path d="M24 39 C11 31 7 23 10 16 C13 10 21 10 24 17 C27 10 35 10 38 16 C41 23 37 31 24 39Z"/>' },
    word: { t: 'sky', f: '<path d="M12 10 H36 a6 6 0 0 1 6 6 V27 a6 6 0 0 1 -6 6 H23 L15 40 V33 H12 a6 6 0 0 1 -6 -6 V16 a6 6 0 0 1 6 -6Z"/>', i: '<path d="M12 10 H36 a6 6 0 0 1 6 6 V27 a6 6 0 0 1 -6 6 H23 L15 40 V33 H12 a6 6 0 0 1 -6 -6 V16 a6 6 0 0 1 6 -6Z"/><path d="M15 19 H31 M15 25 H24"/>' },
    sound: { t: 'blush', f: '<circle cx="24" cy="24" r="13"/>', i: '<path d="M8 23 V25 M15 18 V30 M21 11 V37 M27 16 V32 M33 20 V28 M40 23 V25"/>' },
    sign: { t: 'butter', f: '<ellipse cx="26" cy="31" rx="11" ry="10"/>', i: '<path d="M16 29 V16 a2.5 2.5 0 0 1 5 0 V25 M21 24 V11 a2.5 2.5 0 0 1 5 0 V24 M26 24 V13 a2.5 2.5 0 0 1 5 0 V26 M31 26 V18 a2.5 2.5 0 0 1 5 0 V30 C36 37 31 42 24 42 H23 C19 42 16 40 14 37 L9 30 a2.5 2.5 0 0 1 4 -3 L16 31"/>' },
    wave: { t: 'butter', f: '<ellipse cx="26" cy="31" rx="11" ry="10"/>', i: '<path d="M16 29 V16 a2.5 2.5 0 0 1 5 0 V25 M21 24 V11 a2.5 2.5 0 0 1 5 0 V24 M26 24 V13 a2.5 2.5 0 0 1 5 0 V26 M31 26 V18 a2.5 2.5 0 0 1 5 0 V30 C36 37 31 42 24 42 H23 C19 42 16 40 14 37 L9 30 a2.5 2.5 0 0 1 4 -3 L16 31"/><path d="M8 12 C6 15 6 18 7 21 M40 8 C42 11 42 14 41 17"/>' },
    seed: { t: 'butter', f: '<ellipse cx="24" cy="29" rx="9" ry="11"/>', i: '<path d="M24 18 C31 18 34 26 33 32 C32 37 28 40 24 40 S16 37 15 32 C14 26 17 18 24 18Z"/><path d="M23 23 C21 27 21 31 23 35"/><path d="M24 18 C24 14 26 11 29 9"/>' },
    sprout: { t: 'sage', f: '<path d="M24 28 C14 28 10 22 10 16 C18 16 24 20 24 28Z"/><path d="M24 24 C24 16 29 11 38 11 C38 19 33 24 24 24Z"/>', i: '<path d="M24 28 C14 28 10 22 10 16 C18 16 24 20 24 28Z"/><path d="M24 24 C24 16 29 11 38 11 C38 19 33 24 24 24Z"/><path d="M24 41 V22"/><path d="M14 41 H34"/>' },
    flower: { t: 'blush', f: '<circle cx="24" cy="17" r="11"/>', i: '<path d="M24 6 c4 0 6 3 5 6 c3 -2 7 0 7 4 c0 3 -3 5 -5 5 c2 2 1 6 -2 7 c-3 1 -5 -1 -5 -3 c0 2 -2 4 -5 3 c-3 -1 -4 -5 -2 -7 c-2 0 -5 -2 -5 -5 c0 -4 4 -6 7 -4 c-1 -3 1 -6 5 -6Z"/><path d="M24 28 V42"/><path d="M24 36 C27 32 31 31 34 32"/>', d: '<circle cx="24" cy="17" r="2.7"/>' },
    cup: { t: 'sky', f: '<path d="M14 16 H36 L33 40 H17Z"/>', i: '<path d="M11 14 H37 L34 40 a3 3 0 0 1 -3 3 H17 a3 3 0 0 1 -3 -3 Z"/><path d="M14 25 C18 27 21 23 24 25 S30 27 34 25"/><path d="M27 14 L31 5 L36 6"/>' },
    bottle: { t: 'butter', f: '<rect x="14" y="17" width="20" height="25" rx="4"/>', i: '<path d="M19 6 H29 V11 L33 17 V37 a4 4 0 0 1 -4 4 H19 a4 4 0 0 1 -4 -4 V17 L19 11Z"/><path d="M15 23 H33"/><path d="M19 30 H23 M19 35 H23"/>' },
    spoon: { t: 'sage', f: '<ellipse cx="24" cy="13" rx="7" ry="9"/>', i: '<path d="M24 22 C20 22 17 18 17 13 S20 4 24 4 S31 8 31 13 S28 22 24 22Z"/><path d="M24 22 V42"/>' },
    banana: { t: 'butter', f: '<path d="M9 30 C17 40 33 38 39 22 C40 19 39 16 38 14 L36 15 C36 27 26 33 16 30 C13 29 10 29 9 30Z"/>', i: '<path d="M9 30 C17 40 33 38 39 22 C40 19 39 16 38 14 L36 15 C36 27 26 33 16 30 C13 29 10 29 9 30Z"/><path d="M38 14 L40 9"/>' },
    apple: { t: 'blush', f: '<path d="M24 15 C20 12 10 12 10 24 C10 34 16 41 20 41 C22 41 23 40 24 40 S26 41 28 41 C32 41 38 34 38 24 C38 12 28 12 24 15Z"/>', i: '<path d="M24 15 C20 12 10 12 10 24 C10 34 16 41 20 41 C22 41 23 40 24 40 S26 41 28 41 C32 41 38 34 38 24 C38 12 28 12 24 15Z"/><path d="M24 15 C24 11 25 9 27 7"/><path d="M26 10 C29 7 33 7 34 9 C32 12 28 12 26 10Z"/>' },
    ball: { t: 'blush', f: '<circle cx="24" cy="24" r="15"/>', i: '<circle cx="24" cy="24" r="15"/><path d="M9.5 21 C16 26 32 26 38.5 21"/><path d="M22 9 C16 16 16 32 22 39"/>' },
    book: { t: 'butter', f: '<path d="M24 14 C19 10 12 9 6 10 V36 C12 35 19 36 24 40 C29 36 36 35 42 36 V10 C36 9 29 10 24 14Z"/>', i: '<path d="M24 14 C19 10 12 9 6 10 V36 C12 35 19 36 24 40 C29 36 36 35 42 36 V10 C36 9 29 10 24 14Z"/><path d="M24 14 V40"/>' },
    car: { t: 'sky', f: '<path d="M7 32 V26 L13 24 L18 16 H31 L37 24 L41 26 V32Z"/>', i: '<path d="M11 33 H6 V26 L12 24 L17 15 H31 L37 24 L42 26 V33 H37"/><path d="M19 33 H29"/><circle cx="15" cy="33" r="4"/><circle cx="33" cy="33" r="4"/><path d="M24 15 V24"/>' },
    shoe: { t: 'blush', f: '<path d="M8 36 V16 H18 C18 22 22 24 28 25 L37 27 C40 28 41 30 41 33 V38 H8Z"/>', i: '<path d="M8 38 V16 H18 C18 22 22 24 28 25 L37 27 C40 28 41 30 41 33 V38 Z"/><path d="M18 21 L22 19 M21 25 L25 23"/><path d="M8 33 H41"/>' },
    hat: { t: 'sage', f: '<path d="M10 32 C10 20 16 13 24 13 S38 20 38 32Z"/>', i: '<path d="M10 32 C10 20 16 13 24 13 S38 20 38 32"/><rect x="8" y="32" width="32" height="6" rx="3"/><circle cx="24" cy="10" r="3"/>' },
    music: { t: 'sky', f: '<circle cx="14" cy="35" r="5"/><circle cx="32" cy="31" r="5"/>', i: '<path d="M18 34 V12 L36 8 V30"/><circle cx="14" cy="34" r="4"/><circle cx="32" cy="30" r="4"/><path d="M18 18 L36 14"/>' },
    bubbles: { t: 'sky', f: '<circle cx="20" cy="28" r="10"/><circle cx="34" cy="14" r="6"/>', i: '<circle cx="20" cy="28" r="10"/><circle cx="34" cy="14" r="6"/><circle cx="37" cy="34" r="3"/><path d="M14 25 A7 7 0 0 1 18 21"/>' },
    dog: { t: 'butter', f: '<path d="M14 20 C14 12 19 8 24 8 S34 12 34 20 V27 C34 34 30 39 24 39 S14 34 14 27Z"/>', i: '<path d="M14 20 C14 12 19 8 24 8 S34 12 34 20 V27 C34 34 30 39 24 39 S14 34 14 27Z"/><path d="M15 14 C9 13 7 21 9 28 C11 28 13 26 14 23"/><path d="M33 14 C39 13 41 21 39 28 C37 28 35 26 34 23"/><path d="M21 32 C23 34 25 34 27 32"/>', d: '<circle cx="20" cy="21" r="1.8"/><circle cx="28" cy="21" r="1.8"/><ellipse cx="24" cy="27.5" rx="2.5" ry="1.9"/>' },
    cat: { t: 'blush', f: '<path d="M12 36 V12 L20 19 H28 L36 12 V36 a6 6 0 0 1 -6 6 H18 a6 6 0 0 1 -6 -6Z"/>', i: '<path d="M12 36 V12 L20 19 H28 L36 12 V36 a6 6 0 0 1 -6 6 H18 a6 6 0 0 1 -6 -6Z"/><path d="M5 29 H13 M6 34 L13 33 M43 29 H35 M42 34 L35 33"/>', d: '<circle cx="19" cy="27" r="1.8"/><circle cx="29" cy="27" r="1.8"/><path d="M22.5 31 H25.5 L24 33Z"/>' },
    duck: { t: 'butter', f: '<path d="M8 29 C8 37 14 41 24 41 S38 37 38 29 C34 31 30 31 26 29 C30 27 32 23 30 17 C28 12 20 11 17 16 C15 19 16 23 19 26 C15 28 11 29 8 29Z"/>', i: '<path d="M8 29 C8 37 14 41 24 41 S38 37 38 29 C34 31 30 31 26 29 C30 27 32 23 30 17 C28 12 20 11 17 16 C15 19 16 23 19 26 C15 28 11 29 8 29Z"/><path d="M30 18 L37 19 L31 22"/><path d="M14 33 C18 36 24 36 28 33"/>', d: '<circle cx="24" cy="18" r="1.8"/>' },
    fish: { t: 'sky', f: '<ellipse cx="22" cy="24" rx="13" ry="9"/>', i: '<path d="M35 24 C30 15 14 14 9 24 C14 34 30 33 35 24Z"/><path d="M35 24 L42 17 V31Z"/><path d="M22 17 C24 20 24 22 22 24"/>', d: '<circle cx="15" cy="22" r="1.8"/>' },
    bird: { t: 'blush', f: '<path d="M10 28 C10 19 16 14 24 14 C30 14 34 18 35 22 L35 26 C34 34 28 38 21 38 C14 38 10 34 10 28Z"/>', i: '<path d="M10 28 C10 19 16 14 24 14 C30 14 34 18 35 22 L41 23 L35 26 C34 34 28 38 21 38 C14 38 10 34 10 28Z"/><path d="M16 27 C20 31 25 31 28 27"/><path d="M20 38 V42 M25 38 V42"/>', d: '<circle cx="28" cy="21" r="1.8"/>' },
    bear: { t: 'butter', f: '<circle cx="24" cy="27" r="13"/><circle cx="13" cy="14" r="5"/><circle cx="35" cy="14" r="5"/>', i: '<path d="M16 17 A13 13 0 1 0 32 17"/><path d="M16 17 A5 5 0 1 0 10 18"/><path d="M32 17 A5 5 0 1 1 38 18"/><path d="M16 17 C21 14 27 14 32 17"/><ellipse cx="24" cy="31" rx="6" ry="4.5"/>', d: '<circle cx="19" cy="24" r="1.8"/><circle cx="29" cy="24" r="1.8"/><ellipse cx="24" cy="29.5" rx="1.8" ry="1.3"/>' },
    cow: { t: 'butter', f: '<path d="M12 22 C12 13 17 8 24 8 S36 13 36 22 C36 32 31 38 24 38 S12 32 12 22Z"/>', i: '<path d="M12 22 C12 13 17 8 24 8 S36 13 36 22 C36 32 31 38 24 38 S12 32 12 22Z"/><path d="M16 10 C14 6 15 4 17 3 M32 10 C34 6 33 4 31 3"/><path d="M12 17 C7 15 3 18 4 21 C7 22 10 21 12 20 M36 17 C41 15 45 18 44 21 C41 22 38 21 36 20"/><rect class="of-snout" x="15" y="27" width="18" height="10" rx="5"/>', d: '<circle cx="19" cy="20" r="1.9"/><circle cx="29" cy="20" r="1.9"/>' },
    sun: { t: 'butter', f: '<circle cx="24" cy="24" r="9"/>', i: '<circle cx="24" cy="24" r="8"/><path d="M24 6 V10 M24 38 V42 M6 24 H10 M38 24 H42 M11 11 L14 14 M34 34 L37 37 M37 11 L34 14 M14 34 L11 37"/>' },
    moon: { t: 'sky', f: '<path d="M30 8 A16 16 0 1 0 40 34 A13 13 0 0 1 30 8Z"/>', i: '<path d="M30 8 A16 16 0 1 0 40 34 A13 13 0 0 1 30 8Z"/><path d="M38 10 V14 M36 12 H40"/>' },
    tree: { t: 'sage', f: '<circle cx="24" cy="18" r="12"/>', i: '<path d="M14 27 C8 27 8 17 14 16 C14 9 22 7 25 11 C30 7 38 11 36 18 C41 20 40 28 34 27 Z"/><path d="M24 27 V42 M24 34 L29 30"/><path d="M16 42 H32"/>' },
    bath: { t: 'sky', f: '<path d="M6 24 H42 V28 a10 10 0 0 1 -10 10 H16 a10 10 0 0 1 -10 -10Z"/>', i: '<path d="M6 24 H42 V28 a10 10 0 0 1 -10 10 H16 a10 10 0 0 1 -10 -10Z"/><path d="M14 38 L12 42 M34 38 L36 42"/><path d="M12 24 V12 a4 4 0 0 1 8 0"/><circle cx="29" cy="17" r="3"/><circle cx="36" cy="13" r="2"/>' },
  };
  // Class names written whole, so nothing is assembled at runtime.
  var FILL_CLASS = { sage: 'of-sage', blush: 'of-blush', butter: 'of-butter', sky: 'of-sky', white: 'of-white' };
  var TINT = { sage: 'tint-sage', blush: 'tint-blush', butter: 'tint-butter', sky: 'tint-sky' };
  var INK = { sage: 'ink-sage', blush: 'ink-blush', butter: 'ink-butter', sky: 'ink-sky' };
  var LANG_ON = { sage: 'lang-on-sage', blush: 'lang-on-blush', butter: 'lang-on-butter', sky: 'lang-on-sky' };
  var SWATCH = { sage: 'sw-sage', blush: 'sw-blush', butter: 'sw-butter', sky: 'sw-sky' };

  // icon('cup', 32) draws the cup at 32px. opts.fill picks the pastel
  // ('none' leaves the shape out, as on an idle nav tab); opts.label makes
  // it an image with a name instead of decoration. The ink keeps the same
  // weight on screen at every size.
  function icon(name, size, opts) {
    opts = opts || {};
    var def = ICONS[name] || ICONS.word;
    var px = size >= 64 ? 1.3 : 1.6;
    var sw = Math.round(px * 48 / size * 100) / 100;
    var fill = opts.fill === undefined ? def.t : opts.fill;
    var shape = def.f && fill !== 'none' && FILL_CLASS[fill]
      ? '<g transform="translate(2 2)" class="' + FILL_CLASS[fill] + '">' + def.f + '</g>' : '';
    var a11y = opts.label ? ' role="img" aria-label="' + esc(opts.label) + '"' : ' aria-hidden="true"';
    return '<svg class="ico' + (opts.cls ? ' ' + opts.cls : '') + '" width="' + size + '" height="' + size +
      '" viewBox="0 0 48 48"' + a11y + '>' + shape +
      '<g class="oi" style="stroke-width:' + sw + '">' + def.i + '</g>' +
      (def.d ? '<g class="od">' + def.d + '</g>' : '') + '</svg>';
  }

  // The cow mascot, in the same style: a butter body printed off-register,
  // soft tan patches and a blush snout. `sw` is its line weight in its own
  // units; the bubble beside it is optional.
  function cowShapes(sw) {
    return '' +
      '<g transform="translate(3 3)" class="of-butter"><path d="M22 36 C14 42 14 58 20 64 C24 68 30 70 40 70 H72 C82 70 88 64 88 54 C88 40 80 30 66 29 C52 28 32 28 22 36Z"/><path d="M78 26 C78 16 86 11 95 11 C104 11 110 17 110 27 C110 38 104 44 95 44 C86 44 78 37 78 26Z"/></g>' +
      '<g class="cow-patch"><path d="M38 32 C44 28 54 28 56 34 C58 40 50 44 44 42 C38 41 35 36 38 32Z"/><path d="M20 50 C24 47 30 50 29 56 C28 61 23 62 20 59 C18 56 18 53 20 50Z"/><path d="M58 47 C63 44 70 47 69 53 C68 59 60 60 57 56 C55 53 56 49 58 47Z"/><path d="M98 15 C102 13 107 16 107 21 C107 25 103 27 99 25 C97 22 96 18 98 15Z"/></g>' +
      '<g class="oi" style="stroke-width:' + sw + '">' +
        '<path d="M76 30 C62 27 38 27 24 34 C15 40 14 56 20 63 C24 68 31 70 40 70 H74 C83 70 88 64 88 54 C88 48 86 44 83 41"/>' +
        '<path d="M28 69 V82 a3 3 0 0 0 6 0 V70"/><path d="M44 70 V82 a3 3 0 0 0 6 0 V70"/><path d="M64 70 V82 a3 3 0 0 0 6 0 V70"/><path d="M78 68 V82 a3 3 0 0 0 6 0 V64"/>' +
        '<path d="M17 44 C10 46 9 54 11 60"/><path d="M11 60 C9 62 10 65 12 64 C13 66 15 64 13 61"/>' +
        '<path d="M54 70 C54 75 60 75 60 70"/>' +
        '<path d="M78 26 C78 16 86 11 95 11 C104 11 110 17 110 27 C110 38 104 44 95 44 C86 44 78 37 78 26Z"/>' +
        '<path d="M86 14 C84 9 85 6 88 5"/><path d="M104 14 C106 9 105 6 102 5"/>' +
        '<path d="M80 21 C74 18 68 21 68 25 C72 27 77 26 80 23"/><path d="M110 21 C116 18 122 21 122 25 C118 27 113 26 110 23"/>' +
        '<rect class="of-snout" x="84" y="31" width="22" height="13" rx="6.5"/>' +
        '<path d="M6 89 H44 M52 89 H94"/>' +
      '</g>' +
      '<g class="od"><circle cx="89" cy="24" r="2"/><circle cx="101" cy="24" r="2"/><circle cx="91" cy="37.5" r="1.4"/><circle cx="99" cy="37.5" r="1.4"/></g>';
  }
  function heroCowSvg() {
    return '<svg class="ico hero-cow" viewBox="0 -26 126 122" aria-hidden="true">' +
      '<g transform="translate(2 2)" class="of-sky"><path d="M54 -22 H78 a6 6 0 0 1 6 6 V-6 a6 6 0 0 1 -6 6 H72 L68 5 V0 H54 a6 6 0 0 1 -6 -6 V-16 a6 6 0 0 1 6 -6Z"/></g>' +
      '<g class="oi" style="stroke-width:1.6"><path d="M54 -22 H78 a6 6 0 0 1 6 6 V-6 a6 6 0 0 1 -6 6 H72 L68 5 V0 H54 a6 6 0 0 1 -6 -6 V-16 a6 6 0 0 1 6 -6Z"/></g>' +
      '<g class="od"><circle cx="58" cy="-11" r="1.8"/><circle cx="66" cy="-11" r="1.8"/><circle cx="74" cy="-11" r="1.8"/></g>' +
      cowShapes(1.6) + '</svg>';
  }
  // The welcome scene: the cow among "hi!", "¡hola!" and a signing bubble.
  function welcomeSceneSvg() {
    return '<svg class="ico" width="256" height="180" viewBox="0 0 256 180" aria-hidden="true">' +
      '<g transform="translate(2 2)" class="of-sky"><rect x="14" y="8" width="54" height="28" rx="14"/></g>' +
      '<g transform="translate(2 2)" class="of-blush"><rect x="184" y="4" width="64" height="28" rx="14"/></g>' +
      '<g transform="translate(2 2)" class="of-butter"><rect x="196" y="50" width="48" height="30" rx="15"/></g>' +
      '<g class="oi" style="stroke-width:1.6">' +
        '<path d="M28 8 H54 a14 14 0 0 1 0 28 H40 L32 42 V35 a14 14 0 0 1 -4 -27Z"/>' +
        '<path d="M198 4 H234 a14 14 0 0 1 0 28 H212 a14 14 0 0 1 -14 -28Z"/><path d="M204 34 L200 40"/>' +
        '<rect x="196" y="50" width="48" height="30" rx="15"/>' +
        '<path d="M213 72 V61 a2 2 0 0 1 4 0 V67 M217 66 V58 a2 2 0 0 1 4 0 V66 M221 66 V60 a2 2 0 0 1 4 0 V68 C225 72 222 74 219 74 H217 C215 74 213 73 212 71 L209 67 a2 2 0 0 1 3 -2 L213 67"/>' +
      '</g>' +
      '<g class="od" style="font:700 13px Figtree,sans-serif"><text x="41" y="27" text-anchor="middle">hi!</text><text x="216" y="23" text-anchor="middle">¡hola!</text></g>' +
      '<g transform="translate(40 40) scale(1.3)">' + cowShapes(1.25) + '</g></svg>';
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
  var fmtCache = {};
  function fmt(iso, opts, key) {
    if (!fmtCache[key]) {
      // An unusual browser locale string must never stop the page drawing.
      try { fmtCache[key] = new Intl.DateTimeFormat(navigator.language || 'en', opts); }
      catch (e) { fmtCache[key] = new Intl.DateTimeFormat('en', opts); }
    }
    return fmtCache[key].format(new Date(iso + 'T00:00:00'));
  }
  function fmtShort(iso) {
    var sameYear = iso.slice(0, 4) === String(nowDate().getFullYear());
    if (iso === todayIso()) return 'Today';
    return sameYear
      ? fmt(iso, { month: 'short', day: 'numeric' }, 'short')
      : fmt(iso, { month: 'short', day: 'numeric', year: 'numeric' }, 'shortY');
  }
  function fmtLong(iso) {
    return fmt(iso, { month: 'long', day: 'numeric' }, 'long');
  }
  function fmtFull(iso) {
    return fmt(iso, { month: 'short', day: 'numeric', year: 'numeric' }, 'full');
  }
  function addDaysIso(iso, n) {
    var d = new Date(iso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

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
      one: 'Word', many: 'Words', the: 'The word', eg: 'e.g. ball',
      how: function (name) { return 'How ' + name + ' says it'; },
      hint: 'e.g. “ba” for ball',
      tone: 'sky', icon: 'word',
    },
    sound: {
      one: 'Sound', many: 'Sounds', the: 'The animal or thing', eg: 'e.g. cow or car',
      how: function (name) { return 'The sound ' + name + ' makes'; },
      hint: 'e.g. moo, vroom',
      tone: 'blush', icon: 'sound',
    },
    sign: {
      one: 'Sign', many: 'Signs', the: 'What the sign means', eg: 'e.g. more',
      how: function (name) { return 'How ' + name + ' signs it'; },
      hint: 'e.g. taps fingertips together',
      tone: 'butter', icon: 'sign',
    },
  };

  var MASTERY = {
    emerging: { label: 'Emerging', icon: 'seed', hint: 'Tried it once or twice' },
    practicing: { label: 'Practicing', icon: 'sprout', hint: 'Uses it with a nudge' },
    mastered: { label: 'Mastered', icon: 'flower', hint: 'Says it on their own' },
  };
  var M_PILL = { emerging: 'm-pill m-pill-emerging', practicing: 'm-pill m-pill-practicing', mastered: 'm-pill m-pill-mastered' };
  function masteryOf(e) { return window.RiloInsights.masteryOf(e); }
  function masteryIcon(level, size) {
    return icon(MASTERY[level].icon, size, { label: MASTERY[level].label });
  }

  // The quick start: common entries a parent can tap in one go instead of
  // adding everything by hand (the creator's ask). Each pick is saved as an
  // ordinary first dated today. Sounds are anything that makes a sound,
  // animals and things alike: a car goes vroom, a horn goes beep beep.
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

  // Languages offered on the welcome screen. Anything else can be typed.
  var SETUP_LANGS = ['English', 'Spanish', 'ASL', 'French'];

  // Categories are inferred from entry labels, including Spanish.
  // Phrases checked whole first, then single words.
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
  function tokens(label) {
    return String(label || '').toLowerCase().split(/[^a-záéíóúñü]+/).filter(Boolean);
  }
  function inferCategory(label) {
    var text = String(label || '').toLowerCase();
    for (var phrase in CAT_PHRASES) {
      if (text.indexOf(phrase) !== -1) return CAT_PHRASES[phrase];
    }
    var tk = tokens(label);
    for (var i = 0; i < tk.length; i++) {
      for (var cat in CAT_WORDS) {
        if (CAT_WORDS[cat].indexOf(tk[i]) !== -1) return cat;
      }
    }
    return 'words';
  }

  // Which drawing an entry gets: the thing itself when we have it (a cup
  // for agua, a dog for dog), else its category, else its kind.
  var LABEL_ICON = {
    agua: 'cup', water: 'cup', cup: 'cup', vaso: 'cup', juice: 'cup', jugo: 'cup', drink: 'cup',
    milk: 'bottle', leche: 'bottle', bottle: 'bottle', bibe: 'bottle',
    ball: 'ball', pelota: 'ball', bola: 'ball',
    dog: 'dog', perro: 'dog', puppy: 'dog', perrito: 'dog', woof: 'dog',
    cat: 'cat', gato: 'cat', kitty: 'cat', gatito: 'cat', meow: 'cat', miau: 'cat',
    duck: 'duck', pato: 'duck', quack: 'duck',
    banana: 'banana', plátano: 'banana', platano: 'banana',
    apple: 'apple', manzana: 'apple',
    book: 'book', libro: 'book',
    moon: 'moon', luna: 'moon', night: 'moon', noche: 'moon', sleep: 'moon',
    sun: 'sun', sol: 'sun',
    car: 'car', coche: 'car', carro: 'car', bus: 'car', truck: 'car', vroom: 'car', beep: 'car',
    shoe: 'shoe', shoes: 'shoe', zapato: 'shoe', zapatos: 'shoe', socks: 'shoe',
    cow: 'cow', vaca: 'cow', moo: 'cow',
    fish: 'fish', pez: 'fish',
    bird: 'bird', pájaro: 'bird', pajaro: 'bird', owl: 'bird', tweet: 'bird',
    bear: 'bear', oso: 'bear', teddy: 'bear',
    tree: 'tree', árbol: 'tree', arbol: 'tree', flower: 'tree', flor: 'tree', leaf: 'tree',
    bath: 'bath', baño: 'bath',
    bubbles: 'bubbles', bubble: 'bubbles', burbujas: 'bubbles',
    hat: 'hat', gorro: 'hat',
    spoon: 'spoon', cuchara: 'spoon', eat: 'spoon', comer: 'spoon',
    song: 'music', sing: 'music', music: 'music', música: 'music',
    bye: 'wave', adiós: 'wave', adios: 'wave', hi: 'wave', hello: 'wave', hola: 'wave', wave: 'wave',
    mama: 'heart', mamá: 'heart', mom: 'heart', mommy: 'heart', dada: 'heart', dad: 'heart',
    daddy: 'heart', papa: 'heart', papá: 'heart', abuela: 'heart', abuelo: 'heart',
    nana: 'heart', grandma: 'heart', grandpa: 'heart', baby: 'heart', hug: 'heart', kiss: 'heart',
  };
  var CATEGORY_ICON = {
    food: 'spoon', play: 'ball', transport: 'car', outside: 'tree', home: 'moon',
    body: 'shoe', people: 'heart', animals: 'bird',
  };
  function entryIconName(e) {
    var tk = tokens(e.label);
    for (var i = 0; i < tk.length; i++) if (LABEL_ICON[tk[i]]) return LABEL_ICON[tk[i]];
    if (e.kind === 'sign') return 'sign';
    if (e.kind === 'sound') return e.category === 'transport' ? 'car' : 'sound';
    return CATEGORY_ICON[e.category] || 'word';
  }

  // A language's tint: English sky, Spanish blush, signed languages butter,
  // every other language sage (the creator's palette).
  function langTone(name) {
    var n = String(name || '').trim().toLowerCase();
    if (!n) return 'sage';
    if (/^(english|en|inglés|ingles)$/.test(n)) return 'sky';
    if (/^(spanish|es|español|espanol|castellano)$/.test(n)) return 'blush';
    if (/^(asl|bsl|lsm|lse|auslan|sign|signs|sign language)$/.test(n) || /sign language|lengua de señas/.test(n)) return 'butter';
    return 'sage';
  }

  // ── State ────────────────────────────────────────────────────────────
  function pageFromHash() {
    var h = location.hash.slice(1);
    var m = /^entry-(\d+)$/.exec(h);
    if (m) return { page: 'entry', entryId: Number(m[1]) };
    if (['insights', 'profile', 'log'].indexOf(h) !== -1) return { page: h, entryId: null };
    return { page: 'words', entryId: null };
  }
  var start = pageFromHash();
  var state = {
    screen: 'loading', // loading | error | app | quickstart
    loadError: null,
    child: null,
    languages: [],
    entries: [],
    page: start.page, // words (Home) | log | entry | insights | profile
    entryId: start.entryId,
    search: '',
    filter: 'all', // all | word | sound | sign | emerging | practicing | mastered | month | lang:<name>
    sessionLangs: [], // languages created this session, still unused
    quickPick: {}, // quick-start picks: item id -> true
    setupLangs: { English: true },
    setupExtra: [],
  };

  function countKind(kind) {
    return state.entries.filter(function (e) { return e.kind === kind; }).length;
  }
  function byNewest(a, b) { return b.said_on.localeCompare(a.said_on) || b.id - a.id; }
  function languagesUsed() {
    var seen = {};
    var list = [];
    state.entries.slice().sort(byNewest).forEach(function (e) {
      if (e.language_name && !seen[e.language_name.toLowerCase()]) {
        seen[e.language_name.toLowerCase()] = true;
        list.push(e.language_name);
      }
    });
    return list;
  }
  function joinNames(list) {
    if (list.length <= 1) return list.join('');
    return list.slice(0, -1).join(', ') + ' & ' + list[list.length - 1];
  }
  function mostUsedLanguageId() {
    var used = state.languages.filter(function (l) { return l.uses > 0; })
      .sort(function (a, b) { return b.uses - a.uses; });
    return used.length ? used[0].id : (state.languages[0] ? state.languages[0].id : null);
  }
  function defaultLanguageId(kind) {
    var sameKind = state.entries.filter(function (e) { return e.kind === kind && e.language_id; });
    if (sameKind.length) return sameKind[0].language_id; // entries are newest first
    if (kind === 'sign') {
      var signed = state.languages.find(function (l) { return langTone(l.name) === 'butter'; });
      if (signed) return signed.id;
    }
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
      'background:rgb(var(--surface));border-radius:24px 24px 0 0;padding:12px 20px 28px';
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
      'position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:60;' +
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
          { label: 'Keep it', style: 'cancel' },
          { label: 'Delete', style: 'destructive' },
        ],
      }).then(function (result) {
        var button = result && result.button;
        if (button && typeof button === 'object') return button.label === 'Delete';
        var buttons = [{ label: 'Keep it' }, { label: 'Delete' }];
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
'<main data-screen="loading" class="page" aria-busy="true">' +
'  <div class="skeleton" style="height:44px;width:60%"></div>' +
'  <div class="skeleton" style="height:196px;border-radius:32px"></div>' +
'  <div class="kind-grid"><div class="skeleton" style="height:120px"></div><div class="skeleton" style="height:120px"></div><div class="skeleton" style="height:120px"></div></div>' +
'  <div class="skeleton" style="height:240px;border-radius:28px"></div>' +
'</main>';
  }

  function errorHtml() {
    var who = state.child && state.child.name ? esc(state.child.name) + '’s' : 'the';
    return '' +
'<main data-screen="error" class="page page-plain">' +
'  <div class="state-error">' + icon('cow', 64) +
'    <p>Couldn’t load ' + who + ' words.</p>' +
'    <p class="sub">Nothing you saved is lost. Check your connection and try again.</p>' +
'    <button type="button" id="retry" class="btn-secondary">Retry</button>' +
'  </div>' +
'</main>';
  }

  function brandHtml(step) {
    return '<div class="brand-row"><div class="brand">' + icon('cow', 30) +
      '<span class="brand-name">rilo</span></div>' +
      '<div class="steps" aria-label="Step ' + step + ' of 2"><span class="' + (step === 1 ? 'on' : '') + '"></span><span class="' + (step === 2 ? 'on' : '') + '"></span></div></div>';
  }

  // The welcome: the child's name, birth month and the languages at home.
  function setupHtml() {
    var now = nowDate();
    var langs = SETUP_LANGS.concat(state.setupExtra);
    return '' +
'<main data-screen="setup" class="page page-plain">' + brandHtml(1) +
'  <div class="setup-art">' + welcomeSceneSvg() + '</div>' +
'  <div><h1 class="setup-title">Every little word,<br>in every language.</h1>' +
'  <p class="sub" style="margin-top:8px">Tell us about your little one. You can change this anytime.</p></div>' +
'  <form id="setup-form" class="flex flex-col gap-4" novalidate>' +
'    <div><label class="field-label" for="setup-name">Child’s name</label>' +
'      <input id="setup-name" class="field" type="text" maxlength="40" autocomplete="off" placeholder="e.g. Luna"></div>' +
'    <div class="grid grid-cols-2 gap-3">' +
'      <div><label class="field-label" for="setup-month">Birth month</label>' + monthSelectHtml('setup-month', pad(now.getMonth() + 1)) + '</div>' +
'      <div><label class="field-label" for="setup-year">Year</label>' + yearSelectHtml('setup-year', now.getFullYear()) + '</div>' +
'    </div>' +
'    <fieldset><legend class="field-label">Languages at home</legend>' +
'      <div class="chips-row" data-setup-langs>' +
        langs.map(function (name) {
          var on = !!state.setupLangs[name];
          return '<button type="button" class="chip' + (on ? ' chip-on' : '') + '" data-setup-lang="' + esc(name) + '" aria-pressed="' + on + '">' + esc(name) + '</button>';
        }).join('') +
'        <button type="button" class="chip chip-dashed" data-setup-other>+ Other</button>' +
'      </div>' +
'      <div data-setup-other-area hidden class="mt-3 flex gap-2"><label class="sr-only" for="setup-other">Another language</label>' +
'        <input id="setup-other" class="field" type="text" maxlength="30" autocomplete="off" placeholder="e.g. Portuguese">' +
'        <button type="button" class="btn-secondary" data-setup-other-add>Add</button></div>' +
'    </fieldset>' +
'    <p id="setup-error" hidden class="form-error"></p>' +
'    <button type="submit" class="btn-primary" data-setup-go>Start the word list ' + icon('arrow', 20, { fill: 'none' }) + '</button>' +
'  </form>' +
'</main>';
  }

  // The quick start, straight after setup: tap what the child already does,
  // save them all dated today, or skip and add entries one at a time.
  function quickstartHtml() {
    var name = state.child.name;
    var n = Object.keys(state.quickPick).length;
    return '' +
'<main data-screen="quickstart" class="page">' + brandHtml(2) +
'  <div><h1 class="setup-title">What does ' + esc(name) + ' already do?</h1>' +
'  <p class="sub" style="margin-top:8px">Tap everything ' + esc(name) + ' already says or signs. Rilo saves them dated today, ' +
      esc(fmtLong(todayIso())) + '. You can edit or delete any of them later.</p></div>' +
    QUICK_STARTS.map(function (group) {
      var k = KINDS[group.kind];
      return '<section class="flex flex-col gap-3"><h2 class="section-heading" style="justify-content:flex-start;gap:8px">' +
        icon(k.icon, 26) + '<span class="font-display" style="font-size:18px;font-weight:600">' + esc(group.group) + '</span></h2>' +
        '<div class="chips-row">' +
        group.items.map(function (item, i) {
          var id = group.kind + '-' + i;
          var text = item.sounds_like && group.kind === 'sound' ? item.label + ' · ' + item.sounds_like : item.label;
          return '<button type="button" class="chip' + (state.quickPick[id] ? ' chip-on' : '') +
            '" data-quick="' + id + '" aria-pressed="' + !!state.quickPick[id] + '">' + esc(text) + '</button>';
        }).join('') + '</div></section>';
    }).join('') +
'  <p data-form-error hidden class="form-error"></p>' +
'</main>' +
'<div class="qs-bar"><div class="qs-bar-inner">' +
'  <button type="button" id="quick-add" class="btn-primary" style="flex:1"' + (n ? '' : ' disabled') + '>' +
      (n ? (n === 1 ? 'Add 1 entry' : 'Add ' + n + ' entries') : 'Add entries') + '</button>' +
'  <button type="button" id="quick-skip" class="btn-secondary">Skip</button>' +
'</div></div>';
  }

  function navigate(page, opts) {
    opts = opts || {};
    state.page = page;
    if (page === 'log') {
      state.filter = opts.filter || 'all';
      state.search = '';
    }
    state.entryId = page === 'entry' ? opts.entryId : null;
    var hash = page === 'words' ? '' : page === 'entry' ? '#entry-' + opts.entryId : '#' + page;
    if (location.hash !== hash) history.replaceState(null, '', location.pathname + location.search + hash);
    render();
    window.scrollTo({ top: 0 });
    var title = app.querySelector('h1');
    if (title) title.focus({ preventScroll: true });
  }

  function navHtml() {
    var p = state.page;
    function item(page, name, label, current) {
      return '<button type="button" class="nav-item" data-page="' + page + '"' + (current ? ' aria-current="page"' : '') + '>' +
        icon(name, 26, { fill: current ? 'sage' : 'none' }) + '<span>' + esc(label) + '</span></button>';
    }
    return '<nav class="bottom-nav" aria-label="Main navigation">' +
      item('words', 'home', 'Home', p === 'words') +
      item('log', 'log', 'Log', p === 'log' || p === 'entry') +
      '<button type="button" id="add-first" class="nav-add" aria-label="Add a word, sound or sign">' + icon('plus', 26, { fill: 'none' }) + '</button>' +
      item('insights', 'insights', 'Insights', p === 'insights') +
      item('profile', 'child', state.child.name, p === 'profile') +
      '</nav>';
  }

  function mainHtml() {
    var content = state.page === 'insights' ? insightsHtml()
      : state.page === 'profile' ? profileHtml()
      : state.page === 'log' ? logHtml()
      : state.page === 'entry' ? entryHtml()
      : homeHtml();
    return '<main data-screen="app" class="page" data-view="' + state.page + '">' + content + '</main>' + navHtml();
  }

  function childLine() {
    var b = state.child.birthday;
    return formatAge(ageMonths(b, todayIso()), state.child.name) + ' · born ' +
      MONTH_NAMES[Number(b.slice(5, 7)) - 1] + ' ' + b.slice(0, 4);
  }

  // ── Home ─────────────────────────────────────────────────────────────
  function homeHtml() {
    var data = window.RiloInsights.summarize(state.entries, todayIso());
    var langs = languagesUsed();
    var name = state.child.name;
    return '' +
'<header class="kid-head"><div class="kid-id"><div class="kid-avatar" aria-hidden="true">' + esc(name.charAt(0).toUpperCase()) + '</div>' +
'  <div style="min-width:0"><h1 class="kid-name" tabindex="-1">' + esc(name) + '</h1><p class="kid-age">' + esc(childLine()) + '</p></div></div>' +
'  <button type="button" class="round-btn" data-page="profile" aria-label="' + esc(name) + '’s profile and settings">' + icon('sliders', 24) + '</button>' +
'</header>' +
'<section class="hero-card" aria-label="Total words, sounds and signs"><div class="hero-blob"></div>' + heroCowSvg() +
'  <div class="hero-text"><p class="hero-label">' + esc(name) + '’s words so far</p><strong class="hero-count">' + data.total + '</strong></div>' +
'  <div class="hero-meta">' + (data.thisWeek ? '<span class="pill-sage">+' + data.thisWeek + ' this week</span>' : '') +
      (langs.length ? '<span>across ' + esc(joinNames(langs)) + '</span>' : '<span>Every first counts</span>') + '</div>' +
'</section>' +
'<section class="kind-grid" aria-label="Categories">' +
      ['word', 'sound', 'sign'].map(function (kind) {
        var k = KINDS[kind];
        return '<button type="button" class="kind-card ' + TINT[k.tone] + '" data-kind-card="' + kind + '">' +
          icon(k.icon, 36, { fill: 'white' }) + '<span><strong class="kind-count">' + countKind(kind) + '</strong>' +
          '<span class="kind-label ' + INK[k.tone] + '">' + k.many + '</span></span></button>';
      }).join('') +
'</section>' +
'<section class="flex flex-col gap-3"><div class="section-heading"><h2>Recent</h2>' +
      (state.entries.length ? '<button type="button" class="link-btn" data-page="log">See all</button>' : '') + '</div>' +
      (state.entries.length
        ? '<ul class="entry-list">' + state.entries.slice().sort(byNewest).slice(0, 4).map(recentRowHtml).join('') + '</ul>'
        : '<div class="state-empty">' + icon('word', 56) + '<p>' + esc(name) + '’s word story starts here.</p><p class="sub">Add the first word, sound or sign you have heard.</p><button type="button" class="btn-primary" data-add-kind="word">Add a word</button></div>') +
'</section>';
  }

  function entryAria(e) {
    return KINDS[e.kind].one + ': ' + e.label +
      (e.sounds_like ? ', ' + e.sounds_like : '') +
      (e.language_name ? ', ' + e.language_name : '') +
      ', ' + MASTERY[masteryOf(e)].label + ', ' + fmtLong(e.said_on);
  }

  function recentRowHtml(e) {
    var tone = e.language_name ? langTone(e.language_name) : KINDS[e.kind].tone;
    var level = masteryOf(e);
    var note = e.sounds_like ? (e.kind === 'sign' ? e.sounds_like : '“' + e.sounds_like + '”') : (e.note || '');
    return '<li><button type="button" class="entry-row" data-entry="' + e.id + '" aria-label="' + esc(entryAria(e)) + '">' +
      '<span class="entry-tile ' + TINT[tone] + '">' + icon(entryIconName(e), 32, { fill: 'white' }) + '</span>' +
      '<span class="entry-main"><span class="entry-top"><span class="entry-word">' + esc(e.label) + '</span>' +
        '<span class="entry-kicker ' + INK[tone] + '">' + KINDS[e.kind].one + (e.language_name ? ' · ' + esc(e.language_name) : '') + '</span></span>' +
        (note ? '<span class="entry-note">' + esc(note) + '</span>' : '') + '</span>' +
      '<span class="entry-side"><span class="entry-date">' + esc(fmtShort(e.said_on)) + '</span>' +
        '<span class="' + M_PILL[level] + '">' + MASTERY[level].label + '</span></span>' +
      '</button></li>';
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
