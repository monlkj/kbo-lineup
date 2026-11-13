import {BAT_POS,eligible,overall,makeCard} from './manager-engine.js';

export const SKILL_DB = {
        B: {
            LEGEND: ['핵심타자', '위압감', '베테랑', '대포군단', '타격의 달인', '슈퍼스타', '캡틴'],
            PLATINUM: ['스프레이 히터', '예지력', '리드오프', '파워히터', '배팅머신', '슬러거', '클러치 히터', '게스히터', '에이스킬러', '레전드', '호타준족', '카리스마', '주루도사'],
            HERO: ['승부근성', '역전의힘', '하체단련', '훈련중독', '정밀타격', '풀스윙히터', '테이블세터', '블로킹', '거포본능', '참을성', '어퍼스윙', '빅스윙'],
            NORMAL: ['수비대장', '대타전문가', '다운스윙', '밀어치기', '당겨치기', '득점기계', '매의눈', '초구공략', '정면승부', '좌완킬러', '우완킬러', '직구킬러', '집중력']
        },
        P: {
            LEGEND: ['베테랑', '팔색조', '슈퍼스타', '투혼', '라이징 패스트볼', '닥터K', '캡틴'],
            PLATINUM: ['끝판왕', '언터처블', '수호신', '에이스', '이닝이터', '벌떼야구', '자이언트 킬러', '각성', '버닝', '투지', '결자해지', '결정구', '뒷심'],
            HERO: ['전력투구', '국보투수', '셋업맨', '승승장구', '피칭머신', '컨트롤아티스트', '파워피처', '해결사', '저격수', '야전지휘', '마당쇠', '승부사'],
            NORMAL: ['광속투구', '마구연마', '강심장', '강철체력', '노련함', '돌부처', '얼음장', '좌타킬러', '우타킬러', '위기극복', '평정심', '견제왕', '완급조절']
        }
    };
