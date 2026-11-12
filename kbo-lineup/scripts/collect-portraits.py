# Generated-data maintenance: see scripts/README.md.
from pathlib import Path
import os
PROJECT=Path(__file__).resolve().parents[1]
WORK=Path(os.environ.get('KBO_WORK_DIR',str(PROJECT/'.data-work')))
WORK.mkdir(parents=True,exist_ok=True)
import json,glob,requests,re,time,hashlib,concurrent.futures
from pathlib import Path
from bs4 import BeautifulSoup
D=(WORK/'kbo-source');out=(PROJECT/'public/players');out.mkdir(exist_ok=True)
rows=[r for p in D.glob('def-*.json') for r in json.load(open(p))]
people={r['playerId']:r for r in rows}
# New historical pitchers will be covered on the second pass as well.
for p in D.glob('pitchall-*.json'):
 for r in json.load(open(p)):people.setdefault(r['playerId'],r)
meta=(WORK/'portraits.json');known=json.load(open(meta)) if meta.exists() else {}
def run(item):
 pid,r=item
 if pid in known:return pid,known[pid]
 url=f'https://www.koreabaseball.com/Record/Player/HitterDetail/Basic.aspx?playerId={pid}'
 for attempt in range(2):
  try:
   res=requests.get(url,timeout=25);sp=BeautifulSoup(res.content,'html.parser');img=sp.select_one('img[src*="/person/"]')
   if not img:return pid,{'status':'missing','source':url}
   src='https:'+img['src'] if img['src'].startswith('//') else img['src']
   pic=requests.get(src,timeout=25)
   if pic.status_code!=200 or not pic.headers.get('Content-Type','').startswith('image/') or len(pic.content)<1000:return pid,{'status':'missing','source':url,'imageSource':src}
   path=out/f'{pid}.jpg';path.write_bytes(pic.content)
   return pid,{'status':'available','name':r['name'],'source':url,'imageSource':src,'photo':f'/players/{pid}.jpg','hash':hashlib.sha256(pic.content).hexdigest(),'bytes':len(pic.content)}
  except Exception:
   if attempt: return pid,{'status':'failed','source':url}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
 for i,(pid,value) in enumerate(ex.map(run,people.items())):
  known[pid]=value
  if i%50==0:meta.write_text(json.dumps(known,ensure_ascii=False));print(i,len(known),flush=True)
meta.write_text(json.dumps(known,ensure_ascii=False));print('DONE',len(known),flush=True)
