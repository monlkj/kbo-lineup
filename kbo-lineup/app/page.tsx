'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Save, X, Shield, CheckCircle2, ChevronRight, LogOut, Zap, Trophy, Star } from 'lucide-react';

// --- 구단 설정 ---
const KBO_TEAMS = [
  { id: 'ALL', name: '전체', short: '전체' }, { id: 'KIA', name: 'KIA 타이거즈', short: 'KIA' },
  { id: 'SAMSUNG', name: '삼성 라이온즈', short: '삼성' }, { id: 'LG', name: 'LG 트윈스', short: 'LG' },
  { id: 'DOOSAN', name: '두산 베어스', short: '두산' }, { id: 'KT', name: 'KT 위즈', short: 'KT' },
  { id: 'SSG', name: 'SSG 랜더스', short: 'SSG' }, { id: 'LOTTE', name: '롯데 자이언츠', short: '롯데' },
  { id: 'HANWHA', name: '한화 이글스', short: '한화' }, { id: 'NC', name: 'NC 다이노스', short: 'NC' },
  { id: 'KIWOOM', name: '키움 히어로즈', short: '키움' },
];

// --- 등급 시스템 (구프야 감성) ---
const GRADES: Record<string, any> = {
  LEGEND: { key: 'LEGEND', label: '레전드', bg: 'bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-700', text: 'text-white', border: 'border-yellow-400' },
  SIGNATURE: { key: 'SIGNATURE', label: '시그니처', bg: 'bg-gradient-to-br from-fuchsia-600 to-indigo-900', text: 'text-white', border: 'border-fuchsia-400' },
  PLATINUM: { key: 'PLATINUM', label: '플래티넘', bg: 'bg-gradient-to-br from-cyan-400 to-blue-700', text: 'text-white', border: 'border-cyan-300' },
  HERO: { key: 'HERO', label: '히어로', bg: 'bg-gradient-to-br from-rose-500 to-red-800', text: 'text-white', border: 'border-rose-400' },
  RARE: { key: 'RARE', label: '레어', bg: 'bg-gradient-to-br from-blue-400 to-blue-800', text: 'text-white', border: 'border-blue-400' },
  NORMAL: { key: 'NORMAL', label: '노멀', bg: 'bg-gradient-to-br from-gray-400 to-gray-700', text: 'text-white', border: 'border-gray-400' }
};

