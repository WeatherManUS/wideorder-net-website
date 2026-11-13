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
 const motion=await browser.newContext();const p=await motion.newPage();await p.goto(base);const c=p.locator('.clarity');await c.scrollIntoViewIfNeeded();await p.waitForTimeout(1500);assert.equal(await c.getAttribute('data-stage'),'1');await p.waitForTimeout(1900);assert.equal(await c.getAttribute('data-stage'),'2');await p.waitForTimeout(2000);assert.equal(await c.getAttribute('data-stage'),'2');await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));await c.scrollIntoViewIfNeeded();assert.equal(await c.getAttribute('data-stage'),'2');
 for(let i=0;i<3;i++){await c.locator('button').nth(i).click();await p.waitForTimeout(950);await c.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await c.screenshot({path:`${out}/motion-desktop-${i}.png`});}
 await p.reload();await c.scrollIntoViewIfNeeded();await c.locator('button').nth(0).click();await p.waitForTimeout(3500);assert.equal(await c.getAttribute('data-stage'),'0');
 await p.reload();await c.scrollIntoViewIfNeeded();await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(150);assert.equal(await c.getAttribute('data-stage'),'2');
 console.log(`PASS ${checks} state/theme/viewport checks; persistent elements, labels, touch, keyboard, hover, reduced motion, autoplay once and interruption; screenshots in ${out}`);
} finally {await browser.close();}
