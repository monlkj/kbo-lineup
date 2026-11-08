'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, Users, Home, Zap, 
  Shield, CheckCircle2, ChevronRight, LogOut, PackageOpen, X
} from 'lucide-react';

// --- 실제 KBO 현역 및 레전드 로스터 (Vercel 에러 방지를 위해 고정 값으로 생성) ---
const TEAM_ROSTERS: Record<string, string[]> = {
  KIA: ['김도영', '양현종', '나성범', '최형우', '박찬호', '김선빈', '이우성', '소크라테스', '네일', '크로우', '정해영', '전상현', '장현식', '곽도규', '최지민', '이준영', '윤영철', '황동하', '한준수', '김태군', '이종범', '선동열', '이대진', '김성한', '이순철'],
  삼성: ['구자욱', '원태인', '강민호', '김영웅', '이재현', '김지찬', '디아즈', '코너', '레예스', '류지혁', '오승환', '김재윤', '임창민', '최지광', '우규민', '이승엽', '양준혁', '배영수', '임창용', '박한이'],
  LG: ['홍창기', '문성주', '김현수', '오스틴', '문보경', '오지환', '박동원', '박해민', '신민재', '구본혁', '임찬규', '최원태', '엔스', '에르난데스', '손주영', '유영찬', '김진성', '백승현', '정우영', '함덕주', '박용택', '이병규', '이상훈'],
  두산: ['양의지', '김택연', '정수빈', '양석환', '강승호', '허경민', '김재환', '라모스', '전민재', '조수행', '곽빈', '발라조빅', '시라카와', '최원준', '이영하', '이병헌', '최지강', '홍건희', '김강률', '박치국', '김동주', '박철순', '홍성흔'],
  KT: ['강백호', '고영표', '로하스', '황재균', '장성우', '김상수', '배정대', '문상철', '오윤석', '천성호', '쿠에바스', '벤자민', '엄상백', '원상현', '육청명', '박영현', '손동현', '김민', '김민수', '주권', '유한준', '이진영', '박경수'],
  SSG: ['최정', '김광현', '추신수', '에레디아', '박성한', '최지훈', '한유섬', '이지영', '고명준', '하재훈', '앤더슨', '엘리아스', '오원석', '송영진', '박종훈', '노경은', '조병현', '이로운', '문승원', '서진용', '박경완', '김원형', '정우람'],
  롯데: ['윤동희', '황성빈', '전준우', '레이예스', '나승엽', '손호영', '고승민', '박승욱', '유강남', '손성빈', '반즈', '윌커슨', '박세웅', '김진욱', '나균안', '김원중', '구승민', '전미르', '김상수', '진해수', '최동원', '이대호', '염종석'],
  한화: ['류현진', '노시환', '채은성', '안치홍', '문동주', '김서현', '황영묵', '최재훈', '이도윤', '페라자', '와이스', '바리아', '엄상백', '김민우', '주현상', '한승혁', '박상원', '이민우', '김범수', '장시환', '송진우', '구대성', '정민철'],
  NC: ['박건우', '박민우', '손아섭', '데이비슨', '권희동', '서호철', '김주원', '김형준', '김성욱', '천재환', '하트', '카스타노', '신민혁', '이재학', '김시훈', '이용찬', '김재열', '류진욱', '김영규', '임정호', '에릭 테임즈', '이호준', '나성범'],
  키움: ['김혜성', '송성문', '이주형', '도슨', '고영우', '김건희', '이형종', '최주환', '임병욱', '이용규', '후라도', '헤이수스', '하영민', '김인범', '조상우', '김성민', '김재웅', '문성현', '주승우', '전준표', '박병호', '이정후', '강정호']
};

// Vercel 에러 방지를 위해 난수(Math.random) 없이 고정 공식으로 전체 DB 생성
const FULL_DATABASE = (() => {
  const list: any[] = [];
  let id = 1;
  Object.keys(TEAM_ROSTERS).forEach(team => {
    TEAM_ROSTERS[team].forEach((name, idx) => {
      const isPitcher = (idx >= 10 && idx <= 19);
      const pos = isPitcher ? 'P' : ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'][idx % 9];
      
      let grade = 'NORMAL';
      let baseOvr = 65 + (idx % 10);
      
      if (idx === 20 || idx === 0) { grade = 'LEGEND'; baseOvr = 95 - (idx % 3); } 
      else if (idx < 3) { grade = 'SIGNATURE'; baseOvr = 88 - (idx % 3); } 
      else if (idx < 7) { grade = 'PLATINUM'; baseOvr = 82 - (idx % 3); } 
      else { grade = ['HERO', 'RARE', 'NORMAL'][idx % 3]; }

      list.push({ id: `kbo-${id++}`, name, team, pos, grade, ovr: baseOvr });
    });
  });
  return list;
})();

