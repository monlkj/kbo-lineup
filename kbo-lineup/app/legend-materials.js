import {LEGEND_CATALOG} from './legend-registry.js';
import {legendRecipe,matchesLegend,matchesCoach} from './classic-progression.js';
let recipes=[],savedBooks={},cache=new Map();
export function setMaterialBooks(books){if(savedBooks===books)return;savedBooks=books||{};cache=new Map();}
export function setMaterialDatabase(database){recipes=LEGEND_CATALOG.map(target=>({target,requirements:legendRecipe(target,database)}));cache=new Map();}
export function materialLegends(card){if(card.legendKind||['LEGEND','SIGNATURE'].includes(card.grade))return [];const key=[card.id,card.grade,card.cardType,card.coachId].join(':');if(cache.has(key))return cache.get(key);const active=new Map(recipes.map(b=>[b.target.id,b]));for(const book of Object.values(savedBooks))if(book.target&&book.requirements)active.set(book.target.id,book);const result=[...active.values()].filter(b=>b.requirements.some(s=>s.kind==='COACH'?matchesCoach(card,s):matchesLegend(card,s))).map(b=>b.target);cache.set(key,result);return result;}
