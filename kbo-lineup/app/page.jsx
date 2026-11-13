"use client";

    import { useState, useEffect, useMemo } from "react";
import catalog from '../data/catalog.json';
import catalogMeta from '../data/catalog-meta.json';
import ManagerWorkbench, {PlayerDetail} from './manager-workbench';
import PlayerCard from './player-card';
import {REWARDS,POINT_LOTTERY,startingMail,dailyMail,leagueMail,championMail,normalizeUnclaimedMail,claimMail,openLotteries} from './reward-rules.js';
import {overall,eligible} from './manager-engine';
import {generateSingleSkill,generateSkills,sanitizeSkills,changeSkills,playableCard,createStarterSquad,capacity,acquisitionCount,protectedIds,scoutPool,SCOUT_PRICES,TICKETS,ROSTER_MAX,ROSTER_STEP,EXPAND_STARS} from './club-rules.js';

    const TEAMS = ['KIA', '삼성', 'LG', '두산', 'KT', 'SSG', '롯데', '한화', 'NC', '키움', '해태', 'SK', 'OB', '빙그레', '현대'];

    const SKILL_LEVEL_UP = { 'E': 'D', 'D': 'C', 'C': 'B', 'B': 'A', 'A': 'S' };

    const FULL_DATABASE = catalog.map(c => {
      const grade=c.awards.some(a=>a.type==='MVP')?'LEGEND':c.awards.some(a=>a.type==='골든글러브')?'PLATINUM':c.awards.some(a=>a.type==='올스타')?'HERO':overall(c)>=75?'SPECIAL':overall(c)>=65?'RARE':'NORMAL';
      return {...c,grade,ovr:overall(c),upgrade:0,tag:c.awards[0]?.type||null,skills:generateSkills(c.pos,grade)};
    });

    const GRADE_CONFIG = {
        NORMAL: { bg: 'bg-[#94a3b8]', text: 'text-white', border: 'border-[#475569]' },
        RARE: { bg: 'bg-[#3b82f6]', text: 'text-white', border: 'border-[#1e40af]' },
        SPECIAL: { bg: 'bg-[#ef4444]', text: 'text-white', border: 'border-[#991b1b]' },
        HERO: { bg: 'bg-[#22c55e]', text: 'text-white', border: 'border-[#166534]' },
        PLATINUM: { bg: 'bg-[#eab308]', text: 'text-black', border: 'border-[#a16207]' },
        SIGNATURE: { bg: 'bg-[#0f172a]', text: 'text-[#38bdf8]', border: 'border-[#38bdf8]' },
        LEGEND: { bg: 'bg-[#6b21a8]', text: 'text-white', border: 'border-[#d8b4fe]' }
    };

    export default function App() {
      const [teamCode, setTeamCode] = useState('');
      const [favTeam, setFavTeam] = useState('');
      const [isLoggedIn, setIsLoggedIn] = useState(false);
      const [currentMenu, setCurrentMenu] = useState('HOME');
      const [isModalOpen, setIsModalOpen] = useState(false);
      const [modalTab, setModalTab] = useState('MAILBOX');
      const [toast, setToast] = useState('');
      const [lastReward, setLastReward] = useState('');
      const [manager, setManager] = useState({});
      const [detailCard,setDetailCard] = useState(null);
      const [lotteryResult,setLotteryResult] = useState(null);

      const [teamSelectModal, setTeamSelectModal] = useState({ isOpen: false, item: null, count: 1 });
      const [settingsModal, setSettingsModal] = useState(false);
      const [packResultMulti, setPackResultMulti] = useState([]);
      const [visibleCount, setVisibleCount] = useState(30);

      const [currency, setCurrency] = useState({ points: 0, stars: 0 });
      const [mailbox, setMailbox] = useState([]);
      const [inventory, setInventory] = useState([]);
      const [myPlayers, setMyPlayers] = useState([]);
      const [lineup, setLineup] = useState({ CF: null, LF: null, RF: null, SS: null, '2B': null, '3B': null, '1B': null, C: null, DH: null, P: null });

      const [activePos, setActivePos] = useState(null);
      const [trainSelectedCard, setTrainSelectedCard] = useState(null);
      const [skillSelectedCard, setSkillSelectedCard] = useState(null);
      const [selectedSkillIdx, setSelectedSkillIdx] = useState(null);

      const [combineMode, setCombineMode] = useState('NORMAL');
      const [selectedToCombine, setSelectedToCombine] = useState([]);
      const [spCombineMode, setSpCombineMode] = useState('LEGEND');
      const [spSelectedToCombine, setSpSelectedToCombine] = useState([]);
      const rosterLimit=capacity(manager,myPlayers.length);
      const protectedPlayers=protectedIds(lineup,manager);
      const [scoutTeam,setScoutTeam] = useState('');

      const changeMenu = (menu) => { if(manager.pendingSkillChange){showToast('기존 또는 신규 고유능력 세트를 먼저 선택해주세요.');return;} setCurrentMenu(menu); setVisibleCount(30); };
      const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

      const handleLogin = (e) => {
        e.preventDefault();
        if(!teamCode.trim()) return;
        const code = teamCode.trim().toUpperCase();
        // 버전 v18로 강제 업그레이드 (구버전 팩ID 에러 방지)
        let savedData;
        try { savedData = localStorage.getItem(`kbo_v20_${code}`) || (!localStorage.getItem(`kbo_v20_imported_${code}`) ? localStorage.getItem(`kbo_v18_${code}`) : null); }
        catch { showToast('브라우저 저장 공간을 사용할 수 없습니다. 저장 허용 설정을 확인해주세요.'); return; }
        if(savedData) {
            let data;
            try { data = JSON.parse(savedData); if (!data || !Array.isArray(data.myPlayers) || !data.currency) throw new Error(); }
            catch { showToast('저장 데이터를 읽을 수 없습니다. 다른 구단 코드를 사용해주세요.'); return; }
            setLastReward(data.lastReward || '');
            setManager(data.manager || {});
            // Upgrade older synthetic cards only when identity and season match real records.
            const remapped=(data.myPlayers||[]).flatMap(old=>{
              const candidates=FULL_DATABASE.filter(c=>old.playerId?c.id===old.id:(c.name===old.name&&c.year===old.year&&c.team===old.team));
              if(candidates.length!==1)return [];
              const real=candidates[0];return [{...real,...old,...real,uniqueId:old.uniqueId,grade:old.grade||real.grade,ovr:overall({...real,upgrade:old.upgrade||0,growth:old.growth||{}}),upgrade:old.upgrade||0,growth:old.growth||{},training:old.training||0,xp:old.xp||0,condition:old.condition||0,fatigue:old.fatigue||0,skills:sanitizeSkills({...real,grade:old.grade||real.grade,skills:old.skills||real.skills})}];
            });
            const realIds=Object.fromEntries(remapped.map(c=>[c.uniqueId,c]));
            data.myPlayers=remapped;
            data.lineup=Object.fromEntries(Object.entries(data.lineup||{}).map(([pos,c])=>{const real=c&&realIds[c.uniqueId];return [pos,real&&eligible(real,pos)?real:null];}));
            setFavTeam(data.favTeam || 'KIA'); setCurrency(data.currency || { points: 0, stars: 0 });
            setMailbox(normalizeUnclaimedMail(data.mailbox)); setInventory(data.inventory || []);
            if(!(data.manager?.basicRosterGranted || data.manager?.starterGift)) {
              const starter=createStarterSquad(data.favTeam||'KIA',FULL_DATABASE);
              const combined=[...remapped,...starter.players];
              setMyPlayers(combined);
              const complete=['CF','LF','RF','SS','2B','3B','1B','C','DH'].every(pos=>data.lineup?.[pos]);
              setLineup(complete?data.lineup:starter.lineup);
              setManager({...starter.manager,...data.manager,basicRosterGranted:true,starterGift:true,rosterCapacity:capacity(data.manager,combined.length),staff:data.manager?.staff?.starters?.length===5?data.manager.staff:starter.manager.staff});
            } else {
              setMyPlayers(remapped); setLineup(data.lineup || {});
              setManager({...data.manager,basicRosterGranted:true,rosterCapacity:capacity(data.manager,remapped.length)});
            }
            setIsLoggedIn(true); showToast(`[${code}] 구단을 불러왔습니다.`);
        } else {
            if(!favTeam) { showToast('선호 구단을 선택해주세요!'); return; }
            setMailbox(startingMail());
            const starter=createStarterSquad(favTeam,FULL_DATABASE);
            setMyPlayers(starter.players);setLineup(starter.lineup);setManager(starter.manager);
            setIsLoggedIn(true); showToast(`[${code}] 기본 선수 ${starter.players.length}명과 리그 편성 지급! 바로 경기를 시작할 수 있습니다.`);
        }
      };

      const handleSave = () => {
        const data = { favTeam, currency, mailbox, inventory, myPlayers, lineup, lastReward, manager };
        try { localStorage.setItem(`kbo_v20_${teamCode.trim().toUpperCase()}`, JSON.stringify(data)); localStorage.setItem(`kbo_v20_imported_${teamCode.trim().toUpperCase()}`,"1"); }
        catch { showToast('저장 공간이 부족하거나 저장이 차단되었습니다.'); }
      };

      useEffect(() => {
        if (isLoggedIn) handleSave();
      }, [isLoggedIn, favTeam, currency, mailbox, inventory, myPlayers, lineup, lastReward, manager]);

      useEffect(() => {
        const ids=Object.fromEntries(myPlayers.map(c=>[c.uniqueId,c]));
        setLineup(prev=>{
          if(!Object.values(prev).some(c=>c&&ids[c.uniqueId]&&c!==ids[c.uniqueId]))return prev;
          return Object.fromEntries(Object.entries(prev).map(([pos,c])=>[pos,c?(ids[c.uniqueId]||null):null]));
        });
      },[myPlayers]);

      const handleReset = () => {
          if(confirm('정말 데이터를 초기화하시겠습니까?')) {
              localStorage.removeItem(`kbo_v20_${teamCode.trim().toUpperCase()}`);
              window.location.reload();
          }
      };

      const receiveAllMail = () => {
          if(mailbox.length === 0) { showToast('받을 우편이 없습니다.'); return; }
          const result=claimMail(mailbox,currency,inventory);
          setCurrency(result.currency);setInventory(result.inventory);setMailbox([]);showToast('우편 수령 완료! 포인트 복권은 보관함에서 사용하세요.');
      };

      const openPack = (item, targetTeam = null, count = 1) => {
          if(manager.pendingSkillChange)return;
          const requested=Math.min(count,inventory.filter(i=>i.packId===item.packId).length);
          count=acquisitionCount(myPlayers.length,rosterLimit,requested);
          if(count<1){showToast('선수 보유 한도입니다. 선수 정리 또는 보유함 확장 후 개봉해주세요.');return;}
          let pool = [];
          const packFilteredDB = FULL_DATABASE.filter(p => p.grade !== 'SIGNATURE');

          switch(item.packId) {
              case 'award_only': pool = packFilteredDB.filter(p=>p.awards.length>0); break;
              case 'high_friendship': pool = packFilteredDB.filter(p => ['RARE', 'SPECIAL', 'HERO'].includes(p.grade)); break;
              case 'normal_all': pool = packFilteredDB.filter(p => ['NORMAL', 'RARE', 'SPECIAL'].includes(p.grade)); break;
              case 'normal_batter': pool = packFilteredDB.filter(p => ['NORMAL', 'RARE', 'SPECIAL'].includes(p.grade) && p.pos !== 'P'); break;
              case 'normal_pitcher': pool = packFilteredDB.filter(p => ['NORMAL', 'RARE', 'SPECIAL'].includes(p.grade) && p.pos === 'P'); break;
              case 'mileage': pool = packFilteredDB.filter(p => ['HERO', 'PLATINUM', 'LEGEND'].includes(p.grade)); break;
              case 'team': pool = packFilteredDB.filter(p => p.team === targetTeam); break;
              case 'premium_team': pool = packFilteredDB.filter(p => p.team === targetTeam && ['PLATINUM', 'LEGEND'].includes(p.grade)); break;
              default: pool = packFilteredDB;
          }
          if (pool.length === 0) { showToast('조건에 맞는 검증된 선수가 없습니다. 다른 팩이나 구단을 선택해주세요.'); return; }

          let currentInv = [...inventory];
          let openedCards = [];

          for(let i=0; i<count; i++) {
              const invIdx = currentInv.findIndex(inv => inv.packId === item.packId);
              if (invIdx < 0) break;
              currentInv.splice(invIdx, 1);

              const base=pool[Math.floor(Math.random() * pool.length)];
              const newCard=playableCard(base);
              if(!newCard.skills) newCard.skills = generateSkills(newCard.pos === 'P' ? 'P' : 'B', newCard.grade);
              openedCards.push(newCard);
          }

          setInventory(currentInv);
          setMyPlayers(prev => [...openedCards, ...prev]);
          setPackResultMulti(openedCards);
          if(count<requested)showToast(`남은 공간만큼 ${openedCards.length}명 영입했습니다. 미개봉 팩은 보관함에 남습니다.`);

      };

      const buyPack = (packId, title, cost, type = 'point') => {
          if(manager.pendingSkillChange)return;
          if (type === 'point' && currency.points < cost) { showToast('포인트가 부족합니다!'); return; }
          if (type === 'star' && currency.stars < cost) { showToast('스타가 부족합니다!'); return; }
          if(type === 'point') setCurrency(prev => ({...prev, points: prev.points - cost}));
          if(type === 'star') setCurrency(prev => ({...prev, stars: prev.stars - cost}));
          setInventory(prev => [...prev, { id: Date.now(), name: title, packId }]);
          showToast(`${title} 구매 완료!`);
      }

      const expandRoster = () => {
        if(manager.pendingSkillChange)return;
        if(rosterLimit>=ROSTER_MAX){showToast(`최대 ${ROSTER_MAX}명까지 확장할 수 있습니다.`);return;}
        if(currency.stars<EXPAND_STARS){showToast('스타가 부족합니다.');return;}
        const next=Math.min(ROSTER_MAX,rosterLimit+ROSTER_STEP);
        setCurrency(prev=>({...prev,stars:prev.stars-EXPAND_STARS}));
        setManager(prev=>({...prev,rosterCapacity:next}));showToast(`보유 한도를 ${next}명으로 확장했습니다.`);
      };
      const starScout = (grade) => {
        if(manager.pendingSkillChange)return;
        if(acquisitionCount(myPlayers.length,rosterLimit,1)<1){showToast('선수 보유 한도입니다. 먼저 보유함을 정리해주세요.');return;}
        const pool=scoutPool(FULL_DATABASE,grade,scoutTeam);
        if(!pool.length){showToast('선택한 구단에 해당 스카우트 대상이 없습니다.');return;}
        const cost=SCOUT_PRICES[grade];if(currency.stars<cost){showToast(`${cost.toLocaleString()} 스타가 필요합니다.`);return;}
        const card=playableCard(pool[Math.floor(Math.random()*pool.length)],grade);
        setCurrency(prev=>({...prev,stars:prev.stars-cost}));setMyPlayers(prev=>[card,...prev]);setPackResultMulti([card]);
      };
      const releasePlayer = (card) => {
        if(protectedPlayers.has(card.uniqueId)){showToast('편성된 선수나 변경권 선택 중인 선수는 방출할 수 없습니다.');return;}
        if(!confirm(`${card.year} ${card.name} 선수를 방출하고 1,000 P를 받을까요?`))return;
        setMyPlayers(prev=>prev.filter(c=>c.uniqueId!==card.uniqueId));setCurrency(prev=>({...prev,points:prev.points+1000}));
        if(skillSelectedCard?.uniqueId===card.uniqueId)setSkillSelectedCard(null);
        if(trainSelectedCard?.uniqueId===card.uniqueId)setTrainSelectedCard(null);
        setSelectedToCombine(prev=>prev.filter(c=>c.uniqueId!==card.uniqueId));setSpSelectedToCombine(prev=>prev.filter(c=>c.uniqueId!==card.uniqueId));
        showToast('선수 방출 완료 · 1,000 P');
      };
      const applySkills = (card,skills) => {
        const updated={...card,skills};
        setMyPlayers(prev=>prev.map(c=>c.uniqueId===card.uniqueId?updated:c));
        setSkillSelectedCard(updated);
      };
      const handleSkillChange = (type) => {
        if(manager.pendingSkillChange)return;
        const card=myPlayers.find(c=>c.uniqueId===skillSelectedCard?.uniqueId);
        if(!card){showToast('선수를 먼저 선택해주세요.');return;}
        const ticket=TICKETS[type],index=inventory.findIndex(i=>i.packId===ticket);
        if(index<0){showToast('변경권이 부족합니다. 상점에서 구매해주세요.');return;}
        let next;try{next=changeSkills(card,type,selectedSkillIdx);}catch(e){showToast(e.message);return;}
        setInventory(prev=>{const i=prev.findIndex(x=>x.packId===ticket);return i<0?prev:prev.filter((_,idx)=>idx!==i);});
        if(type==='PREMIUM'){
          setManager(prev=>({...prev,pendingSkillChange:{cardId:card.uniqueId,before:sanitizeSkills(card),after:next,rulesVersion:2}}));
        }else{applySkills(card,next);showToast(type==='PROTECT'?'선택한 슬롯을 보호하고 나머지 능력을 교체했습니다.':'기존 능력을 교체하고 새 고유능력을 적용했습니다.');}
      };
      const resolvePremium = (keepOld) => {
        const pending=manager.pendingSkillChange;if(!pending)return;
        const card=myPlayers.find(c=>c.uniqueId===pending.cardId);
        if(card)applySkills(card,sanitizeSkills({...card,skills:keepOld?pending.before:pending.after}));
        setManager(prev=>({...prev,pendingSkillChange:null}));
        showToast(keepOld?'기존 고유능력 세트를 유지했습니다.':'신규 고유능력 세트를 적용했습니다.');
      };

      const getDailyReward = () => {
          const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
          if (lastReward === today) { showToast('오늘의 보상을 이미 받았습니다.'); return; }
          setLastReward(today);
          setMailbox(prev=>[...dailyMail(),...prev]);
          showToast(`일일 보상: 포인트 복권 ${REWARDS.dailyLotteries}장 + ${REWARDS.dailyStars} S를 우편함으로 보냈습니다.`);

      };

      const openInventoryGroup = (grp,count) => {
        if(manager.pendingSkillChange)return;
        if(grp.packId?.includes('skill_ticket')){showToast('스킬변경권은 팀 관리 > 고유능력 변경에서 사용하세요.');return;}
        const amount=Math.min(count,grp.count);
        if(grp.packId==='point_lottery'){
          const result=openLotteries(inventory,amount);
          if(!result.count){showToast('보유한 포인트 복권이 없습니다.');return;}
          setInventory(result.inventory);setCurrency(prev=>({...prev,points:prev.points+result.points}));
          setIsModalOpen(false);setLotteryResult(result);return;
        }
        const item={id:grp.ids[0],packId:grp.packId};
        if(['team','premium_team'].includes(grp.packId))setTeamSelectModal({isOpen:true,item,count:amount});
        else {setIsModalOpen(false);openPack(item,null,amount);}
      };
      const receiveLeagueReward = (result,year) => {
        if(result==='CHAMPION'){
          if(manager.rewardedChampionships?.includes(year))return;
          setManager(prev=>({...prev,rewardedChampionships:[...new Set([...(prev.rewardedChampionships||[]),year])]}));
          setMailbox(prev=>[...championMail(year),...prev]);return;
        }
        setMailbox(prev=>[...leagueMail(result),...prev]);
        showToast('경기 보상 포인트 복권을 우편함으로 보냈습니다.');
      };

      const renderPlayerCard = (p, isPlaced = false, onClick = null) => (
        <div key={p.uniqueId} className="classic-card-tile">
          <PlayerCard card={p} selected={isPlaced} onClick={onClick}/>
          <button className="card-detail-action" onClick={()=>setDetailCard(p)}>선수 상세</button>
        </div>
      );
      const BigResultCard = ({p}) => <PlayerCard card={p} large/>;

      const renderLineupScreen = () => {
          const placePlayer = (player) => {
              if(!activePos) { showToast('먼저 그라운드에서 포지션을 선택하세요.'); return; }
              if(!eligible(player,activePos)) { showToast('확인된 포지션에 맞게 배치해주세요!'); return; }
              if(Object.values(lineup).some(c=>c?.playerId===player.playerId&&c.uniqueId!==player.uniqueId)) { showToast('동일 선수는 한 명만 출전할 수 있습니다!'); return; }
              setLineup(prev => ({...prev, [activePos]: player})); setActivePos(null);
          };

          return (
              <div className="flex flex-col lg:flex-row h-[75vh] gap-6">
                  <div className="flex-1 bg-green-900 border-4 border-gray-700 relative rounded-lg shadow-inner overflow-hidden min-h-[400px]">
                      <div className="absolute top-4 left-4 z-20">
                          <button onClick={()=>{handleSave(); showToast('저장 완료!');}} className="com2us-button px-6 py-2 font-black rounded shadow-lg">라인업 저장</button>
                      </div>
                      <div className="absolute top-4 right-4 z-20 bg-black/80 border border-gray-500 px-4 py-2 font-black text-sm text-yellow-400 rounded">
                          {activePos ? `우측 명단에서 [${activePos}] 선택` : '그라운드 포지션 클릭'}
                      </div>
                      <div className="absolute w-[80%] h-[80%] max-w-[350px] max-h-[350px] border-4 border-white/20 rotate-45 bottom-[-5%] left-1/2 -translate-x-1/2" />
                      {[
                        { role: 'CF', b: '75%', l: '50%' }, { role: 'LF', b: '60%', l: '20%' }, { role: 'RF', b: '60%', l: '80%' },
                        { role: 'SS', b: '45%', l: '35%' }, { role: '2B', b: '45%', l: '65%' }, { role: '3B', b: '30%', l: '20%' },
                        { role: '1B', b: '30%', l: '80%' }, { role: 'P', b: '35%', l: '50%' }, { role: 'C', b: '10%', l: '50%' }, { role: 'DH', b: '10%', l: '20%' }
                      ].map(pos => {
                          const p = lineup[pos.role];
                          return (
                              <div key={pos.role} onClick={() => setActivePos(pos.role)} className="absolute flex flex-col items-center -translate-x-1/2 translate-y-1/2 z-10 cursor-pointer" style={{ bottom: pos.b, left: pos.l }}>
                                  {!p ? (
                                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-sm ${activePos === pos.role ? 'bg-yellow-500 border-white scale-125 z-20 text-black shadow-[0_0_15px_rgba(234,179,8,1)]' : 'bg-black/60 border-gray-400 text-gray-300'}`}>{pos.role}</div>
                                  ) : (
                                      <div className="field-card-wrap">
                                        <PlayerCard card={p} role={pos.role} selected={activePos===pos.role}/>
                                        <button className="field-card-remove" aria-label={`${pos.role} 선수 편성 해제`} onClick={e=>{e.stopPropagation();setLineup(prev=>({...prev,[pos.role]:null}));}}>×</button>
                                      </div>
                                  )}
                              </div>
                          )
                      })}
                  </div>
                  <div className="w-full lg:w-[400px] com2us-panel p-4 flex flex-col h-full rounded-lg">
                      <h3 className="font-black text-xl mb-3 border-b-2 border-gray-600 pb-2 text-blue-300">선수 명단 ({myPlayers.length})</h3>
                      <div className="classic-card-list flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                          {myPlayers.length === 0 ? <p className="text-gray-500 font-bold text-center mt-10">선수가 없습니다.</p> :
                            <>
                                {myPlayers.slice(0, visibleCount).map(p => {
                                    const isPlaced = Object.values(lineup).some(placed => placed?.uniqueId === p.uniqueId);
                                    return renderPlayerCard(p, isPlaced, () => { if(!isPlaced) placePlayer(p); });
                                })}
                                {myPlayers.length > visibleCount && (
                                    <button onClick={() => setVisibleCount(v => v + 30)} className="w-full bg-gray-800 border border-gray-600 text-gray-300 py-3 mt-4 font-black hover:bg-gray-700">▼ 더보기</button>
                                )}
                            </>
                          }
                      </div>
                  </div>
              </div>
          );
      };

      const renderTrainScreen = () => {
          const handleEnhance = () => {
              if(!trainSelectedCard) return;
              const upg = trainSelectedCard.upgrade || 0;
              if(upg >= 10) { showToast('최대 강화(+10)입니다!'); return; }
              const cost = (upg + 1) * 3000;
              if(currency.points < cost) { showToast(`포인트 부족 (${cost} P 필요)`); return; }

              const successRate = Math.max(10, 100 - (upg * 10));
              const isSuccess = Math.random() * 100 < successRate;
              setCurrency(prev => ({...prev, points: prev.points - cost}));

              if(isSuccess) {
                  const updatedCard = { ...trainSelectedCard, upgrade: upg + 1, ovr: trainSelectedCard.ovr + 1 };
                  setMyPlayers(prev => prev.map(p => p.uniqueId === trainSelectedCard.uniqueId ? updatedCard : p));
                  setLineup(prev => { const next = {...prev}; for(let key in next) { if(next[key]?.uniqueId === trainSelectedCard.uniqueId) next[key] = updatedCard; } return next; });
                  setTrainSelectedCard(updatedCard);
                  showToast(`🎉 강화 성공! +${updatedCard.upgrade}`);
              } else {
                  showToast(`💥 강화 실패... 포인트 증발.`);
              }

          };

          return (
              <div className="flex flex-col lg:flex-row h-[75vh] gap-6">
                  <div className="flex-1 com2us-panel p-8 flex flex-col items-center justify-center rounded-lg relative">
                      <h2 className="text-4xl font-black mb-8 border-b-2 border-gray-600 pb-4 text-green-400 w-full text-center">선수 훈련 (강화)</h2>
                      {!trainSelectedCard ? <div className="text-gray-500 font-bold text-xl text-center">우측에서 훈련할 선수를 선택하세요.</div> : (
                          <div className="flex flex-col items-center w-full max-w-md">
                              <div className="w-full mb-8">{renderPlayerCard(trainSelectedCard)}</div>
                              <div className="bg-gray-900 border border-gray-600 w-full p-6 text-center mb-6 rounded shadow-inner">
                                  <div className="text-xl font-bold mb-2 text-gray-300">현재: +{trainSelectedCard.upgrade || 0} ➔ <span className="text-green-400 text-2xl">+{(trainSelectedCard.upgrade || 0) + 1}</span></div>
                                  <div className="text-red-400 font-black mb-2 text-lg">성공 확률: {Math.max(10, 100 - ((trainSelectedCard.upgrade || 0) * 10))}%</div>
                                  <div className="font-bold text-yellow-400">비용: {(trainSelectedCard.upgrade + 1) * 3000} P</div>
                              </div>
                              <button onClick={handleEnhance} className="w-full com2us-button py-4 text-xl font-black rounded">강화 시도</button>
                          </div>
                      )}
                  </div>
                  <div className="w-full lg:w-[400px] com2us-panel p-4 flex flex-col h-full rounded-lg">
                      <h3 className="font-black text-xl mb-3 border-b-2 border-gray-600 pb-2 text-blue-300">보유 명단</h3>
                      <div className="classic-card-list flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                          {myPlayers.slice(0, visibleCount).map(p => renderPlayerCard(p, trainSelectedCard?.uniqueId === p.uniqueId, () => setTrainSelectedCard(p)))}
                          {myPlayers.length > visibleCount && ( <button onClick={() => setVisibleCount(v => v + 30)} className="w-full bg-gray-800 border border-gray-600 text-gray-300 py-3 mt-4 font-black">▼ 더보기</button> )}
                      </div>
                  </div>
              </div>
          );
      };

      const renderSkillScreen = () => {
          const normalTicketCount = inventory.filter(i => i.packId === 'skill_ticket').length;
          const premiumTicketCount = inventory.filter(i => i.packId === 'premium_skill_ticket').length;
          const protectTicketCount = inventory.filter(i => i.packId === 'protect_skill_ticket').length;
          const selectTicketCount = inventory.filter(i => i.packId === 'select_skill_ticket').length;

          const handleSkillUpgrade = (idx, e) => {
              e.stopPropagation();
              if(manager.pendingSkillChange)return;
              if(!skillSelectedCard) return;
              const s = skillSelectedCard.skills[idx];
              if(s.level === 'S') { showToast('이미 최대 레벨(S)입니다.'); return; }
              if(currency.points < 5000) { showToast('강화 비용이 부족합니다 (5,000 P)'); return; }

              setCurrency(prev => ({...prev, points: prev.points - 5000}));
              const newSkills = [...skillSelectedCard.skills];
              newSkills[idx] = { ...s, level: SKILL_LEVEL_UP[s.level] };

              const updatedCard = { ...skillSelectedCard, skills: newSkills };
              setMyPlayers(prev => prev.map(p => p.uniqueId === skillSelectedCard.uniqueId ? updatedCard : p));
              setLineup(prev => { const next = {...prev}; for(let key in next) { if(next[key]?.uniqueId === skillSelectedCard.uniqueId) next[key] = updatedCard; } return next; });

              setSkillSelectedCard(updatedCard);
              showToast(`스킬 [${s.name}] ${s.level} ➔ ${SKILL_LEVEL_UP[s.level]} 등급 강화 완료!`);

          };

          return (
              <div className="flex flex-col lg:flex-row h-[75vh] gap-6">
                  <div className="flex-1 com2us-panel p-8 flex flex-col items-center overflow-y-auto custom-scrollbar rounded-lg relative">
                      <h2 className="text-4xl font-black mb-8 border-b-2 border-gray-600 pb-4 text-purple-400 w-full text-center">고유능력 변경 및 강화</h2>
                      {!skillSelectedCard ? <div className="text-gray-500 font-bold text-xl text-center mt-10">우측에서 선수를 선택하세요.</div> : (
                          <div className="flex flex-col items-center w-full max-w-md">
                              <div className="w-full mb-6">{renderPlayerCard(skillSelectedCard)}</div>

                              <div className="w-full bg-gray-900 border border-gray-600 p-4 mb-6 rounded shadow-inner">
                                  <h3 className="font-black text-xl mb-4 text-center text-gray-300">보유 스킬 <span className="text-xs text-red-400 ml-2">(변경할 슬롯을 클릭하세요)</span></h3>
                                  <div className="space-y-3">
                                      {skillSelectedCard.skills && skillSelectedCard.skills.length > 0 ? (
                                          skillSelectedCard.skills.map((s, idx) => (
                                              <div key={idx} role="button" tabIndex={0} aria-label={`고유능력 ${idx+1}번 슬롯`} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedSkillIdx(idx);}}} onClick={() => setSelectedSkillIdx(idx)}
                                                   className={`cursor-pointer border-2 p-3 font-black flex justify-between items-center rounded transition-all
                                                   ${selectedSkillIdx === idx ? 'ring-4 ring-yellow-400 scale-105 shadow-[0_0_10px_#facc15]' : 'hover:border-gray-400'}
                                                   ${GRADE_CONFIG[s.grade].bg} ${GRADE_CONFIG[s.grade].border} ${GRADE_CONFIG[s.grade].text}`}>
                                                  <div className="flex items-center gap-2 flex-1">
                                                      <span className={`bg-black/70 px-2 py-0.5 text-sm rounded border border-gray-400 skill-level-${s.level}`}>{s.level}</span>
                                                      <span className="text-lg drop-shadow-md">{s.name}</span>
                                                  </div>
                                                  <div className="flex items-center gap-3">
                                                      <span className="text-xs bg-black/40 px-2 py-1 uppercase rounded border border-current">{s.grade}</span>
                                                      {s.level !== 'S' ? (
                                                          <button onClick={(e) => handleSkillUpgrade(idx, e)} className="bg-yellow-500 hover:bg-yellow-400 text-black px-2 py-1 text-xs font-black rounded border border-yellow-200">강화(5천)</button>
                                                      ) : (
                                                          <span className="text-xs text-yellow-300 font-bold px-1">MAX</span>
                                                      )}
                                                  </div>
                                              </div>
                                          ))
                                      ) : (
                                          <div className="text-center text-gray-500 font-bold">보유 스킬이 없습니다.</div>
                                      )}
                                  </div>
                              </div>

                              <p className="muted">일반·선택·보호: 플래티넘 이상 선수만 최대 플래티넘. 고급: 1번 슬롯 플래티넘 확정, 레전드 카드에서만 10% 레전드 / 90% 플래티넘. 2·3번은 최대 플래티넘. 다른 변경권은 플래티넘 미만 선수에서 최대 히어로. 고급 변경권은 1장 사용 후 기존/신규 전체 세트 중 선택합니다.</p><div className="grid grid-cols-2 gap-3 w-full">
                                  <button onClick={() => handleSkillChange('NORMAL_TICKET')} className="bg-gray-700 border border-gray-500 py-3 font-black text-white hover:bg-gray-600 rounded">
                                      일반 스변 (전체 변경)<br/><span className="text-xs text-yellow-400 font-normal">보유: {normalTicketCount}장</span>
                                  </button>
                                  <button disabled={!['PLATINUM','SIGNATURE','LEGEND'].includes(skillSelectedCard.grade)} title="플래티넘 이상 선수 전용 · 1번 슬롯 플래티넘 이상 확정" onClick={() => handleSkillChange('PREMIUM')} className="com2us-button py-3 font-black rounded">
                                      고급 스변 (1번 슬롯 플래티넘 이상 확정)<br/><span className="text-xs text-yellow-300 font-normal">보유: {premiumTicketCount}장</span>
                                  </button>
                                  <button onClick={() => handleSkillChange('PROTECT')} className="bg-green-700 border border-green-500 py-3 font-black text-white hover:bg-green-600 rounded">
                                      보변권 (선택 슬롯 보호)<br/><span className="text-xs text-yellow-300 font-normal">보유: {protectTicketCount}장</span>
                                  </button>
                                  <button onClick={() => handleSkillChange('SELECT')} className="bg-purple-700 border border-purple-500 py-3 font-black text-white hover:bg-purple-600 rounded">
                                      선변권 (선택 슬롯 변경)<br/><span className="text-xs text-yellow-300 font-normal">보유: {selectTicketCount}장</span>
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
                  <div className="w-full lg:w-[400px] com2us-panel p-4 flex flex-col h-full rounded-lg">
                      <h3 className="font-black text-xl mb-3 border-b-2 border-gray-600 pb-2 text-blue-300">보유 명단</h3>
                      <div className="classic-card-list flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                          {myPlayers.slice(0, visibleCount).map(p => renderPlayerCard(p, skillSelectedCard?.uniqueId === p.uniqueId, () => {
                              setSkillSelectedCard(p);
                              setSelectedSkillIdx(null); // 카드 바뀔 때만 슬롯 초기화
                          }))}
                          {myPlayers.length > visibleCount && ( <button onClick={() => setVisibleCount(v => v + 30)} className="w-full bg-gray-800 border border-gray-600 text-gray-300 py-3 mt-4 font-black">▼ 더보기</button> )}
                      </div>
                  </div>
              </div>
          );
      };

      const renderSpecialCombineScreen = (mode) => {
          const isSignature = mode === 'SIGNATURE';
          const title = isSignature ? '시그니처 스카우트' : '레전드 스카우트';
          const reqCount = isSignature ? 3 : 5;
          const cost = isSignature ? 100000 : 200000;

          const currentList = isSignature ? spSelectedToCombine : selectedToCombine;
          const setList = isSignature ? setSpSelectedToCombine : setSelectedToCombine;

          const toggleCombineSelect = (p) => {
              if(currentList.some(sc => sc.uniqueId === p.uniqueId)) {
                  setList(prev => prev.filter(sc => sc.uniqueId !== p.uniqueId));
              } else {
                  if(currentList.length >= reqCount) { showToast(`최대 ${reqCount}명만 등록할 수 있습니다.`); return; }
                  if(protectedPlayers.has(p.uniqueId)){showToast('편성된 선수는 재료로 사용할 수 없습니다.');return;}
                  if(isSignature && !['PLATINUM', 'SIGNATURE', 'LEGEND'].includes(p.grade)) { showToast('플래티넘 이상 등급만 재료로 가능합니다.'); return; }
                  setList(prev => [...prev, p]);
              }
          };

          const handleSpecialCombine = () => {
              if(manager.pendingSkillChange)return;
              if(currentList.length!==reqCount || new Set(currentList.map(c=>c.uniqueId)).size!==reqCount){showToast(`재료 ${reqCount}명이 필요합니다.`);return;}
              const material=currentList.map(c=>myPlayers.find(p=>p.uniqueId===c.uniqueId));
              if(material.some(c=>!c||protectedPlayers.has(c.uniqueId))){showToast('편성 중이거나 없는 선수는 재료로 사용할 수 없습니다.');setList([]);return;}
              if(isSignature&&material.some(c=>!['PLATINUM','SIGNATURE','LEGEND'].includes(c.grade))){showToast('플래티넘 이상 재료가 필요합니다.');return;}
              if(myPlayers.length-reqCount+1>rosterLimit){showToast('영입 후 인원이 선수 보유 한도를 초과합니다.');return;}
              if(currency.points<cost){showToast(`비용 부족 (${cost.toLocaleString()} P)`);return;}
              const grade=isSignature?'SIGNATURE':'LEGEND';const pool=scoutPool(FULL_DATABASE,grade,scoutTeam);
              if(!pool.length){showToast('선택한 구단에 스카우트 대상이 없습니다.');return;}
              const card=playableCard(pool[Math.floor(Math.random()*pool.length)],grade);
              const ids=new Set(material.map(c=>c.uniqueId));
              setCurrency(prev=>({...prev,points:prev.points-cost}));
              setMyPlayers(prev=>[card,...prev.filter(c=>!ids.has(c.uniqueId))]);setList([]);setPackResultMulti([card]);
          };
          const availablePlayers=myPlayers.filter(p=>!protectedPlayers.has(p.uniqueId)&&(!isSignature||['PLATINUM','SIGNATURE','LEGEND'].includes(p.grade)));


          return (
              <div className="flex flex-col lg:flex-row h-[75vh] gap-6">
                  <div className="flex-1 com2us-panel p-6 flex flex-col rounded-lg border-blue-500 shadow-2xl relative">
                      <div className="bg-blue-900 border border-blue-400 text-white text-center py-2 font-black text-2xl mb-6 rounded">{title}</div><div className="scout-toolbar"><select aria-label="스카우트 구단 선택" value={scoutTeam} onChange={e=>setScoutTeam(e.target.value)}><option value="">전체 구단</option>{TEAMS.map(t=><option key={t}>{t}</option>)}</select><button onClick={()=>starScout(mode)} className="com2us-button">스타 스카우트 · {SCOUT_PRICES[mode].toLocaleString()} S · {mode} 확정</button><span>재료 미소모 / 보유 {myPlayers.length} / {rosterLimit}명</span></div>

                      <div className="flex flex-1 gap-6">
                          <div className="w-1/3 flex flex-col items-center justify-center bg-gray-900 border border-gray-600 rounded p-4">
                              <div className="text-gray-400 font-bold mb-4">{isSignature ? '획득 예정: 시그니처' : '획득 예정: 레전드'}</div>
                              <div className={`w-32 h-48 border-2 border-dashed ${isSignature ? 'border-[#38bdf8]' : 'border-[#d8b4fe]'} flex flex-col items-center justify-center bg-black/50 text-center p-2`}>
                                  <span className="text-4xl">?</span><br/>
                                  <span className={`font-black ${isSignature ? 'text-[#38bdf8]' : 'text-[#d8b4fe]'}`}>{isSignature ? 'SIGNATURE' : 'LEGEND'}</span>
                              </div>
                              <div className="mt-6 font-black text-yellow-400 text-lg">필요 비용: {cost.toLocaleString()} P</div>
                          </div>

                          <div className="w-2/3 flex flex-col">
                              <div className="text-blue-300 font-black mb-2 text-lg">재료 선수 등록 ({currentList.length} / {reqCount})</div>
                              <div className="grid grid-cols-3 gap-3 flex-1 content-start">
                                  {Array.from({length: reqCount}).map((_, i) => {
                                      const p = currentList[i];
                                      return p ? (
                                          <div key={i} className={`h-32 border-2 flex flex-col items-center justify-center text-sm font-black ${GRADE_CONFIG[p.grade].bg} ${GRADE_CONFIG[p.grade].border} ${GRADE_CONFIG[p.grade].text}`}>
                                              {p.ovr}<br/>{p.name}<br/><span className="text-[10px] bg-black/50 px-1 mt-1 font-normal rounded">{p.grade}</span>
                                          </div>
                                      ) : (
                                          <div key={i} className="h-32 border-2 border-dashed border-gray-500 bg-gray-800 flex items-center justify-center font-bold text-gray-500 text-sm text-center">
                                              {isSignature ? '플래티넘 이상' : '재료 선수'}<br/>등록
                                          </div>
                                      )
                                  })}
                              </div>
                              <button onClick={handleSpecialCombine} className="com2us-button py-4 text-2xl font-black rounded mt-4">재료 스카우트 진행</button>
                          </div>
                      </div>
                  </div>

                  <div className="w-full lg:w-[400px] com2us-panel p-4 flex flex-col h-full rounded-lg">
                      <h3 className="font-black text-xl mb-3 border-b-2 border-gray-600 pb-2 text-blue-300">재료 보관함</h3>
                      <div className="classic-card-list flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                          {availablePlayers.slice(0, visibleCount).map(p => renderPlayerCard(p, currentList.some(sc=>sc.uniqueId===p.uniqueId), () => toggleCombineSelect(p)))}
                      </div>
                  </div>
              </div>
          );
      };

      const groupedInventory = useMemo(() => {
          const map = {};
          inventory.forEach(item => {
              if(!map[item.packId]) map[item.packId] = { ...item, count: 0, ids: [] };
              map[item.packId].count++; map[item.packId].ids.push(item.id);
          });
          return Object.values(map);
      }, [inventory]);

      if (!isLoggedIn) return (
        <main className="club-entry">
          <section className="entry-panel">
            <div className="retro-label">EST. 1982 · BASEBALL CLUB MANAGER</div>
            <div className="entry-ball" aria-hidden="true">⚾</div>
            <h1>KBO <span>올스타 매니저</span></h1>
            <p className="entry-sub">그때의 야구, 나만의 드림팀.</p>
            <form onSubmit={handleLogin}>
              <label htmlFor="club-code">구단 코드</label>
              <input id="club-code" value={teamCode} onChange={e => setTeamCode(e.target.value)} maxLength={24} required placeholder="나만의 구단 코드 입력" autoComplete="off" />
              <label htmlFor="favorite-team">선호 구단 <small>신규 창단 시 선택</small></label>
              <select id="favorite-team" value={favTeam} onChange={e => setFavTeam(e.target.value)}>
                <option value="">구단을 선택하세요</option>
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button className="com2us-button entry-submit" type="submit">구단 입장 ▶</button>
            </form>
            <p className="entry-note">처음이라면 구단을 창단하고, 같은 코드로 이어서 플레이하세요.<br/>진행 기록은 현재 기기·브라우저에 자동 저장됩니다. 실선수판에서는 기존 무작위 카드를 제외하며 구버전 원본 저장은 보존합니다.</p>
            {toast && <p role="status" className="entry-message">{toast}</p>}
          </section>
        </main>
      );

      return (
          <div className="min-h-screen bg-slate-900 flex flex-col">
              {toast && ( <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-white px-6 py-3 rounded border border-gray-500 font-black shadow-2xl animate-bounce">{toast}</div> )}

              <header className="com2us-panel p-4 flex justify-between items-center sticky top-0 z-40 rounded-b-lg mb-4 mx-2 mt-2">
                  <div className="flex items-center gap-4">
                      <button onClick={() => changeMenu('HOME')} className="font-black text-2xl text-blue-400 hover:text-blue-300 drop-shadow-md">◀ 홈</button>
                      <div className="flex flex-wrap gap-3 ml-4">
                          <span className="bg-black/60 border border-gray-500 px-4 py-1.5 font-black rounded-full text-gray-200"><span className="text-blue-400 mr-1 text-lg">P</span> {currency.points.toLocaleString()}</span>
                          <span className="bg-black/60 border border-gray-500 px-4 py-1.5 font-black rounded-full text-gray-200"><span className="text-yellow-400 mr-1 text-lg">★</span> {currency.stars.toLocaleString()}</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <button onClick={() => { setIsModalOpen(true); setModalTab('MAILBOX'); }} className="relative bg-gray-800 border border-gray-500 px-4 py-2 font-black hover:bg-gray-700 rounded text-gray-300">
                          우편함 {mailbox.length > 0 && <span className="absolute -top-3 -right-3 bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-sm border-2 border-white animate-pulse">{mailbox.length}</span>}
                      </button>
                      <button onClick={() => { setIsModalOpen(true); setModalTab('INVENTORY'); }} className="bg-gray-800 border border-gray-500 px-4 py-2 font-black hover:bg-gray-700 rounded text-gray-300">보관함</button>
                      <button onClick={() => setSettingsModal(true)} className="bg-gray-800 border border-gray-500 px-3 py-2 font-black hover:bg-gray-700 rounded">⚙️</button>
                  </div>
              </header>

              <main className="flex-1 max-w-7xl w-full mx-auto p-4">
                <div className="club-strip"><span>⚾ {favTeam} · {teamCode.toUpperCase()} 구단</span><span>보유 선수 {myPlayers.length} / {rosterLimit}명 · 자동 저장</span></div>
                {currentMenu !== 'HOME' && <button className="back-link" onClick={() => changeMenu('TEAM_MANAGE')}>팀 관리 메뉴</button>}
                  {currentMenu === 'HOME' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[60vh]">
                          <button onClick={() => changeMenu('TEAM_MANAGE')} className="com2us-panel flex flex-col items-center justify-center shadow-2xl hover:-translate-y-2 transition-transform p-10 rounded-xl">
                              <h2 className="text-4xl font-black text-blue-300 drop-shadow-md">팀 관리</h2><p className="mt-4 font-bold text-gray-400">라인업, 스카우트, 강화, 스킬</p>
                          </button>
                          <button onClick={() => changeMenu('SHOP')} className="com2us-panel flex flex-col items-center justify-center shadow-2xl hover:-translate-y-2 transition-transform p-10 rounded-xl">
                              <h2 className="text-4xl font-black text-red-400 drop-shadow-md">상점</h2><p className="mt-4 font-bold text-gray-400">선수팩 · 영입 · 훈련 아이템</p>
                          </button>
                          <button onClick={() => changeMenu('LEAGUE')} className="com2us-panel flex flex-col items-center justify-center shadow-2xl hover:-translate-y-2 transition-transform p-10 rounded-xl">
                              <h2 className="text-4xl font-black text-green-400 drop-shadow-md">리그 모드</h2><p className="mt-4 font-bold text-gray-400">144경기 · 개인 기록 · 포스트시즌</p>
                          </button>

                          <button onClick={()=>changeMenu('ARCHIVE')} className="com2us-panel p-8 rounded-xl font-black text-2xl text-yellow-200 md:col-span-3">선수 도감 · 타순 · 덱 효과 · 시즌 리그 <span className="text-sm">실제 선수 {catalogMeta.uniquePlayers.toLocaleString()}명 / 사진 수록</span></button>
                          <button onClick={getDailyReward} className="md:col-span-3 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black border-2 border-yellow-200 flex flex-col items-center justify-center shadow-xl hover:-translate-y-1 p-6 rounded-xl font-black text-2xl">
                              🎁 일일 출석 보상 · 복권 3장 + 30 S (우편함)
                          </button>
                      </div>
                  )}

                  {currentMenu === 'TEAM_MANAGE' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full min-h-[60vh]">
                          <button onClick={() => changeMenu('LINEUP')} className="com2us-panel aspect-video flex flex-col items-center justify-center shadow-lg hover:-translate-y-1 rounded-lg"><h2 className="text-3xl font-black text-white">라인업 관리</h2></button>
                          <button onClick={()=>changeMenu('ROSTER')} className="com2us-panel aspect-video flex flex-col items-center justify-center rounded-lg"><h2 className="text-3xl font-black text-yellow-200">선수 보유함 · 확장/방출</h2><p>{myPlayers.length} / {rosterLimit}명</p></button>
                          <button onClick={() => changeMenu('TRAIN')} className="com2us-panel aspect-video flex flex-col items-center justify-center shadow-lg hover:-translate-y-1 rounded-lg"><h2 className="text-3xl font-black text-green-400">선수 훈련</h2></button>
                          <button onClick={() => changeMenu('SKILL')} className="com2us-panel aspect-video flex flex-col items-center justify-center shadow-lg hover:-translate-y-1 rounded-lg"><h2 className="text-3xl font-black text-purple-400">고유능력 변경</h2></button>

                          <button onClick={() => changeMenu('LEGEND_SCOUT')} className="com2us-panel aspect-video flex flex-col items-center justify-center shadow-lg hover:-translate-y-1 rounded-lg border-purple-500"><h2 className="text-3xl font-black text-purple-300">레전드 스카우트</h2><p className="text-sm mt-2 text-gray-400">재료 5장 또는 5,000 S</p></button>
                          <button onClick={() => changeMenu('SIGNATURE_AWAKEN')} className="com2us-panel aspect-video flex flex-col items-center justify-center shadow-lg hover:-translate-y-1 rounded-lg border-blue-400"><h2 className="text-3xl font-black text-blue-300">시그니처 스카우트</h2><p className="text-sm mt-2 text-gray-400">재료 3장 또는 3,000 S</p></button>
                      </div>
                  )}

                  {currentMenu === 'LINEUP' && renderLineupScreen()}
                  {currentMenu === 'ROSTER' && <section className="com2us-panel p-6"><h2 className="text-2xl font-black">선수 보유함 · {myPlayers.length} / {rosterLimit}명</h2><div className="scout-toolbar"><button className="com2us-button" disabled={rosterLimit>=ROSTER_MAX} onClick={expandRoster}>보유함 +20칸 · 500 S (최대 300명)</button><p>편성된 선수는 방출·스카우트 재료로 사용할 수 없습니다. 편성 해제 후 정리하세요.</p></div><div className="space-y-3">{myPlayers.slice(0,visibleCount).map(c=><div key={c.uniqueId} className="roster-release-row">{renderPlayerCard(c,false,()=>setDetailCard(c))}<button disabled={protectedPlayers.has(c.uniqueId)} onClick={()=>releasePlayer(c)}>방출 · 1,000 P</button></div>)}</div>{myPlayers.length>visibleCount&&<button className="com2us-button p-3 mt-4" onClick={()=>setVisibleCount(v=>v+30)}>더보기</button>}</section>}
                  {currentMenu === 'TRAIN' && renderTrainScreen()}
                  {currentMenu === 'SKILL' && renderSkillScreen()}
                  {currentMenu === 'LEGEND_SCOUT' && renderSpecialCombineScreen('LEGEND')}
                  {currentMenu === 'SIGNATURE_AWAKEN' && renderSpecialCombineScreen('SIGNATURE')}

                  {currentMenu === 'SHOP' && (
                      <div className="com2us-panel p-8 text-center rounded-xl">
                          <div className="flex justify-between items-center mb-8 border-b-2 border-gray-600 pb-4">
                              <h2 className="text-4xl font-black text-red-400">상점</h2>
                              <p className="text-sm text-yellow-200">스타는 출석·우승 보상으로 획득합니다.</p>
                          </div>

                          <section className="star-shop"><h3>★ 스타 상점 · 보유 {currency.stars.toLocaleString()} S</h3><div className="star-shop-grid"><button onClick={()=>buyPack('premium_team','스타 구단선택팩',1000,'star')}>구단선택팩 · 1,000 S</button><button onClick={()=>buyPack('award_only','스타 수상자 전용팩',800,'star')}>수상자 전용팩 · 800 S</button><button onClick={()=>buyPack('premium_skill_ticket','고급 스킬변경권',500,'star')}>고급 스킬변경권 · 500 S</button><button onClick={()=>buyPack('select_skill_ticket','스킬 선택변경권',700,'star')}>스킬 선택변경권 · 700 S</button><button onClick={()=>buyPack('protect_skill_ticket','스킬 보호변경권',700,'star')}>스킬 보호변경권 · 700 S</button><button onClick={expandRoster} disabled={rosterLimit>=ROSTER_MAX}>선수 보유함 +20칸 · 500 S</button><button onClick={()=>changeMenu('SIGNATURE_AWAKEN')}>시그니처 스카우트 · 3,000 S ↗</button><button onClick={()=>changeMenu('LEGEND_SCOUT')}>레전드 스카우트 · 5,000 S ↗</button></div></section>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <button onClick={()=>buyPack('award_only','수상자 전용팩',25000,'point')} className="com2us-button p-4 font-black text-lg rounded">수상자 전용팩<br/><small>검증된 골글 · MVP · 올스타 · 25,000 P</small></button>
                              <button onClick={()=>buyPack('normal_all', '일반 선수팩', 3000, 'point')} className="bg-gray-800 border border-gray-600 p-4 font-black text-lg hover:bg-gray-700 rounded shadow-lg text-white">일반 선수팩<br/><span className="text-sm text-blue-300">3,000 P</span></button>
                              <button onClick={()=>buyPack('normal_batter', '일반 타자팩', 5000, 'point')} className="bg-gray-800 border border-gray-600 p-4 font-black text-lg hover:bg-gray-700 rounded shadow-lg text-white">일반 타자팩<br/><span className="text-sm text-blue-300">5,000 P</span></button>
                              <button onClick={()=>buyPack('normal_pitcher', '일반 투수팩', 5000, 'point')} className="bg-gray-800 border border-gray-600 p-4 font-black text-lg hover:bg-gray-700 rounded shadow-lg text-white">일반 투수팩<br/><span className="text-sm text-blue-300">5,000 P</span></button>
                              <button onClick={()=>buyPack('premium_team', '구단선택팩', 10000, 'point')} className="bg-blue-900 border border-blue-500 p-4 font-black text-lg hover:bg-blue-800 rounded shadow-lg text-white">구단선택팩<br/><span className="text-sm text-yellow-400">10,000 P</span></button>

                              <button onClick={()=>buyPack('skill_ticket', '스킬변경권', 30000, 'point')} className="bg-gray-700 border border-gray-500 p-4 font-black text-lg hover:bg-gray-600 rounded shadow-lg text-white">스킬변경권<br/><span className="text-sm text-blue-300">30,000 P</span></button>
                              <button onClick={()=>buyPack('premium_skill_ticket', '고스변권', 50000, 'point')} className="com2us-button p-4 font-black text-lg rounded shadow-lg text-white">고스변권<br/><span className="text-sm text-yellow-300">50,000 P</span></button>
                              <button onClick={()=>buyPack('protect_skill_ticket', '보변권', 60000, 'point')} className="bg-green-800 border border-green-500 p-4 font-black text-lg hover:bg-green-700 rounded shadow-lg text-white">보변권<br/><span className="text-sm text-blue-300">60,000 P</span></button>
                              <button onClick={()=>buyPack('select_skill_ticket', '선변권', 70000, 'point')} className="bg-purple-800 border border-purple-500 p-4 font-black text-lg hover:bg-purple-700 rounded shadow-lg text-white">선변권<br/><span className="text-sm text-blue-300">70,000 P</span></button>
                          </div>
                      </div>
                  )}

                  {['LEAGUE','ARCHIVE'].includes(currentMenu) && <ManagerWorkbench initialTab={currentMenu==='LEAGUE'?'시즌 리그':'도감'} catalog={FULL_DATABASE} meta={catalogMeta} players={myPlayers} setPlayers={setMyPlayers} lineup={lineup} setLineup={setLineup} manager={manager} setManager={setManager} team={favTeam} showToast={showToast} onReward={receiveLeagueReward}/>}

              </main>

              {manager.pendingSkillChange && <div className="manager-overlay skill-choice-overlay"><section className="manager-dialog" role="dialog" aria-modal="true" aria-label="고급 변경권 세트 선택"><h2>고급 스킬변경권 · 세트 선택</h2><p>변경권 1장을 사용했습니다. {manager.pendingSkillChange.rulesVersion===2?'신규 세트의 1번 슬롯은 플래티넘 이상을 보장합니다. 레전드 카드는 1번 슬롯에서만 10% 확률로 레전드 능력이 나옵니다.':'이전에 뽑은 대기 세트는 그대로 유지됩니다. 다음 사용부터 1번 슬롯 보장 규칙을 적용합니다.'} 둘 중 한 세트를 선택하면 다른 세트는 사라집니다. 새로고침해도 이 선택은 유지됩니다.</p><div className="skill-set-choices">{[['기존 세트',manager.pendingSkillChange.before,true],['신규 세트',manager.pendingSkillChange.after,false]].map(([label,skills,keep])=><section key={label}><h3>{label}</h3>{skills.map((skill,i)=><div key={i} className={`skill-choice-row ${GRADE_CONFIG[skill.grade].bg} ${GRADE_CONFIG[skill.grade].text}`}><b>{skill.name} {skill.level}</b><small>{skill.grade}</small></div>)}<button className="com2us-button" onClick={()=>resolvePremium(keep)}>{keep?'기존 세트 유지':'신규 세트 적용'}</button></section>)}</div></section></div>}
              {lotteryResult && <div className="manager-overlay"><section className="manager-dialog lottery-result" role="dialog" aria-modal="true" aria-label="포인트 복권 결과"><small>POINT LOTTERY</small><h2>포인트 복권 {lotteryResult.count}장 사용</h2><strong className="lottery-total">+{lotteryResult.points.toLocaleString()} P</strong><div className="record-chips">{Object.entries(lotteryResult.breakdown).map(([points,count])=><span key={points}>{Number(points).toLocaleString()} P × {count}장</span>)}</div><details><summary>당첨 금액·확률 보기</summary>{POINT_LOTTERY.map(p=><p key={p.points}>{p.points.toLocaleString()} P · {p.weight}%</p>)}</details><button className="primary" onClick={()=>setLotteryResult(null)}>복권 결과 확인</button></section></div>}
              {detailCard && <PlayerDetail card={detailCard} onClose={()=>setDetailCard(null)}/>}
              {packResultMulti.length > 0 && (
                  <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-4 backdrop-blur-sm overflow-y-auto">
                      <div className="flex flex-col items-center animate-pop-in py-10">
                          <h2 className="text-5xl font-black text-yellow-400 mb-10 drop-shadow-[0_0_20px_rgba(234,179,8,1)]">선수 영입 결과!</h2>
                          <div className="mb-10 flex flex-wrap justify-center gap-6 max-w-5xl">
                              {packResultMulti.map((p, i) => <BigResultCard key={i} p={p} />)}
                          </div>
                          <button onClick={() => setPackResultMulti([])} className="com2us-button border-2 border-white px-16 py-4 font-black text-3xl rounded shadow-2xl">확인</button>
                      </div>
                  </div>
              )}

              {teamSelectModal.isOpen && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
                      <div className="com2us-panel p-6 w-full max-w-lg text-center rounded-xl">
                          <h3 className="text-2xl font-black mb-6 text-white">원하는 구단을 선택하세요</h3>
                          <div className="grid grid-cols-3 gap-4 mb-6">
                              {TEAMS.map(t => ( <button key={t} onClick={() => { openPack(teamSelectModal.item, t, teamSelectModal.count); setTeamSelectModal({isOpen: false, item: null, count: 1}); setIsModalOpen(false); }} className="bg-gray-800 border border-gray-500 py-3 font-bold hover:bg-blue-600 rounded text-gray-200">{t}</button> ))}
                          </div>
                          <button onClick={()=>setTeamSelectModal({isOpen:false, item:null, count: 1})} className="bg-gray-600 px-6 py-2 border border-gray-400 font-bold rounded text-white">취소</button>
                      </div>
                  </div>
              )}

              {settingsModal && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                      <div className="com2us-panel p-8 w-full max-w-sm text-center rounded-xl">
                          <h2 className="text-2xl font-black mb-6 text-white">설정</h2>
                          <button onClick={handleReset} className="w-full bg-red-600 text-white border border-red-400 py-3 font-black text-lg mb-4 hover:bg-red-500 rounded">게임 초기화 (데이터 삭제)</button>
                          <button onClick={()=>setSettingsModal(false)} className="w-full bg-gray-600 border border-gray-400 py-3 font-black text-lg text-white rounded hover:bg-gray-500">닫기</button>
                      </div>
                  </div>
              )}

              {isModalOpen && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 lg:p-10">
                      <div className="com2us-panel w-full max-w-5xl p-6 relative flex flex-col h-[90vh] rounded-xl border-2 border-blue-500">
                          <button onClick={() => setIsModalOpen(false)} className="absolute -top-5 -right-5 bg-red-600 text-white w-12 h-12 border-2 border-white font-black text-xl rounded-full shadow-lg hover:bg-red-500">X</button>
                          <div className="grid grid-cols-2 gap-6 mb-6">
                              <button onClick={() => setModalTab('MAILBOX')} className={`sketch-tab text-xl rounded ${modalTab === 'MAILBOX' ? 'sketch-tab-active' : 'sketch-tab-inactive'}`}>우편함</button>
                              <button onClick={() => setModalTab('INVENTORY')} className={`sketch-tab text-xl rounded ${modalTab === 'INVENTORY' ? 'sketch-tab-active' : 'sketch-tab-inactive'}`}>보관함</button>
                          </div>
                          <div className="bg-gray-900 border border-gray-600 p-6 flex-1 flex flex-col relative overflow-hidden rounded">
                              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-24">
                                  {modalTab === 'MAILBOX' && (
                                      mailbox.map(mail => (
                                          <div key={mail.id} className="bg-gray-800 border border-gray-600 mb-3 p-4 rounded">
                                              <div className="font-black text-xl text-white">{mail.title}</div>
                                              <div className="font-bold text-blue-400">{['PACK','LOTTERY'].includes(mail.type) ? `${mail.amount}장` : `${mail.amount.toLocaleString()} ${mail.type==='STAR'?'S':'P'}`}</div>
                                          </div>
                                      ))
                                  )}
                                  {modalTab === 'INVENTORY' && (
                                      groupedInventory.length === 0 ? (
                                          <div className="flex-1 flex items-center justify-center text-gray-500 font-bold text-2xl h-full mt-20">
                                              보관함이 비어있습니다.<br/>상점이나 우편함에서 아이템을 획득하세요!
                                          </div>
                                      ) : (
                                          groupedInventory.map(grp => (
                                              <div key={grp.packId} className="inventory-item-row bg-gray-800 border border-gray-600 mb-3 flex justify-between items-center px-4 py-3 rounded">
                                                  <div>
                                                      <div className="font-black text-xl text-blue-300">{grp.name}</div>
                                                      <div className="font-bold text-gray-400 mt-1">수량: {grp.count}개</div>
                                                  </div>
                                                  <div className="inventory-open-actions">
                                                    <button onClick={()=>openInventoryGroup(grp,1)}>1개 개봉</button>
                                                    <button disabled={grp.count<10} title={grp.count<10?'10개 이상 보유 시 사용할 수 있습니다.':''} onClick={()=>openInventoryGroup(grp,10)}>10개 개봉</button>
                                                    <button className="com2us-button" onClick={()=>openInventoryGroup(grp,grp.count)}>모두 개봉</button>
                                                  </div>
                                              </div>
                                          ))
                                      )
                                  )}
                              </div>
                              {modalTab === 'MAILBOX' && (
                                  <div className="absolute bottom-6 right-6">
                                      <button onClick={receiveAllMail} className="com2us-button px-8 py-4 font-black text-xl rounded shadow-lg">일괄 수령</button>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
    }
