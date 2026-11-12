import assert from 'node:assert/strict';
import fs from 'node:fs';
import {schedule,TEAMS,newSeason,buildTeam,simulateDay,sortedStandings,makeCard,lineupError,BAT_POS,trainStat,advancePlayers,startPostseason,playPostseason,ratings} from '../app/manager-engine.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../data/catalog.json',import.meta.url)));
const counts={};for(const day of schedule())for(const [a,b] of day){const k=[a,b].sort().join('/');counts[k]=(counts[k]||0)+1;}
assert.equal(Object.keys(counts).length,45);assert.ok(Object.values(counts).every(c=>c===16));
let seed=17;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
let season=newSeason();const own=buildTeam('KIA',catalog);own.bonus=0;
for(let d=0;d<144;d++){own.starter=buildTeam('KIA',catalog,d).starter;const out=simulateDay(season,own,catalog,rng);season=out.season;assert.equal(out.result.innings[0].length,out.result.innings[1].length);assert.ok(out.result.innings[0].length>=9);assert.ok(out.result.innings[0].length<=12);}
assert.equal(season.day,144);let w=0,l=0;for(const t of TEAMS){const s=season.standings[t];assert.equal(s.w+s.l+s.d,144);w+=s.w;l+=s.l;}assert.equal(w,l);
const p=makeCard(catalog[0]);p.xp=9;const next=advancePlayers([p],[p],p.uniqueId,rng)[0];assert.equal(next.training,3);assert.equal(next.xp,10);const key=Object.keys(ratings(next)).find(k=>ratings(next)[k]<99);const trained=trainStat(next,key);assert.equal(trained.training,2);assert.equal(ratings(trained)[key],ratings(next)[key]+1);
let post=startPostseason(season);for(let i=0;i<100&&!post.champion;i++)post=playPostseason(post,own,catalog,rng);assert.ok(post.champion);
const lineup=Object.fromEntries(BAT_POS.map((p,i)=>[p,own.batters[i]]));assert.equal(lineupError(lineup,BAT_POS,{starters:Array(5),relief:Array(3)}),'선발 5명과 중간·셋업·마무리 3명을 등록해주세요.');
console.log('PASS: 144-game schedule, 16 games/opponent, full-season balance, innings, growth, playoffs, sparse roster validation',sortedStandings(season)[0][0],post.champion);
