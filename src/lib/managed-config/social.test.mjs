import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {socialPlatforms,normalizeSocialUrl} from './social.ts';
Object.assign(process.env,{NODE_ENV:'test',WIDEORDER_DATABASE_URL:'',MYSQL_HOST:'',DB_HOST:'',WIDEORDER_LOCAL_CONFIG_DB_PATH:path.join(mkdtempSync(path.join(tmpdir(),'wideorder-social-')),'fixture.sqlite'),WIDEORDER_CONFIG_ENCRYPTION_KEY:randomUUID()});
const {updateManagedSettings,getRuntimeSocialProfiles,getRecentAuditViews,getAdminSettingViews}=await import('./service.ts');
const valid={SOCIAL_LINKEDIN_URL:'https://www.linkedin.com/company/wideorder',SOCIAL_FACEBOOK_URL:'https://www.facebook.com/wideorder',SOCIAL_X_URL:'https://x.com/wideorder',SOCIAL_INSTAGRAM_URL:'https://www.instagram.com/wideorder/',SOCIAL_YOUTUBE_URL:'https://www.youtube.com/@wideorder'};
test('accept normal profile, company and channel formats and blanks',()=>{
 for(const [key,url] of Object.entries(valid)){assert.equal(normalizeSocialUrl(key,' '+url+' '),url);assert.equal(normalizeSocialUrl(key,' '),'');}
 for(const [key,url] of [['SOCIAL_FACEBOOK_URL','https://facebook.com/profile.php?id=12345'],['SOCIAL_FACEBOOK_URL','https://facebook.com/people/WideOrder/12345'],['SOCIAL_LINKEDIN_URL','https://linkedin.com/in/person'],['SOCIAL_X_URL','https://twitter.com/wideorder'],['SOCIAL_YOUTUBE_URL','https://youtube.com/channel/UC123'],['SOCIAL_YOUTUBE_URL','https://youtube.com/c/WideOrder'],['SOCIAL_YOUTUBE_URL','https://youtube.com/user/WideOrder']]) assert.equal(normalizeSocialUrl(key,url),url);
});
test('reject malformed, unsafe, wrong-platform and redirect-style URLs',()=>{
 for(const item of socialPlatforms){const url=valid[item.key];for(const bad of [url.replace('https:','http:'),url.replace('https:','javascript:'),url.replace('https://','https://user:password@'),url.replace('.com','.com.evil.test'),url.replace('.com','.com:8443'),url+'?token=secret',url+'#fragment','//x.com/wideorder','https://evil.example/profile','https://'+item.hosts[0]+'/',url+'%0a',url+'%',url+'\\bad']) assert.throws(()=>normalizeSocialUrl(item.key,bad),bad);}
 assert.throws(()=>normalizeSocialUrl('SOCIAL_LINKEDIN_URL',valid.SOCIAL_X_URL));
});
test('persist, replace, clear and read immediately; invalid batches are atomic and audits omit URL values',async()=>{
 assert.deepEqual(await getRuntimeSocialProfiles(),[]);
 process.env.SOCIAL_LINKEDIN_URL=valid.SOCIAL_LINKEDIN_URL;process.env.SOCIAL_LINKEDIN_VERIFIED='false';assert.deepEqual(await getRuntimeSocialProfiles(),[]);
 process.env.SOCIAL_LINKEDIN_VERIFIED='true';assert.equal((await getRuntimeSocialProfiles()).length,1);delete process.env.SOCIAL_LINKEDIN_URL;delete process.env.SOCIAL_LINKEDIN_VERIFIED;
 await updateManagedSettings({SOCIAL_LINKEDIN_URL:valid.SOCIAL_LINKEDIN_URL},'fixture');assert.equal((await getRuntimeSocialProfiles()).length,1);
 await updateManagedSettings(valid,'fixture');assert.equal((await getRuntimeSocialProfiles()).length,5);
 await assert.rejects(updateManagedSettings({SOCIAL_LINKEDIN_URL:'https://linkedin.com/company/changed',SOCIAL_X_URL:'https://evil.test/name'},'fixture'));
 assert.equal((await getRuntimeSocialProfiles())[0].url,valid.SOCIAL_LINKEDIN_URL);
 await updateManagedSettings({SOCIAL_LINKEDIN_URL:'https://linkedin.com/company/replacement'},'fixture');assert.equal((await getRuntimeSocialProfiles())[0].url,'https://linkedin.com/company/replacement');
 const blank=Object.fromEntries(socialPlatforms.map(x=>[x.key,'']));await updateManagedSettings(blank,'fixture');process.env.SOCIAL_LINKEDIN_URL=valid.SOCIAL_LINKEDIN_URL;assert.deepEqual(await getRuntimeSocialProfiles(),[]);
 assert.ok((await getAdminSettingViews()).filter(v=>v.key.startsWith('SOCIAL_')).every(v=>v.value===''));
 assert.ok(!JSON.stringify(await getRecentAuditViews(30)).includes('https://'));
});
