// Growth is separate from season XP. No stat ceiling is applied.
export const GROWTH_VERSION=2;
export const cardLevel=c=>Math.max(1,Math.min(30,Number(c.level??c.upgrade)||1));
export function levelLimit(c){const legacy=c.growthVersion===GROWTH_VERSION?0:Math.min(5,Math.ceil(Math.max(0,(c.upgrade||0)-10)/2));return Math.min(30,10+2*Math.max(legacy,c.limitBreaks||0)+2*(c.transcendBreaks||0));}
export const growthKeys=c=>c.pos==='P'?['control','stuff','stamina','fastball','breaking']:['contact','power','eye','speed','field'];
export function migrateGrowth(c){if(c.growthVersion===GROWTH_VERSION)return c;const level=cardLevel(c),limitBreaks=Math.min(5,Math.max(c.limitBreaks||0,Math.ceil(Math.max(0,level-10)/2)));return {...c,growthVersion:GROWTH_VERSION,level,limitBreaks,enhancement:Object.fromEntries(growthKeys(c).map(k=>[k,c.enhancement?.[k]??(c.upgrade||0)]))};}
export function addEnhancement(c,rng=Math.random){const next=migrateGrowth(c),keys=growthKeys(c),enhancement={...next.enhancement};for(let i=0;i<5;i++){const key=keys[Math.min(keys.length-1,Math.floor(rng()*keys.length))];enhancement[key]=(enhancement[key]||0)+1;}return {...next,level:cardLevel(next)+1,upgrade:cardLevel(next),enhancement};}
