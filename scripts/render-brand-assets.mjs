import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { designTokens } from '../src/theme/tokens.ts';
import { siteContent } from '../src/content/home.ts';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const option = (name, fallback) => { const index = args.indexOf(`--${name}`); return index < 0 ? fallback : args[index + 1]; };
const flag = (name) => args.includes(`--${name}`);
const presetFile = JSON.parse(await readFile(path.join(root, 'brand/export-presets/presets.json'), 'utf8'));
const presets = presetFile.presets;
const master = designTokens.option3Light;
const dark = designTokens.option3Dark;
const logos = Object.fromEntries(await Promise.all(['light', 'dark'].map(async (theme) => [theme, `data:image/png;base64,${(await readFile(path.join(root, `public/brand/wideorder-logo-${theme}.png`))).toString('base64')}`])));
await mkdir(path.join(root,'brand/logos'),{recursive:true});
for (const theme of ['light','dark']) {
  await writeFile(path.join(root,`brand/logos/horizontal-${theme}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" width="4743" height="1132" viewBox="0 0 4743 1132" role="img" aria-label="WideOrder approved ${theme} raster logo wrapper"><title>WideOrder approved raster logo, unchanged</title><image href="${logos[theme]}" width="4743" height="1132"/></svg>`);
}
const provenance=[];
for (const name of ['wideorder-logo-light.png','wideorder-logo-dark.png']) { const file=await readFile(path.join(root,'public/brand',name)); provenance.push({path:`public/brand/${name}`,sha256:createHash('sha256').update(file).digest('hex'),status:'approved raster, unchanged; SVG wrappers are not vector masters'}); }
await writeFile(path.join(root,'brand/logos/manifest.json'),JSON.stringify({assets:provenance,vectorMaster:'not supplied',stackedMark:'not supplied',compactMark:'existing cropped-looking icon requires brand-owner review; default social avatars use the complete approved wordmark'},null,2)+'\n');
const fontCSS = (await Promise.all(['Manrope', 'Inter'].map(async (font) => `@font-face{font-family:${font};src:url(data:font/ttf;base64,${(await readFile(path.join(root, `brand/typography/${font}.ttf`))).toString('base64')}) format('truetype');font-weight:100 900;font-style:normal;}`))).join('');
const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
const token = (palette, key) => palette[`color-${key}`];
function lines(text, capacity, maximum = 9) {
  const words = String(text).split(/\s+/); const result = []; let line = '';
  for (const word of words) {
    if (line && (line + ' ' + word).length > capacity) { result.push(line); line = word; } else line += (line ? ' ' : '') + word;
  }
  if (line) result.push(line);
  return result.length > maximum ? [...result.slice(0, maximum - 1), result[maximum - 1].replace(/[,.]$/, '') + '…'] : result;
}
function textBlock(text, x, y, width, size, color, { weight = 700, family = 'Manrope', max = 6, leading = 1.14 } = {}) {
  const wrapped = lines(text, Math.max(8, Math.floor(width / (size * 0.55))), max);
  return `<text x="${x}" y="${y}" fill="${color}" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="${weight >= 700 ? -size * 0.035 : 0}">${wrapped.map((line, i) => `<tspan x="${x}" dy="${i ? size * leading : 0}">${escape(line)}</tspan>`).join('')}</text>`;
}
function motif(x, y, width, palette) {
  return `<g transform="translate(${x} ${y}) scale(${width / 480})" fill="none"><path d="M0 20H480M0 100H480M0 180H480M0 260H480" stroke="${token(palette,'border')}"/><g stroke="${token(palette,'text-muted')}" stroke-width="2"><path d="M15 80L120 220L35 185L130 70L60 235L15 80L140 140L35 185M60 235L85 78L120 220"/></g><path d="M150 150H190M290 150H325" stroke="${token(palette,'text-muted')}" stroke-dasharray="4 5"/><g stroke="${token(palette,'accent-text')}" stroke-width="3"><path d="M205 100V205M205 110H280M205 140H255M205 170H280M205 200H255"/></g><g fill="${token(palette,'accent-text')}">${[0,1,2].flatMap(row => [0,1,2].map(col => `<rect x="${343+col*38}" y="${100+row*38}" width="30" height="30"/>`)).join('')}</g><path d="M343 235H450" stroke="${token(palette,'brass')}" stroke-width="4"/></g>`;
}
function asset(preset, content, { variation = 'light', template = preset.template, showSafe = false } = {}) {
  const palette = variation === 'dark' ? dark : master;
  const { width, height } = preset;
  const [x,y,w,h] = content.safeArea || preset.safeArea;
  if (![x,y,w,h].every(Number.isFinite) || x<0 || y<0 || w<=0 || h<=0 || x+w>width || y+h>height) throw new Error(`Safe area exceeds ${preset.id} canvas`);
  const base = Math.min(width / 1200, height / 630);
  const ink = token(palette,'text'); const muted = token(palette,'text-muted'); const accent = token(palette,'accent-text');
  const transparent = ['lower-third','screen-overlay'].includes(template);
  const logoWidth = Math.min(w * .32, 270 * Math.max(.8,base));
  const logoHeight = logoWidth * 1132 / 4743;
  let markup = transparent ? '' : `<rect width="${width}" height="${height}" fill="${token(palette,'background')}"/>`;
  const logo = (lx,ly,lw=logoWidth) => `<image href="${logos[variation === 'dark' ? 'dark' : 'light']}" x="${lx}" y="${ly}" width="${lw}" height="${lw * 1132 / 4743}" preserveAspectRatio="xMinYMin meet"/>`;
  const label = (value,lx,ly) => textBlock(value.toUpperCase(),lx,ly,w,Math.max(12,15*base),accent,{max:1,weight:600,family:'Inter'});
  if (template === 'avatar') {
    const logoW = Math.min(w,h*4743/1132);
    markup += logo((width-logoW)/2,(height-logoW*1132/4743)/2,logoW);
  } else if (template === 'banner') {
    const logoW = Math.min(w*.28,h*2.3);
    markup += logo(x, y+h*.20, logoW);
    markup += textBlock(content.headline || siteContent.home.hero.brandPromise,x+w*.39,y+h*.37,w*.60,Math.min(h*.29,w*.045),ink,{max:2});
    markup += textBlock('wideorder.net',x+w*.39,y+h*.87,w*.60,Math.max(14,h*.11),accent,{max:1,weight:500,family:'Inter'});
  } else if (template === 'lower-third') {
    const barHeight = Math.min(h,180); const by = y+h-barHeight;
    markup += `<rect x="${x}" y="${by}" width="${w}" height="${barHeight}" fill="${token(palette,'background')}"/><rect x="${x}" y="${by}" width="8" height="${barHeight}" fill="${accent}"/>`;
    markup += logo(x+48,by+40,Math.min(290,w*.25));
    markup += textBlock(content.headline,x+w*.37,by+70,w*.58,Math.min(50,barHeight*.27),ink,{max:1});
    markup += textBlock('WideOrder Resolve · wideorder.net',x+w*.37,by+125,w*.58,Math.min(28,barHeight*.16),muted,{max:1,weight:500,family:'Inter'});
  } else if (template === 'screen-overlay') {
    markup += `<path d="M${x} ${y+45}V${y}H${x+90}M${x+w-90} ${y}H${x+w}V${y+45}M${x} ${y+h-45}V${y+h}H${x+90}M${x+w-90} ${y+h}H${x+w}V${y+h-45}" stroke="${accent}" stroke-width="4" fill="none"/>`;
    markup += `<rect x="${x+w-380}" y="${y+h-160}" width="380" height="160" fill="${token(palette,'background')}"/>${logo(x+w-322.5,y+h-111.625,265)}`;
  } else if (template === 'end-screen' || template === 'outro') {
    markup += logo(x,y);
    markup += textBlock('There is a better way.',x,y+h*.31,w*.8,Math.min(w*.06,h*.11),ink,{max:2});
    markup += textBlock('wideorder.net',x,y+h*.42,w,Math.min(w*.035,44),accent,{max:1,family:'Inter',weight:500});
    if (template === 'end-screen') markup += `<rect x="${x}" y="${y+h*.55}" width="${w*.45}" height="${h*.38}" stroke="${token(palette,'border')}" stroke-width="2" fill="none"/><rect x="${x+w*.55}" y="${y+h*.55}" width="${w*.45}" height="${h*.38}" stroke="${token(palette,'border')}" stroke-width="2" fill="none"/>`;
  } else {
    const portrait = height > width * 1.1;
    let headingSize = portrait ? w*.081 : Math.min(w*.057,66*base);
    const textWidth = portrait ? w : w*.70;
    const maximumLines = portrait ? 4 : 3;
    // Keep complete approved headlines when a modest size adjustment will fit them.
    while (lines(content.headline, Math.max(8, Math.floor(textWidth/(headingSize*.55)))).length > maximumLines && headingSize > 36*base) headingSize *= .95;
    const labelSize = Math.max(12,15*base);
    const logoClearSpace = logoHeight / 2;
    const dividerY = y + logoHeight + logoClearSpace + 10*base;
    const labelY = Math.max(y + (portrait ? h*.20 : h*.25) - headingSize*.9, dividerY + labelSize*1.6);
    const headlineY = labelY + headingSize*1.2;
    const headingLines = lines(content.headline,Math.max(8,Math.floor(textWidth/(headingSize*.55))),maximumLines).length;
    const headlineBottom = headlineY + (headingLines-1)*headingSize*1.14 + headingSize*.22;
    markup += logo(x,y);
    markup += `<path d="M${x} ${dividerY}H${x+w}" stroke="${token(palette,'border')}" stroke-width="${Math.max(1,base)}"/>`;
    markup += label(content.label || 'WideOrder Resolve', x, labelY);
    markup += textBlock(content.headline,x,headlineY,textWidth,headingSize,ink,{max:maximumLines});
    if (!portrait) markup += motif(x+w*.73,y+h*.1,w*.27,palette);
    else if (!content.result && !content.body && template !== 'before-after') markup += motif(x+w*.1,y+h*.47,w*.8,palette);
    const comparison = content.result?.split(' -> ');
    if (comparison?.length === 2 && ['before-after','case-study','demonstration'].includes(template)) {
      const cy = Math.max(y+h*(portrait?.58:.64),headlineBottom+labelSize*1.7); const metricSize = Math.min(w*(portrait?.087:.050),70*base);
      markup += label('Before',x,cy);
      markup += textBlock(comparison[0],x,cy+metricSize*1.15,w*.42,metricSize,muted,{max:2});
      markup += `<path d="M${x+w*.51} ${cy-15*base}V${cy+metricSize*2.4}" stroke="${accent}" stroke-width="${3*base}"/>`;
      markup += label('After',x+w*.55,cy);
      markup += textBlock(comparison[1],x+w*.55,cy+metricSize*1.15,w*.45,metricSize,accent,{max:2});
    } else if (content.result) {
      const outcomeY = Math.max(y+h*.60,headlineBottom+labelSize*1.7);
      markup += label('The outcome',x,outcomeY);
      markup += textBlock(content.result,x,outcomeY+headingSize*1.15,w,headingSize*.96,accent,{max:portrait?3:2});
    } else if (content.body && portrait) {
      markup += textBlock(content.body,x,Math.max(y+h*.50,headlineBottom+50*base),w,Math.max(24,w*.037),muted,{max:7,weight:400,family:'Inter',leading:1.35});
    } else if (content.body && !portrait) {
      markup += textBlock(content.body,x,Math.max(y+h*.66,headlineBottom+33*base),w*.86,Math.max(18,22*base),muted,{max:2,weight:400,family:'Inter',leading:1.35});
    }
    markup += `<path d="M${x} ${y+h*.93}H${x+w}" stroke="${token(palette,'border')}" stroke-width="${Math.max(1,base)}"/>`;
    markup += textBlock(content.cta || 'Explore the work → wideorder.net',x,y+h,w,Math.max(16,20*base),accent,{max:1,weight:600,family:'Inter'});
  }
  if (showSafe) markup += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#E00068" stroke-width="2" stroke-dasharray="10 10"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(content.headline)}"><title>${escape(content.headline)}</title><style>@font-face{font-family:Manrope;src:url(../../typography/Manrope.ttf) format('truetype');font-weight:100 900}@font-face{font-family:Inter;src:url(../../typography/Inter.ttf) format('truetype');font-weight:100 900}</style>${markup}</svg>`;
}

const siteCards = [
  ['home',{label:siteContent.home.hero.serviceName,headline:siteContent.home.hero.brandPromise,body:siteContent.home.hero.statement}],
  ['what-we-do',{label:siteContent.whatWeDo.pageLabel,headline:siteContent.home.overview.statement,body:siteContent.whatWeDo.paragraphs[1]}],
  ['how-we-work',{label:siteContent.howWeWork.pageLabel,headline:siteContent.howWeWork.title,body:siteContent.howWeWork.paragraphs[0]}],
  ['our-work',{label:siteContent.ourWork.pageLabel,headline:siteContent.ourWork.statement,body:siteContent.ourWork.paragraphs[0]}],
  ['our-approach',{label:siteContent.ourApproach.pageLabel,headline:siteContent.ourApproach.insitu.statement,body:siteContent.ourApproach.paragraphs[1]}],
  ['contact',{label:siteContent.contact.pageLabel,headline:siteContent.contact.title,body:siteContent.contact.paragraphs[0]}],
  ...siteContent.ourWork.stories.map(story=>[story.id,{label:'Case study',headline:story.title,result:story.result}]),
];

const selection = option('preset');
const formats = option('formats')?.split(',');
const variation = option('variation','light');
if (!['light','dark'].includes(variation)) throw new Error('Variation must be light or dark.');
const customPath = option('content');
const custom = customPath ? JSON.parse(await readFile(path.resolve(customPath),'utf8')) : null;
if (custom) {
  if (typeof custom !== 'object' || Array.isArray(custom) || typeof custom.headline !== 'string' || !custom.headline.trim() || custom.headline.length > 300) throw new Error('Content requires a nonempty headline of at most 300 characters.');
  for (const key of ['label','body','result','cta']) if (custom[key] !== undefined && (typeof custom[key] !== 'string' || custom[key].length > 1500)) throw new Error(`Invalid content field ${key}`);
}
const selectedPreset = selection ? presets.find(preset=>preset.id===selection) : null;
if (selection && !selectedPreset) throw new Error(`Unknown preset ${selection}`);
const safeArea = option('safe-area')?.split(',').map(Number);
if (safeArea && (safeArea.length!==4 || safeArea.some(value=>!Number.isFinite(value)||value<0))) throw new Error('safe-area must be x,y,width,height');
const jobs = [];
const socialPreset = presets.find(preset=>preset.id==='social-preview');
if (!selection) for (const [name,content] of siteCards) jobs.push({name,preset:socialPreset,content,output:path.join(root,'public/social'),formats:['png'],sourceOutput:path.join(root,'brand/examples/social-previews')});
const exampleStory = siteContent.ourWork.stories.find(story=>story.id==='month-end-reporting');
const sampleContent = {label:'Case study / month-end reporting',headline:exampleStory.title,result:exampleStory.result,cta:'Explore the full case study → wideorder.net/our-work/month-end-reporting'};
const examples = flag('all-presets') ? presets.filter(p=>p.id!=='social-preview') : presets.filter(p=>['linkedin-company-banner','linkedin-avatar','linkedin-standard-post','linkedin-before-after','linkedin-article-cover','linkedin-sponsored','youtube-banner','youtube-thumbnail','youtube-title-card','youtube-lower-third','youtube-screen-overlay','youtube-end-screen','facebook-cover','facebook-post','facebook-ad','instagram-portrait','instagram-story','instagram-reels-cover','x-header','x-image-post'].includes(p.id));
const exampleTemplates = {'linkedin-standard-post':'insight','linkedin-sponsored':'problem','facebook-ad':'problem','instagram-story':'problem'};
for (const preset of selectedPreset ? [selectedPreset] : examples) {
  const template = option('template', exampleTemplates[preset.id] || preset.template);
  if (!['problem','before-after','insight','case-study','demonstration','banner','avatar','lower-third','screen-overlay','end-screen','outro'].includes(template)) throw new Error(`Unknown template ${template}`);
  const content = custom || (template==='banner' ? {label:'WideOrder Resolve',headline:siteContent.home.hero.brandPromise} : template==='problem' ? {label:'The problem',headline:siteContent.home.hero.examples[0],body:siteContent.home.hero.supportingCopy,cta:'Discuss a challenge → wideorder.net/contact'} : template==='insight' ? {label:'The insight',headline:siteContent.home.positioning.lineOne,body:siteContent.home.positioning.lineTwo,cta:'There is a better way. → wideorder.net'} : sampleContent);
  if (safeArea) content.safeArea = safeArea;
  const output = option('output') ? path.resolve(option('output')) : path.join(root,'brand/examples/exports');
  jobs.push({name:`${preset.id}-${variation}`,preset,content,template,output,formats:formats||preset.formats,sourceOutput:path.join(root,'brand/examples/sources')});
}
if (flag('carousel') || !selection) {
  const preset=selectedPreset || presets.find(p=>p.id==='linkedin-document');
  const slides=[{label:'01 / The problem',headline:exampleStory.title,body:exampleStory.challenge,cta:'Swipe → The approach'},{label:'02 / The approach',headline:siteContent.home.positioning.lineTwo,body:exampleStory.betterWay,cta:'Swipe → The outcome'},{label:'03 / The outcome',headline:exampleStory.title,result:exampleStory.result,cta:'Read the full case study → wideorder.net/our-work/month-end-reporting'}];
  slides.forEach((content,index)=>jobs.push({name:`document-${index+1}-${variation}`,preset,content,output:path.join(root,'brand/examples/exports'),sourceOutput:path.join(root,'brand/examples/sources'),formats:['svg','png'],template:'case-study'}));
}
let browser;
let page;
const needsRaster=jobs.some(job=>job.formats.some(format=>format!=='svg'));
if(needsRaster){
  const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
  browser=await chromium.launch();page=await browser.newPage({deviceScaleFactor:1});
}
const manifest=[];
try{
  for(const job of jobs){
    await mkdir(job.output,{recursive:true});await mkdir(job.sourceOutput,{recursive:true});
    let svg=asset(job.preset,job.content,{variation,template:job.template,showSafe:flag('show-safe')});
    if (flag('embed-fonts')) svg=svg.replace(/<style>[\s\S]*?<\/style>/, `<style>${fontCSS}</style>`);
    const source=path.join(job.sourceOutput,`${job.name}.svg`);
    // Sources embed the approved raster logo unchanged. The SVG is a composition, not a vector logo.
    await writeFile(source,svg);
    const files=[];
    if(job.formats.includes('svg')){const out=path.join(job.output,`${job.name}.svg`);await writeFile(out,svg);files.push(path.relative(root,out).replaceAll('\\','/'));}
    const rasterFormats=job.formats.filter(format=>format!=='svg');
    if(rasterFormats.length){
      await page.setViewportSize({width:job.preset.width,height:job.preset.height});
      await page.setContent(`<html><head><style>${fontCSS}html,body{margin:0;padding:0;background:transparent}svg{display:block}</style></head><body>${svg.replace(/<style>[\s\S]*?<\/style>/, `<style>${fontCSS}</style>`)}</body></html>`);
      await page.evaluate(()=>document.fonts.ready);
      const png=await page.screenshot({omitBackground:true,clip:{x:0,y:0,width:job.preset.width,height:job.preset.height}});
      for(const format of rasterFormats){
        if(!['png','webp','jpg'].includes(format))throw new Error(`Unsupported format ${format}`);
        if(format==='jpg' && ['lower-third','screen-overlay'].includes(job.template||job.preset.template))throw new Error('Transparent overlays cannot be exported as JPG.');
        const out=path.join(job.output,`${job.name}.${format}`);
        const pipeline=sharp(png);
        if(format==='png')await pipeline.png().toFile(out);
        if(format==='webp')await pipeline.webp({quality:92}).toFile(out);
        if(format==='jpg')await pipeline.flatten({background:token(variation==='dark'?dark:master,'background')}).jpeg({quality:94}).toFile(out);
        files.push(path.relative(root,out).replaceAll('\\','/'));
      }
    }
    manifest.push({id:job.name,width:job.preset.width,height:job.preset.height,channel:job.preset.channel,template:job.template||job.preset.template,variation,source:path.relative(root,source).replaceAll('\\','/'),files,safeArea:job.content.safeArea||job.preset.safeArea});
  }
}finally{await browser?.close();}
await mkdir(path.join(root,'brand/design-tokens'),{recursive:true});
await writeFile(path.join(root,'brand/design-tokens/tokens.json'),JSON.stringify({master:'option3Light',darkVariation:'option3Dark',websiteThemes:designTokens,marketing:{fontHeading:'Manrope',fontBody:'Inter',before:'color-text-muted',after:'color-accent-text',highlight:'color-brass',clearSpace:'at least half the rendered logo total height on every side',minimumLogoWidthPx:160,recommendedStandaloneLogoWidthPx:320,motionMs:320}},null,2)+'\n');
await writeFile(path.join(root,'brand/examples',selection?'last-export.json':'manifest.json'),JSON.stringify({generated:'2026-11-10',assets:manifest},null,2)+'\n');
if(!selection){
 const cards=manifest.filter(item=>item.files.some(file=>file.endsWith('.png'))).map(item=>`<article><h2>${escape(item.id)}</h2><p>${item.width} × ${item.height} · ${escape(item.template)}</p><img alt="${escape(item.id)}" src="../../${item.files.find(file=>file.endsWith('.png'))}"><p>${item.files.map(file=>`<a href="../../${file}">${path.extname(file).slice(1).toUpperCase()}</a>`).join(' · ')} · <a href="../../${item.source}">Editable composition</a></p></article>`).join('');
 await writeFile(path.join(root,'brand/examples/index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WideOrder marketing asset library</title><style>@font-face{font-family:Manrope;src:url(../typography/Manrope.ttf)}@font-face{font-family:Inter;src:url(../typography/Inter.ttf)}*{box-sizing:border-box}body{margin:0;padding:48px;background:#F7F5FC;color:#211B36;font:16px Inter,sans-serif}h1,h2{font-family:Manrope,sans-serif}h1{font-size:48px;letter-spacing:-2px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:28px}article{min-width:0;padding:20px;background:white;border:1px solid #DDD6EC}h2{font-size:20px}img{display:block;width:100%;max-height:480px;object-fit:contain;background:repeating-conic-gradient(#eee 0% 25%,white 0% 50%) 50%/20px 20px}a{color:#5746C7}p{line-height:1.6}</style><h1>From complexity to clarity.</h1><p>WideOrder master marketing identity · Editable SVG compositions preserve the supplied raster logos. <a href="../brand-guidelines.md">Brand guidelines</a> · <a href="../export-presets/presets.json">Presets</a></p><main>${cards}</main></html>`);
}
console.log(`Rendered ${manifest.length} assets; source compositions, exports and manifest are in brand/examples.`);
