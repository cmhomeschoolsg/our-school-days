/* Our School Days: sync between devices through Firebase (Firestore + Email/Password sign-in).
   The app keeps its own copy of everything in this browser and works offline.
   Each piece of progress (a tick, a bookmark, a pointer) is stored as one small "leaf" with a time stamp;
   when two devices change the same leaf, the later change wins. Different leaves never overwrite each other. */
import { initializeApp } from './vendor/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut } from './vendor/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, onSnapshot } from './vendor/firebase-firestore.js';

const CONFIG = {
  apiKey: 'AIzaSyB7XLBAxR-FWeVZ94fArGyUwwASYSH_tGc',
  authDomain: 'our-school-days.firebaseapp.com',
  projectId: 'our-school-days',
  storageBucket: 'our-school-days.firebasestorage.app',
  messagingSenderId: '223493349526',
  appId: '1:223493349526:web:e0ef7a5f9aa6a92793e2b7'
};
// Things that belong to this device only and are never shared.
const LOCAL_ONLY = { profile: 1, keepDay: 1, v: 1, craftBrushV2: 1, craftSloydV2: 1 };
const MK = '~';                  // marker leaf: "this container exists"
const LS_META = 'nfam-sync-meta', LS_FLAT = 'nfam-sync-flat', LS_PEND = 'nfam-sync-pending', LS_DEV = 'nfam-sync-device', LS_EMAIL = 'nfam-sync-email', LS_UID = 'nfam-sync-uid';

const SD = window.SD;
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
let device = ls.get(LS_DEV, null);
if (!device) { device = Math.random().toString(36).slice(2, 10); ls.set(LS_DEV, device); }

let meta = ls.get(LS_META, {});      // leaf key -> {t, d, x?}
let flatPrev = ls.get(LS_FLAT, null); // leaf key -> json value as last seen
let pending = ls.get(LS_PEND, {});   // leaf keys waiting to be pushed
let user = null, error = '', online = navigator.onLine, last = 0, unsub = null, timer = null, applying = false;
let available = true, note = '';

// ---------- flatten the app state into leaves ----------
function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }
// School days are stored by their day number (days/n5/...), not by position, so devices line up by day.
function flatten(S) {
  const out = {};
  function walk(v, path) {
    if (isObj(v)) {
      const keys = Object.keys(v);
      if (!path.length) {
        keys.forEach(k => {
          if (LOCAL_ONLY[k]) return;
          if (k === 'days' && Array.isArray(v.days)) { out[JSON.stringify(['days', MK + 'a'])] = '1'; v.days.forEach(d => { if (d && d.n != null) walk(d, ['days', 'n' + d.n]); }); }
          else walk(v[k], [k]);
        });
        return;
      }
      out[JSON.stringify(path.concat(MK))] = '1';
      keys.forEach(k => walk(v[k], path.concat(k)));
    } else if (Array.isArray(v) && !v.length) {
      out[JSON.stringify(path.concat(MK + 'a'))] = '1';
    } else if (Array.isArray(v) && v.every(isObj)) {
      out[JSON.stringify(path.concat(MK + 'a'))] = '1';
      v.forEach((x, i) => walk(x, path.concat(i)));
    } else if (v !== undefined) {
      out[JSON.stringify(path)] = JSON.stringify(v);
    }
  }
  walk(S, []);
  return out;
}
// Turn days/n5/... into the real position of day 5 in the days list (adding the day if asked).
function realPath(S, path, create) {
  if (path[0] !== 'days' || typeof path[1] !== 'string' || path[1].charAt(0) !== 'n') return path;
  const n = +path[1].slice(1); if (!Array.isArray(S.days)) S.days = [];
  let i = S.days.findIndex(d => d && d.n === n);
  if (i < 0) { if (!create) return null; S.days.push({ n: n, ticks: {}, picks: {} }); i = S.days.length - 1; }
  return ['days', i].concat(path.slice(2));
}
function shardOf(path) {
  const top = path[0];
  if (top === 'days') return 'days_' + Math.floor((+String(path[1] || '').slice(1) || 0) / 20);
  if ((top === 'weeks' || top === 'wk') && path.length > 1) return top + '_' + String(path[1]).replace(/[^\w-]/g, '_');
  return 'k_' + String(top).replace(/[^\w-]/g, '_');
}
function setAt(S, path, value) {
  let o = S;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i], nextIsIndex = typeof path[i + 1] === 'number';
    if (o[k] == null || typeof o[k] !== 'object') o[k] = nextIsIndex ? [] : {};
    o = o[k];
  }
  o[path[path.length - 1]] = value;
}
function ensureAt(S, path, arr) {
  let o = S;
  for (let i = 0; i < path.length; i++) {
    const k = path[i], isLast = i === path.length - 1, nextIsIndex = !isLast && typeof path[i + 1] === 'number';
    if (o[k] == null || typeof o[k] !== 'object') o[k] = isLast ? (arr ? [] : {}) : (nextIsIndex ? [] : {});
    o = o[k];
  }
}
function deleteAt(S, path) {
  let o = S;
  for (let i = 0; i < path.length - 1; i++) { o = o[path[i]]; if (o == null || typeof o !== 'object') return; }
  const k = path[path.length - 1];
  if (Array.isArray(o) && typeof k === 'number') o[k] = undefined; else delete o[k];
}
function tidy(S) {
  if (Array.isArray(S.days)) S.days = S.days.filter(d => d && d.n != null).sort((a, b) => a.n - b.n);
  if (S.days) S.days.forEach(d => { d.ticks = d.ticks || {}; d.picks = d.picks || {}; });
  (function compact(o) {   // remove gaps left in lists when an entry was deleted on another device
    if (!o || typeof o !== 'object') return;
    Object.keys(o).forEach(k => {
      const v = o[k];
      if (Array.isArray(v) && v.some(x => x === undefined || x === null) && v.some(isObj)) o[k] = v.filter(x => x != null);
      compact(o[k]);
    });
  })(S);
}
function newer(a, b) { return !b || a.t > b.t || (a.t === b.t && String(a.d) > String(b.d)); }

