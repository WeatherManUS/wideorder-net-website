import assert from 'node:assert/strict';
import {test} from 'node:test';
import {siteContent,positioning} from './home.ts';
import {comparisons} from './comparisons.ts';
test('approved positioning and founding principle remain explicit',()=>{
 assert.match(siteContent.home.hero.statement,/department, system or supplier/);
 assert.match(positioning.insituCore,/founding principle/);
 assert.match(positioning.dimensions[2].body,/Exceptions require explicit authorization/);
 assert.match(positioning.personnel,/Clients receive the identity, authorization and accountability/);
});
test('case measurements keep distinct baselines and qualifications',()=>{
 const reporting=siteContent.ourWork.stories.find(s=>s.id==='month-end-reporting');
 assert.match(reporting.challenge,/20 hours/);assert.match(reporting.challenge,/2.5 standard eight-hour/);
 assert.doesNotMatch(reporting.challenge,/two additional|three days/);
 assert.match(reporting.betterWay,/approximately 10 minutes.*background computer processing/);
 assert.match(comparisons['retail-pricing'].note,/not a measured per-run/);
 assert.match(comparisons['technology-deployment'].after,/Up to 16/);
 assert.match(comparisons['remote-infrastructure-printing'].note,/not a universal uptime guarantee/);
});
test('Discovery and contact preserve commercial and information boundaries',()=>{
 const discovery=siteContent.howWeWork.stages[1];
 assert.equal(discovery.outcomes.length,6);assert.match(discovery.paragraphs.join(' '),/does not guarantee/);
 assert.match(siteContent.contact.helperText,/Do not include credentials/);
});
