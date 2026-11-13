import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {playableCard,protectedIds} from '../app/club-rules.js';
import {overall} from '../app/manager-engine.js';
import * as rules from '../app/classic-progression.js';
const db=['catalog.json','national-cards.json'].flatMap(file=>JSON.parse(fs.readFileSync(new URL('../data/'+file,import.meta.url)))).map(c=>({...c,grade:c.awards.some(a=>a.type==='MVP')?'LEGEND':'PLATINUM'}));
const card=(base=db[0],grade='PLATINUM')=>playableCard(base,grade);
const state=(players=[])=>({players,currency:{points:1e7,stars:1e5},inventory:[],lineup:{},manager:{rosterCapacity:100}});
const clone=s=>JSON.parse(JSON.stringify(s));
test('breakthrough uses same person across years; failure consumes source only; ticket/star and legacy cap',()=>{
 const c=card(),otherYear={...card(),year:c.year+1},otherPerson=card(db.find(p=>p.playerId!==c.playerId));let s=state([c,otherYear,otherPerson]);
 assert.throws(()=>rules.breakthrough(s,c.uniqueId,otherPerson.uniqueId),/동일 선수/);
 const before=clone(s),failed=rules.breakthrough(s,c.uniqueId,otherYear.uniqueId,'points',()=>.999);assert.equal(failed.success,false);assert.equal(failed.state.players.length,2);assert.equal(failed.state.players[0].limitBreaks,undefined);assert.equal(failed.state.currency.points,s.currency.points-10000);assert.deepEqual(s,before);
 let r=rules.breakthrough(s,c.uniqueId,otherYear.uniqueId,'stars',()=>.999);assert.equal(r.success,true);assert.equal(rules.upgradeLimit(r.state.players[0]),12);
 s={...r.state,inventory:Array.from({length:5},()=>({packId:rules.CLASSIC.limitTicket}))};
 for(let i=0;i<4;i++)s=rules.breakthrough(s,c.uniqueId,null,'ticket',()=>.999).state;assert.equal(rules.upgradeLimit(s.players[0]),20);assert.throws(()=>rules.breakthrough(s,c.uniqueId,null,'ticket'),/最大|최대/);assert.equal(s.inventory.length,1);
 assert.equal(rules.upgradeLimit({...c,upgrade:17}),18);
});
test('enhance respects expanded cap, 100% stars, points fail leaves level; protected material rejected',()=>{
 const c={...card(),upgrade:10},m=card();let s=state([c,m]);assert.throws(()=>rules.enhance(s,c.uniqueId),/상한/);
 s=rules.breakthrough(s,c.uniqueId,m.uniqueId,'stars').state;s=rules.enhance(s,c.uniqueId,'stars',()=>.999).state;assert.equal(s.players[0].upgrade,11);assert.equal(s.players[0].ovr,overall(s.players[0]));const r=rules.enhance(s,c.uniqueId,'points',()=>.999);assert.equal(r.success,false);assert.equal(r.state.players[0].upgrade,11);
 const protectedState={...state([c,m]),lineup:{C:m}};assert.throws(()=>rules.breakthrough(protectedState,c.uniqueId,m.uniqueId,'stars'),/편성/);
});
test('legend search cooldown, exact recipe, pledged protection, wildcard counts and fixed target recruitment',()=>{
 let s=rules.searchLegend(state(),db,'',false,1000,()=>0);const found=s.manager.legendScout.target;assert.equal(s.players.length,0);assert.equal(s.currency.points,1e7-3000);assert.throws(()=>rules.searchLegend(s,db,'',false,2000),/대기/);
 for(let i=0;i<12;i++){
 const slot=s.manager.legendScout.requirements[i];if(slot.kind==='COACH'){const item={id:'coach-'+i,packId:'coach_material',coachId:slot.coachId};s.inventory.push(item);s=rules.pledgeLegend(s,i,'coach:'+item.id);continue;}const base=db.find(c=>rules.matchesLegend({...c,grade:'PLATINUM',cardType:slot.kind==='NATIONAL'?'NATIONAL':undefined},slot));assert.ok(base,JSON.stringify(slot));const m={...card(base),...(slot.kind==='NATIONAL'?{cardType:'NATIONAL'}:{})};s.players.push(m);s=rules.pledgeLegend(s,i,m.uniqueId);assert.ok(protectedIds({},s.manager).has(m.uniqueId));
 }
 const snapshot=clone(s);assert.throws(()=>rules.startCombination(s,s.players.slice(0,3).map(c=>c.uniqueId),'NORMAL',db),/편성/);
 const result=rules.recruitLegend(clone(s));assert.equal(result.card.uniqueId,found.uniqueId);assert.equal(result.state.players.length,1);assert.equal(result.state.manager.legendScout.nextSearchAt,s.manager.legendScout.nextSearchAt);assert.deepEqual(s,snapshot);assert.throws(()=>rules.recruitLegend(result.state),/12칸/);
 let w=rules.searchLegend(state(),db,'',false,1000,()=>0);w.inventory=Array.from({length:12},()=>({packId:rules.CLASSIC.legendWild}));for(let i=0;i<12;i++)w=rules.pledgeLegend(w,i,'item:'+rules.CLASSIC.legendWild);const wr=rules.recruitLegend(w);assert.equal(wr.state.inventory.length,0);assert.equal(wr.state.players.length,1);
});
test('invalid legend and signature transactions never consume original state',()=>{
 let s=rules.searchLegend(state(),db,'',false,1,()=>0);s.inventory=[{packId:rules.CLASSIC.legendWild}];s=rules.pledgeLegend(s,0,'item:'+rules.CLASSIC.legendWild);assert.throws(()=>rules.pledgeLegend(s,1,'item:'+rules.CLASSIC.legendWild),/부족/);
 const untrained=card();assert.throws(()=>rules.awakenSignature(state([untrained]),untrained.uniqueId,Array(5).fill('item:'+rules.CLASSIC.signatureWild)),/20/);
 const base={...card(),upgrade:20,limitBreaks:5,growth:{power:2}},sig=state([base]);sig.inventory=[{packId:rules.CLASSIC.signatureContract},...Array.from({length:5},()=>({packId:rules.CLASSIC.signatureWild}))];const before=clone(sig);const bad={...sig,currency:{points:0,stars:0}};assert.throws(()=>rules.awakenSignature(bad,base.uniqueId,Array(5).fill('item:'+rules.CLASSIC.signatureWild)),/포인트/);assert.deepEqual(sig,before);
 const result=rules.awakenSignature(sig,base.uniqueId,Array(5).fill('item:'+rules.CLASSIC.signatureWild));assert.equal(result.card.grade,'SIGNATURE');assert.equal(result.card.uniqueId,base.uniqueId);assert.equal(result.card.upgrade,20);assert.deepEqual(result.card.growth,base.growth);assert.equal(result.state.inventory.length,0);assert.equal(result.state.currency.points,1e7-100000);
});
test('signature strict selected ability threshold and 5/10 category routes',()=>{
 const award=db.find(c=>c.pos!=='P'&&c.awards.some(a=>a.type==='골든글러브'));const base=card(award),slots=rules.signatureRequirements(base,'AWARD','power');assert.equal(slots.length,5);
 const natural=overall(base);const start=rules.signatureRequirements(base,'AWARD','power')[0];
 const powerBase=40+(award.stats.hr||0)/Math.max(1,award.stats.pa||1)*600;const rounded=Math.max(30,Math.min(99,Math.round(powerBase)));
 const exact95={...base,growth:{power:95-rounded}},exact96={...base,growth:{power:96-rounded}};
 assert.equal(rules.matchesSignature(exact95,start),false);assert.equal(rules.matchesSignature(exact96,start),true);assert.ok(overall(exact96)<95);assert.equal(rules.matchesSignature({...exact96,awards:[]},start),false);
 const regular=rules.signatureRequirements(base,'REGULAR','power');assert.equal(regular.length,10);assert.equal(rules.matchesSignature({...exact96,cardType:'NORMAL'},regular[0]),true);assert.equal(rules.matchesSignature(exact96,regular[0]),false);
 assert.throws(()=>rules.signatureRequirements(base,'AWARD','stuff'),/능력치/);
 const national=db.find(c=>rules.nationalEvidence(c));assert.ok(national);assert.equal(rules.signatureCategory({...national,cardType:'NATIONAL'}),'NATIONAL');assert.equal(rules.signatureCategory({...base,cardType:'NATIONAL',year:1900}),'INVALID');
});
test('combination consumes once, persists blind choices, claims once and enforces protection/position',()=>{
 const material=Array.from({length:3},()=>card(db[0]));const s=state(material),ids=material.map(c=>c.uniqueId),snapshot=clone(s);let next=rules.startCombination(s,ids,'STAR',db,'',()=>.4);assert.equal(next.players.length,0);assert.equal(next.currency.stars,s.currency.stars-500);assert.equal(next.manager.pendingCombination.choices.length,7);assert.deepEqual(s,snapshot);assert.throws(()=>rules.claimCombination(next,0),/選|선택/);assert.throws(()=>rules.startCombination(next,ids,'STAR',db),/결과/);
 next=rules.shuffleCombination(clone(next),()=>.3);const saved=clone(next);assert.equal(next.manager.pendingCombination.phase,'hidden');assert.throws(()=>rules.shuffleCombination(next),/섞을/);const result=rules.claimCombination(saved,2);assert.equal(result.state.players.length,1);assert.equal(result.card.uniqueId,saved.manager.pendingCombination.choices[2].uniqueId);assert.equal(result.card.grade,'PLATINUM');assert.throws(()=>rules.claimCombination(result.state,0),/선택/);
 assert.throws(()=>rules.startCombination({...s,lineup:{P:material[0]}},ids,'NORMAL',db),/편성/);assert.throws(()=>rules.startCombination(s,ids,'POSITION',db,'impossible'),/포지션/);const legend=card(db[0],'LEGEND');assert.throws(()=>rules.startCombination(state([legend,...material]),[legend.uniqueId,...ids.slice(0,2)],'NORMAL',db),/레전드/);
 const normals=Array.from({length:3},()=>card(db[0],'NORMAL'));const single=rules.startCombination(state(normals),normals.map(c=>c.uniqueId),'NORMAL',db,'',()=>0);assert.equal(single.manager.pendingCombination.phase,'single');assert.equal(rules.claimCombination(single,0).state.players.length,1);
});

