'use client';

import React, { useState } from 'react';
import { 
  Trophy, Users, Home, Settings, Zap, ArrowUpCircle, 
  Swords, Shield, Medal, Star, ChevronRight
} from 'lucide-react';

// --- 실제 KBO 현역 및 레전드 로스터 ---
const TEAM_ROSTERS: Record<string, string[]> = {
  KIA: ['김도영', '양현종', '나성범', '최형우', '박찬호', '김선빈', '이우성', '소크라테스', '네일', '크로우', '정해영', '전상현', '장현식', '곽도규', '최지민', '이준영', '윤영철', '황동하', '한준수', '김태군', '이종범', '선동열', '이대진', '김성한', '이순철', '이의리', '임기영', '김대유', '서건창', '변우혁'],
  삼성: ['구자욱', '원태인', '강민호', '김영웅', '이재현', '김지찬', '디아즈', '코너', '레예스', '류지혁', '오승환', '김재윤', '임창민', '최지광', '우규민', '이승엽', '양준혁', '배영수', '임창용', '박한이', '백정현', '이승현', '황동재', '김태훈', '이성규', '김헌곤', '강한울', '전병우', '김재성'],
  LG: ['홍창기', '문성주', '김현수', '오스틴', '문보경', '오지환', '박동원', '박해민', '신민재', '구본혁', '임찬규', '최원태', '엔스', '에르난데스', '손주영', '유영찬', '김진성', '백승현', '정우영', '함덕주', '박용택', '이병규', '이상훈', '김용수', '조인성', '박명근', '김대현', '이지강', '이우찬', '김범석'],
  두산: ['양의지', '김택연', '정수빈', '양석환', '강승호', '허경민', '김재환', '라모스', '전민재', '조수행', '곽빈', '발라조빅', '시라카와', '최원준', '이영하', '이병헌', '최지강', '홍건희', '김강률', '박치국', '김동주', '박철순', '더스틴 니퍼트', '홍성흔', '오재원', '정철원', '김명신', '박정수', '이유찬', '김민혁'],
  KT: ['강백호', '고영표', '로하스', '황재균', '장성우', '김상수', '배정대', '문상철', '오윤석', '천성호', '쿠에바스', '벤자민', '엄상백', '원상현', '육청명', '박영현', '손동현', '김민', '김민수', '주권', '유한준', '이진영', '박경수', '이대은', '김재윤', '우규민', '이상동', '전용주', '조현우', '신본기'],
  SSG: ['최정', '김광현', '추신수', '에레디아', '박성한', '최지훈', '한유섬', '이지영', '고명준', '하재훈', '앤더슨', '엘리아스', '오원석', '송영진', '박종훈', '노경은', '조병현', '이로운', '문승원', '서진용', '박경완', '김원형', '정우람', '조웅천', '박재홍', '고효준', '최민준', '백승건', '박민호', '오태곤'],
  롯데: ['윤동희', '황성빈', '전준우', '레이예스', '나승엽', '손호영', '고승민', '박승욱', '유강남', '손성빈', '반즈', '윌커슨', '박세웅', '김진욱', '나균안', '김원중', '구승민', '전미르', '김상수', '진해수', '최동원', '이대호', '염종석', '마해영', '박정태', '최준용', '이민석', '정현수', '송재영', '정훈'],
  한화: ['류현진', '노시환', '채은성', '안치홍', '문동주', '김서현', '황영묵', '최재훈', '이도윤', '페라자', '와이스', '바리아', '엄상백', '김민우', '주현상', '한승혁', '박상원', '이민우', '김범수', '장시환', '송진우', '구대성', '정민철', '장종훈', '김태균', '이태양', '강재민', '윤대경', '이재원', '문현빈'],
  NC: ['박건우', '박민우', '손아섭', '데이비슨', '권희동', '서호철', '김주원', '김형준', '김성욱', '천재환', '하트', '카스타노', '신민혁', '이재학', '김시훈', '이용찬', '김재열', '류진욱', '김영규', '임정호', '에릭 테임즈', '이호준', '이종욱', '손시헌', '나성범', '송명기', '한재승', '최성영', '박세혁', '도태훈'],
  키움: ['김혜성', '송성문', '이주형', '도슨', '고영우', '김건희', '이형종', '최주환', '임병욱', '이용규', '후라도', '헤이수스', '하영민', '김인범', '조상우', '김성민', '김재웅', '문성현', '주승우', '전준표', '박병호', '이정후', '강정호', '서건창', '유한준', '조영건', '손현기', '김동혁', '김동헌', '이재상']
};

