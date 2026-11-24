/* Maths for Our School Days: number facts, daily practice by syllabus topic, PSLE heuristics.
   Topics and their order follow MOE's 2021 Primary Mathematics Syllabus (Standard), P3 to P6.
   Heuristics follow the list Singapore schools teach for PSLE: model drawing, systematic listing, before/after,
   patterns, guess and check, supposition, working backwards and the algebraic method.
   Every question is made fresh from numbers chosen so the answer comes out whole or exact; the answer is worked
   out by the code, never typed in by hand. */
(function () {
  'use strict';

  // ---------- small number helpers ----------
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // Exact numbers as fractions n/d.
  function F(n, d) { d = d == null ? 1 : d; if (d < 0) { n = -n; d = -d; } var g = gcd(n, d); return { n: n / g, d: d / g }; }
  function fAdd(a, b) { return F(a.n * b.d + b.n * a.d, a.d * b.d); }
  function fSub(a, b) { return F(a.n * b.d - b.n * a.d, a.d * b.d); }
  function fMul(a, b) { return F(a.n * b.n, a.d * b.d); }
  function fDiv(a, b) { return F(a.n * b.d, a.d * b.n); }
  function fEq(a, b) { return a.n * b.d === b.n * a.d; }
  function fStr(f) { return f.d === 1 ? String(f.n) : f.n + '/' + f.d; }
  function mixedStr(f) { if (f.d === 1) return String(f.n); var w = Math.floor(f.n / f.d), r = f.n - w * f.d; return w ? w + ' ' + r + '/' + f.d : r + '/' + f.d; }
  function dec(x, dp) { var s = (Math.round(x * Math.pow(10, dp)) / Math.pow(10, dp)).toFixed(dp); return s.replace(/\.?0+$/, ''); }
  // A decimal string to an exact fraction: "2.35" → 47/20.
  function fromDec(s) { s = String(s); var neg = s[0] === '-'; if (neg) s = s.slice(1); var p = s.split('.'); var d = p[1] ? Math.pow(10, p[1].length) : 1; var n = parseInt(p[0] || '0', 10) * d + (p[1] ? parseInt(p[1], 10) : 0); return F(neg ? -n : n, d); }
  function money(n) { return '$' + (n % 1 ? n.toFixed(2) : String(n)); }
  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  // Read what the child typed: 12, 3.5, 7/8, 2 3/4, 1,250, $4.50, 12 cm — the unit and commas are ignored.
  function parse(s) {
    s = String(s || '').replace(/[$,%°]/g, '').replace(/[a-z²³]+/gi, ' ').trim();
    if (!s) return null;
    var m;
    if ((m = s.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/))) { var w = +m[1]; if (+m[3] === 0) return null; return { f: fAdd(F(w), F(+m[2], +m[3])), raw: { mixed: true, n: +m[2], d: +m[3] } }; }
    if ((m = s.match(/^(-?\d+)\s*\/\s*(\d+)$/))) { if (+m[2] === 0) return null; return { f: F(+m[1], +m[2]), raw: { n: +m[1], d: +m[2] } }; }
    if ((m = s.match(/^-?\d*\.?\d+$/))) return { f: fromDec(s), raw: null };
    return null;
  }
  // Is the typed answer right? 'simplest' asks for a fraction in lowest terms.
  function check(Q, typed) {
    if (Q.choices) return { ok: String(typed) === String(Q.a), shown: Q.a };
    if (Q.ratio) { var rm = String(typed).match(/^\s*(\d+)\s*:\s*(\d+)\s*$/); if (!rm) return { ok: false, unread: true, shown: Q.show }; var x = +rm[1], y = +rm[2]; if (x * Q.ratio[1] === y * Q.ratio[0] && (x !== Q.ratio[0])) return { ok: false, close: 'Same ratio — now make it as simple as it goes.', shown: Q.show }; return { ok: x === Q.ratio[0] && y === Q.ratio[1], shown: Q.show }; }
    if (Q.time) { var t = String(typed).replace(/\s/g, ''); return { ok: t === Q.a || t.replace(/^0/, '') === Q.a.replace(/^0/, ''), shown: Q.a }; }
    var p = parse(typed); if (!p) return { ok: false, unread: true, shown: Q.show };
    var ok = fEq(p.f, Q.a);
    if (ok && Q.simplest && p.raw && gcd(p.raw.n, p.raw.d) !== 1) return { ok: false, close: 'That is the right amount — now give it in its simplest form.', shown: Q.show };
    if (ok && Q.mixed && p.raw && !p.raw.mixed && p.raw.n > p.raw.d) return { ok: false, close: 'Right amount — now write it as a mixed number.', shown: Q.show };
    return { ok: ok, shown: Q.show };
  }
  function Qn(q, a, extra) { var o = { q: q, a: a, show: extra && extra.show || (a.d === 1 ? String(a.n) : mixedStr(a)) }; for (var k in extra || {}) o[k] = extra[k]; return o; }

  // ---------- topics, in syllabus order ----------
  // Each makes one question: { q, a (exact fraction) or choices/time, show, steps, unit }.
  var T = [];
  function topic(id, lv, strand, name, gen) { T.push({ id: id, lv: lv, strand: strand, name: name, gen: gen }); }

  // P3
  topic('p3add', 3, 'Whole numbers', 'Add and subtract within 10 000', function () {
    var a = ri(1200, 8999), b = ri(150, 9999 - a);
    if (Math.random() < 0.5) return Qn(a + ' + ' + b + ' = ?', F(a + b), { steps: ['Line up ones, tens, hundreds and thousands, then add from the ones, carrying when a column passes 9.'] });
    var x = a + b; return Qn(x + ' − ' + b + ' = ?', F(a), { steps: ['Line up the places and subtract from the ones, regrouping when the top digit is smaller.'] });
  });
  topic('p3muldiv', 3, 'Whole numbers', 'Multiply and divide by a 1-digit number', function () {
    var b = ri(3, 9);
    if (Math.random() < 0.5) { var a = ri(102, 999); return Qn(a + ' × ' + b + ' = ?', F(a * b), { steps: ['Multiply the ones, tens and hundreds by ' + b + ' in turn, carrying as you go.'] }); }
    var q = ri(21, 199), r = ri(1, b - 1), n = q * b + r;
    return Qn(n + ' ÷ ' + b + ' has a remainder. What is the remainder?', F(r), { steps: [b + ' × ' + q + ' = ' + q * b + ', and ' + n + ' − ' + q * b + ' = ' + r + '.'] });
  });
  topic('p3mental', 3, 'Whole numbers', 'Mental sums with 2-digit numbers', function () {
    var a = ri(23, 89), b = ri(14, 79);
    if (Math.random() < 0.5) return Qn('In your head: ' + a + ' + ' + b, F(a + b), { steps: ['Add the tens, then the ones: ' + (a - a % 10) + ' + ' + (b - b % 10) + ' = ' + (a - a % 10 + b - b % 10) + ', then add ' + (a % 10 + b % 10) + '.'] });
    var hi = Math.max(a, b), lo = Math.min(a, b); return Qn('In your head: ' + hi + ' − ' + lo, F(hi - lo), { steps: ['Take away the tens first, then the ones.'] });
  });
  topic('p3equiv', 3, 'Fractions', 'Equivalent fractions and simplest form', function () {
    var d = pick([2, 3, 4, 5, 6]), n = ri(1, d - 1); while (gcd(n, d) !== 1) n = ri(1, d - 1); var k = ri(2, 4);
    if (Math.random() < 0.5) return Qn('Write ' + n * k + '/' + d * k + ' in its simplest form.', F(n, d), { simplest: true, steps: ['Divide the top and bottom by ' + k + '.'] });
    return Qn(n + '/' + d + ' = ?/' + d * k + '   (give the missing numerator)', F(n * k), { steps: ['The bottom was multiplied by ' + k + ', so multiply the top by ' + k + ' too.'] });
  });
  topic('p3fadd', 3, 'Fractions', 'Add and subtract related fractions', function () {
    var d1 = pick([2, 3, 4, 5]), k = pick([2, 3]), d2 = d1 * k; if (d2 > 12) d2 = d1 * 2;
    var a = F(ri(1, d1 - 1), d1), b = F(ri(1, d2 - 1), d2); while (a.n * b.d + b.n * a.d >= a.d * b.d) b = F(1, d2);
    if (Math.random() < 0.6) return Qn(fStr(a) + ' + ' + fStr(b) + ' = ?', fAdd(a, b), { simplest: true, steps: ['Change ' + fStr(a) + ' into ' + d2 + 'ths, then add the tops. Simplify if you can.'] });
    var big = fAdd(a, b); return Qn(fStr(big) + ' − ' + fStr(b) + ' = ?', a, { simplest: true, steps: ['Make the bottoms the same, then subtract the tops.'] });
  });
  topic('p3time', 3, 'Measurement', 'Time: durations and the 24-hour clock', function () {
    var h = ri(7, 15), m = pick([5, 10, 15, 20, 25, 35, 40, 45, 50]), dh = ri(1, 3), dm = pick([10, 15, 20, 25, 30, 40, 45, 50]);
    var end = h * 60 + m + dh * 60 + dm; var eh = Math.floor(end / 60), em = end % 60;
    if (Math.random() < 0.5) return Qn('A lesson starts at ' + h + ':' + (m < 10 ? '0' : '') + m + ' and ends at ' + eh + ':' + (em < 10 ? '0' : '') + em + ' (24-hour clock). How many minutes long is it?', F(dh * 60 + dm), { unit: 'min', steps: ['Count on to the next hour, then whole hours, then the minutes left.'] });
    var pmh = h > 12 ? h - 12 : h; return Qn('Write ' + pmh + ':' + (m < 10 ? '0' : '') + m + (h >= 12 ? ' p.m.' : ' a.m.') + ' in 24-hour time (like 14:05).', null, { time: true, a: (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m, show: (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m, steps: [h >= 12 ? 'After noon, add 12 to the hour.' : 'Before noon, the hour stays the same; write it with two digits.'] });
  });
  topic('p3units', 3, 'Measurement', 'Convert km, m, cm, kg, g, ℓ, ml', function () {
    var u = pick([['km', 'm', 1000], ['m', 'cm', 100], ['kg', 'g', 1000], ['ℓ', 'ml', 1000]]); var a = ri(2, 9), b = ri(5, u[2] - 1);
    return Qn(a + ' ' + u[0] + ' ' + b + ' ' + u[1] + ' = ? ' + u[1], F(a * u[2] + b), { unit: u[1], steps: ['1 ' + u[0] + ' = ' + u[2] + ' ' + u[1] + ', so ' + a + ' ' + u[0] + ' = ' + a * u[2] + ' ' + u[1] + '; then add ' + b + '.'] });
  });
  topic('p3area', 3, 'Geometry', 'Area and perimeter of rectangles and squares', function () {
    var l = ri(4, 19), w = ri(3, l);
    if (Math.random() < 0.5) return Qn('A rectangle is ' + l + ' cm long and ' + w + ' cm wide. What is its area?', F(l * w), { unit: 'cm²', steps: ['Area = length × width = ' + l + ' × ' + w + '.'] });
    return Qn('A rectangle is ' + l + ' cm long and ' + w + ' cm wide. What is its perimeter?', F(2 * (l + w)), { unit: 'cm', steps: ['Perimeter = 2 × (length + width) = 2 × ' + (l + w) + '.'] });
  });
  // P4
  topic('p4round', 4, 'Whole numbers', 'Rounding to 10, 100 or 1000', function () {
    var n = ri(10001, 99999), p = pick([10, 100, 1000]); var r = Math.round(n / p) * p; if ((n % p) * 2 === p) r = (Math.floor(n / p) + 1) * p;
    return Qn('Round ' + num(n) + ' to the nearest ' + p + '.', F(r), { steps: ['Look at the digit just after the ' + p + 's place: 5 or more rounds up.'] });
  });
  topic('p4factors', 4, 'Whole numbers', 'Factors and multiples', function () {
    var k = ri(0, 2);
    if (k === 0) { var a = pick([2, 3, 4, 6]), b = pick([3, 4, 5, 6, 8, 9]); while (b === a) b = pick([3, 5, 7, 8, 9]); var L = lcm(a, b), nth = ri(1, 3); return Qn('What is the ' + ['first', 'second', 'third'][nth - 1] + ' common multiple of ' + a + ' and ' + b + '?', F(L * nth), { steps: ['List multiples of ' + Math.max(a, b) + ' until you find ones that ' + Math.min(a, b) + ' also divides: ' + L + ', ' + 2 * L + ', ' + 3 * L + '…'] }); }
    if (k === 1) { var n = pick([12, 18, 20, 24, 28, 30, 36, 40, 42, 48, 54, 60, 72, 84, 90, 96]); var c = 0; for (var i = 1; i <= n; i++) if (n % i === 0) c++; return Qn('How many factors does ' + n + ' have?', F(c), { steps: ['List them in pairs that multiply to ' + n + ': 1 × ' + n + ', 2 × ' + n / 2 + ' (if whole)… and count.'] }); }
    var x = pick([24, 36, 48, 30, 42, 60, 72]), y = pick([18, 27, 45, 40, 54, 56, 63]); var g = gcd(x, y); if (g === 1) { x = 24; y = 36; g = 12; }
    return Qn('What is the greatest common factor of ' + x + ' and ' + y + '?', F(g), { steps: ['List the factors of each and find the biggest one in both lists.'] });
  });
  topic('p4mul', 4, 'Whole numbers', 'Long multiplication and division', function () {
    if (Math.random() < 0.5) { var a = ri(112, 999), b = ri(12, 89); return Qn(a + ' × ' + b + ' = ?', F(a * b), { steps: ['Multiply by the ones digit, then by the tens digit (shifted one place), and add the two rows.'] }); }
    var d = ri(3, 9), q = ri(201, 1999); return Qn(num(q * d) + ' ÷ ' + d + ' = ?', F(q), { steps: ['Divide the thousands, hundreds, tens and ones in turn, carrying each remainder to the next place.'] });
  });
  topic('p4mixed', 4, 'Fractions', 'Mixed numbers and improper fractions', function () {
    var d = pick([3, 4, 5, 6, 7, 8]), w = ri(1, 5), n = ri(1, d - 1); while (gcd(n, d) !== 1) n = ri(1, d - 1); var f = F(w * d + n, d);
    if (Math.random() < 0.5) return Qn('Write ' + (w * d + n) + '/' + d + ' as a mixed number.', f, { mixed: true, show: mixedStr(f), steps: [(w * d + n) + ' ÷ ' + d + ' = ' + w + ' remainder ' + n + '.'] });
    return Qn('Write ' + w + ' ' + n + '/' + d + ' as an improper fraction.', f, { show: fStr(f), steps: [w + ' × ' + d + ' + ' + n + ' = ' + (w * d + n) + ', over ' + d + '.'] });
  });
  topic('p4fset', 4, 'Fractions', 'Fraction of a set', function () {
    var d = pick([3, 4, 5, 6, 8]), n = ri(1, d - 1), k = ri(3, 12), tot = d * k; var thing = pick(['beads', 'stickers', 'marbles', 'stamps', 'apples']);
    return Qn('There are ' + tot + ' ' + thing + '. ' + n + '/' + d + ' of them are red. How many are red?', F(n * k), { steps: ['1/' + d + ' of ' + tot + ' is ' + k + ', so ' + n + '/' + d + ' is ' + n + ' × ' + k + '.'] });
  });
  topic('p4funlike', 4, 'Fractions', 'Add and subtract unlike fractions', function () {
    var ds = shuffle([2, 3, 4, 5, 6, 8, 10, 12]); var d1 = ds[0], d2 = ds[1]; var a = F(ri(1, d1 - 1), d1), b = F(ri(1, d2 - 1), d2);
    if (Math.random() < 0.5) return Qn(fStr(a) + ' + ' + fStr(b) + ' = ?   (as a mixed number if more than 1)', fAdd(a, b), { simplest: true, show: mixedStr(fAdd(a, b)), steps: ['Use the common denominator ' + lcm(a.d, b.d) + ', add the tops, then simplify.'] });
    var hi = a.n * b.d >= b.n * a.d ? a : b, lo = hi === a ? b : a; if (fEq(hi, lo)) return Qn(fStr(a) + ' + ' + fStr(b) + ' = ?', fAdd(a, b), { simplest: true, show: mixedStr(fAdd(a, b)) });
    return Qn(fStr(hi) + ' − ' + fStr(lo) + ' = ?', fSub(hi, lo), { simplest: true, steps: ['Use the common denominator ' + lcm(hi.d, lo.d) + ', subtract the tops, then simplify.'] });
  });
  topic('p4decplace', 4, 'Decimals', 'Decimals: place value, fractions, rounding', function () {
    var k = ri(0, 2);
    if (k === 0) { var n = ri(1, 99), d = pick([10, 100]); var f = F(n, d); return Qn('Write ' + dec(n / d, 2) + ' as a fraction in its simplest form.', f, { simplest: true, show: fStr(f), steps: ['Write it over ' + d + ', then simplify.'] }); }
    if (k === 1) { var x = ri(1000, 99999) / 1000, dp = pick([0, 1, 2]); return Qn('Round ' + x.toFixed(3) + ' to ' + (dp ? dp + ' decimal place' + (dp > 1 ? 's' : '') : 'the nearest whole number') + '.', fromDec(dec(x, dp)), { steps: ['Look at the next digit along: 5 or more rounds up.'] }); }
    var dd = pick([2, 4, 5, 20, 25, 50]), nn = ri(1, dd - 1); while (gcd(nn, dd) !== 1) nn = ri(1, dd - 1); return Qn('Write ' + nn + '/' + dd + ' as a decimal.', F(nn, dd), { show: dec(nn / dd, 3), steps: ['Make the bottom 10, 100 or 1000: multiply top and bottom by the same number.'] });
  });
  topic('p4decops', 4, 'Decimals', 'Add, subtract, multiply and divide decimals', function () {
    var k = ri(0, 3); var a = ri(105, 9999) / 100, b = ri(12, 999) / 100;
    if (k === 0) return Qn(a.toFixed(2) + ' + ' + b.toFixed(2) + ' = ?', fAdd(fromDec(a.toFixed(2)), fromDec(b.toFixed(2))), { show: dec(a + b, 2), steps: ['Line up the decimal points, then add.'] });
    if (k === 1) { var hi = Math.max(a, b), lo = Math.min(a, b); return Qn(hi.toFixed(2) + ' − ' + lo.toFixed(2) + ' = ?', fSub(fromDec(hi.toFixed(2)), fromDec(lo.toFixed(2))), { show: dec(hi - lo, 2), steps: ['Line up the decimal points, then subtract.'] }); }
    var m = ri(3, 9);
    if (k === 2) return Qn(b.toFixed(2) + ' × ' + m + ' = ?', fMul(fromDec(b.toFixed(2)), F(m)), { show: dec(b * m, 2), steps: ['Multiply as whole numbers, then put back the 2 decimal places.'] });
    var q = ri(12, 999) / 100; return Qn(dec(q * m, 2) + ' ÷ ' + m + ' = ?', fromDec(q.toFixed(2)), { show: dec(q, 2), steps: ['Divide as usual, keeping the decimal point in line.'] });
  });
  topic('p4rect', 4, 'Geometry', 'Missing sides and composite rectangles', function () {
    var k = ri(0, 2);
    if (k === 0) { var w = ri(4, 15), l = ri(w, 25); return Qn('A rectangle has an area of ' + l * w + ' cm². Its width is ' + w + ' cm. What is its length?', F(l), { unit: 'cm', steps: ['Length = area ÷ width = ' + l * w + ' ÷ ' + w + '.'] }); }
    if (k === 1) { var s = ri(4, 20); return Qn('A square has a perimeter of ' + 4 * s + ' cm. What is its area?', F(s * s), { unit: 'cm²', steps: ['Side = ' + 4 * s + ' ÷ 4 = ' + s + ' cm; area = ' + s + ' × ' + s + '.'] }); }
    var L = ri(10, 20), W = ri(8, 14), cl = ri(2, L - 4), cw = ri(2, W - 4);
    return Qn('A ' + L + ' cm by ' + W + ' cm rectangle has a ' + cl + ' cm by ' + cw + ' cm rectangle cut out of one corner. What is the area left?', F(L * W - cl * cw), { unit: 'cm²', steps: ['Whole area ' + L * W + ' cm² minus the cut-out ' + cl * cw + ' cm².'] });
  });
  topic('p4angle', 4, 'Geometry', 'Angles and turns', function () {
    var k = ri(0, 1);
    if (k === 0) { var a = ri(15, 75); return Qn('A right angle is split into two angles. One is ' + a + '°. What is the other?', F(90 - a), { unit: '°', steps: ['A right angle is 90°, so 90° − ' + a + '°.'] }); }
    var t = pick([1, 2, 3]); var dirs = ['north', 'east', 'south', 'west']; var st = ri(0, 3);
    return Qn('Facing ' + dirs[st] + ', you turn ' + t * 90 + '° clockwise. Which way are you facing?', null, { choices: dirs, a: dirs[(st + t) % 4], show: dirs[(st + t) % 4], steps: ['Each 90° clockwise turn goes north → east → south → west.'] });
  });
  // P5
  topic('p5order', 5, 'Whole numbers', 'Order of operations and brackets', function () {
    var a = ri(2, 9), b = ri(2, 9), c = ri(2, 9), d = ri(10, 60); var k = ri(0, 2);
    if (k === 0) return Qn(d + ' + ' + a + ' × ' + b + ' = ?', F(d + a * b), { steps: ['Multiply before you add: ' + a + ' × ' + b + ' = ' + a * b + '.'] });
    if (k === 1) return Qn('(' + d + ' − ' + a + ') × ' + b + ' = ?', F((d - a) * b), { steps: ['Brackets first: ' + d + ' − ' + a + ' = ' + (d - a) + '.'] });
    var e = a * b * c; return Qn(e + ' ÷ ' + a + ' ÷ ' + b + ' + ' + d + ' = ?', F(c + d), { steps: ['Divide from left to right, then add.'] });
  });
  topic('p5tens', 5, 'Whole numbers', 'Multiply and divide by 10, 100, 1000 and their multiples', function () {
    var p = pick([10, 100, 1000]), m = pick([1, 2, 3, 4, 5, 6, 7, 8, 9]); var x = ri(12, 999);
    if (Math.random() < 0.5) return Qn(x + ' × ' + num(m * p) + ' = ?', F(x * m * p), { steps: ['Multiply by ' + m + ', then add ' + (String(p).length - 1) + ' zero' + (p > 10 ? 's' : '') + '.'] });
    var y = ri(3, 99) * m; return Qn(num(y * p) + ' ÷ ' + num(m * p) + ' = ?', F(y / m), { steps: ['Divide by ' + p + ' first (remove zeros), then by ' + m + '.'] });
  });
  topic('p5fquot', 5, 'Fractions', 'Division as a fraction; fractions as decimals', function () {
    if (Math.random() < 0.5) { var b = pick([3, 4, 5, 6, 7, 8]), a = ri(b + 1, 5 * b); while (a % b === 0) a++; var f = F(a, b); return Qn(a + ' ÷ ' + b + ' = ?   (as a mixed number)', f, { mixed: true, show: mixedStr(f), simplest: true, steps: [a + ' ÷ ' + b + ' = ' + a + '/' + b + ' = ' + mixedStr(f) + '.'] }); }
    var dd = pick([4, 5, 8, 20, 25]), w = ri(1, 4), nn = ri(1, dd - 1); var fr = F(nn, dd); return Qn('Write ' + w + ' ' + fStr(fr) + ' as a decimal.', fAdd(F(w), fr), { show: dec(w + nn / dd, 3), steps: ['Change ' + fStr(fr) + ' to a decimal, then add ' + w + '.'] });
  });
  topic('p5fmixed', 5, 'Fractions', 'Add and subtract mixed numbers', function () {
    var d1 = pick([2, 3, 4, 5, 6]), d2 = pick([3, 4, 6, 8, 10, 12]); var a = fAdd(F(ri(2, 6)), F(ri(1, d1 - 1), d1)), b = fAdd(F(ri(1, 3)), F(ri(1, d2 - 1), d2));
    if (Math.random() < 0.5) return Qn(mixedStr(a) + ' + ' + mixedStr(b) + ' = ?', fAdd(a, b), { simplest: true, show: mixedStr(fAdd(a, b)), steps: ['Add the wholes, add the fractions (common denominator), then tidy up.'] });
    var hi = a.n * b.d >= b.n * a.d ? a : b, lo = hi === a ? b : a; return Qn(mixedStr(hi) + ' − ' + mixedStr(lo) + ' = ?', fSub(hi, lo), { simplest: true, show: mixedStr(fSub(hi, lo)), steps: ['Change both to improper fractions (or regroup a whole), then subtract.'] });
  });
  topic('p5fmul', 5, 'Fractions', 'Multiply fractions', function () {
    var k = ri(0, 2); var a = F(ri(1, 7), pick([3, 4, 5, 6, 8, 9])), b = F(ri(1, 7), pick([2, 3, 4, 5, 7]));
    if (k === 0) { var w = ri(2, 12); return Qn(fStr(a) + ' × ' + w + ' = ?', fMul(a, F(w)), { simplest: true, show: mixedStr(fMul(a, F(w))), steps: ['Multiply the top by ' + w + ', then simplify.'] }); }
    if (k === 1) return Qn(fStr(a) + ' × ' + fStr(b) + ' = ?', fMul(a, b), { simplest: true, show: mixedStr(fMul(a, b)), steps: ['Top × top over bottom × bottom; cancel common factors first if you can.'] });
    var m = fAdd(F(ri(1, 3)), F(1, pick([2, 3, 4]))), w2 = ri(2, 8); return Qn(mixedStr(m) + ' × ' + w2 + ' = ?', fMul(m, F(w2)), { simplest: true, show: mixedStr(fMul(m, F(w2))), steps: ['Change ' + mixedStr(m) + ' to ' + fStr(m) + ', then multiply.'] });
  });
  topic('p5decten', 5, 'Decimals', 'Decimals × and ÷ by 10, 100, 1000; unit conversions', function () {
    var x = ri(1, 9999) / 1000, p = pick([10, 100, 1000]);
    if (Math.random() < 0.4) return Qn(x.toFixed(3).replace(/0+$/, '') + ' × ' + p + ' = ?', fMul(fromDec(x.toFixed(3)), F(p)), { show: dec(x * p, 3), steps: ['Move the decimal point ' + (String(p).length - 1) + ' place(s) to the right.'] });
    if (Math.random() < 0.5) { var y = ri(1, 9999) / 10; return Qn(dec(y, 1) + ' ÷ ' + p + ' = ?', fDiv(fromDec(dec(y, 1)), F(p)), { show: dec(y / p, 4), steps: ['Move the decimal point ' + (String(p).length - 1) + ' place(s) to the left.'] }); }
    var u = pick([['km', 'm', 1000], ['m', 'cm', 100], ['kg', 'g', 1000], ['ℓ', 'ml', 1000]]); var v = ri(1, 9999) / 1000; if (u[2] === 100) v = ri(1, 999) / 100;
    return Qn(dec(v, 3) + ' ' + u[0] + ' = ? ' + u[1], fMul(fromDec(dec(v, 3)), F(u[2])), { unit: u[1], show: dec(v * u[2], 1), steps: ['1 ' + u[0] + ' = ' + u[2] + ' ' + u[1] + ', so multiply by ' + u[2] + '.'] });
  });
  topic('p5pct', 5, 'Percentage', 'Percentage: part of a whole, discount, GST, interest', function () {
    var k = ri(0, 3);
    if (k === 0) { var w = pick([20, 25, 40, 50, 80, 200, 400]), pc = pick([5, 10, 15, 20, 25, 30, 40, 60, 75]); var part = w * pc / 100; if (part % 1) { w = 200; part = 2 * pc; } return Qn(part + ' out of ' + w + ' is what percentage?', F(pc), { unit: '%', steps: [part + '/' + w + ' × 100%.'] }); }
    if (k === 1) { var price = ri(4, 60) * 10, d = pick([10, 15, 20, 25, 30, 40]); return Qn('A bag costs ' + money(price) + '. It is sold at ' + d + '% discount. What is the sale price?', fromDec(dec(price * (100 - d) / 100, 2)), { show: money(price * (100 - d) / 100), steps: ['Discount = ' + d + '% of ' + money(price) + ' = ' + money(price * d / 100) + '; take it away from ' + money(price) + '.'] }); }
    if (k === 2) { var p2 = ri(2, 40) * 100; return Qn('A meal costs ' + money(p2 / 100 * 10) + ' before GST of 9%. What is the price with GST?', fromDec(dec(p2 / 100 * 10 * 1.09, 2)), { show: money(Math.round(p2 / 100 * 10 * 109) / 100), steps: ['GST = 9% of the price; add it on (or multiply by 109/100).'] }); }
    var P = ri(2, 30) * 100, r = pick([2, 3, 4, 5]); return Qn('Mum puts ' + money(P) + ' in the bank at ' + r + '% interest a year. How much interest does she get after 1 year?', F(P * r / 100), { show: money(P * r / 100), steps: [r + '% of ' + money(P) + ' = ' + r + '/100 × ' + P + '.'] });
  });
  topic('p5rate', 5, 'Rate', 'Rate', function () {
    var k = ri(0, 2); var per = ri(3, 12), n = ri(4, 15);
    if (k === 0) return Qn('A tap fills ' + per * n + ' ℓ of water in ' + n + ' minutes. How many litres does it fill in 1 minute?', F(per), { unit: 'ℓ', steps: [per * n + ' ÷ ' + n + '.'] });
    if (k === 1) { var cost = ri(2, 9); return Qn('Oranges cost ' + money(cost) + ' for 4. How much do ' + 4 * n + ' oranges cost?', F(cost * n), { show: money(cost * n), steps: [4 * n + ' oranges is ' + n + ' groups of 4: ' + n + ' × ' + money(cost) + '.'] }); }
    return Qn('A printer prints ' + per + ' pages a minute. How many minutes to print ' + per * n + ' pages?', F(n), { unit: 'min', steps: [per * n + ' ÷ ' + per + '.'] });
  });
  topic('p5tri', 5, 'Geometry', 'Area of triangles and composite figures', function () {
    var b = ri(3, 20) * 2, h = ri(3, 18);
    if (Math.random() < 0.6) return Qn('A triangle has base ' + b + ' cm and height ' + h + ' cm. What is its area?', F(b * h / 2), { unit: 'cm²', steps: ['Area = ½ × base × height = ½ × ' + b + ' × ' + h + '.'] });
    var s = ri(6, 14), t = ri(3, s); return Qn('A figure is a ' + s + ' cm square with a triangle on top (base ' + s + ' cm, height ' + t + ' cm). What is its total area?', F(s * s + s * t / 2), { unit: 'cm²', show: dec(s * s + s * t / 2, 1), steps: ['Square ' + s * s + ' cm² + triangle ½ × ' + s + ' × ' + t + ' = ' + dec(s * t / 2, 1) + ' cm².'] });
  });
  topic('p5vol', 5, 'Geometry', 'Volume of cubes, cuboids and tanks', function () {
    var l = ri(5, 30), w = ri(4, 20), h = ri(3, 25);
    if (Math.random() < 0.5) return Qn('A cuboid measures ' + l + ' cm by ' + w + ' cm by ' + h + ' cm. What is its volume?', F(l * w * h), { unit: 'cm³', steps: ['Volume = length × width × height.'] });
    var L = ri(2, 6) * 10, W = ri(2, 5) * 10, H = ri(1, 4) * 10; return Qn('A tank ' + L + ' cm long and ' + W + ' cm wide is filled with water to a height of ' + H + ' cm. How many litres of water are in it?', F(L * W * H, 1000), { unit: 'ℓ', show: dec(L * W * H / 1000, 2), steps: ['Volume = ' + L + ' × ' + W + ' × ' + H + ' = ' + num(L * W * H) + ' cm³, and 1000 cm³ = 1 ℓ.'] });
  });
  topic('p5angles', 5, 'Geometry', 'Angles on a line, at a point, in triangles and quadrilaterals', function () {
    var k = ri(0, 4);
    if (k === 0) { var a = ri(20, 160); return Qn('Two angles lie on a straight line. One is ' + a + '°. What is the other?', F(180 - a), { unit: '°', steps: ['Angles on a straight line add up to 180°.'] }); }
    if (k === 1) { var x = ri(60, 140), y = ri(50, 300 - x - 20); return Qn('Three angles meet at a point. Two of them are ' + x + '° and ' + y + '°. What is the third?', F(360 - x - y), { unit: '°', steps: ['Angles at a point add up to 360°.'] }); }
    if (k === 2) { var p = ri(30, 90), q = ri(20, 150 - p); return Qn('A triangle has angles of ' + p + '° and ' + q + '°. What is the third angle?', F(180 - p - q), { unit: '°', steps: ['The angles of a triangle add up to 180°.'] }); }
    if (k === 3) { var top = ri(20, 140); if (top % 2) top++; return Qn('In an isosceles triangle the angle between the two equal sides is ' + top + '°. What is each of the other two angles?', F((180 - top) / 2), { unit: '°', steps: ['(180° − ' + top + '°) ÷ 2, because the two base angles are equal.'] }); }
    var g = ri(50, 130); return Qn('In a parallelogram one angle is ' + g + '°. What is the angle next to it?', F(180 - g), { unit: '°', steps: ['Neighbouring angles of a parallelogram add up to 180°.'] });
  });
  // P6
  topic('p6fdiv', 6, 'Fractions', 'Divide fractions', function () {
    var a = F(ri(1, 7), pick([3, 4, 5, 6, 8, 9])), b = F(ri(1, 5), pick([2, 3, 4, 5, 6]));
    if (b.n >= b.d) b = F(1, 3);
    var k = ri(0, 2);
    if (k === 0) { var w = ri(2, 9); if (a.n >= a.d) a = F(2, 5); return Qn(fStr(a) + ' ÷ ' + w + ' = ?', fDiv(a, F(w)), { simplest: true, steps: ['Dividing by ' + w + ' is the same as multiplying by 1/' + w + '.'] }); }
    if (k === 1) { var w2 = ri(2, 9); return Qn(w2 + ' ÷ ' + fStr(b) + ' = ?', fDiv(F(w2), b), { simplest: true, show: mixedStr(fDiv(F(w2), b)), steps: ['Multiply by the reciprocal: ' + w2 + ' × ' + b.d + '/' + b.n + '.'] }); }
    if (a.n >= a.d) a = F(3, 4); return Qn(fStr(a) + ' ÷ ' + fStr(b) + ' = ?', fDiv(a, b), { simplest: true, show: mixedStr(fDiv(a, b)), steps: ['Multiply by the reciprocal: ' + fStr(a) + ' × ' + b.d + '/' + b.n + '.'] });
  });
  topic('p6pct', 6, 'Percentage', 'Finding the whole; percentage increase and decrease', function () {
    var k = ri(0, 2);
    if (k === 0) { var pc = pick([10, 20, 25, 40, 50, 60, 75, 80]), whole = ri(2, 30) * 20; var part = whole * pc / 100; return Qn(pc + '% of a number is ' + part + '. What is the number?', F(whole), { steps: ['1% is ' + part + ' ÷ ' + pc + '; the whole is 100 times that.'] }); }
    if (k === 1) { var old = ri(2, 20) * 20, inc = pick([5, 10, 15, 20, 25, 50]); return Qn('The price of a book went up from ' + money(old) + ' to ' + money(old * (100 + inc) / 100) + '. What is the percentage increase?', F(inc), { unit: '%', steps: ['Increase = ' + money(old * inc / 100) + '; ÷ the old price ' + money(old) + ', × 100%.'] }); }
    var o2 = ri(2, 20) * 40, dc = pick([10, 20, 25, 30, 40]); return Qn('A school had ' + o2 + ' pupils. The number fell by ' + dc + '%. How many pupils are there now?', F(o2 * (100 - dc) / 100), { steps: [dc + '% of ' + o2 + ' = ' + o2 * dc / 100 + '; take it away.'] });
  });
  topic('p6ratio', 6, 'Ratio', 'Ratio', function () {
    var k = ri(0, 3); var a = ri(1, 7), b = ri(1, 9); while (gcd(a, b) !== 1 || a === b) { a = ri(1, 7); b = ri(2, 9); }
    if (k === 0) { var m = ri(2, 9); return Qn('Write ' + a * m + ' : ' + b * m + ' in its simplest form (like 2:3).', null, { ratio: [a, b], show: a + ' : ' + b, steps: ['Divide both by ' + m + ' to get ' + a + ' : ' + b + '.'] }); }
    if (k === 1) { var u = ri(3, 20); return Qn(money((a + b) * u) + ' is shared between Ali and Ben in the ratio ' + a + ' : ' + b + '. How much does Ben get?', F(b * u), { show: money(b * u), steps: [a + b + ' units = ' + money((a + b) * u) + ', 1 unit = ' + money(u) + ', Ben has ' + b + ' units.'] }); }
    if (k === 2) { var m2 = ri(2, 8); return Qn(a + ' : ' + b + ' = ' + a * m2 + ' : ?', F(b * m2), { steps: [a + ' was multiplied by ' + m2 + ', so multiply ' + b + ' by ' + m2 + '.'] }); }
    return Qn('The ratio of boys to girls is ' + a + ' : ' + b + '. What fraction of the children are girls?', F(b, a + b), { simplest: true, steps: ['Girls are ' + b + ' parts out of ' + (a + b) + '.'] });
  });
  topic('p6alg', 6, 'Algebra', 'Algebra: expressions and simple equations', function () {
    var k = ri(0, 2); var L = pick(['a', 'b', 'k', 'm', 'n', 'x', 'y']);
    if (k === 0) { var p = ri(2, 9), q = ri(1, 8), r = ri(1, p + q - 1); return Qn('Simplify ' + p + L + ' + ' + q + L + ' − ' + r + L + '. How many ' + L + "'s?", F(p + q - r), { show: (p + q - r) + L, steps: ['Collect the like terms: ' + p + ' + ' + q + ' − ' + r + '.'] }); }
    if (k === 1) { var c = ri(2, 9), dd = ri(1, 20), v = ri(2, 12); return Qn('Find the value of ' + c + L + ' + ' + dd + ' when ' + L + ' = ' + v + '.', F(c * v + dd), { steps: [c + ' × ' + v + ' + ' + dd + '.'] }); }
    var cc = ri(2, 9), xx = ri(2, 15), ee = ri(1, 30); return Qn('Solve ' + cc + L + ' + ' + ee + ' = ' + (cc * xx + ee) + '. What is ' + L + '?', F(xx), { steps: ['Take away ' + ee + ' from both sides, then divide by ' + cc + '.'] });
  });
  topic('p6circle', 6, 'Geometry', 'Circles, semicircles and quarter circles', function () {
    var k = ri(0, 2);
    if (k === 0) { var r = ri(2, 15); return Qn('Find the area of a circle of radius ' + r + ' cm. Take π = 3.14.', F(314 * r * r, 100), { unit: 'cm²', show: dec(3.14 * r * r, 2), steps: ['Area = π × r × r = 3.14 × ' + r + ' × ' + r + '.'] }); }
    if (k === 1) { var d = ri(1, 6) * 7; return Qn('Find the circumference of a circle of diameter ' + d + ' cm. Take π = 22/7.', F(22 * d, 7), { unit: 'cm', steps: ['Circumference = π × d = 22/7 × ' + d + '.'] }); }
    var dd = ri(2, 10) * 2; return Qn('Find the perimeter of a semicircle of diameter ' + dd + ' cm. Take π = 3.14.', fAdd(F(314 * dd, 200), F(dd)), { unit: 'cm', show: dec(3.14 * dd / 2 + dd, 2), steps: ['Curved part = ½ × 3.14 × ' + dd + '; add the straight edge ' + dd + ' cm.'] });
  });
  topic('p6vol', 6, 'Geometry', 'Volume: finding a missing measurement', function () {
    var l = ri(4, 20), w = ri(3, 15), h = ri(2, 20);
    if (Math.random() < 0.5) return Qn('A cuboid has a volume of ' + l * w * h + ' cm³. It is ' + l + ' cm long and ' + w + ' cm wide. What is its height?', F(h), { unit: 'cm', steps: ['Height = volume ÷ (length × width) = ' + l * w * h + ' ÷ ' + l * w + '.'] });
    var e = ri(2, 12); return Qn('A cube has a volume of ' + e * e * e + ' cm³. What is the length of one edge?', F(e), { unit: 'cm', steps: ['Find the number that multiplies by itself 3 times to make ' + e * e * e + '.'] });
  });
  topic('p6avg', 6, 'Statistics', 'Average', function () {
    var n = ri(3, 6), avg = ri(30, 90); var vals = [], last = 0, tot = avg * n; do { vals = []; for (var i = 0; i < n - 1; i++) vals.push(avg + ri(-12, 12)); last = tot - vals.reduce(function (s, v) { return s + v; }, 0); } while (last < 1);
    if (Math.random() < 0.5) { vals.push(last); return Qn('Find the average of ' + vals.join(', ') + '.', F(avg), { steps: ['Add them (' + tot + ') and divide by ' + n + '.'] }); }
    return Qn('The average of ' + n + ' numbers is ' + avg + '. ' + (n - 1) + ' of them are ' + vals.join(', ') + '. What is the last number?', F(last), { steps: ['Total = ' + avg + ' × ' + n + ' = ' + tot + '; take away the others.'] });
  });

  // ---------- heuristics: word problems, each with the method shown ----------
  var H = [];
  function heur(id, name, gen) { H.push({ id: id, name: name, gen: gen }); }
  var names = ['Aisha', 'Ben', 'Chloe', 'Daniel', 'Farah', 'Hui Min', 'Jun Wei', 'Kumar', 'Mei Ling', 'Nur', 'Priya', 'Ravi', 'Siti', 'Wei Jie'];
  function two() { var s = shuffle(names); return [s[0], s[1], s[2]]; }
  heur('model', 'Draw a model', function () {
    var p = two(), k = ri(0, 1);
    if (k === 0) { var diff = ri(2, 30) * 5, small = ri(5, 60) * 5; var tot = small * 2 + diff;
      return Qn(p[0] + ' and ' + p[1] + ' have ' + money(tot) + ' altogether. ' + p[0] + ' has ' + money(diff) + ' more than ' + p[1] + '. How much does ' + p[1] + ' have?', F(small), { show: money(small), steps: ['Draw two bars; ' + p[0] + "'s bar is longer by " + money(diff) + '.', 'Take away the extra: ' + money(tot) + ' − ' + money(diff) + ' = ' + money(tot - diff) + ' is 2 equal bars.', p[1] + ' has ' + money(tot - diff) + ' ÷ 2 = ' + money(small) + '.'] }); }
    var u = ri(4, 25), m = ri(2, 5); return Qn(p[0] + ' has ' + m + ' times as many stamps as ' + p[1] + '. They have ' + u * (m + 1) + ' stamps altogether. How many more stamps does ' + p[0] + ' have than ' + p[1] + '?', F(u * (m - 1)), { steps: [p[1] + ' = 1 unit, ' + p[0] + ' = ' + m + ' units, total ' + (m + 1) + ' units = ' + u * (m + 1) + '.', '1 unit = ' + u + '.', 'The difference is ' + (m - 1) + ' units = ' + u * (m - 1) + '.'] });
  });
  heur('beforeafter', 'Before and after', function () {
    var p = two(); var k = ri(0, 1);
    if (k === 0) { var m = ri(2, 4), u = ri(5, 30) * 2; var give = (m - 1) * u / 2; if (give % 1) { u += 1; give = (m - 1) * u / 2; } if (give % 1) { m = 3; give = u; }
      return Qn(p[0] + ' had ' + m + ' times as many marbles as ' + p[1] + '. After ' + p[0] + ' gave ' + give + ' marbles to ' + p[1] + ', they had the same number. How many marbles did ' + p[0] + ' have at first?', F(m * u), { steps: ['Before: ' + p[0] + ' ' + m + ' units, ' + p[1] + ' 1 unit; the difference is ' + (m - 1) + ' units.', 'Giving ' + give + ' makes them equal, so ' + give + ' is half the difference: ' + (m - 1) + ' units = ' + 2 * give + ', 1 unit = ' + u + '.', p[0] + ' had ' + m + ' × ' + u + ' = ' + m * u + '.'] }); }
    var a = ri(2, 5), b = ri(a + 1, 8), u2 = ri(3, 15), add = (b - a) * u2; // A:B = a:b at first; A gets add more and they become equal
    return Qn('The ratio of ' + p[0] + "'s money to " + p[1] + "'s money was " + a + ' : ' + b + '. After ' + p[0] + ' saved another ' + money(add) + ', they had the same amount. How much did ' + p[1] + ' have?', F(b * u2), { show: money(b * u2), steps: [p[1] + ' did not change. The gap of ' + (b - a) + ' units was filled by ' + money(add) + '.', '1 unit = ' + money(add) + ' ÷ ' + (b - a) + ' = ' + money(u2) + '.', p[1] + ' had ' + b + ' units = ' + money(b * u2) + '.'] });
  });
  heur('backwards', 'Work backwards', function () {
    var p = two(); var left = ri(4, 30) * 2, spent2 = ri(2, 20), half = left + spent2; var start = half * 2;
    if (Math.random() < 0.5) return Qn(p[0] + ' spent half of the money in the purse on a book and then ' + money(spent2) + ' on lunch. ' + money(left) + ' was left. How much was in the purse at first?', F(start), { show: money(start), steps: ['Start from the end: ' + money(left) + ' + ' + money(spent2) + ' = ' + money(half) + ' before lunch.', 'That was half of the money, so at first there was 2 × ' + money(half) + ' = ' + money(start) + '.'] });
    var n = ri(2, 9), add = ri(3, 20), mul = ri(2, 5); var res = (n * mul) + add; return Qn('I think of a number, multiply it by ' + mul + ' and add ' + add + '. The answer is ' + res + '. What was my number?', F(n), { steps: ['Undo the last step: ' + res + ' − ' + add + ' = ' + (res - add) + '.', 'Undo the multiply: ' + (res - add) + ' ÷ ' + mul + ' = ' + n + '.'] });
  });
  heur('remainder', 'Fraction of a remainder', function () {
    var p = two(); var d1 = pick([3, 4, 5]), d2 = pick([2, 3, 4]), n2 = ri(1, d2 - 1); var u = ri(2, 12) * d2; var tot = u * d1; var r1 = tot - tot / d1; var spentB = r1 * n2 / d2; var left = r1 - spentB;
    return Qn(p[0] + ' spent 1/' + d1 + ' of some pocket money on a book and ' + n2 + '/' + d2 + ' of the remainder on a pen. ' + money(left) + ' was left. How much pocket money was there at first?', F(tot), { show: money(tot), steps: ['After the book, ' + (d1 - 1) + '/' + d1 + ' of the money is left.', (d2 - n2) + '/' + d2 + ' of that remainder is kept, which is ' + money(left) + ', so the remainder after the book was ' + money(r1) + '.', money(r1) + ' is ' + (d1 - 1) + '/' + d1 + ' of the money, so at first there was ' + money(tot) + '.'] });
  });
  heur('supposition', 'Make a supposition', function () {
    var c = ri(5, 25), g = ri(3, 20); var heads = c + g, legs = 2 * c + 4 * g;
    return Qn('A farm has chickens and goats. There are ' + heads + ' heads and ' + legs + ' legs. How many goats are there?', F(g), { steps: ['Suppose all ' + heads + ' animals were chickens: that is ' + 2 * heads + ' legs.', 'There are ' + (legs - 2 * heads) + ' extra legs; each goat adds 2 more legs.', 'Goats = ' + (legs - 2 * heads) + ' ÷ 2 = ' + g + '.'] });
  });
  heur('guess', 'Guess and check', function () {
    var a = ri(3, 12), b = ri(3, 12); var p5 = ri(4, 12), p2 = ri(2, p5 - 1); var tot = a * p5 + b * p2; var n = a + b;
    return Qn('Notebooks cost ' + money(p5) + ' and pencils cost ' + money(p2) + '. Siti bought ' + n + ' items for ' + money(tot) + ' altogether. How many notebooks did she buy?', F(a), { steps: ['Try a number of notebooks, work out the cost, and adjust. A table helps.', 'Or suppose all ' + n + ' were pencils: ' + money(n * p2) + '. The extra ' + money(tot - n * p2) + ' comes from notebooks, each ' + money(p5 - p2) + ' dearer.', 'Notebooks = ' + (tot - n * p2) + ' ÷ ' + (p5 - p2) + ' = ' + a + '.'] });
  });
  heur('pattern', 'Look for a pattern', function () {
    var s = ri(2, 5), add = ri(2, 6), n = ri(8, 25); var term = s + (n - 1) * add;
    return Qn('Figure 1 uses ' + s + ' sticks, Figure 2 uses ' + (s + add) + ', Figure 3 uses ' + (s + 2 * add) + '. The pattern goes on. How many sticks does Figure ' + n + ' use?', F(term), { steps: ['Each figure adds ' + add + ' sticks.', 'Figure ' + n + ' = ' + s + ' + ' + (n - 1) + ' × ' + add + ' = ' + term + '.'] });
  });
  heur('list', 'Make a systematic list', function () {
    var k = ri(0, 1);
    if (k === 0) { var t = ri(3, 5), b = ri(2, 4); return Qn('A café has ' + t + ' kinds of toast and ' + b + ' kinds of drink. How many different breakfasts of one toast and one drink can you choose?', F(t * b), { steps: ['List each toast with every drink: ' + b + ' choices for each of the ' + t + ' toasts.', t + ' × ' + b + ' = ' + t * b + '.'] }); }
    var tot = pick([20, 25, 30, 35, 40]); var ways = 0; for (var x = 0; x * 5 <= tot; x++) if ((tot - 5 * x) % 2 === 0) ways++;
    return Qn('In how many ways can you make exactly ' + tot + '¢ using only 2¢ and 5¢ coins?', F(ways), { steps: ['List by the number of 5¢ coins: 0, 1, 2, … up to ' + Math.floor(tot / 5) + '.', 'Keep only the ones where what is left can be made with 2¢ coins (an even amount).'] });
  });
  heur('algebra', 'Use algebra', function () {
    var x = ri(4, 20), a = ri(2, 4), b = ri(3, 15); var p = two();
    return Qn(p[0] + ' is ' + a + ' times as old as ' + p[1] + '. In ' + b + ' years, their ages will add up to ' + ((a + 1) * x + 2 * b) + '. How old is ' + p[1] + ' now?', F(x), { steps: ['Let ' + p[1] + ' be y now, so ' + p[0] + ' is ' + a + 'y.', 'In ' + b + ' years: y + ' + b + ' + ' + a + 'y + ' + b + ' = ' + ((a + 1) * x + 2 * b) + ', so ' + (a + 1) + 'y = ' + (a + 1) * x + '.', 'y = ' + x + '.'] });
  });

  // ---------- number facts, like Math Trainer ----------
  var FACTS = [
    { id: 'add', name: 'Adding', sym: '+', make: function () { var a = ri(2, 50), b = ri(2, 50); return [a + ' + ' + b, a + b]; } },
    { id: 'sub', name: 'Taking away', sym: '−', make: function () { var a = ri(10, 100), b = ri(1, a); return [a + ' − ' + b, a - b]; } },
    { id: 'mul', name: 'Times tables', sym: '×', make: function () { var a = ri(2, 12), b = ri(2, 12); return [a + ' × ' + b, a * b]; } },
    { id: 'div', name: 'Dividing', sym: '÷', make: function () { var a = ri(2, 12), b = ri(2, 12); return [a * b + ' ÷ ' + a, b]; } },
    { id: 'mix', name: 'Mixed', sym: '±×÷', make: null },
    { id: 'bonds', name: 'Bonds to 100', sym: '100', make: function () { var a = ri(1, 99); return [a + ' + ? = 100', 100 - a]; } }
  ];
  FACTS[4].make = function () { return FACTS[ri(0, 3)].make(); };

  window.SDMath = { topics: T, heuristics: H, facts: FACTS, check: check, parse: parse, F: F, mixedStr: mixedStr, fStr: fStr };
})();
