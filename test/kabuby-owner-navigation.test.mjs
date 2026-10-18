import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../kabuby/app.js',import.meta.url),'utf8');
// Execute the shipped listener itself against a controlled asynchronous reader.
const listener=source.match(/window\.addEventListener\('hashchange',([\s\S]*?)\);\n  createNavigation/)[1];
function harness(){let page='scout',reads=0,resolve;const rendered=[];const context={window:{location:{hash:'#scout'}},projection:{},route:()=>({page}),render:()=>rendered.push(page),loadProjection:()=>{reads++;return new Promise(r=>{resolve=r;});}};return {context,rendered,handler:vm.runInNewContext(`(${listener})`,context),select(next,hash){page=next;context.window.location.hash=hash;},get reads(){return reads;},finish(){resolve();}};}
test('Scout navigation retains its single render and never requests an owner cohort',()=>{const h=harness();h.handler();assert.equal(h.reads,0);assert.deepEqual(h.rendered,['scout']);assert.deepEqual(h.context.projection,{});});
test('a pending owner response cannot redraw Scout or another workspace',async()=>{for(const destination of ['scout','supply','operations']){const h=harness();h.select('opportunities','#opportunities?view=amazon-ebay');h.handler();assert.equal(h.reads,1);h.select(destination,`#${destination}`);h.handler();assert.deepEqual(h.rendered,['opportunities',destination]);h.finish();await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(h.rendered,['opportunities',destination]);assert.equal(h.reads,1);}});
