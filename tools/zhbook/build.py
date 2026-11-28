import json,re,sys,opencc
exec(open('ex.py').read().split('K=[')[0])
S=[];
def st(**k): S.append(k)
for f in ['s1.py','s2.py','s3.py','s4.py','s5.py']: exec(open(f).read().replace('S = []\n',''))
cc=opencc.OpenCC('t2s')
VAR={'犂':'犁','谿':'溪','斵':'斫','鼇':'鳌','寛':'宽','黙':'默','濳':'潜','䇿':'策','逹':'达','淸':'清','髄':'髓','賔':'宾','蚉':'蚊','䖟':'虻','𨅊':'辙','遟':'迟','覩':'睹','歳':'岁','鐡':'铁','荅':'答','輙':'辄','脩':'修','爲':'为','衆':'众','畮':'亩','𡁕':'喋','屦':'屦'}
PUN='，。、；：？！「」『』“”‘’（）《》·　 \n|…—'
def strip(s): return ''.join(c for c in s if c not in PUN)
out=[];bad=0
for s in S:
    t=clean(D[s['page']]['text']); i=t.find(s['a'])
    if i<0: print('NOA',s['t']); bad+=1; continue
    j=t.find(s['b'],i)
    if j<0: print('NOB',s['t']); bad+=1; continue
    raw=t[i:j+len(s['b'])].strip()
    raw=re.sub(r'^#','',raw,flags=re.M); raw=re.sub(r'\n\s*\n','\n',raw); raw='\n'.join(l.strip().lstrip('　') for l in raw.split('\n') if l.strip())
    simp=cc.convert(raw); norm=[]
    assert len(simp)==len(raw), s['t']
    ext=lambda c: ord(c)>=0x20000 or 0x3400<=ord(c)<=0x4DBF
    simp=''.join(raw[k] if ext(c) and not ext(raw[k]) else c for k,c in enumerate(simp))
    for a,b in VAR.items():
        if a in simp: simp=simp.replace(a,b); norm.append(a+'→'+b)
    simp=simp.replace('「','“').replace('」','”').replace('『','‘').replace('』','’')
    fixnote=''
    for a,b,n in s.get('fixes',[]):
        assert a in simp,(s['t'],a); simp=simp.replace(a,b); fixnote=n
    if s.get('punct'):
        if strip(simp)!=strip(s['punct']): print('PUNCT MISMATCH',s['t']); print(strip(simp)); print(strip(s['punct'])); bad+=1
        simp=s['punct']
    odd=sorted(set(c for c in simp if c not in PUN and not re.match(r'[，。、；：？！“”‘’]',c) and not (lambda c: (lambda: c.encode('gb2312'))) (c) ))
    o=[]
    for c in set(simp):
        try: c.encode('gb2312')
        except: o.append(c)
    out.append(dict(s,fix=fixnote,orig=simp,norm=norm,revid=D[s['page']]['revid'],odd=''.join(sorted(o)),n=len(strip(simp))))
json.dump(out,open('built.json','w'),ensure_ascii=False,indent=0)
print(len(out),'stories, bad',bad)
for o in out:
    if o['odd'] or o['norm']: print(o['t'],'odd:',o['odd'],'norm:',o['norm'])
