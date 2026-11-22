export const STARTER_COUNT=5;
export const BULLPEN_ROLES=['필승조 1','필승조 2','추격조 1','추격조 2','롱릴리프','마무리'];
export const STAFF_VERSION=2;
// Both saved card IDs and actual game cards can use the same stable six-slot order.
export function normalizePitchingStaff(staff={}){const old=staff.relief||[],relief=old.length===3&&staff.version!==STAFF_VERSION?[old[0],old[1],null,null,null,old[2]]:old;return {...staff,version:STAFF_VERSION,starters:Array.from({length:5},(_,i)=>staff.starters?.[i]||null),relief:Array.from({length:6},(_,i)=>relief[i]||null)};}
export function migratePitching(state){const manager=state.manager||{},old=manager.staff;if(!old||old.version===STAFF_VERSION)return state;const staff=normalizePitchingStaff(old),byId=new Map(state.players.map(c=>[c.uniqueId,c])),locked=new Set([...Object.values(manager.scouting?.books||{}).flatMap(b=>b.pledges||[]),...(manager.legendScout?.pledges||[])]),used=new Set([...Object.values(state.lineup||{}).filter(Boolean),...[...staff.starters,...staff.relief].map(id=>byId.get(id)).filter(Boolean)].map(c=>String(c.playerId)));
 // Preserve every occupied old slot; fill only the three newly added roles from owned reserves.
 for(const i of [2,3,4])if(!staff.relief[i]){const c=state.players.find(c=>c.pos==='P'&&!used.has(String(c.playerId))&&!locked.has(c.uniqueId));if(c){staff.relief[i]=c.uniqueId;used.add(String(c.playerId));}}
 return {...state,manager:{...manager,staff}};
}
export function chooseGamePitcher(team,inning,lead,usage={},starterRuns=0){const relief=normalizePitchingStaff({relief:team.relief}).relief;usage.used??=new Set();usage.counts??={};const starter=team.starter,removed=usage.current&&usage.current.uniqueId!==starter.uniqueId;
 let wanted=-1;
 if(inning>=6||removed||inning>=3&&(starterRuns>=5||(starter.fatigue||0)>=80)){
  wanted=inning<6||Math.abs(lead)>=5?4:inning>=8&&lead>0&&lead<=3?5:inning>=9?4:lead>=0?Math.min(1,Math.max(0,inning-6)):2+Math.min(1,Math.max(0,inning-6));
 }
 let pitcher=starter,role='선발';
 if(wanted>=0){const order=[wanted,...(lead>=0?[0,1,4,2,3,5]:[2,3,4,0,1,5])],desired=relief[wanted],limit=wanted===4?2:1;
  const canStay=desired&&usage.current?.uniqueId===desired.uniqueId&&(usage.counts[desired.uniqueId]||0)<limit;
  const index=canStay?wanted:order.find(i=>relief[i]&&!usage.used.has(relief[i].uniqueId));
  if(index!==undefined){pitcher=relief[index];role=BULLPEN_ROLES[index];}else{pitcher=usage.current||starter;role=usage.role||'선발';}
 }
 usage.current=pitcher;usage.role=role;usage.used.add(pitcher.uniqueId);usage.counts[pitcher.uniqueId]=(usage.counts[pitcher.uniqueId]||0)+1;return {pitcher,role};
}
