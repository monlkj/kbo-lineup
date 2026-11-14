// Explicit user-requested test aid. It refills this browser's club save only.
export const TEST_BALANCE=999999999;
export const TEST_ITEMS=[
 ['skill_ticket','스킬변경권',999],['premium_skill_ticket','고급 스킬변경권',999],
 ['select_skill_ticket','스킬 선택변경권',999],['protect_skill_ticket','스킬 보호변경권',999],
 ['limit_break_ticket','한계돌파권',999],['signature_contract','시그니처 각성 계약서',999],
 ['signature_wild_material','시그니처 만능 재료',999],['legend_wild_material','레전드 만능 재료',999],
 ['premium_team','시험용 구단선택팩',100],['award_only','시험용 수상자 전용팩',100],['normal_all','시험용 일반 선수팩',100]
];
export function grantTestResources(state){
 if(state.manager.pendingSkillChange||state.manager.pendingCombination)throw Error('진행 중인 결과 선택을 먼저 완료해주세요.');
 const inventory=[...state.inventory],counts=new Map();for(const i of inventory)counts.set(i.packId,(counts.get(i.packId)||0)+1);
 for(const [packId,name,amount] of TEST_ITEMS)for(let i=counts.get(packId)||0;i<amount;i++)inventory.push({id:crypto.randomUUID(),packId,name});
 return {...state,currency:{...state.currency,points:Math.max(state.currency.points||0,TEST_BALANCE),stars:Math.max(state.currency.stars||0,TEST_BALANCE)},inventory,manager:{...state.manager,testResourcesUsed:true}};
}
