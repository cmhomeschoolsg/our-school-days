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
    a.push(d.n); (POEM_TICKS[id] || []).forEach(function (k) { markRead(k, d.n); }); save(); return true;
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
    document.body.classList.toggle('emily-mode', S.profile === 'emily');
    if (!S.profile) { app.innerHTML = welcomeHTML(); return; }
    var lists = listsForProfile();
    if (!ui.tab || (ui.tab !== 'week' && lists.indexOf(ui.tab) < 0)) ui.tab = lists[0];
    var day = cur();
    var html = '<header class="top">' + topHTML(day, lists) + '</header><main>';
    if (!day) html += startHTML();
    else {
      if (day.date !== today() && S.keepDay !== today()) html += newDayBanner(day);
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
    var sub = day ? 'Day ' + day.n + ' · school day ' + dayInWeek(day) + ' of this week · ' + fmtDate(day.date) : 'Nothing recorded yet';
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
    return '<div class="banner"><p><b>Start your first school day.</b> The app counts school days, not dates, so travel and breaks never put you behind. Each week\'s work is on one page; finish it early and the next week starts.</p><button class="btn" data-act="startday">Start Day 1</button></div>';
  }
  // The Monday of the calendar week a date falls in, so a break that crosses a weekend can start a fresh week.
  function mondayOf(iso) { var p = String(iso || '').split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]); if (isNaN(d)) return ''; d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }
  function newCalWeek(day) { return !!day && mondayOf(day.date) !== mondayOf(today()); }
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
      Lp.items.forEach(function (li) { h += loopRowHTML(li, w, Lp, readonly); });
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
      if (o === 'poem:together') { var a = C.poets.emma.poems[ptr('tpoem_emma').i % C.poets.emma.poems.length].title, b = C.poets.emily.poems[ptr('tpoem_emily').i % C.poets.emily.poems.length].title; return a + ' · ' + b; }
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
    return '<div class="row' + (full ? ' done' : '') + '">' + labelPart(it, act) + boxes + (readonly ? '' : timerPart(it)) + '</div>';
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
    var extra = on ? '<span class="meta">Done on day ' + wd[li.id] + (S.narrWritten[w + ':' + li.id] ? ' · ✍️ written' : '') + '</span>' : '';
    var act = readonly ? 'disabled' : (li.open ? 'data-act="sheet" data-v="' + li.open + '"' : 'data-act="loopdone" data-v="' + li.id + '"');
    return '<div class="row' + (on ? ' done' : '') + '">' +
      (readonly ? '<span class="check">' + (on ? '✓' : '') + '</span>' : '<button class="check" data-act="loopdone" data-v="' + li.id + '" aria-pressed="' + on + '" aria-label="Done: ' + esc(li.label) + '">✓</button>') +
      labelPart(li, act, extra) +
      (!readonly && Lp.narration && on ? '<button class="btn small' + (S.narrWritten[w + ':' + li.id] ? '' : ' ghost') + '" data-act="written" data-v="' + li.id + '">' + (S.narrWritten[w + ':' + li.id] ? '✍️ Written' : 'Written?') + '</button>' : '') +
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
    }
    return { title: '', body: '' };
  }

  function poemCard(who, key, label) {
    var P = C.poets[who]; var p = ptr(key); var i = ((p.i % P.poems.length) + P.poems.length) % P.poems.length; var poem = P.poems[i];
    return '<div class="card" style="--who:var(--' + who + ')"><div class="kicker">' + esc(label || P.poet) + ' · poem ' + (i + 1) + ' of ' + P.poems.length + '</div><h3>' + esc(poem.title) + '</h3>' +
      '<div class="poem">' + esc(poem.text) + '</div><div class="nav" style="margin-top:12px"><button class="btn ghost small" data-act="ptr" data-k="' + key + '" data-d="-1">‹ Previous</button><span class="small muted">' + (p.readOn ? 'Read today ✓ · next poem tomorrow' : 'A new poem each school day') + '</span><button class="btn ghost small" data-act="ptr" data-k="' + key + '" data-d="1">Next ›</button></div></div>';
  }
  // Every poem of the term, with the ones already read ticked, and a way to pick the place again.
  function poemListHTML(who, key) {
    var P = C.poets[who]; var p = ptr(key); var len = P.poems.length; var ci = ((p.i % len) + len) % len; var log = p.log || {};
    var nRead = Object.keys(log).length;
    return '<details class="card"' + (ui.poemUpto === key || ui.poemListOpen === key ? ' open' : '') + '><summary style="cursor:pointer;font-weight:800" data-act="poemlist" data-k="' + key + '">All ' + len + ' poems · ' + nRead + ' read</summary><p class="small muted" style="margin:6px 0 8px">Tap a poem to make it today\'s poem. Ticks show the poems read, with the date.</p><ul class="list">' +
      P.poems.map(function (q, k) { return '<li class="' + (k === ci ? 'cur' : '') + '"><span>' + (log[k] ? '✓ ' : '') + '<b>' + (k + 1) + '. ' + esc(q.title) + '</b>' + (/^\d{4}-/.test(log[k] || '') ? ' <span class="small muted">' + esc(fmtDate(log[k])) + '</span>' : '') + '</span>' + (k === ci ? '<span class="small">Today</span>' : '<button class="btn ghost small" data-act="setptr" data-k="' + key + '" data-v="' + k + '">Read this</button>') + '</li>'; }).join('') +
      '</ul><div class="btns" style="margin-top:8px"><button class="btn ghost small" data-act="poemsupto" data-k="' + key + '">' + (ui.poemUpto === key ? 'Now tap the last poem she read' : 'Mark poems already read…') + '</button></div></details>';
  }
  function poemSheet(which, tickId) {
    if (which === 'together') {
      return { title: 'Poetry together', who: 'together', body: '<p class="small muted" style="margin:0">One poem from each girl\'s poet. If you read these together, the girls can tick Poetry on their own lists too.</p>' + poemCard('emma', 'tpoem_emma', 'For Emma · ' + C.poets.emma.poet) + poemCard('emily', 'tpoem_emily', 'For Emily · ' + C.poets.emily.poet) + '<div class="btns">' + tickButton(tickId, 'Poetry done', 'We read our poems') + '</div>' };
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
  function smythHTML(t) {
    var k = 0;
    return t.split(/\n\n+/).map(function (para) {
      if (/^§/.test(para)) return '<h4 class="sm-h">' + esc(para) + '</h4>';
      if (/^(NOTE|Questions for Lesson)/.test(para)) return '<h4 class="sm-h">' + esc(para) + '</h4>';
      if (/^(I|II|III|IV|V)$/.test(para)) return '<h4 class="sm-h">' + esc(para) + '</h4>';
      return '<p class="sp" data-act="bmks" data-v="' + (k++) + '">' + esc(para) + '</p>';
    }).join('');
  }
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
      var smyth = L.smyth ? '<div class="sm-text">' + smythHTML(L.smyth) + '</div>' : '<p class="small">Smyth’s notes for this lesson aren’t in the app yet. <a href="' + esc(T.url) + '" target="_blank" rel="noopener">Open them on AmblesideOnline ↗</a></p>';
      if (mode === 'three') body += '<div class="grid3"><div class="col"><div class="col-h">KJV</div>' + passage('en') + '</div><div class="col"><div class="col-h">和合本</div>' + passage('zh') + '</div><div class="col"><div class="col-h">Smyth’s notes</div>' + smyth + '</div></div>';
      else if (mode === 'both') body += '<div class="grid2"><div>' + passage('en') + '</div><div>' + passage('zh') + '</div></div>';
      else body += passage(mode);
      if (mode !== 'three' && L.smyth) body += '<details style="margin-top:12px"><summary><b>Smyth’s notes for this lesson</b></summary><div class="sm-text" style="max-height:none">' + smythHTML(L.smyth) + '</div></details>';
      body += '<div class="nav" style="margin-top:12px"><button class="btn ghost small" data-act="biblestep" data-v="' + T.id + '" data-d="-1">‹ Previous lesson</button><button class="btn small" data-act="biblestep" data-v="' + T.id + '" data-d="1">Lesson finished ›</button></div></div>';
    }
    body += '<div class="btns">' + tickButton(tickId, 'Bible done today', 'We read our Bible') + '</div><p class="small muted">' + esc(C.bible.source) + ' ' + esc(C.bible.smythNote || '') + ' ' + esc(C.bible.picNote || '') + ' ' + esc(C.bible.mapNote || '') + ' Chinese: 和合本 (Chinese Union Version).</p>';
    return { title: 'Bible', who: 'together', body: body, wide: true };
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
        '<div class="btns" style="margin-top:10px"><button class="btn small" data-act="recitepractise" data-v="' + r.id + '">Practised ✓</button><button class="btn ghost small" data-act="reciteknown" data-v="' + r.id + '">' + (st.known ? 'Remove star' : 'I know it by heart ⭐') + '</button></div></div>';
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
      '<div class="btns" style="margin-top:10px"><button class="btn small" data-act="recitepractise" data-v="' + r.id + '">Practised ✓</button><button class="btn ghost small" data-act="reciteknown" data-v="' + r.id + '">' + (st.known ? 'Remove star' : 'I know it by heart ⭐') + '</button></div></div>';
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
    return { title: 'TikTok dance', who: 'together', body: '<p class="small muted" style="margin:0">' + esc(T.note) + '</p>' + T.list.map(function (d) { return '<div class="card"><h3>' + esc(d.title) + '</h3><p class="small muted" style="margin:0">' + esc(d.by) + '</p><p style="margin:6px 0 0">' + esc(d.note) + '</p></div>'; }).join('') };
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
        audioSlot('music_' + i) +
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
  function videoSlot(id, bundled) {
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
        var h = '<p style="margin:0">' + esc(pp) + '</p>';
        photos.filter(function (ph) { return ph.after === pp.trim(); }).forEach(function (ph) {
          h += '<figure class="pic" style="margin:6px 0"><img src="' + esc(ph.img) + '" alt="' + esc(ph.caption) + '" loading="lazy" data-fallback="This photo could not load."><figcaption class="small" style="font-family:var(--f-body);margin-top:6px">' + esc(ph.caption) + ' <span class="muted">' + esc(ph.credit) + '</span></figcaption></figure>';
        });
        return h;
      }).join('') + '</div></div>';
      if (ch.local && ch.local.length) body += '<div class="card"><div class="kicker">Here in Singapore</div>' + ch.local.map(function (n) { return '<h3 style="font-size:18px;margin-top:10px">' + esc(n.title) + '</h3><p style="margin:0">' + esc(n.text) + '</p>'; }).join('') + (ch.refs ? '<p class="small muted" style="margin-top:10px">Sources: ' + esc(ch.refs.join('; ')) + '.</p>' : '') + '</div>';
    }
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
    toast: function (m) { toast(m); }
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
      '<details class="card"><summary style="cursor:pointer;font-weight:800">All ' + B.items.length + ' in this book · ' + nRead + ' read · jump to one</summary><ol class="list" style="margin-top:10px">' +
      B.items.map(function (it, k) { var r = !!rm[k]; return '<li class="' + (k === i ? 'cur' : '') + '"><span>' + (r ? '<b style="color:var(--who)">✓</b> ' : '') + (k + 1) + '. ' + esc(it.title) + '</span><span class="btns" style="flex:none"><button class="btn ghost small" data-act="bookread" data-k="' + key + '" data-v="' + k + '" aria-pressed="' + r + '">' + (r ? 'Unmark' : 'Mark read') + '</button><button class="btn ghost small" data-act="bookgo" data-k="' + key + '" data-v="' + k + '">' + (k === i ? 'Reading' : 'Go') + '</button></span></li>'; }).join('') +
      '</ol></details>';
  }
  function englishBookBody(key) {
    var B = BK[key]; var i = bookIndex(key); var it = B.items[i]; var r = readMap(key)[i];
    var body = '<div class="card"><div class="kicker">' + esc(B.book) + (B.author ? ' · ' + esc(B.author) : '') + ' · ' + esc(B.unit) + ' ' + (i + 1) + ' of ' + B.items.length + (r ? ' · ✓ read' : '') + '</div><h3>' + esc(it.title) + '</h3>' +
      '<div class="bible-text" style="display:flex;flex-direction:column;gap:10px">' + it.blocks.map(blockHTML).join('') + '</div></div>';
    return body + bookNav(key, B, i) + '<p class="small muted">' + esc(B.source) + '</p>';
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
        (c.p < P.length - 1 ? '<p class="small muted" style="margin:10px 0 0">To be continued in part ' + (c.p + 2) + '.</p>' : '<p class="small muted" style="margin:10px 0 0">The end of the tale.</p>') + '</div>' +
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
    return body + bookNav('zh', B, i) + '<p class="small muted">' + esc(B.source) + '</p>';
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
      h += row('Together: Emma\'s poem', 'tpoem_emma', C.poets.emma.poems.map(function (p) { return p.title; }));
      h += row('Together: Emily\'s poem', 'tpoem_emily', C.poets.emily.poems.map(function (p) { return p.title; }));
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
  var POEM_TICKS = { e_poetry: ['poem_emma'], m_poetry: ['poem_emily'], t_poetry: ['tpoem_emma', 'tpoem_emily'] };

  // ---------- Emily's reading lessons (Charlotte Mason: reading at sight, then by sound, then the whole poem) ----------
  var RD = window.READING || { poems: [], proper: [], method: { steps: [], notes: [] } };
  var RD_PROPER = {}; (RD.proper || []).forEach(function (w) { RD_PROPER[w] = 1; });
  var RD_TICK = 'm_reading';
  // Whose lessons are open: Emily learns every word of each poem; Emma, who reads fluently, builds only the longer, less common words.
  var RDW = 'emily';
  var RD_EMMA = (function () { var E = RD.emma || { list: [], poems: [] }; var by = {}; RD.poems.concat(E.poems || []).forEach(function (p) { by[p.id] = p; }); return (E.list || []).map(function (id) { return by[id]; }).filter(Boolean); })();
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
      h += '<p class="rd-say">' + (s.again ? 'A word to look at again. ' : '') + 'Say the word. Emily looks at it until she would know it again.</p>' + rdBig(w) +
        '<div class="btns rd-go"><button class="btn" data-act="rd-ph" data-v="build">I know it by heart — hide it</button><button class="btn ghost small" data-act="rd-knew">She knew this one already</button></div>';
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
      h += '<p class="rd-say">' + (done ? 'She made it from memory.' : 'Now Emily makes the word with the letters.') + '</p>' +
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
    return '<p class="rd-say">Point to each word for Emily to read' + (ui.rd.kind === 'sound' ? ' — a quick warm-up before the word families.' : '.') + '</p>' +
      '<div class="seg" role="group" style="align-self:flex-start">' + [['down', 'Down'], ['up', 'Up'], ['mixed', 'Mixed']].map(function (o) { return '<button data-act="rd-col" data-v="' + o[0] + '" aria-pressed="' + (c === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>' +
      '<div class="rd-col">' + words.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div>' +
      '<div class="btns rd-go"><button class="btn" data-act="rd-next">She read them all ›</button></div>';
  }
  function rdLinesStep(s, p) {
    var lines = rdLines(p);
    var usable = lines.map(function (l, i) { return i; }).filter(function (i) { return lines[i].toks.some(function (x) { return rdKnows(x.k); }); });
    if (!usable.length) return '<p class="rd-say">No line has a word she knows yet.</p><div class="btns rd-go"><button class="btn" data-act="rd-next">Go on ›</button></div>';
    var pos = Math.min(s.li, usable.length - 1); var L = lines[usable[pos]];
    if (!s.x || s.x.line !== usable[pos]) {
      var slots = L.toks.map(function (x) { return { t: x.t, k: x.k, known: rdKnows(x.k), f: !rdKnows(x.k) }; });
      s.x = { line: usable[pos], slots: slots, tray: rdShuffle(slots.map(function (x, i) { return x.known ? { t: x.t, i: i, used: false } : null; }).filter(Boolean)) };
    }
    var X = s.x; var done = X.slots.every(function (x) { return x.f; });
    var hasCounter = X.slots.some(function (x) { return !x.known; });
    var h = '<div class="kicker">Line ' + (pos + 1) + ' of ' + usable.length + '</div>' +
      '<details class="rd-mum"><summary>Mum: the line to say</summary><p>' + esc(L.raw) + '</p></details>' +
      '<p class="rd-say">' + (done ? 'Now she reads it to you.' : 'Say the line. Emily lays out the words in order.' + (hasCounter ? ' A counter ● stands for a word she will learn soon.' : '')) + '</p>' +
      '<div class="rd-strip">' + X.slots.map(function (x) { return x.f ? (x.known ? '<span class="rd-card f">' + esc(x.t) + '</span>' : '<span class="rd-counter" title="A word to learn soon">●</span>') : '<span class="rd-card empty"></span>'; }).join('') + '</div>';
    if (!done) h += '<div class="rd-cards">' + X.tray.map(function (c, j) { return '<button class="rd-card"' + (c.used ? ' disabled' : '') + ' data-act="rd-place" data-v="' + j + '">' + esc(c.t) + '</button>'; }).join('') + '</div>';
    else h += '<div class="btns rd-go">' + (pos < usable.length - 1 ? '<button class="btn" data-act="rd-line">Next line ›</button>' : '<button class="btn" data-act="rd-next">' + (s.all ? 'See the poem ›' : 'Finish ›') + '</button>') + '</div>';
    if (!done && pos < usable.length - 1) h += '<div class="btns"><button class="btn ghost small" data-act="rd-line">Skip this line</button></div>';
    if (!done && pos === usable.length - 1) h += '<div class="btns"><button class="btn ghost small" data-act="rd-next">Enough lines for today</button></div>';
    return h;
  }
  function rdFamStep(s, p) {
    var F = p.fam[s.f]; var onset = F.from.slice(0, F.from.length - F.rime.length);
    var h = '<p class="rd-say">' + (!s.cut ? 'Emily reads “' + esc(F.from) + '”. Say it slowly. What is left when the beginning is taken away?' : 'Put a new beginning on “' + esc(F.rime) + '” and read the new word. Talk about what it means.') + '</p>';
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
    return '<p class="rd-say">Here is the poem she has been learning. She reads it to you, clearly and beautifully.</p>' +
      '<div class="card"><div class="kicker">' + esc(p.by) + '</div><h3>' + esc(p.title) + '</h3><div class="poem rd-poem">' + esc(p.text) + '</div></div>' +
      '<div class="card"><h3 style="font-size:18px">Her reading</h3>' + rdRecButton(id) + audioSlot(id) + '</div>' +
      '<div class="btns rd-go"><button class="btn" data-act="rd-poemdone">She read the whole poem ✓</button></div>';
  }
  var rdRec = null;
  function rdRecButton(id) {
    if (!(navigator.mediaDevices && window.MediaRecorder)) return '';
    var on = rdRec && rdRec.id === id;
    return '<div class="btns"><button class="btn' + (on ? '' : ' ghost') + '" data-act="rd-rec" data-v="' + id + '">' + (on ? '■ Stop recording' : '🎙 Record her reading') + '</button></div>';
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
    if (L.kind === 'poem' && rdState().done[p.id]) h += '<p>She has read <b>' + esc(p.title) + '</b>. The next poem starts tomorrow.</p>';
    h += '<p class="small muted">' + rdKnownCount() + ' words in her word book so far.</p></div>';
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
    if (RDW === 'emily' && !rdKnownCount() && !ui.rdNoPlace) return '<div class="card"><h3>Before the first lesson</h3><p style="margin:0 0 10px">If Emily can already read some words, a quick placement check saves her learning them again.</p><div class="btns"><button class="btn" data-act="rd-view" data-v="place">Do the placement check</button><button class="btn ghost" data-act="rd-noplace">Start lessons from the beginning</button></div></div>';
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
    else if (s.t === 'warm') body = '<p class="rd-say">Warm-up: point to each word for her to read. Tap any word she has forgotten; it comes back to be learnt again next lesson.</p><div class="rd-cards">' + s.words.map(function (x) { var ag = !!rdState().again[x]; return '<button class="rd-card' + (ag ? ' ag' : '') + '" data-act="rd-againw" data-v="' + esc(x) + '" aria-pressed="' + ag + '">' + esc(x) + '</button>'; }).join('') + '</div><div class="btns rd-go"><button class="btn" data-act="rd-next">On to the new words ›</button></div>';
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
    var h = '<p style="margin:0"><b>' + keys.length + '</b> words she can read. ' + (ui.rdManage ? 'Tap a word to take it out of her book altogether.' : 'Tap a word she has forgotten to learn it again next lesson.') + '</p>';
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
    h += '<p class="small muted">Filled words she reads at sight; outlined words she made by sound in the word families; dashed words are to be looked at again.</p>';
    h += '<div class="btns"><button class="btn ghost small" data-act="rd-manage">' + (ui.rdManage ? 'Done' : 'Take out a word') + '</button></div>';
    return h;
  }
  function rdPoemsView() {
    var r = rdState(); var ci = rdIdx();
    return '<div class="card"><ul class="list">' + rdPoems().map(function (p, i) {
      var w = rdWords(p), k = w.filter(rdKnows).length; var fd = (p.fam || []).filter(function (f, j) { return r.fam[p.id + ':' + j]; }).length;
      var st = r.done[p.id] ? '✓ read' : k + '/' + w.length + ' words · ' + fd + '/' + (p.fam || []).length + ' families';
      return '<li class="' + (i === ci ? 'cur' : '') + '"><span><b>' + (i + 1) + '. ' + esc(p.title) + '</b> <span class="small muted">' + esc(p.by) + ' · ' + st + '</span></span>' + '<span class="btns" style="flex:none">' + (r.done[p.id] ? '<button class="btn ghost small" data-act="rd-again" data-v="' + i + '">Read again</button>' : (i === ci ? '<span class="small">Learning now</span>' : '<button class="btn ghost small" data-act="rd-go" data-v="' + i + '">Learn next</button>') + '<button class="btn ghost small" data-act="rd-knowpoem" data-v="' + i + '">' + (ui.rdKnowAsk === i ? 'Tap again to confirm' : 'She knows it') + '</button>') + '</span></li>';
    }).join('') + '</ul></div>' +
      '<p class="small muted" style="margin:0">' + (RDW === 'emma' ? 'Emma builds the longer, less common words of each poem; the short everyday words count as known.' : 'Poems run from the most common words to the least.') + ' ' + (RDW === 'emma' ? '' : 'If she can already read a poem, tap “She knows it”') + ': ' + (RDW === 'emma' ? '' : 'its words go into her word book and it is marked read.') + '</p>' +
      '<div class="card"><h3 style="font-size:18px">New words in one lesson</h3><div class="seg" role="group">' + [3, 5, 8, 10].map(function (n) { var on = (rdPer()) === n; return '<button data-act="rd-per" data-v="' + n + '" aria-pressed="' + on + '">' + n + '</button>'; }).join('') + '</div><p class="small muted" style="margin:6px 0 0">Mason aims at about ten a day. Fewer is fine while Emily is beginning.</p></div>' +
      '<p class="small muted">Poem texts: ' + esc(Array.from(new Set(rdPoems().map(function (p) { return p.src.split('. ')[0].split(', Project')[0]; }))).join('; ')) + '.</p>';
  }
  function rdRecordView() {
    var r = rdState(); var ts = Object.keys(r.log).sort(function (a, b) { return b - a; });
    if (!ts.length) return '<p class="muted">Lessons will be listed here once she finishes one.</p>';
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
    if (!P) return '<div class="card"><h3>Placement check</h3><p style="margin:0 0 8px">Show Emily the common words one at a time, easiest first. Tap <b>She read it</b> only if she reads it straight away without sounding it out. The check stops by itself when a level gets too hard.</p><p class="small muted" style="margin:0 0 10px">Words she knows go into her word book, so lessons skip them. About 5 to 10 minutes; you can stop at any time and keep what she has done.</p><div class="btns"><button class="btn" data-act="rd-pstart">Start the check</button></div></div>';
    while (P.l < P.lv.length && P.i >= P.lv[P.l].length) { P.l++; P.i = 0; P.miss = 0; }
    if (P.over || P.l >= P.lv.length) {
      var lvlName = P.l < RD.common.levels.length ? RD.common.levels[P.l].name : '';
      return '<div class="rd-done"><div class="rd-big">Check done</div><p>She read <b>' + P.got.length + '</b> common words' + (P.not.length ? ' and has <b>' + P.not.length + '</b> to learn' : '') + '.' + (P.over && lvlName ? ' The ' + esc(lvlName.toLowerCase()) + ' words are where she is now.' : '') + '</p>' +
        (P.not.length ? '<p class="small">Not yet: ' + esc(P.not.join(', ')) + '</p>' : '') + '<p class="small muted">The words she read are in her word book. Her lessons will teach the rest as they come up in the poems.</p></div>' +
        '<div class="btns rd-go"><button class="btn" data-act="rd-view" data-v="today">Back to today</button><button class="btn ghost small" data-act="rd-pdone">Close the check</button></div>';
    }
    var L = RD.common.levels[P.l], w = P.lv[P.l][P.i];
    var left = P.lv.slice(P.l).reduce(function (t, a, j) { return t + a.length - (j === 0 ? P.i : 0); }, 0);
    return '<div class="rd-stage"><div class="kicker">' + esc(L.name) + ' · ' + left + ' words left to check</div>' + rdBig(w) +
      '<div class="btns rd-go"><button class="btn" data-act="rd-pans" data-v="1">She read it</button><button class="btn ghost" data-act="rd-pans" data-v="0">Not yet</button></div></div>' +
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

  // ---------- Maths: facts trainer, daily practice by syllabus topic, PSLE heuristics (questions come from math.js) ----------
  var MX = window.SDMath || { topics: [], heuristics: [], facts: [] };
  var MT_WHO = 'emma', MT_TICK = 'e_mathtr';
  function mtState() {
    var all = S.mt || (S.mt = {}); var m = all[MT_WHO] || (all[MT_WHO] = {});
    if (!m.facts) m.facts = { best: {}, miss: {} }; if (!m.facts.best) m.facts.best = {}; if (!m.facts.miss) m.facts.miss = {};
    if (!m.topics) m.topics = {}; if (!m.heur) m.heur = {}; if (!m.log) m.log = {}; if (!m.place) m.place = {};
    return m;
  }
  function mtTopic(id) { for (var i = 0; i < MX.topics.length; i++) if (MX.topics[i].id === id) return MX.topics[i]; return null; }
  function mtHeur(id) { for (var i = 0; i < MX.heuristics.length; i++) if (MX.heuristics[i].id === id) return MX.heuristics[i]; return null; }
  function mtRec(kind, id) { var m = mtState(); var bag = kind === 'h' ? m.heur : m.topics; return bag[id] || (bag[id] = { h: [], m: false }); }
  function mtMastered(id) { return !!(mtState().topics[id] || {}).m; }
  // Mastered after five right in a row; two wrong in a row on a mastered topic sends it back to learning.
  function mtScore(kind, id, ok) {
    var r = mtRec(kind, id); r.h.push(ok ? 1 : 0); if (r.h.length > 12) r.h = r.h.slice(-12); r.seen = today();
    if (kind === 't') { var last = r.h.slice(-5); if (last.length === 5 && last.every(function (x) { return x; })) r.m = true; var two = r.h.slice(-2); if (r.m && two.length === 2 && !two[0] && !two[1]) r.m = false; }
  }
  function mtAcc(r) { if (!r || !r.h.length) return null; return Math.round(100 * r.h.reduce(function (s, x) { return s + x; }, 0) / r.h.length); }
  function mtLearning() { return MX.topics.filter(function (t) { return !mtMastered(t.id); }); }
  function mtMake(kind, id) { var g = kind === 'h' ? mtHeur(id) : mtTopic(id); return { kind: kind, id: id, Q: g.gen() }; }

  // The daily set: the next two topics still to master, a little review, and two heuristics problems.
  function mtTodaySet() {
    var m = mtState(); var items = [];
    var learn = mtLearning().slice(0, 2);
    var mastered = MX.topics.filter(function (t) { return mtMastered(t.id); }).sort(function (a, b) { return String((m.topics[a.id] || {}).seen || '') < String((m.topics[b.id] || {}).seen || '') ? -1 : 1; });
    var nLearn = mastered.length ? 6 : 8;
    for (var i = 0; i < nLearn && learn.length; i++) items.push(mtMake('t', learn[i % learn.length].id));
    mastered.slice(0, 2).forEach(function (t) { items.push(mtMake('t', t.id)); });
    var hs = MX.heuristics.slice().sort(function (a, b) { return ((m.heur[a.id] || { h: [] }).h.length) - ((m.heur[b.id] || { h: [] }).h.length); });
    hs.slice(0, 2).forEach(function (h) { items.push(mtMake('h', h.id)); });
    return items;
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
    return '<div class="seg" role="group" aria-label="Maths">' + [['today', 'Today'], ['facts', 'Facts'], ['topics', 'Topics'], ['heur', 'Heuristics'], ['record', 'Record']].map(function (o) { return '<button data-act="mt-view" data-v="' + o[0] + '" aria-pressed="' + (v === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>';
  }
  function mtRunView() {
    var R = ui.mt.run;
    if (R.kind === 'facts') {
      var M = mtFactMode(R.mode);
      if (R.over) return '<div class="rd-done"><div class="rd-big">' + R.score + '</div><p>' + esc(M.name) + ' in 60 seconds' + (R.newBest ? ' — a new best! 🎉' : ' · best ' + (mtState().facts.best[R.mode] || 0)) + '</p>' + (R.wrong.length ? '<p class="small">To practise: ' + esc(R.wrong.join(', ')) + '</p><p class="small muted">These come back more often until she gets them right.</p>' : '') + '</div><div class="btns rd-go"><button class="btn" data-act="mt-facts" data-v="' + R.mode + '">Again</button><button class="btn ghost" data-act="mt-view" data-v="facts">Done</button></div>';
      return '<div class="mt-bar"><span>' + esc(M.name) + '</span><b id="mt-score">' + R.score + '</b><span id="mt-clock">' + Math.max(0, Math.ceil((R.end - Date.now()) / 1000)) + 's</span></div>' +
        '<div class="mt-fact"><span id="mt-q">' + esc(R.q[0]) + ' =</span> <span id="mt-typed" class="mt-typed"> </span></div>' + mtKeypad(['7', '8', '9', '4', '5', '6', '1', '2', '3', '⌫', '0'], 'mt-fkey') +
        '<div class="btns" style="justify-content:flex-end"><button class="btn ghost small" data-act="mt-stopfacts">Stop</button></div>';
    }
    if (R.i >= R.items.length) return mtSetEnd();
    var it = R.items[R.i], Q = it.Q; var g = it.kind === 'h' ? mtHeur(it.id) : mtTopic(it.id);
    var tname = it.kind === 'h' ? 'Heuristic: ' + g.name : 'P' + g.lv + ' ' + g.name;
    var head = '<div class="kicker">' + esc(R.label) + ' · ' + (R.i + 1) + ' of ' + R.items.length + (R.label === g.name ? '' : ' · ' + esc(tname)) + '</div>';
    var body = '<div class="mt-q">' + esc(Q.q) + '</div>';
    var nextBtn = '<button class="btn" data-act="mt-next">' + (R.i + 1 < R.items.length ? 'Next question ›' : 'Finish ›') + '</button>';
    var asks = mtAsks(Q);
    // Finished with this question.
    if (R.fb) {
      var fb = R.fb;
      if (fb.ok) {
        body += '<div class="mt-fb ok"><b>✓ ' + (R.helped ? 'Yes — you worked it out.' : 'Right!') + '</b></div>';
        if (R.kind !== 'place') body += '<p class="mt-steptxt tell">' + esc(Q.walk ? 'Tell it back: explain to Mum, in your own words, how you worked it out. What did your model show?' : 'Tell Mum how you worked it out.') + '</p>';
        var lastVis = (Q.walk || []).filter(function (s) { return s.m || s.tab || s.flow; }).pop();
        if (lastVis && R.kind !== 'place') body += R.cmp ? '<div class="card mt-walk"><div class="kicker">One model for it — how does yours compare?</div>' + MX.stepHTML(lastVis) + '</div>' : '<div class="btns"><button class="btn ghost small" data-act="mt-cmp">Compare with a model</button></div>';
      } else {
        body += '<div class="mt-fb no"><b>Let\'s look at it together.</b> The answer is <b>' + esc(Q.show + (Q.unit ? ' ' + Q.unit : '')) + '</b>.</div>';
        if (Q.walk && R.kind !== 'place') body += '<div class="card mt-walk"><div class="kicker">The thinking, step by step</div><ol class="mt-done">' + asks.map(function (s) { return '<li><b>' + esc(s.ask) + '</b><br>' + esc(s.t) + '</li>'; }).join('') + '</ol>' + (function () { var v = (Q.walk || []).filter(function (s) { return s.m || s.tab || s.flow; }).pop(); return v ? MX.stepHTML(v) : ''; })() + '</div><p class="mt-steptxt tell">Read the steps through, then tell Mum in your own words why the answer is ' + esc(Q.show) + '.</p>';
        else if (Q.steps && R.kind !== 'place') body += '<div class="card mt-steps"><ol>' + Q.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>';
      }
      return head + body + '<div class="btns rd-go">' + nextBtn + '</div>';
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
      return head + body + h2 + mtInput(st, 'mt-gchoose');
    }
    if (R.guided && asks.length) { var lv = null; asks.forEach(function (s) { if (s.m || s.tab || s.flow) lv = s; }); body += '<div class="card mt-walk"><div class="kicker">What you have worked out</div><ol class="mt-done">' + asks.map(function (s) { return '<li>' + esc(s.t) + '</li>'; }).join('') + '</ol>' + (lv ? MX.stepHTML(lv) : '') + '</div>'; }
    if (R.msg) body += '<p class="mt-msg">' + esc(R.msg) + '</p>';
    if (asks.length && R.kind !== 'place' && !R.guided) body += '<div class="btns"><button class="btn ghost small" data-act="mt-guide">🤔 Help me think it through</button></div>' + (it.kind === 'h' ? '<p class="small muted" style="margin:0">Try drawing a model on paper first.</p>' : '');
    return head + body + mtInput(Q, 'mt-choose') + '<div class="btns" style="justify-content:flex-end"><button class="btn ghost small" data-act="mt-quit">Stop here</button></div>';
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
      (R.kind === 'place' ? '<p>' + newly + ' of the P' + R.lv + ' topics are marked as known. The rest join her practice, in syllabus order.</p>' : '<p>' + (right === R.res.length ? 'All right — well done!' : 'Well worked.') + '</p>') +
      (R.kind === 'today' ? '<p class="small muted">' + (R.full ? 'Maths practice is ticked for today.' : 'Finish a whole set to tick Maths practice for today.') + '</p>' : '') + '</div><div class="btns rd-go"><button class="btn" data-act="mt-view" data-v="' + (R.kind === 'place' ? 'topics' : 'today') + '">Done</button></div>';
  }
  function mtTodayView() {
    var m = mtState(); var learn = mtLearning(); var nPlaced = Object.keys(m.place).length;
    var h = '';
    if (!nPlaced && !Object.keys(m.log).length) h += '<div class="card"><h3>Start with a placement check</h3><p style="margin:0 0 8px">One question on each topic of a level. Topics she gets right twice are marked as known, so practice starts where her gaps are. Start with P3 and go up while it is going well.</p><div class="btns">' + [3, 4, 5, 6].map(function (lv) { return '<button class="btn' + (lv === 3 ? '' : ' ghost') + ' small" data-act="mt-place" data-v="' + lv + '">P' + lv + ' check</button>'; }).join('') + '</div></div>';
    var mastered = MX.topics.length - learn.length;
    h += '<div class="card"><div class="kicker">PSLE syllabus (Standard) · ' + mastered + ' of ' + MX.topics.length + ' topics mastered</div><div class="rd-dots" aria-hidden="true">' + MX.topics.map(function (t) { return '<i class="' + (mtMastered(t.id) ? 'f' : '') + '"></i>'; }).join('') + '</div>' +
      (learn.length ? '<p style="margin:6px 0 0">Learning now: <b>P' + learn[0].lv + ' ' + esc(learn[0].name) + '</b>' + (learn[1] ? ' and <b>P' + learn[1].lv + ' ' + esc(learn[1].name) + '</b>' : '') + '.</p>' : '<p style="margin:6px 0 0">Every topic is mastered — keep reviewing.</p>') + '</div>';
    h += '<div class="btns rd-go"><button class="btn" data-act="mt-today">' + (doneToday(MT_TICK) ? 'Do another set' : "Start today's set (10 questions)") + '</button><button class="btn ghost" data-act="mt-facts" data-v="mix">1-minute facts warm-up</button></div>';
    h += '<p class="small muted" style="margin:0">Each set: six questions on the topics she is learning, two to review mastered ones, and two heuristics problems with the method shown. A topic counts as mastered after five right in a row.</p>';
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
    var m = mtState();
    return '<p style="margin:0">Word problems for each way of thinking PSLE asks for. After each answer the working is shown.</p><div class="card"><ul class="list">' + MX.heuristics.map(function (x) { var r = m.heur[x.id]; var acc = mtAcc(r); return '<li><span><b>' + esc(x.name) + '</b> <span class="small muted">' + (r && r.h.length ? r.h.length + ' done · ' + acc + '% right' : 'not tried yet') + '</span></span><button class="btn ghost small" data-act="mt-heur" data-v="' + x.id + '">3 problems</button></li>'; }).join('') + '</ul></div>' +
      '<p class="small muted">The methods are the ones Singapore schools teach for PSLE: draw a model, systematic list, before and after, look for a pattern, guess and check, supposition, work backwards, and algebra.</p>';
  }
  function mtRecordView() {
    var m = mtState(); var ts = Object.keys(m.log).sort(function (a, b) { return b - a; });
    if (!ts.length) return '<p class="muted">Sessions will be listed here.</p>';
    return '<div class="card"><ul class="list">' + ts.slice(0, 120).map(function (t) { var e = m.log[t];
      var what = e.k === 'facts' ? 'Facts · ' + esc(mtFactMode(e.mode).name) + ': ' + e.score + ' in a minute' : esc(e.label || e.k) + ': ' + e.score + '/' + e.total;
      return '<li style="display:block"><b>' + esc(fmtDate(e.d)) + (e.n ? ' · Day ' + e.n : '') + '</b> — ' + what + '</li>'; }).join('') + '</ul></div>';
  }
  function mtPeek(who) { var keep = MT_WHO; MT_WHO = who; try { var l = mtLearning(); return l.length ? 'Learning: ' + l[0].name : 'All topics mastered'; } finally { MT_WHO = keep; } }
  function mtSheet(tickId, who) {
    MT_WHO = who || 'emma'; MT_TICK = tickId || 'e_mathtr'; ui.mt = ui.mt || {};
    var v = ui.mt.view || 'today'; var body;
    if (ui.mt.run) body = '<div class="rd-stage">' + mtRunView() + '</div>';
    else body = mtTabs(v) + (v === 'facts' ? mtFactsView() : v === 'topics' ? mtTopicsView() : v === 'heur' ? mtHeurView() : v === 'record' ? mtRecordView() : mtTodayView());
    return { title: 'Maths', who: MT_WHO, body: body };
  }
  window.__mtAns = function () { var R = ui.mt && ui.mt.run; if (!R || !R.items) return ''; var Q = R.items[R.i].Q; if (R.phase === 'guide') { var st = mtAsks(Q)[R.gi]; return st.show; } return Q.ratio ? Q.ratio.join(':') : Q.choices || Q.time ? Q.a : Q.show; };
  // A question is right for mastery only if she got it first time without help.
  function mtFinish(ok) {
    var R = ui.mt.run; var it = R.items[R.i]; R.res[R.i] = ok && !R.helped && !R.att; R.fb = { ok: ok };
    if (R.kind === 'place' && it.kind === 't') {
      if (it.second && ok && !R.att) { var rec = mtRec('t', it.id); rec.h = [1, 1, 1, 1, 1]; rec.m = true; rec.seen = today(); }
      else mtScore('t', it.id, R.res[R.i]);
    } else mtScore(it.kind, it.id, R.res[R.i]);
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
      case 'mt-heur': var hh = mtHeur(v); mtStartSet('heur', [0, 1, 2].map(function () { return mtMake('h', v); }), hh.name); refreshSheet(true); break;
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
      case 'mt-gnext':
        var asks3 = mtAsks(R.items[R.i].Q);
        R.gi++; R.gfb = null; R.gtries = 0; R.ghint = false; R.typed = '';
        if (R.gi >= asks3.length) { R.phase = 'main'; R.msg = 'Now answer the problem.'; }
        refreshSheet(true); break;
      case 'mt-cmp': R.cmp = true; refreshSheet(); break;
      case 'mt-next': R.i++; R.typed = ''; R.fb = null; R.msg = null; R.phase = 'main'; R.helped = false; R.guided = false; R.att = 0; R.cmp = false; refreshSheet(true); break;
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
  document.addEventListener('click', function (e) { if (e.target.closest('.scrim')) handle(e); });
  document.addEventListener('change', function (e) {
    var el = e.target;
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
      case 'sheet': if (v === 'settings' && hasPin('mum')) { askPin('mum', 'check', function () { openSheet('settings'); }); break; } openSheet(v, { tick: el.getAttribute('data-tick') }); break;
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
      case 'auddel': vdel(v); if (aurls[v]) { URL.revokeObjectURL(aurls[v]); delete aurls[v]; } refreshSheet(); break;
      case 'wordsedit': ui.wordsEdit = v || null; refreshSheet(); break;
      case 'wordssave': var ta = document.getElementById('mywords'); (S.lyrics = S.lyrics || {})[v] = ta ? ta.value.trim() : ''; save(); ui.wordsEdit = null; toast('Words saved'); refreshSheet(); break;
      case 'bibletrack': ui.bibleTrack = v; refreshSheet(); break;
      case 'biblelang': ui.bibleLang = v; refreshSheet(); break;
      case 'bmkv': bmkSet('v', v); applyBmk(document.querySelector('.sheet-body')); break;
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
      case 'bookread': (function () { var m = readMap(el.getAttribute('data-k')); if (m[v]) delete m[v]; else m[v] = 1; save(); refreshSheet(); render(); })(); break;
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
