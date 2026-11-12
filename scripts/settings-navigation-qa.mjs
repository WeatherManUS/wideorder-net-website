import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {settingsCategories} from '../src/lib/settings-navigation.ts';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const {password}=JSON.parse(readFileSync(new URL('../.release/inquiry-qa-credentials.json',import.meta.url)));
const base='http://localhost:3105';const out='.release/v040001/settings';mkdirSync(out,{recursive:true});
const browser=await chromium.launch();const context=await browser.newContext();const page=await context.newPage();const errors=[];const report=[];
page.on('pageerror',e=>errors.push(e.message));
try {
 const login=await context.request.post(base+'/api/admin/login',{form:{password},headers:{Origin:base},maxRedirects:0});assert.equal(login.status(),303);
 await page.goto(base+'/admin/settings');await page.getByRole('navigation',{name:'Settings categories'}).waitFor();
 const nav=()=>page.getByRole('navigation',{name:'Settings categories'});
 assert.equal(await nav().locator('a[aria-current="page"]').innerText(),'General');
 await nav().getByRole('link',{name:'Communications',exact:true}).focus();await page.keyboard.press('Enter');
 await page.getByRole('heading',{name:'Email / SMTP',exact:true}).waitFor();
 await page.locator('[name="SMTP_FROM_NAME"]').fill('Category QA');
 const submitted=page.waitForRequest(r=>r.method()==='POST'&&r.url().includes('/api/admin/settings'));
 await page.getByRole('button',{name:'Save settings',exact:true}).click();await page.waitForURL(/status=saved.*category=communications/);
 assert.ok(!(await submitted).postData().includes('TURNSTILE'));
 assert.equal(await page.locator('[name="SMTP_FROM_NAME"]').inputValue(),'Category QA');
 await nav().getByRole('link',{name:'Integrations',exact:true}).click();
 await page.getByRole('heading',{name:'Contact form protection / Turnstile'}).waitFor();
 assert.equal(await page.locator('[name="TURNSTILE_SECRET_KEY"]').inputValue(),'');
 const integrationSave=page.waitForRequest(r=>r.method()==='POST'&&r.url().includes('/api/admin/settings'));
 await page.getByRole('button',{name:'Save settings',exact:true}).click();await page.waitForURL(/status=saved.*category=integrations/);
 assert.ok(!(await integrationSave).postData().includes('SMTP_'));
 assert.equal(await page.locator('[name="TURNSTILE_SECRET_KEY"]').inputValue(),'');
 await nav().getByRole('link',{name:'Communications',exact:true}).click();
 assert.equal(await page.locator('[name="SMTP_FROM_NAME"]').inputValue(),'Category QA');
 await page.getByRole('button',{name:'Test connection',exact:true}).click();await page.waitForURL(/smtp_not_configured.*category=communications/);
 await page.getByLabel('Find inquiry by reference').fill('00000000-0000-4000-8000-000000000000');await page.getByRole('button',{name:'Find inquiry',exact:true}).click();
 await page.getByText('No inquiry found for that reference.').waitFor();assert.equal(new URL(page.url()).searchParams.get('category'),'communications');
 await page.getByRole('link',{name:'Show recent inquiries'}).click();assert.equal(new URL(page.url()).searchParams.get('category'),'communications');
 await page.goto(base+'/admin/settings#security-access');await page.waitForURL(/category=security/);await page.getByRole('heading',{name:'Security & Access',exact:true}).waitFor();
 await page.goto(base+'/admin/settings?category=unknown');assert.equal(await nav().locator('a[aria-current="page"]').innerText(),'General');
 await nav().getByRole('link',{name:'Branding & Appearance'}).click();await page.getByText('Coming in a future release.').waitFor();
 await nav().getByRole('link',{name:'Marketing & Social'}).click();await page.getByRole('heading',{name:'Marketing & Social',exact:true}).waitFor();
 await page.goBack();await page.getByRole('heading',{name:'Branding & Appearance',exact:true}).waitFor();
 await page.goForward();await page.getByRole('heading',{name:'Marketing & Social',exact:true}).waitFor();
 const storageState=await context.storageState();
 for(const theme of ['light','dark','option3-light','option3-dark']) for(const width of [320,390,768,1440]) {
  const device=await browser.newContext({storageState,viewport:{width,height:900},hasTouch:width<900});await device.addInitScript(theme=>localStorage.setItem('wideorder-theme',theme),theme);
  const tab=await device.newPage();tab.on('pageerror',e=>errors.push(e.message));await tab.goto(base+'/admin/settings');
  for(const category of settingsCategories) {
   const link=tab.getByRole('navigation',{name:'Settings categories'}).getByRole('link',{name:category.label,exact:true});
   if(width<900) await link.tap();else await link.click();
   await tab.locator('.settings-panel').getByRole('heading',{name:category.label,exact:true}).waitFor();
   assert.equal(await tab.getByRole('navigation',{name:'Settings categories'}).locator('a[aria-current="page"]').innerText(),category.label);
   assert.equal(await tab.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${theme}/${width}/${category.id}`);
   if(['communications','security'].includes(category.id)) await tab.screenshot({path:`${out}/${theme}-${width}-${category.id}.png`,fullPage:true});
   report.push({theme,width,category:category.id});
  }
  await device.close();
 }
 const noJS=await browser.newContext({storageState,javaScriptEnabled:false});const plain=await noJS.newPage();await plain.goto(base+'/admin/settings');
 await plain.getByRole('navigation',{name:'Settings categories'}).getByRole('link',{name:'Integrations',exact:true}).click();
 await plain.getByRole('heading',{name:'Integrations',exact:true}).waitFor();assert.equal(await plain.locator('[name="NEXT_PUBLIC_TURNSTILE_SITE_KEY"]').count(),1);await noJS.close();
 assert.deepEqual(errors,[]);writeFileSync(`${out}/report.json`,JSON.stringify({result:'passed',combinations:report.length,checks:report,pageErrors:errors},null,2));
 console.log(`PASS: ${report.length} category/theme/viewport combinations, touch and keyboard navigation, back/forward, legacy anchors, no-JS navigation, category-preserving saves/errors/search, isolated SMTP/Turnstile forms and masked secrets. No email sent.`);
}finally{await browser.close();}
