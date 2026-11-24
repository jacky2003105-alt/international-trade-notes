(function(){'use strict';
/* 課程筆記網站｜共用互動程式 v5（2026/11/14）
   單元切換、課程／作業切換、程式碼與段落複製、Concept Check 解答按鈕（規則 14.4）、
   閱讀輔助（規則 14.12：記住位置、全站搜尋、不熟標記、本頁大綱）、深色模式、閱讀進度、回到頂端。
   localStorage 一律包 try/catch；鍵名前綴取 <body data-key>。 */
var B=document.body,KEY=B.getAttribute('data-key')||'notes',PAGE=B.getAttribute('data-page')||'index',MODE=B.getAttribute('data-mode')||'course';
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(e){return null}}
function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);if(v===null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v);}catch(e){return null}}
function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}
var ICON={
 search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
 list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>',
 star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
 moon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/></svg>',
 sun:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
 up:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'};

/* ---------- 深色模式（跟隨系統；手動切換後記住） ---------- */
var root=document.documentElement;
function applyTheme(t){root.setAttribute('data-theme',t);}
var saved=ls('notes:theme');
applyTheme(saved||(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));

/* ---------- 單元選單、課程／作業切換 ---------- */
var sel=document.getElementById('unitSelect');
if(PAGE!=='index')ls(KEY+':last:'+MODE,PAGE+'.html');
$$('.mode a').forEach(function(a){var m=a.getAttribute('data-mode'),last=ls(KEY+':last:'+m);if(last&&m!==MODE)a.href=last;});
if(sel)sel.addEventListener('change',function(){location.href=sel.value;});

/* ---------- 數學 ---------- */
if(window.renderMathInElement)renderMathInElement(B,{delimiters:[{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false},{left:'$$',right:'$$',display:true}],throwOnError:false});

/* ---------- 複製（程式碼、可貼段落） ---------- */
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.copy');if(!b)return;
 var src=b.parentNode.querySelector('.ptext, pre');if(!src)return;var t=src.innerText.trim(),lab=b.getAttribute('data-l')||b.textContent;b.setAttribute('data-l',lab);
 function done(){b.textContent='已複製 ✓';setTimeout(function(){b.textContent=lab},1400);}
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done,fallback);else fallback();
 function fallback(){var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';B.appendChild(ta);ta.select();try{document.execCommand('copy');done();}catch(e){}ta.remove();}});

/* ---------- 頁首工具列 ---------- */
var bar=$('.topbar'),tools=document.createElement('div');tools.className='rd-tools';
var hasQ=!!$('.q'),hasSec=$$('.sec').length>=2;
var mac=/Mac|iPhone|iPad/.test(navigator.platform||'');
tools.innerHTML='<button type="button" class="tb rd-search-btn" aria-label="搜尋全站">'+ICON.search+'<span class="lb">搜尋</span><kbd>'+(mac?'⌘K':'Ctrl K')+'</kbd></button>'+
 (hasQ?'<button type="button" class="tb rd-weak-btn" aria-pressed="false" aria-label="只看標記不熟的題目">'+ICON.star+'<span class="lb">只看不熟</span></button>':'')+
 (hasSec?'<button type="button" class="tb rd-outline-btn" aria-expanded="false" aria-label="本頁大綱">'+ICON.list+'<span class="lb">本頁大綱</span></button>':'')+
 (hasQ?'<button type="button" class="tb toggle-all">顯示全部解答</button>':'')+
 '<button type="button" class="tb icon rd-theme" aria-label="切換深色模式"></button>';
bar.appendChild(tools);
var themeBtn=$('.rd-theme',tools);
function themeIcon(){var d=root.getAttribute('data-theme')==='dark';themeBtn.innerHTML=d?ICON.sun:ICON.moon;themeBtn.title=d?'切換成淺色':'切換成深色';}
themeIcon();themeBtn.onclick=function(){var t=root.getAttribute('data-theme')==='dark'?'light':'dark';applyTheme(t);ls('notes:theme',t);themeIcon();};

/* ---------- 閱讀進度條、回到頂端 ---------- */
var prog=document.createElement('div');prog.className='progress';prog.innerHTML='<span></span>';bar.insertAdjacentElement('afterend',prog);
var pbar=prog.firstChild,topBtn=document.createElement('button');topBtn.type='button';topBtn.className='rd-top';topBtn.setAttribute('aria-label','回到頂端');topBtn.innerHTML=ICON.up;B.appendChild(topBtn);
topBtn.onclick=function(){window.scrollTo({top:0,behavior:'smooth'});};
function onScrollUI(){var h=document.documentElement,max=h.scrollHeight-h.clientHeight;pbar.style.width=(max>0?Math.min(100,h.scrollTop/max*100):0)+'%';topBtn.classList.toggle('show',h.scrollTop>900);}

/* ---------- 解答按鈕（規則 14.4：預設隱藏，2026/11/14 改；單題與全部同步） ---------- */
var qs=$$('.q');
if(qs.length){var fl=document.createElement('button');fl.type='button';fl.className='rd-float toggle-all';fl.textContent='顯示全部解答';B.appendChild(fl);}
var alls=$$('.toggle-all');
function setQ(q,open){var b=$('.toggle',q),s=$('.sol',q);if(!b||!s)return;s.hidden=!open;b.setAttribute('aria-expanded',open);b.textContent=open?'隱藏解答':'顯示解答';}
function anyOpen(){return qs.some(function(q){var s=$('.sol',q);return s&&!s.hidden;});}
function sync(){var t=anyOpen()?'隱藏全部解答':'顯示全部解答';alls.forEach(function(b){b.textContent=t;});}
qs.forEach(function(q){var b=$('.toggle',q);if(b)b.onclick=function(){setQ(q,$('.sol',q).hidden);sync();};});
alls.forEach(function(b){b.onclick=function(){var o=!anyOpen();qs.forEach(function(q){setQ(q,o);});sync();};});
/* ---------- 選擇題：點選項就判斷對錯，並打開正確答案與詳解 ---------- */
qs.forEach(function(q){var key=q.getAttribute('data-key'),lis=$$('.opts li[data-k]',q);if(!key||!lis.length)return;
 q.classList.add('q-mc');var fb=document.createElement('p');fb.className='q-fb';fb.setAttribute('aria-live','polite');fb.hidden=true;
 var ol=$('.opts',q);ol.insertAdjacentElement('afterend',fb);
 lis.forEach(function(li){li.setAttribute('role','button');li.setAttribute('tabindex','0');
  function pick(){if(q.classList.contains('answered'))return;var k=li.getAttribute('data-k'),ok=k===key;q.classList.add('answered');
   lis.forEach(function(x){var xk=x.getAttribute('data-k');x.classList.toggle('is-key',xk===key);x.classList.toggle('is-wrong',xk===k&&!ok);x.classList.toggle('is-picked',xk===k);x.removeAttribute('tabindex');});
   fb.hidden=false;fb.className='q-fb '+(ok?'ok':'bad');fb.innerHTML=(ok?'答對了！':'答錯了，你選 ('+k+')，正確答案是 ('+key+')。')+' <button type="button" class="q-retry">重新作答</button>';
   $('.q-retry',fb).onclick=function(){q.classList.remove('answered');fb.hidden=true;lis.forEach(function(x){x.classList.remove('is-key','is-wrong','is-picked');x.setAttribute('tabindex','0');});setQ(q,false);sync();};
   setQ(q,true);sync();}
  li.addEventListener('click',function(e){if(e.target.closest('a'))return;pick();});
  li.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick();}});});});
