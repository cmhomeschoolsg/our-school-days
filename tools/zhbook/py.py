import re
from pypinyin import pinyin, Style, load_phrases_dict
HZ=re.compile(r'[㐀-鿿\U00020000-\U0003ffff]')
def tone(p):
    for c in p:
        if c in 'āēīōūǖ': return 1
        if c in 'áéíóúǘ': return 2
        if c in 'ǎěǐǒǔǚ': return 3
        if c in 'àèìòùǜ': return 4
    return 0
NUM='零一二三四五六七八九十百千万第'
def toks(text, bai=False):
    out=[]
    for para in text.split('\n'):
        flat=[p[0] for p in pinyin(para,style=Style.TONE,errors=lambda x:[[''] for _ in x])]
        assert len(flat)==len(para)
        T=[[c,(flat[i] if HZ.match(c) else '')] for i,c in enumerate(para)]
        out.append(T)
    return out
def sandhi(T):
    for para in T:
        for i,(c,p) in enumerate(para):
            nxt=para[i+1] if i+1<len(para) else None
            if c=='不' and nxt and nxt[1]:
                para[i][1]='bú' if tone(nxt[1])==4 else 'bù'
            if c=='一' and nxt and nxt[1]:
                prev=para[i-1][0] if i>0 else ''
                if prev in NUM or nxt[0] in NUM+'月一': para[i][1]='yī'
                else: para[i][1]='yí' if tone(nxt[1])==4 else 'yì'
    return T
