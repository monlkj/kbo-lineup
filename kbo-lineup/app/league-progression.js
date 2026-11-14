import {newSeason,BAT_POS,deckBonus,lineupError,simulateDay,advancePlayers} from './manager-engine.js';
import {leagueMail,championMail,lotteryMail,starMail} from './reward-rules.js';
export const LEAGUE_SHOP=[{id:'premium_skill_ticket',name:'고급 스킬변경권',cost:15},{id:'limit_break_ticket',name:'한계돌파권',cost:35},{id:'signature_contract',name:'시그니처 각성 계약서',cost:80},{id:'signature_wild_material',name:'시그니처 만능 재료',cost:40}];
export const LEAGUE_GOALS=[
 {id:'games20',name:'첫 20경기 완주',key:'games',goal:20,tokens:10,items:[['premium_team','구단선택팩',1]],lotteries:10},
 {id:'wins10',name:'시즌 10승',key:'wins',goal:10,tokens:10,items:[['premium_skill_ticket','고급 스킬변경권',2]],lotteries:5},
 {id:'hr10',name:'팀 홈런 10개',key:'homeRuns',goal:10,tokens:5,items:[['award_only','수상자 전용팩',1]],lotteries:5},
 {id:'so100',name:'팀 탈삼진 100개',key:'strikeouts',goal:100,tokens:10,items:[['premium_skill_ticket','고급 스킬변경권',2]]},
 {id:'games60',name:'60경기 완주',key:'games',goal:60,tokens:20,items:[['limit_break_ticket','한계돌파권',1],['premium_skill_ticket','고급 스킬변경권',3]]},
 {id:'wins30',name:'시즌 30승',key:'wins',goal:30,tokens:15,items:[['select_skill_ticket','스킬 선택변경권',1],['protect_skill_ticket','스킬 보호변경권',1]]},
 {id:'wins60',name:'시즌 60승',key:'wins',goal:60,tokens:25,stars:100,items:[['premium_team','구단선택팩',3],['premium_skill_ticket','고급 스킬변경권',5]]},
 {id:'games144',name:'정규시즌 144경기 완주',key:'games',goal:144,tokens:50,stars:200,items:[['signature_contract','시그니처 각성 계약서',1],['premium_skill_ticket','고급 스킬변경권',10]]},
 {id:'wins90',name:'시즌 90승 도전',key:'wins',goal:90,tokens:40,stars:150,items:[['limit_break_ticket','한계돌파권',2],['signature_wild_material','시그니처 만능 재료',1]]}
];
const packMail=(title,packId,amount)=>({id:crypto.randomUUID(),title,type:'PACK',packId,amount});
export function leagueClub(team){return ({해태:'KIA',SK:'SSG',OB:'두산',빙그레:'한화',현대:'키움'}[team]||team);}
export function campaignStats(season,team,ids=[]){
 const own=new Set(ids),record=season.standings?.[team]||{};const old=season.campaign||{};
 return {homeRuns:Object.entries(season.batters||{}).filter(([id])=>own.has(id)).reduce((n,[,v])=>n+(v.hr||0),0),strikeouts:Object.entries(season.pitchers||{}).filter(([id])=>own.has(id)).reduce((n,[,v])=>n+(v.so||0),0),streak:0,bestStreak:0,...old,games:season.day||0,wins:record.w||0};
}
export function leagueGoalProgress(season,team,ids=[]){const stats=campaignStats(season,team,ids);return LEAGUE_GOALS.map(g=>({...g,value:stats[g.key]||0,claimed:(season.goalClaims||[]).includes(g.id)}));}
export function recordLeagueGame(state,next,result,team){
 const previous=state.manager.season||newSeason(next.year),year=next.year,day=next.day,key=`${year}-${day}`;
 if(state.manager.lastLeagueReward===key)throw Error('이미 보상받은 경기입니다.');
 if(!previous||previous.year!==year||day!==previous.day+1||day>144)throw Error('정상적인 다음 경기만 보상받을 수 있습니다.');
 const home=result.home===team;if(!home&&result.away!==team)throw Error('우리 팀의 경기 결과가 아닙니다.');
 const own=home?result.homeScore:result.awayScore,opp=home?result.awayScore:result.homeScore,outcome=own>opp?'WIN':own===opp?'DRAW':'LOSS';
 const base=campaignStats(previous,team,state.players.map(c=>c.uniqueId)),ids=new Set(state.players.map(c=>c.uniqueId));
 const streak=outcome==='WIN'?base.streak+1:0,tokens=outcome==='WIN'?3:outcome==='DRAW'?2:1;
 const season={...next,campaign:{...base,games:day,wins:next.standings[team].w,streak,bestStreak:Math.max(base.bestStreak,streak),homeRuns:base.homeRuns+Object.entries(result.batters).filter(([id])=>ids.has(id)).reduce((n,[,s])=>n+(s.hr||0),0),strikeouts:base.strikeouts+Object.entries(result.pitchers).filter(([id])=>ids.has(id)).reduce((n,[,s])=>n+(s.so||0),0)}};
 const mail=leagueMail(outcome);if(streak>0&&streak%3===0)mail.push(packMail(`${year} ${streak}연승 보너스 · 고급 스변`,'premium_skill_ticket',1));
 return {...state,manager:{...state.manager,season,lastLeagueReward:key,leagueTokens:(state.manager.leagueTokens||0)+tokens},mailbox:[...mail,...state.mailbox],summary:{outcome,tokens,streak}};
}
export function finishLeagueSeason(state,season,team){
 if(!season.complete||season.day!==144||!season.postseason?.champion)throw Error('한국시리즈까지 완료해야 시즌 보상을 받을 수 있습니다.');
 if((state.manager.completedLeagueSeasons||[]).includes(season.year))return {...state,manager:{...state.manager,season},summary:{already:true}};
 const mail=[packMail(`${season.year} 시즌 완주 · 레전드 영입 증서`,'legend_recruit_permit',1),packMail(`${season.year} 시즌 완주 · 구단선택팩`,'premium_team',3),lotteryMail(`${season.year} 시즌 완주 포인트 복권`,20)];
 const champion=season.postseason.champion===team;
 if(champion&&!state.manager.rewardedChampionships?.includes(season.year))mail.push(...championMail(season.year));
 if(champion)mail.push(packMail(`${season.year} 우승 · 고급 스변`,'premium_skill_ticket',10),packMail(`${season.year} 우승 · 한계돌파권`,'limit_break_ticket',2));
 return {...state,manager:{...state.manager,season,completedLeagueSeasons:[...(state.manager.completedLeagueSeasons||[]),season.year],rewardedChampionships:champion?[...new Set([...(state.manager.rewardedChampionships||[]),season.year])]:state.manager.rewardedChampionships||[],leagueTokens:(state.manager.leagueTokens||0)+(champion?100:50)},mailbox:[...mail,...state.mailbox],summary:{champion}};
}
export function claimLeagueGoal(state,id,team){
 const season=state.manager.season;if(!season)throw Error('리그를 시작해주세요.');
 const goal=leagueGoalProgress(season,team,state.players.map(c=>c.uniqueId)).find(g=>g.id===id);if(!goal||goal.value<goal.goal)throw Error('아직 달성하지 못한 목표입니다.');if(goal.claimed)throw Error('이미 받은 목표 보상입니다.');
 const mail=(goal.items||[]).map(([p,n,c])=>packMail(`${season.year} ${goal.name} · ${n}`,p,c));if(goal.lotteries)mail.push(lotteryMail(`${season.year} ${goal.name} 포인트 복권`,goal.lotteries));if(goal.stars)mail.push(starMail(`${season.year} ${goal.name} 스타`,goal.stars));
 return {...state,manager:{...state.manager,leagueTokens:(state.manager.leagueTokens||0)+goal.tokens,season:{...season,goalClaims:[...(season.goalClaims||[]),id]}},mailbox:[...mail,...state.mailbox]};
}
export function buyLeagueSupply(state,id){const item=LEAGUE_SHOP.find(i=>i.id===id);if(!item)throw Error('리그 상점 상품을 확인해주세요.');if((state.manager.leagueTokens||0)<item.cost)throw Error('리그 코인이 부족합니다. 경기와 시즌 목표로 모을 수 있습니다.');return {...state,manager:{...state.manager,leagueTokens:state.manager.leagueTokens-item.cost},inventory:[...state.inventory,{id:crypto.randomUUID(),packId:item.id,name:item.name}]};}
export function packCardGrade(base){return ['SIGNATURE','LEGEND'].includes(base.grade)?'PLATINUM':base.grade;}

