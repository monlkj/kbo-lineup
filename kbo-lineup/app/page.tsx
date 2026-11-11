<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KBO Grand All-Star Manager 2026</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { font-family: 'Malgun Gothic', sans-serif; background-color: #f8f9fa; user-select: none; }
    .sketch-border { border: 4px solid #000; }
    .sketch-tab { border: 4px solid #000; font-weight: 900; cursor: pointer; text-align: center; padding: 12px; }
    .sketch-tab-active { background-color: #facc15; }
    .sketch-tab-inactive { background-color: #fff; }
    .custom-scrollbar::-webkit-scrollbar { width: 8px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 4px; }
    @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 80% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
    .animate-pop-in { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useMemo } = React;

    const TEAMS = ['KIA', '삼성', 'LG', '두산', 'KT', 'SSG', '롯데', '한화', 'NC', '키움', '해태', 'SK', 'OB', '빙그레', '현대'];
    const TAGS = ['국가대표', 'MVP', '골든글러브', '올스타', '신인왕', '한국시리즈MVP'];
    const SKILL_LEVELS = ['S', 'A', 'B', 'C', 'D', 'E'];

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

    const generateSkills = (pos, playerGrade, ticketType = 'NONE') => {
        let count = 1;
        if (['SPECIAL'].includes(playerGrade)) count = 2;
        else if (['HERO', 'PLATINUM', 'SIGNATURE', 'LEGEND'].includes(playerGrade)) count = 3;

        const skills = [];
        const pType = pos === 'P' ? 'P' : 'B';
        
        for(let i=0; i<count; i++) {
            const r = Math.random();
            let sGrade = 'NORMAL';
            
            if (ticketType === 'PREMIUM') {
                // 고스변: 최대 레전드, 최소 히어로 보장 (슬롯 1개)
                if (i === 0) sGrade = r > 0.8 ? 'LEGEND' : r > 0.4 ? 'PLATINUM' : 'HERO';
                else sGrade = r > 0.9 ? 'LEGEND' : r > 0.7 ? 'PLATINUM' : r > 0.4 ? 'HERO' : 'NORMAL';
            } else if (ticketType === 'NORMAL_TICKET') {
                // 일반 스변권: 최대 플래티넘
                sGrade = r > 0.85 ? 'PLATINUM' : r > 0.50 ? 'HERO' : 'NORMAL';
            } else {
                // 기본 획득
                if(r > 0.96) sGrade = 'LEGEND';
                else if(r > 0.85) sGrade = 'PLATINUM';
                else if(r > 0.60) sGrade = 'HERO';
                else sGrade = 'NORMAL';
            }

            const pool = SKILL_DB[pType][sGrade];
            const sName = pool[Math.floor(Math.random() * pool.length)];
            const sLevel = SKILL_LEVELS[Math.floor(Math.random() * SKILL_LEVELS.length)];
            
            skills.push({ name: sName, grade: sGrade, level: sLevel });
        }
        return skills;
    };

    const FULL_DATABASE = (() => {
      const list = [];
      let idCounter = 1;
      const rp = [
          {n:'김도영',t:'KIA',p:'3B'}, {n:'양현종',t:'KIA',p:'P'}, {n:'이종범',t:'해태',p:'SS'}, {n:'구자욱',t:'삼성',p:'RF'}, {n:'원태인',t:'삼성',p:'P'}, {n:'이승엽',t:'삼성',p:'1B'}, 
          {n:'오지환',t:'LG',p:'SS'}, {n:'박용택',t:'LG',p:'DH'}, {n:'양의지',t:'두산',p:'C'}, {n:'김택연',t:'두산',p:'P'}, {n:'강백호',t:'KT',p:'DH'}, {n:'고영표',t:'KT',p:'P'},
          {n:'최정',t:'SSG',p:'3B'}, {n:'김광현',t:'SSG',p:'P'}, {n:'전준우',t:'롯데',p:'DH'}, {n:'최동원',t:'롯데',p:'P'}, {n:'류현진',t:'한화',p:'P'}, {n:'노시환',t:'한화',p:'3B'},
          {n:'박건우',t:'NC',p:'RF'}, {n:'나성범',t:'NC',p:'RF'}, {n:'김혜성',t:'키움',p:'2B'}, {n:'이정후',t:'키움',p:'CF'}
      ];
      rp.forEach(p => {
          let grade = Math.random() > 0.5 ? 'LEGEND' : 'SIGNATURE';
          let ovr = grade === 'LEGEND' ? 95+Math.floor(Math.random()*5) : 88+Math.floor(Math.random()*6);
          list.push({ 
              id: `p-${idCounter++}`, name: p.n, year: 2010+Math.floor(Math.random()*15), 
              team: p.t, pos: p.p, grade, ovr, 
              tag: TAGS[Math.floor(Math.random()*TAGS.length)], 
              upgrade: 0,
              skills: generateSkills(p.p, grade)
          });
      });

      const lastNames = ['김','이','박','최','정','강','조','윤','장','임','한','오','서','신','권','황','안','송','전','홍'];
      const firstNames = ['도영','현종','성범','형우','자욱','태인','민호','창기','지환','의지','택연','백호','영표','최정','광현','동희','준우','현진','시환','건우','민우','혜성','정후'];
      
      for(let i = 1; i <= 1200; i++) {
        let grade = 'NORMAL';
        const r = Math.random();
        if(r > 0.98) grade = 'LEGEND'; else if(r > 0.94) grade = 'SIGNATURE'; else if(r > 0.85) grade = 'PLATINUM';
        else if(r > 0.70) grade = 'HERO'; else if(r > 0.45) grade = 'SPECIAL'; else if(r > 0.25) grade = 'RARE';
        
        let ovr = 60 + Math.floor(Math.random()*10);
        if(grade === 'LEGEND') ovr = 95+Math.floor(Math.random()*4); if(grade === 'SIGNATURE') ovr = 88+Math.floor(Math.random()*5);
        if(grade === 'PLATINUM') ovr = 82+Math.floor(Math.random()*5); if(grade === 'HERO') ovr = 75+Math.floor(Math.random()*6);
        if(grade === 'SPECIAL') ovr = 70+Math.floor(Math.random()*5); if(grade === 'RARE') ovr = 65+Math.floor(Math.random()*5);
        
        const generatedPos = (Math.random() > 0.6) ? 'P' : ['C','1B','2B','3B','SS','LF','CF','RF','DH'][Math.floor(Math.random() * 9)];

        list.push({
            id: `p-${idCounter++}`,
            name: `${lastNames[Math.floor(Math.random()*lastNames.length)]}${firstNames[Math.floor(Math.random()*firstNames.length)]}`,
            year: 1982 + Math.floor(Math.random()*45),
            team: TEAMS[Math.floor(Math.random() * TEAMS.length)],
            pos: generatedPos,
            grade, ovr,
            tag: ['LEGEND','SIGNATURE','PLATINUM'].includes(grade) && Math.random()>0.5 ? TAGS[Math.floor(Math.random()*TAGS.length)] : null,
            upgrade: 0,
            skills: generateSkills(generatedPos === 'P' ? 'P' : 'B', grade)
        });
      }
      return list;
    })();

    const GRADE_CONFIG = {
        NORMAL: { bg: 'bg-[#d1d5db]', text: 'text-black' }, RARE: { bg: 'bg-[#3b82f6]', text: 'text-white' },
        SPECIAL: { bg: 'bg-[#ef4444]', text: 'text-white' }, HERO: { bg: 'bg-[#22c55e]', text: 'text-white' },
        PLATINUM: { bg: 'bg-[#eab308]', text: 'text-black' }, SIGNATURE: { bg: 'bg-[#cbd5e1]', text: 'text-black' },
        LEGEND: { bg: 'bg-[#a855f7]', text: 'text-white' }
    };

    function App() {
      const [teamCode, setTeamCode] = useState('');
      const [favTeam, setFavTeam] = useState('');
      const [isLoggedIn, setIsLoggedIn] = useState(false);
      const [currentMenu, setCurrentMenu] = useState('HOME'); 
      const [isModalOpen, setIsModalOpen] = useState(false);
      const [modalTab, setModalTab] = useState('MAILBOX'); 
      const [toast, setToast] = useState('');
      
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

      const changeMenu = (menu) => { setCurrentMenu(menu); setVisibleCount(30); };

      const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

      const handleLogin = (e) => {
        e.preventDefault();
        if(!teamCode.trim()) return;
        const code = teamCode.trim().toUpperCase();
        const savedData = localStorage.getItem(`kbo_v14_${code}`);
        if(savedData) {
            const data = JSON.parse(savedData);
            setFavTeam(data.favTeam || 'KIA'); setCurrency(data.currency || { points: 0, stars: 0 });
            setMailbox(data.mailbox || []); setInventory(data.inventory || []);
            setMyPlayers(data.myPlayers || []); setLineup(data.lineup || { CF: null, LF: null, RF: null, SS: null, '2B': null, '3B': null, '1B': null, C: null, DH: null, P: null });
            setIsLoggedIn(true); showToast(`[${code}] 구단을 불러왔습니다.`);
        } else {
            if(!favTeam) { showToast('선호 구단을 선택해주세요!'); return; }
            setMailbox([
                { id: Date.now()+1, title: '창단 선물: 구단선택팩', type: 'PACK', packId: 'team', amount: 1 },
                { id: Date.now()+2, title: '창단 선물: 포인트', type: 'POINT', amount: 100000 },
                { id: Date.now()+3, title: '창단 선물: 스타', type: 'STAR', amount: 5000 },
                { id: Date.now()+4, title: '일반 선수팩', type: 'PACK', packId: 'normal_all', amount: 5 },
            ]);
            setIsLoggedIn(true); showToast(`[${code}] 신규 구단 창단! 우편함을 확인하세요.`);
        }
      };

      const handleSave = () => {
        const data = { favTeam, currency, mailbox, inventory, myPlayers, lineup };
        localStorage.setItem(`kbo_v14_${teamCode.trim().toUpperCase()}`, JSON.stringify(data));
      };

      const handleReset = () => {
          if(confirm('정말 모든 구단 데이터를 초기화하시겠습니까? 복구할 수 없습니다.')) {
              localStorage.removeItem(`kbo_v14_${teamCode.trim().toUpperCase()}`);
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
                  for(let i=0; i<mail.amount; i++) newInv.push({ id: Date.now() + Math.random(), name: mail.title, packId: mail.packId });
              }
          });
          setCurrency({ points: p, stars: s }); setInventory(newInv); setMailbox([]); showToast('우편 수령 완료!'); setTimeout(() => handleSave(), 100);
      };

      const openPack = (item, targetTeam = null, count = 1) => {
          let pool = [];
          switch(item.packId) {
              case 'high_friendship': pool = FULL_DATABASE.filter(p => ['RARE', 'SPECIAL', 'HERO'].includes(p.grade)); break;
              case 'normal_all': pool = FULL_DATABASE.filter(p => ['NORMAL', 'RARE', 'SPECIAL'].includes(p.grade)); break;
              case 'normal_batter': pool = FULL_DATABASE.filter(p => ['NORMAL', 'RARE', 'SPECIAL'].includes(p.grade) && p.pos !== 'P'); break;
              case 'normal_pitcher': pool = FULL_DATABASE.filter(p => ['NORMAL', 'RARE', 'SPECIAL'].includes(p.grade) && p.pos === 'P'); break;
              case 'mileage': pool = FULL_DATABASE.filter(p => ['HERO', 'PLATINUM', 'SIGNATURE', 'LEGEND'].includes(p.grade)); break;
              case 'team': pool = FULL_DATABASE.filter(p => p.team === targetTeam); break;
              case 'premium_team': pool = FULL_DATABASE.filter(p => p.team === targetTeam && ['PLATINUM', 'SIGNATURE', 'LEGEND'].includes(p.grade)); break;
              default: pool = FULL_DATABASE;
          }
          if (pool.length === 0) pool = FULL_DATABASE;
          
          let currentInv = [...inventory];
          let openedCards = [];
          
          for(let i=0; i<count; i++) {
              const invIdx = currentInv.findIndex(inv => inv.packId === item.packId);
              if (invIdx > -1) currentInv.splice(invIdx, 1);
              
              const newCard = { ...pool[Math.floor(Math.random() * pool.length)], uniqueId: Date.now() + Math.random(), upgrade: 0 };
              if(!newCard.skills) newCard.skills = generateSkills(newCard.pos === 'P' ? 'P' : 'B', newCard.grade);
              openedCards.push(newCard);
          }

          setInventory(currentInv);
          setMyPlayers(prev => [...openedCards, ...prev]);
          setPackResultMulti(openedCards); 
          setTimeout(() => handleSave(), 100);
      };

      const buyPack = (packId, title, cost, type = 'point') => {
          if (type === 'point' && currency.points < cost) { showToast('포인트가 부족합니다!'); return; }
          if (type === 'star' && currency.stars < cost) { showToast('스타가 부족합니다!'); return; }
          if(type === 'point') setCurrency(prev => ({...prev, points: prev.points - cost}));
          if(type === 'star') setCurrency(prev => ({...prev, stars: prev.stars - cost}));
          setInventory(prev => [...prev, { id: Date.now(), name: title, packId }]);
          showToast(`${title} 구매 완료!`); setTimeout(() => handleSave(), 100);
      }

      const renderPlayerCard = (p, isPlaced = false, onClick = null) => (
          <div key={p.uniqueId} onClick={onClick} className={`flex items-center p-2 cursor-pointer transition-all border-4 ${isPlaced ? 'opacity-50 border-gray-400 bg-gray-200 grayscale' : 'border-black hover:-translate-y-1 shadow-[4px_4px_0_0_#000]'} ${GRADE_CONFIG[p.grade].bg}`}>
              <div className="w-14 h-14 bg-black/30 rounded flex items-center justify-center font-black text-2xl mr-3 border-2 border-white/30 text-white shadow-inner">{p.ovr}</div>
              <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[10px] bg-black/60 text-white px-1.5 py-0.5 font-bold rounded-sm">{p.year} {p.team}</span>
                      <span className="text-[10px] bg-black/60 text-white px-1.5 py-0.5 font-bold rounded-sm">{p.pos}</span>
                      {p.tag && <span className="text-[10px] bg-yellow-400 text-black border border-black px-1.5 py-0.5 font-black rounded-sm">{p.tag}</span>}
                  </div>
                  <div className={`font-black text-lg drop-shadow-sm flex items-center ${GRADE_CONFIG[p.grade].text}`}>
                      {p.name} {p.upgrade > 0 && <span className="text-yellow-400 ml-1 drop-shadow-[1px_1px_1px_black]">+{p.upgrade}</span>}
                      <span className="text-[9px] opacity-90 font-bold bg-black/20 px-1 py-0.5 rounded ml-2 uppercase">{p.grade}</span>
                  </div>
              </div>
              {isPlaced && <div className="text-[10px] bg-black text-white px-2 py-1 font-bold rounded">배치/선택됨</div>}
          </div>
      );

      const BigResultCard = ({ p }) => (
          <div className={`relative w-64 h-80 flex flex-col justify-between p-3 border-4 border-black shadow-[8px_8px_0_0_#000] ${GRADE_CONFIG[p.grade].bg} ${GRADE_CONFIG[p.grade].text}`}>
              <div className="flex justify-between items-start">
                  <span className="bg-black/60 text-white text-md px-2 py-1 font-black rounded">{p.pos}</span>
                  <span className="text-xs opacity-90 font-black bg-black/20 px-2 py-1 rounded uppercase border-2 border-current">{p.grade}</span>
              </div>
              <div className="text-center font-black text-6xl drop-shadow-lg my-2 tracking-tighter">{p.ovr}</div>
              <div className="bg-black/70 text-white text-center p-2 rounded border-2 border-black">
                  <div className="text-xs opacity-80 mb-1 font-bold">{p.year} {p.team}</div>
                  <div className="font-black text-2xl">{p.name}</div>
              </div>
          </div>
      );

      const LineupScreen = () => {
          const placePlayer = (player) => {
              if(!activePos) { showToast('먼저 그라운드에서 포지션을 선택하세요.'); return; }
              if(activePos === 'P' && player.pos !== 'P') { showToast('투수 자리에 타자를 배치할 수 없습니다!'); return; }
              if(activePos !== 'P' && player.pos === 'P') { showToast('타자 자리에 투수를 배치할 수 없습니다!'); return; }
              setLineup(prev => ({...prev, [activePos]: player})); setActivePos(null); setTimeout(()=>handleSave(), 100);
          };

          return (
              <div className="flex flex-col lg:flex-row h-[75vh] gap-6">
                  <div className="flex-1 bg-green-800 border-4 border-black relative rounded-lg shadow-inner overflow-hidden min-h-[400px]">
                      <div className="absolute top-4 left-4 z-20">
                          <button onClick={()=>{handleSave(); showToast('저장 완료!');}} className="bg-yellow-400 border-4 border-black px-6 py-2 font-black shadow-[4px_4px_0_0_#000] hover:bg-yellow-300">라인업 저장</button>
                      </div>
                      <div className="absolute top-4 right-4 z-20 bg-white border-4 border-black px-4 py-2 font-black text-sm shadow-[4px_4px_0_0_#000]">
                          {activePos ? `우측에서 [${activePos}] 선택` : '포지션 클릭'}
                      </div>
                      <div className="absolute w-[80%] h-[80%] max-w-[350px] max-h-[350px] border-4 border-white/30 rotate-45 bottom-[-5%] left-1/2 -translate-x-1/2" />
                      {[
                        { role: 'CF', b: '75%', l: '50%' }, { role: 'LF', b: '60%', l: '20%' }, { role: 'RF', b: '60%', l: '80%' },
                        { role: 'SS', b: '45%', l: '35%' }, { role: '2B', b: '45%', l: '65%' }, { role: '3B', b: '30%', l: '20%' },
                        { role: '1B', b: '30%', l: '80%' }, { role: 'P', b: '35%', l: '50%' }, { role: 'C', b: '10%', l: '50%' }, { role: 'DH', b: '10%', l: '20%' }
                      ].map(pos => {
                          const p = lineup[pos.role];
                          return (
                              <div key={pos.role} onClick={() => setActivePos(pos.role)} className="absolute flex flex-col items-center -translate-x-1/2 translate-y-1/2 z-10 cursor-pointer" style={{ bottom: pos.b, left: pos.l }}>
                                  {!p ? (
                                      <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-black text-sm ${activePos === pos.role ? 'bg-yellow-400 border-black scale-125 z-20 shadow-[4px_4px_0_0_#000]' : 'bg-black/50 border-white/50 text-white'}`}>{pos.role}</div>
                                  ) : (
                                      <div className={`relative w-20 h-28 flex flex-col justify-between p-1 border-4 border-black shadow-[4px_4px_0_0_#000] hover:scale-110 ${GRADE_CONFIG[p.grade].bg} ${GRADE_CONFIG[p.grade].text} ${activePos===pos.role?'scale-110 z-20 ring-4 ring-yellow-400':''}`}>
                                          <div className="flex justify-between items-start">
                                              <span className="bg-black/50 text-white text-[9px] px-1 font-bold rounded">{p.pos}</span>
                                              <button onClick={(e) => { e.stopPropagation(); setLineup(prev => ({...prev, [pos.role]: null})); }} className="text-black hover:text-red-500 bg-white/80 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black">X</button>
                                          </div>
                                          <div className="text-center font-black text-2xl drop-shadow-md">{p.ovr}</div>
                                          <div className="bg-black/60 text-white text-[10px] text-center p-0.5 rounded-sm"><div className="font-black truncate">{p.name}</div></div>
                                      </div>
                                  )}
                              </div>
                          )
                      })}
                  </div>
                  <div className="w-full lg:w-[400px] bg-white border-4 border-black p-4 flex flex-col h-full shadow-[8px_8px_0_0_#000]">
                      <h3 className="font-black text-xl mb-3 border-b-4 border-black pb-2">보유 선수 명단 ({myPlayers.length}명)</h3>
                      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-10">
                          {myPlayers.length === 0 ? <p className="text-gray-500 font-bold text-center mt-10">선수가 없습니다.</p> :
                            <>
                                {myPlayers.slice(0, visibleCount).map(p => {
                                    const isPlaced = Object.values(lineup).some(placed => placed?.uniqueId === p.uniqueId);
                                    return renderPlayerCard(p, isPlaced, () => { if(!isPlaced) placePlayer(p); });
                                })}
                                {myPlayers.length > visibleCount && (
                                    <button onClick={() => setVisibleCount(v => v + 30)} className="w-full bg-gray-200 border-2 border-black py-3 mt-4 font-black hover:bg-gray-300">▼ 더보기</button>
                                )}
                            </>
                          }
                      </div>
                  </div>
              </div>
          );
      };

      const TrainScreen = () => {
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
              setTimeout(() => handleSave(), 100);
          };

          return (
              <div className="flex flex-col lg:flex-row h-[75vh] gap-6">
                  <div className="flex-1 bg-white border-4 border-black p-8 flex flex-col items-center justify-center shadow-[8px_8px_0_0_#000]">
                      <h2 className="text-4xl font-black mb-8 border-b-4 border-black pb-4 text-green-700">선수 육성 (강화)</h2>
                      {!trainSelectedCard ? <div className="text-gray-400 font-bold text-xl text-center">우측에서 선수를 선택하세요.</div> : (
                          <div className="flex flex-col items-center w-full max-w-md">
                              <div className="w-full mb-8">{renderPlayerCard(trainSelectedCard)}</div>
                              <div className="bg-gray-100 border-4 border-black w-full p-4 text-center mb-6">
                                  <div className="text-lg font-bold mb-1">현재: +{trainSelectedCard.upgrade || 0} ➔ 목표: +{(trainSelectedCard.upgrade || 0) + 1}</div>
                                  <div className="text-red-500 font-black mb-1">성공 확률: {Math.max(10, 100 - ((trainSelectedCard.upgrade || 0) * 10))}%</div>
                                  <div className="font-bold">비용: {(trainSelectedCard.upgrade + 1) * 3000} P</div>
                              </div>
                              <button onClick={handleEnhance} className="w-full bg-green-600 text-white border-4 border-black py-4 text-xl font-black hover:bg-green-700 shadow-[4px_4px_0_0_#000] active:translate-y-1">강화 시도</button>
                          </div>
                      )}
                  </div>
                  <div className="w-full lg:w-[400px] bg-white border-4 border-black p-4 flex flex-col h-full shadow-[8px_8px_0_0_#000]">
                      <h3 className="font-black text-xl mb-3 border-b-4 border-black pb-2">선수 명단</h3>
                      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-10">
                          {myPlayers.slice(0, visibleCount).map(p => renderPlayerCard(p, trainSelectedCard?.uniqueId === p.uniqueId, () => setTrainSelectedCard(p)))}
                          {myPlayers.length > visibleCount && ( <button onClick={() => setVisibleCount(v => v + 30)} className="w-full bg-gray-200 border-2 border-black py-3 mt-4 font-black hover:bg-gray-300">▼ 더보기</button> )}
                      </div>
                  </div>
              </div>
          );
      };

      const CombineScreen = () => {
          const [combineMode, setCombineMode] = useState('NORMAL'); 
          const [selectedToCombine, setSelectedToCombine] = useState([]);
          
          useEffect(() => { setSelectedToCombine([]); }, [combineMode]);

          const toggleCombineSelect = (p) => {
              if(selectedToCombine.some(sc => sc.uniqueId === p.uniqueId)) {
                  setSelectedToCombine(prev => prev.filter(sc => sc.uniqueId !== p.uniqueId));
              } else {
                  if (combineMode === 'NORMAL') { if(selectedToCombine.length >= 5) { showToast('최대 5명까지만 가능합니다.'); return; } } 
                  else {
                      if(selectedToCombine.length >= 3) { showToast('딱 3명만 등록할 수 있습니다.'); return; }
                      if(!['PLATINUM', 'SIGNATURE', 'LEGEND'].includes(p.grade)) { showToast('플래티넘 이상 등급만 가능합니다.'); return; }
                  }
                  setSelectedToCombine(prev => [...prev, p]);
              }
          };

          const handleCombine = () => {
              const cost = combineMode === 'NORMAL' ? 10000 : 50000;
              const minCount = combineMode === 'NORMAL' ? 3 : 3;
              if(selectedToCombine.length < minCount) { showToast(`최소 ${minCount}명이 필요합니다.`); return; }
              if(currency.points < cost) { showToast(`비용 부족 (${cost} P)`); return; }
              
              setCurrency(prev => ({...prev, points: prev.points - cost}));
              const idsToRemove = selectedToCombine.map(p => p.uniqueId);
              setMyPlayers(prev => prev.filter(p => !idsToRemove.includes(p.uniqueId)));

              let targetGrade = 'NORMAL';
              if (combineMode === 'NORMAL') {
                  let avgOvr = selectedToCombine.reduce((sum, p) => sum + p.ovr, 0) / selectedToCombine.length;
                  if(avgOvr > 85) targetGrade = Math.random()>0.5 ? 'LEGEND' : 'SIGNATURE';
                  else if(avgOvr > 78) targetGrade = 'PLATINUM';
                  else if(avgOvr > 70) targetGrade = 'HERO';
                  else targetGrade = 'SPECIAL';
              } else {
                  targetGrade = Math.random() > 0.7 ? 'LEGEND' : 'SIGNATURE';
              }

              const pool = FULL_DATABASE.filter(p => p.grade === targetGrade);
              const newCard = { ...(pool.length>0 ? pool[Math.floor(Math.random()*pool.length)] : FULL_DATABASE[0]), uniqueId: Date.now()+Math.random(), upgrade: 0 };
              if(!newCard.skills) newCard.skills = generateSkills(newCard.pos === 'P' ? 'P' : 'B', newCard.grade);
              
              setMyPlayers(prev => [newCard, ...prev]); setSelectedToCombine([]); setPackResultMulti([newCard]);
              setTimeout(()=>handleSave(), 100);
          };

          const availablePlayers = myPlayers.filter(p => !Object.values(lineup).some(l => l?.uniqueId === p.uniqueId));

          return (
              <div className="flex flex-col lg:flex-row h-[75vh] gap-6">
                  <div className="flex-1 bg-white border-4 border-black p-8 flex flex-col items-center shadow-[8px_8px_0_0_#000]">
                      <div className="flex w-full mb-6 gap-2">
                          <button onClick={() => setCombineMode('NORMAL')} className={`flex-1 py-3 border-4 border-black font-black text-xl ${combineMode === 'NORMAL' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}>일반 조합</button>
                          <button onClick={() => setCombineMode('LEGEND')} className={`flex-1 py-3 border-4 border-black font-black text-xl ${combineMode === 'LEGEND' ? 'bg-yellow-400 text-black' : 'bg-gray-100 text-gray-500'}`}>레전드 조합</button>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center w-full">
                          <div className="flex gap-2 mb-8 h-36 items-center justify-center flex-wrap">
                              {(combineMode === 'NORMAL' ? [0,1,2,3,4] : [0,1,2]).map(i => {
                                  const p = selectedToCombine[i];
                                  return p ? <div key={i} className={`w-20 h-28 border-4 border-black flex flex-col items-center justify-center text-xs font-black ${GRADE_CONFIG[p.grade].bg} ${GRADE_CONFIG[p.grade].text}`}>{p.ovr}<br/>{p.name}</div>
                                  : <div key={i} className="w-20 h-28 border-4 border-dashed border-gray-400 bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-sm">재료{i+1}</div>
                              })}
                          </div>
                          <button onClick={handleCombine} className={`w-full max-w-md text-white border-4 border-black py-4 text-2xl font-black shadow-[4px_4px_0_0_#000] active:translate-y-1 ${combineMode === 'LEGEND' ? 'bg-gray-900 hover:bg-black text-yellow-400' : 'bg-purple-600 hover:bg-purple-700'}`}>조합 실행</button>
                      </div>
                  </div>
                  <div className="w-full lg:w-[400px] bg-white border-4 border-black p-4 flex flex-col h-full shadow-[8px_8px_0_0_#000]">
                      <h3 className="font-black text-xl mb-3 border-b-4 border-black pb-2">조합 재료</h3>
                      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-10">
                          {availablePlayers.slice(0, visibleCount).map(p => renderPlayerCard(p, selectedToCombine.some(sc=>sc.uniqueId===p.uniqueId), () => toggleCombineSelect(p)))}
                      </div>
                  </div>
              </div>
          );
      };

      const SkillScreen = () => {
          const [skillSelectedCard, setSkillSelectedCard] = useState(null);
          
          const normalTicketCount = inventory.filter(i => i.packId === 'skill_ticket').length;
          const premiumTicketCount = inventory.filter(i => i.packId === 'premium_skill_ticket').length;
          const protectTicketCount = inventory.filter(i => i.packId === 'protect_skill_ticket').length;
          const selectTicketCount = inventory.filter(i => i.packId === 'select_skill_ticket').length;

          const handleSkillChange = (type) => {
              if(!skillSelectedCard) return;
              
              const reqTicket = type === 'NORMAL_TICKET' ? 'skill_ticket' : 
                                type === 'PREMIUM' ? 'premium_skill_ticket' : 
                                type === 'PROTECT' ? 'protect_skill_ticket' : 'select_skill_ticket';
                                
              const ticketCount = inventory.filter(i => i.packId === reqTicket).length;
              if (ticketCount < 1) { showToast('변경권이 부족합니다!'); return; }

              const ticketIndex = inventory.findIndex(i => i.packId === reqTicket);
              const newInv = [...inventory];
              newInv.splice(ticketIndex, 1);
              setInventory(newInv);

              const newSkills = generateSkills(skillSelectedCard.pos === 'P' ? 'P' : 'B', skillSelectedCard.grade, type);
              const updatedCard = { ...skillSelectedCard, skills: newSkills };

              setMyPlayers(prev => prev.map(p => p.uniqueId === skillSelectedCard.uniqueId ? updatedCard : p));
              setLineup(prev => { const next = {...prev}; for(let key in next) { if(next[key]?.uniqueId === skillSelectedCard.uniqueId) next[key] = updatedCard; } return next; });
              
              // 변경된 데이터로 현재 선택 카드 즉시 갱신 (선택 유지)
              setSkillSelectedCard(updatedCard); 
              showToast('✨ 고유능력 변경 완료!');
              setTimeout(() => handleSave(), 100);
          };

          return (
              <div className="flex flex-col lg:flex-row h-[75vh] gap-6">
                  <div className="flex-1 bg-white border-4 border-black p-8 flex flex-col items-center shadow-[8px_8px_0_0_#000] overflow-y-auto custom-scrollbar">
                      <h2 className="text-4xl font-black mb-8 border-b-4 border-black pb-4 text-indigo-700">고유능력 변경</h2>
                      {!skillSelectedCard ? <div className="text-gray-400 font-bold text-xl text-center mt-10">우측에서 선수를 선택하세요.</div> : (
                          <div className="flex flex-col items-center w-full max-w-md">
                              <div className="w-full mb-6">{renderPlayerCard(skillSelectedCard)}</div>
                              
                              <div className="w-full border-4 border-black bg-gray-100 p-4 mb-6 shadow-inner">
                                  <h3 className="font-black text-xl mb-4 text-center">보유 스킬</h3>
                                  <div className="space-y-3">
                                      {skillSelectedCard.skills && skillSelectedCard.skills.length > 0 ? (
                                          skillSelectedCard.skills.map((s, idx) => (
                                              <div key={idx} className={`border-2 border-black p-3 font-black flex justify-between items-center ${GRADE_CONFIG[s.grade].bg} ${GRADE_CONFIG[s.grade].text}`}>
                                                  <div className="flex items-center gap-2">
                                                      <span className="bg-white text-black px-2 py-0.5 text-sm rounded-sm border border-black shadow-sm">{s.level}</span>
                                                      <span className="text-lg">{s.name}</span>
                                                  </div>
                                                  <span className="text-xs bg-black/30 px-2 py-1 uppercase rounded">{s.grade}</span>
                                              </div>
                                          ))
                                      ) : (
                                          <div className="text-center text-gray-500 font-bold">보유 스킬이 없습니다.</div>
                                      )}
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 w-full">
                                  <button onClick={() => handleSkillChange('NORMAL_TICKET')} className="bg-gray-300 border-4 border-black py-3 font-black shadow-[4px_4px_0_0_#000] hover:bg-gray-400 active:translate-y-1">
                                      일반 스변 (최대 플래)<br/><span className="text-sm text-red-600">보유: {normalTicketCount}장</span>
                                  </button>
                                  <button onClick={() => handleSkillChange('PREMIUM')} className="bg-blue-300 border-4 border-black py-3 font-black shadow-[4px_4px_0_0_#000] hover:bg-blue-400 active:translate-y-1">
                                      고급 스변 (최대 레전)<br/><span className="text-sm text-red-600">보유: {premiumTicketCount}장</span>
                                  </button>
                                  <button onClick={() => handleSkillChange('PROTECT')} className="bg-green-300 border-4 border-black py-3 font-black shadow-[4px_4px_0_0_#000] hover:bg-green-400 active:translate-y-1">
                                      보변권 (임시 전체변경)<br/><span className="text-sm text-red-600">보유: {protectTicketCount}장</span>
                                  </button>
                                  <button onClick={() => handleSkillChange('SELECT')} className="bg-purple-300 border-4 border-black py-3 font-black shadow-[4px_4px_0_0_#000] hover:bg-purple-400 active:translate-y-1">
                                      선변권 (임시 전체변경)<br/><span className="text-sm text-red-600">보유: {selectTicketCount}장</span>
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
                  <div className="w-full lg:w-[400px] bg-white border-4 border-black p-4 flex flex-col h-full shadow-[8px_8px_0_0_#000]">
                      <h3 className="font-black text-xl mb-3 border-b-4 border-black pb-2">선수 명단</h3>
                      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-10">
                          {myPlayers.slice(0, visibleCount).map(p => renderPlayerCard(p, skillSelectedCard?.uniqueId === p.uniqueId, () => setSkillSelectedCard(p)))}
                          {myPlayers.length > visibleCount && ( <button onClick={() => setVisibleCount(v => v + 30)} className="w-full bg-gray-200 border-2 border-black py-3 mt-4 font-black hover:bg-gray-300">▼ 더보기</button> )}
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

      if(!isLoggedIn) {
          return (
              <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
                  <div className="bg-white p-8 shadow-2xl max-w-md w-full border-4 border-black text-center">
                      <h1 className="text-3xl font-black mb-6 text-blue-800">KBO 그랜드<br/>올스타 매니저 2026</h1>
                      <form onSubmit={handleLogin} className="space-y-6">
                          <div>
                              <input type="text" placeholder="예: TIGERS2026" value={teamCode} onChange={e=>setTeamCode(e.target.value)} className="w-full border-4 border-black px-4 py-3 font-bold text-lg text-center outline-none" required />
                          </div>
                          <div>
                              <select value={favTeam} onChange={e=>setFavTeam(e.target.value)} className="w-full border-4 border-black px-4 py-3 font-bold text-lg outline-none">
                                  <option value="">선호 구단 선택</option>
                                  {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                          </div>
                          <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 border-4 border-black hover:bg-blue-700 shadow-[4px_4px_0_0_#000] active:translate-y-1">접속 / 창단</button>
                      </form>
                  </div>
              </div>
          );
      }

      return (
          <div className="min-h-screen bg-gray-100 flex flex-col">
              {toast && ( <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-6 py-3 rounded border-4 border-white font-black shadow-xl animate-bounce">{toast}</div> )}
              
              <header className="bg-white border-b-4 border-black p-4 flex justify-between items-center sticky top-0 z-40">
                  <div className="flex items-center gap-4">
                      <button onClick={() => changeMenu('HOME')} className="font-black text-2xl text-blue-800 hover:text-blue-600">홈</button>
                      <div className="hidden md:flex gap-3 ml-4">
                          <span className="bg-gray-200 border-2 border-black px-4 py-1.5 font-black rounded-full shadow-[2px_2px_0_0_#000]"><span className="text-blue-600 mr-1">C</span> {currency.points.toLocaleString()}</span>
                          <span className="bg-gray-200 border-2 border-black px-4 py-1.5 font-black rounded-full shadow-[2px_2px_0_0_#000]"><span className="text-red-500 mr-1">S</span> {currency.stars.toLocaleString()}</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <button onClick={() => { setIsModalOpen(true); setModalTab('MAILBOX'); }} className="relative bg-yellow-400 border-4 border-black px-4 py-2 font-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1">
                          우편함 {mailbox.length > 0 && <span className="absolute -top-3 -right-3 bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-sm border-2 border-white animate-pulse">{mailbox.length}</span>}
                      </button>
                      <button onClick={() => { setIsModalOpen(true); setModalTab('INVENTORY'); }} className="bg-blue-500 text-white border-4 border-black px-4 py-2 font-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1">소지품</button>
                      <button onClick={() => setSettingsModal(true)} className="bg-gray-300 border-4 border-black px-3 py-2 font-black shadow-[4px_4px_0_0_#000] hover:-translate-y-1">⚙️</button>
                  </div>
              </header>

              <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
                  {currentMenu === 'HOME' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[60vh]">
                          <button onClick={() => changeMenu('TEAM_MANAGE')} className="bg-white border-4 border-black flex flex-col items-center justify-center shadow-[8px_8px_0_0_#000] hover:-translate-y-1 p-10"><h2 className="text-4xl font-black text-green-800">팀 관리</h2><p className="mt-4 font-bold text-gray-500">라인업, 강화, 조합, 스킬</p></button>
                          <button onClick={() => changeMenu('SHOP')} className="bg-white border-4 border-black flex flex-col items-center justify-center shadow-[8px_8px_0_0_#000] hover:-translate-y-1 p-10"><h2 className="text-4xl font-black text-red-600">상점</h2><p className="mt-4 font-bold text-gray-500">FA 스카우트, 팩, 아이템</p></button>
                          <button onClick={() => changeMenu('LEAGUE')} className="bg-white border-4 border-black flex flex-col items-center justify-center shadow-[8px_8px_0_0_#000] hover:-translate-y-1 p-10"><h2 className="text-4xl font-black text-blue-800">리그 모드</h2><p className="mt-4 font-bold text-gray-500">경기 시뮬레이션</p></button>
                      </div>
                  )}

                  {currentMenu === 'TEAM_MANAGE' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[60vh]">
                          <button onClick={() => changeMenu('LINEUP')} className="bg-white border-4 border-black aspect-video flex items-center justify-center shadow-[8px_8px_0_0_#000] hover:-translate-y-1"><h2 className="text-4xl font-black">라인업 관리</h2></button>
                          <button onClick={() => changeMenu('TRAIN')} className="bg-white border-4 border-black aspect-video flex items-center justify-center shadow-[8px_8px_0_0_#000] hover:-translate-y-1"><h2 className="text-4xl font-black text-green-700">선수 육성 (강화)</h2></button>
                          <button onClick={() => changeMenu('COMBINE')} className="bg-white border-4 border-black aspect-video flex items-center justify-center shadow-[8px_8px_0_0_#000] hover:-translate-y-1"><h2 className="text-4xl font-black text-purple-700">선수 조합</h2></button>
                          <button onClick={() => changeMenu('SKILL')} className="bg-white border-4 border-black aspect-video flex items-center justify-center shadow-[8px_8px_0_0_#000] hover:-translate-y-1"><h2 className="text-4xl font-black text-indigo-700">고유능력 변경</h2></button>
                          <button onClick={() => showToast('시그니처 시스템은 준비 중입니다.')} className="md:col-span-2 bg-gray-200 border-4 border-black aspect-video flex items-center justify-center shadow-[8px_8px_0_0_#000]"><h2 className="text-4xl font-black text-gray-500">시그니처 (준비 중)</h2></button>
                      </div>
                  )}

                  {currentMenu === 'LINEUP' && <LineupScreen />}
                  {currentMenu === 'TRAIN' && <TrainScreen />}
                  {currentMenu === 'COMBINE' && <CombineScreen />}
                  {currentMenu === 'SKILL' && <SkillScreen />}
                  
                  {currentMenu === 'SHOP' && (
                      <div className="bg-white border-4 border-black p-8 text-center shadow-[8px_8px_0_0_#000]">
                          <h2 className="text-4xl font-black mb-8 text-red-600">상점 (FA / 팩 / 아이템)</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <button onClick={()=>buyPack('normal_all', '일반 선수팩', 3000, 'point')} className="border-4 border-black p-4 font-black text-lg hover:bg-gray-100 shadow-[4px_4px_0_0_#000]">일반 선수팩 (3,000 P)</button>
                              <button onClick={()=>buyPack('normal_batter', '일반 타자팩', 5000, 'point')} className="border-4 border-black p-4 font-black text-lg hover:bg-gray-100 shadow-[4px_4px_0_0_#000]">일반 타자팩 (5,000 P)</button>
                              <button onClick={()=>buyPack('normal_pitcher', '일반 투수팩', 5000, 'point')} className="border-4 border-black p-4 font-black text-lg hover:bg-gray-100 shadow-[4px_4px_0_0_#000]">일반 투수팩 (5,000 P)</button>
                              <button onClick={()=>buyPack('high_friendship', '고급우정팩', 10000, 'point')} className="border-4 border-black p-4 font-black text-lg hover:bg-blue-100 shadow-[4px_4px_0_0_#000]">고급우정팩 (10,000 P)</button>
                              
                              <button onClick={()=>buyPack('mileage', '마일리지팩', 30000, 'point')} className="border-4 border-black p-4 font-black text-lg hover:bg-purple-100 shadow-[4px_4px_0_0_#000]">마일리지팩 (30,000 P)</button>
                              <button onClick={()=>buyPack('premium_team', '구단선택팩', 5000, 'star')} className="border-4 border-black p-4 font-black text-lg bg-yellow-300 hover:bg-yellow-400 shadow-[4px_4px_0_0_#000]">구단선택팩 (5,000 S)</button>
                              <button onClick={()=>buyPack('skill_ticket', '스킬변경권', 3000, 'point')} className="border-4 border-black p-4 font-black text-lg bg-gray-200 hover:bg-gray-300 shadow-[4px_4px_0_0_#000]">스킬변경권 (3,000 P)</button>
                              <button onClick={()=>buyPack('premium_skill_ticket', '고급 스변권', 500, 'star')} className="border-4 border-black p-4 font-black text-lg bg-blue-200 hover:bg-blue-300 shadow-[4px_4px_0_0_#000]">고급 스변권 (500 S)</button>
                              
                              <button onClick={()=>buyPack('protect_skill_ticket', '보변권', 800, 'star')} className="border-4 border-black p-4 font-black text-lg bg-green-200 hover:bg-green-300 shadow-[4px_4px_0_0_#000]">보변권 (800 S)</button>
                              <button onClick={()=>buyPack('select_skill_ticket', '선변권', 1200, 'star')} className="border-4 border-black p-4 font-black text-lg bg-purple-200 hover:bg-purple-300 shadow-[4px_4px_0_0_#000]">선변권 (1200 S)</button>
                          </div>
                      </div>
                  )}
                  {currentMenu === 'LEAGUE' && (
                      <div className="bg-white border-4 border-black p-16 text-center shadow-[8px_8px_0_0_#000]">
                          <h2 className="text-5xl font-black mb-6 text-blue-800">2026 정규 리그</h2>
                          <button onClick={() => { showToast('리그 우승! 마일리지팩과 상금 획득.'); setMailbox(prev => [{ id: Date.now(), title: '리그 우승 보상', type: 'PACK', packId: 'mileage', amount: 1 }, { id: Date.now()+1, title: '우승 상금', type: 'POINT', amount: 30000 }, ...prev]); setTimeout(()=>handleSave(), 100); }} className="bg-blue-600 text-white border-4 border-black px-16 py-8 text-3xl font-black shadow-[8px_8px_0_0_#000] hover:-translate-y-2">리그 경기 시작</button>
                      </div>
                  )}
              </main>

              {packResultMulti.length > 0 && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4 backdrop-blur-sm overflow-y-auto">
                      <div className="flex flex-col items-center animate-pop-in py-10">
                          <h2 className="text-5xl font-black text-yellow-400 mb-10 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]">선수 영입 결과!</h2>
                          <div className="mb-10 flex flex-wrap justify-center gap-6 max-w-5xl">
                              {packResultMulti.map((p, i) => <BigResultCard key={i} p={p} />)}
                          </div>
                          <button onClick={() => setPackResultMulti([])} className="bg-yellow-400 border-4 border-black px-16 py-4 font-black text-3xl shadow-[6px_6px_0_0_#000] hover:bg-yellow-300 active:translate-y-1">확인</button>
                      </div>
                  </div>
              )}

              {teamSelectModal.isOpen && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
                      <div className="bg-white border-4 border-black p-6 w-full max-w-lg text-center">
                          <h3 className="text-2xl font-black mb-6">원하는 구단을 선택하세요</h3>
                          <div className="grid grid-cols-3 gap-4 mb-6">
                              {TEAMS.map(t => ( <button key={t} onClick={() => { openPack(teamSelectModal.item, t, teamSelectModal.count); setTeamSelectModal({isOpen: false, item: null, count: 1}); setIsModalOpen(false); }} className="border-2 border-black py-3 font-bold hover:bg-yellow-300 active:translate-y-1">{t}</button> ))}
                          </div>
                          <button onClick={()=>setTeamSelectModal({isOpen:false, item:null, count: 1})} className="bg-gray-300 px-6 py-2 border-2 border-black font-bold">취소</button>
                      </div>
                  </div>
              )}

              {settingsModal && (
                  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                      <div className="bg-white border-4 border-black p-8 w-full max-w-sm text-center shadow-[8px_8px_0_0_#000]">
                          <h2 className="text-2xl font-black mb-6">설정</h2>
                          <button onClick={handleReset} className="w-full bg-red-600 text-white border-4 border-black py-3 font-black text-lg mb-4 hover:bg-red-700 shadow-[4px_4px_0_0_#000]">게임 초기화 (데이터 삭제)</button>
                          <button onClick={()=>setSettingsModal(false)} className="w-full bg-gray-200 border-4 border-black py-3 font-black text-lg shadow-[4px_4px_0_0_#000]">닫기</button>
                      </div>
                  </div>
              )}

              {isModalOpen && (
                  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 lg:p-10">
                      <div className="bg-white w-full max-w-5xl sketch-border p-6 relative flex flex-col h-[90vh]">
                          <button onClick={() => setIsModalOpen(false)} className="absolute -top-5 -right-5 bg-red-500 text-white w-12 h-12 border-4 border-black font-black text-xl rounded-full">X</button>
                          <div className="grid grid-cols-2 gap-6 mb-6">
                              <div onClick={() => setModalTab('MAILBOX')} className={`sketch-tab text-xl ${modalTab === 'MAILBOX' ? 'sketch-tab-active' : 'sketch-tab-inactive'}`}>우편함</div>
                              <div onClick={() => setModalTab('INVENTORY')} className={`sketch-tab text-xl ${modalTab === 'INVENTORY' ? 'sketch-tab-active' : 'sketch-tab-inactive'}`}>소지품</div>
                          </div>
                          <div className="sketch-border p-6 flex-1 flex flex-col bg-gray-50 relative overflow-hidden">
                              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-24">
                                  {modalTab === 'MAILBOX' && (
                                      mailbox.map(mail => (
                                          <div key={mail.id} className="sketch-item">
                                              <div className="font-black text-xl">{mail.title}</div>
                                              <div className="font-bold text-blue-700">{mail.type === 'PACK' ? `${mail.amount}장` : mail.amount.toLocaleString()}</div>
                                          </div>
                                      ))
                                  )}
                                  {modalTab === 'INVENTORY' && (
                                      groupedInventory.map(grp => (
                                          <div key={grp.packId} className="sketch-item border-blue-600 bg-blue-50 flex justify-between items-center px-4 py-3 border-b border-gray-300">
                                              <div>
                                                  <div className="font-black text-xl text-blue-900">{grp.name}</div>
                                                  <div className="font-bold text-gray-600 mt-1">수량: {grp.count}개</div>
                                              </div>
                                              <div className="flex gap-2">
                                                  <button onClick={() => { 
                                                      if(grp.packId.includes('skill_ticket')) { showToast("스킬변경권은 '팀 관리 > 고유능력 변경' 에서 사용하세요."); return; }
                                                      const itemToOpen = { id: grp.ids[0], packId: grp.packId }; 
                                                      if(grp.packId === 'team' || grp.packId === 'premium_team') setTeamSelectModal({ isOpen: true, item: itemToOpen, count: 1 }); 
                                                      else { setIsModalOpen(false); openPack(itemToOpen, null, 1); } 
                                                  }} className="bg-white text-black font-black text-md px-4 py-2 border-4 border-black shadow-[3px_3px_0_0_#000] active:translate-y-1">1개 개봉</button>
                                                  
                                                  <button onClick={() => { 
                                                      if(grp.packId.includes('skill_ticket')) { showToast("스킬변경권은 '팀 관리 > 고유능력 변경' 에서 사용하세요."); return; }
                                                      const itemToOpen = { id: grp.ids[0], packId: grp.packId }; 
                                                      if(grp.packId === 'team' || grp.packId === 'premium_team') setTeamSelectModal({ isOpen: true, item: itemToOpen, count: grp.count }); 
                                                      else { setIsModalOpen(false); openPack(itemToOpen, null, grp.count); } 
                                                  }} className="bg-blue-600 text-white font-black text-md px-4 py-2 border-4 border-black shadow-[3px_3px_0_0_#000] active:translate-y-1">모두 개봉</button>
                                              </div>
                                          </div>
                                      ))
                                  )}
                              </div>
                              {modalTab === 'MAILBOX' && (
                                  <div className="absolute bottom-6 right-6">
                                      <button onClick={receiveAllMail} className="bg-white sketch-border px-8 py-4 font-black text-2xl shadow-[6px_6px_0_0_#000] active:translate-y-1">일괄 수령</button>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
    }
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>
