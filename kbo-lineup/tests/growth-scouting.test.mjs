import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ratings,overall} from '../app/manager-engine.js';
import {playableCard,protectedIds,changeSkills,sanitizeSkills} from '../app/club-rules.js';
import {cardLevel,levelLimit,migrateGrowth} from '../app/growth-rules.js';
import {enhance,breakthrough,transcend,signatureRequirements,matchesSignature,awakenSignature,matchesLegend,COACHES,CLASSIC} from '../app/classic-progression.js';
import {migrateScouting,prepareLegend,expandScout,venueCandidate,scout,registerMaterial,recruitScout,SCOUT_CONFIG} from '../app/scouting-rules.js';
import {LEGEND_CATALOG} from '../app/legend-registry.js';
import {placePitcher,placeBatter} from '../app/lineup-actions.js';
import {assignCoach} from '../app/coaching.js';
const db=['catalog.json','national-cards.json'].flatMap(f=>JSON.parse(fs.readFileSync(new URL('../data/'+f,import.meta.url))));
const card=(base=db.find(c=>c.pos!=='P'),grade='PLATINUM')=>playableCard(base,grade);
const state=(players=[])=>({players,currency:{points:1e8,stars:1e6},inventory:[],mailbox:[],lineup:{},manager:{rosterCapacity:100}});
const ticket=(packId,i=crypto.randomUUID())=>({id:i,packId});
test('Lv1 cap10; successful enhancement distributes exactly five unbounded points and failed enhancement preserves stats',()=>{
 const c=card(),s=state([c]),before=structuredClone(s),r=enhance(s,c.uniqueId,'stars',()=>0),after=r.state.players[0];assert.equal(cardLevel(c),1);assert.equal(levelLimit(c),10);assert.equal(cardLevel(after),2);assert.equal(Object.values(ratings(after)).reduce((a,b)=>a+b,0)-Object.values(ratings(c)).reduce((a,b)=>a+b,0),5);assert.deepEqual(s,before);
 const boosted={...after,enhancement:{power:200}};assert.ok(ratings(boosted).power>200);assert.equal(overall(boosted),Math.round(Object.values(ratings(boosted)).reduce((a,b)=>a+b,0)/5));
 const failed=enhance(state([after]),after.uniqueId,'points',()=>.999);assert.equal(failed.success,false);assert.deepEqual(ratings(failed.state.players[0]),ratings(after));assert.equal(cardLevel(failed.state.players[0]),2);
 assert.throws(()=>enhance(state([{...c,level:10}]),c.uniqueId),/상한/);
 const p=card(db.find(c=>c.pos==='P'));assert.deepEqual(Object.keys(ratings(p)),['control','stuff','stamina','fastball','breaking']);assert.equal(overall(p),Math.round(Object.values(ratings(p)).reduce((a,b)=>a+b,0)/5));
});
test('legacy growth migration preserves all old bonuses, XP and skills and is idempotent',()=>{
 const legacy={...db.find(c=>c.pos!=='P'),grade:'PLATINUM',upgrade:17,growth:{power:8},xp:99,skills:[{name:'a'}]};const m=migrateGrowth(legacy);assert.equal(m.level,17);assert.equal(levelLimit(m),18);assert.equal(m.enhancement.power,17);assert.equal(m.growth.power,8);assert.deepEqual(m.skills,legacy.skills);assert.equal(m.xp,99);assert.deepEqual(migrateGrowth(m),m);assert.deepEqual(ratings(m),ratings(legacy));
});
test('same season/type/grade limit breaks guarantee cap+2; 15 transcend tickets reach30 without changing level',()=>{
 const c=card(),source=card(),s=state([c,source]);assert.throws(()=>breakthrough({...s,players:[c,{...source,id:'other-year'}]},c.uniqueId,source.uniqueId),/연도/);assert.throws(()=>breakthrough({...s,lineup:{P:source}},c.uniqueId,source.uniqueId),/편성/);
 let next=breakthrough(s,c.uniqueId,source.uniqueId).state;assert.equal(next.players.length,1);assert.equal(levelLimit(next.players[0]),12);assert.equal(cardLevel(next.players[0]),1);
 next.inventory=Array.from({length:4},()=>ticket('limit_break_ticket'));for(let i=0;i<4;i++)next=breakthrough(next,c.uniqueId,null,'ticket').state;assert.equal(levelLimit(next.players[0]),20);assert.throws(()=>breakthrough(next,c.uniqueId,null,'ticket'),/20/);
 next.inventory=Array.from({length:15},()=>ticket('transcend_ticket'));for(let i=1;i<=5;i++){const n=next.inventory.length;next=transcend(next,c.uniqueId).state;assert.equal(n-next.inventory.length,i);assert.equal(levelLimit(next.players[0]),20+2*i);assert.equal(cardLevel(next.players[0]),1);}assert.equal(next.inventory.length,0);assert.throws(()=>transcend(next,c.uniqueId),/20~28/);assert.equal(levelLimit({...next.players[0],transcendBreaks:1,level:22,upgrade:21}),22);
 const bad=state([{...c,limitBreaks:5}]),before=structuredClone(bad);assert.throws(()=>transcend(bad,c.uniqueId),/아이템/);assert.deepEqual(bad,before);
});
test('signature recipes depend on target type; 95 inclusive, extra award no stat condition, duplicates and wildcards validated atomically',()=>{
 const award=db.find(c=>c.pos!=='P'&&c.awards.some(a=>a.type==='MVP')),base={...card(award),level:20,limitBreaks:5},materials=Array.from({length:10},()=>({...card(db.find(c=>c.pos!=='P')),cardType:'NORMAL',enhancement:{power:100}}));
 const exact={...materials[0],enhancement:{power:95-ratings({...materials[0],enhancement:{}}).power}};assert.equal(ratings(exact).power,95);assert.ok(matchesSignature(exact,signatureRequirements(base,null,'power')[0]));assert.equal(signatureRequirements(base,null,'power').length,5);
 const normal={...base,cardType:'NORMAL'},slots=signatureRequirements(normal,null,'power');assert.equal(slots.length,11);const extra=card(award);assert.ok(matchesSignature(extra,slots[10]));
 let s={...state([normal,...materials,extra]),inventory:[ticket('signature_contract')],lineup:{DH:normal}},ids=[...materials.map(c=>c.uniqueId),extra.uniqueId],before=structuredClone(s);assert.throws(()=>awakenSignature(s,normal.uniqueId,ids.map((id,i)=>i===1?ids[0]:id),{stat:'power'}),/중복/);assert.deepEqual(s,before);
 const r=awakenSignature(s,normal.uniqueId,ids,{stat:'power'});assert.equal(r.state.players.length,1);assert.equal(r.card.uniqueId,normal.uniqueId);assert.equal(r.card.level,20);assert.equal(r.card.grade,'SIGNATURE');assert.deepEqual(s,before);
 const wild={...state([base]),inventory:[ticket('signature_contract'),...Array.from({length:5},()=>ticket('signature_wild_material'))]};assert.throws(()=>awakenSignature(wild,base.uniqueId,Array(5).fill('item:signature_wild_material'),{stat:'power'}),/최대 2개/);
});
test('scout odds split LG and Doosan Jamsil and aliases; full queues and insufficient resources never charge',()=>{
 const pool=[{team:'LG',id:'l'},{team:'두산',id:'d'},{team:'OB',id:'o'},{team:'현대',id:'h'}];assert.equal(venueCandidate(pool,'LG',()=>.449).id,'l');assert.notEqual(venueCandidate(pool,'LG',()=>.45).id,'l');assert.ok(['d','o'].includes(venueCandidate(pool,'두산',()=>.1).id));assert.throws(()=>venueCandidate(pool,'키움',()=>0),/부족/);
 let s=state();for(let i=0;i<11;i++)s=expandScout(s);assert.equal(s.manager.scouting.capacity,12);assert.equal(s.currency.stars,1e6-5500);assert.throws(()=>expandScout(s),/최대/);assert.equal(SCOUT_CONFIG.legendTicketStars,20000);
 const initial={...state(),inventory:[ticket('legend_scout_ticket')]},before=structuredClone(initial),r=scout(initial,db,'LEGEND','삼성',()=>0);assert.equal(r.state.players.length,0);assert.equal(r.state.manager.scouting.queue.length,1);assert.equal(r.state.inventory.length,0);assert.deepEqual(initial,before);assert.throws(()=>scout({...r.state,inventory:[ticket('legend_scout_ticket')]},db,'LEGEND','삼성'),/가득/);
 const n=scout(state(),db,'NORMAL','LG',()=>0);assert.equal(n.state.currency.points,1e8-3000);assert.equal(n.card.grade,'NORMAL');assert.equal(n.state.players.length,1);const a=scout(state(),db,'ADVANCED','두산',()=>0);assert.equal(a.state.currency.stars,1e6-100);assert.equal(a.card.grade,'SPECIAL');
});
function filled(){let s=prepareLegend(state(),LEGEND_CATALOG.find(c=>c.team==='삼성'),db),id=Object.keys(s.manager.scouting.books)[0];for(let i=0;i<12;i++){const req=s.manager.scouting.books[id].requirements[i];let value;if(req.kind==='COACH'){const item={id:crypto.randomUUID(),packId:'coach_material',coachId:req.coachId};s.manager.coachCards=[...(s.manager.coachCards||[]),item];value='coach:'+item.id;}else{const base=db.find(c=>matchesLegend({...c,grade:'PLATINUM',...(req.kind==='NATIONAL'?{cardType:'NATIONAL'}:{})},req));assert.ok(base,JSON.stringify(req));const c=card(base);if(req.kind==='NATIONAL')c.cardType='NATIONAL';s.players.push(c);value=c.uniqueId;}s=registerMaterial(s,id,i,value);}return {s,id};}
test('all12 preregister before finding candidate; irreversible, protected across all books, final recruitment consumes exactly12 without permit',()=>{
 let {s,id}=filled(),book=s.manager.scouting.books[id],before=structuredClone(s);assert.equal(book.pledges.filter(Boolean).length,12);assert.throws(()=>recruitScout(s,id),/대기/);assert.throws(()=>registerMaterial(s,id,0,null),/취소/);assert.throws(()=>registerMaterial(s,id,0,book.pledges[1]),/취소/);assert.deepEqual(s,before);
 for(const uid of book.pledges.slice(0,10))assert.ok(protectedIds({},s.manager).has(uid));const uid=book.pledges[0],c=s.players.find(c=>c.uniqueId===uid);if(c.pos==='P')assert.throws(()=>placePitcher(s,{kind:'starters',index:0},uid),/등록/);else assert.throws(()=>placeBatter(s,0,uid),/등록/);
 s.manager.scouting.queue.push({id:'candidate',card:playableCard(book.target,'LEGEND')});const r=recruitScout(s,id);assert.equal(r.card.grade,'LEGEND');assert.equal(r.state.players.length,1);assert.equal(r.state.manager.coachCards.length,0);assert.equal(r.state.manager.scouting.queue.length,0);assert.equal(r.state.currency.points,s.currency.points-1e6);assert.equal(r.state.inventory.length,0);assert.throws(()=>recruitScout(r.state,id),/대기/);
});
test('legacy scout candidate, pledges, permits and pending mail migrate without loss, once',()=>{
 const target=card(LEGEND_CATALOG[0],'LEGEND'),old={...state(),inventory:[ticket('legend_recruit_permit')],mailbox:[{packId:'legend_recruit_permit',amount:2}],manager:{legendScout:{target,requirements:Array(12).fill({}),pledges:['owned',...Array(11).fill(null)]}}},before=structuredClone(old),n=migrateScouting(old);assert.equal(n.manager.scouting.queue[0].card.uniqueId,target.uniqueId);assert.equal(n.manager.scouting.books[target.id].pledges[0],'owned');assert.equal(n.inventory[0].packId,'legend_scout_ticket');assert.equal(n.mailbox[0].packId,'legend_scout_ticket');assert.deepEqual(migrateScouting(n),n);assert.deepEqual(old,before);
});
test('selection excludes just-removed skill and all3 names unique; protect keeps slot, premium may generate3 legends',()=>{
 const c=card(db.find(c=>c.pos!=='P'),'LEGEND');c.skills=[{name:'베테랑',grade:'LEGEND',level:'S'},{name:'파워히터',grade:'PLATINUM',level:'A'},{name:'수비대장',grade:'NORMAL',level:'B'}];
 for(let i=0;i<100;i++){const rng=()=>i/100,selected=changeSkills(c,'SELECT',0,rng),protectedSet=changeSkills(c,'PROTECT',1,rng);assert.notEqual(selected[0].name,c.skills[0].name);assert.equal(new Set(selected.map(s=>s.name)).size,3);assert.deepEqual(protectedSet[1],c.skills[1]);assert.equal(new Set(protectedSet.map(s=>s.name)).size,3);}
 const triple=changeSkills(c,'PREMIUM',null,()=>.1);assert.equal(triple.filter(s=>s.grade==='LEGEND').length,3);const duplicate=sanitizeSkills({...c,skills:Array(3).fill(c.skills[0])});assert.equal(new Set(duplicate.map(s=>s.name)).size,3);assert.equal(duplicate[0].level,'S');
});

test('L badges honor preserved recipe books as well as current recipes',async()=>{const {setMaterialDatabase,setMaterialBooks,materialLegends}=await import('../app/legend-materials.js');setMaterialDatabase(db);const c=card(db.find(c=>c.pos!=='P')),target={...LEGEND_CATALOG[0],id:'preserved-legend'};setMaterialBooks({legacy:{target,requirements:[{kind:'PLAYER',cardId:c.id,grade:'PLATINUM'}]}});assert.ok(materialLegends(c).some(t=>t.id===target.id));setMaterialBooks({});assert.ok(!materialLegends(c).some(t=>t.id===target.id));});
