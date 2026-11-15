import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const base=process.env.QA_BASE_URL||'http://localhost:3100';
const out='.release/positioning';mkdirSync(out,{recursive:true});
const routes=['/','/what-we-do','/how-we-work','/our-work','/our-approach','/contact','/our-work/month-end-reporting','/our-work/retail-pricing','/our-work/technology-deployment','/our-work/remote-infrastructure-printing'];
const browser=await chromium.launch();const results=[];const errors=[];
try {
 for(const theme of ['light','dark','option3-light','option3-dark']){
  const context=await browser.newContext({reducedMotion:'reduce'});await context.addInitScript(t=>localStorage.setItem('wideorder-theme',t),theme);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const width of [390,1440]){await page.setViewportSize({width,height:1000});
   for(const route of routes){const response=await page.goto(base+route);assert.equal(response.status(),200);await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('main h1').count(),1);assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://wideorder.net'+(route==='/'?'':route));
    assert.ok(await page.locator('meta[name="description"]').getAttribute('content'));assert.ok(await page.locator('meta[property="og:description"]').getAttribute('content'));
    const text=await page.locator('main').innerText();const all=await page.locator('main').textContent();
    results.push({theme,width,route,visibleWords:text.split(/\s+/).length,totalWords:all.trim().split(/\s+/).length,height:await page.locator('main').evaluate(e=>e.offsetHeight)});
    if(route==='/'){assert.match(text,/one department, system or supplier/);assert.match(text,/Understand it where it happens/);assert.equal(await page.getByRole('link',{name:/Explore Our Approach/}).getAttribute('href'),'/our-approach');}
    if(route==='/our-approach'){assert.match(text,/founding principle/);assert.match(text,/Client information remains under client control by default/);}
    if(route==='/contact'){assert.equal(await page.locator('#inquiry-form').count(),1);assert.match(all,/Do not include credentials/);assert.equal(await page.locator('input[name="email"]').getAttribute('type'),'email');}
    if(route.includes('/our-work/')){const detail=page.locator('.comparison details').first();await detail.locator('summary').click();assert.equal(await detail.getAttribute('open'),'');await page.keyboard.press('Tab');}
    if(route==='/'||route==='/our-approach'||(theme==='light'&&route==='/contact'))await page.screenshot({path:`${out}/${route.replaceAll('/','_')||'home'}-${theme}-${width}.png`,fullPage:true});
   }
  }
  await context.close();
 }
 const smoke=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await smoke.goto(base);await smoke.keyboard.press('Tab');assert.equal(await smoke.locator('.skip-link').evaluate(e=>e===document.activeElement),true);
 await smoke.keyboard.press('Enter');assert.equal(await smoke.locator('main').evaluate(e=>e===document.activeElement),true);
 await smoke.getByRole('button',{name:'Open navigation menu'}).click();await smoke.locator('.mobile-navigation__panel').getByRole('link',{name:'Contact',exact:true}).click();await smoke.waitForURL('**/contact');assert.equal(await smoke.getByRole('button',{name:'Open navigation menu'}).getAttribute('aria-expanded'),'false');
 await smoke.goto(base+'/our-work/month-end-reporting');const summary=smoke.locator('.comparison summary').first();await summary.focus();await smoke.keyboard.press('Enter');assert.equal(await smoke.locator('.comparison details').first().getAttribute('open'),'');
 assert.deepEqual(errors,[]);writeFileSync(out+'/results.json',JSON.stringify(results,null,2));console.log(`PASS ${results.length} route/theme/viewport checks; metadata, content, contact fields, comparisons, reduced-motion rendering and overflow.`);
}finally{await browser.close();}
