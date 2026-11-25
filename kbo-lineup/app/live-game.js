import {playGameFlow,schedule,buildTeam} from './manager-engine.js';
export const PLAY_MODES={ATTACK:'공격만 플레이',DEFENSE:'수비만 플레이',FULL:'전체 플레이',AUTO:'자동 진행'};
export function seededRandom(seed){let n=seed>>>0;return ()=>{n+=0x6D2B79F5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function createLiveGame(season,user,catalog,mode='FULL',seed=Math.floor(Math.random()*4294967296)){
 if(!PLAY_MODES[mode])throw Error('플레이 방식을 선택하세요.');const playoff=season.day>=144,post=season.postseason;const pair=playoff?(!post?.champion&&post?.match?.includes(user.name)?post.match:null):schedule()[season.day]?.find(p=>p.includes(user.name));if(!pair)throw Error('직접 플레이할 우리 팀 경기가 없습니다. 다른 팀 포스트시즌은 자동으로 진행하세요.');
 const [h,a]=pair;return {version:1,year:season.year,day:season.day,postseason:playoff,postGames:post?.games?.length||0,club:user.name,mode,seed,home:h===user.name?user:buildTeam(h,catalog,season.day),away:a===user.name?user:buildTeam(a,catalog,season.day),actions:[]};
}
export function resumeLiveGame(game){const flow=playGameFlow(game.home,game.away,{rng:seededRandom(game.seed),bonusHome:game.home.bonus||0,bonusAway:game.away.bonus||0});let step=flow.next();for(const action of game.actions){if(step.done)throw Error('이미 끝난 경기입니다.');step=flow.next(action);}return {flow,step};}
export const controlsBatting=(game,view)=>view.offense===game.club;
export function needsManual(game,view){const attack=controlsBatting(game,view);return game.mode==='FULL'||game.mode==='ATTACK'&&attack||game.mode==='DEFENSE'&&!attack;}
export function advanceLiveGame(game,action=null,{finish=false}={}){const {flow,step}=resumeLiveGame(game);if(step.done)return {game,result:step.value};const actions=[...game.actions,action];let next=flow.next(action);let guard=0;while(!next.done&&(finish||!needsManual(game,next.value))){if(++guard>2500)throw Error('경기 진행을 확인해주세요.');actions.push(null);next=flow.next();}return {game:{...game,actions},view:next.done?null:next.value,result:next.done?next.value:null};}

export function livePitcherOptions(game){const {step}=resumeLiveGame(game);if(step.done||step.value.defense!==game.club)return [];const own=game.home.name===game.club?game.home:game.away,used=new Set(step.value.usedPitchers||[]);return own.relief.filter(Boolean).map((card,index)=>({card,index,used:used.has(card.uniqueId)}));}
export function substituteLivePitcher(game,pitcherId){const {step}=resumeLiveGame(game);if(step.done||step.value.defense!==game.club)throw Error('우리 팀 수비 중에 투수를 교체하세요.');if(!livePitcherOptions(game).some(o=>o.card.uniqueId===pitcherId&&!o.used))throw Error('이미 등판했거나 불펜에 없는 투수입니다.');return advanceLiveGame(game,{kind:'SUB_PITCHER',club:game.club,pitcherId});}
