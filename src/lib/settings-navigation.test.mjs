import {test} from 'node:test';
import assert from 'node:assert/strict';
import {settingsCategories, settingsCategory, settingsReturnPath} from './settings-navigation.ts';
test('Settings categories have stable destinations and unknown categories fall back to General',()=>{
  assert.equal(settingsCategories.length,7);
  for(const item of settingsCategories) assert.equal(settingsCategory(item.id),item.id);
  for(const value of [undefined,null,[],['security'],'https://evil.example','SECURITY','unknown']) assert.equal(settingsCategory(value),'general');
});
test('save and SMTP redirects preserve only allowlisted category context and existing status',()=>{
  assert.equal(settingsReturnPath('https://wideorder.net/api/admin/settings?category=integrations','/admin/settings?status=saved'),'/admin/settings?status=saved&category=integrations');
  assert.equal(settingsReturnPath('https://wideorder.net/api/admin/smtp?category=communications','/admin/settings?error=smtp_not_configured'),'/admin/settings?error=smtp_not_configured&category=communications');
  assert.equal(settingsReturnPath('https://wideorder.net/api/admin/settings?category=https://evil.example','/admin/settings?status=saved'),'/admin/settings?status=saved');
  assert.equal(settingsReturnPath('https://wideorder.net/api/admin/settings?category=security','/admin/login?status=password_changed'),'/admin/login?status=password_changed');
});