test('actual card signature recipe validates every material and preserves assigned base',()=>{
 const award=db.find(c=>c.awards.some(a=>['골든글러브','MVP'].includes(a.type)));const base={...card(award),upgrade:20,limitBreaks:5};
 const boosted=()=>({...card(award),upgrade:20,growth:{contact:99,power:99,eye:99,speed:99,field:99,control:99,stuff:99,stamina:99}});
 const materials=Array.from({length:5},boosted);const ids=materials.map(c=>c.uniqueId);const s={...state([base,...materials]),lineup:{DH:base},inventory:[{packId:rules.CLASSIC.signatureContract}]};
 assert.throws(()=>rules.awakenSignature(s,base.uniqueId,ids.map((id,i)=>i===1?ids[0]:id)),/같은 카드/);
 const wrong={...s,players:s.players.map(c=>c.uniqueId===ids[0]?{...c,awards:[]}:c)};assert.throws(()=>rules.awakenSignature(wrong,base.uniqueId,ids),/능력치|재료 유형/);
 const busy={...s,lineup:{...s.lineup,C:materials[0]}};assert.throws(()=>rules.awakenSignature(busy,base.uniqueId,ids),/편성/);
 const result=rules.awakenSignature(s,base.uniqueId,ids);assert.equal(result.state.players.length,1);assert.equal(result.card.grade,'SIGNATURE');assert.equal(result.state.players[0].uniqueId,base.uniqueId);
});