window.addEventListener('beforeprint',function(){qs.forEach(function(q){setQ(q,true);});$$('details').forEach(function(d){d.open=true;});sync();});

/* ---------- 不熟標記 ---------- */
var weak={};try{(JSON.parse(ls(KEY+':weak')||'[]')).forEach(function(k){weak[k]=1});}catch(e){}
function marks(){$$('.sec').forEach(function(s){s.classList.toggle('rd-has-weak',!!$('.q.rd-has-weak',s));});}
qs.forEach(function(q){var key=PAGE+'#'+q.id,b=document.createElement('button');b.type='button';b.className='rd-weak';
 function paint(on){b.setAttribute('aria-pressed',on?'true':'false');b.textContent=on?'★ 不熟':'☆ 標記不熟';q.classList.toggle('rd-has-weak',on);}
 paint(!!weak[key]);q.insertBefore(b,q.firstChild);
 b.onclick=function(){var on=b.getAttribute('aria-pressed')!=='true';if(on)weak[key]=1;else delete weak[key];paint(on);
  ls(KEY+':weak',JSON.stringify(Object.keys(weak)));marks();if(wbtn&&wbtn.getAttribute('aria-pressed')==='true')weakView(true);};});
marks();
var wbtn=$('.rd-weak-btn',tools);
function weakView(on){B.classList.toggle('rd-weak-only',on);if(wbtn)wbtn.setAttribute('aria-pressed',on?'true':'false');
 $$('.rd-weak-empty').forEach(function(x){x.remove()});
 if(on){var n=$$('.q.rd-has-weak').length,d=document.createElement('p');d.className='rd-weak-empty';
  d.textContent=n?('這一頁標記不熟的題目：'+n+' 題。再按一次「只看不熟」回到完整內容。'):'這一頁還沒有標記不熟的題目。在題目右上角按「☆ 標記不熟」即可加入。';
  var h=$('.ch-head');h.parentNode.insertBefore(d,h.nextSibling);}}
