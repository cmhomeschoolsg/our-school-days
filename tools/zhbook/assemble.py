import json,re
exec(open('py.py').read()); exec(open('ov.py').read())
B=json.load(open('built.json'))
TITLE_FIX={'小时了了':'xiǎo shí liǎo liǎo','曹冲称象':'cáo chōng chēng xiàng','九方皋相马':'jiǔ fāng gāo xiàng mǎ','曲突徙薪':'qū tū xǐ xīn','刑天舞干戚':'xíng tiān wǔ gān qī','羿射十日':'yì shè shí rì','涸辙之鲋':'hé zhé zhī fù','折箭':'zhé jiàn','陈太丘与友期行':'chén tài qiū yǔ yǒu qī xíng','杨氏之子':'yáng shì zhī zǐ','徐孺子赏月':'xú rú zǐ shǎng yuè','晏子使楚':'yàn zǐ shǐ chǔ','孟母戒子':'mèng mǔ jiè zǐ'}
def apply(T,subs):
    for s,p in subs:
        ps=p.split(); hit=0
        for para in T:
            txt=''.join(c for c,_ in para)
            for m in re.finditer(re.escape(s),txt):
                for k in range(len(s)): para[m.start()+k][1]=ps[k]
                hit+=1
        if not hit: raise Exception('nohit '+s)
def apply_soft(T,subs):
    for s,p in subs:
        try: apply(T,[(s,p)])
        except Exception: pass
items=[];
for o in sorted(B,key=lambda o:o['n']):
    O=toks(o['orig'])
    for para in O:
        for t in para:
            if t[0]=='子' and t[1]=='zi': t[1]='zǐ'
            if t[0] in GLOBAL_ORIG: t[1]=GLOBAL_ORIG[t[0]]
    sandhi(O); apply(O,OV.get(o['t'],[]))
    A=toks(o['bai'])
    for para in A:
        for i,t in enumerate(para):
            if t[0] in BAI_OV: t[1]=BAI_OV[t[0]]
            if t[0]=='得' and i>0 and para[i-1][1] and not (i+1<len(para) and para[i+1][0] in '到救罪住知')  and para[i-1][0] not in '获取赢': t[1]='de'
    sandhi(A); apply_soft(A,BAI_PH); apply_soft(A,OV.get(o['t'],[]))
    flatO=[t for p in O for t in p]; txtO=''.join(t[0] for t in flatO)
    notes=[]
    for w,m in o['notes']:
        segs=[x for x in re.split(r'(、|，|……)',w)]
        py=[]
        for sg in segs:
            if sg in ('、','，','……'): py.append('…' if sg=='……' else ''); continue
            i=txtO.find(sg); assert i>=0,(o['t'],sg)
            py.append(' '.join(t[1] for t in flatO[i:i+len(sg)]))
        notes.append([w,' '.join(x for x in py if x) if '……' not in w else ' … '.join(x for x in py if x and x!='…'),m])
    tp=TITLE_FIX.get(o['t']) or ' '.join(t[1] for t in sandhi(toks(o['t']))[0])
    items.append(dict(title=o['t'],py=tp,src=o['src'],ctx=o.get('ctx',''),orig=O,bai=A,notes=notes,norm=o['norm'],fix=o.get('fix',''),page=o['page'],revid=o['revid'],en=o['en'],punct=bool(o.get('punct'))))
json.dump(items,open('items.json','w'),ensure_ascii=False)
print(len(items)); print([i['title'] for i in items])
