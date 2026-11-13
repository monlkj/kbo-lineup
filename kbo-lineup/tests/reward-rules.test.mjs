import assert from 'node:assert/strict';
import {REWARDS,POINT_LOTTERY,startingMail,dailyMail,leagueMail,championMail,normalizeUnclaimedMail,claimMail,openLotteries,drawPoints} from '../app/reward-rules.js';
assert.equal(POINT_LOTTERY.reduce((n,p)=>n+p.weight,0),100);
let cutoff=0;for(const tier of POINT_LOTTERY){assert.equal(drawPoints(()=>cutoff/100),tier.points);assert.equal(drawPoints(()=>(cutoff+tier.weight-.00001)/100),tier.points);cutoff+=tier.weight;}
const start=startingMail();assert.equal(start.find(m=>m.type==='STAR').amount,500);assert.equal(start.find(m=>m.type==='LOTTERY').amount,10);assert.ok(!start.some(m=>m.type==='POINT'));
const claimed=claimMail(start,{points:0,stars:0},[]);assert.equal(claimed.currency.points,0);assert.equal(claimed.currency.stars,500);assert.equal(claimed.inventory.filter(i=>i.packId==='point_lottery').length,10);assert.equal(claimed.inventory.filter(i=>i.packId==='premium_team').length,3);
const ten=openLotteries(claimed.inventory,10,()=>0);assert.equal(ten.count,10);assert.equal(ten.points,100000);assert.equal(ten.inventory.length,3);assert.equal(new Set(ten.inventory.map(i=>i.id)).size,ten.inventory.length);
const tooMany=openLotteries(claimed.inventory,999,()=>.9999);assert.equal(tooMany.count,10);assert.equal(tooMany.points,5000000);assert.equal(openLotteries(tooMany.inventory,10).count,0);
assert.equal(openLotteries(claimed.inventory,1,()=>0).inventory.length,12);
const migrated=normalizeUnclaimedMail([{title:'창단 지원 스타',type:'STAR',amount:15000},{title:'창단 지원금',type:'POINT',amount:500000},{title:'다른 우편',type:'STAR',amount:55}]);assert.equal(migrated[0].amount,500);assert.equal(migrated[1].type,'LOTTERY');assert.equal(migrated[2].amount,55);
assert.equal(dailyMail().find(m=>m.type==='STAR').amount,30);assert.ok(['WIN','DRAW','LOSS'].every(result=>leagueMail(result).every(m=>m.type==='LOTTERY')));assert.equal(championMail(2026).find(m=>m.type==='STAR').amount,500);assert.ok(REWARDS.dailyStars<100);
console.log('PASS: scarce star rewards, voucher-only primary point income, unclaimed legacy starter migration, lottery boundaries, 1/10/all consumption and no duplicate redemption');