if(wbtn)wbtn.onclick=function(){weakView(wbtn.getAttribute('aria-pressed')!=='true');window.scrollTo(0,0);};

/* ---------- 本頁大綱（按了才浮出，不佔版面；規則 14.12） ---------- */
var secs=$$('.sec'),links=[],obtn=$('.rd-outline-btn',tools),ol=null;
function closeOutline(){if(!ol)return;obtn.setAttribute('aria-expanded','false');ol.hidden=true;}
if(obtn){ol=document.createElement('nav');ol.className='rd-outline';ol.hidden=true;ol.setAttribute('aria-label','本頁大綱');
 ol.innerHTML='<h4>本頁大綱</h4><ol></ol>';B.appendChild(ol);var list=$('ol',ol);
 secs.forEach(function(s){var h=$('h2',s);if(!h)return;var a=document.createElement('a');a.href='#'+s.id;
  var num=$('.num',h);a.innerHTML=(num?'<b style="font-variant-numeric:tabular-nums;margin-right:.6em">'+num.textContent+'</b>':'')+h.textContent.replace(num?num.textContent:'','').trim();
  var li=document.createElement('li');li.appendChild(a);list.appendChild(li);links.push([a,s]);});
 obtn.onclick=function(e){e.stopPropagation();var o=ol.hidden;ol.hidden=!o;obtn.setAttribute('aria-expanded',String(o));spy();};
 ol.addEventListener('click',function(e){if(e.target.closest('a'))closeOutline();});
 document.addEventListener('click',function(e){if(!ol.hidden&&!e.target.closest('.rd-outline'))closeOutline();});}
function current(){var best=null,lim=parseInt(getComputedStyle(root).scrollPaddingTop)||80;for(var i=0;i<links.length;i++){if(links[i][1].getBoundingClientRect().top<=lim+10)best=links[i];else break;}return best||links[0];}
function spy(){if(!links.length)return;var c=current();links.forEach(function(l){l[0].classList.toggle('on',l===c);});}

/* ---------- 記住讀到哪裡 ---------- */
var timer=null;
window.addEventListener('scroll',function(){onScrollUI();spy();clearTimeout(timer);timer=setTimeout(function(){
 var cand=$$('.sec, .q, .sec h3[id]'),best=null;
 for(var i=0;i<cand.length;i++){if(cand[i].getBoundingClientRect().top<=170)best=cand[i];}
 var lab=best&&best.closest('.sec')?best.closest('.sec').getAttribute('data-label')||'':'';
 ls(KEY+':pos',JSON.stringify({p:PAGE,a:best?best.id:'',t:($('.ch-head h1')||{}).textContent||'',l:lab}));},800);},{passive:true});
