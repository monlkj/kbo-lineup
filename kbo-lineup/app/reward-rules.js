export const REWARDS={starterStars:500,dailyStars:30,championStars:500,starterLotteries:10,dailyLotteries:3,winLotteries:2,drawLotteries:1,lossLotteries:1};
export const POINT_LOTTERY=[{points:10000,weight:50},{points:30000,weight:30},{points:50000,weight:15},{points:100000,weight:4},{points:500000,weight:1}];
export function lotteryMail(title,count){return {id:crypto.randomUUID(),title,type:'LOTTERY',amount:count};}
export function starMail(title,count){return {id:crypto.randomUUID(),title,type:'STAR',amount:count};}
export function startingMail(){return [{id:crypto.randomUUID(),title:'창단 선물: 구단선택팩',type:'PACK',packId:'premium_team',amount:3},lotteryMail('창단 포인트 복권',REWARDS.starterLotteries),starMail('창단 지원 스타',REWARDS.starterStars)];}
export function dailyMail(){return [lotteryMail('일일 출석 포인트 복권',REWARDS.dailyLotteries),starMail('일일 출석 스타',REWARDS.dailyStars)];}
export function leagueMail(result){const names={WIN:'승리',DRAW:'무승부',LOSS:'경기 참여'};const amount=result==='WIN'?REWARDS.winLotteries:result==='DRAW'?REWARDS.drawLotteries:REWARDS.lossLotteries;return [lotteryMail(`리그 ${names[result]||'경기'} 보상 · 포인트 복권`,amount)];}
export function championMail(year){return [starMail(`${year} 한국시리즈 우승 스타`,REWARDS.championStars),lotteryMail(`${year} 한국시리즈 우승 포인트 복권`,10)];}
export function normalizeUnclaimedMail(mail){return (mail||[]).flatMap(m=>{
 if(m.title==='창단 지원 스타'&&m.type==='STAR')return [{...m,amount:Math.min(m.amount,REWARDS.starterStars)}];
 if(m.title==='창단 지원금'&&m.type==='POINT')return [{...m,title:'창단 포인트 복권',type:'LOTTERY',amount:REWARDS.starterLotteries}];
 return [m];
});}
export function claimMail(mail,currency,inventory){
 const next={...currency},items=[...inventory];
 for(const m of mail){
  if(m.type==='POINT')next.points+=m.amount;
  if(m.type==='STAR')next.stars+=m.amount;
  if(m.type==='PACK'||m.type==='LOTTERY')for(let i=0;i<m.amount;i++)items.push({id:crypto.randomUUID(),name:m.type==='LOTTERY'?'포인트 복권':m.title,packId:m.type==='LOTTERY'?'point_lottery':m.packId||'normal_all'});
 }
 return {currency:next,inventory:items};
}
export function drawPoints(rng=Math.random){const roll=Math.max(0,Math.min(.999999999,rng()))*100;let total=0;for(const p of POINT_LOTTERY){total+=p.weight;if(roll<total)return p.points;}return POINT_LOTTERY.at(-1).points;}
export function openLotteries(inventory,requested,rng=Math.random){
 const available=inventory.filter(i=>i.packId==='point_lottery');const count=Math.max(0,Math.min(available.length,Math.floor(requested)));
 const ids=new Set(available.slice(0,count).map(i=>i.id)),breakdown={};let points=0;
 for(let i=0;i<count;i++){const value=drawPoints(rng);points+=value;breakdown[value]=(breakdown[value]||0)+1;}
 return {count,points,breakdown,inventory:inventory.filter(i=>!ids.has(i.id))};
}
