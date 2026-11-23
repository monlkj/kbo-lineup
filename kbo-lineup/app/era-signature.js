import {protectedIds} from './club-rules.js';
import {migrateCoachStorage,ownedCoaches,coachAssigned,coachPledged,COACH_CATALOG} from './coaching.js';
import {deckFranchise} from './legend-registry.js';
import {coachGrade} from './grade-up.js';
export const ERA_COACH_VOUCHER='era_coach_material';
export const ERA_COACH_PRICE=500;
export const eraOf=card=>Math.floor(Number(card.year)/10)*10;
export const isEraSignature=c=>c?.grade==='SIGNATURE'&&c.cardType==='ERA_SIGNATURE';
export function eraCoachMatches(item,target){const source=COACH_CATALOG.find(c=>c.id===item.coachId);return !!source&&['HERO','PLATINUM'].includes(coachGrade(item))&&eraOf(source)===eraOf(target)&&deckFranchise(source.team)===deckFranchise(target.team);}
export function eraMaterialReason(state,target,card,selected=[]){
 if(!target)return '각성 대상을 먼저 선택하세요.';
 if(!card)return '보유 카드를 찾을 수 없습니다.';
 if(card.uniqueId===target.uniqueId)return '각성 대상 본인';
 if(card.grade!=='SIGNATURE')return '일반 시그니처 카드가 아닙니다.';
 if(isEraSignature(card))return '이미 연대 각성한 카드';
 if(eraOf(card)!==eraOf(target))return `연대 다름 · ${eraOf(card)}년대`;
 const id=card.uniqueId,manager=state.manager||{};
 if(Object.values(manager.scouting?.books||{}).some(b=>(b.pledges||[]).includes(id))||(manager.legendScout?.pledges||[]).includes(id))return '레전드 재료로 등록 중';
 if(Object.values(state.lineup||{}).some(c=>c?.uniqueId===id))return card.pos==='P'?'선발 투수 편성 중':'선발 타자 편성 중';
 if((manager.bench||[]).includes(id))return '후보 타자 편성 중';
 if((manager.staff?.starters||[]).includes(id))return '선발 투수 편성 중';
 if((manager.staff?.relief||[]).includes(id))return '불펜 편성 중';
 if(manager.pendingSkillChange?.cardId===id)return '고유능력 변경 결과 선택 중';
 if(protectedIds(state.lineup,manager).has(id))return '편성·등록 중';
 if(selected.includes(id))return '다른 재료 칸에 선택됨';
 return '';
}
export function awakenEraSignature(state,id,playerIds,coachIds){if(state.manager.pendingSkillChange||state.manager.pendingCombination)throw Error('진행 중인 결과 선택을 먼저 완료해주세요.');state=migrateCoachStorage(state);const base=state.players.find(c=>c.uniqueId===id);if(!base||base.grade!=='SIGNATURE'||isEraSignature(base))throw Error('일반 시그니처 대상 카드를 선택하세요.');if(playerIds.length!==5||coachIds.length!==5||[...playerIds,...coachIds].some(v=>!v))throw Error('같은 연대 시그니처 5장과 같은 팀·연대 히어로 이상 코치 5칸을 채우세요.');if(new Set(playerIds).size!==5)throw Error('같은 선수를 중복 재료로 넣을 수 없습니다.');for(const uid of playerIds){const c=state.players.find(c=>c.uniqueId===uid),reason=eraMaterialReason(state,base,c);if(reason)throw Error(`${c?.name||'재료'}: ${reason}`);}
 let inventory=[...state.inventory],coaches=ownedCoaches(state);const used=new Set();for(const cid of coachIds){if(cid==='item:'+ERA_COACH_VOUCHER){const i=inventory.findIndex(x=>x.packId===ERA_COACH_VOUCHER);if(i<0)throw Error('연대 코치 재료권이 부족합니다.');inventory.splice(i,1);continue;}if(used.has(cid))throw Error('같은 코치를 중복 사용할 수 없습니다.');const item=coaches.find(c=>c.id===cid);if(!item||coachAssigned(state.manager,cid)||coachPledged(state.manager,cid)||!eraCoachMatches(item,base))throw Error('같은 팀·연대 히어로 이상 미편성 코치가 필요합니다.');used.add(cid);}
 const card={...base,cardType:'ERA_SIGNATURE',signatureEra:eraOf(base)},gone=new Set(playerIds);coaches=coaches.filter(c=>!used.has(c.id));return {state:{...state,inventory,players:state.players.filter(c=>!gone.has(c.uniqueId)).map(c=>c.uniqueId===id?card:c),lineup:Object.fromEntries(Object.entries(state.lineup||{}).map(([p,c])=>[p,c?.uniqueId===id?card:c])),manager:{...state.manager,coachCards:coaches}},card};
}
