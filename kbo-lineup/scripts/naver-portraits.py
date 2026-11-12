# Generated-data maintenance: see scripts/README.md.
from pathlib import Path
import os
PROJECT=Path(__file__).resolve().parents[1]
WORK=Path(os.environ.get('KBO_WORK_DIR',str(PROJECT/'.data-work')))
WORK.mkdir(parents=True,exist_ok=True)
from pathlib import Path
import requests,json,hashlib,concurrent.futures
p=json.load(open(WORK/'portraits.json'));dest=(WORK/'naver-portraits.json');known=json.load(open(dest)) if dest.exists() else {};out=(PROJECT/'public/players')
def f(item):
 pid,m=item
 if pid in known:return pid,known[pid]
 u=f'https://sports-phinf.pstatic.net/player/kbo/default/{pid}.png'
 try:
  r=requests.get(u,timeout=20)
  if r.status_code==200 and r.headers.get('Content-Type','').startswith('image/') and len(r.content)>1000:
   (out/f'{pid}.png').write_bytes(r.content)
   return pid,{**m,'status':'available','imageSource':u,'photo':f'/players/{pid}.png','hash':hashlib.sha256(r.content).hexdigest(),'bytes':len(r.content),'provider':'NAVER Sports'}
 except:pass
 return pid,{'status':'missing'}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
 for i,(pid,m) in enumerate(ex.map(f,[(pid,m) for pid,m in p.items() if m['status']!='available'])):
  known[pid]=m
  if i%100==0:dest.write_text(json.dumps(known,ensure_ascii=False));print(i,sum(m['status']=='available' for m in known.values()),flush=True)
dest.write_text(json.dumps(known,ensure_ascii=False));print('DONE',len(known),sum(m['status']=='available' for m in known.values()),flush=True)