export const ROSTER_BASE=100,ROSTER_MAX=300,ROSTER_STEP=20,EXPAND_STARS=500;
export const SCOUT_PRICES={SIGNATURE:3000,LEGEND:5000};
export const TICKETS={NORMAL_TICKET:'skill_ticket',PREMIUM:'premium_skill_ticket',SELECT:'select_skill_ticket',PROTECT:'protect_skill_ticket'};
const SKILL_RANK={NORMAL:0,HERO:1,PLATINUM:2,LEGEND:3};
export function skillCount(grade){return ['HERO','PLATINUM','SIGNATURE','LEGEND'].includes(grade)?3:grade==='SPECIAL'?2:1;}
export function skillCeiling(grade,type='PREMIUM'){
 if(['PREMIUM','INITIAL'].includes(type)&&grade==='LEGEND')return 'LEGEND';
 return ['PLATINUM','SIGNATURE','LEGEND'].includes(grade)?'PLATINUM':'HERO';
}
export function generateSingleSkill(pos,grade,rng=Math.random,excluded=[]){
 const pool=SKILL_DB[pos==='P'?'P':'B'][grade].filter(n=>!excluded.includes(n));
 const choices=pool.length?pool:SKILL_DB[pos==='P'?'P':'B'][grade];
 const name=choices[Math.min(choices.length-1,Math.floor(rng()*choices.length))];
 const roll=rng();return {name,grade,level:roll>.9?'B':roll>.6?'C':roll>.3?'D':'E'};
}
function rollGrade(max,rng){const r=rng();const rank=r>.95?3:r>.8?2:r>.5?1:0;return Object.keys(SKILL_RANK).find(k=>SKILL_RANK[k]===Math.min(rank,SKILL_RANK[max]));}
export function generateSkills(pos,grade,type='INITIAL',rng=Math.random){const list=[];for(let i=0;i<skillCount(grade);i++)list.push(generateSingleSkill(pos,rollGrade(skillCeiling(grade,type),rng),rng,list.map(s=>s.name)));return list;}
export function sanitizeSkills(card){
 const max=SKILL_RANK[skillCeiling(card.grade)];const old=Array.isArray(card.skills)?card.skills:[];
 return Array.from({length:skillCount(card.grade)},(_,i)=>{
  const s=old[i];const pool=s&&SKILL_DB[card.pos==='P'?'P':'B'][s.grade];
  return s&&SKILL_RANK[s.grade]<=max&&pool?.includes(s.name)&&['S','A','B','C','D','E'].includes(s.level)?{...s}:generateSingleSkill(card.pos,'NORMAL');
 });
}
export function changeSkills(card,type,slot=null,rng=Math.random){
 if(!TICKETS[type])throw new Error('지원하지 않는 변경권입니다.');
 const before=sanitizeSkills(card);
 if(type==='PREMIUM'){
  if(!['PLATINUM','SIGNATURE','LEGEND'].includes(card.grade))throw new Error('고급 변경권은 플래티넘 이상 선수에게만 사용할 수 있습니다.');
  // These are this game's explicit rates, not a claim about another game's official rates.
  const firstGrade=card.grade==='LEGEND'&&rng()<.10?'LEGEND':'PLATINUM';
  const next=[generateSingleSkill(card.pos,firstGrade,rng)];
  for(let i=1;i<skillCount(card.grade);i++)next.push(generateSingleSkill(card.pos,rollGrade('PLATINUM',rng),rng,next.map(s=>s.name)));
  return next;
 }
 if(type==='NORMAL_TICKET')return generateSkills(card.pos,card.grade,type,rng);
 if(!Number.isInteger(slot)||slot<0||slot>=before.length)throw new Error(type==='PROTECT'?'보호할 슬롯을 선택해주세요.':'변경할 슬롯을 선택해주세요.');
 if(type==='PROTECT'&&before.length<2)throw new Error('보호할 슬롯 외에 변경할 고유능력이 없습니다.');
 return before.map((s,i)=>((type==='SELECT'&&i===slot)||(type==='PROTECT'&&i!==slot))?generateSingleSkill(card.pos,rollGrade(skillCeiling(card.grade,type),rng),rng):s);
}
export function playableCard(base,grade=base.grade){return {...makeCard({...base,grade}),grade,skills:generateSkills(base.pos,grade)};}
export function capacity(manager,count=0){const n=Number(manager?.rosterCapacity);return Math.max(ROSTER_BASE,count,Number.isFinite(n)?Math.min(ROSTER_MAX,Math.floor(n)):ROSTER_BASE);}
export function acquisitionCount(count,limit,requested){return Math.max(0,Math.min(Math.max(0,Math.floor(requested)),limit-count));}
export function protectedIds(lineup,manager){return new Set([...Object.values(lineup||{}).filter(Boolean).map(c=>c.uniqueId),...(manager?.staff?.starters||[]),...(manager?.staff?.relief||[]),manager?.pendingSkillChange?.cardId].filter(Boolean));}
export function scoutPool(database,grade,team=''){
 if(!['SIGNATURE','LEGEND'].includes(grade))throw new Error('스카우트 등급을 확인해주세요.');
 return database.filter(c=>(!team||c.team===team)&&(grade==='LEGEND'?c.grade==='LEGEND':['PLATINUM','SIGNATURE','LEGEND'].includes(c.grade)));
}
export function createStarterSquad(team,database){
 const family=({'해태':'KIA','SK':'SSG','OB':'두산','빙그레':'한화','현대':'키움'})[team]||team;
 const pool=[...database].sort((a,b)=>((a.team===team?0:a.team===family?1:2)-(b.team===team?0:b.team===family?1:2))||overall(b)-overall(a));
 const used=new Set(),slots={};
 const positions=BAT_POS.filter(p=>p!=='DH').sort((a,b)=>pool.filter(c=>c.team===team&&c.pos!=='P'&&eligible(c,a)).length-pool.filter(c=>c.team===team&&c.pos!=='P'&&eligible(c,b)).length);
 for(const pos of [...positions,'DH']){const c=pool.find(c=>c.pos!=='P'&&!used.has(c.playerId)&&eligible(c,pos));if(!c)throw new Error('기본 선수단을 구성할 선수 자료가 부족합니다.');slots[pos]=c;used.add(c.playerId);}
 const pitchers=[];for(const c of pool)if(c.pos==='P'&&!used.has(c.playerId)){pitchers.push(c);used.add(c.playerId);if(pitchers.length===8)break;}
 if(pitchers.length!==8)throw new Error('기본 투수 자료가 부족합니다.');
 const sources=[...BAT_POS.map(p=>slots[p]),...pitchers];
 for(const c of pool)if(!used.has(c.playerId)&&sources.length<26){sources.push(c);used.add(c.playerId);}
 const players=sources.map(c=>playableCard(c,'NORMAL'));
 const lineup=Object.fromEntries(BAT_POS.map((p,i)=>[p,players[i]]));lineup.P=players[9];
 return {players,lineup,manager:{starterGift:true,basicRosterGranted:true,rosterCapacity:ROSTER_BASE,order:BAT_POS,staff:{starters:players.slice(9,14).map(c=>c.uniqueId),relief:players.slice(14,17).map(c=>c.uniqueId)}}};
}
