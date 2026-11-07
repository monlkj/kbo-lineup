'use client';

import { useState } from 'react';
import { Search, Save, LogIn, X, Shield } from 'lucide-react';

// KBO 10개 구단 및 임시 선수 데이터 (실제 데이터로 자유롭게 수정 가능)
const KBO_TEAMS = ['전체', 'KIA', '삼성', 'LG', '두산', 'KT', 'SSG', '롯데', '한화', 'NC', '키움'];
const MOCK_PLAYERS = [
  { name: '김도영', team: 'KIA' }, { name: '양현종', team: 'KIA' }, { name: '최형우', team: 'KIA' },
  { name: '구자욱', team: '삼성' }, { name: '원태인', team: '삼성' }, { name: '강민호', team: '삼성' },
  { name: '홍창기', team: 'LG' }, { name: '오지환', team: 'LG' }, { name: '박동원', team: 'LG' },
  { name: '양의지', team: '두산' }, { name: '김택연', team: '두산' },
  { name: '고영표', team: 'KT' }, { name: '로하스', team: 'KT' },
  { name: '최정', team: 'SSG' }, { name: '김광현', team: 'SSG' },
  { name: '윤동희', team: '롯데' }, { name: '전준우', team: '롯데' },
  { name: '류현진', team: '한화' }, { name: '노시환', team: '한화' },
  { name: '박민우', team: 'NC' }, { name: '데이비슨', team: 'NC' },
  { name: '김혜성', team: '키움' }, { name: '송성문', team: '키움' }
];

