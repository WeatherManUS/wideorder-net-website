import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const base='http://localhost:3105';
const {password}=JSON.parse(readFileSync('.release/inquiry-qa-credentials.json','utf8'));
const profiles={SOCIAL_LINKEDIN_URL:'https://www.linkedin.com/company/wideorder',SOCIAL_FACEBOOK_URL:'https://www.facebook.com/wideorder',SOCIAL_X_URL:'https://x.com/wideorder',SOCIAL_INSTAGRAM_URL:'https://www.instagram.com/wideorder/',SOCIAL_YOUTUBE_URL:'https://www.youtube.com/@wideorder'};
const browser=await chromium.launch();const admin=await browser.newContext();const visitor=await browser.newContext();const p=await admin.newPage();const publicPage=await visitor.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));publicPage.on('pageerror',e=>errors.push(e.message));
const post=(context,form,origin=base)=>context.request.post(base+'/api/admin/settings?category=marketing',{form,headers:{Origin:origin},maxRedirects:0});
const save=async(values)=>{await p.goto(base+'/admin/settings?category=marketing');for(const [key,value] of Object.entries(values))await p.locator(`[name="${key}"]`).fill(value);await p.getByRole('button',{name:'Save settings',exact:true}).click();await p.waitForURL(/category=marketing.*status=saved|status=saved.*category=marketing/);};
const count=async(n)=>{await publicPage.goto(base);assert.equal(await publicPage.locator('footer .social-links a').count(),n);assert.equal(await publicPage.locator('footer .social-links').count(),n?1:0);};
try{
 await admin.request.post(base+'/api/admin/login',{form:{password},headers:{Origin:base}});
 await save(Object.fromEntries(Object.keys(profiles).map(k=>[k,''])));await count(0);assert.match((await post(visitor,profiles)).headers().location,/unauthenticated/);
 assert.match((await post(admin,profiles,'https://evil.example')).headers().location,/csrf/);
 await p.goto(base+'/admin/settings?category=marketing');assert.equal(await p.getByRole('heading',{name:'Social Media Links'}).count(),1);assert.equal(await p.locator('input[type="url"]').count(),5);
 await save({SOCIAL_LINKEDIN_URL:profiles.SOCIAL_LINKEDIN_URL});await count(1);
 const bad=await post(admin,{SOCIAL_LINKEDIN_URL:'https://evil.example/name'});assert.match(bad.headers().location,/invalid_setting/);await count(1);
 await save(profiles);await count(5);
 await publicPage.goto(base+'/contact');assert.equal(await publicPage.locator('aside .social-links a').count(),5);assert.ok(await publicPage.locator('aside').textContent().then(t=>t.includes('Prefer email?')));
 assert.equal(await publicPage.getByRole('navigation',{name:'Footer navigation',exact:true}).count(),0);
 assert.deepEqual(await publicPage.locator('.site-footer__legal').evaluate(el=>[...el.children].map(e=>e.tagName)),['NAV','BUTTON','P','P']);
 await publicPage.locator('footer .tracking-preferences').click();await publicPage.getByRole('dialog').waitFor();await publicPage.keyboard.press('Escape');
 assert.equal(await publicPage.locator('footer a[href="/privacy"]').count(),1);
 const metadata=await (await publicPage.request.get(base+'/version.json')).json();assert.equal(await publicPage.locator('footer [data-release-version]').getAttribute('data-release-version'),metadata.version);
 assert.ok(await publicPage.locator('.site-footer__copyright').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)<parseFloat(getComputedStyle(document.body).fontSize)));

 mkdirSync('.release/social-links',{recursive:true});await publicPage.locator('aside').screenshot({path:'.release/social-links/contact-social.png'});
 await publicPage.goto(base);await publicPage.waitForLoadState('networkidle');
 mkdirSync('.release/social-links',{recursive:true});
 for(const width of [320,390,768,1200,1440]){await publicPage.setViewportSize({width,height:1000});for(const theme of ['light','dark','option3-light','option3-dark']){await publicPage.evaluate(t=>document.documentElement.dataset.theme=t,theme);const group=publicPage.locator('footer .social-links');
 await publicPage.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
 if(width<1440){const toggle=publicPage.getByRole('button',{name:'Open navigation menu'});await toggle.click();assert.equal(await publicPage.locator('.mobile-navigation__panel .social-links a').count(),5);assert.equal(await publicPage.locator('.mobile-navigation__panel').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}),true);await publicPage.locator('.mobile-navigation__panel').screenshot({path:`.release/social-links/menu-${theme}-${width}.png`});await publicPage.keyboard.press('Escape');await publicPage.waitForFunction(()=>document.querySelector('.mobile-navigation__toggle')===document.activeElement);assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await toggle.evaluate(e=>e===document.activeElement),true);}
 else {assert.equal(await publicPage.locator('.site-header__social').isVisible(),true);assert.equal(await publicPage.locator('header').evaluate(el=>{const contact=el.querySelector('.primary-nav a[href="/contact"]').getBoundingClientRect();const socials=el.querySelector('.site-header__social').getBoundingClientRect();const cta=el.querySelector('.site-header__cta').getBoundingClientRect();return contact.right<=socials.left&&socials.right<=cta.left;}),true);}
 await publicPage.locator('header').screenshot({path:`.release/social-links/header-${theme}-${width}.png`});
await group.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));assert.equal(await publicPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);for(const link of await group.locator('a').all()){assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');assert.match(await link.getAttribute('aria-label'),/^WideOrder on/);assert.equal(await link.locator('svg').count(),1);}await group.locator('a').first().focus();assert.equal(await group.locator('a').first().evaluate(e=>e.matches(':focus-visible')),true);await publicPage.locator('footer').screenshot({path:`.release/social-links/${theme}-${width}.png`});}}
 await save({SOCIAL_LINKEDIN_URL:'https://linkedin.com/company/replacement'});await count(5);assert.equal(await publicPage.locator('footer [data-social-platform="linkedin"]').getAttribute('href'),'https://linkedin.com/company/replacement');
 await save(Object.fromEntries(Object.keys(profiles).map(k=>[k,''])));await count(0);assert.deepEqual(errors,[]);
 console.log('PASS: blank/one/all profiles, invalid and atomic save rejection, replace/clear, independent anonymous visitor sees runtime saves, anonymous/CSRF rejection, 20 theme/viewport screenshots, header/contact/footer placement, mobile Escape/focus, tracking dialog and dynamic version, accessible links/focus. Local fixture only.');
}finally{await browser.close();}