test('all legend recipes require own-franchise awards, verified national card, and two exact coaches; legacy migration preserves resources',()=>{
 for(const target of db.filter(c=>c.grade==='LEGEND')){const r=rules.legendRecipe(target,db);assert.equal(r.length,12);for(const slot of r.slice(6,10))assert.ok(db.some(c=>rules.matchesLegend({...c,grade:'PLATINUM',...(slot.kind==='NATIONAL'?{cardType:'NATIONAL'}:{})},slot)),JSON.stringify({target:target.name,team:target.team,slot}));for(const slot of r.slice(10))assert.ok(rules.COACHES.some(c=>c.id===slot.coachId));}
 let s=rules.searchLegend(state(),db,'',false,1000,()=>0);const old=s.manager.legendScout;const requirements=[...old.requirements.slice(0,6),old.requirements[8],old.requirements[7],old.requirements[6]].map(x=>({...x}));delete requirements[6].team;delete requirements[7].team;delete requirements[8].team;s={...s,inventory:Array.from({length:9},()=>({packId:rules.CLASSIC.legendWild})),manager:{...s.manager,legendScout:{...old,recipeVersion:undefined,requirements,pledges:Array(9).fill('item:'+rules.CLASSIC.legendWild)}}};const before=clone(s),next=rules.migrateLegendRecipe(s,db);assert.equal(next.manager.legendScout.requirements.length,12);assert.deepEqual(next.manager.legendScout.requirements.slice(0,6),requirements.slice(0,6));assert.equal(next.manager.legendScout.pledges.filter(Boolean).length,9);assert.deepEqual(next.currency,s.currency);assert.deepEqual(next.inventory,s.inventory);assert.deepEqual(clone(s),before);
 const coach=next.manager.legendScout.requirements[10];const wrong={id:'wrong',packId:'coach_material',coachId:'not-real'};assert.equal(rules.matchesCoach(wrong,coach),false);assert.throws(()=>rules.pledgeLegend({...next,inventory:[...next.inventory,wrong]},10,'coach:wrong'),/코치/);
});
