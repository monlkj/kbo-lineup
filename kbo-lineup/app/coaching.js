import materials from '../data/scout-materials.json' with {type:'json'};
export const COACH_CATALOG=materials.coaches;
export const COACH_SLOTS={M:'감독',HD:'수석 코치',HC:'타격 코치',PC:'투수 코치',DC:'수비 코치',BC:'불펜·배터리 코치'};
export function coachFits(coach,slot){const role=coach?.role||'';return ({M:/감독/,HD:/수석/,HC:/타격/,PC:/투수|불펜/,DC:/수비|외야/,BC:/불펜|배터리/}[slot])?.test(role)||false;}
// Reads legacy items for compatibility; writes always use the separate coach collection.
export function ownedCoaches(state){const map=new Map();for(const c of [...(state.manager?.coachCards||[]),...(state.inventory||[]).filter(i=>i.packId==='coach_material')])if(!map.has(c.id))map.set(c.id,c);return [...map.values()];}
export function migrateCoachStorage(state){const coachCards=ownedCoaches(state),manager=state.manager||{},old=manager.coaches||{},coaches=Object.fromEntries(Object.keys(COACH_SLOTS).map(slot=>[slot,old[slot]||null]));const hd=coachCards.find(i=>i.id===coaches.HD),record=COACH_CATALOG.find(c=>c.id===hd?.coachId);if(coaches.HD&&!coachFits(record,'HD')&&coachFits(record,'M')&&!coaches.M){coaches.M=coaches.HD;coaches.HD=null;}return {...state,inventory:(state.inventory||[]).filter(i=>i.packId!=='coach_material'),manager:{...manager,coaches,coachCards}};}
export const coachAssigned=(manager,id)=>Object.values(manager?.coaches||{}).some(v=>v===id);
export const coachPledged=(manager,id)=>(manager?.legendScout?.pledges||[]).includes('coach:'+id);
export function assignCoach(state,slot,id){
 if(state.manager.pendingSkillChange||state.manager.pendingCombination)throw Error('진행 중인 결과 선택을 먼저 완료해주세요.');
 if(!COACH_SLOTS[slot])throw Error('코치 보직을 확인해주세요.');
 if(!id)return migrateCoachStorage({...state,manager:{...state.manager,coaches:{...state.manager.coaches,[slot]:null}}});
 const cards=ownedCoaches(state),item=cards.find(i=>i.id===id),coach=COACH_CATALOG.find(c=>c.id===item?.coachId);
 if(!coach||!coachFits(coach,slot))throw Error('실제 보직이 맞는 보유 코치를 선택해주세요.');
 if(coachPledged(state.manager,id))throw Error('레전드 재료로 등록된 코치입니다. 재료 등록을 먼저 해제해주세요.');
 for(const [position,uid] of Object.entries(state.manager.coaches||{})){if(position===slot||!uid)continue;const other=cards.find(i=>i.id===uid);if(uid===id||other?.coachId===item.coachId)throw Error('동일 코치는 한 보직에만 편성할 수 있습니다.');}
 return migrateCoachStorage({...state,manager:{...state.manager,coaches:{...state.manager.coaches,[slot]:id}}});
}
export function openCoachPacks(state,requested,rng=Math.random){
 if(state.manager.pendingSkillChange||state.manager.pendingCombination)throw Error('진행 중인 결과 선택을 먼저 완료해주세요.');
 if(!Number.isInteger(requested)||requested<1)throw Error('개봉 수량을 확인해주세요.');
 const packs=state.inventory.filter(i=>i.packId==='coach_pack').slice(0,requested);if(!packs.length)throw Error('보유 코치팩이 없습니다.');
 const pool=COACH_CATALOG.filter(c=>Object.keys(COACH_SLOTS).some(slot=>coachFits(c,slot)));
 const ids=new Set(packs.map(i=>i.id)),coaches=packs.map(()=>{const c=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];return {id:crypto.randomUUID(),packId:'coach_material',coachId:c.id,name:`${c.team} '${String(c.year).slice(-2)} ${c.name} 코치`,source:c.source};});
 const next=migrateCoachStorage(state);return {state:{...next,inventory:next.inventory.filter(i=>!ids.has(i.id)),manager:{...next.manager,coachCards:[...next.manager.coachCards,...coaches]}},coaches};
}
