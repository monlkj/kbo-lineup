import materials from '../data/scout-materials.json' with {type:'json'};
export const COACH_CATALOG=materials.coaches;
export const COACH_SLOTS={HD:'수석 코치',HC:'타격 코치',PC:'투수 코치',DC:'수비 코치',RC:'주루·작전 코치',BC:'불펜·배터리 코치'};
export function coachFits(coach,slot){const role=coach?.role||'';return ({HD:/수석|감독/,HC:/타격/,PC:/투수|불펜/,DC:/수비|외야/,RC:/주루|작전/,BC:/불펜|배터리/}[slot])?.test(role)||false;}
export const coachAssigned=(manager,id)=>Object.values(manager?.coaches||{}).some(v=>v===id);
export const coachPledged=(manager,id)=>(manager?.legendScout?.pledges||[]).includes('coach:'+id);
export function assignCoach(state,slot,id){
 if(state.manager.pendingSkillChange||state.manager.pendingCombination)throw Error('진행 중인 결과 선택을 먼저 완료해주세요.');
 if(!COACH_SLOTS[slot])throw Error('코치 보직을 확인해주세요.');
 if(!id)return {...state,manager:{...state.manager,coaches:{...state.manager.coaches,[slot]:null}}};
 const item=state.inventory.find(i=>i.id===id&&i.packId==='coach_material'),coach=COACH_CATALOG.find(c=>c.id===item?.coachId);
 if(!coach||!coachFits(coach,slot))throw Error('실제 보직이 맞는 보유 코치를 선택해주세요.');
 if(coachPledged(state.manager,id))throw Error('레전드 재료로 등록된 코치입니다. 재료 등록을 먼저 해제해주세요.');
 for(const [position,uid] of Object.entries(state.manager.coaches||{})){if(position===slot||!uid)continue;const other=state.inventory.find(i=>i.id===uid);if(uid===id||other?.coachId===item.coachId)throw Error('동일 코치는 한 보직에만 편성할 수 있습니다.');}
 return {...state,manager:{...state.manager,coaches:{...state.manager.coaches,[slot]:id}}};
}
export function openCoachPacks(state,requested,rng=Math.random){
 if(state.manager.pendingSkillChange||state.manager.pendingCombination)throw Error('진행 중인 결과 선택을 먼저 완료해주세요.');
 if(!Number.isInteger(requested)||requested<1)throw Error('개봉 수량을 확인해주세요.');
 const packs=state.inventory.filter(i=>i.packId==='coach_pack').slice(0,requested);if(!packs.length)throw Error('보유 코치팩이 없습니다.');
 const ids=new Set(packs.map(i=>i.id)),coaches=packs.map(()=>{const c=COACH_CATALOG[Math.min(COACH_CATALOG.length-1,Math.floor(rng()*COACH_CATALOG.length))];return {id:crypto.randomUUID(),packId:'coach_material',coachId:c.id,name:`${c.team} '${String(c.year).slice(-2)} ${c.name} 코치`,source:c.source};});
 return {state:{...state,inventory:[...coaches,...state.inventory.filter(i=>!ids.has(i.id))]},coaches};
}
