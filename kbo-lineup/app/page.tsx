'use client';

import { useState } from 'react';
import { UserPlus, Save, LogIn } from 'lucide-react';

export default function SquadMaker() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [teamCode, setTeamCode] = useState('');
  
  // 포지션별 선택된 선수 상태 관리
  const [lineup, setLineup] = useState({
    C: null, 1B: null, 2B: null, 3B: null, SS: null,
    LF: null, CF: null, RF: null, P: null, DH: null
  });

  // 임시 선수 데이터
  const dummyPlayers = ['김도영', '양의지', '구자욱', '김혜성', '류현진'];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamCode.trim()) setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-white p-4">
        <div className="bg-zinc-800 p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold mb-6">⚾ KBO 스쿼드 메이커</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="나만의 팀 코드 입력 (예: my-tigers)"
              className="px-4 py-3 rounded-lg bg-zinc-700 text-white outline-none focus:ring-2 focus:ring-green-500"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value)}
            />
            <button type="submit" className="bg-green-600 hover:bg-green-500 py-3 rounded-lg font-bold flex items-center justify-center gap-2">
              <LogIn size={20} /> 접속하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4 md:p-8 flex flex-col md:flex-row gap-8">
      {/* 왼쪽: 그라운드 영역 */}
      <div className="flex-1 bg-green-800 rounded-3xl relative overflow-hidden aspect-square md:aspect-auto md:min-h-[600px] border-4 border-zinc-700 shadow-2xl p-4">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/grass.png')]"></div>
        {/* 간단한 다이아몬드 UI (CSS 위치 조정 필요) */}
        <div className="relative w-full h-full flex flex-col items-center justify-between">
          <div className="mt-8"><PositionBadge role="CF" player={lineup.CF} /></div>
          <div className="flex w-full justify-around px-8"><PositionBadge role="LF" player={lineup.LF} /><PositionBadge role="RF" player={lineup.RF} /></div>
          <div className="flex w-full justify-around px-20 mt-4"><PositionBadge role="SS" player={lineup.SS} /><PositionBadge role="2B" player={lineup.2B} /></div>
          <div className="flex w-full justify-between px-12 mt-4"><PositionBadge role="3B" player={lineup.3B} /><PositionBadge role="1B" player={lineup.1B} /></div>
          <div className="mt-12"><PositionBadge role="P" player={lineup.P} /></div>
          <div className="mt-8 mb-4"><PositionBadge role="C" player={lineup.C} /></div>
        </div>
      </div>

      {/* 오른쪽: 선수 검색 및 저장 영역 */}
      <div className="w-full md:w-96 bg-zinc-800 rounded-3xl p-6 flex flex-col h-[600px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">팀 코드: {teamCode}</h2>
          <button className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg flex items-center gap-2 text-sm font-bold">
            <Save size={16} /> 저장
          </button>
        </div>
        
        <input 
          type="text" 
          placeholder="선수 검색..." 
          className="w-full px-4 py-2 rounded-lg bg-zinc-700 mb-4 outline-none"
        />
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {dummyPlayers.map((player) => (
            <div key={player} className="bg-zinc-700 p-3 rounded-lg flex justify-between items-center hover:bg-zinc-600 cursor-pointer">
              <span>{player}</span>
              <UserPlus size={18} className="text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 포지션 뱃지 컴포넌트
function PositionBadge({ role, player }: { role: string, player: string | null }) {
  return (
    <div className="flex flex-col items-center z-10 cursor-pointer hover:scale-110 transition-transform">
      <div className="w-12 h-12 bg-zinc-900 rounded-full border-2 border-white flex items-center justify-center text-sm font-bold">
        {role}
      </div>
      <span className="mt-1 text-xs bg-black/50 px-2 py-1 rounded">
        {player || '선택'}
      </span>
    </div>
  );
}
