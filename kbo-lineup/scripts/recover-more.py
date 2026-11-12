# Generated-data maintenance: see scripts/README.md.
from pathlib import Path
import os
PROJECT=Path(__file__).resolve().parents[1]
WORK=Path(os.environ.get('KBO_WORK_DIR',str(PROJECT/'.data-work')))
WORK.mkdir(parents=True,exist_ok=True)
from pathlib import Path
import json,requests,hashlib,concurrent.futures
D=(WORK/'kbo-source');mp=(WORK/'more-portraits.json');p=json.load(open(WORK/'portraits.json'));out=(PROJECT/'public/players')
def f(item):
 pid,m=item
 if m['status']=='available':return pid,m
 for y in [2025,2024,2023,2022,2021,2019,2017]:
  src=f'https://6ptotvmi5753.edge.naverncp.com/KBO_IMAGE/person/middle/{y}/{pid}.jpg'
  try:
   r=requests.get(src,timeout=18)
   if r.status_code==200 and r.headers.get('Content-Type','').startswith('image/') and len(r.content)>1000:
    (out/f'{pid}.jpg').write_bytes(r.content);return pid,{**m,'status':'available','imageSource':src,'photo':f'/players/{pid}.jpg','hash':hashlib.sha256(r.content).hexdigest(),'bytes':len(r.content)}
  except:pass
 return pid,m
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
 for i,(pid,m) in enumerate(ex.map(f,list(p.items()))):
  p[pid]=m
  if i%100==0:mp.write_text(json.dumps(p,ensure_ascii=False));print(i,sum(v['status']=='available' for v in p.values()),flush=True)
mp.write_text(json.dumps(p,ensure_ascii=False));print('DONE',sum(v['status']=='available' for v in p.values()),len(p),flush=True)
