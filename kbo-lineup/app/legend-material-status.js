import {availableLegendWilds} from './scouting-rules.js';
import {matchesLegend,matchesCoach,CLASSIC,TIER} from './classic-progression.js';
import {protectedIds} from './club-rules.js';
import {ownedCoaches,coachAssigned,coachPledged} from './coaching.js';
import {coachGrade} from './grade-up.js';
export function legendMaterialStatus(state,book,index){const slot=book.requirements[index],pledge=book.pledges[index],locked=protectedIds(state.lineup,state.manager);let owned=[],ready=[],low=[];
 if(slot.kind==='COACH'){owned=ownedCoaches(state).filter(c=>matchesCoach({...c,grade:'PLATINUM'},slot));ready=owned.filter(c=>coachGrade(c)==='PLATINUM'&&!coachAssigned(state.manager,c.id)&&!coachPledged(state.manager,c.id));low=owned.filter(c=>['SPECIAL','HERO'].includes(coachGrade(c))&&!coachAssigned(state.manager,c.id)&&!coachPledged(state.manager,c.id));}
 else{owned=state.players.filter(c=>!['LEGEND','SIGNATURE'].includes(c.grade)&&matchesLegend({...c,grade:slot.grade},slot));ready=owned.filter(c=>c.grade===slot.grade&&!locked.has(c.uniqueId));low=owned.filter(c=>TIER.indexOf(c.grade)>=0&&TIER.indexOf(c.grade)<TIER.indexOf(slot.grade)&&!locked.has(c.uniqueId));}
 const used=new Set(Object.values(state.manager.scouting?.books||{}).flatMap(b=>b.pledges||[])),wildCount=book.pledges.filter(v=>String(v).startsWith('wild:')||String(v).startsWith('item:')).length,wild=!pledge&&['AWARD','NATIONAL'].includes(slot.kind)&&wildCount<2&&availableLegendWilds(state).length>0;return {owned,ready:pledge?[]:ready,low:pledge?[]:low,wild,registered:!!pledge};
}

// N means owned, not necessarily available for consumption.
export function legendMaterialReason(state,book,index,card){
 const slot=book.requirements[index],id=card?.uniqueId,m=state.manager||{};
 if(!card||!slot)return '재료 조건을 확인해주세요.';
 for(const b of Object.values(m.scouting?.books||{}))if((b.pledges||[]).includes(id))return `${b.target?.name||'다른 레전드'} 재료로 등록됨 · 회수 불가`;
 if((m.legendScout?.pledges||[]).includes(id))return `${m.legendScout.target?.name||'레전드'} 재료로 등록됨 · 회수 불가`;
 const position=Object.entries(state.lineup||{}).find(([,c])=>c?.uniqueId===id)?.[0];
 if(position)return `선발 ${position} 편성 중 · 라인업에서 교체 필요`;
 const starter=(m.staff?.starters||[]).indexOf(id);if(starter>=0)return `선발 ${starter+1}번 편성 중 · 로테이션에서 교체 필요`;
 const relief=(m.staff?.relief||[]).indexOf(id);if(relief>=0)return `${['필승조 1','필승조 2','추격조 1','추격조 2','롱릴리프','마무리'][relief]||'불펜'} 편성 중 · 불펜에서 교체 필요`;
 const bench=(m.bench||[]).indexOf(id);if(bench>=0)return `후보 ${bench+1}번 편성 중 · 후보에서 제외 필요`;
 if(m.pendingSkillChange?.cardId===id)return '고유능력 변경 결과를 먼저 선택하세요.';
 if(!matchesLegend({...card,grade:slot.grade},slot))return '지정 선수·연도·구단 조건 불일치';
 if(card.grade!==slot.grade)return '등급상승 후 등록 가능 · 플래티넘 필요';
 if(protectedIds(state.lineup,m).has(id))return '다른 작업에서 사용 중';
 return '';
}