// ---------- local changes ----------
function scan() {
  if (applying) return;
  const S = SD.state(); const now = flatten(S);
  if (!flatPrev) {           // first time on this device: everything already here counts as old
    flatPrev = {}; Object.keys(now).forEach(k => { meta[k] = { t: 1, d: device }; pending[k] = 1; flatPrev[k] = now[k]; });
  } else {
    const t = Date.now();
    Object.keys(now).forEach(k => { if (flatPrev[k] !== now[k]) { meta[k] = { t, d: device }; pending[k] = 1; flatPrev[k] = now[k]; } });
    Object.keys(flatPrev).forEach(k => { if (!(k in now)) { meta[k] = { t, d: device, x: 1 }; pending[k] = 1; delete flatPrev[k]; } });
  }
  ls.set(LS_META, meta); ls.set(LS_FLAT, flatPrev); ls.set(LS_PEND, pending);
  push();
}
function changed() { clearTimeout(timer); timer = setTimeout(scan, 400); }

let db = null, auth = null, pushing = false;
async function push() {
  if (!user || !db || pushing) return;
  const keys = Object.keys(pending); if (!keys.length) return;
  pushing = true;
  const byShard = {};
  keys.forEach(k => {
    const m = meta[k]; if (!m) { delete pending[k]; return; }
    const sh = shardOf(JSON.parse(k));
    (byShard[sh] = byShard[sh] || {})[k] = m.x ? { t: m.t, d: m.d, x: true } : { t: m.t, d: m.d, v: flatPrev[k] };
  });
  try {
    for (const sh of Object.keys(byShard)) {
      await setDoc(doc(db, 'families', user.uid, 's', sh), { L: byShard[sh] }, { merge: true });
      Object.keys(byShard[sh]).forEach(k => { if (meta[k] && meta[k].t === byShard[sh][k].t) delete pending[k]; });
      ls.set(LS_PEND, pending);
    }
    last = Date.now(); error = '';
  } catch (e) { error = 'Could not sync yet: ' + (e.code || e.message || e); }
  pushing = false;
  if (Object.keys(pending).length && !error) setTimeout(push, 1500);
}

