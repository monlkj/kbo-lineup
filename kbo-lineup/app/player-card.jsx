'use client';
import {useState} from 'react';
import {overall} from './manager-engine';

const TEAM_COLORS={KIA:'#b61835','해태':'#a50f25','삼성':'#2161bb',LG:'#b20d42','두산':'#24304c',OB:'#24304c',KT:'#a3242c',SSG:'#bf1834',SK:'#c92a37','롯데':'#174782','한화':'#e86b16','빙그레':'#d66b1c',NC:'#275e94','키움':'#7d2443','넥센':'#7d2443','현대':'#178565'};
const GRADE_MARK={NORMAL:'N',RARE:'R',SPECIAL:'SP',HERO:'H',PLATINUM:'P',SIGNATURE:'S',LEGEND:'L'};
const GRADE_LABEL={NORMAL:'노멀',RARE:'레어',SPECIAL:'스페셜',HERO:'히어로',PLATINUM:'플래티넘',SIGNATURE:'시그니처',LEGEND:'레전드'};
export default function PlayerCard({card,onClick,role,selected=false,className='',large=false}){
 const [failed,setFailed]=useState(false);
 const grade=card.grade||'NORMAL',position=role||card.pos,ovr=overall(card);
 const label=`${card.year} ${card.team} ${card.name} · ${GRADE_LABEL[grade]||grade} · OVR ${ovr} · ${position}`;
 const contents=<><div className="card-team-pattern" aria-hidden="true"/><div className="card-photo-window">{card.photo&&!failed?<img src={card.photo} alt="" loading="lazy" onError={()=>setFailed(true)}/>:<div className="card-photo-missing">사진 확인 중</div>}</div><div className="card-foil" aria-hidden="true"/><b className="card-overall">{ovr}</b><div className="card-grade-mark" aria-label={GRADE_LABEL[grade]||grade}>{GRADE_MARK[grade]||grade}</div><div className="card-team-name">{card.team}</div>{card.upgrade>0&&<b className="card-upgrade">+{card.upgrade}</b>}<div className="card-caption"><div className="card-player-name">{card.name}<i>&apos;{String(card.year).slice(-2)}</i></div><div className="card-footer"><b>Lv.{1+Math.floor((card.xp||0)/10)}</b><b>{position}</b></div></div>{selected&&<div className="card-selected-flag">선택 / 편성</div>}</>;
 const props={className:`classic-player-card grade-${grade.toLowerCase()} ${selected?'is-selected':''} ${large?'card-large':''} ${className}`,style:{'--team-accent':TEAM_COLORS[card.team]||'#39748e'},'data-player-id':card.uniqueId||card.id,'aria-label':label,title:label};
 return onClick?<button {...props} onClick={onClick} type="button">{contents}</button>:<article {...props}>{contents}</article>;
}
