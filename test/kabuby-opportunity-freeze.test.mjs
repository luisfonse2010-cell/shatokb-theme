import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),before=JSON.parse(fs.readFileSync(new URL('./fixtures/opportunity-protected-hashes-v1.json',import.meta.url),'utf8'));
test('all 20 protected artifacts match mission-start hashes, without any scope exception',()=>{assert.equal(before.length,20);for(const row of before){assert.equal(createHash('sha256').update(fs.readFileSync(new URL(row.path,root))).digest('hex'),row.sha256,row.path);}});
test('dedicated runtime/owner integration match the accepted production baseline',()=>{const baseline=JSON.parse(fs.readFileSync(new URL('kabuby/scout-production-baseline-v1.json',root),'utf8'));assert.equal(baseline.baseline_commit,'84db665ab3d6f9f5dbbd2595df767b42aa63882d');for(const file of ['kabuby/scout/index.html','kabuby/scout-owner.js'])assert.equal(createHash('sha256').update(fs.readFileSync(new URL(file,root))).digest('hex'),baseline.asset_hashes[file]);});
