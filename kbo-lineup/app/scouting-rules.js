import {legendCandidates} from './legend-registry.js';
import {migrateLegendRecipe,legendRecipe,matchesLegend,matchesCoach,CLASSIC} from './classic-progression.js';
import {playableCard,protectedIds,capacity} from './club-rules.js';
import {ownedCoaches,coachAssigned} from './coaching.js';
export const SCOUT_CONFIG={legendTicketStars:20000,normalPoints:3000,advancedStars:100,slotStars:500,maxSlots:12,homeChance:.45};
export const VENUES=[['삼성','대구'],['LG','LG 잠실'],['두산','두산 잠실'],['KIA','광주'],['키움','고척'],['롯데','사직'],['SSG','인천'],['한화','대전'],['KT','수원'],['NC','창원']];
export const venueTeam=t=>({해태:'KIA',MBC:'LG',OB:'두산',SK:'SSG',빙그레:'한화',넥센:'키움',우리:'키움',히어로즈:'키움'}[t]||t);
const busy=s=>{if(s.manager.pendingSkillChange||s.manager.pendingCombination)throw Error('진행 중인 결과 선택을 먼저 완료해주세요.');};
const pick=(a,rng)=>{if(!a.length)throw Error('선택한 장소의 후보가 없습니다.');return a[Math.min(a.length-1,Math.floor(rng()*a.length))];};
export function migrateScouting(state,database){if(database&&state.manager?.legendScout?.target&&state.manager.legendScout.requirements?.length!==12)state=migrateLegendRecipe(state,database);const manager=state.manager||{};let scouting=manager.scouting||{version:2,capacity:1,queue:[],books:{}};const old=manager.legendScout;
 if(old?.target&&!scouting.legacyImported){const id=old.target.id;scouting={...scouting,legacyImported:true,queue:[...scouting.queue,{id:old.target.uniqueId||crypto.randomUUID(),card:old.target,foundAt:old.foundAt}],books:{...scouting.books,[id]:{...old,pledges:[...(old.pledges||Array(12).fill(null))]}}};}
 const convert=i=>i.packId==='legend_recruit_permit'?{...i,packId:'legend_scout_ticket',name:'레전드 스카우트권'}:i;
 const inventory=(state.inventory||[]).map(convert);const mailbox=(state.mailbox||[]).map(m=>{if(m.packId==='legend_recruit_permit')return {...m,packId:'legend_scout_ticket',title:'기존 영입 증서 → 레전드 스카우트권'};return m;});
 return {...state,inventory,mailbox,manager:{...manager,legendScout:null,scouting:{...scouting,capacity:Math.min(12,Math.max(1,scouting.capacity||1,scouting.queue.length))}}};
}
export function prepareLegend(state,target,database){state=migrateScouting(state);const sc=state.manager.scouting;if(sc.books[target.id])return state;return {...state,manager:{...state.manager,scouting:{...sc,books:{...sc.books,[target.id]:{target,requirements:legendRecipe(target,database),pledges:Array(12).fill(null)}}}}};}
export function expandScout(state){busy(state);state=migrateScouting(state);const sc=state.manager.scouting;if(sc.capacity>=12)throw Error('최대 12칸입니다.');if(state.currency.stars<500)throw Error('500스타가 필요합니다.');return {...state,currency:{...state.currency,stars:state.currency.stars-500},manager:{...state.manager,scouting:{...sc,capacity:sc.capacity+1}}};}
export function venueCandidate(pool,team,rng=Math.random){const home=pool.filter(c=>venueTeam(c.team)===team),away=pool.filter(c=>venueTeam(c.team)!==team);if(!home.length||!away.length)throw Error('이 장소에서 45% 홈팀 추첨을 지원하는 후보가 부족합니다. 다른 장소를 선택하세요.');return pick(rng()<.45?home:away,rng);}
export function scout(state,database,kind,team,rng=Math.random){busy(state);state=migrateScouting(state);const sc=state.manager.scouting;
 if(!VENUES.some(v=>v[0]===team))throw Error('스카우트 장소를 선택하세요.');if(!['NORMAL','ADVANCED','LEGEND'].includes(kind))throw Error('스카우트 종류를 확인하세요.');
 let inventory=state.inventory,currency=state.currency;
 if(kind==='LEGEND'){if(sc.queue.length>=sc.capacity)throw Error('스카우트 대기가 가득 찼습니다.');const index=inventory.findIndex(i=>i.packId==='legend_scout_ticket');if(index<0)throw Error('레전드 스카우트권이 필요합니다. 상점 가격은 20,000스타입니다.');inventory=inventory.filter((_,i)=>i!==index);}
 else{if(state.players.length>=capacity(state.manager,state.players.length))throw Error('선수 보유함이 가득 찼습니다.');const field=kind==='NORMAL'?'points':'stars',cost=kind==='NORMAL'?3000:100;if(currency[field]<cost)throw Error('재화가 부족합니다.');currency={...currency,[field]:currency[field]-cost};}
 const base=venueCandidate(kind==='LEGEND'?legendCandidates():database.filter(c=>!c.legendKind),team,rng);
 const roll=rng(),grade=kind==='LEGEND'?'LEGEND':kind==='ADVANCED'?(roll<.6?'SPECIAL':roll<.9?'HERO':'PLATINUM'):(roll<.5?'NORMAL':roll<.75?'RARE':roll<.93?'SPECIAL':roll<.99?'HERO':'PLATINUM');
 const card=playableCard(base,grade);let next={...state,currency,inventory};
 if(kind==='LEGEND'){next=prepareLegend(next,card,database);next={...next,manager:{...next.manager,scouting:{...next.manager.scouting,queue:[...sc.queue,{id:crypto.randomUUID(),card,venue:team,foundAt:Date.now()}]}}};}else next={...next,players:[card,...next.players]};
 return {state:next,card,waiting:kind==='LEGEND'};
}
export function registerMaterial(state,targetId,index,value){busy(state);state=migrateScouting(state);const sc=state.manager.scouting,book=sc.books[targetId],slot=book?.requirements[index];if(!slot)throw Error('재료 칸을 확인해주세요.');if(!value||book.pledges[index])throw Error('사전등록은 취소·교체할 수 없습니다.');
 const used=new Set(Object.values(sc.books).flatMap(b=>b.pledges).filter(Boolean));if(used.has(value))throw Error('다른 레전드에 이미 등록한 재료입니다.');
 if(String(value).startsWith('wild:')){const item=state.inventory.find(x=>String(x.id)===String(value).slice(5));if(!item||item.packId!==CLASSIC.legendWild||!['AWARD','NATIONAL'].includes(slot.kind)||book.pledges.filter(v=>String(v).startsWith('wild:')||String(v).startsWith('item:')).length>=2)throw Error('만능 재료는 수상·국가대표 칸에 최대 2개까지 등록할 수 있습니다.');}
 else if(String(value).startsWith('coach:')){const c=ownedCoaches(state).find(i=>String(i.id)===String(value).slice(6));if(coachAssigned(state.manager,c?.id)||!matchesCoach(c,slot))throw Error('편성하지 않은 지정 코치가 필요합니다.');}
 else{const card=state.players.find(c=>c.uniqueId===value);if(protectedIds(state.lineup,state.manager).has(value)||!card||!matchesLegend(card,slot))throw Error('편성하지 않은 지정 조건의 카드가 필요합니다.');}
 const pledges=book.pledges.map((v,i)=>i===index?value:v);return {...state,manager:{...state.manager,scouting:{...sc,books:{...sc.books,[targetId]:{...book,pledges}}}}};
}
export function recruitScout(state,targetId){busy(state);state=migrateScouting(state);const sc=state.manager.scouting,book=sc.books[targetId],candidate=sc.queue.find(c=>c.card.id===targetId);
 if(!candidate)throw Error('이 레전드를 스카우트해 대기 목록에 등록해야 합니다.');if(!book||book.pledges.length!==12||book.pledges.some(v=>!v))throw Error('재료 12칸을 모두 등록하세요.');if(state.currency.points<CLASSIC.legendPoints)throw Error('1,000,000포인트가 필요합니다.');
 const active=protectedIds(state.lineup,{...state.manager,scouting:null,legendScout:null}),ids=new Set(),coachIds=new Set();let inventory=[...state.inventory];
 for(let i=0;i<12;i++){const id=book.pledges[i];if(ids.has(id))throw Error('재료가 중복되었습니다.');ids.add(id);if(String(id).startsWith('wild:')){const n=inventory.findIndex(x=>String(x.id)===String(id).slice(5)&&x.packId===CLASSIC.legendWild);if(n<0)throw Error('등록한 만능 재료가 없습니다.');inventory.splice(n,1);continue;}if(String(id).startsWith('item:')){const n=inventory.findIndex(x=>x.packId===String(id).slice(5));if(n<0)throw Error('기존 등록 만능 재료가 부족합니다.');inventory.splice(n,1);continue;}if(String(id).startsWith('coach:')){const uid=String(id).slice(6),coach=ownedCoaches(state).find(x=>String(x.id)===uid);if(coachAssigned(state.manager,coach?.id)||!matchesCoach(coach,book.requirements[i]))throw Error('등록된 코치를 확인하세요.');coachIds.add(uid);}else{const c=state.players.find(c=>c.uniqueId===id);if(active.has(id)||!c||!matchesLegend(c,book.requirements[i]))throw Error('등록된 선수를 확인하세요.');}}
 const players=state.players.filter(c=>!ids.has(c.uniqueId));if(players.length+1>capacity(state.manager,state.players.length))throw Error('보유함이 부족합니다.');
 const books={...sc.books,[targetId]:{...book,pledges:Array(12).fill(null)}};return {state:{...state,inventory,currency:{...state.currency,points:state.currency.points-CLASSIC.legendPoints},players:[candidate.card,...players],manager:{...state.manager,coachCards:ownedCoaches(state).filter(c=>!coachIds.has(String(c.id))),scouting:{...sc,books,queue:sc.queue.filter(c=>c.id!==candidate.id)}}},card:candidate.card};
}
export function dismissScout(state,id){busy(state);state=migrateScouting(state);const sc=state.manager.scouting;return {...state,manager:{...state.manager,scouting:{...sc,queue:sc.queue.filter(c=>c.id!==id)}}};}
