 'use client';
import {useState} from 'react';
import PlayerCard from './player-card';
import PlayerFilters from './player-filters.jsx';
import {EMPTY_FILTERS,filterPlayers} from './player-filters.js';
import {protectedIds} from './club-rules.js';
import {TIER,COMBO_PROBABILITIES,startCombination,shuffleCombination,claimCombination} from './classic-progression.js';
import GradeUpWorkshop from './grade-up-workshop.jsx';
import EraSignatureWorkshop from './era-signature-workshop.jsx';
import GrowthWorkshop from './growth-workshop.jsx';
import SignatureWorkshop from './signature-workshop.jsx';
import ScoutWorkshop from './scout-workshop.jsx';
const LABEL={NORMAL:'노멀',RARE:'레어',SPECIAL:'스페셜',HERO:'히어로',PLATINUM:'플래티넘'};
export default function ProgressionWorkshop(props){if(props.mode==='GRADE_UP')return <GradeUpWorkshop {...props}/>;if(props.mode==='ERA_SIGNATURE')return <EraSignatureWorkshop {...props}/>;if(['TRAIN','LIMIT','TRANSCEND'].includes(props.mode))return <GrowthWorkshop key={props.mode} {...props}/>;if(props.mode==='LEGEND_SCOUT')return <ScoutWorkshop {...props}/>;if(props.mode==='SIGNATURE_AWAKEN')return <SignatureWorkshop {...props}/>;return <CombinationWorkshop {...props}/>;}
function CombinationWorkshop({state,database,onCommit,onResult,showToast}){
 const [filters,setFilters]=useState({...EMPTY_FILTERS}),[comboMode,setComboMode]=useState('NORMAL'),[position,setPosition]=useState('P'),[selected,setSelected]=useState([]);const {players,manager}=state,locked=protectedIds(state.lineup,manager);
 const run=(fn,message)=>{try{const r=fn();onCommit(r.state||r);if(message)showToast(message);return true;}catch(e){showToast(e.message);return false;}};
 const list=(cards,click,chosen=[])=>{const visible=filterPlayers(cards,filters);return <><PlayerFilters value={filters} onChange={setFilters} teams={[...new Set(cards.map(c=>c.team))]}/><p>검색 {visible.length}명 · 편성·등록 중인 카드는 보호됩니다.</p><div className="workshop-cards">{visible.slice(0,120).map(c=><PlayerCard key={c.uniqueId} card={c} selected={chosen.includes(c.uniqueId)} onClick={()=>click(c)}/>)}</div></>;};
 const free=players.filter(c=>!locked.has(c.uniqueId)&&TIER.indexOf(c.grade)<=4&&(comboMode!=='POSITION'||(c.positions||[c.pos]).includes(position)));
 return <section className="progression-workshop"><h1>선수 조합</h1><p className="workshop-note">3~5장 조합 → 상위 결과는 후보 7장을 확인 → 섞기 → 뒤집어 1장 선택. 실행 시 재료가 소모되며 결과 선택은 새로고침해도 이어집니다. 레전드·시그니처는 소모에서 보호됩니다.</p><div className="workshop-toolbar"><label>조합 방식 <select aria-label="조합 방식" value={comboMode} onChange={e=>{setComboMode(e.target.value);setSelected([]);}}><option value="NORMAL">일반 · 무료</option><option value="POSITION">포지션 · 무료</option><option value="STAR">스타 · 500 S</option></select></label>{comboMode==='POSITION'&&<label>결과 포지션 <select aria-label="조합 포지션" value={position} onChange={e=>{setPosition(e.target.value);setSelected([]);}}>{['P','C','1B','2B','3B','SS','LF','CF','RF'].map(p=><option key={p}>{p}</option>)}</select></label>}</div><div className="workshop-panel"><h2>조합 재료 {selected.length}/5</h2><div className="workshop-cards">{selected.map(id=>{const c=players.find(c=>c.uniqueId===id);return c&&<PlayerCard key={id} card={c} selected onClick={()=>setSelected(v=>v.filter(x=>x!==id))}/>;})}</div><button className="com2us-button" disabled={selected.length<3} onClick={()=>{if(confirm(`선택한 선수 ${selected.length}장${comboMode==='STAR'?'과 500 S':''}을 소모해 조합할까요?`))if(run(()=>startCombination(state,selected,comboMode,database,position),'조합 결과를 선택해주세요.'))setSelected([]);}}>조합 실행{comboMode==='STAR'?' · 500 S':''}</button></div><details><summary>이 게임의 조합 확률</summary><p>일반·포지션은 재료 중 최저 등급을 기준으로 판정합니다. 3~5장 수량에 따른 확률 차이는 없습니다. 스타는 재료 최고 등급을 보장하며 최대 플래티넘입니다.</p>{COMBO_PROBABILITIES.map((r,i)=><p key={i}>{LABEL[TIER[i]]} 기준 → {r.grades.map((g,n)=>`${LABEL[g]} ${r.weights[n]}%`).join(' / ')}</p>)}<p>후보 7장은 같은 등급이며 중복 선수가 나올 수 있습니다. 섞은 뒤 각 칸의 선택 확률은 1/7입니다. 원작 비공개 확률 대신 이 게임에 공개된 확률을 사용합니다.</p></details>{list(free,c=>setSelected(v=>v.includes(c.uniqueId)?v.filter(x=>x!==c.uniqueId):v.length<5?[...v,c.uniqueId]:v),selected)}</section>;
}
export function CombinationResult({state,onCommit,onResult,showToast}){
 const p=state.manager.pendingCombination;if(!p)return null;
 const act=fn=>{try{const r=fn();onCommit(r.state||r);if(r.card)onResult(r.card);}catch(e){showToast(e.message);}};
 return <div className="manager-overlay combination-overlay"><section className="manager-dialog" role="dialog" aria-modal="true" aria-label="조합 결과 선택"><h2>{p.phase==='preview'?'조합 후보 7장':p.phase==='hidden'?'카드를 뒤집어 1장 선택':'조합 결과'}</h2><p>재료는 이미 소모되었습니다. 결과 선택은 자동 저장되며 새로고침해도 바뀌지 않습니다.</p><div className="combination-results">{p.choices.map((c,i)=>p.phase==='hidden'?<button key={i} className="card-back" aria-label={`${i+1}번 조합 카드 선택`} onClick={()=>act(()=>claimCombination(state,i))}><b>KBO</b><span>?</span><small>{i+1}번 카드</small></button>:<PlayerCard key={i} card={c}/>)}</div>{p.phase==='preview'&&<button className="com2us-button" onClick={()=>act(()=>shuffleCombination(state))}>카드 섞기</button>}{p.phase==='single'&&<button className="com2us-button" onClick={()=>act(()=>claimCombination(state,0))}>선수 받기</button>}</section></div>;
}
