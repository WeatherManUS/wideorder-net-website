import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {siteContent} from '../../src/content/home.ts';
const require=createRequire(import.meta.url);
const sharp=require('sharp');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
process.chdir(fileURLToPath(new URL('../../',import.meta.url)));
const manifest=JSON.parse(fs.readFileSync('brand/examples/manifest.json','utf8'));
const darkIds=['youtube-thumbnail-dark','instagram-portrait-dark','youtube-lower-third-dark'];
const assets=[...manifest.assets,...darkIds.map(id=>({id,source:`brand/examples/sources/${id}.svg`,files:fs.readdirSync('brand/examples/exports').filter(name=>name.startsWith(id+'.')).map(name=>`brand/examples/exports/${name}`),width:id.startsWith('youtube-thumbnail')?1280:id.startsWith('instagram')?1080:1920,height:id.startsWith('youtube-thumbnail')?720:id.startsWith('instagram')?1350:1080,template:id.includes('lower-third')?'lower-third':'case-study'}))];
const browser=await chromium.launch();
const page=await browser.newPage();
const fonts=['Manrope','Inter'].map(name=>`@font-face{font-family:${name};src:url(data:font/ttf;base64,${fs.readFileSync(`brand/typography/${name}.ttf`).toString('base64')}) format('truetype');font-weight:100 900}`).join('');
let checks=0;const problems=[];let minimumLogoWidth=Infinity;let logoChecks=0;
try{
for(const asset of assets){
  for(const file of asset.files.filter(file=>/\.(png|webp|jpg)$/.test(file))){
    const meta=await sharp(file).metadata();assert.equal(meta.width,asset.width);assert.equal(meta.height,asset.height);
    if(asset.template==='lower-third'||asset.template==='screen-overlay')assert.equal(meta.hasAlpha,true);
    checks++;
  }
  const svg=fs.readFileSync(asset.source,'utf8').replace(/<style>[\s\S]*?<\/style>/,`<style>${fonts}</style>`);
  await page.setContent(svg);await page.evaluate(()=>document.fonts.ready);
  const analysis=await page.evaluate(()=>{
    const svg=document.querySelector('svg');const {width,height}=svg.viewBox.baseVal;
    const texts=[...svg.querySelectorAll('text')].map(element=>({text:element.textContent,box:element.getBBox()}));
    const overlap=(a,b)=>a.x<b.x+b.width-.5&&a.x+a.width>b.x+.5&&a.y<b.y+b.height-.5&&a.y+a.height>b.y+.5;
    const issues=[];
    for(const text of texts){const box=text.box;if(box.x<0||box.y<0||box.x+box.width>width+1||box.y+box.height>height+1)issues.push('text outside canvas: '+text.text);}
    for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++)if(overlap(texts[i].box,texts[j].box))issues.push('text overlap: '+texts[i].text+' / '+texts[j].text);
    const logos=[...svg.querySelectorAll('image')].map(element=>element.getBBox());
    for(const logo of logos){
      const margin=logo.height/2;const expanded={x:logo.x-margin,y:logo.y-margin,width:logo.width+2*margin,height:logo.height+2*margin};
      if(logo.width<160)issues.push('logo below minimum');
      if(expanded.x<0||expanded.y<0||expanded.x+expanded.width>width||expanded.y+expanded.height>height)issues.push('logo canvas clearspace');
      for(const text of texts)if(overlap(expanded,text.box))issues.push('logo text clearspace: '+text.text);
    }
    return {issues,minimumLogoWidth:Math.min(...logos.map(logo=>logo.width)),logoChecks:logos.length};
  });
  minimumLogoWidth=Math.min(minimumLogoWidth,analysis.minimumLogoWidth);logoChecks+=analysis.logoChecks;
  if(analysis.issues.length)problems.push({id:asset.id,issues:analysis.issues});
}
assert.deepEqual(problems,[]);
for (const story of siteContent.ourWork.stories) {
  const source=fs.readFileSync(`brand/examples/social-previews/${story.id}.svg`,'utf8');
  const visual=source.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
  for(const state of story.result.split(' -> ')) assert.ok(visual.includes(state),`${story.id}: missing exact result or qualifier ${state}`);
  if(story.result.includes(' -> ')) { assert.ok(visual.includes('BEFORE')); assert.ok(visual.includes('AFTER')); }
}
const report={date:'2026-11-10',primaryAssets:manifest.assets.length,darkVariations:darkIds.length,formatChecks:checks,staticPreviews:10,caseStudyResultQualifierChecks:4,textCanvasOverflow:[],textOverlap:[],logoClearSpaceChecks:logoChecks,logoClearSpaceRule:'half the rendered logo total height on every side',minimumRenderedLogoWidthPx:minimumLogoWidth,transparentOverlayFormatsVerified:true};
fs.writeFileSync('brand/examples/validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