// --- 슬롯 정의 (26인 로스터) ---
const SLOT_DEFINITIONS = {
  STARTERS: ['DH', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'],
  BENCH: ['BN1', 'BN2', 'BN3', 'BN4', 'BN5'],
  PITCHERS: ['SP1', 'SP2', 'SP3', 'SP4', 'SP5', 'SU1', 'SU2', 'MR1', 'MR2', 'LR', 'LO', 'SETUP', 'CP']
};

const SLOT_LABELS: Record<string, string> = {
  DH: '지명', C: '포수', '1B': '1루수', '2B': '2루수', '3B': '3루수', SS: '유격', LF: '좌익수', CF: '중견수', RF: '우익수',
  BN1: '후보1', BN2: '후보2', BN3: '후보3', BN4: '후보4', BN5: '후보5',
  SP1: '1선발', SP2: '2선발', SP3: '3선발', SP4: '4선발', SP5: '5선발', SU1: '필승1', SU2: '필승2',
  MR1: '추격1', MR2: '추격2', LR: '롱릴', LO: '원포', SETUP: '셋업', CP: '마무리'
};

// --- 데이터베이스 생성 (랜덤 연도, 등급, OVR 부여) ---
const TEAM_ROSTERS: Record<string, string[]> = {
  KIA: ['김도영', '양현종', '나성범', '최형우', '박찬호', '김선빈', '네일', '정해영', '전상현', '장현식', '이종범', '선동열', '이대진'],
  삼성: ['구자욱', '원태인', '강민호', '김영웅', '이재현', '김지찬', '레예스', '오승환', '김재윤', '최지광', '이승엽', '양준혁', '임창용'],
  LG: ['홍창기', '문성주', '김현수', '오스틴', '문보경', '오지환', '박동원', '임찬규', '유영찬', '김진성', '박용택', '이병규', '이상훈'],
  두산: ['양의지', '김택연', '정수빈', '양석환', '강승호', '허경민', '김재환', '곽빈', '정철원', '홍건희', '김동주', '박철순', '더스틴 니퍼트'],
  KT: ['강백호', '고영표', '로하스', '황재균', '장성우', '김상수', '배정대', '쿠에바스', '박영현', '손동현', '유한준', '이진영', '이대은'],
  SSG: ['최정', '김광현', '추신수', '에레디아', '박성한', '최지훈', '한유섬', '엘리아스', '노경은', '조병현', '박경완', '김원형', '정우람'],
  롯데: ['윤동희', '황성빈', '전준우', '레이예스', '나승엽', '고승민', '유강남', '반즈', '윌커슨', '김원중', '최동원', '이대호', '손민한'],
  한화: ['류현진', '노시환', '채은성', '안치홍', '문동주', '김서현', '최재훈', '바리아', '주현상', '박상원', '송진우', '구대성', '정민철'],
  NC: ['박건우', '박민우', '손아섭', '데이비슨', '권희동', '서호철', '김주원', '하트', '카스타노', '이용찬', '에릭 테임즈', '이호준', '나성범'],
  키움: ['김혜성', '송성문', '이주형', '도슨', '고영우', '최주환', '이용규', '후라도', '헤이수스', '조상우', '박병호', '이정후', '서건창']
};

const FULL_DATABASE = (() => {
  const list: any[] = [];
  let id = 1;
  const gradeKeys = ['NORMAL', 'RARE', 'HERO', 'PLATINUM', 'SIGNATURE', 'LEGEND'];
  
  Object.keys(TEAM_ROSTERS).forEach(team => {
    // 팀별 더미 선수 추가 (100명 맞추기)
    const roster = [...TEAM_ROSTERS[team]];
    for(let i=0; i<87; i++) roster.push(`${team}선수${i+1}`);

    roster.forEach((name, idx) => {
      const isPitcher = idx >= 7 && idx <= 15 || idx > 50;
      const pos = isPitcher ? 'P' : ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'][idx % 9];
      
      // 등급 및 OVR 가중치 (핵심 선수는 높게)
      let grade = 'NORMAL';
      let baseOvr = Math.floor(Math.random() * 15) + 60; // 60~75
      const year = 2010 + Math.floor(Math.random() * 15); // 2010~2024
      
      if (idx < 15) { // 이름 있는 실제 선수들
        const rand = Math.random();
        if (idx > 10) { grade = 'LEGEND'; baseOvr = 85 + Math.floor(Math.random() * 10); } // 85~94
        else if (rand > 0.8) { grade = 'SIGNATURE'; baseOvr = 82 + Math.floor(Math.random() * 8); }
        else if (rand > 0.4) { grade = 'PLATINUM'; baseOvr = 78 + Math.floor(Math.random() * 7); }
        else { grade = 'HERO'; baseOvr = 75 + Math.floor(Math.random() * 5); }
      }

      list.push({ id: `kbo-${id++}`, name, team, year, pos, num: (idx % 99) + 1, type: isPitcher ? 'PITCHER' : 'BATTER', grade, baseOvr });
    });
  });
  return list;
})();

export default function KBOSquadMakerCardGame() {
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [loginInput, setLoginInput] = useState('');
  const [currentTab, setCurrentTab] = useState<'STARTERS' | 'PITCHERS' | 'BENCH'>('STARTERS');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const emptyLineup: Record<string, any> = {};
  [...SLOT_DEFINITIONS.STARTERS, ...SLOT_DEFINITIONS.BENCH, ...SLOT_DEFINITIONS.PITCHERS].forEach(k => emptyLineup[k] = null);
  
  const [lineup, setLineup] = useState(emptyLineup);

  // --- 세트덱 계산 시스템 ---
  const deckEffect = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalAssigned = 0;
    Object.values(lineup).forEach(p => {
      if (p) { counts[p.team] = (counts[p.team] || 0) + 1; totalAssigned++; }
    });

    let maxTeam = '없음', maxCount = 0;
    Object.entries(counts).forEach(([team, cnt]) => {
      if (cnt > maxCount) { maxCount = cnt; maxTeam = team; }
    });

    let buff = 0, tier = '효과 없음';
    if (maxCount >= 26) { buff = 12; tier = 'S등급'; }
    else if (maxCount >= 20) { buff = 8; tier = 'A등급'; }
    else if (maxCount >= 14) { buff = 5; tier = 'B등급'; }
    else if (maxCount >= 8) { buff = 2; tier = 'C등급'; }

    return { team: maxTeam, count: maxCount, buff, tier, totalAssigned };
  }, [lineup]);

  const showToast = (msg: string) => {
    setToastMessage(msg); setTimeout(() => setToastMessage(null), 2500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = loginInput.trim().toLowerCase();
    if (!code) return;
    setActiveCode(code);
    try {
      const saved = localStorage.getItem(`kbo_card_lineup_${code}`);
      if (saved) { setLineup({ ...emptyLineup, ...JSON.parse(saved).lineup }); showToast(`[${code}] 라인업 복구 완료!`); }
    } catch (e) {}
  };

  const handleSave = () => {
    if (!activeCode) return;
    localStorage.setItem(`kbo_card_lineup_${activeCode}`, JSON.stringify({ lineup, updatedAt: new Date().toISOString() }));
    showToast(`라인업 및 덱 효과 영구 저장 완료!`);
  };

  const filteredPlayers = useMemo(() => FULL_DATABASE.filter(p => (selectedTeam === 'ALL' || p.team === selectedTeam) && p.name.includes(searchKeyword.trim())), [selectedTeam, searchKeyword]);

  if (!activeCode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex justify-center items-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500" />
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          <h1 className="text-3xl font-black text-center mb-2 tracking-tight">KBO 프야 매니저</h1>
          <p className="text-center text-slate-400 text-sm mb-6">세트덱을 맞추고 최고의 카드를 수집하세요</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="팀 구단주 코드 입력 (예: v12-tigers)" value={loginInput} onChange={(e) => setLoginInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-white outline-none focus:border-blue-500 font-bold" required />
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50">
              구단주 로그인 <ChevronRight size={20} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col xl:flex-row h-screen overflow-hidden font-sans">
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600/90 backdrop-blur-sm text-white font-bold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-400">
          <CheckCircle2 size={18} /> {toastMessage}
        </div>
      )}

      {/* 왼쪽 메인 패널 */}
      <div className="flex-1 flex flex-col h-full bg-slate-900 border-r border-slate-800">
        
        {/* 상단 덱 버프 대시보드 */}
        <header className="p-4 border-b border-slate-800 bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-slate-800 px-4 py-2 rounded-xl flex flex-col border border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold">적용중인 세트덱</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-blue-400">{deckEffect.team} 단일팀</span>
                {deckEffect.buff > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">{deckEffect.tier}</span>}
              </div>
            </div>
            {deckEffect.buff > 0 && (
              <div className="flex items-center gap-1.5 text-yellow-400 bg-yellow-400/10 px-3 py-2 rounded-xl border border-yellow-400/30">
                <Zap size={18} className="animate-pulse" />
                <span className="font-black text-sm">전체 OVR +{deckEffect.buff}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg"><Save size={16} /> 구단 저장</button>
            <button onClick={() => setActiveCode(null)} className="bg-slate-800 hover:bg-rose-900/50 px-4 py-2.5 rounded-xl text-sm border border-slate-700"><LogOut size={16} /></button>
          </div>
        </header>

        {/* 탭 네비게이션 */}
        <div className="flex justify-center bg-slate-800/50 p-2 border-b border-slate-800">
          <div className="flex gap-2 bg-slate-950 p-1 rounded-xl">
            <button onClick={() => setCurrentTab('STARTERS')} className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${currentTab === 'STARTERS' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500'}`}>주전 9명</button>
            <button onClick={() => setCurrentTab('PITCHERS')} className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${currentTab === 'PITCHERS' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500'}`}>투수 12명</button>
            <button onClick={() => setCurrentTab('BENCH')} className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${currentTab === 'BENCH' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500'}`}>후보 5명</button>
          </div>
        </div>

        {/* 탭 1: 주전 그라운드 뷰 */}
        {currentTab === 'STARTERS' && (
          <div className="flex-1 relative flex justify-center items-center p-4 overflow-hidden bg-slate-900">
            <div className="relative w-full max-w-[650px] aspect-[4/5] bg-gradient-to-t from-[#143c1b] to-[#1e5a28] rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl">
              <div className="absolute w-[440px] h-[440px] rounded-full bg-[#8c532b] bottom-[30px] left-1/2 -translate-x-1/2 border-4 border-[#73401d]" />
              <div className="absolute w-[240px] h-[240px] bg-[#1a4a22] bottom-[130px] left-1/2 -translate-x-1/2 rotate-45 border-2 border-white/50 shadow-inner" />
              
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <span className="bg-slate-900/80 backdrop-blur-sm text-slate-300 text-xs px-5 py-2 rounded-full border border-slate-700 shadow-xl">
                  {activeSlot ? `우측 명단에서 [${SLOT_LABELS[activeSlot]}] 선수를 영입하세요` : '포지션 원을 클릭하여 카드를 배치하세요'}
                </span>
              </div>

              {[
                { role: 'CF', b: '75%', l: '50%' }, { role: 'LF', b: '64%', l: '18%' }, { role: 'RF', b: '64%', l: '82%' },
                { role: 'SS', b: '50%', l: '33%' }, { role: '2B', b: '50%', l: '67%' }, { role: '3B', b: '36%', l: '18%' },
                { role: '1B', b: '36%', l: '82%' }, { role: 'C', b: '10%', l: '50%' }, { role: 'DH', b: '10%', l: '15%' }
              ].map(pos => {
                const p = lineup[pos.role];
                const g = p ? GRADES[p.grade] : null;
                const finalOvr = p ? p.baseOvr + deckEffect.buff : 0;
                
                return (
                  <div key={pos.role} onClick={() => setActiveSlot(pos.role)} className="absolute flex flex-col items-center -translate-x-1/2 translate-y-1/2 z-10 cursor-pointer group" style={{ bottom: pos.b, left: pos.l }}>
                    {!p ? (
                      <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center font-black text-sm transition-all ${activeSlot === pos.role ? 'bg-blue-600 border-white shadow-[0_0_20px_blue] scale-110 z-20' : 'bg-slate-900/80 border-slate-500/50 text-slate-400 group-hover:bg-slate-800'}`}>{pos.role}</div>
                    ) : (
                      <div className={`relative w-24 h-32 ${g.bg} rounded-lg border-2 ${g.border} shadow-2xl flex flex-col justify-between p-1.5 transition-transform hover:scale-105 hover:z-30`}>
                        <div className="flex justify-between items-start">
                          <span className={`text-[9px] font-black bg-black/50 px-1 rounded ${g.text}`}>{p.year}</span>
                          <button onClick={(e) => { e.stopPropagation(); setLineup(prev => ({...prev, [pos.role]: null})); }} className="text-white/50 hover:text-white bg-black/30 rounded-full p-0.5"><X size={12} /></button>
                        </div>
                        <div className="text-center">
                          <div className={`font-black text-2xl tracking-tighter ${g.text} drop-shadow-md`}>{finalOvr}</div>
                          <div className="text-[10px] font-bold text-white/80">{pos.role}</div>
                        </div>
                        <div className="bg-black/60 rounded p-1 text-center backdrop-blur-sm">
                          <div className="text-[9px] text-gray-300">{p.team}</div>
                          <div className="text-xs font-black text-white truncate">{p.name}</div>
                        </div>
                        {deckEffect.buff > 0 && <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-rose-300">+{deckEffect.buff}</div>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 탭 2 & 3: 투수진 & 후보 (리스트 뷰) */}
        {currentTab !== 'STARTERS' && (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {(currentTab === 'PITCHERS' ? SLOT_DEFINITIONS.PITCHERS : SLOT_DEFINITIONS.BENCH).map(slotKey => {
                const p = lineup[slotKey];
                const g = p ? GRADES[p.grade] : null;
                const finalOvr = p ? p.baseOvr + deckEffect.buff : 0;

                return (
                  <div key={slotKey} onClick={() => setActiveSlot(slotKey)} className={`relative flex items-center p-3 rounded-2xl border-2 cursor-pointer transition-all ${activeSlot === slotKey ? 'border-blue-500 bg-blue-900/20' : 'border-slate-800 bg-slate-950 hover:border-slate-600'}`}>
                    <div className="w-14 text-center mr-4">
                      <span className="block text-[10px] text-slate-500 font-bold mb-1">{SLOT_LABELS[slotKey]}</span>
                      <span className="block font-black text-slate-300 bg-slate-800 rounded py-1">{slotKey}</span>
                    </div>
                    
                    {p ? (
                      <div className={`flex-1 flex items-center justify-between p-2 rounded-xl ${g.bg} border ${g.border} shadow-inner`}>
                        <div className="flex items-center gap-3">
                          <div className="text-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                            <span className="block text-[10px] text-white/70 font-bold">OVR</span>
                            <span className={`block font-black text-xl ${g.text}`}>{finalOvr}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-bold text-white/70 bg-black/30 px-1.5 py-0.5 rounded">{p.year} {p.team}</span>
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded border border-white/30" style={{color: g.border.replace('border-','')}}>{g.label}</span>
                            </div>
                            <div className="font-black text-white text-base">{p.name}</div>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setLineup(prev => ({...prev, [slotKey]: null})); }} className="mr-2 text-white/50 hover:text-white bg-black/20 p-1.5 rounded-full"><X size={16} /></button>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-4 border border-dashed border-slate-700 rounded-xl bg-slate-900/50">
                        <span className="text-sm font-bold text-slate-500">선수 미배치</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 오른쪽: 선수 카드 뽑기(검색) 패널 */}
      <div className="w-full xl:w-[450px] bg-slate-950 border-l border-slate-800 flex flex-col h-full shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
        <div className="p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input type="text" placeholder="선수 검색..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500 font-bold shadow-inner" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
            {KBO_TEAMS.map(team => (
              <button key={team.id} onClick={() => setSelectedTeam(team.short === '전체' ? 'ALL' : team.short)} 
                className={`px-4 py-2 rounded-xl font-black whitespace-nowrap transition-all ${selectedTeam === team.short || (selectedTeam === 'ALL' && team.id === 'ALL') ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                {team.short}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-950">
          {filteredPlayers.slice(0, 100).map(p => {
            const g = GRADES[p.grade];
            return (
              <div key={p.id} onClick={() => { if(activeSlot) { setLineup(prev => ({...prev, [activeSlot]: p})); setActiveSlot(null); } else alert('좌측에서 배치할 슬롯을 먼저 선택하세요.'); }} 
                className={`relative flex justify-between items-center p-3 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] border-2 ${g.border} ${g.bg} shadow-lg overflow-hidden group`}>
                
                {/* 카드 빛반사 이펙트 */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-full group-hover:translate-x-full duration-700" />
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="text-center bg-black/40 px-3 py-2 rounded-xl border border-white/10 shadow-inner">
                    <span className="block text-[10px] text-white/70 font-bold">OVR</span>
                    <span className={`block font-black text-2xl ${g.text}`}>{p.baseOvr}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-black text-white bg-black/40 px-1.5 py-0.5 rounded">{p.year}</span>
                      <span className="text-[10px] font-black text-white bg-black/40 px-1.5 py-0.5 rounded">{p.team}</span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded border border-white/40 bg-black/40" style={{color: g.border.replace('border-','')}}>{g.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-black/30 flex items-center justify-center font-black text-[10px] text-white/80 border border-white/20">{p.pos}</span>
                      <span className="font-black text-lg text-white drop-shadow-md">{p.name}</span>
                    </div>
                  </div>
                </div>
                <button className="relative z-10 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-black backdrop-blur-sm border border-white/20">영입</button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
