'use strict';
const platforms={xiaohongshu:'小红书',douyin:'抖音',kuaishou:'快手',bilibili:'B站',duitang:'堆糖'};
const labels={scheduled:'已预约',published:'已发布',submitted:'已提交，待确认'};
let data, pageIndex=0;
const get=id=>document.getElementById(id);
function element(tag,text,classes){const el=document.createElement(tag);if(text!==undefined&&text!==null)el.textContent=String(text);if(classes)el.className=classes;return el;}
function number(value){return typeof value==='number'&&Number.isFinite(value)?value.toLocaleString('zh-CN'):'—';}
function localTime(value){const time=new Date(value);return Number.isNaN(time.getTime())?'未记录':new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(time);}
function safeLink(url){if(typeof url!=='string'||!url.trim())return null;try{const parsed=new URL(url,location.href);return parsed.protocol==='https:'||parsed.origin===location.origin?parsed.href:null;}catch{return null;}}
function table(host,columns,rows){
  const target=get(host);target.replaceChildren();
  if(!rows.length){target.append(element('p','暂无符合条件的数据。','muted'));return;}
  const result=element('table'),head=element('thead'),headRow=element('tr'),body=element('tbody');
  for(const column of columns)headRow.append(element('th',column.name));
  head.append(headRow);result.append(head,body);
  for(const row of rows){const tr=element('tr');for(const column of columns){const td=element('td',null,column.numeric?'number':column.key==='title'?'title-cell':'');const value=row[column.key];if(column.link){const url=safeLink(value);if(url){const link=element('a','打开作品');link.href=url;link.target='_blank';link.rel='noopener noreferrer';td.append(link);}else td.textContent='—';}else td.textContent=column.numeric?number(value):value??'—';tr.append(td);}body.append(tr);}target.append(result);
}
function route(){const hash=location.hash.slice(1),valid=['overview','samples','works','feedback'];const selected=valid.includes(hash)?hash:'overview';for(const id of valid)get(id).hidden=id!==selected;for(const link of document.querySelectorAll('nav a')){link.classList.toggle('active',link.hash==='#'+selected);if(link.hash==='#'+selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}document.title=( {overview:'工作总览',samples:'表格与选题',works:'作品与排期',feedback:'发布效果'}[selected])+' · 晴日来信';}
function overview(){
  const count=new Set(data.samples.map(row=>row.platform)).size;
  const scheduled=data.posts.filter(post=>post.status==='scheduled');
  for(const [label,value] of [['已收集作品',data.samples.length],['有实际样本的平台',count],['等待AI生图',data.pending_images],['已确认预约',scheduled.length]]){const card=element('div',null,'metric');card.append(element('span',label),element('strong',value));get('metrics').append(card);}
  const counts=Object.keys(platforms).map(key=>[key,data.samples.filter(row=>row.platform===key).length]);const max=Math.max(1,...counts.map(row=>row[1]));
  for(const [key,count] of counts){const row=element('div',null,'bar-row');const track=element('div',null,'bar-track'),bar=element('div',null,'bar');bar.style.width=count/max*100+'%';track.append(bar);row.append(element('span',platforms[key]),track,element('span',number(count)));get('platforms').append(row);}
  const next=scheduled.filter(post=>Date.parse(post.date+'T08:00:00+08:00')>Date.now()).sort((a,b)=>a.date.localeCompare(b.date))[0];
  if(next)get('next-post').append(element('h3',next.title),element('p',next.date+' 08:00','date'),element('p','4张 · '+next.style,'muted'));else get('next-post').append(element('p','快照中暂无未来预约；请以最后同步时间和本机后台为准。'));
  table('collection-status',[{name:'平台',key:'platform'},{name:'搜索结果',key:'status'},{name:'说明',key:'message'}],Object.keys(platforms).map(key=>{const results=data.collection.filter(row=>row.platform===key);const successes=results.filter(row=>row.status==='成功');return{platform:platforms[key],status:successes.length?'已取得样本':'未取得样本',message:successes.length?'最近一轮 '+successes.length+' 项搜索成功':results.find(row=>row.message&&!row.message.includes('其余搜索'))?.message||'暂无采集记录'};}));
}
function renderSamples(){
  const platform=get('platform-filter').value,search=get('search').value.trim().toLowerCase(),excluded=get('include-excluded').checked;
  const rows=data.samples.filter(row=>(!platform||row.platform===platform)&&(excluded||!row.excluded)&&(!search||(row.title+' '+row.keyword).toLowerCase().includes(search)));
  const pages=Math.max(1,Math.ceil(rows.length/20));pageIndex=Math.min(pageIndex,pages-1);
  get('sample-count').textContent=`筛选后 ${rows.length} 条 / 共 ${data.samples.length} 条作品`;
  table('sample-table',[{name:'平台',key:'platform_name'},{name:'标题',key:'title'},{name:'搜索词',key:'keyword'},{name:'播放/浏览',key:'views',numeric:true},{name:'点赞',key:'likes',numeric:true},{name:'收藏',key:'saves',numeric:true},{name:'采集时间',key:'display_time'},{name:'来源',key:'url',link:true}],rows.slice(pageIndex*20,pageIndex*20+20).map(row=>({...row,platform_name:platforms[row.platform],display_time:localTime(row.collected_at)})));
  get('page-number').textContent=`第 ${pageIndex+1} / ${pages} 页`;get('previous').disabled=pageIndex===0;get('following').disabled=pageIndex===pages-1;
}
function works(){
  for(const post of [...data.posts].sort((a,b)=>a.date.localeCompare(b.date))){
    const card=element('article',null,'card');const head=element('div',null,'work-head');const title=element('div');title.append(element('p',post.date+' · '+(post.time||'以实际发布为准'),'work-date'),element('h2',post.title),element('span',post.style,'muted'));head.append(title,element('span',labels[post.status]||'待核对','tag'));card.append(head);
    const gallery=element('div',null,'gallery');post.images.forEach((source,index)=>{const url=safeLink(source);if(!url)return;const link=element('a');link.href=url;link.target='_blank';link.rel='noopener';const image=element('img');image.src=url;image.alt=post.style+'壁纸 '+(index+1);image.loading='lazy';image.width=941;image.height=1672;link.append(image);gallery.append(link);});card.append(gallery,element('div',post.body,'body-copy'));get('work-list').append(card);
  }if(!data.posts.length)get('work-list').append(element('p','暂无已同步作品。'));
}
const feedbackColumns=[{name:'标题',key:'标题'},{name:'页面时间',key:'页面时间'},{name:'浏览量',key:'浏览量',numeric:true},{name:'点赞',key:'点赞',numeric:true},{name:'收藏',key:'收藏',numeric:true},{name:'状态',key:'状态'},{name:'记录时间',key:'display_time'}];
function feedback(){
  const latest=new Map();for(const row of [...data.feedback].sort((a,b)=>a['记录时间'].localeCompare(b['记录时间'])))latest.set(row['作品编号'],row);
  table('feedback-table',feedbackColumns,[...latest.values()].map(row=>({...row,display_time:localTime(row['记录时间'])})));
  get('advice-text').textContent=data.analysis.advice;get('advice-rule').textContent=data.analysis.rule;
  for(const [id,row] of latest){const option=element('option',row['标题']);option.value=id;get('note-filter').append(option);}
  renderHistory();
}
function renderHistory(){const rows=data.feedback.filter(row=>row['作品编号']===get('note-filter').value).sort((a,b)=>b['记录时间'].localeCompare(a['记录时间']));table('history-table',feedbackColumns.filter(column=>column.key!=='标题'),rows.map(row=>({...row,display_time:localTime(row['记录时间'])})));}
async function start(){
  route();window.addEventListener('hashchange',route);
  try{
    const response=await fetch('data.json',{cache:'no-cache'});if(!response.ok)throw new Error('读取失败（'+response.status+'）');data=await response.json();
    if(!Array.isArray(data.samples)||!Array.isArray(data.posts)||!Array.isArray(data.feedback))throw new Error('数据格式不完整');
    if(data.automation_notice){get('automation-notice').hidden=false;get('automation-notice').textContent=data.automation_notice;}
    get('updated').textContent='最后同步：'+localTime(data.updated_at)+'（北京时间）';overview();works();feedback();
    for(const [key,label] of Object.entries(platforms)){const option=element('option',label);option.value=key;get('platform-filter').append(option);}
    for(const id of ['platform-filter','search','include-excluded'])get(id).addEventListener(id==='search'?'input':'change',()=>{pageIndex=0;renderSamples();});
    get('previous').addEventListener('click',()=>{pageIndex--;renderSamples();});get('following').addEventListener('click',()=>{pageIndex++;renderSamples();});get('note-filter').addEventListener('change',renderHistory);renderSamples();
  }catch(error){get('updated').textContent='数据暂时不可用';get('error').hidden=false;get('error').textContent='暂时无法读取本站数据，请稍后刷新。'+error.message;}
}start();
