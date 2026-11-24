import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ratings} from '../app/manager-engine.js';
import {filterPlayers,EMPTY_FILTERS} from '../app/player-filters.js';
const cards=[70,80,90,100].map(n=>{const c={name:'선수'+n,year:2024,pos:'1B',grade:'PLATINUM',growthVersion:2,stats:{}};return {...c,enhancement:Object.fromEntries(Object.entries(ratings(c)).map(([k,v])=>[k,n-v]))};});
test('inclusive OVR interval, maximum alone, legacy filters and empty reversed ranges',()=>{assert.deepEqual(filterPlayers(cards,{...EMPTY_FILTERS,minOvr:80,maxOvr:90}).map(c=>c.name),['선수90','선수80']);assert.equal(filterPlayers(cards,{...EMPTY_FILTERS,maxOvr:80}).length,2);assert.equal(filterPlayers(cards,{minOvr:80}).length,3);assert.equal(filterPlayers(cards,{minOvr:90,maxOvr:80}).length,0);assert.equal(filterPlayers(cards,{...EMPTY_FILTERS,maxOvr:''}).length,4);});
