/* Number for Our School Days: Emily's Charlotte Mason arithmetic.
   The order of steps and the way each is taught follow Irene Stephens, "The Teaching of Mathematics to Young
   Children" (1911), written under Charlotte Mason's supervision: numbers 1 to 9 with things, ten bundles, money,
   numbers to 100 in tens, then the four rules and the tables. Lessons are short and mostly spoken.
   Steps marked "MOE add-in" are not in Stephens: they bring in topics MOE's 2021 Primary Mathematics Syllabus
   asks for at P1–P3 (time, length, shapes, picture graphs, measures, fractions), taught the same hands-on way.
   Every sum is made fresh by the code from numbers inside the step, and every answer is worked out by the code. */
(function () {
  'use strict';
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  var WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  function w(n) { return WORD[n] || String(n); }

  // ---------- spoken sums (Mum reads them aloud) ----------
  // Things to count, as Stephens used everyday things rather than special apparatus.
  var THINGS = [['bean', 'beans'], ['button', 'buttons'], ['pencil', 'pencils'], ['shell', 'shells'], ['stone', 'stones'], ['stick', 'sticks'], ['leaf', 'leaves'], ['marble', 'marbles']];
  var EATS = [['grape', 'grapes'], ['strawberry', 'strawberries'], ['biscuit', 'biscuits'], ['cracker', 'crackers'], ['peanut', 'peanuts']];
  // "1 bean", "3 beans"
  function nn(n, t) { return n + ' ' + (n === 1 ? t[0] : t[1]); }
  function addStory(a, b) {
    var t = pick(THINGS), e = pick(EATS);
    var L = [
      ['You have ' + nn(a, t) + ' and I give you ' + b + ' more. How many ' + t[1] + ' have you now?', a + b],
      ['There ' + (a === 1 ? 'is 1 bird' : 'are ' + a + ' birds') + ' on the fence and ' + b + ' more fly down. How many birds are on the fence now?', a + b],
      ['You eat ' + nn(a, e) + ' and then ' + b + ' more. How many ' + e[1] + ' did you eat?', a + b]
    ];
    // Stephens' own example; kept to ages a little sister could be.
    if (a + b <= 10) L.push(['Your little sister is ' + a + ' year' + (a === 1 ? '' : 's') + ' old. How old will she be in ' + b + ' more year' + (b === 1 ? '' : 's') + '?', a + b]);
    return pick(L);
  }
  function subStory(a, b) {
    var t = pick(THINGS), e = pick(EATS);
    return pick([
      ['You have ' + nn(a, t) + ' and give ' + b + ' to Emma. How many have you left?', a - b],
      ['There are ' + nn(a, e) + ' on the plate and you eat ' + b + '. How many are left?', a - b],
      [a + ' ducks are on the pond and ' + (b === 1 ? '1 swims' : b + ' swim') + ' away. How many ducks are still on the pond?', a - b]
    ]);
  }
  function moreStory(have, want) {
    var t = pick(THINGS);
    return pick([
      ['You have ' + nn(have, t) + ' and you want ' + want + '. How many more must you get?', want - have],
      ['You have read ' + have + ' page' + (have === 1 ? '' : 's') + ' and the chapter has ' + want + '. How many pages are left to read?', want - have]
    ]);
  }
  function pure(q, a) { return [q, a]; }

  // ---------- quick facts (Emily answers on her own iPad) ----------
  function fAdd(max) { var a = ri(1, max - 1), b = ri(1, max - a); return [a + ' + ' + b, a + b]; }
  function fSub(max) { var a = ri(2, max), b = ri(1, a - 1); return [a + ' − ' + b, a - b]; }
  function fBond(n) { var a = ri(1, n - 1); return [a + ' + ? = ' + n, n - a]; }

  var STEPS = [];
  function step(o) { STEPS.push(o); }

  // ---------- Year 1: numbers 1 to 100 (Stephens) ----------
  step({ id: 'one', year: 1, name: 'One', src: 'stephens',
    objects: 'Nothing to set out: the room itself.',
    how: ['Look round the room together for things there is only one of: one door, one clock, one piano.',
      'Show her the figure 1, then let her find the ones among a few written figures.'],
    sums: function () { return [pure('Point to something in this room that there is only one of.', 'Any one thing'), pure('How many noses have you?', 1), pure('How many mouths has a cat?', 1)]; },
    facts: null });

  [2, 3, 4, 5, 6, 7, 8, 9].forEach(function (n) {
    var how = ['Give her ' + w(n) + ' beans (or buttons). Ask the questions with the beans in front of her, then put the beans away and ask a few more without them.',
      'Show ' + w(n) + ' made of smaller numbers in every way, for example ' + (n === 2 ? '1 and 1' : (n - 1) + ' and 1, ' + (n - 2) + ' and 2') + '.',
      'Let her count up to ' + w(n) + ' and back down again.',
      'She writes the figure ' + n + ' neatly, on a slate or in a squared book. Writing comes after the sums are done aloud.'];
    if (n === 5) how.push('Now that she knows several numbers, bring in the signs: + means "added to", − means "taken away from", = means "the same as".');
    step({ id: 'n' + n, year: 1, name: cap(w(n)), src: 'stephens', n: n,
      objects: w(n) + ' beans, buttons or pencils',
      how: how,
      sums: function () {
        var out = []; var a = ri(1, n - 1);
        out.push(pure(a + ' and ' + (n - a) + ' make how many?', n));
        var b = ri(1, n - 1); out.push(pure('Take ' + b + ' from ' + n + '. How many are left?', n - b));
        var c = ri(1, n - 1); out.push(addStory(c, n - c));
        var d = ri(1, n - 1); out.push(subStory(n, d));
        if (n >= 3) { var h = ri(1, n - 2); out.push(moreStory(h, n)); }
        if (n % 2 === 0) out.push(pure('How many twos make ' + n + '?', n / 2));
        return out;
      },
      facts: function () { return pick([fAdd(n), fSub(n), fBond(n)]); } });
  });

  step({ id: 'shapes2d', year: 1, name: 'Flat shapes', src: 'moe', moe: 'P1 · 2D shapes',
    adapt: 'Charlotte Mason objected to boxes of cut-out "form" (Home Education, p. 263): the idea must come before the form, and children should meet shapes in living things. So she finds the shapes first and makes them herself, instead of being handed them.',
    objects: 'Nothing bought: the flat, the garden, a sheet of paper to fold, a plate to trace round, squared paper',
    how: ['Go looking first. On a walk or round the flat, find circles, squares, rectangles and triangles in real things: a drain cover, a window, a roof end, a star fruit or an orange cut across. She names the shape and tells you where she saw it.',
      'Make shapes by folding, not cutting out a set: fold a corner of a sheet down to the edge and the square appears; trace round a plate, then fold the circle in half and in quarters.',
      'She draws what she found, in her nature notebook or on squared paper: the window as a rectangle, the roof end as a triangle.',
      'Look at a building or a picture together and say which shapes it is made of.'],
    sums: null, facts: null });

  step({ id: 'ten', year: 1, name: 'Ten: the ten bundle', src: 'stephens',
    objects: 'Matchsticks or ice-cream sticks and rubber bands (or beads threaded in tens)',
    how: ['Count out ten sticks with her and tie them into a bundle. Each loose stick is a "unit".',
      'Write 10 on squared paper with 1 in the tens column and 0 in the units column. Write 1 to 9 above it, so the 0 sits under the 9.',
      'Put the bundles away as soon as she has the idea.',
      'If you like: on a ruler, count the tiny marks between 0 and 1. Ten millimetres make one centimetre, as ten units make a ten. (MOE does not ask for millimetres yet.)'],
    sums: function () { var a = ri(1, 9); return [pure('How many units are in a ten bundle?', 10), pure(a + ' and how many more make ten?', 10 - a), pure('Ten take away ' + a + '?', 10 - a), addStory(a, 10 - a)]; },
    facts: function () { return pick([fBond(10), fSub(10), fAdd(10)]); } });

  step({ id: 'teens', year: 1, name: '11 to 20', src: 'stephens',
    objects: 'One ten bundle and ten loose sticks',
    how: ['Make each number as "1 ten bundle and so many units": eleven is 1 ten and 1 unit.',
      'Count forwards and backwards between 10 and 20, and write the numbers in tens and units columns.',
      'Drop the bundle as soon as she can say the tens and units without it.'],
    sums: function () { var u = ri(1, 9), x = ri(11, 19); var a = ri(2, 9), b = ri(11 - a, 9);
      return [pure('1 ten and ' + u + ' unit' + (u === 1 ? '' : 's') + ' make what number?', 10 + u), pure('How many tens and how many units in ' + x + '?', '1 ten and ' + (x - 10) + ' unit' + (x === 11 ? '' : 's')), addStory(a, b), subStory(ri(12, 20), ri(2, 9))]; },
    facts: function () { return pick([fAdd(20), fSub(20), fBond(ri(11, 20))]); } });

  step({ id: 'money', year: 1, name: 'Money', src: 'stephens',
    adapt: 'Stephens used pennies, sixpences and shillings. Singapore money is used instead: $1 coins, $2, $5 and $10 notes, then 10¢, 20¢ and 50¢ coins.',
    objects: 'A purse with real $1 coins and $2, $5 and $10 notes (or play money)',
    how: ['Show that two $1 coins can be changed for a $2 note, five for a $5 note, and so on. Let her do the changing herself.',
      'Play shop with prices up to $12, paying and giving change.',
      'The $10 note is a ten bundle: $13 is one $10 note and three $1 coins.',
      'Later, the same with 10¢, 20¢ and 50¢ coins up to $1.'],
    sums: function () { var p = ri(2, 9); var q = ri(1, 10 - p);
      return [pure('How many $1 coins can you get for a $5 note?', 5), (function () { var c = ri(1, 3); return pure('You have a $2 note and ' + w(c) + ' $1 coin' + (c > 1 ? 's' : '') + '. How much is that?', '$' + (2 + c)); })(), pure('A pencil costs $' + p + '. You pay with a $10 note. How much change?', 10 - p), pure('A book costs $' + p + ' and a ruler $' + q + '. How much for both?', p + q), pure('How many 10¢ coins make 50¢?', 5)]; },
    facts: function () { var p = ri(1, 9); return pick([['$10 − $' + p, 10 - p], ['$' + p + ' + $' + (10 - p), 10], fAdd(12)]); } });

  step({ id: 'cm', year: 1, name: 'Measuring in centimetres', src: 'moe', moe: 'P1 · Length in cm',
    adapt: 'Stephens brings in each measure at the number it belongs to: inches and yards at 36, hours and minutes at 60. Centimetres come here, just before the 20s, because a school ruler stops at 30; metres come at 100, kilometres, kilograms and litres at 1000.',
    objects: 'A ruler marked in centimetres; pencils, crayons and leaves to measure',
    how: ['Measure things to the nearest centimetre and write the length with "cm".',
      'Put three things in order from shortest to longest, and say how much longer one is than another.',
      'Draw a line of a given length, such as 7 cm, with the ruler.',
      'Keep to things shorter than her 30 cm ruler for now: her hand span, a pencil, a leaf.'],
    sums: function () { var a = ri(5, 15), b = ri(2, a - 1); return [pure('One pencil is ' + a + ' cm and another is ' + b + ' cm. How much longer is the first?', (a - b) + ' cm')]; },
    facts: null });

  [20, 30, 40, 50, 60, 70, 80, 90].forEach(function (d) {
    var how = ['Spend about a week or ten days on these ten numbers. Count in tens up to ' + d + ', then count on from ' + d + ' to ' + (d + 9) + ' and back.',
      'Each number is so many tens and units: ' + (d + 4) + ' is ' + w(d / 10) + ' tens and 4 units. Write them in columns.',
      'Look at each number from many sides: ' + d + ' is ' + (d - 1) + ' + 1, ' + (d - 2) + ' + 2 …, it is ' + (d / 10) + ' × 10' + (d % 20 === 0 ? ', and half of it is ' + (d / 2) : '') + '. Use money for it too.',
      'Add tens first, then units: 41 + 25 is 4 tens + 2 tens = 6 tens, and 1 + 5 = 6 units, so 66.'];
    if (d === 20) how[0] = 'Twenty is two ten bundles. Count on from 20 to 29 and back, and write the numbers in tens and units columns.';
    step({ id: 'd' + d, year: 1, name: 'The ' + d + 's', src: 'stephens', d: d,
      objects: d === 20 ? 'Two ten bundles and loose sticks (only if she still needs them)' : 'Money: $10 notes and $1 coins, if she needs something in her hands',
      how: how,
      sums: function () {
        var u = ri(1, 9), tens = d / 10; var a = d + ri(0, 5), b = ri(1, 9 - (a - d));
        var t1 = ri(1, tens - 1), u1 = ri(0, 4); var x = t1 * 10 + u1; var y = d - t1 * 10 + ri(0, 4);
        var out = [pure(cap(w(tens)) + ' tens and ' + u + ' unit' + (u === 1 ? '' : 's') + ' make what number?', d + u),
          pure(a + ' and ' + b + ' more?', a + b),
          pure((d + u) + ' take away ' + u + '?', d)];
        if (tens >= 2) { var p = ri(10, d - 10); out.push(pure(p + ' and how many more make ' + d + '?', d - p)); }
        if (tens >= 3) out.push(pure(x + ' + ' + y + ' (tens first, then units)', x + y));
        out.push(addStory(ri(10, d - 10), ri(1, 9)));
        return out;
      },
      facts: function () { var u = ri(1, 9); return pick([[d + ' + ' + u, d + u], [(d + u) + ' − ' + u, d], [(d - 10) + ' + 10', d], fBond(10)]); } });
    if (d === 30) step({ id: 'clock', year: 1, name: 'Telling the time', src: 'moe', moe: 'P1 · Time to 5 minutes',
      objects: 'A real clock with hands (or a paper clock with a split pin)',
      how: ['Read the hour hand first, then count the minutes round in fives.',
        'Use "am" and "pm" for the times of her own day: breakfast, piano, bedtime.',
        'Talk about how long things take: one hour, half an hour. Write them with "h" and "min".'],
      sums: function () { var h = ri(1, 11); return [pure('It is ' + h + ' o\'clock. What time will it be in one hour?', (h + 1) + ' o\'clock'), pure('How many minutes in half an hour?', 30)]; },
      facts: null });
    if (d === 50) step({ id: 'graph', year: 1, name: 'Picture graphs', src: 'moe', moe: 'P1 · Picture graphs',
      objects: 'Squared paper; something she has counted, such as birds seen or the weather each day',
      how: ['Let her keep a count for a week (birds at the window, sunny and rainy days) and draw one small picture for each.',
        'Ask: which had the most? How many more sunny days than rainy ones?'],
      sums: null, facts: null });
  });

  step({ id: 'd100', year: 1, name: 'One hundred', src: 'stephens',
    objects: 'Ten ten bundles (once, to see it); a metre rule and ten 10 cm paper strips',
    how: ['Ten tens make a hundred. Count in tens to 100 and back, and count on in ones across a ten (38, 39, 40, 41).',
      'Look at 100 from many sides: 99 + 1, 50 + 50, 10 × 10, half of it is 50, a quarter is 25.',
      '100 centimetres make 1 metre. Lay ten 10 cm strips along a metre rule and count them in tens. Then measure the table, the door and herself in metres and centimetres: 1 m 20 cm is 120 cm.'],
    sums: function () { var a = ri(11, 89); var t = ri(1, 9) * 10; var c = ri(5, 95); return [pure(a + ' and how many more make 100?', 100 - a), pure('How many tens make 100?', 10), pure(t + ' and how many more make 100?', 100 - t), pure('How many centimetres make 1 metre?', 100), pure('A ribbon is ' + c + ' cm long. How much more is needed to make 1 m?', (100 - c) + ' cm')]; },
    facts: function () { var t = ri(1, 9) * 10; return pick([[t + ' + ? = 100', 100 - t], [t + ' + ' + (100 - t - 10), 90], fAdd(100)]); } });

  // ---------- Year 2: the four rules and the tables (Stephens) ----------
  step({ id: 'add', year: 2, name: 'Adding with carrying', src: 'stephens',
    objects: 'Money first: $10 notes and $1 coins',
    how: ['Start with money: add dollars, changing ten $1 coins for a $10 note when there are enough.',
      'Then pure number in columns: 2 units + 8 units = 10 units, so write 0 and carry 1 ten. Say "1 ten", not "1".',
      'Compare carrying with changing thirteen $1 coins for a $10 note and three $1 coins.'],
    sums: function () { var ua = ri(2, 9), ub = ri(10 - ua, 9); var a = ri(1, 4) * 10 + ua, b = ri(1, 4) * 10 + ub; return [pure(a + ' + ' + b, a + b), pure('$' + a + ' and $' + b + ' together?', '$' + (a + b)), addStory(ri(15, 39), ri(15, 39))]; },
    facts: function () { var a = ri(11, 59), b = ri(11, 39); return [a + ' + ' + b, a + b]; } });

  step({ id: 'subc', year: 2, name: 'How many more?', src: 'stephens',
    objects: 'Beans or money, only if needed',
    how: ['Bring in subtraction as the other side of adding: "If I have six nuts and want nine, how many more must I get?"',
      'Children find these easier than taking away, so give plenty of them.'],
    sums: function () { var h = ri(3, 40), want = h + ri(2, 20); return [moreStory(h, want), moreStory(ri(5, 15), ri(16, 30)), pure(h + ' and how many make ' + want + '?', want - h)]; },
    facts: function () { var h = ri(5, 60), x = ri(2, 30); return [h + ' + ? = ' + (h + x), x]; } });

  step({ id: 'sub', year: 2, name: 'Taking away', src: 'stephens',
    objects: 'A purse: $10 notes and $1 coins',
    how: ['Take away with money first: pay $7 from a purse with three $10 notes, changing a $10 note for ten $1 coins.',
      'Then pure number: when there are not enough units, turn a ten into ten units.',
      'Use this one method only; Stephens advises teaching one way.'],
    sums: function () { var a = ri(31, 95), b = ri(12, a - 10); return [pure(a + ' − ' + b, a - b), subStory(ri(20, 60), ri(5, 19)), (function () { var have = ri(3, 5) * 10, sp = ri(11, 19); return pure('You have $' + have + ' and spend $' + sp + '. How much is left?', '$' + (have - sp)); })()]; },
    facts: function () { var a = ri(20, 99), b = ri(1, a - 1); return [a + ' − ' + b, a - b]; } });

  step({ id: 'mul', year: 2, name: 'Multiplying is adding', src: 'stephens',
    objects: 'Beans set out in rows',
    how: ['Show multiplying as adding the same number again: 4 children with $6 each is $6 + $6 + $6 + $6.',
      'Then show "$6 × 4" as a short way of writing it. Keep the × sign until now.'],
    sums: function () { var a = ri(2, 6), b = ri(2, 5); return [pure(b + ' children each have ' + a + ' sweets. How many sweets altogether?', a * b), pure('How many legs have ' + b + ' sparrows?', b * 2), pure(a + ' + ' + a + ' + ' + a, a * 3)]; },
    facts: function () { var a = ri(2, 5), b = ri(2, 5); return [Array(b + 1).join(a + ' + ').slice(0, -3), a * b]; } });

  function tableStep(t, year, moe) {
    step({ id: 't' + t, year: year, name: 'The ' + w(t) + ' times table', src: 'stephens', moe: moe, t: t,
      objects: 'Paper and pencil for building the table together',
      how: ['Build the table with her: you write ' + t + ', then keep adding ' + t + ' while she says each total. Write the whole table out.',
        'Let her look at it, then rub out some of the answers for her to fill in. Then she says it aloud.',
        'She learns it by heart on her own, not in chorus: forwards ("' + t + ' times 1 is ' + t + '") and in mixed order ("Four ' + t + 's are ' + (4 * t) + '").',
        'Follow the table with little problems that use it.'],
      sums: function () { var k = ri(2, 10), m = ri(2, 10); return [pure('Four ' + t + 's?', 4 * t), pure(k + ' times ' + t + '?', k * t), pure('How many ' + t + 's in ' + (m * t) + '?', m), pure('One sweet costs ' + t + '¢. How much for ' + m + ' sweets?', (m * t) + '¢')]; },
      facts: function () { var k = ri(1, 10); return pick([[t + ' × ' + k, t * k], [k + ' × ' + t, t * k], [(t * k) + ' ÷ ' + t, k]]); } });
  }
  tableStep(2, 2, 'P2'); tableStep(10, 2, 'P2'); tableStep(5, 2, 'P2');

  step({ id: 'share', year: 2, name: 'Sharing (dividing)', src: 'stephens',
    objects: 'Beans or nuts to share into heaps',
    how: ['Divide first by sharing: share 12 nuts into heaps of three.',
      'Then "how many can you buy?": how many 20¢ sweets for $1?',
      'Bring in the ÷ sign once she can do these aloud.'],
    sums: function () { var b = pick([2, 5, 10]), k = ri(2, 6); return [pure('Share ' + (b * k) + ' nuts into heaps of ' + b + '. How many heaps?', k), pure('Share ' + (b * k) + ' beans between ' + b + ' children. How many each?', k), pure('How many 20¢ sweets can you buy for $1?', 5)]; },
    facts: function () { var b = pick([2, 5, 10]), k = ri(1, 10); return [(b * k) + ' ÷ ' + b, k]; } });

  tableStep(3, 2, 'P2'); tableStep(4, 2, 'P2');

  step({ id: 'frac', year: 2, name: 'Halves, quarters and thirds', src: 'stephens', moe: 'P2 · Fraction of a whole',
    adapt: 'Stephens stops here and leaves fractions until after decimals. MOE wants more at P2, so the last part (comparing, adding like fractions) is an MOE add-in.',
    objects: 'Paper strips to fold; an orange or a cake to cut',
    how: ['Fold strips into halves, quarters and thirds, and cut real things into equal parts.',
      'A fifth of 20 is 20 ÷ 5: a fraction of a number is a division.',
      'MOE add-in: write fractions as parts of a whole, compare unit fractions (a half is bigger than a quarter), and add like fractions within one whole (2 fifths and 1 fifth make 3 fifths).'],
    sums: function () { var k = ri(2, 6); return [pure('What is half of ' + (2 * k) + '?', k), pure('What is a quarter of ' + (4 * k) + '?', k), pure('A third of ' + (3 * k) + '?', k), pure('2 fifths and 1 fifth make how many fifths?', 3)]; },
    facts: function () { var k = ri(1, 10); return pick([['half of ' + (2 * k), k], ['a quarter of ' + (4 * k), k], ['a third of ' + (3 * k), k]]); } });

  step({ id: 'sdiv', year: 2, name: 'Short division', src: 'stephens',
    objects: 'Money, if needed: $10 notes and $1 coins',
    how: ['Divide tens first, then units: 48 ÷ 2 is 4 tens ÷ 2 = 2 tens, and 8 units ÷ 2 = 4 units, so 24.',
      'Keep to numbers that share out evenly for now.'],
    sums: function () { var d = pick([2, 3, 4]), a = ri(1, 3), b = ri(1, 3); var n = d * (a * 10 + b); return [pure(n + ' ÷ ' + d, n / d), pure('Share $' + n + ' equally between ' + d + ' children. How much each?', '$' + (n / d))]; },
    facts: function () { var d = pick([2, 3, 4, 5]), q = ri(11, 24); return [(d * q) + ' ÷ ' + d, q]; } });

  step({ id: 'measures', year: 2, name: 'Metres, kilograms and litres', src: 'moe', moe: 'P2 · Length, mass, volume',
    adapt: 'Stephens leaves weights and measures until the start of the ninth year (age 8), with children pouring and weighing to make their own tables. MOE wants m, g, kg and ℓ at P2, so this step comes earlier, done her way.',
    objects: 'Kitchen scales, a 1-litre jug, a metre ruler or tape measure, rice or sand, water',
    how: ['Let her weigh and pour for herself: how many cups fill the litre jug? What does a bag of rice weigh?',
      'Measure the room and the table in metres and centimetres, as she began at 100; weigh in grams and kilograms, as she began at 1000.',
      'Put three things in order of length, of mass, and of how much they hold.'],
    sums: function () { var a = ri(2, 9); return [pure('A bag of rice is ' + a + ' kg and another is 1 kg. How much heavier is the first?', (a - 1) + ' kg')]; },
    facts: null });

  step({ id: 'time2', year: 2, name: 'Time to the minute', src: 'moe', moe: 'P2 · Time',
    objects: 'A clock with hands',
    how: ['Read the time to the minute.',
      'Work out how long things take in hours and minutes, and change hours and minutes into minutes (1 h 20 min is 80 min).'],
    sums: function () { var m = ri(1, 50); return [pure('1 hour and ' + m + ' minutes is how many minutes?', 60 + m)]; },
    facts: function () { var m = ri(1, 59); return ['1 h ' + m + ' min = ? min', 60 + m]; } });

  step({ id: 'shapes3d', year: 2, name: 'Solid shapes', src: 'moe', moe: 'P2 · 3D shapes and patterns',
    adapt: 'Taught from real things, as Charlotte Mason wished (Home Education, p. 263), not from a set of wooden or card solids.',
    objects: 'The kitchen: tins, boxes, a dice, an orange, an ice-cream cone; floor tiles or batik to look at',
    how: ['Find solids in the kitchen and outside: a tin is a cylinder, an orange a sphere, a dice a cube, a cereal box a cuboid, an ice-cream cone a cone. Let her handle them: which roll, which stack, which do both? Count the flat faces and the edges.',
      'Patterns: look for them first in real things, such as Peranakan tiles, batik, a pineapple\'s skin, a fence. Then she carries one on in her own drawing, changing size, shape, colour or which way round, as MOE asks.'],
    sums: null, facts: null });

  step({ id: 'h1000', year: 2, name: 'Numbers to 1000', src: 'stephens', moe: 'P2 · Numbers to 1000',
    adapt: 'Stephens goes to 100 in year one. MOE asks for 1000 at P2, so this step carries her ten bundles on to hundreds.',
    objects: 'Ten ten bundles tied into a hundred bundle; $100 in $10 notes; kitchen scales and a 1-litre jug',
    how: ['Ten tens make a hundred bundle, as ten units made a ten. Write hundreds, tens and units in columns.',
      'Count in tens and in hundreds, and say each number as hundreds, tens and units.',
      'Odd and even numbers: can it be shared into twos with none left over?',
      'She reads and writes 3-digit numbers in words, and puts numbers in order by looking at the hundreds first, then the tens.',
      'A thousand: 1000 metres make 1 kilometre, 1000 grams make 1 kilogram, 1000 millilitres make 1 litre. Weigh out 1 kg of rice; fill the litre jug; pace out a kilometre on a walk and count the hundreds of metres.'],
    sums: function () { var h = ri(1, 9), t = ri(0, 9), u = ri(0, 9); var n = h * 100 + t * 10 + u; var g = ri(1, 9) * 100; return [pure('How many grams make 1 kg?', 1000), pure('A bag holds ' + g + ' g of rice. How many more grams make 1 kg?', (1000 - g) + ' g'), pure(h + ' hundred' + (h === 1 ? '' : 's') + ', ' + t + ' ten' + (t === 1 ? '' : 's') + ' and ' + u + ' unit' + (u === 1 ? '' : 's') + ' make what number?', n), pure(n + ' + 10', n + 10), pure(n + ' + 100', n > 899 ? null : n + 100), pure('Is ' + n + ' odd or even?', n % 2 ? 'odd' : 'even')]; },
    facts: function () { var n = ri(100, 899); return pick([[n + ' + 100', n + 100], [n + ' + 10', n + 10], [(n + 100) + ' − 100', n]]); } });

  // ---------- Year 3: the rest of the tables (MOE P3, taught Stephens' way) ----------
  tableStep(6, 3, 'P3'); tableStep(7, 3, 'P3'); tableStep(8, 3, 'P3'); tableStep(9, 3, 'P3');



  // ---------- P4 (age 9): Ray's Practical Arithmetic and Hall & Stevens, with MOE add-ins ----------
  // Book exercises are copied from the books (Ray's Practical Arithmetic, "Third Book"; Hall & Stevens, Lessons in
  // Experimental and Practical Geometry, 1917 Canadian edition). Every answer was checked by calculation; exercises the
  // scans garbled were left out. Old US money and inches are kept as Ray and Hall & Stevens wrote them.
  var ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function words3(n) { // 0..999, British "and"
    var h = Math.floor(n / 100), r = n % 100, out = [];
    if (h) out.push(ONES[h] + ' hundred');
    if (r) { var t = r < 20 ? ONES[r] : TENS[Math.floor(r / 10)] + (r % 10 ? '-' + ONES[r % 10] : ''); out.push((h ? 'and ' : '') + t); }
    return out.join(' ');
  }
  function inWords(n) {
    if (n === 0) return 'zero';
    var th = Math.floor(n / 1000), r = n % 1000, s = '';
    if (th) s = words3(th) + ' thousand';
    if (r) s += (th ? (r < 100 ? ' and ' : ' ') : '') + words3(r);
    return s;
  }
  function frac(n, d) { return n + '/' + d; }
  function gcdf(a, b) { return b ? gcdf(b, a % b) : a; }
  function simp(n, d) { var g = gcdf(n, d); n /= g; d /= g; if (d === 1) return String(n); if (n > d) return Math.floor(n / d) + ' ' + (n % d) + '/' + d; return n + '/' + d; }
  function dstr(x) { return String(+x.toFixed(6)); }

  var RAYP = "Ray's Practical Arithmetic", HS = 'Hall & Stevens, Experimental and Practical Geometry';

  step({ id: 'p4num', year: 4, name: 'Numbers to 100 000', src: 'ray', ref: RAYP + ', Arts. 8–16', moe: 'P4 · Numbers to 100 000',
    objects: 'A place-value chart or squared paper ruled in columns',
    how: ['Ray groups the figures into periods of three: units, thousands, millions. Each place is worth ten times the place on its right.',
      'To read a number, point it off into periods from the right, read each period as a number of its own, then say the period\'s name.',
      'To write one, put each figure in its place and fill an empty place with a nought.',
      'She reads the book\'s numbers aloud, then writes them; she writes the words ones in figures.'],
    book: { ref: RAYP + ', Arts. 13 and 15', items: [
      ['Write in figures: twenty-five thousand and six.', 25006], ['Write in figures: forty-two thousand and thirty.', 42030],
      ['Read, then write in words: 1085', inWords(1085)], ['Read, then write in words: 3045', inWords(3045)], ['Read, then write in words: 9699', inWords(9699)],
      ['Read, then write in words: 456000', inWords(456000)], ['Read, then write in words: 704208', inWords(704208)], ['Read, then write in words: 800141', inWords(800141)],
      ['Read, then write in words: 601020', inWords(601020)], ['Read, then write in words: 910103', inWords(910103)]] },
    sums: function () { var n = ri(10000, 99999); var d = String(n); var pos = ri(0, 4); var names = ['ten thousands', 'thousands', 'hundreds', 'tens', 'ones'];
      return [pure('What is the value of the digit ' + d[pos] + ' in ' + n + '? (It is in the ' + names[pos] + ' place.)', +d[pos] * Math.pow(10, 4 - pos)), pure('Write ' + inWords(n) + ' in figures.', n), pure('What is 10 000 more than ' + (n - 10000 > 0 ? n - 10000 : n) + '?', (n - 10000 > 0 ? n : n + 10000))]; },
    facts: function () { var n = ri(10000, 89999); return pick([[n + ' + 10 000', n + 10000], [n + ' + 1000', n + 1000]]); } });

  step({ id: 'p4round', year: 4, name: 'Rounding and ≈', src: 'moe', moe: 'P4 · Rounding to 10, 100, 1000',
    objects: 'A number line drawn on a strip of paper',
    how: ['Mark the number between the two tens (or hundreds, or thousands) it lies between, and see which it is nearer. Halfway goes up.',
      'Write ≈ for "is about": 4 682 ≈ 4 700.',
      'Use it for real estimates: about how many pages in the shelf of books, about how much the shopping will cost.'],
    sums: function () { var n = ri(1000, 99999); return [pure('Round ' + n + ' to the nearest 10.', Math.round(n / 10) * 10), pure('Round ' + n + ' to the nearest 100.', Math.round(n / 100) * 100), pure('Round ' + n + ' to the nearest 1000.', Math.round(n / 1000) * 1000)]; },
    facts: function () { var n = ri(100, 9999); return [n + ' to the nearest 100', Math.round(n / 100) * 100]; } });

  step({ id: 'p4mul', year: 4, name: 'Long multiplication', src: 'ray', ref: RAYP + ', Arts. 31–33', moe: 'P4 · Multiplication algorithm',
    objects: 'Squared paper to keep the columns straight',
    how: ['With a multiplier of 12 or less, multiply each figure in turn and carry the tens, as in adding.',
      'With a larger multiplier, multiply by each figure of it in turn. Write each part-product so its right-hand figure stands under the figure you multiplied by, then add the part-products.',
      'Ray\'s proof: multiply by one less than the multiplier, then add the first number once more. You should get the same answer.'],
    book: { ref: RAYP + ', Arts. 28–33', items: [
      ['235 × 13', 3055], ['346 × 19', 6574], ['425 × 29', 12325], ['518 × 34', 17612], ['279 × 37', 10323], ['869 × 49', 42581],
      ['294 × 57', 16758], ['429 × 62', 26598], ['485 × 76', 36860], ['624 × 85', 53040], ['976 × 97', 94672],
      ['In an orchard there are 4 rows of trees, in each row 21 trees: how many trees in the orchard?', 84],
      ['What will 2 houses cost at $231 each?', '$462'],
      ['There are 1760 yards in one mile; how many yards are there in 209 miles?', '367840 yards'],
      ['How far will a ship sail in 56 weeks, at the rate of 2395 miles per week?', '134120 miles'],
      ['How many pounds of iron are there in 54 loads, each weighing 2873 pounds?', '155142 pounds']] },
    facts: function () { var a = ri(12, 99), b = ri(2, 9); return [a + ' × ' + b, a * b]; } });

  step({ id: 'p4div', year: 4, name: 'Short division', src: 'ray', ref: RAYP + ', Arts. 43–45', moe: 'P4 · Division up to 4 digits by 1 digit',
    objects: 'Squared paper',
    how: ['Short division is for a divisor of 12 or less: do the dividing in your head and write only the answer, with any remainder after it.',
      'Start from the left. Divide each figure, and carry what is left over to the next figure as so many tens of it.',
      'Ray\'s proof: multiply the answer by the divisor and add the remainder; you should get the number you started with.'],
    book: { ref: RAYP + ', Arts. 43–45', items: [
      ['How many times is 3 contained in 129?', 43], ['How many times is 3 contained in 735?', 245], ['How many times is 3 contained in 743?', '247, remainder 2'],
      ['How many times 4 in 948?', 237], ['How many times 5 in 1170?', 234], ['Divide 653 cents by 3.', '217 cents, remainder 2'],
      ['Divide 8652 by 2.', 4326], ['How many times 4 in 8408?', 2102],
      ['If oranges cost 3 cents each, how many can be bought for 894 cents?', '298 oranges'],
      ['If flour cost $4 a barrel, how many barrels can be bought for $812?', '203 barrels'],
      ['A carpenter receives $423 for 9 months\' work: how much is that per month?', '$47']] },
    facts: function () { var b = ri(2, 9), q = ri(12, 99); return [(b * q) + ' ÷ ' + b, q]; } });

  step({ id: 'p4factors', year: 4, name: 'Factors and prime numbers', src: 'ray', ref: RAYP + ', Arts. 110–114', moe: 'P4 · Factors and multiples',
    objects: 'Beans or counters to lay out in rectangles',
    how: ['A factor of a number divides it exactly. A prime number can be divided exactly only by itself and 1; any other number is composite.',
      'Lay out 12 beans in every rectangle you can (1 by 12, 2 by 6, 3 by 4): the sides are its factors. 7 beans make only one rectangle: 7 is prime.',
      'Ray\'s tests: a number is divisible by 2 if it ends in an even figure, by 5 if it ends in 0 or 5, by 10 if it ends in 0, by 4 if its last two figures are.',
      'To find prime factors, keep dividing by the smallest prime that goes exactly.'],
    book: { ref: RAYP + ', Art. 113', items: [['Find the prime factors of 105.', '3, 5, 7'], ['Find the prime factors of 168.', '2, 2, 2, 3, 7'], ['Find the prime factors of 216.', '2, 2, 2, 3, 3, 3'], ['Find the prime factors of 330.', '2, 3, 5, 11']] },
    sums: function () { var d = ri(2, 9), n = ri(20, 99); return [pure('Is ' + d + ' a factor of ' + n + '?', n % d === 0 ? 'yes' : 'no (remainder ' + (n % d) + ')'), (function () { var m = pick([12, 18, 20, 24, 30, 36]); var f = []; for (var i = 1; i <= m; i++) if (m % i === 0) f.push(i); return pure('List all the factors of ' + m + '.', f.join(', ')); })()]; },
    facts: function () { var d = ri(2, 9), k = ri(3, 11); return [(d * k) + ' ÷ ' + d, k]; } });

  step({ id: 'p4multiples', year: 4, name: 'Common factors and common multiples', src: 'ray', ref: RAYP + ', Arts. 115–120', moe: 'P4 · Common factors, common multiples',
    objects: 'Squared paper for lists',
    how: ['A common divisor (factor) goes exactly into each number; the greatest one is the greatest common divisor. Find it from the prime factors the numbers share.',
      'A common multiple can be divided exactly by each number; the least one is the least common multiple. Ray builds it from the prime factors, taking each as many times as it comes in any one number.',
      'For two small numbers, simply list the multiples of each until they meet.'],
    book: { ref: RAYP + ', Arts. 116–120', items: [
      ['Greatest common divisor of 42 and 54?', 6], ['Greatest common divisor of 70 and 110?', 10], ['Greatest common divisor of 105 and 165?', 15], ['Greatest common divisor of 60, 90 and 150?', 30],
      ['Least common multiple of 6, 8 and 9?', 72], ['Least common multiple of 10, 12 and 15?', 60], ['Least common multiple of 6, 9 and 12?', 36], ['Least common multiple of 6, 15 and 35?', 210]] },
    sums: function () { var a = ri(2, 9), b = ri(2, 9); while (b === a) b = ri(2, 9); var l = a * b / gcdf(a, b); return [pure('Name the first two common multiples of ' + a + ' and ' + b + '.', l + ', ' + 2 * l)]; },
    facts: null });

  step({ id: 'p4mixed', year: 4, name: 'Mixed numbers and improper fractions', src: 'ray', ref: RAYP + ', Arts. 129, 139–140', moe: 'P4 · Mixed numbers, improper fractions',
    objects: 'Paper circles or strips cut into quarters and fifths',
    how: ['Ray: a fraction is one or more of the equal parts of a unit. It is proper when the top number is smaller than the bottom, improper when it is equal or larger.',
      'To change an improper fraction to a mixed number, divide the top number by the bottom one.',
      'To change a mixed number back, multiply the whole number by the bottom number and add the top number.',
      'Show it with the paper parts: 9 quarters make 2 whole circles and 1 quarter.'],
    book: { ref: RAYP + ', Arts. 139–140', items: [['9 fourths are how many?', '2 1/4'], ['17 fifths are how many?', '3 2/5'], ['Change 5 3/4 to fourths.', '23/4'], ['In 8 3/4 apples, how many fourths?', '35 fourths'], ['9 quarters of a dollar are how many dollars?', '2 1/4 dollars']] },
    sums: function () { var d = pick([3, 4, 5, 6, 8]), w = ri(1, 5), n = ri(1, d - 1); return [pure('Change ' + (w * d + n) + '/' + d + ' to a mixed number.', w + ' ' + n + '/' + d), pure('Change ' + w + ' ' + n + '/' + d + ' to an improper fraction.', (w * d + n) + '/' + d)]; },
    facts: null });

  step({ id: 'p4fset', year: 4, name: 'A fraction of a number', src: 'ray', ref: RAYP + ', Art. 152', moe: 'P4 · Fraction of a set',
    objects: '12 or 24 beans to share into equal groups',
    how: ['Ray: to take a fraction of a whole number, divide by the bottom number and multiply by the top. 3/4 of 8 is 8 ÷ 4 × 3 = 6.',
      'Show it first with beans: share 12 into 3 equal groups; two of the groups are 2/3 of 12.',
      'Ray writes these as "8 × 3/4". The answer is smaller than 8 because 3/4 is less than one.'],
    book: { ref: RAYP + ', Art. 152', items: [['8 × 3/4', 6], ['12 × 2/3', 8], ['10 × 2/5', 4], ['14 × 5/7', 10], ['16 × 7/8', 14], ['5 × 2/3', '3 1/3']] },
    sums: function () { var d = pick([3, 4, 5, 6, 8]), k = ri(2, 6), n = ri(1, d - 1); return [pure('What is ' + n + '/' + d + ' of ' + (d * k) + '?', n * k), pure('There are ' + (d * k) + ' children; ' + n + '/' + d + ' of them are girls. How many girls?', n * k)]; },
    facts: function () { var d = pick([2, 3, 4, 5]), k = ri(2, 9), n = ri(1, d - 1); return [n + '/' + d + ' of ' + (d * k), n * k]; } });

  step({ id: 'p4fadd', year: 4, name: 'Adding and subtracting unlike fractions', src: 'ray', ref: RAYP + ', Arts. 144–150', moe: 'P4 · Unlike fractions',
    adapt: 'Ray\'s own exercises for this are unreadable in the scan, so these sums are made by the app, following his method. MOE keeps to denominators of 12 or less.',
    objects: 'Paper strips folded into halves, quarters, eighths; thirds and sixths',
    how: ['Ray: multiplying the top and bottom of a fraction by the same number changes its form but not its value (1/2 = 2/4 = 3/6).',
      'To add or subtract fractions with different bottom numbers, first change them to the same bottom number (a common denominator), then add or subtract the top numbers.',
      'Lay the folded strips side by side to see that 1/2 and 1/4 make 3/4. Give the answer in its simplest form.'],
    sums: function () { var pairs = [[2, 4], [2, 6], [3, 6], [4, 8], [2, 8], [3, 9], [3, 12], [4, 12], [6, 12], [5, 10]]; var pr = pick(pairs), a = pr[0], b = pr[1]; var n1 = ri(1, a - 1), n2 = ri(1, b - 1);
      var top = n1 * (b / a) + n2; var out = [pure(n1 + '/' + a + ' + ' + n2 + '/' + b, simp(top, b))];
      var big = n1 * (b / a); if (big !== n2) { var hi = Math.max(big, n2), lo = Math.min(big, n2); out.push(pure((big > n2 ? n1 + '/' + a + ' − ' + n2 + '/' + b : n2 + '/' + b + ' − ' + n1 + '/' + a), simp(hi - lo, b))); }
      return out; },
    facts: null });

  step({ id: 'p4dec', year: 4, name: 'Decimals: tenths, hundredths, thousandths', src: 'ray', ref: RAYP + ', Arts. 166–177, 185–186', moe: 'P4 · Decimals to 3 places',
    objects: 'The place-value chart carried on past the point; a metre rule marked in centimetres and millimetres',
    how: ['Ray: decimal places go on to the right of the point as tenths, hundredths, thousandths; each is a tenth of the place on its left.',
      'Putting noughts after the last figure does not change the value (0.5 = 0.50); a nought just after the point does (0.05 is less).',
      'A decimal to a fraction: write the figures over 10, 100 or 1000 and reduce. A fraction to a decimal: divide the top by the bottom.',
      'MOE also asks for comparing decimals and rounding them to a whole number, 1 or 2 places.'],
    book: { ref: RAYP + ', Arts. 185–186', items: [['Change .25 to a common fraction.', '1/4'], ['Change .375 to a common fraction.', '3/8'], ['Change 4.02 to a mixed number.', '4 1/50'], ['Change 8.415 to a mixed number.', '8 83/200'], ['Change 1/8 to a decimal.', '.125'], ['Change 15/16 to a decimal.', '.9375']] },
    sums: function () { var x = ri(1, 9999) / 1000; var y = ri(1, 9999) / 1000; return [pure('Which is greater, ' + dstr(x) + ' or ' + dstr(y) + '?', x === y ? 'equal' : dstr(Math.max(x, y))), pure('Round ' + dstr(x) + ' to 1 decimal place.', (Math.round(x * 10) / 10).toFixed(1)), pure('What does the 3 stand for in 2.134?', '3 hundredths')]; },
    facts: null });

  step({ id: 'p4decops', year: 4, name: 'Working with decimals', src: 'ray', ref: RAYP + ', Arts. 178–184', moe: 'P4 · Decimal operations',
    objects: 'Money: dollars and cents, written with the point',
    how: ['Adding and subtracting: write tenths under tenths, hundredths under hundredths, so the points stand in a column; then add or subtract as with whole numbers.',
      'Multiplying by a whole number: multiply as usual, then point off as many decimal places as the decimal had.',
      'Dividing by a whole number: divide as usual and put the point in the answer straight above the point in the number.',
      'MOE at P4: add and subtract up to 2 places; multiply and divide up to 2 places by a 1-digit number.'],
    book: { ref: RAYP + ', Arts. 178–183', items: [['Add 4.8, 43.31, 74.019 and 11.204.', '133.333'], ['From 13.5 take 8.037.', '5.463'], ['From 5 take .125.', '4.875'], ['19 × .125', '2.375'], ['83.1 ÷ 4', '20.775']] },
    sums: function () { var a = ri(100, 9999) / 100, b = ri(100, 9999) / 100, k = ri(2, 9), m = ri(101, 999) / 100;
      return [pure(dstr(a) + ' + ' + dstr(b), dstr(a + b)), pure(dstr(Math.max(a, b)) + ' − ' + dstr(Math.min(a, b)), dstr(Math.abs(a - b))), pure(dstr(m) + ' × ' + k, dstr(m * k)), pure(dstr(m * k) + ' ÷ ' + k, dstr(m))]; },
    facts: null });

  step({ id: 'p4angles', year: 4, name: 'Angles in degrees', src: 'hs', ref: HS + ', Ch. V', moe: 'P4 · Measuring and drawing angles',
    objects: 'A protractor, ruler, sharp pencil, tracing paper',
    how: ['Hall & Stevens: an angle is made by two straight lines (arms) meeting at a point (the vertex). Its size is how much one arm is turned from the other, not how long the arms are.',
      'Compare two angles by tracing one and laying it on the other.',
      'Fold a sheet twice to make a right angle. A right angle is divided into 90 equal parts called degrees. Smaller angles are acute, larger ones obtuse; the angle the long way round is reflex.',
      'To measure, put the protractor\'s centre on the vertex and its straight edge along one arm, and read where the other arm crosses the edge. Name angles as ∠AOB, with the vertex in the middle.'],
    book: { ref: HS + ', Ch. V', items: [
      ['Draw two angles making them equal to one another as nearly as you can judge, but do not make the arms of the same length.', ''],
      ['Measure the angles PXQ and RXQ. Find by subtraction the number of degrees in the angle PXR.', ''],
      ['From A draw a line making an angle of 62° with AB. From B draw a line making an angle of 62° with BA, on the same side of AB.', ''],
      ['Draw a straight line AB of length 8 cm. From A draw two lines, one on each side of AB, each making an angle of 47° with it.', ''],
      ['Draw (i) an acute angle, (ii) an obtuse angle, (iii) a reflex angle. Estimate each, then check your estimates by measurement, noting your errors.', ''],
      ['Without using your protractor draw angles as nearly as you can judge to contain 45°, 30°, 78°, 125°, 64°, 115°, 225°. Then measure them.', ''],
      ['Draw a straight line OX. Make the angle XOP = 55°, and on the other side of OX make the angle XOQ = 120°.', '']] },
    sums: null, facts: null });

  step({ id: 'p4rect', year: 4, name: 'Rectangles and squares', src: 'hs', ref: HS + ', Ch. XI', moe: 'P4 · Rectangle and square',
    objects: 'Protractor, set square, ruler, paper to fold',
    how: ['Hall & Stevens: a quadrilateral has four straight sides; a parallelogram has its opposite sides parallel.',
      'A parallelogram with a right angle is a rectangle; a rectangle with two sides that meet at a right angle equal is a square.',
      'She draws them with protractor and set square, then measures to find out for herself that opposite sides are equal and every angle is a right angle.'],
    book: { ref: HS + ', Ch. XI', items: [
      ['Draw a parallelogram ABCD with a right angle at A, AB = 2.8 in. and AD = 1.7 in. Measure DC and BC and compare them with the given sides.', ''],
      ['Draw a parallelogram ABCD with a right angle at A and AB = AD = 6.5 cm. Are all the sides equal?', ''],
      ['Draw an oblique parallelogram (that is, having no right angle), a rectangle, a square, and a rhombus. Fold each along a diagonal: which are symmetrical about a diagonal?', '']] },
    sums: function () { return [pure('How many right angles has a square?', 4), pure('A rectangle has one side 7 cm. What is the opposite side?', '7 cm')]; }, facts: null });

  step({ id: 'p4sym', year: 4, name: 'Line symmetry', src: 'moe', moe: 'P4 · Line symmetry',
    adapt: 'Hall & Stevens test symmetry by folding (Ch. XI); MOE asks for more, so this step finishes it the same way.',
    objects: 'Paper to fold and cut, squared paper, a small mirror',
    how: ['Fold a sheet, cut a shape from the fold, and open it: the fold is a line of symmetry.',
      'Find shapes and letters around the flat that are symmetric, and test a line by folding or with a mirror.',
      'On squared paper, she completes half a figure so it is symmetric about a given line, counting squares out from the line.'],
    sums: null, facts: null });

  step({ id: 'p4area', year: 4, name: 'Area and perimeter', src: 'hs', ref: HS + ', Ch. XII', moe: 'P4 · Area and perimeter',
    adapt: 'Hall & Stevens use squared paper ruled in tenths of an inch. Perimeter ("the sum of the sides of a figure") and figures made of several rectangles are MOE add-ins on the same pattern.',
    objects: 'Squared paper (or centimetre-squared paper), ruler',
    how: ['Draw rectangles on squared paper and count the squares inside: that number is the area, the amount of space within the boundaries.',
      'A square centimetre is the area of a square with 1 cm sides. Let her find a rule for the number of squares without counting them all: length × breadth.',
      'The perimeter is the distance all the way round: the sum of the sides.',
      'For an L-shaped figure, cut it into rectangles, find each area, and add.'],
    book: { ref: HS + ', Ch. XII', items: [
      ['Draw on squared paper a rectangle whose length is 2.0 in. (20 tenths of an inch) and breadth 0.9 in. How many squares does it contain?', '180 squares'],
      ['Rectangle on squared paper: length 1.5 in., breadth 1.2 in. How many squares?', '180 squares'],
      ['A passage is 20 feet long by 10 feet wide. What is its area?', '200 sq. ft.'],
      ['A court-yard is 25 yards long by 15 yards wide. What is its area?', '375 sq. yds.'],
      ['Area of a rectangle: length 18 in., breadth 10 in.', '180 sq. in.'],
      ['Area of a rectangle: length 25 ft., breadth 16 ft.', '400 sq. ft.'],
      ['The area of a rectangle is 6 square inches, and its length is 3 inches. What is its breadth?', '2 in.'],
      ['Draw a rectangle 5 cm. long, and of sufficient breadth to give the figure an area of 20 sq. cm.', 'breadth 4 cm'],
      ['If 100 yards of railing are required to fence in a square paddock, what is its area?', '625 sq. yds.'],
      ['The length of a rectangular field is 50 yards; the total distance round it is 180 yards. What is the breadth? What is the area?', '40 yds; 2000 sq. yds.']] },
    sums: function () { var l = ri(4, 15), b = ri(2, l - 1); return [pure('A rectangle is ' + l + ' cm long and ' + b + ' cm wide. Area? Perimeter?', (l * b) + ' cm², ' + 2 * (l + b) + ' cm'), pure('A square has a perimeter of ' + 4 * b + ' cm. How long is each side?', b + ' cm')]; },
    facts: null });

  step({ id: 'p4nets', year: 4, name: 'Nets and models of solids', src: 'hs', ref: HS + ', Ch. XIV', moe: 'P4 · Nets',
    objects: 'Thin card, ruler, scissors, glue or tape; a cereal box to open out',
    how: ['Open out a cardboard box to see its net: the flat shape that folds up into the solid.',
      'Hall & Stevens: draw the net on card, cut it out, score the fold lines, fold it up and fix the edges.',
      'Then the other way round: given a net, which solid will it make? MOE also asks her to draw solids flat on paper, as they look.'],
    book: { ref: HS + ', Ch. XIV', items: [
      ['If the length, breadth, and height of a rectangular block are all equal, what shapes do the faces take?', 'squares (it is a cube)'],
      ['Make a model of a cube each of whose edges is 6.0 cm.', ''],
      ['Make a model of a rectangular block, whose length is 4 in., breadth 3 in., height 2 in.', ''],
      ['Draw the net of a triangular prism, whose ends are equilateral triangles on sides of 5 cm., and whose side-edges measure 7 cm.', ''],
      ['Make a model of a right pyramid standing on a square base. Each edge of the base is to measure 3 in., and each side-edge of the pyramid is to be 4 in.', '']] },
    sums: null, facts: null });

  step({ id: 'p4graphs', year: 4, name: 'Tables, line graphs and pie charts', src: 'moe', moe: 'P4 · Tables, line graphs, pie charts',
    objects: 'Squared paper; something she measures over time, such as a bean plant\'s height or the noon temperature',
    how: ['Let her measure something every day for two weeks and keep it in a table.',
      'Draw a line graph from the table on squared paper: days along the bottom, the measurement up the side. Ask what the line shows.',
      'Pie charts: cut a paper circle into halves and quarters and colour how she spends her day; read a pie chart by its parts.'],
    sums: null, facts: null });


  // ---------- Filling the rest: P1–P3 gaps, P3, P5 and P6 ----------
  // Book exercises come from Ray's Practical Arithmetic and Hall & Stevens (see above). Where a scan only allowed the
  // exercise to be summarised, its ref says "wording shortened". Every answer was checked by calculation.
  function inWordsBig(n) { var m = Math.floor(n / 1000000), r = n % 1000000; return (m ? words3(m) + ' million' + (r ? (r < 100 ? ' and ' : ' ') : '') : '') + (r ? inWords(r) : ''); }
  function fstr(n, d) { return simp(n, d); }
  // a top number for d that gives a fraction already in its simplest form
  function co(d) { var n; do { n = ri(1, d - 1); } while (gcdf(n, d) !== 1); return n; }

  step({ id: 'ordinal', year: 1, name: 'First to tenth', src: 'moe', moe: 'P1 · Ordinal numbers',
    objects: 'Ten small toys or pegs in a row',
    how: ['Line the toys up and name their places: first, second, third, up to tenth. Write them as 1st, 2nd, 3rd … 10th.',
      'Ask about real queues and races: who is third? what place is the red car?'],
    sums: function () { var k = ri(1, 9); var ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth']; return [pure('How do you write "' + ORD[k] + '" in short?', (k + 1) + (k === 0 ? 'st' : k === 1 ? 'nd' : k === 2 ? 'rd' : 'th')), pure('In a row of 10, which place comes just after the ' + ORD[k - 1 >= 0 ? k - 1 : 0] + '?', ORD[k - 1 >= 0 ? k : 1])]; },
    facts: null });

  step({ id: 'add3', year: 2, name: 'Adding and subtracting in columns', src: 'ray', ref: RAYP + ', Arts. 17–27', moe: 'P2 · Algorithms up to 3 digits',
    objects: 'Squared paper; $10 notes and $1 coins if she needs to see the changing',
    how: ['Ray: only things of the same kind can be added, so units go under units, tens under tens, hundreds under hundreds.',
      'When a column makes more than 9, write the units and carry the tens to the next column ("carrying the tens").',
      'In taking away, when a figure below is larger, take one from the next column and add ten to this one.',
      'Ray\'s proof for subtraction: add the answer to the number taken away; you should get the number you started from.'],
    book: { ref: RAYP + ', Arts. 20–26', items: [
      ['James had 63 cents, and his father gave him 35 cents: how many cents had he then?', '98 cents'],
      ['James bought a reader for 74 cents, an atlas for 37 cents, a slate for 25 cents: how much did all cost?', '136 cents'],
      ['734 − 531', 203], ['340 − 150', 190], ['508 − 325', 183],
      ['A tree 75 feet high was broken: the part that fell was 37 feet long: how high was the stump?', '38 ft.'],
      ['Add 184, 216, 135, 320, 413, 101.', 1369], ['Add 204, 302, 401, 311, 109, 43.', 1370]] },
    sums: function () { var a = ri(120, 899), b = ri(100, 999 - a); var c = ri(300, 999), d = ri(101, c - 1); return [pure(a + ' + ' + b, a + b), pure(c + ' − ' + d, c - d), pure(c + ' + 10', c + 10), pure(c + ' − 100', c - 100)]; },
    facts: function () { var a = ri(100, 899), k = pick([1, 10, 100]) * ri(1, 9); return [a + ' + ' + k, a + k]; } });

  step({ id: 'p2money', year: 2, name: 'Writing money with a point', src: 'ray', ref: RAYP + ', Arts. 66–71', moe: 'P2 · Money in decimal notation',
    adapt: 'Ray also uses mills (tenths of a cent); those are left out. Singapore money is used for the app\'s own sums.',
    objects: 'Real coins and notes; a price tag or receipt',
    how: ['Ray: dollars are written before the point and cents in the next two places. If there are fewer than ten cents, a nought keeps the tens-of-cents place: $2.03.',
      'Dollars to cents: put two noughts after the dollars (9 dollars = 900 cents). Cents to dollars: cut off two figures with the point (375 cents = $3.75).',
      'Compare prices on real tags: which costs more, $4.50 or $4.05?'],
    book: { ref: RAYP + ', Arts. 68–71', items: [['Write: two dollars, three cents.', '$2.03'], ['Reduce 9 dollars to cents.', '900 cts.'], ['Reduce 104 dollars to cents.', '10400 cts.'], ['Reduce 375 cts. to dollars.', '$3.75'], ['Reduce 9004 cts. to dollars.', '$90.04'], ['Reduce 3187 cents to dollars.', '$31.87']] },
    sums: function () { var c = ri(105, 995); var a = ri(100, 999) / 100, b = ri(100, 999) / 100; return [pure('Write ' + c + '¢ in dollars.', '$' + (c / 100).toFixed(2)), pure('Which is more, $' + a.toFixed(2) + ' or $' + b.toFixed(2) + '?', a === b ? 'equal' : '$' + Math.max(a, b).toFixed(2))]; },
    facts: function () { var d = ri(1, 9); return ['$' + d + ' = ?¢', d * 100]; } });

  step({ id: 'p2graph', year: 2, name: 'Picture graphs with a scale', src: 'moe', moe: 'P2 · Picture graphs with scales',
    objects: 'Squared paper; a week\'s count of something she cares about (birds, books read, rainy days)',
    how: ['Draw a picture graph where one picture stands for 2 (or 5) of something, and write the key.',
      'Ask: how many does half a picture stand for? Which had the most? How many more?'],
    sums: null, facts: null });

  step({ id: 'p3num', year: 3, name: 'Numbers to 10 000', src: 'ray', ref: RAYP + ', Arts. 8–16', moe: 'P3 · Numbers to 10 000',
    objects: 'Place-value chart: thousands, hundreds, tens, ones',
    how: ['Ray: each place is worth ten times the place on its right; ten hundreds make a thousand.',
      'Read a number by its places; write it with a nought in any empty place.',
      'Count on and back in hundreds and thousands; compare and order numbers by looking at the highest place first.'],
    book: { ref: RAYP + ', Art. 13', items: [['Read, then write in words: 901', inWords(901)], ['Read, then write in words: 1005', inWords(1005)], ['Read, then write in words: 1108', inWords(1108)], ['Read, then write in words: 3003', inWords(3003)], ['Read, then write in words: 4050', inWords(4050)]] },
    sums: function () { var n = ri(1000, 9999); return [pure('Write ' + inWords(n) + ' in figures.', n), pure('What is 1000 more than ' + n + '?', n + 1000 > 9999 ? null : n + 1000), pure('What is 100 less than ' + n + '?', n - 100)]; },
    facts: function () { var n = ri(1000, 8999); return pick([[n + ' + 1000', n + 1000], [n + ' + 100', n + 100]]); } });

  step({ id: 'add4', year: 3, name: 'Adding and subtracting to 10 000', src: 'ray', ref: RAYP + ', Arts. 17–27', moe: 'P3 · Algorithms up to 4 digits; mental sums',
    objects: 'Squared paper',
    how: ['The same as with three figures: units under units, carry the tens, and in subtracting take one from the next place when you must.',
      'Ray\'s proof for adding: split the numbers into groups, add each group, then add the totals.',
      'Mental sums with two 2-digit numbers: add the tens first, then the units.'],
    book: { ref: RAYP + ', Arts. 22–27', items: [
      ['8752 − 3421', 5331], ['4603 − 3612', 991], ['8765 − 7766', 999], ['7640 − 1234', 6406],
      ['Add 3745, 2831, 5983, 7665.', 20224],
      ['January has 31 days, February 28, March 31, April 30, and May 31: how many days are there in these five months?', 151],
      ['I owe one man $245, another $325, a third $187, a fourth $96: how much do I owe?', '$853'],
      ['General Washington was born A. D. 1732, and lived 67 years: in what year did he die?', 1799],
      ['America was discovered by Columbus in 1492: how many years had elapsed in 1837?', 345],
      ['I deposited in the bank $1840, and drew out $475: how many dollars had I left?', '$1365']] },
    sums: function () { var a = ri(1200, 8999), b = ri(150, 9999 - a), x = ri(23, 89), y = ri(14, 79); return [pure(a + ' + ' + b, a + b), pure((a + b) + ' − ' + b, a), pure('In your head: ' + x + ' + ' + y, x + y)]; },
    facts: function () { var x = ri(23, 89), y = ri(11, 79); return pick([[x + ' + ' + y, x + y], [Math.max(x, y) + ' − ' + Math.min(x, y), Math.abs(x - y)]]); } });

  step({ id: 'p3div', year: 3, name: 'Multiplying and dividing by one figure', src: 'ray', ref: RAYP + ', Arts. 31, 43–45', moe: 'P3 · Up to 3 digits by 1 digit; remainders',
    objects: 'Beans to share, for the first remainders',
    how: ['Multiplying by one figure: multiply the units, tens and hundreds in turn, carrying as in adding.',
      'Dividing: share from the left, carrying what is left over to the next figure. What cannot be shared at the end is the remainder; write it after the answer.',
      'Show a remainder first with beans: 14 beans in heaps of 3 make 4 heaps and 2 left over.'],
    book: { ref: RAYP + ', Arts. 28–45', items: [
      ['In an orchard there are 4 rows of trees, in each row 21 trees: how many trees in the orchard?', 84], ['What will 2 houses cost at $231 each?', '$462'],
      ['How many times is 3 contained in 129?', 43], ['How many times 3 in 462?', 154], ['How many times is 3 contained in 743?', '247, remainder 2'],
      ['How many times 4 in 848?', 212], ['Divide 653 cents by 3.', '217 cents, remainder 2']] },
    sums: function () { var a = ri(102, 999), b = ri(3, 9); var q = ri(21, 199), r = ri(1, b - 1); return [pure(a + ' × ' + b, a * b), pure((q * b + r) + ' ÷ ' + b, q + ' remainder ' + r)]; },
    facts: function () { var b = ri(2, 9), q = ri(2, 12), r = ri(0, b - 1); return [(b * q + r) + ' ÷ ' + b + ' remainder?', r]; } });

  step({ id: 'p3equiv', year: 3, name: 'Equivalent fractions', src: 'ray', ref: RAYP + ', Arts. 144–150', moe: 'P3 · Equivalent fractions; related fractions',
    adapt: 'Ray\'s exercises here are unreadable in the scan, so the sums are made by the app, following his method.',
    objects: 'Paper strips folded into halves, quarters, eighths; thirds, sixths and twelfths',
    how: ['Ray: multiplying (or dividing) the top and bottom of a fraction by the same number changes its form but not its value.',
      'Lay folded strips side by side to see that 1/2 = 2/4 = 4/8. Reduce a fraction to its simplest form by dividing top and bottom by a number that goes into both.',
      'Compare fractions by changing them to the same bottom number.',
      'Add or subtract two related fractions (one bottom number goes into the other) within one whole.'],
    sums: function () { var pairs = [[2, 4], [2, 6], [3, 6], [4, 8], [2, 8], [3, 9], [3, 12], [4, 12], [6, 12], [5, 10]]; var pr = pick(pairs), a = pr[0], b = pr[1], n = ri(1, a - 1), k = b / a;
      var n2 = ri(1, b - 1); var tot = n * k + n2; var out = [pure(n + '/' + a + ' = ?/' + b, n * k), pure('Write ' + (n * k) + '/' + b + ' in its simplest form.', fstr(n * k, b))];
      if (tot <= b) out.push(pure(n + '/' + a + ' + ' + n2 + '/' + b, fstr(tot, b)));
      return out; },
    facts: function () { var a = pick([2, 3, 4, 5]), k = ri(2, 4), n = ri(1, a - 1); return [n + '/' + a + ' = ?/' + (a * k), n * k]; } });

  step({ id: 'p3money', year: 3, name: 'Adding and subtracting money', src: 'ray', ref: RAYP + ', Arts. 72–76', moe: 'P3 · Money in decimals',
    objects: 'A receipt from the shops; play money',
    how: ['Ray: write dollars under dollars and cents under cents, so the points stand in a column, then add or subtract as with whole numbers and keep the point in the answer.',
      'Check a real receipt together: add the items and see if the total is right; work out the change.'],
    book: { ref: RAYP + ', Arts. 72–76', items: [
      ['Add $17.15, $23.43, $7.19, $8.37, $12.31.', '$68.45'], ['Subtract $17.75 from $46.28.', '$28.53'], ['Subtract $5.50 from $20.05.', '$14.55'], ['Subtract 3 cents from $3.', '$2.97'],
      ['Add $43.75, $29.18, $17.63, $268.95, $718.07.', '$1077.58'],
      ['I had $5 and spent $0.75, $0.35, $0.50 and $1.50. How much had I left? (wording shortened)', '$1.90'],
      ['A owes $35.25, B owes $23.75, and C owes $1 more than A and B together. How much do they owe in all? (wording shortened)', '$119']] },
    sums: function () { var a = ri(100, 4999) / 100, b = ri(100, 4999) / 100; return [pure('$' + a.toFixed(2) + ' + $' + b.toFixed(2), '$' + (a + b).toFixed(2)), pure('Change from $50 for $' + a.toFixed(2) + '?', '$' + (50 - a).toFixed(2))]; },
    facts: null });

  step({ id: 'p3units', year: 3, name: 'Kilometres, millilitres and mixed units', src: 'moe', moe: 'P3 · Compound units',
    adapt: 'Ray\'s tables of measures are the old English ones, so this step is taught the way Stephens taught measures: she measures, weighs and pours for herself, in metric.',
    objects: 'Tape measure, kitchen scales, a measuring jug marked in ml, a map',
    how: ['Pour 1 litre into the measuring jug and see it is 1000 ml. Weigh 1 kg of rice and some smaller amounts in grams.',
      'Measure the room in metres and centimetres (3 m 45 cm) and change it to centimetres (345 cm). Find how far 1 km is on a walk you know.',
      'Change mixed units to the smaller unit and back: 2 kg 300 g = 2300 g.'],
    sums: function () { var m = ri(1, 9), c = ri(1, 99), k = ri(1, 9), g = ri(1, 999); return [pure(m + ' m ' + c + ' cm = ? cm', m * 100 + c), pure(k + ' kg ' + g + ' g = ? g', k * 1000 + g), pure((k * 1000 + g) + ' ml = ? ℓ ? ml', k + ' ℓ ' + g + ' ml'), pure(m + ' km = ? m', m * 1000)]; },
    facts: function () { var m = ri(1, 9), c = ri(1, 99); return [m + ' m ' + c + ' cm = ? cm', m * 100 + c]; } });

  step({ id: 'p3time', year: 3, name: 'Seconds, durations and the 24-hour clock', src: 'ray', ref: RAYP + ', Art. 97', moe: 'P3 · Time',
    adapt: 'Ray changes between seconds, minutes, hours and days. The 24-hour clock and finding start and finish times are MOE add-ins.',
    objects: 'A clock with a second hand; a bus or train timetable; a stopwatch',
    how: ['Ray: to change to a smaller unit, multiply (1 hour = 60 minutes = 3600 seconds); to change to a larger unit, divide.',
      'Time things in seconds with the stopwatch: how long to say a poem? to run to the corner?',
      'Read times on the 24-hour clock from a timetable: 14:45 is 2.45 pm.',
      'Find a duration, a start time or a finish time when the other two are known, by counting on from the start.'],
    book: { ref: RAYP + ', Art. 97', items: [['Reduce 2 hours to seconds.', '7200 sec.'], ['Reduce 7 days to minutes.', '10080 min.'], ['Reduce 10800 seconds to hours.', '3 hr.'], ['Reduce 7322 seconds to hours.', '2 hr. 2 min. 2 sec.'], ['Reduce 4323 minutes to days.', '3 da. 3 min.'], ['Reduce 432000 seconds to days.', '5 da.']] },
    sums: function () { var h = ri(13, 23), m = ri(0, 11) * 5; var d = ri(25, 130); var sh = ri(8, 15), sm = ri(0, 11) * 5; var end = sh * 60 + sm + d;
      function hm(x) { return (x < 10 ? '0' : '') + x; }
      function twelve(mins) { var H = Math.floor(mins / 60), M = mins % 60; return (H > 12 ? H - 12 : H) + '.' + hm(M) + (H >= 12 ? ' pm' : ' am'); }
      return [pure('What time is ' + h + ':' + hm(m) + ' on the 24-hour clock, in am/pm?', (h - 12) + '.' + hm(m) + ' pm'), pure('A lesson starts at ' + twelve(sh * 60 + sm) + ' and lasts ' + d + ' minutes. When does it end?', twelve(end)), pure('3 min 20 s = ? s', 200)]; },
    facts: function () { var m = ri(1, 9), s = ri(1, 59); return [m + ' min ' + s + ' s = ? s', m * 60 + s]; } });

  step({ id: 'p3area', year: 3, name: 'Area and perimeter of rectangles', src: 'ray', ref: RAYP + ', Art. 311', moe: 'P3 · Area and perimeter',
    objects: 'Centimetre-squared paper; a tape measure; a square-metre newspaper square',
    how: ['Count the squares inside rectangles drawn on squared paper: that is the area, in square centimetres (cm²).',
      'Ray\'s rule: multiply the length by the breadth; feet times feet gives square feet, centimetres times centimetres gives square centimetres.',
      'The perimeter is the distance all the way round: add the sides. Walk round a table and measure it.',
      'Make a square metre from newspaper and see how many fit on the floor.'],
    book: { ref: RAYP + ', Art. 311', items: [['How many square feet in a floor 17 feet long and 15 feet wide?', '255 sq. ft.'], ['How many square feet in a board 15 in. wide and 16 ft. long? (wording shortened)', '20 sq. ft.']] },
    sums: function () { var l = ri(3, 12), b = ri(2, l); return [pure('A rectangle is ' + l + ' cm by ' + b + ' cm. Area?', (l * b) + ' cm²'), pure('Its perimeter?', 2 * (l + b) + ' cm'), pure('A square has sides of ' + b + ' m. Area?', (b * b) + ' m²')]; },
    facts: function () { var l = ri(2, 10), b = ri(2, 10); return ['area of ' + l + ' cm by ' + b + ' cm (cm²)', l * b]; } });

  step({ id: 'p3angle', year: 3, name: 'Angles and right angles', src: 'hs', ref: HS + ', Ch. V', moe: 'P3 · Angles; right angles',
    objects: 'Paper to fold; tracing paper',
    how: ['Hall & Stevens: an angle is made where two straight lines meet; its size is how far one line is turned from the other, not how long the lines are.',
      'Fold a sheet of paper twice to make a right angle. Use it to test corners round the flat: is this angle a right angle, smaller, or larger?',
      'Compare two angles by tracing one and laying it on the other.'],
    sums: function () { return [pure('How many right angles are there in a rectangle?', 4), pure('Is the angle between the hands at 3 o\'clock a right angle?', 'yes')]; }, facts: null });

  step({ id: 'p3perp', year: 3, name: 'Perpendicular and parallel lines', src: 'hs', ref: HS + ', Ch. VII–VIII', moe: 'P3 · Perpendicular and parallel lines',
    objects: 'Ruler, set square, squared paper',
    how: ['Perpendicular lines meet at a right angle. Parallel lines run in the same direction and never meet, however far they go.',
      'Hall & Stevens: draw parallels by sliding a set square along a ruler; draw a perpendicular with the set square\'s right angle.',
      'Find both kinds in the flat: window bars, floor tiles, a door frame.'],
    book: { ref: HS + ', Ch. VII–VIII (wording shortened)', items: [
      ['Draw a line, then draw lines parallel to it through two given points with the set square and ruler.', ''],
      ['Draw several perpendiculars to a line at equal spaces. Why are they parallel to one another?', ''],
      ['Draw a 7 cm line, a 7 cm perpendicular at one end, and complete the figure with parallels. What figure is it?', 'a square']] },
    sums: null, facts: null });

  step({ id: 'p3bar', year: 3, name: 'Bar graphs', src: 'moe', moe: 'P3 · Bar graphs',
    objects: 'Squared paper; a count she has made herself',
    how: ['Turn one of her own counts into a bar graph on squared paper, choosing a scale (each square = 2, or 5).',
      'Read bar graphs in a newspaper or book: what does each mark on the side stand for?'],
    sums: null, facts: null });

  // ---------- P5 (age 10) ----------
  step({ id: 'p5num', year: 5, name: 'Numbers to 10 million', src: 'ray', ref: RAYP + ', Art. 13', moe: 'P5 · Numbers to 10 million',
    objects: 'Place-value chart with a millions period',
    how: ['Ray: point the number off into periods of three from the right (units, thousands, millions), read each period as a number, and say its name.',
      'Look for big numbers in real life: Singapore\'s population, the distance to the moon in km.'],
    book: { ref: RAYP + ', Art. 13', items: [['Read, then write in words: 4050607', inWordsBig(4050607)], ['Read, then write in words: 7406035', inWordsBig(7406035)], ['Read, then write in words: 1030725', inWordsBig(1030725)], ['Read, then write in words: 9001003', inWordsBig(9001003)], ['Read, then write in words: 2102102', inWordsBig(2102102)]] },
    sums: function () { var n = ri(1000000, 9999999); return [pure('Write ' + inWordsBig(n) + ' in figures.', n)]; },
    facts: null });

  step({ id: 'p5order', year: 5, name: 'Order of operations and brackets', src: 'moe', moe: 'P5 · Order of operations',
    objects: 'Paper and pencil',
    how: ['Work out brackets first, then × and ÷ from left to right, then + and − from left to right.',
      'Show why it matters: 2 + 3 × 4 is 14, but (2 + 3) × 4 is 20. Let her write a number story for each.'],
    sums: function () { var a = ri(2, 9), b = ri(2, 9), c = ri(2, 9); return [pure(a + ' + ' + b + ' × ' + c, a + b * c), pure('(' + a + ' + ' + b + ') × ' + c, (a + b) * c), pure((a * b * c) + ' ÷ ' + b + ' − ' + c, a * c - c)]; },
    facts: function () { var a = ri(2, 9), b = ri(2, 9), c = ri(2, 9); return [a + ' + ' + b + ' × ' + c, a + b * c]; } });

  step({ id: 'p5tens', year: 5, name: 'Multiplying and dividing by 10, 100, 1000', src: 'ray', ref: RAYP + ', Arts. 182, 184', moe: 'P5 · × and ÷ by 10, 100, 1000; unit conversions',
    objects: 'Place-value chart; a metre rule',
    how: ['Ray: to multiply by 10, 100 or 1000, move the point one place right for each nought; to divide, move it left, putting noughts in front where needed.',
      'For multiples, split them: × 300 is × 3, then × 100.',
      'Use it to change units: 2.5 km = 2500 m, 450 cm = 4.5 m, 1250 g = 1.25 kg.'],
    book: { ref: RAYP + ', Arts. 182–184', items: [['2.07 × 10', '20.7'], ['18.3 ÷ 10', '1.83'], ['18.3 ÷ 100', '.183'], ['18.3 ÷ 1000', '.0183']] },
    sums: function () { var x = ri(101, 9999) / 100, p = pick([10, 100, 1000]), k = ri(2, 9); return [pure(dstr(x) + ' × ' + p, dstr(x * p)), pure(dstr(x) + ' ÷ ' + p, dstr(x / p)), pure(dstr(x) + ' km = ? m', dstr(x * 1000))]; },
    facts: function () { var n = ri(2, 99), p = pick([10, 100, 1000]); return [n + ' × ' + p, n * p]; } });

  step({ id: 'p5fdiv', year: 5, name: 'Fractions and division', src: 'ray', ref: RAYP + ', Arts. 158a, 185', moe: 'P5 · Division as a fraction; fractions as decimals',
    objects: '3 paper circles to share between 4',
    how: ['Share 3 circles between 4 people: each gets 3/4. So 3 ÷ 4 = 3/4: a fraction is a division not yet done (Ray calls a complex fraction an "unexecuted division").',
      'Ray: to change a fraction to a decimal, put noughts after the top number and divide by the bottom number.'],
    book: { ref: RAYP + ', Art. 185', items: [['Change 1/8 to a decimal.', '.125'], ['Change 5/6 to a decimal.', '.8333+'], ['Change 15/16 to a decimal.', '.9375']] },
    sums: function () { var a = ri(1, 9), b = pick([2, 4, 5, 8, 10]); return [pure(a + ' ÷ ' + b + ' as a fraction', fstr(a, b)), pure('Change ' + a + '/' + b + ' to a decimal.', dstr(a / b))]; },
    facts: null });

  step({ id: 'p5fmix', year: 5, name: 'Adding and subtracting mixed numbers', src: 'ray', ref: RAYP + ', Arts. 147–150', moe: 'P5 · Mixed numbers',
    adapt: 'Ray\'s exercises here are unreadable in the scan, so the sums are made by the app, following his method.',
    objects: 'Paper strips',
    how: ['Ray: add the whole numbers and the fractions separately (changing the fractions to a common denominator first), then put them together.',
      'In subtracting, if the fraction on top is smaller, change one of the wholes into fractions first ("borrow 1").'],
    sums: function () { var d = pick([4, 6, 8, 10, 12]), a = pick([2, d / 2]), w1 = ri(2, 6), w2 = ri(1, w1 - 1), n1 = co(a), n2 = co(d);
      var A = w1 * d + n1 * (d / a), B = w2 * d + n2; return [pure(w1 + ' ' + n1 + '/' + a + ' + ' + w2 + ' ' + n2 + '/' + d, fstr(A + B, d)), pure(w1 + ' ' + n1 + '/' + a + ' − ' + w2 + ' ' + n2 + '/' + d, A > B ? fstr(A - B, d) : null)]; },
    facts: null });

  step({ id: 'p5fmul', year: 5, name: 'Multiplying fractions', src: 'ray', ref: RAYP + ', Arts. 151–153', moe: 'P5 · Multiplying fractions',
    objects: 'Squared paper to draw a fraction of a fraction',
    how: ['Ray: a fraction times a whole number repeats it (multiply the top number); a whole number times a fraction takes only part of it (divide by the bottom, multiply by the top).',
      'A fraction times a fraction: multiply the tops together and the bottoms together. Change mixed numbers to improper fractions first, and cancel common factors.',
      'Draw it: 2/3 of 3/4 of a rectangle on squared paper.'],
    book: { ref: RAYP + ', Arts. 152–153', items: [['20 × 3/4', 15], ['At 12 cents a yard, what will 1/3 of a yard cost? (wording shortened)', '4 cents'], ['At 12 cents a yard, what will 2/3 of a yard cost? (wording shortened)', '8 cents'], ['16 1/2 × 16 1/2', '272 1/4']] },
    sums: function () { var b = ri(2, 6), a = co(b), d = ri(2, 8), c = co(d), w = ri(2, 9); return [pure(a + '/' + b + ' × ' + c + '/' + d, fstr(a * c, b * d)), pure(a + '/' + b + ' × ' + w, fstr(a * w, b))]; },
    facts: null });

  step({ id: 'p5pct', year: 5, name: 'Percentage', src: 'ray', ref: RAYP + ', Arts. 209–211', moe: 'P5 · Percentage',
    objects: 'A hundred-square on squared paper; shop discount signs',
    how: ['Ray: a per cent of a number is so many hundredths of it; 7 per cent is .07.',
      'To find a per cent of a number, multiply by the rate as a decimal.',
      'To find what per cent one number is of another, divide the part by the whole and multiply by 100.',
      'Shade parts of a hundred-square to see 25%, 50%, 10%.'],
    book: { ref: RAYP + ', Arts. 210–211', items: [
      ['Find 7% of $175.', '$12.25'], ['Find 6% of $250.', '$15.00'], ['Find 5% of $118.', '$5.90'], ['Find 1% of $278.', '$2.78'], ['Find 8% of $11.', '$0.88'],
      ['What % of $8 is $2?', '25%'], ['What % of $15 is $3?', '20%'], ['What % of $50 is $6?', '12%'], ['What % of $75 is $4.50?', '6%'], ['What % of $9 is $3?', '33 1/3%']] },
    sums: function () { var p = pick([10, 20, 25, 50, 5, 15]), w = ri(2, 20) * 20; return [pure(p + '% of ' + w, w * p / 100), pure('What % of ' + w + ' is ' + (w / 4) + '?', '25%')]; },
    facts: function () { var p = pick([10, 25, 50]), w = ri(1, 20) * 20; return [p + '% of ' + w, w * p / 100]; } });

  step({ id: 'p5interest', year: 5, name: 'Discount, GST and interest', src: 'ray', ref: RAYP + ', Arts. 222, 250', moe: 'P5 · Discount, GST, annual interest',
    adapt: 'Ray\'s interest and taxes are kept; shop discounts and GST are MOE add-ins on the same pattern.',
    objects: 'Real receipts showing GST; a shop\'s sale signs; a bank leaflet with an interest rate',
    how: ['Ray: interest is the principal × the rate (as a decimal) × the number of years.',
      'A discount is a per cent taken off the price; GST is a per cent added on. Look at a real receipt to find the GST.',
      'Always ask: a per cent of what? The discount is of the usual price; the GST is of the price before tax.'],
    book: { ref: RAYP + ', Arts. 222, 250 (wording shortened)', items: [['Interest on $150 for 1 year at 5%?', '$7.50'], ['Interest on $300 for 2 years at 6%?', '$36.00'], ['Interest on $187.50 for 4 years at 5%?', '$37.50'], ['At 14 mills on the dollar (1.4%), what tax is paid on $300 of property?', '$4.20']] },
    sums: function () { var pr = ri(2, 20) * 10, d = pick([10, 20, 25]), base = ri(2, 30) * 100; return [pure('A $' + pr + ' bag has ' + d + '% off. What do you pay?', '$' + dstr(pr * (100 - d) / 100)), pure('A meal costs $' + (base / 10) + ' before GST of 9%. How much is the GST?', '$' + (base / 10 * 0.09).toFixed(2)), pure('$' + base + ' at 2% a year: interest after 1 year?', '$' + dstr(base * 0.02))]; },
    facts: null });

  step({ id: 'p5rate', year: 5, name: 'Rate', src: 'ray', ref: RAYP + ', Arts. 201–203', moe: 'P5 · Rate',
    objects: 'Price tags showing price per kg or per litre',
    how: ['A rate is how much of one thing for each one of another: $3 per kg, 60 km per hour.',
      'Ray works these by proportion; the simplest way is first to find the amount for one, then for the number wanted.',
      'Compare two packets in the shop by their price per 100 g.'],
    book: { ref: RAYP + ', Art. 203 (wording shortened)', items: [['If 2 lb. of tea cost $4, what will 6 lb. cost?', '$12'], ['If 4 hats cost $14, what will 10 hats cost?', '$35'], ['If 3 caps cost 69 cents, what will 11 caps cost?', '$2.53'], ['If 12 yards of cloth cost $48, what will 8 yards cost?', '$32']] },
    sums: function () { var r = ri(2, 9), n = ri(3, 12), m = ri(2, 15); return [pure(n + ' kg cost $' + r * n + '. What do ' + m + ' kg cost?', '$' + r * m), pure('A car goes ' + r * 10 + ' km in 1 hour. How far in ' + n + ' hours?', r * 10 * n + ' km')]; },
    facts: null });

  step({ id: 'p5tri', year: 5, name: 'Area of triangles', src: 'hs', ref: HS + ', Ch. XII; ' + RAYP + ', Art. 313', moe: 'P5 · Area of triangle; composite figures',
    objects: 'Squared paper, scissors, ruler, set square',
    how: ['Hall & Stevens: cut a triangle off one end of a parallelogram and fit it on the other end: it becomes a rectangle, so the parallelogram\'s area is base × height.',
      'A triangle is half the parallelogram on the same base with the same height, so its area is half of base × height. The height is measured square to the base.',
      'For a figure made of rectangles and triangles, find each part and add.'],
    book: { ref: HS + ', Ch. XII; ' + RAYP + ', Art. 313 (wording shortened)', items: [
      ['Draw a right-angled triangle ABC with the right angle at B, BC = 3.0 in. and BA = 2.0 in. Complete the rectangle. Find both areas.', '6 sq. in. and 3 sq. in.'],
      ['On a base of 8.0 cm draw a triangle of height 5.0 cm. Find its area.', '20 sq. cm'],
      ['A triangular field has one side 120 yards, and the opposite corner is 80 yards from that side. Find its area.', '4800 sq. yds.'],
      ['A triangular plot has its largest side 96 m and the perpendicular on it 27 m; a square plot has a side of 36 m. Which is larger?', 'they are equal (1296 sq. m)'],
      ['A triangle has a base of 15 ft. and a perpendicular height of 12 ft. Find its area.', '90 sq. ft.']] },
    sums: function () { var b = ri(3, 16) * 2, h = ri(2, 12); return [pure('Triangle: base ' + b + ' cm, height ' + h + ' cm. Area?', (b * h / 2) + ' cm²')]; },
    facts: function () { var b = ri(2, 10) * 2, h = ri(2, 10); return ['triangle, base ' + b + ', height ' + h + ': area', b * h / 2]; } });

  step({ id: 'p5vol', year: 5, name: 'Volume of cubes and cuboids', src: 'ray', ref: RAYP + ', Art. 320', moe: 'P5 · Volume; ℓ and cm³',
    adapt: 'Building with unit cubes, drawing on isometric grid and the litre–cm³ link are MOE add-ins.',
    objects: 'Centimetre cubes (or sugar cubes), isometric grid paper, a rectangular container and a measuring jug',
    how: ['Build cuboids from unit cubes and count them: the volume in cubic centimetres (cm³).',
      'Ray\'s rule: multiply the length, breadth and depth together.',
      'Fill a 10 cm × 10 cm × 10 cm box with water: it holds 1 litre, so 1 ℓ = 1000 cm³ and 1 ml = 1 cm³.',
      'Draw the cuboids on isometric grid paper.'],
    book: { ref: RAYP + ', Art. 320 (wording shortened)', items: [['A solid 12 ft. long, 3 ft. 3 in. broad, 4 ft. 4 in. deep: how many cubic feet?', '169 cu. ft.'], ['A stone 6 ft. long, 2 ft. 6 in. broad, 1 ft. 9 in. deep: how many cubic feet?', '26 1/4 cu. ft.']] },
    sums: function () { var l = ri(3, 12), b = ri(2, 10), h = ri(2, 10); return [pure('A cuboid is ' + l + ' cm by ' + b + ' cm by ' + h + ' cm. Volume?', l * b * h + ' cm³'), pure('A tank ' + l * 10 + ' cm by ' + b * 10 + ' cm is filled to ' + h + ' cm. How many litres of water?', dstr(l * b * h * 100 / 1000) + ' ℓ')]; },
    facts: function () { var l = ri(2, 6), b = ri(2, 6), h = ri(2, 6); return [l + ' × ' + b + ' × ' + h + ' (cm³)', l * b * h]; } });

  step({ id: 'p5angles', year: 5, name: 'Angles on a line and at a point', src: 'hs', ref: HS + ', Ch. V', moe: 'P5 · Angles on a line, at a point, vertically opposite',
    objects: 'Protractor, ruler',
    how: ['Hall & Stevens: draw a line AB and a line OC from a point O on it. Measure ∠AOC and ∠BOC and add them: they make two right angles, 180°.',
      'Draw lines from one point all the way round and add the angles: 360°.',
      'Draw two lines crossing; measure one angle and reckon the others. The angles opposite each other are equal.'],
    book: { ref: HS + ', Ch. V (wording shortened)', items: [
      ['Draw a straight line AB, and from a point O in it draw OC. Measure ∠AOC and the angle next to it, ∠BOC. What do they add up to? Try three positions of OC.', '180°'],
      ['Two angles side by side on a straight line: one is 65°. What is the other?', '115°'],
      ['Draw two straight lines AB, CD crossing at O. Measure ∠AOC, then reckon ∠BOC, ∠AOD and ∠DOB without measuring. Check by measuring.', '']] },
    sums: function () { var a = ri(20, 160), x = ri(60, 140), y = ri(50, Math.min(170, 300 - x - 20)); return [pure('On a straight line, one angle is ' + a + '°. The other?', (180 - a) + '°'), pure('At a point: ' + x + '° and ' + y + '°. The third angle?', (360 - x - y) + '°'), pure('Two lines cross; one angle is ' + a + '°. The angle opposite it?', a + '°')]; },
    facts: function () { var a = ri(20, 160); return ['180° − ' + a + '°', 180 - a]; } });

  step({ id: 'p5triangles', year: 5, name: 'Triangles and their angles', src: 'hs', ref: HS + ', Ch. IX–X', moe: 'P5 · Triangle properties; angle sum',
    objects: 'Paper triangles to tear; protractor; ruler',
    how: ['Hall & Stevens: measure the angles of several triangles and add them. Then tear the three corners off a paper triangle and fit them together at a point: they make a straight line. So the three angles make 180°.',
      'By sides: equilateral (all equal), isosceles (two equal), scalene (none equal). By angles: right-angled, obtuse-angled, acute-angled.',
      'Find by experiment that the base angles of an isosceles triangle are equal and the angles of an equilateral triangle are all equal (60°).'],
    book: { ref: HS + ', Ch. IX–X', items: [
      ['In a triangle ABC, A = 70°, C = 50°; what is B?', '60°'], ['In a triangle ABC, B = 28°, C = 112°; what is A?', '40°'],
      ['A triangle ABC is right-angled at A; if B = 55°, what is C?', '35°'], ['Each of the angles at the base of a triangle is 65°; what is the vertical angle?', '50°'],
      ['In a right-angled triangle, if one acute angle is 60°, what is the other?', '30°'],
      ['The triangle ABC is isosceles, and the vertical angle A is 50°. What are the angles at B and C?', '65° each'],
      ['The isosceles triangle ABC is right-angled at the vertex A. What are the angles B and C?', '45° each'],
      ['The triangle ABC is isosceles, A being the vertex. If B = 41°, what are the other angles?', 'C = 41°, A = 98°'],
      ['In a triangle ABC, if A + B = C, what is the angle C?', '90°']] },
    sums: function () { var p = ri(30, 90), q = ri(20, 150 - p); return [pure('A triangle has angles of ' + p + '° and ' + q + '°. The third?', (180 - p - q) + '°')]; },
    facts: function () { var p = ri(30, 90), q = ri(20, 150 - p); return ['180° − ' + p + '° − ' + q + '°', 180 - p - q]; } });

  step({ id: 'p5quad', year: 5, name: 'Parallelogram, rhombus and trapezium', src: 'hs', ref: HS + ', Ch. XI', moe: 'P5 · Parallelogram, rhombus, trapezium',
    adapt: 'The trapezium (one pair of parallel sides) is an MOE add-in.',
    objects: 'Protractor, set squares, ruler',
    how: ['Hall & Stevens: a parallelogram has its opposite sides parallel; a rhombus is a parallelogram with two sides that meet equal and no right angle.',
      'She draws them and measures to find that opposite angles are equal, and angles next to each other add up to 180°.',
      'A trapezium has just one pair of parallel sides; the two angles between each parallel pair add up to 180°.'],
    book: { ref: HS + ', Ch. XI', items: [
      ['Draw a parallelogram ABCD in which ∠A = 122°, and AB = AD = 7 cm. Write down the number of degrees in each of the angles ABC, BCD, ADC.', '58°, 122°, 58°'],
      ['Draw a parallelogram ABCD with ∠A = 114°, AB = 7.5 cm, AD = 5.5 cm. Write down the angles ABC, ADC, BCD.', '66°, 66°, 114°'],
      ['Draw a rhombus having each side 6.5 cm in length, and one angle equal to 82°. Enter into your figure (without measurement) the values of the other angles.', '98°, 82°, 98°']] },
    sums: function () { var g = ri(50, 130); return [pure('A parallelogram has one angle of ' + g + '°. The angle next to it?', (180 - g) + '°'), pure('And the angle opposite it?', g + '°')]; },
    facts: null });

  // ---------- P6 (age 11) ----------
  step({ id: 'p6fdiv', year: 6, name: 'Dividing fractions', src: 'ray', ref: RAYP + ', Arts. 154–157', moe: 'P6 · Dividing fractions',
    objects: 'Paper strips: how many 2/3s in 4?',
    how: ['Ray: a fraction divided by a whole number: divide the top number (or multiply the bottom) to find one of the equal parts.',
      'A whole number divided by a fraction asks how many times the fraction is contained in it: multiply by the bottom number and divide by the top.',
      'A fraction divided by a fraction: turn the divisor upside down and multiply, cancelling common factors first.'],
    book: { ref: RAYP + ', Arts. 155–156 (wording shortened)', items: [['3/4 ÷ 2/3', '1 1/8'], ['At 2/3 of a cent each, how many lemons can be bought for 4 cents?', '6 lemons'], ['At 2/10 of a dollar a yard, how many yards for 9/10 of a dollar?', '4 1/2 yards'], ['There are 5 1/2 yards in a rod: how many rods in 22 yards?', '4 rods']] },
    sums: function () { var b = ri(2, 9), a = co(b), w = ri(2, 6), d = ri(2, 6), c = co(d); return [pure(a + '/' + b + ' ÷ ' + w, fstr(a, b * w)), pure(w + ' ÷ ' + c + '/' + d, fstr(w * d, c)), pure(a + '/' + b + ' ÷ ' + c + '/' + d, fstr(a * d, b * c))]; },
    facts: null });

  step({ id: 'p6pct', year: 6, name: 'Percentage increase, decrease and the whole', src: 'ray', ref: RAYP + ', Arts. 243–247', moe: 'P6 · Finding the whole; % increase and decrease',
    objects: 'Price tags before and after a sale',
    how: ['Ray: the gain or loss per cent is always reckoned on the cost (the starting amount).',
      'Increase or decrease per cent = the change ÷ the starting amount × 100.',
      'To find the whole when a per cent of it is known, find 1% first, then 100%.'],
    book: { ref: RAYP + ', Arts. 243–247', items: [
      ['Bought for $150 and sold at a gain of 10%: what is the gain?', '$15'], ['Bought for $80 and sold at a loss of 8%: what is the loss?', '$6.40'],
      ['Cloth that cost 90 cents a yard is sold at a gain of 25%: what is the selling price?', '$1.12 1/2'], ['Cloth that cost 90 cents a yard is sold at a loss of 10%: the selling price?', '$0.81'],
      ['Bought for $4, sold for $5: the gain per cent?', '25%'], ['Bought for $75, sold for $105: the gain per cent?', '40%'], ['Bought for $30, sold for $40: the gain per cent?', '33 1/3%'],
      ['Sold for $75 at a gain of 25%: what was the cost?', '$60'], ['Sold for $75 at a loss of 25%: what was the cost?', '$100']] },
    sums: function () { var w = ri(2, 30) * 20, p = pick([10, 20, 25, 40]); return [pure(p + '% of a number is ' + w * p / 100 + '. What is the number?', w), pure('A price goes from $' + w + ' to $' + (w + w * p / 100) + '. Increase per cent?', p + '%')]; },
    facts: null });

  step({ id: 'p6ratio', year: 6, name: 'Ratio', src: 'ray', ref: RAYP + ', Arts. 191–203', moe: 'P6 · Ratio',
    adapt: 'Ray wrote a ratio as a single quotient; MOE writes it as a : b (and a : b : c). The proportion problems are Ray\'s; the a : b notation, simplest form and sharing in a ratio follow MOE.',
    objects: 'Beads or beans in two colours',
    how: ['Make a pattern of 2 red beads to 3 blue: the ratio of red to blue is 2 : 3. Double it (4 : 6) and see the pattern is the same: these are equivalent ratios.',
      'Write a ratio in its simplest form by dividing both terms by a common factor.',
      'Ray: in a proportion the two ratios are equal, so a missing term can be found from the other three.',
      'To share in a ratio, count the parts: share 20 beans in the ratio 2 : 3 (5 parts, 4 beans each).'],
    book: { ref: RAYP + ', Arts. 202–203 (wording shortened)', items: [['7 is to 14 as 9 is to what number?', 18], ['5 is to 7 as 10 is to what number?', 14], ['If 12 yards of cloth cost $48, what will 8 yards cost?', '$32']] },
    sums: function () { var b = ri(2, 9), a = co(b), k = ri(2, 6), n = (a + b) * ri(2, 8); var g = gcdf(a * k, b * k); return [pure('Write ' + a * k + ' : ' + b * k + ' in its simplest form.', (a * k / g) + ' : ' + (b * k / g)), pure('Share ' + n + ' in the ratio ' + a + ' : ' + b + '.', (n / (a + b) * a) + ' and ' + (n / (a + b) * b)), pure(a + ' : ' + b + ' = ' + a * k + ' : ?', b * k)]; },
    facts: null });

  step({ id: 'p6alg', year: 6, name: 'Algebra: letters for numbers', src: 'hk', ref: "Hall & Knight, Elementary Algebra for Schools (1897 ed.), Ch. I, II, VIII–X", moe: 'P6 · Algebra',
    adapt: 'Hall & Knight\'s own simple equations are unreadable in the scan, so the app makes those sums; the substitution, like-terms, wording and problem exercises are the book\'s. Pence and shillings are kept as they wrote them.',
    objects: 'A bag of beans standing for "n" beans',
    how: ['Hall & Knight: in algebra, letters stand for numbers. Products are written without the × sign (ab means a × b), and the number in front of a letter is its coefficient (3a means 3 × a). Don\'t confuse 3a with a³.',
      'Substitution: give each letter a number and work the expression out. A term with a nought in it is nought.',
      'Like terms can be added: 5a + 7a = 12a. Put an unknown number of beans in a bag and call it n: two bags and 3 loose beans is 2n + 3.',
      'An equation says two things are equal and is true only for a particular value. Hall & Knight: any term may be moved to the other side of the equation by changing its sign. Then check the answer by putting it back into both sides.'],
    book: { ref: 'Hall & Knight, Elementary Algebra for Schools, Examples I, II, VIII, IX, X', items: [
      ['If a = 2, b = 3, c = 1, d = 0, find the value of 6a + 5b − 8c + 9d.', 19], ['… and of 5a + 3c − 2b + 6d.', 7], ['… and of ab + bc + ca − da.', 11],
      ['… and of abc + bcd + cda + dab.', 6], ['… and of 2bc + 3cd − 4da + 5ab.', 36], ['… and of a² + b² + c² + d².', 14],
      ['Find the sum of 5a, 7a, 11a, a, 28a.', '52a'],
      ['What must be added to a to make y?', 'y − a'], ['What number is less than 20 by c?', '20 − c'], ['By how much does x exceed 20?', 'x − 20'], ['If a be one factor of b, what is the other?', 'b ÷ a'],
      ['Solve 7x = 14.', 'x = 2'],
      ['One number exceeds another by 5, and their sum is 29; find them.', '12 and 17'],
      ['Find two numbers whose sum is 28, and whose difference is 4.', '16 and 12'],
      ['Find three consecutive numbers whose sum shall equal 84.', '27, 28, 29'],
      ['Find two numbers differing by 10 whose sum is equal to twice their difference.', '15 and 5'],
      ['A is twice as old as B; ten years ago he was four times as old: what are their present ages?', 'A 30, B 15']] },
    sums: function () { var a = ri(2, 9), b = ri(1, 20), n = ri(2, 12); return [pure('Find ' + a + 'n + ' + b + ' when n = ' + n + '.', a * n + b), pure('Solve ' + a + 'n + ' + b + ' = ' + (a * n + b) + '.', 'n = ' + n), pure('Simplify n + ' + a + 'n + ' + b + ' − 1', (a + 1) + 'n + ' + (b - 1))]; },
    facts: function () { var a = ri(2, 9), b = ri(1, 20), n = ri(2, 12); return [a + 'n + ' + b + ' = ' + (a * n + b) + ', n = ?', n]; } });

  step({ id: 'p6circle', year: 6, name: 'Circles', src: 'hs', ref: HS + ', Ch. IV; ' + RAYP + ', Arts. 315–317', moe: 'P6 · Area and circumference of a circle',
    adapt: 'Ray uses 3.1416 for π; MOE uses 3.14 or 22/7. Use the value the question gives.',
    objects: 'Compasses, string, round tins and plates, a tape measure',
    how: ['Hall & Stevens: draw circles with compasses. Every line from the centre to the edge (a radius) is the same length; a diameter is two radii and divides the circle into two equal halves.',
      'Measure round several tins with string and divide by the diameter: always a little over 3. That number is π.',
      'Ray: circumference = diameter × π; area = radius × radius × π.',
      'Semicircles and quarter circles are halves and quarters of these; add the straight edges for a perimeter.'],
    book: { ref: RAYP + ', Arts. 315, 317 (wording shortened)', items: [['A wheel is 4 ft. across. What is its circumference? (π = 3.1416)', '12.5664 ft. (12 ft. 6.7968 in.)'], ['The diameter of a circle is 42 ft. What is its area? (π = 3.1416)', '1385.4456 sq. ft.']] },
    sums: function () { var r = ri(1, 10) * 7; return [pure('A circle has radius ' + r + ' cm. Circumference? (π = 22/7)', (2 * r * 22 / 7) + ' cm'), pure('Its area? (π = 22/7)', (r * r * 22 / 7) + ' cm²'), pure('Perimeter of a semicircle with diameter ' + 2 * r + ' cm? (π = 22/7)', (r * 22 / 7 + 2 * r) + ' cm')]; },
    facts: null });

  step({ id: 'p6vol', year: 6, name: 'Volume: finding a missing measurement', src: 'ray', ref: RAYP + ', Art. 320', moe: 'P6 · Volume, missing dimension',
    objects: 'Unit cubes; a box with its volume written on it',
    how: ['Ray\'s rule: volume = length × breadth × depth. So any one measurement is the volume divided by the other two.',
      'The height of a cuboid = volume ÷ area of its base. A cube\'s edge is the number that, multiplied by itself three times, gives the volume (find it by trying).'],
    sums: function () { var l = ri(2, 12), b = ri(2, 10), h = ri(2, 10), e = ri(2, 9); return [pure('A cuboid has volume ' + l * b * h + ' cm³, length ' + l + ' cm, breadth ' + b + ' cm. Height?', h + ' cm'), pure('A cube has volume ' + e * e * e + ' cm³. Each edge?', e + ' cm'), pure('A cuboid has volume ' + l * b * h + ' cm³ and base area ' + l * b + ' cm². Height?', h + ' cm')]; },
    facts: null });

  step({ id: 'p6angles', year: 6, name: 'Unknown angles in figures', src: 'hs', ref: HS + ', Ch. VII, XI', moe: 'P6 · Angles in composite figures',
    objects: 'Protractor, set squares',
    how: ['Hall & Stevens: draw two parallel lines cut by a third. Trace the angles to find which are equal (corresponding and alternate angles), and which add up to 180°.',
      'In any figure, use what is known: angles on a line make 180°, at a point 360°, in a triangle 180°, opposite angles of a parallelogram are equal.',
      'Write each step with its reason, as in a proof.'],
    book: { ref: HS + ', Ch. VII (wording shortened)', items: [['A line crosses two parallel lines and one of the angles it makes is 57°. Write down the other seven angles without measuring.', 'four of 57° and four of 123°'], ['Do the same when the angle is 117°.', 'four of 117° and four of 63°']] },
    sums: function () { var a = ri(30, 80), b = ri(30, 80); return [pure('In a triangle drawn inside a rectangle, two angles are ' + a + '° and ' + b + '°. The third angle of the triangle?', (180 - a - b) + '°')]; },
    facts: null });

  step({ id: 'p6avg', year: 6, name: 'Average', src: 'ray', ref: RAYP + ', Art. 260', moe: 'P6 · Average',
    objects: 'Her own measurements: heights in the family, a week of temperatures',
    how: ['Ray (alligation medial): divide the total by the number of things.',
      'Average = total ÷ number of items, so total = average × number of items.',
      'Find the average of her own week of measurements, and talk about what it tells and what it hides.'],
    book: { ref: RAYP + ', Art. 260 (wording shortened)', items: [['A grocer mixes 4 lb. of tea at 40 cents a lb. with 6 lb. at 50 cents. What is a pound of the mixture worth?', '46 cents'], ['10 sheep are bought at $3 each, 12 at $4 and 8 at $9. What is the average price?', '$5']] },
    sums: function () { var n = ri(3, 6), xs = []; for (var i = 0; i < n; i++) xs.push(ri(20, 90)); var s = xs.reduce(function (a, b) { return a + b; }, 0); var r = s % n; if (r) { xs[0] += n - r; s += n - r; } return [pure('Average of ' + xs.join(', ') + '?', s / n), pure('The average of 4 numbers is ' + (s / n) + '. What is their total?', 4 * s / n)]; },
    facts: null });

  // Exercises from the scans Shu Ping sent: Ray's New Practical (1877), Ray's New Intellectual, Hall & Knight. Every answer checked by calculation and, where printed, against the books' keys.
  (function () {
    var RAYNP = "Ray's New Practical Arithmetic (1877)", RAYI = "Ray's New Intellectual Arithmetic";
    function patch(id, o) { var s = STEPS.filter(function (x) { return x.id === id; })[0]; if (!s) throw new Error('no step ' + id); for (var k in o) { if (o[k] === null) delete s[k]; else s[k] = o[k]; } }
    patch("p3equiv", { book: { ref: RAYNP + ', Arts. 106–108, 110', items: [["Reduce 4/5 to thirtieths.", "24/30"], ["Reduce 1/2 to fourths.", "2/4"], ["Reduce 2/3 to sixths.", "4/6"], ["Reduce 3/4 to twelfths.", "9/12"], ["Reduce 5/6 to twenty-fourths.", "20/24"], ["Reduce 5/7 to twenty-eighths.", "20/28"], ["Reduce 7/8 to seventy-seconds.", "63/72"], ["Reduce 3/5 to sixtieths.", "36/60"], ["Reduce 9/10 to hundredths.", "90/100"], ["Reduce 18/30 to its lowest terms.", "3/5"], ["Reduce 60/90 to its lowest terms.", "2/3"], ["Reduce 12/18 to its lowest terms.", "2/3"], ["Reduce 30/45 to its lowest terms.", "2/3"], ["Reduce 60/150 to its lowest terms.", "2/5"], ["Reduce 42/70 to its lowest terms.", "3/5"], ["Reduce 96/112 to its lowest terms.", "6/7"], ["Reduce 60/125 to its lowest terms.", "12/25"], ["Reduce 1/2, 3/4 and 7/8 to their least common denominator.", "4/8, 6/8, 7/8"], ["Reduce 2/3, 5/6 and 7/12 to their least common denominator.", "8/12, 10/12, 7/12"], ["Reduce 3/4, 5/8 and 11/16 to their least common denominator.", "12/16, 10/16, 11/16"], ["Reduce 2/3, 3/4 and 7/8 to their least common denominator.", "16/24, 18/24, 21/24"], ["Reduce 3/8, 4/5 and 9/10 to their least common denominator.", "15/40, 32/40, 36/40"], ["Add 1/4, 2/4, 3/4.", "1 1/2"], ["Add 1/5, 2/5, 3/5, 4/5.", 2], ["Add 1/7, 2/7, 3/7, 6/7.", "1 5/7"], ["Add 4/9, 5/9, 7/9, 8/9.", "2 2/3"]] }, oral: { ref: RAYI + ', Lessons XXII, XXIII, XXVII', items: [["Reduce 2/6 to its lowest terms.", "1/3"], ["Reduce 3/6 to its lowest terms.", "1/2"], ["Reduce 4/6 to its lowest terms.", "2/3"], ["Reduce 4/8 to its lowest terms.", "1/2"], ["Reduce to their lowest terms: 5/10, 3/9, 6/8, 4/10, 8/10, 10/12.", "1/2, 1/3, 3/4, 2/5, 4/5, 5/6"], ["If an apple costs 2 cents, what part of the apple costs 1 cent?", "1/2"], ["If the price of a yard of cloth is $3, what part of a yard will cost $2?", "2/3 of a yard"], ["If you buy an orange for 4 cents, what part of the orange costs 3 cents?", "3/4"], ["James had 7 marbles and gave his brother 4 of them: what part did he give away?", "4/7"], ["A lady went shopping with $10; she spent $7: what part of her money did she spend?", "7/10"]] }, adapt: null });
    patch("p3div", { oral: { ref: RAYI + ', Lessons XIV–XVIII', items: [["What will 8 quarts of berries cost at 12 cents a quart?", "96 cents"], ["Two men start from the same place and travel in opposite directions: one travels 2 miles an hour, the other 4 miles an hour: how far will they be apart at the end of 3 hours?", "18 miles"], ["If a man can earn $6 in 1 week, how many dollars can he earn in 8 weeks?", "$48"], ["I bought 6 barrels of apples at $2 a barrel, and 4 barrels of sugar at $11 a barrel: how much did they both cost?", "$56"], ["The sum of two numbers is 23; the smaller is 11: what is 5 times the larger?", 60], ["If two men travel in the same direction, one 10 miles and the other 7 miles an hour, how far will they be apart in 7 hours?", "21 miles"], ["Bought 6 quarts of berries, at 8 cents a quart; sold 4 quarts, at 10 cents a quart, and 2 quarts, at 12 cents a quart: how much did I make?", "16 cents"], ["At $3 a yard, how many yards of cloth can you buy for $21?", "7 yards"], ["A lady spent 22 cents for tape at 2 cents a yard: how many yards did she buy?", "11 yards"], ["In an orchard of 25 apple trees there are 5 rows: how many trees in each row?", 5], ["If a man can travel 3 miles in an hour, how many hours will it take him to travel 27 miles?", "9 hours"], ["A man gave $28 for sheep, at $4 a head: how many did he buy?", 7], ["There are 32 dimes on a table in 4 piles: how many in each pile?", 8], ["Six men receive $36 for a job of work: what is each man's share?", "$6"], ["Four quarts make 1 gallon: how many gallons in 36 quarts?", "9 gallons"], ["If 11 ounces of powder cost 88 cents: what will 1 ounce cost?", "8 cents"], ["A man paid $108 for 12 merino sheep: how much was that apiece?", "$9"], ["If 6 men earn $84 in 7 days, how much does each man earn in 1 day?", "$2"], ["One man travels at the rate of 15 miles in 3 days; another at the rate of 20 miles in 2 days: how much further in one day does the latter travel than the former?", "5 miles"]] } });
    patch("sub", { oral: { ref: RAYI + ', Lessons V, VIII, IX', items: [["James had 13 marbles; he gave 2 to Henry, and 3 to Thomas: how many had he left?", 8], ["A merchant had 40 barrels of flour; he sold to one man 9, to another 21: how many had he left?", 10], ["On Christmas day, William had 36 cents given him; he spent 6 cents for apples, 9 cents for cakes, and 10 cents for candy: how many had he left?", 11], ["A man paid 30 dollars for a horse, the keeping cost 9 dollars, and he sold him for 29 dollars: how many dollars did he lose?", 10], ["A man, having 34 dollars, bought a barrel of molasses for 15 dollars, and a bag of coffee for 10 dollars: how many dollars had he left?", 9], ["Joseph has 4 marbles, William has 2, and David has 16: how many have they all?", 22], ["The greater of two numbers is 12, and their difference 5: what is the less?", 7], ["The sum of two numbers is 21; the less number is 8: what is the greater?", 13]] } });
    patch("p4fset", { oral: { ref: RAYI + ', Lesson XXII', items: [["James had 4 apples and gave his brother 1/2 of them: how many did he give him?", 2], ["If a melon is worth 8 cents, what are 3/4 of a melon worth?", "6 cents"], ["If a dozen eggs are worth 12 cents, what are 5/6 of a dozen worth?", "10 cents"], ["What are 2/3 of 9?", 6], ["What are 3/4 of 20?", 15], ["What are 3/8 of 16? 5/6 of 24? 7/8 of 32?", "6, 20, 28"], ["If 3 yards of cloth cost $9, what will 1 yard cost?", "$3"], ["If 3 oranges are worth 15 cents, what are 2 oranges worth?", "10 cents"], ["If 5 barrels of flour are sold for $30, what would 3 barrels sell for?", "$18"], ["A grocer sells 7 pounds of sugar for 70 cents: what will he sell 5 pounds for?", "50 cents"], ["A lady purchased 8 yards of calico for 72 cents; she afterward found that she needed 5 yards more of the same: how much did it cost?", "45 cents"]] } });
    patch("p4fadd", { book: { ref: RAYNP + ', Arts. 111, 113–114', items: [["Add 1/2 and 1/3.", "5/6"], ["Add 1/3 and 1/4.", "7/12"], ["Add 1/2 and 3/5.", "1 1/10"], ["Add 5/6 and 1/9.", "17/18"], ["Add 3/4 and 5/6.", "1 7/12"], ["Add 7/8 and 11/12.", "1 19/24"], ["Add 2/3, 3/4, 5/6.", "2 1/4"], ["Add 1/4, 7/8, 11/12.", "2 1/24"], ["Add 1/2, 1/3, 1/4, 1/5, 1/6.", "1 9/20"], ["From 3/4 subtract 1/4.", "1/2"], ["From 7/8 subtract 5/8.", "1/4"], ["From 5/9 subtract 2/9.", "1/3"], ["From 1/2 subtract 1/3.", "1/6"], ["From 1/3 subtract 1/4.", "1/12"], ["From 3/4 subtract 2/3.", "1/12"], ["From 4/5 subtract 1/2.", "3/10"], ["From 5/6 subtract 3/10.", "8/15"], ["From 5/9 subtract 1/6.", "7/18"]] }, oral: { ref: RAYI + ', Lessons XXX, XXXI', items: [["Add 1/2 and 3/5. 1/2 and 3/8. 2/3 and 3/4.", "1 1/10, 7/8, 1 5/12"], ["Add 1/3 and 2/5. 1/4 and 1/6. 1/4 and 1/5.", "11/15, 5/12, 9/20"], ["Add 3 2/3 and 4 5/6.", "8 1/2"], ["James received 1/2 an orange and Charles, 1/3: how much more did James receive than Charles?", "1/6 of an orange"], ["If I give to Mary 1/2 of an apple, and to Jane 1/4, how much more will Mary have than Jane?", "1/4 of an apple"], ["Joseph bought a quart of chestnuts, and gave 1/2 to his mother and 1/6 to his sister: how much more did he give his mother than his sister?", "1/3 of a quart"]] }, adapt: "MOE keeps to denominators of 12 or less; the last few book exercises go a little beyond that." });
    patch("p5fmix", { book: { ref: RAYNP + ', Arts. 111, 113–114', items: [["Add 2 1/2 and 3 2/3.", "6 1/6"], ["Add 4/5, 7 1/2, 8 3/4.", "17 1/20"], ["Add 7/12, 2 5/6, 3 3/8, 3 4/9.", "10 17/72"], ["Add 16 2/3, 12 3/4, 8 3/5, 2 1/4.", "40 4/15"], ["From 3 1/8 subtract 1 3/8.", "1 3/4"], ["From 4 1/4 subtract 2 3/4.", "1 1/2"], ["From 8 1/3 subtract 3 2/3.", "4 2/3"], ["From 3 1/2 subtract 1 2/3.", "1 5/6"], ["From 5 subtract 2/3.", "4 1/3"], ["From 5 2/3 subtract 4 1/2.", "1 1/6"], ["From 7 2/3 subtract 4 3/4.", "2 11/12"], ["From 14 1/4 subtract 12 2/3.", "1 7/12"], ["From 56 1/3 subtract 42 1/4.", "14 1/12"], ["From 60 4/5 subtract 41 3/10.", "19 1/2"], ["From 97 1/2 subtract 48 5/6.", "48 2/3"]] }, adapt: null });
    patch("p5fmul", { book: { ref: RAYNP + ', Arts. 115–117 (word problems shortened)', items: [["If 1 apple cost 4/5 of a cent, what will 3 apples cost?", "2 2/5 cents"], ["At 12 ct. a yard, what will 2/5 of a yard of ribbon cost?", "4 4/5 ct."], ["What will 4/7 of a yard of cloth cost, at 3/5 of a dollar per yard?", "12/35 of a dollar"], ["Multiply 3/4 by 3.", "2 1/4"], ["Multiply 8 by 2/3.", "5 1/3"], ["Multiply 3/4 by 5/7.", "15/28"], ["Multiply 2/3 by 4.", "2 2/3"], ["Multiply 5 by 3/4.", "3 3/4"], ["Multiply 2/3 by 6.", 4], ["Multiply 20 by 3/4.", 15], ["Multiply 3/5 by 10.", 6], ["Multiply 12 by 2/3.", 8], ["Multiply 3/7 by 6.", "2 4/7"], ["Multiply 7 by 2/3.", "4 2/3"], ["Multiply 2 1/4 by 3 1/2.", "7 7/8"], ["Multiply 18 3/4 by 8.", 150], ["Multiply 2 1/2 by 2 1/2.", "6 1/4"], ["Multiply 25 by 8 3/5.", 215], ["Multiply 10 5/6 by 9.", "97 1/2"], ["What is 2/3 of 2?", "1 1/3"], ["What is 3/4 of 5?", "3 3/4"], ["What is 2/5 of 7?", "2 4/5"], ["What is 4/5 of 10?", 8], ["What is 5/6 of 12?", 10], ["What is 5/6 of 15?", "12 1/2"], ["What is 8/9 of 21?", "18 2/3"], ["What is 7/10 of 25?", "17 1/2"], ["What is 5/12 of 27?", "11 1/4"], ["What is 7/12 of 28?", "16 1/3"]] } });
    patch("p6fdiv", { book: { ref: RAYNP + ', Art. 119 (word problems shortened)', items: [["If 3 yards of ribbon cost 6/7 of a dollar, what will 1 yard cost?", "2/7 of a dollar"], ["At 2 dollars a yard, what part of a yard of cloth can be bought for 3/5 of a dollar?", "3/10 of a yard"], ["At 2/3 of a cent for 1 apple, how many can be bought for 4 cents?", "6 apples"], ["At 2/3 of a cent for 1 apple, how many apples can be bought for 3/4 of a cent?", "1 1/8 apples"], ["If 4 yards of muslin cost 8/9 of a dollar, what will 1 yard cost?", "2/9 of a dollar"], ["At 1/2 a cent each, how many apples can be bought for 3 cents?", "6 apples"], ["At 1/5 of a dollar per yard, how many yards of muslin can be bought for $9/10?", "4 1/2 yards"], ["If 1 orange cost 3 cents, what part of an orange could be purchased for 1/2 a cent?", "1/6 of an orange"], ["At 3/4 of a dollar per yard, how many yards of cloth can you buy for 6 dollars?", "8 yards"], ["At 1/5 of a dollar per yard, how many yards of ribbon can be purchased for 3/4 of a dollar?", "3 3/4 yards"], ["If 7 pounds of rice cost 14/25 of a dollar, what will 1 pound cost?", "2/25 of a dollar"], ["Divide 4 1/2 by 1 1/3.", "3 3/8"], ["Divide 2 2/5 by 6.", "2/5"], ["Divide 22 by 5 1/2.", 4], ["Divide 2 1/2 by 1/16.", 40], ["Divide 4 4/5 by 8.", "3/5"], ["Divide 6 by 2 2/5.", "2 1/2"], ["Divide 30 by 3 3/4.", 8], ["Divide 2 1/4 by 7 1/2.", "3/10"], ["Divide 50 by 4 3/7.", "11 9/31"], ["Divide 1/2 by 1/50.", 25], ["Divide 56 by 5 4/9.", "10 2/7"], ["Divide 3/4 by 4/5.", "15/16"]] }, oral: { ref: RAYI + ', Lesson XLI', items: [["Divide 1/5 by 1/4.", "4/5"], ["Divide 4/5 by 2/3.", "1 1/5"], ["Divide 4/5 by 3/4.", "1 1/15"], ["Divide 7/8 by 3/4.", "1 1/6"], ["If a pound of tea cost $4/5, how much tea can you purchase for $2/3?", "5/6 of a pound"]] } });
    patch("p5pct", { oral: { ref: RAYI + ', Lesson LXVII', items: [["Two is what per cent of 5?", "40%"], ["Three is what per cent of 5? Of 12?", "60%, 25%"], ["Four is what per cent of 8? Of 32?", "50%, 12 1/2%"], ["Five dollars are what per cent of $20? $30?", "25%, 16 2/3%"], ["Eight men are what per cent of 160 men?", "5%"], ["There are 36 pupils enrolled in a certain school; if 9 are absent, what is the per cent of absence?", "25%"], ["Out of 60 pupils in a school, 20 study geography: what per cent is that of the whole number?", "33 1/3%"], ["There are 45 pupils enrolled in a certain primary school; on a certain day only 30 of them were present: what was the per cent of attendance?", "66 2/3%"]] } });
    patch("p6pct", { oral: { ref: RAYI + ', Lesson LXVII', items: [["A grocer buys coffee at 25 ct. per pound, and sells it at a profit of 5 ct. per pound: what is his gain per cent?", "20%"], ["A merchant bought cloth at $5 per yard, and sold it at $7 per yard: what per cent did he gain?", "40%"], ["James bought a melon for 4 ct., and sold it for 5 ct.: what per cent did he gain?", "25%"], ["An orange was bought for 5 ct., and sold for 4 ct.: what was the per cent of loss?", "20%"], ["Thomas bought a watch for $4, and sold it for $6: what per cent did he gain?", "50%"], ["Henry bought a horse for $15, and sold it for $24: what per cent did he gain?", "60%"]] } });
    patch("p5interest", { oral: { ref: RAYI + ', Lesson LXXII', items: [["Find the interest of $40 for 4 yr., at 5 per cent.", "$8.00"], ["Find the interest of $50 for 3 yr., at 6 per cent.", "$9.00"], ["Find the interest of $60 for 2 yr., at 7 per cent.", "$8.40"], ["Find the interest of $75 for 3 yr., at 4 per cent.", "$9.00"], ["Find the interest of $80 for 5 yr., at 9 per cent.", "$36.00"]] } });
    patch("p6ratio", { oral: { ref: RAYI + ', Lesson LXI', items: [["Divide the number 60 into 3 parts that shall be to each other as 3, 4, and 5.", "15, 20 and 25"], ["Divide the number 70 into four parts that shall be to each other as 1, 2, 3, and 4.", "7, 14, 21 and 28"], ["Divide the number 22 into two parts that shall be to each other as 2 1/2 to 3.", "10 and 12"]] } });
    var alg = STEPS.filter(function (x) { return x.id === 'p6alg'; })[0], k7 = alg.book.items.map(function (x) { return x[0]; }).indexOf('Solve 7x = 14.');
    Array.prototype.splice.apply(alg.book.items, [k7 + 1, 0].concat([["Solve 3x + 15 = x + 25.", "x = 5"], ["Solve 2x − 3 = 3x − 7.", "x = 4"], ["Solve 3x + 4 = 5(x − 2).", "x = 7"], ["Solve 2x + 3 = 16 − (2x − 3).", "x = 4"], ["Solve 5x − 17 + 3x − 5 = 6x − 7 − 8x + 115.", "x = 13"]]));
    alg.book.ref = 'Hall & Knight, Elementary Algebra for Schools, Examples I, II, VII, VIII, IX, X';
    alg.adapt = 'The exercises are Hall & Knight\'s own; the equations need no negative numbers on the way. Pence and shillings are kept as they wrote them.';
  })();

  // Put the added steps where they belong in the sequence.
  (function () {
    function at(id) { for (var i = 0; i < STEPS.length; i++) if (STEPS[i].id === id) return i; return -1; }
    function moveAfter(id, after) { var i = at(id); var s = STEPS.splice(i, 1)[0]; STEPS.splice(at(after) + 1, 0, s); }
    moveAfter('ordinal', 'teens'); moveAfter('add3', 'sub'); moveAfter('p2money', 'h1000'); moveAfter('p2graph', 'shapes3d'); moveAfter('measures', 'p2money');
    var y3 = ['p3num', 'add4', 't6', 't7', 'p3div', 't8', 't9', 'p3equiv', 'p3money', 'p3units', 'p3time', 'p3area', 'p3angle', 'p3perp', 'p3bar'];
    for (var k = y3.length - 1; k >= 0; k--) { var i = at(y3[k]); var st = STEPS.splice(i, 1)[0]; var first = 0; while (first < STEPS.length && STEPS[first].year < 3) first++; STEPS.splice(first, 0, st); }
    STEPS.sort(function (a, b) { return a.year - b.year; }); // stable in modern engines; years stay in their own order
  })();

  // ---------- Scope and sequence: every topic in MOE's 2021 Primary Mathematics Syllabus (P1–P6), by age ----------
  // steps: number.js lessons that teach it (CM = Stephens; add-in = MOE add-in taught the same way).
  // mt: Maths trainer topics (math.js) that give practice. plan: the CM source meant for it, where no lesson is built yet.
  // part: what the built lessons don't yet cover. Ages follow the plan: P1 content at 6, P6 content by 11, PSLE at 12.
  var SCOPE = [
    { lv: 1, age: 6, strand: 'Numbers', name: 'Numbers up to 100', steps: ['ordinal','n2','n3','n4','n5','n6','n7','n8','n9','ten','teens','d20','d30','d40','d50','d60','d70','d80','d90','d100'],
      },
    { lv: 1, age: 6, strand: 'Numbers', name: 'Addition and subtraction within 100', steps: ['n5','teens','d20','d30','d40','d50','d60','d70','d80','d90','add','subc','sub'] },
    { lv: 1, age: 6, strand: 'Numbers', name: 'Multiplication and division (concepts; × within 40, ÷ within 20)', steps: ['mul','share'],
      part: 'Stephens brings these in at the start of year 2, a little after MOE\'s P1.' },
    { lv: 1, age: 6, strand: 'Money', name: 'Counting money (cents to $1, dollars to $100)', steps: ['money','d20'] },
    { lv: 1, age: 6, strand: 'Measurement', name: 'Length in cm', steps: ['cm'] },
    { lv: 1, age: 6, strand: 'Measurement', name: 'Time to 5 minutes, am/pm, h and min', steps: ['clock'] },
    { lv: 1, age: 6, strand: 'Geometry', name: '2D shapes', steps: ['shapes2d'] },
    { lv: 1, age: 6, strand: 'Statistics', name: 'Picture graphs', steps: ['graph'] },

    { lv: 2, age: 7, strand: 'Numbers', name: 'Numbers up to 1000; odd and even', steps: ['h1000'],
      },
    { lv: 2, age: 7, strand: 'Numbers', name: 'Addition and subtraction up to 3 digits', steps: ['add','sub','add3','h1000'] },
    { lv: 2, age: 7, strand: 'Numbers', name: 'Tables of 2, 3, 4, 5 and 10; ÷ and its link to ×', steps: ['t2','t10','t5','share','t3','t4','sdiv'] },
    { lv: 2, age: 7, strand: 'Fractions', name: 'Fraction of a whole; adding like fractions', steps: ['frac'] },
    { lv: 2, age: 7, strand: 'Money', name: 'Money in decimal notation ($3.45); to cents and back', steps: ['p2money'] },
    { lv: 2, age: 7, strand: 'Measurement', name: 'Length, mass and volume (m, g, kg, ℓ)', steps: ['measures'] },
    { lv: 2, age: 7, strand: 'Measurement', name: 'Time to the minute; hours and minutes', steps: ['time2'] },
    { lv: 2, age: 7, strand: 'Geometry', name: 'Patterns with 2D shapes; 3D shapes', steps: ['shapes3d'] },
    { lv: 2, age: 7, strand: 'Statistics', name: 'Picture graphs with scales', steps: ['p2graph'] },

    { lv: 3, age: 8, strand: 'Numbers', name: 'Numbers up to 10 000', steps: ['p3num'] },
    { lv: 3, age: 8, strand: 'Numbers', name: 'Addition and subtraction up to 4 digits; mental 2-digit sums', steps: ['add4'], mt: ['p3add','p3mental'] },
    { lv: 3, age: 8, strand: 'Numbers', name: 'Tables of 6, 7, 8 and 9', steps: ['t6','t7','t8','t9'] },
    { lv: 3, age: 8, strand: 'Numbers', name: 'Division with remainder; × and ÷ up to 3 digits by 1 digit', steps: ['p3div'], mt: ['p3muldiv'] },
    { lv: 3, age: 8, strand: 'Fractions', name: 'Equivalent fractions; simplest form; related fractions', steps: ['p3equiv'], mt: ['p3equiv','p3fadd'] },
    { lv: 3, age: 8, strand: 'Money', name: 'Adding and subtracting money in decimals', steps: ['p3money'] },
    { lv: 3, age: 8, strand: 'Measurement', name: 'Compound units (km, m, cm, kg, g, ℓ, ml)', steps: ['p3units'], mt: ['p3units'] },
    { lv: 3, age: 8, strand: 'Measurement', name: 'Time: seconds, durations, 24-hour clock', steps: ['p3time'], mt: ['p3time'] },
    { lv: 3, age: 8, strand: 'Geometry', name: 'Area and perimeter of rectangles and squares', steps: ['p3area'], mt: ['p3area'] },
    { lv: 3, age: 8, strand: 'Geometry', name: 'Angles; perpendicular and parallel lines', steps: ['p3angle','p3perp'] },
    { lv: 3, age: 8, strand: 'Statistics', name: 'Bar graphs', steps: ['p3bar'] },

    { lv: 4, age: 9, strand: 'Numbers', name: 'Numbers up to 100 000; rounding; ≈', steps: ['p4num','p4round'], mt: ['p4round'] },
    { lv: 4, age: 9, strand: 'Numbers', name: 'Factors and multiples', steps: ['p4factors','p4multiples'], mt: ['p4factors'] },
    { lv: 4, age: 9, strand: 'Numbers', name: 'Multiplication and division algorithms (up to 4 digits)', steps: ['p4mul','p4div'], mt: ['p4mul'] },
    { lv: 4, age: 9, strand: 'Fractions', name: 'Mixed numbers and improper fractions; fraction of a set; unlike fractions', steps: ['p4mixed','p4fset','p4fadd'], mt: ['p4mixed','p4fset','p4funlike'] },
    { lv: 4, age: 9, strand: 'Decimals', name: 'Decimals to 3 places; the four operations with decimals', steps: ['p4dec','p4decops'], mt: ['p4decplace','p4decops'] },
    { lv: 4, age: 9, strand: 'Geometry', name: 'Area and perimeter: missing sides, composite figures', steps: ['p4area'], mt: ['p4rect'] },
    { lv: 4, age: 9, strand: 'Geometry', name: 'Measuring and drawing angles in degrees', steps: ['p4angles'], mt: ['p4angle'] },
    { lv: 4, age: 9, strand: 'Geometry', name: 'Rectangle and square properties; line symmetry', steps: ['p4rect','p4sym'] },
    { lv: 4, age: 9, strand: 'Geometry', name: 'Nets of solids; 2D drawings of solids', steps: ['p4nets'] },
    { lv: 4, age: 9, strand: 'Statistics', name: 'Tables, line graphs and pie charts', steps: ['p4graphs'] },

    { lv: 5, age: 10, strand: 'Numbers', name: 'Numbers up to 10 million', steps: ['p5num'] },
    { lv: 5, age: 10, strand: 'Numbers', name: 'Order of operations and brackets; × and ÷ by 10, 100, 1000', steps: ['p5order','p5tens'], mt: ['p5order','p5tens'] },
    { lv: 5, age: 10, strand: 'Fractions', name: 'Division as a fraction; mixed numbers; multiplying fractions', steps: ['p5fdiv','p5fmix','p5fmul'], mt: ['p5fquot','p5fmixed','p5fmul'] },
    { lv: 5, age: 10, strand: 'Decimals', name: 'Decimals × and ÷ by 10, 100, 1000; unit conversions', steps: ['p5tens'], mt: ['p5decten'] },
    { lv: 5, age: 10, strand: 'Percentage', name: 'Percentage; discount, GST and annual interest', steps: ['p5pct','p5interest'], mt: ['p5pct'] },
    { lv: 5, age: 10, strand: 'Rate', name: 'Rate', steps: ['p5rate'], mt: ['p5rate'] },
    { lv: 5, age: 10, strand: 'Geometry', name: 'Area of triangles and composite figures', steps: ['p5tri'], mt: ['p5tri'] },
    { lv: 5, age: 10, strand: 'Geometry', name: 'Volume of cubes, cuboids and tanks; cubes on isometric grid', steps: ['p5vol'], mt: ['p5vol'] },
    { lv: 5, age: 10, strand: 'Geometry', name: 'Angle rules; triangles; parallelogram, rhombus, trapezium', steps: ['p5angles','p5triangles','p5quad'], mt: ['p5angles'] },

    { lv: 6, age: 11, strand: 'Fractions', name: 'Dividing fractions', steps: ['p6fdiv'], mt: ['p6fdiv'] },
    { lv: 6, age: 11, strand: 'Percentage', name: 'Finding the whole; percentage increase and decrease', steps: ['p6pct'], mt: ['p6pct'] },
    { lv: 6, age: 11, strand: 'Ratio', name: 'Ratio', steps: ['p6ratio'], mt: ['p6ratio'] },
    { lv: 6, age: 11, strand: 'Algebra', name: 'Algebra: expressions and simple equations', steps: ['p6alg'], mt: ['p6alg'] },
    { lv: 6, age: 11, strand: 'Geometry', name: 'Circles, semicircles and quarter circles', steps: ['p6circle'], mt: ['p6circle'] },
    { lv: 6, age: 11, strand: 'Geometry', name: 'Volume: finding a missing measurement', steps: ['p6vol'], mt: ['p6vol'] },
    { lv: 6, age: 11, strand: 'Geometry', name: 'Unknown angles in composite figures (special quadrilaterals)', steps: ['p6angles'] },
    { lv: 6, age: 11, strand: 'Statistics', name: 'Average', steps: ['p6avg'], mt: ['p6avg'] }
  ];

  // Clean any sum whose answer the code could not fix (null) out of the set.
  function sumsFor(s) { return s.sums ? s.sums().filter(function (x) { return x && x[1] !== null && x[1] !== undefined; }) : []; }


  // Things to have ready, by year, gathered from each lesson's "Things to hand". buy: true = may need buying; the rest are about the house.
  var SUPPLIES = [
    { year: 1, items: [
      { id: 'beans', name: 'Beans or buttons to count (a jar of 100)', steps: ['n2', 'n9', 'share', 'p4factors', 'p6ratio'] },
      { id: 'sticks', name: 'Ice-cream sticks and rubber bands, for bundles of ten', buy: true, steps: ['ten', 'teens', 'd20', 'd100', 'h1000'] },
      { id: 'money', name: 'Money: $1 coins and $2, $5, $10 notes (real or play)', steps: ['money', 'd30', 'add', 'sub', 'p2money', 'p3money'] },
      { id: 'cmruler', name: 'A ruler marked in centimetres', steps: ['cm', 'p3perp', 'p4angles'] },
      { id: 'clock', name: 'A clock with hands (or a paper clock with a split pin)', steps: ['clock', 'time2'] },
      { id: 'sqpaper', name: 'Squared paper (exercise book)', buy: true, steps: ['shapes2d', 'graph', 'add3', 'p4mul', 'p5fmul'] },
      { id: 'toys', name: 'Ten small toys or pegs', steps: ['ordinal'] },
      { id: 'tape', name: 'A metre rule or tape measure', steps: ['d100', 'measures', 'p3area', 'p4dec', 'p6circle'] }] },
    { year: 2, items: [
      { id: 'scales', name: 'Kitchen scales', steps: ['h1000', 'measures', 'p3units'] },
      { id: 'jug', name: 'A 1-litre measuring jug marked in ml', steps: ['h1000', 'measures', 'p3units', 'p5vol'] },
      { id: 'solids', name: 'Boxes, tins, a ball, an ice-cream cone', steps: ['shapes3d'] },
      { id: 'strips', name: 'Paper strips to fold into fractions', steps: ['frac', 'p3equiv', 'p4fadd', 'p5fmix', 'p6fdiv'] }] },
    { year: 3, items: [
      { id: 'pvchart', name: 'A place-value chart (draw one on card)', steps: ['p3num', 'p4num', 'p5num'] },
      { id: 'stopwatch', name: 'A stopwatch (a phone will do) and a clock with a second hand', steps: ['p3time'] },
      { id: 'cmpaper', name: 'Centimetre-squared paper', buy: true, steps: ['p3area', 'p4area'] },
      { id: 'tracing', name: 'Tracing paper', buy: true, steps: ['p3angle', 'p4angles'] },
      { id: 'setsq', name: 'Set squares', buy: true, steps: ['p3perp', 'p4rect', 'p5tri', 'p5quad', 'p6angles'] },
      { id: 'timetable', name: 'A bus or train timetable and a map', steps: ['p3time', 'p3units'] }] },
    { year: 4, items: [
      { id: 'protractor', name: 'A protractor', buy: true, steps: ['p4angles', 'p4rect', 'p5angles', 'p5triangles', 'p6angles'] },
      { id: 'mirror', name: 'A small mirror', steps: ['p4sym'] },
      { id: 'card', name: 'Thin card, scissors, glue or tape; a cereal box to open out', steps: ['p4nets', 'p5tri'] }] },
    { year: 5, items: [
      { id: 'cubes', name: 'Centimetre cubes (or sugar cubes)', buy: true, steps: ['p5vol', 'p6vol'] },
      { id: 'isopaper', name: 'Isometric grid paper', buy: true, steps: ['p5vol'] },
      { id: 'container', name: 'A rectangular container', steps: ['p5vol', 'p6vol'] },
      { id: 'receipts', name: 'Receipts showing GST; price tags and sale signs', steps: ['p5pct', 'p5interest', 'p5rate', 'p6pct'] }] },
    { year: 6, items: [
      { id: 'compass', name: 'Compasses', buy: true, steps: ['p6circle'] },
      { id: 'string', name: 'String, and round tins or plates', steps: ['p6circle'] }] }];
  window.SDNumber = { steps: STEPS, sumsFor: sumsFor, scope: SCOPE, supplies: SUPPLIES,
    source: 'Irene Stephens, The Teaching of Mathematics to Young Children (1911), written under Charlotte Mason’s supervision, for the early steps' };
})();
