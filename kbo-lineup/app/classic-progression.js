import {cardLevel,levelLimit,migrateGrowth,addEnhancement} from './growth-rules.js';
import {legendCandidates} from './legend-registry.js';
import {coachAssigned,ownedCoaches,migrateCoachStorage} from './coaching.js';
import scoutMaterials from '../data/scout-materials.json' with {type:'json'};
import {overall,ratings} from './manager-engine.js';
import {playableCard,sanitizeSkills,protectedIds,capacity} from './club-rules.js';
export const TIER=['NORMAL','RARE','SPECIAL','HERO','PLATINUM','SIGNATURE','LEGEND'];
export const CLASSIC={searchPoints:3000,searchHours:12,refreshStars:500,legendPoints:1000000,signaturePoints:100000,signatureContract:'signature_contract',limitTicket:'limit_break_ticket',legendPermit:'legend_recruit_permit',legendMaterialCoins:10,legendWild:'legend_wild_material',signatureWild:'signature_wild_material'};
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
export const upgradeLimit=levelLimit;
export function enhanceQuote(card,kind='points'){return {limit:levelLimit(card),cost:kind==='stars'?50*cardLevel(card):3000*cardLevel(card),chance:kind==='stars'?1:Math.max(.1,1-(cardLevel(card)-1)*.04)};}
export function enhance(state,id,kind='points',rng=Math.random){fresh(state);const c=player(state,id),q=enhanceQuote(c,kind);if(cardLevel(c)>=q.limit)throw Error('현재 레벨 상한입니다. 한계돌파 또는 초월돌파가 필요합니다.');const currency=pay(state,kind,q.cost),success=rng()<q.chance,updated=success?addEnhancement(c,rng):c;return {state:{...state,currency,players:state.players.map(p=>p.uniqueId===id?{...updated,ovr:overall(updated)}:p)},success};}
export const sameBreakCard=(a,b)=>a?.id===b?.id&&a?.year===b?.year&&String(a?.playerId)===String(b?.playerId)&&(a?.cardType||'NORMAL')===(b?.cardType||'NORMAL')&&a?.grade===b?.grade;
export function breakthroughQuote(target,source,kind='points'){return {chance:1,cost:kind==='stars'?100*((target.limitBreaks||0)+1):10000*((target.limitBreaks||0)+1),nextLimit:Math.min(20,levelLimit(target)+2)};}
export function breakthroughBlockReason(state,id,materialId,kind='points'){
 const c=state.players.find(p=>p.uniqueId===id);if(!c)return '대상 선수를 선택해주세요.';
 if(state.manager.pendingSkillChange||state.manager.pendingCombination)return '진행 중인 결과 선택을 먼저 완료해주세요.';
 if(levelLimit(c)>=20)return '한계돌파 상한 Lv.20입니다. 이후에는 초월돌파를 이용하세요.';
 if(kind==='ticket')return state.inventory.some(i=>i.packId===CLASSIC.limitTicket)?'':'한계돌파권이 없습니다.';
 if(!['points','stars'].includes(kind))return '사용 재화를 확인해주세요.';
 const source=state.players.find(p=>p.uniqueId===materialId);if(!source)return '같은 선수·연도·유형·등급 카드 1장을 선택하거나 한계돌파권을 사용하세요.';
 if(source.uniqueId===id||freeIds(state,true).has(source.uniqueId))return '편성·등록 중인 카드는 재료로 사용할 수 없습니다.';
 if(!sameBreakCard(c,source))return '같은 선수·연도·유형·등급의 카드가 필요합니다.';
 return (state.currency[kind]||0)<breakthroughQuote(c,source,kind).cost?'재화가 부족합니다.':'';
}
export function breakthrough(state,id,materialId,kind='points'){
 const reason=breakthroughBlockReason(state,id,materialId,kind);if(reason)throw Error(reason);const c=migrateGrowth(player(state,id));const source=kind==='ticket'?null:material(state,materialId,[id]);
 return {success:true,state:{...state,currency:kind==='ticket'?state.currency:pay(state,kind,breakthroughQuote(c,source,kind).cost),inventory:kind==='ticket'?removeItem(state.inventory,CLASSIC.limitTicket):state.inventory,players:state.players.filter(p=>p.uniqueId!==source?.uniqueId).map(p=>p.uniqueId===id?{...c,limitBreaks:Math.min(5,(levelLimit(c)-10)/2+1)}:p)}};
}
export function transcend(state,id){fresh(state);const c=migrateGrowth(player(state,id)),cap=levelLimit(c);if(cap<20||cap>=30)throw Error('상한 Lv.20~28 선수만 초월돌파할 수 있습니다.');const cost=(cap-20)/2+1;let inventory=state.inventory;for(let i=0;i<cost;i++)inventory=removeItem(inventory,'transcend_ticket');return {success:true,state:{...state,inventory,players:state.players.map(p=>p.uniqueId===id?{...c,transcendBreaks:(c.transcendBreaks||0)+1}:p)}};}
export const STAT_NAMES={contact:'정확',power:'파워',eye:'선구',speed:'주력',field:'수비',control:'제구',stuff:'구위',stamina:'체력',fastball:'직구',breaking:'변화'};
export const COACHES=scoutMaterials.coaches;
export const franchise=team=>({해태:'KIA',SK:'SSG',OB:'두산',MBC:'LG',빙그레:'한화',넥센:'키움',우리:'키움',히어로즈:'키움',현대:'키움',삼미:'키움',청보:'키움',태평양:'키움',쌍방울:'SSG'}[team]||team);
export function nationalEvidence(card){return scoutMaterials.national.find(n=>n.name===card.name&&n.year===card.year&&n.team===card.team)||null;}
export function legendRecipe(target,database){
 const seen=new Set();const candidates=database.filter(c=>!c.legendKind).sort((a,b)=>(a.team===target.team?0:1)-(b.team===target.team?0:1)||Math.abs(a.year-target.year)-Math.abs(b.year-target.year)||overall(b)-overall(a));
 const required=[];for(const c of candidates)if(!seen.has(c.playerId)){seen.add(c.playerId);required.push({kind:'PLAYER',cardId:c.id,playerId:c.playerId,year:c.year,team:c.team,name:c.name,grade:'PLATINUM'});if(required.length===6)break;}
 const coaches=COACHES.filter(c=>c.team===franchise(target.team)).slice(0,2);
 if(required.length!==6||coaches.length!==2)throw Error('검증된 지정 재료 자료가 부족합니다.');
 return [...required,...['올스타','MVP','골든글러브'].map(award=>({kind:'AWARD',award,team:target.team,grade:'PLATINUM'})),{kind:'NATIONAL',team:target.team,grade:'PLATINUM'},...coaches.map(c=>({...c,kind:'COACH',coachId:c.id}))];
}
export function migrateLegendRecipe(state,database){const old=state.manager.legendScout;if(!old?.target||old.recipeVersion===2)return state;const requirements=legendRecipe(old.target,database);const previousPlayers=old.requirements.filter(s=>s.kind==='PLAYER');if(previousPlayers.length===6&&previousPlayers.every(s=>database.some(c=>c.id===s.cardId)))requirements.splice(0,6,...previousPlayers);const pledges=requirements.map(slot=>{const index=old.requirements.findIndex(s=>s.kind===slot.kind&&(s.kind==='PLAYER'?s.cardId===slot.cardId:s.award===slot.award));const id=old.pledges[index];if(!id)return null;if(String(id).startsWith('item:'))return id;const c=state.players.find(c=>c.uniqueId===id);return c&&matchesLegend(c,slot)?id:null;});return {...state,manager:{...state.manager,legendScout:{...old,requirements,pledges,recipeVersion:2}}};}
export function migrateLegendDifficulty(state){const scout=state.manager.legendScout;if(!scout?.target||scout.difficultyVersion===1)return state;let wilds=0;const pledges=scout.pledges.map((id,i)=>{if(!String(id).startsWith('item:'))return id;if(['AWARD','NATIONAL'].includes(scout.requirements[i]?.kind)&&wilds<2){wilds++;return id;}return null;});return {...state,manager:{...state.manager,legendScout:{...scout,pledges,difficultyVersion:1}}};}
export function legendWildcardReason(scout,index,inventory){const slot=scout?.requirements[index];if(!['AWARD','NATIONAL'].includes(slot?.kind))return '지정 선수 6명과 코치 2명은 실제 재료가 필요합니다.';const used=scout.pledges.filter((id,i)=>i!==index&&id==='item:'+CLASSIC.legendWild).length;if(used>=2)return '만능 재료는 수상·국가대표 칸에 최대 2개까지만 등록할 수 있습니다.';if(inventory.filter(i=>i.packId===CLASSIC.legendWild).length<=used)return '레전드 만능 재료가 부족합니다.';return '';}
export function legendRecruitReason(state){const s=state.manager.legendScout;if(!s?.target||s.pledges.length!==12||s.pledges.some(v=>!v))return '지정 선수 6명·구단 수상/국대 4명·코치 2명, 총 12칸을 등록해주세요.';if(!state.inventory.some(i=>i.packId===CLASSIC.legendPermit))return '레전드 영입 증서가 필요합니다. 리그 시즌 완주 보상 또는 상점에서 7,000스타로 구할 수 있습니다.';if(state.currency.points<CLASSIC.legendPoints)return '레전드 영입에는 1,000,000 P가 필요합니다.';return '';}
export function buyLegendMaterial(state,database,rng=Math.random){fresh(state);const scout=state.manager.legendScout;if(!scout?.target||scout.requirements.length!==12)throw Error('먼저 레전드 후보를 탐색해주세요.');if((state.manager.leagueTokens||0)<CLASSIC.legendMaterialCoins)throw Error('리그 코인 10개가 필요합니다. 리그 경기와 시즌 목표로 모을 수 있습니다.');if(state.players.length>=capacity(state.manager,state.players.length))throw Error('선수 보유함에 빈 공간이 필요합니다.');const slot=pick(scout.requirements,rng),manager={...state.manager,leagueTokens:state.manager.leagueTokens-CLASSIC.legendMaterialCoins};if(slot.kind==='COACH'){const coach=COACHES.find(c=>c.id===slot.coachId);if(!coach)throw Error('검증된 코치 자료가 없습니다.');return {state:{...state,manager:{...manager,coachCards:[...ownedCoaches(state),{id:crypto.randomUUID(),packId:'coach_material',coachId:coach.id,name:`${coach.team} '${String(coach.year).slice(-2)} ${coach.name} 코치`,source:coach.source}]}},material:coach.name};}const base=pick(database.filter(c=>!c.legendKind&&matchesLegend({...c,grade:'PLATINUM',...(slot.kind==='NATIONAL'?{cardType:'NATIONAL'}:{})},slot)),rng),card=playableCard(base,'PLATINUM');if(slot.kind==='NATIONAL'){card.cardType='NATIONAL';card.nationalTeam=nationalEvidence(card);}return {state:{...state,manager,players:[card,...state.players]},card,material:card.name};}
export function matchesCoach(item,slot){return slot?.kind==='COACH'&&item?.packId==='coach_material'&&item.coachId===slot.coachId&&COACHES.some(c=>c.id===item.coachId&&c.team===slot.team&&c.year===slot.year&&c.name===slot.name);}
export function searchLegend(state,database,team='',instant=false,now=Date.now(),rng=Math.random,kind=''){
 fresh(state);const current=state.manager.legendScout;
 if(now<(current?.nextSearchAt||0)&&!instant)throw Error('탐색 대기 시간이 남았습니다.');
 let currency=pay(state,'points',CLASSIC.searchPoints);
 if(instant){if(currency.stars<CLASSIC.refreshStars)throw Error('즉시 재탐색 스타가 부족합니다.');currency={...currency,stars:currency.stars-CLASSIC.refreshStars};}
 const pool=legendCandidates(team,kind);
 const target=playableCard(pick(pool.filter(c=>c.id!==current?.target?.id).length?pool.filter(c=>c.id!==current?.target?.id):pool,rng),'LEGEND');
 const scout={target,requirements:legendRecipe(target,database),pledges:Array(12).fill(null),recipeVersion:2,difficultyVersion:1,foundAt:now,nextSearchAt:now+CLASSIC.searchHours*3600000};
 return {...state,currency,manager:{...state.manager,legendScout:scout}};
}
export function matchesLegend(card,slot){if(!slot||slot.kind==='COACH'||card.grade!==slot.grade)return false;if(slot.kind==='PLAYER')return card.id===slot.cardId;const same=franchise(card.team)===franchise(slot.team);if(slot.kind==='NATIONAL')return same&&card.cardType==='NATIONAL'&&!!nationalEvidence(card);return same&&card.awards?.some(a=>a.type===slot.award);}
export function pledgeLegend(state,slotIndex,value){fresh(state);const scout=state.manager.legendScout;if(!scout?.target||!scout.requirements[slotIndex])throw Error('탐색한 레전드 후보가 없습니다.');const pledges=[...scout.pledges];
 if(value){if(!String(value).startsWith('item:')&&pledges.some((v,i)=>i!==slotIndex&&v===value))throw Error('같은 재료를 두 슬롯에 넣을 수 없습니다.');
 if(String(value).startsWith('item:')){if(value!=='item:'+CLASSIC.legendWild)throw Error('사용할 수 없는 대체 재료입니다.');const blocked=legendWildcardReason(scout,slotIndex,state.inventory);if(blocked)throw Error(blocked);const needed=pledges.filter((v,i)=>i!==slotIndex&&v===value).length+1;if(state.inventory.filter(i=>i.packId===CLASSIC.legendWild).length<needed)throw Error('레전드 만능 재료가 부족합니다.');}
 else if(String(value).startsWith('coach:')){const item=ownedCoaches(state).find(i=>String(i.id)===String(value).slice(6));if(coachAssigned(state.manager,item?.id))throw Error('편성 중인 코치입니다. 코치 편성을 먼저 해제해주세요.');if(!matchesCoach(item,scout.requirements[slotIndex]))throw Error('지정된 구단·연도·이름의 코치 재료가 필요합니다.');}
 else{const c=player(state,value);if(freeIds(state).has(value))throw Error('편성된 선수는 등록할 수 없습니다.');if(!matchesLegend(c,scout.requirements[slotIndex]))throw Error('지정된 선수·연도·등급·수상 조건과 맞지 않습니다.');}}
 pledges[slotIndex]=value;return {...state,manager:{...state.manager,legendScout:{...scout,pledges}}};
}
export function recruitLegend(state){fresh(state);state=migrateCoachStorage(state);const scout=state.manager.legendScout;if(!scout?.target||scout.pledges.length!==12||scout.requirements.length!==12||scout.pledges.some(v=>!v))throw Error('지정 재료 12칸을 모두 등록해주세요.');
 const reason=legendRecruitReason(state);if(reason)throw Error(reason);for(let i=0;i<scout.pledges.length;i++)if(String(scout.pledges[i]).startsWith('item:')){const blocked=legendWildcardReason(scout,i,state.inventory);if(blocked)throw Error(blocked);}
 let coachCards=ownedCoaches(state);const cards=[],wilds=scout.pledges.filter(v=>String(v).startsWith('item:')).length;let inventory=removeItem(state.inventory,CLASSIC.legendPermit);
 for(let i=0;i<wilds;i++)inventory=removeItem(inventory,CLASSIC.legendWild);
 scout.pledges.forEach((id,i)=>{if(String(id).startsWith('item:'))return;if(String(id).startsWith('coach:')){const item=coachCards.find(x=>String(x.id)===String(id).slice(6));if(coachAssigned(state.manager,item?.id))throw Error('편성 중인 코치는 영입 재료로 소모할 수 없습니다.');if(!matchesCoach(item,scout.requirements[i]))throw Error('지정 코치 재료를 확인해주세요.');coachCards=coachCards.filter(x=>x!==item);return;}const c=player(state,id);if(freeIds(state).has(id)||!matchesLegend(c,scout.requirements[i]))throw Error('재료 상태가 변경되었습니다. 등록 내용을 확인해주세요.');cards.push(id);});
 if(new Set(cards).size!==cards.length)throw Error('재료 카드가 중복 등록되었습니다.');
 if(state.players.length-cards.length+1>capacity(state.manager,state.players.length))throw Error('선수 보유함이 부족합니다.');
 const currency=pay(state,'points',CLASSIC.legendPoints),ids=new Set(cards),card=scout.target;
 return {state:{...state,currency,inventory,players:[card,...state.players.filter(c=>!ids.has(c.uniqueId))],manager:{...state.manager,coachCards,legendScout:{...scout,target:null,requirements:[],pledges:[]}}},card};
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
export function signatureRequirements(base,route,stat=base.pos==='P'?'stuff':'power'){
 if(!(stat in ratings(base)))throw Error('대상 선수의 능력치를 선택해주세요.');
 const award=['MVP','GOLDEN_GLOVE'].includes(signatureCategory(base));
 return [...Array.from({length:award?5:10},()=>({kind:'STAT',stat,threshold:95,categories:['NORMAL','NATIONAL','ALLSTAR','MVP','GOLDEN_GLOVE']})),...(award?[]:[{kind:'SIG_AWARD',categories:['MVP','GOLDEN_GLOVE']}])];
}
export function matchesSignature(c,slot){return slot.categories.includes(signatureCategory(c))&&(slot.kind==='SIG_AWARD'||ratings(c)[slot.stat]>=slot.threshold);}
export function awakenSignature(state,id,materialIds,options={}){fresh(state);const base=player(state,id);if(base.grade!=='PLATINUM'||cardLevel(base)<20)throw Error('Lv.20 이상 플래티넘 카드가 필요합니다.');const slots=signatureRequirements(base,null,options.stat);if(materialIds.length!==slots.length||materialIds.some(v=>!v))throw Error(`각성 재료 ${slots.length}칸을 모두 채워주세요.`);
 let inventory=removeItem(state.inventory,CLASSIC.signatureContract),wilds=0;const consumed=[];
 materialIds.forEach((mid,i)=>{if(mid==='item:'+CLASSIC.signatureWild){if(slots[i].kind==='SIG_AWARD'||++wilds>2)throw Error('만능 재료는 능력치 칸에 최대 2개, 추가 수상 카드는 실제 카드가 필요합니다.');inventory=removeItem(inventory,CLASSIC.signatureWild);return;}const c=material(state,mid,[id]);if(rank(c)>4)throw Error('시그니처·레전드는 재료로 사용할 수 없습니다.');if(!matchesSignature(c,slots[i]))throw Error('능력치 95 이상 또는 추가 MVP·골글 조건을 확인해주세요.');consumed.push(mid);});
 if(new Set(consumed).size!==consumed.length)throw Error('같은 카드를 중복 사용할 수 없습니다.');
 const card={...base,grade:'SIGNATURE',cardType:'SIGNATURE'};card.skills=sanitizeSkills(card);card.ovr=overall(card);const gone=new Set(consumed),currency=pay(state,'points',CLASSIC.signaturePoints);
 return {state:{...state,currency,inventory,players:state.players.filter(c=>!gone.has(c.uniqueId)).map(c=>c.uniqueId===id?card:c)},card};
}
export const COMBO_PROBABILITIES=[{grades:['NORMAL','RARE','SPECIAL'],weights:[70,25,5]},{grades:['NORMAL','RARE','SPECIAL'],weights:[10,65,25]},{grades:['RARE','SPECIAL','HERO'],weights:[15,65,20]},{grades:['SPECIAL','HERO','PLATINUM'],weights:[20,65,15]},{grades:['HERO','PLATINUM'],weights:[30,70]}];
function comboGrade(materials,mode,rng){if(mode==='STAR')return TIER[Math.min(4,Math.max(...materials.map(rank)))];const rule=COMBO_PROBABILITIES[Math.min(4,Math.min(...materials.map(rank)))];let r=rng()*100;for(let i=0;i<rule.weights.length;i++){r-=rule.weights[i];if(r<0)return rule.grades[i];}return rule.grades.at(-1);}
export function startCombination(state,ids,mode,database,position='',rng=Math.random){fresh(state);if(ids.length<3||ids.length>5||new Set(ids).size!==ids.length)throw Error('서로 다른 재료 카드 3~5장을 선택해주세요.');if(!['NORMAL','POSITION','STAR'].includes(mode))throw Error('조합 방식을 확인해주세요.');const materials=ids.map(id=>material(state,id));if(materials.some(c=>rank(c)>4))throw Error('시그니처·레전드 카드는 일반 조합 재료로 사용할 수 없습니다.');
 if(mode==='POSITION'&&(!position||materials.some(c=>!(c.positions||[c.pos]).includes(position))))throw Error('모든 재료가 선택한 포지션을 소화해야 합니다.');
 const pool=database.filter(c=>!c.legendKind&&(mode!=='POSITION'||c.pos===position));if(!pool.length)throw Error('해당 포지션의 결과 선수가 없습니다.');
 const grade=comboGrade(materials,mode,rng),shuffle=rank({grade})>=3||mode==='STAR',choices=Array.from({length:shuffle?7:1},()=>playableCard(pick(pool,rng),grade));const gone=new Set(ids);
 const currency=mode==='STAR'?pay(state,'stars',500):state.currency;
 return {...state,currency,players:state.players.filter(c=>!gone.has(c.uniqueId)),manager:{...state.manager,pendingCombination:{phase:shuffle?'preview':'single',choices,materialIds:ids,mode,grade}}};
}
export function shuffleCombination(state,rng=Math.random){const pending=state.manager.pendingCombination;if(pending?.phase!=='preview')throw Error('섞을 조합 결과가 없습니다.');const choices=[...pending.choices];for(let i=choices.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}return {...state,manager:{...state.manager,pendingCombination:{...pending,choices,phase:'hidden'}}};}
export function claimCombination(state,index){const p=state.manager.pendingCombination;if(!p||!['hidden','single'].includes(p.phase)||!Number.isInteger(index)||!p.choices[index])throw Error('선택 가능한 조합 결과가 없습니다.');if(state.players.length>=capacity(state.manager,state.players.length))throw Error('선수 보유함이 부족합니다.');const card=p.choices[index];return {state:{...state,players:[card,...state.players],manager:{...state.manager,pendingCombination:null}},card};}

// Reconcile an in-progress target without consuming or replacing owned materials.
export function refreshLegendScoutRoster(state,database){const old=state.manager.legendScout,current=legendCandidates().find(c=>c.id===old?.target?.id);if(!current||!['team','year','legendKind'].some(k=>current[k]!==old.target[k]))return state;const target={...old.target,...current,uniqueId:old.target.uniqueId,skills:old.target.skills};target.ovr=overall(target);const requirements=old.target.team!==target.team||old.target.year!==target.year?legendRecipe(target,database):old.requirements;let next={...state,manager:{...state.manager,legendScout:{...old,target,requirements,pledges:Array(12).fill(null),rosterUpdated:true}}};const same=(a,b)=>a?.kind===b?.kind&&(a.kind==='PLAYER'?a.cardId===b.cardId:a.kind==='COACH'?a.coachId===b.coachId:franchise(a.team)===franchise(b.team)&&(a.kind!=='AWARD'||a.award===b.award));for(let i=0;i<(old.pledges||[]).length;i++){const value=old.pledges[i];if(!value)continue;const index=requirements.findIndex((r,j)=>!next.manager.legendScout.pledges[j]&&same(r,old.requirements[i]));if(index<0)continue;try{next=pledgeLegend(next,index,value);}catch{/* Released pledges remain owned. */}}return next;}
