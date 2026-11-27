/* Lessons for the maths book, written to the child. Each lesson teaches one idea the Charlotte Mason way: something to do
   with her hands, a question to think about before the answer is given, the rule she has just found, and a few
   questions to try. The method of each comes from the book named in its "src" (Stephens, Ray's, Hall & Stevens,
   Hall & Knight); every "try" answer was checked by calculation. Keyed by the step id in number.js. */
window.SDLessons = {
"p6fdiv": [
{
"title": "A fraction shared by a whole number",
"need": "A strip of paper, a pencil",
"read": [
"Three quarters of a cake are left, and three of you want it. How much does each person get? You can find out without any rule at all.",
{
"do": "Fold your strip in half, then in half again, so it has four equal parts. Shade three of them: that is 3/4. Now share the three shaded parts between three people."
},
{
"ask": "How much does each person get?",
"then": "One quarter each. 3/4 ÷ 3 = 1/4. You divided the top number, 3, by 3, and the quarters stayed quarters."
},
"Now share 1/2 between 3 people. This time the top number is 1, and 1 will not divide by 3.",
{
"do": "Take a fresh strip, fold it in half, and fold the half into three equal small pieces."
},
{
"ask": "What is each small piece called? How many of them would fill the whole strip?",
"then": "Six of them fill the strip, so each is a sixth. 1/2 ÷ 3 = 1/6. This time you multiplied the bottom number by 3."
},
{
"rule": "To divide a fraction by a whole number: divide the top number if you can; if not, multiply the bottom number."
},
{
"ex": [
"4/5 ÷ 2 = 2/5   (4 divides by 2)",
"2/3 ÷ 4 = 2/12 = 1/6   (2 will not divide by 4, so multiply the bottom)"
],
"title": "Two examples"
}
],
"src": "Ray's New Practical Arithmetic (1877), Art. 119",
"tell": "With a strip in your hand, show Mum why 1/2 ÷ 3 is 1/6.",
"try": [
[
"6/7 ÷ 3",
"2/7"
],
[
"3/4 ÷ 2",
"3/8"
],
[
"8/9 ÷ 4",
"2/9"
],
[
"2/5 ÷ 3",
"2/15"
]
],
"book": [
0,
4,
10,
1,
7
]
},
{
"title": "How many fractions fit into a whole number?",
"need": "Four paper strips",
"read": [
"Dividing can mean sharing, but it can also mean asking how many times one thing fits into another. 12 ÷ 3 asks: how many threes are there in 12?",
{
"ask": "How many halves are there in 3 whole strips?",
"then": "6. Each strip holds 2 halves, and there are 3 strips: 3 × 2 = 6. So 3 ÷ 1/2 = 6."
},
{
"do": "Ray asks: at 2/3 of a cent for an apple, how many apples can be bought for 4 cents? Fold four strips into thirds. Count the thirds, then count how many pairs of thirds there are."
},
{
"ask": "How many thirds are in 4 strips? How many 2/3s?",
"then": "There are 12 thirds, and 12 thirds make 6 pairs. So 4 ÷ 2/3 = 6 apples."
},
"Look at what you did with the numbers: you multiplied 4 by the bottom number 3 to get 12 thirds, then divided by the top number 2 to get 6.",
{
"rule": "To find how many times a fraction is contained in a whole number: multiply by the bottom number, then divide by the top."
}
],
"src": "Ray's New Practical Arithmetic (1877), Art. 119",
"tell": "Tell Mum how you would find how many 3/4-metre ribbons can be cut from 6 metres, without writing anything down.",
"try": [
[
"5 ÷ 1/3",
"15"
],
[
"6 ÷ 3/4",
"8"
],
[
"4 ÷ 2/5",
"10"
],
[
"3 ÷ 3/8",
"8"
]
],
"book": [
2,
5,
8
]
},
{
"title": "A fraction divided by a fraction",
"read": [
"Here is a question that sounds hard: 2/3 ÷ 3/4. Start with easier ones and see what happens.",
{
"ask": "How many quarters are there in three quarters? (3/4 ÷ 1/4)",
"then": "3. When the bottom numbers are the same, you only need to divide the top numbers."
},
{
"ask": "What is 1/2 ÷ 1/4? Write 1/2 as quarters first.",
"then": "1/2 is 2/4, and 2/4 ÷ 1/4 = 2."
},
"So give 2/3 and 3/4 the same bottom number: 2/3 = 8/12 and 3/4 = 9/12. Now the question is 8/12 ÷ 9/12: how many 9-twelfths are there in 8-twelfths? Not even one whole one: 8/9 of one.",
{
"ex": [
"2/3 ÷ 3/4 = 8/12 ÷ 9/12 = 8/9",
"Now work out 2/3 × 4/3. It is also 8/9."
],
"title": "Look closely"
},
{
"ask": "What happened to 3/4 to make 4/3?",
"then": "It was turned upside down. That is the shortcut you have just found for yourself."
},
{
"rule": "To divide by a fraction, turn it upside down and multiply. Cancel common factors before you multiply."
}
],
"src": "Ray's New Practical Arithmetic (1877), Art. 119",
"tell": "Explain to Mum why turning the divisor upside down works, using 2/3 ÷ 3/4 and the twelfths.",
"try": [
[
"3/4 ÷ 1/4",
"3"
],
[
"1/2 ÷ 1/6",
"3"
],
[
"2/3 ÷ 3/4",
"8/9"
],
[
"5/6 ÷ 2/3",
"1 1/4"
],
[
"3/5 ÷ 9/10",
"2/3"
]
],
"book": [
22,
20,
3,
6,
9
]
},
{
"title": "Mixed numbers in division",
"read": [
"Ray asks: 6 ÷ 2 2/5. A mixed number has to be changed into its parts before you can divide by it.",
{
"ask": "How many fifths are there in 2 2/5?",
"then": "2 wholes are 10 fifths, and 2 more make 12 fifths: 2 2/5 = 12/5."
},
{
"ex": [
"6 ÷ 2 2/5 = 6 ÷ 12/5 = 6 × 5/12 = 30/12 = 2 1/2"
],
"title": "Worked through"
},
{
"ask": "Before you work out 30 ÷ 3 3/4, will the answer be more or less than 30?",
"then": "Less, because you are dividing by something bigger than 1. Checking like this catches mistakes."
},
{
"rule": "Change mixed numbers into improper fractions first; then divide as before."
}
],
"src": "Ray's New Practical Arithmetic (1877), Art. 119",
"tell": "Tell Mum how you know, before working it, whether an answer will be bigger or smaller than the number you started with.",
"try": [
[
"6 ÷ 2 2/5",
"2 1/2"
],
[
"2 1/4 ÷ 3/4",
"3"
],
[
"3 1/3 ÷ 1 2/3",
"2"
],
[
"4 1/2 ÷ 1 1/2",
"3"
]
],
"book": [
16,
17,
13,
11,
18,
14,
19,
21
]
}
],
"p6pct": [
{
"title": "Percentage increase and decrease",
"need": "Two price tags from a sale, if you have them",
"read": [
"A shop raises the price of a book from $20 to $25. It has gone up by $5. But is $5 a big rise or a small one? On a $20 book it is a lot; on a $500 bicycle it is hardly anything. So we compare the change with where we started.",
{
"rule": "Percentage change = the change ÷ the starting amount × 100."
},
{
"ex": [
"$20 → $25: the change is $5",
"5 ÷ 20 × 100 = 25%: an increase of 25%"
],
"title": "The book"
},
"Ray says the gain or loss per cent is always reckoned on the cost, that is, on the starting amount, never on the new one.",
{
"ask": "A price goes up by 50% and then comes down by 50%. Is it back where it started? Try it with $100.",
"then": "$100 goes up to $150; 50% of $150 is $75, so it comes down to $75. Not back where it started, because the second 50% is of a bigger number."
}
],
"src": "Ray's Practical Arithmetic, Arts. 243–247",
"tell": "Tell Mum why \"a 50% rise then a 50% fall\" does not bring a price back to where it started.",
"try": [
[
"A price goes from $20 to $25. What is the percentage increase?",
"25%"
],
[
"A price goes from $50 to $40. What is the percentage decrease?",
"20%"
],
[
"A plant grew from 80 cm to 100 cm. What is the percentage increase?",
"25%"
],
[
"$80 goes up by 15%. What is the new price?",
"$92"
]
]
},
{
"title": "Finding the whole",
"read": [
"Sometimes you know a part and its percentage, but not the whole. 30% of the children in a hall are 12 children: how many children are there?",
{
"ask": "If 30% is 12 children, what is 10%?",
"then": "4 children, a third of 12."
},
{
"ask": "Then what is 100%?",
"then": "40 children: ten lots of 10%."
},
{
"rule": "To find the whole, find 1% (or 10%) first, then 100%."
},
{
"ex": [
"After a 20% discount you pay $48.",
"You paid 80% of the usual price: 80% is $48",
"10% is $6, so 100% is $60. The usual price was $60."
],
"title": "A sale"
}
],
"src": "Ray's Practical Arithmetic, Arts. 243–247",
"tell": "Tell Mum how you found the usual price of the bag, and how you could check your answer.",
"try": [
[
"25% of a number is 20. What is the number?",
"80"
],
[
"40% of a sum of money is $60. What is the whole sum?",
"$150"
],
[
"15% of a number is 45. What is the number?",
"300"
],
[
"After a 20% discount, a bag costs $48. What was the usual price?",
"$60"
]
]
}
],
"p6ratio": [
{
"title": "What a ratio is",
"need": "Beads or beans in two colours",
"read": [
{
"do": "Lay out a pattern: 2 red beans, then 3 white beans. Do it again, and again."
},
"However long the row gets, for every 2 red there are 3 white. We say the ratio of red to white is 2 : 3.",
{
"ask": "After two rounds there are 4 red and 6 white. Is the pattern any different?",
"then": "No. 4 : 6 is the same ratio as 2 : 3. They are equivalent ratios, just as 4/6 is the same as 2/3."
},
{
"rule": "To write a ratio in its simplest form, divide both numbers by the same number, as far as it will go."
},
{
"ex": [
"12 : 18 → divide both by 6 → 2 : 3",
"15 : 10 → divide both by 5 → 3 : 2"
],
"title": "Simplest form"
},
"Order matters: red to white is 2 : 3, but white to red is 3 : 2."
],
"tell": "Tell Mum what \"2 : 3\" means, using the beans.",
"try": [
[
"Write 12 : 18 in its simplest form.",
"2 : 3"
],
[
"Write 15 : 10 in its simplest form.",
"3 : 2"
],
[
"Red to white beans are 2 : 3. There are 8 red beans. How many white?",
"12"
],
[
"There are 6 boys and 9 girls. Write the ratio of girls to boys in its simplest form.",
"3 : 2"
]
]
},
{
"title": "Sharing in a ratio",
"read": [
"Share 20 beans between two people in the ratio 2 : 3.",
{
"do": "Count out 20 beans. Give 2 to the first person and 3 to the second, then again, until they are gone."
},
{
"ask": "How many beans did each person get? How many beans went out in each round?",
"then": "8 and 12. Each round gave out 2 + 3 = 5 beans, so there were 20 ÷ 5 = 4 rounds."
},
{
"rule": "Add the parts of the ratio to find how many parts in all. Divide to find one part. Then multiply."
},
{
"ex": [
"$35 shared in the ratio 3 : 4",
"3 + 4 = 7 parts; one part is $35 ÷ 7 = $5",
"Shares: 3 × $5 = $15 and 4 × $5 = $20"
],
"title": "Money"
},
"A ratio can have three terms. 1 : 2 : 3 has 6 parts."
],
"tell": "Tell Mum how you would share $35 in the ratio 3 : 4 if you had no pencil.",
"try": [
[
"$35 is shared in the ratio 3 : 4. What is the larger share?",
"$20"
],
[
"45 sweets are shared in the ratio 2 : 7. What is the smaller share?",
"10"
],
[
"60 is divided in the ratio 3 : 2. What is the larger part?",
"36"
],
[
"60 is shared in the ratio 1 : 2 : 3. What is the largest share?",
"30"
]
]
},
{
"title": "Ray's proportions",
"read": [
"Ray asks: 7 is to 14 as 9 is to what number? Two ratios that are equal make a proportion.",
{
"ask": "How is 14 made from 7?",
"then": "It is twice 7. So the missing number is twice 9: 18."
},
"Ray's shop sums work the same way. If 12 yards of cloth cost $48, what do 8 yards cost?",
{
"ex": [
"12 yards cost $48",
"1 yard costs $48 ÷ 12 = $4",
"8 yards cost 8 × $4 = $32"
],
"title": "Find one first"
},
{
"rule": "When it is not easy to see, find the cost of one, then of as many as you want."
}
],
"src": "Ray's Practical Arithmetic, Arts. 202–203",
"tell": "Tell Mum the \"find one first\" way, with a shopping example of your own.",
"try": [
[
"5 is to 7 as 10 is to what number?",
"14"
],
[
"If 12 yards cost $48, what will 8 yards cost?",
"$32"
],
[
"3 pens cost $4.50. What do 7 pens cost?",
"$10.50"
],
[
"4 is to 10 as 6 is to what number?",
"15"
]
]
}
],
"p6alg": [
{
"title": "Letters for numbers",
"need": "A small bag and some beans",
"read": [
{
"story": [
"About 1,200 years ago, a scholar in Baghdad named al-Khwarizmi wrote a book on solving problems with an unknown number. One word in its title, al-jabr, gave us our word \"algebra\"."
]
},
{
"do": "Put some beans in a bag without counting them, and close it. Put 3 loose beans beside it."
},
"Nobody knows how many beans are in the bag, so call that number n. The bag and the loose beans are n + 3 beans. Two such bags and 3 loose beans are 2n + 3.",
"Hall & Knight explain the writing: 2n means 2 × n; ab means a × b. The 2 in 2n is called the coefficient. Do not mix up 3a, which is a + a + a, with a³, which is a × a × a.",
{
"ex": [
"If n = 5:",
"2n + 3 = 2 × 5 + 3 = 13"
],
"title": "Substitution: give the letter its number"
},
{
"rule": "A term with a nought in it is nought: if d = 0, then 9d = 0."
}
],
"src": "Hall & Knight, Elementary Algebra for Schools, Ch. I–II",
"tell": "Tell Mum what n stands for in \"2n + 3\", using the bags of beans.",
"try": [
[
"If n = 5, find 2n + 3.",
"13"
],
[
"If a = 4, find 3a.",
"12"
],
[
"If a = 2 and b = 3, find ab + a.",
"8"
],
[
"If n = 3, find 4n − 5.",
"7"
],
[
"If a = 2, b = 3, c = 1, d = 0, find 6a + 5b − 8c + 9d.",
"19"
]
]
},
{
"title": "Adding like terms",
"read": [
"Five bags and seven more bags of the same kind are twelve bags: 5n + 7n = 12n. Hall & Knight call 5n and 7n like terms.",
"Bags and loose beans are not alike, so they stay apart: 3n + 2 + n + 4 = 4n + 6.",
{
"ask": "Why can you not add 4n + 6 to make 10n?",
"then": "Because 6 loose beans are not 6 bags. You do not know how many beans a bag holds."
},
{
"rule": "Add or take away like terms only; letters and plain numbers stay separate."
}
],
"src": "Hall & Knight, Elementary Algebra for Schools, Ch. II",
"tell": "Tell Mum which terms in 3n + 2 + n + 4 can be added, and why.",
"try": [
[
"Simplify 3n + 2 + n + 4, then find its value when n = 5.",
"26"
],
[
"Simplify 2a + 3a, then find its value when a = 7.",
"35"
],
[
"Simplify 6k − 2k + 5, then find its value when k = 3.",
"17"
]
]
},
{
"title": "Equations",
"read": [
"An equation says two things are equal, like a balance with the same weight on each side. 2x + 5 = 17 is true for only one value of x.",
"Hall & Knight's rule: any term may be moved to the other side of the equation by changing its sign. Taking 5 from both sides of the balance is the same as moving + 5 across as − 5.",
{
"ex": [
"2x + 5 = 17",
"2x = 17 − 5 = 12",
"x = 6",
"Check: 2 × 6 + 5 = 17 ✓"
],
"title": "Solve, then check"
},
{
"ex": [
"3x + 15 = x + 25",
"3x − x = 25 − 15",
"2x = 10, so x = 5",
"Check: 3 × 5 + 15 = 30 and 5 + 25 = 30 ✓"
],
"title": "Hall & Knight, Examples VII, no. 1"
},
{
"rule": "Always put your answer back into both sides to check it."
}
],
"src": "Hall & Knight, Elementary Algebra for Schools, Ch. VIII–IX",
"tell": "Solve 2x + 5 = 17 out loud for Mum and show her how you checked it.",
"try": [
[
"Solve x + 7 = 15.",
"x = 8"
],
[
"Solve 3x = 21.",
"x = 7"
],
[
"Solve 2x + 5 = 17.",
"x = 6"
],
[
"Solve 3x + 15 = x + 25.",
"x = 5"
]
]
}
],
"p6circle": [
{
"title": "Round things and π",
"need": "Compasses, string, a ruler, three round tins or plates",
"read": [
{
"do": "Draw a circle with compasses. Draw several lines from the centre to the edge and measure them."
},
"Every one is the same length: that length is the radius. A line straight across through the centre is the diameter, two radii long. The distance all the way round is the circumference.",
{
"do": "Wrap string once round a tin, mark it, and measure the string. Measure the tin straight across. Divide the first by the second. Do the same with two more round things."
},
{
"ask": "What did you get each time?",
"then": "A little over 3 every time, whatever the size. This number is called π (pi). It is about 3.14, or about 22/7."
},
{
"story": [
"More than 2,000 years ago Archimedes of Syracuse showed that π lies between 3 10/71 and 3 1/7, by fitting shapes with many straight sides inside and outside a circle."
]
},
{
"rule": "Circumference = π × diameter."
}
],
"src": "Hall & Stevens, Ch. IV; Ray's Practical Arithmetic, Art. 315",
"tell": "Tell Mum what you found with the string and the tins, and what π is.",
"try": [
[
"A circle has a diameter of 10 cm. Find its circumference. (π = 3.14)",
"31.4 cm"
],
[
"A circle has a radius of 7 cm. Find its circumference. (π = 22/7)",
"44 cm"
],
[
"A wheel has a diameter of 20 cm. How far does it roll in one turn? (π = 3.14)",
"62.8 cm"
]
]
},
{
"title": "The area of a circle",
"need": "A paper circle, scissors",
"read": [
{
"do": "Fold a paper circle in half, then in quarters, then eighths, then sixteenths. Open it and cut along the folds. Lay the slices in a row, points up and points down in turn, pushed together."
},
{
"ask": "What shape do they nearly make?",
"then": "Nearly a rectangle. Its height is the radius. Its length is half the circumference, half of π × diameter, which is π × radius."
},
"So the area is length × height = π × radius × radius.",
{
"rule": "Area of a circle = π × radius × radius."
},
{
"ex": [
"Radius 10 cm, π = 3.14",
"3.14 × 10 × 10 = 314 cm²"
],
"title": "For example"
}
],
"src": "Ray's Practical Arithmetic, Art. 317",
"tell": "Tell Mum how the cut-up circle shows that the area is π × radius × radius.",
"try": [
[
"Find the area of a circle of radius 10 cm. (π = 3.14)",
"314 cm²"
],
[
"Find the area of a circle of radius 7 cm. (π = 22/7)",
"154 cm²"
],
[
"Find the area of a semicircle of radius 14 cm. (π = 22/7)",
"308 cm²"
],
[
"Find the area of a quarter circle of radius 10 cm. (π = 3.14)",
"78.5 cm²"
]
]
},
{
"title": "Semicircles and quarter circles",
"read": [
"A semicircle is half a circle. Its curved edge is half the circumference. But its perimeter, the whole way round, also has the straight edge across, the diameter.",
{
"ex": [
"Semicircle with diameter 14 cm, π = 22/7",
"curved edge: 22/7 × 14 ÷ 2 = 22 cm",
"perimeter: 22 + 14 = 36 cm"
],
"title": "Do not forget the straight edge"
},
{
"ask": "A quarter circle has radius 7 cm. How many straight edges does it have?",
"then": "Two, each a radius long. Its perimeter is a quarter of the circumference + 7 + 7."
}
],
"tell": "Draw a quarter circle for Mum and show her every edge you have to add for its perimeter.",
"try": [
[
"Find the perimeter of a semicircle of diameter 14 cm. (π = 22/7)",
"36 cm"
],
[
"Find the perimeter of a quarter circle of radius 7 cm. (π = 22/7)",
"25 cm"
],
[
"Find the perimeter of a semicircle of diameter 10 cm. (π = 3.14)",
"25.7 cm"
]
]
}
],
"p6vol": [
{
"title": "Finding a missing measurement",
"need": "Some unit cubes",
"read": [
"You know Ray's rule: volume = length × breadth × height. Turn it round and it finds a missing measurement.",
{
"do": "Build a layer of cubes 4 long and 3 wide. How many cubes in the layer? Now build up until you have 36 cubes."
},
{
"ask": "How many layers high is it?",
"then": "3 layers: 36 cubes ÷ 12 in a layer. Height = volume ÷ area of the base."
},
{
"rule": "Height = volume ÷ (length × breadth). A cube's edge is the number that, multiplied by itself three times, gives its volume."
}
],
"src": "Ray's Practical Arithmetic, Art. 320",
"tell": "Tell Mum how you would find the height of a box if you knew its volume and its base.",
"try": [
[
"A box has a volume of 240 cm³. Its base is 8 cm by 6 cm. How high is it?",
"5 cm"
],
[
"A cube has a volume of 64 cm³. How long is each edge?",
"4 cm"
],
[
"A cuboid has a volume of 360 cm³, length 10 cm and height 4 cm. What is its breadth?",
"9 cm"
]
]
},
{
"title": "Water in tanks",
"need": "A rectangular container, a measuring jug, a ruler",
"read": [
"A cube 10 cm each way holds exactly 1 litre. So 1 litre = 1000 cm³, and 1 ml = 1 cm³.",
{
"do": "Measure the inside of your container. Pour in 500 ml of water and measure how deep it is. Work out the volume from the depth and check it against the jug."
},
{
"ex": [
"A tank 30 cm by 20 cm holds 12 litres of water.",
"12 litres = 12 000 cm³",
"depth = 12 000 ÷ (30 × 20) = 20 cm"
],
"title": "How deep is the water?"
}
],
"tell": "Tell Mum how many cm³ make a litre, and how you know.",
"try": [
[
"A tank 50 cm by 40 cm has water 30 cm deep. How many litres of water are in it?",
"60"
],
[
"A tank 30 cm by 20 cm holds 12 litres. How deep is the water, in cm?",
"20 cm"
],
[
"2 litres of water are poured into a tank with a base 20 cm by 10 cm. By how many cm does the water rise?",
"10 cm"
]
]
}
],
"p6angles": [
{
"title": "Parallel lines and the angles they make",
"need": "Ruler, set square, tracing paper, protractor",
"read": [
{
"do": "Hall & Stevens: draw two parallel lines with your set square and ruler, then a line crossing both. Number the eight angles. Trace one angle and slide the tracing to see which others it fits exactly."
},
{
"ask": "Which angles are equal?",
"then": "The angles in matching positions at each crossing (corresponding angles), and the angles on opposite sides of the crossing line between the parallels (alternate angles, the Z shape)."
},
{
"ask": "The two angles between the parallels on the same side: what do they add up to?",
"then": "180°. They make a C or U shape."
},
{
"rule": "Corresponding angles are equal; alternate angles are equal; the angles between the parallels on the same side add up to 180°."
}
],
"src": "Hall & Stevens, Ch. VII",
"tell": "Draw the Z and the C shapes for Mum and say which angles are equal and which add up to 180°.",
"try": [
[
"A line crosses two parallel lines making an angle of 57°. What is the alternate angle?",
"57°"
],
[
"The same line: what is the angle between the parallels on the same side as the 57° angle?",
"123°"
],
[
"A line crosses two parallels making an angle of 117°. What is the corresponding angle?",
"117°"
]
]
},
{
"title": "Reasoning step by step",
"read": [
"In a figure, you rarely find an angle in one go. You find one you can, then use it to find the next, giving a reason each time, the way Euclid wrote his proofs.",
{
"rule": "Angles on a line: 180°. Angles at a point: 360°. Angles in a triangle: 180°. Opposite angles of a parallelogram are equal; angles next to each other in it add to 180°."
},
{
"ex": [
"An isosceles triangle has 40° at the top.",
"The other two angles share 180° − 40° = 140°, and they are equal.",
"Each is 70°."
],
"title": "One step at a time"
}
],
"tell": "Find an angle for Mum and give your reason at every step.",
"try": [
[
"An isosceles triangle has an angle of 40° at its top. What is each base angle?",
"70°"
],
[
"A parallelogram has an angle of 65°. What is the angle next to it?",
"115°"
],
[
"Three angles at a point are 100°, 120° and 90°. What is the fourth?",
"50°"
],
[
"A right-angled triangle has an angle of 35°. What is the third angle?",
"55°"
]
]
}
],
"p6avg": [
{
"title": "What an average is",
"need": "Some unit cubes or coins",
"read": [
{
"do": "Build three towers of cubes: 3, 5 and 7 high. Now move cubes from tall towers to short ones until all three are the same height."
},
{
"ask": "How high is each tower now?",
"then": "5. Nothing was added or taken away; the 15 cubes were just shared out evenly. 5 is the average."
},
{
"rule": "Average = total ÷ number of items."
},
"Ray uses averages to price a mixture: 4 lb of tea at 40 cents and 6 lb at 50 cents make 10 lb that cost $4.60 in all, so the mixture is worth 46 cents a pound."
],
"src": "Ray's Practical Arithmetic, Art. 260",
"tell": "Show Mum with the towers what an average is.",
"try": [
[
"Find the average of 4, 6, 8 and 10.",
"7"
],
[
"Find the average of 12, 15 and 18.",
"15"
],
[
"Find the average of 3 kg, 5 kg, 6 kg and 10 kg.",
"6 kg"
]
]
},
{
"title": "Using the average backwards",
"read": [
"If you know the average and how many items there are, you know the total: total = average × number of items.",
{
"ex": [
"The average of 4 numbers is 15, so their total is 60.",
"A fifth number, 20, is added: the total is 80.",
"The new average is 80 ÷ 5 = 16."
],
"title": "A new number joins"
},
{
"ask": "Your average for 3 tests is 80. What must you score on the 4th to make your average 82?",
"then": "You need a total of 82 × 4 = 328. You have 240, so you need 88."
}
],
"tell": "Tell Mum why knowing an average tells you the total, too.",
"try": [
[
"The average of 5 numbers is 8. What is their total?",
"40"
],
[
"The average of 4 numbers is 15. A fifth number, 20, is added. What is the new average?",
"16"
],
[
"Your average over 3 tests is 80. What must you score on the 4th test to make the average 82?",
"88"
]
]
}
],
"p5num": [
{
"title": "Numbers to ten million",
"need": "A place-value chart with a millions period",
"read": [
"Ray's way to read a long number: point it off into groups of three from the right. The groups are called periods: units, thousands, millions.",
{
"ex": [
"4050607 → 4 | 050 | 607",
"four million, fifty thousand, six hundred and seven"
],
"title": "Read each period, then say its name"
},
{
"do": "Find a big number in real life: Singapore's population, or the distance to the Moon in kilometres. Write it with its periods and read it aloud."
},
{
"rule": "Each place is worth ten times the place on its right."
}
],
"src": "Ray's Practical Arithmetic, Art. 13",
"tell": "Read a seven-figure number to Mum and tell her how the periods help.",
"try": [
[
"Write four million fifty thousand six hundred and seven in figures.",
"4050607"
],
[
"What is the value of the 7 in 7406035?",
"7000000"
],
[
"Write one million thirty thousand in figures.",
"1030000"
],
[
"What number is 100 000 more than 2 950 000?",
"3050000"
]
]
}
],
"p5order": [
{
"title": "Which comes first?",
"read": [
"2 + 3 × 4: is it 20 or 14? Mathematicians agreed long ago on an order, so that everyone gets the same answer.",
{
"rule": "Brackets first. Then × and ÷ from left to right. Then + and − from left to right."
},
{
"ex": [
"2 + 3 × 4 = 2 + 12 = 14",
"(2 + 3) × 4 = 5 × 4 = 20"
],
"title": "The brackets change it"
},
{
"ask": "Make up a story for each: one where you buy 2 apples and 3 bags of 4 oranges; one where 2 boys and 3 girls each get 4 sweets.",
"then": "The first is 2 + 3 × 4 = 14 pieces of fruit. The second is (2 + 3) × 4 = 20 sweets."
}
],
"tell": "Tell Mum the order and make up a number story for (2 + 3) × 4.",
"try": [
[
"2 + 3 × 4",
"14"
],
[
"(2 + 3) × 4",
"20"
],
[
"20 − 12 ÷ 4",
"17"
],
[
"(20 − 12) ÷ 4",
"2"
],
[
"6 × 5 − 4 × 3",
"18"
]
]
}
],
"p5tens": [
{
"title": "Multiplying and dividing by 10, 100 and 1000",
"need": "A place-value chart, a metre rule",
"read": [
"Multiply 2.07 by 10 and every digit moves one place to the left, becoming ten times bigger: 20.7. Ray puts it as moving the point one place to the right for each nought.",
{
"rule": "To multiply by 10, 100 or 1000, move the point 1, 2 or 3 places right. To divide, move it left, putting noughts in front where needed."
},
{
"ex": [
"18.3 ÷ 100 = 0.183",
"0.6 × 1000 = 600",
"× 300 is × 3, then × 100"
],
"title": "Examples"
},
{
"do": "On the metre rule: 1 m = 100 cm, so 4.5 m = 450 cm. And 1 kg = 1000 g, so 1.25 kg = 1250 g."
}
],
"src": "Ray's Practical Arithmetic, Arts. 182–184",
"tell": "Tell Mum how you change 2.5 km into metres, and why it works.",
"try": [
[
"2.07 × 10",
"20.7"
],
[
"18.3 ÷ 100",
"0.183"
],
[
"4.5 m in cm",
"450 cm"
],
[
"1250 g in kg",
"1.25 kg"
],
[
"0.36 × 300",
"108"
]
]
}
],
"p5fdiv": [
{
"title": "A fraction is a division",
"need": "3 paper circles",
"read": [
{
"do": "Share 3 paper circles between 4 people. Cut each circle into quarters and give out the pieces."
},
{
"ask": "How much does each person get?",
"then": "3 quarters: 3/4. So 3 ÷ 4 = 3/4. A fraction is a division that has not been done yet."
},
"So to change a fraction into a decimal, Ray says: put noughts after the top number and divide by the bottom number.",
{
"ex": [
"1/8 = 1 ÷ 8 = 1.000 ÷ 8 = 0.125"
],
"title": "Fraction to decimal"
}
],
"src": "Ray's Practical Arithmetic, Arts. 158a, 185",
"tell": "Show Mum with the circles why 3 ÷ 4 is 3/4.",
"try": [
[
"Share 3 cakes equally among 4 children. How much does each get?",
"3/4"
],
[
"Change 1/8 to a decimal.",
"0.125"
],
[
"Change 3/5 to a decimal.",
"0.6"
],
[
"7 ÷ 2 as a mixed number",
"3 1/2"
]
]
}
],
"p5fmix": [
{
"title": "Adding and subtracting mixed numbers",
"need": "Paper strips",
"read": [
"Ray adds mixed numbers in two parts: the whole numbers, then the fractions, then puts them together.",
{
"ex": [
"2 1/2 + 3 2/3",
"wholes: 2 + 3 = 5",
"fractions: 1/2 + 2/3 = 3/6 + 4/6 = 7/6 = 1 1/6",
"together: 6 1/6"
],
"title": "Ray's own example"
},
"Subtracting can need borrowing: 3 1/8 − 1 3/8. You cannot take 3/8 from 1/8, so change one of the 3 wholes into eighths.",
{
"ex": [
"3 1/8 = 2 + 8/8 + 1/8 = 2 9/8",
"2 9/8 − 1 3/8 = 1 6/8 = 1 3/4"
],
"title": "Borrowing a whole"
},
{
"do": "Show 3 1/8 with strips: three whole strips, one with only an eighth shaded. Cut one whole strip into eighths to take away 3/8."
}
],
"src": "Ray's New Practical Arithmetic (1877), Arts. 111, 113–114",
"tell": "Tell Mum how you borrow a whole when the fraction you are taking away is bigger.",
"try": [
[
"2 1/2 + 3 2/3",
"6 1/6"
],
[
"3 1/8 − 1 3/8",
"1 3/4"
],
[
"4 1/4 − 2 3/4",
"1 1/2"
],
[
"1 3/4 + 2 1/3",
"4 1/12"
]
]
}
],
"p5fmul": [
{
"title": "A fraction times a whole number",
"read": [
"Ray: if an apple costs 4/5 of a cent, 3 apples cost 3 times as much: 12/5 = 2 2/5 cents. Multiplying a fraction by a whole number repeats it.",
"And 2/5 of 12 cents takes only part of 12: divide by 5 for one fifth, then multiply by 2.",
{
"rule": "Fraction × whole number: multiply the top number. \"2/5 of 12\": divide by the bottom, multiply by the top."
},
{
"ex": [
"3/4 × 3 = 9/4 = 2 1/4",
"2/3 of 9 = 9 ÷ 3 × 2 = 6"
],
"title": "Examples"
}
],
"src": "Ray's New Practical Arithmetic (1877), Arts. 115–116",
"tell": "Tell Mum the difference between 3 × 2/5 and 2/5 of 3.",
"try": [
[
"If 1 apple costs 4/5 of a cent, what do 3 apples cost?",
"2 2/5"
],
[
"3/4 × 3",
"2 1/4"
],
[
"2/3 of 9",
"6"
],
[
"5/6 of 12",
"10"
]
]
},
{
"title": "A fraction of a fraction",
"need": "Squared paper, coloured pencils",
"read": [
{
"do": "Draw a rectangle 4 squares wide and 3 high. Shade 3/4 of it with upright stripes. Now shade 2/3 of the striped part with crossways stripes."
},
{
"ask": "How much of the whole rectangle is shaded both ways?",
"then": "6 squares out of 12: 6/12 = 1/2. And 2/3 × 3/4 = 6/12 too."
},
{
"rule": "Fraction × fraction: multiply the tops together and the bottoms together. Change mixed numbers to improper fractions first, and cancel before you multiply."
},
{
"ex": [
"2 1/4 × 3 1/2 = 9/4 × 7/2 = 63/8 = 7 7/8"
],
"title": "Ray, with mixed numbers"
}
],
"src": "Ray's New Practical Arithmetic (1877), Arts. 115, 117",
"tell": "Show Mum your squared-paper drawing of 2/3 of 3/4.",
"try": [
[
"2/3 × 4/5",
"8/15"
],
[
"3/4 × 5/7",
"15/28"
],
[
"8/9 × 3/4",
"2/3"
],
[
"2 1/4 × 3 1/2",
"7 7/8"
]
]
}
],
"p5pct": [
{
"title": "Per cent means \"out of a hundred\"",
"need": "Squared paper, a pencil",
"read": [
"Per cent comes from the Latin per centum, \"by the hundred\". 25% means 25 out of every 100.",
{
"do": "Draw a 10 × 10 square on squared paper: 100 small squares. Shade 25 of them. What fraction of the square is that? Shade 50, then 10."
},
"Ray: a per cent of a number is so many hundredths of it. 7% is 0.07, so 7% of $175 is 175 × 0.07 = $12.25.",
{
"rule": "To find what per cent one number is of another: divide the part by the whole and multiply by 100."
},
{
"ex": [
"9 out of 36 children are absent",
"9 ÷ 36 × 100 = 25%"
],
"title": "Ray's school"
}
],
"src": "Ray's Practical Arithmetic, Arts. 209–211; Ray's New Intellectual Arithmetic, Lesson LXVII",
"tell": "Tell Mum what 25% means, using your hundred-square.",
"try": [
[
"What is 25% as a fraction in its simplest form?",
"1/4"
],
[
"Find 10% of $80.",
"$8"
],
[
"Find 7% of $175.",
"$12.25"
],
[
"2 is what per cent of 5?",
"40%"
],
[
"9 out of 36 children are absent. What per cent is absent?",
"25%"
]
]
}
],
"p5interest": [
{
"title": "Discount, GST and interest",
"need": "A shop receipt that shows GST",
"read": [
"A discount is a per cent taken off a price. GST is a per cent added on. Before you work out either, ask: a per cent of what?",
{
"do": "Look at a real receipt. Find the GST. Work out what per cent it is of the price before tax."
},
"Interest is money paid for the use of money. Ray: interest = the principal × the rate × the number of years.",
{
"ex": [
"$300 for 2 years at 6% a year",
"300 × 0.06 = $18 a year",
"$18 × 2 = $36"
],
"title": "Simple interest"
}
],
"src": "Ray's Practical Arithmetic, Arts. 222, 250",
"tell": "Tell Mum the difference between a discount and GST, using a receipt.",
"try": [
[
"A $60 dress is sold at a 20% discount. How much is the discount?",
"$12"
],
[
"A $60 dress is sold at a 20% discount. What is the sale price?",
"$48"
],
[
"Find the interest on $300 for 2 years at 6% a year.",
"$36"
],
[
"A meal costs $50 before 9% GST. How much is the GST?",
"$4.50"
]
]
}
],
"p5rate": [
{
"title": "Rate: how much for each one",
"need": "Two packets of the same food in different sizes",
"read": [
"A rate tells how much of one thing goes with each one of another: $3 per kg, 60 km per hour, 5 pages a day.",
"Ray solved these by proportion. The simplest way is to find the amount for one first.",
{
"ex": [
"If 4 hats cost $14, what will 10 hats cost?",
"1 hat costs $14 ÷ 4 = $3.50",
"10 hats cost $35"
],
"title": "Ray's hats"
},
{
"do": "Compare two packets in the kitchen by their price per 100 g. Which is better value?"
}
],
"src": "Ray's Practical Arithmetic, Arts. 201–203",
"tell": "Tell Mum which packet was better value, and how you knew.",
"try": [
[
"If 2 lb of tea cost $4, what will 6 lb cost?",
"$12"
],
[
"If 4 hats cost $14, what will 10 hats cost?",
"$35"
],
[
"A car goes 180 km in 3 hours. How far does it go in 1 hour?",
"60 km"
],
[
"Rice costs $3 per kg. How much do 5 kg cost?",
"$15"
]
]
}
],
"p5tri": [
{
"title": "The area of a triangle",
"need": "Squared paper, scissors, ruler, set square",
"read": [
{
"do": "Hall & Stevens: draw a parallelogram on squared paper and cut it out. Cut a triangle off one end and fit it on the other end."
},
{
"ask": "What shape do you have now?",
"then": "A rectangle with the same base and the same height. So a parallelogram's area is base × height."
},
{
"do": "Cut another parallelogram along a diagonal. Lay one triangle on the other."
},
{
"ask": "How do the two triangles compare?",
"then": "They are exactly the same, so each is half the parallelogram."
},
{
"rule": "Area of a triangle = 1/2 × base × height. The height is measured square to the base."
}
],
"src": "Hall & Stevens, Ch. XII; Ray's Practical Arithmetic, Art. 313",
"tell": "Show Mum with your paper cut-outs why a triangle is half of base × height.",
"try": [
[
"A triangle has a base of 8 cm and a height of 5 cm. Find its area.",
"20 cm²"
],
[
"A right-angled triangle has sides of 3 cm and 2 cm next to the right angle. Find its area.",
"3 cm²"
],
[
"A triangular field has a side of 120 yards, and the opposite corner is 80 yards from that side. Find its area in square yards.",
"4800"
]
]
}
],
"p5vol": [
{
"title": "Volume: how many cubes?",
"need": "Centimetre cubes, isometric grid paper",
"read": [
{
"do": "Build a cuboid 4 cubes long, 3 wide and 2 high. Count the cubes."
},
"Each cube is 1 cubic centimetre (1 cm³). The volume of your cuboid is 24 cm³. You did not need to count every cube: one layer has 4 × 3 = 12, and there are 2 layers.",
{
"rule": "Ray's rule: volume = length × breadth × height."
},
{
"do": "Draw your cuboid on isometric grid paper."
},
"A box 10 cm each way holds exactly 1 litre of water. So 1 litre = 1000 cm³."
],
"src": "Ray's Practical Arithmetic, Art. 320",
"tell": "Tell Mum how you can find the volume without counting every cube.",
"try": [
[
"A cuboid is 4 cm long, 3 cm wide and 2 cm high. Find its volume.",
"24 cm³"
],
[
"Find the volume of a cube with edges of 5 cm.",
"125 cm³"
],
[
"How many cm³ are in 2 litres?",
"2000"
],
[
"A tank 20 cm by 10 cm is filled with water to 15 cm. How many ml of water is that?",
"3000"
]
]
}
],
"p5angles": [
{
"title": "Angles on a line and at a point",
"need": "Protractor, ruler",
"read": [
{
"do": "Hall & Stevens: draw a straight line AB and mark a point O on it. Draw a line OC. Measure angle AOC and angle BOC and add them. Try three different positions of OC."
},
{
"ask": "What do you always get?",
"then": "180°, two right angles. Angles on a straight line add up to 180°."
},
{
"do": "Draw several lines out from one point all the way round. Measure every angle and add them."
},
{
"ask": "What is the total?",
"then": "360°."
},
{
"do": "Draw two lines crossing. Measure one angle and work out the other three. Check by measuring."
},
{
"rule": "Angles on a line: 180°. Angles at a point: 360°. Vertically opposite angles are equal."
}
],
"src": "Hall & Stevens, Ch. V",
"tell": "Show Mum the three facts with your drawings.",
"try": [
[
"Two angles lie side by side on a straight line. One is 65°. What is the other?",
"115°"
],
[
"Three angles at a point are 150°, 90° and 70°. What is the fourth?",
"50°"
],
[
"Two lines cross. One angle is 40°. What is the angle opposite it?",
"40°"
]
]
}
],
"p5triangles": [
{
"title": "The angles of a triangle",
"need": "A paper triangle, protractor, ruler",
"read": [
{
"do": "Draw any triangle, measure its three angles and add them. Then tear the three corners off a paper triangle and fit them together at a point."
},
{
"ask": "What do the three corners make?",
"then": "A straight line: 180°. The three angles of every triangle add up to 180°."
},
"Triangles are named by their sides: equilateral (all three sides equal), isosceles (two equal), scalene (none equal). And by their angles: right-angled, obtuse-angled, acute-angled.",
{
"do": "Fold an isosceles triangle in half so the two equal sides meet. What do you notice about the two angles at the base?"
},
{
"rule": "The base angles of an isosceles triangle are equal. Each angle of an equilateral triangle is 60°."
}
],
"src": "Hall & Stevens, Ch. IX–X",
"tell": "Show Mum the torn corners and tell her what they prove.",
"try": [
[
"In a triangle ABC, A = 70° and C = 50°. What is B?",
"60°"
],
[
"A triangle is right-angled at A, and B = 55°. What is C?",
"35°"
],
[
"An isosceles triangle has base angles of 50° each. What is the third angle?",
"80°"
],
[
"What is each angle of an equilateral triangle?",
"60°"
]
]
}
],
"p5quad": [
{
"title": "Parallelogram, rhombus and trapezium",
"need": "Protractor, set squares, ruler",
"read": [
"Hall & Stevens: a parallelogram has both pairs of opposite sides parallel. A rhombus is a parallelogram whose sides are all equal. A trapezium has just one pair of parallel sides.",
{
"do": "Draw a parallelogram with set square and ruler. Measure all four angles."
},
{
"ask": "What do you notice?",
"then": "Opposite angles are equal, and two angles next to each other add up to 180°."
},
{
"do": "Draw a trapezium. Measure the two angles between the parallel sides on one slanting side."
},
{
"rule": "In a parallelogram, opposite angles are equal and neighbouring angles add to 180°. In a trapezium, the two angles between the parallel sides on the same side add to 180°."
}
],
"src": "Hall & Stevens, Ch. XI",
"tell": "Tell Mum how a rhombus, a parallelogram and a trapezium differ.",
"try": [
[
"A parallelogram ABCD has ∠A = 122°. What is ∠B?",
"58°"
],
[
"The same parallelogram: what is ∠C?",
"122°"
],
[
"A rhombus has one angle of 82°. What is the angle next to it?",
"98°"
],
[
"A trapezium has one angle of 70° between the parallel sides. What is the other angle on that slanting side?",
"110°"
]
]
}
]
};
