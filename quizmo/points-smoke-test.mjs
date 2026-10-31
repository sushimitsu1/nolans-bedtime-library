// Run from repo root: node quizmo/points-smoke-test.mjs
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
await load({stars:{addition:0},levels:{addition:1}});await click('[data-game=addition]');await answer();assert.equal((await data()).points.current,1);
await click('[data-q-action=restart]');await answer();assert.equal((await data()).points.current,1);await page.reload();await click('#quizmoTab');await click('[data-game=addition]');await answer();assert.equal((await data()).points.current,1);await answer();await answer();await answer();await answer();assert.equal((await data()).points.current,20);assert.equal((await data()).stars.addition,1);
await click('[data-q-action=restart]');for(let i=0;i<5;i++)await answer();assert.equal((await data()).points.current,20);
await load({stars:{addition:4},levels:{addition:4}});await click('[data-game=addition]');for(let i=0;i<5;i++)await answer();assert.equal((await data()).points.current,15);
await load({points:{current:99,lifetime:99},stars:{addition:3},levels:{addition:4}});await click('[data-game=addition]');await answer();assert.equal((await data()).points.current,102);await click('[data-q-action=home]');await page.waitForSelector('#quizmoReward');
await fs.mkdir('/workspace/ui-audit',{recursive:true});await page.setViewport({width:1366,height:768});await page.screenshot({path:'/workspace/ui-audit/quizmo-points-reward.png'});
await click('#quizmoReward [data-dismiss]');await page.waitForFunction(()=>!document.getElementById('quizmoReward'));assert.equal(await page.$('#quizmoReward'),null);await click('[data-q-action=reward]');await click('#quizmoReward [data-idea]');assert(await page.$eval('#quizmoReward textarea',e=>e.value.length>0));await page.$eval('#quizmoReward input',e=>e.value='');await page.$eval('#quizmoReward textarea',e=>e.value='');await page.type('#quizmoReward input','Rocket race');await page.type('#quizmoReward textarea','Race rockets around the moon');await click('#quizmoReward button[type=submit]');assert.equal((await data()).points.current,2);assert.equal((await data()).points.lifetime,102);assert.equal((await data()).requests[0].built,false);assert.equal((await data()).points.milestones,1);assert.equal((await data()).requests[0].name,'Rocket race');assert.match(await page.$eval('#quizmoGrownups',e=>e.textContent),/Rocket race/);
await click('#settingsButton');await click('[data-built]');assert.equal((await data()).requests[0].built,true);await click('[data-adjust]');assert.equal((await data()).points.current,12);await page.$eval('#quizmoAdjustment',e=>e.value='-5');await click('[data-adjust]');assert.equal((await data()).points.current,7);assert.equal((await data()).points.lifetime,112);await click('[data-reset]');assert.equal((await data()).points.current,0);assert.equal((await data()).stars.addition,3);assert.equal((await data()).levels.addition,4);
await load({score:65,stars:{addition:3},levels:{addition:4}});assert.match(await page.$eval('.quizmo-points',e=>e.textContent),/65 points/);
await load({points:{current:65,lifetime:165},stars:{addition:3},levels:{addition:4}});
for(const [width,height] of [[1366,768],[1280,720],[900,500],[390,844],[375,667],[844,390]]){await page.setViewport({width,height});assert(await page.$eval('.quizmo-points',e=>e.getBoundingClientRect().right<=innerWidth));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(width===1366||width===390)await page.screenshot({path:`/workspace/ui-audit/quizmo-points${width===390?'-phone':''}.png`});await click('[data-game=addition]');assert(await page.$eval('.quizmo-tools .quizmo-points',e=>e.getBoundingClientRect().right<=innerWidth));assert(await page.$$eval('#quizmoView button',els=>els.every(e=>{const r=e.getBoundingClientRect();return !r.width||(r.width>=48&&r.height>=48);}))); await click('[data-q-action=home]');}
await click('[data-q-action=cogat]');await click('[data-game=links]');await answer();assert.equal((await data()).points.current,66);
// A pre-upgrade run paid only slots 0–2. Those remain paid in a five-slot round.
await load({levels:{addition:1},runs:{addition:{level:1,replay:false,paid:[0,1,2],complete:false}},points:{current:3,lifetime:3},recent:{addition:[null,17,'old-signature',...Array(40).fill('older')]}});
await click('[data-game=addition]');
for(let i=0;i<3;i++)await answer();assert.equal((await data()).points.current,3);
for(let i=0;i<2;i++)await answer();assert.equal((await data()).points.current,20);
assert.equal((await data()).recent.addition.length,30);assert((await data()).recent.addition.every(s=>typeof s==='string'));
await click('[data-q-action=restart]');for(let i=0;i<5;i++)await answer();assert.equal((await data()).points.current,20);
// Fresh history survives reload; Restart creates a different set without replacing paid slots.
await click('[data-q-action=home]');await click('[data-game=addition]');
const oldTask=await page.evaluate(()=>window.JasperQuizmo.current().sig);
await page.reload();await click('#quizmoTab');await click('[data-game=addition]');
assert.notEqual(await page.evaluate(()=>window.JasperQuizmo.current().sig),oldTask);
console.log('PASS points: earning, bonuses, replay, restart, CogAT, rewards, requests, grown-ups, preservation and six layouts');
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
