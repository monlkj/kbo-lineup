export const BAT_POS = ['CF','LF','RF','SS','2B','3B','1B','C','DH'];
export const TEAMS = ['KIA','삼성','LG','두산','KT','SSG','롯데','한화','NC','키움'];
export const BATTING = {contact:'정확',power:'파워',eye:'선구',speed:'주력',field:'수비'};
export const PITCHING = {control:'제구',stuff:'구위',stamina:'체력'};
export const clamp=(n,a=30,b=99)=>Math.max(a,Math.min(b,Math.round(n)));
export function ratings(card) {
 const s=card.stats||{};
 const base=card.pos==='P'?{control:clamp(91-(s.bb||0)/Math.max(1,s.ip||1)*30),stuff:clamp(45+(s.so||0)/Math.max(1,s.ip||1)*35),stamina:clamp(42+(s.ip||0)/Math.max(1,s.g||1)*8)}:{contact:clamp(35+(s.avg||0)*150),power:clamp(40+(s.hr||0)/Math.max(1,s.pa||1)*600),eye:clamp(50+Math.max(0,(s.pa||0)-(s.ab||0))/Math.max(1,s.pa||1)*160),speed:clamp(45+(s.sb||0)/Math.max(1,s.pa||1)*500),field:clamp((s.fpct||.95)*100-10)};
 return Object.fromEntries(Object.entries(base).map(([k,v])=>[k,clamp(v+(card.growth?.[k]||0)+(card.upgrade||0))]));
}
export const overall=c=>Math.round(Object.values(ratings(c)).reduce((a,b)=>a+b,0)/Object.keys(ratings(c)).length);
export function makeCard(c){return {...c,uniqueId:crypto.randomUUID(),upgrade:0,ovr:overall(c),xp:0,training:0,growth:{},condition:0,fatigue:0,skills:c.skills||[]};}
export function eligible(c,pos){return pos==='DH'?c.pos!=='P':(c.positions||[c.pos]).includes(pos);}
export function deckBonus(cards){
 const teams={},years={};cards.filter(Boolean).forEach(c=>{teams[c.team]=(teams[c.team]||0)+1;years[c.year]=(years[c.year]||0)+1;});
 const team=Object.entries(teams).sort((a,b)=>b[1]-a[1])[0]||['없음',0],year=Object.entries(years).sort((a,b)=>b[1]-a[1])[0]||['없음',0];
 const points=n=>n>=12?5:n>=9?3:n>=6?2:n>=3?1:0;
 return {team:team[0],teamCount:team[1],year:year[0],yearCount:year[1],teamBonus:points(team[1]),yearBonus:points(year[1]),total:points(team[1])+points(year[1])};
}
export function lineupError(lineup,order,staff){
 if(BAT_POS.some(p=>!lineup[p]))return '야수 9개 포지션을 모두 채워주세요.';
 if(order.length!==9||new Set(order).size!==9||order.some(p=>!BAT_POS.includes(p)))return '타순을 1~9번까지 구성해주세요.';
 const field=BAT_POS.map(p=>lineup[p]);
 if(field.some((c,i)=>!eligible(c,BAT_POS[i])))return '선수의 확인된 포지션에 맞게 배치해주세요.';
 if(staff.starters.length!==5||staff.relief.length!==3||Array.from({length:5},(_,i)=>staff.starters[i]).some(c=>!c)||Array.from({length:3},(_,i)=>staff.relief[i]).some(c=>!c))return '선발 5명과 중간·셋업·마무리 3명을 등록해주세요.';
 const all=[...field,...staff.starters,...staff.relief];
 if(new Set(all.map(c=>String(c.playerId))).size!==all.length)return '동일 선수는 연도가 달라도 한 명만 출전할 수 있습니다.';
 if([...staff.starters,...staff.relief].some(c=>c.pos!=='P'))return '투수 보직에는 투수만 등록해주세요.';
 return '';
}
export function schedule(){
 let rotation=[...TEAMS];const rounds=[];
 for(let r=0;r<9;r++){rounds.push(Array.from({length:5},(_,i)=>[rotation[i],rotation[9-i]]));rotation=[rotation[0],rotation[9],...rotation.slice(1,9)];}
 return Array.from({length:144},(_,d)=>rounds[d%9].map(([a,b],i)=>(Math.floor(d/9)+i)%2?[b,a]:[a,b]));
}
export function newSeason(year=2026){return {year,day:0,standings:Object.fromEntries(TEAMS.map(t=>[t,{w:0,l:0,d:0,rf:0,ra:0}])),batters:{},pitchers:{},history:[],postseason:null,complete:false};}
export function sortedStandings(s){return Object.entries(s.standings).sort((a,b)=>b[1].w/Math.max(1,b[1].w+b[1].l)-a[1].w/Math.max(1,a[1].w+a[1].l)||b[1].w-a[1].w||(b[1].rf-b[1].ra)-(a[1].rf-a[1].ra));}
const randomInt=(n,r)=>Math.floor(r()*n);
export const TACTICS={BALANCED:{name:'균형',contact:0,power:0,speed:0,note:'능력치 보정 없음'},CONTACT:{name:'정교',contact:6,power:-4,speed:0,note:'경기 중 정확 +6 / 파워 -4'},POWER:{name:'장타',contact:-5,power:8,speed:0,note:'경기 중 파워 +8 / 정확 -5'},RUN:{name:'기동력',contact:0,power:-4,speed:10,note:'경기 중 주력 +10 / 파워 -4'}};
export function playGame(home,away,{rng=Math.random,bonusHome=0,bonusAway=0}={}){
 const totals=[0,0], innings=[[],[]], batters={},pitchers={};let cursor=[0,0];
 const teams=[away,home],bonus=[bonusAway,bonusHome];
 function batterStat(c){return batters[c.uniqueId] ||= {name:c.name,playerId:c.playerId,ab:0,h:0,hr:0,rbi:0,bb:0,so:0,r:0,sb:0};}
 function pitcherStat(c){return pitchers[c.uniqueId] ||= {name:c.name,playerId:c.playerId,outs:0,er:0,so:0,bb:0,h:0,w:0,l:0,sv:0};}
 for(let inn=0;inn<12;inn++){
  for(let side=0;side<2;side++){
   if(side===1&&inn>=8&&totals[1]>totals[0]){innings[side].push('X');continue;}
   const offense=teams[side],defense=teams[1-side];
   const pc=inn<6?defense.starter:inn<7?defense.relief[0]:inn<8?defense.relief[1]:defense.relief[2];
   const pr=ratings(pc),ps=pitcherStat(pc);let outs=0,bases=[null,null,null],runs=0;
   const score=c=>{runs++;batterStat(c).r++;};
   let plate=0;
   while(outs<3&&plate++<100){
    const c=offense.batters[cursor[side]++%9],br=ratings(c),bs=batterStat(c);const tactic=TACTICS[offense.tactic]||TACTICS.BALANCED;for(const k of ['contact','power','speed'])br[k]=clamp(br[k]+tactic[k]);const adjust=bonus[side]+(c.condition||0)*2-(pc.condition||0)*2;
    const tired=(pc.fatigue||0)*.001+Math.max(0,inn-3)*(100-pr.stamina)*.00015;
    const fielding=defense.batters.reduce((sum,c)=>sum+ratings(c).field,0)/9;
    const hitChance=Math.max(.13,Math.min(.43,.25+(br.contact-pr.stuff+adjust)*.003+tired+(80-fielding)*.0006));
    const walkChance=Math.max(.025,Math.min(.17,.07+(br.eye-pr.control+adjust)*.0015));const roll=rng();
    if(roll<walkChance){bs.bb++;ps.bb++;if(bases[0]&&bases[1]&&bases[2]){score(bases[2]);bs.rbi++;}if(bases[0]&&bases[1])bases[2]=bases[1];if(bases[0])bases[1]=bases[0];bases[0]=c;}
    else if(roll<walkChance+hitChance){bs.ab++;bs.h++;ps.h++;let n=rng()<Math.max(.015,(br.power+adjust-35)*.0014)?4:rng()<.26?2:1;
     if(n===4){bs.hr++;for(const base of bases)if(base){score(base);bs.rbi++;}score(c);bs.rbi++;bases=[null,null,null];}
     else{for(let b=2;b>=0;b--)if(bases[b]){if(b+n>=3){score(bases[b]);bs.rbi++;}else bases[b+n]=bases[b];bases[b]=null;}bases[n-1]=c;}
    }else{bs.ab++;outs++;ps.outs++;if(rng()<Math.max(.1,.22+(pr.stuff-br.eye)*.003)){bs.so++;ps.so++;}else if(outs<3&&bases[2]&&rng()<.22){score(bases[2]);bs.rbi++;bases[2]=null;}}
    if(bases[0]&&!bases[1]&&rng()<(clamp(ratings(bases[0]).speed+tactic.speed)-30)*.001){batterStat(bases[0]).sb++;bases[1]=bases[0];bases[0]=null;}
    if(side===1&&inn>=8&&totals[1]+runs>totals[0])break;
   }
   ps.er+=runs;totals[side]+=runs;innings[side].push(runs);
  }
  if(inn>=8&&totals[0]!==totals[1])break;
 }
 if(totals[0]!==totals[1]){const winner=totals[0]>totals[1]?0:1,loser=1-winner;pitcherStat(teams[winner].starter).w++;pitcherStat(teams[loser].starter).l++;if(Math.abs(totals[0]-totals[1])<=3){const closer=teams[winner].relief[2];if(pitchers[closer.uniqueId]?.outs)pitcherStat(closer).sv++;}}
 return {home:home.name,away:away.name,homeScore:totals[1],awayScore:totals[0],innings,batters,pitchers,tactics:{[home.name]:home.tactic||'BALANCED',[away.name]:away.tactic||'BALANCED'}};
}
const teamCache=new WeakMap();
export function buildTeam(name,catalog,day=0){
 let cached=teamCache.get(catalog);
 if(!cached){cached={};teamCache.set(catalog,cached);}
 if(cached[name]){const x=cached[name];return {name,batters:x.selected,starter:x.ps[day%5],relief:x.ps.slice(5,8)};}
 const selected=[],used=new Set();
 const pool=[...catalog.filter(c=>c.team===name),...catalog].sort((a,b)=>(a.team===name?0:1)-(b.team===name?0:1)||overall(b)-overall(a));
 for(const pos of BAT_POS){const c=pool.find(c=>!used.has(c.playerId)&&eligible(c,pos));if(!c)throw new Error('해당 포지션의 검증된 선수가 부족합니다: '+pos);used.add(c.playerId);selected.push({...c,uniqueId:`AI-${name}-${c.id}`});}
 const ps=pool.filter(c=>c.pos==='P'&&!used.has(c.playerId)).filter((c,i,arr)=>arr.findIndex(p=>p.playerId===c.playerId)===i).slice(0,8).map(c=>({...c,uniqueId:`AI-${name}-${c.id}`}));
 cached[name]={selected,ps};return {name,batters:selected,starter:ps[day%5],relief:ps.slice(5,8)};
}
function addStats(target,source){for(const [id,s] of Object.entries(source)){if(!target[id])target[id]={...s};else for(const [k,v] of Object.entries(s))if(typeof v==='number'&&k!=='playerId')target[id][k]=(target[id][k]||0)+v;}}
export function simulateDay(season,userTeam,catalog,rng=Math.random){
 if(season.day>=144)throw new Error('정규시즌이 종료되었습니다.');
 const s=structuredClone(season),games=schedule()[s.day];let result;
 for(const [h,a] of games){const home=h===userTeam.name?userTeam:buildTeam(h,catalog,s.day),away=a===userTeam.name?userTeam:buildTeam(a,catalog,s.day);const res=playGame(home,away,{rng,bonusHome:h===userTeam.name?userTeam.bonus:0,bonusAway:a===userTeam.name?userTeam.bonus:0});
  const hs=s.standings[h],as=s.standings[a];hs.rf+=res.homeScore;hs.ra+=res.awayScore;as.rf+=res.awayScore;as.ra+=res.homeScore;
  if(res.homeScore===res.awayScore){hs.d++;as.d++;}else if(res.homeScore>res.awayScore){hs.w++;as.l++;}else{as.w++;hs.l++;}
  if(h===userTeam.name||a===userTeam.name){result=res;addStats(s.batters,res.batters);addStats(s.pitchers,res.pitchers);s.history.unshift({day:s.day+1,...res,batters:undefined,pitchers:undefined});}
 }
 s.day++;return {season:s,result};
}
export function advancePlayers(cards,participants,starterId,rng=Math.random){const ids=new Set(participants.map(c=>c.uniqueId));return cards.map(c=>{
 const next={...c,fatigue:Math.max(0,(c.fatigue||0)-6)};if(!ids.has(c.uniqueId))return next;
 const xp=(c.xp||0)+1;next.training=(c.training||0)+(xp%10===0?3:0);next.xp=xp;
 next.condition=Math.max(-2,Math.min(2,(c.condition||0)+(rng()<.2?(rng()<.5?-1:1):0)));
 if(c.uniqueId===starterId)next.fatigue=Math.min(100,next.fatigue+30);return next;
 });}
