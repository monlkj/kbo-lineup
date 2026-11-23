import {overall} from './manager-engine.js';
import {sanitizeSkills} from './club-rules.js';
import {ownedCoaches,coachPledged} from './coaching.js';
export const CARD_GRADES=['NORMAL','RARE','SPECIAL','HERO','PLATINUM','SIGNATURE','LEGEND'];
export const GRADE_TICKETS={low_grade_up:{name:'하급 등급상승권',stars:100,from:['RARE'],steps:1},mid_grade_up:{name:'중급 등급상승권',stars:300,from:['SPECIAL'],steps:1},grade_up:{name:'등급상승권',stars:1000,from:['NORMAL','RARE','SPECIAL','HERO']}};
export const GRADE_STEP_ODDS=[{steps:1,chance:70},{steps:2,chance:25},{steps:3,chance:5}];
export const coachGrade=c=>c.grade||'PLATINUM';
export function useGradeTicket(state,id,ticketId,kind='PLAYER',rng=Math.random){if(state.manager.pendingSkillChange||state.manager.pendingCombination)throw Error('진행 중인 결과 선택을 먼저 완료해주세요.');const rule=GRADE_TICKETS[ticketId];if(!rule)throw Error('등급상승권 종류를 확인하세요.');const item=state.inventory.find(i=>i.packId===ticketId);if(!item)throw Error('등급상승권이 없습니다.');const card=kind==='COACH'?ownedCoaches(state).find(c=>c.id===id):state.players.find(c=>c.uniqueId===id);if(!card)throw Error('대상을 선택하세요.');const grade=kind==='COACH'?coachGrade(card):card.grade;if(!rule.from.includes(grade))throw Error('이 변경권을 사용할 수 있는 등급이 아닙니다.');const pledged=Object.values(state.manager.scouting?.books||{}).flatMap(b=>b.pledges||[]);if(kind==='COACH'?coachPledged(state.manager,id):pledged.includes(id))throw Error('레전드에 등록한 재료는 변경할 수 없습니다.');
 const roll=rule.steps?0:rng()*100,steps=rule.steps||(roll<70?1:roll<95?2:3),rank=CARD_GRADES.indexOf(grade),nextRank=Math.min(4,rank+steps),nextGrade=CARD_GRADES[nextRank];let updated={...card,grade:nextGrade};
 const inventory=state.inventory.filter(i=>i.id!==item.id);if(kind==='COACH')return {state:{...state,inventory:inventory.filter(i=>i.packId!=='coach_material'),manager:{...state.manager,coachCards:ownedCoaches(state).map(c=>c.id===id?updated:c)}},coach:updated,from:grade,to:nextGrade,steps:nextRank-rank};
 updated.gradeBonus=(card.gradeBonus||0)+2*(nextRank-rank);updated.skills=sanitizeSkills(updated);updated.ovr=overall(updated);return {state:{...state,inventory,players:state.players.map(c=>c.uniqueId===id?updated:c),lineup:Object.fromEntries(Object.entries(state.lineup||{}).map(([p,c])=>[p,c?.uniqueId===id?updated:c]))},card:updated,from:grade,to:nextGrade,steps:nextRank-rank};
}
