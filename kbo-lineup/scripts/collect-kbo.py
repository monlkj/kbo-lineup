# Generated-data maintenance: see scripts/README.md.
from pathlib import Path
import os
PROJECT=Path(__file__).resolve().parents[1]
WORK=Path(os.environ.get('KBO_WORK_DIR',str(PROJECT/'.data-work')))
WORK.mkdir(parents=True,exist_ok=True)
import requests,bs4,re,json,time,concurrent.futures,threading
from pathlib import Path
BASE='https://www.koreabaseball.com/'
CACHE=(WORK/'kbo-source');CACHE.mkdir(exist_ok=True)
OUT=(PROJECT/'data');OUT.mkdir(exist_ok=True)
lock=threading.Lock()
def fields(sp):
 d={x['name']:x.get('value','') for x in sp.select('input[name]') if x.get('type')!='submit'}
 for sel in sp.select('select[name]'):
  o=sel.select_one('option[selected]') or sel.select_one('option');d[sel['name']]=o.get('value','') if o else ''
 return d

def collect(kind,year):
 dest=CACHE/f'{kind if kind=="def" else kind+"all"}-{year}.json'
 if dest.exists():return json.loads(dest.read_text())
 paths={'pitch':'Record/Player/PitcherBasic/Basic1.aspx','hit':'Record/Player/HitterBasic/Basic1.aspx','def':'Record/Player/Defense/Basic.aspx','hit2':'Record/Player/HitterBasic/Basic2.aspx','run':'Record/Player/Runner/Basic.aspx'}
 url=BASE+paths[kind];ss=requests.Session()
 for attempt in range(3):
  try:
   sp=bs4.BeautifulSoup(ss.get(url,timeout=40).content,'html.parser');d=fields(sp)
   key=next(n for n in d if n.endswith('ddlSeason$ddlSeason'));d[key]=str(year);d['__EVENTTARGET']=key;d['__EVENTARGUMENT']=''
   sp=bs4.BeautifulSoup(ss.post(url,data=d,timeout=40).content,'html.parser')
   if kind!='def':
    d=fields(sp)
    for key in d:
     if key.endswith('$hfOrderByCol'):d[key]='BB_CN' if kind=='hit2' else 'GAME_CN'
     if key.endswith('$hfOrderBy'):d[key]='DESC'
    d['__EVENTTARGET']='ctl00$ctl00$ctl00$cphContents$cphContents$cphContents$lbtnOrderBy';d['__EVENTARGUMENT']=''
    sp=bs4.BeautifulSoup(ss.post(url,data=d,timeout=40).content,'html.parser')
   records=[];pages=set()
   for page in range(90):
    rows=[]
    for tr in sp.select('table tbody tr'):
     a=tr.select_one('a[href*="playerId="]');td=tr.select('td')
     if not a:continue
     rec={'playerId':re.search(r'playerId=(\d+)',a['href'])[1],'name':a.get_text(strip=True),'year':year,'team':td[2].get_text(strip=True),'source':url,'values':[t.get_text(' ',strip=True) for t in td]}
     if kind=='def':rec['pos']=td[3].get_text(strip=True)
     rows.append(rec)
    sig=tuple((r['playerId'],r.get('pos','')) for r in rows)
    if not rows or sig in pages:break
    pages.add(sig);records.extend(rows)
    active=sp.select_one('.paging .on');n=int(active.get_text()) if active and active.get_text().isdigit() else page+1
    nxt=next((a for a in sp.select('.paging a') if a.get_text(strip=True)==str(n+1)),None)
    if not nxt:nxt=sp.select_one('.paging a[id$="btnNext"]')
    if not nxt or not nxt.get('href','').startswith('javascript:'):break
    target=re.search(r"__doPostBack\('([^']+)'",nxt['href'])
    if not target:break
    d=fields(sp);d['__EVENTTARGET']=target[1];d['__EVENTARGUMENT']=''
    time.sleep(.08)
    sp=bs4.BeautifulSoup(ss.post(url,data=d,timeout=40).content,'html.parser')
   dest.write_text(json.dumps(records,ensure_ascii=False));print(f'{kind} {year}: {len(records)}',flush=True);return records
  except Exception as e:
   if attempt==2:print('FAILED',kind,year,str(e),flush=True);return []
   time.sleep(1)

if __name__=='__main__':
 jobs=[('pitch',y) for y in range(1982,2026)]+[(k,y) for y in range(2001,2026) for k in ['def','hit']]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  list(pool.map(lambda x:collect(*x),jobs))
 print('COLLECTION COMPLETE',flush=True)
