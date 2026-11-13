import assert from 'node:assert/strict';
import fs from 'node:fs';
import {generateSkills,changeSkills,sanitizeSkills,skillCount,skillCeiling,createStarterSquad,capacity,acquisitionCount,scoutPool,playableCard,protectedIds} from '../app/club-rules.js';
import {lineupError,TEAMS,overall} from '../app/manager-engine.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../data/catalog.json',import.meta.url))).map(c=>({...c,grade:c.awards.some(a=>a.type==='MVP')?'LEGEND':c.awards.some(a=>a.type==='골든글러브')?'PLATINUM':c.awards.some(a=>a.type==='올스타')?'HERO':overall(c)>=75?'SPECIAL':overall(c)>=65?'RARE':'NORMAL'}));
const rank={NORMAL:0,HERO:1,PLATINUM:2,LEGEND:3};
for(const grade of ['NORMAL','RARE','SPECIAL','HERO','PLATINUM','SIGNATURE','LEGEND'])for(const pos of ['P','SS']){
 const card={pos,grade,skills:generateSkills(pos,grade,'PREMIUM',()=>.999)};
 assert.equal(card.skills.length,skillCount(grade));
 for(const type of ['NORMAL_TICKET','PREMIUM','SELECT','PROTECT']){
  if(type==='PREMIUM'&&!['PLATINUM','SIGNATURE','LEGEND'].includes(grade)){assert.throws(()=>changeSkills(card,type));continue;}
  if(type==='PROTECT'&&card.skills.length===1){assert.throws(()=>changeSkills(card,type,0));continue;}
  const skills=changeSkills(card,type,0,()=>.999);
  if(type==='SELECT')assert.deepEqual(skills.slice(1),card.skills.slice(1));
  if(type==='PROTECT')assert.deepEqual(skills[0],card.skills[0]);
  for(let i=0;i<skills.length;i++)if(!(type==='PROTECT'&&i===0)&&!(type==='SELECT'&&i!==0))assert.ok(rank[skills[i].grade]<=rank[skillCeiling(grade,type)]);
 }
 if(!['PLATINUM','SIGNATURE','LEGEND'].includes(grade))assert.ok(sanitizeSkills({...card,skills:[{name:'핵심타자',grade:'LEGEND',level:'S'}]}).every(s=>rank[s.grade]<2));
}
for(const team of [...TEAMS,'해태','SK','OB','빙그레','현대']){
 const starter=createStarterSquad(team,catalog);assert.equal(starter.players.length,26);assert.equal(new Set(starter.players.map(c=>c.playerId)).size,26);assert.ok(starter.players.every(c=>c.grade==='NORMAL'&&c.skills.length===1));
 const ids=Object.fromEntries(starter.players.map(c=>[c.uniqueId,c]));assert.equal(lineupError(starter.lineup,starter.manager.order,{starters:starter.manager.staff.starters.map(id=>ids[id]),relief:starter.manager.staff.relief.map(id=>ids[id])}), '');
 if(TEAMS.includes(team))assert.ok(starter.players.every(c=>c.team===team),`Starter club mismatch ${team}`);
 assert.equal(protectedIds(starter.lineup,starter.manager).size,17);
}
assert.equal(capacity({},0),100);assert.equal(capacity({rosterCapacity:120},101),120);assert.equal(capacity({rosterCapacity:400},10),300);assert.equal(capacity({},400),400);
assert.equal(acquisitionCount(99,100,5),1);assert.equal(acquisitionCount(100,100,1),0);
for(const grade of ['SIGNATURE','LEGEND']){const pool=scoutPool(catalog,grade);assert.ok(pool.length);const card=playableCard(pool[0],grade);assert.equal(card.grade,grade);assert.ok(card.photo);assert.equal(card.skills.length,3);}
console.log('PASS: every card/ticket grade ceiling, full-set rerolls, selected/protected slots, legacy illegal-skill cleanup, all club starter rosters, capacity and scout output grades');

for(const grade of ['PLATINUM','SIGNATURE','LEGEND'])for(const pos of ['P','SS']){
 const card={grade,pos,skills:generateSkills(pos,grade)};
 for(let seed=0;seed<1000;seed++){
  let n=seed;const rng=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};
  const set=changeSkills(card,'PREMIUM',null,rng);
  assert.ok(['PLATINUM','LEGEND'].includes(set[0].grade));
  if(grade!=='LEGEND')assert.equal(set[0].grade,'PLATINUM');
  assert.ok(set.slice(1).every(s=>s.grade!=='LEGEND'));
 }
 assert.equal(changeSkills(card,'PREMIUM',null,()=>0)[0].grade,grade==='LEGEND'?'LEGEND':'PLATINUM');
 assert.equal(changeSkills(card,'PREMIUM',null,()=>.0999)[0].grade,grade==='LEGEND'?'LEGEND':'PLATINUM');
 assert.equal(changeSkills(card,'PREMIUM',null,()=>.1)[0].grade,'PLATINUM');
}
console.log('PASS: first-slot guarantee across 6000 rolls, exact 10% boundary and no legend skills in slots 2/3');
