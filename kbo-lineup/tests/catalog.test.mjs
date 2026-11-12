import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,root)));
const cards=read('data/catalog.json'),meta=read('data/catalog-meta.json'),photos=read('data/portrait-provenance.json');
assert.ok(meta.uniquePlayers>=2000);
assert.equal(new Set(cards.map(c=>c.playerId)).size,meta.uniquePlayers);
assert.equal(cards.length,meta.cards);
assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);
assert.equal(Object.keys(photos).length,meta.uniquePlayers);
for(const c of cards){
 assert.ok(c.positions.includes(c.pos));
 for(const pos of c.positions)assert.ok(c.positionEvidence.some(e=>e.pos===pos&&e.source.includes('koreabaseball.com')));
 for(const a of c.awards){assert.equal(a.year,c.year);assert.ok(['골든글러브','MVP','올스타'].includes(a.type));assert.ok(a.source.includes('koreabaseball.com'));}
 const bytes=fs.readFileSync(new URL('public'+c.photo,root));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),photos[c.playerId].hash,`Portrait provenance mismatch: ${c.playerId}`);
}
assert.equal(new Set(Object.values(photos).map(p=>p.hash)).size,meta.uniquePlayers,'Repeated placeholder portraits must not count as different people');
console.log(`PASS: ${meta.uniquePlayers} distinct players, ${cards.length} season cards; every position, award and portrait has checked provenance`);
