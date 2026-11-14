import {test} from 'node:test';
import assert from 'node:assert/strict';
import {grantTestResources,TEST_BALANCE,TEST_ITEMS} from '../app/test-resources.js';
test('test support refills repeatedly, preserves existing assets, never duplicates item IDs, and marks club save',()=>{
 const base={players:[{uniqueId:'player'}],lineup:{},currency:{points:3,stars:5},inventory:[{id:'existing',packId:'skill_ticket'},{id:'coach',packId:'coach_material'}],manager:{rosterCapacity:100}};
 const before=structuredClone(base),first=grantTestResources(base);assert.deepEqual(base,before);assert.equal(first.currency.points,TEST_BALANCE);assert.equal(first.currency.stars,TEST_BALANCE);assert.equal(first.manager.testResourcesUsed,true);assert.deepEqual(first.players,base.players);assert.deepEqual(first.inventory[0],base.inventory[0]);assert.deepEqual(first.inventory[1],base.inventory[1]);for(const [id,,amount] of TEST_ITEMS)assert.equal(first.inventory.filter(i=>i.packId===id).length,amount);
 const twice=grantTestResources(first);assert.deepEqual(twice.inventory,first.inventory);const used={...first,currency:{points:0,stars:0},inventory:first.inventory.filter(i=>i.packId!=='premium_skill_ticket')};const refilled=grantTestResources(used);assert.equal(refilled.inventory.filter(i=>i.packId==='premium_skill_ticket').length,999);assert.equal(new Set(refilled.inventory.map(i=>i.id)).size,refilled.inventory.length);assert.equal(refilled.currency.stars,TEST_BALANCE);
 const richer=grantTestResources({...base,currency:{points:TEST_BALANCE+5,stars:TEST_BALANCE+7}});assert.equal(richer.currency.points,TEST_BALANCE+5);assert.equal(richer.currency.stars,TEST_BALANCE+7);
 assert.throws(()=>grantTestResources({...base,manager:{pendingSkillChange:{}}}),/결과/);assert.throws(()=>grantTestResources({...base,manager:{pendingCombination:{}}}),/결과/);
});
