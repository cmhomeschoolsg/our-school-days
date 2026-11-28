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
    if (ok && Q.den && !(p.raw && p.raw.d === Q.den)) return { ok: false, close: 'That is the right amount — now write it with ' + Q.den + ' as the denominator.', shown: Q.show };
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

  // ---------- the 13 heuristics, each with three levels and a bank of varied problems per level ----------
  // Level 1 is P3–P4 style (one idea, small numbers), Level 2 is P5 style (two steps, fractions or three people),
  // Level 3 is PSLE style (several steps, ratio and fraction changes). Each template builds the problem from its answer,
  // so the answer is always exact, and comes with guiding questions (G) and the picture that grows as she answers.
  var HS = [];
  function method(id, group, name, levels) { HS.push({ id: id, group: group, name: name, levels: levels }); }
  function ord(n) { var t = n % 100, u = n % 10; return n + (t > 10 && t < 14 ? 'th' : u === 1 ? 'st' : u === 2 ? 'nd' : u === 3 ? 'rd' : 'th'); }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  var KIDS = names;

  // 1. Draw a diagram or model
  method('model', 'Give a representation', 'Draw a model', [
    [function () {
      var p = two(), diff = ri(2, 20) * 5, small = ri(4, 40) * 5, tot = small * 2 + diff;
      return Qn(p[0] + ' and ' + p[1] + ' have ' + money(tot) + ' altogether. ' + p[0] + ' has ' + money(diff) + ' more than ' + p[1] + '. How much does ' + p[1] + ' have?', F(small), W([
        G('Who has more money?', p[0], 'So ' + p[0] + "'s bar is longer than " + p[1] + "'s by " + money(diff) + '; both bars together make ' + money(tot) + '.', { m: { rows: [{ label: p[0], parts: [{ w: 3 }, { w: 1, k: 'x', t: money(diff) }] }, { label: p[1], parts: [{ w: 3, k: 'q', t: '?' }] }], right: { rows: [0, 1], t: money(tot) } } }, 'Read the second sentence again.', [p[0], p[1]]),
        G('Imagine covering the extra piece. Then the two bars are equal. How much do the two equal bars make together?', F(tot - diff), 'Two equal bars make ' + money(tot - diff) + '.', { m: { rows: [{ label: p[0], parts: [{ w: 3 }, { w: 1, k: 'gone', t: money(diff) }] }, { label: p[1], parts: [{ w: 3 }] }], right: { rows: [0, 1], t: money(tot - diff) } } }, 'Take the extra away from the total.', { show: money(tot - diff) }),
        G('How much is one of those equal bars?', F(small), 'One bar is ' + money(small) + '.', {}, 'Two bars share it equally.', { show: money(small) }),
        TELL], { show: money(small) }));
    }, function () {
      var p = two(), u = ri(4, 20), m = ri(2, 5), tot = u * (m + 1), thing = pick(['stamps', 'shells', 'marbles', 'stickers']);
      return Qn(p[0] + ' has ' + m + ' times as many ' + thing + ' as ' + p[1] + '. They have ' + tot + ' ' + thing + ' altogether. How many ' + thing + ' does ' + p[1] + ' have?', F(u), W([
        G('Give ' + p[1] + ' one unit. How many of those units does ' + p[0] + ' have?', F(m), p[1] + ' 1 unit, ' + p[0] + ' ' + m + ' units.', { m: { rows: [{ label: p[0], parts: units(m) }, { label: p[1], parts: units(1) }], right: { rows: [0, 1], t: String(tot) } } }, '"' + m + ' times as many."'),
        G('How many units altogether?', F(m + 1), (m + 1) + ' units make ' + tot + '.', {}, 'Count every box.'),
        TELL]));
    }, function () {
      var p = two(), short = ri(3, 30), diff = ri(2, 15), tot = 2 * short + diff;
      return Qn('A ' + tot + ' m rope is cut into two pieces. One piece is ' + diff + ' m longer than the other. How long is the shorter piece?', F(short), W([
        G('Draw the two pieces as bars. If you cut the extra ' + diff + ' m off the longer piece, how long are the two equal pieces together?', F(tot - diff), 'Two equal pieces make ' + (tot - diff) + ' m.', { m: { rows: [{ label: 'Long', parts: [{ w: 3 }, { w: 1, k: 'gone', t: diff + ' m' }] }, { label: 'Short', parts: [{ w: 3, k: 'q', t: '?' }] }], right: { rows: [0, 1], t: tot + ' m' } } }, 'Total take away the extra.'),
        TELL], { unit: 'm' }));
    }],
    [function () {
      var p = two(), c = ri(5, 30), y = ri(2, 12), x = ri(2, 12), b = c + y, a = b + x, tot = a + b + c;
      return Qn(p[0] + ' has ' + x + ' more beads than ' + p[1] + '. ' + p[1] + ' has ' + y + ' more beads than ' + p[2] + '. They have ' + tot + ' beads altogether. How many beads does ' + p[2] + ' have?', F(c), W([
        G('Who has the fewest beads?', p[2], p[2] + ' has the shortest bar; ' + p[1] + ' has ' + y + ' more; ' + p[0] + ' has ' + x + ' more than ' + p[1] + '.', { m: { rows: [{ label: p[0], parts: [{ w: 3 }, { w: 1, k: 'x', t: String(y) }, { w: 1, k: 'x', t: String(x) }] }, { label: p[1], parts: [{ w: 3 }, { w: 1, k: 'x', t: String(y) }] }, { label: p[2], parts: [{ w: 3, k: 'q', t: '?' }] }], right: { rows: [0, 2], t: String(tot) } } }, 'Follow the "more than"s.', [p[0], p[1], p[2]]),
        G('Add up all the extra pieces in the model. How many beads are they altogether?', F(2 * y + x), 'The extras make ' + (2 * y + x) + ' beads.', {}, p[0] + ' has two extras (' + y + ' and ' + x + '), ' + p[1] + ' has one (' + y + ').'),
        G('Take the extras away. How many beads do the three equal bars make?', F(3 * c), 'Three equal bars make ' + 3 * c + '.', {}, tot + ' minus the extras.'),
        TELL]));
    }, function () {
      var p = two(), n = pick([2, 3, 4]), d = pick([3, 5, 7]); while (n >= d) n = 2; var u = ri(3, 20); var tot = (n + d) * u;
      return Qn(p[0] + ' has ' + n + '/' + d + ' as much money as ' + p[1] + '. Together they have ' + money(tot) + '. How much does ' + p[1] + ' have?', F(d * u), W([
        G('If ' + p[1] + "'s money is cut into " + d + ' equal units, how many of those units does ' + p[0] + ' have?', F(n), p[1] + ' ' + d + ' units, ' + p[0] + ' ' + n + ' units.', { m: { rows: [{ label: p[0], parts: units(n) }, { label: p[1], parts: units(d) }], right: { rows: [0, 1], t: money(tot) } } }, n + '/' + d + ' means ' + n + ' parts out of ' + d + '.'),
        G('How many units altogether, and how much is 1 unit?   (Type 1 unit.)', F(u), (n + d) + ' units = ' + money(tot) + ', so 1 unit = ' + money(u) + '.', {}, 'Count all the units first.', { show: money(u) }),
        TELL], { show: money(d * u) }));
    }],
    [function () {
      var p = two(), u = ri(3, 15) * 3; var B = 4 * u, A = 3 * u, C = u; var tot = A + B + C;
      return Qn(p[0] + ' has 3/4 as many cards as ' + p[1] + '. ' + p[2] + ' has 1/3 as many cards as ' + p[0] + '. They have ' + tot + ' cards altogether. How many cards does ' + p[1] + ' have?', F(B), W([
        G('Whose amount is the easiest to cut into units first? (Everyone else is described from them.)', p[1], 'Cut ' + p[1] + ' into 4 units; ' + p[0] + ' is 3 of those units.', { m: { rows: [{ label: p[0], parts: units(3) }, { label: p[1], parts: units(4) }] } }, 'Who is never compared to anyone else?', [p[0], p[1], p[2]]),
        G(p[2] + ' has 1/3 of ' + p[0] + "'s 3 units. How many units is that?", F(1), p[2] + ' has 1 unit.', { m: { rows: [{ label: p[0], parts: units(3) }, { label: p[1], parts: units(4) }, { label: p[2], parts: units(1) }], right: { rows: [0, 2], t: String(tot) } } }, '1/3 of 3.'),
        G('How many units altogether?', F(8), '8 units = ' + tot + ' cards.', {}, 'Count all the boxes.'),
        G('How many cards is 1 unit?', F(u), '1 unit = ' + u + '.', {}, tot + ' ÷ 8.'),
        TELL]));
    }, function () {
      var p = two(), u = ri(3, 20), k = ri(2, 12) * 5; var A = 3 * u, B = 2 * u + k, tot = A + B;
      return Qn(p[0] + ' and ' + p[1] + ' had ' + money(tot) + ' altogether. After ' + p[0] + ' spent 1/3 of ' + p[0] + "'s money and " + p[1] + ' spent ' + money(k) + ', they had the same amount left. How much did ' + p[0] + ' have at first?', F(A), W([
        G(p[0] + ' spent 1/3. Into how many units should you cut ' + p[0] + "'s bar?", F(3), p[0] + ': 3 units, 1 spent, 2 left.', { m: { rows: [{ label: p[0], parts: [{ w: 1, k: 'gone', t: '' }, { w: 1 }, { w: 1 }] }] } }, 'Look at the bottom of 1/3.'),
        G('After spending, ' + p[1] + ' has the same as ' + p[0] + "'s 2 units. So at first " + p[1] + ' had 2 units and how much more?', F(k), p[1] + ' = 2 units + ' + money(k) + '.', { m: { rows: [{ label: p[0], parts: [{ w: 1, k: 'gone', t: '' }, { w: 1 }, { w: 1 }] }, { label: p[1], parts: [{ w: 1 }, { w: 1 }, { w: 1.3, k: 'gone', t: money(k) }] }], right: { rows: [0, 1], t: money(tot) } } }, 'What did ' + p[1] + ' spend?', { show: money(k) }),
        G('Altogether: 5 units + ' + money(k) + ' = ' + money(tot) + '. How much is 1 unit?', F(u), '1 unit = ' + money(u) + '.', {}, 'Take ' + money(k) + ' away, then share among 5 units.', { show: money(u) }),
        TELL], { show: money(A) }));
    }]
  ]);

  // 2. Make a systematic list
  method('list', 'Give a representation', 'Make a systematic list', [
    [function () {
      var tt = ri(3, 4), bb = ri(2, 3); var toasts = ['kaya', 'butter', 'peanut', 'egg'].slice(0, tt), drinks = ['kopi', 'teh', 'milo'].slice(0, bb);
      var rows = []; toasts.forEach(function (x) { drinks.forEach(function (y) { rows.push([x + ' toast', y]); }); });
      return Qn('A kopitiam has ' + tt + ' kinds of toast (' + toasts.join(', ') + ') and ' + bb + ' drinks (' + drinks.join(', ') + '). How many different breakfasts of one toast and one drink can you choose?', F(tt * bb), W([
        G('Start with kaya toast. How many breakfasts can you make with it?', F(bb), 'Kaya toast makes ' + bb + ' breakfasts.', { tab: { head: ['Toast', 'Drink'], rows: rows.slice(0, bb) } }, 'Kaya with each drink.'),
        G('Does each of the other toasts also make ' + bb + '?', 'yes', 'Yes — keep the same order so none is missed.', {}, 'Try butter toast.', ['yes', 'no']),
        TELL]));
    }, function () {
      var tot = pick([20, 25, 30, 35]); var rows2 = [], ways = 0;
      for (var x = 0; x * 5 <= tot; x++) { var rest = tot - 5 * x; var ok = rest % 2 === 0; if (ok) ways++; rows2.push([String(x), rest + '¢', ok ? rest / 2 + ' × 2¢ ✓' : 'no ✗']); }
      return Qn('In how many ways can you make exactly ' + tot + '¢ using only 2¢ and 5¢ coins?', F(ways), W([
        G('Go in order of 5¢ coins: 0, 1, 2… What must be true of the amount left over for 2¢ coins to make it?', 'it is even', 'It must be even.', { pre: { tab: { head: ['5¢ coins', 'Left', '2¢ coins'], rows: rows2.slice(0, 2) } } }, 'Count in 2s.', ['it is even', 'it is odd', 'it is more than 10']),
        TELL]));
    }],
    [function () {
      var d = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 2); var digs = [0, d[0], d[1]]; var list = [];
      digs.forEach(function (a) { digs.forEach(function (b) { digs.forEach(function (c) { if (a && a !== b && b !== c && a !== c) list.push('' + a + b + c); }); }); });
      return Qn('How many different 3-digit numbers can you make with the digits 0, ' + d[0] + ' and ' + d[1] + ', using each digit once?', F(list.length), W([
        G('Which digit can NOT go in the hundreds place?', '0', '0 cannot start a 3-digit number.', {}, 'What would 0' + d[0] + d[1] + ' really be?', ['0', String(d[0]), String(d[1])]),
        G('Start with ' + d[0] + ' in the hundreds place. How many numbers can you make?', F(2), d[0] + '0' + d[1] + ' and ' + d[0] + d[1] + '0.', { tab: { head: ['Hundreds', 'Numbers'], rows: [[String(d[0]), d[0] + '0' + d[1] + ', ' + d[0] + d[1] + '0']] } }, 'List them.'),
        TELL]));
    }, function () {
      var n = ri(5, 9); var rows = []; for (var i = 1; i < n; i++) rows.push(['Person ' + i, 'shakes hands with ' + (n - i) + ' new people']);
      return Qn(n + ' friends meet and each shakes hands once with every other friend. How many handshakes are there?', F(n * (n - 1) / 2), W([
        G('Person 1 shakes hands with everyone else. How many handshakes is that?', F(n - 1), 'Person 1: ' + (n - 1) + ' handshakes.', {}, 'Everyone except Person 1.'),
        G('Person 2 has already shaken Person 1\'s hand. How many NEW handshakes does Person 2 make?', F(n - 2), 'Person 2: ' + (n - 2) + ' new ones — the list keeps getting shorter by one.', { tab: { head: ['Who', 'New handshakes'], rows: rows } }, 'Leave out Person 1 and Person 2.'),
        TELL]));
    }],
    [function () {
      var tot = pick([50, 60, 70, 80, 100]); var rows = [], ways = 0;
      for (var a = 0; a * 50 <= tot; a++) for (var b = 0; a * 50 + b * 20 <= tot; b++) { var rest = tot - 50 * a - 20 * b; if (rest % 10 === 0) { ways++; rows.push([String(a), String(b), String(rest / 10)]); } }
      return Qn('How many different ways can you pay exactly ' + tot + '¢ using 10¢, 20¢ and 50¢ coins?', F(ways), W([
        G('Be systematic: start with the biggest coin. What is the greatest number of 50¢ coins you could use?', F(Math.floor(tot / 50)), 'Up to ' + Math.floor(tot / 50) + '.', {}, 'How many 50s fit in ' + tot + '?'),
        G('With no 50¢ coins, how many ways are there using 20¢ and 10¢? (20¢ coins can go from 0 up to ' + Math.floor(tot / 20) + '.)', F(Math.floor(tot / 20) + 1), (Math.floor(tot / 20) + 1) + ' ways — the 10¢ coins always fill the rest.', { tab: { head: ['50¢', '20¢', '10¢'], rows: rows.filter(function (r) { return r[0] === '0'; }) } }, 'Count 0, 1, 2 … twenty-cent coins.'),
        TELL]));
    }, function () {
      var half = ri(8, 15), P = 2 * half; var rows = []; for (var w = 1; w <= half / 2; w++) rows.push([String(half - w), String(w), String((half - w) * w)]);
      return Qn('How many different rectangles with whole-centimetre sides have a perimeter of ' + P + ' cm? (A rectangle and the same one turned round count once.)', F(rows.length), W([
        G('Length + width must make what?', F(half), 'Length + width = ' + half + ' cm.', {}, 'The perimeter goes round two lengths and two widths.'),
        G('List widths from 1 cm upwards. What is the biggest width before the list starts repeating?', F(Math.floor(half / 2)), 'Stop at ' + Math.floor(half / 2) + ' cm.', { tab: { head: ['Length', 'Width', 'Area'], rows: rows } }, 'When does the width become bigger than the length?'),
        TELL]));
    }]
  ]);

  // 3. Use equations (the algebraic method)
  method('equation', 'Give a representation', 'Use equations', [
    [function () {
      var x = ri(3, 15), a = ri(2, 9), b = ri(2, 20), c = a * x + b;
      return Qn(a + ' × □ + ' + b + ' = ' + c + '. What number goes in the box?', F(x), W([
        G('What is ' + a + ' × □ on its own? (Undo the + ' + b + '.)', F(a * x), a + ' × □ = ' + a * x + '.', {}, 'Take ' + b + ' from both sides.'),
        TELL]));
    }, function () {
      var y = ri(2, 9), n = ri(3, 8), f = ri(2, 9), tot = n * y + f;
      return Qn(n + ' pens and a $' + f + ' file cost ' + money(tot) + ' altogether. How much is one pen?', F(y), W([
        G('Let one pen be p dollars. Fill in: ' + n + 'p + ? = ' + tot, F(f), n + 'p + ' + f + ' = ' + tot + '.', {}, 'What else was bought?'),
        G('So ' + n + 'p = ?', F(n * y), n + 'p = ' + n * y + '.', {}, 'Take away ' + f + '.'),
        TELL], { show: money(y) }));
    }],
    [function () {
      var x = ri(4, 20), a = ri(2, 4), b = ri(3, 12), p = two(), total = (a + 1) * x + 2 * b;
      return Qn(p[0] + ' is ' + a + ' times as old as ' + p[1] + '. In ' + b + ' years, their ages will add up to ' + total + '. How old is ' + p[1] + ' now?', F(x), W([
        G('Let ' + p[1] + ' be y. ' + p[0] + ' is how many y?', F(a), p[0] + ' = ' + a + 'y.', { m: { rows: [{ label: p[0], parts: units(a, 'y') }, { label: p[1], parts: units(1, 'y') }] } }, '"' + a + ' times as old."'),
        G('In ' + b + ' years, together: ' + (a + 1) + 'y + ? = ' + total, F(2 * b), (a + 1) + 'y + ' + 2 * b + ' = ' + total + '.', {}, 'Each of the two gets ' + b + ' years older.'),
        TELL]));
    }, function () {
      var n = ri(10, 60), S = 3 * n + 3;
      return Qn('Three numbers in a row (like 7, 8, 9) add up to ' + S + '. What is the smallest?', F(n), W([
        G('Call the smallest n. The next two are n + 1 and n + ?', F(2), 'n + (n + 1) + (n + 2) = 3n + 3.', {}, 'Count on.'),
        G('3n + 3 = ' + S + '. So 3n = ?', F(3 * n), '3n = ' + 3 * n + '.', {}, 'Take away 3.'),
        TELL]));
    }],
    [function () {
      var x = ri(3, 12), p = ri(2, 4), q = ri(2, 4), T = x * p + 2 * x * q;
      return Qn('Mrs Lim bought some cups of kopi at $' + p + ' each and twice as many cups of teh at $' + q + ' each. She paid $' + T + '. How many cups of kopi did she buy?', F(x), W([
        G('Let the kopi be k cups. How many cups of teh, in terms of k? (Type the number in front of k.)', F(2), 'Teh = 2k cups.', {}, '"Twice as many."'),
        G('Cost: ' + p + 'k + ' + q + ' × 2k = ' + T + '. So how many dollars for each k altogether? (' + p + ' + ' + 2 * q + ' = ?)', F(p + 2 * q), (p + 2 * q) + 'k = ' + T + '.', {}, 'Collect the k\'s.'),
        TELL]));
    }, function () {
      var b = ri(2, 3), a = b + ri(1, 2), y = (b - 1) * ri(2, 8), n = y * (a - b) / (b - 1);
      return Qn('A father is ' + a + ' times as old as his son. In ' + n + ' years, the father will be ' + b + ' times as old as his son. How old is the son now?', F(y), W([
        G('Let the son be s now; the father is ' + a + 's. In ' + n + ' years the son is s + ' + n + '. The father is ' + a + 's + ?', F(n), 'Father then: ' + a + 's + ' + n + '.', {}, 'Both get older by the same number of years.'),
        G('Then ' + a + 's + ' + n + ' = ' + b + ' × (s + ' + n + ') = ' + b + 's + ' + b * n + '. So ' + (a - b) + 's = ?', F(b * n - n), (a - b) + 's = ' + (b * n - n) + '.', {}, 'Take ' + b + 's and ' + n + ' from both sides.'),
        TELL]));
    }]
  ]);

  // 4. Look for a pattern
  method('pattern', 'Make a calculated guess', 'Look for a pattern', [
    [function () {
      var s = ri(2, 5), add = ri(2, 6), n = ri(8, 20), term = s + (n - 1) * add;
      return Qn('Figure 1 uses ' + s + ' sticks, Figure 2 uses ' + (s + add) + ', Figure 3 uses ' + (s + 2 * add) + '. How many sticks does Figure ' + n + ' use?', F(term), W([
        G('How many sticks are added each time?', F(add), '+' + add + ' each time.', { pre: { tab: { head: ['Figure', 'Sticks'], rows: [['1', String(s)], ['2', String(s + add)], ['3', String(s + 2 * add)]] } } }, 'Subtract one figure from the next.'),
        G('From Figure 1 to Figure ' + n + ', how many times is ' + add + ' added?', F(n - 1), (n - 1) + ' times.', {}, 'Figure 2 once, Figure 3 twice…'),
        TELL]));
    }, function () {
      var cols = shuffle(['red', 'blue', 'green', 'yellow']); var pat = [cols[0], cols[1], cols[1], cols[2]].slice(0, pick([3, 4])); var n = ri(20, 60);
      var ans = pat[(n - 1) % pat.length];
      return Qn('Beads are threaded in a repeating pattern: ' + pat.join(', ') + ', ' + pat.join(', ') + ', … What colour is the ' + ord(n) + ' bead?', ans, W([
        G('How many beads before the pattern repeats?', F(pat.length), 'The pattern repeats every ' + pat.length + ' beads.', {}, 'Find where it starts again.'),
        G(n + ' ÷ ' + pat.length + ' gives what remainder?', F(n % pat.length), 'Remainder ' + (n % pat.length) + (n % pat.length ? ' — count that far into the pattern.' : ' — so it is the last bead of a group.'), {}, 'Divide and see what is left.'),
        TELL], { choices: [cols[0], cols[1], cols[2]], a: ans, show: ans }));
    }],
    [function () {
      var n = ri(8, 15);
      return Qn('Square patterns of tiles: Figure 1 has 1 tile, Figure 2 has 4, Figure 3 has 9. How many tiles in Figure ' + n + '?', F(n * n), W([
        G('Figure 3 is a square of 3 rows. How many tiles in each row?', F(3), '3 rows of 3 = 9.', { tab: { head: ['Figure', 'Tiles'], rows: [['1', '1 × 1 = 1'], ['2', '2 × 2 = 4'], ['3', '3 × 3 = 9']] } }, 'It is a square.'),
        TELL]));
    }, function () {
      var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; var st = ri(0, 6), d = ri(10, 31), ans = days[(st + d - 1) % 7];
      return Qn('1 March is a ' + days[st] + '. What day of the week is ' + d + ' March?', ans, W([
        G('Every how many days does the same weekday come back?', F(7), 'Every 7 days.', {}, 'Count a week.'),
        G('How many days after 1 March is ' + d + ' March? Then what is the remainder when you divide by 7?', F((d - 1) % 7), (d - 1) + ' days after; remainder ' + (d - 1) % 7 + '.', {}, (d - 1) + ' ÷ 7.'),
        TELL], { choices: days, a: ans, show: ans }));
    }],
    [function () {
      var n = ri(8, 20), sh = 4 * n - 4;
      return Qn('Square figures are made of tiles. Figure n is an n by n square, and only the tiles round the edge are shaded. Which figure has ' + sh + ' shaded tiles?', F(n), W([
        G('Figure 3 is 3 by 3. How many tiles are on its edge?', F(8), 'Figure 3: 8 shaded.', { tab: { head: ['Figure', 'Shaded'], rows: [['3', '8'], ['4', '12'], ['5', '16']] } }, 'All tiles except the middle one.'),
        G('Each new figure adds how many shaded tiles?', F(4), 'Shaded = 4 × n − 4.', {}, 'Compare 8, 12, 16.'),
        TELL]));
    }, function () {
      var n = ri(10, 30), last = 2 * n - 1;
      return Qn('Find 1 + 3 + 5 + 7 + … + ' + last + '.', F(n * n), W([
        G('1 + 3 = 4, 1 + 3 + 5 = 9, 1 + 3 + 5 + 7 = 16. What kind of numbers are these totals?', 'square numbers', 'They are square numbers: 2×2, 3×3, 4×4.', { tab: { head: ['Odd numbers added', 'Total'], rows: [['2', '4'], ['3', '9'], ['4', '16']] } }, 'Try 2 × 2, 3 × 3…', ['square numbers', 'even numbers', 'multiples of 3']),
        G('How many odd numbers are in 1 + 3 + … + ' + last + '?', F(n), n + ' odd numbers.', {}, 'The nth odd number is 2n − 1.'),
        TELL]));
    }]
  ]);

  // 5. Guess and check
  method('guess', 'Make a calculated guess', 'Guess and check', [
    [function () {
      var a = ri(2, 9), b = ri(a + 2, 14);
      return Qn('Two whole numbers add up to ' + (a + b) + ' and multiply to ' + a * b + '. What is the smaller number?', F(a), W([
        G('Guess: try two numbers that add up to ' + (a + b) + ', such as ' + Math.floor((a + b) / 2) + ' and ' + Math.ceil((a + b) / 2) + '. What do they multiply to?', F(Math.floor((a + b) / 2) * Math.ceil((a + b) / 2)), 'They make ' + Math.floor((a + b) / 2) * Math.ceil((a + b) / 2) + ' — too big, so move the numbers further apart.', {}, 'Multiply them.'),
        TELL]));
    }, function () {
      var a = ri(2, 6), b = ri(2, 6), pa = 5, pc = 3, tot = a * pa + b * pc;
      return Qn('Adult tickets cost $5 and child tickets $3. A family bought ' + (a + b) + ' tickets for $' + tot + '. How many adult tickets?', F(a), W([
        G('Guess half and half. If ' + Math.round((a + b) / 2) + ' were adult tickets, what would all ' + (a + b) + ' tickets cost?', F(Math.round((a + b) / 2) * 5 + ((a + b) - Math.round((a + b) / 2)) * 3), 'Compare that with $' + tot + ' and adjust: more adults costs more.', {}, 'Adults × 5 plus children × 3.', { show: money(Math.round((a + b) / 2) * 5 + ((a + b) - Math.round((a + b) / 2)) * 3) }),
        TELL]));
    }],
    [function () {
      var a = ri(4, 12), b = ri(4, 12), p5 = ri(4, 9), p2 = ri(2, p5 - 1), tot = a * p5 + b * p2, n = a + b, g0 = Math.round(n / 2), c0 = g0 * p5 + (n - g0) * p2;
      return Qn('Notebooks cost ' + money(p5) + ' and pencils cost ' + money(p2) + '. Siti bought ' + n + ' items for ' + money(tot) + '. How many notebooks did she buy?', F(a), W([
        G('Try ' + g0 + ' notebooks and ' + (n - g0) + ' pencils. What would they cost?', F(c0), 'That costs ' + money(c0) + '.', { tab: { head: ['Notebooks', 'Pencils', 'Cost'], rows: [[String(g0), String(n - g0), money(c0)]] } }, 'Notebooks × price + pencils × price.', { show: money(c0) }),
        G('Too much or too little?', c0 > tot ? 'too much' : c0 < tot ? 'too little' : 'just right', c0 > tot ? 'Too much: try fewer notebooks.' : c0 < tot ? 'Too little: try more notebooks.' : 'Just right!', {}, 'Compare with ' + money(tot) + '.', ['too much', 'too little', 'just right']),
        TELL]));
    }, function () {
      var bags = ri(8, 15), x = ri(2, bags - 2), y = bags - x, s1 = 6, s2 = 9, tot = x * s1 + y * s2;
      return Qn('Sweets come in bags of 6 and bags of 9. ' + bags + ' bags hold ' + tot + ' sweets. How many bags of 6 are there?', F(x), W([
        G('Guess: half the bags are bags of 6 (' + Math.round(bags / 2) + '). How many sweets would that be?', F(Math.round(bags / 2) * 6 + (bags - Math.round(bags / 2)) * 9), 'Check against ' + tot + ' and adjust.', {}, 'Multiply and add.'),
        TELL]));
    }],
    [function () {
      var q = ri(15, 25), c = ri(Math.ceil(q / 2) + 1, q), w = q - c, sc = 4 * c - w;
      return Qn('In a quiz of ' + q + ' questions, each right answer scores 4 marks and each wrong answer loses 1 mark. Mei answered every question and scored ' + sc + '. How many did she get right?', F(c), W([
        G('Guess ' + (q - 3) + ' right. What would she score?', F(4 * (q - 3) - 3), (q - 3) + ' right scores ' + (4 * (q - 3) - 3) + '.', { tab: { head: ['Right', 'Wrong', 'Score'], rows: [[String(q - 3), '3', String(4 * (q - 3) - 3)]] } }, 'Right × 4, minus the wrong ones.'),
        G('Changing one wrong answer into a right one changes the score by how much?', F(5), 'Each swap changes the score by 5 (+4 and the −1 is gone).', {}, 'Gain 4 and stop losing 1.'),
        TELL]));
    }, function () {
      var n = ri(6, 20) * 2, P = n * (n + 2);
      return Qn('Two even numbers that follow each other (like 6 and 8) multiply to ' + P + '. What is the smaller one?', F(n), W([
        G('The two numbers are close together, so each is near the number that times itself makes about ' + P + '. Which is closest: 10 × 10, 20 × 20 or 30 × 30?', n < 15 ? '10 × 10' : n < 25 ? '20 × 20' : '30 × 30', 'Start guessing near there, trying even numbers.', {}, 'Work out each one.', ['10 × 10', '20 × 20', '30 × 30']),
        TELL]));
    }]
  ]);

  // 6. Make suppositions
  method('suppose', 'Make a calculated guess', 'Make suppositions', [
    [function () {
      var c = ri(3, 12), g = ri(2, 10), heads = c + g, legs = 2 * c + 4 * g;
      return Qn('A farm has chickens and goats: ' + heads + ' heads and ' + legs + ' legs. How many goats?', F(g), W([
        G('Suppose all ' + heads + ' were chickens. How many legs?', F(2 * heads), 'All chickens: ' + 2 * heads + ' legs.', {}, '2 legs each.'),
        G('How many legs short is that?', F(legs - 2 * heads), (legs - 2 * heads) + ' legs short.', {}, legs + ' − ' + 2 * heads + '.'),
        G('Changing a chicken into a goat adds how many legs?', F(2), '+2 legs each time.', {}, '4 − 2.'),
        TELL]));
    }, function () {
      var b = ri(3, 12), t = ri(2, 10), n = b + t, wh = 2 * b + 3 * t;
      return Qn('In a park there are bicycles and tricycles: ' + n + ' of them with ' + wh + ' wheels. How many tricycles?', F(t), W([
        G('Suppose all ' + n + ' were bicycles. How many wheels?', F(2 * n), 'All bicycles: ' + 2 * n + ' wheels.', {}, '2 each.'),
        G('How many extra wheels must the tricycles explain?', F(wh - 2 * n), (wh - 2 * n) + ' extra wheels; each tricycle adds 1.', {}, wh + ' − ' + 2 * n + '.'),
        TELL]));
    }],
    [function () {
      var a = ri(3, 15), b = ri(3, 15), n = a + b, tot = 2 * a + 5 * b;
      return Qn('Ravi has ' + n + ' notes, all $2 and $5, worth $' + tot + ' altogether. How many $5 notes has he?', F(b), W([
        G('Suppose they were all $2 notes. How much would that be?', F(2 * n), 'All $2: $' + 2 * n + '.', {}, n + ' × 2.', { show: money(2 * n) }),
        G('Swapping a $2 note for a $5 note adds how much?', F(3), '+$3 each swap.', {}, '5 − 2.', { show: '$3' }),
        TELL]));
    }, function () {
      var t = ri(3, 12), s = ri(3, 12), n = t + s, legs = 4 * t + 3 * s;
      return Qn('A room has tables with 4 legs and stools with 3 legs: ' + n + ' pieces and ' + legs + ' legs. How many stools?', F(s), W([
        G('Suppose all were tables. How many legs?', F(4 * n), 'All tables: ' + 4 * n + ' legs.', {}, '4 each.'),
        G('That is too many by how much?', F(4 * n - legs), (4 * n - legs) + ' too many; each stool has 1 fewer leg.', {}, 'Compare with ' + legs + '.'),
        TELL]));
    }],
    [function () {
      var q = ri(20, 30), c = ri(Math.ceil(q * 0.6), q - 1), w = q - c, sc = 3 * c - w;
      return Qn('A quiz has ' + q + ' questions: +3 for each right answer, −1 for each wrong one. Ali answered all and scored ' + sc + '. How many were wrong?', F(w), W([
        G('Suppose he got all ' + q + ' right. What score?', F(3 * q), 'All right: ' + 3 * q + '.', {}, q + ' × 3.'),
        G('How many marks short is he?', F(3 * q - sc), (3 * q - sc) + ' marks short.', {}, 3 * q + ' − ' + sc + '.'),
        G('Changing one right answer into a wrong one loses how many marks?', F(4), 'Each wrong answer costs 4 (lose 3, then −1).', {}, 'Lose the 3 and take off 1 more.'),
        TELL]));
    }, function () {
      var tens = ri(3, 12), extra = ri(2, 10), fives = tens + extra, tot = 10 * tens + 5 * fives;
      return Qn('A box has $10 and $5 notes, with ' + extra + ' more $5 notes than $10 notes. The notes are worth $' + tot + '. How many $10 notes are there?', F(tens), W([
        G('Take out the ' + extra + ' extra $5 notes. How much money is left?', F(tot - 5 * extra), 'Left: $' + (tot - 5 * extra) + ', with equal numbers of $10 and $5 notes.', {}, extra + ' × $5 taken away.', { show: money(tot - 5 * extra) }),
        G('One $10 note and one $5 note make a pair. How much is a pair?', F(15), 'Each pair is $15.', {}, '10 + 5.', { show: '$15' }),
        TELL]));
    }]
  ]);

  // 7. Act it out
  method('act', 'Go through the process', 'Act it out', [
    [function () {
      var f = ri(3, 12), b = ri(3, 12);
      return Qn('Children stand in a line. Wei Jie is ' + ord(f) + ' from the front and ' + ord(b) + ' from the back. How many children are in the line?', F(f + b - 1), W([
        G('Act it out with counters. Counting from the front up to Wei Jie gives ' + f + '. Counting from the back up to Wei Jie gives ' + b + '. Who was counted twice?', 'Wei Jie', 'Wei Jie is in both counts.', {}, 'Who is in both groups?', ['Wei Jie', 'the first child', 'nobody']),
        TELL]));
    }, function () {
      var up = ri(3, 5), down = ri(1, up - 1), H = ri(10, 20); var d = 1; while ((d - 1) * (up - down) + up < H) d++;
      return Qn('A snail is at the bottom of a ' + H + ' m well. Each day it climbs ' + up + ' m, and each night it slips back ' + down + ' m. On which day does it reach the top?', F(d), W([
        G('After the first whole day and night, how high is the snail?', F(up - down), 'It gains ' + (up - down) + ' m a day — but careful near the top!', { tab: { head: ['Day', 'Top of the climb', 'After the night'], rows: [['1', up + ' m', (up - down) + ' m'], ['2', (2 * up - down) + ' m', 2 * (up - down) + ' m'], ['…', '…', '…']] } }, up + ' up, ' + down + ' down.'),
        G('Once the snail reaches the top during a day, does it slip back?', 'no', 'No — it is out. So look for the day its climb first reaches ' + H + ' m.', {}, 'It has left the well.', ['yes', 'no']),
        TELL]));
    }],
    [function () {
      var pieces = ri(4, 9), t = ri(2, 8);
      return Qn('It takes ' + t + ' minutes to make one cut through a log. How long does it take to cut the log into ' + pieces + ' pieces?', F((pieces - 1) * t), W([
        G('Act it out with a strip of paper: how many cuts make 2 pieces? And how many cuts make ' + pieces + ' pieces?', F(pieces - 1), plural(pieces - 1, 'cut') + ' make ' + pieces + ' pieces — always one fewer cut than pieces.', {}, 'Try 2 pieces, 3 pieces…'),
        TELL], { unit: 'min' }));
    }, function () {
      var gap = pick([3, 4, 5, 6]), L = gap * ri(6, 20);
      return Qn('Trees are planted along one side of a ' + L + ' m path, one at each end and one every ' + gap + ' m. How many trees are there?', F(L / gap + 1), W([
        G('How many gaps of ' + gap + ' m are there along the path?', F(L / gap), L / gap + ' gaps.', {}, L + ' ÷ ' + gap + '.'),
        G('Draw a short path with 2 gaps. How many trees does it need?', F(3), '2 gaps need 3 trees — always one more tree than gaps.', {}, 'Draw it!'),
        TELL]));
    }],
    [function () {
      var gap = pick([2, 3, 4, 5]), a = gap * ri(5, 12), b = gap * ri(3, 8);
      return Qn('Posts are put around a rectangular field ' + a + ' m long and ' + b + ' m wide, one every ' + gap + ' m, with a post at each corner. How many posts are there?', F(2 * (a + b) / gap), W([
        G('How far is it all the way round the field?', F(2 * (a + b)), 'The perimeter is ' + 2 * (a + b) + ' m.', {}, 'Two lengths and two widths.'),
        G('On a closed loop, is the number of posts the same as the number of gaps, or one more?', 'the same', 'The same — the last gap ends at the first post.', {}, 'Act it out round a table with 4 pens.', ['the same', 'one more']),
        TELL]));
    }, function () {
      var up = ri(5, 8), down = ri(2, up - 1), H = ri(25, 45); var d = 1; while ((d - 1) * (up - down) + up < H) d++;
      return Qn('A lizard climbs a ' + H + ' m wall. Each day it climbs ' + up + ' m; each night it slides down ' + down + ' m. On which day does it first reach the top?', F(d), W([
        G('Before the last day it must be within ' + up + ' m of the top. What height must it reach by the night before?', F(H - up), 'It needs ' + (H - up) + ' m by the end of a night.', {}, H + ' − ' + up + '.'),
        G('It gains ' + (up - down) + ' m per full day. How many full days to reach at least ' + (H - up) + ' m? (Round up.)', F(d - 1), (d - 1) + ' full days, then it climbs out the next day.', {}, (H - up) + ' ÷ ' + (up - down) + ', rounded up.'),
        TELL]));
    }]
  ]);

  // 8. Work backwards
  method('backwards', 'Go through the process', 'Work backwards', [
    [function () {
      var p = two(), left = ri(4, 30) * 2, spent2 = ri(2, 20), half = left + spent2, start = half * 2;
      return Qn(p[0] + ' spent half of the money in the purse on a book and then ' + money(spent2) + ' on lunch. ' + money(left) + ' was left. How much was in the purse at first?', F(start), W([
        G('Work backwards. Before lunch, how much was there?', F(half), 'Before lunch: ' + money(half) + '.', { m: { rows: [{ label: 'Purse', parts: [{ w: 3, t: 'book' }, { w: 1.2, k: 'x', t: money(spent2) }, { w: 1.8, t: money(left) }] }] } }, 'Put the lunch money back.', { show: money(half) }),
        TELL], { show: money(start) }));
    }, function () {
      var n = ri(2, 12), add = ri(3, 20), mul = ri(2, 5), res = n * mul + add;
      return Qn('I think of a number, multiply it by ' + mul + ' and add ' + add + '. The answer is ' + res + '. What was my number?', F(n), W([
        G('What was the LAST thing done?', 'add ' + add, 'Undo that first.', { flow: ['?', '× ' + mul, '+ ' + add, String(res)] }, 'Read the steps in order.', ['multiply by ' + mul, 'add ' + add]),
        G('Undo it: what is ' + res + ' − ' + add + '?', F(res - add), (res - add) + '.', { flow: [String(res), '− ' + add, String(res - add)] }, 'Subtract.'),
        TELL]));
    }],
    [function () {
      var p = two(), now = ri(20, 40), bought = ri(5, 15), gave = ri(3, 10), half = now - bought + gave, start = 2 * half;
      return Qn(p[0] + ' gave half of a pile of stickers to ' + p[1] + ', then gave ' + gave + ' to ' + p[2] + ', then bought ' + bought + ' more. Now ' + p[0] + ' has ' + now + '. How many stickers were there at first?', F(start), W([
        G('Undo the last step. Before buying ' + bought + ', how many?', F(now - bought), (now - bought) + '.', { flow: ['?', '÷ 2', '− ' + gave, '+ ' + bought, String(now)] }, 'Take away what he bought.'),
        G('Before giving ' + gave + ' away?', F(half), half + '.', {}, 'Give them back.'),
        TELL]));
    }, function () {
      var n = ri(3, 12) * 3, a = ri(2, 4), b = ri(4, 15), r = (n / 3) * a - b; if (r <= 0) { b = 1; r = (n / 3) * a - 1; }
      return Qn('A number is divided by 3, multiplied by ' + a + ', and then ' + b + ' is taken away. The result is ' + r + '. What was the number?', F(n), W([
        G('Undo the last step: ' + r + ' + ' + b + ' = ?', F(r + b), (r + b) + '.', { flow: ['?', '÷ 3', '× ' + a, '− ' + b, String(r)] }, 'The opposite of taking away.'),
        G('Undo "× ' + a + '": ' + (r + b) + ' ÷ ' + a + ' = ?', F((r + b) / a), String((r + b) / a) + '.', {}, 'Divide.'),
        TELL]));
    }],
    [function () {
      var e = ri(3, 12) * 4, p = two(); var C1 = e / 2, B1 = 3 * e / 4, A1 = 7 * e / 4;
      return Qn(p[0] + ', ' + p[1] + ' and ' + p[2] + ' have some marbles. First ' + p[0] + ' gives ' + p[1] + ' as many marbles as ' + p[1] + ' already has. Then ' + p[1] + ' gives ' + p[2] + ' as many as ' + p[2] + ' already has. In the end each of them has ' + e + ' marbles. How many did ' + p[0] + ' have at first?', F(A1), W([
        G('Work backwards from the end. In the last step ' + p[2] + "'s marbles were doubled. So before it, how many did " + p[2] + ' have?', F(C1), p[2] + ' had ' + C1 + ', and ' + p[1] + ' gave ' + C1 + ' away.', { tab: { head: ['', p[0], p[1], p[2]], rows: [['End', String(e), String(e), String(e)], ['Before ' + p[1] + ' gave', String(e), '?', String(C1)]] } }, 'Half of ' + e + '.'),
        G('So before that step, how many did ' + p[1] + ' have?', F(e + C1), p[1] + ' had ' + (e + C1) + '.', { tab: { head: ['', p[0], p[1], p[2]], rows: [['End', String(e), String(e), String(e)], ['Before ' + p[1] + ' gave', String(e), String(e + C1), String(C1)]] } }, 'Give back the ' + C1 + '.'),
        G('In the first step ' + p[1] + "'s marbles were doubled. How many did " + p[1] + ' have at the very start?', F(B1), p[1] + ' started with ' + B1 + ', and ' + p[0] + ' gave ' + B1 + '.', { tab: { head: ['', p[0], p[1], p[2]], rows: [['End', String(e), String(e), String(e)], ['Before ' + p[1] + ' gave', String(e), String(e + C1), String(C1)], ['Start', '?', String(B1), String(C1)]] } }, 'Half of ' + (e + C1) + '.'),
        TELL]));
    }, function () {
      var p = two(), left = ri(2, 10) * 6, k = ri(3, 12), r2 = left + k, before = r2 * 4 / 3, start = before * 3 / 2;
      if (before % 1 || start % 1) { left = 24; k = 6; r2 = 30; before = 40; start = 60; }
      return Qn(p[0] + ' spent 1/3 of some savings on a book, then 1/4 of the remainder on a pen, then ' + money(k) + ' on lunch. ' + money(left) + ' was left. How much were the savings at first?', F(start), W([
        G('Before lunch, how much was left?', F(r2), money(r2) + '.', {}, 'Add back the lunch.', { show: money(r2) }),
        G('That was what remained after spending 1/4 of the remainder on the pen — so it is what fraction of the remainder?', F(3, 4), '3/4 of the remainder = ' + money(r2) + ', so the remainder was ' + money(before) + '.', { m: { rows: [{ label: 'Remainder', parts: [{ w: 1, k: 'x', t: 'pen' }, { w: 1, t: '' }, { w: 1, t: '' }, { w: 1, t: '' }] }], tops: [{ row: 0, from: 1, to: 4, t: money(r2) }] } }, '1 − 1/4.', { simplest: true }),
        G('That remainder (' + money(before) + ') is what fraction of all the savings?', F(2, 3), '2/3 of the savings = ' + money(before) + '.', {}, '1 − 1/3.', { simplest: true }),
        TELL], { show: money(start) }));
    }]
  ]);

  // 9. Use the before-after concept
  method('beforeafter', 'Go through the process', 'Before and after', [
    [function () {
      var p = two(), s = ri(5, 30), d = ri(2, 15) * 2, a = s + d;
      return Qn(p[0] + ' has ' + a + ' stickers and ' + p[1] + ' has ' + s + '. How many stickers must ' + p[0] + ' give ' + p[1] + ' so that they have the same number?', F(d / 2), W([
        G('How many more stickers does ' + p[0] + ' have?', F(d), 'The difference is ' + d + '.', { m: { rows: [{ label: p[0], parts: [{ w: 3 }, { w: 2, k: 'x', t: String(d) }] }, { label: p[1], parts: [{ w: 3 }] }] } }, a + ' − ' + s + '.'),
        G('If ' + p[0] + ' gave all ' + d + ', who would have more?', p[1], p[1] + ' would — so only part of the difference moves across.', {}, 'Giving takes from one and adds to the other.', [p[0], p[1]]),
        TELL]));
    }, function () {
      var p = two(), m = pick([3, 5]), u = ri(3, 15) * 2, hd = (m - 1) / 2, give = hd * u;
      return Qn(p[0] + ' had ' + m + ' times as many marbles as ' + p[1] + '. After ' + p[0] + ' gave ' + give + ' marbles to ' + p[1] + ', they had the same number. How many marbles did ' + p[0] + ' have at first?', F(m * u), W([
        G('Before: ' + p[1] + ' 1 unit. How many units has ' + p[0] + '?', F(m), p[0] + ' ' + m + ' units.', { m: { rows: [{ label: p[0], parts: units(m) }, { label: p[1], parts: units(1) }] } }, '"' + m + ' times as many."'),
        G('To end up equal, ' + p[0] + ' gives what fraction of the difference?', F(1, 2), 'Half the difference: ' + plural(hd, 'unit') + ' = ' + give + ' marbles.', { m: { rows: [{ label: p[0], parts: units(m - hd).concat(units(hd, '', 'x')) }, { label: p[1], parts: units(1).concat(units(hd, '', 'q')) }], tops: [{ row: 0, from: m - hd, to: m, t: 'gives ' + give }] } }, 'If ' + p[0] + ' gave all of it, who would have more?', { simplest: true }),
        TELL]));
    }],
    [function () {
      var p = two(), a = ri(2, 5), b = ri(a + 1, 8), u2 = ri(3, 15); while (gcd(a, b) > 1) b = ri(a + 1, 9); var add = (b - a) * u2;
      return Qn('The ratio of ' + p[0] + "'s money to " + p[1] + "'s was " + a + ' : ' + b + '. After ' + p[0] + ' saved another ' + money(add) + ', they had the same amount. How much did ' + p[1] + ' have?', F(b * u2), W([
        G('Whose money did not change?', p[1], p[1] + ' stays ' + b + ' units.', { m: { rows: [{ label: p[0], parts: units(a) }, { label: p[1], parts: units(b) }] } }, 'Who saved?', [p[0], p[1]]),
        G('How many units does ' + p[0] + ' gain to catch up?', F(b - a), money(add) + ' = ' + plural(b - a, 'unit') + '.', { m: { rows: [{ label: p[0], parts: units(a).concat([{ w: b - a, k: 'x', t: '+' + money(add) }]) }, { label: p[1], parts: units(b) }] } }, 'Compare the bars.'),
        TELL], { show: money(b * u2) }));
    }, function () {
      var p = two(), U = ri(2, 12) * 2, k = U; // before 1:3, both get k, after 1:2 (2U = V, U + k = V)
      return Qn('The ratio of ' + p[0] + "'s stamps to " + p[1] + "'s was 1 : 3. Each of them was then given " + k + ' more stamps, and the ratio became 1 : 2. How many stamps did ' + p[0] + ' have at first?', F(U), W([
        G('Both were given the same number. Does the DIFFERENCE between them change?', 'no', 'No — the difference stays the same. Before it is 2 units (3 − 1); after it is 1 part (2 − 1).', {}, 'Add the same to both bars.', ['yes', 'no']),
        G('So 1 part after = 2 units before. ' + p[0] + ' after has 1 part = 2 units, and before had 1 unit. How many units is the ' + k + ' stamps?', F(1), '1 unit = ' + k + ' stamps.', { m: { rows: [{ label: p[0], parts: [{ w: 1 }, { w: 1, k: 'x', t: '+' + k }] }, { label: p[1], parts: [{ w: 1 }, { w: 1 }, { w: 1 }, { w: 1, k: 'x', t: '+' + k }] }] } }, 'Compare ' + p[0] + ' before and after.'),
        TELL]));
    }],
    [function () {
      var p = two(), u = ri(2, 10) * 2, k = 3 * u / 2;
      return Qn(p[0] + ' had 2/5 as much money as ' + p[1] + '. After ' + p[0] + ' received ' + money(k) + ' and ' + p[1] + ' spent ' + money(k) + ', they had the same amount. How much did ' + p[1] + ' have at first?', F(5 * u), W([
        G('Before: ' + p[1] + ' 5 units. How many units has ' + p[0] + '?', F(2), p[0] + ' 2 units.', { m: { rows: [{ label: p[0], parts: units(2) }, { label: p[1], parts: units(5) }] } }, '2/5 of 5 units.'),
        G('The gap of 3 units is closed from both ends: ' + p[0] + ' goes up ' + money(k) + ' and ' + p[1] + ' comes down ' + money(k) + '. So 3 units = ?', F(2 * k), '3 units = ' + money(2 * k) + '.', { m: { rows: [{ label: p[0], parts: units(2).concat([{ w: 1.5, k: 'x', t: '+' + money(k) }]) }, { label: p[1], parts: units(3.5).slice(0, 3).concat([{ w: 0.5 }, { w: 1.5, k: 'gone', t: '−' + money(k) }]) }] } }, 'Add the two amounts.', { show: money(2 * k) }),
        TELL], { show: money(5 * u) }));
    }, function () {
      var p = two(), a = 3, b = 5, u = ri(2, 10) * 3, k = ri(1, 4) * 5; // A=3u spends 1/3 -> 2u; B=5u spends k -> 2u*2 = 4u => k = u
      k = u; var A = 3 * u, B = 5 * u;
      return Qn('The ratio of ' + p[0] + "'s money to " + p[1] + "'s was 3 : 5. " + p[0] + ' spent 1/3 of ' + p[0] + "'s money and " + p[1] + ' spent ' + money(k) + '. Then ' + p[1] + ' had twice as much as ' + p[0] + '. How much did ' + p[0] + ' have at first?', F(A), W([
        G(p[0] + ' had 3 units and spent 1/3. How many units are left?', F(2), p[0] + ' has 2 units left.', { m: { rows: [{ label: p[0], parts: [{ w: 1, k: 'gone' }, { w: 1 }, { w: 1 }] }, { label: p[1], parts: units(5) }] } }, '1/3 of 3 units.'),
        G(p[1] + ' then has twice ' + p[0] + "'s 2 units. How many units?", F(4), p[1] + ' has 4 units — so the ' + money(k) + ' spent was 1 unit.', { m: { rows: [{ label: p[0], parts: [{ w: 1, k: 'gone' }, { w: 1 }, { w: 1 }] }, { label: p[1], parts: units(4).concat([{ w: 1, k: 'gone', t: money(k) }]) }] } }, '2 × 2.'),
        TELL], { show: money(A) }));
    }]
  ]);

  // 10. Restate the problem in another way
  method('restate', 'Change the problem', 'Restate the problem', [
    [function () {
      var kids = ri(5, 15), each = ri(2, 5), left = ri(1, each - 1 || 1), tot = kids * each + left;
      return Qn('Some sweets are shared so that each child gets ' + each + ' and ' + left + ' are left over. There are ' + tot + ' sweets. How many children are there?', F(kids), W([
        G('Say it another way: if the ' + left + ' left-over sweets were put aside, how many sweets would be shared exactly?', F(tot - left), (tot - left) + ' sweets shared equally, ' + each + ' each.', {}, tot + ' − ' + left + '.'),
        TELL]));
    }, function () {
      var p = two(), m = ri(2, 6), b = ri(4, 15), a = m * b;
      return Qn(p[1] + ' has 1/' + m + ' as many stamps as ' + p[0] + '. ' + p[0] + ' has ' + a + ' stamps. How many more stamps does ' + p[0] + ' have than ' + p[1] + '?', F(a - b), W([
        G('Say it another way: ' + p[0] + ' has how many times as many as ' + p[1] + '?', F(m), p[0] + ' has ' + m + ' times as many.', { m: { rows: [{ label: p[0], parts: units(m) }, { label: p[1], parts: units(1) }] } }, '1/' + m + ' the other way round.'),
        TELL]));
    }],
    [function () {
      var u = ri(2, 12), boys = 5 * u, girls = 6 * u; // 3/5 of boys = 1/2 of girls → 3u = 3u
      return Qn('3/5 of the boys in a hall is the same number as 1/2 of the girls. There are ' + (boys + girls) + ' children. How many boys are there?', F(boys), W([
        G('Restate it with equal parts: 3/5 of the boys = 1/2 of the girls. Make both 3 parts: 1/2 is the same as ?/6', F(3), '1/2 = 3/6, so: 3 of 5 boy-parts = 3 of 6 girl-parts. Boys : girls = 5 : 6.', { m: { rows: [{ label: 'Boys', parts: units(3, '', 'hl').concat(units(2)) }, { label: 'Girls', parts: units(3, '', 'hl').concat(units(3)) }] } }, 'Double the top and the bottom.'),
        G('How many parts altogether?', F(11), '11 parts = ' + (boys + girls) + ' children.', {}, '5 + 6.'),
        TELL]));
    }, function () {
      var b = ri(2, 12) * 5, a = b * 6 / 5, p = two();
      return Qn(p[0] + ' has 20% more money than ' + p[1] + '. Together they have ' + money(a + b) + '. How much does ' + p[1] + ' have?', F(b), W([
        G('Say it as a ratio: if ' + p[1] + ' is 100%, ' + p[0] + ' is 120%. 120 : 100 in simplest form is ? : 5', F(6), p[0] + ' : ' + p[1] + ' = 6 : 5.', { m: { rows: [{ label: p[0], parts: units(6) }, { label: p[1], parts: units(5) }] } }, 'Divide both by 20.'),
        TELL], { show: money(b) }));
    }],
    [function () {
      var u = ri(2, 10), A = 6 * u, B = 5 * u, p = two(); // 1/3 A = 2/5 B → 2u = 2u
      return Qn('1/3 of ' + p[0] + "'s money equals 2/5 of " + p[1] + "'s. Together they have " + money(A + B) + '. How much has ' + p[0] + '?', F(A), W([
        G('Make the tops the same: 1/3 = ?/6', F(2), '1/3 = 2/6, so 2/6 of ' + p[0] + ' = 2/5 of ' + p[1] + ': ' + p[0] + ' : ' + p[1] + ' = 6 : 5.', { m: { rows: [{ label: p[0], parts: units(2, '', 'hl').concat(units(4)) }, { label: p[1], parts: units(2, '', 'hl').concat(units(3)) }] } }, 'Both fractions should have 2 on top.'),
        TELL], { show: money(A) }));
    }, function () {
      var a = pick([3, 4, 5]), b = a - 1, k = ri(1, 6), pen = b * k, file = pen + k;
      return Qn(a + ' pens cost the same as ' + b + ' files. A file costs ' + money(k) + ' more than a pen. How much is a pen?', F(pen), W([
        G('Restate: ' + b + ' files = ' + b + ' pens + ' + b + ' × ' + money(k) + '. So ' + a + ' pens = ' + b + ' pens + how much?', F(b * k), a + ' pens = ' + b + ' pens + ' + money(b * k) + '.', {}, b + ' lots of the extra.', { show: money(b * k) }),
        G('So ' + (a - b) + ' pen' + (a - b > 1 ? 's' : '') + ' cost how much?', F(b * k), (a - b) + ' pen = ' + money(b * k) + '.', {}, 'Take ' + b + ' pens off both sides.', { show: money(b * k) }),
        TELL], { show: money(pen) }));
    }]
  ]);

  // 11. Simplify the problem
  method('simplify', 'Change the problem', 'Simplify the problem', [
    [function () {
      var n = ri(5, 12) * 2;
      return Qn('Find 1 + 2 + 3 + … + ' + n + '.', F(n * (n + 1) / 2), W([
        G('Try a small case: 1 + 2 + 3 + 4. Pair the first and last (1 + 4) and the middle two (2 + 3). What does each pair make?', F(5), 'Each pair makes 5; 2 pairs make 10.', {}, 'Add them.'),
        G('For 1 to ' + n + ', each pair (1 + ' + n + ', 2 + ' + (n - 1) + ', …) makes ' + (n + 1) + '. How many pairs?', F(n / 2), (n / 2) + ' pairs of ' + (n + 1) + '.', {}, n + ' numbers, two in each pair.'),
        TELL]));
    }, function () {
      var n = ri(3, 4);
      var tot = 0; for (var k = 1; k <= n; k++) tot += k * k;
      return Qn('How many squares of any size are there on a ' + n + ' by ' + n + ' grid?', F(tot), W([
        G('Start small: a 2 by 2 grid has 4 small squares and how many big ones?', F(1), '2 by 2: 4 + 1 = 5 squares.', {}, 'The whole grid is a square too.'),
        G('On the ' + n + ' by ' + n + ' grid, how many 2 by 2 squares fit?', F((n - 1) * (n - 1)), ((n - 1) * (n - 1)) + ' of them — the counts are square numbers.', { tab: { head: ['Size', 'How many'], rows: [['1 by 1', String(n * n)], ['2 by 2', '?'], ['…', '…']] } }, 'Slide a 2 by 2 frame along and down.'),
        TELL]));
    }],
    [function () {
      var N = ri(60, 200);
      return Qn('The pages of a book are numbered 1 to ' + N + '. How many digits are printed altogether?', F(9 + 180 + (N - 99) * 3), W([
        G('Split it into simpler parts. Pages 1 to 9 use how many digits?', F(9), '9 digits.', {}, 'One digit each.'),
        G('Pages 10 to 99: how many pages, and 2 digits each. How many digits?', F(180), '90 pages × 2 = 180 digits.', {}, '99 − 10 + 1 = 90 pages.'),
        G('Pages 100 to ' + N + ': how many pages?', F(N - 99), (N - 99) + ' pages × 3 digits.', {}, N + ' − 100 + 1.'),
        TELL]));
    }, function () {
      var n = ri(8, 20);
      return Qn('Find 2 + 4 + 6 + … + ' + 2 * n + '.', F(n * (n + 1)), W([
        G('Simplify: 2 + 4 + 6 + … + ' + 2 * n + ' is 2 times which simpler sum? 1 + 2 + … + ?', F(n), '2 × (1 + 2 + … + ' + n + ').', {}, 'Halve each number.'),
        G('What is 1 + 2 + … + ' + n + '? (Pair the ends!)', F(n * (n + 1) / 2), String(n * (n + 1) / 2) + '.', {}, '(1 + ' + n + ') × ' + n + ' ÷ 2.'),
        TELL]));
    }],
    [function () {
      var n = ri(5, 8); var tot = 0; for (var k = 1; k <= n; k++) tot += k * k;
      return Qn('How many squares of all sizes are there on a ' + n + ' by ' + n + ' chessboard-like grid?', F(tot), W([
        G('Simplify: on a 3 by 3 grid there are 9 small, 4 middle and 1 big square. What kind of numbers are 9, 4, 1?', 'square numbers', 'Square numbers! So on ' + n + ' by ' + n + ': ' + n + '² + … + 1².', { tab: { head: ['Grid', 'Squares'], rows: [['1 by 1', '1'], ['2 by 2', '4 + 1 = 5'], ['3 by 3', '9 + 4 + 1 = 14']] } }, '3 × 3, 2 × 2, 1 × 1.', ['square numbers', 'even numbers', 'odd numbers']),
        TELL]));
    }, function () {
      var a = ri(20, 60), b = a + ri(20, 60) ; var cnt = b - a + 1;
      return Qn('Find the sum of all the whole numbers from ' + a + ' to ' + b + '.', F((a + b) * cnt / 2), W([
        G('How many numbers are there from ' + a + ' to ' + b + '?', F(cnt), cnt + ' numbers.', {}, b + ' − ' + a + ' + 1.'),
        G('Pair the first and last. What does each pair make?', F(a + b), 'Each pair makes ' + (a + b) + '; there are ' + cnt + ' ÷ 2 pairs.', {}, a + ' + ' + b + '.'),
        TELL]));
    }]
  ]);

  // 12. Solve part of the problem
  method('part', 'Change the problem', 'Solve part of the problem', [
    [function () {
      var n = ri(2, 5), pr = ri(2, 6), bag = ri(8, 25), paid = n * pr + bag < 45 ? pick([50, 100]) : 100;
      return Qn('Ali bought ' + n + ' pens at ' + money(pr) + ' each and a bag for ' + money(bag) + '. He paid with a ' + money(paid) + ' note. How much change did he get?', F(paid - n * pr - bag), W([
        G('Part 1: how much were the pens?', F(n * pr), 'Pens: ' + money(n * pr) + '.', {}, n + ' × ' + money(pr) + '.', { show: money(n * pr) }),
        G('Part 2: how much did he spend altogether?', F(n * pr + bag), 'Spent: ' + money(n * pr + bag) + '.', {}, 'Add the bag.', { show: money(n * pr + bag) }),
        TELL], { show: money(paid - n * pr - bag) }));
    }, function () {
      var cap = ri(4, 8) * 10, b = ri(2, 4), s = ri(4, 9);
      return Qn('A tank holds ' + cap + ' ℓ. ' + b + ' buckets of ' + s + ' ℓ each are poured in. How much more water is needed to fill it?', F(cap - b * s), W([
        G('Part 1: how much water has been poured in?', F(b * s), b * s + ' ℓ so far.', {}, b + ' × ' + s + '.'),
        TELL], { unit: 'ℓ' }));
    }],
    [function () {
      var L = ri(10, 16), Wd = ri(8, 12), s = ri(2, 3);
      return Qn('A ' + L + ' cm by ' + Wd + ' cm card has a ' + s + ' cm square cut out from two of its corners. What is the area of the card left?', F(L * Wd - 2 * s * s), W([
        G('Part 1: area of the whole card?', F(L * Wd), L * Wd + ' cm².', {}, 'Length × width.'),
        G('Part 2: area of the two squares cut out?', F(2 * s * s), 2 * s * s + ' cm².', {}, '2 × ' + s + ' × ' + s + '.'),
        TELL], { unit: 'cm²' }));
    }, function () {
      var packs = ri(4, 10), er = ri(3, 8);
      return Qn('Pencils are sold at 3 for $1. Erasers cost 60¢ each. Mei bought ' + 3 * packs + ' pencils and ' + er + ' erasers. How much did she spend?', fromDec(dec(packs + 0.6 * er, 2)), W([
        G('Part 1: ' + 3 * packs + ' pencils is how many groups of 3?', F(packs), packs + ' groups, so the pencils cost ' + money(packs) + '.', {}, 3 * packs + ' ÷ 3.'),
        G('Part 2: how much are the erasers?', fromDec(dec(0.6 * er, 2)), 'Erasers: ' + money(0.6 * er) + '.', {}, er + ' × 60¢.', { show: money(0.6 * er) }),
        TELL], { show: money(packs + 0.6 * er) }));
    }],
    [function () {
      var eggs = ri(4, 12) * 20, m = pick([25, 35, 40, 45]); var sold1 = eggs * m / 100, rem = eggs - sold1; if (rem % 4) { eggs = 240; m = 35; sold1 = 84; rem = 156; }
      return Qn('A shop had ' + eggs + ' eggs. It sold ' + m + '% of them in the morning and 3/4 of the remaining eggs in the afternoon. How many eggs were left?', F(rem / 4), W([
        G('Part 1: how many were sold in the morning?', F(sold1), sold1 + ' in the morning.', {}, m + '% of ' + eggs + '.'),
        G('Part 2: how many were left after the morning?', F(rem), rem + ' left.', {}, eggs + ' − ' + sold1 + '.'),
        G('Part 3: 3/4 of those were sold. What fraction of them is left?', F(1, 4), '1/4 of ' + rem + ' is left.', { m: { rows: [{ label: 'After morning', parts: [{ w: 1, k: 'x', t: '' }, { w: 1, k: 'x', t: '' }, { w: 1, k: 'x', t: '' }, { w: 1, k: 'hl', t: '?' }] }], right: { rows: [0, 0], t: String(rem) } } }, '1 − 3/4.', { simplest: true }),
        TELL]));
    }, function () {
      var L = 50, Wd = 40, H = 30, frac = pick([[3, 5], [1, 2], [2, 3]]), v = L * Wd * H * frac[0] / frac[1]; var bl = 40, bw = pick([25, 20]), h2 = v / (bl * bw);
      if (h2 % 1) { bw = 25; h2 = v / (bl * bw); }
      return Qn('Tank A is 50 cm long, 40 cm wide and 30 cm high, and is ' + frac[0] + '/' + frac[1] + ' full of water. All the water is poured into empty Tank B, whose base is 40 cm by ' + bw + ' cm. How deep is the water in Tank B?', fromDec(dec(h2, 2)), W([
        G('Part 1: what is the volume of Tank A when full? (cm³)', F(L * Wd * H), L * Wd * H + ' cm³.', {}, '50 × 40 × 30.'),
        G('Part 2: how much water is in it?', F(v), v + ' cm³ of water.', {}, frac[0] + '/' + frac[1] + ' of it.'),
        G('Part 3: what is the base area of Tank B?', F(bl * bw), (bl * bw) + ' cm².', {}, '40 × ' + bw + '.'),
        TELL], { unit: 'cm', show: dec(h2, 2) }));
    }]
  ]);

  // 13. Think of a related problem: recognise a problem as one of a kind she has solved, then solve it.
  var RELATED = ['model', 'beforeafter', 'suppose', 'backwards', 'part', 'restate'];
  method('related', 'Change the problem', 'Think of a related problem', [0, 1, 2].map(function (li) {
    return [function () {
      var mid = pick(RELATED), M = null; HS.forEach(function (x) { if (x.id === mid) M = x; });
      var Q = pick(M.levels[li])(); var opts = shuffle(RELATED.map(function (id) { var nm = ''; HS.forEach(function (x) { if (x.id === id) nm = x.name; }); return nm; })).slice(0, 3);
      if (opts.indexOf(M.name) < 0) opts[0] = M.name; opts = shuffle(opts);
      var walk = [G('Think of a problem you have solved before that is like this one. Which method did it use?', M.name, 'Yes — it is a "' + M.name + '" problem. Use that method again.', {}, 'What happens in the story: does something change, is something supposed, is it in steps?', opts)].concat(Q.walk || []);
      Q.walk = walk; Q.steps = walk.filter(function (s) { return s.t; }).map(function (s) { return s.t; }); Q.related = M.name; return Q;
    }];
  }));

  // Each method gives one problem at a chosen level, avoiding the template used last time.
  var H = HS.map(function (M) {
    return { id: M.id, name: M.name, group: M.group, levels: M.levels.length, gen: function (lv, last) {
      var bank = M.levels[Math.max(0, Math.min(M.levels.length - 1, (lv || 1) - 1))]; var i = Math.floor(Math.random() * bank.length);
      if (bank.length > 1 && i === last) i = (i + 1) % bank.length;
      var Q = bank[i](); Q.tpl = i; return Q;
    } };
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
