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
    objects: 'Paper squares, rectangles, triangles and circles you cut out; a dot grid or squared paper',
    how: ['Find rectangles, squares, triangles and circles round the flat: a door, a tile, a plate.',
      'Fold a paper circle in half and in quarters to make a half circle and a quarter circle.',
      'Let her build pictures from the paper shapes, then name the shapes that make up a picture.',
      'Copy a simple figure on a dot grid or squared paper.'],
    sums: null, facts: null });

  step({ id: 'ten', year: 1, name: 'Ten: the ten bundle', src: 'stephens',
    objects: 'Matchsticks or ice-cream sticks and rubber bands (or beads threaded in tens)',
    how: ['Count out ten sticks with her and tie them into a bundle. Each loose stick is a "unit".',
      'Write 10 on squared paper with 1 in the tens column and 0 in the units column. Write 1 to 9 above it, so the 0 sits under the 9.',
      'Put the bundles away as soon as she has the idea.'],
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
    objects: 'A ruler marked in centimetres; pencils, crayons and leaves to measure',
    how: ['Measure things to the nearest centimetre and write the length with "cm".',
      'Put three things in order from shortest to longest, and say how much longer one is than another.',
      'Draw a line of a given length, such as 7 cm, with the ruler.'],
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
    objects: 'Ten ten bundles (once, to see it)',
    how: ['Ten tens make a hundred. Count in tens to 100 and back, and count on in ones across a ten (38, 39, 40, 41).',
      'Look at 100 from many sides: 99 + 1, 50 + 50, 10 × 10, half of it is 50, a quarter is 25.'],
    sums: function () { var a = ri(11, 89); var t = ri(1, 9) * 10; return [pure(a + ' and how many more make 100?', 100 - a), pure('How many tens make 100?', 10), pure(t + ' and how many more make 100?', 100 - t)]; },
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
    adapt: 'Stephens leaves weights and measures until about nine, with children pouring and weighing to make their own tables. MOE wants m, g, kg and ℓ at P2, so this step comes earlier, done her way.',
    objects: 'Kitchen scales, a 1-litre jug, a metre ruler or tape measure, rice or sand, water',
    how: ['Let her weigh and pour for herself: how many cups fill the litre jug? What does a bag of rice weigh?',
      'Measure the room and the table in metres.',
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
    objects: 'Boxes, tins, a ball, an ice-cream cone; paper shapes for patterns',
    how: ['Find cubes, cuboids, cylinders, cones and spheres in the kitchen, and talk about their faces and edges.',
      'Make and finish patterns with flat shapes, changing size, shape, colour or way round.'],
    sums: null, facts: null });

  step({ id: 'h1000', year: 2, name: 'Numbers to 1000', src: 'stephens', moe: 'P2 · Numbers to 1000',
    adapt: 'Stephens goes to 100 in year one. MOE asks for 1000 at P2, so this step carries her ten bundles on to hundreds.',
    objects: 'Ten ten bundles tied into a hundred bundle; $100 in $10 notes',
    how: ['Ten tens make a hundred bundle, as ten units made a ten. Write hundreds, tens and units in columns.',
      'Count in tens and in hundreds, and say each number as hundreds, tens and units.',
      'Odd and even numbers: can it be shared into twos with none left over?'],
    sums: function () { var h = ri(1, 9), t = ri(0, 9), u = ri(0, 9); var n = h * 100 + t * 10 + u; return [pure(h + ' hundred' + (h === 1 ? '' : 's') + ', ' + t + ' ten' + (t === 1 ? '' : 's') + ' and ' + u + ' unit' + (u === 1 ? '' : 's') + ' make what number?', n), pure(n + ' + 10', n + 10), pure(n + ' + 100', n > 899 ? null : n + 100), pure('Is ' + n + ' odd or even?', n % 2 ? 'odd' : 'even')]; },
    facts: function () { var n = ri(100, 899); return pick([[n + ' + 100', n + 100], [n + ' + 10', n + 10], [(n + 100) + ' − 100', n]]); } });

  // ---------- Year 3: the rest of the tables (MOE P3, taught Stephens' way) ----------
  tableStep(6, 3, 'P3'); tableStep(7, 3, 'P3'); tableStep(8, 3, 'P3'); tableStep(9, 3, 'P3');


  // ---------- Scope and sequence: every topic in MOE's 2021 Primary Mathematics Syllabus (P1–P6), by age ----------
  // steps: number.js lessons that teach it (CM = Stephens; add-in = MOE add-in taught the same way).
  // mt: Maths trainer topics (math.js) that give practice. plan: the CM source meant for it, where no lesson is built yet.
  // part: what the built lessons don't yet cover. Ages follow the plan: P1 content at 6, P6 content by 11, PSLE at 12.
  var SCOPE = [
    { lv: 1, age: 6, strand: 'Numbers', name: 'Numbers up to 100', steps: ['n2','n3','n4','n5','n6','n7','n8','n9','ten','teens','d20','d30','d40','d50','d60','d70','d80','d90','d100'],
      part: 'Ordinal numbers (1st to 10th) and writing numbers in words are not in the steps yet.' },
    { lv: 1, age: 6, strand: 'Numbers', name: 'Addition and subtraction within 100', steps: ['n5','teens','d20','d30','d40','d50','d60','d70','d80','d90','add','subc','sub'] },
    { lv: 1, age: 6, strand: 'Numbers', name: 'Multiplication and division (concepts; × within 40, ÷ within 20)', steps: ['mul','share'],
      part: 'Stephens brings these in at the start of year 2, a little after MOE\'s P1.' },
    { lv: 1, age: 6, strand: 'Money', name: 'Counting money (cents to $1, dollars to $100)', steps: ['money','d20'] },
    { lv: 1, age: 6, strand: 'Measurement', name: 'Length in cm', steps: ['cm'] },
    { lv: 1, age: 6, strand: 'Measurement', name: 'Time to 5 minutes, am/pm, h and min', steps: ['clock'] },
    { lv: 1, age: 6, strand: 'Geometry', name: '2D shapes', steps: ['shapes2d'] },
    { lv: 1, age: 6, strand: 'Statistics', name: 'Picture graphs', steps: ['graph'] },

    { lv: 2, age: 7, strand: 'Numbers', name: 'Numbers up to 1000; odd and even', steps: ['h1000'],
      part: 'Writing numbers in words, and comparing and ordering 3-digit numbers, are not in the step yet.' },
    { lv: 2, age: 7, strand: 'Numbers', name: 'Addition and subtraction up to 3 digits', steps: ['add','sub','h1000'],
      part: 'The steps practise 2-digit columns; 3-digit columns are not built yet.' },
    { lv: 2, age: 7, strand: 'Numbers', name: 'Tables of 2, 3, 4, 5 and 10; ÷ and its link to ×', steps: ['t2','t10','t5','share','t3','t4','sdiv'] },
    { lv: 2, age: 7, strand: 'Fractions', name: 'Fraction of a whole; adding like fractions', steps: ['frac'] },
    { lv: 2, age: 7, strand: 'Money', name: 'Money in decimal notation ($3.45); to cents and back', steps: [], plan: 'Ray\'s Primary money problems, plus SGD practice' },
    { lv: 2, age: 7, strand: 'Measurement', name: 'Length, mass and volume (m, g, kg, ℓ)', steps: ['measures'] },
    { lv: 2, age: 7, strand: 'Measurement', name: 'Time to the minute; hours and minutes', steps: ['time2'] },
    { lv: 2, age: 7, strand: 'Geometry', name: 'Patterns with 2D shapes; 3D shapes', steps: ['shapes3d'] },
    { lv: 2, age: 7, strand: 'Statistics', name: 'Picture graphs with scales', steps: [], plan: 'MOE add-in (graphs from her own counts)' },

    { lv: 3, age: 8, strand: 'Numbers', name: 'Numbers up to 10 000', steps: [], plan: 'Ray\'s Intellectual Arithmetic' },
    { lv: 3, age: 8, strand: 'Numbers', name: 'Addition and subtraction up to 4 digits; mental 2-digit sums', steps: [], mt: ['p3add','p3mental'], plan: 'Ray\'s Intellectual Arithmetic' },
    { lv: 3, age: 8, strand: 'Numbers', name: 'Tables of 6, 7, 8 and 9', steps: ['t6','t7','t8','t9'] },
    { lv: 3, age: 8, strand: 'Numbers', name: 'Division with remainder; × and ÷ up to 3 digits by 1 digit', steps: [], mt: ['p3muldiv'], plan: 'Ray\'s Intellectual Arithmetic' },
    { lv: 3, age: 8, strand: 'Fractions', name: 'Equivalent fractions; simplest form; related fractions', steps: [], mt: ['p3equiv','p3fadd'], plan: 'Ray\'s Intellectual Arithmetic' },
    { lv: 3, age: 8, strand: 'Money', name: 'Adding and subtracting money in decimals', steps: [], plan: 'Ray\'s Intellectual Arithmetic' },
    { lv: 3, age: 8, strand: 'Measurement', name: 'Compound units (km, m, cm, kg, g, ℓ, ml)', steps: [], mt: ['p3units'], plan: 'MOE add-in, measured by hand' },
    { lv: 3, age: 8, strand: 'Measurement', name: 'Time: seconds, durations, 24-hour clock', steps: [], mt: ['p3time'], plan: 'MOE add-in' },
    { lv: 3, age: 8, strand: 'Geometry', name: 'Area and perimeter of rectangles and squares', steps: [], mt: ['p3area'], plan: 'Hall & Stevens, experimental geometry (contents to check)' },
    { lv: 3, age: 8, strand: 'Geometry', name: 'Angles; perpendicular and parallel lines', steps: [], plan: 'Hall & Stevens, experimental geometry (contents to check)' },
    { lv: 3, age: 8, strand: 'Statistics', name: 'Bar graphs', steps: [], plan: 'MOE add-in' },

    { lv: 4, age: 9, strand: 'Numbers', name: 'Numbers up to 100 000; rounding; ≈', steps: [], mt: ['p4round'], plan: 'Ray\'s Intellectual Arithmetic' },
    { lv: 4, age: 9, strand: 'Numbers', name: 'Factors and multiples', steps: [], mt: ['p4factors'], plan: 'Ray\'s Practical Arithmetic (factors)' },
    { lv: 4, age: 9, strand: 'Numbers', name: 'Multiplication and division algorithms (up to 4 digits)', steps: [], mt: ['p4mul'], plan: 'Ray\'s Intellectual Arithmetic' },
    { lv: 4, age: 9, strand: 'Fractions', name: 'Mixed numbers and improper fractions; fraction of a set; unlike fractions', steps: [], mt: ['p4mixed','p4fset','p4funlike'], plan: 'Ray\'s Intellectual Arithmetic' },
    { lv: 4, age: 9, strand: 'Decimals', name: 'Decimals to 3 places; the four operations with decimals', steps: [], mt: ['p4decplace','p4decops'], plan: 'Ray\'s Practical Arithmetic' },
    { lv: 4, age: 9, strand: 'Geometry', name: 'Area and perimeter: missing sides, composite figures', steps: [], mt: ['p4rect'], plan: 'Hall & Stevens, experimental geometry (contents to check)' },
    { lv: 4, age: 9, strand: 'Geometry', name: 'Measuring and drawing angles in degrees', steps: [], mt: ['p4angle'], plan: 'Hall & Stevens, experimental geometry (contents to check)' },
    { lv: 4, age: 9, strand: 'Geometry', name: 'Rectangle and square properties; line symmetry', steps: [], plan: 'Hall & Stevens (contents to check), or MOE add-in' },
    { lv: 4, age: 9, strand: 'Geometry', name: 'Nets of solids; 2D drawings of solids', steps: [], plan: 'MOE add-in, with paper models' },
    { lv: 4, age: 9, strand: 'Statistics', name: 'Tables, line graphs and pie charts', steps: [], plan: 'MOE add-in' },

    { lv: 5, age: 10, strand: 'Numbers', name: 'Numbers up to 10 million', steps: [], plan: 'Ray\'s Practical Arithmetic' },
    { lv: 5, age: 10, strand: 'Numbers', name: 'Order of operations and brackets; × and ÷ by 10, 100, 1000', steps: [], mt: ['p5order','p5tens'], plan: 'Ray\'s Practical Arithmetic' },
    { lv: 5, age: 10, strand: 'Fractions', name: 'Division as a fraction; mixed numbers; multiplying fractions', steps: [], mt: ['p5fquot','p5fmixed','p5fmul'], plan: 'Ray\'s Practical Arithmetic' },
    { lv: 5, age: 10, strand: 'Decimals', name: 'Decimals × and ÷ by 10, 100, 1000; unit conversions', steps: [], mt: ['p5decten'], plan: 'Ray\'s Practical Arithmetic' },
    { lv: 5, age: 10, strand: 'Percentage', name: 'Percentage; discount, GST and annual interest', steps: [], mt: ['p5pct'], plan: 'Ray\'s Practical Arithmetic (percentage, interest, discount, taxes)' },
    { lv: 5, age: 10, strand: 'Rate', name: 'Rate', steps: [], mt: ['p5rate'], plan: 'Ray\'s Practical Arithmetic (ratio and proportion)' },
    { lv: 5, age: 10, strand: 'Geometry', name: 'Area of triangles and composite figures', steps: [], mt: ['p5tri'], plan: 'Hall & Stevens (contents to check)' },
    { lv: 5, age: 10, strand: 'Geometry', name: 'Volume of cubes, cuboids and tanks; cubes on isometric grid', steps: [], mt: ['p5vol'], plan: 'MOE add-in, building with unit cubes',
      part: 'The trainer practises volume; building with cubes and isometric drawing are not built yet.' },
    { lv: 5, age: 10, strand: 'Geometry', name: 'Angle rules; triangles; parallelogram, rhombus, trapezium', steps: [], mt: ['p5angles'], plan: 'Hall & Stevens, A School Geometry' },

    { lv: 6, age: 11, strand: 'Fractions', name: 'Dividing fractions', steps: [], mt: ['p6fdiv'], plan: 'Ray\'s Practical Arithmetic' },
    { lv: 6, age: 11, strand: 'Percentage', name: 'Finding the whole; percentage increase and decrease', steps: [], mt: ['p6pct'], plan: 'Ray\'s Practical Arithmetic' },
    { lv: 6, age: 11, strand: 'Ratio', name: 'Ratio', steps: [], mt: ['p6ratio'], plan: 'Ray\'s Practical Arithmetic (ratio and proportion)' },
    { lv: 6, age: 11, strand: 'Algebra', name: 'Algebra: expressions and simple equations', steps: [], mt: ['p6alg'], plan: 'Hall & Knight, Elementary Algebra (first chapters)' },
    { lv: 6, age: 11, strand: 'Geometry', name: 'Circles, semicircles and quarter circles', steps: [], mt: ['p6circle'], plan: 'Hall & Stevens (contents to check)' },
    { lv: 6, age: 11, strand: 'Geometry', name: 'Volume: finding a missing measurement', steps: [], mt: ['p6vol'], plan: 'Ray\'s Practical Arithmetic (measurement)' },
    { lv: 6, age: 11, strand: 'Geometry', name: 'Unknown angles in composite figures (special quadrilaterals)', steps: [], plan: 'Hall & Stevens, A School Geometry' },
    { lv: 6, age: 11, strand: 'Statistics', name: 'Average', steps: [], mt: ['p6avg'], plan: 'MOE add-in' }
  ];

  // Clean any sum whose answer the code could not fix (null) out of the set.
  function sumsFor(s) { return s.sums ? s.sums().filter(function (x) { return x && x[1] !== null && x[1] !== undefined; }) : []; }

  window.SDNumber = { steps: STEPS, sumsFor: sumsFor, scope: SCOPE,
    source: 'Irene Stephens, The Teaching of Mathematics to Young Children (1911), written under Charlotte Mason’s supervision' };
})();