export function advanceLeagueSeason(state,team){const season=state.manager.season;if(!season?.complete)throw Error('현재 시즌을 먼저 완료해주세요.');let next=finishLeagueSeason(state,season,team);for(const goal of leagueGoalProgress(next.manager.season,team,state.players.map(p=>p.uniqueId)))if(!goal.claimed&&goal.value>=goal.goal)next=claimLeagueGoal(next,goal.id,team);return {...next,manager:{...next.manager,pastSeasons:[...(next.manager.pastSeasons||[]),next.manager.season],season:newSeason(season.year+1)}};}

export function simulateLeagueSeries(state,team,catalog,count=5){
 if(!Number.isInteger(count)||count<1||count>5)throw Error('빠른 진행은 최대 5경기입니다.');
 let next={...state,manager:{...state.manager,season:state.manager.season||newSeason()}},games=[],tokens=0;
 const remaining=144-next.manager.season.day;if(remaining<=0)throw Error('정규시즌이 종료되었습니다.');
 for(let i=0;i<Math.min(count,remaining);i++){
  const byId=Object.fromEntries(next.players.map(c=>[c.uniqueId,c])),order=next.manager.order||BAT_POS,staff=next.manager.staff||{starters:[],relief:[]};
  const lineup=Object.fromEntries(Object.entries(next.lineup).map(([p,c])=>[p,c?byId[c.uniqueId]:null])),starters=staff.starters.map(id=>byId[id]),relief=staff.relief.map(id=>byId[id]);
  const error=lineupError(lineup,order,{starters,relief});if(error)throw Error(error);
  const active=[...BAT_POS.map(p=>lineup[p]),...starters,...relief],user={name:team,batters:order.map(p=>lineup[p]),starter:starters[next.manager.season.day%5],relief,bonus:deckBonus(active).total,tactic:next.manager.tactic||'BALANCED'};
  const out=simulateDay(next.manager.season,user,catalog);next=recordLeagueGame(next,out.season,out.result,team);tokens+=next.summary.tokens;games.push(out.result);
  next={...next,players:advancePlayers(next.players,active.filter(c=>out.result.batters[c.uniqueId]||out.result.pitchers[c.uniqueId]),user.starter.uniqueId)};
 }
 return {...next,summary:{...next.summary,tokens,count:games.length,lastGame:{...games.at(-1),series:games.map(g=>({home:g.home,away:g.away,homeScore:g.homeScore,awayScore:g.awayScore}))}}};
}
