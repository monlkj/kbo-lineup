export const BENCH_SIZE=5;
export const battingBench=manager=>Array.from({length:BENCH_SIZE},(_,i)=>manager?.bench?.[i]||null);
export function migrateBattingBench(state){const manager=state.manager||{};if(manager.benchVersion===1)return state;const byId=new Map(state.players.map(c=>[c.uniqueId,c])),bench=battingBench(manager),locked=new Set([...Object.values(manager.scouting?.books||{}).flatMap(b=>b.pledges||[]),...(manager.legendScout?.pledges||[])]),used=new Set([...Object.values(state.lineup||{}).filter(Boolean),...[...(manager.staff?.starters||[]),...(manager.staff?.relief||[]),...bench].map(id=>byId.get(id)).filter(Boolean)].map(c=>String(c.playerId)));
 for(let i=0;i<BENCH_SIZE;i++)if(!bench[i]){const c=state.players.find(c=>c.pos!=='P'&&!used.has(String(c.playerId))&&!locked.has(c.uniqueId));if(c){bench[i]=c.uniqueId;used.add(String(c.playerId));}}
 return {...state,manager:{...manager,bench,benchVersion:1}};
}