const FULL_DATABASE = (() => {
  const list: any[] = [];
  let id = 1;
  Object.keys(TEAM_ROSTERS).forEach(team => {
    TEAM_ROSTERS[team].forEach((name, idx) => {
      const isPitcher = (idx >= 10 && idx <= 19) || (idx >= 25 && idx <= 28);
      const pos = isPitcher ? 'P' : ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'][idx % 9];
      
      let grade = 'NORMAL';
      let baseOvr = 65 + (idx % 10); 
      
      if (idx >= 20 && idx <= 24) { grade = 'LEGEND'; baseOvr = 90 + (idx % 5); } 
      else if (idx < 5) { grade = 'SIGNATURE'; baseOvr = 85 + (idx % 5); } 
      else if (idx < 10) { grade = 'PLATINUM'; baseOvr = 80 + (idx % 5); } 
      else { grade = ['NORMAL', 'RARE', 'HERO'][idx % 3]; }

      list.push({
        id: `kbo-${id++}`,
        name,
        team,
        pos,
        grade,
        ovr: baseOvr
      });
    });
  });
  return list;
})();

export default function KBOManagerGame() {
  const [currentMenu, setCurrentMenu] = useState('HOME');
  const [teamSubMenu, setTeamSubMenu] = useState('LINEUP');
  
  // 에러의 주범이었던 랜덤 함수(Math.random)를 제거하고 고정된 선수(김도영)를 불러오도록 수정했습니다.
  const displayPlayer = FULL_DATABASE.find(p => p.name === '김도영') || FULL_DATABASE[0];

  const TEAM_MENUS = [
    { id: 'LINEUP', label: '라인업', icon: <Users size={16} /> },
    { id: 'ENHANCE', label: '선수 강화', icon: <ArrowUpCircle size={16} /> },
    { id: 'LIMIT_BREAK', label: '한계 돌파', icon: <Zap size={16} /> },
    { id: 'TRANSCEND', label: '초월 돌파', icon: <Star size={16} /> },
    { id: 'COACH', label: '코치진 승급', icon: <Medal size={16} /> },
    { id: 'COMBINE', label: '선수 조합', icon: <Swords size={16} /> }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      <header className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="text-blue-500" size={24} />
          <div>
            <div className="text-xs font-bold text-slate-400">나만의 구단</div>
            <div className="font-black text-lg">KBO 드림팀</div>
          </div>
        </div>
        <div className="flex gap-4 text-sm font-bold">
          <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            <span className="text-blue-400 mr-2">C</span>1,250,000
          </div>
          <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            <span className="text-yellow-400 mr-2">S</span>1,200
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col relative">
        {currentMenu === 'HOME' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950">
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 mb-8 drop-shadow-lg text-center">
              PRO BASEBALL MANAGER
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
              <button onClick={() => setCurrentMenu('LEAGUE')} className="bg-gradient-to-br from-indigo-600 to-purple-800 p-8 rounded-3xl border border-indigo-400/30 hover:scale-105 transition-transform shadow-2xl group flex flex-col items-center">
                <Trophy size={48} className="text-yellow-400 mb-4 group-hover:animate-bounce" />
                <span className="text-2xl font-black">리그 모드</span>
                <span className="text-indigo-200 mt-2 text-sm">2026 페넌트레이스 진입</span>
              </button>
              <button onClick={() => setCurrentMenu('TEAM')} className="bg-gradient-to-br from-emerald-600 to-teal-900 p-8 rounded-3xl border border-emerald-400/30 hover:scale-105 transition-transform shadow-2xl group flex flex-col items-center">
                <Users size={48} className="text-white mb-4 group-hover:animate-bounce" />
                <span className="text-2xl font-black">팀 관리</span>
                <span className="text-emerald-200 mt-2 text-sm">로스터, 강화, 코치진 셋업</span>
              </button>
            </div>
          </div>
        )}

        {currentMenu === 'LEAGUE' && (
          <div className="flex-1 flex items-center justify-center bg-slate-900 p-6">
            <div className="text-center">
              <Trophy size={64} className="text-yellow-500 mx-auto mb-6" />
              <h2 className="text-3xl font-black mb-4">리그 모드 준비 중</h2>
              <p className="text-slate-400">AI 상대방과 페넌트레이스를 진행하는 시뮬레이션 엔진이 필요합니다.</p>
            </div>
          </div>
        )}

        {currentMenu === 'TEAM' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-900">
            <div className="md:w-64 bg-slate-950 border-r border-slate-800 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
              <div className="hidden md:block text-xs font-black text-slate-500 mb-4 tracking-widest pl-2">TEAM MANAGEMENT</div>
              {TEAM_MENUS.map(menu => (
                <button 
                  key={menu.id} 
                  onClick={() => setTeamSubMenu(menu.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${teamSubMenu === menu.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  {menu.icon}
                  <span>{menu.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 p-6 overflow-y-auto relative">
              <h2 className="text-2xl font-black mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
                {TEAM_MENUS.find(m => m.id === teamSubMenu)?.icon}
                {TEAM_MENUS.find(m => m.id === teamSubMenu)?.label}
              </h2>
              
              {teamSubMenu === 'LINEUP' && (
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-center space-y-4">
                  <h3 className="text-lg font-bold">대표 선수 슬롯</h3>
                  <div className="inline-block bg-slate-900 border-2 border-yellow-500 p-4 rounded-xl shadow-xl">
                     <div className="text-yellow-500 font-black text-2xl">{displayPlayer.ovr}</div>
                     <div className="text-slate-400 text-xs">{displayPlayer.team} {displayPlayer.pos}</div>
                     <div className="text-white font-bold text-xl mt-1">{displayPlayer.name}</div>
                     <div className="mt-2 text-[10px] bg-yellow-900 text-yellow-300 px-2 py-1 rounded font-black">{displayPlayer.grade}</div>
                  </div>
                  <p className="text-slate-400 text-sm mt-4">실제 KBO 선수 데이터베이스가 연동되었습니다.</p>
                </div>
              )}

              {teamSubMenu === 'ENHANCE' && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                  <ArrowUpCircle size={64} className="text-emerald-500" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">선수 강화 (+1 ~ +10)</h3>
                    <p className="text-slate-400 text-sm">코인과 강화 재료를 소모하여 선수의 모든 스탯을 올립니다.</p>
                  </div>
                  <button className="bg-emerald-600 px-8 py-3 rounded-xl font-black shadow-lg hover:bg-emerald-500">강화 대상 선택</button>
                </div>
              )}

              {teamSubMenu === 'LIMIT_BREAK' && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                  <Zap size={64} className="text-purple-500" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">한계 돌파</h3>
                    <p className="text-slate-400 text-sm">동일한 선수를 재료로 사용하여 최대 레벨 상한을 뚫습니다.</p>
                  </div>
                  <button className="bg-purple-600 px-8 py-3 rounded-xl font-black shadow-lg hover:bg-purple-500">돌파 선수 등록</button>
                </div>
              )}

              {teamSubMenu === 'TRANSCEND' && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                  <Star size={64} className="text-yellow-500" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">초월 돌파</h3>
                    <p className="text-slate-400 text-sm">레전드/시그니처 카드의 고유 잠재력을 해방합니다.</p>
                  </div>
                  <button className="bg-yellow-600 text-black px-8 py-3 rounded-xl font-black shadow-lg hover:bg-yellow-500">초월 재단 열기</button>
                </div>
              )}

              {teamSubMenu === 'COACH' && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                  <Medal size={64} className="text-blue-500" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">감독 / 코치진 승급</h3>
                    <p className="text-slate-400 text-sm">수석코치, 투수코치, 타격코치를 영입하고 승급시켜 덱 효과를 극대화하세요.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
                    {['감독', '타격코치', '투수코치'].map(role => (
                      <div key={role} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col items-center">
                        <span className="text-xs text-slate-400 mb-2">{role}</span>
                        <div className="w-16 h-16 bg-slate-900 rounded-full mb-3 flex items-center justify-center text-slate-600 font-bold">비어있음</div>
                        <button className="bg-slate-700 w-full py-2 rounded-lg text-sm font-bold hover:bg-slate-600">영입하기</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <nav className="bg-slate-950 border-t border-slate-800 flex justify-around p-2 pb-safe">
        <button onClick={() => setCurrentMenu('HOME')} className={`flex flex-col items-center p-2 w-20 transition-colors ${currentMenu === 'HOME' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <Home size={24} className="mb-1" />
          <span className="text-[10px] font-bold">홈</span>
        </button>
        <button onClick={() => setCurrentMenu('LEAGUE')} className={`flex flex-col items-center p-2 w-20 transition-colors ${currentMenu === 'LEAGUE' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <Trophy size={24} className="mb-1" />
          <span className="text-[10px] font-bold">리그모드</span>
        </button>
        <button onClick={() => setCurrentMenu('TEAM')} className={`flex flex-col items-center p-2 w-20 transition-colors ${currentMenu === 'TEAM' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <Users size={24} className="mb-1" />
          <span className="text-[10px] font-bold">팀관리</span>
        </button>
        <button className="flex flex-col items-center p-2 w-20 text-slate-500 hover:text-slate-300">
          <Settings size={24} className="mb-1" />
          <span className="text-[10px] font-bold">설정</span>
        </button>
      </nav>
    </div>
  );
}
