import test from 'node:test';
import assert from 'node:assert/strict';
import {submitOwnerOpportunityReview,ownerPreparationView} from '../kabuby/owner-operational-view.js';
const row={asin:'B000000001',gtin:'0123456789012',run_id:'run-1',cohort_id:'cohort-1',decision_at:'2026-10-18T00:00:00.000Z',commercial_decision:'VALIDATE',review_eligible:true};
for(const action of ['APPROVE','WATCH','REJECT'])test(`${action} uses existing human API and requires exact noncommercial receipt`,async()=>{
 let called=0;const event=await submitOwnerOpportunityReview(row,action,{uuid:()=> 'f18bca32-060e-44ab-8b8d-c713b9456021',fetchImpl:async(url,options)=>{
 called++;assert.equal(url,'https://api.kabuby.com/api/v1/memory/decisions');assert.equal(options.credentials,'include');assert.equal(options.redirect,'error');const b=JSON.parse(options.body);assert.equal(b.identity.asin,row.asin);assert.equal(b.facts.run_id,row.run_id);
 return Response.json({data:{decision_event:{event_id:'immutable-receipt',event_type:b.event_type,stage:b.stage,facts:{...b.facts,publication_authorized:false,commercial_mutations:0}}}});
 }});assert.equal(called,1);assert.equal(event.facts.publication_authorized,false);
});
test('missing eligibility, failed API and wrong identity receipt never confirm removal',async()=>{
 let calls=0;await assert.rejects(submitOwnerOpportunityReview({...row,review_eligible:false},'APPROVE',{fetchImpl:async()=>{calls++}}));assert.equal(calls,0);
 await assert.rejects(submitOwnerOpportunityReview(row,'APPROVE',{fetchImpl:async()=>new Response('',{status:403})}),/NOT_CONFIRMED/);
 await assert.rejects(submitOwnerOpportunityReview(row,'APPROVE',{fetchImpl:async()=>Response.json({data:{decision_event:{event_id:'x',stage:'OWNER_OPPORTUNITY_REVIEW',event_type:'APPROVE_PLAN_PREPARATION',facts:{...row,run_id:'other',publication_authorized:false,commercial_mutations:0}}}})}),/RECEIPT_DENIED/);
 assert.match(ownerPreparationView({reviewed_opportunities:[]},String),/No hay oportunidades aprobadas/);
});
