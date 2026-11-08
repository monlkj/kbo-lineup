'use client';

import React, { useState, useMemo } from 'react';
import { Search, Save, LogIn, X, Shield, CheckCircle2, ChevronRight, LogOut } from 'lucide-react';

const KBO_TEAMS = [
  { id: 'ALL', name: '전체', short: '전체', color: '#4B5563' },
  { id: 'KIA', name: 'KIA 타이거즈', short: 'KIA', color: '#EA0029' },
  { id: 'SAMSUNG', name: '삼성 라이온즈', short: '삼성', color: '#074CA1' },
  { id: 'LG', name: 'LG 트윈스', short: 'LG', color: '#C30452' },
  { id: 'DOOSAN', name: '두산 베어스', short: '두산', color: '#131230' },
  { id: 'KT', name: 'KT 위즈', short: 'KT', color: '#000000' },
  { id: 'SSG', name: 'SSG 랜더스', short: 'SSG', color: '#CE0E2D' },
  { id: 'LOTTE', name: '롯데 자이언츠', short: '롯데', color: '#041E42' },
  { id: 'HANWHA', name: '한화 이글스', short: '한화', color: '#FF6600' },
  { id: 'NC', name: 'NC 다이노스', short: 'NC', color: '#315288' },
  { id: 'KIWOOM', name: '키움 히어로즈', short: '키움', color: '#570514' },
];

const SLOT_DEFINITIONS = {
  STARTERS: [
    { key: 'DH', label: '지명타자' }, { key: 'C', label: '포수' }, { key: '1B', label: '1루수' },
    { key: '2B', label: '2루수' }, { key: '3B', label: '3루수' }, { key: 'SS', label: '유격수' },
    { key: 'LF', label: '좌익수' }, { key: 'CF', label: '중견수' }, { key: 'RF', label: '우익수' },
  ],
  BENCH: [
    { key: 'BN1', label: '후보 1' }, { key: 'BN2', label: '후보 2' }, { key: 'BN3', label: '후보 3' },
    { key: 'BN4', label: '후보 4' }, { key: 'BN5', label: '후보 5' },
  ],
  PITCHERS: [
    { key: 'SP1', label: '1선발' }, { key: 'SP2', label: '2선발' }, { key: 'SP3', label: '3선발' },
    { key: 'SP4', label: '4선발' }, { key: 'SP5', label: '5선발' }, { key: 'SU1', label: '필승조 1' },
    { key: 'SU2', label: '필승조 2' }, { key: 'MR1', label: '추격조 1' }, { key: 'MR2', label: '추격조 2' },
    { key: 'LR', label: '롱릴리프' }, { key: 'LO', label: '원포인트' }, { key: 'SETUP', label: '셋업맨' },
    { key: 'CP', label: '마무리' },
  ]
};

const TEAM_ROSTERS: Record<string, string[]> = {
  KIA: ['김도영', '양현종', '나성범', '최형우', '박찬호', '김선빈', '이우성', '소크라테스', '네일', '크로우', '정해영', '전상현', '장현식', '곽도규', '최지민', '이종범', '선동열', '이대진', '김성한', '이순철'],
  삼성: ['구자욱', '원태인', '강민호', '김영웅', '이재현', '김지찬', '디아즈', '코너', '레예스', '류지혁', '오승환', '김재윤', '임창민', '최지광', '우규민', '이승엽', '양준혁', '배영수', '임창용', '박한이'],
  LG: ['홍창기', '문성주', '김현수', '오스틴', '문보경', '오지환', '박동원', '박해민', '신민재', '구본혁', '임찬규', '최원태', '엔스', '에르난데스', '손주영', '박용택', '이병규', '이상훈', '김용수', '조인성'],
  두산: ['양의지', '김택연', '정수빈', '양석환', '강승호', '허경민', '김재환', '라모스', '전민재', '조수행', '곽빈', '발라조빅', '시라카와', '최원준', '이영하', '김동주', '박철순', '더스틴 니퍼트', '홍성흔', '오재원'],
  KT: ['강백호', '고영표', '로하스', '황재균', '장성우', '김상수', '배정대', '문상철', '오윤석', '천성호', '쿠에바스', '벤자민', '엄상백', '원상현', '육청명', '유한준', '이진영', '박경수', '이대은', '김재윤'],
  SSG: ['최정', '김광현', '추신수', '에레디아', '박성한', '최지훈', '한유섬', '이지영', '고명준', '하재훈', '앤더슨', '엘리아스', '오원석', '송영진', '박종훈', '박경완', '김원형', '정우람', '조웅천', '박재홍'],
  롯데: ['윤동희', '황성빈', '전준우', '레이예스', '나승엽', '손호영', '고승민', '박승욱', '유강남', '손성빈', '반즈', '윌커슨', '박세웅', '김진욱', '나균안', '최동원', '이대호', '염종석', '마해영', '박정태'],
  한화: ['류현진', '노시환', '채은성', '안치홍', '문동주', '김서현', '황영묵', '최재훈', '이도윤', '페라자', '와이스', '바리아', '엄상백', '김민우', '주현상', '송진우', '구대성', '정민철', '장종훈', '김태균'],
  NC: ['박건우', '박민우', '손아섭', '데이비슨', '권희동', '서호철', '김주원', '김형준', '김성욱', '천재환', '하트', '카스타노', '신민혁', '이재학', '김시훈', '에릭 테임즈', '이호준', '이종욱', '손시헌', '나성범'],
  키움: ['김혜성', '송성문', '이주형', '도슨', '고영우', '김건희', '이형종', '최주환', '임병욱', '이용규', '후라도', '헤이수스', '하영민', '김인범', '조상우', '박병호', '이정후', '강정호', '서건창', '유한준']
};

