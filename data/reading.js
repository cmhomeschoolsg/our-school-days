/* Emily's reading lessons, on Charlotte Mason's plan (Home Education, Part V, §§ IV–VI).
   Each poem is learnt word by word "at sight", then by sound (word families), and only then shown and read whole.
   Poem texts are checked against the editions named in "src". Word families ("fam") are the sound lessons:
   "from" is a word in the poem, "rime" is what is left when the first letter or letters are taken away,
   and "on" are the beginnings the child puts back to make new words. */
window.READING = {
  "per": 10,
  "method": {
    "steps": [
      [
        "Warm up",
        "She reads the words she already knows as you point. Mason calls this a minute's work that \"secures the ground\"."
      ],
      [
        "Look",
        "Say the new word. She looks at it until she would know it again, then hides it."
      ],
      [
        "Build",
        "She makes the word from memory with the loose letters. She can peek if she must."
      ],
      [
        "Find",
        "She finds every copy of the word among the loose word cards."
      ],
      [
        "Read the column",
        "Each new word joins the column. She reads it down, up and in mixed order."
      ],
      [
        "Lines",
        "You say a line of the poem; she lays it out with her word cards. A counter stands in for a word she hasn't learnt yet."
      ],
      [
        "Word families",
        "On another day she builds a known word, takes off the first letter, and makes new words from what is left: coat, boat, goat."
      ],
      [
        "The poem",
        "When every word is known she lays out the whole poem, then sees it printed and reads it to you, beautifully."
      ]
    ],
    "notes": [
      "About ten new words a day is Mason's pace; stop sooner if she tires. Ten minutes to a quarter of an hour of full attention is enough.",
      "The poem stays a surprise until she has learnt all its words."
    ],
    "src": "Charlotte Mason, Home Education (1886), Part V: §IV Reading, §V The First Reading Lesson, §VI Reading by Sight and Sound, §VIII Reading for Older Children (AmblesideOnline text)."
  },
  "common": {
    "name": "Dolch sight words",
    "levels": [
      {
        "name": "Pre-primer",
        "words": [
          "a",
          "and",
          "away",
          "big",
          "blue",
          "can",
          "come",
          "down",
          "find",
          "for",
          "funny",
          "go",
          "help",
          "here",
          "I",
          "in",
          "is",
          "it",
          "jump",
          "little",
          "look",
          "make",
          "me",
          "my",
          "not",
          "one",
          "play",
          "red",
          "run",
          "said",
          "see",
          "the",
          "three",
          "to",
          "two",
          "up",
          "we",
          "where",
          "yellow",
          "you"
        ]
      },
      {
        "name": "Primer",
        "words": [
          "all",
          "am",
          "are",
          "at",
          "ate",
          "be",
          "black",
          "brown",
          "but",
          "came",
          "did",
          "do",
          "eat",
          "four",
          "get",
          "good",
          "have",
          "he",
          "into",
          "like",
          "must",
          "new",
          "no",
          "now",
          "on",
          "our",
          "out",
          "please",
          "pretty",
          "ran",
          "ride",
          "saw",
          "say",
          "she",
          "so",
          "soon",
          "that",
          "there",
          "they",
          "this",
          "too",
          "under",
          "want",
          "was",
          "well",
          "went",
          "what",
          "white",
          "who",
          "will",
          "with",
          "yes"
        ]
      },
      {
        "name": "First grade",
        "words": [
          "after",
          "again",
          "an",
          "any",
          "as",
          "ask",
          "by",
          "could",
          "every",
          "fly",
          "from",
          "give",
          "going",
          "had",
          "has",
          "her",
          "him",
          "his",
          "how",
          "just",
          "know",
          "let",
          "live",
          "may",
          "of",
          "old",
          "once",
          "open",
          "over",
          "put",
          "round",
          "some",
          "stop",
          "take",
          "thank",
          "them",
          "then",
          "think",
          "walk",
          "were",
          "when"
        ]
      },
      {
        "name": "Second grade",
        "words": [
          "always",
          "around",
          "because",
          "been",
          "before",
          "best",
          "both",
          "buy",
          "call",
          "cold",
          "does",
          "don't",
          "fast",
          "first",
          "five",
          "found",
          "gave",
          "goes",
          "green",
          "its",
          "made",
          "many",
          "off",
          "or",
          "pull",
          "read",
          "right",
          "sing",
          "sit",
          "sleep",
          "tell",
          "their",
          "these",
          "those",
          "upon",
          "us",
          "use",
          "very",
          "wash",
          "which",
          "why",
          "wish",
          "work",
          "would",
          "write",
          "your"
        ]
      },
      {
        "name": "Third grade",
        "words": [
          "about",
          "better",
          "bring",
          "carry",
          "clean",
          "cut",
          "done",
          "draw",
          "drink",
          "eight",
          "fall",
          "far",
          "full",
          "got",
          "grow",
          "hold",
          "hot",
          "hurt",
          "if",
          "keep",
          "kind",
          "laugh",
          "light",
          "long",
          "much",
          "myself",
          "never",
          "only",
          "own",
          "pick",
          "seven",
          "shall",
          "show",
          "six",
          "small",
          "start",
          "ten",
          "today",
          "together",
          "try",
          "warm"
        ]
      }
    ],
    "src": "E. W. Dolch's 220 basic sight words (1936; Problems in Reading, 1948), the commonest words in children's books, in his five levels, as listed by the University of Utah Reading Clinic. That listing prints \"where\" twice in the first-grade words; the standard list has \"were\" there, used here."
  },
  "proper": [
    "I",
    "I'm",
    "I've",
    "Johnny",
    "Jack",
    "Humpty",
    "Dumpty",
    "King's",
    "London",
    "Queen",
    "Japan",
    "Spain",
    "Tom",
    "John",
    "God",
    "Mars",
    "Sprat",
    "Nod"
  ],
  "poems": [
    {
      "id": "jack",
      "title": "Jack",
      "by": "Mother Goose",
      "text": "Jack be nimble,\nJack be quick,\nJack jump over the candlestick.",
      "fam": [
        {
          "from": "quick",
          "rime": "ick",
          "on": [
            "k",
            "p",
            "s",
            "t",
            "st",
            "br"
          ]
        },
        {
          "from": "jump",
          "rime": "ump",
          "on": [
            "b",
            "h",
            "l",
            "p",
            "st"
          ]
        }
      ],
      "src": "The Real Mother Goose (1916), Project Gutenberg #10607."
    },
    {
      "id": "rainaway",
      "title": "Rain",
      "by": "Mother Goose",
      "text": "Rain, rain, go away,\nCome again another day;\nLittle Johnny wants to play.",
      "fam": [
        {
          "from": "day",
          "rime": "ay",
          "on": [
            "h",
            "m",
            "s",
            "w",
            "st",
            "tr"
          ]
        },
        {
          "from": "rain",
          "rime": "ain",
          "on": [
            "m",
            "p",
            "g",
            "tr",
            "br"
          ]
        },
        {
          "from": "go",
          "rime": "o",
          "on": [
            "n",
            "s"
          ]
        }
      ],
      "src": "The Real Mother Goose, illustrated by Blanche Fisher Wright (1916), Project Gutenberg #10607."
    },
    {
      "id": "pease",
      "title": "Pease Porridge",
      "by": "Mother Goose",
      "text": "Pease porridge hot,\nPease porridge cold,\nPease porridge in the pot,\nNine days old.\nSome like it hot,\nSome like it cold,\nSome like it in the pot,\nNine days old.",
      "fam": [
        {
          "from": "old",
          "rime": "old",
          "on": [
            "h",
            "g",
            "t",
            "f"
          ]
        },
        {
          "from": "nine",
          "rime": "ine",
          "on": [
            "l",
            "f",
            "p",
            "sh"
          ]
        }
      ],
      "src": "The Real Mother Goose (1916), Project Gutenberg #10607."
    },
    {
      "id": "hickory",
      "title": "The Mouse and the Clock",
      "by": "Mother Goose",
      "text": "Hickory, dickory, dock!\nThe mouse ran up the clock;\nThe clock struck one,\nAnd down he run,\nHickory, dickory, dock!",
      "fam": [
        {
          "from": "clock",
          "rime": "ock",
          "on": [
            "d",
            "l",
            "r",
            "s",
            "bl"
          ]
        },
        {
          "from": "run",
          "rime": "un",
          "on": [
            "b",
            "f",
            "s",
            "sp"
          ]
        }
      ],
      "src": "The Real Mother Goose (1916), Project Gutenberg #10607."
    },
    {
      "id": "dumpling",
      "title": "Diddle Diddle Dumpling",
      "by": "Mother Goose",
      "text": "Diddle diddle dumpling, my son John\nWent to bed with his breeches on,\nOne stocking off, and one stocking on;\nDiddle diddle dumpling, my son John.",
      "fam": [
        {
          "from": "went",
          "rime": "ent",
          "on": [
            "b",
            "s",
            "t",
            "d"
          ]
        }
      ],
      "src": "The Real Mother Goose (1916), Project Gutenberg #10607."
    },
    {
      "id": "pancake",
      "title": "Mix a pancake",
      "by": "Christina Rossetti",
      "text": "Mix a pancake,\nStir a pancake,\nPop it in the pan;\nFry the pancake,\nToss the pancake,—\nCatch it if you can.",
      "fam": [
        {
          "from": "pan",
          "rime": "an",
          "on": [
            "c",
            "f",
            "m",
            "r",
            "v",
            "t"
          ]
        },
        {
          "from": "pop",
          "rime": "op",
          "on": [
            "h",
            "m",
            "t",
            "st",
            "sh"
          ]
        }
      ],
      "src": "Sing-Song: A Nursery Rhyme Book (1893), Project Gutenberg #76703."
    },
    {
      "id": "happy",
      "title": "Happy Thought",
      "by": "Robert Louis Stevenson",
      "text": "The world is so full of a number of things,\nI'm sure we should all be as happy as kings.",
      "fam": [
        {
          "from": "kings",
          "rime": "ings",
          "on": [
            "r",
            "s",
            "w",
            "th",
            "br"
          ]
        },
        {
          "from": "all",
          "rime": "all",
          "on": [
            "b",
            "c",
            "f",
            "h",
            "t",
            "w"
          ]
        }
      ],
      "src": "A Child's Garden of Verses (1885), Project Gutenberg #25617."
    },
    {
      "id": "sprat",
      "title": "Jack Sprat",
      "by": "Mother Goose",
      "text": "Jack Sprat\nCould eat no fat,\nHis wife could eat no lean;\nAnd so,\nBetwixt them both,\nThey licked the platter clean.",
      "fam": [
        {
          "from": "clean",
          "rime": "ean",
          "on": [
            "b",
            "m"
          ]
        }
      ],
      "src": "The Real Mother Goose (1916), Project Gutenberg #10607."
    },
    {
      "id": "rainrls",
      "title": "Rain",
      "by": "Robert Louis Stevenson",
      "text": "The rain is raining all around,\nIt falls on field and tree,\nIt rains on the umbrellas here,\nAnd on the ships at sea.",
      "fam": [
        {
          "from": "tree",
          "rime": "ee",
          "on": [
            "b",
            "s",
            "fr",
            "thr"
          ]
        },
        {
          "from": "around",
          "rime": "ound",
          "on": [
            "f",
            "s",
            "r",
            "p",
            "gr"
          ]
        }
      ],
      "src": "A Child's Garden of Verses (1885), Project Gutenberg #25617."
    },
    {
      "id": "humpty",
      "title": "Humpty Dumpty",
      "by": "Mother Goose",
      "text": "Humpty Dumpty sat on a wall,\nHumpty Dumpty had a great fall;\nAll the King's horses and all the King's men\nCannot put Humpty Dumpty together again.",
      "fam": [
        {
          "from": "sat",
          "rime": "at",
          "on": [
            "c",
            "h",
            "m",
            "b",
            "r",
            "th"
          ]
        },
        {
          "from": "men",
          "rime": "en",
          "on": [
            "h",
            "t",
            "p",
            "th",
            "wh"
          ]
        }
      ],
      "src": "The Real Mother Goose (1916), Project Gutenberg #10607."
    },
    {
      "id": "rise",
      "title": "Time to Rise",
      "by": "Robert Louis Stevenson",
      "text": "A birdie with a yellow bill\nHopped upon the window sill,\nCocked his shining eye and said:\n'Ain't you shamed, you sleepy-head?'",
      "fam": [
        {
          "from": "bill",
          "rime": "ill",
          "on": [
            "h",
            "f",
            "w",
            "m",
            "st"
          ]
        },
        {
          "from": "and",
          "rime": "and",
          "on": [
            "b",
            "h",
            "l",
            "s",
            "st"
          ]
        }
      ],
      "src": "A Child's Garden of Verses (1885), Project Gutenberg #25617."
    },
    {
      "id": "onetwo",
      "title": "One, Two, Three",
      "by": "Mother Goose",
      "text": "One, two, three, four, five,\nOnce I caught a fish alive.\nSix, seven, eight, nine, ten,\nBut I let it go again.\nWhy did you let it go?\nBecause it bit my finger so.\nWhich finger did it bite?\nThe little one upon the right.",
      "fam": [
        {
          "from": "fish",
          "rime": "ish",
          "on": [
            "d",
            "w"
          ]
        },
        {
          "from": "bit",
          "rime": "it",
          "on": [
            "s",
            "h",
            "f",
            "p"
          ]
        }
      ],
      "src": "The Real Mother Goose (1916), Project Gutenberg #10607."
    },
    {
      "id": "duty",
      "title": "Whole Duty of Children",
      "by": "Robert Louis Stevenson",
      "text": "A child should always say what's true\nAnd speak when he is spoken to,\nAnd behave mannerly at table:\nAt least as far as he is able.",
      "fam": [
        {
          "from": "true",
          "rime": "ue",
          "on": [
            "bl",
            "gl",
            "cl"
          ]
        },
        {
          "from": "table",
          "rime": "able",
          "on": [
            "c",
            "f",
            "st"
          ]
        }
      ],
      "src": "A Child's Garden of Verses (1885), Project Gutenberg #25617."
    },
    {
      "id": "boyblue",
      "title": "Little Boy Blue",
      "by": "Mother Goose",
      "text": "Little Boy Blue, come, blow your horn!\nThe sheep's in the meadow, the cow's in the corn.\nWhere's the little boy that looks after the sheep?\nUnder the haystack, fast asleep!",
      "fam": [
        {
          "from": "horn",
          "rime": "orn",
          "on": [
            "c",
            "b",
            "t",
            "w",
            "th"
          ]
        },
        {
          "from": "blow",
          "rime": "ow",
          "on": [
            "gr",
            "sh",
            "l",
            "sl",
            "sn"
          ]
        }
      ],
      "src": "The Real Mother Goose (1916), Project Gutenberg #10607."
    },
    {
      "id": "wind",
      "title": "Who has seen the wind?",
      "by": "Christina Rossetti",
      "text": "Who has seen the wind?\nNeither I nor you:\nBut when the leaves hang trembling\nThe wind is passing thro'.\n\nWho has seen the wind?\nNeither you nor I:\nBut when the trees bow down their heads\nThe wind is passing by.",
      "fam": [
        {
          "from": "by",
          "rime": "y",
          "on": [
            "m",
            "fl",
            "tr",
            "cr",
            "sk"
          ]
        },
        {
          "from": "bow",
          "rime": "ow",
          "on": [
            "n",
            "h",
            "c",
            "w"
          ]
        },
        {
          "from": "down",
          "rime": "own",
          "on": [
            "br",
            "t",
            "cl",
            "cr",
            "g"
          ]
        }
      ],
      "src": "Sing-Song: A Nursery Rhyme Book (1893), Project Gutenberg #76703."
    },
    {
      "id": "baa",
      "title": "Baa, Baa, Black Sheep",
      "by": "Mother Goose",
      "text": "Baa, baa, black sheep,\nHave you any wool?\nYes, marry, have I,\nThree bags full;\n\nOne for my master,\nOne for my dame,\nBut none for the little boy\nWho cries in the lane.",
      "fam": [
        {
          "from": "black",
          "rime": "ack",
          "on": [
            "b",
            "s",
            "tr",
            "sn"
          ]
        },
        {
          "from": "lane",
          "rime": "ane",
          "on": [
            "c",
            "m",
            "pl"
          ]
        }
      ],
      "src": "The Real Mother Goose (1916), Project Gutenberg #10607."
    },
    {
      "id": "seaside",
      "title": "At the Sea-Side",
      "by": "Robert Louis Stevenson",
      "text": "When I was down beside the sea\nA wooden spade they gave to me\nTo dig the sandy shore.\nMy holes were empty like a cup,\nIn every hole the sea came up,\nTill it could come no more.",
      "fam": [
        {
          "from": "dig",
          "rime": "ig",
          "on": [
            "b",
            "p",
            "w",
            "f"
          ]
        }
      ],
      "src": "A Child's Garden of Verses (1885); text of the 1919 Lippincott edition, Project Gutenberg #28722, checked against #25609 and #136."
    },
    {
      "id": "singing",
      "title": "Singing",
      "by": "Robert Louis Stevenson",
      "text": "Of speckled eggs the birdie sings\nAnd nests among the trees;\nThe sailor sings of ropes and things\nIn ships upon the seas.\n\nThe children sing in far Japan,\nThe children sing in Spain;\nThe organ with the organ man\nIs singing in the rain.",
      "fam": [
        {
          "from": "sing",
          "rime": "ing",
          "on": [
            "br",
            "r",
            "th",
            "w",
            "st"
          ]
        },
        {
          "from": "far",
          "rime": "ar",
          "on": [
            "c",
            "j",
            "st",
            "b"
          ]
        }
      ],
      "src": "A Child's Garden of Verses (1885), Project Gutenberg #25617."
    },
    {
      "id": "fairybread",
      "title": "Fairy Bread",
      "by": "Robert Louis Stevenson",
      "text": "Come up here, O dusty feet!\nHere is fairy bread to eat.\nHere in my retiring room,\nChildren, you may dine\nOn the golden smell of broom\nAnd the shade of pine;\nAnd when you have eaten well,\nFairy stories hear and tell.",
      "fam": [
        {
          "from": "eat",
          "rime": "eat",
          "on": [
            "b",
            "h",
            "s",
            "m"
          ]
        },
        {
          "from": "well",
          "rime": "ell",
          "on": [
            "b",
            "t",
            "s",
            "sh"
          ]
        }
      ],
      "src": "A Child's Garden of Verses (1885); text of the 1919 Lippincott edition, Project Gutenberg #28722, checked against #25609 and #136."
    },
    {
      "id": "boats",
      "title": "Boats sail on the rivers",
      "by": "Christina Rossetti",
      "text": "Boats sail on the rivers,\nAnd ships sail on the seas;\nBut clouds that sail across the sky\nAre prettier far than these.\n\nThere are bridges on the rivers,\nAs pretty as you please;\nBut the bow that bridges heaven,\nAnd overtops the trees,\nAnd builds a road from earth to sky,\nIs prettier far than these.",
      "fam": [
        {
          "from": "sail",
          "rime": "ail",
          "on": [
            "m",
            "n",
            "t",
            "r",
            "p",
            "sn"
          ]
        },
        {
          "from": "but",
          "rime": "ut",
          "on": [
            "c",
            "n",
            "h",
            "sh"
          ]
        }
      ],
      "src": "Sing-Song: A Nursery Rhyme Book (1893), Project Gutenberg #76703."
    },
    {
      "id": "swing",
      "title": "The Swing",
      "by": "Robert Louis Stevenson",
      "text": "How do you like to go up in a swing,\nUp in the air so blue?\nOh, I do think it the pleasantest thing\nEver a child can do!\n\nUp in the air and over the wall,\nTill I can see so wide,\nRivers and trees and cattle and all\nOver the countryside—\n\nTill I look down on the garden green,\nDown on the roof so brown—\nUp in the air I go flying again,\nUp in the air and down!",
      "fam": [
        {
          "from": "wide",
          "rime": "ide",
          "on": [
            "r",
            "s",
            "h",
            "sl"
          ]
        }
      ],
      "src": "A Child's Garden of Verses (1885); text of the 1919 Lippincott edition, Project Gutenberg #28722, checked against #25609 and #136."
    },
    {
      "id": "citymouse",
      "title": "The city mouse lives in a house",
      "by": "Christina Rossetti",
      "text": "The city mouse lives in a house;—\nThe garden mouse lives in a bower,\nHe's friendly with the frogs and toads,\nAnd sees the pretty plants in flower.\nThe city mouse eats bread and cheese;—\nThe garden mouse eats what he can;\nWe will not grudge him seeds and stalks,\nPoor little timid furry man.",
      "fam": [
        {
          "from": "not",
          "rime": "ot",
          "on": [
            "g",
            "h",
            "p",
            "d",
            "sp"
          ]
        },
        {
          "from": "bread",
          "rime": "ead",
          "on": [
            "h",
            "spr",
            "thr"
          ]
        }
      ],
      "src": "Sing-Song: A Nursery Rhyme Book (1893), Project Gutenberg #76703. The Gutenberg scan reads \"Jives\" in the first line, a scanning slip for \"lives\"."
    },
    {
      "id": "bedsummer",
      "title": "Bed in Summer",
      "by": "Robert Louis Stevenson",
      "text": "In winter I get up at night\nAnd dress by yellow candle-light.\nIn summer, quite the other way,\nI have to go to bed by day.\n\nI have to go to bed and see\nThe birds still hopping on the tree,\nOr hear the grown-up people's feet\nStill going past me in the street.\n\nAnd does it not seem hard to you,\nWhen all the sky is clear and blue,\nAnd I should like so much to play,\nTo have to go to bed by day?",
      "fam": [
        {
          "from": "street",
          "rime": "eet",
          "on": [
            "f",
            "m",
            "sw"
          ]
        },
        {
          "from": "bed",
          "rime": "ed",
          "on": [
            "r",
            "f",
            "sh",
            "l"
          ]
        }
      ],
      "src": "A Child's Garden of Verses (1885); text of the 1919 Lippincott edition, Project Gutenberg #28722, checked against #25609 and #136."
    },
    {
      "id": "cow",
      "title": "The Cow",
      "by": "Robert Louis Stevenson",
      "text": "The friendly cow all red and white,\nI love with all my heart:\nShe gives me cream with all her might,\nTo eat with apple-tart.\n\nShe wanders lowing here and there,\nAnd yet she cannot stray,\nAll in the pleasant open air,\nThe pleasant light of day;\n\nAnd blown by all the winds that pass\nAnd wet with all the showers,\nShe walks among the meadow grass\nAnd eats the meadow flowers.",
      "fam": [
        {
          "from": "cream",
          "rime": "eam",
          "on": [
            "dr",
            "t",
            "str"
          ]
        }
      ],
      "src": "A Child's Garden of Verses (1885); text of the 1919 Lippincott edition, Project Gutenberg #28722, checked against #25609 and #136."
    },
    {
      "id": "whereboats",
      "title": "Where Go the Boats?",
      "by": "Robert Louis Stevenson",
      "text": "Dark brown is the river,\nGolden is the sand.\nIt flows along for ever,\nWith trees on either hand.\n\nGreen leaves a-floating,\nCastles of the foam,\nBoats of mine a-boating—\nWhere will all come home?\n\nOn goes the river\nAnd out past the mill,\nAway down the valley,\nAway down the hill.\n\nAway down the river,\nA hundred miles or more,\nOther little children\nShall bring my boats ashore.",
      "fam": [
        {
          "from": "more",
          "rime": "ore",
          "on": [
            "s",
            "st",
            "sn",
            "w"
          ]
        }
      ],
      "src": "A Child's Garden of Verses (1885); text of the 1919 Lippincott edition, Project Gutenberg #28722, checked against #25609 and #136."
    },
    {
      "id": "lamb",
      "title": "The Lamb",
      "by": "William Blake",
      "text": "Little Lamb, who made thee?\nDost thou know who made thee?\nGave thee life, and bid thee feed\nBy the stream and o'er the mead;\nGave thee clothing of delight,\nSoftest clothing, woolly, bright;\nGave thee such a tender voice,\nMaking all the vales rejoice?\nLittle Lamb, who made thee?\nDost thou know who made thee?\n\nLittle Lamb, I'll tell thee,\nLittle Lamb, I'll tell thee:\nHe is called by thy name,\nFor he calls himself a Lamb.\nHe is meek, and he is mild;\nHe became a little child.\nI a child, and thou a lamb.\nWe are called by his name.\nLittle Lamb, God bless thee!\nLittle Lamb, God bless thee!",
      "fam": [
        {
          "from": "name",
          "rime": "ame",
          "on": [
            "c",
            "g",
            "s",
            "fr"
          ]
        },
        {
          "from": "mild",
          "rime": "ild",
          "on": [
            "w"
          ]
        }
      ],
      "src": "Songs of Innocence (1789), text as given by Representative Poetry Online (University of Toronto), from Bindman's Blake Trust edition."
    },
    {
      "id": "goodplay",
      "title": "A Good Play",
      "by": "Robert Louis Stevenson",
      "text": "We built a ship upon the stairs\nAll made of the back-bedroom chairs,\nAnd filled it full of sofa pillows\nTo go a-sailing on the billows.\n\nWe took a saw and several nails,\nAnd water in the nursery pails;\nAnd Tom said, 'Let us also take\nAn apple and a slice of cake;'—\nWhich was enough for Tom and me\nTo go a-sailing on till tea.\n\nWe sailed along for days and days,\nAnd had the very best of plays;\nBut Tom fell out and hurt his knee,\nSo there was no one left but me.",
      "fam": [
        {
          "from": "took",
          "rime": "ook",
          "on": [
            "l",
            "b",
            "c",
            "h"
          ]
        },
        {
          "from": "full",
          "rime": "ull",
          "on": [
            "p",
            "b"
          ]
        }
      ],
      "src": "A Child's Garden of Verses (1885); text of the 1919 Lippincott edition, Project Gutenberg #28722, checked against #25609 and #136."
    },
    {
      "id": "nod",
      "title": "The Land of Nod",
      "by": "Robert Louis Stevenson",
      "text": "From breakfast on through all the day\nAt home among my friends I stay;\nBut every night I go abroad\nAfar into the land of Nod.\n\nAll by myself I have to go,\nWith none to tell me what to do—\nAll alone beside the streams\nAnd up the mountain-sides of dreams.\n\nThe strangest things are there for me,\nBoth things to eat and things to see,\nAnd many frightening sights abroad\nTill morning in the land of Nod.\n\nTry as I like to find the way,\nI never can get back by day,\nNor can remember plain and clear\nThe curious music that I hear.",
      "fam": [
        {
          "from": "find",
          "rime": "ind",
          "on": [
            "k",
            "m",
            "b"
          ]
        }
      ],
      "src": "A Child's Garden of Verses (1885); text of the 1919 Lippincott edition, Project Gutenberg #28722, checked against #25609 and #136."
    },
    {
      "id": "youngnight",
      "title": "Young Night-Thought",
      "by": "Robert Louis Stevenson",
      "text": "All night long and every night,\nWhen my mama puts out the light,\nI see the people marching by,\nAs plain as day, before my eye.\n\nArmies and emperors and kings,\nAll carrying different kinds of things,\nAnd marching in so grand a way,\nYou never saw the like by day.\n\nSo fine a show was never seen,\nAt the great circus on the green;\nFor every kind of beast and man\nIs marching in that caravan.\n\nAt first they move a little slow,\nBut still the faster on they go,\nAnd still beside them close I keep\nUntil we reach the town of Sleep.",
      "fam": [
        {
          "from": "night",
          "rime": "ight",
          "on": [
            "l",
            "r",
            "f",
            "t",
            "br"
          ]
        },
        {
          "from": "saw",
          "rime": "aw",
          "on": [
            "dr",
            "p",
            "r",
            "str"
          ]
        }
      ],
      "src": "A Child's Garden of Verses (1885); text of the 1919 Lippincott edition, Project Gutenberg #28722, checked against #25609 and #136."
    },
    {
      "id": "escape",
      "title": "Escape at Bedtime",
      "by": "Robert Louis Stevenson",
      "text": "The lights from the parlour and kitchen shone out\nThrough the blinds and the windows and bars;\nAnd high overhead and all moving about,\nThere were thousands of millions of stars.\nThere ne'er were such thousands of leaves on a tree,\nNor of people in church or the Park,\nAs the crowds of the stars that looked down upon me,\nAnd that glittered and winked in the dark.\nThe Dog, and the Plough, and the Hunter, and all\nAnd the Star of the Sailor, and Mars,\nThese shone in the sky, and the pail by the wall\nWould be half full of water and stars.\nThey saw me at last, and they chased me with cries,\nAnd they soon had me packed into bed;\nBut the glory kept shining and bright in my eyes,\nAnd the stars going round in my head.",
      "fam": [
        {
          "from": "out",
          "rime": "out",
          "on": [
            "sh",
            "sp",
            "tr"
          ]
        }
      ],
      "src": "A Child's Garden of Verses (1885); text of the 1919 Lippincott edition, Project Gutenberg #28722, checked against #25609 and #136."
    },
    {
      "id": "shadow",
      "title": "My Shadow",
      "by": "Robert Louis Stevenson",
      "text": "I have a little shadow that goes in and out with me,\nAnd what can be the use of him is more than I can see.\nHe is very, very like me from the heels up to the head;\nAnd I see him jump before me, when I jump into my bed.\n\nThe funniest thing about him is the way he likes to grow—\nNot at all like proper children, which is always very slow;\nFor he sometimes shoots up taller like an india-rubber ball,\nAnd he sometimes gets so little that there's none of him at all.\n\nHe hasn't got a notion of how children ought to play,\nAnd can only make a fool of me in every sort of way.\nHe stays so close beside me, he's a coward you can see;\nI'd think shame to stick to nursie as that shadow sticks to me!\n\nOne morning, very early, before the sun was up,\nI rose and found the shining dew on every buttercup;\nBut my lazy little shadow, like an arrant sleepy-head,\nHad stayed at home behind me and was fast asleep in bed.",
      "fam": [
        {
          "from": "think",
          "rime": "ink",
          "on": [
            "dr",
            "p",
            "s",
            "w"
          ]
        },
        {
          "from": "ball",
          "rime": "all",
          "on": [
            "sm",
            "t",
            "w"
          ]
        }
      ],
      "src": "A Child's Garden of Verses (1885); text of the 1919 Lippincott edition, Project Gutenberg #28722, checked against #25609 and #136."
    }
  ]
};
