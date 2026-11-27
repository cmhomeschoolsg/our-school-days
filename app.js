/* Our School Days — offline checklist for Emma and Emily. Notes From Another Mother. */
(function () {
  'use strict';
  var C = window.CONTENT;
  var KEY = 'nfam-schooldays-v1';
  var app = document.getElementById('app');

  // ---------- state ----------
  function blank() {
    return { v: 1, profile: null, days: [], weeks: {}, ptr: {}, songCur: {}, verses: [], said: {}, recite: {}, drawing: { emma: [], emily: [] }, forceNewWeek: false, keepDay: null, narrWritten: {}, wk: {}, stayWeek: false };
  }
  var S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || blank(); } catch (e) { S = blank(); }
  if (S.craft && S.craft.brush != null && !S.craftBrushV2) { S.craft.brushpr = S.craft.brush; delete S.craft.brush; } S.craftBrushV2 = 1;
  if (!S.craftSloydV2) { if (S.craft) { if (S.craft.rich != null) S.craft.sloyd = S.craft.rich; else delete S.craft.sloyd; delete S.craft.rich; } S.craftSloydV2 = 1; } // sloyd is now the Happy Handicrafts (Rich) course only // brush lessons moved to Hudson; keep the old place in the Parents’ Review steps
  var defaults = blank();
  Object.keys(defaults).forEach(function (k) { if (S[k] === undefined) S[k] = defaults[k]; });
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} if (window.SDsync) window.SDsync.changed(); }

  var ui = { tab: null, sheet: null, sheetArg: null, timer: null, bibleLang: 'three', weekView: null, verseManage: false, showVerse: {} };

  // ---------- helpers ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function fmtDate(iso) { if (!iso) return ''; var p = iso.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]); return d.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function cur() { return S.days[S.days.length - 1] || null; }
  function dayInWeek(day) { return S.days.filter(function (d) { return d.w === day.w && d.n <= day.n; }).length; }
  function toast(msg) { var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 1800); }
  function whoOf(listKey) { return C.lists[listKey].who; }

  function listsForProfile() { return { emma: ['emma'], emily: ['emily'], together: ['together'], all: ['emma', 'emily', 'together'] }[S.profile] || ['emma']; }

  function startDay() {
    var last = cur();
    var w = 1;
    if (last) {
      var count = S.days.filter(function (d) { return d.w === last.w; }).length;
      w = (S.forceNewWeek || weekComplete(last.w) || (count >= 5 && !S.stayWeek)) ? last.w + 1 : last.w;
      S.stayWeek = false;
    }
    S.forceNewWeek = false;
    S.days.push({ n: last ? last.n + 1 : 1, w: w, date: today(), ticks: {}, picks: {} });
    S.keepDay = null;
    save(); render();
    toast('Day ' + cur().n + ' started');
  }

  // ---------- loops ----------
  function loopItem(id) {
    for (var k in C.loops) { var L = C.loops[k]; for (var i = 0; i < L.items.length; i++) if (L.items[i].id === id) return L.items[i]; }
    return null;
  }
  function weekDone(w) { return S.weeks[w] || (S.weeks[w] = {}); }
  // ---------- slipping: work left undone last week is marked 🔴 so the girls do it first ----------
  // A loop item is flagged if it was not done last week. After a short week (fewer than 4 school days, e.g. travel)
  // it is flagged only if it was also missed the week before. A daily item is flagged if it was done fewer than
  // 3 times in a full week. Reads past weeks only; never writes.
  function schoolDaysIn(v) { return S.days.filter(function (d) { return d.w === v; }).length; }
  function missedWeeks(id, w, isLoop) {
    var k = 0;
    for (var v = w - 1; v >= 1 && v >= w - 4; v--) {
      var nd = schoolDaysIn(v); if (!nd) continue;
      var done = isLoop ? !!(S.weeks[v] || {})[id] : ((S.wk[v] || {})[id] || []).length >= Math.min(3, nd);
      if (done) break; k++;
    }
    return k;
  }
  function slipFlag(id, w, isLoop) {
    if (!cur() || w !== cur().w) return 0;
    var k = missedWeeks(id, w, isLoop); if (!k) return 0;
    if (isLoop && k === 1 && schoolDaysIn(w - 1) < 4) return 0;
    if (!isLoop && schoolDaysIn(w - 1) < 4 && k === 1) return 0;
    return k;
  }
  function slipHTML(k, isLoop) { return k ? '<span class="meta slip">🔴 ' + (isLoop ? (k === 1 ? 'Missed last week' : 'Missed ' + k + ' weeks') : 'Not enough last week') + ' — do this first</span>' : ''; }
  function pickCount(day, item) { return (day.picks[item.id] || []).length; }
  function isDone(day, item) { return item.pick ? pickCount(day, item) >= item.n : !!day.ticks[item.id]; }

  // ---------- pointers (poems etc.) ----------
  // A pointer moves on by itself when the poem was read on an earlier school day.
  function ptr(key, tickId) {
    var p = S.ptr[key] || (S.ptr[key] = { i: 0, readOn: null });
    var d = cur();
    // Move on once the poem was read on an earlier school day (or an earlier date, in case days were removed and redone).
    if (d && p.readOn && (p.readOn < d.n || (p.readDate && p.readDate < d.date))) { p.i++; p.readOn = null; p.readDate = null; save(); }
    return p;
  }
  // Each poem read is also kept in a record, so the place can always be found again.
  function markRead(key, n) {
    var p = S.ptr[key] || (S.ptr[key] = { i: 0, readOn: null });
    p.readOn = n; p.readDate = today();
    var len = ptrLen(key); var i = len ? ((p.i % len) + len) % len : p.i;
    if (!p.log) p.log = {}; if (!p.log[i]) p.log[i] = today();
  }

  // ---------- bible ----------
  var EN_BOOKS = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalm', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'];
  var ZH_BOOKS = ['创世记', '出埃及记', '利未记', '民数记', '申命记', '约书亚记', '士师记', '路得记', '撒母耳记上', '撒母耳记下', '列王纪上', '列王纪下', '历代志上', '历代志下', '以斯拉记', '尼希米记', '以斯帖记', '约伯记', '诗篇', '箴言', '传道书', '雅歌', '以赛亚书', '耶利米书', '耶利米哀歌', '以西结书', '但以理书', '何西阿书', '约珥书', '阿摩司书', '俄巴底亚书', '约拿书', '弥迦书', '那鸿书', '哈巴谷书', '西番雅书', '哈该书', '撒迦利亚书', '玛拉基书', '马太福音', '马可福音', '路加福音', '约翰福音', '使徒行传', '罗马书', '哥林多前书', '哥林多后书', '加拉太书', '以弗所书', '腓立比书', '歌罗西书', '帖撒罗尼迦前书', '帖撒罗尼迦后书', '提摩太前书', '提摩太后书', '提多书', '腓利门书', '希伯来书', '雅各书', '彼得前书', '彼得后书', '约翰一书', '约翰二书', '约翰三书', '犹大书', '启示录'];
  var bibles = {};
  function loadBible(lang) {
    if (bibles[lang]) return bibles[lang];
    bibles[lang] = fetch('data/' + (lang === 'zh' ? 'cuv' : 'kjv') + '.json').then(function (r) { if (!r.ok) throw new Error('missing'); return r.json(); });
    bibles[lang].catch(function () { delete bibles[lang]; });
    return bibles[lang];
  }
  function findBook(name) {
    var n = name.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
    if (n === 'psalms') n = 'psalm';
    for (var i = 0; i < EN_BOOKS.length; i++) if (EN_BOOKS[i].toLowerCase() === n) return i;
    for (i = 0; i < EN_BOOKS.length; i++) if (EN_BOOKS[i].toLowerCase().replace(/\s/g, '').indexOf(n.replace(/\s/g, '')) === 0) return i;
    return -1;
  }
  // "Exodus 35:4-36:7", "Psalm 24", "John 3:16", "Matthew 13:18-58"
  function parseRef(ref) {
    var m = String(ref).trim().match(/^(\d?\s*[A-Za-z][A-Za-z .]*?)\s+(\d+)(?::(\d+))?(?:\s*[-–]\s*(\d+)(?::(\d+))?)?$/);
    if (!m) return null;
    var b = findBook(m[1]); if (b < 0) return null;
    var c1 = +m[2], v1 = m[3] ? +m[3] : null, c2, v2;
    if (m[5]) { c2 = +m[4]; v2 = +m[5]; }
    else if (m[4]) { if (v1) { c2 = c1; v2 = +m[4]; } else { c2 = +m[4]; v2 = null; } }
    else { c2 = c1; v2 = v1; }
    return { b: b, c1: c1, v1: v1, c2: c2, v2: v2 };
  }
  function refLabel(r, lang) {
    var name = lang === 'zh' ? ZH_BOOKS[r.b] : EN_BOOKS[r.b];
    var s = name + (lang === 'zh' ? ' ' : ' ') + r.c1 + (r.v1 ? ':' + r.v1 : '');
    if (r.c2 !== r.c1) s += '–' + r.c2 + (r.v2 ? ':' + r.v2 : '');
    else if (r.v2 && r.v2 !== r.v1) s += '–' + r.v2;
    return s;
  }
  function passage(bible, r) {
    var out = [];
    for (var c = r.c1; c <= r.c2; c++) {
      var ch = bible[r.b] && bible[r.b][c - 1]; if (!ch) continue;
      var from = (c === r.c1 && r.v1) ? r.v1 : 1;
      var to = (c === r.c2 && r.v2) ? r.v2 : ch.length;
      for (var v = from; v <= to && v <= ch.length; v++) out.push({ c: c, v: v, t: ch[v - 1] });
    }
    return out;
  }
  function passageHTML(verses, lang, multiChapter) {
    return '<div class="bible-text' + (lang === 'zh' ? ' zh' : '') + '">' + verses.map(function (x) {
      return '<span class="vs" data-act="bmkv" data-v="' + x.c + ':' + x.v + '"><span class="verse-num">' + (multiChapter && x.v === 1 ? x.c + ':' : '') + x.v + '</span>' + esc(x.t) + '</span> ';
    }).join('') + '</div>';
  }
  // Fill elements marked data-ref with scripture once the Bible file has loaded.
  function fillRefs(root) {
    var els = root.querySelectorAll('[data-ref]');
    els.forEach(function (el) {
      var lang = el.getAttribute('data-lang') || 'en';
      var r = parseRef(el.getAttribute('data-ref'));
      if (!r) { el.innerHTML = '<p class="muted">Could not read that reference.</p>'; return; }
      loadBible(lang).then(function (bible) {
        var vs = passage(bible, r);
        el.innerHTML = vs.length ? passageHTML(vs, lang, r.c2 !== r.c1) : '<p class="muted">No verses found.</p>';
        applyBmk(root, ui.bmkJump);
      }).catch(function () { el.innerHTML = '<p class="muted">The Bible text could not load. Open the app once with internet so it can be saved.</p>'; });
    });
  }

  // ---------- timer & chime ----------
  var audioCtx = null;
  function chime() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var t0 = audioCtx.currentTime;
      [659.25, 783.99, 1046.5].forEach(function (f, i) {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(audioCtx.destination);
        var s = t0 + i * 0.28; g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.35, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.9);
        o.start(s); o.stop(s + 1);
      });
    } catch (e) {}
  }
  function startTimer(id, mins) {
    try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {}
    if (ui.timer && ui.timer.id === id) { stopTimer(); return; }
    stopTimer();
    ui.timer = { id: id, end: Date.now() + mins * 60000, h: setInterval(tick, 1000) };
    ui.timer.secs = mins < 1;
    tick();
  }
  function stopTimer() { if (ui.timer) clearInterval(ui.timer.h); ui.timer = null; document.querySelectorAll('.timer.run').forEach(function (b) { b.classList.remove('run'); b.textContent = b.getAttribute('data-label'); }); }
  function tick() {
    if (!ui.timer) return;
    var left = Math.max(0, Math.round((ui.timer.end - Date.now()) / 1000));
    var b = document.querySelector('.timer[data-id="' + ui.timer.id + '"]');
    if (b) { b.classList.add('run'); b.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); }
    if (left <= 0) {
      var id = ui.timer.id; clearInterval(ui.timer.h); ui.timer = null; chime();
      if (b) { b.classList.remove('run'); b.textContent = '⏰ Done'; b.classList.add('ring'); setTimeout(function () { b.classList.remove('ring'); b.textContent = b.getAttribute('data-label'); }, 4000); }
    }
  }

  // ---------- weekly progress ----------
  // Daily items are done 5 times a week (any day, more than once a day is fine). Loop items once a week.
  function wkd(w) { return S.wk[w] || (S.wk[w] = {}); }
  function dList(w, id) { return wkd(w)[id] || []; }
  function dailyItems(key) { var out = []; C.lists[key].sections.forEach(function (s) { s.items.forEach(function (it) { if (!it.pick) out.push(it); }); }); return out; }
  function pickNotes(key) { var m = {}; C.lists[key].sections.forEach(function (s) { s.items.forEach(function (it) { if (it.pick) m[it.pick] = it; }); }); return m; }
  function weekStats(key, w) {
    var done = 0, total = 0;
    dailyItems(key).forEach(function (it) { total += 5; done += Math.min(5, dList(w, it.id).length); });
    var wd = weekDone(w);
    C.lists[key].loops.forEach(function (lk) { C.loops[lk].items.forEach(function (li) { total++; if (wd[li.id]) done++; }); });
    return { done: done, total: total };
  }
  function weekComplete(w) { return listsForProfile().every(function (k) { var st = weekStats(k, w); return st.done >= st.total; }); }
  function doneToday(id) { var d = cur(); return d ? dList(d.w, id).indexOf(d.n) >= 0 : false; }
  function addToday(id) {
    var d = cur(); if (!d) return false; var a = wkd(d.w)[id] || (wkd(d.w)[id] = []);
    if (a.length >= 5) { (POEM_TICKS[id] || []).forEach(function (k) { markRead(k, d.n); }); save(); toast('All 5 done this week' + ((POEM_TICKS[id] || []).length ? ' · poem marked as read' : '')); return false; }
    a.push(d.n); (POEM_TICKS[id] || []).forEach(function (k) { markRead(k, d.n); }); save(); poemLink(id); return true;
  }
  function removeAt(id, k) {
    var d = cur(); var a = wkd(d.w)[id] || []; var n = a.splice(k, 1)[0];
    if (n === d.n && a.indexOf(d.n) < 0) (POEM_TICKS[id] || []).forEach(function (pk) { var q = S.ptr[pk]; if (!q) return; q.readOn = null; q.readDate = null; var len = ptrLen(pk); var i = len ? ((q.i % len) + len) % len : q.i; if (q.log && q.log[i] === today()) delete q.log[i]; });
    save();
  }
  function todayCount(key) {
    var d = cur(); if (!d) return 0; var c = 0;
    dailyItems(key).forEach(function (it) { dList(d.w, it.id).forEach(function (n) { if (n === d.n) c++; }); });
    var wd = weekDone(d.w); C.lists[key].loops.forEach(function (lk) { C.loops[lk].items.forEach(function (li) { if (wd[li.id] === d.n) c++; }); });
    return c;
  }

  // ---------- render: shell ----------
  function render() {
    if (S.profile && ui.calReady) unifyPoems();
    document.body.classList.toggle('emily-mode', S.profile === 'emily');
    if (!S.profile) { app.innerHTML = welcomeHTML(); return; }
    var lists = listsForProfile();
    if (!ui.tab || (ui.tab !== 'week' && lists.indexOf(ui.tab) < 0)) ui.tab = lists[0];
    autoStart();
    var day = cur(), offToday = calOn() && !calInfo(today()).school;
    var html = '<header class="top">' + topHTML(day, lists) + '</header><main>';
    if (!day) html += offToday ? holidayBanner(null) : startHTML();
    else {
      if (day.date !== today() && S.keepDay !== today()) html += offToday ? holidayBanner(day) : newDayBanner(day);
      else html += autoNoteBanner(day);
      html += ui.tab === 'week' ? weekHTML() : listHTML(ui.tab, day.w, false);
    }
    html += '</main><footer class="brand">' + esc(C.meta.brand) + '</footer>';
    app.innerHTML = html;
    if (ui.timer) tick();
    if (ui.sheet && !document.querySelector('.scrim')) openSheet(ui.sheet, ui.sheetArg, true);
  }

  function welcomeHTML() {
    return '<div class="welcome" style="padding-top:24px"><h1 style="font-family:var(--f-display);font-size:34px;margin:0">Our School Days</h1>' +
      '<p class="muted" style="margin:0;max-width:60ch">Which list lives on this iPad? You can change this later under ⚙︎.</p>' +
      '<div class="who-pick">' + profileButtons() + '</div></div>' +
      '<footer class="brand">' + esc(C.meta.brand) + '</footer>';
  }
  function profileButtons() {
    return [['emma', 'Emma', "Emma's list"], ['emily', 'Emily', "Emily's list"], ['together', 'Together', 'The Together list, on a shared iPad'], ['all', 'Everything', 'All three lists, for Mum\'s phone or iPad']].map(function (o) {
      var c = o[0] === 'all' ? 'ink' : o[0];
      return '<button data-act="setprofile" data-v="' + o[0] + '" style="border-color:var(--' + c + ')' + (S.profile === o[0] ? ';border-width:3px' : '') + '"><b style="color:var(--' + c + ')">' + o[1] + (S.profile === o[0] ? ' ✓' : '') + '</b><span class="muted">' + o[2] + '</span></button>';
    }).join('');
  }

  function topHTML(day, lists) {
    var whoVar = ui.tab === 'week' ? 'var(--ink)' : 'var(--' + whoOf(ui.tab) + ')';
    document.documentElement.style.setProperty('--who', whoVar);
    var title = day ? 'Week ' + day.w : 'Ready to begin';
    var tw = termWeekOf(day);
    var sub = day ? (tw ? (tw.term.name || 'Term') + ', week ' + tw.week + ' · ' : '') + 'Day ' + day.n + ' · school day ' + dayInWeek(day) + ' of this week · ' + fmtDate(day.date) : 'Nothing recorded yet';
    var pct = 0;
    if (day && ui.tab !== 'week') {
      var st = weekStats(ui.tab, day.w); pct = st.total ? Math.round(st.done / st.total * 100) : 0;
      sub += ' · ' + st.done + ' of ' + st.total + ' this week · ' + todayCount(ui.tab) + ' today';
    }
    var tabs = (lists.length > 1 ? lists.map(function (k) { return '<button class="tab ' + C.lists[k].who + '" role="tab" aria-selected="' + (ui.tab === k) + '" data-act="tab" data-v="' + k + '">' + esc(C.lists[k].name) + '</button>'; }).join('') :
      '<button class="tab ' + C.lists[lists[0]].who + '" role="tab" aria-selected="' + (ui.tab === lists[0]) + '" data-act="tab" data-v="' + lists[0] + '">' + esc(C.lists[lists[0]].name) + '</button>') +
      '<button class="tab week" role="tab" aria-selected="' + (ui.tab === 'week') + '" data-act="tab" data-v="week">Past weeks</button>';
    return '<div class="toprow"><div class="dayline"><h1>' + title + '</h1><span class="sub">' + esc(sub) + '</span></div>' +
      '<button class="iconbtn" data-act="sheet" data-v="settings" aria-label="Grown-ups">⚙︎</button></div>' +
      '<div class="tabs" role="tablist">' + tabs + '</div>' +
      (day && ui.tab !== 'week' ? '<div class="progress" aria-hidden="true"><i style="width:' + pct + '%"></i></div>' : '');
  }

  function startHTML() {
    var Y = window.SDsync, st = Y && Y.status();
    var warn = st && st.available && !st.user ? '<div class="banner" style="border-color:var(--warn)"><p><b>Used the app before?</b> This device is not signed in to the family account, so it is starting empty. Tap ⚙︎ and sign in first — your days, poems and progress come back from the family account. (Opening the app in Safari instead of from its Home Screen icon also starts empty.)</p><button class="btn" data-act="sheet" data-v="settings">Sign in</button></div>' : '';
    if (calOn()) { var nx0 = calInfo(today()).school ? today() : nextSchoolDate(today()); return warn + '<div class="banner"><p><b>' + (nx0 === today() ? 'Today is the first school day.' : 'The first school day is ' + esc(termLabel(nx0)) + '.') + '</b> It starts by itself.</p><button class="btn" data-act="startday">Start Day 1 now</button></div>'; }
    return warn + '<div class="banner"><p><b>Start your first school day.</b> The app counts school days, not dates, so travel and breaks never put you behind. Each week\'s work is on one page; finish it early and the next week starts.</p><button class="btn" data-act="startday">Start Day 1</button></div>';
  }
  // The Monday of the calendar week a date falls in, so a break that crosses a weekend can start a fresh week.
  function mondayOf(iso) { var p = String(iso || '').split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]); if (isNaN(d)) return ''; d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }
  function newCalWeek(day) { return !!day && mondayOf(day.date) !== mondayOf(today()); }
  // ---------- school calendar: terms, holidays and days off; school days start by themselves ----------
  // S.cal = { on, wd: [1..5], terms: { id: { name, s, e } }, off: { id: { s, e, why } } }, dates as YYYY-MM-DD.
  function isoD(iso) { var p = String(iso).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function isoOf(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function isoAdd(iso, n) { var d = isoD(iso); d.setDate(d.getDate() + n); return isoOf(d); }
  function calObj() { S.cal = S.cal || {}; var c = S.cal; c.terms = c.terms || {}; c.off = c.off || {}; if (!c.wd) c.wd = [1, 2, 3, 4, 5]; return c; }
  function calTerms() { var c = S.cal || {}, T = c.terms || {}; return Object.keys(T).map(function (id) { return { id: id, name: T[id].name || '', s: T[id].s, e: T[id].e }; }).filter(function (t) { return t.s && t.e; }).sort(function (a, b) { return a.s < b.s ? -1 : 1; }); }
  function calOffs() { var O = (S.cal || {}).off || {}; return Object.keys(O).map(function (id) { return { id: id, s: O[id].s, e: O[id].e || O[id].s, why: O[id].why || '' }; }).filter(function (o) { return o.s; }).sort(function (a, b) { return a.s < b.s ? -1 : 1; }); }
  function calOn() { return !!(S.cal && S.cal.on && calTerms().length); }
  function calWd() { var w = (S.cal && S.cal.wd) || [1, 2, 3, 4, 5]; return Array.isArray(w) ? w : Object.keys(w).map(Number); }
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function calInfo(iso) {
    var term = calTerms().filter(function (t) { return t.s <= iso && iso <= t.e; })[0] || null;
    var off = calOffs().filter(function (o) { return o.s <= iso && iso <= o.e; })[0] || null;
    var wday = calWd().indexOf(isoD(iso).getDay()) >= 0;
    var why = !term ? 'holiday' : off ? 'off' : !wday ? 'weekend' : '';
    return { term: term, off: off, wday: wday, school: !why, why: why };
  }
  function nextSchoolDate(from) { for (var i = 1; i < 400; i++) { var d = isoAdd(from, i); if (calInfo(d).school) return d; } return null; }
  // Which week of its term a school day falls in: the number of different curriculum weeks used in the term so far.
  function termWeekOf(day) {
    if (!calOn() || !day) return null;
    var t = calInfo(day.date).term; if (!t) return null;
    var ws = {}; S.days.forEach(function (d) { if (d.date >= t.s && d.date <= day.date && d.n <= day.n) ws[d.w] = 1; });
    return { term: t, week: Object.keys(ws).length };
  }
  // On a school day, today's school day starts by itself. A new calendar week (Monday, or the first day back
  // after a break) begins the next week of work.
  function autoStart() {
    if (!calOn() || !ui.calReady) return false;
    var t = today(), last = cur();
    if (last && last.date >= t) return false;
    if (S.keepDay === t) return false;
    if (!calInfo(t).school) return false;
    var w = 1;
    if (last) w = S.stayWeek ? last.w : (S.forceNewWeek || mondayOf(last.date) !== mondayOf(t)) ? last.w + 1 : last.w;
    S.stayWeek = false; S.forceNewWeek = false; S.keepDay = null;
    S.days.push({ n: last ? last.n + 1 : 1, w: w, date: t, ticks: {}, picks: {}, auto: 1 });
    ui.autoNote = t;
    save();
    return true;
  }
  function dropLastDay() { var gone = S.days.pop(); if (gone) Object.keys(S.weeks[gone.w] || {}).forEach(function (id) { if (S.weeks[gone.w][id] === gone.n) delete S.weeks[gone.w][id]; }); return gone; }
  function dayHasWork(d) { return Object.keys(d.ticks || {}).length || Object.keys(d.picks || {}).some(function (k) { return (d.picks[k] || []).length; }); }
  function whyText(ci) {
    if (ci.why === 'holiday') return 'It’s the school holidays.';
    if (ci.why === 'off') return 'Today is a day off' + (ci.off.why ? ': ' + ci.off.why : '') + '.';
    return 'There’s no school on ' + ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'][isoD(today()).getDay()] + '.';
  }
  function termLabel(iso) { var n = nextSchoolDate(isoAdd(iso, -1)); if (!n) return ''; var ci = calInfo(n); return fmtDate(n) + (ci.term && ci.term.name ? ' (' + ci.term.name + ')' : ''); }
  // Shown on a day the calendar says is not a school day.
  function holidayBanner(day) {
    var ci = calInfo(today()), nx = nextSchoolDate(today());
    return '<div class="banner"><p><b>' + esc(whyText(ci)) + '</b>' + (nx ? ' The next school day is ' + esc(termLabel(nx)) + '; it starts by itself.' : '') + '</p><div class="btns">' +
      '<button class="btn ghost" data-act="startday">Do a school day today anyway</button>' +
      (day ? '<button class="btn ghost" data-act="keepday">Look at Day ' + day.n + '</button>' : '') + '</div></div>';
  }
  // After a day starts by itself: say so, and offer the choices a grown-up might want.
  function autoNoteBanner(day) {
    if (!day || !day.auto || day.date !== today() || S.calNoteSeen === today()) return '';
    var prev = S.days[S.days.length - 2], tw = termWeekOf(day), fresh = prev && prev.w !== day.w;
    return '<div class="banner"><p><b>Day ' + day.n + ' started by itself</b> · Week ' + day.w + (tw ? ' (' + esc(tw.term.name || 'this term') + ', week ' + tw.week + ')' : '') + '.</p><div class="btns">' +
      '<button class="btn small" data-act="calnoteok">OK</button>' +
      (fresh && !dayHasWork(day) ? '<button class="btn ghost small" data-act="calstay">Stay on Week ' + prev.w + ' instead</button>' : '') +
      (!dayHasWork(day) ? '<button class="btn ghost small" data-act="caltodayoff">Take today off</button>' : '') + '</div></div>';
  }
  function calCardHTML() {
    var c = S.cal || {}, T = calTerms(), O = calOffs(), wd = calWd(), on = !!c.on;
    var h = '<div class="card"><h3>School calendar</h3><p class="small muted" style="margin:0 0 8px">Put in your terms. On a school day the app starts the day by itself, and the first school day of each calendar week starts the next week of work. Holidays and days off are skipped.</p>' +
      '<div class="btns"><button class="btn ' + (on ? '' : 'ghost ') + 'small" data-act="calon">' + (on ? '✓ Days start by themselves' : 'Start days by themselves') + '</button></div>' +
      '<p class="small" style="margin:10px 0 4px"><b>School days of the week</b></p><div class="seg">' + [1, 2, 3, 4, 5, 6, 0].map(function (d) { return '<button data-act="calwd" data-v="' + d + '" aria-pressed="' + (wd.indexOf(d) >= 0) + '">' + DOW[d] + '</button>'; }).join('') + '</div>' +
      '<p class="small" style="margin:12px 0 4px"><b>Terms</b></p>';
    var Tall = Object.keys(c.terms || {}).map(function (id) { return { id: id, name: c.terms[id].name || '', s: c.terms[id].s || '', e: c.terms[id].e || '' }; }).sort(function (a, b) { return (a.s || '9') < (b.s || '9') ? -1 : 1; });
    h += Tall.length ? Tall.map(function (t, i) {
      var bad = t.s && t.e && t.e < t.s, next = Tall[i + 1], clash = next && next.s && t.e && next.s <= t.e;
      var wks = t.s && t.e && !bad ? Math.round((isoD(t.e) - isoD(t.s)) / 864e5 / 7 + 0.4) : 0;
      return '<div class="cal-row"><input type="text" data-calf="terms|' + t.id + '|name" value="' + esc(t.name) + '" placeholder="Term name" style="flex:1 1 120px">' +
        '<label class="small">from <input type="date" data-calf="terms|' + t.id + '|s" value="' + esc(t.s) + '"></label><label class="small">to <input type="date" data-calf="terms|' + t.id + '|e" value="' + esc(t.e) + '"></label>' +
        '<span class="small muted">' + (wks ? 'about ' + wks + ' weeks' : '') + '</span>' +
        '<span class="btns" style="margin:0"><button class="btn ghost small" data-act="calext" data-v="' + t.id + '">Extend a week</button><button class="btn ghost small" data-act="calrmterm" data-v="' + t.id + '">' + (ui.calRm === t.id ? 'Tap again to delete' : 'Delete') + '</button></span>' +
        (bad ? '<p class="small" style="color:var(--warn);margin:0;flex-basis:100%">The end is before the start.</p>' : '') + (clash ? '<p class="small" style="color:var(--warn);margin:0;flex-basis:100%">This term runs into ' + esc(next.name || 'the next term') + '.</p>' : '') + '</div>' +
        (next && t.e && next.s && next.s > isoAdd(t.e, 1) ? '<p class="small muted cal-break">Holiday · ' + esc(fmtDate(isoAdd(t.e, 1))) + ' to ' + esc(fmtDate(isoAdd(next.s, -1))) + '</p>' : '');
    }).join('') : '<p class="small muted" style="margin:0">No terms yet.</p>';
    h += '<div class="btns"><button class="btn small" data-act="caladdterm">＋ Add a term</button></div>';
    h += '<p class="small" style="margin:14px 0 4px"><b>Extra days off</b> <span class="muted">(public holidays, trips, a sick day)</span></p>' +
      (O.length ? O.map(function (o) {
        return '<div class="cal-row"><input type="text" data-calf="off|' + o.id + '|why" value="' + esc(o.why) + '" placeholder="What for?" style="flex:1 1 120px"><label class="small">from <input type="date" data-calf="off|' + o.id + '|s" value="' + esc(o.s) + '"></label><label class="small">to <input type="date" data-calf="off|' + o.id + '|e" value="' + esc(o.e) + '"></label>' +
          '<button class="btn ghost small" data-act="calrmoff" data-v="' + o.id + '">' + (ui.calRm === o.id ? 'Tap again to delete' : 'Delete') + '</button></div>';
      }).join('') : '<p class="small muted" style="margin:0">None.</p>') +
      '<div class="btns"><button class="btn small" data-act="caladdoff">＋ Add days off</button></div>';
    if (on && T.length) { var nx = calInfo(today()).school ? today() : nextSchoolDate(today()); h += '<p class="small" style="margin:10px 0 0">' + (nx === today() ? 'Today is a school day.' : nx ? 'Next school day: ' + esc(termLabel(nx)) + '.' : 'No school days ahead; add the next term.') + '</p>'; }
    return h + '</div>';
  }
  function calAct(act, v) {
    var c = calObj(), id;
    switch (act) {
      case 'calon': c.on = !c.on; save(); if (c.on) { ui.calReady = true; autoStart(); } render(); refreshSheet(); break;
      case 'calwd': var wd = calWd().slice(), d = +v, i = wd.indexOf(d); if (i >= 0) wd.splice(i, 1); else wd.push(d); c.wd = wd.sort(); save(); refreshSheet(); break;
      case 'caladdterm':
        var T = calTerms(), last = T[T.length - 1], s = last ? isoAdd(last.e, 1) : today();
        while (isoD(s).getDay() !== 1) s = isoAdd(s, 1);
        c.terms['t' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)] = { name: 'Term ' + (Object.keys(c.terms).length + 1), s: s, e: isoAdd(s, 7 * 10 - 3) }; save(); refreshSheet(); break;
      case 'calext': if (c.terms[v] && c.terms[v].e) { c.terms[v].e = isoAdd(c.terms[v].e, 7); save(); toast('Extended to ' + fmtDate(c.terms[v].e)); refreshSheet(); render(); } break;
      case 'caladdoff': c.off['o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)] = { s: today(), e: today(), why: '' }; save(); refreshSheet(); break;
      case 'calrmterm': case 'calrmoff':
        if (ui.calRm !== v) { ui.calRm = v; refreshSheet(); return; }
        ui.calRm = null; delete c[act === 'calrmterm' ? 'terms' : 'off'][v]; save(); refreshSheet(); render(); break;
      case 'calnoteok': S.calNoteSeen = today(); save(); render(); break;
      case 'calstay':
        var day = cur(), prev = S.days[S.days.length - 2];
        if (day && prev && !dayHasWork(day)) { day.w = prev.w; S.calNoteSeen = today(); save(); toast('Staying on Week ' + prev.w); render(); }
        break;
      case 'caltodayoff':
        var dd = cur();
        if (dd && dd.date === today() && !dayHasWork(dd)) dropLastDay();
        id = 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); c.off[id] = { s: today(), e: today(), why: 'Day off' }; save(); toast('Today is a day off'); render(); break;
    }
  }
  function newDayBanner(day) {
    var used = S.days.filter(function (d) { return d.w === day.w; }).length;
    var complete = weekComplete(day.w);
    var nextWeek = S.forceNewWeek || complete || used >= 5;
    if (!nextWeek && newCalWeek(day)) {
      return '<div class="banner"><p>Last school day was Day ' + day.n + ' (' + esc(fmtDate(day.date)) + '), in an earlier week. Today can begin a fresh week, or carry on with what is left of Week ' + day.w + '.</p><div class="btns">' +
        '<button class="btn" data-act="startweek">Start Week ' + (day.w + 1) + ' · Day ' + (day.n + 1) + '</button>' +
        '<button class="btn ghost" data-act="startday">Day ' + (day.n + 1) + ', carry on Week ' + day.w + ' (school day ' + (used + 1) + ')</button>' +
        '<button class="btn ghost" data-act="keepday">Keep working on Day ' + day.n + '</button></div></div>';
    }
    var msg = complete ? 'Week ' + day.w + ' is all done. Well done!' : (used >= 5 ? 'Five school days of Week ' + day.w + ' are used.' : 'Last school day was Day ' + day.n + ' (' + esc(fmtDate(day.date)) + ').');
    return '<div class="banner"><p>' + msg + '</p><div class="btns"><button class="btn" data-act="startday">Start Day ' + (day.n + 1) + (nextWeek ? ' · Week ' + (day.w + 1) : '') + '</button>' +
      (used >= 5 && !complete ? '<button class="btn ghost" data-act="stayweek">Day ' + (day.n + 1) + ', finish Week ' + day.w + '</button>' : '') +
      '<button class="btn ghost" data-act="keepday">Keep working on Day ' + day.n + '</button></div></div>';
  }

  function allDaily(listKey) { var out = []; C.lists[listKey].sections.forEach(function (s) { out = out.concat(s.items); }); return out; }

  // ---------- render: a week's list on one page ----------
  function isMomName(n) { return /with mom/i.test(n); }
  function listHTML(key, w, readonly) {
    var L = C.lists[key]; var d = cur();
    var html = '';
    if (!readonly && weekComplete(w) && d && d.w === w) html += '<div class="banner"><p><b>Everything for Week ' + w + ' is done!</b> Start the next week whenever you are ready.</p><button class="btn" data-act="startday">Start Week ' + (w + 1) + '</button></div>';
    var notes = pickNotes(key);
    function secHTML(sec) {
      var items = sec.items.filter(function (it) { return !it.pick; }); if (!sec.items.length) return '';
      var done = items.reduce(function (t, it) { return t + Math.min(5, dList(w, it.id).length); }, 0);
      var h = '<section class="section"><h2>' + esc(sec.name) + '<small>5 times each · ' + done + '/' + (items.length * 5) + '</small></h2><div class="rows">';
      sec.items.forEach(function (it) { h += it.pick ? pickRowHTML(it, w) : dailyRowHTML(it, w, readonly); });
      return h + '</div></section>';
    }
    function loopHTML(lk) {
      var Lp = C.loops[lk]; var wd = weekDone(w); var pn = notes[lk];
      var done = Lp.items.filter(function (i) { return wd[i.id]; }).length;
      var hint = [];
      if (pn) hint.push((Lp.items.length === pn.n * 5 ? pn.n + ' a day' : 'about ' + (pn.n === 1 ? 'one' : 'two') + ' a day') + (pn.note ? ', ' + pn.note : ''));
      if (Lp.note) hint.push(Lp.note);
      if (Lp.narration) hint.push('written so far: ' + Lp.items.filter(function (i) { return S.narrWritten[w + ':' + i.id]; }).length);
      var h = '<section class="section" id="loop-' + lk + '"><h2>' + esc(Lp.name) + '<small>' + done + '/' + Lp.items.length + '</small></h2>' + (hint.length ? '<p class="small muted" style="margin:-4px 0 8px">' + esc(hint.join(' · ')) + '</p>' : '') + '<div class="rows">';
      var order = Lp.items.slice(); if (!readonly) order.sort(function (a, b) { var fa = !wd[a.id] && slipFlag(a.id, w, true) ? 1 : 0, fb = !wd[b.id] && slipFlag(b.id, w, true) ? 1 : 0; return fb - fa || Lp.items.indexOf(a) - Lp.items.indexOf(b); });
      order.forEach(function (li) { h += loopRowHTML(li, w, Lp, readonly); });
      return h + '</div></section>';
    }
    var own = L.sections.filter(function (s) { return !isMomName(s.name); }), mom = L.sections.filter(function (s) { return isMomName(s.name); });
    var ownLoops = L.loops.filter(function (lk) { return !isMomName(C.loops[lk].name); }), momLoops = L.loops.filter(function (lk) { return isMomName(C.loops[lk].name); });
    own.forEach(function (s) { html += secHTML(s); });
    ownLoops.forEach(function (lk) { html += loopHTML(lk); });
    if (mom.length || momLoops.length) {
      html += '<div class="mom-divider"><span>With Mum</span><p class="small muted" style="margin:4px 0 0">Do these when Mum is free. Everything above you can do on your own.</p></div>';
      mom.forEach(function (s) { html += secHTML(s); });
      momLoops.forEach(function (lk) { html += loopHTML(lk); });
    }
    return html;
  }

  function peekFor(it) {
    if (!it.open) return '';
    var o = it.open;
    try {
      if (o === 'poem:emma' || o === 'poem:emily') { var who = o.split(':')[1]; var P = C.poets[who]; var p = ptr('poem_' + who); return P.poems[p.i % P.poems.length].title; }
      if (o === 'poem:together') { var a = C.poets.emma.poems[ptr('poem_emma').i % C.poets.emma.poems.length].title, b = C.poets.emily.poems[ptr('poem_emily').i % C.poets.emily.poems.length].title; return a + ' · ' + b; }
      if (o === 'chinese') { var cp = C.chinese.poems[(S.ptr.chinese ? S.ptr.chinese.i : 0) % C.chinese.poems.length]; return cp.title + ' · ' + C.chinese.poet.split(' ')[0]; }
      if (o === 'bible') { var ot = bibleLesson('ot'), nt = bibleLesson('nt'); return (ot ? 'OT ' + ot.n : 'OT done') + ' · ' + (nt ? 'NT ' + nt.n : 'NT done'); }
      if (o.indexOf('song:') === 0) { var s = currentSong(o.split(':')[1]); return s ? s.title : ''; }
      if (o === 'dance') return 'Next: ' + C.dance.folk.list[(S.ptr.dance ? S.ptr.dance.i : 0) % C.dance.folk.list.length];
      if (o === 'solfa') return C.solfa.unit + ' · ' + C.solfa.lessons[Math.min((S.ptr.solfa ? S.ptr.solfa.i : 0), C.solfa.lessons.length - 1)];
      if (o === 'picture') { var pi = (S.ptr.picture ? S.ptr.picture.i : 0) % C.pictures.list.length; return C.pictures.list[pi].title; }
      if (o === 'music') { var mi = (S.ptr.music ? S.ptr.music.i : 0) % C.music.list.length; return C.music.list[mi].split(' (')[0]; }
      if (o === 'verses') { var n = scmCount(); return n ? n + ' card' + (n > 1 ? 's' : '') + ' to say today' : 'Open the verse box'; }
      if (o.indexOf('recite:') === 0) { var rp = o.split(':'); var rt = reciteToday(rp[1], rp[2]); return rt ? 'Today: ' + rt.title : ''; }
      if (o === 'tiktok') return 'Ideas to try';
      if (o === 'stretch') return C.stretch.steps.length + ' stretches, step by step';
      if (o.indexOf('reading:') === 0) { var R = C.readings[o.split(':')[1]]; if (R.pending) return R.book; var ri = readingIndex(o.split(':')[1]); return R.contents[ri]; }
      if (o.indexOf('book:') === 0) return bookPeek(o.split(':')[1]);
      if (o === 'drawing') return 'Drawing record';
      if (o.indexOf('math:') === 0) return mtPeek(o.split(':')[1]);
      if (o.indexOf('num:') === 0) return nmPeek(o.split(':')[1]);
      if (o.indexOf('numq:') === 0) return nmQPeek(o.split(':')[1]);
      if (o === 'rd' || o === 'rd:emma') return rdPeekFor(o === 'rd:emma' ? 'emma' : 'emily');
    } catch (e) {}
    return '';
  }

  function labelPart(it, act, extra) {
    var meta = []; if (it.mins) meta.push(it.mins + ' min'); if (it.note) meta.push(it.note);
    var peek = peekFor(it);
    return '<span class="emoji" aria-hidden="true">' + esc(it.icon || '') + '</span>' +
      '<button class="lbl" ' + act + '><b>' + esc(it.label) + (it.open ? ' <span class="open-hint" aria-hidden="true">›</span>' : '') + '</b>' +
      (meta.length ? '<span class="meta">' + esc(meta.join(' · ')) + '</span>' : '') + (peek ? '<span class="peek">' + esc(peek) + '</span>' : '') + (extra || '') + '</button>';
  }
  function timerPart(it) { return it.mins ? '<button class="timer" data-act="timer" data-id="' + it.id + '" data-mins="' + it.mins + '" data-label="⏱ ' + it.mins + '">⏱ ' + it.mins + '</button>' : '<span class="timer ph" aria-hidden="true">⏱ 30</span>'; }

  function dailyRowHTML(it, w, readonly) {
    var a = dList(w, it.id); var d = cur(); var full = a.length >= 5;
    var boxes = '<span class="boxes" role="group" aria-label="' + a.length + ' of 5 done">';
    for (var k = 0; k < 5; k++) {
      var n = a[k];
      boxes += readonly ? '<span class="box' + (n ? ' f' : '') + '">' + (n ? '✓' : '') + '</span>'
        : '<button class="box' + (n ? ' f' : '') + (n && d && n === d.n ? ' t' : '') + '" data-act="box" data-v="' + it.id + '" data-k="' + k + '" aria-label="' + (n ? 'Undo, done on day ' + n : 'Mark done') + '">' + (n ? '✓' : '') + '</button>';
    }
    boxes += '</span>';
    var act = readonly ? 'disabled' : (it.open ? 'data-act="sheet" data-v="' + it.open + '" data-tick="' + it.id + '"' : 'data-act="addday" data-v="' + it.id + '"');
    var slip = !readonly && a.length < 3 ? slipFlag(it.id, w, false) : 0;
    return '<div class="row' + (full ? ' done' : '') + (slip ? ' slipping' : '') + '">' + labelPart(it, act, slipHTML(slip, false)) + boxes + (readonly ? '' : timerPart(it)) + '</div>';
  }

  // A daily row for a loop: it ticks itself, one box for every n loop items done this week.
  function pickRowHTML(it, w) {
    var Lp = C.loops[it.pick]; var wd = weekDone(w); var d = cur();
    var doneIds = Lp.items.filter(function (li) { return wd[li.id]; });
    var checks = Math.min(5, Math.floor(doneIds.length / it.n));
    var todayN = d && d.w === w ? doneIds.filter(function (li) { return wd[li.id] === d.n; }).length : 0;
    var boxes = '<span class="boxes auto" aria-label="' + checks + ' of 5 done">';
    var before = Math.min(5, Math.floor((doneIds.length - todayN) / it.n));
    for (var k = 0; k < 5; k++) boxes += '<span class="box' + (k < checks ? ' f' : '') + (k >= before && k < checks ? ' t' : '') + '">' + (k < checks ? '✓' : '') + '</span>';
    boxes += '</span>';
    var meta = [];
    if (it.mins) meta.push(it.mins + ' min');
    meta.push(todayN ? todayN + ' done today' : 'ticks itself');
    return '<div class="row' + (checks >= 5 ? ' done' : '') + '"><span class="emoji" aria-hidden="true">' + esc(it.icon || '') + '</span>' +
      '<button class="lbl" data-act="toloop" data-v="' + it.pick + '"><b>' + esc(it.label) + ' <span class="open-hint" aria-hidden="true">↓</span></b><span class="meta">' + esc(meta.join(' · ')) + '</span></button>' + boxes + timerPart(it) + '</div>';
  }

  function loopRowHTML(li, w, Lp, readonly) {
    var wd = weekDone(w); var on = !!wd[li.id];
    var extra = on ? '<span class="meta">Done on day ' + wd[li.id] + (S.narrWritten[w + ':' + li.id] ? ' · ✍️ written' : '') + '</span>' : (readonly ? '' : slipHTML(slipFlag(li.id, w, true), true));
    var act = readonly ? 'disabled' : (li.open ? 'data-act="sheet" data-v="' + li.open + '"' : 'data-act="loopdone" data-v="' + li.id + '"');
    return '<div class="row' + (on ? ' done' : '') + (!on && !readonly && slipFlag(li.id, w, true) ? ' slipping' : '') + '">' +
      (readonly ? '<span class="check">' + (on ? '✓' : '') + '</span>' : '<button class="check" data-act="loopdone" data-v="' + li.id + '" aria-pressed="' + on + '" aria-label="Done: ' + esc(li.label) + '">✓</button>') +
      labelPart(li, act, extra) +
      (!readonly && Lp.narration && on ? '<button class="btn small' + (S.narrWritten[w + ':' + li.id] ? '' : ' ghost') + '" data-act="written" data-v="' + li.id + '">' + (S.narrWritten[w + ':' + li.id] ? '✍️ Written' : 'Written?') + '</button>' : '') +
      (!readonly && Lp.narration ? '<button class="btn ghost small" data-act="sheet" data-v="narr:' + li.id + '" aria-label="Narrate: ' + esc(li.label) + '">🎙</button>' : '') +
      (readonly ? '' : timerPart(li)) + '</div>';
  }

  // ---------- render: past weeks ----------
  function weekHTML() {
    var maxW = cur() ? cur().w : 1;
    var w = ui.weekView || Math.max(1, maxW - 1) ;
    if (w > maxW) w = maxW;
    var days = S.days.filter(function (d) { return d.w === w; });
    var html = '<div class="nav"><button class="btn ghost small" data-act="weeknav" data-v="' + (w - 1) + '"' + (w <= 1 ? ' disabled' : '') + '>‹ Week ' + (w - 1) + '</button><h2 style="margin:0;font-family:var(--f-display)">Week ' + w + '</h2><button class="btn ghost small" data-act="weeknav" data-v="' + (w + 1) + '"' + (w >= maxW ? ' disabled' : '') + '>Week ' + (w + 1) + ' ›</button></div>';
    if (!days.length) return html + '<p class="empty">No school days recorded in this week yet.</p>';
    html += '<p class="small muted" style="margin:0">School days ' + days.map(function (d) { return d.n + ' (' + fmtDate(d.date) + ')'; }).join(', ') + '</p>';
    listsForProfile().forEach(function (k) {
      var st = weekStats(k, w);
      html += '<section class="section card" style="--who:var(--' + C.lists[k].who + ')"><h3 style="color:var(--who)">' + esc(C.lists[k].name) + ' · ' + st.done + ' of ' + st.total + '</h3>' + listHTML(k, w, true) + '</section>';
    });
    return html;
  }

  // ---------- sheets ----------
  function openSheet(name, arg, rerender) {
    ui.sheet = name; ui.sheetArg = arg || null;
    var r = sheetContent(name, arg);
    var scrim = document.querySelector('.scrim');
    var keepScroll = 0;
    if (scrim) { var sb = scrim.querySelector('.sheet-body'); keepScroll = sb ? sb.scrollTop : 0; scrim.remove(); }
    scrim = document.createElement('div'); scrim.className = 'scrim'; scrim.setAttribute('data-act', 'scrim');
    var whoVar = r.who ? 'var(--' + r.who + ')' : getComputedStyle(document.documentElement).getPropertyValue('--who');
    scrim.innerHTML = '<div class="sheet' + (r.wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(r.title) + '" style="--who:' + whoVar + '"><div class="sheet-head"><h2>' + r.title + '</h2><button class="iconbtn" data-act="close" aria-label="Close">✕</button></div><div class="sheet-body">' + r.body + '</div></div>';
    document.body.appendChild(scrim);
    var body = scrim.querySelector('.sheet-body');
    if (rerender) body.scrollTop = keepScroll;
    ui.bmkJump = !rerender && name === 'bible';
    fillRefs(body);
    if (ui.bmkJump) setTimeout(function () { applyBmk(body, true); ui.bmkJump = false; }, 600);
  }
  function closeSheet() { ui.pin = null; ui.selOpen = null; ui.sheet = null; ui.sheetArg = null; var s = document.querySelector('.scrim'); if (s) s.remove(); render(); }
  function refreshSheet(top) { if (!ui.sheet) return; openSheet(ui.sheet, ui.sheetArg, true); if (top) { var b = document.querySelector('.sheet-body'); if (b) b.scrollTop = 0; var sh = document.querySelector('.sheet'); if (sh) sh.scrollTop = 0; var sc = document.querySelector('.scrim'); if (sc) sc.scrollTop = 0; } }

  function tickButton(tickId, labelDone, labelTodo) {
    var d = cur(); if (!d || !tickId) return '';
    var on = doneToday(tickId); var cnt = dList(d.w, tickId).length;
    return '<button class="btn' + (on ? ' ghost' : '') + '" data-act="tick" data-v="' + tickId + '" data-stay="1">' + (on ? '✓ ' + labelDone + ' (' + cnt + ' of 5 this week)' : labelTodo) + '</button>';
  }

  function sheetContent(name, arg) {
    var tickId = arg && arg.tick;
    var parts = name.split(':');
    switch (parts[0]) {
      case 'poem': return poemSheet(parts[1], tickId);
      case 'chinese': return chineseSheet(tickId);
      case 'bible': return bibleSheet(tickId);
      case 'recite': return reciteSheet(parts[1], tickId, parts[2]);
      case 'reciteone': return reciteOneSheet(parts[1], parts.length > 3 ? parts[2] : '', parts[parts.length - 1], tickId);
      case 'song': return songSheet(parts[1]);
      case 'dance': return danceSheet();
      case 'tiktok': return tiktokSheet();
      case 'solfa': return solfaSheet();
      case 'picture': return pictureSheet();
      case 'music': return musicSheet();
      case 'drawing': return drawingSheet();
      case 'verses': return versesSheet(tickId);
      case 'stretch': return stretchSheet(tickId);
      case 'century': return centurySheet();
      case 'service': return serviceSheet();
      case 'needle': case 'clay': case 'sloyd': case 'brush': return lessonsSheet(parts[0]);
      case 'reading': return readingSheet(parts[1]);
      case 'book': return bookSheet(parts[1]);
      case 'pick': return pickSheet(arg.pick, arg.list);
      case 'settings': return settingsSheet();
      case 'pin': return pinSheet();
      case 'rd': return rdSheet(tickId, parts[1]);
      case 'math': return mtSheet(tickId, parts[1]);
      case 'num': return nmSheet(tickId, parts[1]);
      case 'numq': return nqSheet(tickId, parts[1]);
      case 'zi': return ziSheet(tickId, parts[1]);
      case 'narr': return narrSheet(name.slice(5), arg && arg.label);
      case 'copy': return copySheet(parts[1], tickId);
      case 'links': return linksSheet(parts[1]);
      case 'dict': return dictSheet(tickId);
      case 'cwpick': return cwPickSheet(name.slice(7));
      case 'ms': return { title: 'Bahasa Melayu', who: 'together', wide: true, body: '<iframe class="ms-frame" src="malay.html" title="Jom Cakap Melayu"></iframe>' };
    }
    return { title: '', body: '' };
  }

  function poemCard(who, key, label) {
    var P = C.poets[who]; var p = ptr(key); var i = ((p.i % P.poems.length) + P.poems.length) % P.poems.length; var poem = P.poems[i];
    return '<div class="card" style="--who:var(--' + who + ')"><div class="kicker">' + esc(label || P.poet) + ' · poem ' + (i + 1) + ' of ' + P.poems.length + '</div><h3>' + esc(poem.title) + '</h3>' +
      '<div class="poem">' + esc(poem.text) + '</div><div class="btns" style="margin-top:8px">' + cwBtn('poem:' + who + ':' + i) + '</div><div class="nav" style="margin-top:12px"><button class="btn ghost small" data-act="ptr" data-k="' + key + '" data-d="-1">‹ Previous</button><span class="small muted">' + (p.readOn ? 'Read today ✓ · next poem tomorrow' : 'A new poem each school day') + '</span><button class="btn ghost small" data-act="ptr" data-k="' + key + '" data-d="1">Next ›</button></div></div>';
  }
  // Every poem of the term, with the ones already read ticked, and a way to pick the place again.
  function poemListHTML(who, key) {
    var P = C.poets[who]; var p = ptr(key); var len = P.poems.length; var ci = ((p.i % len) + len) % len; var log = p.log || {};
    var nRead = Object.keys(log).length;
    return '<details class="card"' + (ui.poemUpto === key || ui.poemListOpen === key ? ' open' : '') + '><summary style="cursor:pointer;font-weight:800" data-act="poemlist" data-k="' + key + '">All ' + len + ' poems · ' + nRead + ' read</summary><p class="small muted" style="margin:6px 0 8px">Tap a poem to make it today\'s poem. Ticks show the poems read, with the date.</p><ul class="list">' +
      P.poems.map(function (q, k) { return '<li class="' + (k === ci ? 'cur' : '') + '"><span>' + (log[k] ? '✓ ' : '') + '<b>' + (k + 1) + '. ' + esc(q.title) + '</b>' + (/^\d{4}-/.test(log[k] || '') ? ' <span class="small muted">' + esc(fmtDate(log[k])) + '</span>' : '') + '</span>' + (k === ci ? '<span class="small">Today</span>' : '<button class="btn ghost small" data-act="setptr" data-k="' + key + '" data-v="' + k + '">Read this</button>') + '</li>'; }).join('') +
      '</ul><div class="btns" style="margin-top:8px"><button class="btn ghost small" data-act="poemsupto" data-k="' + key + '">' + (ui.poemUpto === key ? 'Now tap the last poem you read' : 'Mark poems already read…') + '</button></div></details>';
  }
  function poemSheet(which, tickId) {
    if (which === 'together') {
      return { title: 'Poetry together', who: 'together', body: '<p class="small muted" style="margin:0">One poem from each girl\'s poet. These are the same poems as on their own lists: a poem read here counts there too, and the other way round.</p>' + poemCard('emma', 'poem_emma', 'For Emma · ' + C.poets.emma.poet) + poemListHTML('emma', 'poem_emma') + poemCard('emily', 'poem_emily', 'For Emily · ' + C.poets.emily.poet) + poemListHTML('emily', 'poem_emily') + '<div class="btns">' + tickButton(tickId, 'Poetry done', 'We read our poems') + '</div>' };
    }
    var P = C.poets[which];
    return { title: esc(P.poet), who: which, body: poemCard(which, 'poem_' + which) + '<div class="btns">' + tickButton(tickId, 'Read today', 'I read my poem') + '</div>' + poemListHTML(which, 'poem_' + which) + '<p class="small muted">' + esc(P.source) + '</p>' };
  }

  function chineseSheet(tickId) {
    var CH = C.chinese; var p = S.ptr.chinese || (S.ptr.chinese = { i: 0 }); var i = ((p.i % CH.poems.length) + CH.poems.length) % CH.poems.length; var poem = CH.poems[i];
    var showEn = S.ptr.chineseEn !== false;
    var body = '<div class="card"><div class="kicker">' + esc(CH.poet) + ' · ' + esc(CH.years) + ' · poem ' + (i + 1) + ' of ' + CH.poems.length + '</div>' +
      '<div class="zh-line"><div class="py">' + esc(poem.py) + '</div><div class="hz" style="font-size:34px;font-weight:700">' + esc(poem.title) + '</div><div class="en">' + esc(poem.en) + '</div></div>' +
      poem.lines.map(function (l) { return '<div class="zh-line"><div class="py">' + esc(l[1]) + '</div><div class="hz">' + esc(l[0]) + '</div>' + (showEn ? '<div class="en">' + esc(l[2]) + '</div>' : '') + '</div>'; }).join('') +
      '<div class="btns" style="margin-top:10px"><button class="btn ghost small" data-act="togglezhen">' + (showEn ? 'Hide' : 'Show') + ' line-by-line English</button></div></div>' +
      '<div class="card"><h3>What it means</h3><p style="margin:0">' + esc(poem.meaning) + '</p></div>' +
      '<div class="nav"><button class="btn ghost small" data-act="ptr" data-k="chinese" data-d="-1">‹ Previous poem</button><button class="btn small" data-act="ptr" data-k="chinese" data-d="1">Learned it · next poem ›</button></div>' +
      '<div class="btns">' + tickButton(tickId, 'Done today', 'We read our 唐诗') + '</div>' +
      '<div class="card"><h3>' + esc(CH.poet) + '</h3><p style="margin:0 0 8px">' + esc(CH.intro) + '</p><p class="small muted" style="margin:0">Poets already studied: ' + esc(CH.done.join(', ')) + '.</p><ul class="list" style="margin-top:10px">' +
      CH.poems.map(function (q, k) { return '<li class="' + (k === i ? 'cur' : '') + '"><span><b style="font-family:var(--f-zh)">' + esc(q.title) + '</b> <span class="muted small">' + esc(q.en) + '</span></span><button class="btn ghost small" data-act="setptr" data-k="chinese" data-v="' + k + '">Go</button></li>'; }).join('') + '</ul><p class="small muted">' + esc(CH.source) + '</p></div>';
    return { title: '唐诗 · ' + esc(CH.poet.split(' ')[0]), body: body };
  }

  function bibleLesson(track) { var T = C.bible.tracks.filter(function (t) { return t.id === track; })[0]; var i = S.ptr['bible_' + track] ? S.ptr['bible_' + track].i : 0; return T.lessons[i] || null; }
  // ---------- Smyth's references made tappable: "Exod. VI. 1-12", "(ch. vii. 15-25)", "(vv. 6, 7, 8)", "(St. Matt. xviii. 6)" ----------
  // A bare chapter ("ch. xi. 10", "(xii. 37)") means the lesson's own book; "v."/"vv." means a verse of the lesson's reading when that settles it, otherwise the chapter last named.
  var SM_BOOK = '\\b(?:St\\.?\\s*)?(?:[123]\\s*)?(?:Genesis|Gen|Exodus|Exod|Ex|Leviticus|Lev|Numbers|Num|Deuteronomy|Deut|Joshua|Josh|Judges|Judg|Ruth|Sam|Samuel|Kings|Chronicles|Chron|Ezra|Nehemiah|Neh|Esther|Job|Psalms|Psalm|Ps|Proverbs|Prov|Ecclesiastes|Eccles|Isaiah|Isa|Jeremiah|Jer|Lamentations|Lam|Ezekiel|Ezek|Daniel|Dan|Hosea|Hos|Joel|Amos|Obadiah|Jonah|Micah|Mic|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Zech|Malachi|Mal|Matthew|Matt|Mark|Luke|John|Acts|Romans|Rom|Corinthians|Cor|Galatians|Gal|Ephesians|Eph|Philippians|Phil|Colossians|Col|Thessalonians|Thess|Timothy|Tim|Titus|Hebrews|Heb|James|Peter|Pet|Jude|Revelation|Rev)\\.?';
  var SM_VS = '(\\d+(?:\\s*(?:[-–]|to)\\s*(?:\\d+|end|[ivxlc]+\\.\\s*\\d+))?(?:\\s*,\\s*\\d+(?!\\s*[A-Z][a-z])(?:\\s*[-–]\\s*\\d+)?)*)';
  var SM_RE = new RegExp('(' + SM_BOOK + ')\\s+\\(?([ivxlc]+)\\b[.,]?\\s*' + SM_VS + '?' +          // 1 book, 2 chapter, 3 verses
    '|\\b(?:ch|chap|chapter)\\.?\\s*([ivxlc]+)\\b[.,]?\\s*' + SM_VS + '?' +                     // 4 chapter, 5 verses
    '|\\bvv?\\.\\s*' + SM_VS +                                                                   // 6 verses
    '|\\b([ivxlc]+)\\.\\s*' + SM_VS, 'gi');                                                        // 7 chapter, 8 verses (only inside brackets or after another reference)
  function smRoman(s) { var V = { i: 1, v: 5, x: 10, l: 50, c: 100 }, n = 0, a = s.toLowerCase(); for (var i = 0; i < a.length; i++) { var x = V[a[i]], y = V[a[i + 1]] || 0; n += x < y ? -x : x; } return n; }
  function smBook(s) {
    var n = s.replace(/^St\.?\s*/i, '').replace(/\.$/, '').replace(/\s+/g, ' ').trim();
    var map = { ex: 'Exodus', exod: 'Exodus', judg: 'Judges', ps: 'Psalm', phil: 'Philippians', mic: 'Micah', isa: 'Isaiah', jer: 'Jeremiah', lam: 'Lamentations', dan: 'Daniel', hos: 'Hosea', mal: 'Malachi', zech: 'Zechariah', rev: 'Revelation', col: 'Colossians', eccles: 'Ecclesiastes' };
    var k = n.toLowerCase().replace(/\s/g, ''); if (map[k]) n = map[k];
    return findBook(n);
  }
  // "6, 7, 8" -> [[6,8]]; "8, 28, 29" -> [[8,8],[28,29]]; "1-12" -> [[1,12]]; "18 to end" -> [[18,999]]
  function smVerses(s, c) {
    var out = [];
    s.split(/\s*,\s*/).forEach(function (p) {
      var m = p.match(/^(\d+)(?:\s*(?:[-–]|to)\s*(\d+|end|([ivxlc]+)\.\s*(\d+)))?$/i); if (!m) return;
      var vv = m[3] && /^vv?$/i.test(m[3]); var a = +m[1], b = m[3] ? +m[4] : m[2] ? (/end/i.test(m[2]) ? 999 : +m[2]) : a, c2 = m[3] && !vv ? smRoman(m[3]) : c;
      var last = out[out.length - 1];
      if (last && last.c2 === c && c2 === c && a === last.v2 + 1) last.v2 = b; else out.push({ c1: c, v1: a, c2: c2, v2: b });
    });
    return out;
  }
  function smLink(text, ctx) {
    var out = '', at = 0, m, depth = 0, lastEnd = -1000, fix = ctx.fix || {};
    SM_RE.lastIndex = 0;
    while ((m = SM_RE.exec(text))) {
      var pre = text.slice(at, m.index), segs = null, b = ctx.b;
      for (var i = 0; i < pre.length; i++) { if (pre[i] === '(') depth++; else if (pre[i] === ')') depth = Math.max(0, depth - 1); }
      if (m[1]) {
        b = smBook(m[1]); if (b < 0) { out += esc(pre + m[0]); at = m.index + m[0].length; continue; }
        var c = smRoman(m[2]); segs = m[3] ? smVerses(m[3], c) : [{ c1: c, v1: null, c2: c, v2: null }];
        if (b === ctx.b) ctx.c = c;
        ctx.lb = b; ctx.lc = segs[segs.length - 1].c2;
      } else if (m[4]) {
        c = smRoman(m[4]); segs = m[5] ? smVerses(m[5], c) : [{ c1: c, v1: null, c2: c, v2: null }]; ctx.c = c; ctx.lb = b; ctx.lc = c;
      } else if (m[6]) {
        var first = +m[6].match(/\d+/)[0], cc = ctx.c, hits = ctx.reads.filter(function (r) { return r.b === ctx.b && first >= (r.v1 || 1) && (r.c1 === r.c2 ? first <= (r.v2 || 999) : true); });
        if (hits.length && !hits.some(function (r) { return r.c1 <= cc && cc <= r.c2; })) cc = hits[0].c1;
        else if (hits.length === 1 && hits[0].c1 === hits[0].c2) cc = hits[0].c1;
        segs = smVerses(m[6], cc);
      } else if (m[7]) {
        // A bare "xii. 37" counts only inside brackets, or straight after another reference ("viii. 8, 28; ix. 27").
        var after = m.index - lastEnd <= 3 && /^[\s;,.]*$/.test(text.slice(lastEnd, m.index));
        if (!depth && !after) { out += esc(pre + m[0]); at = m.index + m[0].length; continue; }
        // Right after another reference, or soon after one in the same paragraph, it shares that reference's book.
        // A chapter of the lesson's own reading stays in the lesson's book.
        c = smRoman(m[7]);
        var inRead = ctx.reads.some(function (r) { return r.b === ctx.b && r.c1 <= c && c <= r.c2; });
        if (!inRead && (after || (ctx.lb != null && m.index - lastEnd < 200))) b = ctx.lb; segs = smVerses(m[8], c); if (b === ctx.b) ctx.c = c; ctx.lc = c;
      }
      var m0 = m[0].replace(/\s+$/, ''); if (fix[m0] !== undefined) { var fr = fix[m0] ? parseRef(fix[m0]) : null; segs = fr ? [fr] : null; if (fr) b = fr.b; }
      if (!segs || !segs.length) { out += esc(pre + m[0]); at = m.index + m[0].length; continue; }
      var data = segs.map(function (s) { return [s.b != null ? s.b : b, s.c1, s.v1 || 0, s.c2, s.v2 || 0].join('.'); }).join(';');
      out += esc(pre) + '<span class="vref" data-act="vref" data-v="' + data + '">' + esc(m0) + '</span>' + esc(m[0].slice(m0.length));
      at = m.index + m[0].length; lastEnd = at;
    }
    return out + esc(text.slice(at));
  }
  // "Exodus 4:21; Exodus 7:3" -> the same data the links carry
  function refData(str) { return String(str).split(/\s*;\s*/).map(parseRef).filter(Boolean).map(function (r) { return [r.b, r.c1, r.v1 || 0, r.c2, r.v2 || 0].join('.'); }).join(';'); }
  // "Look it up": short notes from Scripture under the prompts that send the class elsewhere ("Enumerate some of the other plagues").
  function shortRef(str) { var last = ''; return String(str).split(/\s*;\s*/).map(function (p) { var m = p.match(/^(.*?) (\d.*)$/); if (!m) return p; var o = m[1] === last ? m[2] : p; last = m[1]; return o; }).join('; '); }
  function lookHTML(o) {
    var h = '<details class="look"' + (ui.lookOpen === o.title ? ' open' : '') + '><summary data-act="lookopen" data-v="' + esc(o.title) + '">🔎 Look it up: ' + esc(o.title) + '</summary>';
    if (o.items) h += '<ul class="look-list">' + o.items.map(function (it) { return '<li><span>' + esc(it.t) + '</span> <span class="vref chip" data-act="vref" data-v="' + refData(it.r) + '">' + esc(shortRef(it.r)) + '</span></li>'; }).join('') + '</ul>';
    if (o.poem) h += '<div class="poem look-poem">' + esc(o.poem) + '</div>';
    if (o.note) h += '<p class="small muted" style="margin:6px 0 0">' + esc(o.note) + '</p>';
    return h + '</details>';
  }
  function smythHTML(L) {
    var t = L.smyth, k = 0, looks = L.look || [], reads = (L.read || []).map(parseRef).filter(Boolean);
    var ctx = { b: reads.length ? reads[0].b : -1, c: reads.length ? reads[0].c1 : 1, reads: reads, fix: L.refFix || {} };
    var after = function (para) { return looks.filter(function (o) { return !o.q && para.indexOf(o.at) >= 0; }).map(lookHTML).join(''); };
    return t.split(/\n\n+/).map(function (para, pi) {
      if (/^§/.test(para)) return '<h4 class="sm-h">' + esc(para) + '</h4>';
      if (/^(NOTE|Notes?$|Questions for Lesson)/.test(para)) return '<h4 class="sm-h">' + esc(para) + '</h4>';
      if (/^(I|II|III|IV|V)$/.test(para)) return '<h4 class="sm-h">' + esc(para) + '</h4>';
      var body = pi === 0 ? esc(para) : smLink(para, ctx);
      // Questions: one per line, each with its note beneath it.
      var qs = looks.filter(function (o) { return o.q && para.indexOf(o.q) >= 0; });
      if (qs.length) {
        var lines = para.split('\n');
        return lines.map(function (line) {
          var mine = qs.filter(function (o) { return line.indexOf(o.q) >= 0; });
          return '<p class="sp" data-act="bmks" data-v="' + (k++) + '" style="margin:0 0 4px">' + smLink(line, ctx) + '</p>' + mine.map(lookHTML).join('');
        }).join('');
      }
      return '<p class="sp" data-act="bmks" data-v="' + (k++) + '">' + body + '</p>' + after(para);
    }).join('');
  }
  // The verses behind a reference, in a small window over the page.
  function showVerses(data, lang) {
    var segs = String(data).split(';').map(function (x) { var a = x.split('.').map(Number); return { b: a[0], c1: a[1], v1: a[2] || null, c2: a[3], v2: a[4] || null }; });
    lang = lang || ui.vpopLang || 'en'; ui.vpopLang = lang;
    var box = document.getElementById('vpop');
    if (!box) { box = document.createElement('div'); box.id = 'vpop'; box.className = 'vpop'; box.setAttribute('data-act', 'vpopbg'); document.body.appendChild(box); }
    box.setAttribute('data-v', data);
    var title = segs.map(function (r) { return refLabel(r, lang); }).join('; ');
    box.innerHTML = '<div class="vpop-card" role="dialog" aria-label="' + esc(title) + '"><div class="nav"><b>' + esc(title) + '</b><span class="btns" style="margin:0"><span class="seg"><button data-act="vpoplang" data-v="en" aria-pressed="' + (lang === 'en') + '">KJV</button><button data-act="vpoplang" data-v="zh" aria-pressed="' + (lang === 'zh') + '">和合本</button></span><button class="btn ghost small" data-act="vpopclose" aria-label="Close">✕</button></span></div><div class="vpop-body"><p class="muted">Loading…</p></div></div>';
    box.style.display = 'flex';
    loadBible(lang).then(function (bible) {
      var html = segs.map(function (r) {
        var vs = passage(bible, r);
        var head = segs.length > 1 ? '<div class="kicker" style="margin-top:8px">' + esc(refLabel(r, lang)) + '</div>' : '';
        if (!vs.length) return head + '<p class="muted">' + (lang === 'zh' ? '和合本里没有这一节。' : 'There is no such verse in the KJV; it may be a printer’s slip in Smyth’s book.') + '</p>';
        return head + '<div class="bible-text' + (lang === 'zh' ? ' zh' : '') + '">' + vs.map(function (x) { return '<span><span class="verse-num">' + (r.c2 !== r.c1 && x.v === 1 ? x.c + ':' : '') + x.v + '</span>' + esc(x.t) + '</span> '; }).join('') + '</div>';
      }).join('');
      var b = box.querySelector('.vpop-body'); if (b) b.innerHTML = html;
    }).catch(function () { var b = box.querySelector('.vpop-body'); if (b) b.innerHTML = '<p class="muted">The Bible text could not load. Open the app once with internet so it can be saved.</p>'; });
  }
  function hideVerses() { var b = document.getElementById('vpop'); if (b) b.style.display = 'none'; }
  // ---------- place marker for Bible and Smyth: tap where you stopped ----------
  function bmkKey() { return 'bmk_' + (ui.bibleTrack || C.bible.tracks[0].id); }
  function bmkGet() {
    var tid = ui.bibleTrack || C.bible.tracks[0].id; var i = S.ptr['bible_' + tid] ? S.ptr['bible_' + tid].i : 0;
    var m = S.ptr[bmkKey()]; return m && m.i === i ? m : null;
  }
  function bmkSet(kind, val) {
    var tid = ui.bibleTrack || C.bible.tracks[0].id; var i = S.ptr['bible_' + tid] ? S.ptr['bible_' + tid].i : 0;
    var m = bmkGet() || { i: i }; m.i = i;
    if (m[kind] === val) delete m[kind]; else m[kind] = val;
    S.ptr[bmkKey()] = m; save();
  }
  function applyBmk(root, jump) {
    if (!root || !root.querySelector('.vs, .sp')) return;
    var m = bmkGet() || {};
    root.querySelectorAll('.vs').forEach(function (e) { e.classList.toggle('mk', e.getAttribute('data-v') === m.v); });
    root.querySelectorAll('.sp').forEach(function (e) { e.classList.toggle('mk', e.getAttribute('data-v') === String(m.s)); });
    var bn = root.querySelector('#bmk-banner'); if (bn) bn.innerHTML = bmkBanner();
    if (jump) { root.querySelectorAll('.mk').forEach(function (e) { scrollToMark(e); }); }
  }
  function scrollToMark(e) {
    var col = e.closest('.grid3 .col');
    if (col && col.scrollHeight > col.clientHeight + 4) { col.scrollTop = Math.max(0, e.offsetTop - col.offsetTop - 60); var sb = document.querySelector('.sheet-body'); if (sb) { var cr = col.getBoundingClientRect(), br = sb.getBoundingClientRect(); sb.scrollTop += cr.top - br.top - 8; } return; }
    var body = document.querySelector('.sheet-body'); if (!body) return;
    var er = e.getBoundingClientRect(), br2 = body.getBoundingClientRect(); body.scrollTop += er.top - br2.top - 80;
  }
  function bmkBanner() {
    var m = bmkGet() || {}; var bits = [];
    if (m.v) bits.push('Bible at verse <b>' + esc(m.v) + '</b>');
    if (m.s != null) bits.push('Smyth’s notes at paragraph <b>' + (m.s + 1) + '</b>');
    if (!bits.length) return '<span class="muted">📍 Tap the verse or the paragraph of Smyth’s notes where you stop, and the app will mark your place for next time.</span>';
    return '<span>📍 Last time you stopped: ' + bits.join(' · ') + '</span><button class="btn small" data-act="bmkgo">Go to my place</button><button class="btn ghost small" data-act="bmkclear">Clear</button>';
  }
  function bibleSheet(tickId) {
    var mode = ui.bibleLang;
    if (mode === 'en' || mode === 'zh' || mode === 'both' || mode === 'three') {} else mode = 'three';
    var tracks = C.bible.tracks; var tid = ui.bibleTrack || tracks[0].id;
    var T = tracks.filter(function (x) { return x.id === tid; })[0] || tracks[0];
    var body = '<div class="nav" style="flex-wrap:wrap"><div class="seg" role="group" aria-label="Testament">' + tracks.map(function (x) { return '<button data-act="bibletrack" data-v="' + x.id + '" aria-pressed="' + (x.id === T.id) + '">' + esc(x.name) + '</button>'; }).join('') + '</div>' +
      '<div class="seg" role="group" aria-label="View">' + [['three', '3 views'], ['both', 'KJV + 和合本'], ['en', 'KJV'], ['zh', '和合本']].map(function (o) { return '<button data-act="biblelang" data-v="' + o[0] + '" aria-pressed="' + (mode === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
    var i = S.ptr['bible_' + T.id] ? S.ptr['bible_' + T.id].i : 0; var L = T.lessons[i];
    body += '<div class="card"><div class="kicker">' + esc(T.name) + ' · ' + esc(T.book) + '</div>';
    if (!L) { body += '<h3>All lessons finished</h3><button class="btn ghost small" data-act="biblestep" data-v="' + T.id + '" data-d="-1">‹ Back one lesson</button></div>'; }
    else {
      if (C.bible.method) body += '<details class="bmethod" style="margin:0 0 10px"><summary><b>How to give the lesson</b></summary><ol style="margin:8px 0 0;padding-left:22px;display:flex;flex-direction:column;gap:6px">' + C.bible.method.steps.map(function (x) { return '<li><b>' + esc(x[0]) + '.</b> ' + esc(x[1]) + '</li>'; }).join('') + '</ol><p class="small muted" style="margin:6px 0 0">' + esc(C.bible.method.src) + '</p></details>';
      body += '<div id="bmk-banner" class="btns" style="align-items:center;background:var(--sunk);border-radius:10px;padding:8px 10px;margin:0 0 10px">' + bmkBanner() + '</div>';
      body += '<h3>Lesson ' + esc(L.n) + ': ' + esc(L.title) + '</h3><p class="small muted" style="margin:0 0 8px">Read: ' + esc(L.read.join('; ')) + '</p>' + (L.note ? '<p class="small" style="margin:0 0 8px">' + esc(L.note) + '</p>' : '');
      if (L.maps) body += '<div class="bmaps">' + L.maps.map(function (m) { return '<figure class="pic bmap" style="margin:8px 0 4px"><img src="' + m + '" alt="Map for this lesson" loading="lazy" data-act="zoompic"></figure>'; }).join('') + '</div>' + (L.mapWhy ? '<p style="margin:4px 0 4px"><b>The map.</b> ' + esc(L.mapWhy) + '</p>' : '') + '<p class="small muted" style="margin:2px 0 10px">Tap the map to see it larger. ' + esc(L.mapCap || '') + '</p>';
      if (L.pic) body += '<figure class="pic bpic" style="margin:8px 0 4px"><img src="' + L.pic.src + '" alt="' + esc(L.pic.title) + '" loading="lazy" data-act="zoompic"><figcaption class="small" style="margin-top:6px"><b>' + esc(L.pic.title) + '</b> · ' + esc(L.pic.by) + '</figcaption></figure><p class="small" style="background:var(--sunk);padding:8px 10px;border-radius:8px;margin:4px 0 10px"><b>Look closely:</b> ' + esc(L.pic.look) + '</p>';
      function passage(lang) {
        return L.read.map(function (ref) { var r = parseRef(ref); return '<div class="kicker" style="margin-top:8px">' + esc(lang === 'zh' && r ? refLabel(r, 'zh') : ref) + '</div><div data-ref="' + esc(ref) + '" data-lang="' + lang + '"><p class="muted">Loading…</p></div>'; }).join('');
      }
      var smyth = L.smyth ? '<div class="sm-text">' + smythHTML(L) + '</div>' : '<p class="small">Smyth’s notes for this lesson aren’t in the app yet. <a href="' + esc(T.url) + '" target="_blank" rel="noopener">Open them on AmblesideOnline ↗</a></p>';
      if (mode === 'three') body += '<div class="grid3"><div class="col"><div class="col-h">KJV</div>' + passage('en') + '</div><div class="col"><div class="col-h">和合本</div>' + passage('zh') + '</div><div class="col"><div class="col-h">Smyth’s notes</div>' + smyth + '</div></div>';
      else if (mode === 'both') body += '<div class="grid2"><div>' + passage('en') + '</div><div>' + passage('zh') + '</div></div>';
      else body += passage(mode);
      if (mode !== 'three' && L.smyth) body += '<details style="margin-top:12px"><summary><b>Smyth’s notes for this lesson</b></summary><div class="sm-text" style="max-height:none">' + smythHTML(L) + '</div></details>';
      body += '<div class="nav" style="margin-top:12px"><button class="btn ghost small" data-act="biblestep" data-v="' + T.id + '" data-d="-1">‹ Previous lesson</button><button class="btn small" data-act="biblestep" data-v="' + T.id + '" data-d="1">Lesson finished ›</button></div></div>';
    }
    body += '<div class="btns">' + tickButton(tickId, 'Bible done today', 'We read our Bible') + '</div><p class="small muted">' + esc(C.bible.source) + ' ' + esc(C.bible.smythNote || '') + ' ' + esc(C.bible.picNote || '') + ' ' + esc(C.bible.mapNote || '') + ' Chinese: 和合本 (Chinese Union Version).</p>';
    return { title: 'Bible', who: 'together', body: body, wide: true };
  }



  // ---------- copywork and prepared dictation, from the books in the app ----------
  // Passages are chosen from real books (Mason: the child copies fine sentences from books, and keeps the verses she loves).
  function cwBlocksText(b) { return b.p != null ? b.p : b.verse != null ? b.verse : null; }
  // The paragraphs of a reading, for choosing a passage. Units are sentences in prose and lines in verse.
  function cwSource(src) {
    var p = String(src).split(':'), out = { title: '', paras: [], verse: false };
    try {
      if (p[0] === 'book') { var B = BK[p[1]], it = B.items[+p[2]]; out.title = B.book + ' · ' + it.title; it.blocks.forEach(function (b) { var t = cwBlocksText(b); if (t) out.paras.push({ t: t, verse: b.verse != null }); }); }
      else if (p[0] === 'tale') { var B2 = BK[p[1]], P = partsOf(p[1], +p[2])[+p[3]]; out.title = B2.book + ' · ' + B2.items[+p[2]].title; P.blocks.forEach(function (b) { var t = cwBlocksText(b); if (t) out.paras.push({ t: t, verse: b.verse != null }); }); }
      else if (p[0] === 'read') { var R = C.readings[p[1]], ti = R.contents[+p[2]], ch = R.chapters[ti]; out.title = R.book + ' · ' + ti; ch.text.split(/\n\s*\n/).forEach(function (t) { if (t.trim()) out.paras.push({ t: t.trim() }); }); }
      else if (p[0] === 'poem') { var Q = C.poets[p[1]], poem = Q.poems[+p[2]]; out.title = Q.poet + ' · ' + poem.title; out.verse = true; poem.text.split(/\n\s*\n/).forEach(function (t) { out.paras.push({ t: t, verse: true }); }); }
    } catch (e) {}
    return out;
  }
  function cwUnits(para) {
    if (para.verse) return para.t.split('\n').filter(function (l) { return l.trim(); });
    var m = para.t.match(/[^.!?]+(?:[.!?]+["'’”)\]]*|$)\s*/g) || [para.t];
    return m.map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function cwBtn(src) { return '<button class="btn ghost small" data-act="cwpickopen" data-v="' + esc(src) + '">✒️ Keep a passage for copywork or dictation</button>'; }
  function cwState(who) { S.cw = S.cw || {}; var z = S.cw[who] || (S.cw[who] = {}); z.b = z.b || {}; z.log = z.log || {}; return z; }
  function dcState() { S.dc = S.dc || {}; var z = S.dc.emma || (S.dc.emma = {}); z.b = z.b || {}; z.st = z.st || {}; z.log = z.log || {}; z.sw = z.sw || {}; z.opt = z.opt || {}; return z; }
  function bankList(b, all) { return Object.keys(b).map(function (id) { return { id: id, t: b[id].t, s: b[id].s, a: b[id].a, done: b[id].done, o: b[id].o }; }).filter(function (x) { return all || !x.done; }).sort(function (x, y) { return (x.o != null ? x.o : x.a) - (y.o != null ? y.o : y.a); }); }
  function cwPickSheet(src) {
    var S0 = cwSource(src), sel = (ui.cwSel && ui.cwSel.src === src) ? ui.cwSel.sel : {};
    var picked = [];
    var body = '<p class="small muted" style="margin:0">Tap the sentences you want' + (S0.verse ? ' (or the lines of verse)' : '') + '. Choose a few that are beautifully written, or that you love.</p><div class="card"><div class="kicker">' + esc(S0.title) + '</div>' +
      S0.paras.map(function (para, pi) {
        return '<p class="cw-pp' + (para.verse ? ' verse' : '') + '">' + cwUnits(para).map(function (u, ui2) {
          var k = pi + '.' + ui2, on = !!sel[k]; if (on) picked.push({ k: k, u: u, verse: para.verse, pi: pi });
          return '<span class="cw-u' + (on ? ' on' : '') + '" data-act="cwsel" data-v="' + k + '">' + esc(u) + '</span>' + (para.verse ? '<br>' : ' ');
        }).join('') + '</p>';
      }).join('') + '</div>';
    var text = cwJoin(picked), words = text ? text.split(/\s+/).length : 0;
    body += '<div class="card cw-sticky"><div class="kicker">Your passage · ' + words + ' words</div>' + (text ? '<p class="cw-prev">' + esc(text) + '</p>' : '<p class="small muted" style="margin:0">Nothing chosen yet.</p>') +
      (text ? '<div class="btns"><button class="btn small" data-act="cwadd" data-v="copy:emma">Add to Emma’s copywork</button><button class="btn small" data-act="cwadd" data-v="copy:emily">Add to Emily’s copywork</button><button class="btn small" data-act="cwadd" data-v="dict:emma">Add to Emma’s dictation</button><button class="btn ghost small" data-act="cwclear">Clear</button></div>' : '') +
      '<p class="small muted" style="margin:6px 0 0">A copywork passage can be a sentence or two, or a verse. For dictation, a paragraph is about right.</p></div>';
    if (ui.cwBack) body += '<div class="btns"><button class="btn ghost small" data-act="cwback">‹ Back to the reading</button></div>';
    return { title: 'Keep a passage', who: 'together', body: body };
  }
  function cwJoin(picked) {
    picked.sort(function (a, b) { var x = a.k.split('.'), y = b.k.split('.'); return (+x[0] - +y[0]) || (+x[1] - +y[1]); });
    var out = '', lastP = null;
    picked.forEach(function (p) { if (out) out += p.verse ? (p.pi !== lastP ? '\n\n' : '\n') : (p.pi !== lastP ? '\n\n' : ' '); out += p.u; lastP = p.pi; });
    return out;
  }
  function cwAddTo(dest) {
    if (!ui.cwSel) return;
    var S0 = cwSource(ui.cwSel.src), picked = [];
    Object.keys(ui.cwSel.sel).forEach(function (k) { var a = k.split('.'), para = S0.paras[+a[0]]; if (para) picked.push({ k: k, u: cwUnits(para)[+a[1]], verse: para.verse, pi: +a[0] }); });
    var text = cwJoin(picked); if (!text) return;
    var d = dest.split(':'), z = d[0] === 'dict' ? dcState() : cwState(d[1]), id = 'p' + Date.now();
    z.b[id] = { t: text, s: S0.title, a: Date.now() }; save();
    ui.cwSel = null; toast(d[0] === 'dict' ? 'Added to Emma’s dictation' : 'Added to ' + (d[1] === 'emma' ? 'Emma' : 'Emily') + '’s copywork'); refreshSheet();
  }
  // Words as tappable spans; punctuation stays outside the tap.
  function cwWords(text, act, marks) {
    // Words become tappable; everything else (spaces, punctuation, line breaks) is kept as it is.
    return String(text).split(/([A-Za-z’'\-]+)/).map(function (piece, i) {
      if (i % 2 === 0) return esc(piece).replace(/\n/g, '<br>');
      var k = piece.replace(/[’']/g, '\'').toLowerCase(), cls = marks && marks[k] ? ' ' + marks[k] : '';
      return '<span class="cw-w' + cls + '" data-act="' + act + '" data-v="' + esc(piece) + '">' + esc(piece) + '</span>';
    }).join('');
  }
  function wordFocus(w, act) {
    if (!w) return '';
    return '<div class="cw-focus"><div class="cw-fw">' + esc(w) + '</div><p class="small" style="margin:6px 0">Look at it until you can see it with your eyes shut. Then shut your eyes and see it.</p><div class="btns" style="justify-content:center"><button class="btn small" data-act="' + act + '">I can see it ✓</button></div></div>';
  }
  var CW_CHECKS = [['words', 'Is every word there, spelt just as it is in the book?'], ['marks', 'Are the capitals, commas and full stops all in their places?'], ['line', 'Do your letters sit on the line, tall letters tall and small letters small?'], ['space', 'Are the spaces between your words even?']];
  function copySheet(who, tickId) {
    var z = cwState(who), L = bankList(z.b), tab = ui.cwTab || 'today', name = who === 'emma' ? 'Emma' : 'Emily';
    var body = '<div class="seg" role="group" style="margin-bottom:10px">' + [['today', 'Today'], ['bank', 'Passages (' + L.length + ')'], ['past', 'My copywork']].map(function (t) { return '<button data-act="cwtab" data-v="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>';
    if (tab === 'today') {
      var P = L[0];
      if (!P) body += '<div class="card"><h3>No passage yet</h3><p style="margin:0">Open one of your readings (a fable, a tale, a poem, a chapter) and tap <b>✒️ Keep a passage</b> under it. Choose a sentence or two that you love, and add it to ' + name + '’s copywork.</p></div>';
      else {
        var dr = ui.cwDraft && ui.cwDraft.id === P.id && ui.cwDraft.who === who ? ui.cwDraft : (ui.cwDraft = { id: P.id, who: who, chk: {}, best: null, care: null });
        var marks = {}; if (dr.best) marks[dr.best.toLowerCase()] = 'best'; if (dr.care) marks[dr.care.toLowerCase()] = 'care';
        body += '<div class="card"><div class="kicker">' + esc(P.s) + '</div><div class="cw-big' + (who === 'emily' ? ' big2' : '') + '">' + cwWords(P.t, 'cwword', marks) + '</div>' + wordFocus(ui.cwFocus, 'cwfocusoff') + '</div>' +
          '<div class="card"><h3 style="margin-top:0">1. Look</h3><p style="margin:0">Read it through. Tap any word you are not sure how to write; it shows by itself. Look at it, shut your eyes and see it.</p>' +
          '<h3>2. Write</h3><p style="margin:0">Copy it slowly and beautifully, every capital and comma just as it is. About ten minutes is plenty; if it is long, finish it tomorrow.</p>' +
          '<h3>3. Look at your own work</h3><p style="margin:0 0 8px">Put your page beside the passage and look at it word by word.</p>' +
          CW_CHECKS.map(function (c) { var v = dr.chk[c[0]]; return '<div class="cw-chk"><span>' + esc(c[1]) + '</span><span class="seg"><button data-act="cwchk" data-v="' + c[0] + ':y" aria-pressed="' + (v === 'y') + '">Yes</button><button data-act="cwchk" data-v="' + c[0] + ':n" aria-pressed="' + (v === 'n') + '">Not yet</button></span></div>'; }).join('') +
          '<div class="btns" style="margin-top:10px"><button class="btn ' + (ui.cwMode === 'best' ? '' : 'ghost ') + 'small" data-act="cwmode" data-v="best">⭐ Tap the word you wrote best</button><button class="btn ' + (ui.cwMode === 'care' ? '' : 'ghost ') + 'small" data-act="cwmode" data-v="care">🔁 Tap a word to take more care with</button></div>' +
          (dr.best || dr.care ? '<p class="small" style="margin:6px 0 0">' + (dr.best ? '⭐ Best: <b>' + esc(dr.best) + '</b>' : '') + (dr.best && dr.care ? ' · ' : '') + (dr.care ? '🔁 More care next time: <b>' + esc(dr.care) + '</b>' : '') + '</p>' : '') +
          '<textarea id="cwnote" rows="2" style="width:100%;margin-top:8px;font:inherit;padding:8px;border-radius:10px;border:1px solid var(--line)" placeholder="What I did well, and what I will do better (you can use the 🎤 on the keyboard)">' + esc(dr.note || '') + '</textarea>' +
          '<div class="btns" style="margin-top:8px;align-items:center"><label class="btn ghost small" style="cursor:pointer">📷 Photo of my page<input type="file" id="cwphoto" accept="image/*" capture="environment" style="display:none"></label>' + (ui.cwPhotoUrl ? '<img src="' + ui.cwPhotoUrl + '" alt="Photo of the page" class="cw-thumb">' : '') + '</div>' +
          '<div class="btns" style="margin-top:10px"><button class="btn small" data-act="cwsave" data-v="' + who + ':done">Save · I finished this passage</button><button class="btn ghost small" data-act="cwsave" data-v="' + who + ':more">Save · I’ll finish it tomorrow</button></div></div>';
      }
    } else if (tab === 'bank') {
      body += '<p class="small muted" style="margin:0 0 8px">The first passage is today’s. Add passages with <b>✒️ Keep a passage</b> under any reading.</p>' + (L.length ? '<ul class="list">' + L.map(function (x, i) {
        return '<li style="display:block"><div class="small muted">' + esc(x.s) + '</div><p style="margin:4px 0;white-space:pre-line">' + esc(x.t) + '</p><div class="btns">' + (i ? '<button class="btn ghost small" data-act="cwfirst" data-v="' + who + ':' + x.id + '">Do this one next</button>' : '<span class="small">Today’s</span>') + '<button class="btn ghost small" data-act="cwrm" data-v="' + who + ':' + x.id + '">' + (ui.cwRm === x.id ? 'Tap again to remove' : 'Remove') + '</button></div></li>';
      }).join('') + '</ul>' : '<p class="empty">No passages waiting.</p>');
    } else {
      var keys = Object.keys(z.log).sort().reverse();
      body += keys.length ? '<ul class="list">' + keys.map(function (k) {
        var e = z.log[k], P2 = z.b[e.id] || {}, ok = CW_CHECKS.filter(function (c) { return e.chk && e.chk[c[0]] === 'y'; }).length;
        return '<li style="display:block"><div class="nav"><span class="small"><b>' + esc(fmtDate(e.d)) + '</b> · ' + (e.fin ? 'finished the passage' : 'part of the passage') + ' · ' + ok + ' of 4 checks “yes”</span></div><p class="small" style="margin:4px 0;white-space:pre-line">' + esc((P2.t || '').slice(0, 140)) + ((P2.t || '').length > 140 ? '…' : '') + '</p>' +
          (e.best || e.care ? '<p class="small" style="margin:0">' + (e.best ? '⭐ ' + esc(e.best) : '') + (e.best && e.care ? ' · ' : '') + (e.care ? '🔁 ' + esc(e.care) : '') + '</p>' : '') + (e.note ? '<p class="small" style="margin:4px 0 0;font-style:italic">' + esc(e.note) + '</p>' : '') + (e.ph ? cwPhoto(who, k, e.ph) : '') + '</li>';
      }).join('') + '</ul>' : '<p class="empty">Nothing yet.</p>';
    }
    if (tickId) body += '<div class="btns">' + tickButton(tickId, 'Copywork done', 'I did my copywork') + '</div>';
    body += '<p class="small muted">Charlotte Mason, Home Education, Part V: copying from a book, done slowly and beautifully; the child keeps the verses she loves best.</p>';
    return { title: 'Copywork · ' + name, who: who, body: body };
  }
  var cwPhUrl = {};
  function cwPhoto(who, k, ent) {
    var key = 'cwph_' + who + '_' + k;
    if (cwPhUrl[key] === undefined) { cwPhUrl[key] = null; blobLocal(key, ent).then(function (b) { cwPhUrl[key] = b ? URL.createObjectURL(b) : false; if (b) refreshSheet(); }); }
    return cwPhUrl[key] ? '<img src="' + cwPhUrl[key] + '" alt="Photo of the page" class="cw-thumb" data-act="zoompic">' : cwPhUrl[key] === false ? '<p class="small muted" style="margin:4px 0 0">The photo is on another iPad.</p>' : '';
  }
  // Shrink a photo so it is quick to keep and to send.
  function shrinkPhoto(file) {
    return new Promise(function (res) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () { var s = Math.min(1, 1400 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob(function (b) { res(b || file); }, 'image/jpeg', 0.75); };
      img.onerror = function () { res(file); }; img.src = u;
    });
  }
  function cwSave(who, fin, tickId) {
    var z = cwState(who), dr = ui.cwDraft; if (!dr) return;
    var nt = document.getElementById('cwnote'); if (nt) dr.note = nt.value.trim();
    var k = String(Date.now()), e = { id: dr.id, d: today(), chk: dr.chk, fin: fin ? 1 : 0 };
    if (dr.best) e.best = dr.best; if (dr.care) e.care = dr.care; if (dr.note) e.note = dr.note;
    var after = function () {
      z.log[k] = e; if (fin && z.b[dr.id]) z.b[dr.id].done = Date.now();
      if (tickId && !doneToday(tickId)) addToday(tickId);
      save(); ui.cwDraft = null; ui.cwMode = null; ui.cwFocus = null; if (ui.cwPhotoUrl) { URL.revokeObjectURL(ui.cwPhotoUrl); ui.cwPhotoUrl = null; }
      toast(fin ? 'Saved. Well done!' : 'Saved. Carry on tomorrow'); refreshSheet(true);
    };
    if (ui.cwPhotoBlob) { var key = 'cwph_' + who + '_' + k, bl = ui.cwPhotoBlob; ui.cwPhotoBlob = null; e.ph = { t: Date.now() }; vput(key, bl).then(function () { after(); blobQueue(key, ['cw', who, 'log', k, 'ph']); }, after); }
    else after();
  }

  // ---------- prepared dictation (Emma) ----------
  // Home Education, Part V: the child studies the passage until she can see the words she is unsure of with her eyes shut;
  // then it is given clause by clause; a word written wrongly is studied and written again correctly.
  function dcClauses(text) {
    var raw = text.replace(/\s+/g, ' ').match(/[^,;:.!?]+(?:[,;:.!?]+["'’”)\]]*|$)/g) || [text], out = [];
    raw.forEach(function (c) {
      c = c.trim(); if (!c) return;
      var w = c.split(' ');
      if (w.length > 12) { var mid = Math.floor(w.length / 2), best = -1; for (var d = 0; d < mid; d++) { [mid - d, mid + d].forEach(function (i) { if (best < 0 && i > 2 && i < w.length - 2 && /^(and|but|that|which|who|when|where|while|for|as|because)$/i.test(w[i])) best = i; }); } if (best > 0) { out.push(w.slice(0, best).join(' ')); c = w.slice(best).join(' '); } }
      if (out.length && out[out.length - 1].split(' ').length < 3 && !/[.!?]["'’”]*$/.test(out[out.length - 1])) out[out.length - 1] += ' ' + c; else out.push(c);
    });
    return out;
  }
  function enSay(t, done) {
    try {
      var ss = window.speechSynthesis; ss.cancel();
      var u = new SpeechSynthesisUtterance(t); u.lang = /^en/i.test(navigator.language || '') ? navigator.language : 'en-GB'; u.rate = 0.85;
      enSay.u = u; if (done) u.onend = done; ss.speak(u);
    } catch (e) { if (done) done(); }
  }
  function dictSheet(tickId) {
    var z = dcState(), L = bankList(z.b), P = L[0], tab = ui.dcTab;
    var st = P ? (z.st[P.id] || (z.st[P.id] = {})) : null;
    if (!tab) tab = !P ? 'bank' : st.ready ? 'dict' : 'prep';
    var body = '<div class="seg" role="group" style="margin-bottom:10px">' + [['prep', '1 · Prepare'], ['dict', '2 · Dictation'], ['check', '3 · Check'], ['bank', 'Passages (' + L.length + ')'], ['past', 'Past']].map(function (t) { return '<button data-act="dctab" data-v="' + t[0] + '" aria-pressed="' + (tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var noP = '<div class="card"><h3>No passage yet</h3><p style="margin:0">Open a reading and tap <b>✒️ Keep a passage</b> under it. Choose a paragraph and add it to Emma’s dictation.</p></div>';
    if (tab === 'prep') {
      if (!P) body += noP;
      else {
        var sw = st.w || {}, keep = {};
        // Words missed in earlier dictations are marked to watch.
        (P.t.match(/[A-Za-z’'\-]+/g) || []).forEach(function (w) { var k = w.replace(/[’']/g, '\'').toLowerCase(); if (z.sw[k] && z.sw[k].m && !z.sw[k].ok) keep[k] = 'watch'; });
        Object.keys(sw).forEach(function (k) { keep[k] = sw[k] === 2 ? 'known' : 'study'; });
        var studyN = Object.keys(sw).filter(function (k) { return sw[k] !== 2; }).length, knownN = Object.keys(sw).length - studyN;
        body += '<div class="card"><div class="kicker">' + esc(P.s) + '</div><div class="cw-big">' + cwWords(P.t, 'dcword', keep) + '</div>' + (ui.dcStudy ? dcStudyHTML(ui.dcStudy) : '') + '</div>' +
          '<div class="card"><p style="margin:0">Read the passage carefully. <b>Tap every word you are not sure you can spell.</b> Then study each one: look at it until you can see it with your eyes shut. Notice the capitals and the stops too.</p>' +
          (Object.keys(keep).some(function (k) { return keep[k] === 'watch'; }) ? '<p class="small" style="margin:6px 0 0"><span class="cw-w watch">underlined</span> words were hard in an earlier dictation.</p>' : '') +
          '<p class="small muted" style="margin:6px 0 0">' + studyN + ' to study · ' + knownN + ' learnt</p>' +
          '<div class="btns" style="margin-top:8px"><button class="btn small" data-act="dcready">' + (st.ready ? '✓ Ready since ' + esc(fmtDate(st.ready)) : 'I’m ready for dictation') + '</button></div></div>';
      }
    } else if (tab === 'dict') {
      if (!P) body += noP;
      else {
        var cl = dcClauses(P.t), run = ui.dcRun && ui.dcRun.id === P.id ? ui.dcRun : null, by = (run && run.by) || ui.dcBy || 'mum', rep = z.opt.rep || 'any';
        if (!run) {
          body += '<div class="card"><h3 style="margin-top:0">Who reads it?</h3><div class="seg"><button data-act="dcby" data-v="mum" aria-pressed="' + (by === 'mum') + '">Mum reads</button><button data-act="dcby" data-v="ipad" aria-pressed="' + (by === 'ipad') + '">The iPad reads</button></div>' +
            '<p class="small" style="margin:8px 0 0">' + (by === 'mum' ? 'Mum holds the iPad so only she can see it, and reads each part when Emma is ready. Say the words; don’t say the commas and stops: Emma puts those in herself.' : 'The words stay hidden. The iPad says one part at a time; tap <b>Ready</b> when you have written it.') + '</p>' +
            '<p class="small muted" style="margin:6px 0 0">' + cl.length + ' parts.' + (st.ready ? '' : ' Emma hasn’t marked the passage as prepared yet.') + '</p>' +
            '<div class="btns" style="margin-top:8px"><button class="btn" data-act="dcstart" data-v="' + by + '">Begin</button></div></div>';
        } else {
          var i = run.i, last = i >= cl.length - 1;
          body += '<div class="card dc-run"><div class="kicker">Part ' + (i + 1) + ' of ' + cl.length + '</div>' +
            (run.by === 'mum' ? '<p class="small muted" style="margin:0 0 6px">For Mum’s eyes only</p><div class="cw-big">' + esc(cl[i]) + '</div>'
              : '<div class="dc-hid">🔈</div>' + (rep === 'none' ? '' : '<div class="btns" style="justify-content:center"><button class="btn ghost" data-act="dcagain"' + (rep === 'once' && run.r[i] >= 1 ? ' disabled' : '') + '>🔁 Say it again</button></div>')) +
            '<div class="btns" style="justify-content:center;margin-top:10px">' + (last ? '<button class="btn" data-act="dcfin">Finished · now check it ›</button>' : '<button class="btn" data-act="dcnext">' + (run.by === 'mum' ? 'Next part ›' : 'Ready · next part ›') + '</button>') + '</div>' +
            '<div class="btns" style="justify-content:center"><button class="btn ghost small" data-act="dcstop">Stop</button></div></div>';
        }
        body += '<details class="card"><summary style="cursor:pointer;font-weight:700">For Mum: saying it again</summary><p class="small" style="margin:6px 0">Mason gave each part “repeated once”, instead of the usual three or four times with questions, so that the child listens with full attention the first time. Choose what suits Emma; the app notes how often each part was asked for again.</p><div class="seg">' +
          [['any', 'As often as needed'], ['once', 'Once'], ['none', 'Not at all']].map(function (o) { return '<button data-act="dcrep" data-v="' + o[0] + '" aria-pressed="' + (rep === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div></details>';
      }
    } else if (tab === 'check') {
      if (!P) body += noP;
      else {
        var miss = ui.dcMiss && ui.dcMiss.id === P.id ? ui.dcMiss : (ui.dcMiss = { id: P.id, w: {} });
        var mk = {}; Object.keys(miss.w).forEach(function (k) { mk[k] = 'miss'; });
        body += '<div class="card"><p style="margin:0 0 8px">Put your page beside the passage and check it word by word. <b>Tap each word you wrote wrongly.</b></p><div class="cw-big">' + cwWords(P.t, 'dcmiss', mk) + '</div></div>';
        var mw = Object.keys(miss.w);
        if (ui.dcLearn) body += '<div class="card"><h3 style="margin-top:0">Learn the words you missed</h3>' + mw.map(function (k) { return '<div class="dc-learn"><span class="cw-fw" style="font-size:30px">' + esc(miss.w[k]) + '</span><span class="small">Look at it, shut your eyes and see it, then write it correctly on your page.</span></div>'; }).join('') + '<div class="btns"><button class="btn" data-act="dcsave">I’ve written them correctly · save</button></div></div>';
        else body += '<div class="btns"><button class="btn" data-act="' + (mw.length ? 'dclearn' : 'dcsave') + '">' + (mw.length ? 'Done checking · ' + mw.length + ' to learn ›' : 'Every word right · save') + '</button></div>';
      }
    } else if (tab === 'bank') {
      body += '<p class="small muted" style="margin:0 0 8px">The first passage is the one being prepared. Add passages with <b>✒️ Keep a passage</b> under any reading.</p>' + (L.length ? '<ul class="list">' + L.map(function (x, i) {
        return '<li style="display:block"><div class="small muted">' + esc(x.s) + ' · ' + x.t.split(/\s+/).length + ' words</div><p style="margin:4px 0;white-space:pre-line">' + esc(x.t) + '</p><div class="btns">' + (i ? '<button class="btn ghost small" data-act="dcfirst" data-v="' + x.id + '">Do this one next</button>' : '<span class="small">Now</span>') + '<button class="btn ghost small" data-act="dcrm" data-v="' + x.id + '">' + (ui.cwRm === x.id ? 'Tap again to remove' : 'Remove') + '</button></div></li>';
      }).join('') + '</ul>' : '<p class="empty">No passages waiting.</p>');
    } else {
      var keys = Object.keys(z.log).sort().reverse(), hard = Object.keys(z.sw).filter(function (k) { return z.sw[k].m; }).sort(function (a, b) { return z.sw[b].m - z.sw[a].m; });
      body += (hard.length ? '<div class="card"><div class="kicker">Words to keep an eye on</div><p style="margin:4px 0 0">' + hard.map(function (k) { return '<span class="dc-chip">' + esc(z.sw[k].w || k) + (z.sw[k].m > 1 ? ' ×' + z.sw[k].m : '') + '</span>'; }).join(' ') + '</p></div>' : '') +
        (keys.length ? '<ul class="list">' + keys.map(function (k) { var e = z.log[k], P2 = z.b[e.id] || {}; return '<li style="display:block"><span class="small"><b>' + esc(fmtDate(e.d)) + '</b> · ' + (e.by === 'ipad' ? 'read by the iPad' : 'read by Mum') + ' · ' + (e.miss && e.miss.length ? e.miss.length + ' wrong: ' + esc(e.miss.join(', ')) : 'every word right') + (e.rep ? ' · asked again ' + e.rep + '×' : '') + '</span><p class="small muted" style="margin:4px 0 0">' + esc((P2.t || '').slice(0, 120)) + '…</p></li>'; }).join('') + '</ul>' : '<p class="empty">No dictations yet.</p>');
    }
    if (tickId) body += '<div class="btns">' + tickButton(tickId, 'Done', 'I did it') + '</div>';
    body += '<p class="small muted">Charlotte Mason, Home Education, Part V, “Spelling and Dictation”.</p>';
    return { title: 'Dictation · Emma', who: 'emma', body: body };
  }
  function dcStudyHTML(w) {
    var hid = ui.dcHide;
    return '<div class="cw-focus"><div class="cw-fw">' + (hid ? '<span class="muted">· · ·</span>' : esc(w)) + '</div><p class="small" style="margin:6px 0">' + (hid ? 'Shut your eyes and see the word. Spell it in your head.' : 'Look at it until you can see it with your eyes shut.') + '</p><div class="btns" style="justify-content:center">' +
      (hid ? '<button class="btn ghost small" data-act="dcshow">Show me again</button><button class="btn small" data-act="dcknow">I know it ✓</button>' : '<button class="btn small" data-act="dchide">I can see it · hide it</button>') +
      '<button class="btn ghost small" data-act="dcunstudy">Not a hard word</button></div></div>';
  }
  function dcSay() { var z = dcState(), P = bankList(z.b)[0], r = ui.dcRun; if (!P || !r || r.by !== 'ipad') return; enSay(dcClauses(P.t)[r.i]); }
  function cwAct(act, v, el, tickId) {
    var z, P, k, a;
    switch (act) {
      case 'cwpickopen': ui.cwBack = ui.sheet ? { name: ui.sheet, arg: ui.sheetArg } : null; ui.cwSel = { src: v, sel: {} }; openSheet('cwpick:' + v); var sb = document.querySelector('.sheet-body'); if (sb) sb.scrollTop = 0; break;
      case 'cwsel': if (!ui.cwSel) ui.cwSel = { src: ui.sheet.slice(7), sel: {} }; if (ui.cwSel.sel[v]) delete ui.cwSel.sel[v]; else ui.cwSel.sel[v] = 1; refreshSheet(); break;
      case 'cwclear': if (ui.cwSel) ui.cwSel.sel = {}; refreshSheet(); break;
      case 'cwadd': cwAddTo(v); break;
      case 'cwback': if (ui.cwBack) { var bk = ui.cwBack; ui.cwBack = null; openSheet(bk.name, bk.arg); } break;
      case 'cwtab': ui.cwTab = v; refreshSheet(true); break;
      case 'cwword': if (ui.cwMode && ui.cwDraft) { ui.cwDraft[ui.cwMode] = v; ui.cwMode = null; } else ui.cwFocus = v; refreshSheet(); break;
      case 'cwfocusoff': ui.cwFocus = null; refreshSheet(); break;
      case 'cwchk': a = v.split(':'); if (ui.cwDraft) { ui.cwDraft.chk[a[0]] = ui.cwDraft.chk[a[0]] === a[1] ? null : a[1]; } refreshSheet(); break;
      case 'cwmode': ui.cwMode = ui.cwMode === v ? null : v; refreshSheet(); break;
      case 'cwsave': a = v.split(':'); cwSave(a[0], a[1] === 'done', tickId); break;
      case 'cwfirst': a = v.split(':'); z = cwState(a[0]); k = bankList(z.b)[0]; if (z.b[a[1]]) z.b[a[1]].o = (k ? (k.o != null ? k.o : k.a) : Date.now()) - 1; save(); refreshSheet(); break;
      case 'cwrm': a = v.split(':'); if (ui.cwRm !== a[1]) { ui.cwRm = a[1]; refreshSheet(); break; } ui.cwRm = null; z = cwState(a[0]); delete z.b[a[1]]; save(); refreshSheet(); break;
      case 'dctab': ui.dcTab = v; ui.dcStudy = null; refreshSheet(true); break;
      case 'dcword': z = dcState(); P = bankList(z.b)[0]; if (!P) break; var st = z.st[P.id] || (z.st[P.id] = {}); st.w = st.w || {}; k = v.replace(/[’']/g, '\'').toLowerCase(); if (!st.w[k]) st.w[k] = 1; save(); ui.dcStudy = v; ui.dcHide = false; refreshSheet(); break;
      case 'dchide': ui.dcHide = true; refreshSheet(); break;
      case 'dcshow': ui.dcHide = false; refreshSheet(); break;
      case 'dcknow': case 'dcunstudy': z = dcState(); P = bankList(z.b)[0]; if (P && ui.dcStudy) { var st2 = z.st[P.id] || (z.st[P.id] = {}); st2.w = st2.w || {}; k = ui.dcStudy.replace(/[’']/g, '\'').toLowerCase(); if (act === 'dcknow') st2.w[k] = 2; else delete st2.w[k]; save(); } ui.dcStudy = null; ui.dcHide = false; refreshSheet(); break;
      case 'dcready': z = dcState(); P = bankList(z.b)[0]; if (P) { (z.st[P.id] || (z.st[P.id] = {})).ready = today(); save(); ui.dcTab = 'dict'; } refreshSheet(true); break;
      case 'dcby': ui.dcBy = v; refreshSheet(); break;
      case 'dcstart': z = dcState(); P = bankList(z.b)[0]; if (!P) break; ui.dcRun = { id: P.id, by: v, i: 0, r: {} }; refreshSheet(); dcSay(); break;
      case 'dcnext': if (ui.dcRun) { ui.dcRun.i++; refreshSheet(); dcSay(); } break;
      case 'dcagain': if (ui.dcRun) { ui.dcRun.r[ui.dcRun.i] = (ui.dcRun.r[ui.dcRun.i] || 0) + 1; refreshSheet(); dcSay(); } break;
      case 'dcstop': ui.dcRun = null; try { speechSynthesis.cancel(); } catch (e) {} refreshSheet(); break;
      case 'dcfin': ui.dcDone = ui.dcRun; ui.dcRun = null; ui.dcTab = 'check'; refreshSheet(true); break;
      case 'dcrep': z = dcState(); z.opt.rep = v; save(); refreshSheet(); break;
      case 'dcmiss': z = dcState(); P = bankList(z.b)[0]; if (!P) break; if (!ui.dcMiss || ui.dcMiss.id !== P.id) ui.dcMiss = { id: P.id, w: {} }; k = v.replace(/[’']/g, '\'').toLowerCase(); if (ui.dcMiss.w[k]) delete ui.dcMiss.w[k]; else ui.dcMiss.w[k] = v; ui.dcLearn = false; refreshSheet(); break;
      case 'dclearn': ui.dcLearn = true; refreshSheet(); break;
      case 'dcsave':
        z = dcState(); P = bankList(z.b)[0]; if (!P) break;
        var mw = ui.dcMiss && ui.dcMiss.id === P.id ? ui.dcMiss.w : {}, run = ui.dcDone && ui.dcDone.id === P.id ? ui.dcDone : null, rep = 0;
        if (run) Object.keys(run.r).forEach(function (i) { rep += run.r[i]; });
        var e = { id: P.id, d: today(), by: run ? run.by : (ui.dcBy || 'mum'), miss: Object.keys(mw).map(function (x) { return mw[x]; }) }; if (rep) e.rep = rep;
        z.log[String(Date.now())] = e;
        Object.keys(mw).forEach(function (x) { var s2 = z.sw[x] || (z.sw[x] = { m: 0 }); s2.m++; s2.w = mw[x]; s2.d = today(); });
        z.b[P.id].done = Date.now();
        if (tickId && !doneToday(tickId)) addToday(tickId);
        save(); ui.dcMiss = null; ui.dcLearn = false; ui.dcDone = null; ui.dcTab = null; toast('Dictation saved'); refreshSheet(true); break;
      case 'dcfirst': z = dcState(); k = bankList(z.b)[0]; if (z.b[v]) z.b[v].o = (k ? (k.o != null ? k.o : k.a) : Date.now()) - 1; save(); refreshSheet(); break;
      case 'dcrm': if (ui.cwRm !== v) { ui.cwRm = v; refreshSheet(); break; } ui.cwRm = null; z = dcState(); delete z.b[v]; save(); refreshSheet(); break;
    }
  }

  // Jom Cakap Melayu runs in its own page inside the app; it keeps its progress here, so it syncs with the rest.
  window.SDms = {
    get: function () { return S.ms ? JSON.stringify(S.ms) : null; },
    set: function (json) { try { S.ms = JSON.parse(json); save(); } catch (e) {} }
  };
  // ---------- narration: record it, and keep a written copy (typed, or spoken through the keyboard's 🎤) ----------
  function narrLabel(id) {
    var found = '';
    var scan = function (it) { if (it && it.id === id) found = it.label; };
    ['emma', 'emily', 'together'].forEach(function (w) { var L = C.lists[w]; if (L) L.sections.forEach(function (sec) { (sec.items || []).forEach(scan); }); });
    Object.keys(C.loops || {}).forEach(function (k) { (C.loops[k].items || []).forEach(scan); });
    return found;
  }
  function narrSheet(id, label) {
    var T = (S.narrT && S.narrT[id]) || {}, keys = Object.keys(T).sort().reverse();
    var body = '<p class="small muted" style="margin:0">Tell back all you can of the reading, in your own words. Record it, write it down, or both.</p>' +
      '<div class="card"><div class="kicker">🎙 Record your narration</div>' + recBox('narr:' + id, 'Record your narration') + '</div>' +
      '<div class="card"><div class="kicker">✍️ Written copy</div><p class="small muted" style="margin:0 0 6px">Tap the box, then tap 🎤 on the iPad keyboard and narrate: the iPad types what you say. Or type it. Mum can tidy it afterwards.</p>' +
      '<textarea id="narrtxt" data-id="' + esc(id) + '" rows="7" style="width:100%;font:inherit;font-size:17px;padding:10px;border-radius:10px;border:1px solid var(--line,#ccc)" placeholder="Your narration…">' + esc(ui.narrDraft && ui.narrDraft.id === id ? ui.narrDraft.t : '') + '</textarea>' +
      '<div class="btns"><button class="btn small" data-act="narrsave" data-v="' + esc(id) + '">Save the written copy</button></div></div>';
    if (keys.length) body += '<div class="card"><div class="kicker">Written narrations · ' + keys.length + '</div><ul class="list">' + keys.map(function (k) {
      return '<li style="display:block"><div class="nav"><span class="small muted">' + esc(fmtDate(T[k].d)) + '</span><button class="btn ghost small" data-act="narrdel" data-v="' + esc(id + '|' + k) + '">' + (ui.narrDel === k ? 'Tap again to delete' : 'Delete') + '</button></div><p style="margin:4px 0 0;white-space:pre-wrap">' + esc(T[k].t) + '</p></li>';
    }).join('') + '</ul></div>';
    return { title: 'Narration · ' + esc(label || narrLabel(id) || 'reading'), who: ui.narrWho || 'together', body: body };
  }
  // Keep what has been typed if the page redraws (for example when a recording starts or stops).
  document.addEventListener('input', function (e) { var t = e.target; if (t && (t.getAttribute('data-link') || t.getAttribute('data-linkt'))) { ui.linkDraft = ui.linkDraft || {}; var lid = t.getAttribute('data-link') || t.getAttribute('data-linkt'), dd = ui.linkDraft[lid] || (ui.linkDraft[lid] = {}); dd[t.getAttribute('data-link') ? 'u' : 't'] = t.value; } if (t && t.id === 'cwnote' && ui.cwDraft) ui.cwDraft.note = t.value; if (t && t.id === 'narrtxt') ui.narrDraft = { id: t.getAttribute('data-id'), t: t.value }; });
  function narrBtn(id, label) { return '<div class="btns"><button class="btn ghost small" data-act="sheet" data-v="narr:' + esc(id) + '" data-label="' + esc(label || '') + '">🎙 Narrate this</button></div>'; }
  // ---------- recordings over time: every take is kept, so progress can be heard ----------
  // The list of takes is part of the family's progress (S.rec) and syncs. The sound itself is kept on the iPad that made it,
  // and is also sent to the family account in pieces when signed in; another iPad fetches it the first time it is played.
  var recUrl = {}, recOn = null, recDel = null, recMig = {};
  var BQ = 'nfam-blob-q';
  function bq() { try { return JSON.parse(localStorage.getItem(BQ) || '[]'); } catch (e) { return []; } }
  function bqSet(q) { try { localStorage.setItem(BQ, JSON.stringify(q)); } catch (e) {} }
  // path: where in S the entry lives, so the number of pieces can be noted there once sent.
  function blobQueue(k, path) { var q = bq().filter(function (x) { return x.k !== k; }); q.push({ k: k, path: path }); bqSet(q); blobPump(); }
  function getAt(path) { var o = S; for (var i = 0; i < path.length; i++) { if (!o) return null; o = o[path[i]]; } return o; }
  var bqBusy = false;
  function blobPump() {
    if (bqBusy || !window.SDsync || !SDsync.signedIn || !SDsync.signedIn() || !navigator.onLine) return;
    var q = bq(); if (!q.length) return;
    var it = q[0]; bqBusy = true;
    var next = function () { bqBusy = false; bqSet(bq().filter(function (x) { return x.k !== it.k; })); setTimeout(blobPump, 50); };
    var ent = getAt(it.path);
    if (!ent) { next(); return; }   // deleted meanwhile
    vget(it.k).then(function (blob) {
      if (!blob) { next(); return; }
      return SDsync.blobPut(it.k, blob).then(function (r) { var e2 = getAt(it.path); if (e2) { e2.n = r.n; e2.sz = r.size; save(); } next(); });
    }).catch(function (e) { bqBusy = false; ui.blobErr = String((e && (e.code || e.message)) || e); });
  }
  window.addEventListener('online', function () { setTimeout(blobPump, 500); });
  setTimeout(blobPump, 4000);
  // Wait a moment after opening before starting a day by itself, so the family copy has time to arrive first.
  function calKick() { var a = document.activeElement; if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return; if (calOn() && (!cur() || cur().date !== today())) render(); }
  setTimeout(function () { ui.calReady = true; if (S.profile && !S.poemOne) { unifyPoems(); render(); } calKick(); }, 3000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') setTimeout(calKick, 2000); });
  // Fetch a file another iPad sent, keep it here, then hand it back.
  var blobGetting = {};
  function blobLocal(k, ent) {
    return vget(k).then(function (b) {
      if (b || !ent || !ent.n || !window.SDsync || !SDsync.signedIn || !SDsync.signedIn()) return b;
      if (!blobGetting[k]) blobGetting[k] = SDsync.blobGet(k).then(function (nb) { if (nb) vput(k, nb); return nb; }, function () { return null; });
      return blobGetting[k];
    });
  }
  function recList(key) {
    S.rec = S.rec || {};
    // Takes made before the list was shared are moved into it once, from this iPad's own storage.
    if (!recMig[key]) { recMig[key] = 1; vget('recidx_' + key).then(function (a) {
      if (!a || !a.length) return;
      var R = S.rec[key] || (S.rec[key] = {});
      a.forEach(function (r) { if (!R[r.id]) { R[r.id] = { t: r.t }; blobQueue('rec_' + r.id, ['rec', key, r.id]); } });
      save(); vput('recidx_' + key, []); refreshSheet();
    }).catch(function () {}); }
    var R = S.rec[key] || {};
    return Object.keys(R).map(function (id) { return { id: id, t: R[id].t, n: R[id].n }; }).sort(function (x, y) { return x.t - y.t; });
  }
  function recSrc(r, key) {
    var id = r.id;
    if (recUrl[id] === undefined) { recUrl[id] = null; blobLocal('rec_' + id, (S.rec[key] || {})[id]).then(function (b) { if (b) { recUrl[id] = URL.createObjectURL(b); refreshSheet(); } else recUrl[id] = false; }); }
    return recUrl[id];
  }
  function recWhen(t) { var d = new Date(t); return d.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + ' ' + d.getFullYear(); }
  function recAudio(r, key) {
    var u = recSrc(r, key);
    if (u) return '<audio controls preload="metadata" src="' + u + '" style="width:100%"></audio>';
    if (u === false) return '<p class="small muted" style="margin:0">' + (r.n ? 'Sign in to the family account to hear this recording here.' : 'This recording is on another iPad. It comes here once that iPad is online and signed in.') + '</p>';
    return '<p class="small muted" style="margin:0">Loading…</p>';
  }
  // The record button, then the first and the latest take side by side, then all the takes.
  function recBox(key, label) {
    if (!(navigator.mediaDevices && window.MediaRecorder)) return '';
    var on = recOn && recOn.key === key, L = recList(key), open = ui.recOpen === key;
    var h = '<div class="rec"><div class="btns"><button class="btn' + (on ? '' : ' ghost') + ' small" data-act="recgo" data-v="' + esc(key) + '">' + (on ? '■ Stop and keep it' : '🎙 ' + esc(label || 'Record yourself')) + '</button>' + (on ? '<span class="small" style="color:#b3261e">● recording…</span>' : '') + '</div>';
    if (L.length === 1) h += '<div class="rec-one"><div class="small muted">' + recWhen(L[0].t) + '</div>' + recAudio(L[0], key) + '</div>';
    if (L.length > 1) {
      var a = L[0], b = L[L.length - 1];
      h += '<div class="rec-two"><div><div class="small muted">First · ' + recWhen(a.t) + '</div>' + recAudio(a, key) + '</div><div><div class="small muted">Latest · ' + recWhen(b.t) + '</div>' + recAudio(b, key) + '</div></div>' +
        '<button class="btn ghost small" data-act="recall" data-v="' + esc(key) + '">' + (open ? 'Hide' : 'All ' + L.length + ' recordings') + '</button>';
      if (open) h += '<ul class="list">' + L.slice().reverse().map(function (r) { return '<li style="display:block"><div class="nav"><span class="small">' + recWhen(r.t) + '</span><button class="btn ghost small" data-act="recdel" data-v="' + esc(key + '|' + r.id) + '">' + (recDel === r.id ? 'Tap again to delete' : 'Delete') + '</button></div>' + recAudio(r, key) + '</li>'; }).join('') + '</ul>';
    }
    if (ui.blobErr) h += '<p class="small muted" style="margin:6px 0 0">Recordings are kept on this iPad; they could not be sent to the family account (' + esc(ui.blobErr) + ').</p>';
    return h + '</div>';
  }
  function recTypes() { return ['audio/mp4', 'audio/webm', 'audio/aac'].filter(function (t) { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } }); }
  function recToggle(key) {
    if (recOn) { var R = recOn; recOn = null; try { R.mr.stop(); } catch (e) {} return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var types = recTypes(), opt = { audioBitsPerSecond: 48000 }; if (types.length) opt.mimeType = types[0];
      var mr, chunks = [];
      try { mr = new MediaRecorder(stream, opt); } catch (e) { mr = types.length ? new MediaRecorder(stream, { mimeType: types[0] }) : new MediaRecorder(stream); }
      mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        var blob = new Blob(chunks, { type: mr.mimeType || types[0] || 'audio/mp4' }), t = Date.now(), id = key + '@' + t;
        vput('rec_' + id, blob).then(function () {
          S.rec = S.rec || {}; (S.rec[key] || (S.rec[key] = {}))[id] = { t: t }; recUrl[id] = URL.createObjectURL(blob); save();
          blobQueue('rec_' + id, ['rec', key, id]);
        }).then(function () { toast('Recording kept'); refreshSheet(); }).catch(function () { toast('The recording could not be saved'); });
      };
      recOn = { key: key, mr: mr }; mr.start(); refreshSheet();
    }).catch(function () { toast('The microphone is not available. Allow it in Settings.'); });
  }
  function recRemove(key, id) {
    var ent = S.rec && S.rec[key] && S.rec[key][id];
    if (ent) { delete S.rec[key][id]; save(); if (window.SDsync && SDsync.blobDel) SDsync.blobDel('rec_' + id, ent.n || 1); }
    vdel('rec_' + id); if (recUrl[id]) URL.revokeObjectURL(recUrl[id]); delete recUrl[id];
  }

  // One piece a day for each list, taken in turn. A new day moves on to the next piece.
  function reciteList(who, lang) { return lang === 'zh' ? C.recitationZh[who] : C.recitation[who]; }
  function reciteToday(who, lang) {
    var list = reciteList(who, lang); if (!list || !list.length) return null;
    var key = who + (lang === 'zh' ? ':zh' : '');
    S.reciteDay = S.reciteDay || {};
    var cur = S.reciteDay[key], today = isoDay();
    if (!cur || cur.day !== today) {
      var last = cur ? list.map(function (r) { return r.id; }).indexOf(cur.id) : -1;
      cur = S.reciteDay[key] = { day: today, id: list[(last + 1) % list.length].id };
      save();
    }
    return list.filter(function (r) { return r.id === cur.id; })[0] || list[0];
  }
  function rubyHTML(toks) { return '<span class="pyl">' + toks.map(function (t) { return t[1] ? '<span class="py"><b>' + esc(t[1]) + '</b><i>' + esc(t[0]) + '</i></span>' : '<span class="py p"><b></b><i>' + esc(t[0] === '　' ? '' : t[0]) + '</i></span>'; }).join('') + '</span>'; }
  // a poem line from the Chinese poetry list: pair each character with its syllable
  function poemRuby(hz, py) {
    var syl = py.replace(/[，。！？；：、,.!?;:“”‘’（）]/g, ' ').split(/\s+/).filter(Boolean), k = 0;
    return Array.prototype.map.call(hz, function (ch) { return /[\u4e00-\u9fff]/.test(ch) ? [ch, syl[k++] || ''] : [ch, '']; });
  }
  function reciteText(r, who) {
    if (r.ruby) return '<div class="poem zh ruby">' + r.ruby.map(function (v) { return '<span class="py p vn"><b></b><i>' + v[0] + '</i></span>' + rubyHTML(v[1]); }).join('') + '</div>';
    if (r.hymnZh && C.hymnTextZh[r.hymnZh].ruby) { var hz0 = C.hymnTextZh[r.hymnZh]; return '<div class="poem zh ruby">' + hz0.ruby.map(function (l) { return l.length ? '<div class="pyrow">' + rubyHTML(l) + '</div>' : '<div class="pygap"></div>'; }).join('') + '</div><p class="small muted">' + esc(hz0.by) + '. ' + esc(hz0.note) + '</p>'; }
    if (r.ref) return '<div data-ref="' + esc(r.ref) + '" data-lang="' + (r.lang || 'en') + '"><p class="muted">Loading…</p></div>';
    if (r.hymnZh) { var hz = C.hymnTextZh[r.hymnZh]; return '<div class="poem zh">' + esc(hz.text) + '</div><p class="small muted">' + esc(hz.by) + '. ' + esc(hz.note) + '</p>'; }
    if (r.cpoem) { var cp = C.chinese.poems.filter(function (p) { return p.title === r.cpoem; })[0]; if (!cp) return '';
      return '<div class="poem zh ruby">' + cp.lines.map(function (l) { return '<div class="pyrow">' + rubyHTML(poemRuby(l[0], l[1])) + '</div>'; }).join('') + '</div>'; }
    if (r.poem) { var P = C.poets[r.poem[0]]; var poem = P.poems.filter(function (p) { return p.title === r.poem[1]; })[0]; return poem ? '<div class="poem">' + esc(poem.text) + '</div>' : ''; }
    if (r.hymn) { var h = C.hymnText[r.hymn]; return '<div class="poem">' + esc(h.text) + '</div><p class="small muted">' + esc(h.note) + '</p>'; }
    return '';
  }
  function reciteSheet(who, tickId, lang) {
    var list = reciteList(who, lang); var open = ui.reciteOpen || {};
    var today = reciteToday(who, lang);
    var zh = lang === 'zh';
    var body = '<p class="small muted" style="margin:0">' + (zh ? '今天背一首。One piece today: say it once, carefully. ' : 'One piece today: say it once, carefully. ') + 'Tap "Practised" when you have, and give it a star once you can say it all by heart.</p>';
    var ordered = [today].concat(list.filter(function (r) { return r !== today; }));
    ordered.forEach(function (r, idx) {
      if (idx === 1) body += '<div class="kicker" style="margin-top:14px">The other pieces · ' + (zh ? '其他' : 'coming on later days') + '</div>';
      if (idx === 0 && open[r.id] === undefined) { open[r.id] = true; ui.reciteOpen = open; }
      if (idx === 0) body += '<div class="kicker" style="margin-top:10px">Today · 今天</div>';
      var st = S.recite[r.id] || {}; var isOpen = open[r.id];
      body += '<div class="card"><div class="nav"><div style="min-width:0"><h3 style="margin:0">' + (st.known ? '⭐ ' : '') + esc(r.title) + '</h3>' + (r.by ? '<span class="small muted">' + esc(r.by) + '</span>' : '') + '<div class="small muted">Practised ' + (st.count || 0) + ' time' + ((st.count || 0) === 1 ? '' : 's') + '</div></div>' +
        '<button class="btn ghost small" data-act="reciteopen" data-v="' + r.id + '">' + (isOpen ? 'Hide words' : 'Show words') + '</button></div>' +
        (isOpen ? reciteText(r, who) : '') +
        '<div class="btns" style="margin-top:10px"><button class="btn small" data-act="recitepractise" data-v="' + r.id + '">Practised ✓</button><button class="btn ghost small" data-act="reciteknown" data-v="' + r.id + '">' + (st.known ? 'Remove star' : 'I know it by heart ⭐') + '</button></div>' +
        (isOpen || idx === 0 ? recBox('recite:' + who + ':' + (zh ? 'zh' : 'en') + ':' + r.id, zh ? '录音 · Record your recitation' : 'Record your recitation') : '') + '</div>';
    });
    body += '<div class="btns">' + tickButton(tickId, 'Recitation done', 'Recitation done for today') + '</div>';
    return { title: (zh ? 'Chinese recitation · ' : 'Recitation · ') + (who === 'emma' ? 'Emma' : 'Emily'), who: who, body: body };
  }

  // One recitation piece, opened from the weekly recitation loop.
  function reciteOneSheet(who, lang, id, tickId) {
    var r = reciteList(who, lang).filter(function (x) { return x.id === id; })[0];
    if (!r) return { title: 'Recitation', who: who, body: '<p class="muted">This piece is no longer in the list.</p>' };
    var st = S.recite[r.id] || {}; var zh = lang === 'zh';
    var body = '<p class="small muted" style="margin:0">' + (zh ? '今天背这一首。' : '') + 'Say it once, carefully. Tap "Practised" when you have, and give it a star once you can say it all by heart.</p>' +
      '<div class="card"><h3 style="margin:0">' + (st.known ? '⭐ ' : '') + esc(r.title) + '</h3>' + (r.by ? '<span class="small muted">' + esc(r.by) + '</span>' : '') +
      '<div class="small muted">Practised ' + (st.count || 0) + ' time' + ((st.count || 0) === 1 ? '' : 's') + '</div>' + reciteText(r, who) +
      '<div class="btns" style="margin-top:10px"><button class="btn small" data-act="recitepractise" data-v="' + r.id + '">Practised ✓</button><button class="btn ghost small" data-act="reciteknown" data-v="' + r.id + '">' + (st.known ? 'Remove star' : 'I know it by heart ⭐') + '</button></div>' +
      recBox('recite:' + who + ':' + (zh ? 'zh' : 'en') + ':' + r.id, zh ? '录音 · Record your recitation' : 'Record your recitation') + '</div>';
    var lid = (zh ? 'lrz_' : 'lre_') + r.id, cdx = cur();
    if (cdx) { var wdx = weekDone(cdx.w); body += '<div class="btns"><button class="btn' + (wdx[lid] ? ' ghost' : '') + '" data-act="loopdone" data-v="' + lid + '">' + (wdx[lid] ? '✓ Said this week (tap to undo)' : 'Said it today') + '</button></div>'; }
    return { title: (zh ? 'Chinese recitation · ' : 'Recitation · ') + (who === 'emma' ? 'Emma' : 'Emily'), who: who, body: body };
  }

  function currentSong(key) { var G = C.songs[key]; var id = S.songCur[key]; return G.options.filter(function (o) { return o.id === id; })[0] || G.options[0]; }
  function songSheet(key) {
    var G = C.songs[key]; var s = currentSong(key);
    var body = '<div class="card"><div class="kicker">' + esc(G.label) + ' · ' + esc(s.when || '') + '</div><h3 style="font-family:' + (/[一-鿿]/.test(s.title) ? 'var(--f-zh)' : 'var(--f-display)') + '">' + esc(s.title) + '</h3>' + (s.by ? '<p class="small muted" style="margin:0">' + esc(s.by) + '</p>' : '') +
      videoSlot('song_' + key + '_' + s.id) + (s.note ? '<p class="small muted" style="margin:6px 0 0">' + esc(s.note) + '</p>' : '') +
      (s.lyrics ? '<div class="poem" style="font-size:19px">' + esc(s.lyrics) + '</div>' + (s.lyricsSrc ? '<p class="small muted" style="margin:6px 0 0">' + esc(s.lyricsSrc) + '</p>' : '') : '') + myWords(key, s) + '</div>';
    body += '<div class="card"><h3>Songs for this slot</h3><ul class="list">' + G.options.map(function (o) { return '<li class="' + (o.id === s.id ? 'cur' : '') + '"><span><b>' + esc(o.title) + '</b> <span class="small muted">' + esc(o.when || '') + '</span></span>' + (o.id === s.id ? '<span class="small">Singing now</span>' : '<button class="btn ghost small" data-act="setsong" data-k="' + key + '" data-v="' + o.id + '">Sing this</button>') + '</li>'; }).join('') + '</ul><p class="small muted">' + esc(G.source) + '</p></div>';
    return { title: esc(G.label), who: 'together', body: body };
  }

  function myWords(key, s) {
    var k = key + '_' + s.id; var mine = (S.lyrics || {})[k] || '';
    if (ui.wordsEdit === k) return '<div style="margin-top:10px"><label class="small" for="mywords"><b>My words</b> (kept on this iPad)</label><textarea id="mywords" style="min-height:200px;font:inherit;font-size:16px;margin-top:4px">' + esc(mine) + '</textarea><div class="btns" style="margin-top:6px"><button class="btn small" data-act="wordssave" data-v="' + k + '">Save words</button><button class="btn ghost small" data-act="wordsedit" data-v="">Cancel</button></div></div>';
    return (mine ? '<div class="kicker" style="margin-top:12px">My words</div><div class="poem" style="font-size:19px">' + esc(mine) + '</div>' : '') +
      '<div class="btns" style="margin-top:8px"><button class="btn ghost small" data-act="wordsedit" data-v="' + k + '">' + (mine ? 'Edit my words' : (s.lyrics ? '＋ Add more words' : '＋ Add the words')) + '</button></div>';
  }
  function danceSheet() {
    var F = C.dance.folk; var i = (S.ptr.dance ? S.ptr.dance.i : 0) % F.list.length;
    var body = '<div class="card"><div class="kicker">Folk dance · next up</div><h3>' + esc(F.list[i]) + '</h3>' + videoSlot('dance_' + i, (F.videos || {})[F.list[i]]) + '<div class="btns" style="margin-top:10px"><button class="btn" data-act="ptr" data-k="dance" data-d="1">We danced it · next dance ›</button><button class="btn ghost small" data-act="ptr" data-k="dance" data-d="-1">‹ Back</button></div></div>' +
      '<div class="card"><h3>The rotation</h3><ul class="list">' + F.list.map(function (d, k) { return '<li class="' + (k === i ? 'cur' : '') + '"><span>' + (k + 1) + '. ' + esc(d) + '</span><button class="btn ghost small" data-act="setptr" data-k="dance" data-v="' + k + '">Go</button></li>'; }).join('') + '</ul><p class="small muted">' + esc(F.source) + '</p></div>';
    return { title: 'Folk dance', who: 'together', body: body };
  }
  function tiktokSheet() {
    var T = C.dance.tiktok;
    return { title: 'TikTok dance', who: 'together', body: '<p class="small muted" style="margin:0">' + esc(T.note) + '</p>' + T.list.map(function (d) { return '<div class="card"><h3>' + esc(d.title) + '</h3><p class="small muted" style="margin:0">' + esc(d.by) + '</p><p style="margin:6px 0 0">' + esc(d.note) + '</p>' + linkSlot('tiktok_' + d.title) + '</div>'; }).join('') };
  }
  function solfaSheet() {
    var F = C.solfa; var i = Math.min(S.ptr.solfa ? S.ptr.solfa.i : 0, F.lessons.length);
    var yt = function (k) { return 'https://www.youtube.com/watch?v=' + F.videos[k]; };
    var body = '<div class="card"><div class="kicker">Solfa Sofa · ' + esc(F.unit) + '</div><h3>' + (i < F.lessons.length ? esc(F.lessons[i]) : 'Unit 3 finished') + '</h3>' +
      (i < F.lessons.length ? '<a class="btn" style="display:inline-flex;align-items:center;text-decoration:none;margin:4px 0 10px" href="' + yt(i) + '" target="_blank" rel="noopener">▶ Play ' + esc(F.lessons[i]) + '</a>' : '') +
      '<div class="btns"><button class="btn ghost" data-act="ptr" data-k="solfa" data-d="1">Lesson done · next ›</button><button class="btn ghost small" data-act="ptr" data-k="solfa" data-d="-1">‹ Back</button></div>' +
      '<p class="small muted" style="margin:10px 0 0">Opens the lesson video on YouTube, so it needs internet. <a href="' + esc(F.resources) + '" target="_blank" rel="noopener">Unit 3 printables ↗</a></p></div>' +
      '<div class="card"><ul class="list">' + F.lessons.map(function (l, k) { return '<li class="' + (k === i ? 'cur' : '') + '"><span>' + (k < i ? '✓ ' : '') + esc(l) + '</span><span class="btns"><a class="btn ghost small" style="text-decoration:none" href="' + yt(k) + '" target="_blank" rel="noopener">▶ Play</a><button class="btn ghost small" data-act="setptr" data-k="solfa" data-v="' + k + '">Set as current</button></span></li>'; }).join('') + '</ul></div>';
    return { title: 'Solfa', who: 'together', body: body };
  }
  function pictureSheet() {
    var P = C.pictures; var i = (S.ptr.picture ? S.ptr.picture.i : 0) % P.list.length; var p = P.list[i];
    var M = P.method || {}; var A = (P.artists || {})[p.artist];
    var hidden = ui.picHide === i, more = ui.picMore === i;
    var body = '<div class="card pic"><div class="kicker">Picture ' + (i + 1) + ' of ' + P.list.length + ' · ' + esc(p.artist) + '</div><h3>' + esc(p.title) + '</h3><p class="small muted" style="margin:0 0 10px">' + esc(p.date) + ' · ' + esc(p.where) + '</p>' +
      (hidden ? '<div style="aspect-ratio:4/3;border-radius:10px;background:var(--sunk);display:grid;place-items:center;text-align:center;padding:16px"><div><p style="font-size:20px;margin:0 0 6px"><b>The picture is turned over.</b></p><p class="muted" style="margin:0">Tell everything you saw. Leave nothing out.</p></div></div>'
        : '<img src="' + esc(p.img) + '" alt="' + esc(p.title + ' by ' + p.artist) + '" loading="lazy" data-fallback="This picture could not load.">') +
      '<div class="btns" style="margin-top:10px">' + (hidden ? '<button class="btn" data-act="pichide" data-v="">Turn it back: what did I miss?</button>' : '<button class="btn" data-act="pichide" data-v="' + i + '">I’ve looked: turn it over</button>') +
      (p.look ? '<button class="btn ghost" data-act="picmore" data-v="' + (more ? '' : i) + '">' + (more ? 'Hide Tell me more' : 'Tell me more') + '</button>' : '') + '</div>';
    if (more && p.look && !hidden) body += '<div style="margin-top:12px"><p style="margin:0 0 8px">' + esc(p.more || '') + '</p><p style="margin:0 0 4px"><b>Look for:</b></p><ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">' + p.look.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p class="small muted" style="margin:8px 0 0">' + esc(p.src || '') + '</p></div>';
    body += '<div class="nav" style="margin-top:12px"><button class="btn ghost small" data-act="ptr" data-k="picture" data-d="-1">‹ Previous</button><button class="btn ghost small" data-act="ptr" data-k="picture" data-d="1">Next picture ›</button></div></div>';
    if (M.steps) body += '<div class="card"><h3>How we study a picture</h3><ol style="margin:0;padding-left:22px;display:flex;flex-direction:column;gap:6px">' + M.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol><p class="small" style="margin:10px 0 0"><i>' + esc(M.quote) + '</i></p></div>';
    if (M.memory) body += '<div class="card" style="--who:var(--emma)"><div class="kicker">' + esc(M.memory.who) + '</div><h3>Draw it from memory</h3><ol style="margin:0;padding-left:22px;display:flex;flex-direction:column;gap:6px">' + M.memory.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol><p class="small muted" style="margin:8px 0 0">' + esc(M.memory.src) + '</p></div>';
    if (A) body += '<details class="card"><summary><b>Meet the artist: ' + esc(p.artist) + '</b></summary>' + A.story.map(function (x) { return '<p style="margin:8px 0">' + esc(x) + '</p>'; }).join('') + '<p class="small muted" style="margin:0">' + esc(A.src) + '</p></details>';
    body += '<div class="thumbs">' + P.list.map(function (q, k) { return '<button data-act="setptr" data-k="picture" data-v="' + k + '" aria-current="' + (k === i) + '" aria-label="' + esc(q.title) + '"><img src="' + esc(q.img) + '" alt="" loading="lazy"></button>'; }).join('') + '</div>' +
      '<p class="small muted">' + esc(P.label) + '. ' + esc(P.source) + ' ' + esc(M.src || '') + '</p>';
    return { title: 'Artist study', who: 'together', body: body };
  }
  function musicSheet() {
    var M = C.music; var P = M.pieces || []; var n = P.length || M.list.length; var i = (S.ptr.music ? S.ptr.music.i : 0) % n; var p = P[i];
    var body = '';
    if (p) {
      body += '<div class="card"><div class="kicker">Piece ' + (i + 1) + ' of ' + n + ' · ' + esc(p.when) + '</div><h3>' + esc(p.title) + '</h3><p style="margin:0 0 8px">' + esc(p.about) + '</p>' +
        '<p style="margin:0 0 4px"><b>Listen for:</b></p><ul style="margin:0 0 10px;padding-left:20px;display:flex;flex-direction:column;gap:6px">' + p.listen.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        (p.alt ? '<p class="small" style="background:var(--sunk);padding:8px 10px;border-radius:8px">' + esc(p.alt) + '</p>' : '') +
        audioSlot('music_' + i) + linkSlot('music_' + i, 'Add a performance you like (YouTube or another site). Links show on every iPad and need internet to play.') +
        (p.rec && p.rec.length ? '<p class="small" style="margin:10px 0 4px"><b>Free recordings online</b> (open and press play):</p><ul class="list">' + p.rec.map(function (r) { return '<li><span>' + esc(r.label) + ' <span class="small muted">' + esc(r.lic) + '</span></span><a class="btn ghost small" href="' + esc(r.url) + '" target="_blank" rel="noopener">▶ Listen</a></li>'; }).join('') + '</ul>' : '<p class="small muted" style="margin:10px 0 0">No free recording of this one yet; use a CD or your music app.</p>') +
        '<div class="nav" style="margin-top:12px"><button class="btn ghost small" data-act="ptr" data-k="music" data-d="-1">‹ Back</button><button class="btn" data-act="ptr" data-k="music" data-d="1">Next piece ›</button></div></div>';
    }
    if (M.how) body += '<div class="card"><h3>How we listen</h3><p style="margin:0">' + esc(M.how) + '</p></div>';
    if (M.story) body += '<details class="card"' + (i === 0 ? ' open' : '') + '><summary><b>Meet the composer: ' + esc(M.label) + '</b></summary>' + M.story.map(function (x) { return '<p style="margin:8px 0">' + esc(x) + '</p>'; }).join('') + '</details>';
    body += '<div class="card"><ul class="list">' + M.list.map(function (m, k) { return '<li class="' + (k === i ? 'cur' : '') + '"><span>' + (k + 1) + '. ' + esc(m) + '</span><button class="btn ghost small" data-act="setptr" data-k="music" data-v="' + k + '">Go</button></li>'; }).join('') + '</ul><p class="small muted">' + esc(M.source) + '</p></div>';
    return { title: 'Composer study', who: 'together', body: body };
  }
  var aurls = {};
  function audioSlot(id) {
    var key = 'aud_' + id;
    if (aurls[key]) return '<audio controls preload="metadata" src="' + aurls[key] + '" style="width:100%;margin-top:6px"></audio><div class="btns" style="margin-top:6px"><button class="btn ghost small" data-act="audpick" data-v="' + key + '">Change recording</button><button class="btn ghost small" data-act="auddel" data-v="' + key + '">Remove</button></div>';
    vget(key).then(function (b) { if (b && !aurls[key]) { aurls[key] = URL.createObjectURL(b); refreshSheet(); } });
    return '<div class="btns" style="margin-top:6px"><button class="btn ghost small" data-act="audpick" data-v="' + key + '">🎵 Add a recording from Files</button></div><p class="small muted" style="margin:4px 0 0">Saved on this iPad, so it plays without internet.</p>';
  }
  var apicker = document.createElement('input'); apicker.type = 'file'; apicker.accept = 'audio/*'; apicker.hidden = true; document.body.appendChild(apicker);
  apicker.addEventListener('change', function () {
    var f = apicker.files && apicker.files[0]; var key = apicker.getAttribute('data-for'); apicker.value = ''; if (!f || !key) return;
    vput(key, f).then(function () { if (aurls[key]) URL.revokeObjectURL(aurls[key]); aurls[key] = URL.createObjectURL(f); toast('Recording saved'); refreshSheet(); }).catch(function () { toast('Could not save that file'); });
  });


  function drawingSheet() {
    var D = C.drawing; var add = ui.drawAdd; var view = ui.drawView;
    if (view) {
      var vx = (S.drawing[view.who] || []).filter(function (x) { return x.t === view.t; })[0];
      if (vx) {
        var vg = D[view.who].goals.filter(function (q) { return q.id === vx.g; })[0];
        return { title: 'Drawing', who: view.who, body: '<div class="card pic"><div class="kicker">' + (view.who === 'emma' ? 'Emma' : 'Emily') + ' · day ' + vx.n + '</div><h3>' + esc(vg ? vg.name : '') + '</h3>' + (vx.note ? '<p style="margin:0 0 8px">' + esc(vx.note) + '</p>' : '') + (vx.photo ? artImg(vx.t, '') : '<p class="muted">No photo for this one.</p>') + '</div><div class="btns"><button class="btn ghost" data-act="drawview" data-v="">‹ Back</button>' + delBtn(view.who, vx.t) + '</div>' };
      }
      ui.drawView = null;
    }
    var body = '';
    if (add) {
      var AG = D[add.who];
      body += '<div class="card" style="--who:var(--' + add.who + ')"><div class="kicker">New drawing · ' + (add.who === 'emma' ? 'Emma' : 'Emily') + '</div>' +
        '<label class="small" for="draw-goal">What kind of drawing?</label><select id="draw-goal" style="margin:4px 0 10px">' + AG.goals.map(function (g) { return '<option value="' + g.id + '"' + (g.id === add.g ? ' selected' : '') + '>' + esc(g.name) + '</option>'; }).join('') + '</select>' +
        '<label class="small" for="draw-note">What did you draw? (optional)</label><input type="text" id="draw-note" placeholder="A hibiscus flower from the garden" style="margin:4px 0 10px">' +
        '<div class="btns"><button class="btn ghost" data-act="drawphoto">📷 ' + (ui.drawPhoto ? 'Photo added ✓' : 'Add a photo') + '</button><button class="btn" data-act="drawsave">Save drawing</button><button class="btn ghost" data-act="drawcancel">Cancel</button></div>' +
        (ui.drawPhoto ? '<img src="' + ui.drawPhoto.url + '" alt="Photo of the drawing" style="margin-top:10px;max-height:240px;width:auto;border-radius:8px">' : '') + '</div>';
    }
    body += '<div class="grid2">' + ['emma', 'emily'].map(function (who) {
      var G = D[who]; var log = S.drawing[who] || [];
      return '<div class="card" style="--who:var(--' + who + ')"><div class="nav"><div class="kicker">' + (who === 'emma' ? 'Emma' : 'Emily') + ' · ' + esc(G.form) + '</div><button class="btn small" data-act="drawadd" data-who="' + who + '" data-g="' + G.goals[0].id + '">＋ Add drawing</button></div><p class="small muted" style="margin:4px 0 8px">' + esc(G.note) + '</p>' +
        G.goals.map(function (g) {
          var n = log.filter(function (x) { return x.g === g.id; }).length;
          var dots = g.target ? '<span class="dots" aria-label="' + n + ' of ' + g.target + '">' + Array.from({ length: g.target }, function (_, k) { return '<i class="' + (k < n ? 'f' : '') + '"></i>'; }).join('') + '</span>' : '<span class="small"><b>' + n + '</b> done</span>';
          return '<div class="goal"><div style="min-width:0"><b>' + esc(g.name) + '</b>' + (g.hint ? '<div class="small muted">' + esc(g.hint) + '</div>' : '') + '<div style="margin-top:4px">' + dots + '</div></div><button class="btn ghost small" data-act="drawadd" data-who="' + who + '" data-g="' + g.id + '" aria-label="Add a ' + esc(g.name) + '">＋</button></div>';
        }).join('') +
        (log.length ? '<h3 style="font-size:17px;margin-top:12px">Drawings so far</h3><div class="thumbs">' + log.slice().reverse().map(function (x) {
          return '<button data-act="drawview" data-who="' + who + '" data-v="' + x.t + '" aria-label="Open drawing from day ' + x.n + '">' + (x.photo ? artImg(x.t, 'thumb') : '<span class="small" style="padding:6px;display:block">Day ' + x.n + '<br>' + esc((G.goals.filter(function (q) { return q.id === x.g; })[0] || {}).name || '') + '</span>') + '</button>';
        }).join('') + '</div><p class="small muted" style="margin:6px 0 0">Tap a drawing to see it or remove it.</p>' : '') + '</div>';
    }).join('') + '</div>' +
      '<div class="card"><div class="nav"><h3 style="margin:0">Brushwork lessons</h3><button class="btn small" data-act="sheet" data-v="brush">Open lessons ›</button></div><p class="small muted" style="margin:6px 0 0">Hudson’s 30 brushwork plates with the Happy Handicrafts video for each, plus Mallam’s brush drawing and the Parents’ Review steps.</p></div>' +
      '<div class="card"><h3>Drawing resources</h3><ul style="margin:0;padding-left:20px">' + D.resources.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div>';
    return { title: 'Drawing', who: 'together', body: body };
  }
  function delBtn(who, t) {
    var armed = ui.drawDel === t;
    return '<button class="btn ghost" data-act="drawdel" data-who="' + who + '" data-t="' + t + '" style="' + (armed ? 'color:var(--warn);border-color:var(--warn)' : '') + '">' + (armed ? 'Tap again to remove' : 'Remove this drawing') + '</button>';
  }
  var artUrls = {};
  function artImg(t, cls) {
    var id = 'art_' + t;
    if (artUrls[id] === 'none') return '<span class="small muted" style="padding:6px;display:block">Photo is on another device</span>';
    if (artUrls[id]) return '<img src="' + artUrls[id] + '" alt="Photo of the drawing"' + (cls === 'thumb' ? '' : ' style="border-radius:8px"') + '>';
    vget(id).then(function (b) { artUrls[id] = b ? URL.createObjectURL(b) : 'none'; refreshSheet(); });
    return '<span class="small muted" style="padding:6px;display:block">Loading…</span>';
  }
  function shrinkPhoto(file) {
    return new Promise(function (res) {
      var url = URL.createObjectURL(file); var im = new Image();
      im.onload = function () {
        var max = 1400, w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob(function (b) { res(b || file); }, 'image/jpeg', 0.82);
      };
      im.onerror = function () { URL.revokeObjectURL(url); res(file); };
      im.src = url;
    });
  }
  var ppicker = document.createElement('input'); ppicker.type = 'file'; ppicker.accept = 'image/*'; ppicker.hidden = true; document.body.appendChild(ppicker);
  ppicker.addEventListener('change', function () {
    var f = ppicker.files && ppicker.files[0]; ppicker.value = ''; if (!f) return;
    if (ui.picFor) { var PF = ui.picFor; ui.picFor = null; shrinkPhoto(f).then(function (b) { var t = Date.now(); return vput('art_' + t, b).then(function () { artUrls['art_' + t] = URL.createObjectURL(b); var m = (S.craftPics = S.craftPics || {}); (m[PF.k] = m[PF.k] || []).push({ who: PF.who, t: t, n: cur() ? cur().n : 0 }); save(); toast('Photo saved'); refreshSheet(); }); }).catch(function () { toast('The photo could not be saved'); }); return; }
    var note = document.getElementById('draw-note'); var g = document.getElementById('draw-goal');
    if (ui.drawAdd) { ui.drawAdd.note = note ? note.value : ''; ui.drawAdd.g = g ? g.value : ui.drawAdd.g; }
    shrinkPhoto(f).then(function (b) { if (ui.drawPhoto) URL.revokeObjectURL(ui.drawPhoto.url); ui.drawPhoto = { blob: b, url: URL.createObjectURL(b) }; refreshSheet(); var n2 = document.getElementById('draw-note'); if (n2 && ui.drawAdd) n2.value = ui.drawAdd.note || ''; });
  });

  // ---------- simple lesson sheets (handicrafts, Book of Centuries, service) ----------
  function centurySheet() {
    var B = C.century;
    return { title: 'Book of Centuries', who: 'together', body: '<div class="card" style="background:var(--sunk)"><p style="margin:0"><b>' + esc(B.start) + '</b></p></div>' +
      '<div class="card"><ol style="margin:0;padding-left:22px;display:flex;flex-direction:column;gap:10px">' + B.steps.map(function (st) { return '<li><b>' + esc(st.t) + '.</b> ' + esc(st.d) + '</li>'; }).join('') + '</ol></div>' + (B.print ? '<div class="card"><h3 style="margin:0 0 6px">Print the book</h3><p style="margin:0 0 8px">' + esc(B.print.about) + '</p>' + B.print.vols.map(function (v) { return '<p style="margin:10px 0 4px"><b>' + esc(v.title) + '</b> <span class="small muted">(' + v.sheets + ' sheets)</span></p><div class="btns" style="margin:0 0 4px"><a class="btn" href="' + v.booklet + '" target="_blank" rel="noopener">🖨 Booklet to print and fold</a><a class="btn ghost" href="' + v.a5 + '" target="_blank" rel="noopener">A5 pages in order</a></div><details><summary class="small">Which page is which</summary><div style="columns:3 140px;column-gap:16px;margin-top:6px;font-size:14px">' + v.index.map(function (r) { return '<div>' + esc(r[0]) + ' <span class="muted">p. ' + r[1] + '–' + (r[1] + 1) + '</span></div>'; }).join('') + '</div></details>'; }).join('') + '<ul style="margin:10px 0 8px;padding-left:20px">' + B.print.how.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p class="small muted" style="margin:8px 0 0">For home, there is also <a href="' + B.print.big + '" target="_blank" rel="noopener">the larger book on Miss Bernau’s plan</a> (' + B.print.bigPages + ' A4 pages).</p></div>' : '') + '<p class="small muted">' + esc(B.source) + '</p>' };
  }
  function serviceSheet() {
    var V = C.service; var st = S.service || (S.service = {});
    var body = '<p style="margin:0">' + esc(V.intro) + '</p><div class="rows">' + V.people.map(function (p, k) {
      var e = st[k] || {}; var stage = e.stage || 0; var labels = ['Not started', 'Idea chosen', 'Making', 'Wrapped ✓'];
      return '<div class="row' + (stage === 3 ? ' done' : '') + '"><span class="emoji" aria-hidden="true">🎁</span><div class="lbl" style="cursor:default"><b>' + esc(p) + '</b><input type="text" data-act="svcidea" data-v="' + k + '" value="' + esc(e.idea || '') + '" placeholder="Present idea" aria-label="Present idea for ' + esc(p) + '" style="margin-top:4px"></div><button class="btn small' + (stage === 3 ? '' : ' ghost') + '" data-act="svcstage" data-v="' + k + '">' + labels[stage] + '</button></div>';
    }).join('') + '</div>' +
      '<div class="card"><h3>Ideas</h3>' + V.ideas.map(function (g) { return '<p style="margin:8px 0 2px"><b>' + esc(g.from) + '</b></p><ul style="margin:0;padding-left:20px">' + g.list.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; }).join('') + '</div>';
    return { title: 'Christmas presents', who: 'together', body: body };
  }
  function craftSheet(key, L, extraTop) {
    var pos = (S.craft = S.craft || {});
    var who = L.who || 'together';
    var idx = Math.max(0, Math.min(L.lessons.length - 1, pos[key] == null ? (L.start || 0) : pos[key]));
    var view = ui.craftView && ui.craftView.key === key ? ui.craftView.i : idx;
    var les = L.lessons[view];
    var done = L.lessons.filter(function (x, k) { return !x.skip && k < idx; }).length;
    var body = extraTop || '';
    if (L.intro) body += '<p style="margin:0">' + esc(L.intro) + '</p>';
    if (done) body += '<p class="small muted" style="margin:0">' + done + ' finished so far.</p>';
    function yt(id, label) { return '<a class="btn" href="https://www.youtube.com/watch?v=' + id + '" target="_blank" rel="noopener">▶ ' + label + '</a>'; }
    body += '<div class="card"><div class="nav"><button class="btn ghost small" data-act="craftgo" data-k="' + key + '" data-v="' + (view - 1) + '"' + (view <= 0 ? ' disabled' : '') + ' aria-label="Previous lesson">‹</button><div class="kicker" style="text-align:center">' + (les.skip ? 'Read first' : 'Lesson ' + L.lessons.slice(0, view + 1).filter(function (x) { return !x.skip; }).length + ' of ' + L.lessons.filter(function (x) { return !x.skip; }).length) + (view === idx ? ' · you are here' : '') + '</div><button class="btn ghost small" data-act="craftgo" data-k="' + key + '" data-v="' + (view + 1) + '"' + (view >= L.lessons.length - 1 ? ' disabled' : '') + ' aria-label="Next lesson">›</button></div>' +
      '<h3 style="margin-top:8px">' + esc(les.title) + '</h3>' +
      (les.forWho ? '<p class="small muted" style="margin:-4px 0 8px">' + esc(les.forWho) + '</p>' : '') +
      (les.video || les.video2 ? '<div class="btns" style="margin:0 0 10px">' + (les.video ? yt(les.video, 'Watch the lesson') : '') + (les.video2 ? yt(les.video2, 'Watch along (live class)') : '') + '</div>' : '') +
      (les.intro ? '<p style="margin:0 0 8px"><i>' + esc(les.intro) + '</i></p>' : '') +
      (les.need ? '<p style="margin:0 0 8px"><b>You need:</b> ' + esc(les.need) + '</p>' : '') +
      (les.img ? les.img.map(function (im) { return '<figure style="margin:8px 0"><img src="' + im.src + '" alt="' + esc(im.alt || '') + '" style="max-width:100%;border-radius:8px;background:#fff" loading="lazy"><figcaption class="small muted">' + esc(im.cap || '') + '</figcaption></figure>'; }).join('') : '') +
      (les.steps && les.steps.length ? '<ol style="margin:0;padding-left:22px;display:flex;flex-direction:column;gap:8px">' + les.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' : '') +
      (les.sections ? les.sections.map(function (sec) { return '<h4 style="margin:14px 0 6px;font-size:16px">' + esc(sec.h) + '</h4><ol style="margin:0;padding-left:22px;display:flex;flex-direction:column;gap:6px">' + sec.list.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>'; }).join('') : '') +
      (les.text ? les.text.map(function (x) { return Array.isArray(x) ? '<p style="margin:8px 0"><b>' + esc(x[0]) + '.</b> ' + esc(x[1]) + '</p>' : '<p style="margin:8px 0">' + esc(x) + '</p>'; }).join('') : '') +
      (les.links ? '<div class="btns" style="margin:10px 0 0">' + les.links.map(function (l) { return '<a class="btn ghost small" href="' + esc(l[1]) + '" target="_blank" rel="noopener">' + esc(l[0]) + ' ↗</a>'; }).join('') + '</div>' : '') +
      (les.tip ? '<p class="small" style="background:var(--sunk);padding:8px 10px;border-radius:8px;margin:10px 0 0">' + esc(les.tip) + '</p>' : '') +
      (les.src ? '<p class="small muted" style="margin:10px 0 0">' + esc(les.src) + '</p>' : '') + '</div>';
    body += lessonPicsHTML(key + ':' + view, L.who);
    if (view === idx) body += '<div class="btns"><button class="btn" data-act="craftdone" data-k="' + key + '">' + (les.skip ? 'I’ve read it ✓' : 'I finished this one ✓') + '</button></div>';
    else body += '<div class="btns"><button class="btn ghost" data-act="crafthere" data-k="' + key + '" data-v="' + view + '">Make this my lesson</button><button class="btn ghost" data-act="craftgo" data-k="' + key + '" data-v="' + idx + '">Back to my lesson</button></div>';
    if (L.source && L.source !== les.src) body += '<p class="small muted">' + esc(L.source) + '</p>';
    return { title: L.title, who: who, body: body };
  }
  function lessonPicsHTML(pk, onlyWho) {
    var pics = (S.craftPics && S.craftPics[pk]) || [];
    var kids = onlyWho === 'emma' || onlyWho === 'emily' ? [onlyWho] : ['emma', 'emily'];
    var open = ui.picView;
    var h = '<div class="card"><h3 style="margin:0 0 6px">Finished work</h3>';
    if (open && open.k === pk) {
      var px = pics.filter(function (x) { return x.t === open.t; })[0];
      if (px) return h + '<div class="pic">' + artImg(px.t, '') + '</div><p class="small muted" style="margin:6px 0">' + (px.who === 'emma' ? 'Emma' : 'Emily') + (px.n ? ' · day ' + px.n : '') + '</p><div class="btns"><button class="btn ghost small" data-act="picview" data-k="' + pk + '">Back</button><button class="btn ghost small" data-act="picdel" data-k="' + pk + '" data-v="' + px.t + '">' + (ui.picDel === px.t ? 'Tap again to remove' : 'Remove photo') + '</button></div></div>';
    }
    h += kids.map(function (w) {
      var mine = pics.filter(function (x) { return x.who === w; });
      return '<div style="margin:6px 0"><div class="nav"><b style="color:var(--' + w + ')">' + (w === 'emma' ? 'Emma' : 'Emily') + '</b><button class="btn ghost small" data-act="picadd" data-k="' + pk + '" data-who="' + w + '">📷 Add photo</button></div>' +
        (mine.length ? '<div class="thumbs" style="margin-top:6px">' + mine.map(function (x) { return '<button data-act="picview" data-k="' + pk + '" data-v="' + x.t + '" aria-label="Open photo">' + artImg(x.t, 'thumb') + '</button>'; }).join('') + '</div>' : '<p class="small muted" style="margin:4px 0 0">No photo yet.</p>') + '</div>';
    }).join('');
    return h + '</div>';
  }
  function craftData(key) { return (C.crafts || {})[key]; }
  function lessonsSheet(key) {
    var C2 = C.crafts || {};
    var real = key, top = '';
    function seg(opts, cur, act) { return '<div class="seg" role="group" style="margin-bottom:4px">' + opts.map(function (o) { return '<button data-act="' + act + '" data-v="' + o[0] + '" class="' + (o[0] === cur ? 'on' : '') + '" aria-pressed="' + (o[0] === cur) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div>'; }
    if (key === 'brush') { real = (S.craftTrack && S.craftTrack.brush) || 'brush'; top = seg([['brush', 'Brushwork videos (Hudson)'], ['brushm', 'Brush drawing (Mallam)'], ['brushpr', 'Parents’ Review steps']], real, 'brushtrack'); }
    if (key === 'needle') {
      var nw = ui.needleWho || (S.profile === 'emma' ? 'emma' : 'emily');
      real = 'needle_' + nw; top = seg([['emily', 'Emily'], ['emma', 'Emma']], nw, 'needlewho');
    }
    var L = C2[real];
    if (!L) return { title: 'Handicraft', who: 'together', body: '<div class="card"><p style="margin:0">The lessons for this handicraft are being added.</p></div>' };
    return craftSheet(real, L, top);
  }


  // ---------- videos kept on this iPad (picked once from Photos, stored in the app) ----------
  var vdb = null, vurls = {}, vhave = {};
  function vopen() {
    if (vdb) return vdb;
    vdb = new Promise(function (res, rej) {
      try { var r = indexedDB.open('schooldays-videos', 1); r.onupgradeneeded = function () { r.result.createObjectStore('v'); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; } catch (e) { rej(e); }
    });
    return vdb;
  }
  function vget(id) { return vopen().then(function (db) { return new Promise(function (res) { var q = db.transaction('v').objectStore('v').get(id); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; }); }); }
  function vput(id, blob) { return vopen().then(function (db) { return new Promise(function (res, rej) { var t = db.transaction('v', 'readwrite'); t.objectStore('v').put(blob, id); t.oncomplete = res; t.onerror = function () { rej(t.error); }; t.onabort = function () { rej(t.error); }; }); }); }
  function vdel(id) { return vopen().then(function (db) { return new Promise(function (res) { var t = db.transaction('v', 'readwrite'); t.objectStore('v').delete(id); t.oncomplete = res; t.onerror = res; }); }); }
  function videoSlot(id, bundled) { return videoSlot0(id, bundled) + linkSlot(id); }
  function videoSlot0(id, bundled) {
    if (bundled && !vurls[id]) {
      // A video that comes with the app: play it from the app, and keep a copy on the iPad for offline use.
      if (vhave[id] === undefined) { vhave[id] = 'loading'; vget(id).then(function (b) { if (b) { vurls[id] = URL.createObjectURL(b); vhave[id] = true; refreshSheet(); } else { vhave[id] = false; fetch(bundled).then(function (r) { return r.ok ? r.blob() : null; }).then(function (bl) { if (bl) return vput(id, bl); }).catch(function () {}); } }).catch(function () { vhave[id] = false; }); }
      return '<video src="' + esc(bundled) + '" controls playsinline preload="metadata" style="width:100%;border-radius:10px;background:#000;margin-top:8px"></video>';
    }
    if (vurls[id] && bundled) return '<video src="' + vurls[id] + '" controls playsinline preload="metadata" style="width:100%;border-radius:10px;background:#000;margin-top:8px"></video>';
    if (vurls[id]) return '<div class="vid"><video src="' + vurls[id] + '" controls playsinline preload="metadata" style="width:100%;border-radius:10px;background:#000;margin-top:8px"></video><div class="btns" style="margin-top:6px"><button class="btn ghost small" data-act="vidpick" data-v="' + id + '">Change video</button><button class="btn ghost small" data-act="viddel" data-v="' + id + '">Remove</button></div></div>';
    if (vhave[id] === undefined) { vhave[id] = 'loading'; vget(id).then(function (b) { if (b) { vurls[id] = URL.createObjectURL(b); vhave[id] = true; } else vhave[id] = false; refreshSheet(); }).catch(function () { vhave[id] = false; }); }
    if (vhave[id] === 'loading') return '<p class="small muted" style="margin:8px 0 0">Looking for the video…</p>';
    return '<div class="card" style="margin-top:8px;background:var(--sunk)"><p class="small" style="margin:0 0 8px">🎬 No video yet. Add it once from Photos and it stays in the app on this iPad, ready to play without wifi.</p><button class="btn small" data-act="vidpick" data-v="' + id + '">Add video from Photos</button><p class="small" data-vidmsg="' + id + '" style="margin:6px 0 0"></p></div>';
  }
  var vpicker = document.createElement('input'); vpicker.type = 'file'; vpicker.accept = 'video/*'; vpicker.hidden = true; document.body.appendChild(vpicker);
  vpicker.addEventListener('change', function () {
    var id = vpicker.getAttribute('data-for'); var f = vpicker.files && vpicker.files[0]; vpicker.value = '';
    if (!id || !f) return;
    var msg = document.querySelector('[data-vidmsg="' + id + '"]'); if (msg) msg.textContent = 'Saving the video…';
    vput(id, f).then(function () { if (vurls[id]) URL.revokeObjectURL(vurls[id]); vurls[id] = URL.createObjectURL(f); vhave[id] = true; toast('Video saved'); refreshSheet(); })
      .catch(function () { var m = document.querySelector('[data-vidmsg="' + id + '"]'); if (m) { m.style.color = 'var(--warn)'; m.textContent = 'The iPad did not have room to keep this video. Try a shorter video, or free up some space.'; } });
  });


  // ---------- video links: paste a YouTube, TikTok or other link once; it syncs to every iPad ----------
  function ytId(u) { var m = String(u).match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/); return m ? m[1] : null; }
  function linkHost(u) { var m = String(u).match(/^https?:\/\/(?:www\.|m\.)?([^\/?#]+)/i); return m ? m[1] : u; }
  function linkSlot(id, label) {
    var L = (S.links && S.links[id]) || {}, keys = Object.keys(L).sort();
    var h = '<div class="vlink">';
    keys.forEach(function (k) {
      var it = L[k], yid = ytId(it.u), play = ui.linkPlay === id + '|' + k;
      h += '<div class="vlink-row"><span class="small"><b>' + esc(it.t || (yid ? 'YouTube video' : linkHost(it.u))) + '</b> <span class="muted">' + esc(linkHost(it.u)) + '</span></span><span class="btns" style="margin:0">' +
        (yid ? '<button class="btn small" data-act="linkplay" data-v="' + esc(id + '|' + k) + '">' + (play ? 'Close' : '▶ Play here') + '</button>' : '') +
        '<a class="btn ' + (yid ? 'ghost ' : '') + 'small" style="text-decoration:none" href="' + esc(it.u) + '" target="_blank" rel="noopener">' + (yid ? 'Open in YouTube ↗' : '▶ Open video ↗') + '</a>' +
        '<button class="btn ghost small" data-act="linkdel" data-v="' + esc(id + '|' + k) + '">' + (ui.linkDel === id + '|' + k ? 'Tap again to remove' : 'Remove') + '</button></span></div>' +
        (play ? '<div class="vlink-frame"><iframe src="https://www.youtube-nocookie.com/embed/' + yid + '?playsinline=1&rel=0" title="' + esc(it.t || 'Video') + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>' : '');
    });
    var d = (ui.linkDraft || {})[id] || {};
    h += '<div class="vlink-add"><input type="url" inputmode="url" autocapitalize="off" autocorrect="off" id="lnk_' + esc(id) + '" data-link="' + esc(id) + '" value="' + esc(d.u || '') + '" placeholder="Paste a video link (YouTube, TikTok…)">' +
      '<input type="text" id="lnkt_' + esc(id) + '" data-linkt="' + esc(id) + '" value="' + esc(d.t || '') + '" placeholder="Name (optional)">' +
      '<button class="btn small" data-act="linkadd" data-v="' + esc(id) + '">' + (keys.length ? '＋ Add another link' : '＋ Save link') + '</button></div>' +
      '<p class="small muted" style="margin:4px 0 0">' + (label || 'Links are saved to the family account, so they show on every iPad. They need internet to play.') + '</p></div>';
    return h;
  }
  function linkAct(act, v) {
    var a, id, k;
    if (act === 'linkadd') {
      id = v; var inp = document.getElementById('lnk_' + id), tin = document.getElementById('lnkt_' + id), u = inp ? inp.value.trim() : '';
      if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
      if (!/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(u)) { toast('That doesn’t look like a link'); return; }
      S.links = S.links || {}; (S.links[id] || (S.links[id] = {}))[String(Date.now())] = { u: u, t: tin ? tin.value.trim() : '' };
      if (ui.linkDraft) delete ui.linkDraft[id]; save(); toast('Link saved'); refreshSheet();
    } else if (act === 'linkplay') { ui.linkPlay = ui.linkPlay === v ? null : v; refreshSheet(); }
    else if (act === 'linkdel') {
      if (ui.linkDel !== v) { ui.linkDel = v; refreshSheet(); return; }
      ui.linkDel = null; a = v.split('|'); id = a[0]; k = a[1];
      if (S.links && S.links[id]) { delete S.links[id][k]; save(); } refreshSheet();
    }
  }
  function linksSheet(id) {
    var label = id;
    (function walk(o) { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (o.id === id && o.label) label = o.label; for (var k in o) if (typeof o[k] === 'object') walk(o[k]); } })(C.lists);
    return { title: label, who: 'together', body: '<div class="card"><h3 style="margin-top:0">Videos for ' + esc(label) + '</h3>' + linkSlot('item_' + id) + '</div>' };
  }

  // ---------- stretching ----------
  function stretchSheet(tickId) {
    var st = C.stretch.steps; var i = Math.max(0, Math.min(st.length - 1, ui.stretchStep || 0)); var step = st[i];
    var body = '<div class="card pic"><div class="nav"><span class="kicker">Step ' + (i + 1) + ' of ' + st.length + '</span>' +
      (step.secs ? '<button class="timer" data-act="timer" data-id="stretch-' + i + '" data-mins="' + (step.secs / 60) + '" data-label="⏱ ' + step.secs + ' sec">⏱ ' + step.secs + ' sec</button>' : '') + '</div>' +
      '<h3>' + esc(step.title) + (step.sides ? ' <span class="small muted">(each side)</span>' : '') + '</h3>' +
      '<img src="' + esc(step.img) + '" alt="' + esc(step.title) + ' instructions from the leaflet" style="background:#fff">' +
      '</div><div class="nav"><button class="btn ghost" data-act="stretchstep" data-d="-1"' + (i === 0 ? ' disabled' : '') + '>‹ Back</button>' +
      (i < st.length - 1 ? '<button class="btn" data-act="stretchstep" data-d="1">Next: ' + esc(st[i + 1].title) + ' ›</button>' : tickButton(tickId, 'Stretching done', 'All done ✓')) + '</div>' +
      '<div class="card"><ul class="list">' + st.map(function (x, k) { return '<li class="' + (k === i ? 'cur' : '') + '"><span>' + (k + 1) + '. ' + esc(x.title) + '</span><button class="btn ghost small" data-act="stretchgo" data-v="' + k + '">Go</button></li>'; }).join('') + '</ul><p class="small muted">' + esc(C.stretch.source) + '</p></div>';
    return { title: 'Stretching', who: 'together', body: body };
  }

  // ---------- readings ----------
  function readingIndex(key) {
    var R = C.readings[key]; var p = S.ptr['reading_' + key];
    if (!p) { p = S.ptr['reading_' + key] = { i: Math.max(0, R.contents.indexOf(R.start)) }; save(); }
    return Math.max(0, Math.min(R.contents.length - 1, p.i));
  }
  function readingSheet(key) {
    var R = C.readings[key];
    if (R.pending) return { title: esc(R.label), who: 'together', body: '<div class="card"><div class="kicker">' + esc(R.label) + '</div><h3>' + esc(R.book) + '</h3><p style="margin:0">' + esc(R.pending) + '</p></div>' };
    var i = readingIndex(key); var title = R.contents[i]; var ch = R.chapters[title];
    var body = '<div class="card"><div class="kicker">' + esc(R.author) + ' · ' + esc(R.book) + ' · chapter ' + (i + 1) + ' of ' + R.contents.length + '</div><h3>' + esc(title) + '</h3>';
    if (!ch) body += '<p class="muted" style="margin:0">This chapter has not been added to the app yet.</p></div>';
    else {
      var paras = ch.text.split(/\n\s*\n/);
      var photos = ch.photos || [];
      body += '<div class="bible-text" style="display:flex;flex-direction:column;gap:10px">' + paras.map(function (pp) {
        var h = '<p style="margin:0;white-space:pre-line">' + esc(pp) + '</p>';
        photos.filter(function (ph) { return ph.after === pp.trim(); }).forEach(function (ph) {
          h += '<figure class="pic" style="margin:6px 0"><img src="' + esc(ph.img) + '" alt="' + esc(ph.caption) + '" loading="lazy" data-fallback="This photo could not load."><figcaption class="small" style="font-family:var(--f-body);margin-top:6px">' + esc(ph.caption) + ' <span class="muted">' + esc(ph.credit) + '</span></figcaption></figure>';
        });
        return h;
      }).join('') + '</div></div>';
      if (ch.local && ch.local.length) body += '<div class="card"><div class="kicker">Here in Singapore</div>' + ch.local.map(function (n) { return '<h3 style="font-size:18px;margin-top:10px">' + esc(n.title) + '</h3><p style="margin:0">' + esc(n.text) + '</p>'; }).join('') + (ch.refs ? '<p class="small muted" style="margin-top:10px">Sources: ' + esc(ch.refs.join('; ')) + '.</p>' : '') + '</div>';
    }
    body += narrBtn('read:' + key + ':' + i, R.label + ' · ' + title) + (ch ? '<div class="btns">' + cwBtn('read:' + key + ':' + i) + '</div>' : '');
    body += '<div class="nav"><button class="btn ghost small" data-act="readstep" data-k="' + key + '" data-d="-1">‹ Previous chapter</button><button class="btn small" data-act="readstep" data-k="' + key + '" data-d="1">Finished · next chapter ›</button></div><p class="small muted">' + esc(R.source) + '</p>';
    return { title: esc(R.label), who: 'together', body: body };
  }

  // ---------- PINs (kept in the synced state) and the hook the sync module uses ----------
  var PIN_WHO = { emma: 'Emma', emily: 'Emily', mum: 'Mum' };
  function pinFor(profile) { return { emma: 'emma', emily: 'emily', together: 'mum', all: 'mum' }[profile] || 'mum'; }
  function hasPin(who) { return !!(S.pins && S.pins[who] && S.pins[who].h); }
  function sha(text) {
    try { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }); }
    catch (e) { return Promise.resolve(text); }
  }
  var pinLock = { n: 0, until: 0 };
  // Ask for a PIN, then run `then`. mode 'check' or 'set' (enter twice).
  function askPin(who, mode, then) { ui.pin = { who: who, mode: mode || 'check', then: then, a: '', first: null, msg: '' }; openSheet('pin'); }
  function pinSheet() {
    var P = ui.pin; var title = P.mode === 'set' ? (P.first == null ? 'New PIN for ' + PIN_WHO[P.who] : 'Type it again') : PIN_WHO[P.who] + '’s PIN';
    var dots = ''; for (var k = 0; k < 4; k++) dots += '<span class="box' + (k < P.a.length ? ' f' : '') + '" style="width:44px;height:44px"></span>';
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
    var body = '<div class="card" style="display:flex;flex-direction:column;align-items:center;gap:14px"><h3 style="margin:0">' + esc(title) + '</h3><div class="boxes">' + dots + '</div>' +
      '<p class="small" style="margin:0;min-height:1.4em;color:var(--warn)">' + esc(P.msg) + '</p>' +
      '<div style="display:grid;grid-template-columns:repeat(3,72px);gap:10px">' + keys.map(function (k) { return k ? '<button class="btn ghost" style="height:64px;font-size:24px" data-act="pinkey" data-v="' + k + '">' + k + '</button>' : '<span></span>'; }).join('') + '</div></div>';
    return { title: P.mode === 'set' ? 'Set a PIN' : 'Who is this?', who: P.who === 'emily' ? 'emily' : P.who === 'emma' ? 'emma' : 'together', body: body };
  }
  function pinKey(k) {
    var P = ui.pin; if (!P) return;
    if (Date.now() < pinLock.until) { P.msg = 'Too many tries. Wait ' + Math.ceil((pinLock.until - Date.now()) / 1000) + ' seconds.'; refreshSheet(); return; }
    if (k === '⌫') P.a = P.a.slice(0, -1); else if (P.a.length < 4) P.a += k;
    P.msg = '';
    if (P.a.length < 4) { refreshSheet(); return; }
    var entered = P.a; P.a = '';
    if (P.mode === 'set') {
      if (P.first == null) { P.first = entered; refreshSheet(); return; }
      if (P.first !== entered) { P.first = null; P.msg = 'Those didn’t match. Start again.'; refreshSheet(); return; }
      var salt = Math.random().toString(36).slice(2, 10);
      sha(salt + entered).then(function (h) { S.pins = S.pins || {}; S.pins[P.who] = { s: salt, h: h }; save(); toast(PIN_WHO[P.who] + '’s PIN is set'); var t = P.then; ui.pin = null; closeSheet(); if (t) t(); });
      return;
    }
    var rec = S.pins && S.pins[P.who]; if (!rec) { var t0 = P.then; ui.pin = null; closeSheet(); if (t0) t0(); return; }
    sha(rec.s + entered).then(function (h) {
      if (h === rec.h) { pinLock.n = 0; var t = P.then; ui.pin = null; closeSheet(); if (t) t(); }
      else { pinLock.n++; if (pinLock.n >= 5) { pinLock.until = Date.now() + 60000; pinLock.n = 0; } P.msg = 'That PIN isn’t right.'; refreshSheet(); }
    });
  }
  // The sync module (sync.js) talks to the app through this.
  window.SD = {
    state: function () { return S; },
    stored: function () { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} },
    replace: function (obj) { S = obj; Object.keys(defaults).forEach(function (k) { if (S[k] === undefined) S[k] = defaults[k]; }); },
    redraw: function () {
      var a = document.activeElement; var typing = a && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT');
      if (typing) return;
      render(); if (ui.sheet && ui.sheet !== 'pin') refreshSheet();
    },
    toast: function (m) { toast(m); },
    signedIn: function () { ui.blobErr = null; blobPump(); }
  };
  function syncCardHTML() {
    var Y = window.SDsync;
    var body = '<div class="card"><h3>Sync between devices</h3>';
    if (!Y) return body + '<p class="small muted" style="margin:0">Syncing is starting up. If this stays, open the app with internet once.</p></div>';
    var st = Y.status();
    if (!st.available) return body + '<p class="small muted" style="margin:0">' + esc(st.note || 'Syncing works in the family web address of the app.') + '</p></div>';
    if (st.user) {
      body += '<p style="margin:0 0 6px">✓ Signed in as <b>' + esc(st.user) + '</b>. ' + (st.online ? 'Ticks and progress are shared between all your devices.' : 'Offline now: changes are kept and will sync when there is internet.') + '</p>' +
        '<p class="small muted" style="margin:0 0 8px">' + (st.pending ? st.pending + ' change' + (st.pending > 1 ? 's' : '') + ' waiting to sync. ' : 'Everything is synced. ') + (st.last ? 'Last sync ' + new Date(st.last).toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit' }) + '.' : '') + '</p>' +
        '<div class="btns"><button class="btn ghost small" data-act="syncout">Sign this device out</button></div>';
    } else {
      body += '<p class="small" style="margin:0 0 8px">Sign this device in to the family account once. After that it stays signed in and the girls only use their PINs.</p>' +
        '<div style="display:flex;flex-direction:column;gap:8px;max-width:420px"><input type="text" id="sync-email" autocomplete="username" inputmode="email" autocapitalize="off" placeholder="Family email" value="' + esc(st.lastEmail || '') + '"><input type="password" id="sync-pass" autocomplete="current-password" placeholder="Family app password"></div>' +
        '<p class="small" id="sync-msg" style="margin:6px 0;color:var(--warn)">' + esc(st.error || '') + '</p>' +
        '<div class="btns"><button class="btn small" data-act="syncin">Sign in</button><button class="btn ghost small" data-act="syncnew">First time: create the family account</button></div>' +
        '<p class="small muted" style="margin:8px 0 0">Use a new password just for this app, at least 8 characters, not your Gmail password.</p>';
    }
    return body + '</div>';
  }
  function pinCardHTML() {
    var rows = ['mum', 'emma', 'emily'].map(function (w) {
      return '<li><span><b>' + PIN_WHO[w] + '</b> · <span class="muted">' + (hasPin(w) ? 'PIN set' : 'no PIN yet') + '</span></span><span class="btns" style="flex:none"><button class="btn ghost small" data-act="pinset" data-v="' + w + '">' + (hasPin(w) ? 'Change' : 'Set PIN') + '</button>' + (hasPin(w) ? '<button class="btn ghost small" data-act="pinrm" data-v="' + w + '">Remove</button>' : '') + '</span></li>';
    }).join('');
    return '<div class="card"><h3>PINs</h3><p class="small muted" style="margin:0 0 8px">Emma and Emily type their PIN to open their own list. Mum’s PIN guards this Grown-ups page and the Together and Everything lists. PINs are shared by all your synced devices.</p><ul class="list">' + rows + '</ul></div>';
  }

  // ---------- whole books: Aesop, 中国寓言, Blue Fairy Book, Our Island Story, Elementary Geography ----------
  var BK = window.BOOKS || {};
  var PICKED = { blue: true };          // books read as chosen stories in ~10-minute parts, not in order
  var PART_WORDS = 1300;                // parts of at most ~10 minutes reading aloud at ~130 words a minute
  function bookIndex(key) {
    var B = BK[key]; if (!B) return 0;
    var p = S.ptr['book_' + key] || (S.ptr['book_' + key] = { i: 0 });
    return Math.max(0, Math.min(B.items.length - 1, p.i || 0));
  }
  function readMap(key) { var r = S.ptr['read_' + key]; if (!r || !r.m) { r = S.ptr['read_' + key] = { m: {} }; } return r.m; }
  function blockWords(b) { return String(b.p || b.verse || '').split(/\s+/).filter(Boolean).length; }
  var PARTS = {};
  function partsOf(key, i) {
    var k = key + ':' + i; if (PARTS[k]) return PARTS[k];
    var blocks = BK[key].items[i].blocks; var total = blocks.reduce(function (t, b) { return t + blockWords(b); }, 0);
    var n = Math.max(1, Math.ceil(total / PART_WORDS)); var target = total / n;
    var parts = [[]], acc = 0;
    blocks.forEach(function (b, j) {
      parts[parts.length - 1].push(b); acc += blockWords(b);
      var next = blocks[j + 1];
      if (next && !next.img && parts.length < n && acc >= target * parts.length) parts.push([]);
    });
    PARTS[k] = parts.map(function (bl) { var w = bl.reduce(function (t, b) { return t + blockWords(b); }, 0); return { blocks: bl, mins: Math.max(1, Math.round(w / 130)) }; });
    return PARTS[k];
  }
  function selState(key) { var s = S.ptr['sel_' + key]; if (!s || !s.list) { s = S.ptr['sel_' + key] = { list: [], read: {}, cur: null }; } return s; }
  function selCurrent(key, unreadOnly) {
    var s = selState(key);
    if (s.cur && !(unreadOnly && s.read[s.cur])) { var c = s.cur.split(':'); var ci = +c[0], cp = +c[1]; if (s.list.indexOf(ci) >= 0 && cp < partsOf(key, ci).length) return { i: ci, p: cp }; }
    for (var a = 0; a < s.list.length; a++) { var P = partsOf(key, s.list[a]); for (var q = 0; q < P.length; q++) if (!s.read[s.list[a] + ':' + q]) return { i: s.list[a], p: q }; }
    return s.list.length ? { i: s.list[s.list.length - 1], p: partsOf(key, s.list[s.list.length - 1]).length - 1, allDone: true } : null;
  }
  function storyReadCount(key, i) { var s = selState(key), P = partsOf(key, i), n = 0; for (var q = 0; q < P.length; q++) if (s.read[i + ':' + q]) n++; return n; }
  function bookPeek(key) {
    if (key === 'fables') key = 'aesop';
    var B = BK[key]; if (!B) return '';
    if (PICKED[key]) { var c = selCurrent(key, true); if (!c) return 'Choose the tales to read'; if (c.allDone) return 'All chosen tales read · choose more'; var P = partsOf(key, c.i); return B.items[c.i].title + (P.length > 1 ? ' · part ' + (c.p + 1) + ' of ' + P.length : ''); }
    return B.items[bookIndex(key)].title;
  }
  function blockHTML(b) {
    if (b.p != null) return '<p style="margin:0">' + esc(b.p) + '</p>';
    if (b.verse != null) return '<p style="margin:0 0 0 1.2em;white-space:pre-line;font-style:italic">' + esc(b.verse) + '</p>';
    if (b.img) return '<figure class="pic bpic" style="margin:6px 0"><img src="' + esc(b.img) + '" alt="' + esc(b.caption || 'Picture from the book') + '" loading="lazy" data-act="zoompic" data-fallback="This picture could not load.">' + (b.caption ? '<figcaption class="small muted" style="font-family:var(--f-body);margin-top:6px;text-align:center">' + esc(b.caption) + '</figcaption>' : '') + '</figure>';
    if (b.sub) return '<h3 style="font-size:19px;margin:8px 0 0">' + esc(b.sub) + '</h3>';
    if (b.part) return '<div class="kicker" style="margin-top:4px">' + esc(b.part) + '</div>';
    if (b.by) return '<p class="small muted" style="margin:0;text-align:right">' + esc(b.by) + '</p>';
    return '';
  }
  // Books read in order (Aesop, 中国寓言, Our Island Story, Elementary Geography): previous / finished, plus a list with read marks.
  function bookNav(key, B, i) {
    var u = B.unit || 'chapter'; var rm = readMap(key); var nRead = Object.keys(rm).length; var isRead = !!rm[i];
    return '<div class="row' + (isRead ? ' done' : '') + '" style="border:1px solid var(--line);border-radius:var(--r)"><button class="check" data-act="bookread" data-k="' + key + '" data-v="' + i + '" aria-pressed="' + isRead + '" aria-label="Mark as read">✓</button><button class="lbl" data-act="bookread" data-k="' + key + '" data-v="' + i + '"><b>' + (key === 'zh' ? (isRead ? '读过了 ✓' : '读完了就打勾') : (isRead ? 'Read ✓' : 'Tick when read')) + '</b><span class="meta">' + nRead + ' of ' + B.items.length + ' read in this book</span></button></div>' +
      '<div class="nav"><button class="btn ghost small" data-act="bookstep" data-k="' + key + '" data-d="-1"' + (i === 0 ? ' disabled' : '') + '>' + (key === 'zh' ? '‹ 上一篇' : '‹ Previous') + '</button>' +
      '<button class="btn small" data-act="bookstep" data-k="' + key + '" data-d="1"' + (i >= B.items.length - 1 ? ' disabled' : '') + '>' + (key === 'zh' ? '下一篇 ›' : 'Next ' + esc(u) + ' ›') + '</button></div>' +
      '<details class="card"' + (ui.bookListOpen === key ? ' open' : '') + '><summary style="cursor:pointer;font-weight:800" data-act="booklist" data-k="' + key + '">All ' + B.items.length + ' in this book · ' + nRead + ' read · jump to one</summary><p class="small muted" style="margin:6px 0 0">“Read up to here” ticks that ' + esc(u) + ' and every one before it.</p><ol class="list" style="margin-top:10px">' +
      B.items.map(function (it, k) { var r = !!rm[k]; return '<li class="' + (k === i ? 'cur' : '') + '"><span>' + (r ? '<b style="color:var(--who)">✓</b> ' : '') + (k + 1) + '. ' + esc(it.title) + '</span><span class="btns" style="flex:none"><button class="btn ghost small" data-act="bookupto" data-k="' + key + '" data-v="' + k + '">Read up to here</button><button class="btn ghost small" data-act="bookread" data-in="list" data-k="' + key + '" data-v="' + k + '" aria-pressed="' + r + '">' + (r ? 'Unmark' : 'Mark read') + '</button><button class="btn ghost small" data-act="bookgo" data-k="' + key + '" data-v="' + k + '">' + (k === i ? 'Reading' : 'Go') + '</button></span></li>'; }).join('') +
      '</ol></details>';
  }
  function englishBookBody(key) {
    var B = BK[key]; var i = bookIndex(key); var it = B.items[i]; var r = readMap(key)[i];
    var body = '<div class="card"><div class="kicker">' + esc(B.book) + (B.author ? ' · ' + esc(B.author) : '') + ' · ' + esc(B.unit) + ' ' + (i + 1) + ' of ' + B.items.length + (r ? ' · ✓ read' : '') + '</div><h3>' + esc(it.title) + '</h3>' +
      '<div class="bible-text" style="display:flex;flex-direction:column;gap:10px">' + it.blocks.map(blockHTML).join('') + '</div></div>';
    return body + narrBtn('book:' + key + ':' + i, B.label + ' · ' + it.title) + '<div class="btns">' + cwBtn('book:' + key + ':' + i) + '</div>' + bookNav(key, B, i) + '<p class="small muted">' + esc(B.source) + '</p>';
  }
  // Tales: Mum chooses the stories; long ones are cut into parts of about 10 minutes; each part is marked read.
  function pickedBookBody(key) {
    var B = BK[key]; var s = selState(key); var c = selCurrent(key); var body = '';
    if (!c) body += '<div class="card"><h3>Choose the tales to read</h3><p style="margin:0">Tap <b>Add</b> on the tales you want, in the order you want them. Long tales are cut into parts of about 10 minutes, and each part is ticked off when it is read.</p></div>';
    else if (c.allDone) body += '<div class="card"><h3>All the chosen tales are read</h3><p style="margin:0">Add more tales from the list below.</p></div>';
    else {
      var P = partsOf(key, c.i); var part = P[c.p];
      body += '<div class="card"><div class="kicker">' + esc(B.book) + (P.length > 1 ? ' · part ' + (c.p + 1) + ' of ' + P.length : '') + ' · about ' + part.mins + ' min</div><h3>' + esc(B.items[c.i].title) + '</h3>' +
        (c.p > 0 ? '<p class="small muted" style="margin:0 0 8px">Continued from part ' + c.p + '.</p>' : '') +
        '<div class="bible-text" style="display:flex;flex-direction:column;gap:10px">' + part.blocks.map(blockHTML).join('') + '</div>' +
        (c.p < P.length - 1 ? '<p class="small muted" style="margin:10px 0 0">To be continued in part ' + (c.p + 2) + '.</p>' : '<p class="small muted" style="margin:10px 0 0">The end of the tale.</p>') + '</div>' + narrBtn('book:' + key + ':' + c.i + ':' + c.p, B.items[c.i].title + (P.length > 1 ? ' · part ' + (c.p + 1) : '')) + '<div class="btns">' + cwBtn('tale:' + key + ':' + c.i + ':' + c.p) + '</div>' +
        (s.read[c.i + ':' + c.p] ? '<div class="nav"><button class="btn ghost small" data-act="partunread" data-k="' + key + '" data-v="' + c.i + ':' + c.p + '">Untick this part</button><button class="btn small" data-act="partnext" data-k="' + key + '">Next unread part ›</button></div>'
          : '<div class="nav"><span></span><button class="btn small" data-act="partread" data-k="' + key + '" data-v="' + c.i + ':' + c.p + '">✓ Read · next part ›</button></div>');
    }
    if (s.list.length) {
      body += '<div class="card"><div class="kicker">Our chosen tales</div><ul class="list" style="margin-top:8px">' + s.list.map(function (i) {
        var P = partsOf(key, i); var done = storyReadCount(key, i);
        var chips = P.map(function (pt, q) { var rd = !!s.read[i + ':' + q]; var on = c && !c.allDone && c.i === i && c.p === q; return '<button class="box' + (rd ? ' f' : '') + (on ? ' t' : '') + '" style="width:auto;min-width:38px;padding:0 8px;font-size:14px" data-act="partgo" data-k="' + key + '" data-v="' + i + ':' + q + '" aria-label="Part ' + (q + 1) + (rd ? ', read' : '') + '">' + (rd ? '✓' : (q + 1)) + '</button>'; }).join('');
        return '<li style="flex-wrap:wrap"><span style="flex:1 1 200px"><b>' + esc(BK[key].items[i].title) + '</b><br><span class="small muted">' + P.length + (P.length > 1 ? ' parts' : ' part') + ' · ' + done + ' read</span></span><span class="boxes" style="flex-wrap:wrap">' + chips + '</span><button class="btn ghost small" data-act="selrm" data-k="' + key + '" data-v="' + i + '">Remove</button></li>';
      }).join('') + '</ul><p class="small muted" style="margin:8px 0 0">Tap a part number to read it. Tap a ✓ to open a part already read, and untick it there if needed.</p></div>';
    }
    body += '<details class="card"' + (!c || (ui.selOpen && ui.selOpen[key]) ? ' open' : '') + '><summary style="cursor:pointer;font-weight:800">All ' + B.items.length + ' tales · choose which to read</summary><ol class="list" style="margin-top:10px">' +
      B.items.map(function (it, k) {
        var P = partsOf(key, k); var mins = P.reduce(function (t, x) { return t + x.mins; }, 0); var inList = s.list.indexOf(k) >= 0; var done = storyReadCount(key, k); var all = done === P.length;
        return '<li style="flex-wrap:wrap"><span style="flex:1 1 200px">' + (all ? '<b style="color:var(--who)">✓</b> ' : '') + esc(it.title) + '<br><span class="small muted">about ' + mins + ' min · ' + P.length + (P.length > 1 ? ' parts' : ' part') + (done && !all ? ' · ' + done + ' read' : '') + '</span></span><span class="btns" style="flex:none">' +
          '<button class="btn ghost small" data-act="selreadall" data-k="' + key + '" data-v="' + k + '">' + (all ? 'Unmark' : 'Mark read') + '</button>' +
          '<button class="btn small' + (inList ? ' ghost' : '') + '" data-act="' + (inList ? 'selrm' : 'seladd') + '" data-k="' + key + '" data-v="' + k + '">' + (inList ? 'Remove' : 'Add') + '</button></span></li>';
      }).join('') + '</ol></details>';
    return body + '<p class="small muted">' + esc(B.source) + '</p>';
  }
  function zhPara(toks) { return '<div class="pyrow" style="margin-bottom:.9em">' + rubyHTML(toks) + '</div>'; }
  function zhFableBody() {
    var B = BK.zh; var i = bookIndex('zh'); var f = B.items[i]; var r = readMap('zh')[i];
    var body = '<div class="card"><div class="kicker">中国寓言 · 第 ' + (i + 1) + ' 篇，共 ' + B.items.length + ' 篇 · ' + esc(f.src) + (r ? ' · ✓ 读过了' : '') + '</div>' +
      '<div class="zh-line" style="margin:6px 0 2px"><div class="py">' + esc(f.py) + '</div><div class="hz" style="font-size:32px;font-weight:700">' + esc(f.title) + '</div></div>' +
      (f.ctx ? '<p class="small muted" style="margin:4px 0 0">' + esc(f.ctx) + '</p>' : '') + '</div>';
    if (f.pic) body += '<figure class="pic bpic card" style="margin:0"><img src="' + esc(f.pic.img) + '" alt="' + esc(f.title) + '" loading="lazy" data-act="zoompic" data-fallback="这张图没有加载出来。"><figcaption class="small muted" style="margin-top:6px">' + esc(f.pic.credit) + '</figcaption></figure>';
    body += '<div class="card"><div class="kicker">白话 · 读给孩子听</div><div class="poem zh ruby" style="font-size:21px">' + f.bai.map(zhPara).join('') + '</div>' +
      '<p class="small muted" style="margin:4px 0 0">白话是Claude根据原文逐句翻译的。</p></div>';
    body += '<div class="card"><div class="kicker">字词 · 原文里难懂的字</div><ul class="list" style="margin-top:6px">' +
      f.notes.map(function (n) { return '<li style="display:block"><span style="font-family:var(--f-zh);font-size:20px;font-weight:700">' + esc(n[0]) + '</span> <span style="color:var(--who);font-weight:700">' + esc(n[1]) + '</span> <span>· ' + esc(n[2]) + '</span></li>'; }).join('') + '</ul></div>';
    body += '<div class="card"><div class="kicker">原文 · ' + esc(f.src) + '</div><div class="poem zh ruby" style="font-size:21px">' + f.orig.map(zhPara).join('') + '</div>' +
      '<p class="small muted" style="margin:4px 0 0">' + esc(['原文据维基文库《' + f.page.split('/')[0] + '》', (f.norm && f.norm.length ? '旧字改为通行写法：' + f.norm.join('，') : ''), f.fix || ''].filter(Boolean).join('。')) + '。</p></div>';
    return body + narrBtn('book:zh:' + i, '中国寓言 · ' + f.title) + bookNav('zh', B, i) + '<p class="small muted">' + esc(B.source) + '</p>';
  }
  function bookSheet(key) {
    if (key === 'fables') key = 'aesop';
    var B = BK[key]; if (!B) return { title: '', body: '<p class="empty">This book has not loaded.</p>' };
    if (key === 'zh') return { title: '中国寓言', who: 'emily', body: zhFableBody() };
    if (PICKED[key]) return { title: esc(B.label), who: 'emily', body: pickedBookBody(key) };
    return { title: esc(B.label), who: 'emily', body: englishBookBody(key) };
  }

  // ---------- Scripture memory (Simply Charlotte Mason system, real calendar, KJV cards) ----------
  var WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var SCMB = null;
  function scmCard(id) { if (!SCMB) { SCMB = {}; (C.scm.bank || []).forEach(function (c) { SCMB[c.id] = c; }); } return SCMB[id]; }
  function scmBox() {
    if (!S.scm) { S.scm = JSON.parse(JSON.stringify(C.scm.start)); S.scm.queue = []; S.scm.log = []; save(); }
    if (!scmBox.clean) { scmBox.clean = 1; var ch = false; // passages that used to be split over several cards are now one card
      Object.keys(S.scm.slots || {}).forEach(function (k) { var sl = S.scm.slots[k]; if (sl && sl.cards) { var f = sl.cards.filter(function (id) { return scmCard(id); }); if (f.length !== sl.cards.length) { sl.cards = f; ch = true; } } });
      if (S.scm.queue) { var q = S.scm.queue.filter(function (id) { return scmCard(id); }); if (q.length !== S.scm.queue.length) { S.scm.queue = q; ch = true; } }
      if (ch) save(); }
    return S.scm; }
  function isoDay(d) { d = d || new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function sinceLabel(x) { if (!x) return ''; if (/^\d{4}$/.test(x)) return x; var p = x.split('-'); return (+p[2]) + ' ' + MONTHS[+p[1] - 1] + ' ' + p[0]; }
  function sinceVal(x) { return !x ? 0 : /^\d{4}$/.test(x) ? +x * 10000 : +x.replace(/-/g, ''); }
  function slotLabel(k) { if (k === 'daily') return 'Daily'; if (k === 'odd') return 'Odd'; if (k === 'even') return 'Even'; if (k.indexOf('wd') === 0) return WD[+k.slice(2)]; return k; }
  function ordDay(n) { return n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'); }
  function packName(c) { return c.pack === 'NCC' ? 'New Creation Church' + (c.cat ? ' · ' + c.cat : '') : 'Pack ' + c.pack; }
  function cardRef(c) { return (c.vv ? c.ref.split(':')[0] + ':' + c.vv : c.ref) + (c.of ? ' (card ' + c.part + ' of ' + c.of + ')' : '') + (c.label ? ' · ' + c.label : ''); }
  function whereIs(id) {
    var B = scmBox(); for (var k in B.slots) if (B.slots[k] && B.slots[k].cards.indexOf(id) >= 0) return slotLabel(k);
    for (var n in B.nums) if (B.nums[n].some(function (e) { return e.cards.indexOf(id) >= 0; })) return 'Day ' + n;
    if ((B.queue || []).indexOf(id) >= 0) return 'Waiting to learn';
    return null;
  }
  function scmToday() {
    var B = scmBox(), d = new Date(), dm = d.getDate();
    return [
      { key: 'daily', title: 'Daily', note: 'The new verse. Read it aloud together.', entries: B.slots.daily ? [B.slots.daily] : [] },
      { key: dm % 2 ? 'odd' : 'even', title: dm % 2 ? 'Odd' : 'Even', note: 'Today is the ' + ordDay(dm) + '.', entries: B.slots[dm % 2 ? 'odd' : 'even'] ? [B.slots[dm % 2 ? 'odd' : 'even']] : [] },
      { key: 'wd' + d.getDay(), title: WD[d.getDay()], note: '', entries: B.slots['wd' + d.getDay()] ? [B.slots['wd' + d.getDay()]] : [] },
      { key: 'n' + dm, title: 'The ' + ordDay(dm), note: '', entries: B.nums[String(dm)] || [] },
    ];
  }
  function scmCount() { return scmToday().reduce(function (t, g) { return t + g.entries.reduce(function (u, e) { return u + e.cards.length; }, 0); }, 0); }
  function scmText(c) { return '<div class="scm-text">' + esc(c.text) + '</div>'; }
  function scmCardHTML(id, open, said) {
    var c = scmCard(id); if (!c) return '<div class="vcard"><span class="ref">' + esc(id) + '</span></div>';
    var shown = open || ui.showVerse[id];
    return '<div class="vcard' + (said ? ' said' : '') + '"><div class="nav"><span class="ref">' + esc(cardRef(c)) + '</span>' + (open ? '' : '<button class="btn ghost small" data-act="showverse" data-v="' + id + '">' + (shown ? 'Hide the words' : 'Show the words') + '</button>') + '</div>' + (shown ? scmText(c) : '') + '</div>';
  }
  function oldestOf(keys) { var B = scmBox(), best = keys[0], bv = Infinity; keys.forEach(function (k) { var e = B.slots[k]; var v = e && e.cards.length ? sinceVal(e.since) : -1; if (v < bv) { bv = v; best = k; } }); return best; }
  function scmMovePlan() {
    var B = scmBox(), p = ui.scmPlan;
    if (!p) {
      var wds = []; for (var k = 0; k < 7; k++) wds.push('wd' + k);
      var unused = (C.scm.bank || []).filter(function (c) { return !whereIs(c.id); });
      p = ui.scmPlan = { oe: oldestOf(['odd', 'even']), wd: oldestOf(wds), num: String(B.nextNum || 1), next: (B.queue && B.queue[0]) || (unused[0] && unused[0].id) || '' };
    }
    function sel(name, opts, val) { return '<select data-act="scmplan" data-k="' + name + '" style="width:auto;max-width:100%">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; }
    function names(e) { return e && e.cards.length ? e.cards.map(function (id) { var c = scmCard(id); return c ? c.ref : id; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ') : 'empty'; }
    var wdOpts = WD.map(function (n, k) { return ['wd' + k, n + ' (' + names(B.slots['wd' + k]) + ')']; });
    var numOpts = []; for (var n = 1; n <= 31; n++) numOpts.push([String(n), n + ' (' + ((B.nums[String(n)] || []).length) + ' card' + ((B.nums[String(n)] || []).length === 1 ? '' : 's') + ')']);
    var bankOpts = [['', 'Choose later']].concat((B.queue || []).map(function (id) { return [id, '★ ' + cardRef(scmCard(id))]; })).concat((C.scm.bank || []).filter(function (c) { return !whereIs(c.id); }).map(function (c) { return [c.id, packName(c) + ' · ' + cardRef(c)]; }));
    return '<div class="card" style="border:2px solid var(--who)"><h3 style="margin:0 0 8px">Moving the cards along</h3>' +
      '<p style="margin:0 0 6px">1. <b>' + esc(names(B.slots.daily)) + '</b> goes behind ' + sel('oe', [['odd', 'Odd (' + names(B.slots.odd) + ')'], ['even', 'Even (' + names(B.slots.even) + ')']], p.oe) + '</p>' +
      '<p style="margin:0 0 6px">2. <b>' + esc(names(B.slots[p.oe])) + '</b> goes behind ' + sel('wd', wdOpts, p.wd) + '</p>' +
      '<p style="margin:0 0 6px">3. <b>' + esc(names(B.slots[p.wd])) + '</b> goes behind number ' + sel('num', numOpts, p.num) + '</p>' +
      '<p style="margin:0 0 10px">4. The new Daily verse: ' + sel('next', bankOpts, p.next) + '</p>' +
      '<p class="small muted" style="margin:0 0 8px">The card that has been longest in Odd/Even and in the weekdays is suggested, and the next number in turn. Change any of them if you like.</p>' +
      '<div class="btns"><button class="btn" data-act="scmmove">Move the cards</button><button class="btn ghost" data-act="scmcancel">Not yet</button></div></div>';
  }
  function versesSheet(tickId) {
    var B = scmBox(); var view = ui.scmView || 'today'; var dkey = isoDay();
    var said = (S.said[dkey] = S.said[dkey] || {});
    var body = '<div class="seg" role="group">' + [['today', 'Today'], ['box', 'The box'], ['bank', 'Verse bank']].map(function (o) { return '<button data-act="scmview" data-v="' + o[0] + '" aria-pressed="' + (view === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>';
    if (view === 'today') {
      var d = new Date();
      body += '<p class="small muted" style="margin:0">' + WD[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' · KJV</p>';
      scmToday().forEach(function (g) {
        body += '<div><div class="kicker" style="margin-bottom:4px">' + esc(g.title) + (g.note ? ' <span class="muted" style="text-transform:none;letter-spacing:0">· ' + esc(g.note) + '</span>' : '') + '</div>';
        var ids = []; g.entries.forEach(function (e) { ids = ids.concat(e.cards); });
        body += ids.length ? '<div style="display:flex;flex-direction:column;gap:8px">' + ids.map(function (id) { return scmCardHTML(id, g.key === 'daily', said[id]); }).join('') + '</div>' : '<p class="small muted" style="margin:0">No card here yet.</p>';
        body += '</div>';
      });
      if (ui.scmPlan || ui.scmMoving) body += scmMovePlan();
      else body += '<div class="btns"><button class="btn ghost" data-act="scmknow">We know the Daily verse ›</button></div>';
      body += '<div class="btns">' + tickButton(tickId, 'Scripture memory done', 'We said our verses') + '</div>';
      body += '<details class="card"><summary><b>How the box works</b></summary><ol style="margin:8px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:6px">' + C.scm.how.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></details>';
    } else if (view === 'box') {
      var rows = [['daily', B.slots.daily], ['odd', B.slots.odd], ['even', B.slots.even]];
      for (var k = 0; k < 7; k++) rows.push(['wd' + k, B.slots['wd' + k]]);
      function entryHTML(where, e, idx) {
        return '<div class="vcard"><div class="nav"><span class="ref">' + e.cards.map(function (id) { var c = scmCard(id); return esc(c ? cardRef(c) : id); }).join('<br>') + '</span><span class="small muted">since ' + esc(sinceLabel(e.since)) + '</span></div>' +
          '<div class="btns" style="margin-top:6px"><button class="btn ghost small" data-act="scmdel" data-v="' + where + '" data-k="' + idx + '">' + (ui.scmDel === where + ':' + idx ? 'Tap again to take out' : 'Take out') + '</button></div></div>';
      }
      body += '<div class="card"><h3 style="margin:0 0 8px">Daily, Odd, Even and the week</h3>' + rows.map(function (r) { return '<div style="margin:8px 0"><div class="kicker">' + esc(slotLabel(r[0])) + '</div>' + (r[1] && r[1].cards.length ? entryHTML(r[0], r[1], 0) : '<p class="small muted" style="margin:2px 0">Empty</p>') + '</div>'; }).join('') + '</div>';
      var nh = ''; for (var n = 1; n <= 31; n++) { var es = B.nums[String(n)] || []; nh += '<div style="margin:8px 0"><div class="kicker">' + n + (String(n) === String(B.nextNum) ? ' <span class="muted" style="text-transform:none">· next to fill</span>' : '') + '</div>' + (es.length ? es.map(function (e, i) { return entryHTML('n' + n, e, i); }).join('') : '<p class="small muted" style="margin:2px 0">Empty</p>') + '</div>'; }
      body += '<details class="card"' + (ui.scmNumsOpen ? ' open' : '') + '><summary><b>The numbers, 1 to 31</b></summary>' + nh + '</details>';
      if (B.undo) body += '<div class="card"><p style="margin:0 0 6px">The cards were last moved along on ' + esc(sinceLabel(B.undo.day)) + '.</p><button class="btn ghost small" data-act="scmundo">Undo that move</button></div>';
      var lost = []; var ST = C.scm.start;
      Object.keys(ST.slots).forEach(function (k) { var e = ST.slots[k]; if (e && e.cards.some(function (id) { return !whereIs(id); })) lost.push({ where: k, entry: e }); });
      Object.keys(ST.nums).forEach(function (n) { ST.nums[n].forEach(function (e) { if (e.cards.some(function (id) { return !whereIs(id); })) lost.push({ where: 'n' + n, entry: e }); }); });
      if (lost.length) body += '<div class="card"><h3 style="margin:0 0 6px">Missing from your box</h3><p class="small muted" style="margin:0 0 6px">These were in your box at the start and are not in it now.</p>' + lost.map(function (t) { return '<div class="vcard"><div class="nav"><span class="ref">' + t.entry.cards.map(function (id) { var c = scmCard(id); return esc(c ? cardRef(c) : id); }).join('<br>') + '</span><button class="btn small" data-act="scmrestore" data-v="' + t.where + '">Put back in ' + esc(t.where.indexOf('n') === 0 && t.where !== 'odd' ? t.where.slice(1) : slotLabel(t.where)) + '</button></div><p class="small muted" style="margin:4px 0 0">There since ' + esc(sinceLabel(t.entry.since)) + '.</p></div>'; }).join('') + '</div>';
      if ((B.trash || []).length) body += '<div class="card"><h3 style="margin:0 0 6px">Taken out</h3>' + B.trash.map(function (t, i) { return '<div class="vcard"><div class="nav"><span class="ref">' + t.entry.cards.map(function (id) { var c = scmCard(id); return esc(c ? cardRef(c) : id); }).join('<br>') + '</span><button class="btn small" data-act="scmback" data-v="' + i + '">Put back in ' + esc(t.where.indexOf('n') === 0 && t.where !== 'odd' ? t.where.slice(1) : slotLabel(t.where)) + '</button></div><p class="small muted" style="margin:4px 0 0">Was there since ' + esc(sinceLabel(t.entry.since)) + '; taken out ' + esc(sinceLabel(t.out)) + '.</p></div>'; }).join('') + '</div>';
      body += '<div class="card"><h3 style="margin:0 0 6px">Put in a verse you already know</h3><div class="btns"><select id="scm-add-card" style="max-width:100%">' + (C.scm.bank || []).filter(function (c) { return !whereIs(c.id); }).map(function (c) { return '<option value="' + c.id + '">' + esc(packName(c)) + ' · ' + esc(cardRef(c)) + '</option>'; }).join('') + '</select><select id="scm-add-where" style="width:auto">' + (function () { var o = ''; for (var n = 1; n <= 31; n++) o += '<option value="n' + n + '">Behind ' + n + '</option>'; WD.forEach(function (w, k) { o += '<option value="wd' + k + '">' + w + '</option>'; }); return o + '<option value="odd">Odd</option><option value="even">Even</option><option value="daily">Daily</option>'; })() + '</select><button class="btn small" data-act="scmadd">Put it in</button></div></div>';
    } else {
      var q = (ui.scmQ || '').toLowerCase(), pk = ui.scmPack || '';
      body += '<div class="btns"><input type="search" id="scm-q" data-act="scmq" placeholder="Search, e.g. Proverbs or love" value="' + esc(ui.scmQ || '') + '" style="flex:1;min-width:160px"><select data-act="scmpack" style="width:auto"><option value="">All packs</option>' + (function () { var o = ''; for (var i = 1; i <= 12; i++) o += '<option value="' + i + '"' + (String(i) === pk ? ' selected' : '') + '>Pack ' + i + '</option>'; o += '<option value="NCC"' + (pk === 'NCC' ? ' selected' : '') + '>New Creation Church</option>'; return o; })() + '</select></div>';
      if ((B.queue || []).length) body += '<p class="small" style="margin:0"><b>Waiting to learn:</b> ' + B.queue.map(function (id) { return esc(scmCard(id) ? cardRef(scmCard(id)) : id); }).join('; ') + '</p>';
      var list = (C.scm.bank || []).filter(function (c) { return (!pk || String(c.pack) === pk) && (!q || (c.ref + ' ' + c.text + ' ' + (c.label || '') + ' ' + (c.cat || '')).toLowerCase().indexOf(q) >= 0); });
      body += '<div style="display:flex;flex-direction:column;gap:8px">' + list.slice(0, 120).map(function (c) { var w = whereIs(c.id); return '<details class="vcard"><summary><span class="ref">' + esc(cardRef(c)) + '</span> <span class="small muted">' + esc(packName(c)) + (w ? ' · ' + esc(w) : '') + '</span></summary>' + scmText(c) + (w ? '' : '<div class="btns" style="margin-top:6px"><button class="btn small" data-act="scmqueue" data-v="' + c.id + '">Learn this next</button></div>') + '</details>'; }).join('') + '</div>';
      if (list.length > 120) body += '<p class="small muted">Showing the first 120. Search to narrow it down.</p>';
    }
    body += '<p class="small muted">' + esc(C.scm.src) + '</p>';
    return { title: 'Scripture memory', who: 'together', body: body };
  }

  // ---------- pick from a loop ----------
  function pickSheet(pickId, listKey) {
    var d = cur(); var item = allDaily(listKey).filter(function (i) { return i.id === pickId; })[0];
    var L = C.loops[item.pick]; var wd = weekDone(d.w); var chosen = d.picks[pickId] || [];
    var body = '<p style="margin:0">' + esc(item.label) + '. Tap to choose' + (item.n > 1 ? ' ' + item.n : '') + '. Things already done this week are marked.</p><div class="rows">';
    L.items.forEach(function (li) {
      var mine = chosen.indexOf(li.id) >= 0; var other = wd[li.id] && !mine;
      body += '<div class="row' + (mine ? ' done' : '') + '"><button class="check" data-act="choose" data-p="' + pickId + '" data-list="' + listKey + '" data-v="' + li.id + '" aria-pressed="' + mine + '">✓</button><span class="emoji" aria-hidden="true">' + esc(li.icon) + '</span>' +
        '<button class="lbl" data-act="choose" data-p="' + pickId + '" data-list="' + listKey + '" data-v="' + li.id + '"><b>' + esc(li.label) + '</b><span class="meta">' + (li.mins ? li.mins + ' min' : '') + (li.note ? ' · ' + esc(li.note) : '') + (other ? ' · done on day ' + wd[li.id] : '') + '</span></button>' +
        (li.open ? '<button class="btn ghost small" data-act="sheet" data-v="' + li.open + '">Open ›</button>' : '') +
        (L.narration && mine ? '<button class="btn small' + (S.narrWritten[d.w + ':' + li.id] ? '' : ' ghost') + '" data-act="written" data-v="' + li.id + '">' + (S.narrWritten[d.w + ':' + li.id] ? '✍️ Written' : 'Oral · tap if written') + '</button>' : '') + '</div>';
    });
    body += '</div>';
    if (L.narration) { var w = L.items.filter(function (i) { return S.narrWritten[d.w + ':' + i.id]; }).length; body += '<p class="small ' + (w ? 'muted' : '') + '" style="margin:0;' + (w ? '' : 'color:var(--warn)') + '">' + (w ? w + ' written narration' + (w > 1 ? 's' : '') + ' this week.' : 'No written narration yet this week.') + '</p>'; }
    body += '<div class="btns"><button class="btn" data-act="close">Done</button></div>';
    return { title: esc(L.name), who: whoOf(listKey), body: body };
  }

  // ---------- settings ----------
  function settingsSheet() {
    var d = cur();
    var synced = window.SDsync && window.SDsync.status().user;
    var body = syncCardHTML() + '<div class="card"><h3>Which list lives on this device</h3><div class="who-pick">' + profileButtons() + '</div><p class="small muted" style="margin:8px 0 0">' + (synced ? 'Ticks are shared with your other signed-in devices.' : 'Until this device is signed in, its ticks stay on this device only.') + '</p></div>' + pinCardHTML();
    body += calCardHTML();
    body += '<div class="card"><h3>School days</h3><p class="small muted" style="margin:0 0 8px">' + (synced ? 'All signed-in devices share one count of school days. ' : 'Each tablet keeps its own count of school days. ') + (d ? 'Now on Day ' + d.n + ', Week ' + d.w + '.' : '') + '</p><div class="btns">' +
      '<button class="btn ghost small" data-act="newweek">' + (S.forceNewWeek ? '✓ Next day starts a new week' : 'Start a new week from the next day') + '</button>' +
      (d ? '<button class="btn ghost small" data-act="undoday">Remove Day ' + d.n + '</button>' : '') + '</div><p id="undo-note" class="small" style="margin:6px 0 0"></p></div>';
    body += '<div class="card"><h3>Where we are</h3><p class="small muted" style="margin:0 0 8px">Poems move on by themselves each school day. Set any of these by hand here.</p>' + positionsHTML() + '</div>';
    body += '<div class="card"><h3>Backup</h3><p class="small muted" style="margin:0 0 8px">Ticks are saved on this iPad only. Copy a backup now and then and keep it in Notes.</p><div class="btns"><button class="btn small" data-act="backupcopy">Copy backup</button></div><textarea id="backup-text" aria-label="Backup text" style="margin-top:8px" placeholder="Paste a backup here to restore it"></textarea><div class="btns" style="margin-top:8px"><button class="btn ghost small" data-act="restore">Restore from pasted backup</button></div><p id="backup-note" class="small" style="margin:6px 0 0"></p></div>';
    return { title: 'Grown-ups', who: S.profile === 'emily' ? 'emily' : 'together', body: body };
  }
  function positionsHTML() {
    function row(label, key, options) {
      var i = S.ptr[key] ? S.ptr[key].i : 0;
      return '<label class="goal" style="gap:12px"><span style="min-width:0"><b>' + esc(label) + '</b></span><select data-act="posset" data-k="' + key + '" style="max-width:60%">' + options.map(function (o, k) { return '<option value="' + k + '"' + (((i % options.length) + options.length) % options.length === k ? ' selected' : '') + '>' + esc((k + 1) + '. ' + o) + '</option>'; }).join('') + '</select></label>';
    }
    var h = '';
    if (S.profile !== 'emily') {
      h += row('Emma\'s poem', 'poem_emma', C.poets.emma.poems.map(function (p) { return p.title; }));
      C.bible.tracks.forEach(function (T) { h += row('Bible, ' + T.name, 'bible_' + T.id, T.lessons.map(function (l) { return 'Lesson ' + l.n + ': ' + l.title; })); });
      h += row('Folk dance', 'dance', C.dance.folk.list);
      h += row('Solfa', 'solfa', C.solfa.lessons);
      h += row('Picture study', 'picture', C.pictures.list.map(function (p) { return p.title; }));
      h += row('Music', 'music', C.music.list);
    } else {
      h += row('Emily\'s poem', 'poem_emily', C.poets.emily.poems.map(function (p) { return p.title; }));
    }
    h += row('唐诗', 'chinese', C.chinese.poems.map(function (p) { return p.title; }));
    return h;
  }

  // ---------- actions ----------
  function setPtr(key, i, len) { var p = S.ptr[key] || (S.ptr[key] = { i: 0 }); p.i = len ? Math.max(0, Math.min(len - 1, i)) : Math.max(0, i); p.readOn = null; p.readDate = null; save(); }
  function ptrLen(key) {
    if (key === 'poem_emma' || key === 'tpoem_emma') return C.poets.emma.poems.length;
    if (key === 'poem_emily' || key === 'tpoem_emily') return C.poets.emily.poems.length;
    if (key === 'chinese') return C.chinese.poems.length;
    if (key === 'dance') return 0;
    if (key === 'solfa') return C.solfa.lessons.length + 1;
    if (key === 'picture') return C.pictures.list.length;
    if (key === 'music') return C.music.list.length;
    if (key.indexOf('bible_') === 0) { var T = C.bible.tracks.filter(function (t) { return 'bible_' + t.id === key; })[0]; return T.lessons.length + 1; }
    return 0;
  }
  var POEM_TICKS = { e_poetry: ['poem_emma'], m_poetry: ['poem_emily'], t_poetry: ['poem_emma', 'poem_emily'] };
  // Poetry together and each girl's own poetry are the same poems now: one place and one record for each girl.
  // Earlier, Together kept its own place (tpoem_*); fold that in once, keeping whichever is further on and every poem read.
  function unifyPoems() {
    if (S.poemOne) return;
    ['emma', 'emily'].forEach(function (w) {
      var b = S.ptr['tpoem_' + w]; if (!b) return;
      var a = S.ptr['poem_' + w] || (S.ptr['poem_' + w] = { i: 0, readOn: null });
      var bl = b.log || {}; a.log = a.log || {};
      Object.keys(bl).forEach(function (k) { if (!a.log[k] || (bl[k] < a.log[k])) a.log[k] = bl[k]; });
      if ((b.i || 0) > (a.i || 0)) { a.i = b.i; a.readOn = b.readOn || null; a.readDate = b.readDate || null; }
    });
    S.poemOne = 1; save();
  }
  // Ticking Poetry together ticks each girl's Poetry; when both girls have ticked theirs, Poetry together is ticked too.
  var POEM_LINK = { t_poetry: ['e_poetry', 'm_poetry'] };
  var poemLinking = false;
  function poemLink(id) {
    if (poemLinking) return; poemLinking = true;
    try {
      if (POEM_LINK[id]) POEM_LINK[id].forEach(function (x) { if (!doneToday(x)) addToday(x); });
      else if (id === 'e_poetry' || id === 'm_poetry') { if (doneToday('e_poetry') && doneToday('m_poetry') && !doneToday('t_poetry')) addToday('t_poetry'); }
    } finally { poemLinking = false; }
  }

  // ---------- Emily's reading lessons (Charlotte Mason: reading at sight, then by sound, then the whole poem) ----------
  var RD = window.READING || { poems: [], proper: [], method: { steps: [], notes: [] } };
  var RD_PROPER = {}; (RD.proper || []).forEach(function (w) { RD_PROPER[w] = 1; });
  var RD_TICK = 'm_reading';
  // Whose lessons are open: Emily learns every word of each poem; Emma, who reads fluently, builds only the longer, less common words.
  var RDW = 'emily';
  var RD_EMMA = (function () { var E = RD.emma || { list: [], poems: [] }; var by = {}; RD.poems.concat(E.poems || []).forEach(function (p) { by[p.id] = p; }); return (E.list || []).map(function (id) { return by[id]; }).filter(Boolean); })();
  function rdName() { return RDW === 'emma' ? 'Emma' : 'Emily'; }
  function rdPer() { var r = rdState(); return r.per || (RDW === 'emma' && RD.emma && RD.emma.per) || RD.per || 10; }
  function rdPoems() { return RDW === 'emma' ? RD_EMMA : RD.poems; }
  function rdWith(who, fn) { var keep = RDW; RDW = who || 'emily'; try { return fn(); } finally { RDW = keep; } }
  function rdTeach(k) { return RDW !== 'emma' || (k.replace(/[^A-Za-z]/g, '').length >= ((RD.emma && RD.emma.minLen) || 5) && rdLvl(k) === 9 && !RD_PROPER[k]); }
  function rdState() {
    var key = RDW === 'emma' ? 'rdEmma' : 'rd';
    var r = S[key] || (S[key] = {});
    if (!r.known) r.known = {}; if (!r.fam) r.fam = {}; if (!r.done) r.done = {}; if (!r.log) r.log = {}; if (!r.again) r.again = {};
    return r;
  }
  // How common a word is: its Dolch level (0 = pre-primer … 4 = third grade), or 9 if it is not on the list.
  var RD_LVL = {}; ((RD.common && RD.common.levels) || []).forEach(function (L, i) { L.words.forEach(function (w) { RD_LVL[w] = i; }); });
  function rdLvl(k) { return RD_LVL[k] != null ? RD_LVL[k] : 9; }
  function rdAgainList() { var a = rdState().again; return Object.keys(a).sort(function (x, y) { return a[x] - a[y]; }); }
  function rdShuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // A word as printed in the poem, without the punctuation around it. "thro'" keeps its apostrophe.
  function rdTok(raw) {
    var t = String(raw).replace(/^[^A-Za-z]+/, '');
    if (/^thro'/i.test(t)) return t.slice(0, 5);
    return t.replace(/[^A-Za-z]+$/, '');
  }
  function rdKey(t) { return RD_PROPER[t] ? t : t.toLowerCase(); }
  function rdLines(p) {
    if (p._lines) return p._lines;
    p._lines = p.text.split('\n').filter(function (l) { return l.trim(); }).map(function (l) {
      return { raw: l, toks: l.split(/\s+/).map(rdTok).filter(Boolean).map(function (t) { return { t: t, k: rdKey(t) }; }) };
    });
    return p._lines;
  }
  function rdWords(p) {
    var ck = '_w_' + RDW; if (p[ck]) return p[ck];
    var seen = {}, out = [];
    (p.order || []).concat(rdLines(p).reduce(function (a, l) { return a.concat(l.toks.map(function (x) { return x.k; })); }, [])).forEach(function (k) { if (!seen[k]) { seen[k] = 1; out.push(k); } });
    return (p[ck] = out.filter(rdTeach));
  }
  function rdKnows(k) { return !rdTeach(k) || !!rdState().known[k]; }
  function rdIdx() {
    var r = rdState(); var P = rdPoems();
    if (r.cur != null && r.cur >= 0 && r.cur < P.length && !r.done[P[r.cur].id]) return r.cur;
    for (var i = 0; i < P.length; i++) if (!r.done[P[i].id]) return i;
    return P.length - 1;
  }
  function rdPoem() { return rdPoems()[rdIdx()]; }
  function rdNew(p) { return rdWords(p).filter(function (k) { return !rdKnows(k); }); }
  function rdFamTodo(p) { if (RDW === 'emma') return []; var r = rdState(); return (p.fam || []).map(function (f, i) { return i; }).filter(function (i) { return !r.fam[p.id + ':' + i] && rdKnows(p.fam[i].from); }); }
  function rdLastKind(p) { var r = rdState(), best = null, bt = 0; Object.keys(r.log).forEach(function (t) { var e = r.log[t]; if (e && e.p === p.id && +t > bt) { bt = +t; best = e.k; } }); return best; }
  function rdKinds(p) { return { sight: rdNew(p).length > 0 || rdAgainList().length > 0, sound: rdFamTodo(p).length > 0, poem: rdNew(p).length === 0 && !rdState().done[p.id] }; }
  // Mason gives the sound lesson on the day after a sight lesson; the poem comes when every word is known.
  function rdSuggest(p) {
    var k = rdKinds(p);
    if (k.sound && rdLastKind(p) === 'sight') return 'sound';
    if (k.sight) return 'sight';
    if (k.sound) return 'sound';
    if (k.poem) return 'poem';
    return 'sight';
  }
  function rdKnownCount() { return Object.keys(rdState().known).length; }
  function rdMark(k, src, p) {
    var r = rdState(); if (r.known[k]) return;
    var d = cur(); r.known[k] = { n: d ? d.n : 0, d: today(), p: p ? p.id : '', s: src };
    if (ui.rd) (src === 'f' ? ui.rd.fw : ui.rd.learnt).push(k);
  }

  function rdStart(kind) {
    var p = rdPoem(); var r = rdState();
    var L = { kind: kind, pid: p.id, steps: [], si: 0, learnt: [], fw: [], col: 'down', date: today() };
    var before = Object.keys(r.known);
    if (kind === 'sight') {
      var warm = rdWords(p).filter(rdKnows); if (warm.length < 12) warm = warm.concat(rdShuffle(before.filter(function (k) { return warm.indexOf(k) < 0; })).slice(0, 12 - warm.length));
      warm = warm.filter(function (k) { return !r.again[k]; });
      if (warm.length) L.steps.push({ t: 'warm', words: rdShuffle(warm) });
      var per = rdPer(); var again = rdAgainList().slice(0, per);
      again.forEach(function (w) { L.steps.push({ t: 'word', w: w, ph: 'look', again: true }); });
      var pos = rdWords(p);
      rdNew(p).sort(function (a, b) { return rdLvl(a) - rdLvl(b) || pos.indexOf(a) - pos.indexOf(b); }).slice(0, Math.max(per - again.length, again.length ? 3 : per)).forEach(function (w) { L.steps.push({ t: 'word', w: w, ph: 'look' }); });
      L.steps.push({ t: 'column' }); L.steps.push({ t: 'lines', li: 0 }); L.steps.push({ t: 'end' });
    } else if (kind === 'sound') {
      L.steps.push({ t: 'column' });
      rdFamTodo(p).forEach(function (i) { L.steps.push({ t: 'fam', f: i, made: [], cut: false }); });
      L.steps.push({ t: 'end' });
    } else {
      L.steps.push({ t: 'lines', li: 0, all: true }); L.steps.push({ t: 'reveal' }); L.steps.push({ t: 'end' });
    }
    ui.rd = L; ui.rdView = 'today';
  }
  function rdById(id) { var L = rdPoems(); for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
  function rdLP() { return (ui.rd && rdById(ui.rd.pid)) || rdPoem(); }
  function rdStep() { return ui.rd && ui.rd.steps[ui.rd.si]; }
  function rdNext() { if (!ui.rd) return; var s = rdStep(); if (s) s.x = null; ui.rd.si = Math.min(ui.rd.si + 1, ui.rd.steps.length - 1); refreshSheet(true); }

  // ---------- what each step shows ----------
  function rdBig(text, extra) { return '<div class="rd-big' + (extra ? ' ' + extra : '') + '">' + esc(text) + '</div>'; }
  function rdWordStep(s, p) {
    var w = s.w, h = '';
    if (s.ph === 'look') {
      h += '<p class="rd-say">' + (s.again ? 'A word to look at again. ' : '') + 'Mum says the word. Look at it until you would know it again.</p>' + rdBig(w) +
        '<div class="btns rd-go"><button class="btn" data-act="rd-ph" data-v="build">I know it by heart — hide it</button><button class="btn ghost small" data-act="rd-knew">I knew this one already</button></div>';
      return h;
    }
    if (s.ph === 'build') {
      if (!s.x) {
        var chars = w.split(''); var letters = chars.filter(function (c) { return /[A-Za-z]/.test(c); });
        var pool = 'abcdefghijklmnoprstuwy'.split('').filter(function (c) { return w.toLowerCase().indexOf(c) < 0; });
        var extra = rdShuffle(pool).slice(0, letters.length < 4 ? 2 : 3);
        s.x = { tiles: rdShuffle(letters.concat(extra)).map(function (c, i) { return { c: c, i: i, used: false }; }), got: 0 };
      }
      var X = s.x, k = 0;
      var slots = w.split('').map(function (c) {
        if (!/[A-Za-z]/.test(c)) return '<span class="rd-slot fixed">' + esc(c) + '</span>';
        var filled = k < X.got; k++;
        return '<span class="rd-slot' + (filled ? ' f' : '') + '">' + (filled ? esc(c) : '') + '</span>';
      }).join('');
      var done = X.got >= w.replace(/[^A-Za-z]/g, '').length;
      h += '<p class="rd-say">' + (done ? 'You made it from memory!' : 'Now make the word with the letters.') + '</p>' +
        (ui.rdPeek ? rdBig(w, 'peek') : '') +
        '<div class="rd-slots" aria-label="The word so far">' + slots + '</div>';
      if (!done) h += '<div class="rd-tiles">' + X.tiles.map(function (t) { return '<button class="rd-tile"' + (t.used ? ' disabled' : '') + ' data-act="rd-letter" data-v="' + t.i + '">' + esc(t.c) + '</button>'; }).join('') + '</div>' +
        '<div class="btns rd-go"><button class="btn ghost small" data-act="rd-peek">👀 Peek</button></div>';
      else h += '<div class="btns rd-go"><button class="btn" data-act="rd-ph" data-v="find">Now find it among the words</button></div>';
      return h;
    }
    // find: every copy of the word among the loose words
    if (!s.x) {
      var others = rdWords(p).filter(function (k2) { return k2 !== w; });
      var more = Object.keys(rdState().known).filter(function (k2) { return k2 !== w && others.indexOf(k2) < 0; });
      var pick = rdShuffle(others).slice(0, 5); if (pick.length < 5) pick = pick.concat(rdShuffle(more).slice(0, 5 - pick.length));
      if (pick.length < 5) { var nxt = rdPoems()[(rdIdx() + 1) % rdPoems().length]; pick = pick.concat(rdShuffle(rdWords(nxt).filter(function (k2) { return k2 !== w && pick.indexOf(k2) < 0; })).slice(0, 5 - pick.length)); }
      s.x = { cards: rdShuffle([w, w, w].concat(pick)).map(function (c, i) { return { c: c, i: i, f: false }; }) };
    }
    var left = s.x.cards.filter(function (c) { return c.c === w && !c.f; }).length;
    h += '<p class="rd-say">' + (left ? 'Find every “' + esc(w) + '”. There are ' + left + ' more.' : 'All found!') + '</p>' +
      '<div class="rd-cards">' + s.x.cards.map(function (c) { return '<button class="rd-card' + (c.f ? ' f' : '') + '"' + (c.f ? ' disabled' : '') + ' data-act="rd-find" data-v="' + c.i + '">' + esc(c.c) + '</button>'; }).join('') + '</div>';
    if (!left) h += '<div class="btns rd-go"><button class="btn" data-act="rd-learnt">' + (rdNextIsWord() ? 'Next word ›' : 'Read the column ›') + '</button></div>';
    return h;
  }
  function rdNextIsWord() { var n = ui.rd.steps[ui.rd.si + 1]; return n && n.t === 'word'; }
  function rdColumn(p) {
    var words = rdWords(p).filter(rdKnows); var c = ui.rd.col;
    if (c === 'up') words = words.slice().reverse(); else if (c === 'mixed') words = ui.rd.mix || (ui.rd.mix = rdShuffle(words));
    return '<p class="rd-say">Read each word as Mum points to it' + (ui.rd.kind === 'sound' ? ' — a quick warm-up before the word families.' : '.') + '</p>' +
      '<div class="seg" role="group" style="align-self:flex-start">' + [['down', 'Down'], ['up', 'Up'], ['mixed', 'Mixed']].map(function (o) { return '<button data-act="rd-col" data-v="' + o[0] + '" aria-pressed="' + (c === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>' +
      '<div class="rd-col">' + words.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div>' +
      '<div class="btns rd-go"><button class="btn" data-act="rd-next">I read them all ›</button></div>';
  }
  function rdLinesStep(s, p) {
    var lines = rdLines(p);
    var usable = lines.map(function (l, i) { return i; }).filter(function (i) { return lines[i].toks.some(function (x) { return rdKnows(x.k); }); });
    if (!usable.length) return '<p class="rd-say">No line has a word you know yet.</p><div class="btns rd-go"><button class="btn" data-act="rd-next">Go on ›</button></div>';
    var pos = Math.min(s.li, usable.length - 1); var L = lines[usable[pos]];
    if (!s.x || s.x.line !== usable[pos]) {
      var slots = L.toks.map(function (x) { return { t: x.t, k: x.k, known: rdKnows(x.k), f: !rdKnows(x.k) }; });
      s.x = { line: usable[pos], slots: slots, tray: rdShuffle(slots.map(function (x, i) { return x.known ? { t: x.t, i: i, used: false } : null; }).filter(Boolean)) };
    }
    var X = s.x; var done = X.slots.every(function (x) { return x.f; });
    var hasCounter = X.slots.some(function (x) { return !x.known; });
    var h = '<div class="kicker">Line ' + (pos + 1) + ' of ' + usable.length + '</div>' +
      '<details class="rd-mum"><summary>Mum: the line to say</summary><p>' + esc(L.raw) + '</p></details>' +
      '<p class="rd-say">' + (done ? 'Now read it to Mum.' : 'Mum says the line. Lay out the words in order.' + (hasCounter ? ' A counter ● stands for a word you will learn soon.' : '')) + '</p>' +
      '<div class="rd-strip">' + X.slots.map(function (x) { return x.f ? (x.known ? '<span class="rd-card f">' + esc(x.t) + '</span>' : '<span class="rd-counter" title="A word to learn soon">●</span>') : '<span class="rd-card empty"></span>'; }).join('') + '</div>';
    if (!done) h += '<div class="rd-cards">' + X.tray.map(function (c, j) { return '<button class="rd-card"' + (c.used ? ' disabled' : '') + ' data-act="rd-place" data-v="' + j + '">' + esc(c.t) + '</button>'; }).join('') + '</div>';
    else h += '<div class="btns rd-go">' + (pos < usable.length - 1 ? '<button class="btn" data-act="rd-line">Next line ›</button>' : '<button class="btn" data-act="rd-next">' + (s.all ? 'See the poem ›' : 'Finish ›') + '</button>') + '</div>';
    if (!done && pos < usable.length - 1) h += '<div class="btns"><button class="btn ghost small" data-act="rd-line">Skip this line</button></div>';
    if (!done && pos === usable.length - 1) h += '<div class="btns"><button class="btn ghost small" data-act="rd-next">Enough lines for today</button></div>';
    return h;
  }
  function rdFamStep(s, p) {
    var F = p.fam[s.f]; var onset = F.from.slice(0, F.from.length - F.rime.length);
    var h = '<p class="rd-say">' + (!s.cut ? 'Read “' + esc(F.from) + '”. Say it slowly. What is left when the beginning is taken away?' : 'Put a new beginning on “' + esc(F.rime) + '” and read the new word. Talk about what it means.') + '</p>';
    h += '<div class="rd-big rd-fam">' + (s.cut ? '<span class="rd-gone">' + esc(onset) + '</span>' : esc(onset)) + '<b>' + esc(F.rime) + '</b></div>';
    if (!s.cut) return h + '<div class="btns rd-go"><button class="btn" data-act="rd-cut">Take away “' + esc(onset) + '”</button></div>';
    var left = F.on.filter(function (o) { return s.made.indexOf(o) < 0; });
    h += '<div class="rd-tiles">' + rdShuffleStable(s, F.on).map(function (o) { var used = s.made.indexOf(o) >= 0; return '<button class="rd-tile wide"' + (used ? ' disabled' : '') + ' data-act="rd-onset" data-v="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div>';
    if (s.made.length) h += '<div class="rd-col">' + [F.from].concat(s.made.map(function (o) { return o + F.rime; })).map(function (w, i) { return '<span>' + (i ? '<i>' + esc(w.slice(0, w.length - F.rime.length)) + '</i>' + esc(F.rime) : esc(w)) + (i && rdLvl(w) < 9 ? '<sup class="rd-cw" title="A common word">★</sup>' : '') + '</span>'; }).join('') + '</div>' + (s.made.some(function (o) { return rdLvl(o + F.rime) < 9; }) ? '<p class="small muted" style="margin:0;text-align:center">★ one of the common (Dolch) words</p>' : '');
    if (!left.length) h += '<div class="btns rd-go"><button class="btn" data-act="rd-famdone">' + (ui.rd.steps[ui.rd.si + 1].t === 'fam' ? 'Next family ›' : 'Finish ›') + '</button></div>';
    return h;
  }
  function rdShuffleStable(s, arr) { return s.order || (s.order = rdShuffle(arr)); }
  function rdReveal(p) {
    var id = (RDW === 'emma' ? 'rde_' : 'rd_') + p.id;
    return '<p class="rd-say">Here is the poem you have been learning. Read it to Mum, clearly and beautifully.</p>' +
      '<div class="card"><div class="kicker">' + esc(p.by) + '</div><h3>' + esc(p.title) + '</h3><div class="poem rd-poem">' + esc(p.text) + '</div></div>' +
      '<div class="card"><h3 style="font-size:18px">Your reading</h3>' + rdRecButton(id) + audioSlot(id) + '</div>' +
      '<div class="btns rd-go"><button class="btn" data-act="rd-poemdone">I read the whole poem ✓</button></div>';
  }
  var rdRec = null;
  function rdRecButton(id) {
    if (!(navigator.mediaDevices && window.MediaRecorder)) return '';
    var on = rdRec && rdRec.id === id;
    return '<div class="btns"><button class="btn' + (on ? '' : ' ghost') + '" data-act="rd-rec" data-v="' + id + '">' + (on ? '■ Stop recording' : '🎙 Record your reading') + '</button></div>';
  }
  function rdRecToggle(id) {
    if (rdRec) { var R = rdRec; rdRec = null; try { R.mr.stop(); } catch (e) {} return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var types = ['audio/mp4', 'audio/webm', 'audio/aac'].filter(function (t) { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } });
      var mr = types.length ? new MediaRecorder(stream, { mimeType: types[0] }) : new MediaRecorder(stream);
      var chunks = [];
      mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        var blob = new Blob(chunks, { type: mr.mimeType || types[0] || 'audio/mp4' }); var key = 'aud_' + id;
        vput(key, blob).then(function () { if (aurls[key]) URL.revokeObjectURL(aurls[key]); aurls[key] = URL.createObjectURL(blob); toast('Recording saved'); refreshSheet(); }).catch(function () { toast('The recording could not be saved'); });
      };
      rdRec = { id: id, mr: mr }; mr.start(); refreshSheet();
    }).catch(function () { toast('The microphone is not available. Allow it in Settings, or add a recording from Files.'); });
  }
  function rdEnd(p) {
    var L = ui.rd; var learnt = L.learnt, fw = L.fw;
    var h = '<div class="rd-done"><div class="rd-big">Well read!</div>';
    if (learnt.length) h += '<p>New words today: <b>' + learnt.map(esc).join(', ') + '</b></p>';
    if (fw.length) h += '<p>Words made by sound: <b>' + fw.map(esc).join(', ') + '</b></p>';
    if (L.kind === 'poem' && rdState().done[p.id]) h += '<p>You have read <b>' + esc(p.title) + '</b>. The next poem starts tomorrow.</p>';
    h += '<p class="small muted">' + rdKnownCount() + ' words in your word book so far.</p></div>';
    var logged = !!L.logged;
    h += '<div class="btns rd-go">' + (logged ? '<span class="small muted">Lesson saved' + (doneToday(RD_TICK) ? ' and ticked for today ✓' : '') + '</span>' : '<button class="btn" data-act="rd-finish">Finish the lesson ✓</button>') + '</div>';
    return h;
  }
  function rdFinish() {
    var L = ui.rd; if (!L || L.logged) return; var r = rdState(); var d = cur();
    if (L.learnt.length || L.fw.length || L.kind !== 'sight') r.log[String(Date.now())] = { n: d ? d.n : 0, d: today(), p: L.pid, k: L.kind, w: L.learnt.slice(), f: L.fw.slice() };
    L.logged = true;
    if (d && !doneToday(RD_TICK)) addToday(RD_TICK); else save();
    render(); refreshSheet(true);
  }

  // ---------- the sheet ----------
  function rdPeekFor(who) { return rdWith(who, rdPeek); }
  function rdPeek() {
    var p = rdPoem(); if (!p) return '';
    if (rdState().done[p.id]) return 'All the poems are read';
    var w = rdWords(p), k = w.filter(rdKnows).length;
    return 'Poem ' + (rdIdx() + 1) + ' · ' + k + ' of ' + w.length + ' words';
  }
  function rdTabs(view) {
    return '<div class="seg" role="group" aria-label="Reading">' + [['today', 'Today'], ['words', 'Words'], ['poems', 'Poems'], ['record', 'Record'], ['how', 'How']].map(function (o) { return '<button data-act="rd-view" data-v="' + o[0] + '" aria-pressed="' + (view === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>';
  }
  function rdToday(p0) {
    if (RDW === 'emily' && !rdKnownCount() && !ui.rdNoPlace) return '<div class="card"><h3>Before the first lesson</h3><p style="margin:0 0 10px">If you can already read some words, a quick placement check saves you learning them again.</p><div class="btns"><button class="btn" data-act="rd-view" data-v="place">Do the placement check</button><button class="btn ghost" data-act="rd-noplace">Start lessons from the beginning</button></div></div>';
    var keep = ui.rd && ui.rd.date === today() && (ui.rd.pid === p0.id || ui.rd.kind === 'poem');
    if (!keep) rdStart(rdSuggest(p0));
    var p = rdLP();
    var w = rdWords(p), k = w.filter(rdKnows).length;
    var head = '<div class="kicker">Poem ' + (rdPoems().indexOf(p) + 1) + ' of ' + rdPoems().length + ' · ' + k + ' of ' + w.length + ' words known</div>' +
      '<div class="rd-dots" aria-hidden="true">' + w.map(function (x) { return '<i class="' + (rdKnows(x) ? 'f' : '') + '"></i>'; }).join('') + '</div>';
    var L = ui.rd;
    var kinds = rdKinds(rdPoem()); var names = { sight: 'New words', sound: 'Word families', poem: 'The poem' };
    var pick = '<div class="seg" role="group" aria-label="Kind of lesson">' + ['sight', 'sound', 'poem'].map(function (o) { var ok = kinds[o]; return '<button data-act="rd-kind" data-v="' + o + '" aria-pressed="' + (L.kind === o) + '"' + (ok ? '' : ' disabled') + '>' + names[o] + '</button>'; }).join('') + '</div>';
    var s = rdStep(); var body = '';
    if (!s) body = '<p class="rd-say">Nothing left to do in this poem.</p>';
    else if (s.t === 'warm') body = '<p class="rd-say">Warm-up: read each word as Mum points to it. Tap any word you have forgotten; it comes back to be learnt again next lesson.</p><div class="rd-cards">' + s.words.map(function (x) { var ag = !!rdState().again[x]; return '<button class="rd-card' + (ag ? ' ag' : '') + '" data-act="rd-againw" data-v="' + esc(x) + '" aria-pressed="' + ag + '">' + esc(x) + '</button>'; }).join('') + '</div><div class="btns rd-go"><button class="btn" data-act="rd-next">On to the new words ›</button></div>';
    else if (s.t === 'word') body = '<div class="kicker">Word ' + (ui.rd.steps.filter(function (x, i) { return x.t === 'word' && i <= ui.rd.si; }).length) + ' of ' + ui.rd.steps.filter(function (x) { return x.t === 'word'; }).length + '</div>' + rdWordStep(s, p);
    else if (s.t === 'column') body = rdColumn(p);
    else if (s.t === 'lines') body = rdLinesStep(s, p);
    else if (s.t === 'fam') body = rdFamStep(s, p);
    else if (s.t === 'reveal') body = rdReveal(p);
    else if (s.t === 'end') body = rdEnd(p);
    var stop = s && s.t !== 'end' && L.kind === 'sight' ? '<div class="btns" style="justify-content:flex-end"><button class="btn ghost small" data-act="rd-stop">Stop here for today</button></div>' : '';
    return head + pick + '<div class="rd-stage">' + body + '</div>' + stop;
  }
  function rdChip(k) {
    var r = rdState(); var ag = !!r.again[k];
    return '<button class="rd-chip' + (r.known[k].s === 'f' ? ' snd' : '') + (ag ? ' ag' : '') + '" data-act="' + (ui.rdManage ? 'rd-forget' : 'rd-againw') + '" data-v="' + esc(k) + '"' + (ui.rdManage ? '' : ' aria-pressed="' + ag + '"') + '>' + esc(k) + '</button>';
  }
  function rdWordBook() {
    var r = rdState(); var keys = Object.keys(r.known);
    var h = '<p style="margin:0"><b>' + keys.length + '</b> words you can read. ' + (ui.rdManage ? 'Tap a word to take it out of your book altogether.' : 'Tap a word you have forgotten to learn it again next lesson.') + '</p>';
    if (RD.common && RDW === 'emily') {
      h += '<div class="card"><h3 style="font-size:18px">Common words</h3>' + RD.common.levels.map(function (L) {
        var k = L.words.filter(rdKnows).length;
        return '<details class="rd-lvl"><summary><span>' + esc(L.name) + '</span><span class="rd-bar"><i style="width:' + Math.round(100 * k / L.words.length) + '%"></i></span><b>' + k + '/' + L.words.length + '</b></summary><p class="small" style="margin:6px 0 0">Not yet: ' + esc(L.words.filter(function (w) { return !rdKnows(w); }).join(', ') || 'none — all known!') + '</p></details>';
      }).join('') + '<p class="small muted" style="margin:8px 0 0">' + esc(RD.common.src) + '</p><div class="btns" style="margin-top:8px"><button class="btn ghost small" data-act="rd-view" data-v="place">Placement check</button></div></div>';
    }
    var ag = rdAgainList(); if (ag.length) h += '<p class="small" style="margin:0"><b>To look at again:</b> ' + esc(ag.join(', ')) + '</p>';
    rdPoems().forEach(function (p) {
      var mine = keys.filter(function (k) { return r.known[k].p === p.id; }); if (!mine.length) return;
      var sight = mine.filter(function (k) { return r.known[k].s !== 'f'; }), snd = mine.filter(function (k) { return r.known[k].s === 'f'; });
      h += '<div class="card"><div class="kicker">' + esc(p.title) + '</div><div class="rd-chips">' + sight.concat(snd).map(rdChip).join('') + '</div></div>';
    });
    var ids = {}; rdPoems().forEach(function (p) { ids[p.id] = 1; });
    var other = keys.filter(function (k) { return !ids[r.known[k].p]; });
    var placed = other.filter(function (k) { return r.known[k].s === 'p'; }), rest = other.filter(function (k) { return r.known[k].s !== 'p'; });
    if (placed.length) h += '<div class="card"><div class="kicker">From the placement check</div><div class="rd-chips">' + placed.sort(function (a, b) { return rdLvl(a) - rdLvl(b); }).map(rdChip).join('') + '</div></div>';
    if (rest.length) h += '<div class="card"><div class="kicker">Other words</div><div class="rd-chips">' + rest.map(rdChip).join('') + '</div></div>';
    h += '<p class="small muted">Filled words you read at sight; outlined words you made by sound in the word families; dashed words are to be looked at again.</p>';
    h += '<div class="btns"><button class="btn ghost small" data-act="rd-manage">' + (ui.rdManage ? 'Done' : 'Take out a word') + '</button></div>';
    return h;
  }
  function rdPoemsView() {
    var r = rdState(); var ci = rdIdx();
    return '<div class="card"><ul class="list">' + rdPoems().map(function (p, i) {
      var w = rdWords(p), k = w.filter(rdKnows).length; var fd = (p.fam || []).filter(function (f, j) { return r.fam[p.id + ':' + j]; }).length;
      var st = r.done[p.id] ? '✓ read' : k + '/' + w.length + ' words · ' + fd + '/' + (p.fam || []).length + ' families';
      return '<li class="' + (i === ci ? 'cur' : '') + '"><span><b>' + (i + 1) + '. ' + esc(p.title) + '</b> <span class="small muted">' + esc(p.by) + ' · ' + st + '</span></span>' + '<span class="btns" style="flex:none">' + (r.done[p.id] ? '<button class="btn ghost small" data-act="rd-again" data-v="' + i + '">Read again</button>' : (i === ci ? '<span class="small">Learning now</span>' : '<button class="btn ghost small" data-act="rd-go" data-v="' + i + '">Learn next</button>') + '<button class="btn ghost small" data-act="rd-knowpoem" data-v="' + i + '">' + (ui.rdKnowAsk === i ? 'Tap again to confirm' : 'I know it') + '</button>') + '</span></li>';
    }).join('') + '</ul></div>' +
      '<p class="small muted" style="margin:0">' + (RDW === 'emma' ? 'You build the longer, less common words of each poem; the short everyday words count as known.' : 'Poems run from the most common words to the least. If you can already read a poem, tap “I know it”: its words go into your word book and it is marked read.') + '</p>' +
      '<div class="card"><h3 style="font-size:18px">New words in one lesson</h3><div class="seg" role="group">' + [3, 5, 8, 10].map(function (n) { var on = (rdPer()) === n; return '<button data-act="rd-per" data-v="' + n + '" aria-pressed="' + on + '">' + n + '</button>'; }).join('') + '</div><p class="small muted" style="margin:6px 0 0">Mason aims at about ten a day. ' + (RDW === 'emma' ? 'Fewer is fine when the words are long.' : 'Fewer is fine while you are beginning.') + '</p></div>' +
      '<p class="small muted">Poem texts: ' + esc(Array.from(new Set(rdPoems().map(function (p) { return p.src.split('. ')[0].split(', Project')[0]; }))).join('; ')) + '.</p>';
  }
  function rdRecordView() {
    var r = rdState(); var ts = Object.keys(r.log).sort(function (a, b) { return b - a; });
    if (!ts.length) return '<p class="muted">Lessons will be listed here once you finish one.</p>';
    var byId = {}; rdPoems().forEach(function (p) { byId[p.id] = p; });
    var names = { sight: 'New words', sound: 'Word families', poem: 'Read the poem', place: 'Placement check: read' };
    return '<div class="card"><ul class="list">' + ts.map(function (t) {
      var e = r.log[t]; var p = byId[e.p];
      var det = (e.w && e.w.length ? e.w.join(', ') : '') + (e.f && e.f.length ? (e.w && e.w.length ? ' · ' : '') + 'by sound: ' + e.f.join(', ') : '');
      return '<li style="display:block"><b>' + esc(fmtDate(e.d)) + (e.n ? ' · Day ' + e.n : '') + '</b> — ' + esc(names[e.k] || e.k) + ', ' + esc(p ? p.title : e.p ? e.p : e.w.length + ' words') + (det ? '<br><span class="small">' + esc(det) + '</span>' : '') + '</li>';
    }).join('') + '</ul></div>';
  }
  function rdHow() {
    var M = RD.method;
    return '<div class="card"><h3>How a reading lesson goes</h3><ol style="margin:0;padding-left:22px;display:flex;flex-direction:column;gap:6px">' + M.steps.map(function (x) { return '<li><b>' + esc(x[0]) + '.</b> ' + esc(x[1]) + '</li>'; }).join('') + '</ol>' +
      '<ul style="margin:10px 0 0;padding-left:20px">' + M.notes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p class="small muted" style="margin:8px 0 0">' + esc(M.src) + '</p></div>';
  }
  function rdPlaceStart() {
    var lv = RD.common.levels.map(function (L) { return rdShuffle(L.words.filter(function (w) { return !rdKnows(w); })); });
    ui.rdPlace = { lv: lv, l: 0, i: 0, miss: 0, got: [], not: [], over: false };
  }
  function rdPlaceView() {
    if (!RD.common) return '<p>No word list.</p>';
    var P = ui.rdPlace;
    if (!P) return '<div class="card"><h3>Placement check</h3><p style="margin:0 0 8px">Read the common words one at a time, easiest first. Tap <b>I read it</b> only if you read it straight away without sounding it out. The check stops by itself when a level gets too hard.</p><p class="small muted" style="margin:0 0 10px">Words you know go into your word book, so lessons skip them. About 5 to 10 minutes; you can stop at any time and keep what you have done.</p><div class="btns"><button class="btn" data-act="rd-pstart">Start the check</button></div></div>';
    while (P.l < P.lv.length && P.i >= P.lv[P.l].length) { P.l++; P.i = 0; P.miss = 0; }
    if (P.over || P.l >= P.lv.length) {
      var lvlName = P.l < RD.common.levels.length ? RD.common.levels[P.l].name : '';
      return '<div class="rd-done"><div class="rd-big">Check done</div><p>You read <b>' + P.got.length + '</b> common words' + (P.not.length ? ' and have <b>' + P.not.length + '</b> to learn' : '') + '.' + (P.over && lvlName ? ' The ' + esc(lvlName.toLowerCase()) + ' words are where you are now.' : '') + '</p>' +
        (P.not.length ? '<p class="small">Not yet: ' + esc(P.not.join(', ')) + '</p>' : '') + '<p class="small muted">The words you read are in your word book. Your lessons will teach the rest as they come up in the poems.</p></div>' +
        '<div class="btns rd-go"><button class="btn" data-act="rd-view" data-v="today">Back to today</button><button class="btn ghost small" data-act="rd-pdone">Close the check</button></div>';
    }
    var L = RD.common.levels[P.l], w = P.lv[P.l][P.i];
    var left = P.lv.slice(P.l).reduce(function (t, a, j) { return t + a.length - (j === 0 ? P.i : 0); }, 0);
    return '<div class="rd-stage"><div class="kicker">' + esc(L.name) + ' · ' + left + ' words left to check</div>' + rdBig(w) +
      '<div class="btns rd-go"><button class="btn" data-act="rd-pans" data-v="1">I read it</button><button class="btn ghost" data-act="rd-pans" data-v="0">Not yet</button></div></div>' +
      '<div class="btns" style="justify-content:flex-end"><button class="btn ghost small" data-act="rd-pstop">Stop the check here</button></div>';
  }
  function rdPlaceAns(ok) {
    var P = ui.rdPlace; var w = P.lv[P.l][P.i]; var r = rdState();
    if (ok) { P.got.push(w); if (!r.known[w]) { var d = cur(); r.known[w] = { n: d ? d.n : 0, d: today(), p: '', s: 'p' }; } delete r.again[w]; P.miss = 0; }
    else { P.not.push(w); P.miss++; }
    P.i++;
    // Stop when she misses five in a row, or more than half of a level once ten have been tried.
    var tried = P.i, missedHere = P.not.filter(function (x) { return P.lv[P.l].indexOf(x) >= 0; }).length;
    if (P.miss >= 5 || (tried >= 10 && missedHere > tried / 2)) P.over = true;
    save();
  }
  function rdPlaceFinish() {
    var P = ui.rdPlace; if (!P || P.logged) return; P.logged = true;
    if (P.got.length || P.not.length) { var d = cur(); rdState().log[String(Date.now())] = { n: d ? d.n : 0, d: today(), p: '', k: 'place', w: P.got.slice(), f: [] }; save(); }
  }
  // ---------- 识字: MOE 识读字 and 识写字, a few new characters a day, with spaced review ----------
  // Emma follows the 《欢乐伙伴》 list (P1–P6), Emily the 《欢乐伙伴2.0》 list. Lists are in data/zi.js.
  // Reading: see the character, say it, check with the pinyin and words (and the voice), say whether you knew it.
  // Writing: copy new 识写字 three times looking, then on later days write them from memory and check.
  // Review gaps grow 1, 2, 4, 8 … school days, so breaks for travel do not pile up reviews.
  var ZW = 'emma', ZI_TICK = 'e_zi', ZGAP = [0, 1, 2, 4, 8, 16, 32, 64];
  var Z = window.ZI || { lists: {}, py: {}, words: {} };
  function ziState() {
    var all = S.zi || (S.zi = {}); var z = all[ZW] || (all[ZW] = {});
    if (!z.list) z.list = ZW === 'emma' ? 'v1' : 'v2';
    if (z.rp == null) z.rp = 0; if (z.wp == null) z.wp = 0;
    if (!z.r) z.r = {}; if (!z.w) z.w = {}; if (!z.log) z.log = {};
    if (!z.nr) z.nr = ZW === 'emma' ? 5 : 3; if (!z.nw) z.nw = ZW === 'emma' ? 3 : 2;
    return z;
  }
  var ZORD = {};
  // Flat order of the list: each character once, in lesson order, with the semester (一上 …) it belongs to.
  function ziOrder(key) {
    if (ZORD[key]) return ZORD[key];
    var L = (Z.lists[key] || { lessons: [] }).lessons, r = [], w = [], sr = {}, sw = {}, sems = [];
    L.forEach(function (l) {
      if (sems.indexOf(l[0]) < 0) sems.push(l[0]);
      l[2].split('').forEach(function (c) { if (!sr[c]) { sr[c] = 1; r.push({ c: c, s: l[0], l: l[1] }); } });
      l[3].split('').forEach(function (c) { if (!sw[c]) { sw[c] = 1; w.push({ c: c, s: l[0], l: l[1] }); } });
    });
    return (ZORD[key] = { r: r, w: w, sems: sems });
  }
  function ziDay() { var d = cur(); return d ? d.n : (S.days.length ? S.days[S.days.length - 1].n : 0); }
  function ziWords(c) { var w = Z.words[c]; if (!w) return []; return Array.isArray(w) ? w : (w[ziState().list] || []); }

  function ziSayText(c) { return c; }
  // Recorded voices (audio-cmn: words read by Yue Tan, syllables by Chen Wang): the character, then its words.
  // Anything not recorded is read by the iPad's own Chinese voice.
  var ziAud = null, ziQ = [];
  function ziHex(w) { return w.split('').map(function (ch) { return ch.charCodeAt(0).toString(16); }).join('-'); }
  // Which voice: the iPad's own (the one chosen in Settings → Accessibility → Spoken Content), or the recordings.
  function ziVoicePref() { try { return localStorage.getItem('zi-voice') || 'ios'; } catch (e) { return 'ios'; } }
  function ziClips(c, wordOnly) {
    var out = [], au = Z.au && Z.au[c];
    if (ziVoicePref() === 'ios') { if (!wordOnly) out.push({ tts: c }); ziWords(c).forEach(function (x) { if (!wordOnly || x[0] === wordOnly) out.push({ tts: x[0] }); }); return out; }
    if (!wordOnly) out.push(au === 1 ? 'data/audio/' + ziHex(c) + '.mp3' : au ? 'data/audio/s/' + au + '.mp3' : { tts: c });
    ziWords(c).forEach(function (x) { if (!wordOnly || x[0] === wordOnly) out.push(x[2] ? 'data/audio/' + ziHex(x[0]) + '.mp3' : { tts: x[0] }); });
    return out;
  }
  function ziPlayQ() {
    var n = ziQ.shift(); if (!n) return;
    if (n.tts) { ziTTS(n.tts, ziPlayQ); return; }
    if (!ziAud) ziAud = new Audio();
    ziAud.onended = function () { setTimeout(ziPlayQ, 280); }; ziAud.onerror = function () { setTimeout(ziPlayQ, 50); };
    ziAud.src = n; var pr = ziAud.play(); if (pr && pr.catch) pr.catch(function () {});
  }
  function ziTTS(t, done, slowly) {
    try {
      var s = window.speechSynthesis; if (!s) { if (done) done(); return; }
      // The iPad voice clips very short phrases; ending each with a full stop lets it finish the word properly.
      var said = /[。！？，.!?]$/.test(t) ? t : t + '。';
      var u = new SpeechSynthesisUtterance(said); u.lang = 'zh-CN'; u.rate = slowly ? 0.8 : 0.95; // no voice set: iPadOS then uses the one chosen in Settings
      // Safari can stop an utterance halfway if nothing holds on to it, so keep the last few.
      ziTTS.keep = (ziTTS.keep || []).concat([u]).slice(-4);
      u.onend = function () { if (done) setTimeout(done, 120); }; u.onerror = function () { if (done) done(); }; s.speak(u);
    } catch (e) { if (done) done(); }
  }

  function ziSpeakChar(c, wordOnly) { try { window.speechSynthesis.cancel(); } catch (e) {} if (ziAud) ziAud.pause(); ziQ = ziClips(c, wordOnly); ziPlayQ(); }
  function ziDue(bag, day) { return Object.keys(bag).filter(function (c) { return bag[c].d <= day; }).sort(function (a, b) { return bag[a].d - bag[b].d || bag[a].b - bag[b].b; }); }
  function ziGrade(bag, c, ok) {
    var e = bag[c] || (bag[c] = { b: 0, d: 0 }); var day = ziDay();
    if (ok) { e.b = Math.min(ZGAP.length - 1, (e.b || 0) + 1); e.d = day + ZGAP[e.b]; } else { e.b = 1; e.d = day + 1; }
  }
  function ziCharHTML(c, big) { return '<span class="zi-c' + (big ? ' big' : '') + '">' + esc(c) + '</span>'; }
  function ziWordsHTML(c, hide) {
    var w = ziWords(c); if (!w.length) return '';
    return '<div class="zi-words">' + w.map(function (x) {
      var t = hide ? x[0].split('').map(function (ch) { return ch === c ? '□' : ch; }).join('') : x[0];
      return '<span><b>' + esc(t) + '</b><i>' + esc(x[1]) + '</i></span>';
    }).join('') + '</div>';
  }
  // Say it, then compare: she records herself; then the model (the character and its first word) plays, then her own voice.
  // Nothing is graded or kept: it is for her ear only.
  var ziCmp = null;
  function ziCmpHTML(c) {
    if (!(navigator.mediaDevices && window.MediaRecorder)) return '';
    var on = ziCmp && ziCmp.c === c && ziCmp.mr, has = ziCmp && ziCmp.c === c && ziCmp.url;
    return '<div class="btns" style="justify-content:center">' + (on ? '<button class="btn small" data-act="zi-cmp" data-v="' + esc(c) + '">■ Done</button><span class="small" style="color:#b3261e">● listening to you…</span>'
      : '<button class="btn ghost small" data-act="zi-cmp" data-v="' + esc(c) + '">🎙 Say it, then compare</button>' + (has ? '<button class="btn ghost small" data-act="zi-cmpplay" data-v="' + esc(c) + '">▶ Compare again</button>' : '')) + '</div>' +
      (has && !on ? '<p class="small muted" style="margin:2px 0 0;text-align:center">First the recording, then you. Do they sound the same, tones too?</p>' : '');
  }
  function ziCmpPlay(c) {
    try { window.speechSynthesis.cancel(); } catch (e) {} if (ziAud) ziAud.pause();
    ziQ = ziClips(c).slice(0, 2);
    if (ziCmp && ziCmp.url) ziQ.push(ziCmp.url);
    ziPlayQ();
  }
  function ziCmpToggle(c) {
    if (ziCmp && ziCmp.mr) { var M = ziCmp.mr; ziCmp.mr = null; try { M.stop(); } catch (e) {} return; }
    try { window.speechSynthesis.cancel(); } catch (e) {} if (ziAud) ziAud.pause();
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var types = ['audio/mp4', 'audio/webm', 'audio/aac'].filter(function (t) { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } });
      var mr = types.length ? new MediaRecorder(stream, { mimeType: types[0] }) : new MediaRecorder(stream), chunks = [];
      mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      mr.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        if (ziCmp && ziCmp.url) URL.revokeObjectURL(ziCmp.url);
        ziCmp = { c: c, url: URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || types[0] || 'audio/mp4' })) };
        refreshSheet(); ziCmpPlay(c);
      };
      if (ziCmp && ziCmp.url && ziCmp.c !== c) URL.revokeObjectURL(ziCmp.url);
      ziCmp = { c: c, mr: mr, url: ziCmp && ziCmp.c === c ? ziCmp.url : null }; mr.start(); refreshSheet();
    }).catch(function () { toast('The microphone is not available. Allow it in Settings.'); });
  }
  function ziSayBtn(c, word) { return '<button class="btn ghost small" data-act="zi-say" data-v="' + esc(c) + (word ? '|' + esc(word) : '') + '">🔊 Listen</button>'; }

  // Build today's session: reviews due, then new 识读字, then new 识写字 to copy, then 识写字 due from memory.
  function ziBuild() {
    var z = ziState(), O = ziOrder(z.list), day = ziDay(), q = [];
    ziDue(z.r, day).slice(0, 30).forEach(function (c) { q.push({ k: 'rr', c: c }); });
    // New characters are taken in list order; the place in the list only moves on once each one has been done.
    var n = 0, rp = z.rp; while (n < z.nr && rp < O.r.length) { var it = O.r[rp]; if (!z.r[it.c]) { q.push({ k: 'rn', c: it.c, x: rp }); n++; } rp++; }
    var known = function (c) { return !!z.r[c] || q.some(function (x) { return x.c === c && x.k === 'rn'; }); };
    var m = 0, wp = z.wp; while (m < z.nw && wp < O.w.length && known(O.w[wp].c)) { var iw = O.w[wp]; if (!z.w[iw.c]) { q.push({ k: 'wn', c: iw.c, x: wp }); m++; } wp++; }
    ziDue(z.w, day).slice(0, 12).forEach(function (c) { q.push({ k: 'wr', c: c }); });
    return { q: q, i: 0, shown: false, again: [], got: 0, miss: 0, nNew: n, nWrite: m };
  }
  function ziNeed(c) { if (!HZ[c]) { hzLoad(c, function () { if (ui.zi) refreshSheet(); }); } }
  function ziWriteHTML(c, recall) {
    var d = HZ[c];
    return '<div class="zi-play"><div id="hzbox">' + hzSVG(c, 'plain', 200) + '</div><div id="hzlab" class="zi-lab">' + (d ? '<b>' + d.s.length + ' strokes</b> · ' + d.n.map(esc).join('、') : '') + '</div>' +
      '<div class="btns" style="justify-content:center"><button class="btn" data-act="zi-play" data-v="' + esc(c) + '">▶ Watch the strokes</button><button class="btn ghost small" data-act="zi-play" data-v="' + esc(c) + ':slow">Slower</button></div></div>';
  }
  function ziCard(R) {
    var it = R.q[R.i], c = it.c; ziNeed(c); var h = '<div class="kicker">' + (R.i + 1) + ' of ' + R.q.length + ' · ' + { rr: '认读 · Do you know it?', rn: '认读 · New character', wn: '写字 · Copy it', wr: '写字 · From memory' }[it.k] + '</div><div class="card zi-card">';
    if (it.k === 'rr') {
      h += ziCharHTML(c, true);
      if (!R.shown) h += '<p class="rd-say">Say it aloud, and a word with it. Then check.</p><div class="btns"><button class="btn" data-act="zi-show">Check</button></div>';
      else h += '<p class="zi-py">' + esc(Z.py[c] || '') + '</p>' + ziWordsHTML(c) + '<div class="btns" style="justify-content:center">' + ziSayBtn(ziSayText(c)) + '</div>' + ziCmpHTML(c) + hzExplain(c) + '<div class="btns"><button class="btn" data-act="zi-grade" data-v="1">I knew it ✓</button><button class="btn ghost" data-act="zi-grade" data-v="0">Not yet</button></div>';
    } else if (it.k === 'rn') {
      h += ziCharHTML(c, true) + '<p class="zi-py">' + esc(Z.py[c] || '') + '</p>' + ziWordsHTML(c) + '<p class="rd-say">Listen, then read the character and the words aloud twice. Then look at how it is built.</p><div class="btns" style="justify-content:center">' + ziSayBtn(ziSayText(c)) + '</div>' + ziCmpHTML(c) + hzExplain(c) + '<div class="btns"><button class="btn" data-act="zi-next">Next ›</button><button class="btn ghost" data-act="zi-known">I already know this ✓</button></div>';
    } else if (it.k === 'wn') {
      h += '<p class="zi-py">' + esc(Z.py[c] || '') + '</p>' + ziWordsHTML(c) + ziWriteHTML(c) +
        '<ol class="zi-steps"><li><b>Watch and listen.</b> Each stroke is drawn in red and its name is read out.</li><li><b>书空.</b> Watch again and write it in the air with your finger, saying each stroke name.</li><li><b>Copy it twice</b> in your Chinese book, saying the stroke names as you write. Look at the whole character first; do not trace.</li><li><b>Cover the screen</b> and write it once more from memory, then check.</li></ol>' +
        '<div class="btns">' + ziSayBtn(ziSayText(c)) + '<button class="btn" data-act="zi-next">I wrote it ›</button><button class="btn ghost" data-act="zi-known">I can already write it ✓</button></div>';
    } else {
      var w = ziWords(c);
      h += '<p class="zi-py" style="font-size:22px">' + esc(Z.py[c] || '') + '</p>' + ziWordsHTML(c, true);
      if (!R.shown) h += '<p class="rd-say">Listen, then write the missing character from memory in your book. Then check.</p><div class="btns">' + ziSayBtn(c, w.length ? w[0][0] : '') + '<button class="btn" data-act="zi-show">Check</button></div>';
      else h += ziWriteHTML(c) + '<p class="small muted">Check the strokes as well as the shape. If any stroke was different, tap Not yet.</p><div class="btns"><button class="btn" data-act="zi-grade" data-v="1">I wrote it right ✓</button><button class="btn ghost" data-act="zi-grade" data-v="0">Not yet</button></div>';
    }
    return h + '</div>';
  }
  function ziToday() {
    var z = ziState(), R = ui.zi && ui.zi.run;
    if (!z.placed && !Object.keys(z.r).length && !ui.ziNoPlace) return '<div class="card"><h3>Before you start</h3><p style="margin:0 0 10px">If you can already read and write some characters, a quick check finds where to begin, so you don\'t learn them again.</p><div class="btns"><button class="btn" data-act="zi-view" data-v="place">Do the check</button><button class="btn ghost" data-act="zi-noplace">Start from the beginning</button></div></div>';
    if (!R) {
      var day = ziDay(), dr = ziDue(z.r, day).length, dw = ziDue(z.w, day).length, O = ziOrder(z.list);
      var done = z.log[today()];
      return (done ? '<div class="card"><p style="margin:0">✓ Done today: ' + done.n + ' new, ' + done.rev + ' reviewed. You can do another round if you like.</p></div>' : '') +
        '<div class="card"><p style="margin:0 0 6px">Today: <b>' + Math.min(z.nr, O.r.length - ziKnownCount(z.r, O.r, z.rp)) + '</b> new characters to read, <b>' + z.nw + '</b> to write, and <b>' + (Math.min(dr, 30) + Math.min(dw, 12)) + '</b> to review.</p>' +
        '<p class="small muted" style="margin:0 0 10px">Have your Chinese book and pencil ready. About 10–15 minutes. If a new character is one you already know, tap "I already know this" and the next one takes its place.</p><button class="btn" data-act="zi-start">Start</button></div>' +
        '<p class="small muted">Already know many? In <b>Characters</b>, choose "✓ I can read it" or "✍️ I can write it" and tap them off, or tick a whole half-year at once.</p>';
    }
    if (R.i >= R.q.length) return ziEnd(R);
    return '<div class="mt-top"><button class="btn ghost small" data-act="zi-back">‹ Back</button></div>' + ziCard(R);
  }
  function ziKnownCount(bag, arr, upto) { var n = 0; for (var i = 0; i < arr.length; i++) if (bag[arr[i].c]) n++; return n; }
  function ziEnd(R) {
    var z = ziState(), t = today(), g = z.log[t] || (z.log[t] = { n: 0, rev: 0 });
    if (!R.logged) {
      R.logged = true; g.n += R.nNew + R.nWrite; g.rev += R.got + R.miss;
      var d = cur(); if (d && !doneToday(ZI_TICK)) addToday(ZI_TICK); else save();
    }
    return '<div class="card rd-done"><h3>Well done!</h3><p>' + (R.nNew ? R.nNew + ' new characters to read' : 'No new characters') + (R.nWrite ? ', ' + R.nWrite + ' new to write' : '') + '. ' + (R.skipped ? R.skipped + ' you already knew, ticked off. ' : '') + (R.got + R.miss ? R.got + ' of ' + (R.got + R.miss) + ' remembered.' : '') + '</p>' +
      (R.again.length ? '<p class="small muted">These come back tomorrow: ' + R.again.map(esc).join(' ') + '</p>' : '') + '<button class="btn" data-act="zi-close">Finish</button></div>';
  }

  // Characters tab: progress through each semester of the list.
  function ziBook() {
    var z = ziState(), O = ziOrder(z.list), L = Z.lists[z.list], sel = ui.zi.sel, wset = {};
    O.w.forEach(function (x) { wset[x.c] = 1; });
    var h = '<p class="small muted" style="margin:0 0 8px">' + esc(L ? L.name : '') + '. Tap a character to hear it and tick it off. Blue: you can read it · yellow line: you can write it too.</p>';
    var bar = '';
    if (sel) {
      var w1 = ziWords(sel)[0];
      bar = '<div class="zi-selp"><span class="zi-c">' + esc(sel) + '</span><span class="zi-selpy">' + esc(Z.py[sel] || '') + (w1 ? '<br><span class="small">' + esc(w1[0]) + ' ' + esc(w1[1]) + '</span>' : '') + '</span>' +
        '<button class="btn ghost small" data-act="zi-say" data-v="' + esc(sel) + '" aria-label="Hear it again">🔊</button>' +
        '<button class="btn small' + (z.r[sel] ? '' : ' ghost') + '" data-act="zi-tick" data-v="r:' + esc(sel) + '">' + (z.r[sel] ? '✓ Can read' : 'Can read') + '</button>' +
        (wset[sel] ? '<button class="btn small' + (z.w[sel] ? '' : ' ghost') + '" data-act="zi-tick" data-v="w:' + esc(sel) + '">' + (z.w[sel] ? '✍️ Can write' : 'Can write') + '</button>' : '') +
        '<button class="btn ghost small" data-act="zi-pick" data-v="" aria-label="Close">✕</button>' + ziCmpHTML(sel) + '</div>';
    }
    O.sems.forEach(function (s) {
      var rs = O.r.filter(function (x) { return x.s === s; }), ws = {}; O.w.forEach(function (x) { if (x.s === s) ws[x.c] = 1; });
      var nr = rs.filter(function (x) { return z.r[x.c]; }).length, nw = Object.keys(ws).filter(function (c) { return z.w[c]; }).length;
      h += '<div class="card"><div class="kicker">' + esc(s) + ' · read ' + nr + '/' + rs.length + ' · write ' + nw + '/' + Object.keys(ws).length + '</div>' +
        '<div class="btns" style="margin:4px 0 6px"><button class="btn ghost small" data-act="zi-tickall" data-v="r:' + esc(s) + ':1">Can read all of ' + esc(s) + '</button><button class="btn ghost small" data-act="zi-tickall" data-v="w:' + esc(s) + ':1">Can write all</button><button class="btn ghost small" data-act="zi-tickall" data-v="r:' + esc(s) + ':0">Untick all</button></div><div class="zi-book">' +
        rs.map(function (x) { return '<button class="zi-b' + (z.r[x.c] ? ' on' : '') + (ws[x.c] ? ' w' : '') + (z.w[x.c] ? ' won' : '') + (sel === x.c ? ' sel' : '') + '" data-act="zi-pick" data-v="' + esc(x.c) + '">' + esc(x.c) + '</button>'; }).join('') + '</div></div>';
    });
    var tr = ziKnownCount(z.r, O.r), tw = ziKnownCount(z.w, O.w);
    return '<div class="card"><p style="margin:0">You can read <b>' + tr + '</b> of ' + O.r.length + ' and write <b>' + tw + '</b> of ' + O.w.length + ' characters on this list.</p></div>' + h + bar;
  }

  // Placement: ten characters from each semester to read; five to write. Most right moves you past that semester.
  function ziPlace() {
    var z = ziState(), O = ziOrder(z.list), P = ui.zi.place;
    if (!P) return '<div class="card"><p style="margin:0 0 8px">Ten characters from each half-year of the list. Say each one aloud, then check. If you know nearly all of them, the whole half-year counts as known and the check moves on. Then a few to write from memory.</p><p class="small muted" style="margin:0 0 10px">Have your Chinese book and pencil ready. You can stop at any time and keep what you have done.</p><button class="btn" data-act="zi-pstart">Start the check</button></div>';
    if (P.end) return '<div class="card rd-done"><h3>Check finished</h3><p>' + esc(P.msg) + '</p><button class="btn" data-act="zi-view" data-v="today">Go to today\'s characters</button></div>';
    var c = P.items[P.i], wr = P.phase === 'w'; ziNeed(c);
    var h = '<div class="mt-top"><button class="btn ghost small" data-act="zi-pstop">‹ Back</button></div><div class="kicker">' + esc(O.sems[P.si]) + ' · ' + (wr ? 'write ' : 'read ') + (P.i + 1) + ' of ' + P.items.length + '</div><div class="card zi-card">';
    if (!wr) {
      h += ziCharHTML(c, true);
      h += !P.shown ? '<div class="btns"><button class="btn" data-act="zi-pshow">Check</button><button class="btn ghost" data-act="zi-pans" data-v="0">I don\'t know it</button></div>'
        : '<p class="zi-py">' + esc(Z.py[c] || '') + '</p>' + ziWordsHTML(c) + '<div class="btns"><button class="btn" data-act="zi-pans" data-v="1">I knew it ✓</button><button class="btn ghost" data-act="zi-pans" data-v="0">Not yet</button></div>';
    } else {
      var w = ziWords(c);
      h += '<p class="zi-py" style="font-size:22px">' + esc(Z.py[c] || '') + '</p>' + ziWordsHTML(c, true);
      h += !P.shown ? '<div class="btns">' + ziSayBtn(c, w.length ? w[0][0] : '') + '<button class="btn" data-act="zi-pshow">Check</button><button class="btn ghost" data-act="zi-pans" data-v="0">I can\'t write it</button></div>'
        : ziWriteHTML(c) + '<div class="btns"><button class="btn" data-act="zi-pans" data-v="1">I wrote it right ✓</button><button class="btn ghost" data-act="zi-pans" data-v="0">Not yet</button></div>';
    }
    return h + '</div><div class="btns"><button class="btn ghost small" data-act="zi-pstop">Stop here and keep what I have done</button></div>';
  }
  function ziSample(arr, n) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a.slice(0, n); }
  function ziPlaceSem(P) {
    var z = ziState(), O = ziOrder(z.list), s = O.sems[P.si];
    if (P.phase === 'r') P.items = ziSample(O.r.filter(function (x) { return x.s === s; }).map(function (x) { return x.c; }), 10);
    else P.items = ziSample(O.w.filter(function (x) { return x.s === s; }).map(function (x) { return x.c; }), 5);
    P.i = 0; P.ok = 0; P.shown = false;
  }
  // Mark a whole semester known, with first reviews spread over the coming weeks so they do not arrive all at once.
  function ziMarkSem(bag, arr, s) { var day = ziDay(); arr.forEach(function (x) { if (x.s === s && !bag[x.c]) bag[x.c] = { b: 5, d: day + 5 + Math.floor(Math.random() * 40) }; }); }
  function ziPlaceNext(P) {
    var z = ziState(), O = ziOrder(z.list), s = O.sems[P.si];
    if (P.phase === 'r') {
      if (P.ok >= 9) { ziMarkSem(z.r, O.r, s); P.rDone = P.si + 1; if (!P.wStop) { P.phase = 'w'; ziPlaceSem(P); return; } }
      else return ziPlaceFinish(P);
    } else {
      if (P.ok >= 4) { ziMarkSem(z.w, O.w, s); P.wDone = P.si + 1; } else P.wStop = true;
    }
    P.si++; P.phase = 'r';
    if (P.si >= O.sems.length) return ziPlaceFinish(P);
    ziPlaceSem(P);
  }
  function ziPlaceFinish(P) {
    var z = ziState(), O = ziOrder(z.list);
    var rs = O.sems[P.rDone || 0], wsem = O.sems[P.wDone || 0];
    for (var i = 0; i < O.r.length; i++) if (O.r[i].s === rs) { z.rp = i; break; } if (!rs) z.rp = O.r.length;
    for (var k = 0; k < O.w.length; k++) if (O.w[k].s === wsem) { z.wp = k; break; } if (!wsem) z.wp = O.w.length;
    z.placed = true; save();
    P.end = true; P.msg = (P.rDone ? 'You can read the characters up to the end of ' + O.sems[P.rDone - 1] : 'Reading starts at the beginning') + (P.wDone ? ', and write them up to the end of ' + O.sems[P.wDone - 1] : '; writing starts at the beginning') + '. New characters start from ' + (rs || 'the end of the list') + '.';
  }
  function ziSettings() {
    var z = ziState();
    function row(lbl, key, v) { return '<li><span>' + lbl + '</span><span class="btns"><button class="btn ghost small" data-act="zi-set" data-v="' + key + ':-1">−</button><b style="min-width:2em;text-align:center">' + v + '</b><button class="btn ghost small" data-act="zi-set" data-v="' + key + ':1">+</button></span></li>'; }
    var rs = ui.zi.reset;
    return '<div class="card"><div class="kicker">For Mum</div><ul class="list">' + row('New characters to read each day', 'nr', z.nr) + row('New characters to write each day', 'nw', z.nw) + '</ul>' +
      '<div class="kicker" style="margin-top:10px">Voice</div><div class="seg" role="group" aria-label="Voice">' + [['ios', 'iPad voice'], ['rec', 'Recorded voice']].map(function (o) { return '<button data-act="zi-voice" data-v="' + o[0] + '" aria-pressed="' + (ziVoicePref() === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>' +
      '<p class="small muted" style="margin:6px 0 0">' + (ziVoicePref() === 'ios' ? 'Uses the Chinese voice chosen on this iPad in Settings → Accessibility → Spoken Content → Voices → Chinese (China mainland).' : 'Recordings of native speakers (audio-cmn: words by Yue Tan, characters by Chen Wang).') + ' <button class="btn ghost small" data-act="zi-say" data-v="大">🔊 Try it</button></p>' +
      '<p class="small muted">List: ' + esc((Z.lists[z.list] || {}).name || '') + '. Reviews come back after 1, 2, 4, 8, 16, 32 and 64 school days; a character missed starts again at one day.</p>' +
      '<div class="kicker" style="margin-top:10px">Start again</div><div class="btns">' + [['r', 'Reset reading (识读)'], ['w', 'Reset writing (识写)'], ['all', 'Reset all 识字']].map(function (o) { return rs === o[0] ? '<button class="btn small" style="background:#b3261e;border-color:#b3261e" data-act="zi-reset" data-v="' + o[0] + '">Tap again to ' + o[1].toLowerCase() + '</button>' : '<button class="btn ghost small" data-act="zi-reset" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' +
      '<p class="small muted">To tick off single characters she already knows, use the Characters tab.</p></div>';
  }
  // ---------- 识字: stroke animation with stroke names read aloud, and how each character is built ----------
  // Per-character data (data/hz/<code>.json): stroke outlines and centre lines from Make Me a Hanzi, stroke names
  // (笔画名称), the character's parts (偏旁部首) and how it was formed (象形, 会意, 形声), loaded when first needed.
  var HZ = {}, HZWAIT = {};
  function hzLoad(c, cb) {
    if (HZ[c]) { if (cb) cb(HZ[c]); return; }
    if (HZWAIT[c]) { if (cb) HZWAIT[c].push(cb); return; }
    HZWAIT[c] = cb ? [cb] : [];
    var x = new XMLHttpRequest(); x.open('GET', 'data/hz/' + c.charCodeAt(0).toString(16) + '.json');
    x.onload = function () { try { HZ[c] = JSON.parse(x.responseText); } catch (e) { HZ[c] = null; } var l = HZWAIT[c]; delete HZWAIT[c]; if (HZ[c]) l.forEach(function (f) { f(HZ[c]); }); };
    x.onerror = function () { delete HZWAIT[c]; };
    x.send();
  }
  // Fetch every character a session will need, so it still works if the internet drops halfway.
  function hzPrefetch(list) { list.forEach(function (c) { hzLoad(c); }); }
  var HZCOL = ['#c0392b', '#1f6fb2', '#2e8b57', '#8e44ad', '#d35400'];
  // The character drawn from its strokes. mode 'parts' colours each part; 'grey' draws it faint for animating over.
  function hzSVG(c, mode, size) {
    var d = HZ[c]; if (!d) return '<div class="zi-grid" style="width:' + size + 'px;height:' + size + 'px;line-height:' + (size - 4) + 'px;font-size:' + Math.round(size * 0.8) + 'px">' + esc(c) + '</div>';
    var paths = d.s.map(function (p, i) {
      var ci = d.t[i] >= 0 ? (d.tc ? d.tc[d.t[i]] : d.t[i]) : -1;
      var col = mode === 'parts' ? (ci >= 0 && ci != null ? HZCOL[ci % HZCOL.length] : '#333') : mode === 'grey' ? '#e3e3e3' : '#222';
      return '<path d="' + p + '" fill="' + col + '" data-i="' + i + '"/>';
    }).join('');
    var grid = '<rect x="0" y="0" width="1024" height="1024" fill="#fff" stroke="#c0392b" stroke-width="12"/><path d="M512 0V1024M0 512H1024" stroke="rgba(192,57,43,.35)" stroke-width="6" stroke-dasharray="24 18"/>';
    return '<svg class="hz" viewBox="0 0 1024 1024" width="' + size + '" height="' + size + '">' + grid + '<g transform="scale(1,-1) translate(0,-900)">' + paths + '<g class="hz-anim"></g></g></svg>';
  }
  // Animate one stroke: a thick line runs along the stroke's centre line, clipped to the stroke's outline.
  var hzTimer = null;
  var hzRaf = null;
  // Where along the stroke each part of its name begins: the start, then the sharpest turns of the pen, in order.
  function hzSplits(pts, len, n) {
    var at = [0]; if (n < 2 || pts.length < 3) { for (var q = 1; q < n; q++) at.push(q / n); return at; }
    var cum = [0]; for (var a = 1; a < pts.length; a++) cum.push(cum[a - 1] + Math.sqrt(Math.pow(pts[a][0] - pts[a - 1][0], 2) + Math.pow(pts[a][1] - pts[a - 1][1], 2)));
    var turns = [];
    for (var b = 1; b < pts.length - 1; b++) {
      var a1 = Math.atan2(pts[b][1] - pts[b - 1][1], pts[b][0] - pts[b - 1][0]), a2 = Math.atan2(pts[b + 1][1] - pts[b][1], pts[b + 1][0] - pts[b][0]);
      var dA = Math.abs(((a2 - a1 + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI);
      turns.push({ i: b, a: dA });
    }
    turns.sort(function (x, y) { return y.a - x.a; });
    var pick = [];
    turns.forEach(function (tn) { if (pick.length < n - 1 && pick.every(function (p) { return Math.abs(cum[p] - cum[tn.i]) > len * 0.12; })) pick.push(tn.i); });
    pick.sort(function (x, y) { return x - y; });
    pick.forEach(function (p) { at.push((cum[p] + 75) / (len + 150)); });
    while (at.length < n) at.push(Math.min(0.95, at[at.length - 1] + 0.2));
    return at;
  }
  function hzStop() { if (hzSilent) hzSilent.pause(); if (hzRaf) cancelAnimationFrame(hzRaf); hzRaf = null; clearTimeout(hzTimer); hzTimer = null; try { window.speechSynthesis.cancel(); } catch (e) {} if (hzAud) { hzAud.onended = null; hzAud.pause(); } }
  function hzPlay(box, c, opts) {
    hzStop(); var d = HZ[c]; if (!d || !box) return;
    box.innerHTML = hzSVG(c, 'grey', opts.size || 220);
    var svg = box.querySelector('svg'), g = svg.querySelector('.hz-anim'), lab = opts.label, NS = 'http://www.w3.org/2000/svg';
    var i = 0, slow = opts.slow ? 1.6 : 1;
    function step() {
      if (!document.body.contains(svg)) return;
      if (i >= d.s.length) { if (hzSilent) hzSilent.pause(); if (lab) lab.innerHTML = '<b>' + d.s.length + ' strokes</b> · ' + d.n.map(esc).join('、'); if (opts.done) opts.done(); return; }
      var id = 'hzc' + Math.random().toString(36).slice(2);
      var cp = document.createElementNS(NS, 'clipPath'); cp.setAttribute('id', id);
      var pp = document.createElementNS(NS, 'path'); pp.setAttribute('d', d.s[i]); cp.appendChild(pp); g.appendChild(cp);
      var pts = d.m[i], len = 0; for (var k = 1; k < pts.length; k++) len += Math.sqrt(Math.pow(pts[k][0] - pts[k - 1][0], 2) + Math.pow(pts[k][1] - pts[k - 1][1], 2));
      var pl = document.createElementNS(NS, 'polyline');
      pl.setAttribute('points', pts.map(function (p) { return p.join(','); }).join(' '));
      pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', '#c0392b'); pl.setAttribute('stroke-width', '150'); pl.setAttribute('stroke-linecap', 'round'); pl.setAttribute('stroke-linejoin', 'round');
      pl.setAttribute('clip-path', 'url(#' + id + ')'); pl.style.strokeDasharray = (len + 150) + ' ' + (len + 150); pl.style.strokeDashoffset = (len + 150);
      g.appendChild(pl);
      if (lab) lab.innerHTML = '<span class="hz-n">' + (i + 1) + '</span> <b>' + esc(d.n[i] || '') + '</b>';
      // A stroke name such as 横折钩 has one part for each movement of the pen: 横 as it goes across, 折 at the turn
      // down, 钩 at the hook. Each part is said as the red reaches that place; the drawing waits if the voice is still speaking.
      var toks = (d.n[i] || '').split(''), at = hzSplits(pts, len, toks.length), mute = opts.sound === false;
      var total = Math.max(350 + len * 0.55, toks.length * 520) * slow, t = 0, last = null, k2 = 0, speaking = false, j = i, ended = false;
      function frame(ts) {
        if (!document.body.contains(svg) || hzTimer === 'stop') return;
        if (last == null) last = ts; var dt = ts - last; last = ts;
        var f = Math.min(1, t / total);
        if (!mute && k2 < toks.length && f >= at[k2]) {
          if (!speaking) { speaking = true; var me = k2; k2++; hzSayPart(toks[me], function () { speaking = false; }); }
        } else if (!(k2 < toks.length && f >= at[k2] && speaking)) t += dt;
        if (mute) k2 = toks.length;
        pl.style.strokeDashoffset = String((len + 150) * (1 - f));
        if (f >= 1 && k2 >= toks.length && !speaking && !ended) {
          ended = true; var o = svg.querySelector('path[data-i="' + j + '"]'); if (o) o.setAttribute('fill', '#222'); pl.setAttribute('stroke', '#222'); i++;
          hzTimer = setTimeout(step, Math.round(450 * slow)); return;
        }
        hzRaf = requestAnimationFrame(frame);
      }
      hzRaf = requestAnimationFrame(frame);
    }
    step();
  }
  function hzSpeak(t) {
    try { var s = window.speechSynthesis; if (!s || !t) return; s.cancel(); var u = new SpeechSynthesisUtterance(t); u.lang = 'zh-CN'; u.rate = 0.95; s.speak(u); } catch (e) {}
  }
  var HZSYL = { '横': 'heng2', '竖': 'shu4', '撇': 'pie3', '点': 'dian3', '捺': 'na4', '提': 'ti2', '折': 'zhe2', '钩': 'gou1', '弯': 'wan1', '斜': 'xie2', '卧': 'wo4' };
  var hzAud = null;
  // Keep the iPad's sound output awake during the drawing: a silent sound playing in a loop stops the start of
  // each spoken part from being clipped while the speaker wakes up.
  var hzSilent = null;
  function hzWarm() {
    try {
      if (!hzSilent) { hzSilent = new Audio('data:audio/wav;base64,UklGRsQPAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YaAPAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA'); hzSilent.loop = true; }
      if (hzSilent.paused) { var p = hzSilent.play(); if (p && p.catch) p.catch(function () {}); }
    } catch (e) {}
  }
  function hzSayPart(ch, done) {
    var fin = false, end = function () { if (!fin) { fin = true; done(); } };
    setTimeout(end, 2200);
    if (ziVoicePref() === 'ios' || !HZSYL[ch]) { hzWarm(); ziTTS(ch, end, true); return; }
    if (!hzAud) hzAud = new Audio();
    hzAud.onended = end; hzAud.onerror = end; hzAud.src = 'data/audio/s/' + HZSYL[ch] + '.mp3';
    var p = hzAud.play(); if (p && p.catch) p.catch(end);
  }
  function hzSayEn(t) {
    try { var s = window.speechSynthesis; if (!s || !t) return; s.cancel(); var u = new SpeechSynthesisUtterance(t); u.lang = 'en-GB'; u.rate = 0.95; s.speak(u); } catch (e) {}
  }
  // How the character is built: its 部首, its parts in colour, and why it is put together that way.
  function hzExplain(c) {
    var d = HZ[c]; if (!d) return '<p class="small muted">Loading…</p>';
    var e = d.ety || {}, cdef = d.cdef || {}, cpy = d.cpy || {}, h = '', say = '';
    var kind = { pictographic: ['象形字', 'a picture'], ideographic: ['会意字', 'ideas put together'], pictophonetic: ['形声字', 'one part for meaning, one for sound'] }[e.type];
    if (kind) h += '<div class="kicker">' + kind[0] + ' · ' + kind[1] + '</div>';
    if (e.type === 'pictophonetic') {
      h += '<p style="margin:4px 0"><b class="zi-part" style="color:' + HZCOL[0] + '">' + esc(e.semantic || '') + '</b> shows the meaning' + (e.hint ? ' — ' + esc(e.hint) : (cdef[e.semantic] ? ' — ' + esc(cdef[e.semantic]) : '')) + '.<br><b class="zi-part" style="color:' + HZCOL[1] + '">' + esc(e.phonetic || '') + '</b>' + (cpy[e.phonetic] ? ' (' + esc(cpy[e.phonetic]) + ')' : '') + ' gives the sound.</p>';
      say = (e.semantic ? 'This part shows the meaning: ' + (e.hint || cdef[e.semantic] || '') + '. ' : '') + 'The other part gives the sound.';
    } else if (e.hint) { h += '<p style="margin:4px 0">' + esc(e.hint) + '.</p>'; say = e.hint; }
    // A key to the colours: each part in its colour, with what it means.
    // Where the explanation names a part ("a hand 扌 holding a weapon 戈"), its word is used; otherwise the part's dictionary meaning.
    if (e.type !== 'pictographic' && d.parts && d.tc && d.parts.length > 1 && !d.parts.some(function (pt) { return !pt[0] || /[？?]/.test(pt[0]); })) {
      var pc = e.type === 'pictophonetic', seen = {}, hint = e.hint || '';
      h += '<p class="zi-key">' + d.parts.map(function (pt, i) {
        var nth = seen[pt[0]] = (seen[pt[0]] || 0) + 1, at = -1;
        for (var q = 0; q < nth; q++) { at = hint.indexOf(pt[0], at + 1); if (at < 0) break; }
        var hw = at > 0 ? (hint.slice(0, at).replace(/[\s\u00a0]+$/, '').match(/([A-Za-z][A-Za-z'\-]*)$/) || [])[1] : '';
        if (hw && /^(the|a|an|and|of|to|for|with|by|in|on|from|between|beside|holding|under|over|or|is|as|at|compare|see|like|toward|towards|into)$/i.test(hw)) hw = '';
        pt = [pt[0], hw ? hw.toLowerCase() : (pt[1] === 'kwukyel' ? '' : pt[1])];
        var role = pc ? (d.tc[i] === 0 ? 'meaning' : d.tc[i] === 1 ? 'sound' : '') : '';
        if (role === 'sound') pt[1] = cpy[pt[0]] || '';   // a sound part: its sound, not its meaning
        return '<span><i style="background:' + HZCOL[d.tc[i] % HZCOL.length] + '"></i><b>' + esc(pt[0]) + '</b>' + (pt[1] ? ' ' + esc(pt[1]) : '') + (role ? ' <span class="muted">(' + role + ')</span>' : '') + '</span>';
      }).join('') + '</p>';
    }
    if (d.rad && d.rad !== c) h += '<p class="small" style="margin:6px 0 0">部首 <b class="zi-part">' + esc(d.rad) + '</b>' + (d.rn ? ' · ' + esc(d.rn) : '') + (d.rdef ? ' · ' + esc(d.rdef) : '') + '</p>';
    if (d.def) h += '<p class="small muted" style="margin:4px 0 0">Means: ' + esc(d.def.split(';').slice(0, 2).join(';')) + '</p>';
    return '<div class="zi-why"><div class="zi-whypic">' + hzSVG(c, e.type === 'pictographic' ? 'plain' : 'parts', 120) + '</div><div>' + h + (say ? '<button class="btn ghost small" data-act="zi-sayen" data-v="' + esc(say) + '">🔊 Read this to me</button>' : '') + '</div></div>';
  }


  // ---------- 识字 flash cards: the character on the front; pinyin, words and the voice on the back ----------
  // Decks: cards due today (they follow the same spacing as the daily review), this week's new ones, the hard ones,
  // or a shuffle of everything she can read. "Again" brings a card back tomorrow; "Got it" moves it further out.
  function ziDeck(kind) {
    var z = ziState(), day = ziDay(), keys = Object.keys(z.r);
    if (kind === 'due') return ziDue(z.r, day);
    if (kind === 'new') return keys.filter(function (c) { return (z.r[c].b || 0) <= 2; });
    if (kind === 'hard') return keys.filter(function (c) { return z.r[c].miss; }).sort(function (a, b) { return (z.r[b].miss || 0) - (z.r[a].miss || 0); });
    return ziSample(keys, keys.length);
  }
  function ziCards() {
    var z = ziState(), F = ui.zi.fc;
    if (!F) {
      var day = ziDay(), n = { due: ziDue(z.r, day).length, new: ziDeck('new').length, hard: ziDeck('hard').length, all: Object.keys(z.r).length };
      return '<div class="card"><p style="margin:0 0 8px">Flash cards: see the character, say it, then flip the card to check.</p><ul class="list">' +
        [['due', 'Due today', 'the ones the spacing says to look at now'], ['new', 'Newest', 'learnt in the last few days'], ['hard', 'Hard ones', 'missed before'], ['all', 'Everything I can read', 'shuffled']].map(function (d) {
          return '<li><span><b>' + d[1] + '</b> <span class="small muted">· ' + n[d[0]] + ' · ' + d[2] + '</span></span><button class="btn small' + (n[d[0]] ? '' : ' ghost') + '" data-act="zi-fc" data-v="' + d[0] + '"' + (n[d[0]] ? '' : ' disabled') + '>Start</button></li>';
        }).join('') + '</ul><p class="small muted" style="margin:8px 0 0">Decks of up to 20 cards. A card you get wrong comes back at the end of the deck.</p></div>';
    }
    if (F.i >= F.q.length) return '<div class="card rd-done"><h3>Deck done!</h3><p>' + F.got + ' got it first time' + (F.again ? ', ' + F.again + ' needed another look' : '') + '.</p><div class="btns"><button class="btn" data-act="zi-fc" data-v="">Back to the decks</button></div></div>';
    var c = F.q[F.i]; ziNeed(c);
    var h = '<div class="mt-top"><button class="btn ghost small" data-act="zi-fc" data-v="">‹ Back</button></div><div class="kicker">Card ' + (F.i + 1) + ' of ' + F.q.length + '</div>' +
      '<div class="card zi-card zi-flip' + (F.shown ? ' back' : '') + '" data-act="' + (F.shown ? '' : 'zi-fcflip') + '">' + ziCharHTML(c, true);
    if (!F.shown) h += '<p class="small muted">Say it aloud, and a word with it. Then tap the card to flip it.</p></div>';
    else h += '<p class="zi-py">' + esc(Z.py[c] || '') + '</p>' + ziWordsHTML(c) + '<div class="btns" style="justify-content:center">' + ziSayBtn(c) + '</div></div>' +
      '<div class="btns" style="justify-content:center"><button class="btn" data-act="zi-fcgrade" data-v="1">Got it ✓</button><button class="btn ghost" data-act="zi-fcgrade" data-v="0">Again</button></div>';
    return h;
  }
  function ziSheet(tickId, who) {
    ZW = who === 'emily' ? 'emily' : 'emma'; ZI_TICK = tickId || (ZW === 'emma' ? 'e_zi' : 'm_zi');
    if (!ui.zi || ui.zi.who !== ZW) ui.zi = { who: ZW, view: 'today' };
    var v = ui.zi.view, body = '<div class="seg" role="group" aria-label="识字">' + [['today', 'Today'], ['cards', 'Flash cards'], ['book', 'Characters'], ['place', 'Check'], ['set', 'Mum']].map(function (o) { return '<button data-act="zi-view" data-v="' + o[0] + '" aria-pressed="' + (v === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>';
    body += v === 'cards' ? ziCards() : v === 'book' ? ziBook() : v === 'place' ? ziPlace() : v === 'set' ? ziSettings() : ziToday();
    return { title: '识字 · Chinese characters', who: ZW, body: body };
  }
  function ziAct(act, v) {
    var R = ui.zi && ui.zi.run, P = ui.zi && ui.zi.place, z = ziState();
    switch (act) {
      case 'zi-view': hzStop(); ui.zi.view = v; ui.zi.reset = false; if (v !== 'place' || (P && P.end)) ui.zi.place = null; refreshSheet(true); return;
      case 'zi-say': var sv = v.split('|'); ziSpeakChar(sv[0], sv[1]); return;
      case 'zi-voice': try { localStorage.setItem('zi-voice', v); } catch (e) {} refreshSheet(); ziSpeakChar('大'); return;
      case 'zi-fc': ui.zi.fc = v ? { q: ziDeck(v).slice(0, 20), i: 0, got: 0, again: 0, deck: v, seen: {} } : null; refreshSheet(true); return;
      case 'zi-fcflip': ui.zi.fc.shown = true; ziSpeakChar(ui.zi.fc.q[ui.zi.fc.i]); refreshSheet(); return;
      case 'zi-fcgrade':
        var FC = ui.zi.fc, fcc = FC.q[FC.i], fok = v === '1', fe = z.r[fcc];
        if (fe) { if (fok) { if (!FC.seen[fcc]) ziGrade(z.r, fcc, true); } else { ziGrade(z.r, fcc, false); fe.miss = (fe.miss || 0) + 1; } }
        if (fok && !FC.seen[fcc]) FC.got++; if (!fok) { FC.again++; if (!FC.seen[fcc]) FC.q.push(fcc); FC.seen[fcc] = 1; }
        FC.i++; FC.shown = false; save(); refreshSheet(true); return;
      case 'zi-cmp': ziCmpToggle(v); return;
      case 'zi-cmpplay': ziCmpPlay(v); return;
      case 'zi-pick': ui.zi.sel = v || null; if (v) ziSpeakChar(v); refreshSheet(); return;
      case 'zi-sayen': hzSayEn(v); return;
      case 'zi-play': var pv = v.split(':'); hzLoad(pv[0], function () { hzPlay(document.getElementById('hzbox'), pv[0], { label: document.getElementById('hzlab'), slow: pv[1] === 'slow', size: 200 }); }); return;
      case 'zi-noplace': ui.ziNoPlace = true; refreshSheet(); return;
      case 'zi-start': if (!cur()) { toast('Start a school day first'); return; } ui.zi.run = ziBuild(); hzPrefetch(ui.zi.run.q.map(function (x) { return x.c; })); if (ziVoicePref() !== 'ios') ui.zi.run.q.forEach(function (x) { ziClips(x.c).forEach(function (u) { if (typeof u === 'string') { try { fetch(u); } catch (e) {} } }); }); save(); refreshSheet(true); return;
      case 'zi-close': hzStop(); ui.zi.run = null; refreshSheet(true); return;
      case 'zi-show': R.shown = true; var it = R.q[R.i]; if (it.k === 'rr') ziSpeakChar(it.c); refreshSheet(); return;
      case 'zi-next': hzStop();
        var n = R.q[R.i]; if (n.k === 'rn') { ziGrade(z.r, n.c, true); z.rp = Math.max(z.rp, n.x + 1); } if (n.k === 'wn') { ziGrade(z.w, n.c, true); z.wp = Math.max(z.wp, n.x + 1); }
        R.i++; R.shown = false; save(); refreshSheet(true); return;
      case 'zi-grade': hzStop();
        var g = R.q[R.i], ok = v === '1'; ziGrade(g.k === 'wr' ? z.w : z.r, g.c, ok);
        if (!ok && z.r[g.c] && g.k !== 'wr') z.r[g.c].miss = (z.r[g.c].miss || 0) + 1;
        if (ok) R.got++; else { R.miss++; if (R.again.indexOf(g.c) < 0) { R.again.push(g.c); R.q.push({ k: g.k, c: g.c, again: true }); } }
        R.i++; R.shown = false; save(); refreshSheet(true); return;
      case 'zi-pstart': ui.zi.place = { si: 0, phase: 'r' }; ziPlaceSem(ui.zi.place); refreshSheet(true); return;
      case 'zi-pshow': P.shown = true; if (P.phase === 'r') ziSpeakChar(P.items[P.i]); refreshSheet(); return;
      case 'zi-pans':
        var pc = P.items[P.i];
        if (v === '1') { P.ok++; if (P.phase === 'r') { if (!z.r[pc]) z.r[pc] = { b: 4, d: ziDay() + 8 }; } else if (!z.w[pc]) z.w[pc] = { b: 4, d: ziDay() + 8 }; }
        P.i++; P.shown = false;
        if (P.i >= P.items.length) ziPlaceNext(P);
        save(); refreshSheet(true); return;
      case 'zi-pstop': if (P.phase === 'w') P.wStop = true; ziPlaceFinish(P); refreshSheet(true); return;
      case 'zi-set': var p = v.split(':'); z[p[0]] = Math.max(0, Math.min(15, (z[p[0]] || 0) + (+p[1]))); save(); refreshSheet(); return;
      case 'zi-reset':
        if (ui.zi.reset !== v) { ui.zi.reset = v; refreshSheet(); return; }
        ui.zi.reset = false; ui.zi.run = null;
        if (v === 'all') S.zi[ZW] = {}; else if (v === 'r') { z.r = {}; z.w = {}; z.rp = 0; z.wp = 0; z.placed = false; } else { z.w = {}; z.wp = 0; }
        ziState(); save(); toast(v === 'w' ? 'Writing progress cleared' : v === 'r' ? 'Reading and writing progress cleared' : '识字 progress cleared'); refreshSheet(); return;
      case 'zi-known':
        // Known already: tick it off, move the place in the list past it, and bring in the next new one instead.
        hzStop(); var kq = R.q[R.i], O2 = ziOrder(z.list), day2 = ziDay(), bag = kq.k === 'wn' ? z.w : z.r, arr = kq.k === 'wn' ? O2.w : O2.r;
        bag[kq.c] = { b: 5, d: day2 + 5 + Math.floor(Math.random() * 30) }; if (kq.k === 'wn' && !z.r[kq.c]) z.r[kq.c] = { b: 5, d: day2 + 7 };
        if (kq.k === 'rn') z.rp = Math.max(z.rp, kq.x + 1); else z.wp = Math.max(z.wp, kq.x + 1);
        var queued = {}; R.q.forEach(function (x) { if (x.k === kq.k) queued[x.c] = 1; });
        var j = kq.x + 1; while (j < arr.length && (bag[arr[j].c] || queued[arr[j].c] || (kq.k === 'wn' && !z.r[arr[j].c] && !R.q.some(function (x) { return x.k === 'rn' && x.c === arr[j].c; })))) j++;
        if (j < arr.length) R.q.splice(R.i + 1, 0, { k: kq.k, c: arr[j].c, x: j }); else if (kq.k === 'rn') R.nNew--; else R.nWrite--;
        R.skipped = (R.skipped || 0) + 1; R.i++; R.shown = false; save(); refreshSheet(true); return;
      case 'zi-tickall':
        var ta = v.split(':'), Ot = ziOrder(z.list), dayt = ziDay(), onlyW = ta[0] === 'w', sem = ta[1], all = ta[2] === '1';
        (onlyW ? Ot.w : Ot.r).forEach(function (x) {
          if (x.s !== sem) return;
          if (all) { if (onlyW) { if (!z.w[x.c]) z.w[x.c] = { b: 5, d: dayt + 5 + Math.floor(Math.random() * 40) }; if (!z.r[x.c]) z.r[x.c] = { b: 5, d: dayt + 5 + Math.floor(Math.random() * 40) }; } else if (!z.r[x.c]) z.r[x.c] = { b: 5, d: dayt + 5 + Math.floor(Math.random() * 40) }; }
          else { if (onlyW) delete z.w[x.c]; else { delete z.r[x.c]; delete z.w[x.c]; } }
        });
        save(); refreshSheet(); return;
      case 'zi-back': hzStop(); ui.zi.run = null; refreshSheet(true); return;
      case 'zi-mark': ui.zi.mark = v; refreshSheet(); return;
      case 'zi-tick':
        var tk = v.split(':'), tc = tk[1], day = ziDay(), soon = function () { return { b: 5, d: day + 5 + Math.floor(Math.random() * 30) }; };
        if (tk[0] === 'r') { if (z.r[tc]) { delete z.r[tc]; delete z.w[tc]; } else z.r[tc] = soon(); }
        else { if (z.w[tc]) delete z.w[tc]; else { z.w[tc] = soon(); if (!z.r[tc]) z.r[tc] = soon(); } }
        save(); refreshSheet(); return;
    }
  }

  function rdSheet(tickId, who) {
    RDW = who === 'emma' ? 'emma' : 'emily';
    RD_TICK = tickId || (RDW === 'emma' ? 'e_reading' : 'm_reading');
    if (ui.rdWho !== RDW) { ui.rd = null; ui.rdPlace = null; ui.rdView = 'today'; ui.rdWho = RDW; }
    var p = rdPoem(); var view = ui.rdView || 'today';
    var body = rdTabs(view);
    if (!p) body += '<p>No poems yet.</p>';
    else if (view === 'today') body += rdToday(p);
    else if (view === 'words') body += rdWordBook();
    else if (view === 'poems') body += rdPoemsView();
    else if (view === 'record') body += rdRecordView();
    else if (view === 'place') body += rdPlaceView();
    else body += rdHow();
    return { title: 'Reading lessons', who: RDW, body: body };
  }
  function rdAct(act, v, el) {
    var s = rdStep(); var p = rdLP(); var r = rdState();
    function no() { el.classList.remove('rd-no'); void el.offsetWidth; el.classList.add('rd-no'); }
    switch (act) {
      case 'rd-view': if (ui.rdView === 'place' && v !== 'place' && ui.rdPlace && (ui.rdPlace.over || ui.rdPlace.l >= ui.rdPlace.lv.length)) { rdPlaceFinish(); ui.rdPlace = null; ui.rd = null; } ui.rdView = v; ui.rdManage = false; refreshSheet(true); break;
      case 'rd-kind': rdStart(v); refreshSheet(true); break;
      case 'rd-next': rdNext(); break;
      case 'rd-ph': s.ph = v; s.x = null; ui.rdPeek = false; refreshSheet(); break;
      case 'rd-knew': if (s.again) delete r.again[s.w]; else rdMark(s.w, 'k', p); save(); rdNext(); break;
      case 'rd-peek': ui.rdPeek = true; refreshSheet(); setTimeout(function () { ui.rdPeek = false; refreshSheet(); }, 1500); break;
      case 'rd-letter':
        var X = s.x, t = X.tiles[+v]; var need = s.w.replace(/[^A-Za-z]/g, '')[X.got];
        if (t && !t.used && need && t.c === need) { t.used = true; X.got++; refreshSheet(); } else no();
        break;
      case 'rd-find': var c = s.x.cards[+v]; if (c && c.c === s.w) { c.f = true; refreshSheet(); } else no(); break;
      case 'rd-learnt': if (s.again) delete r.again[s.w]; else rdMark(s.w, 's', p); save(); rdNext(); break;
      case 'rd-col': ui.rd.col = v; if (v === 'mixed') ui.rd.mix = null; refreshSheet(); break;
      case 'rd-place':
        var Y = s.x, card = Y.tray[+v]; var slot = Y.slots.filter(function (x) { return !x.f; })[0];
        if (card && !card.used && slot && rdKey(card.t) === slot.k) { card.used = true; slot.f = true; refreshSheet(); } else no();
        break;
      case 'rd-line': s.li++; s.x = null; refreshSheet(); break;
      case 'rd-cut': s.cut = true; refreshSheet(); break;
      case 'rd-onset': var F = p.fam[s.f]; if (s.made.indexOf(v) < 0) { s.made.push(v); rdMark(v + F.rime, 'f', p); save(); } refreshSheet(); break;
      case 'rd-famdone': var d0 = cur(); r.fam[p.id + ':' + s.f] = d0 ? d0.n || 1 : 1; save(); rdNext(); break;
      case 'rd-rec': rdRecToggle(v); break;
      case 'rd-poemdone': var d1 = cur(); if (!r.done[p.id]) r.done[p.id] = { n: d1 ? d1.n : 0, d: today() }; if (r.cur != null && rdPoems()[r.cur] === p) delete r.cur; save(); rdNext(); break;
      case 'rd-finish': rdFinish(); break;
      case 'rd-stop': ui.rd.si = ui.rd.steps.length - 1; refreshSheet(true); break;
      case 'rd-go': r.cur = +v; save(); ui.rd = null; ui.rdView = 'today'; refreshSheet(true); break;
      case 'rd-again': var q = rdPoems()[+v]; ui.rd = { kind: 'poem', pid: q.id, steps: [{ t: 'reveal' }, { t: 'end' }], si: 0, learnt: [], fw: [], col: 'down', date: today() }; ui.rdView = 'today'; refreshSheet(true); break;
      case 'rd-per': r.per = +v; save(); refreshSheet(); break;
      case 'rd-againw': if (r.again[v]) delete r.again[v]; else r.again[v] = Date.now(); save(); refreshSheet(); break;
      case 'rd-knowpoem':
        if (ui.rdKnowAsk !== +v) { ui.rdKnowAsk = +v; refreshSheet(); break; }
        ui.rdKnowAsk = null; var kp = rdPoems()[+v]; rdWords(kp).forEach(function (k) { if (!r.known[k]) { var dk = cur(); r.known[k] = { n: dk ? dk.n : 0, d: today(), p: kp.id, s: 'k' }; } });
        var dd = cur(); r.done[kp.id] = { n: dd ? dd.n : 0, d: today(), known: true }; if (r.cur === +v) delete r.cur; save(); ui.rd = null; toast(kp.title + ' marked as known'); refreshSheet(); break;
      case 'rd-noplace': ui.rdNoPlace = true; refreshSheet(); break;
      case 'rd-pstart': rdPlaceStart(); refreshSheet(true); break;
      case 'rd-pans': rdPlaceAns(v === '1'); if (ui.rdPlace.over || ui.rdPlace.l >= ui.rdPlace.lv.length) rdPlaceFinish(); refreshSheet(); break;
      case 'rd-pstop': ui.rdPlace.over = true; rdPlaceFinish(); refreshSheet(true); break;
      case 'rd-pdone': rdPlaceFinish(); ui.rdPlace = null; ui.rd = null; ui.rdView = 'today'; refreshSheet(true); break;
      case 'rd-manage': ui.rdManage = !ui.rdManage; refreshSheet(); break;
      case 'rd-forget': delete r.known[v]; save(); refreshSheet(); break;
    }
  }

  // ---------- Number (Emily): Charlotte Mason arithmetic, Stephens' order with MOE add-ins (steps come from number.js) ----------
  // Mum's lesson card (Math with Mom) shows the step she is on, how to teach it, and sums to say aloud.
  // Emily's quick sums (Math practice) are short rounds of facts from the steps she has done: no hints, and a
  // wrong answer is not corrected and accepted; she simply gets a fresh question, and the missed fact comes back later.
  var NX = window.SDNumber || { steps: [], sumsFor: function () { return []; } };
  var NM_N = 10; // questions in one quick round
  function nmState(who) {
    var all = S.nm || (S.nm = {}); var m = all[who] || (all[who] = {});
    if (!m.known) m.known = {}; if (!m.log) m.log = {}; if (!m.miss) m.miss = {};
    return m;
  }
  function nmIdx(id) { for (var i = 0; i < NX.steps.length; i++) if (NX.steps[i].id === id) return i; return -1; }
  function nmCur(who) { var m = nmState(who); var i = nmIdx(m.at); return i < 0 ? null : NX.steps[i]; }
  function nmName(who) { return who.charAt(0).toUpperCase() + who.slice(1); }
  function nmYr(y) { return 'Age ' + (y + 5) + ' · P' + y; }
  function nmTag(s) {
    var t = nmYr(s.year) + ' · ' + (s.src === 'moe' ? 'MOE add-in' : s.src === 'stephens' ? 'Stephens' : (s.ref || ''));
    if (s.moe) t += ' · MOE ' + s.moe; return t;
  }
  function nmLog(who, e) { var m = nmState(who); var d = cur(); e.d = today(); e.n = d ? d.n : 0; m.log[String(Date.now())] = e; }
  function nmPeek(who) { var s = nmCur(who); return s ? 'Now: ' + s.name : 'Choose where to start'; }
  function nmQPeek(who) { return nmPool(who).length ? NM_N + ' quick sums' : 'Starts after the first number lessons'; }

  // Steps whose facts she may be asked: every step before the current one (done or known), and the current one.
  function nmPool(who) {
    var m = nmState(who); var i = nmIdx(m.at); if (i < 0) return [];
    return NX.steps.slice(0, i + 1).filter(function (s) { return !!s.facts; });
  }
  function nmFact(who) {
    var m = nmState(who); var pool = nmPool(who); var cs = nmCur(who);
    var keys = Object.keys(m.miss).filter(function (k) { return k[0] !== '=' && m.miss[k] > 0; });
    if (keys.length && Math.random() < 0.3) { var k = keys[Math.floor(Math.random() * keys.length)]; if (m.miss['=' + k] != null) return [k, m.miss['=' + k]]; }
    // Half the round from the step she is on (if it has facts), the rest from earlier steps.
    var s = (cs && cs.facts && (Math.random() < 0.5 || pool.length === 1)) ? cs : pool[Math.floor(Math.random() * pool.length)];
    return s.facts();
  }

  // ---------- Mum's lesson card ----------
  function nmSheet(tickId, who) {
    who = who || 'emily'; ui.nm = ui.nm || {}; var m = nmState(who); var v = ui.nm.view || 'now';
    var tabs = '<div class="seg" role="group" aria-label="Number">' + [['now', 'Lesson'], ['steps', 'All steps'], ['kit', 'Supplies'], ['scope', 'Scope'], ['record', 'Record']].map(function (o) { return '<button data-act="nm-view" data-v="' + o[0] + '" aria-pressed="' + (v === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>';
    var body;
    if (!nmCur(who)) body = (v === 'scope' ? '<div class="btns"><button class="btn ghost small" data-act="nm-view" data-v="now">Back to choosing where to start</button></div>' + nmScopeView(who) : nmPlaceView(who) + '<div class="btns"><button class="btn ghost small" data-act="nm-view" data-v="scope">See the scope and sequence</button></div>');
    else body = tabs + (v === 'steps' ? nmStepsView(who) : v === 'kit' ? nmKitView(who) : v === 'scope' ? nmScopeView(who) : v === 'record' ? nmRecordView(who) : nmLessonView(tickId, who));
    body += '<details class="nm-about"><summary class="small muted">About the sources</summary>' + '<p class="small muted">Order and method: ' + esc(NX.source || '') + '. Later steps come from Ray\'s Practical Arithmetic (and Ray\'s New Practical for the fraction exercises), with mental arithmetic from Ray\'s New Intellectual Arithmetic, Hall & Stevens\' Lessons in Experimental and Practical Geometry and Hall & Knight\'s Elementary Algebra; each lesson names its book. Steps marked "MOE add-in" bring in topics MOE\'s 2021 Primary Mathematics Syllabus asks for that the books don\'t cover, taught the same hands-on way.</p>' + '</details>';
    return { title: 'Number · ' + nmName(who), who: who, body: body };
  }
  // Supplies: what each year's lessons use, ticked off as Mum gets them. Shared by both girls.
  function nmHave() { if (!S.nmHave) S.nmHave = { protractor: 1, setsq: 1, compass: 1 }; return S.nmHave; }
  function nmKitView(who) {
    var have = nmHave(), s = nmCur(who), cy = s ? s.year : 1, names = {}; NX.steps.forEach(function (x) { names[x.id] = x.name; });
    var need = []; (NX.supplies || []).forEach(function (g) { if (g.year >= cy) g.items.forEach(function (it) { if (!have[it.id]) need.push(it.name); }); });
    var h = '<div class="card"><p class="small" style="margin:0">Things the lessons use, by the year they first come up. Tick what you have; it counts for both girls. ' +
      (need.length ? 'Still to get for ' + esc(nmName(who)) + '\'s remaining years: <b>' + need.length + '</b>.' : 'You have everything for ' + esc(nmName(who)) + '\'s remaining years.') + '</p></div>';
    (NX.supplies || []).forEach(function (g) {
      h += '<div class="card"><div class="kicker">' + esc(nmYr(g.year)) + (g.year === cy ? ' · ' + esc(nmName(who)) + ' is here' : g.year < cy ? ' · done' : '') + '</div><ul class="nm-kit">' +
        g.items.map(function (it) { var on = !!have[it.id]; var used = it.steps.filter(function (id) { return names[id]; }).map(function (id) { return names[id]; });
          return '<li><button class="nm-kitbox" data-act="nm-have" data-v="' + it.id + '" aria-pressed="' + on + '">' + (on ? '✓' : '') + '</button><div><div>' + esc(it.name) + (it.buy && !on ? ' <span class="small muted">· to buy</span>' : '') + '</div><div class="small muted">Used in: ' + esc(used.slice(0, 4).join(', ')) + (used.length > 4 ? ' and more' : '') + '</div></div></li>'; }).join('') + '</ul></div>';
    });
    return h;
  }
  // Placement: Mum asks a few sums from each step in turn; the first step she cannot yet do is where lessons start.
  function nmPlaceView(who) {
    if (!ui.nm.placeYr) return '<div class="card"><div class="kicker">Getting started</div><h3>Where is ' + esc(nmName(who)) + ' in maths now?</h3>' +
      '<p class="small muted" style="margin:0 0 10px">Pick the level she is working at. You will then ask her a few sums from the start of that level; the first thing she cannot yet do is where her lessons begin.</p><div class="nm-lvls">' +
      [1, 2, 3, 4, 5, 6].map(function (y) { return '<button class="btn ghost" data-act="nm-place-yr" data-v="' + y + '">' + esc(nmYr(y)) + '</button>'; }).join('') + '</div></div>';
    var i = ui.nm.placeI || 0; var s = NX.steps[i];
    if (!s) { return '<div class="card"><p>She knows every step here.</p></div>'; }
    var sums = ui.nm.placeSums && ui.nm.placeSums.id === s.id ? ui.nm.placeSums.list : (ui.nm.placeSums = { id: s.id, list: (NX.sumsFor(s).length ? NX.sumsFor(s) : (s.book ? s.book.items.filter(function (x) { return x[1] !== ''; }) : [])).slice(0, 4) }).list;
    return '<div class="card"><div class="kicker">Where to start · step ' + (i + 1) + ' of ' + NX.steps.length + '</div><h3>' + esc(s.name) + '</h3>' +
      '<p class="small muted" style="margin:0 0 8px">' + esc(nmTag(s)) + '. Ask her these (aloud, or on paper for written sums). If she answers them all readily, go on to the next step. The first step she can\'t yet do is where her lessons begin.</p>' +
      (sums.length ? '<ol class="nm-sums">' + sums.map(function (x) { return '<li>' + esc(x[0]) + ' <b class="nm-ans">' + esc(String(x[1])) + '</b></li>'; }).join('') + '</ol>' : '<p class="small">' + esc(s.how[0]) + '</p>') +
      '<div class="btns"><button class="btn" data-act="nm-place" data-v="knows">She knows this</button><button class="btn ghost" data-act="nm-place" data-v="start">Start here</button>' + (i ? '<button class="btn ghost small" data-act="nm-place" data-v="back">Back</button>' : '') + '</div>' +
      '<p class="small muted" style="margin:10px 0 0"><button class="linkbtn" data-act="nm-place-lvl">Choose a different level</button></p></div>';
  }
  // Open-and-go lesson: one difficulty, four timed parts, answers hidden until asked for.
  function nmPlanView(tickId, who, s) {
    var m = nmState(who), i = nmIdx(s.id), li = Math.min(((m.li || {})[s.id]) || 0, s.plan.length - 1), L = s.plan[li];
    function item(x) { if ((x[0] === 'book' || x[0] === 'oral') && typeof x[1] === 'number') { var src = x[0] === 'book' ? s.book : s.oral; return src.items[x[1]]; } return x; }
    var show = ui.nm.ans === s.id + ':' + li;
    function list(xs, open) { return '<ol class="nm-sums">' + xs.map(function (x) { var it = item(x); return '<li>' + esc(it[0]) + (it[1] !== '' ? ' <b class="nm-ans' + (show || open ? '' : ' nm-hide') + '">' + esc(String(it[1])) + '</b>' : '') + '</li>'; }).join('') + '</ol>'; }
    var srcs = []; L.slate.forEach(function (x) { var r = x[0] === 'book' ? s.book.ref : x[0] === 'oral' ? s.oral.ref : ''; if (r && srcs.indexOf(r) < 0) srcs.push(r); });
    var last = li === s.plan.length - 1, nxt = NX.steps[i + 1];
    var h = '<div class="card nm-plan"><div class="kicker">' + esc(nmYr(s.year)) + ' · ' + esc(s.name) + '</div>' +
      '<h3>Lesson ' + (li + 1) + ' of ' + s.plan.length + ': ' + esc(L.title) + '</h3>' +
      '<p class="small muted" style="margin:0">About 20 minutes · Have ready: ' + esc(L.ready) + '</p></div>' +
      '<div class="card nm-sec"><div class="nm-ph"><span>1</span>Warm-up <em>3 min · aloud</em></div>' + list(L.warm, true) + '</div>' +
      '<div class="card nm-sec"><div class="nm-ph"><span>2</span>The new idea <em>7 min</em></div><ul class="nm-idea">' +
      L.idea.map(function (x) { return '<li><b>' + (x[0] === 'do' ? 'Do' : x[0] === 'say' ? 'Say' : 'Ask') + '</b> ' + esc(x[1]) + (x[2] ? '<div class="small muted">She should find: ' + esc(x[2]) + '</div>' : '') + '</li>'; }).join('') + '</ul></div>' +
      '<div class="card nm-sec"><div class="nm-ph"><span>3</span>On her slate <em>8 min</em></div>' + list(L.slate) +
      '<p class="small muted" style="margin:4px 0 8px">From ' + esc(srcs.join('; ')) + '. A sum is right or wrong: if wrong, she does not rework it; give her the next one.</p>' +
      '<div class="btns"><button class="btn ghost small" data-act="nm-ans" data-v="' + s.id + ':' + li + '">' + (show ? 'Hide answers' : 'Show answers') + '</button></div></div>' +
      '<div class="card nm-sec"><div class="nm-ph"><span>4</span>Tell back <em>2 min</em></div><p style="margin:0">' + esc(L.tell) + '</p></div>' +
      '<div class="card"><div class="btns">' + tickButton(tickId, 'Lesson done', 'Lesson done today') +
      (!last ? '<button class="btn ghost" data-act="nm-li" data-v="1">Next lesson</button>' : nxt ? '<button class="btn ghost" data-act="nm-next">She has it: on to ' + esc(nxt.name) + '</button>' : '') +
      (li > 0 ? '<button class="btn ghost small" data-act="nm-li" data-v="-1">Back a lesson</button>' : '') + '</div>' +
      '<p class="small muted" style="margin:8px 0 0">Not sure yet? Do the same lesson again tomorrow with the next exercises under "More practice".</p></div>';
    return h;
  }
  function nmLessonView(tickId, who) {
    var m = nmState(who); var s = nmCur(who); var i = nmIdx(s.id);
    if (s.plan && !ui.nm.more) return nmPlanView(tickId, who, s) + '<div class="btns"><button class="btn ghost small" data-act="nm-more">More practice and step notes</button></div>';
    if (!ui.nm.sums || ui.nm.sums.id !== s.id) ui.nm.sums = { id: s.id, list: NX.sumsFor(s) };
    var sums = ui.nm.sums.list;
    var h = (s.plan ? '<div class="btns"><button class="btn ghost small" data-act="nm-more">Back to today\'s lesson</button></div>' : '') + '<div class="card"><div class="kicker">' + esc(nmTag(s)) + ' · step ' + (i + 1) + ' of ' + NX.steps.length + '</div><h3>' + esc(s.name) + '</h3>' +
      '<p class="small" style="margin:0 0 6px"><b>Things to hand:</b> ' + esc(s.objects) + '</p>' +
      (NX.steps[i + 1] ? '<p class="small muted" style="margin:0 0 6px"><b>Coming up:</b> ' + NX.steps.slice(i + 1, i + 3).map(function (x) { return esc(x.name) + ' (' + esc(x.objects) + ')'; }).join('; ') + '</p>' : '') +
      '<ul class="nm-how">' + s.how.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      (s.adapt ? '<p class="small muted" style="margin:6px 0 0">' + esc(s.adapt) + '</p>' : '') + '</div>';
    function nmBookCard(bk, key, act, kick, note) {
      var bp = (m.bp || (m.bp = {}))[key] || 0; var bi = bk.items.slice(bp, bp + 5);
      return '<div class="card"><div class="kicker">' + kick + esc(bk.ref) + '</div><p class="small muted" style="margin:0 0 6px">' + note + 'Exercises ' + (bp + 1) + '–' + (bp + bi.length) + ' of ' + bk.items.length + ', in the book\'s order.' + (bi.some(function (x) { return x[1] !== ''; }) ? ' Answers are in bold for you.' : '') + '</p>' +
        '<ol class="nm-sums" start="' + (bp + 1) + '">' + bi.map(function (x) { return '<li>' + esc(x[0]) + (x[1] !== '' ? ' <b class="nm-ans">' + esc(String(x[1])) + '</b>' : '') + '</li>'; }).join('') + '</ol>' +
        '<div class="btns"><button class="btn ghost small" data-act="' + act + '">' + (bp + 5 >= bk.items.length ? 'Back to the first exercises' : 'Next exercises') + '</button></div></div>';
    }
    if (s.book) h += nmBookCard(s.book, s.id, 'nm-book', 'From the book · ', '');
    if (s.oral) h += nmBookCard(s.oral, s.id + ':oral', 'nm-oral', 'Mental arithmetic · ', 'Said aloud, no slate: she works it in her head and tells you how. ');
    if (sums.length) h += '<div class="card"><div class="kicker">' + (s.book ? 'More sums (made by the app)' : 'Sums to say aloud') + '</div><p class="small muted" style="margin:0 0 6px">One step at a time, with things in her hands first and then without. Answers are in bold for you.</p>' +
      '<ol class="nm-sums">' + sums.map(function (x) { return '<li>' + esc(x[0]) + ' <b class="nm-ans">' + esc(String(x[1])) + '</b></li>'; }).join('') + '</ol>' +
      '<div class="btns"><button class="btn ghost small" data-act="nm-new">New sums</button></div></div>';
    h += '<div class="card"><p class="small muted" style="margin:0 0 8px">About 20 minutes, then something restful. A step can take several days; move on when she does it easily (for the early steps, without the things in her hands).</p><div class="btns">' +
      tickButton(tickId, 'Lesson done', 'Lesson done today') +
      (i < NX.steps.length - 1 ? '<button class="btn ghost" data-act="nm-next">She has it: next step</button>' : '') +
      (i > 0 ? '<button class="btn ghost small" data-act="nm-prev">Back a step</button>' : '') + '</div></div>';
    return h;
  }
  function nmStepsView(who) {
    var m = nmState(who); var ci = nmIdx(m.at); var yr = 0;
    var h = '<div class="card"><p class="small muted" style="margin:0 0 8px">Tap a step to make it the current lesson.</p><ul class="list nm-list">';
    NX.steps.forEach(function (s, i) {
      if (s.year !== yr) { yr = s.year; h += '<li class="nm-yr">' + nmYr(yr) + '</li>'; }
      var mark = i < ci ? '✓' : i === ci ? '▶' : '';
      h += '<li><button class="nm-step' + (i === ci ? ' on' : '') + '" data-act="nm-go" data-v="' + i + '"><span class="nm-mk">' + mark + '</span> ' + esc(s.name) + (s.src === 'moe' ? ' <span class="small muted">MOE add-in</span>' : '') + (m.known[s.id] ? ' <span class="small muted">' + esc(m.known[s.id]) + '</span>' : '') + '</button></li>';
    });
    h += '</ul></div><div class="btns"><button class="btn ghost small" data-act="nm-replace">Choose where to start again</button></div>';
    return h;
  }

  // Scope and sequence: every MOE topic P1–P6 by age, whether a CM lesson, an MOE add-in, trainer practice or nothing yet covers it,
  // and how far she has got with the lessons that do.
  // Progress from the maths trainer: done when every trainer topic for it is mastered, started once any has been practised.
  function nmMtProg(who, t) {
    if (!t.mt || !t.mt.length) return '';
    var rec = ((S.mt || {})[who] || {}).topics || {};
    if (t.mt.every(function (id) { return rec[id] && rec[id].m; })) return 'done';
    return t.mt.some(function (id) { return !!rec[id]; }) ? 'now' : '';
  }
  function nmScopeInfo(who, t) {
    var m = nmState(who); var ci = nmIdx(m.at);
    if (t.steps.length) {
      var idx = t.steps.map(nmIdx); var srcs = t.steps.map(function (id) { return NX.steps[nmIdx(id)].src; });
      var cm = srcs.some(function (x) { return x !== 'moe'; }), add = srcs.indexOf('moe') >= 0 || t.steps.some(function (id) { var s = NX.steps[nmIdx(id)]; return !!(s.adapt && s.moe); });
      var done = ci >= 0 && idx.every(function (i) { return i < ci; }), started = ci >= 0 && idx.some(function (i) { return i <= ci; });
      var mp = nmMtProg(who, t);
      return { kind: cm ? 'cm' : 'add', label: cm ? (add ? 'CM lesson + MOE add-in' : 'CM lesson') : 'MOE add-in lesson', prog: done || mp === 'done' ? 'done' : started || mp === 'now' ? 'now' : '' };
    }
    if (t.mt && t.mt.length) return { kind: 'prac', label: 'Trainer practice only', prog: nmMtProg(who, t) };
    return { kind: 'gap', label: 'Not built yet', prog: '' };
  }
  function nmScopeView(who) {
    var SC = NX.scope || []; var n = { cm: 0, add: 0, prac: 0, gap: 0 }, part = 0, done = 0;
    SC.forEach(function (t) { var i = nmScopeInfo(who, t); n[i.kind]++; if (t.part) part++; if (i.prog === 'done') done++; });
    var h = '<div class="card"><div class="kicker">MOE P1–P6 · ' + SC.length + ' topics</div>' +
      '<div class="nm-legend"><span><i class="nm-dot cm"></i>CM lesson ' + n.cm + '</span><span><i class="nm-dot add"></i>MOE add-in lesson ' + n.add + '</span><span><i class="nm-dot prac"></i>Trainer practice only ' + n.prac + '</span><span><i class="nm-dot gap"></i>Not built yet ' + n.gap + '</span></div>' +
      '<p class="small muted" style="margin:6px 0 0">◐ = lessons cover only part of the topic (' + part + '). ✓ = ' + nmName(who) + ' has finished it (' + done + '); ▶ = she is working on it. Ticks come from her number lessons and her maths trainer. P1 content at 6, P6 content by 11, PSLE at 12.</p></div>';
    var age = -1;
    SC.forEach(function (t) {
      if (t.age !== age) {
        if (age >= 0) h += '</ul></div>';
        age = t.age; h += '<div class="card"><div class="kicker">Age ' + age + ' · P' + t.lv + ' content</div><ul class="list nm-scope">';
      }
      var i = nmScopeInfo(who, t);
      h += '<li><i class="nm-dot ' + i.kind + '" title="' + esc(i.label) + '"></i><div class="nm-sc-main"><div><b>' + esc(t.name) + '</b>' + (t.part ? ' <span class="nm-part" title="Partly covered">◐</span>' : '') +
        (i.prog === 'done' ? ' <span class="nm-prog">✓</span>' : i.prog === 'now' ? ' <span class="nm-prog">▶</span>' : '') + '</div>' +
        '<div class="small muted">' + esc(t.strand) + ' · ' + esc(i.label) + (i.kind === 'prac' || i.kind === 'gap' ? (t.plan ? ' · planned: ' + esc(t.plan) : '') : '') + '</div>' +
        (t.part ? '<div class="small nm-partnote">' + esc(t.part) + '</div>' : '') + '</div></li>';
    });
    if (age >= 0) h += '</ul></div>';
    h += '<div class="card"><div class="kicker">Age 12 · P6</div><p class="small" style="margin:0">No new syllabus content: heuristics and PSLE-style problems, Mason\'s Form III geometry and beginning algebra, and revision, with full revision from July.</p></div>';
    return h;
  }
  function nmRecordView(who) {
    var m = nmState(who); var ts = Object.keys(m.log).sort().reverse();
    if (!ts.length) return '<div class="card"><p class="small muted" style="margin:0">Nothing yet. Lessons, steps finished and quick-sum rounds will be listed here.</p></div>';
    return '<div class="card"><ul class="list">' + ts.slice(0, 60).map(function (t) {
      var e = m.log[t]; var s = NX.steps[nmIdx(e.step)];
      var what = e.k === 'quick' ? 'Quick sums: ' + e.score + ' of ' + e.of + ' right first time' : e.k === 'step' ? 'Finished: ' + (s ? s.name : e.step) : e.k === 'place' ? 'Started at: ' + (s ? s.name : e.step) : 'Lesson: ' + (s ? s.name : e.step);
      return '<li><span class="small muted">' + esc(e.d) + '</span> · ' + esc(what) + '</li>';
    }).join('') + '</ul></div>';
  }

  // ---------- Emily's quick sums ----------
  function nqSheet(tickId, who) {
    who = who || 'emily'; ui.nq = ui.nq || {}; var R = ui.nq.run;
    var body;
    if (!nmPool(who).length) body = '<div class="card"><p style="margin:0">Your quick sums will be here once you and Mum have started your number lessons.</p></div>';
    else if (!R) body = '<div class="rd-stage"><p style="margin:0">' + NM_N + ' quick sums. Say each answer in your head, then type it.</p><div class="btns rd-go"><button class="btn" data-act="nq-start">Start</button></div></div>';
    else if (R.i >= R.qs.length) {
      body = '<div class="rd-stage rd-done"><div class="rd-big">' + R.ok + ' of ' + R.qs.length + '</div><p style="margin:0">' + (R.ok === R.qs.length ? 'Every one right first time!' : 'right first time. The ones you missed will come again another day.') + '</p>' +
        (doneToday(tickId) ? '<p class="small muted" style="margin:0">Math practice is ticked for today.</p>' : '') +
        '<div class="btns rd-go"><button class="btn ghost" data-act="nq-start">Another round</button></div></div>';
    } else {
      var q = R.qs[R.i];
      body = '<div class="rd-stage"><div class="small muted">Sum ' + (R.i + 1) + ' of ' + R.qs.length + '</div><div class="rd-big nm-q">' + esc(q[0]) + '</div>' +
        '<div class="rd-big peek" id="nq-typed">' + (esc(R.typed) || '&nbsp;') + '</div>' +
        (R.msg ? '<p class="small" style="margin:0;text-align:center">' + esc(R.msg) + '</p>' : '') +
        mtKeypad(['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'], 'nq-key') + '</div>';
    }
    return { title: 'Quick sums', who: who, body: body };
  }
  function nqStart(who) {
    var qs = []; for (var k = 0; k < NM_N; k++) qs.push(nmFact(who));
    ui.nq = { run: { who: who, qs: qs, i: 0, ok: 0, typed: '', msg: null } };
  }
  function nqKey(v) {
    var R = ui.nq && ui.nq.run; if (!R || R.i >= R.qs.length) return;
    if (v === '⌫') { R.typed = R.typed.slice(0, -1); refreshSheet(); return; }
    if (v !== '✓') { if (R.typed.length < 5) R.typed += v; R.msg = null; refreshSheet(); return; }
    if (!R.typed) return;
    var q = R.qs[R.i]; var m = nmState(R.who);
    if (String(+R.typed) === String(q[1])) {
      R.ok++; R.msg = null;
      if (m.miss[q[0]]) { m.miss[q[0]]--; if (m.miss[q[0]] <= 0) { delete m.miss[q[0]]; delete m.miss['=' + q[0]]; } }
    } else {
      // Not corrected and accepted: she moves on to a fresh sum, and this one comes back in a later round.
      m.miss[q[0]] = (m.miss[q[0]] || 0) + 2; m.miss['=' + q[0]] = q[1]; R.msg = 'Not that one. Here is a new sum.';
    }
    R.i++; R.typed = '';
    if (R.i >= R.qs.length) {
      nmLog(R.who, { k: 'quick', step: nmState(R.who).at, score: R.ok, of: R.qs.length });
      if (ui.sheetArg && ui.sheetArg.tick && !doneToday(ui.sheetArg.tick)) addToday(ui.sheetArg.tick);
      render();
    }
    save(); refreshSheet(true);
  }

  function nmAct(act, v, el) {
    var who = (ui.sheet || '').split(':')[1] || 'emily'; ui.nm = ui.nm || {}; var m = nmState(who);
    switch (act) {
      case 'nm-view': ui.nm.view = v; refreshSheet(true); break;
      case 'nm-have': var hv = nmHave(); if (hv[v]) delete hv[v]; else hv[v] = 1; save(); refreshSheet(); break;
      case 'nm-new': ui.nm.sums = null; refreshSheet(); break;
      case 'nm-ans': ui.nm.ans = ui.nm.ans === v ? '' : v; refreshSheet(); break;
      case 'nm-more': ui.nm.more = !ui.nm.more; refreshSheet(true); break;
      case 'nm-li': var ls = nmCur(who); if (ls && ls.plan) { m.li = m.li || {}; m.li[ls.id] = Math.max(0, Math.min(ls.plan.length - 1, (m.li[ls.id] || 0) + (+v))); ui.nm.ans = ''; nmLog(who, { k: 'lesson', step: ls.id, li: m.li[ls.id] }); save(); refreshSheet(true); } break;
      case 'nm-book': var bs = nmCur(who); if (bs && bs.book) { m.bp = m.bp || {}; var nb = (m.bp[bs.id] || 0) + 5; m.bp[bs.id] = nb >= bs.book.items.length ? 0 : nb; save(); refreshSheet(); } break;
      case 'nm-oral': var os = nmCur(who); if (os && os.oral) { m.bp = m.bp || {}; var ok = os.id + ':oral', no = (m.bp[ok] || 0) + 5; m.bp[ok] = no >= os.oral.items.length ? 0 : no; save(); refreshSheet(); } break;
      case 'nm-place-lvl': ui.nm.placeYr = 0; refreshSheet(true); break;
      case 'nm-place-yr': ui.nm.placeYr = +v; var yi = 0; while (yi < NX.steps.length && NX.steps[yi].year < +v) { m.known[NX.steps[yi].id] = 'knew it ' + today(); yi++; } ui.nm.placeI = yi; ui.nm.placeSums = null; save(); refreshSheet(true); break;
      case 'nm-place':
        var pi = ui.nm.placeI || 0;
        if (v === 'back') { ui.nm.placeI = Math.max(0, pi - 1); ui.nm.placeSums = null; refreshSheet(true); break; }
        if (v === 'knows') { m.known[NX.steps[pi].id] = 'knew it ' + today(); ui.nm.placeI = pi + 1; ui.nm.placeSums = null; if (ui.nm.placeI < NX.steps.length) { save(); refreshSheet(true); break; } pi = NX.steps.length - 1; }
        m.at = NX.steps[pi].id; nmLog(who, { k: 'place', step: m.at }); ui.nm.placeI = 0; ui.nm.view = 'now'; save(); refreshSheet(true); render(); break;
      case 'nm-next': var ni = nmIdx(m.at); nmLog(who, { k: 'step', step: m.at }); m.known[m.at] = 'done ' + today(); m.at = NX.steps[Math.min(NX.steps.length - 1, ni + 1)].id; ui.nm.sums = null; save(); toast('Next step: ' + nmCur(who).name); refreshSheet(true); render(); break;
      case 'nm-prev': m.at = NX.steps[Math.max(0, nmIdx(m.at) - 1)].id; ui.nm.sums = null; save(); refreshSheet(true); render(); break;
      case 'nm-go': m.at = NX.steps[+v].id; ui.nm.sums = null; ui.nm.view = 'now'; save(); refreshSheet(true); render(); break;
      case 'nm-replace': delete m.at; ui.nm.placeYr = 0; ui.nm.placeI = 0; ui.nm.placeSums = null; save(); refreshSheet(true); render(); break;
      case 'nq-start': nqStart(who); refreshSheet(true); break;
      case 'nq-key': nqKey(v); break;
    }
  }

  // ---------- Maths: facts trainer, daily practice by syllabus topic, PSLE heuristics (questions come from math.js) ----------
  var MX = window.SDMath || { topics: [], heuristics: [], facts: [] };
  var MT_WHO = 'emma', MT_TICK = 'e_mathtr';
  function mtWhoName() { return MT_WHO.charAt(0).toUpperCase() + MT_WHO.slice(1); }
  function mtState() {
    var all = S.mt || (S.mt = {}); var m = all[MT_WHO] || (all[MT_WHO] = {});
    if (!m.facts) m.facts = { best: {}, miss: {} }; if (!m.facts.best) m.facts.best = {}; if (!m.facts.miss) m.facts.miss = {};
    if (!m.topics) m.topics = {}; if (!m.heur) m.heur = {}; if (!m.log) m.log = {}; if (!m.place) m.place = {};
    return m;
  }
  function mtTopic(id) { for (var i = 0; i < MX.topics.length; i++) if (MX.topics[i].id === id) return MX.topics[i]; return null; }
  function mtHeur(id) { for (var i = 0; i < MX.heuristics.length; i++) if (MX.heuristics[i].id === id) return MX.heuristics[i]; return null; }
  function mtRec(kind, id) { var m = mtState(); var bag = kind === 'h' ? m.heur : m.topics; var r = bag[id] || (bag[id] = { h: [], m: false }); if (!r.h) r.h = []; if (kind === 'h') { if (!r.lv) r.lv = 1; if (r.st == null) r.st = 0; if (r.miss == null) r.miss = 0; } return r; }
  var MT_UP = 3; // right first time, unaided, this many times in a row to move on
  function mtMastered(id) { return !!(mtState().topics[id] || {}).m; }
  // A topic is mastered after three right in a row; two wrong in a row on a mastered topic sends it back to learning.
  // A heuristic moves up a level after three right in a row (first try, no help); after level 3 it is mastered.
  // Three misses in a row above level 1 steps it back down a level, so the practice fits her again.
  // Returns what changed: 'mastered', 'up', 'down' or ''.
  function mtScore(kind, id, ok, lv) {
    var r = mtRec(kind, id); r.h.push(ok ? 1 : 0); if (r.h.length > 12) r.h = r.h.slice(-12); r.seen = today();
    if (kind === 't') {
      var was = r.m; var last = r.h.slice(-MT_UP); if (last.length === MT_UP && last.every(function (x) { return x; })) r.m = true;
      var two = r.h.slice(-2); if (was && two.length === 2 && !two[0] && !two[1]) r.m = false;
      return !was && r.m ? 'mastered' : '';
    }
    if (lv && lv !== r.lv) return ''; // a problem made before she changed level does not count
    if (ok) { r.miss = 0; r.st++; if (r.st >= MT_UP) { r.st = 0; if (r.lv < 3) { r.lv++; return 'up'; } if (!r.m) { r.m = true; return 'mastered'; } } return ''; }
    r.st = 0; r.miss++; if (r.miss >= 3 && r.lv > 1 && !r.m) { r.lv--; r.miss = 0; return 'down'; } return '';
  }
  function mtAcc(r) { if (!r || !r.h.length) return null; return Math.round(100 * r.h.reduce(function (s, x) { return s + x; }, 0) / r.h.length); }
  function mtLearning() { return MX.topics.filter(function (t) { return !mtMastered(t.id); }); }
  function mtMake(kind, id) {
    if (kind !== 'h') return { kind: kind, id: id, Q: mtTopic(id).gen() };
    var r = mtRec('h', id); var Q = mtHeur(id).gen(r.lv, r.last); r.last = Q.tpl; return { kind: 'h', id: id, lv: r.lv, Q: Q };
  }

  // The daily set: the next two topics still to master, a little review, and two heuristics problems.
  function mtTodaySet() {
    var m = mtState(); var items = [];
    var learn = mtLearning().slice(0, 2);
    var mastered = MX.topics.filter(function (t) { return mtMastered(t.id); }).sort(function (a, b) { return String((m.topics[a.id] || {}).seen || '') < String((m.topics[b.id] || {}).seen || '') ? -1 : 1; });
    var nLearn = mastered.length ? 6 : 8;
    for (var i = 0; i < nLearn && learn.length; i++) items.push(mtMake('t', learn[i % learn.length].id));
    mastered.slice(0, 2).forEach(function (t) { items.push(mtMake('t', t.id)); });
    // Two heuristics: methods not yet mastered first, the one practised longest ago first.
    var hs = MX.heuristics.slice().sort(function (a, b) { var ra = m.heur[a.id] || {}, rb = m.heur[b.id] || {}; if (!!ra.m !== !!rb.m) return ra.m ? 1 : -1; var sa = String(ra.seen || ''), sb = String(rb.seen || ''); return sa < sb ? -1 : sa > sb ? 1 : (ra.h || []).length - (rb.h || []).length; });
    hs.slice(0, 2).forEach(function (h) { items.push(mtMake('h', h.id)); });
    return items;
  }
  // After each answer: a level change or a newly mastered topic means no more practice of the same thing in this set.
  function mtAdapt(R) {
    var it = R.items[R.i]; var chg = R.fb && R.fb.chg; R.chg = null;
    if (chg && chg !== 'down') { R.ups = R.ups || []; R.ups.push(it.kind === 'h' ? mtHeur(it.id).name + (chg === 'up' ? ': up to level ' + mtRec('h', it.id).lv : ': mastered') : 'P' + mtTopic(it.id).lv + ' ' + mtTopic(it.id).name + ': mastered'); }
    if (R.kind === 'heur') {
      if (chg === 'up' || chg === 'mastered') { R.items = R.items.slice(0, R.i + 1); return; }
      if (R.i + 1 >= R.items.length && R.items.length < MT_HMAX) { R.items.push(mtMake('h', it.id)); return; }
      if (chg === 'down') R.items = R.items.slice(0, R.i + 1).concat(R.items.slice(R.i + 1).map(function () { return mtMake('h', it.id); }));
      return;
    }
    if (it.kind === 't' && chg === 'mastered' && R.kind !== 'place') {
      if (R.kind === 'topic') { R.items = R.items.slice(0, R.i + 1); return; }
      var inSet = {}; R.items.forEach(function (x) { inSet[x.id] = 1; });
      var nxt = mtLearning().filter(function (t) { return !inSet[t.id]; })[0] || mtLearning().filter(function (t) { return t.id !== it.id; })[0];
      for (var j = R.i + 1; j < R.items.length; j++) if (R.items[j].kind === 't' && R.items[j].id === it.id) R.items[j] = nxt ? mtMake('t', nxt.id) : null;
      R.items = R.items.filter(function (x) { return x; });
    }
    if (it.kind === 'h' && chg) for (var k = R.i + 1; k < R.items.length; k++) if (R.items[k].kind === 'h' && R.items[k].id === it.id) R.items[k] = mtMake('h', it.id);
  }
  function mtStartSet(kind, items, label) { ui.mt = ui.mt || {}; ui.mt.run = { kind: kind, label: label, items: items, n0: items.length, i: 0, typed: '', res: [], fb: null }; }
  function mtPlaceItems(lv) { return MX.topics.filter(function (t) { return t.lv === lv; }).map(function (t) { return mtMake('t', t.id); }); }

  // ---------- facts rounds ----------
  var mtTimer = null;
  function mtFactMode(id) { for (var i = 0; i < MX.facts.length; i++) if (MX.facts[i].id === id) return MX.facts[i]; return MX.facts[0]; }
  function mtNextFact(R) {
    var miss = mtState().facts.miss; var sym = mtFactMode(R.mode).sym; var keys = Object.keys(miss).filter(function (k) { return k[0] !== '=' && miss[k] > 0 && (R.mode === 'mix' || k.indexOf(sym) >= 0); });
    var q;
    if (keys.length && Math.random() < 0.3) { var k = keys[Math.floor(Math.random() * keys.length)]; q = [k, miss['=' + k]]; if (q[1] == null) q = null; }
    if (!q) q = mtFactMode(R.mode).make();
    R.q = q; R.typed = '';
  }
  function mtStartFacts(mode) {
    var R = { kind: 'facts', mode: mode, secs: 60, end: Date.now() + 60000, score: 0, wrong: [], typed: '', q: null, over: false };
    mtNextFact(R); ui.mt = ui.mt || {}; ui.mt.run = R;
    clearInterval(mtTimer); mtTimer = setInterval(function () {
      var r = ui.mt && ui.mt.run; if (!r || r.kind !== 'facts' || r.over) { clearInterval(mtTimer); return; }
      var left = Math.max(0, Math.ceil((r.end - Date.now()) / 1000)); var el = document.getElementById('mt-clock'); if (el) el.textContent = left + 's';
      if (left <= 0) { clearInterval(mtTimer); mtEndFacts(); }
    }, 250);
  }
  function mtEndFacts() {
    var R = ui.mt.run; R.over = true; var m = mtState(); var best = m.facts.best[R.mode] || 0; R.newBest = R.score > best; if (R.newBest) m.facts.best[R.mode] = R.score;
    var d = cur(); m.log[String(Date.now())] = { d: today(), n: d ? d.n : 0, k: 'facts', mode: R.mode, score: R.score, wrong: R.wrong.length };
    save(); refreshSheet(true);
  }
  function mtFactKey(ch) {
    var R = ui.mt.run; if (!R || R.over) return;
    if (ch === '⌫') R.typed = R.typed.slice(0, -1); else if (R.typed.length < 6) R.typed += ch;
    var ans = String(R.q[1]); var el = document.getElementById('mt-typed');
    if (R.typed === ans) {
      R.score++; var miss = mtState().facts.miss; if (miss[R.q[0]]) { miss[R.q[0]]--; if (miss[R.q[0]] <= 0) { delete miss[R.q[0]]; delete miss['=' + R.q[0]]; } }
      mtNextFact(R); mtFactPaint(true); return;
    }
    if (R.typed.length >= ans.length && R.typed !== ans.slice(0, R.typed.length)) {
      var miss2 = mtState().facts.miss; miss2[R.q[0]] = (miss2[R.q[0]] || 0) + 2; miss2['=' + R.q[0]] = R.q[1]; R.wrong.push(R.q[0] + ' = ' + ans);
      if (el) { el.textContent = ans; el.classList.add('mt-wrongflash'); }
      setTimeout(function () { mtNextFact(R); mtFactPaint(false); }, 700); R.typed = ''; return;
    }
    if (el) el.textContent = R.typed || ' ';
  }
  function mtFactPaint(good) {
    var R = ui.mt.run; var q = document.getElementById('mt-q'), t = document.getElementById('mt-typed'), s = document.getElementById('mt-score');
    if (q) q.textContent = R.q[0] + ' ='; if (t) { t.textContent = ' '; t.classList.remove('mt-wrongflash'); } if (s) s.textContent = R.score;
    if (good && q) { q.classList.remove('mt-good'); void q.offsetWidth; q.classList.add('mt-good'); }
  }
  function mtKeypad(keys, act) {
    return '<div class="mt-pad">' + keys.map(function (k) { var lab = k === ' ' ? '␣' : k; return '<button class="mt-key' + (k === '✓' ? ' go' : '') + '" data-act="' + act + '" data-v="' + esc(k) + '" aria-label="' + (k === ' ' ? 'space' : esc(k)) + '">' + esc(lab) + '</button>'; }).join('') + '</div>';
  }

  // ---------- views ----------
  function mtTabs(v) {
    return '<div class="seg" role="group" aria-label="Maths">' + [['today', 'Today'], ['facts', 'Facts'], ['topics', 'Topics'], ['heur', 'Heuristics'], ['scope', 'Scope'], ['record', 'Record']].map(function (o) { return '<button data-act="mt-view" data-v="' + o[0] + '" aria-pressed="' + (v === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>';
  }
  function mtRunView() {
    var R = ui.mt.run;
    if (R.kind === 'facts') {
      var M = mtFactMode(R.mode);
      if (R.over) return '<div class="rd-done"><div class="rd-big">' + R.score + '</div><p>' + esc(M.name) + ' in 60 seconds' + (R.newBest ? ' — a new best! 🎉' : ' · best ' + (mtState().facts.best[R.mode] || 0)) + '</p>' + (R.wrong.length ? '<p class="small">To practise: ' + esc(R.wrong.join(', ')) + '</p><p class="small muted">These come back more often until you get them right.</p>' : '') + '</div><div class="btns rd-go"><button class="btn" data-act="mt-facts" data-v="' + R.mode + '">Again</button><button class="btn ghost" data-act="mt-view" data-v="facts">Done</button></div>';
      return '<div class="mt-bar"><span>' + esc(M.name) + '</span><b id="mt-score">' + R.score + '</b><span id="mt-clock">' + Math.max(0, Math.ceil((R.end - Date.now()) / 1000)) + 's</span></div>' +
        '<div class="mt-fact"><span id="mt-q">' + esc(R.q[0]) + ' =</span> <span id="mt-typed" class="mt-typed"> </span></div>' + mtKeypad(['7', '8', '9', '4', '5', '6', '1', '2', '3', '⌫', '0'], 'mt-fkey') +
        '<div class="btns" style="justify-content:flex-end"><button class="btn ghost small" data-act="mt-stopfacts">Stop</button></div>';
    }
    if (R.i >= R.items.length) return mtSetEnd();
    var it = R.items[R.i], Q = it.Q; var g = it.kind === 'h' ? mtHeur(it.id) : mtTopic(it.id);
    var tname = it.kind === 'h' ? 'Heuristic: ' + g.name : 'P' + g.lv + ' ' + g.name;
    var head = '<div class="mt-top"><button class="btn ghost small" data-act="mt-back">‹ Back</button></div><div class="kicker">' + esc(R.label) + ' · ' + (R.kind === 'heur' ? 'Level ' + it.lv + ' · problem ' + (R.i + 1) : (R.i + 1) + ' of ' + R.items.length) + (R.label === g.name ? '' : ' · ' + esc(tname) + (it.lv ? ' (level ' + it.lv + ')' : '')) + '</div>';
    var body = '<div class="mt-q">' + esc(Q.q) + '</div>';
    var more = R.kind === 'heur' && R.fb && !R.fb.chg && R.i + 1 >= R.items.length && R.items.length < MT_HMAX;
    var nextBtn = '<button class="btn" data-act="mt-next">' + (R.i + 1 < R.items.length || more ? 'Next question ›' : 'Finish ›') + '</button>' + (R.kind === 'heur' && (R.i + 1 < R.items.length || more) ? '<button class="btn ghost" data-act="mt-stopset">Stop here</button>' : '');
    var asks = mtAsks(Q);
    // Finished with this question.
    if (R.fb) {
      var fb = R.fb;
      if (fb.ok) {
        body += '<div class="mt-fb ok"><b>✓ ' + (R.helped ? 'Yes — you worked it out.' : 'Right!') + '</b>' + mtChgHTML(it, fb.chg) + '</div>';
        if (R.kind !== 'place') body += '<p class="mt-steptxt tell">' + esc(Q.walk ? 'Tell it back: explain to Mum, in your own words, how you worked it out. What did your model show?' : 'Tell Mum how you worked it out.') + '</p>';
        var lastVis = (Q.walk || []).filter(function (s) { return s.m || s.tab || s.flow; }).pop();
        if (lastVis && R.kind !== 'place') body += R.cmp ? '<div class="card mt-walk"><div class="kicker">One model for it — how does yours compare?</div>' + MX.stepHTML(lastVis) + '</div>' : '<div class="btns"><button class="btn ghost small" data-act="mt-cmp">Compare with a model</button></div>';
      } else {
        body += (fb.chg === 'down' ? '<div class="mt-fb">' + mtChgHTML(it, 'down') + '</div>' : '') + '<div class="mt-fb no"><b>Let\'s look at it together.</b> The answer is <b>' + esc(Q.show + (Q.unit ? ' ' + Q.unit : '')) + '</b>.</div>';
        if (Q.walk && R.kind !== 'place') body += '<div class="card mt-walk"><div class="kicker">The thinking, step by step</div><ol class="mt-done">' + asks.map(function (s) { return '<li><b>' + esc(s.ask) + '</b><br>' + esc(s.t) + '</li>'; }).join('') + '</ol>' + (function () { var v = (Q.walk || []).filter(function (s) { return s.m || s.tab || s.flow; }).pop(); return v ? MX.stepHTML(v) : ''; })() + '</div><p class="mt-steptxt tell">Read the steps through, then tell Mum in your own words why the answer is ' + esc(Q.show) + '.</p>';
        else if (Q.steps && R.kind !== 'place') body += '<div class="card mt-steps"><ol>' + Q.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>';
      }
      return head + body + (R.kind !== 'place' && ui.mt.ink && ui.mt.ink.strokes.length ? mtInkHTML() : '') + '<div class="btns rd-go">' + nextBtn + '</div>';
    }
    // Thinking it through: one question at a time; the model grows as she answers.
    if (R.phase === 'guide') {
      var st = asks[R.gi];
      var prevVis = null; for (var pi = R.gi - 1; pi >= 0; pi--) if (asks[pi].m || asks[pi].tab || asks[pi].flow) { prevVis = asks[pi]; break; }
      var h2 = '<div class="card mt-walk"><div class="kicker">Thinking it through · question ' + (R.gi + 1) + ' of ' + asks.length + '</div>';
      if (R.gi) h2 += '<ol class="mt-done">' + asks.slice(0, R.gi).map(function (s) { return '<li>' + esc(s.t) + '</li>'; }).join('') + '</ol>';
      if (R.gfb) {
        h2 += '<p class="mt-steptxt">' + (R.gfb === 'ok' ? '✓ ' : 'It is <b>' + esc(st.show) + '</b>. ') + esc(st.t) + '</p>' + MX.stepHTML(st.m || st.tab || st.flow ? st : (prevVis || {})) + '</div>';
        return head + body + h2 + '<div class="btns rd-go"><button class="btn" data-act="mt-gnext">' + (R.gi + 1 < asks.length ? 'Next question ›' : 'Now answer the problem ›') + '</button></div>';
      }
      h2 += (st.pre ? MX.stepHTML(st.pre) : prevVis ? MX.stepHTML(prevVis) : '') + '<p class="mt-steptxt"><b>' + esc(st.ask) + '</b></p>' + (R.ghint ? '<p class="mt-msg">Think: ' + esc(st.hint || 'Look at the model again.') + '</p>' : '') + '</div>';
      return head + body + h2 + (R.gfb ? '' : '<div class="btns" style="margin:4px 0"><button class="btn ghost small" data-act="mt-gskip">I know the answer now ›</button></div>') + mtInkHTML() + mtInput(st, 'mt-gchoose');
    }
    if (R.guided && asks.length) { var lv = null; asks.forEach(function (s) { if (s.m || s.tab || s.flow) lv = s; }); body += '<div class="card mt-walk"><div class="kicker">What you have worked out</div><ol class="mt-done">' + asks.map(function (s) { return '<li>' + esc(s.t) + '</li>'; }).join('') + '</ol>' + (lv ? MX.stepHTML(lv) : '') + '</div>'; }
    if (R.msg) body += '<p class="mt-msg">' + esc(R.msg) + '</p>';
    if (asks.length && R.kind !== 'place' && !R.guided) body += '<div class="btns"><button class="btn ghost small" data-act="mt-guide">🤔 Help me think it through</button></div>' + (it.kind === 'h' ? '<p class="small muted" style="margin:0">Try drawing a model on paper first.</p>' : '');
    return head + body + mtInkHTML() + mtInput(Q, 'mt-choose') + '<div class="btns" style="justify-content:flex-end"><button class="btn ghost small" data-act="mt-quit">Stop here</button></div>';
  }
  // The guiding questions for a problem — but never its final step: she takes that one herself.
  function mtAsks(Q) {
    var a = (Q.walk || []).filter(function (s) { return s.ask; }); var last = a[a.length - 1];
    if (last && Q.a && last.a && last.a.n != null && Q.a.n != null && last.a.n * Q.a.d === Q.a.n * last.a.d) a = a.slice(0, -1);
    return a;
  }
  function mtInput(Q, chooseAct) {
    if (Q.choices) return '<div class="rd-cards">' + Q.choices.map(function (c) { return '<button class="rd-card" data-act="' + chooseAct + '" data-v="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>';
    var keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', '/', ' ', Q.ratio || Q.time ? ':' : '⌫', Q.ratio || Q.time ? '⌫' : '✓'];
    if (Q.ratio || Q.time) keys.push('✓');
    var R = ui.mt.run;
    return '<div class="mt-ans"><span id="mt-typed" class="mt-typed">' + (R.typed ? esc(R.typed) : '&nbsp;') + '</span>' + (Q.unit ? '<span class="muted">' + esc(Q.unit) + '</span>' : '') + '</div>' +
      '<p class="small muted" style="margin:0;text-align:center">Fractions: 3/4 · mixed numbers: 2 ␣ 1/3' + (Q.ratio ? ' · ratios: 2:3' : '') + (Q.time ? ' · time: 14:05' : '') + '</p>' + mtKeypad(keys, 'mt-key');
  }

  var MT_HMAX = 8; // a heuristics session ends at a level change, or after this many problems
  function mtChgHTML(it, chg) {
    if (!chg) { if (it.kind !== 'h') return ''; var r = mtRec('h', it.id); return r.lv === it.lv && r.st ? '<br><span class="small">' + r.st + ' of ' + MT_UP + ' in a row at level ' + r.lv + '.</span>' : ''; }
    var nm = it.kind === 'h' ? mtHeur(it.id).name : mtTopic(it.id).name; var r2 = it.kind === 'h' ? mtRec('h', it.id) : null;
    if (chg === 'up') return '<br>🎉 <b>Level ' + r2.lv + '!</b> Three in a row — ' + esc(nm) + ' moves up to harder problems.';
    if (chg === 'mastered') return '<br>🎉 <b>' + esc(nm) + ' is mastered!</b> Three in a row' + (it.kind === 'h' ? ' at the top level.' : ' — on to the next topic.');
    if (chg === 'down') return '<b>' + esc(nm) + ' goes back to level ' + r2.lv + '</b> for a while, to build it up again.';
    return '';
  }
  function mtSetEnd() {
    var R = ui.mt.run; var right = R.res.filter(function (x) { return x; }).length;
    if (!R.res.length) { ui.mt.run = null; return mtTabs(ui.mt.view || 'today') + mtTodayView(); }
    if (!R.logged) {
      R.logged = true; var m = mtState(); var d = cur();
      m.log[String(Date.now())] = { d: today(), n: d ? d.n : 0, k: R.kind, label: R.label, score: right, total: R.res.length, topics: R.items.slice(0, R.res.length).map(function (it, i) { return (R.res[i] ? '✓' : '✗') + it.id; }) };
      if (R.kind === 'place' && R.lv) m.place['p' + R.lv] = today();
      R.full = R.res.length >= R.n0;
      if (R.kind === 'today' && R.full && d && !doneToday(MT_TICK)) addToday(MT_TICK); else save();
      render();
    }
    var newly = R.kind === 'place' ? MX.topics.filter(function (t) { return t.lv === R.lv && mtMastered(t.id); }).length : null;
    return '<div class="rd-done"><div class="rd-big">' + right + ' / ' + R.res.length + '</div>' +
      (R.ups && R.ups.length ? '<p>' + R.ups.map(function (x) { return esc(x); }).join('<br>') + '</p>' : '') +
      (R.kind === 'place' ? '<p>' + newly + ' of the P' + R.lv + ' topics are marked as known. The rest join your practice, in syllabus order.</p>' : '<p>' + (right === R.res.length ? 'All right — well done!' : 'Well worked.') + '</p>') +
      (R.kind === 'today' ? '<p class="small muted">' + (R.full ? 'Maths practice is ticked for today.' : 'Finish a whole set to tick Maths practice for today.') + '</p>' : '') + '</div><div class="btns rd-go"><button class="btn" data-act="mt-view" data-v="' + (R.kind === 'place' ? 'topics' : 'today') + '">Done</button></div>';
  }
  function mtTodayView() {
    var m = mtState(); var learn = mtLearning(); var nPlaced = Object.keys(m.place).length;
    var h = '';
    if (!nPlaced && !Object.keys(m.log).length) h += '<div class="card"><h3>Start with a placement check</h3><p style="margin:0 0 8px">One question on each topic of a level. Topics you get right twice are marked as known, so practice starts where your gaps are. Start with P3 and go up while it is going well.</p><div class="btns">' + [3, 4, 5, 6].map(function (lv) { return '<button class="btn' + (lv === 3 ? '' : ' ghost') + ' small" data-act="mt-place" data-v="' + lv + '">P' + lv + ' check</button>'; }).join('') + '</div></div>';
    var mastered = MX.topics.length - learn.length;
    h += '<div class="card"><div class="kicker">PSLE syllabus (Standard) · ' + mastered + ' of ' + MX.topics.length + ' topics mastered</div><div class="rd-dots" aria-hidden="true">' + MX.topics.map(function (t) { return '<i class="' + (mtMastered(t.id) ? 'f' : '') + '"></i>'; }).join('') + '</div>' +
      (learn.length ? '<p style="margin:6px 0 0">Learning now: <b>P' + learn[0].lv + ' ' + esc(learn[0].name) + '</b>' + (learn[1] ? ' and <b>P' + learn[1].lv + ' ' + esc(learn[1].name) + '</b>' : '') + '.</p>' : '<p style="margin:6px 0 0">Every topic is mastered — keep reviewing.</p>') + '</div>';
    h += '<div class="btns rd-go"><button class="btn" data-act="mt-today">' + (doneToday(MT_TICK) ? 'Do another set' : "Start today's set (10 questions)") + '</button><button class="btn ghost" data-act="mt-facts" data-v="mix">1-minute facts warm-up</button></div>';
    h += '<p class="small muted" style="margin:0">Each set: six questions on the topics you are learning, two to review mastered ones, and two heuristics problems with the method shown. A topic counts as mastered after three right in a row (first try, no help); then the next topic takes its place, even in the middle of a set.</p>';
    return h;
  }
  function mtFactsView() {
    var m = mtState(); var miss = Object.keys(m.facts.miss).filter(function (k) { return k[0] !== '=' && m.facts.miss[k] > 0; });
    return '<p style="margin:0">One minute. Type the answer — a right answer moves on by itself.</p><div class="mt-modes">' + MX.facts.map(function (f) { return '<button class="mt-mode" data-act="mt-facts" data-v="' + f.id + '"><b>' + esc(f.sym) + '</b><span>' + esc(f.name) + '</span><small>best ' + (m.facts.best[f.id] || 0) + '</small></button>'; }).join('') + '</div>' +
      (miss.length ? '<p class="small"><b>Facts to practise:</b> ' + esc(miss.slice(0, 20).join(', ')) + '</p>' : '');
  }
  function mtTopicsView() {
    var m = mtState(); var h = '';
    [3, 4, 5, 6].forEach(function (lv) {
      var ts = MX.topics.filter(function (t) { return t.lv === lv; }); var done = ts.filter(function (t) { return mtMastered(t.id); }).length;
      h += '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3 style="margin:0">P' + lv + ' · ' + done + '/' + ts.length + '</h3><button class="btn ghost small" data-act="mt-place" data-v="' + lv + '">' + (m.place['p' + lv] ? 'Check again' : 'Placement check') + '</button></div><ul class="list">' +
        ts.map(function (t) { var r = m.topics[t.id]; var acc = mtAcc(r); return '<li><span>' + (mtMastered(t.id) ? '✓ ' : '') + esc(t.name) + ' <span class="small muted">' + esc(t.strand) + (acc != null ? ' · ' + acc + '% right' : '') + '</span></span><button class="btn ghost small" data-act="mt-topic" data-v="' + t.id + '">Practise</button></li>'; }).join('') + '</ul></div>';
    });
    return h + '<p class="small muted">Topics and their order follow MOE\'s 2021 Primary Mathematics Syllabus (Standard), which PSLE uses from 2026. Topics that need drawings to work on — nets, symmetry, graphs and pie charts — are best done on paper and are not here.</p>';
  }
  function mtHeurView() {
    var m = mtState(); var groups = []; MX.heuristics.forEach(function (x) { if (groups.indexOf(x.group) < 0) groups.push(x.group); });
    var nM = MX.heuristics.filter(function (x) { return (m.heur[x.id] || {}).m; }).length;
    var h = '<p style="margin:0">The 13 thinking methods for PSLE word problems. Each has three levels, from P3–P4 problems up to PSLE ones, with a bank of different problems for every level. Get three right in a row — first try, no help — and a method moves up a level; while you are finding it hard, more problems at the same level keep coming.</p>' +
      '<div class="card"><div class="kicker">' + nM + ' of ' + MX.heuristics.length + ' methods mastered</div><div class="rd-dots" aria-hidden="true">' + MX.heuristics.map(function (x) { var r = m.heur[x.id] || {}; return '<i class="' + (r.m ? 'f' : r.lv > 1 ? 'h' + r.lv : '') + '"></i>'; }).join('') + '</div></div>';
    groups.forEach(function (gname) {
      h += '<div class="card"><div class="kicker">' + esc(gname) + '</div><ul class="list">' + MX.heuristics.filter(function (x) { return x.group === gname; }).map(function (x) {
        var r = m.heur[x.id]; var lv = (r && r.lv) || 1; var acc = mtAcc(r);
        var st = r && r.m ? '✓ mastered' : 'Level ' + lv + (r && r.st ? ' · ' + r.st + ' of ' + MT_UP + ' in a row' : '');
        return '<li><span><b>' + esc(x.name) + '</b> <span class="small muted">' + st + (r && r.h && r.h.length ? ' · ' + acc + '% right lately' : ' · not tried yet') + '</span>' +
          '<span class="mt-lvs">' + [1, 2, 3].map(function (n) { return '<button class="chip' + (n === lv && !(r && r.m) ? ' on' : '') + '" data-act="mt-hlv" data-v="' + x.id + ':' + n + '" aria-label="Set level ' + n + '">L' + n + '</button>'; }).join('') + '</span></span>' +
          '<button class="btn ghost small" data-act="mt-heur" data-v="' + x.id + '">Practise</button></li>';
      }).join('') + '</ul></div>';
    });
    return h + '<p class="small muted">The L1–L3 buttons are for Mum, to set where a method starts. Three misses in a row above level 1 steps a method back down a level. Methods follow the list Singapore schools teach (MOE\'s problem-solving heuristics); "Think of a related problem" mixes problems from the other methods and asks you first which method fits.</p>';
  }
  function mtRecordView() {
    var m = mtState(); var ts = Object.keys(m.log).sort(function (a, b) { return b - a; });
    var rs = ui.mt.reset;
    var reset = '<div class="card"><div class="kicker">Start again</div><p class="small muted" style="margin:0 0 8px">For Mum: clears your maths progress, for example after Mum has been trying the questions. This cannot be undone.</p><div class="btns">' +
      [['heur', 'Reset heuristics'], ['topics', 'Reset topics and placement'], ['all', 'Reset all maths']].map(function (o) { return rs === o[0] ? '<button class="btn small" style="background:#b3261e;border-color:#b3261e" data-act="mt-reset" data-v="' + o[0] + '">Tap again to ' + o[1].toLowerCase() + '</button>' : '<button class="btn ghost small" data-act="mt-reset" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
    if (!ts.length) return '<p class="muted">Sessions will be listed here.</p>' + reset;
    return reset + '<div class="card"><ul class="list">' + ts.slice(0, 120).map(function (t) { var e = m.log[t];
      var what = e.k === 'facts' ? 'Facts · ' + esc(mtFactMode(e.mode).name) + ': ' + e.score + ' in a minute' : esc(e.label || e.k) + ': ' + e.score + '/' + e.total;
      return '<li style="display:block"><b>' + esc(fmtDate(e.d)) + (e.n ? ' · Day ' + e.n : '') + '</b> — ' + what + '</li>'; }).join('') + '</ul></div>';
  }
  function mtPeek(who) { var keep = MT_WHO; MT_WHO = who; try { var l = mtLearning(); return l.length ? 'Learning: ' + l[0].name : 'All topics mastered'; } finally { MT_WHO = keep; } }
  // ---------- working space: a whiteboard under each question, drawn with a finger or pencil ----------
  // Strokes are kept as points relative to the board's width, so they survive the page redrawing and a rotated iPad.
  function mtInkHTML() {
    var I = ui.mt.ink || (ui.mt.ink = { strokes: [], tool: 'pen', big: false });
    if (!ui.mt.inkOpen) return '<div class="btns"><button class="btn ghost small" data-act="mt-ink">✏️ Working space</button></div>';
    return '';
  }
  // The board itself sits beside the question (below it on a narrow screen), so the question stays in view.
  function mtBoardHTML() {
    var I = ui.mt.ink;
    var tool = function (id, lab) { return '<button data-act="mt-inktool" data-v="' + id + '" aria-pressed="' + (I.tool === id) + '">' + lab + '</button>'; };
    return '<div class="mt-board-wrap"><div class="mt-board-bar"><div class="seg" role="group" aria-label="Pen">' + tool('pen', '✏️ Pencil') + tool('red', '🖍 Red') + tool('rub', '🧽 Rubber') + '</div>' +
      '<span class="btns" style="flex:none"><button class="btn ghost small" data-act="mt-inkundo">↶ Undo</button><button class="btn ghost small" data-act="mt-inkclear">Clear</button><button class="btn ghost small" data-act="mt-inkbig">' + (I.big ? 'Smaller' : 'Bigger') + '</button><button class="btn ghost small" data-act="mt-ink">Hide</button></span></div>' +
      '<canvas id="mt-board" class="mt-board' + (I.big ? ' big' : '') + '" aria-label="Working space: draw your working here"></canvas></div>';
  }
  function mtInkInit() {
    var c = document.getElementById('mt-board'); if (!c || c._ready) return; c._ready = true;
    var I = ui.mt.ink; var ctx = c.getContext('2d');
    function size() { var r = c.getBoundingClientRect(); var d = window.devicePixelRatio || 1; c.width = Math.round(r.width * d); c.height = Math.round(r.height * d); ctx.setTransform(d, 0, 0, d, 0, 0); redraw(); }
    function W() { return c.getBoundingClientRect().width || 1; }
    function drawStroke(st) {
      var w = W(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = st.tool === 'rub' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = st.tool === 'red' ? '#c0392b' : getComputedStyle(c).color || '#222'; ctx.lineWidth = st.tool === 'rub' ? 22 : 2.6;
      ctx.beginPath(); st.p.forEach(function (pt, i) { var x = pt[0] * w, y = pt[1] * w; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      if (st.p.length === 1) ctx.lineTo(st.p[0][0] * w + 0.1, st.p[0][1] * w + 0.1);
      ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
    }
    function redraw() { ctx.clearRect(0, 0, c.width, c.height); I.strokes.forEach(drawStroke); }
    var cur = null;
    function pt(e) { var r = c.getBoundingClientRect(); var w = r.width || 1; return [(e.clientX - r.left) / w, (e.clientY - r.top) / w]; }
    c.addEventListener('pointerdown', function (e) { e.preventDefault(); try { c.setPointerCapture(e.pointerId); } catch (x) {} cur = { tool: I.tool, p: [pt(e)] }; I.strokes.push(cur); drawStroke(cur); });
    c.addEventListener('pointermove', function (e) { if (!cur) return; e.preventDefault(); cur.p.push(pt(e)); redraw(); });
    function end() { cur = null; }
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end); c.addEventListener('pointerleave', end);
    c._redraw = redraw; size();
  }
  function mtSheet(tickId, who) {
    MT_WHO = who || 'emma'; MT_TICK = tickId || 'e_mathtr'; ui.mt = ui.mt || {};
    var v = ui.mt.view || 'today'; var body;
    var wide = false;
    if (ui.mt.run) {
      var main = mtRunView(); var R0 = ui.mt.run;
      var board = ui.mt.inkOpen && R0 && R0.kind !== 'facts' && !(R0.items && R0.i >= R0.items.length);
      if (board) { mtInkHTML(); body = '<div class="mt-split"><div class="rd-stage mt-left">' + main + '</div><div class="mt-right">' + mtBoardHTML() + '</div></div>'; wide = true; setTimeout(mtInkInit, 0); }
      else body = '<div class="rd-stage">' + main + '</div>';
    }
    else body = mtTabs(v) + (v === 'facts' ? mtFactsView() : v === 'topics' ? mtTopicsView() : v === 'heur' ? mtHeurView() : v === 'record' ? mtRecordView() : v === 'scope' ? nmScopeView(MT_WHO) : mtTodayView());
    return { title: 'Maths', who: MT_WHO, body: body, wide: wide };
  }
  window.__mtAns = function () { var R = ui.mt && ui.mt.run; if (!R || !R.items) return ''; var Q = R.items[R.i].Q; if (R.phase === 'guide') { var st = mtAsks(Q)[R.gi]; return st.show; } return Q.ratio ? Q.ratio.join(':') : Q.choices || Q.time ? Q.a : Q.show; };
  // A question is right for mastery only if she got it first time without help.
  function mtFinish(ok) {
    var R = ui.mt.run; var it = R.items[R.i]; R.res[R.i] = ok && !R.helped && !R.att; R.fb = { ok: ok };
    if (R.kind === 'place' && it.kind === 't') {
      if (it.second && ok && !R.att) { var rec = mtRec('t', it.id); rec.h = [1, 1, 1, 1, 1]; rec.m = true; rec.seen = today(); }
      else mtScore('t', it.id, R.res[R.i]);
    } else { R.fb.chg = mtScore(it.kind, it.id, R.res[R.i], it.lv); }
    save(); refreshSheet();
  }
  function mtSubmit(typed) {
    var R = ui.mt.run; var it = R.items[R.i]; var Q = it.Q;
    if (R.phase === 'guide') {
      var asks = mtAsks(Q); var st = asks[R.gi]; var rg = MX.check(st, typed);
      if (rg.unread) { R.ghint = true; refreshSheet(); return; }
      if (rg.close) { R.ghint = true; R.typed = ''; refreshSheet(); return; }
      R.typed = '';
      if (rg.ok) { R.gfb = 'ok'; refreshSheet(); return; }
      // She has worked out the whole problem while being guided: take that as the answer and show the result.
      var rm = MX.check(Q, typed);
      if (rm.ok && !Q.choices) { R.phase = 'main'; R.msg = null; mtFinish(true); return; }
      R.gtries = (R.gtries || 0) + 1; if (R.gtries >= 2) R.gfb = 'shown'; else R.ghint = true;
      refreshSheet(); return;
    }
    var r = MX.check(Q, typed);
    if (r.unread) { R.msg = 'Type a number, a fraction like 3/4, or a mixed number like 2 1/3.'; refreshSheet(); return; }
    if (r.close) { R.msg = r.close; R.typed = ''; refreshSheet(); return; }
    R.typed = '';
    // Placement: a right first answer earns a second question on the same topic; two right marks it known.
    if (R.kind === 'place' && it.kind === 't') {
      if (r.ok && !it.second) { R.res[R.i] = true; R.items[R.i] = { kind: 't', id: it.id, Q: mtTopic(it.id).gen(), second: true }; R.msg = 'Right! One more on this topic.'; refreshSheet(); return; }
      R.msg = null; mtFinish(r.ok); return;
    }
    if (r.ok) { R.msg = null; mtFinish(true); return; }
    R.att = (R.att || 0) + 1;
    var asks2 = mtAsks(Q);
    if (asks2.length && !R.guided) { R.phase = 'guide'; R.guided = true; R.helped = true; R.gi = 0; R.gfb = null; R.gtries = 0; R.ghint = false; R.msg = null; refreshSheet(); return; }
    if (R.att === 1 && !asks2.length) { R.msg = 'Not quite. ' + (MX.nudge[it.id] || 'Look at it again.') + ' Have another go.'; refreshSheet(); return; }
    R.msg = null; mtFinish(false);
  }
  function mtAct(act, v, el) {
    ui.mt = ui.mt || {}; var R = ui.mt.run;
    function no() { el.classList.remove('rd-no'); void el.offsetWidth; el.classList.add('rd-no'); }
    switch (act) {
      case 'mt-view': clearInterval(mtTimer); ui.mt.run = null; ui.mt.view = v; refreshSheet(true); break;
      case 'mt-facts': mtStartFacts(v); refreshSheet(true); break;
      case 'mt-fkey': mtFactKey(v); break;
      case 'mt-stopfacts': clearInterval(mtTimer); mtEndFacts(); break;
      case 'mt-today': mtStartSet('today', mtTodaySet(), "Today's set"); refreshSheet(true); break;
      case 'mt-topic': var t = mtTopic(v); mtStartSet('topic', [0, 1, 2, 3, 4].map(function () { return mtMake('t', v); }), t.name); refreshSheet(true); break;
      case 'mt-heur': var hh = mtHeur(v); mtStartSet('heur', [mtMake('h', v), mtMake('h', v), mtMake('h', v)], hh.name); refreshSheet(true); break;
      case 'mt-hlv': var hp = String(v).split(':'), hr = mtRec('h', hp[0]); hr.lv = +hp[1]; hr.st = 0; hr.miss = 0; hr.m = false; save(); refreshSheet(); break;
      case 'mt-place': mtStartSet('place', mtPlaceItems(+v), 'P' + v + ' placement check'); ui.mt.run.lv = +v; refreshSheet(true); break;
      case 'mt-key':
        if (!R || R.fb || (R.phase === 'guide' && R.gfb)) return;
        if (v === '✓') { if (!R.typed.trim()) { no(); return; } mtSubmit(R.typed.trim()); return; }
        if (v === '⌫') R.typed = R.typed.slice(0, -1); else if (R.typed.length < 14) R.typed += v;
        var te = document.getElementById('mt-typed'); if (te) te.innerHTML = R.typed ? esc(R.typed).replace(/ /g, '&nbsp;') : '&nbsp;';
        break;
      case 'mt-choose': if (R && !R.fb && R.phase !== 'guide') mtSubmit(v); break;
      case 'mt-gchoose': if (R && R.phase === 'guide' && !R.gfb) mtSubmit(v); break;
      case 'mt-guide': R.phase = 'guide'; R.guided = true; R.helped = true; R.gi = 0; R.gfb = null; R.gtries = 0; R.ghint = false; R.typed = ''; refreshSheet(); break;
      case 'mt-gskip': R.phase = 'main'; R.gfb = null; R.typed = ''; R.msg = 'Type your answer to the whole problem.'; refreshSheet(true); break;
      case 'mt-gnext':
        var asks3 = mtAsks(R.items[R.i].Q);
        R.gi++; R.gfb = null; R.gtries = 0; R.ghint = false; R.typed = '';
        if (R.gi >= asks3.length) { R.phase = 'main'; R.msg = 'Now answer the problem.'; }
        refreshSheet(true); break;
      case 'mt-cmp': R.cmp = true; refreshSheet(); break;
      case 'mt-ink': ui.mt.inkOpen = !ui.mt.inkOpen; refreshSheet(); break;
      case 'mt-inktool': ui.mt.ink.tool = v; refreshSheet(); break;
      case 'mt-inkundo': ui.mt.ink.strokes.pop(); var cb = document.getElementById('mt-board'); if (cb && cb._redraw) cb._redraw(); break;
      case 'mt-inkclear': ui.mt.ink.strokes = []; var cb2 = document.getElementById('mt-board'); if (cb2 && cb2._redraw) cb2._redraw(); break;
      case 'mt-inkbig': ui.mt.ink.big = !ui.mt.ink.big; refreshSheet(); break;
      case 'mt-back': clearInterval(mtTimer); ui.mt.run = null; ui.mt.reset = null; refreshSheet(true); break;
      case 'mt-reset':
        if (ui.mt.reset !== v) { ui.mt.reset = v; refreshSheet(); break; }
        ui.mt.reset = null; var mm = mtState();
        if (v === 'heur' || v === 'all') mm.heur = {};
        if (v === 'topics' || v === 'all') { mm.topics = {}; mm.place = {}; }
        if (v === 'all') { mm.facts = { best: {}, miss: {} }; mm.log = {}; }
        save(); toast(v === 'heur' ? 'Heuristics reset' : v === 'topics' ? 'Topics reset' : 'All maths progress reset'); refreshSheet(); break;
      case 'mt-stopset': R.items = R.items.slice(0, R.i + 1); R.i++; R.typed = ''; R.fb = null; R.msg = null; R.phase = 'main'; refreshSheet(true); break;
      case 'mt-next': if (ui.mt.ink) ui.mt.ink.strokes = []; mtAdapt(R);
        R.i++; R.typed = ''; R.fb = null; R.msg = null; R.phase = 'main'; R.helped = false; R.guided = false; R.att = 0; R.cmp = false; refreshSheet(true); break;
      case 'mt-quit': R.items = R.items.slice(0, R.i); refreshSheet(true); break;
    }
  }

  function toggleTick(id) {
    var d = cur(); if (!d) return;
    var a = dList(d.w, id); var k = a.lastIndexOf(d.n);
    if (k >= 0) removeAt(id, k); else addToday(id);
  }

  function choose(pickId, listKey, liId) {
    var d = cur(); var item = allDaily(listKey).filter(function (i) { return i.id === pickId; })[0];
    var chosen = d.picks[pickId] || (d.picks[pickId] = []); var wd = weekDone(d.w);
    var k = chosen.indexOf(liId);
    if (k >= 0) { chosen.splice(k, 1); if (wd[liId] === d.n) delete wd[liId]; delete S.narrWritten[d.w + ':' + liId]; }
    else {
      if (chosen.length >= item.n) { var drop = chosen.shift(); if (wd[drop] === d.n) delete wd[drop]; delete S.narrWritten[d.w + ':' + drop]; }
      chosen.push(liId); wd[liId] = d.n;
    }
    save();
  }

  app.addEventListener('click', handle);
  document.addEventListener('click', function (e) { if (e.target.closest('.scrim') || e.target.closest('.vpop')) handle(e); });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.getAttribute && el.getAttribute('data-calf')) { var cf = el.getAttribute('data-calf').split('|'), cc = calObj(), obj = cc[cf[0]][cf[1]]; if (obj) { obj[cf[2]] = el.value.trim(); if (cf[0] === 'off' && cf[2] === 's' && (!obj.e || obj.e < obj.s)) obj.e = obj.s; save(); setTimeout(function () { refreshSheet(); render(); }, 0); } return; }
    if (el.id === 'cwphoto' && el.files && el.files[0]) { var nt0 = document.getElementById('cwnote'); if (nt0 && ui.cwDraft) ui.cwDraft.note = nt0.value; shrinkPhoto(el.files[0]).then(function (b) { ui.cwPhotoBlob = b; if (ui.cwPhotoUrl) URL.revokeObjectURL(ui.cwPhotoUrl); ui.cwPhotoUrl = URL.createObjectURL(b); refreshSheet(); }); return; }
    if (el.matches('[data-act="scmplan"]')) { var pk2 = el.getAttribute('data-k'); ui.scmPlan[pk2] = el.value; refreshSheet(); }
    if (el.matches('[data-act="scmpack"]')) { ui.scmPack = el.value; refreshSheet(); }
    if (el.matches('[data-act="scmq"]')) { ui.scmQ = el.value; refreshSheet(); }
    if (el.matches('[data-act="svcidea"]')) { var sv2 = (S.service = S.service || {}); (sv2[el.getAttribute('data-v')] = sv2[el.getAttribute('data-v')] || {}).idea = el.value; if (!sv2[el.getAttribute('data-v')].stage && el.value) sv2[el.getAttribute('data-v')].stage = 1; save(); refreshSheet(); }
    if (el.matches('[data-act="posset"]')) { setPtr(el.getAttribute('data-k'), +el.value); toast('Updated'); render(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ui.sheet) closeSheet(); });


  function confirmReplace(w) { if (ui.scmRep === w) { ui.scmRep = null; return true; } ui.scmRep = w; toast('There is already a card there. Tap Put it in again to replace it.'); return false; }

  function handle(e) {
    var el = e.target.closest('[data-act]'); if (!el) return;
    var act = el.getAttribute('data-act'), v = el.getAttribute('data-v');
    if (act === 'scrim') { if (e.target === el) closeSheet(); return; }
    if (el.tagName === 'SELECT' || el.tagName === 'FORM' || el.tagName === 'INPUT') return;
    if (act.indexOf('rd-') === 0) { rdAct(act, v, el); return; }
    if (act.indexOf('mt-') === 0) { mtAct(act, v, el); return; }
    if (act.indexOf('nm-') === 0 || act.indexOf('nq-') === 0) { nmAct(act, v, el); return; }
    if (act.indexOf('zi-') === 0) { ziAct(act, v, el); return; }
    if (/^cal[a-z]+$/.test(act)) { calAct(act, v); return; }
    if (/^link(add|play|del)$/.test(act)) { linkAct(act, v); return; }
    if (/^(cw|dc)[a-z]+$/.test(act)) { cwAct(act, v, el, ui.sheetArg && ui.sheetArg.tick); return; }
    switch (act) {
      case 'setprofile': (function () { var go = function () { S.profile = v; ui.tab = null; save(); if (ui.sheet) closeSheet(); else render(); }; var need = pinFor(v); if (hasPin(need) && S.profile !== v) askPin(need, 'check', go); else go(); })(); break;
      case 'pinkey': pinKey(v); break;
      case 'pinset': askPin(v, 'set', function () { openSheet('settings'); }); break;
      case 'pinrm': if (S.pins) delete S.pins[v]; save(); toast(PIN_WHO[v] + '’s PIN removed'); refreshSheet(); break;
      case 'syncin': case 'syncnew': (function () { var e1 = document.getElementById('sync-email'), p1 = document.getElementById('sync-pass'); if (!window.SDsync) return; var m = document.getElementById('sync-msg'); if (m) m.textContent = 'Connecting…'; window.SDsync[act === 'syncin' ? 'signIn' : 'signUp']((e1 && e1.value || '').trim(), p1 ? p1.value : '').then(function () { refreshSheet(); render(); }, function (err) { if (m) m.textContent = err; }); })(); break;
      case 'syncout': if (window.SDsync) window.SDsync.signOut().then(function () { refreshSheet(); }); break;
      case 'tab': ui.tab = v; ui.weekView = null; stopTimer(); render(); window.scrollTo(0, 0); break;
      case 'startday': startDay(); break;
      case 'startweek': S.forceNewWeek = true; startDay(); break;
      case 'keepday': S.keepDay = today(); save(); render(); break;
      case 'tick':
        if (!cur()) { toast('Start a school day first'); return; }
        toggleTick(v);
        render(); if (el.getAttribute('data-stay')) refreshSheet();
        break;
      case 'timer': startTimer(el.getAttribute('data-id'), +el.getAttribute('data-mins')); break;
      case 'sheet': if (v === 'settings' && hasPin('mum')) { askPin('mum', 'check', function () { openSheet('settings'); }); break; } openSheet(v, { tick: el.getAttribute('data-tick'), label: el.getAttribute('data-label') }); break;
      case 'pick': if (!cur()) { toast('Start a school day first'); return; } openSheet('pick', { pick: v, list: el.getAttribute('data-list') }); break;
      case 'choose': choose(el.getAttribute('data-p'), el.getAttribute('data-list'), v); refreshSheet(); render(); break;
      case 'written': var d = cur(); var k = d.w + ':' + v; if (S.narrWritten[k]) delete S.narrWritten[k]; else S.narrWritten[k] = true; save(); refreshSheet(); render(); break;
      case 'close': closeSheet(); break;
      case 'ptr': var key = el.getAttribute('data-k'); var p = S.ptr[key] || { i: 0 }; setPtr(key, (p.i || 0) + (+el.getAttribute('data-d')), ptrLen(key)); refreshSheet(1); render(); break;
      case 'setptr':
        var sk = el.getAttribute('data-k');
        if (ui.poemUpto === sk) { var sp = S.ptr[sk] || (S.ptr[sk] = { i: 0 }); if (!sp.log) sp.log = {}; for (var si = 0; si <= +v; si++) if (!sp.log[si]) sp.log[si] = 'earlier'; ui.poemUpto = null; setPtr(sk, +v + 1, ptrLen(sk)); toast('Poems 1–' + (+v + 1) + ' marked as read'); }
        else setPtr(sk, +v, ptrLen(sk));
        refreshSheet(1); render(); break;
      case 'poemlist': var lk2 = el.getAttribute('data-k'); ui.poemListOpen = ui.poemListOpen === lk2 ? null : lk2; break;
      case 'poemsupto': var uk = el.getAttribute('data-k'); ui.poemUpto = ui.poemUpto === uk ? null : uk; refreshSheet(); break;
      case 'togglezhen': S.ptr.chineseEn = S.ptr.chineseEn === false; save(); refreshSheet(); break;
      case 'zoompic': el.parentNode.classList.toggle('big'); break;
      case 'pichide': ui.picHide = v === '' ? null : +v; refreshSheet(); break;
      case 'picmore': ui.picMore = v === '' ? null : +v; refreshSheet(); break;
      case 'audpick': apicker.setAttribute('data-for', v); apicker.click(); break;
      case 'recgo': recToggle(v); break;
      case 'narrsave': (function () {
        var ta = document.getElementById('narrtxt'), t = ta ? ta.value.trim() : ''; if (!t) { toast('Nothing written yet'); return; }
        var all = S.narrT || (S.narrT = {}), T = all[v] || (all[v] = {}); T[String(Date.now())] = { d: today(), t: t };
        ui.narrDraft = null; save(); toast('Written narration saved'); refreshSheet();
      })(); break;
      case 'narrdel': var nd = v.split('|'); if (ui.narrDel !== nd[1]) { ui.narrDel = nd[1]; refreshSheet(); break; } ui.narrDel = null; if (S.narrT && S.narrT[nd[0]]) delete S.narrT[nd[0]][nd[1]]; save(); refreshSheet(); break;
      case 'recall': ui.recOpen = ui.recOpen === v ? null : v; refreshSheet(); break;
      case 'recdel': var rp = v.split('|'); if (recDel !== rp[1]) { recDel = rp[1]; refreshSheet(); break; } recDel = null; recRemove(rp[0], rp[1]); refreshSheet(); break;
      case 'auddel': vdel(v); if (aurls[v]) { URL.revokeObjectURL(aurls[v]); delete aurls[v]; } refreshSheet(); break;
      case 'wordsedit': ui.wordsEdit = v || null; refreshSheet(); break;
      case 'wordssave': var ta = document.getElementById('mywords'); (S.lyrics = S.lyrics || {})[v] = ta ? ta.value.trim() : ''; save(); ui.wordsEdit = null; toast('Words saved'); refreshSheet(); break;
      case 'bibletrack': ui.bibleTrack = v; refreshSheet(); break;
      case 'biblelang': ui.bibleLang = v; refreshSheet(); break;
      case 'bmkv': bmkSet('v', v); applyBmk(document.querySelector('.sheet-body')); break;
      case 'vref': showVerses(v); break;
      case 'vpoplang': showVerses(document.getElementById('vpop').getAttribute('data-v'), v); break;
      case 'vpopclose': hideVerses(); break;
      case 'vpopbg': if (e.target === el) hideVerses(); break;
      case 'lookopen': ui.lookOpen = ui.lookOpen === v ? null : v; break;
      case 'bmks': bmkSet('s', +v); applyBmk(document.querySelector('.sheet-body')); break;
      case 'bmkgo': applyBmk(document.querySelector('.sheet-body'), true); break;
      case 'bmkclear': delete S.ptr[bmkKey()]; save(); applyBmk(document.querySelector('.sheet-body')); break;
      case 'biblestep': delete S.ptr['bmk_' + v]; var bk = 'bible_' + v; var bp = S.ptr[bk] || { i: 0 }; setPtr(bk, bp.i + (+el.getAttribute('data-d')), ptrLen(bk)); refreshSheet(1); render(); break;
      case 'reciteopen': ui.reciteOpen = ui.reciteOpen || {}; ui.reciteOpen[v] = !ui.reciteOpen[v]; refreshSheet(); break;
      case 'recitepractise': var st = S.recite[v] || (S.recite[v] = {}); st.count = (st.count || 0) + 1; save(); toast('Practised ✓'); refreshSheet(); render(); break;
      case 'reciteknown': var st2 = S.recite[v] || (S.recite[v] = {}); st2.known = !st2.known; save(); refreshSheet(); render(); break;
      case 'setsong': S.songCur[el.getAttribute('data-k')] = v; save(); refreshSheet(); render(); break;
      case 'drawadd': ui.drawAdd = { who: el.getAttribute('data-who'), g: el.getAttribute('data-g') }; ui.drawPhoto = null; ui.drawView = null; refreshSheet(); var sb0 = document.querySelector('.sheet-body'); if (sb0) sb0.scrollTop = 0; break;
      case 'drawcancel': ui.drawAdd = null; ui.drawPhoto = null; refreshSheet(); break;
      case 'drawphoto': var n0 = document.getElementById('draw-note'), g0 = document.getElementById('draw-goal'); if (ui.drawAdd) { ui.drawAdd.note = n0 ? n0.value : ''; ui.drawAdd.g = g0 ? g0.value : ui.drawAdd.g; } ppicker.click(); break;
      case 'drawsave':
        var A = ui.drawAdd; if (!A) break; var dd = cur(); var gEl = document.getElementById('draw-goal'), nEl = document.getElementById('draw-note');
        var entry = { g: gEl ? gEl.value : A.g, n: dd ? dd.n : 0, t: Date.now(), note: nEl ? nEl.value.trim() : '' };
        var finish = function () { (S.drawing[A.who] = S.drawing[A.who] || []).push(entry); save(); ui.drawAdd = null; ui.drawPhoto = null; toast('Drawing saved'); refreshSheet(); };
        if (ui.drawPhoto) { var pb = ui.drawPhoto.blob; vput('art_' + entry.t, pb).then(function () { entry.photo = true; artUrls['art_' + entry.t] = URL.createObjectURL(pb); finish(); }).catch(function () { toast('The photo could not be kept, saved without it'); finish(); }); }
        else finish();
        break;
      case 'drawview': ui.drawView = v ? { who: el.getAttribute('data-who') || (ui.drawView && ui.drawView.who), t: +v } : null; ui.drawDel = null; refreshSheet(); break;
      case 'drawdel':
        var who = el.getAttribute('data-who'); var t = +el.getAttribute('data-t');
        if (ui.drawDel !== t) { ui.drawDel = t; refreshSheet(); break; }
        S.drawing[who] = (S.drawing[who] || []).filter(function (x) { return x.t !== t; }); vdel('art_' + t); save(); ui.drawDel = null; ui.drawView = null; toast('Removed'); refreshSheet(); break;
      case 'craftgo': var ck = el.getAttribute('data-k'); var CL = craftData(ck); ui.craftView = { key: ck, i: Math.max(0, Math.min(CL.lessons.length - 1, +v)) }; refreshSheet(1); break;
      case 'picadd': ui.picFor = { k: el.getAttribute('data-k'), who: el.getAttribute('data-who') }; ppicker.click(); break;
      case 'picview': ui.picView = v ? { k: el.getAttribute('data-k'), t: +v } : null; ui.picDel = null; refreshSheet(); break;
      case 'picdel': if (ui.picDel !== +v) { ui.picDel = +v; refreshSheet(); break; } (function () { var pk = el.getAttribute('data-k'); var m = S.craftPics || {}; m[pk] = (m[pk] || []).filter(function (x) { return x.t !== +v; }); ui.picView = null; ui.picDel = null; save(); toast('Photo removed'); refreshSheet(); })(); break;
      case 'crafthere': (S.craft = S.craft || {})[el.getAttribute('data-k')] = +v; ui.craftView = null; save(); refreshSheet(1); break;
      case 'craftdone': var ck2 = el.getAttribute('data-k'); var CL2 = craftData(ck2); var cp = (S.craft = S.craft || {}); var ci = cp[ck2] == null ? (CL2.start || 0) : cp[ck2]; cp[ck2] = Math.min(CL2.lessons.length - 1, ci + 1); ui.craftView = null; save(); toast(ci + 1 >= CL2.lessons.length ? 'That was the last lesson!' : 'Well done! Next lesson is ready'); refreshSheet(1); break;
      case 'brushtrack': (S.craftTrack = S.craftTrack || {}).brush = v; ui.craftView = null; save(); refreshSheet(1); break;
      case 'crafttrack': (S.craftTrack = S.craftTrack || {}).sloyd = v; ui.craftView = null; save(); refreshSheet(); break;
      case 'needlewho': ui.needleWho = v; ui.craftView = null; refreshSheet(); break;
      case 'svcstage': var sv = (S.service = S.service || {}); var se = sv[v] || (sv[v] = {}); se.stage = ((se.stage || 0) + 1) % 4; save(); refreshSheet(); break;
      case 'scmview': ui.scmView = v; ui.scmPlan = null; refreshSheet(1); break;
      case 'scmknow': ui.scmPlan = null; ui.scmMoving = true; refreshSheet(); break;
      case 'scmcancel': ui.scmPlan = null; ui.scmMoving = false; refreshSheet(); break;
      case 'scmmove':
        (function () {
          var B = scmBox(), p = ui.scmPlan, day = isoDay(); if (!p) return;
          B.undo = JSON.parse(JSON.stringify({ slots: B.slots, nums: B.nums, nextNum: B.nextNum, queue: B.queue || [], day: day }));
          var D = B.slots.daily, OE = B.slots[p.oe], W = B.slots[p.wd];
          if (W && W.cards.length) { (B.nums[p.num] = B.nums[p.num] || []).push({ cards: W.cards, since: day }); }
          B.slots[p.wd] = OE && OE.cards.length ? { cards: OE.cards, since: day } : null;
          B.slots[p.oe] = D && D.cards.length ? { cards: D.cards, since: day } : null;
          B.slots.daily = p.next ? { cards: (C.scm.bank || []).filter(function (c) { var n = scmCard(p.next); return c.id === p.next || (n && n.of > 1 && c.ref === n.ref && !whereIs(c.id)); }).sort(function (a, b2) { return a.part - b2.part; }).map(function (c) { return c.id; }), since: day } : null;
          if (p.next) { var all = B.slots.daily.cards; B.queue = (B.queue || []).filter(function (x) { return all.indexOf(x) < 0; }); }
          if (W && W.cards.length && p.num === String(B.nextNum)) B.nextNum = B.nextNum >= 31 ? 1 : B.nextNum + 1;
          (B.log = B.log || []).push({ day: day, plan: p });
          ui.scmPlan = null; ui.scmMoving = false; save(); toast('Cards moved along'); refreshSheet(1);
        })(); break;
      case 'scmdel':
        if (ui.scmDel !== v + ':' + el.getAttribute('data-k')) { ui.scmDel = v + ':' + el.getAttribute('data-k'); refreshSheet(); break; }
        (function () { var B = scmBox(), gone; if (v.indexOf('n') === 0 && v !== 'odd') { var arr = B.nums[v.slice(1)] || []; gone = arr.splice(+el.getAttribute('data-k'), 1)[0]; } else { gone = B.slots[v]; B.slots[v] = null; } if (gone) { (B.trash = B.trash || []).unshift({ where: v, entry: gone, out: isoDay() }); B.trash = B.trash.slice(0, 10); } ui.scmDel = null; save(); toast('Taken out. You can put it back from The box.'); refreshSheet(); })(); break;
      case 'scmback': (function () { var B = scmBox(), t = (B.trash || [])[+v]; if (!t) return; if (t.where.indexOf('n') === 0 && t.where !== 'odd') (B.nums[t.where.slice(1)] = B.nums[t.where.slice(1)] || []).push(t.entry); else { if (B.slots[t.where] && B.slots[t.where].cards.length) { toast(slotLabel(t.where) + ' already has a card. Take it out first.'); return; } B.slots[t.where] = t.entry; } B.trash.splice(+v, 1); save(); toast('Put back'); refreshSheet(); })(); break;
      case 'scmrestore': (function () { var B = scmBox(), ST = C.scm.start, e;
          if (v.indexOf('n') === 0 && v !== 'odd') { (ST.nums[v.slice(1)] || []).forEach(function (x) { if (x.cards.some(function (id) { return !whereIs(id); })) (B.nums[v.slice(1)] = B.nums[v.slice(1)] || []).push(JSON.parse(JSON.stringify(x))); }); }
          else { e = ST.slots[v]; if (B.slots[v] && B.slots[v].cards.length) { toast(slotLabel(v) + ' already has a card. Take it out first, or put this one in elsewhere.'); return; } B.slots[v] = JSON.parse(JSON.stringify(e)); }
          save(); toast('Put back'); refreshSheet(); })(); break;
      case 'scmundo': (function () { var B = scmBox(); if (!B.undo) return; var u = B.undo; B.slots = u.slots; B.nums = u.nums; B.nextNum = u.nextNum; B.queue = u.queue; B.undo = null; save(); toast('Last move undone'); refreshSheet(); })(); break;
      case 'scmadd':
        (function () { var B = scmBox(); var id = document.getElementById('scm-add-card').value, w = document.getElementById('scm-add-where').value; if (!id) return; var ids = [id]; var c = scmCard(id);
          if (c && c.of > 1) ids = (C.scm.bank || []).filter(function (x) { return x.ref === c.ref && (x.id === id || !whereIs(x.id)); }).sort(function (a, b2) { return a.part - b2.part; }).map(function (x) { return x.id; });
          var e = { cards: ids, since: isoDay() };
          if (w.indexOf('n') === 0 && w !== 'odd') (B.nums[w.slice(1)] = B.nums[w.slice(1)] || []).push(e);
          else { if (B.slots[w] && B.slots[w].cards.length && !confirmReplace(w)) return; B.slots[w] = e; }
          save(); toast('Put in ' + (w.indexOf('n') === 0 && w !== 'odd' ? 'behind ' + w.slice(1) : slotLabel(w))); refreshSheet(); })(); break;
      case 'scmqueue': (function () { var B = scmBox(); B.queue = B.queue || []; if (B.queue.indexOf(v) < 0) B.queue.push(v); save(); toast('Added to the verses waiting to learn'); refreshSheet(); })(); break;
      case 'showverse': ui.showVerse[v] = !ui.showVerse[v]; refreshSheet(); break;
      case 'saidverse': var dk = isoDay(); var m = S.said[dk] || (S.said[dk] = {}); if (m[v]) delete m[v]; else m[v] = true; save(); refreshSheet(); render(); break;
      case 'toloop': var ls = document.getElementById('loop-' + v); if (ls) ls.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
      case 'box':
        if (!cur()) { toast('Start a school day first'); return; }
        var ba = dList(cur().w, v); var bk = +el.getAttribute('data-k');
        if (ba[bk]) removeAt(v, bk); else addToday(v);
        render(); break;
      case 'addday': if (!cur()) { toast('Start a school day first'); return; } addToday(v); render(); break;
      case 'loopdone':
        var cd2 = cur(); if (!cd2) { toast('Start a school day first'); return; }
        var wdd = weekDone(cd2.w); if (wdd[v]) { delete wdd[v]; delete S.narrWritten[cd2.w + ':' + v]; } else wdd[v] = cd2.n; save(); render(); if (ui.sheet && ui.sheet.indexOf('reciteone') === 0) refreshSheet(); break;
      case 'stayweek': S.stayWeek = true; startDay(); break;
      case 'stretchstep': ui.stretchStep = (ui.stretchStep || 0) + (+el.getAttribute('data-d')); stopTimer(); refreshSheet(1); break;
      case 'stretchgo': ui.stretchStep = +v; stopTimer(); refreshSheet(); break;
      case 'bookstep': (function () { var bk = el.getAttribute('data-k'); var B = BK[bk]; if (!B) return; setPtr('book_' + bk, bookIndex(bk) + (+el.getAttribute('data-d')), B.items.length); refreshSheet(1); render(); })(); break;
      case 'bookgo': (function () { var bk = el.getAttribute('data-k'); var B = BK[bk]; if (!B) return; setPtr('book_' + bk, +v, B.items.length); refreshSheet(1); render(); })(); break;
      case 'bookdone': (function () { var bk = el.getAttribute('data-k'); var B = BK[bk]; if (!B) return; var i0 = bookIndex(bk); readMap(bk)[i0] = 1; setPtr('book_' + bk, i0 + 1, B.items.length); refreshSheet(1); render(); })(); break;
      case 'booklist': var bl = el.getAttribute('data-k'); ui.bookListOpen = ui.bookListOpen === bl ? null : bl; break;
      case 'bookupto': (function () {
        // Ticks this one and every one before it; leaves later ones as they are. The list stays open.
        var bk = el.getAttribute('data-k'), m = readMap(bk); for (var q = 0; q <= +v; q++) m[q] = 1; ui.bookListOpen = bk; save(); refreshSheet(); render(); toast('Marked read up to ' + (+v + 1));
      })(); break;
      case 'bookread': if (el.getAttribute('data-in') === 'list') ui.bookListOpen = el.getAttribute('data-k'); (function () { var m = readMap(el.getAttribute('data-k')); if (m[v]) delete m[v]; else m[v] = 1; save(); refreshSheet(); render(); })(); break;
      case 'partread': (function () { var ss = selState(el.getAttribute('data-k')); ss.read[v] = 1; ss.cur = null; save(); refreshSheet(1); render(); })(); break;
      case 'partunread': (function () { var ss = selState(el.getAttribute('data-k')); delete ss.read[v]; ss.cur = v; save(); refreshSheet(); render(); })(); break;
      case 'partnext': (function () { var ss = selState(el.getAttribute('data-k')); ss.cur = null; save(); refreshSheet(1); render(); })(); break;
      case 'partgo': (function () { var ss = selState(el.getAttribute('data-k')); ss.cur = v; save(); refreshSheet(1); })(); break;
      case 'seladd': (function () { (ui.selOpen = ui.selOpen || {})[el.getAttribute('data-k')] = true; var ss = selState(el.getAttribute('data-k')); if (ss.list.indexOf(+v) < 0) ss.list.push(+v); save(); refreshSheet(); render(); })(); break;
      case 'selrm': (function () { (ui.selOpen = ui.selOpen || {})[el.getAttribute('data-k')] = true; var ss = selState(el.getAttribute('data-k')); ss.list = ss.list.filter(function (x) { return x !== +v; }); if (ss.cur && ss.cur.split(':')[0] === v) ss.cur = null; save(); refreshSheet(); render(); })(); break;
      case 'selreadall': (function () { (ui.selOpen = ui.selOpen || {})[el.getAttribute('data-k')] = true; var bk = el.getAttribute('data-k'); var ss = selState(bk); var P = partsOf(bk, +v); var all = storyReadCount(bk, +v) === P.length; for (var q = 0; q < P.length; q++) { if (all) delete ss.read[v + ':' + q]; else ss.read[v + ':' + q] = 1; } save(); refreshSheet(); render(); })(); break;
      case 'readstep': var rk = el.getAttribute('data-k'); var ri = readingIndex(rk); S.ptr['reading_' + rk].i = Math.max(0, Math.min(C.readings[rk].contents.length - 1, ri + (+el.getAttribute('data-d')))); save(); refreshSheet(1); render(); break;
      case 'vidpick': vpicker.setAttribute('data-for', v); vpicker.click(); break;
      case 'viddel': vdel(v).then(function () { if (vurls[v]) URL.revokeObjectURL(vurls[v]); delete vurls[v]; vhave[v] = false; refreshSheet(); }); break;
      case 'weeknav': ui.weekView = +v; render(); break;
      case 'newweek': S.forceNewWeek = !S.forceNewWeek; save(); refreshSheet(); break;
      case 'undoday':
        if (el.getAttribute('data-confirm') !== '1') { el.setAttribute('data-confirm', '1'); el.textContent = 'Tap again to remove Day ' + cur().n; var note = document.getElementById('undo-note'); if (note) note.textContent = 'This deletes the ticks recorded on that day.'; return; }
        var gone = S.days.pop(); Object.keys(S.weeks[gone.w] || {}).forEach(function (id) { if (S.weeks[gone.w][id] === gone.n) delete S.weeks[gone.w][id]; }); save(); toast('Day ' + gone.n + ' removed'); refreshSheet(); render(); break;
      case 'backupcopy':
        var txt = JSON.stringify(S); var ta = document.getElementById('backup-text'); var bn = document.getElementById('backup-note');
        var done = function () { if (bn) bn.textContent = 'Backup copied. Paste it into Notes to keep it safe.'; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { ta.value = txt; ta.select(); if (bn) bn.textContent = 'Select all of the text above and copy it.'; });
        else { ta.value = txt; ta.select(); if (bn) bn.textContent = 'Select all of the text above and copy it.'; }
        break;
      case 'restore':
        var raw = (document.getElementById('backup-text').value || '').trim(); var rn = document.getElementById('backup-note');
        try { var obj = JSON.parse(raw); if (!obj || !Array.isArray(obj.days)) throw 0; S = obj; Object.keys(defaults).forEach(function (k2) { if (S[k2] === undefined) S[k2] = defaults[k2]; }); save(); toast('Backup restored'); closeSheet(); }
        catch (x) { if (rn) { rn.style.color = 'var(--warn)'; rn.textContent = 'That text is not a backup from this app. Paste the whole backup and try again.'; } }
        break;
    }
  }

  // Pictures that cannot load (offline before first view) show a short note instead.
  document.addEventListener('error', function (e) {
    var img = e.target; if (!img || img.tagName !== 'IMG') return;
    var msg = img.getAttribute('data-fallback'); if (!msg) { img.style.visibility = 'hidden'; return; }
    var p = document.createElement('p'); p.className = 'muted small'; p.textContent = msg; img.replaceWith(p);
  }, true);
  render();
})();
