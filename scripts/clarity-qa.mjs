import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const base=process.env.QA_BASE_URL || 'http://localhost:3110';
assert.ok(new URL(base).hostname==='localhost','Local fixture only');
const out='.release/clarity-v040002';await mkdir(out,{recursive:true});
const browser=await chromium.launch();
let checks=0;
try {
 const context=await browser.newContext({reducedMotion:'reduce',hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);const scene=page.locator('.clarity');await scene.scrollIntoViewIfNeeded();await page.waitForTimeout(100);assert.equal(await scene.getAttribute('data-stage'),'2');
 await page.evaluate(()=>{window.originalPieces=[...document.querySelectorAll('.clarity__segment,.clarity__node')];});
 for(const width of [320,390,768,1440]) {await page.setViewportSize({width,height:1000});for(const theme of ['light','dark','option3-light','option3-dark']) {await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);for(let stage=0;stage<3;stage++) {
 await scene.locator('button').nth(stage).tap();assert.equal(await scene.getAttribute('data-stage'),String(stage));assert.equal(await scene.locator('.clarity__segment').count(),8);assert.equal(await scene.locator('.clarity__node').count(),6);
 assert.equal(await page.evaluate(()=>window.originalPieces.every((e,i)=>e===[...document.querySelectorAll('.clarity__segment,.clarity__node')][i])),true);
 const geometry=await scene.evaluate(el=>{const box=el.getBoundingClientRect();const labels=[...el.querySelectorAll('.clarity__node > span')].map(n=>n.getBoundingClientRect());return labels.every(r=>r.left>=box.left&&r.right<=box.right&&r.width>0)&&labels.every((a,i)=>labels.every((b,j)=>i===j||a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom))&&document.documentElement.scrollWidth<=innerWidth;});assert.equal(geometry,true,`${width} ${theme} ${stage}`);
 await scene.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await scene.screenshot({path:`${out}/${theme}-${width}-${stage}.png`});checks++;
 }}}
 await scene.locator('button').nth(0).focus();await page.keyboard.press('Enter');assert.equal(await scene.getAttribute('data-stage'),'0');await page.keyboard.press('Tab');await page.keyboard.press('Space');assert.equal(await scene.getAttribute('data-stage'),'1');await scene.locator('button').nth(2).hover();assert.equal(await scene.getAttribute('data-stage'),'1');assert.equal(await scene.locator('.clarity__node').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');assert.deepEqual(errors,[]);await context.close();
 const motion=await browser.newContext({hasTouch:true});const p=await motion.newPage();await p.goto(base);const c=p.locator('.clarity');await c.scrollIntoViewIfNeeded();
 const sample=()=>c.evaluate(el=>({stage:el.dataset.stage,transforms:[...el.querySelectorAll('.clarity__segment,.clarity__node')].map(n=>getComputedStyle(n).transform),animations:el.querySelector('.clarity__canvas').getAnimations({subtree:true}).map(a=>({time:a.currentTime,state:a.playState}))}));
 await p.waitForFunction(()=>document.querySelector('.clarity').dataset.stage==='1');await p.waitForTimeout(150);
 await c.locator('.clarity__heading').click();await p.waitForTimeout(50);const frozen=await sample();assert.ok(frozen.animations.length>0);assert.ok(frozen.animations.every(a=>a.state==='paused'));
 await p.waitForTimeout(2300);assert.deepEqual(await sample(),frozen,'all frame/card positions and progress remain frozen');
 await c.locator('.clarity__heading').tap();await p.waitForTimeout(2900);assert.deepEqual(await sample(),frozen,'repeat touch extends pause without restarting progress');
 await p.waitForTimeout(1900);assert.deepEqual(await sample(),frozen,'still frozen 4.8 seconds after last touch');
 await p.waitForTimeout(300);const resumed=await sample();assert.equal(resumed.stage,frozen.stage);assert.notDeepEqual(resumed.transforms,frozen.transforms);assert.ok(resumed.animations.some(a=>a.state==='running'));assert.ok(resumed.animations.every((a,i)=>a.time>=frozen.animations[i].time&&a.time<frozen.animations[i].time+300),'resume advances from preserved progress');
 await p.waitForTimeout(750);assert.equal((await sample()).animations.length,0,'transition settles before next stage');
 await p.waitForFunction(()=>document.querySelector('.clarity').dataset.stage==='2');await p.waitForFunction(()=>document.querySelector('.clarity').dataset.stage==='0');
 await c.locator('button').nth(2).focus();await p.keyboard.press('Enter');await p.waitForTimeout(50);const manual=await sample();assert.equal(manual.stage,'2');await p.waitForTimeout(700);assert.deepEqual(await sample(),manual,'keyboard selection also freezes new transitions');
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(150);assert.equal(await c.getAttribute('data-stage'),'2');await c.locator('button').nth(0).tap();await p.waitForTimeout(5200);assert.equal(await c.getAttribute('data-stage'),'0');assert.equal((await sample()).animations.length,0);
 console.log(`PASS ${checks} state/theme/viewport checks; exact mid-transition frame/card pause and progress resume, repeated touch pause reset, keyboard, continuous loop and reduced motion; screenshots in ${out}`);
} finally {await browser.close();}