onScrollUI();
(function(){var pos=null;try{pos=JSON.parse(ls(KEY+':pos')||'null');}catch(e){}if(!pos)return;
 if(pos.p===PAGE){if(!location.hash&&pos.a&&document.getElementById(pos.a))location.hash=pos.a;return;}
 if(PAGE==='index'&&pos.p&&pos.p!=='index'){var slot=$('.resume-slot')||$('.wrap'),d=document.createElement('p');d.className='rd-resume';
  d.innerHTML='<span>上次讀到　<a href="'+pos.p+'.html'+(pos.a?'#'+pos.a:'')+'"></a></span>';$('a',d).textContent=(pos.t||pos.p)+(pos.l?'・'+pos.l:'')+' →';
  if(slot.classList.contains('resume-slot'))slot.appendChild(d);else slot.insertBefore(d,slot.firstChild);}})();

/* ---------- 全站搜尋（索引 assets/search.js，離線可用） ---------- */
var scrim=document.createElement('div');scrim.className='rd-scrim';scrim.hidden=true;B.appendChild(scrim);
var box=document.createElement('div');box.className='rd-search';box.hidden=true;box.setAttribute('role','dialog');box.setAttribute('aria-label','全站搜尋');
box.innerHTML='<div class="rd-bar">'+ICON.search+'<input type="search" placeholder="搜尋所有單元的內文與題目" aria-label="搜尋關鍵字" autocomplete="off"><button type="button" class="rd-close">Esc</button></div><p class="rd-count"></p><ol></ol><p class="rd-hint"><kbd>↑</kbd> <kbd>↓</kbd> 選擇　<kbd>Enter</kbd> 前往　<kbd>Esc</kbd> 關閉</p>';
B.appendChild(box);var inp=$('input',box),res=$('ol',box),cnt=$('.rd-count',box),selI=-1;
function esc(s){return s.replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]});}
function run(){var q=inp.value.trim();res.innerHTML='';selI=-1;if(!q){cnt.textContent='輸入關鍵字，例如函數名稱或中文名詞。';return;}var lq=q.toLowerCase();
 var hits=(window.SEARCH||[]).filter(function(x){return (x.t+' '+x.x).toLowerCase().indexOf(lq)>=0;});
 hits.sort(function(a,b){return (b.t.toLowerCase().indexOf(lq)>=0)-(a.t.toLowerCase().indexOf(lq)>=0);});
 cnt.textContent=hits.length?('找到 '+hits.length+' 處'+(hits.length>80?'，列出前 80 處':'')):'找不到符合的內容。';
 hits.slice(0,80).forEach(function(x){var i=x.x.toLowerCase().indexOf(lq),a=Math.max(0,i-40);
  var sn=i<0?esc(x.x.slice(0,90)):esc(x.x.slice(a,i))+'<mark>'+esc(x.x.substr(i,q.length))+'</mark>'+esc(x.x.slice(i+q.length,i+q.length+60));
  var li=document.createElement('li');li.innerHTML='<a href="'+x.p+(x.a?'#'+x.a:'')+'"><span class="rd-where">'+esc(x.t)+'</span><span class="rd-snip">'+(a?'…':'')+sn+'…</span></a>';res.appendChild(li);});}
function openSearch(){box.hidden=false;scrim.hidden=false;inp.focus();inp.select();run();}
function closeSearch(){box.hidden=true;scrim.hidden=true;}
function move(d){var as=$$('a',res);if(!as.length)return;selI=(selI+d+as.length)%as.length;as.forEach(function(a,i){a.classList.toggle('sel',i===selI);});as[selI].scrollIntoView({block:'nearest'});}
var st;inp.addEventListener('input',function(){clearTimeout(st);st=setTimeout(run,140);});
inp.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){e.preventDefault();move(1);}else if(e.key==='ArrowUp'){e.preventDefault();move(-1);}
 else if(e.key==='Enter'){var as=$$('a',res),a=as[selI<0?0:selI];if(a){ss('notes:hl',inp.value.trim());closeSearch();location.href=a.href;}}});
