import scoutMaterials from '../data/scout-materials.json' with {type:'json'};
import {overall,ratings} from './manager-engine.js';
import {playableCard,sanitizeSkills,protectedIds,capacity} from './club-rules.js';
export const TIER=['NORMAL','RARE','SPECIAL','HERO','PLATINUM','SIGNATURE','LEGEND'];
export const CLASSIC={searchPoints:3000,searchHours:12,refreshStars:500,legendPoints:200000,signaturePoints:100000,signatureContract:'signature_contract',limitTicket:'limit_break_ticket',legendWild:'legend_wild_material',signatureWild:'signature_wild_material'};
export const BREAK_RATES={NORMAL:.1,RARE:.2,SPECIAL:.4,HERO:.6,PLATINUM:.8,SIGNATURE:1,LEGEND:1};
const rank=c=>TIER.indexOf(c.grade);
function player(state,id){const c=state.players.find(c=>c.uniqueId===id);if(!c)throw Error('선수를 찾을 수 없습니다.');return c;}
function pay(state,kind,cost){if(!['points','stars'].includes(kind))throw Error('사용할 재화를 확인해주세요.');if((state.currency[kind]||0)<cost)throw Error(kind==='stars'?'스타가 부족합니다.':'포인트가 부족합니다.');return {...state.currency,[kind]:state.currency[kind]-cost};}
function itemIndex(items,type){const i=items.findIndex(x=>x.packId===type);if(i<0)throw Error('필요한 아이템이 없습니다.');return i;}
function removeItem(items,type){const i=itemIndex(items,type);return items.filter((_,n)=>n!==i);}
function freeIds(state,includeScout=false){return protectedIds(state.lineup,includeScout?state.manager:{...state.manager,legendScout:null});}
function material(state,id,excluded=[]){const c=player(state,id);if(excluded.includes(id)||freeIds(state,true).has(id))throw Error('편성·등록 중인 선수나 대상 본인은 재료로 사용할 수 없습니다.');return c;}
function pick(array,rng){if(!array.length)throw Error('조건에 맞는 실제 선수 자료가 없습니다.');return array[Math.min(array.length-1,Math.floor(rng()*array.length))];}
function fresh(state){if(state.manager.pendingSkillChange||state.manager.pendingCombination)throw Error('진행 중인 결과 선택을 먼저 완료해주세요.');}
export function upgradeLimit(card){const legacy=Math.ceil(Math.max(0,(card.upgrade||0)-10)/2);return Math.min(20,10+2*Math.max(legacy,Math.min(5,card.limitBreaks||0)));}
export function enhanceQuote(card,kind='points'){return {limit:upgradeLimit(card),cost:kind==='stars'?50*((card.upgrade||0)+1):3000*((card.upgrade||0)+1),chance:kind==='stars'?1:Math.max(.1,1-(card.upgrade||0)*.1)};}
export function enhance(state,id,kind='points',rng=Math.random){fresh(state);const c=player(state,id),q=enhanceQuote(c,kind);if((c.upgrade||0)>=q.limit)throw Error('현재 강화 상한입니다. 한계돌파로 상한을 확장해주세요.');const currency=pay(state,kind,q.cost),success=rng()<q.chance;const updated=success?{...c,upgrade:(c.upgrade||0)+1}:c;if(success)updated.ovr=overall(updated);return {state:{...state,currency,players:state.players.map(p=>p.uniqueId===id?updated:p)},success};}
export function breakthroughQuote(target,source,kind='points'){return {chance:kind==='points'?(BREAK_RATES[source?.grade]||0):1,cost:kind==='stars'?100*((target.limitBreaks||0)+1):10000*((target.limitBreaks||0)+1),nextLimit:Math.min(20,upgradeLimit(target)+2)};}
export function breakthrough(state,id,materialId,kind='points',rng=Math.random){
 fresh(state);const c=player(state,id);if(rank(c)<2)throw Error('한계돌파는 스페셜 이상 카드부터 가능합니다.');if(upgradeLimit(c)>=20)throw Error('최대 강화 상한 +20에 도달했습니다.');
 let currency=state.currency,inventory=state.inventory,source;
 if(kind==='ticket')inventory=removeItem(inventory,CLASSIC.limitTicket);
 else{source=material(state,materialId,[id]);if(String(source.playerId)!==String(c.playerId))throw Error('연도와 관계없이 동일 선수 카드가 필요합니다.');currency=pay(state,kind,breakthroughQuote(c,source,kind).cost);}
 const q=breakthroughQuote(c,source,kind),success=rng()<q.chance;
 const updated=success?{...c,limitBreaks:Math.min(5,(upgradeLimit(c)-10)/2+1)}:c;
 return {state:{...state,currency,inventory,players:state.players.filter(p=>p.uniqueId!==source?.uniqueId).map(p=>p.uniqueId===id?updated:p)},success};
}
export const STAT_NAMES={contact:'정확',power:'파워',eye:'선구',speed:'주력',field:'수비',control:'제구',stuff:'구위',stamina:'체력'};
export const COACHES=scoutMaterials.coaches;
export const franchise=team=>({해태:'KIA',SK:'SSG',OB:'두산',MBC:'LG',빙그레:'한화',넥센:'키움',우리:'키움',히어로즈:'키움',현대:'키움',삼미:'키움',청보:'키움',태평양:'키움',쌍방울:'SSG'}[team]||team);
export function nationalEvidence(card){return scoutMaterials.national.find(n=>n.name===card.name&&n.year===card.year&&n.team===card.team)||null;}
export function legendRecipe(target,database){
 const seen=new Set();const candidates=[...database].sort((a,b)=>(a.team===target.team?0:1)-(b.team===target.team?0:1)||Math.abs(a.year-target.year)-Math.abs(b.year-target.year)||overall(b)-overall(a));
 const required=[];for(const c of candidates)if(!seen.has(c.playerId)){seen.add(c.playerId);required.push({kind:'PLAYER',cardId:c.id,playerId:c.playerId,year:c.year,team:c.team,name:c.name,grade:'PLATINUM'});if(required.length===6)break;}
 const coaches=COACHES.filter(c=>c.team===franchise(target.team)).slice(0,2);
 if(required.length!==6||coaches.length!==2)throw Error('검증된 지정 재료 자료가 부족합니다.');
 return [...required,...['올스타','MVP','골든글러브'].map(award=>({kind:'AWARD',award,team:target.team,grade:'PLATINUM'})),{kind:'NATIONAL',team:target.team,grade:'PLATINUM'},...coaches.map(c=>({...c,kind:'COACH',coachId:c.id}))];
}
export function migrateLegendRecipe(state,database){const old=state.manager.legendScout;if(!old?.target||old.recipeVersion===2)return state;const requirements=legendRecipe(old.target,database);const previousPlayers=old.requirements.filter(s=>s.kind==='PLAYER');if(previousPlayers.length===6&&previousPlayers.every(s=>database.some(c=>c.id===s.cardId)))requirements.splice(0,6,...previousPlayers);const pledges=requirements.map(slot=>{const index=old.requirements.findIndex(s=>s.kind===slot.kind&&(s.kind==='PLAYER'?s.cardId===slot.cardId:s.award===slot.award));const id=old.pledges[index];if(!id)return null;if(String(id).startsWith('item:'))return id;const c=state.players.find(c=>c.uniqueId===id);return c&&matchesLegend(c,slot)?id:null;});return {...state,manager:{...state.manager,legendScout:{...old,requirements,pledges,recipeVersion:2}}};}
export function matchesCoach(item,slot){return slot?.kind==='COACH'&&item?.packId==='coach_material'&&item.coachId===slot.coachId&&COACHES.some(c=>c.id===item.coachId&&c.team===slot.team&&c.year===slot.year&&c.name===slot.name);}
export function searchLegend(state,database,team='',instant=false,now=Date.now(),rng=Math.random){
 fresh(state);const current=state.manager.legendScout;
 if(now<(current?.nextSearchAt||0)&&!instant)throw Error('탐색 대기 시간이 남았습니다.');
 let currency=pay(state,'points',CLASSIC.searchPoints);
 if(instant){if(currency.stars<CLASSIC.refreshStars)throw Error('즉시 재탐색 스타가 부족합니다.');currency={...currency,stars:currency.stars-CLASSIC.refreshStars};}
 const pool=database.filter(c=>c.grade==='LEGEND'&&(!team||c.team===team));
 const target=playableCard(pick(pool.filter(c=>c.id!==current?.target?.id).length?pool.filter(c=>c.id!==current?.target?.id):pool,rng),'LEGEND');
 const scout={target,requirements:legendRecipe(target,database),pledges:Array(12).fill(null),recipeVersion:2,foundAt:now,nextSearchAt:now+CLASSIC.searchHours*3600000};
 return {...state,currency,manager:{...state.manager,legendScout:scout}};
}
export function matchesLegend(card,slot){if(!slot||slot.kind==='COACH'||card.grade!==slot.grade)return false;if(slot.kind==='PLAYER')return card.id===slot.cardId;const same=franchise(card.team)===franchise(slot.team);if(slot.kind==='NATIONAL')return same&&card.cardType==='NATIONAL'&&!!nationalEvidence(card);return same&&card.awards?.some(a=>a.type===slot.award);}
export function pledgeLegend(state,slotIndex,value){fresh(state);const scout=state.manager.legendScout;if(!scout?.target||!scout.requirements[slotIndex])throw Error('탐색한 레전드 후보가 없습니다.');const pledges=[...scout.pledges];
 if(value){if(!String(value).startsWith('item:')&&pledges.some((v,i)=>i!==slotIndex&&v===value))throw Error('같은 재료를 두 슬롯에 넣을 수 없습니다.');
 if(String(value).startsWith('item:')){if(value!=='item:'+CLASSIC.legendWild)throw Error('사용할 수 없는 대체 재료입니다.');const needed=pledges.filter((v,i)=>i!==slotIndex&&v===value).length+1;if(state.inventory.filter(i=>i.packId===CLASSIC.legendWild).length<needed)throw Error('레전드 만능 재료가 부족합니다.');}
 else if(String(value).startsWith('coach:')){const item=state.inventory.find(i=>String(i.id)===String(value).slice(6));if(!matchesCoach(item,scout.requirements[slotIndex]))throw Error('지정된 구단·연도·이름의 코치 재료가 필요합니다.');}
 else{const c=player(state,value);if(freeIds(state).has(value))throw Error('편성된 선수는 등록할 수 없습니다.');if(!matchesLegend(c,scout.requirements[slotIndex]))throw Error('지정된 선수·연도·등급·수상 조건과 맞지 않습니다.');}}
 pledges[slotIndex]=value;return {...state,manager:{...state.manager,legendScout:{...scout,pledges}}};
}
export function recruitLegend(state){fresh(state);const scout=state.manager.legendScout;if(!scout?.target||scout.pledges.length!==12||scout.requirements.length!==12||scout.pledges.some(v=>!v))throw Error('지정 재료 12칸을 모두 등록해주세요.');
 const cards=[],wilds=scout.pledges.filter(v=>String(v).startsWith('item:')).length;let inventory=state.inventory;
 for(let i=0;i<wilds;i++)inventory=removeItem(inventory,CLASSIC.legendWild);
 scout.pledges.forEach((id,i)=>{if(String(id).startsWith('item:'))return;if(String(id).startsWith('coach:')){const item=inventory.find(x=>String(x.id)===String(id).slice(6));if(!matchesCoach(item,scout.requirements[i]))throw Error('지정 코치 재료를 확인해주세요.');inventory=inventory.filter(x=>x!==item);return;}const c=player(state,id);if(freeIds(state).has(id)||!matchesLegend(c,scout.requirements[i]))throw Error('재료 상태가 변경되었습니다. 등록 내용을 확인해주세요.');cards.push(id);});
 if(new Set(cards).size!==cards.length)throw Error('재료 카드가 중복 등록되었습니다.');
 if(state.players.length-cards.length+1>capacity(state.manager,state.players.length))throw Error('선수 보유함이 부족합니다.');
 const currency=pay(state,'points',CLASSIC.legendPoints),ids=new Set(cards),card=scout.target;
 return {state:{...state,currency,inventory,players:[card,...state.players.filter(c=>!ids.has(c.uniqueId))],manager:{...state.manager,legendScout:{...scout,target:null,requirements:[],pledges:[]}}},card};
}
export function signatureCategory(c){
 if(c.cardType==='NATIONAL')return nationalEvidence(c)?'NATIONAL':'INVALID';
 if(c.cardType==='NORMAL'||c.grade==='NORMAL')return 'NORMAL';
 const awards=c.awards||[];
 if(c.cardType==='MVP')return awards.some(a=>a.type==='MVP')?'MVP':'INVALID';
 if(c.cardType==='GOLDEN_GLOVE')return awards.some(a=>a.type==='골든글러브')?'GOLDEN_GLOVE':'INVALID';
 if(c.cardType==='ALLSTAR')return awards.some(a=>a.type==='올스타')?'ALLSTAR':'INVALID';
 return awards.some(a=>a.type==='MVP')?'MVP':awards.some(a=>a.type==='골든글러브')?'GOLDEN_GLOVE':awards.some(a=>a.type==='올스타')?'ALLSTAR':'NORMAL';
}
export function signatureRequirements(base,route='AWARD',stat=base.pos==='P'?'stuff':'power'){
 if(!['AWARD','REGULAR'].includes(route)||!(stat in ratings(base)))throw Error('재료 경로와 대상 포지션의 능력치를 선택해주세요.');
 return Array.from({length:route==='AWARD'?5:10},()=>({kind:'STAT',stat,threshold:95,categories:route==='AWARD'?['MVP','GOLDEN_GLOVE']:['NORMAL','NATIONAL','ALLSTAR']}));
}
export function matchesSignature(c,slot){return (ratings(c)[slot.stat]||0)>slot.threshold&&slot.categories.includes(signatureCategory(c));}
export function awakenSignature(state,id,materialIds,options={}){fresh(state);const base=player(state,id);if(base.grade!=='PLATINUM'||(base.upgrade||0)<20)throw Error('시그니처 각성 대상은 +20강 플래티넘 카드입니다.');const slots=signatureRequirements(base,options.route,options.stat);if(materialIds.length!==slots.length||materialIds.some(v=>!v))throw Error(`각성 재료 ${slots.length}칸을 모두 채워주세요.`);
 let inventory=removeItem(state.inventory,CLASSIC.signatureContract);const consumed=[];
 materialIds.forEach((mid,i)=>{if(mid==='item:'+CLASSIC.signatureWild){inventory=removeItem(inventory,CLASSIC.signatureWild);return;}const c=material(state,mid,[id]);if(rank(c)>4)throw Error('시그니처·레전드는 각성 재료에서 보호됩니다.');if(!matchesSignature(c,slots[i]))throw Error('재료 유형과 지정 능력치 95 초과 조건을 확인해주세요.');consumed.push(mid);});
 if(new Set(consumed).size!==consumed.length)throw Error('같은 카드를 여러 재료로 사용할 수 없습니다.');
 const card={...base,grade:'SIGNATURE',cardType:'SIGNATURE'};card.skills=sanitizeSkills(card);card.ovr=overall(card);const gone=new Set(consumed),currency=pay(state,'points',CLASSIC.signaturePoints);
 return {state:{...state,currency,inventory,players:state.players.filter(c=>!gone.has(c.uniqueId)).map(c=>c.uniqueId===id?card:c)},card};
}
export const COMBO_PROBABILITIES=[{grades:['NORMAL','RARE','SPECIAL'],weights:[70,25,5]},{grades:['NORMAL','RARE','SPECIAL'],weights:[10,65,25]},{grades:['RARE','SPECIAL','HERO'],weights:[15,65,20]},{grades:['SPECIAL','HERO','PLATINUM'],weights:[20,65,15]},{grades:['HERO','PLATINUM'],weights:[30,70]}];
function comboGrade(materials,mode,rng){if(mode==='STAR')return TIER[Math.min(4,Math.max(...materials.map(rank)))];const rule=COMBO_PROBABILITIES[Math.min(4,Math.min(...materials.map(rank)))];let r=rng()*100;for(let i=0;i<rule.weights.length;i++){r-=rule.weights[i];if(r<0)return rule.grades[i];}return rule.grades.at(-1);}
export function startCombination(state,ids,mode,database,position='',rng=Math.random){fresh(state);if(ids.length<3||ids.length>5||new Set(ids).size!==ids.length)throw Error('서로 다른 재료 카드 3~5장을 선택해주세요.');if(!['NORMAL','POSITION','STAR'].includes(mode))throw Error('조합 방식을 확인해주세요.');const materials=ids.map(id=>material(state,id));if(materials.some(c=>rank(c)>4))throw Error('시그니처·레전드 카드는 일반 조합 재료로 사용할 수 없습니다.');
 if(mode==='POSITION'&&(!position||materials.some(c=>!(c.positions||[c.pos]).includes(position))))throw Error('모든 재료가 선택한 포지션을 소화해야 합니다.');
 const pool=database.filter(c=>mode!=='POSITION'||c.pos===position);if(!pool.length)throw Error('해당 포지션의 결과 선수가 없습니다.');
 const grade=comboGrade(materials,mode,rng),shuffle=rank({grade})>=3||mode==='STAR',choices=Array.from({length:shuffle?7:1},()=>playableCard(pick(pool,rng),grade));const gone=new Set(ids);
 const currency=mode==='STAR'?pay(state,'stars',500):state.currency;
 return {...state,currency,players:state.players.filter(c=>!gone.has(c.uniqueId)),manager:{...state.manager,pendingCombination:{phase:shuffle?'preview':'single',choices,materialIds:ids,mode,grade}}};
}
export function shuffleCombination(state,rng=Math.random){const pending=state.manager.pendingCombination;if(pending?.phase!=='preview')throw Error('섞을 조합 결과가 없습니다.');const choices=[...pending.choices];for(let i=choices.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}return {...state,manager:{...state.manager,pendingCombination:{...pending,choices,phase:'hidden'}}};}
export function claimCombination(state,index){const p=state.manager.pendingCombination;if(!p||!['hidden','single'].includes(p.phase)||!Number.isInteger(index)||!p.choices[index])throw Error('선택 가능한 조합 결과가 없습니다.');if(state.players.length>=capacity(state.manager,state.players.length))throw Error('선수 보유함이 부족합니다.');const card=p.choices[index];return {state:{...state,players:[card,...state.players],manager:{...state.manager,pendingCombination:null}},card};}
