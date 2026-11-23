import cards from '../data/legend-catalog.json' with {type:'json'};
export const LEGEND_CATALOG=cards;
export const LEGEND_KINDS={CLASSIC:'일반 레전드',LIVING:'리빙 레전드',NATIONAL:'국가대표 레전드'};
export const legendCandidates=(team='',kind='')=>cards.filter(c=>(!team||c.team===team)&&(!kind||c.legendKind===kind));
export const isNationalLegend=c=>c?.grade==='LEGEND'&&c.legendKind==='NATIONAL'&&cards.some(x=>x.legendKind==='NATIONAL'&&x.playerId===String(c.playerId));
export function legendRosterNeedsUpdate(target){const current=cards.find(c=>c.id===target?.id);return !!current&&(['team','year','legendKind','pos'].some(k=>current[k]!==target[k])||JSON.stringify(current.positions)!==JSON.stringify(target.positions));}

export const deckFranchise=team=>({해태:'KIA',OB:'두산',빙그레:'한화',MBC:'LG',SK:'SSG',넥센:'키움',우리:'키움',히어로즈:'키움'}[team]||team);
export function refreshLegendPositions(card){const current=card&&cards.find(c=>c.id===card.id);if(!current)return card;return {...card,pos:current.pos,positions:[...current.positions],...(current.positionRule?{positionRule:current.positionRule,recordPosition:current.recordPosition,recordPositions:current.recordPositions}:{})};}
