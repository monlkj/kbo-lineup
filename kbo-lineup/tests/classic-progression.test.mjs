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
test('legend search cooldown, exact recipe, pledged protection, wildcard counts and fixed target recruitment',()=>{
 let s=rules.searchLegend(state(),db,'',false,1000,()=>0);const found=s.manager.legendScout.target;assert.equal(s.players.length,0);assert.equal(s.currency.points,1e7-3000);assert.throws(()=>rules.searchLegend(s,db,'',false,2000),/대기/);
 for(let i=0;i<12;i++){
 const slot=s.manager.legendScout.requirements[i];if(slot.kind==='COACH'){const item={id:'coach-'+i,packId:'coach_material',coachId:slot.coachId};s.inventory.push(item);s=rules.pledgeLegend(s,i,'coach:'+item.id);continue;}const base=db.find(c=>rules.matchesLegend({...c,grade:'PLATINUM',cardType:slot.kind==='NATIONAL'?'NATIONAL':undefined},slot));assert.ok(base,JSON.stringify(slot));const m={...card(base),...(slot.kind==='NATIONAL'?{cardType:'NATIONAL'}:{})};s.players.push(m);s=rules.pledgeLegend(s,i,m.uniqueId);assert.ok(protectedIds({},s.manager).has(m.uniqueId));
 }
 s.inventory.push({packId:rules.CLASSIC.legendPermit});const snapshot=clone(s);assert.throws(()=>rules.startCombination(s,s.players.slice(0,3).map(c=>c.uniqueId),'NORMAL',db),/편성/);
 const result=rules.recruitLegend(clone(s));assert.equal(result.card.uniqueId,found.uniqueId);assert.equal(result.state.players.length,1);assert.equal(result.state.manager.legendScout.nextSearchAt,s.manager.legendScout.nextSearchAt);assert.deepEqual(s,snapshot);assert.throws(()=>rules.recruitLegend(result.state),/12칸/);
 const w=clone(s);w.inventory.push({packId:rules.CLASSIC.legendWild},{packId:rules.CLASSIC.legendWild});let mixed=rules.pledgeLegend(w,6,'item:'+rules.CLASSIC.legendWild);mixed=rules.pledgeLegend(mixed,7,'item:'+rules.CLASSIC.legendWild);assert.throws(()=>rules.pledgeLegend(mixed,8,'item:'+rules.CLASSIC.legendWild),/최대 2개/);assert.throws(()=>rules.pledgeLegend(mixed,0,'item:'+rules.CLASSIC.legendWild),/실제 재료/);const wr=rules.recruitLegend(mixed);assert.equal(wr.state.inventory.length,0);assert.equal(wr.state.players.length,3);

});
test('combination consumes once, persists blind choices, claims once and enforces protection/position',()=>{
 const material=Array.from({length:3},()=>card(db[0]));const s=state(material),ids=material.map(c=>c.uniqueId),snapshot=clone(s);let next=rules.startCombination(s,ids,'STAR',db,'',()=>.4);assert.equal(next.players.length,0);assert.equal(next.currency.stars,s.currency.stars-500);assert.equal(next.manager.pendingCombination.choices.length,7);assert.deepEqual(s,snapshot);assert.throws(()=>rules.claimCombination(next,0),/選|선택/);assert.throws(()=>rules.startCombination(next,ids,'STAR',db),/결과/);
 next=rules.shuffleCombination(clone(next),()=>.3);const saved=clone(next);assert.equal(next.manager.pendingCombination.phase,'hidden');assert.throws(()=>rules.shuffleCombination(next),/섞을/);const result=rules.claimCombination(saved,2);assert.equal(result.state.players.length,1);assert.equal(result.card.uniqueId,saved.manager.pendingCombination.choices[2].uniqueId);assert.equal(result.card.grade,'PLATINUM');assert.throws(()=>rules.claimCombination(result.state,0),/선택/);
 assert.throws(()=>rules.startCombination({...s,lineup:{P:material[0]}},ids,'NORMAL',db),/편성/);assert.throws(()=>rules.startCombination(s,ids,'POSITION',db,'impossible'),/포지션/);const legend=card(db[0],'LEGEND');assert.throws(()=>rules.startCombination(state([legend,...material]),[legend.uniqueId,...ids.slice(0,2)],'NORMAL',db),/레전드/);
 const normals=Array.from({length:3},()=>card(db[0],'NORMAL'));const single=rules.startCombination(state(normals),normals.map(c=>c.uniqueId),'NORMAL',db,'',()=>0);assert.equal(single.manager.pendingCombination.phase,'single');assert.equal(rules.claimCombination(single,0).state.players.length,1);
});


