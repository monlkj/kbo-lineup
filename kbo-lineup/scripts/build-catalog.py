# Generated-data maintenance: see scripts/README.md.
from pathlib import Path
import os
PROJECT=Path(__file__).resolve().parents[1]
WORK=Path(os.environ.get('KBO_WORK_DIR',str(PROJECT/'.data-work')))
WORK.mkdir(parents=True,exist_ok=True)
from pathlib import Path
import json,collections,requests,bs4,re
D=(WORK/'kbo-source');OUT=(PROJECT/'data');OUT.mkdir(exist_ok=True)
def load(k):return [r for p in sorted(D.glob(k+'-*.json')) for r in json.load(open(p))]
def num(s):
 try:
  if ' ' in s:
   a,b=s.split(' ');return round(float(a)+eval(b,{'__builtins__':{}}),3)
  return float(s)
 except:return 0
positions={'투수':'P','포수':'C','1루수':'1B','2루수':'2B','3루수':'3B','유격수':'SS','좌익수':'LF','중견수':'CF','우익수':'RF','지명타자':'DH'}
hits={(r['playerId'],r['year']):r for r in load('hitall')};pitchers={(r['playerId'],r['year']):r for r in load('pitchall')};cards={}
for r in load('def'):
 if r['pos'] not in positions:continue
 key=(r['playerId'],r['year']);v=r['values'];c=cards.setdefault(key,{'id':f"{key[0]}-{key[1]}",'playerId':key[0],'name':r['name'],'year':key[1],'team':r['team'],'positions':[],'stats':{},'awards':[],'source':r['source'],'positionEvidence':[],'maxIP':-1})
 p=positions[r['pos']];ip=num(v[6])
 if p not in c['positions']:c['positions'].append(p)
 c['positionEvidence'].append({'pos':p,'innings':ip,'source':r['source']})
 if ip>c['maxIP']:c.update(pos=p,maxIP=ip);c['stats']['fpct']=num(v[12]);c['stats']['g']=num(v[4])
for key,r in pitchers.items():
 v=r['values'];c=cards.setdefault(key,{'id':f"{key[0]}-{key[1]}",'playerId':key[0],'name':r['name'],'year':key[1],'team':r['team'],'pos':'P','positions':['P'],'stats':{},'awards':[],'source':r['source'],'positionEvidence':[{'pos':'P','source':r['source']}],'maxIP':0})
 if c['pos']=='P':
  c['stats'].update({k:num(v[i]) for k,i in {'era':3,'g':4,'w':5,'l':6,'sv':7,'hld':8,'ip':10,'h':11,'hr':12,'bb':13,'so':15}.items()});c['source']=r['source']
for key,r in hits.items():
 if key not in cards:continue
 c=cards[key];v=r['values']
 if c['pos']!='P':c['stats'].update({k:num(v[i]) for k,i in {'avg':3,'g':4,'pa':5,'ab':6,'h':8,'hr':11,'rbi':13}.items()});c['source']=r['source']
running={(r['playerId'],r['year']):r for r in load('runall')}
for key,c in cards.items():
 if key in running and c['pos']!='P':c['stats']['sb']=num(running[key]['values'][5])
# Official awards: resolve exact name + season only when it maps to one KBO player ID.
gg_url='https://www.koreabaseball.com/Player/Awards/GoldenGlove.aspx'
gg_path=D/'golden.html'
if not gg_path.exists():gg_path.write_bytes(requests.get(gg_url,timeout=30).content)
gg=bs4.BeautifulSoup(gg_path.read_bytes(),'html.parser')
for tr in gg.select('table')[1].select('tbody tr'):
 td=tr.select('td')
 if not td or not td[0].text.strip().isdigit():continue
 year=int(td[0].text.strip())
 for i,cell in enumerate(td[1:]):
  position=['P','C','1B','2B','3B','SS',None,'DH'][i] if i<8 else None
  if position is None or position=='P':continue
  name_el=cell.select_one('span')
  if not name_el:continue
  name=name_el.text.strip();matches=[(key,r) for key,r in hits.items() if r['name']==name and key[1]==year]
  if len(matches)!=1:continue
  key,r=matches[0]
  if key in cards:continue
  v=r['values'];cards[key]={'id':f'{key[0]}-{year}','playerId':key[0],'name':name,'year':year,'team':r['team'],'pos':position,'positions':[position],'stats':{k:num(v[i]) for k,i in {'avg':3,'g':4,'pa':5,'ab':6,'h':8,'hr':11,'rbi':13}.items()},'awards':[],'source':r['source'],'positionEvidence':[{'pos':position,'source':gg_url}],'maxIP':0}
index=collections.defaultdict(list)
for c in cards.values():index[(c['name'],c['year'])].append(c)
source_rows=[]
def soup(url,cache):
 p=D/cache
 if not p.exists():p.write_bytes(requests.get(url,timeout=30).content)
 return bs4.BeautifulSoup(p.read_bytes(),'html.parser')
