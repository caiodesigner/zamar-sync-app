const { test } = require('node:test');
const assert = require('node:assert/strict');
const { separateDisplay, presentationTarget } = require('../dist/main/presentation-target.js');
const a={id:1,bounds:{x:0,y:0,width:1920,height:1080}};
const b={id:2,bounds:{x:1920,y:0,width:1920,height:1080}};
test('single display and explicit local rehearsal never create fullscreen target',()=>{
 assert.equal(presentationTarget(1,[a],a),null);
 assert.equal(presentationTarget(null,[a,b],a),null);
});
test('external target is allowed only outside operator monitor, irrespective of primary flag',()=>{
 assert.equal(presentationTarget(2,[a,b],a),b);
 assert.equal(presentationTarget(1,[a,b],b),a);
 assert.equal(separateDisplay({id:3,bounds:{x:-1280,y:0,width:1280,height:720}},a),true);
});
test('mirrored and overlapping display coordinates fall back to rehearsal',()=>{
 const clone={id:3,bounds:{...a.bounds}};
 const overlap={id:4,bounds:{x:1800,y:0,width:1280,height:720}};
 assert.equal(presentationTarget(3,[a,clone],a),null);
 assert.equal(presentationTarget(4,[a,overlap],a),null);
});
test('missing displays and invalid requests are rejected safely',()=>{
 for(const id of [undefined,'2',NaN,Infinity,999]) assert.throws(()=>presentationTarget(id,[a,b],a));
});