$('.rd-search-btn',tools).onclick=openSearch;$('.rd-close',box).onclick=closeSearch;scrim.onclick=closeSearch;
res.addEventListener('click',function(e){if(e.target.closest('a')){ss('notes:hl',inp.value.trim());closeSearch();weakView(false);}});
document.addEventListener('keydown',function(e){
 if(e.key==='Escape'){closeSearch();closeOutline();return;}
 var typing=/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||'');
 if((e.key==='k'&&(e.metaKey||e.ctrlKey))||(e.key==='/'&&!typing)){e.preventDefault();openSearch();}});

/* 從搜尋跳過來：把關鍵字標亮（目標小節內最多 30 處） */
function highlight(){var q=ss('notes:hl');if(!q)return;ss('notes:hl',null);var t=location.hash&&document.getElementById(decodeURIComponent(location.hash.slice(1)));
 var scope=t||$('.wrap');if(!scope)return;var lq=q.toLowerCase(),n=0,w=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT,null),nodes=[];
 while(w.nextNode())nodes.push(w.currentNode);
 nodes.forEach(function(nd){if(n>=30||!nd.nodeValue||nd.parentNode.closest('script,style,mark,.katex'))return;var v=nd.nodeValue,i=v.toLowerCase().indexOf(lq);if(i<0)return;
  var m=document.createElement('mark');var r=document.createRange();r.setStart(nd,i);r.setEnd(nd,i+q.length);try{r.surroundContents(m);n++;}catch(e){}});}
