// Run from repo root: node quizmo/reset-smoke-test.mjs
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from '/tmp/shot/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
const server=http.createServer(async(req,res)=>{try{const file=path.resolve('.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));const data=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
try{
const page=await browser.newPage(),url=`http://127.0.0.1:${server.address().port}`;await (await import('../ui-smoke-helpers.mjs')).unlockFamily(page);
const click=s=>page.$eval(s,e=>e.click());
const data=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('jasper-quizmo')));
async function load(value){await page.goto(url);await page.evaluate(v=>localStorage.setItem('jasper-quizmo',JSON.stringify(v)),value);await page.reload();await click('#quizmoTab');}
async function answer(){const task=await page.evaluate(()=>window.JasperQuizmo.current());if(task.choices){await click(`[data-choice="${task.correct}"]`);return;}for(let i=0;i<task.answers.length;i++){await click(`[data-field="${i}"]`);for(const d of String(task.answers[i]))await click(`[data-key="${d}"]`);}await click('[data-q-action=check]');}
const request={id:'saved-request',date:'2026-10-01',name:'Rocket race',about:'Moon racing',built:false};
await load({score:70,levels:{addition:4,subtraction:5,links:4},stars:{addition:3,subtraction:4,links:3},points:{current:40,lifetime:140,milestones:1},requests:[request],runs:{addition:{level:4,replay:false,paid:[],complete:false},subtraction:{level:5,replay:false,paid:[0],complete:false}}});
await click('[data-game=addition]');
const before=await data();
await click('[data-q-action=reset-game]');
assert(await page.$eval('#quizmoResetConfirm',e=>e.open&&e.parentElement===document.body));
await click('[data-cancel-reset]');await page.waitForSelector('#quizmoResetConfirm',{hidden:true});assert.deepEqual(await data(),before);
await click('[data-q-action=reset-game]');await page.keyboard.press('Escape');await page.waitForSelector('#quizmoResetConfirm',{hidden:true});assert.deepEqual(await data(),before);
await click('[data-q-action=reset-game]');await click('[data-confirm-reset]');await page.waitForSelector('#quizmoResetConfirm',{hidden:true});
const reset=await data();assert.equal(reset.levels.addition,1);assert.equal(reset.stars.addition,0);assert.equal(reset.runs.addition,undefined);assert.equal(reset.best.addition,3);
assert.equal(reset.levels.subtraction,5);assert.equal(reset.stars.subtraction,4);assert.deepEqual(reset.runs.subtraction,before.runs.subtraction);
assert.deepEqual(reset.points,before.points);assert.deepEqual(reset.requests,before.requests);assert.equal(reset.score,before.score);
assert.equal(await page.$eval('.quizmo-game-heading p',e=>e.textContent),'Level 1 / 8 · Question 1 / 5');
for(let i=0;i<5;i++)await answer();
const completed=await data();assert.equal(completed.points.current,reset.points.current+7);assert.equal(completed.points.lifetime,reset.points.lifetime+7);assert.equal(completed.best.addition,3);
await click('[data-q-action=home]');await click('[data-q-action=cogat]');await click('[data-game=links]');assert(await page.$('.reset-game'));
await click('.reset-game');await click('[data-confirm-reset]');await page.waitForSelector('#quizmoResetConfirm',{hidden:true});
assert.equal((await data()).levels.links,1);assert.equal((await data()).stars.links,0);assert.equal((await data()).best.links,3);assert.equal((await data()).runs.links,undefined);
await click('[data-q-action=home]');await click('[data-q-action=math]');await click('[data-game=addition]');
await fs.mkdir('/workspace/ui-audit',{recursive:true});
for(const [width,height] of [[1366,768],[900,500],[844,390],[390,844]]){
 await page.setViewport({width,height});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}x${height}`);
 for(const selector of ['.reset-game','.restart-level'])assert(await page.$eval(selector,e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&r.width>=48&&r.height>=48;}),`${selector} at ${width}x${height}`);
 assert(await page.evaluate(()=>document.querySelector('.quizmo-tools').getBoundingClientRect().bottom<=document.querySelector('.quizmo-board').getBoundingClientRect().top),`board overlap at ${width}x${height}`);
 if(width!==900)await page.screenshot({path:`/workspace/ui-audit/quizmo-reset-${width}x${height}.png`});
 if(width===1366||width===390){await click('.reset-game');await page.screenshot({path:`/workspace/ui-audit/quizmo-reset-${width}x${height}-confirm.png`});await click('[data-cancel-reset]');await page.waitForSelector('#quizmoResetConfirm',{hidden:true});}
}
console.log('PASS reset: migration, cancel/Escape, game-only reset, preserved points/requests/score, replay +7, CogAT and four layouts');
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
