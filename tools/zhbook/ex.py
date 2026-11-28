import json,re,sys
D={}
for f in ['zh-classics.json','zh-classics3.json']:
    D.update({k:v for k,v in json.load(open('/mnt/user-data/uploads/Downloads/'+f)).items() if v})
json.dump(D,open('D.json','w'),ensure_ascii=False)
def tpl(m):
    parts=m.group(1).split('|'); n=parts[0].strip()
    if n=='!': return '|'
    if n in('ProperNoun','PN','專名','YL','SK notes','sic','僻字','另','另2','參','專','udots','blue','red','SKchar','SKchar2','PUA'): return parts[1] if len(parts)>1 else ''
    if n in('*','注','小字'): return ''
    if n.startswith('Novel') or n.startswith('Textquality') or n.startswith('header'): return ''
    return '|'.join(parts[1:]) if len(parts)>1 and len(parts[0])<6 else ''
def clean(t):
    t=re.sub(r'<ref[^>]*>.*?</ref>','',t,flags=re.S); t=re.sub(r'-\{([^{}]*)\}-',r'\1',t)
    for _ in range(8): t=re.sub(r'\{\{([^{}]*)\}\}',tpl,t)
    t=re.sub(r'<[^>]+>','',t)
    t=re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]*)\]\]",r'\1',t); return t
K=[l.split('\t') for l in open(sys.argv[1]).read().strip().split('\n')]
for name,page,key in K:
    if page not in D: print('##',name,'NOPAGE',page); continue
    t=clean(D[page]['text']); i=t.find(key)
    if i<0: print('##',name,'NOTFOUND',key); continue
    a=t.rfind('\n',0,i); b=t.find('\n',i+len(key))
    print('##',name,'|',page,D[page]['revid']); L=t[a+1:b if b>0 else None]
    print(L[:900] if len(L)<900 else t[max(0,i-150):i+500])