export default function KBOSquadMaker() {
  // 1. 로그인 상태 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [teamCode, setTeamCode] = useState('');

  // 2. 라인업 및 UI 상태 관리
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedTeamTab, setSelectedTeamTab] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [lineup, setLineup] = useState<Record<string, string | null>>({
    LF: null, CF: null, RF: null,
    SS: null, '2B': null,
    '3B': null, '1B': null,
    P: null, C: null, DH: null
  });

  // 로그인 처리
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamCode.trim()) setIsLoggedIn(true);
  };

  // 선수 선택 처리 (우측 명단에서 클릭 시)
  const handlePlayerSelect = (playerName: string) => {
    if (!selectedPosition) {
      alert('먼저 왼쪽 그라운드에서 선수를 배치할 포지션을 클릭해주세요!');
      return;
    }
    setLineup(prev => ({ ...prev, [selectedPosition]: playerName }));
    setSelectedPosition(null);
  };

  // 포지션에서 선수 제거
  const handleRemovePlayer = (position: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 포지션 클릭 이벤트와 겹치지 않게 방지
    setLineup(prev => ({ ...prev, [position]: null }));
    if (selectedPosition === position) setSelectedPosition(null);
  };

  // 필터링된 선수 목록
  const filteredPlayers = MOCK_PLAYERS.filter(p => {
    const matchTeam = selectedTeamTab === '전체' || p.team === selectedTeamTab;
    const matchSearch = p.name.includes(searchQuery);
    return matchTeam && matchSearch;
  });

  // ===================== [ 뷰 1: 로그인 화면 ] =====================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212] text-white p-4 font-sans">
        <div className="bg-[#1e1e1e] p-10 rounded-2xl shadow-2xl max-w-md w-full text-center border border-gray-800">
          <Shield className="w-16 h-16 mx-auto mb-6 text-blue-500" />
          <h1 className="text-3xl font-black mb-2 tracking-tight">KBO SQUAD MAKER</h1>
          <p className="text-gray-400 mb-8 text-sm">팀 코드를 입력하고 나만의 라인업을 구성하세요</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="나만의 팀 코드 (예: lions2024)"
              className="px-5 py-4 rounded-xl bg-[#2a2a2a] text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/50">
              <LogIn size={20} /> 라인업 짜러 가기
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ===================== [ 뷰 2: 메인 스쿼드 메이커 화면 ] =====================
  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col xl:flex-row gap-6 p-4 md:p-6 font-sans">
      
      {/* 1. 왼쪽: 야구장 그라운드 영역 */}
      <div className="flex-1 bg-[#1a472a] rounded-3xl relative overflow-hidden aspect-square xl:aspect-auto xl:min-h-[800px] border border-gray-700 shadow-2xl">
        {/* 잔디 패턴 / 다이아몬드 그래픽 */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/grass.png')] pointer-events-none"></div>
        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/30 rotate-45 pointer-events-none"></div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-8 h-8 border-2 border-white/50 rounded-full pointer-events-none"></div>

        {/* 안내 메시지 */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
          {selectedPosition ? (
            <span className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg animate-bounce inline-block text-sm md:text-base">
              우측 명단에서 {selectedPosition} 포지션에 들어갈 선수를 선택하세요!
            </span>
          ) : (
            <span className="bg-black/50 text-white px-6 py-2 rounded-full font-medium text-sm md:text-base backdrop-blur-sm">
              포지션을 클릭하고 선수를 배치하세요
            </span>
          )}
        </div>

        {/* 포지션 배치 (Absolute Positioning으로 정확한 위치 잡기) */}
        <div className="absolute inset-0 w-full h-full relative">
          <PositionNode role="CF" top="15%" left="50%" lineup={lineup} selected={selectedPosition} onSelect={setSelectedPosition} onRemove={handleRemovePlayer} />
          <PositionNode role="LF" top="30%" left="20%" lineup={lineup} selected={selectedPosition} onSelect={setSelectedPosition} onRemove={handleRemovePlayer} />
          <PositionNode role="RF" top="30%" left="80%" lineup={lineup} selected={selectedPosition} onSelect={setSelectedPosition} onRemove={handleRemovePlayer} />
          
          <PositionNode role="SS" top="50%" left="35%" lineup={lineup} selected={selectedPosition} onSelect={setSelectedPosition} onRemove={handleRemovePlayer} />
          <PositionNode role="2B" top="50%" left="65%" lineup={lineup} selected={selectedPosition} onSelect={setSelectedPosition} onRemove={handleRemovePlayer} />
          
          <PositionNode role="3B" top="65%" left="20%" lineup={lineup} selected={selectedPosition} onSelect={setSelectedPosition} onRemove={handleRemovePlayer} />
          <PositionNode role="1B" top="65%" left="80%" lineup={lineup} selected={selectedPosition} onSelect={setSelectedPosition} onRemove={handleRemovePlayer} />
          
          <PositionNode role="P" top="60%" left="50%" lineup={lineup} selected={selectedPosition} onSelect={setSelectedPosition} onRemove={handleRemovePlayer} />
          <PositionNode role="C" top="85%" left="50%" lineup={lineup} selected={selectedPosition} onSelect={setSelectedPosition} onRemove={handleRemovePlayer} />
          
          <PositionNode role="DH" top="85%" left="15%" lineup={lineup} selected={selectedPosition} onSelect={setSelectedPosition} onRemove={handleRemovePlayer} />
        </div>
      </div>

      {/* 2. 오른쪽: 컨트롤 패널 및 선수 명단 */}
      <div className="w-full xl:w-[450px] bg-[#1e1e1e] rounded-3xl p-6 flex flex-col h-[600px] xl:h-[800px] border border-gray-800 shadow-xl">
        
        {/* 상단 헤더 (팀 코드 및 저장) */}
        <div className="flex justify-between items-center mb-6 bg-[#2a2a2a] p-4 rounded-2xl">
          <div>
            <p className="text-xs text-gray-400 font-bold mb-1">현재 팀 코드</p>
            <h2 className="text-xl font-black text-blue-400">{teamCode}</h2>
          </div>
          <button 
            onClick={() => alert('라인업이 계정에 성공적으로 저장되었습니다!')}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-lg"
          >
            <Save size={16} /> 라인업 저장
          </button>
        </div>
        
        {/* 구단 필터 탭 */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
          {KBO_TEAMS.map(team => (
            <button
              key={team}
              onClick={() => setSelectedTeamTab(team)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                selectedTeamTab === team 
                  ? 'bg-white text-black' 
                  : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#333]'
              }`}
            >
              {team}
            </button>
          ))}
        </div>

        {/* 검색창 */}
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="선수 이름 검색..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#2a2a2a] outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
        </div>
        
        {/* 선수 리스트 */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player, idx) => (
              <div 
                key={`${player.name}-${idx}`}
                onClick={() => handlePlayerSelect(player.name)}
                className="bg-[#2a2a2a] p-4 rounded-xl flex justify-between items-center hover:bg-[#333] hover:scale-[1.01] transition-all cursor-pointer border border-transparent hover:border-gray-600 group"
              >
                <div>
                  <span className="text-xs font-bold text-gray-400 bg-black/30 px-2 py-1 rounded-md mr-3">{player.team}</span>
                  <span className="font-bold text-lg">{player.name}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <span className="text-blue-500 group-hover:text-white font-black text-xl leading-none mb-1">+</span>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 font-medium">
              검색된 선수가 없습니다.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ===================== [ 하위 컴포넌트: 그라운드 포지션 노드 ] =====================
function PositionNode({ 
  role, top, left, lineup, selected, onSelect, onRemove 
}: { 
  role: string, top: string, left: string, 
  lineup: Record<string, string | null>, 
  selected: string | null, 
  onSelect: (role: string) => void, 
  onRemove: (role: string, e: React.MouseEvent) => void 
}) {
  const isSelected = selected === role;
  const player = lineup[role];
  const hasPlayer = player !== null;

  return (
    <div 
      className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group"
      style={{ top, left }}
      onClick={() => onSelect(role)}
    >
      {/* 포지션 아이콘 동그라미 */}
      <div 
        className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center text-sm md:text-base font-black transition-all duration-200
          ${isSelected ? 'bg-blue-600 border-white shadow-[0_0_20px_rgba(37,99,235,0.8)] scale-110 z-20' : 
            hasPlayer ? 'bg-[#1e1e1e] border-gray-400' : 'bg-black/40 border-white/50 hover:bg-black/60'}
        `}
      >
        {role}
      </div>
      
      {/* 선수 이름 텍스트 박스 */}
      <div className="mt-2 relative">
        {hasPlayer ? (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-lg border transition-colors
            ${isSelected ? 'bg-blue-600 border-blue-400' : 'bg-[#1e1e1e] border-gray-600'}`}>
            <span className="text-xs md:text-sm font-bold whitespace-nowrap">{player}</span>
            <button 
              onClick={(e) => onRemove(role, e)} 
              className="text-gray-400 hover:text-red-400 hover:bg-red-400/20 rounded-full p-0.5 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <span className={`text-[10px] md:text-xs px-2 py-1 rounded shadow-md
            ${isSelected ? 'bg-blue-600 font-bold' : 'bg-black/50 text-gray-300'}`}>
            {isSelected ? '선택 중...' : '비어있음'}
          </span>
        )}
      </div>
    </div>
  );
}
