# How the 小古文 book was built (reuse for later Chinese books)

1. On Shu Ping's Mac (Claude desktop app open), fetch Wikisource pages' wikitext with the
   MediaWiki API from a zh.wikisource.org tab, save as one JSON blob in ~/Downloads, stage it.
   Format: {page title: {title, revid, text}}.
2. `ex.py` cleans wikitext (templates 另/ProperNoun/*, etc.). Story specs live in `s1.py`–`s5.py`:
   st(t=title, src=, page=, a=start text, b=end text, bai=白话, notes=[(word, meaning)], en=English,
   optional ctx=, punct= (for unpunctuated 四库 texts; checked char-for-char), fixes=[(from,to,note)]).
3. `build.py` slices the original, converts to simplified (opencc t2s; Ext-A/B results reverted;
   VAR map for old forms, recorded as `norm`) → built.json.
4. `assemble.py` adds pinyin (pypinyin; only 一/不 tone sandhi; overrides in `ov.py`) → items.json,
   then the items go into window.BOOKS[key] in data/books.js. Item format matches BOOKS.zh/xgw.
   Needs: pip install pypinyin opencc-python-reimplemented.