// 등급별 디자인 스타일
const GRADE_STYLE: Record<string, any> = {
  LEGEND: { bg: 'bg-gradient-to-br from-yellow-300 to-yellow-600', border: 'border-yellow-400', text: 'text-yellow-900' },
  SIGNATURE: { bg: 'bg-gradient-to-br from-purple-500 to-indigo-900', border: 'border-purple-400', text: 'text-white' },
  PLATINUM: { bg: 'bg-gradient-to-br from-cyan-400 to-blue-700', border: 'border-cyan-300', text: 'text-white' },
  HERO: { bg: 'bg-gradient-to-br from-rose-500 to-red-800', border: 'border-rose-400', text: 'text-white' },
  RARE: { bg: 'bg-gradient-to-br from-blue-400 to-blue-800', border: 'border-blue-400', text: 'text-white' },
  NORMAL: { bg: 'bg-slate-500', border: 'border-slate-400', text: 'text-white' }
};

export default function KBOManagerGame() {
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [loginInput, setLoginInput] = useState('');
  const [currentMenu, setCurrentMenu] = useState('HOME');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- 유저 데이터 상태 ---
  const [myInventory, setMyInventory] = useState<any[]>([]); // 뽑은 선수들
  const [lineup, setLineup] = useState<Record<string, any>>({
    CF: null, LF: null, RF: null, SS: null, '2B': null, '3B': null, '1B': null, C: null, DH: null, P: null
  });
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [drawnPlayer, setDrawnPlayer] = useState<any | null>(null); // 방금 뽑은 선수

  const showToast = (msg: string) => {
    setToastMessage(msg); setTimeout(() => setToastMessage(null), 2500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) return;
    const code = loginInput.trim().toLowerCase();
    setActiveCode(code);
    
    const saved = localStorage.getItem(`kbo_game_${code}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setLineup(parsed.lineup || lineup);
      setMyInventory(parsed.inventory || []);
      showToast('구단 데이터를 불러왔습니다!');
    } else {
      showToast('신규 구단 창단을 환영합니다!');
    }
  };

  const handleSave = () => {
    if (!activeCode) return;
    localStorage.setItem(`kbo_game_${activeCode}`, JSON.stringify({ lineup, inventory: myInventory }));
    showToast('구단 데이터가 영구 저장되었습니다!');
  };

  // ⚾ 선수 뽑기 (가챠 시스템)
  const drawPlayer = () => {
    // 여기서만 Math.random()을 써서 Vercel 에러를 완벽히 피함
    const randomIdx = Math.floor(Math.random() * FULL_DATABASE.length);
    const newPlayer = { ...FULL_DATABASE[randomIdx], uniqueId: Date.now() };
    
    setDrawnPlayer(newPlayer);
    setMyInventory(prev => [newPlayer, ...prev]);
    showToast(`${newPlayer.name} 선수를 영입했습니다!`);
  };

  // 로그인 화면
  if (!activeCode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex justify-center items-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-center mb-6">KBO 프야 매니저</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="text" placeholder="구단주 코드 입력 (예: tigers-v12)" value={loginInput} onChange={(e) => setLoginInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-white outline-none focus:border-blue-500 font-bold" required />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl flex justify-center gap-2">
              로그인 <ChevronRight size={20} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 font-bold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
          <CheckCircle2 size={18} /> {toastMessage}
        </div>
      )}

      {/* 헤더 */}
      <header className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="text-blue-500" size={24} />
          <div><div className="text-xs font-bold text-slate-400">CODE: {activeCode}</div><div className="font-black">내 구단 관리</div></div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="bg-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold">저장</button>
          <button onClick={() => setActiveCode(null)} className="bg-slate-800 px-3 py-1.5 rounded-lg text-xs"><LogOut size={14} /></button>
        </div>
      </header>

      {/* 메인 화면 영역 */}
      <main className="flex-1 overflow-y-auto flex flex-col relative">
        
        {/* 1. 홈(HOME) 뷰 */}
        {currentMenu === 'HOME' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 mb-8">KBO 매니저 2026</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-lg">
              <button onClick={() => setCurrentMenu('DRAFT')} className="bg-gradient-to-br from-rose-600 to-purple-800 p-8 rounded-3xl border border-rose-400/30 hover:scale-105 transition-transform shadow-2xl flex flex-col items-center">
                <PackageOpen size={48} className="text-yellow-400 mb-4" />
                <span className="text-2xl font-black">스카우트 (뽑기)</span>
                <span className="text-rose-200 mt-2 text-sm">새로운 선수를 영입하세요</span>
              </button>
              <button onClick={() => setCurrentMenu('LINEUP')} className="bg-gradient-to-br from-emerald-600 to-teal-900 p-8 rounded-3xl border border-emerald-400/30 hover:scale-105 transition-transform shadow-2xl flex flex-col items-center">
                <Users size={48} className="text-white mb-4" />
                <span className="text-2xl font-black">라인업 관리</span>
                <span className="text-emerald-200 mt-2 text-sm">보유 선수로 그라운드 배치</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. 스카우트 (뽑기) 뷰 */}
        {currentMenu === 'DRAFT' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <h2 className="text-2xl font-black mb-8">스카우트 센터</h2>
            
            {/* 뽑힌 선수 카드 연출 */}
            {drawnPlayer ? (
              <div className={`w-48 h-64 ${GRADE_STYLE[drawnPlayer.grade].bg} rounded-xl border-4 ${GRADE_STYLE[drawnPlayer.grade].border} flex flex-col items-center justify-center p-4 shadow-[0_0_40px_rgba(255,255,255,0.2)] animate-bounce mb-8`}>
                <span className="bg-black/50 px-2 py-1 rounded text-xs font-bold mb-2">{drawnPlayer.team} | {drawnPlayer.pos}</span>
                <span className="text-4xl font-black mb-2">{drawnPlayer.ovr}</span>
                <span className={`text-2xl font-black ${GRADE_STYLE[drawnPlayer.grade].text}`}>{drawnPlayer.name}</span>
                <span className="mt-4 text-xs font-bold">{drawnPlayer.grade}</span>
              </div>
            ) : (
              <div className="w-48 h-64 bg-slate-800 rounded-xl border-4 border-slate-700 flex items-center justify-center mb-8">
                <PackageOpen size={48} className="text-slate-600" />
              </div>
            )}

            <button onClick={drawPlayer} className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 rounded-2xl font-black text-xl shadow-lg hover:scale-105 transition-transform">
              1회 영입하기 (무료)
            </button>
          </div>
        )}

        {/* 3. 라인업 배치 (그라운드 + 인벤토리) 뷰 */}
        {currentMenu === 'LINEUP' && (
          <div className="flex-1 flex flex-col xl:flex-row h-full overflow-hidden">
            
            {/* 그라운드 영역 */}
            <div className="flex-1 flex items-center justify-center p-4 bg-slate-900 border-r border-slate-800 relative">
              <div className="relative w-full max-w-[500px] aspect-[4/5] bg-[#1e4620] rounded-3xl overflow-hidden border-4 border-[#122814] shadow-2xl">
                <div className="absolute w-[400px] h-[400px] rounded-full bg-[#8c532b] bottom-[30px] left-1/2 -translate-x-1/2 border-4 border-[#73401d]" />
                <div className="absolute w-[220px] h-[220px] bg-[#1e4620] bottom-[120px] left-1/2 -translate-x-1/2 rotate-45 border-2 border-white/50" />
                
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                  <span className="bg-black/80 text-white text-xs px-4 py-2 rounded-full font-bold shadow-lg border border-slate-700">
                    {activeSlot ? `우측 보유 명단에서 [${activeSlot}] 선수를 클릭하세요` : '포지션을 클릭하여 선수를 배치하세요'}
                  </span>
                </div>

                {[
                  { role: 'CF', b: '75%', l: '50%' }, { role: 'LF', b: '64%', l: '18%' }, { role: 'RF', b: '64%', l: '82%' },
                  { role: 'SS', b: '50%', l: '33%' }, { role: '2B', b: '50%', l: '67%' }, { role: '3B', b: '36%', l: '18%' },
                  { role: '1B', b: '36%', l: '82%' }, { role: 'P', b: '38%', l: '50%' }, { role: 'C', b: '10%', l: '50%' }, { role: 'DH', b: '10%', l: '15%' }
                ].map(pos => {
                  const p = lineup[pos.role];
                  return (
                    <div key={pos.role} onClick={() => setActiveSlot(pos.role)} className="absolute flex flex-col items-center -translate-x-1/2 translate-y-1/2 z-10 cursor-pointer" style={{ bottom: pos.b, left: pos.l }}>
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-sm transition-all ${activeSlot === pos.role ? 'bg-blue-600 border-white scale-110 z-20' : 'bg-slate-900 border-slate-500'}`}>
                        {pos.role}
                      </div>
                      {p && (
                        <div className={`mt-1 flex flex-col items-center p-1 rounded border-2 shadow-lg ${GRADE_STYLE[p.grade].bg} ${GRADE_STYLE[p.grade].border}`}>
                          <div className="flex justify-between w-full">
                            <span className="text-[10px] font-black">{p.ovr}</span>
                            <button onClick={(e) => { e.stopPropagation(); setLineup(prev => ({...prev, [pos.role]: null})); }} className="text-black/50 hover:text-black"><X size={12} /></button>
                          </div>
                          <span className={`text-xs font-black truncate w-14 text-center ${GRADE_STYLE[p.grade].text}`}>{p.name}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 우측 인벤토리 (내가 뽑은 선수 목록) */}
            <div className="w-full xl:w-[400px] bg-slate-950 flex flex-col h-[50%] xl:h-full">
              <div className="p-4 border-b border-slate-800 bg-slate-900">
                <h3 className="font-black flex items-center gap-2"><Zap size={18} className="text-yellow-400" /> 내 보관함 (총 {myInventory.length}명)</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {myInventory.length === 0 ? (
                  <div className="text-center text-slate-500 mt-10 text-sm font-bold">
                    보유한 선수가 없습니다.<br/>[스카우트] 메뉴에서 카드를 뽑아주세요!
                  </div>
                ) : (
                  myInventory.map(p => {
                    const isPlaced = Object.values(lineup).some(placed => placed?.uniqueId === p.uniqueId);
                    return (
                      <div key={p.uniqueId} 
                        onClick={() => { 
                          if(isPlaced) { alert('이미 라인업에 배치된 선수입니다.'); return; }
                          if(activeSlot) { setLineup(prev => ({...prev, [activeSlot]: p})); setActiveSlot(null); } 
                          else { alert('그라운드에서 배치할 위치(동그라미)를 먼저 클릭하세요!'); }
                        }} 
                        className={`relative flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${isPlaced ? 'opacity-40 grayscale border-slate-800' : 'hover:scale-[1.02] border-slate-700 bg-slate-900'} ${GRADE_STYLE[p.grade].border}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black ${GRADE_STYLE[p.grade].bg} ${GRADE_STYLE[p.grade].text}`}>{p.ovr}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-slate-800 px-1 rounded">{p.team}</span>
                              <span className="text-[10px] bg-slate-800 px-1 rounded">{p.pos}</span>
                            </div>
                            <div className="font-black text-sm mt-0.5">{p.name} <span className="text-[10px] text-slate-400 ml-1">{p.grade}</span></div>
                          </div>
                        </div>
                        {isPlaced ? <span className="text-xs font-bold text-slate-500">배치됨</span> : <button className="bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold">선택</button>}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* 하단 네비게이션 탭 */}
      <nav className="bg-slate-950 border-t border-slate-800 flex justify-around p-2 pb-safe">
        <button onClick={() => setCurrentMenu('HOME')} className={`flex flex-col items-center p-2 w-20 transition-colors ${currentMenu === 'HOME' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <Home size={24} className="mb-1" />
          <span className="text-[10px] font-bold">홈</span>
        </button>
        <button onClick={() => setCurrentMenu('DRAFT')} className={`flex flex-col items-center p-2 w-20 transition-colors ${currentMenu === 'DRAFT' ? 'text-rose-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <PackageOpen size={24} className="mb-1" />
          <span className="text-[10px] font-bold">스카우트</span>
        </button>
        <button onClick={() => setCurrentMenu('LINEUP')} className={`flex flex-col items-center p-2 w-20 transition-colors ${currentMenu === 'LINEUP' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <Users size={24} className="mb-1" />
          <span className="text-[10px] font-bold">라인업</span>
        </button>
      </nav>
    </div>
  );
}