highlight();window.addEventListener('hashchange',highlight);
/* ---------- 名詞小辭典：點或滑過虛線名詞跳出說明 ---------- */
(function(){var G={};(window.GLOSSARY||[]).forEach(function(g){G[g.t]=g;});if(!window.GLOSSARY)return;
 var pop=document.createElement('div');pop.className='gl-pop';pop.hidden=true;pop.setAttribute('role','tooltip');B.appendChild(pop);var cur=null,hideT=null;
 function show(el){var g=G[el.getAttribute('data-g')];if(!g)return;clearTimeout(hideT);cur=el;
  pop.innerHTML='<b></b><small></small><p></p><a></a>';$('b',pop).textContent=g.t;$('small',pop).textContent=g.en;$('p',pop).textContent=g.d;
  var a=$('a',pop);a.href=g.h;a.textContent='詳見 '+g.l+' →';pop.hidden=false;
  var r=el.getBoundingClientRect(),w=pop.offsetWidth,x=Math.min(Math.max(12,r.left+window.scrollX),window.scrollX+document.documentElement.clientWidth-w-12);
  var y=r.bottom+window.scrollY+8;if(r.bottom+pop.offsetHeight+16>window.innerHeight&&r.top>pop.offsetHeight+80)y=r.top+window.scrollY-pop.offsetHeight-8;
  pop.style.left=x+'px';pop.style.top=y+'px';}
 function hide(){hideT=setTimeout(function(){pop.hidden=true;cur=null;},180);}
 var hover=window.matchMedia&&matchMedia('(hover:hover)').matches;
 $$('.gl').forEach(function(el){if(hover){el.addEventListener('mouseenter',function(){show(el)});el.addEventListener('mouseleave',hide);}
  el.addEventListener('focus',function(){show(el)});el.addEventListener('blur',hide);
  el.addEventListener('click',function(e){e.stopPropagation();if(cur===el&&!pop.hidden){pop.hidden=true;cur=null;}else show(el);});});
 pop.addEventListener('mouseenter',function(){clearTimeout(hideT)});pop.addEventListener('mouseleave',hide);
 document.addEventListener('click',function(e){if(!e.target.closest('.gl-pop'))pop.hidden=true;});
 document.addEventListener('keydown',function(e){if(e.key==='Escape')pop.hidden=true;});
 var f=$('.gl-filter');if(f)f.addEventListener('input',function(){var q=f.value.trim().toLowerCase();$$('.gl-row').forEach(function(r){r.hidden=q&&r.textContent.toLowerCase().indexOf(q)<0;});});
})();
/* ---------- 畫重點與筆記（只存在這台裝置；彙整在 notes.html） ---------- */
(function(){if(!/^(ch|hw)/.test(PAGE))return;
 var HK=KEY+':hl';function all(){try{return JSON.parse(ls(HK)||'[]');}catch(e){return [];}}function save(a){ls(HK,JSON.stringify(a));}
 var SKIP='script,style,.katex-mathml,button,.rd-weak,.copy,.lang,textarea,input,select,.gl-pop,.hl-bar,.hl-pop';
 function texts(root){var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){return n.parentNode.closest(SKIP)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}}),a=[];while(w.nextNode())a.push(w.currentNode);return a;}
 function scopeOf(node){var e=node.nodeType===1?node:node.parentNode;return e.closest('.sec')||e.closest('.ch-intro')||null;}
 function wrap(root,start,end,h){var pos=0,first=null;texts(root).forEach(function(n){var L=n.nodeValue.length,a=Math.max(start,pos),b=Math.min(end,pos+L);
   if(a<b){var r=document.createRange();r.setStart(n,a-pos);r.setEnd(n,b-pos);var m=document.createElement('mark');m.className='hl hl-'+(h.k||'y')+(h.n?' has-note':'');m.setAttribute('data-hl',h.id);
    if(!first){m.id='hl-'+h.id;first=m;}if(h.n)m.title=h.n;try{r.surroundContents(m);}catch(e){}}pos+=L;});return first;}
 function find(root,h){var full=texts(root).map(function(n){return n.nodeValue;}).join(''),i=-1,best=-1;
  while((i=full.indexOf(h.t,i+1))>=0){if(best<0)best=i;if(h.pre&&full.slice(Math.max(0,i-h.pre.length),i)===h.pre){best=i;break;}}return best;}
 function restore(h){var root=h.s?document.getElementById(h.s):$('.ch-intro');if(!root)return null;var i=find(root,h);return i<0?null:wrap(root,i,i+h.t.length,h);}
 function unwrap(id){$$('mark[data-hl="'+id+'"]').forEach(function(m){var p=m.parentNode;while(m.firstChild)p.insertBefore(m.firstChild,m);p.removeChild(m);p.normalize();});}
 all().filter(function(h){return h.p===PAGE;}).forEach(restore);
 if(/^#hl-/.test(location.hash)){var t=document.getElementById(location.hash.slice(1));if(t)setTimeout(function(){t.scrollIntoView({block:'center'});t.classList.add('hl-flash');},60);}
 /* 選取文字後的工具列 */
 var bar=document.createElement('div');bar.className='hl-bar';bar.hidden=true;
 bar.innerHTML='<button type="button" data-k="y" aria-label="黃色重點"><i class="dot y"></i></button><button type="button" data-k="g" aria-label="綠色重點"><i class="dot g"></i></button><button type="button" data-k="p" aria-label="粉紅重點"><i class="dot p"></i></button><span class="sep"></span><button type="button" data-k="note">加筆記</button>';
 B.appendChild(bar);var cur=null;
 function selInfo(){var s=window.getSelection();if(!s||s.isCollapsed||!s.rangeCount)return null;var r=s.getRangeAt(0),t=s.toString();if(!t.trim()||t.length>1200)return null;
  var root=scopeOf(r.startContainer);if(!root||root!==scopeOf(r.endContainer))return null;if((r.commonAncestorContainer.nodeType===1?r.commonAncestorContainer:r.commonAncestorContainer.parentNode).closest('pre,.toggle,.rd-weak'))return null;
  var pre=document.createRange();pre.setStart(root,0);pre.setEnd(r.startContainer,r.startOffset);
  var full=texts(root).map(function(n){return n.nodeValue;}).join('');var start=0;texts(root).some(function(n){if(n===r.startContainer){start+=r.startOffset;return true;}if(pre.intersectsNode(n))start+=n.nodeValue.length;return false;});
  var sel=full.slice(start,start+t.length);if(sel!==t){var j=full.indexOf(t);if(j<0)return null;start=j;}
  return {root:root,start:start,t:t,pre:full.slice(Math.max(0,start-30),start),rect:r.getBoundingClientRect()};}
 function showBar(){cur=selInfo();if(!cur){bar.hidden=true;return;}bar.hidden=false;var x=cur.rect.left+cur.rect.width/2+window.scrollX-bar.offsetWidth/2,y=cur.rect.top+window.scrollY-bar.offsetHeight-10;
  if(cur.rect.top<120)y=cur.rect.bottom+window.scrollY+10;bar.style.left=Math.max(8,Math.min(x,window.scrollX+document.documentElement.clientWidth-bar.offsetWidth-8))+'px';bar.style.top=y+'px';}
 document.addEventListener('mouseup',function(e){if(e.target.closest('.hl-bar,.hl-pop'))return;setTimeout(showBar,10);});
 document.addEventListener('selectionchange',function(){clearTimeout(window.__hlT);window.__hlT=setTimeout(function(){if('ontouchstart' in window)showBar();else if(window.getSelection().isCollapsed)bar.hidden=true;},350);});
 function stamp(){var d=new Date();return d.getFullYear()+'/'+(d.getMonth()+1)+'/'+d.getDate();}
 function add(k,note){if(!cur)return;var sec=cur.root.closest('.sec'),h={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),p:PAGE,pt:($('.ch-head h1')||{}).textContent||PAGE,
   s:sec?sec.id:'',sl:sec?(sec.getAttribute('data-label')||''):'',t:cur.t,pre:cur.pre,k:k,n:note||'',d:stamp()};
  var a=all();a.push(h);save(a);wrap(cur.root,cur.start,cur.start+cur.t.length,h);window.getSelection().removeAllRanges();bar.hidden=true;cur=null;return h;}
 bar.addEventListener('mousedown',function(e){e.preventDefault();});
 bar.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var k=b.getAttribute('data-k');
  if(k==='note'){var h=add('y','');if(h)openPop(document.getElementById('hl-'+h.id),true);}else add(k);});
 /* 點已畫的重點：編輯筆記、換色、刪除 */
 var pop=document.createElement('div');pop.className='hl-pop';pop.hidden=true;B.appendChild(pop);
 function openPop(m,focus){if(!m)return;var id=m.getAttribute('data-hl'),a=all(),h=a.filter(function(x){return x.id===id;})[0];if(!h)return;
  pop.innerHTML='<textarea rows="3" placeholder="寫一點筆記（可留空）"></textarea><div class="hl-pop-row"><button type="button" data-k="y"><i class="dot y"></i></button><button type="button" data-k="g"><i class="dot g"></i></button><button type="button" data-k="p"><i class="dot p"></i></button><span class="sep"></span><button type="button" class="del">刪除</button><button type="button" class="ok">完成</button></div><a href="notes.html">查看全部重點與筆記 →</a>';
  var ta=$('textarea',pop);ta.value=h.n||'';pop.hidden=false;var r=m.getBoundingClientRect();pop.style.left=Math.max(8,Math.min(r.left+window.scrollX,window.scrollX+document.documentElement.clientWidth-pop.offsetWidth-8))+'px';pop.style.top=(r.bottom+window.scrollY+8)+'px';
  if(focus)ta.focus();
  function commit(){h.n=ta.value.trim();save(a);$$('mark[data-hl="'+id+'"]').forEach(function(x){x.classList.toggle('has-note',!!h.n);x.title=h.n||'';});}
  $$('.hl-pop-row [data-k]',pop).forEach(function(b){b.onclick=function(){h.k=b.getAttribute('data-k');commit();$$('mark[data-hl="'+id+'"]').forEach(function(x){x.className='hl hl-'+h.k+(h.n?' has-note':'');});};});
  $('.ok',pop).onclick=function(){commit();pop.hidden=true;};
  $('.del',pop).onclick=function(){save(a.filter(function(x){return x.id!==id;}));unwrap(id);pop.hidden=true;};}
 document.addEventListener('click',function(e){var m=e.target.closest('mark.hl');if(m&&!e.target.closest('.hl-pop')){e.preventDefault();openPop(m);return;}if(!e.target.closest('.hl-pop'))pop.hidden=true;});
})();
/* ---------- R 程式碼在網頁上執行（webR；按了才載入） ---------- */
(function(){var blocks=$$('.code.runnable');if(!blocks.length)return;var loading=null;
 function load(){if(window.NotesWebR)return Promise.resolve();if(loading)return loading;
  loading=new Promise(function(ok,bad){var s=document.createElement('script');s.src='assets/webr.js';s.onload=ok;s.onerror=bad;document.head.appendChild(s);});return loading;}
 blocks.forEach(function(blk){var btn=$('.run',blk),pre=$('pre',blk),orig=pre.innerText.replace(/\n$/,''),ta=null,box=null,st=null,reset=null;
  btn.addEventListener('click',function(){
   if(!ta){ta=document.createElement('textarea');ta.className='webr-edit';ta.spellcheck=false;ta.value=orig;ta.rows=Math.min(18,orig.split('\n').length+1);
    ta.setAttribute('aria-label','可以修改的 R 程式碼');pre.hidden=true;blk.insertBefore(ta,pre);
    reset=document.createElement('button');reset.type='button';reset.className='run-reset';reset.textContent='還原';blk.appendChild(reset);
    reset.onclick=function(){ta.value=orig;};
    ta.addEventListener('keydown',function(e){if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();btn.click();}});
    st=document.createElement('p');st.className='webr-status';box=document.createElement('div');box.className='webr-box';
    var at=blk;while(at.nextElementSibling&&/\b(out|rfig)\b/.test(at.nextElementSibling.className))at=at.nextElementSibling;
    at.insertAdjacentElement('afterend',st);st.insertAdjacentElement('afterend',box);
    st.textContent='可以直接修改上面的程式碼，再按「▶ 執行」（或 ⌘／Ctrl + Enter）。';btn.textContent='▶ 執行';ta.focus();return;}
   btn.disabled=true;load().then(function(){return window.NotesWebR.run(ta.value,box,function(m){st.textContent=m;});})
    .catch(function(){st.textContent='無法載入 R：請確認有網路（webR 從 webr.r-wasm.org 下載）。';}).then(function(){btn.disabled=false;});});});
})();
sync();
})();
/* 計算題數字作答框（退休金課程，2026/11/23）：容許四捨五入誤差，百分比打 10.59 或 0.1059 都算對 */
(function(){document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.numans .chk');if(!b)return;
var w=b.closest('.numans'),inp=w.querySelector('input'),res=w.querySelector('.res');var v=parseFloat((inp.value||'').replace(/[,%\s，]/g,''));
var a=parseFloat(w.getAttribute('data-ans')),d=parseInt(w.getAttribute('data-dp')||'2',10),tol=0.5*Math.pow(10,-d)+1e-9;
if(isNaN(v)){res.textContent='請先輸入數字';res.className='res no';return;}
var ok=Math.abs(v-a)<=tol||Math.abs(v*100-a)<=tol||Math.abs(v/100-a)<=tol*0.01+1e-12;
res.textContent=ok?'答對了':'再算算看';res.className='res '+(ok?'ok':'no');
if(ok){var q=w.closest('.q');var t=q&&q.querySelector('.toggle');if(t&&t.getAttribute('aria-expanded')!=='true')t.click();}});
document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.closest&&e.target.closest('.numans input')){var b=e.target.closest('.numans').querySelector('.chk');b&&b.click();}});})();