test('all legend recipes require own-franchise awards, verified national card, and two exact coaches; legacy migration preserves resources',()=>{
 for(const target of db.filter(c=>c.grade==='LEGEND')){const r=rules.legendRecipe(target,db);assert.equal(r.length,12);for(const slot of r.slice(6,10))assert.ok(db.some(c=>rules.matchesLegend({...c,grade:'PLATINUM',...(slot.kind==='NATIONAL'?{cardType:'NATIONAL'}:{})},slot)),JSON.stringify({target:target.name,team:target.team,slot}));for(const slot of r.slice(10))assert.ok(rules.COACHES.some(c=>c.id===slot.coachId));}
 let s=rules.searchLegend(state(),db,'',false,1000,()=>0);const old=s.manager.legendScout;const requirements=[...old.requirements.slice(0,6),old.requirements[8],old.requirements[7],old.requirements[6]].map(x=>({...x}));delete requirements[6].team;delete requirements[7].team;delete requirements[8].team;s={...s,inventory:Array.from({length:9},()=>({packId:rules.CLASSIC.legendWild})),manager:{...s.manager,legendScout:{...old,recipeVersion:undefined,requirements,pledges:Array(9).fill('item:'+rules.CLASSIC.legendWild)}}};const before=clone(s),next=rules.migrateLegendRecipe(s,db);assert.equal(next.manager.legendScout.requirements.length,12);assert.deepEqual(next.manager.legendScout.requirements.slice(0,6),requirements.slice(0,6));assert.equal(next.manager.legendScout.pledges.filter(Boolean).length,9);assert.deepEqual(next.currency,s.currency);assert.deepEqual(next.inventory,s.inventory);assert.deepEqual(clone(s),before);
 const coach=next.manager.legendScout.requirements[10];const wrong={id:'wrong',packId:'coach_material',coachId:'not-real'};assert.equal(rules.matchesCoach(wrong,coach),false);assert.throws(()=>rules.pledgeLegend({...next,inventory:[...next.inventory,wrong]},10,'coach:wrong'),/코치/);
});


test('legend difficulty migration releases excess wildcard pledges without consuming inventory and material packs spend earned coins',()=>{
 let s=rules.searchLegend(state(),db,'',false,1000,()=>0);s.manager.legendScout.pledges=Array(12).fill('item:'+rules.CLASSIC.legendWild);delete s.manager.legendScout.difficultyVersion;s.inventory=Array.from({length:12},()=>({packId:rules.CLASSIC.legendWild}));const next=rules.migrateLegendDifficulty(s);assert.equal(next.manager.legendScout.pledges.filter(Boolean).length,2);assert.deepEqual(next.inventory,s.inventory);assert.ok(next.manager.legendScout.pledges.slice(0,6).every(x=>x===null));assert.ok(next.manager.legendScout.pledges.slice(10).every(x=>x===null));
 assert.throws(()=>rules.buyLegendMaterial(next,db),/코인/);const funded={...next,manager:{...next.manager,leagueTokens:10}};const card=rules.buyLegendMaterial(funded,db,()=>0);assert.equal(card.state.manager.leagueTokens,0);assert.equal(card.card.grade,'PLATINUM');assert.equal(card.card.id,next.manager.legendScout.requirements[0].cardId);assert.deepEqual(funded.players,[]);const coach=rules.buyLegendMaterial(funded,db,()=>.99);assert.ok(coach.state.manager.coachCards.some(i=>i.packId==='coach_material'));assert.equal(coach.state.manager.leagueTokens,0);
});
