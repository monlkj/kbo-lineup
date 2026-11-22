import {LEGEND_CATALOG} from './legend-registry.js';
import {legendRecipe,matchesLegend,matchesCoach} from './classic-progression.js';
let recipes=[],cache=new Map();
export function setMaterialDatabase(database){recipes=LEGEND_CATALOG.map(target=>({target,requirements:legendRecipe(target,database)}));cache=new Map();}
export function materialLegends(card){if(card.legendKind||['LEGEND','SIGNATURE'].includes(card.grade))return [];const key=[card.id,card.grade,card.cardType,card.coachId].join(':');if(cache.has(key))return cache.get(key);const result=recipes.filter(b=>b.requirements.some(s=>s.kind==='COACH'?matchesCoach(card,s):matchesLegend(card,s))).map(b=>b.target);cache.set(key,result);return result;}