def award(name,year,kind,url):
 rows=index.get((name,year),[])
 if len(rows)==1 and kind not in [a['type'] for a in rows[0]['awards']]:rows[0]['awards'].append({'type':kind,'year':year,'source':url})
u='https://www.koreabaseball.com/Player/Awards/GoldenGlove.aspx';sp=soup(u,'golden.html')
for tr in sp.select('table')[1].select('tbody tr'):
 td=tr.select('td')
 if not td or not td[0].get_text(strip=True).isdigit():continue
 y=int(td[0].text)
 for cell in td[1:]:
  ps=cell.select('p') or [cell]
  for p in ps:
   spans=p.select('span')
   if spans:award(spans[0].get_text(strip=True),y,'골든글러브',u)
u='https://www.koreabaseball.com/Player/Awards/PlayerPrize.aspx';sp=soup(u,'mvp.html')
for tr in sp.select('table')[-1].select('tbody tr'):
 td=tr.select('td')
 if len(td)>1 and td[0].text.strip().isdigit():
  name=td[1].select_one('span');award(name.text.strip() if name else td[1].get_text(' ',strip=True).split(' ')[0],int(td[0].text.strip()),'MVP',u)
for y in [2018,2019,2022,2023,2024,2025]:
 u=f'https://www.koreabaseball.com/Schedule/Allstar/Game/Main{y}.aspx';sp=soup(u,f'allstar-{y}.html')
 for name in sp.select('.player-info .name'):award(name.text.strip(),y,'올스타',u)
# Awards added only when the exact season and identity were observed.
photos=json.load(open(WORK/'portraits.json'))
for extra in ['more-portraits.json','naver-portraits.json']:
 path=WORK/extra
 if path.exists():
  for pid,photo in json.load(open(path)).items():
   if photo.get('status')=='available' and photos.get(pid,{}).get('status')!='available':photos[pid]=photo
# A later archive lookup can replace the same local filename. Restore the
# selected provenance bytes before writing the final identity manifest.
import hashlib
for pid,photo in photos.items():
 if photo.get('status')!='available':continue
 asset=PROJECT/'public'/photo['photo'].lstrip('/')
 if not asset.exists() or hashlib.sha256(asset.read_bytes()).hexdigest()!=photo['hash']:
  response=requests.get(photo['imageSource'],timeout=30)
  response.raise_for_status()
  assert hashlib.sha256(response.content).hexdigest()==photo['hash'], f'Portrait changed during collection: {pid}'
  asset.write_bytes(response.content)
hashes=collections.Counter(p.get('hash') for p in photos.values() if p.get('status')=='available')
# Identical images shared by unrelated identities are placeholders, not verified portraits.
valid=[]
for c in cards.values():
 p=photos.get(c['playerId'],{})
 if p.get('status')!='available' or hashes.get(p.get('hash'),0)>1:continue
 c.update(photo=p['photo'],photoSource=p['imageSource'],profileSource=p['source']);c.pop('maxIP',None)
 c['stats']={k:(int(v) if v==int(v) else v) for k,v in c['stats'].items()}
 valid.append(c)
people=collections.defaultdict(list)
for c in valid:people[c['playerId']].append(c)
selected=[]
for rows in people.values():
 rows.sort(key=lambda c:(bool(c['awards']),c['stats'].get('g',0),c['year']),reverse=True)
 chosen={c['id']:c for c in rows if c['awards']}
 for c in rows[:2]:chosen[c['id']]=c
 selected.extend(chosen.values())
selected.sort(key=lambda c:(-c['year'],c['name'],c['playerId']))
meta={'uniquePlayers':len(people),'cards':len(selected),'awardCards':sum(bool(c['awards']) for c in selected),'portraits':len(people),'dataYears':[min(c['year'] for c in selected),max(c['year'] for c in selected)],'sources':['https://www.koreabaseball.com/Record/Player/Defense/Basic.aspx','https://www.koreabaseball.com/Record/Player/HitterBasic/Basic1.aspx','https://www.koreabaseball.com/Record/Player/PitcherBasic/Basic1.aspx','https://www.koreabaseball.com/Player/Awards/GoldenGlove.aspx','https://www.koreabaseball.com/Player/Awards/PlayerPrize.aspx'],'allstarCoverage':[2018,2019,2022,2023,2024,2025],'collectedAt':'2026-11-12'}
assert len(people)>=2000, f'Only {len(people)} verified people with distinct photos; not publishing an inflated count.'
assert len(selected)==len({c['id'] for c in selected})
assert all(c['positions'] and c['pos'] in c['positions'] for c in selected)
(OUT/'portrait-provenance.json').write_text(json.dumps({pid:{k:v for k,v in photos[pid].items() if k in ['photo','source','imageSource','hash','provider']} for pid in people},ensure_ascii=False,indent=2))
(OUT/'catalog.json').write_text(json.dumps(selected,ensure_ascii=False,separators=(',',':')))
(OUT/'catalog-meta.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2));print(json.dumps(meta,ensure_ascii=False),flush=True)