export function trainStat(card,key){if(!(key in ratings(card)))throw new Error('선수에게 없는 능력치입니다.');if(!(card.training>0))throw new Error('성장 포인트가 없습니다.');if(ratings(card)[key]>=99)throw new Error('최대 능력치입니다.');const next={...card,training:card.training-1,growth:{...card.growth,[key]:(card.growth?.[key]||0)+1}};next.ovr=overall(next);return next;}
export function startPostseason(season){const ranked=sortedStandings(season).map(([t])=>t);return {ranked,stage:0,wins:[0,0],match:[ranked[3],ranked[4]],games:[],champion:null};}
export function playPostseason(post,userTeam,catalog,rng=Math.random){
 const p=structuredClone(post);if(p.champion)return p;
 const [a,b]=p.match;const game=playGame(a===userTeam.name?userTeam:buildTeam(a,catalog,p.games.length),b===userTeam.name?userTeam:buildTeam(b,catalog,p.games.length),{rng});
 // A tied wildcard advances fourth place; later series replay a tied game.
 if(game.homeScore===game.awayScore){if(p.stage===0)p.wins[0]++;}else p.wins[game.homeScore>game.awayScore?0:1]++;
 p.games.unshift({...game,batters:undefined,pitchers:undefined,stage:p.stage});
 const targets=p.stage===0?[1,2]:[p.stage===3?4:3,p.stage===3?4:3];
 const winner=p.wins[0]>=targets[0]?a:p.wins[1]>=targets[1]?b:null;
 if(winner){if(p.stage===3)p.champion=winner;else{p.stage++;p.match=[p.ranked[3-p.stage],winner];p.wins=[0,0];}}
 return p;
}
