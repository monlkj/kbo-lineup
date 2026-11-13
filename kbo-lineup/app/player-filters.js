import {eligible,overall} from './manager-engine.js';
export const GRADE_OPTIONS=[['NORMAL','노멀'],['RARE','레어'],['SPECIAL','스페셜'],['HERO','히어로'],['PLATINUM','플래티넘'],['SIGNATURE','시그니처'],['LEGEND','레전드']];
export const EMPTY_FILTERS={query:'',grade:'',position:'',minOvr:'',team:'',awards:false,sort:'ovr-desc'};
const identity=c=>c.playerId!=null?`p:${String(c.playerId)}`:`c:${c.uniqueId||c.id}`;
export function unassignedPlayers(players,lineup={},staff={}){
 const byId=new Map(players.map(c=>[c.uniqueId,c]));
 const assigned=[...Object.values(lineup).filter(Boolean),...(staff.starters||[]).map(id=>byId.get(id)),...(staff.relief||[]).map(id=>byId.get(id))].filter(Boolean);
 const used=new Set(assigned.map(identity));return players.filter(c=>!used.has(identity(c)));
}
export function filterPlayers(players,f=EMPTY_FILTERS,lockedPosition=''){
 const q=(f.query||'').trim().toLowerCase(),pos=lockedPosition||f.position;
 const min=String(f.minOvr??'').trim()===''?0:Number(f.minOvr);
 const found=players.filter(c=>(!q||`${c.name} ${c.year} ${c.team}`.toLowerCase().includes(q))&&(!f.grade||c.grade===f.grade)&&(!pos||eligible(c,pos))&&(!f.team||c.team===f.team)&&(!f.awards||c.awards?.length)&&(!Number.isFinite(min)||overall(c)>=min));
 return found.sort((a,b)=>f.sort==='ovr-asc'?overall(a)-overall(b):f.sort==='name'?a.name.localeCompare(b.name,'ko')||b.year-a.year:f.sort==='year'?b.year-a.year||overall(b)-overall(a):overall(b)-overall(a)||b.year-a.year);
}
