/* Emily's reading lessons, on Charlotte Mason's plan (Home Education, Part V, §§ IV–VI).
   Each poem is learnt word by word "at sight", then by sound (word families), and only then shown and read whole.
   Poem texts are checked against the editions named in "src". Word families ("fam") are the sound lessons:
   "from" is a word in the poem, "rime" is what is left when the first letter or letters are taken away,
   and "on" are the beginnings the child puts back to make new words. */
window.READING = {
  "per": 10,
  "method": {
    "steps": [
      ["Warm up", "She reads the words she already knows as you point. Mason calls this a minute's work that \"secures the ground\"."],
      ["Look", "Say the new word. She looks at it until she would know it again, then hides it."],
      ["Build", "She makes the word from memory with the loose letters. She can peek if she must."],
      ["Find", "She finds every copy of the word among the loose word cards."],
      ["Read the column", "Each new word joins the column. She reads it down, up and in mixed order."],
      ["Lines", "You say a line of the poem; she lays it out with her word cards. A counter stands in for a word she hasn't learnt yet."],
      ["Word families", "On another day she builds a known word, takes off the first letter, and makes new words from what is left: coat, boat, goat."],
      ["The poem", "When every word is known she lays out the whole poem, then sees it printed and reads it to you, beautifully."]
    ],
    "notes": [
      "About ten new words a day is Mason's pace; stop sooner if she tires. Ten minutes to a quarter of an hour of full attention is enough.",
      "The poem stays a surprise until she has learnt all its words."
    ],
    "src": "Charlotte Mason, Home Education (1886), Part V: §IV Reading, §V The First Reading Lesson, §VI Reading by Sight and Sound, §VIII Reading for Older Children (AmblesideOnline text)."
  },
  "common": {
    "name": "Dolch sight words",
    "levels": [{"name": "Pre-primer", "words": ["a", "and", "away", "big", "blue", "can", "come", "down", "find", "for", "funny", "go", "help", "here", "I", "in", "is", "it", "jump", "little", "look", "make", "me", "my", "not", "one", "play", "red", "run", "said", "see", "the", "three", "to", "two", "up", "we", "where", "yellow", "you"]}, {"name": "Primer", "words": ["all", "am", "are", "at", "ate", "be", "black", "brown", "but", "came", "did", "do", "eat", "four", "get", "good", "have", "he", "into", "like", "must", "new", "no", "now", "on", "our", "out", "please", "pretty", "ran", "ride", "saw", "say", "she", "so", "soon", "that", "there", "they", "this", "too", "under", "want", "was", "well", "went", "what", "white", "who", "will", "with", "yes"]}, {"name": "First grade", "words": ["after", "again", "an", "any", "as", "ask", "by", "could", "every", "fly", "from", "give", "going", "had", "has", "her", "him", "his", "how", "just", "know", "let", "live", "may", "of", "old", "once", "open", "over", "put", "round", "some", "stop", "take", "thank", "them", "then", "think", "walk", "were", "when"]}, {"name": "Second grade", "words": ["always", "around", "because", "been", "before", "best", "both", "buy", "call", "cold", "does", "don't", "fast", "first", "five", "found", "gave", "goes", "green", "its", "made", "many", "off", "or", "pull", "read", "right", "sing", "sit", "sleep", "tell", "their", "these", "those", "upon", "us", "use", "very", "wash", "which", "why", "wish", "work", "would", "write", "your"]}, {"name": "Third grade", "words": ["about", "better", "bring", "carry", "clean", "cut", "done", "draw", "drink", "eight", "fall", "far", "full", "got", "grow", "hold", "hot", "hurt", "if", "keep", "kind", "laugh", "light", "long", "much", "myself", "never", "only", "own", "pick", "seven", "shall", "show", "six", "small", "start", "ten", "today", "together", "try", "warm"]}],
    "src": "E. W. Dolch's 220 basic sight words (1936; Problems in Reading, 1948), the commonest words in children's books, in his five levels, as listed by the University of Utah Reading Clinic. That listing prints \"where\" twice in the first-grade words; the standard list has \"were\" there, used here."
  },
  "proper": ["I", "I'm", "I've", "Johnny", "Jack", "Humpty", "Dumpty", "King's", "London", "Queen", "Japan", "Spain"],
  "poems": [
    {
      "id": "jack",
      "title": "Jack",
      "by": "Mother Goose",
      "text": "Jack be nimble,\nJack be quick,\nJack jump over the candlestick.",
      "fam": [
        { "from": "quick", "rime": "ick", "on": ["k", "p", "s", "t", "st", "br"] },
        { "from": "jump", "rime": "ump", "on": ["b", "h", "l", "p", "st"] }
      ],
      "src": "The Real Mother Goose (1916), Project Gutenberg #10607."
    },
    {
      "id": "rainaway",
      "title": "Rain",
      "by": "Mother Goose",
      "text": "Rain, rain, go away,\nCome again another day;\nLittle Johnny wants to play.",
      "fam": [
        { "from": "day", "rime": "ay", "on": ["h", "m", "s", "w", "st", "tr"] },
        { "from": "rain", "rime": "ain", "on": ["m", "p", "g", "tr", "br"] },
        { "from": "go", "rime": "o", "on": ["n", "s"] }
      ],
      "src": "The Real Mother Goose, illustrated by Blanche Fisher Wright (1916), Project Gutenberg #10607."
    },
    {
      "id": "hickory",
      "title": "The Mouse and the Clock",
      "by": "Mother Goose",
      "text": "Hickory, dickory, dock!\nThe mouse ran up the clock;\nThe clock struck one,\nAnd down he run,\nHickory, dickory, dock!",
      "fam": [
        { "from": "clock", "rime": "ock", "on": ["d", "l", "r", "s", "bl"] },
        { "from": "run", "rime": "un", "on": ["b", "f", "s", "sp"] }
      ],
      "src": "The Real Mother Goose (1916), Project Gutenberg #10607."
    },
    {
      "id": "happy",
      "title": "Happy Thought",
      "by": "Robert Louis Stevenson",
      "text": "The world is so full of a number of things,\nI'm sure we should all be as happy as kings.",
      "fam": [
        { "from": "kings", "rime": "ings", "on": ["r", "s", "w", "th", "br"] },
        { "from": "all", "rime": "all", "on": ["b", "c", "f", "h", "t", "w"] }
      ],
      "src": "A Child's Garden of Verses (1885), Project Gutenberg #25617."
    },
    {
      "id": "pancake",
      "title": "Mix a pancake",
      "by": "Christina Rossetti",
      "text": "Mix a pancake,\nStir a pancake,\nPop it in the pan;\nFry the pancake,\nToss the pancake,—\nCatch it if you can.",
      "fam": [
        { "from": "pan", "rime": "an", "on": ["c", "f", "m", "r", "v", "t"] },
        { "from": "pop", "rime": "op", "on": ["h", "m", "t", "st", "sh"] }
      ],
      "src": "Sing-Song: A Nursery Rhyme Book (1893), Project Gutenberg #76703."
    },
    {
      "id": "humpty",
      "title": "Humpty Dumpty",
      "by": "Mother Goose",
      "text": "Humpty Dumpty sat on a wall,\nHumpty Dumpty had a great fall;\nAll the King's horses and all the King's men\nCannot put Humpty Dumpty together again.",
      "fam": [
        { "from": "sat", "rime": "at", "on": ["c", "h", "m", "b", "r", "th"] },
        { "from": "men", "rime": "en", "on": ["h", "t", "p", "th", "wh"] }
      ],
      "src": "The Real Mother Goose (1916), Project Gutenberg #10607."
    },
    {
      "id": "rainrls",
      "title": "Rain",
      "by": "Robert Louis Stevenson",
      "text": "The rain is raining all around,\nIt falls on field and tree,\nIt rains on the umbrellas here,\nAnd on the ships at sea.",
      "fam": [
        { "from": "tree", "rime": "ee", "on": ["b", "s", "fr", "thr"] },
        { "from": "around", "rime": "ound", "on": ["f", "s", "r", "p", "gr"] }
      ],
      "src": "A Child's Garden of Verses (1885), Project Gutenberg #25617."
    },
    {
      "id": "duty",
      "title": "Whole Duty of Children",
      "by": "Robert Louis Stevenson",
      "text": "A child should always say what's true\nAnd speak when he is spoken to,\nAnd behave mannerly at table:\nAt least as far as he is able.",
      "fam": [
        { "from": "true", "rime": "ue", "on": ["bl", "gl", "cl"] },
        { "from": "table", "rime": "able", "on": ["c", "f", "st"] }
      ],
      "src": "A Child's Garden of Verses (1885), Project Gutenberg #25617."
    },
    {
      "id": "rise",
      "title": "Time to Rise",
      "by": "Robert Louis Stevenson",
      "text": "A birdie with a yellow bill\nHopped upon the window sill,\nCocked his shining eye and said:\n'Ain't you shamed, you sleepy-head?'",
      "fam": [
        { "from": "bill", "rime": "ill", "on": ["h", "f", "w", "m", "st"] },
        { "from": "and", "rime": "and", "on": ["b", "h", "l", "s", "st"] }
      ],
      "src": "A Child's Garden of Verses (1885), Project Gutenberg #25617."
    },
    {
      "id": "wind",
      "title": "Who has seen the wind?",
      "by": "Christina Rossetti",
      "text": "Who has seen the wind?\nNeither I nor you:\nBut when the leaves hang trembling\nThe wind is passing thro'.\n\nWho has seen the wind?\nNeither you nor I:\nBut when the trees bow down their heads\nThe wind is passing by.",
      "fam": [
        { "from": "by", "rime": "y", "on": ["m", "fl", "tr", "cr", "sk"] },
        { "from": "bow", "rime": "ow", "on": ["n", "h", "c", "w"] },
        { "from": "down", "rime": "own", "on": ["br", "t", "cl", "cr", "g"] }
      ],
      "src": "Sing-Song: A Nursery Rhyme Book (1893), Project Gutenberg #76703."
    },
    {
      "id": "boyblue",
      "title": "Little Boy Blue",
      "by": "Mother Goose",
      "text": "Little Boy Blue, come, blow your horn!\nThe sheep's in the meadow, the cow's in the corn.\nWhere's the little boy that looks after the sheep?\nUnder the haystack, fast asleep!",
      "fam": [
        { "from": "horn", "rime": "orn", "on": ["c", "b", "t", "w", "th"] },
        { "from": "blow", "rime": "ow", "on": ["gr", "sh", "l", "sl", "sn"] }
      ],
      "src": "The Real Mother Goose (1916), Project Gutenberg #10607."
    },
    {
      "id": "boats",
      "title": "Boats sail on the rivers",
      "by": "Christina Rossetti",
      "text": "Boats sail on the rivers,\nAnd ships sail on the seas;\nBut clouds that sail across the sky\nAre prettier far than these.\n\nThere are bridges on the rivers,\nAs pretty as you please;\nBut the bow that bridges heaven,\nAnd overtops the trees,\nAnd builds a road from earth to sky,\nIs prettier far than these.",
      "fam": [
        { "from": "sail", "rime": "ail", "on": ["m", "n", "t", "r", "p", "sn"] },
        { "from": "but", "rime": "ut", "on": ["c", "n", "h", "sh"] }
      ],
      "src": "Sing-Song: A Nursery Rhyme Book (1893), Project Gutenberg #76703."
    },
    {
      "id": "singing",
      "title": "Singing",
      "by": "Robert Louis Stevenson",
      "text": "Of speckled eggs the birdie sings\nAnd nests among the trees;\nThe sailor sings of ropes and things\nIn ships upon the seas.\n\nThe children sing in far Japan,\nThe children sing in Spain;\nThe organ with the organ man\nIs singing in the rain.",
      "fam": [
        { "from": "sing", "rime": "ing", "on": ["br", "r", "th", "w", "st"] },
        { "from": "far", "rime": "ar", "on": ["c", "j", "st", "b"] }
      ],
      "src": "A Child's Garden of Verses (1885), Project Gutenberg #25617."
    },
    {
      "id": "citymouse",
      "title": "The city mouse lives in a house",
      "by": "Christina Rossetti",
      "text": "The city mouse lives in a house;—\nThe garden mouse lives in a bower,\nHe's friendly with the frogs and toads,\nAnd sees the pretty plants in flower.\nThe city mouse eats bread and cheese;—\nThe garden mouse eats what he can;\nWe will not grudge him seeds and stalks,\nPoor little timid furry man.",
      "fam": [
        { "from": "not", "rime": "ot", "on": ["g", "h", "p", "d", "sp"] },
        { "from": "bread", "rime": "ead", "on": ["h", "spr", "thr"] }
      ],
      "src": "Sing-Song: A Nursery Rhyme Book (1893), Project Gutenberg #76703. The Gutenberg scan reads \"Jives\" in the first line, a scanning slip for \"lives\"."
    }
  ]
};
