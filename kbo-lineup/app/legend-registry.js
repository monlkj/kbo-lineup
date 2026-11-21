import cards from '../data/legend-catalog.json' with {type:'json'};
export const LEGEND_CATALOG=cards;
export const LEGEND_KINDS={CLASSIC:'일반 레전드',LIVING:'리빙 레전드',NATIONAL:'국가대표 레전드'};
export const legendCandidates=(team='',kind='')=>cards.filter(c=>(!team||c.team===team)&&(!kind||c.legendKind===kind));
export const isNationalLegend=c=>c?.grade==='LEGEND'&&c.legendKind==='NATIONAL'&&cards.some(x=>x.legendKind==='NATIONAL'&&x.playerId===String(c.playerId));
export function legendRosterNeedsUpdate(target){const current=cards.find(c=>c.id===target?.id);return !!current&&['team','year','legendKind'].some(k=>current[k]!==target[k]);}
