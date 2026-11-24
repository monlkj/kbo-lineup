import {generateSingleSkill,sanitizeSkills} from './club-rules.js';
export const PLATINUM_GUARANTEE={id:'platinum_skill_guarantee',name:'플래티넘 고유능력 확정권',stars:300};
export function usePlatinumSelect(state,id,slot,rng=Math.random){
 if(state.manager?.pendingSkillChange||state.manager?.pendingCombination)throw Error('진행 중인 결과 선택을 완료하세요.');
 const card=state.players.find(c=>c.uniqueId===id);if(!card||!['PLATINUM','SIGNATURE','LEGEND'].includes(card.grade))throw Error('플래티넘 이상 선수만 사용할 수 있습니다.');
 const skills=sanitizeSkills(card);if(!Number.isInteger(slot)||!skills[slot])throw Error('변경할 슬롯을 선택하세요.');
 const ids=['select_skill_ticket',PLATINUM_GUARANTEE.id],used=new Set();for(const packId of ids){const i=state.inventory.findIndex((x,i)=>x.packId===packId&&!used.has(i));if(i<0)throw Error('선택변경권과 플래티넘 확정권이 각각 1장 필요합니다.');used.add(i);}
 const next=[...skills];next[slot]=generateSingleSkill(card.pos,'PLATINUM',rng,skills.map(s=>s.name));const updated={...card,skills:next};
 return {card:updated,state:{...state,players:state.players.map(c=>c.uniqueId===id?updated:c),lineup:Object.fromEntries(Object.entries(state.lineup||{}).map(([p,c])=>[p,c?.uniqueId===id?updated:c])),inventory:state.inventory.filter((_,i)=>!used.has(i))}};
}