const FULL_DATABASE = (() => {
  const list: any[] = [];
  let id = 1;
  Object.keys(TEAM_ROSTERS).forEach(team => {
    TEAM_ROSTERS[team].forEach((name, idx) => {
      const isPitcher = idx >= 10 && idx <= 14;
      const pos = isPitcher ? 'P' : ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'][idx % 9];
      list.push({ id: `kbo-${id++}`, name, team, pos, num: (idx % 98) + 1, type: isPitcher ? 'PITCHER' : 'BATTER' });
    });
  });
  return list;
})();

export default function KBOSquadMakerFull() {
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [loginInput, setLoginInput] = useState('');
  const [currentTab, setCurrentTab] = useState<'STARTERS' | 'PITCHERS' | 'BENCH'>('STARTERS');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const emptyLineup: Record<string, any> = {
    DH: null, C: null, '1B': null, '2B': null, '3B': null, SS: null, LF: null, CF: null, RF: null,
    BN1: null, BN2: null, BN3: null, BN4: null, BN5: null,
    SP1: null, SP2: null, SP3: null, SP4: null, SP5: null, SU1: null, SU2: null, MR1: null, MR2: null, LR: null, LO: null, SETUP: null, CP: null
  };
  const [lineup, setLineup] = useState(emptyLineup);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = loginInput.trim().toLowerCase();
    if (!code) return;
    setActiveCode(code);
    try {
      const saved = localStorage.getItem(`kbo_v2_lineup_${code}`);
      if (saved) {
        setLineup({ ...emptyLineup, ...JSON.parse(saved).lineup });
        showToast(`팀 코드 [${code}]의 라인업을 불러왔습니다.`);
      }
    } catch (e) {}
  };

  const handleSave = () => {
    if (!activeCode) return;
    localStorage.setItem(`kbo_v2_lineup_${activeCode}`, JSON.stringify({ lineup, updatedAt: new Date().toISOString() }));
    showToast(`라인업이 [${activeCode}] 계정에 영구 저장되었습니다!`);
  };

  const filteredPlayers = useMemo(() => FULL_DATABASE.filter(p => (selectedTeam === 'ALL' || p.team === selectedTeam) && p.name.includes(searchKeyword.trim())), [selectedTeam, searchKeyword]);

  if (!activeCode) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-[#161b22] border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-center mb-6">KBO SQUAD MAKER</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="text" placeholder="팀 코드 입력 (예: my-squad)" value={loginInput} onChange={(e) => setLoginInput(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" required />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              입장하기 <ChevronRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col xl:flex-row h-screen overflow-hidden">
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
          <CheckCircle2 size={16} /> {toastMessage}
        </div>
      )}

      <div className="flex-1 flex flex-col h-full bg-[#161b22] border-r border-gray-800">
        <header className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#161b22]">
          <div className="flex gap-2">
            <button onClick={() => setCurrentTab('STARTERS')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${currentTab === 'STARTERS' ? 'bg-blue-600' : 'text-gray-400'}`}>주전 9명</button>
            <button onClick={() => setCurrentTab('PITCHERS')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${currentTab === 'PITCHERS' ? 'bg-blue-600' : 'text-gray-400'}`}>투수 12명</button>
            <button onClick={() => setCurrentTab('BENCH')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${currentTab === 'BENCH' ? 'bg-blue-600' : 'text-gray-400'}`}>후보 5명</button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-emerald-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"><Save size={14} /> 저장</button>
            <button onClick={() => setActiveCode(null)} className="bg-gray-800 px-3 py-2 rounded-xl text-xs"><LogOut size={16} /></button>
          </div>
        </header>

        {currentTab === 'STARTERS' && (
          <div className="flex-1 relative flex justify-center items-center p-4">
            <div className="relative w-full max-w-[600px] aspect-[4/5] bg-[#1e4620] rounded-3xl overflow-hidden border-4 border-[#122814]">
              {/* 그라운드 UI 단순화 */}
              <div className="absolute w-[400px] h-[400px] rounded-full bg-[#8c532b] bottom-[30px] left-1/2 -translate-x-1/2 border-4 border-[#73401d]" />
              <div className="absolute w-[220px] h-[220px] bg-[#1e4620] bottom-[120px] left-1/2 -translate-x-1/2 rotate-45 border-2 border-white/50" />
              
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <span className="bg-black/60 text-gray-300 text-xs px-4 py-1.5 rounded-full">{activeSlot ? `우측에서 [${activeSlot}] 선택` : '포지션을 클릭하세요'}</span>
              </div>

              {[
                { role: 'CF', b: '75%', l: '50%' }, { role: 'LF', b: '64%', l: '18%' }, { role: 'RF', b: '64%', l: '82%' },
                { role: 'SS', b: '50%', l: '33%' }, { role: '2B', b: '50%', l: '67%' }, { role: '3B', b: '36%', l: '18%' },
                { role: '1B', b: '36%', l: '82%' }, { role: 'C', b: '10%', l: '50%' }, { role: 'DH', b: '10%', l: '15%' }
              ].map(pos => (
                <div key={pos.role} onClick={() => setActiveSlot(pos.role)} className="absolute flex flex-col items-center -translate-x-1/2 translate-y-1/2 z-10 cursor-pointer" style={{ bottom: pos.b, left: pos.l }}>
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-sm ${activeSlot === pos.role ? 'bg-blue-600 border-white z-20' : lineup[pos.role] ? 'bg-[#0d1117] border-emerald-400 text-emerald-400' : 'bg-black/60 border-white/60'}`}>{pos.role}</div>
                  {lineup[pos.role] && (
                    <div className="mt-1 bg-black/80 px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="text-xs font-bold">{lineup[pos.role].name}</span>
                      <button onClick={(e) => { e.stopPropagation(); setLineup(prev => ({...prev, [pos.role]: null})); }} className="text-rose-400"><X size={12} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTab !== 'STARTERS' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {(currentTab === 'PITCHERS' ? SLOT_DEFINITIONS.PITCHERS : SLOT_DEFINITIONS.BENCH).map(slot => (
                <div key={slot.key} onClick={() => setActiveSlot(slot.key)} className={`p-3 rounded-xl border flex justify-between cursor-pointer ${activeSlot === slot.key ? 'bg-blue-600/20 border-blue-500' : 'bg-[#0d1117] border-gray-800'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold bg-gray-800 px-2 py-1 rounded">{slot.label}</span>
                    <span className="text-sm font-bold">{lineup[slot.key] ? lineup[slot.key].name : '미배치'}</span>
                  </div>
                  {lineup[slot.key] && (
                    <button onClick={(e) => { e.stopPropagation(); setLineup(prev => ({...prev, [slot.key]: null})); }} className="text-rose-400"><X size={14} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-full xl:w-[400px] bg-[#161b22] border-l border-gray-800 flex flex-col h-full">
        <div className="p-4 border-b border-gray-800">
          <input type="text" placeholder="선수 검색..." value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} className="w-full bg-[#0d1117] border border-gray-700 rounded-xl px-4 py-2 text-xs mb-3 outline-none" />
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
            {KBO_TEAMS.map(team => (
              <button key={team.id} onClick={() => setSelectedTeam(team.short === '전체' ? 'ALL' : team.short)} className={`px-3 py-1.5 rounded-lg font-bold ${selectedTeam === team.short || (selectedTeam === 'ALL' && team.id === 'ALL') ? 'bg-blue-600' : 'bg-[#0d1117]'}`}>{team.short}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredPlayers.map(player => (
            <div key={player.id} onClick={() => { if(activeSlot) { setLineup(prev => ({...prev, [activeSlot]: player})); setActiveSlot(null); } else alert('포지션을 먼저 선택하세요.'); }} className="bg-[#0d1117] border border-gray-800 p-3 rounded-xl flex justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-blue-900/30 text-blue-400">{player.pos}</span>
                <div><div className="text-sm font-bold">{player.name}</div><div className="text-xs text-gray-500">{player.team}</div></div>
              </div>
              <button className="bg-gray-800 px-3 rounded-lg text-xs font-bold">배치</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