// ---------- remote changes ----------
function applyRemote(snap) {
  const S = SD.state(); let any = false;
  snap.docChanges().forEach(ch => {
    if (ch.type === 'removed') return;
    const L = (ch.doc.data() || {}).L || {};
    Object.keys(L).forEach(k => {
      const r = L[k]; if (!r || r.t == null) return;
      if (!newer(r, meta[k])) return;
      const path0 = JSON.parse(k); const lastKey = path0[path0.length - 1];
      const isMarker = typeof lastKey === 'string' && lastKey.charAt(0) === MK;
      if (isMarker && path0.length === 2 && path0[0] === 'days') { if (!Array.isArray(S.days)) S.days = []; }
      else {
        const path = realPath(S, path0, !r.x);
        if (path) {
          if (isMarker) { if (!r.x) ensureAt(S, path.slice(0, -1), lastKey === MK + 'a'); }
          else if (r.x) deleteAt(S, path);
          else { try { setAt(S, path, JSON.parse(r.v)); } catch (e) { return; } }
        }
      }
      meta[k] = { t: r.t, d: r.d, x: r.x ? 1 : undefined };
      if (r.x) delete flatPrev[k]; else flatPrev[k] = r.v;
      delete pending[k];
      any = true;
    });
  });
  last = Date.now();
  if (any) {
    tidy(S);
    applying = true;
    SD.stored();
    // Re-read the tidied state so removals of whole days are not pushed back as new changes.
    const now = flatten(S);
    Object.keys(flatPrev).forEach(k => { if (!(k in now) && !(meta[k] && meta[k].x)) { delete flatPrev[k]; } });
    ls.set(LS_META, meta); ls.set(LS_FLAT, flatPrev); ls.set(LS_PEND, pending);
    applying = false;
    SD.redraw();
  }
}

function start(u) {
  user = u; error = '';
  if (unsub) { unsub(); unsub = null; }
  if (!u) { SD.redraw(); return; }
  // A different family account on this device: start the leaf bookkeeping fresh.
  const prevUid = ls.get(LS_UID, null);
  if (prevUid && prevUid !== u.uid) { meta = {}; flatPrev = null; pending = {}; }
  ls.set(LS_UID, u.uid);
  ls.set(LS_EMAIL, u.email || '');
  unsub = onSnapshot(collection(db, 'families', u.uid, 's'), snap => { applyRemote(snap); push(); }, e => { error = 'Sync stopped: ' + (e.code || e.message); SD.redraw(); });
  scan();
  SD.redraw();
}

const MSG = {
  'auth/invalid-email': 'That email address doesn’t look right.',
  'auth/missing-password': 'Type the family app password.',
  'auth/weak-password': 'Choose a longer password, at least 8 characters.',
  'auth/email-already-in-use': 'There is already a family account with this email. Use Sign in instead.',
  'auth/invalid-credential': 'The email or password isn’t right.',
  'auth/wrong-password': 'The email or password isn’t right.',
  'auth/user-not-found': 'No family account with this email yet. Use “First time” to create it.',
  'auth/too-many-requests': 'Too many tries. Wait a few minutes and try again.',
  'auth/network-request-failed': 'No internet connection. Try again when online.',
  'auth/operation-not-allowed': 'Email/Password sign-in is not switched on in Firebase (Authentication → Sign-in method).'
};
function friendly(e) { return MSG[e && e.code] || ('Something went wrong: ' + ((e && (e.code || e.message)) || e)); }

try {
  const app = initializeApp(CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);
  onAuthStateChanged(auth, start);
} catch (e) { available = false; note = 'Syncing could not start here (' + (e.message || e) + ').'; }

window.addEventListener('online', () => { online = true; push(); SD.redraw(); });
window.addEventListener('offline', () => { online = false; SD.redraw(); });

window.SDsync = {
  changed,
  status() { return { available, note, user: user && user.email, online, pending: Object.keys(pending).length, last, error, lastEmail: ls.get(LS_EMAIL, '') }; },
  signIn(email, pw) { return signInWithEmailAndPassword(auth, email, pw).then(() => {}, e => { throw friendly(e); }); },
  signUp(email, pw) {
    if (!pw || pw.length < 8) return Promise.reject('Choose a password of at least 8 characters.');
    return createUserWithEmailAndPassword(auth, email, pw).then(() => {}, e => { throw friendly(e); });
  },
  signOut() { return fbSignOut(auth); }
};
SD.redraw();
