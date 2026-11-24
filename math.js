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
    var bar = function (lab, kk) { return { rows: [{ label: thing, parts: units(d, lab).map(function (x, i) { if (i < n && kk) x.k = kk; return x; }) }], right: { rows: [0, 0], t: String(tot) } }; };
    return Qn('There are ' + tot + ' ' + thing + '. ' + n + '/' + d + ' of them are red. How many are red?', F(n * k), W([
      G('Draw all ' + tot + ' ' + thing + ' as one bar. Into how many equal parts do you cut it?', F(d), 'Cut it into ' + d + ' equal parts.', { m: bar('', '') }, 'Look at the bottom number of ' + n + '/' + d + '.'),
      G('How many ' + thing + ' are in 1 part?', F(k), '1 part = ' + k + ' ' + thing + '.', { m: bar(String(k), '') }, tot + ' shared into ' + d + ' equal parts.'),
      G('How many parts are red, and so how many red ' + thing + '?', F(n * k), n + ' parts × ' + k + ' = ' + n * k + ' red ' + thing + '.', { m: bar(String(k), 'hl') }, 'The top number tells how many parts.'),
      TELL]));
  });
  topic('p4funlike', 4, 'Fractions', 'Add and subtract unlike fractions', function () {
    var ds = shuffle([2, 3, 4, 5, 6, 8, 10, 12]); var d1 = ds[0], d2 = ds[1]; var a = F(ri(1, d1 - 1), d1), b = F(ri(1, d2 - 1), d2);
    var add = Math.random() < 0.5; var hi = a.n * b.d >= b.n * a.d ? a : b, lo = hi === a ? b : a; if (fEq(hi, lo)) add = true;
    var x = add ? a : hi, y = add ? b : lo; var L = lcm(x.d, y.d); var res = add ? fAdd(x, y) : fSub(x, y); var tops = add ? x.n * L / x.d + y.n * L / y.d : x.n * L / x.d - y.n * L / y.d;
    return Qn(fStr(x) + (add ? ' + ' : ' − ') + fStr(y) + ' = ?' + (add ? '   (as a mixed number if more than 1)' : ''), res, W([
      G('The pieces are different sizes. What is the smallest number that both ' + x.d + ' and ' + y.d + ' go into?', F(L), 'Use ' + L + 'ths.', {}, 'Count up in ' + Math.max(x.d, y.d) + 's until ' + Math.min(x.d, y.d) + ' also goes in.'),
      G(fStr(x) + ' = ?/' + L, F(x.n * L / x.d), fStr(x) + ' = ' + x.n * L / x.d + '/' + L + '.', {}, 'What did you multiply ' + x.d + ' by to get ' + L + '? Do the same to the top.'),
      G(fStr(y) + ' = ?/' + L, F(y.n * L / y.d), fStr(y) + ' = ' + y.n * L / y.d + '/' + L + '.', {}, 'Same idea for ' + fStr(y) + '.'),
      G('Now ' + (add ? 'add' : 'subtract') + ' the tops. ' + x.n * L / x.d + '/' + L + (add ? ' + ' : ' − ') + y.n * L / y.d + '/' + L + ' = ?/' + L, F(tops), tops + '/' + L + ' — now simplify it if you can.', {}, 'The bottom stays ' + L + '.'),
      TELL], { simplest: true, show: mixedStr(res) }));
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
  function pctBar(lab, parts) { return { rows: [{ label: lab, parts: parts }] }; }
  topic('p5pct', 5, 'Percentage', 'Percentage: part of a whole, discount, GST, interest', function () {
    var k = ri(0, 3);
    if (k === 0) { var w = pick([20, 25, 40, 50, 80, 200, 400]), pc = pick([5, 10, 15, 20, 25, 30, 40, 60, 75]); var part = w * pc / 100; if (part % 1) { w = 200; part = 2 * pc; }
      return Qn(part + ' out of ' + w + ' is what percentage?', F(pc), W([
        G('Write ' + part + ' out of ' + w + ' as a fraction in its simplest form.', F(part, w), part + '/' + w + ' = ' + fStr(F(part, w)) + '.', {}, 'Part on top, whole underneath.', { simplest: true }),
        G('Percent means "out of 100". ' + fStr(F(part, w)) + ' = ?/100', F(pc), fStr(F(part, w)) + ' = ' + pc + '/100 = ' + pc + '%.', { m: pctBar(String(w), [{ w: pc / 10, k: 'hl', t: pc + '%' }, { w: 10 - pc / 10, t: '' }]) }, 'What do you multiply ' + F(part, w).d + ' by to make 100?'),
        TELL], { unit: '%' })); }
    if (k === 1) { var price = ri(4, 60) * 10, d = pick([10, 20, 25, 30, 40]); var sale = price * (100 - d) / 100;
      return Qn('A bag costs ' + money(price) + '. It is sold at ' + d + '% discount. What is the sale price?', fromDec(dec(sale, 2)), W([
        G('The full price is 100%. What percentage of the price do you still pay?', F(100 - d), 'You pay ' + (100 - d) + '%.', { m: pctBar(money(price), [{ w: d / 10, k: 'gone', t: d + '% off' }, { w: (100 - d) / 10, k: 'q', t: '?' }]) }, 'Take the discount away from 100%.'),
        G('What is 10% of ' + money(price) + '?', fromDec(dec(price / 10, 2)), '10% = ' + money(price / 10) + '.', {}, '10% is one tenth.', { show: money(price / 10) }),
        G('So what is ' + (100 - d) + '% of ' + money(price) + ' — the sale price?', fromDec(dec(sale, 2)), 'Sale price = ' + money(sale) + '.', { m: pctBar(money(price), [{ w: d / 10, k: 'gone', t: d + '% off' }, { w: (100 - d) / 10, k: 'hl', t: money(sale) }]) }, 'How many tens of percent is ' + (100 - d) + '%?', { show: money(sale) }),
        TELL], { show: money(sale) })); }
    if (k === 2) { var cost = ri(2, 40) * 10; var tot = Math.round(cost * 109) / 100;
      return Qn('A meal costs ' + money(cost) + ' before GST of 9%. What is the price with GST?', fromDec(dec(tot, 2)), W([
        G('What is 1% of ' + money(cost) + '?', fromDec(dec(cost / 100, 2)), '1% = ' + money(cost / 100) + '.', {}, 'Divide by 100.', { show: money(cost / 100) }),
        G('So how much is the 9% GST?', fromDec(dec(cost * 9 / 100, 2)), 'GST = ' + money(cost * 9 / 100) + '.', {}, '9 lots of 1%.', { show: money(cost * 9 / 100) }),
        G('What do you pay altogether?', fromDec(dec(tot, 2)), 'With GST: ' + money(tot) + '.', { m: pctBar('', [{ w: 10, t: money(cost) + ' (100%)' }, { w: 1.5, k: 'x', t: '9%' }]) }, 'Price plus GST.', { show: money(tot) }),
        TELL], { show: money(tot) })); }
    var P = ri(2, 30) * 100, r = pick([2, 3, 4, 5]);
    return Qn('Mum puts ' + money(P) + ' in the bank at ' + r + '% interest a year. How much interest does she get after 1 year?', F(P * r / 100), W([
      G('What is 1% of ' + money(P) + '?', F(P / 100), '1% = ' + money(P / 100) + '.', {}, 'Divide by 100.', { show: money(P / 100) }),
      G('So what is ' + r + '%?', F(P * r / 100), 'Interest = ' + money(P * r / 100) + '.', {}, r + ' lots of 1%.', { show: money(P * r / 100) }),
      TELL], { show: money(P * r / 100) }));
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
    if (k === 0) { var pc = pick([10, 20, 25, 40, 50, 60, 75, 80]), whole = ri(2, 30) * 20; var part = whole * pc / 100; var g = gcd(pc, 100);
      return Qn(pc + '% of a number is ' + part + '. What is the number?', F(whole), W([
        G('Draw the whole number as a bar of 100%. ' + pc + '% of it is ' + part + '. How many lots of ' + g + '% are in ' + pc + '%?', F(pc / g), pc + '% is ' + pc / g + ' lots of ' + g + '%.', { m: pctBar('?', [{ w: pc / 10, k: 'hl', t: pc + '% = ' + part }, { w: 10 - pc / 10, k: 'q', t: '?' }]) }, 'Divide ' + pc + ' by ' + g + '.'),
        G('So what is ' + g + '% of the number?', F(part * g, pc), g + '% = ' + part * g / pc + '.', {}, 'Share ' + part + ' into ' + pc / g + ' equal lots.'),
        G('100% is ' + 100 / g + ' lots of ' + g + '%. What is the whole number?', F(whole), 'The number is ' + whole + '.', { m: pctBar(String(whole), [{ w: 10, k: 'hl', t: '100% = ' + whole }]) }, 'Multiply.'),
        TELL])); }
    if (k === 1) { var old = ri(2, 20) * 20, inc = pick([5, 10, 15, 20, 25, 50]); var nw = old * (100 + inc) / 100;
      return Qn('The price of a book went up from ' + money(old) + ' to ' + money(nw) + '. What is the percentage increase?', F(inc), W([
        G('By how much did the price go up?', F(nw - old), 'It went up by ' + money(nw - old) + '.', { m: { rows: [{ label: 'Before', parts: [{ w: 8, t: money(old) }] }, { label: 'After', parts: [{ w: 8, t: money(old) }, { w: 8 * inc / 100, k: 'x', t: '' }] }] } }, 'New price take away old price.', { show: money(nw - old) }),
        G('Write the increase as a fraction of the OLD price, in simplest form.', F(nw - old, old), money(nw - old) + ' out of ' + money(old) + ' = ' + fStr(F(nw - old, old)) + '.', {}, 'Increase on top, old price underneath.', { simplest: true }),
        G('As a percentage?', F(inc), 'That is ' + inc + '%.', {}, 'Make the bottom 100.'),
        TELL], { unit: '%' })); }
    var o2 = ri(2, 20) * 40, dc = pick([10, 20, 25, 30, 40]); var now = o2 * (100 - dc) / 100;
    return Qn('A school had ' + o2 + ' pupils. The number fell by ' + dc + '%. How many pupils are there now?', F(now), W([
      G('What percentage of the pupils are still there?', F(100 - dc), (100 - dc) + '% are left.', { m: pctBar(String(o2), [{ w: dc / 10, k: 'gone', t: dc + '%' }, { w: (100 - dc) / 10, k: 'q', t: '?' }]) }, 'Start from 100%.'),
      G('What is 10% of ' + o2 + '?', F(o2, 10), '10% = ' + o2 / 10 + '.', {}, 'One tenth.'),
      G('So how many pupils now?', F(now), now + ' pupils.', { m: pctBar(String(o2), [{ w: dc / 10, k: 'gone', t: dc + '%' }, { w: (100 - dc) / 10, k: 'hl', t: String(now) }]) }, 'How many tens of percent are left?'),
      TELL]));
  });
  topic('p6ratio', 6, 'Ratio', 'Ratio', function () {
    var k = ri(0, 3); var a = ri(1, 7), b = ri(1, 9); while (gcd(a, b) !== 1 || a === b) { a = ri(1, 7); b = ri(2, 9); }
    var bars = function (la, lb, ta, tb, hb) { return { rows: [{ label: la, parts: units(a, ta) }, { label: lb, parts: units(b, tb, hb) }] }; };
    if (k === 0) { var m = ri(2, 9);
      return Qn('Write ' + a * m + ' : ' + b * m + ' in its simplest form (like 2:3).', null, W([
        G('What is the biggest number that divides both ' + a * m + ' and ' + b * m + '?', F(m), 'Both divide by ' + m + '.', {}, 'List the factors of the smaller number and test them.'),
        G('Divide both by ' + m + '. What is the first number now?', F(a), a + ' : ' + b + '.', {}, a * m + ' ÷ ' + m + '.'),
        TELL], { ratio: [a, b], show: a + ' : ' + b })); }
    if (k === 1) { var u = ri(3, 20);
      return Qn(money((a + b) * u) + ' is shared between Ali and Ben in the ratio ' + a + ' : ' + b + '. How much does Ben get?', F(b * u), W([
        G('Ali gets ' + a + ' units and Ben ' + b + '. How many units altogether?', F(a + b), (a + b) + ' units make ' + money((a + b) * u) + '.', { m: { rows: bars('Ali', 'Ben', '', '').rows, right: { rows: [0, 1], t: money((a + b) * u) } } }, 'Add the two parts of the ratio.'),
        G('How much is 1 unit?', F(u), '1 unit = ' + money(u) + '.', { m: bars('Ali', 'Ben', money(u), money(u)) }, money((a + b) * u) + ' shared among ' + (a + b) + ' units.', { show: money(u) }),
        G('How much does Ben get?', F(b * u), 'Ben gets ' + money(b * u) + '.', { m: bars('Ali', 'Ben', money(u), money(u), 'hl') }, 'Ben has ' + b + ' units.', { show: money(b * u) }),
        TELL], { show: money(b * u) })); }
    if (k === 2) { var m2 = ri(2, 8);
      return Qn(a + ' : ' + b + ' = ' + a * m2 + ' : ?', F(b * m2), W([
        G(a + ' became ' + a * m2 + '. What was it multiplied by?', F(m2), 'Multiplied by ' + m2 + '.', {}, a + ' × ? = ' + a * m2),
        G('Do the same to ' + b + '. What is the missing number?', F(b * m2), b + ' × ' + m2 + ' = ' + b * m2 + '.', {}, 'Both sides of a ratio change the same way.'),
        TELL])); }
    return Qn('The ratio of boys to girls is ' + a + ' : ' + b + '. What fraction of the children are girls?', F(b, a + b), W([
      G('Draw boys as ' + a + ' units and girls as ' + b + ' units. How many units of children altogether?', F(a + b), (a + b) + ' units of children.', { m: bars('Boys', 'Girls', '', '') }, 'Add the parts.'),
      G('How many of those units are girls?', F(b), b + ' units are girls.', { m: bars('Boys', 'Girls', '', '', 'hl') }, 'Look at the second number of the ratio.'),
      G('So what fraction of the children are girls?', F(b, a + b), 'Girls are ' + b + '/' + (a + b) + '.', {}, 'Girls\' units over all the units.', { simplest: true }),
      TELL], { simplest: true }));
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


  // When she goes wrong on a topic without a guided walk-through, she first gets a question to think about, not the answer.
  var NUDGE = {
    p3add: 'Line the numbers up again, ones under ones. Which column did you carry or regroup in — was it right?',
    p3muldiv: 'Which times-table fact helps here? Work through it one place at a time.',
    p3mental: 'Could you split each number into tens and ones, and put the tens together first?',
    p3equiv: 'What number can you divide (or multiply) BOTH the top and the bottom by?',
    p3fadd: 'Are the pieces the same size? How could you make the bottom numbers the same?',
    p3time: 'Could you count on to the next o\'clock first, then whole hours, then the minutes?',
    p3units: 'How many of the small unit make one of the big unit?',
    p3area: 'Is it asking for the space inside (area) or the distance all the way round (perimeter)?',
    p4round: 'Which digit decides whether you round up or down?',
    p4factors: 'Can you list them in order, so you do not miss any?',
    p4mul: 'Estimate first: roughly how big should the answer be? Does yours fit?',
    p4mixed: 'How many wholes can you make from the top number? What is left over?',
    p4decplace: 'Which place is each digit in — tenths, hundredths or thousandths?',
    p4decops: 'Did you line up the decimal points? Estimate: about what should it be?',
    p4rect: 'Would a quick sketch with the measurements on it help you see it?',
    p4angle: 'How many degrees make a right angle — a quarter turn?',
    p5order: 'Which part of the sum must be done first?',
    p5tens: 'What happens to each digit when you multiply or divide by 10?',
    p5fquot: 'How many whole times does it go in, and what fraction is left over?',
    p5fmixed: 'Would it be easier to change both into improper fractions first?',
    p5fmul: 'Can you cancel a common factor before you multiply?',
    p5decten: 'Which way does the decimal point move, and by how many places?',
    p5rate: 'What is the amount for just ONE (one minute, one orange, one page)?',
    p5tri: 'Which side is the base, and which line is the height standing straight up from it?',
    p5vol: 'Which three measurements make a volume? And how many cm³ make one litre?',
    p5angles: 'What do these angles add up to — 90°, 180° or 360°?',
    p6fdiv: 'How many of the second number fit into the first? Could you multiply by the reciprocal instead?',
    p6alg: 'What could you do to both sides to get the letter on its own?',
    p6circle: 'Is it asking for area or the distance round? Do you have the radius or the diameter?',
    p6vol: 'Volume = length × width × height. Which one is missing?',
    p6avg: 'What is the total of all the numbers?'
  };

  // ---------- heuristics: word problems, each solved step by step with a model or a table ----------
  // A walk is a list of steps; each step has words (t) and may show a bar model (m), a table (tab) or a number machine (flow).
  // Bar models: rows of bars made of parts measured in units (w); k marks a part: 'x' extra, 'q' unknown, 'gone' taken away,
  // 'hl' the answer. 'tops' are braces over part of a row; 'right' is a brace down the side covering several rows.
  var H = [];
  function heur(id, name, gen) { H.push({ id: id, name: name, gen: gen }); }
  var names = ['Aisha', 'Ben', 'Chloe', 'Daniel', 'Farah', 'Hui Min', 'Jun Wei', 'Kumar', 'Mei Ling', 'Nur', 'Priya', 'Ravi', 'Siti', 'Wei Jie'];
  function two() { var s = shuffle(names); return [s[0], s[1], s[2]]; }
  function units(n, t, k) { var a = []; for (var i = 0; i < n; i++) a.push({ w: 1, t: t || '', k: k || '' }); return a; }
  function W(steps, extra) { var o = extra || {}; o.walk = steps; o.steps = steps.filter(function (s) { return s.t; }).map(function (s) { return s.t; }); return o; }
  // One guiding question: she works out 'a' herself; 't' is what the step means once she has it; the picture grows with her.
  function G(ask, a, t, vis, hint, opt) {
    var s = { ask: ask, t: t, hint: hint || '' }; if (typeof a === 'string') { s.choices = opt; s.a = a; s.show = a; } else { s.a = a; s.show = (opt && opt.show) || (a.d === 1 ? String(a.n) : mixedStr(a)); if (opt && opt.simplest) s.simplest = true; }
    for (var k in vis || {}) s[k] = vis[k]; return s;
  }
  var TELL = { t: 'Now tell it back: explain to Mum, in your own words, how you worked it out. What did your model show?', tell: true };

  heur('model', 'Draw a model', function () {
    var p = two(), k = ri(0, 1);
    if (k === 0) {
      var diff = ri(2, 30) * 5, small = ri(5, 60) * 5; var tot = small * 2 + diff;
      var m1 = { rows: [{ label: p[0], parts: [{ w: 3 }, { w: 1, k: 'x', t: money(diff) }] }, { label: p[1], parts: [{ w: 3, k: 'q', t: '?' }] }], right: { rows: [0, 1], t: money(tot) } };
      return Qn(p[0] + ' and ' + p[1] + ' have ' + money(tot) + ' altogether. ' + p[0] + ' has ' + money(diff) + ' more than ' + p[1] + '. How much does ' + p[1] + ' have?', F(small), W([
        G('Who has more money?', p[0], 'So ' + p[0] + "'s bar is longer than " + p[1] + "'s by " + money(diff) + ', and both bars together make ' + money(tot) + '.', { m: m1 }, 'Read the second sentence again.', [p[0], p[1]]),
        G('Imagine covering up the extra piece. Then the two bars are the same length. How much do the two equal bars make together?', F(tot - diff), 'Two equal bars make ' + money(tot - diff) + '.', { m: { rows: [{ label: p[0], parts: [{ w: 3 }, { w: 1, k: 'gone', t: money(diff) }] }, { label: p[1], parts: [{ w: 3 }] }], right: { rows: [0, 1], t: money(tot - diff) } } }, 'The total includes the extra piece. What happens to the total if you take the extra away?', { show: money(tot - diff) }),
        G('How much is one of those equal bars?', F(small), 'One bar is ' + money(small) + ' — and that is ' + p[1] + "'s bar.", { m: { rows: [{ label: p[0], parts: [{ w: 3, t: money(small) }, { w: 1, k: 'x', t: money(diff) }] }, { label: p[1], parts: [{ w: 3, k: 'hl', t: money(small) }] }] } }, 'Two bars share ' + money(tot - diff) + ' equally.', { show: money(small) }),
        TELL], { show: money(small) }));
    }
    var u = ri(4, 25), m = ri(2, 5), tot2 = u * (m + 1);
    return Qn(p[0] + ' has ' + m + ' times as many stamps as ' + p[1] + '. They have ' + tot2 + ' stamps altogether. How many more stamps does ' + p[0] + ' have than ' + p[1] + '?', F(u * (m - 1)), W([
      G('Give ' + p[1] + ' one unit. How many of those units does ' + p[0] + ' have?', F(m), p[1] + ' has 1 unit; ' + p[0] + ' has ' + m + ' units the same size.', { m: { rows: [{ label: p[0], parts: units(m) }, { label: p[1], parts: units(1) }], right: { rows: [0, 1], t: String(tot2) } } }, '"' + m + ' times as many" — how many units is that?'),
      G('How many units are there altogether?', F(m + 1), (m + 1) + ' units make ' + tot2 + ' stamps.', {}, 'Count every box in both bars.'),
      G('So how many stamps is 1 unit?', F(u), '1 unit = ' + u + ' stamps.', { m: { rows: [{ label: p[0], parts: units(m, String(u)) }, { label: p[1], parts: units(1, String(u)) }] } }, tot2 + ' stamps are shared equally among ' + (m + 1) + ' units.'),
      G('Look at the bars. How many units longer is ' + p[0] + "'s bar than " + p[1] + "'s?", F(m - 1), 'The extra part is ' + (m - 1) + ' units.', { m: { rows: [{ label: p[0], parts: units(1, String(u)).concat(units(m - 1, String(u), 'hl')) }, { label: p[1], parts: units(1, String(u)) }], tops: [{ row: 0, from: 1, to: m, t: '?' }] } }, 'Line the bars up at the left. How many boxes stick out?'),
      G('How many stamps is that?', F(u * (m - 1)), p[0] + ' has ' + u * (m - 1) + ' more stamps.', {}, 'Each unit is ' + u + ' stamps.'),
      TELL]));
  });

  heur('beforeafter', 'Before and after', function () {
    var p = two(); var k = ri(0, 1);
    if (k === 0) {
      var m = pick([3, 5]), u = ri(3, 20) * 2; var halfDiff = (m - 1) / 2; var give = halfDiff * u;
      return Qn(p[0] + ' had ' + m + ' times as many marbles as ' + p[1] + '. After ' + p[0] + ' gave ' + give + ' marbles to ' + p[1] + ', they had the same number. How many marbles did ' + p[0] + ' have at first?', F(m * u), W([
        G('Before the giving: if ' + p[1] + ' has 1 unit, how many units does ' + p[0] + ' have?', F(m), 'Before: ' + p[0] + ' ' + m + ' units, ' + p[1] + ' 1 unit.', { m: { rows: [{ label: p[0], parts: units(m) }, { label: p[1], parts: units(1) }] } }, '"' + m + ' times as many."'),
        G('How many units more does ' + p[0] + ' have?', F(m - 1), 'The difference is ' + (m - 1) + ' units.', {}, 'Compare the two bars.'),
        G('To end up equal, what fraction of that difference must ' + p[0] + ' give away? (Think: if ' + p[0] + ' gave all of it, who would have more?)', F(1, 2), p[0] + ' gives half the difference — ' + (halfDiff === 1 ? '1 unit' : halfDiff + ' units') + ' — and that is the ' + give + ' marbles.', { m: { rows: [{ label: p[0], parts: units(m - halfDiff).concat(units(halfDiff, '', 'x')) }, { label: p[1], parts: units(1).concat(units(halfDiff, '', 'q')) }], tops: [{ row: 0, from: m - halfDiff, to: m, t: 'gives ' + give }] } }, 'Giving takes from one bar AND adds to the other. Try it with the bars.', { simplest: true }),
        G('So how many marbles is 1 unit?', F(u), '1 unit = ' + u + ' marbles.', { m: { rows: [{ label: p[0], parts: units(m, String(u)) }, { label: p[1], parts: units(1, String(u)) }] } }, (halfDiff === 1 ? '1 unit' : halfDiff + ' units') + ' make ' + give + ' marbles.'),
        G('How many marbles did ' + p[0] + ' have at first?', F(m * u), p[0] + ' had ' + m * u + '.', {}, 'At first ' + p[0] + ' had ' + m + ' units.'),
        TELL]));
    }
    var a = ri(2, 5), b = ri(a + 1, 8), u2 = ri(3, 15), add = (b - a) * u2;
    return Qn('The ratio of ' + p[0] + "'s money to " + p[1] + "'s money was " + a + ' : ' + b + '. After ' + p[0] + ' saved another ' + money(add) + ', they had the same amount. How much did ' + p[1] + ' have?', F(b * u2), W([
      G('Whose money did not change?', p[1], p[1] + "'s money stays " + b + ' units the whole time.', { m: { rows: [{ label: p[0], parts: units(a) }, { label: p[1], parts: units(b) }] } }, 'Who saved more money?', [p[0], p[1]]),
      G('How many more units does ' + p[0] + ' need to catch up?', F(b - a), 'The ' + money(add) + ' fills a gap of ' + (b - a) + (b - a === 1 ? ' unit.' : ' units.'), { m: { rows: [{ label: p[0], parts: units(a).concat([{ w: b - a, k: 'x', t: '+' + money(add) }]) }, { label: p[1], parts: units(b) }] } }, 'Compare ' + a + ' units with ' + b + ' units.'),
      G('So how much is 1 unit?', F(u2), '1 unit = ' + money(u2) + '.', { m: { rows: [{ label: p[0], parts: units(a, money(u2)).concat(units(b - a, money(u2), 'x')) }, { label: p[1], parts: units(b, money(u2)) }] } }, money(add) + ' is ' + (b - a) + ' equal units.', { show: money(u2) }),
      G('How much did ' + p[1] + ' have?', F(b * u2), p[1] + ' had ' + money(b * u2) + '.', {}, p[1] + ' has ' + b + ' units.', { show: money(b * u2) }),
      TELL], { show: money(b * u2) }));
  });

  heur('backwards', 'Work backwards', function () {
    var p = two();
    if (Math.random() < 0.5) {
      var left = ri(4, 30) * 2, spent2 = ri(2, 20), half = left + spent2, start = half * 2;
      return Qn(p[0] + ' spent half of the money in the purse on a book and then ' + money(spent2) + ' on lunch. ' + money(left) + ' was left. How much was in the purse at first?', F(start), W([
        G('What fraction of the purse went on the book?', F(1, 2), 'Half went on the book; the other half was used for lunch and what was left.', { m: { rows: [{ label: 'Purse', parts: [{ w: 3, t: 'book' }, { w: 1.2, k: 'x', t: money(spent2) }, { w: 1.8, t: money(left) }] }], tops: [{ row: 0, from: 3, to: 6, t: '?' }] } }, 'Read the first part of the question.'),
        G('Work backwards from the end. How much was the second half before lunch was bought?', F(half), 'That half was ' + money(half) + '.', { m: { rows: [{ label: 'Purse', parts: [{ w: 3, t: 'book' }, { w: 3, k: 'hl', t: money(half) }] }] } }, 'Put the lunch money back with what was left.', { show: money(half) }),
        G('So how much was in the purse at first?', F(start), 'At first: ' + money(start) + '.', { m: { rows: [{ label: 'Purse', parts: [{ w: 3, t: money(half) }, { w: 3, t: money(half) }] }], right: { rows: [0, 0], t: money(start) } } }, 'Both halves are the same size.', { show: money(start) }),
        TELL], { show: money(start) }));
    }
    var n = ri(2, 12), add = ri(3, 20), mul = ri(2, 5), res = n * mul + add;
    return Qn('I think of a number, multiply it by ' + mul + ' and add ' + add + '. The answer is ' + res + '. What was my number?', F(n), W([
      G('What was the LAST thing done to the number?', 'add ' + add, 'So undo that first.', { flow: ['?', '× ' + mul, '+ ' + add, String(res)] }, 'Read the steps in order.', ['multiply by ' + mul, 'add ' + add]),
      G('What undoes "add ' + add + '"? Work it out: what is ' + res + ' with that step undone?', F(res - add), 'Before the adding, the number was ' + (res - add) + '.', { flow: [String(res), '− ' + add, String(res - add)] }, 'The opposite of adding is…'),
      G('Now undo "multiply by ' + mul + '". What was the number at the start?', F(n), 'The number was ' + n + '.', { flow: [String(res), '− ' + add, String(res - add), '÷ ' + mul, String(n)] }, 'The opposite of multiplying is…'),
      TELL]));
  });

  heur('remainder', 'Fraction of a remainder', function () {
    var p = two(); var d1 = pick([3, 4, 5]), d2 = pick([2, 3, 4]), n2 = ri(1, d2 - 1); if (gcd(n2, d2) !== 1) n2 = 1; var u = ri(2, 12) * d2; var tot = u * d1; var r1 = tot - u; var piece = r1 / d2; var left = piece * (d2 - n2);
    function rem(labLeft, labPen) { var a = []; for (var i = 0; i < d2; i++) a.push({ w: (d1 - 1) * 2 / d2, k: i < n2 ? 'x' : '', t: i < n2 ? labPen : labLeft }); return a; }
    var top = { rows: [{ label: 'All', parts: [{ w: 2, k: 'x', t: 'book' }].concat(units(d1 - 1).map(function (x) { x.w = 2; return x; })) }] };
    return Qn(p[0] + ' spent 1/' + d1 + ' of some pocket money on a book and ' + n2 + '/' + d2 + ' of the remainder on a pen. ' + money(left) + ' was left. How much pocket money was there at first?', F(tot), W([
      G('The book is 1/' + d1 + ' of the money. Into how many equal units should you cut the bar for all the money?', F(d1), 'Cut the whole bar into ' + d1 + ' units; 1 unit is the book.', { m: top }, 'Look at the bottom of the fraction.'),
      G('How many units are left after the book — the remainder?', F(d1 - 1), 'The remainder is ' + (d1 - 1) + ' units.', { m: { rows: top.rows, tops: [{ row: 0, from: 2, to: 2 * d1, t: 'remainder' }] } }, 'Take the book unit away.'),
      G('Draw the remainder again below and cut it into ' + d2 + ' equal parts. ' + n2 + ' went on the pen. How many parts are left?', F(d2 - n2), (d2 - n2) + ' part' + (d2 - n2 > 1 ? 's are' : ' is') + ' left, and ' + (d2 - n2 > 1 ? 'they make' : 'it makes') + ' ' + money(left) + '.', { m: { rows: top.rows.concat([{ label: 'Remainder', indent: 2, parts: rem('', 'pen') }]), tops: [{ row: 1, from: 2 + n2 * (d1 - 1) * 2 / d2, to: 2 + (d1 - 1) * 2, t: money(left) }] } }, d2 + ' parts, take away the pen.'),
      G('How much is 1 of those parts?', F(piece), '1 part = ' + money(piece) + '.', {}, money(left) + ' shared among ' + (d2 - n2) + ' part' + (d2 - n2 > 1 ? 's' : '') + '.', { show: money(piece) }),
      G('So how much was the whole remainder?', F(r1), 'The remainder was ' + money(r1) + '.', { m: { rows: [{ label: 'Remainder', parts: rem(money(piece), money(piece)) }], right: { rows: [0, 0], t: money(r1) } } }, 'The remainder has ' + d2 + ' parts.', { show: money(r1) }),
      G('The remainder is ' + (d1 - 1) + ' units of the top bar. How much is 1 unit?', F(u), '1 unit = ' + money(u) + '.', {}, money(r1) + ' shared among ' + (d1 - 1) + ' units.', { show: money(u) }),
      G('How much pocket money was there at first?', F(tot), 'At first: ' + money(tot) + '.', { m: { rows: [{ label: 'All', parts: units(d1, money(u), 'hl').map(function (x) { x.w = 2; return x; }) }], right: { rows: [0, 0], t: money(tot) } } }, 'The whole bar has ' + d1 + ' units.', { show: money(tot) }),
      TELL], { show: money(tot) }));
  });

  heur('supposition', 'Make a supposition', function () {
    var c = ri(5, 25), g = ri(3, 20); var heads = c + g, legs = 2 * c + 4 * g;
    var rows = [['0', String(heads), String(2 * heads)], ['1', String(heads - 1), String(2 * heads + 2)], ['2', String(heads - 2), String(2 * heads + 4)], ['…', '…', '…']];
    return Qn('A farm has chickens and goats. There are ' + heads + ' heads and ' + legs + ' legs. How many goats are there?', F(g), W([
      G('Suppose every one of the ' + heads + ' animals were a chicken. How many legs would there be?', F(2 * heads), 'All chickens: ' + 2 * heads + ' legs.', {}, 'Each animal has one head. How many legs has a chicken?'),
      G('There are really ' + legs + ' legs. How many legs are missing from our all-chicken farm?', F(legs - 2 * heads), legs - 2 * heads + ' legs still to find.', {}, 'Compare ' + legs + ' with ' + 2 * heads + '.'),
      G('Swap one chicken for a goat. How many more legs does that add?', F(2), 'Each swap adds 2 legs:', { tab: { head: ['Goats', 'Chickens', 'Legs'], rows: rows } }, 'A goat has 4 legs, a chicken 2.'),
      G('So how many goats?', F(g), g + ' goats.', {}, 'How many swaps of 2 legs make ' + (legs - 2 * heads) + '?'),
      TELL]));
  });

  heur('guess', 'Guess and check', function () {
    var a = ri(3, 12), b = ri(3, 12); var p5 = ri(4, 12), p2 = ri(2, p5 - 1); var tot = a * p5 + b * p2; var n = a + b;
    var g0 = Math.round(n / 2); if (g0 === a) g0 = a > 1 ? a - 1 : a + 1; var c0 = g0 * p5 + (n - g0) * p2;
    var tries = [], g = g0, lo = 0, hi = n, seen = {};
    for (var s = 0; s < 6; s++) { if (seen[g]) break; seen[g] = 1; var cost = g * p5 + (n - g) * p2; tries.push([String(g), String(n - g), money(cost), cost === tot ? '✓ just right' : cost > tot ? 'too much' : 'too little']); if (cost === tot) break; if (cost > tot) hi = g; else lo = g; g = Math.round((lo + hi) / 2); if (seen[g]) g = cost > tot ? g - 1 : g + 1; }
    if (tries[tries.length - 1][3].indexOf('✓') < 0) tries.push([String(a), String(b), money(tot), '✓ just right']);
    return Qn('Notebooks cost ' + money(p5) + ' and pencils cost ' + money(p2) + '. Siti bought ' + n + ' items for ' + money(tot) + ' altogether. How many notebooks did she buy?', F(a), W([
      G('Try a guess: ' + g0 + ' notebooks and ' + (n - g0) + ' pencils. What would they cost?', F(c0), g0 + ' notebooks and ' + (n - g0) + ' pencils cost ' + money(c0) + '.', { pre: { tab: { head: ['Notebooks', 'Pencils', 'Cost', 'Check'], rows: [[String(g0), String(n - g0), '?', '']] } }, tab: { head: ['Notebooks', 'Pencils', 'Cost', 'Check'], rows: [[String(g0), String(n - g0), money(c0), '']] } }, g0 + ' × ' + money(p5) + ', plus ' + (n - g0) + ' × ' + money(p2) + '.', { show: money(c0) }),
      G('Is that too much or too little?', c0 > tot ? 'too much' : 'too little', c0 > tot ? 'Too much — so try FEWER notebooks (they are the dearer ones).' : 'Too little — so try MORE notebooks (they are the dearer ones).', {}, 'Compare with ' + money(tot) + '.', ['too much', 'too little']),
      G('Keep adjusting and record each try in a table, like this. How many notebooks did she buy?', F(a), 'She bought ' + a + ' notebooks.', { tab: { head: ['Notebooks', 'Pencils', 'Cost', 'Check'], rows: tries } }, 'Find the row that costs exactly ' + money(tot) + '.'),
      TELL]));
  });

  heur('pattern', 'Look for a pattern', function () {
    var s = ri(2, 5), add = ri(2, 6), n = ri(8, 25); var term = s + (n - 1) * add;
    return Qn('Figure 1 uses ' + s + ' sticks, Figure 2 uses ' + (s + add) + ', Figure 3 uses ' + (s + 2 * add) + '. The pattern goes on. How many sticks does Figure ' + n + ' use?', F(term), W([
      G('Look at the table. How many sticks are added each time?', F(add), 'Each figure adds ' + add + ' sticks.', { pre: { tab: { head: ['Figure', 'Sticks'], rows: [['1', String(s)], ['2', String(s + add)], ['3', String(s + 2 * add)], ['4', '?']] } }, tab: { head: ['Figure', 'Sticks'], rows: [['1', String(s)], ['2', String(s + add)], ['3', String(s + 2 * add)], ['4', String(s + 3 * add)]] } }, 'Subtract one figure from the next.'),
      G('Going from Figure 1 to Figure ' + n + ', how many times are ' + add + ' sticks added?', F(n - 1), (n - 1) + ' times.', { pre: { tab: { head: ['Figure', 'Sticks', 'Times added'], rows: [['1', String(s), '0'], ['2', String(s + add), '1'], ['3', String(s + 2 * add), '2'], ['…', '…', '…'], [String(n), '?', '?']] } }, tab: { head: ['Figure', 'Sticks', 'Times added'], rows: [['1', String(s), '0'], ['2', String(s + add), '1'], ['3', String(s + 2 * add), '2'], ['…', '…', '…'], [String(n), '?', String(n - 1)]] } }, 'Figure 2 has had it added once, Figure 3 twice…'),
      G('So how many sticks in Figure ' + n + '?', F(term), 'Figure ' + n + ' uses ' + term + ' sticks.', {}, 'Start with Figure 1 and add on.'),
      TELL]));
  });

  heur('list', 'Make a systematic list', function () {
    if (Math.random() < 0.5) {
      var tt = ri(3, 4), bb = ri(2, 3); var toasts = ['kaya', 'butter', 'peanut', 'egg'].slice(0, tt), drinks = ['kopi', 'teh', 'milo'].slice(0, bb);
      var rows = []; toasts.forEach(function (x) { drinks.forEach(function (y) { rows.push([x + ' toast', y]); }); });
      return Qn('A kopitiam has ' + tt + ' kinds of toast (' + toasts.join(', ') + ') and ' + bb + ' drinks (' + drinks.join(', ') + '). How many different breakfasts of one toast and one drink can you choose?', F(tt * bb), W([
        G('Start with kaya toast. How many different drinks can go with it?', F(bb), 'Kaya toast makes ' + bb + ' breakfasts.', { tab: { head: ['Toast', 'Drink'], rows: rows.slice(0, bb) } }, 'List them: kaya with each drink.'),
        G('Does each of the other toasts also go with ' + bb + ' drinks?', 'yes', 'Yes — list them in the same order so none is missed.', { tab: { head: ['Toast', 'Drink'], rows: rows } }, 'Try butter toast.', ['yes', 'no']),
        G('So how many breakfasts altogether?', F(tt * bb), tt * bb + ' breakfasts.', {}, tt + ' toasts, ' + bb + ' each.'),
        TELL]));
    }
    var tot = pick([20, 25, 30, 35, 40]); var rows2 = [], ways = 0;
    for (var x = 0; x * 5 <= tot; x++) { var rest = tot - 5 * x; var ok = rest % 2 === 0; if (ok) ways++; rows2.push([String(x), rest + '¢', ok ? rest / 2 + ' × 2¢ ✓' : 'no ✗']); }
    return Qn('In how many ways can you make exactly ' + tot + '¢ using only 2¢ and 5¢ coins?', F(ways), W([
      G('Go in order of 5¢ coins. With no 5¢ coins, can ' + tot + '¢ be made from 2¢ coins alone?', tot % 2 === 0 ? 'yes' : 'no', tot % 2 === 0 ? 'Yes: ' + tot / 2 + ' two-cent coins.' : 'No — 2¢ coins only make even amounts.', { tab: { head: ['5¢ coins', 'Left', '2¢ coins'], rows: rows2.slice(0, 1) } }, 'Can 2¢ coins make an odd amount?', ['yes', 'no']),
      G('What must be true of the amount left over, for 2¢ coins to make it?', 'it is even', 'It must be even.', {}, 'Count in 2s: 2, 4, 6…', ['it is even', 'it is odd', 'it is more than 10']),
      G('Carry on the list for 1, 2, 3 … five-cent coins. How many ways are there?', F(ways), ways + ' ways.', { tab: { head: ['5¢ coins', 'Left', '2¢ coins'], rows: rows2 } }, 'Count the ticks.'),
      TELL]));
  });

  heur('algebra', 'Use algebra', function () {
    var x = ri(4, 20), a = ri(2, 4), b = ri(3, 15); var p = two(); var total = (a + 1) * x + 2 * b;
    return Qn(p[0] + ' is ' + a + ' times as old as ' + p[1] + '. In ' + b + ' years, their ages will add up to ' + total + '. How old is ' + p[1] + ' now?', F(x), W([
      G('Let ' + p[1] + ' be y years old now. ' + p[0] + ' is how many y? (Type the number in front of y.)', F(a), p[0] + ' is ' + a + 'y now.', { m: { rows: [{ label: p[0], parts: units(a, 'y') }, { label: p[1], parts: units(1, 'y') }] } }, '"' + a + ' times as old."'),
      G('In ' + b + ' years, how many years older will EACH of them be?', F(b), 'Each adds ' + b + ' years.', { m: { rows: [{ label: p[0], parts: units(a, 'y').concat([{ w: 1, k: 'x', t: '+' + b }]) }, { label: p[1], parts: units(1, 'y').concat([{ w: 1, k: 'x', t: '+' + b }]) }], right: { rows: [0, 1], t: String(total) } } }, 'Everyone gets older at the same speed.'),
      G('Together that is ' + (a + 1) + 'y + ? = ' + total + '. What number goes in place of the ?', F(2 * b), (a + 1) + 'y + ' + 2 * b + ' = ' + total + '.', {}, 'Two people each add ' + b + '.'),
      G('So ' + (a + 1) + 'y = ?', F((a + 1) * x), (a + 1) + 'y = ' + (a + 1) * x + '.', {}, 'Take ' + 2 * b + ' away from ' + total + '.'),
      G('So y = ?', F(x), p[1] + ' is ' + x + '.', { m: { rows: [{ label: p[1], parts: units(1, String(x), 'hl') }] } }, 'Share ' + (a + 1) * x + ' among ' + (a + 1) + '.'),
      TELL]));
  });

  // ---------- drawing a bar model as SVG ----------
  function xesc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function svg(M) {
    var LW = 96, RH = 36, GAP = 46, PADT = 44, maxU = 0;
    M.rows.forEach(function (r) { var s = (r.indent || 0); r.parts.forEach(function (p) { s += p.w; }); if (s > maxU) maxU = s; });
    var U = Math.min(64, 440 / maxU); var Wd = LW + maxU * U + (M.right ? 120 : 20), Ht = PADT + M.rows.length * (RH + GAP);
    var o = '<svg class="mt-model" viewBox="0 0 ' + Wd + ' ' + Ht + '" role="img" aria-label="Bar model">';
    o += '<defs><pattern id="mtHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" stroke-width="2" opacity=".35"/></pattern></defs>';
    function y(i) { return PADT + i * (RH + GAP); }
    M.rows.forEach(function (r, i) {
      o += '<text x="' + (LW - 8) + '" y="' + (y(i) + RH / 2 + 5) + '" text-anchor="end" class="mt-lab">' + xesc(r.label) + '</text>';
      var x = LW + (r.indent || 0) * U;
      r.parts.forEach(function (p) {
        var w = p.w * U; var cls = 'mt-part' + (p.k ? ' k-' + p.k : '');
        o += '<rect x="' + x + '" y="' + y(i) + '" width="' + w + '" height="' + RH + '" class="' + cls + '"/>';
        if (p.k === 'x' || p.k === 'gone') o += '<rect x="' + x + '" y="' + y(i) + '" width="' + w + '" height="' + RH + '" fill="url(#mtHatch)" class="mt-hatch"/>';
        if (p.k === 'gone') o += '<line x1="' + x + '" y1="' + y(i) + '" x2="' + (x + w) + '" y2="' + (y(i) + RH) + '" class="mt-cross"/><line x1="' + x + '" y1="' + (y(i) + RH) + '" x2="' + (x + w) + '" y2="' + y(i) + '" class="mt-cross"/>';
        if (p.t) o += '<text x="' + (x + w / 2) + '" y="' + (y(i) + RH / 2 + 5) + '" text-anchor="middle" class="mt-ptxt"' + (w < 30 ? ' font-size="10"' : '') + '>' + xesc(p.t) + '</text>';
        x += w;
      });
    });
    (M.tops || []).forEach(function (b) {
      var x1 = LW + b.from * U, x2 = LW + b.to * U, yy = y(b.row) - 6;
      o += '<path d="M' + x1 + ' ' + yy + ' q0 -8 8 -8 L' + ((x1 + x2) / 2 - 6) + ' ' + (yy - 8) + ' q6 0 6 -6 q0 6 6 6 L' + (x2 - 8) + ' ' + (yy - 8) + ' q8 0 8 8" class="mt-brace"/>';
      o += '<text x="' + (x1 + x2) / 2 + '" y="' + (yy - 17) + '" text-anchor="middle" class="mt-btxt">' + xesc(b.t) + '</text>';
    });
    if (M.right) {
      var r0 = M.right.rows[0], r1 = M.right.rows[1]; var xr = LW + maxU * U + 10, y1 = y(r0), y2 = y(r1) + RH, ym = (y1 + y2) / 2;
      o += '<path d="M' + xr + ' ' + y1 + ' q8 0 8 8 L' + (xr + 8) + ' ' + (ym - 6) + ' q0 6 6 6 q-6 0 -6 6 L' + (xr + 8) + ' ' + (y2 - 8) + ' q0 8 -8 8" class="mt-brace"/>';
      o += '<text x="' + (xr + 20) + '" y="' + (ym + 5) + '" class="mt-btxt">' + xesc(M.right.t) + '</text>';
    }
    return o + '</svg>';
  }
  function flowHTML(f) { return '<div class="mt-flow">' + f.map(function (s, i) { var op = /^[×÷+−]/.test(s); return (i ? '<span class="mt-arrow">→</span>' : '') + '<span class="' + (op ? 'mt-op' : 'mt-box') + '">' + xesc(s) + '</span>'; }).join('') + '</div>'; }
  function tableHTML(T) { return '<table class="mt-tab"><thead><tr>' + T.head.map(function (h) { return '<th>' + xesc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + T.rows.map(function (r) { return '<tr' + (/✓/.test(r.join('')) ? ' class="ok"' : '') + '>' + r.map(function (c) { return '<td>' + xesc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>'; }
  function stepHTML(s) { return (s.m ? svg(s.m) : '') + (s.tab ? tableHTML(s.tab) : '') + (s.flow ? flowHTML(s.flow) : ''); }

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

  window.SDMath = { topics: T, heuristics: H, facts: FACTS, svg: svg, stepHTML: stepHTML, nudge: NUDGE, check: check, parse: parse, F: F, mixedStr: mixedStr, fStr: fStr };
})();
