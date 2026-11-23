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
