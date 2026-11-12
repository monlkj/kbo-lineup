"use client";

    import { useState, useEffect, useMemo } from "react";
import catalog from '../data/catalog.json';
import catalogMeta from '../data/catalog-meta.json';
import ManagerWorkbench, {Portrait,PlayerDetail} from './manager-workbench';
import {overall,eligible} from './manager-engine';

    const TEAMS = ['KIA', '삼성', 'LG', '두산', 'KT', 'SSG', '롯데', '한화', 'NC', '키움', '해태', 'SK', 'OB', '빙그레', '현대'];

    const SKILL_LEVEL_UP = { 'E': 'D', 'D': 'C', 'C': 'B', 'B': 'A', 'A': 'S' };

    const SKILL_DB = {
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

    const generateSingleSkill = (pos, gradeType) => {
        const pType = pos === 'P' ? 'P' : 'B';
        const pool = SKILL_DB[pType][gradeType];
        const sName = pool[Math.floor(Math.random() * pool.length)];
        const rLvl = Math.random();
        const sLevel = rLvl > 0.9 ? 'B' : rLvl > 0.6 ? 'C' : rLvl > 0.3 ? 'D' : 'E';
        return { name: sName, grade: gradeType, level: sLevel };
    };

    const generateSkills = (pos, playerGrade) => {
        let count = 1;
        if (['SPECIAL'].includes(playerGrade)) count = 2;
        else if (['HERO', 'PLATINUM', 'SIGNATURE', 'LEGEND'].includes(playerGrade)) count = 3;

        const skills = [];
        for(let i=0; i<count; i++) {
            const r = Math.random();
            let sGrade = 'NORMAL';
            if(r > 0.96) sGrade = 'LEGEND';
            else if(r > 0.85) sGrade = 'PLATINUM';
            else if(r > 0.60) sGrade = 'HERO';

            skills.push(generateSingleSkill(pos, sGrade));
        }
        return skills;
    };

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

      const changeMenu = (menu) => { setCurrentMenu(menu); setVisibleCount(30); };
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
              const real=candidates[0];return [{...real,...old,...real,uniqueId:old.uniqueId,grade:old.grade||real.grade,ovr:overall({...real,upgrade:old.upgrade||0,growth:old.growth||{}}),upgrade:old.upgrade||0,growth:old.growth||{},training:old.training||0,xp:old.xp||0,condition:old.condition||0,fatigue:old.fatigue||0,skills:old.skills||real.skills}];
            });
            const realIds=Object.fromEntries(remapped.map(c=>[c.uniqueId,c]));
            data.myPlayers=remapped;
            data.lineup=Object.fromEntries(Object.entries(data.lineup||{}).map(([pos,c])=>{const real=c&&realIds[c.uniqueId];return [pos,real&&eligible(real,pos)?real:null];}));
            setFavTeam(data.favTeam || 'KIA'); setCurrency(data.currency || { points: 0, stars: 0 });
            setMailbox(data.mailbox || []); setInventory(data.inventory || []);
            setMyPlayers(data.myPlayers || []); setLineup(data.lineup || { CF: null, LF: null, RF: null, SS: null, '2B': null, '3B': null, '1B': null, C: null, DH: null, P: null });
            setIsLoggedIn(true); showToast(`[${code}] 구단을 불러왔습니다.`);
        } else {
            if(!favTeam) { showToast('선호 구단을 선택해주세요!'); return; }
            setMailbox([
                { id: Date.now()+1, title: '창단 선물: 구단선택팩', type: 'PACK', packId: 'premium_team', amount: 3 },
                { id: Date.now()+2, title: '창단 지원금', type: 'POINT', amount: 500000 },
                { id: Date.now()+3, title: '창단 지원 스타', type: 'STAR', amount: 15000 }
            ]);
            setIsLoggedIn(true); showToast(`[${code}] 신규 창단 완료! 우편함을 확인하세요.`);
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
          let p = currency.points, s = currency.stars, newInv = [...inventory];
          mailbox.forEach(mail => {
              if(mail.type === 'POINT') p += mail.amount;
              else if(mail.type === 'STAR') s += mail.amount;
              else if(mail.type === 'PACK') {
                  for(let i=0; i<mail.amount; i++) newInv.push({ id: Date.now() + Math.random(), name: mail.title, packId: mail.packId || 'normal_all' });
              }
          });
          setCurrency({ points: p, stars: s }); setInventory(newInv); setMailbox([]); showToast('우편 수령 완료!');
      };

      const openPack = (item, targetTeam = null, count = 1) => {
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

              const newCard = { ...pool[Math.floor(Math.random() * pool.length)], uniqueId: crypto.randomUUID(), upgrade: 0, xp:0,training:0,growth:{},condition:0,fatigue:0 };
              if(!newCard.skills) newCard.skills = generateSkills(newCard.pos === 'P' ? 'P' : 'B', newCard.grade);
              openedCards.push(newCard);
          }

          setInventory(currentInv);
          setMyPlayers(prev => [...openedCards, ...prev]);
          setPackResultMulti(openedCards);

      };

      const buyPack = (packId, title, cost, type = 'point') => {
          if (type === 'point' && currency.points < cost) { showToast('포인트가 부족합니다!'); return; }
          if (type === 'star' && currency.stars < cost) { showToast('스타가 부족합니다!'); return; }
          if(type === 'point') setCurrency(prev => ({...prev, points: prev.points - cost}));
          if(type === 'star') setCurrency(prev => ({...prev, stars: prev.stars - cost}));
          setInventory(prev => [...prev, { id: Date.now(), name: title, packId }]);
          showToast(`${title} 구매 완료!`);
      }

      const getDailyReward = () => {
          const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
          if (lastReward === today) { showToast('오늘의 보상을 이미 받았습니다.'); return; }
          setLastReward(today);
          setCurrency(prev => ({...prev, stars: prev.stars + 1000, points: prev.points + 20000}));
          showToast('🎁 일일 보상 획득! (1000 S / 20000 P)');

      };

      const renderPlayerCard = (p, isPlaced = false, onClick = null) => (
          <div key={p.uniqueId} onClick={onClick} className={`flex items-center p-2 cursor-pointer transition-all border-2 ${isPlaced ? 'opacity-40 border-gray-600 bg-gray-800 grayscale' : `${GRADE_CONFIG[p.grade].border} hover:-translate-y-1 shadow-[2px_2px_10px_rgba(0,0,0,0.5)]`} ${GRADE_CONFIG[p.grade].bg}`}>
              <Portrait card={p}/><div className="w-14 h-14 bg-black/50 rounded flex items-center justify-center font-black text-2xl mr-3 border border-white/20 text-white shadow-inner">{p.ovr}</div>
              <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[10px] bg-black text-white px-1.5 py-0.5 font-bold rounded-sm border border-gray-600">{p.year} {p.team}</span>
                      <span className="text-[10px] bg-black text-white px-1.5 py-0.5 font-bold rounded-sm border border-gray-600">{p.pos}</span>
                      {p.tag && <span className="text-[10px] bg-yellow-600 text-white border border-yellow-300 px-1.5 py-0.5 font-black rounded-sm">{p.tag}</span>}
                  </div>
                  <div className={`font-black text-lg drop-shadow-md flex items-center ${GRADE_CONFIG[p.grade].text}`}>
                      {p.name} {p.upgrade > 0 && <span className="text-yellow-400 ml-1 drop-shadow-[1px_1px_2px_black]">+{p.upgrade}</span>}
                      <span className="text-[9px] opacity-90 font-bold bg-black/40 px-1 py-0.5 rounded ml-2 uppercase border border-current">{p.grade}</span>
                  </div>
              </div>
              <button className="detail-button" onClick={e=>{e.stopPropagation();setDetailCard(p);}}>상세</button>
              {isPlaced && <div className="text-[10px] bg-black text-red-500 px-2 py-1 font-bold rounded border border-red-500">배치됨</div>}
          </div>
      );

      const BigResultCard = ({ p }) => (
          <div className={`relative w-64 h-80 flex flex-col justify-between p-3 border-4 shadow-[0_0_20px_rgba(0,0,0,0.8)] ${GRADE_CONFIG[p.grade].bg} ${GRADE_CONFIG[p.grade].border} ${GRADE_CONFIG[p.grade].text}`}>
              <div className="flex justify-between items-start">
                  <span className="bg-black/60 text-white text-md px-2 py-1 font-black rounded">{p.pos}</span>
                  <span className="text-xs opacity-90 font-black bg-black/40 px-2 py-1 rounded uppercase border-2 border-current">{p.grade}</span>
              </div>
              <Portrait card={p}/><div className="text-center font-black text-7xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] my-2 tracking-tighter">{p.ovr}</div>
              <div className="bg-black/80 text-white text-center p-2 rounded border border-gray-500 shadow-inner">
                  <div className="text-xs opacity-80 mb-1 font-bold">{p.year} {p.team}</div>
                  <div className="font-black text-3xl drop-shadow-md">{p.name}</div>
              </div>
          </div>
      );

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
                                      <div className={`relative w-20 h-28 flex flex-col justify-between p-1 border-2 shadow-lg hover:scale-110 ${GRADE_CONFIG[p.grade].bg} ${GRADE_CONFIG[p.grade].border} ${GRADE_CONFIG[p.grade].text} ${activePos===pos.role?'scale-110 z-20 ring-4 ring-yellow-400':''}`}>
                                          <div className="flex justify-between items-start">
                                              <span className="bg-black/60 text-white text-[9px] px-1 font-bold rounded">{p.pos}</span>
                                              <button onClick={(e) => { e.stopPropagation(); setLineup(prev => ({...prev, [pos.role]: null})); }} className="text-gray-300 hover:text-red-500 bg-black/80 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black border border-gray-500">X</button>
                                          </div>
                                          <div className="text-center font-black text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">{p.ovr}</div>
                                          <div className="bg-black/80 text-white text-[10px] text-center p-0.5 rounded-sm"><div className="font-black truncate">{p.name}</div></div>
                                      </div>
                                  )}
                              </div>
                          )
                      })}
                  </div>
                  <div className="w-full lg:w-[400px] com2us-panel p-4 flex flex-col h-full rounded-lg">
                      <h3 className="font-black text-xl mb-3 border-b-2 border-gray-600 pb-2 text-blue-300">선수 명단 ({myPlayers.length})</h3>
                      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 pb-10">
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
                      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 pb-10">
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

          const handleSkillChange = (type) => {
              if(!skillSelectedCard) return;
              if(type !== 'NORMAL_TICKET' && selectedSkillIdx === null) {
                  showToast('먼저 변경할 고유능력 슬롯을 클릭해서 선택하세요!'); return;
              }

              const reqTicket = type === 'NORMAL_TICKET' ? 'skill_ticket' :
                                type === 'PREMIUM' ? 'premium_skill_ticket' :
                                type === 'PROTECT' ? 'protect_skill_ticket' : 'select_skill_ticket';

              const ticketCount = inventory.filter(i => i.packId === reqTicket).length;
              if (ticketCount < 1) { showToast('변경권이 부족합니다! 상점에서 구매하세요.'); return; }

              const ticketIndex = inventory.findIndex(i => i.packId === reqTicket);
              const newInv = [...inventory];
              newInv.splice(ticketIndex, 1);
              setInventory(newInv);

              let newSkills = [...skillSelectedCard.skills];

              if (type === 'NORMAL_TICKET') {
                  newSkills = newSkills.map(s => {
                      const r = Math.random();
                      const sGrade = r > 0.85 ? 'PLATINUM' : r > 0.50 ? 'HERO' : 'NORMAL';
                      return generateSingleSkill(skillSelectedCard.pos, sGrade);
                  });
              } else {
                  const r = Math.random();
                  let sGrade = 'NORMAL';
                  if (type === 'PREMIUM') sGrade = r > 0.8 ? 'LEGEND' : r > 0.4 ? 'PLATINUM' : 'HERO';
                  else if (type === 'SELECT' || type === 'PROTECT') sGrade = r > 0.9 ? 'LEGEND' : r > 0.7 ? 'PLATINUM' : r > 0.3 ? 'HERO' : 'NORMAL';

                  newSkills[selectedSkillIdx] = generateSingleSkill(skillSelectedCard.pos, sGrade);
              }

              const updatedCard = { ...skillSelectedCard, skills: newSkills };

              setMyPlayers(prev => prev.map(p => p.uniqueId === skillSelectedCard.uniqueId ? updatedCard : p));
              setLineup(prev => { const next = {...prev}; for(let key in next) { if(next[key]?.uniqueId === skillSelectedCard.uniqueId) next[key] = updatedCard; } return next; });

              setSkillSelectedCard(updatedCard);
              showToast('✨ 고유능력 변경 완료!');

          };

          const handleSkillUpgrade = (idx, e) => {
              e.stopPropagation();
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
                                              <div key={idx} onClick={() => setSelectedSkillIdx(idx)}
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

                              <div className="grid grid-cols-2 gap-3 w-full">
                                  <button onClick={() => handleSkillChange('NORMAL_TICKET')} className="bg-gray-700 border border-gray-500 py-3 font-black text-white hover:bg-gray-600 rounded">
                                      일반 스변 (전체 변경)<br/><span className="text-xs text-yellow-400 font-normal">보유: {normalTicketCount}장</span>
                                  </button>
                                  <button onClick={() => handleSkillChange('PREMIUM')} className="com2us-button py-3 font-black rounded">
                                      고급 스변 (선택 1칸)<br/><span className="text-xs text-yellow-300 font-normal">보유: {premiumTicketCount}장</span>
                                  </button>
                                  <button onClick={() => handleSkillChange('PROTECT')} className="bg-green-700 border border-green-500 py-3 font-black text-white hover:bg-green-600 rounded">
                                      보변권 (선택 1칸)<br/><span className="text-xs text-yellow-300 font-normal">보유: {protectTicketCount}장</span>
                                  </button>
                                  <button onClick={() => handleSkillChange('SELECT')} className="bg-purple-700 border border-purple-500 py-3 font-black text-white hover:bg-purple-600 rounded">
                                      선변권 (선택 1칸)<br/><span className="text-xs text-yellow-300 font-normal">보유: {selectTicketCount}장</span>
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
                  <div className="w-full lg:w-[400px] com2us-panel p-4 flex flex-col h-full rounded-lg">
                      <h3 className="font-black text-xl mb-3 border-b-2 border-gray-600 pb-2 text-blue-300">보유 명단</h3>
                      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 pb-10">
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
          const title = isSignature ? '시그니처 각성 (조합)' : '레전드 스카우트 대기창';
          const reqCount = isSignature ? 3 : 5;
          const cost = isSignature ? 100000 : 200000;

          const currentList = isSignature ? spSelectedToCombine : selectedToCombine;
          const setList = isSignature ? setSpSelectedToCombine : setSelectedToCombine;

          const toggleCombineSelect = (p) => {
              if(currentList.some(sc => sc.uniqueId === p.uniqueId)) {
                  setList(prev => prev.filter(sc => sc.uniqueId !== p.uniqueId));
              } else {
                  if(currentList.length >= reqCount) { showToast(`최대 ${reqCount}명만 등록할 수 있습니다.`); return; }
                  if(isSignature && !['PLATINUM', 'LEGEND'].includes(p.grade)) { showToast('플래티넘 이상 등급만 재료로 가능합니다.'); return; }
                  setList(prev => [...prev, p]);
              }
          };

          const handleSpecialCombine = () => {
              if(currentList.length < reqCount) { showToast(`재료 선수가 ${reqCount}명 필요합니다.`); return; }
              if(currency.points < cost) { showToast(`비용 부족 (${cost} P)`); return; }

              setCurrency(prev => ({...prev, points: prev.points - cost}));
              const idsToRemove = currentList.map(p => p.uniqueId);
              setMyPlayers(prev => prev.filter(p => !idsToRemove.includes(p.uniqueId)));

              const targetGrade = isSignature ? 'SIGNATURE' : 'LEGEND';
              const pool = FULL_DATABASE.filter(p => p.grade === targetGrade);
              const newCard = { ...(pool.length>0 ? pool[Math.floor(Math.random()*pool.length)] : FULL_DATABASE[0]), uniqueId: Date.now()+Math.random(), upgrade: 0 };
              if(!newCard.skills) newCard.skills = generateSkills(newCard.pos === 'P' ? 'P' : 'B', newCard.grade);

              setMyPlayers(prev => [newCard, ...prev]);
              setList([]);
              setPackResultMulti([newCard]);

          };

          const availablePlayers = myPlayers.filter(p => !Object.values(lineup).some(l => l?.uniqueId === p.uniqueId));

          return (
              <div className="flex flex-col lg:flex-row h-[75vh] gap-6">
                  <div className="flex-1 com2us-panel p-6 flex flex-col rounded-lg border-blue-500 shadow-2xl relative">
                      <div className="bg-blue-900 border border-blue-400 text-white text-center py-2 font-black text-2xl mb-6 rounded">{title}</div>

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
                              <button onClick={handleSpecialCombine} className="com2us-button py-4 text-2xl font-black rounded mt-4">각성/스카우트 진행</button>
                          </div>
                      </div>
                  </div>

                  <div className="w-full lg:w-[400px] com2us-panel p-4 flex flex-col h-full rounded-lg">
                      <h3 className="font-black text-xl mb-3 border-b-2 border-gray-600 pb-2 text-blue-300">재료 보관함</h3>
                      <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 pb-10">
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
                      <div className="hidden md:flex gap-3 ml-4">
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
                <div className="club-strip"><span>⚾ {favTeam} · {teamCode.toUpperCase()} 구단</span><span>보유 선수 {myPlayers.length}명 · 자동 저장</span></div>
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
                              🎁 일일 미션 보상 받기 (1000 S / 20000 P)
                          </button>
                      </div>
                  )}

                  {currentMenu === 'TEAM_MANAGE' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full min-h-[60vh]">
                          <button onClick={() => changeMenu('LINEUP')} className="com2us-panel aspect-video flex flex-col items-center justify-center shadow-lg hover:-translate-y-1 rounded-lg"><h2 className="text-3xl font-black text-white">라인업 관리</h2></button>
                          <button onClick={() => changeMenu('TRAIN')} className="com2us-panel aspect-video flex flex-col items-center justify-center shadow-lg hover:-translate-y-1 rounded-lg"><h2 className="text-3xl font-black text-green-400">선수 훈련</h2></button>
                          <button onClick={() => changeMenu('SKILL')} className="com2us-panel aspect-video flex flex-col items-center justify-center shadow-lg hover:-translate-y-1 rounded-lg"><h2 className="text-3xl font-black text-purple-400">고유능력 변경</h2></button>

                          <button onClick={() => changeMenu('LEGEND_SCOUT')} className="com2us-panel aspect-video flex flex-col items-center justify-center shadow-lg hover:-translate-y-1 rounded-lg border-purple-500"><h2 className="text-3xl font-black text-purple-300">레전드 스카우트</h2><p className="text-sm mt-2 text-gray-400">재료 5장 투입</p></button>
                          <button onClick={() => changeMenu('SIGNATURE_AWAKEN')} className="com2us-panel aspect-video flex flex-col items-center justify-center shadow-lg hover:-translate-y-1 rounded-lg border-blue-400"><h2 className="text-3xl font-black text-blue-300">시그니처 각성</h2><p className="text-sm mt-2 text-gray-400">시그니처 전용 획득처</p></button>
                      </div>
                  )}

                  {currentMenu === 'LINEUP' && renderLineupScreen()}
                  {currentMenu === 'TRAIN' && renderTrainScreen()}
                  {currentMenu === 'SKILL' && renderSkillScreen()}
                  {currentMenu === 'LEGEND_SCOUT' && renderSpecialCombineScreen('LEGEND')}
                  {currentMenu === 'SIGNATURE_AWAKEN' && renderSpecialCombineScreen('SIGNATURE')}

                  {currentMenu === 'SHOP' && (
                      <div className="com2us-panel p-8 text-center rounded-xl">
                          <div className="flex justify-between items-center mb-8 border-b-2 border-gray-600 pb-4">
                              <h2 className="text-4xl font-black text-red-400">상점</h2>
                              <button onClick={() => { setCurrency(prev => ({...prev, stars: prev.stars + 300})); showToast('연습 지원금 +300 S');  }} className="bg-yellow-500 text-black px-6 py-2 font-black rounded shadow-lg border border-yellow-200 animate-pulse">연습 지원금 +300 S</button>
                          </div>

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

                  {['LEAGUE','ARCHIVE'].includes(currentMenu) && <ManagerWorkbench initialTab={currentMenu==='LEAGUE'?'시즌 리그':'도감'} catalog={FULL_DATABASE} meta={catalogMeta} players={myPlayers} setPlayers={setMyPlayers} lineup={lineup} setLineup={setLineup} manager={manager} setManager={setManager} team={favTeam} showToast={showToast} onReward={(points,stars)=>setCurrency(prev=>({points:prev.points+points,stars:prev.stars+stars}))}/>}

              </main>

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
                                              <div className="font-bold text-blue-400">{mail.type === 'PACK' ? `${mail.amount}장` : mail.amount.toLocaleString()}</div>
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
                                              <div key={grp.packId} className="bg-gray-800 border border-gray-600 mb-3 flex justify-between items-center px-4 py-3 rounded">
                                                  <div>
                                                      <div className="font-black text-xl text-blue-300">{grp.name}</div>
                                                      <div className="font-bold text-gray-400 mt-1">수량: {grp.count}개</div>
                                                  </div>
                                                  <div className="flex gap-2">
                                                      <button onClick={() => {
                                                          if(grp.packId && grp.packId.includes('skill_ticket')) { showToast("스킬변경권은 '팀 관리 > 고유능력 변경' 메뉴에서 선수 선택 후 사용하세요."); return; }
                                                          const itemToOpen = { id: grp.ids[0], packId: grp.packId };
                                                          if(grp.packId === 'team' || grp.packId === 'premium_team') setTeamSelectModal({ isOpen: true, item: itemToOpen, count: 1 });
                                                          else { setIsModalOpen(false); openPack(itemToOpen, null, 1); }
                                                      }} className="bg-gray-700 text-white font-black text-md px-4 py-2 border border-gray-500 rounded hover:bg-gray-600 shadow-lg">1개 개봉</button>

                                                      <button onClick={() => {
                                                          if(grp.packId && grp.packId.includes('skill_ticket')) { showToast("스킬변경권은 '팀 관리 > 고유능력 변경' 메뉴에서 선수 선택 후 사용하세요."); return; }
                                                          const itemToOpen = { id: grp.ids[0], packId: grp.packId };
                                                          if(grp.packId === 'team' || grp.packId === 'premium_team') setTeamSelectModal({ isOpen: true, item: itemToOpen, count: grp.count });
                                                          else { setIsModalOpen(false); openPack(itemToOpen, null, grp.count); }
                                                      }} className="com2us-button font-black text-md px-4 py-2 rounded shadow-lg">모두 개봉</button>
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
