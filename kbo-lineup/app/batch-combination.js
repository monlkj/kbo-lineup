import {TIER,legendRecipe,matchesLegend,startCombination,claimCombination} from './classic-progression.js';
import {LEGEND_CATALOG} from './legend-registry.js';
import {protectedIds} from './club-rules.js';
import {filterPlayers} from './player-filters.js';
import {overall} from './manager-engine.js';
import {cardLevel} from './growth-rules.js';
const recipes=new WeakMap();
const duplicateKey=c=>[c.playerId??c.id,c.year,c.grade,c.cardType||'NORMAL'].join(':');
export function planBatchCombination(state,database,options={}){
 const {filters={},groupSize=3,mode='NORMAL',position='',keepBest=true,protectLegend=true,excludedIds=[]}=options;
 if(!Number.isInteger(groupSize)||groupSize<3||groupSize>5)throw Error('조합당 재료는 3~5장입니다.');
 if(!['NORMAL','POSITION','STAR'].includes(mode))throw Error('조합 방식을 확인하세요.');
 const locked=protectedIds(state.lineup,state.manager),manualLocks=new Set(state.manager.lockedPlayerIds||[]),excluded=new Set(excludedIds);
 let base=recipes.get(database);if(!base){base=LEGEND_CATALOG.map(target=>({target,requirements:legendRecipe(target,database)}));recipes.set(database,base);}
 const books=new Map(base.map(b=>[b.target.id,b]));for(const b of Object.values(state.manager.scouting?.books||{}))if(b.target&&b.requirements)books.set(b.target.id,b);
 const legendCard=c=>c.grade==='PLATINUM'&&[...books.values()].some(b=>b.requirements.some(r=>r.kind!=='COACH'&&matchesLegend(c,r)));
 const filtered=filterPlayers(state.players,filters),best=new Map();
 if(keepBest)for(const c of state.players){const key=duplicateKey(c),old=best.get(key);if(!old||overall(c)>overall(old)||overall(c)===overall(old)&&cardLevel(c)>cardLevel(old))best.set(key,c);}
 const optionsList=filtered.map(card=>{const id=card.uniqueId,reason=TIER.indexOf(card.grade)<0||TIER.indexOf(card.grade)>4?'시그니처·레전드 보호':locked.has(id)?'편성·등록·진행 중 경기 보호':card.locked||card.isLocked||manualLocks.has(id)?'잠금 카드 보호':protectLegend&&legendCard(card)?'L 표시 레전드 재료 보호':mode==='POSITION'&&!(card.positions||[card.pos]).includes(position)?'선택 포지션 불일치':keepBest&&best.get(duplicateKey(card))?.uniqueId===id?'같은 선수·연도·등급 1장 보존':excluded.has(id)?'직접 제외':'';return {card,reason};});
 const usable=optionsList.filter(o=>!o.reason).map(o=>o.card),groups=[],leftovers=[];
 for(const grade of TIER.slice(0,5)){const same=usable.filter(c=>c.grade===grade).sort((a,b)=>overall(a)-overall(b)||cardLevel(a)-cardLevel(b));while(same.length>=groupSize)groups.push(same.splice(0,groupSize).map(c=>c.uniqueId));leftovers.push(...same);}
 return {groups,leftovers,options:optionsList,materialCount:groups.length*groupSize,stars:mode==='STAR'?groups.length*500:0,resultCount:groups.length,protectedCount:optionsList.filter(o=>o.reason&&o.reason!=='직접 제외').length};
}
export function startBatchCombination(state,database,options={},rng=Math.random){
 if(state.manager.pendingCombination||state.manager.pendingSkillChange)throw Error('진행 중인 결과 선택을 먼저 완료하세요.');
 const plan=planBatchCombination(state,database,options);if(!plan.groups.length)throw Error('같은 등급 재료가 조합당 수량만큼 필요합니다. 필터와 1장 보존 설정을 확인하세요.');
 if((state.currency.stars||0)<plan.stars)throw Error(`스타가 부족합니다. 총 ${plan.stars.toLocaleString()}스타가 필요합니다.`);
 let next=state;const results=[];
 for(const ids of plan.groups){next=startCombination({...next,manager:{...next.manager,pendingCombination:null}},ids,options.mode||'NORMAL',database,options.position||'',rng);results.push(next.manager.pendingCombination);}
 const [first,...remaining]=results;return {...next,manager:{...next.manager,pendingCombination:{...first,batch:{id:crypto.randomUUID(),total:results.length,index:0,remaining,received:[],materialCount:plan.materialCount,stars:plan.stars}}}};
}
export function claimBatchSingles(state){let next=state,count=0,last;while(next.manager.pendingCombination?.phase==='single'){last=claimCombination(next,0);next=last.state;count++;}if(!last)throw Error('바로 받을 수 있는 결과가 없습니다.');return {...last,state:next,count,batchContinues:!!next.manager.pendingCombination};}
