(function(){'use strict';
/* 課程筆記網站｜學習工具頁：測驗模式（exam.html）、我的重點與筆記（notes.html）。v5（2026/11/14）
   資料只存在這台裝置的瀏覽器（localStorage），鍵名前綴取 <body data-key>。 */
var B=document.body,KEY=B.getAttribute('data-key')||'notes';
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){return null}}
function J(k,d){try{return JSON.parse(ls(k)||'null')||d;}catch(e){return d;}}
function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]});}
function math(el){if(window.renderMathInElement)renderMathInElement(el,{delimiters:[{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false},{left:'$$',right:'$$',display:true}],throwOnError:false});}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function chName(t){var i=t.indexOf('　');return i<0?t:t.slice(0,i);}

/* =================== 測驗模式 =================== */
var app=document.getElementById('exam-app');
if(app&&window.QBANK){
 var QB=window.QBANK,ALL=QB.q,weak={};(J(KEY+':weak',[])).forEach(function(k){weak[k]=1;});
 var kinds=[];ALL.forEach(function(q){if(kinds.indexOf(q.kind)<0)kinds.push(q.kind);});
 var setup=function(){
  var hist=J(KEY+':exams',[]);
  var chs=QB.ch.filter(function(c){return ALL.some(function(q){return q.p===c[0];});});
  app.innerHTML='<section class="sec exam-setup"><h2>出一份測驗</h2>'+
   '<div class="ex-row"><div class="ex-label">章節</div><div class="ex-chips" id="exCh">'+chs.map(function(c){var n=ALL.filter(function(q){return q.p===c[0];}).length;
     return '<label class="chip"><input type="checkbox" value="'+c[0]+'" checked><span>'+esc(c[1])+'<small>'+n+' 題</small></span></label>';}).join('')+'</div>'+
   '<div class="ex-mini"><button type="button" data-a="all">全選</button><button type="button" data-a="none">全不選</button></div></div>'+
   '<div class="ex-row"><div class="ex-label">題型</div><div class="ex-chips" id="exKind">'+kinds.map(function(k){return '<label class="chip"><input type="checkbox" value="'+k+'" checked><span>'+esc(k)+'</span></label>';}).join('')+'</div></div>'+
   '<div class="ex-row"><div class="ex-label">範圍</div><div class="ex-chips"><label class="chip"><input type="radio" name="exScope" value="all" checked><span>全部題目</span></label><label class="chip"><input type="radio" name="exScope" value="weak"><span>只出標記「不熟」的題目</span></label></div></div>'+
   '<div class="ex-row"><div class="ex-label">題數</div><div class="ex-chips">'+[5,10,20,30].map(function(n,i){return '<label class="chip"><input type="radio" name="exN" value="'+n+'"'+(i===1?' checked':'')+'><span>'+n+' 題</span></label>';}).join('')+'</div></div>'+
   '<p class="ex-avail" id="exAvail"></p><button type="button" class="ex-start" id="exStart">開始測驗</button></section>'+
   (hist.length?'<section class="sec"><h2>最近的測驗</h2><table class="ex-hist"><thead><tr><th>時間</th><th>範圍</th><th>得分</th></tr></thead><tbody>'+
     hist.slice(0,10).map(function(h){return '<tr><td>'+esc(h.t)+'</td><td>'+esc(h.r)+'</td><td>'+h.s+' / '+h.n+'（'+Math.round(h.s/h.n*100)+'%）</td></tr>';}).join('')+'</tbody></table></section>':'');
  function pool(){var cs=$$('#exCh input:checked').map(function(i){return i.value;}),ks=$$('#exKind input:checked').map(function(i){return i.value;}),w=$('input[name=exScope]:checked').value==='weak';
   return ALL.filter(function(q){return cs.indexOf(q.p)>=0&&ks.indexOf(q.kind)>=0&&(!w||weak[q.p+'#'+q.id]);});}
  function upd(){var n=pool().length;$('#exAvail').textContent='符合條件的題目共 '+n+' 題。';$('#exStart').disabled=!n;}
  app.onchange=upd;app.oninput=null;
  $$('.ex-mini button',app).forEach(function(b){b.onclick=function(){$$('#exCh input').forEach(function(i){i.checked=b.getAttribute('data-a')==='all';});upd();};});
  upd();
  $('#exStart').onclick=function(){var n=+$('input[name=exN]:checked').value,p=shuffle(pool().slice()).slice(0,n);
   var r=$$('#exCh input:checked').length===chs.length?'全部章節':$$('#exCh input:checked').map(function(i){return chName(QB.ch.filter(function(c){return c[0]===i.value;})[0][1]);}).join('、');
   run(p,r);};
 };
 var run=function(qs,range){
  app.innerHTML='<div class="ex-bar"><span id="exProg">已作答 0 / '+qs.length+'</span><button type="button" class="ex-quit">放棄並返回</button></div>'+
   qs.map(function(q,i){var mc=q.kind==='選擇';
    return '<article class="q ex-q" data-i="'+i+'"><div class="q-meta"><h4>第 '+(i+1)+' 題</h4><span class="q-kind">'+esc(q.kind)+'｜'+esc(q.level)+'</span><span class="q-title">'+esc(q.title)+'</span></div>'+
     '<div class="q-text">'+q.stem+'</div>'+
     (mc?'<ol class="opts ex-opts">'+q.opts.map(function(o){return '<li><label><input type="radio" name="ex'+i+'" value="'+o[0]+'"><b>('+o[0]+')</b><span>'+o[1].replace(/^<p>|<\/p>$/g,'')+'</span></label></li>';}).join('')+'</ol>'
        :'<textarea class="ex-ans" rows="'+(q.kind==='寫程式'?6:3)+'" placeholder="寫下你的答案（交卷後對照參考答案，自己判斷對錯）"></textarea>')+
     '<div class="ex-result" hidden></div></article>';}).join('')+
   '<div class="ex-submit-row"><button type="button" class="ex-start" id="exSubmit">交卷</button></div>';
  math(app);window.scrollTo(0,0);
  function prog(){var n=0;qs.forEach(function(q,i){var a=$('.ex-q[data-i="'+i+'"]');if(q.kind==='選擇'?$('input:checked',a):$('textarea',a).value.trim())n++;});$('#exProg').textContent='已作答 '+n+' / '+qs.length;}
  app.oninput=prog;app.onchange=prog;
  $('.ex-quit').onclick=function(){if(confirmQuit())setup();};
  function confirmQuit(){return true;}
  $('#exSubmit').onclick=function(){grade(qs,range);};
 };
 var grade=function(qs,range){
  var auto=0,autoN=0,self=[];
  qs.forEach(function(q,i){var a=$('.ex-q[data-i="'+i+'"]'),res=$('.ex-result',a),link=q.p+'.html#'+q.sid,src=q.p+'.html#'+q.id,mc=q.kind==='選擇';
   $$('input,textarea',a).forEach(function(x){x.disabled=true;});
   var head='';
   if(mc){autoN++;var pick=($('input:checked',a)||{}).value,ok=pick===q.key;if(ok)auto++;
    a.classList.add(ok?'ex-ok':'ex-bad');
    $$('.ex-opts li',a).forEach(function(li){var v=$('input',li).value;if(v===q.key)li.classList.add('is-key');else if(v===pick)li.classList.add('is-wrong');});
    head='<p class="ex-verdict">'+(ok?'答對了':(pick?'答錯了，你選 ('+pick+')':'沒有作答'))+'</p>';}
   else{self.push(i);head='<p class="ex-verdict">對照參考答案，自己判斷：<button type="button" data-v="1">我答對了</button><button type="button" data-v="0">我答錯了</button></p>';}
   var wk=q.p+'#'+q.id;
   res.innerHTML=head+'<div class="sol">'+q.sol+'</div><p class="ex-links"><a href="'+link+'">回到教學：'+esc(chName(q.ch))+' '+esc(q.sec)+' →</a><a href="'+src+'">看原題</a>'+
     '<button type="button" class="ex-weak" aria-pressed="'+(weak[wk]?'true':'false')+'">'+(weak[wk]?'★ 已在不熟清單':'☆ 加入不熟')+'</button></p>';
   res.hidden=false;
   $('.ex-weak',res).onclick=function(){var b=this,on=b.getAttribute('aria-pressed')!=='true';if(on)weak[wk]=1;else delete weak[wk];
    ls(KEY+':weak',JSON.stringify(Object.keys(weak)));b.setAttribute('aria-pressed',on);b.textContent=on?'★ 已在不熟清單':'☆ 加入不熟';};
   $$('.ex-verdict button',res).forEach(function(b){b.onclick=function(){a.setAttribute('data-self',b.getAttribute('data-v'));a.classList.remove('ex-ok','ex-bad');a.classList.add(b.getAttribute('data-v')==='1'?'ex-ok':'ex-bad');
    $$('.ex-verdict button',res).forEach(function(x){x.classList.toggle('on',x===b);});score();};});
  });
  math(app);
  var box=document.createElement('section');box.className='sec ex-score';app.insertBefore(box,app.firstChild.nextSibling);
  function score(){var s=auto,judged=0;self.forEach(function(i){var v=$('.ex-q[data-i="'+i+'"]').getAttribute('data-self');if(v!==null){judged++;if(v==='1')s++;}});
   var pend=self.length-judged;
   box.innerHTML='<h2>成績</h2><p class="ex-big">'+s+' <small>/ '+qs.length+'</small></p><p>選擇題自動計分 '+auto+' / '+autoN+'。'+(self.length?('其他題型自評 '+judged+' / '+self.length+(pend?'，還有 '+pend+' 題沒評':'')+'。'):'')+
    '答錯的題目可以按「☆ 加入不熟」，之後在章節頁按「只看不熟」，或在這裡選「只出標記不熟的題目」再練一次。</p>'+
    '<p><button type="button" class="ex-start" id="exAgain">再出一份</button></p>';
   $('#exAgain').onclick=setup;
   if(!pend&&!box.getAttribute('data-saved')){box.setAttribute('data-saved','1');var h=J(KEY+':exams',[]);var d=new Date();
    h.unshift({t:d.getFullYear()+'/'+(d.getMonth()+1)+'/'+d.getDate()+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2),r:range,s:s,n:qs.length});ls(KEY+':exams',JSON.stringify(h.slice(0,30)));}}
  app.oninput=null;app.onchange=null;score();$('.ex-submit-row').remove();$('.ex-bar').innerHTML='<span>已交卷</span><button type="button" class="ex-quit">返回出題</button>';$('.ex-quit').onclick=setup;
  window.scrollTo(0,0);
 };
 setup();
}

/* =================== 我的重點與筆記 =================== */
var napp=document.getElementById('notes-app');
if(napp){
 var render=function(){
  var hl=J(KEY+':hl',[]);
  var tools='<div class="nt-tools"><input type="search" class="gl-filter" id="ntFilter" placeholder="篩選重點與筆記" aria-label="篩選"><button type="button" id="ntExport">匯出</button><label class="nt-import">匯入<input type="file" id="ntImport" accept=".json,application/json" hidden></label><button type="button" id="ntMd">複製成文字</button></div>';
  if(!hl.length){napp.innerHTML=tools+'<section class="sec"><h2>還沒有重點</h2><p>到任何章節頁，用滑鼠（手機用長按）選取一段文字，按「畫重點」或「加筆記」，就會出現在這裡。</p></section>';bind();return;}
  var groups={},order=[];hl.forEach(function(h){if(!groups[h.p]){groups[h.p]=[];order.push(h.p);}groups[h.p].push(h);});
  order.sort();
  napp.innerHTML=tools+order.map(function(p){var g=groups[p];
   return '<section class="sec nt-group"><h2>'+esc(g[0].pt||p)+'<small>'+g.length+' 則</small></h2>'+g.map(function(h){
    return '<div class="nt-item" data-id="'+h.id+'"><blockquote><mark class="hl hl-'+(h.k||'y')+'">'+esc(h.t)+'</mark></blockquote>'+
     (h.n?'<p class="nt-note">'+esc(h.n)+'</p>':'')+
     '<p class="nt-meta"><a href="'+p+'.html#hl-'+h.id+'">'+esc(h.sl||'回到原處')+' →</a><span>'+esc(h.d||'')+'</span><button type="button" class="nt-edit">編輯筆記</button><button type="button" class="nt-del">刪除</button></p></div>';}).join('')+'</section>';}).join('');
  bind();
 };
 var bind=function(){
  var f=$('#ntFilter');if(f)f.oninput=function(){var q=f.value.trim().toLowerCase();$$('.nt-item').forEach(function(x){x.hidden=q&&x.textContent.toLowerCase().indexOf(q)<0;});};
  $$('.nt-del').forEach(function(b){b.onclick=function(){var id=b.closest('.nt-item').getAttribute('data-id');ls(KEY+':hl',JSON.stringify(J(KEY+':hl',[]).filter(function(h){return h.id!==id;})));render();};});
  $$('.nt-edit').forEach(function(b){b.onclick=function(){var it=b.closest('.nt-item'),id=it.getAttribute('data-id'),hl=J(KEY+':hl',[]),h=hl.filter(function(x){return x.id===id;})[0];
   var ta=document.createElement('textarea');ta.className='ex-ans';ta.rows=3;ta.value=h.n||'';var ok=document.createElement('button');ok.type='button';ok.textContent='儲存';ok.className='nt-save';
   it.appendChild(ta);it.appendChild(ok);ta.focus();ok.onclick=function(){h.n=ta.value.trim();ls(KEY+':hl',JSON.stringify(hl));render();};};});
  var ex=$('#ntExport');if(ex)ex.onclick=function(){var blob=new Blob([JSON.stringify({course:KEY,version:1,highlights:J(KEY+':hl',[]),weak:J(KEY+':weak',[])},null,1)],{type:'application/json'});
   var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=KEY+'-我的重點與筆記.json';document.body.appendChild(a);a.click();a.remove();};
  var im=$('#ntImport');if(im)im.onchange=function(){var file=im.files[0];if(!file)return;var r=new FileReader();r.onload=function(){try{var d=JSON.parse(r.result),cur=J(KEY+':hl',[]),ids={};
    cur.forEach(function(h){ids[h.id]=1;});var add=(d.highlights||[]).filter(function(h){return h&&h.id&&!ids[h.id];});ls(KEY+':hl',JSON.stringify(cur.concat(add)));
    var w=J(KEY+':weak',[]);(d.weak||[]).forEach(function(k){if(w.indexOf(k)<0)w.push(k);});ls(KEY+':weak',JSON.stringify(w));
    render();var m=document.createElement('p');m.className='rd-resume';m.textContent='已匯入 '+add.length+' 則重點（重複的略過）。';napp.insertBefore(m,napp.firstChild.nextSibling);}catch(e){alertBox('這個檔案不是匯出的重點檔。');}};r.readAsText(file);};
  var md=$('#ntMd');if(md)md.onclick=function(){var hl=J(KEY+':hl',[]),t=hl.map(function(h){return '「'+h.t+'」'+(h.n?'\n  筆記：'+h.n:'')+'\n  出處：'+(h.pt||h.p)+(h.sl?' '+h.sl:'');}).join('\n\n');
   if(navigator.clipboard)navigator.clipboard.writeText(t).then(function(){md.textContent='已複製 ✓';setTimeout(function(){md.textContent='複製成文字';},1400);});};
 };
 var alertBox=function(msg){var m=document.createElement('p');m.className='rd-weak-empty';m.textContent=msg;napp.insertBefore(m,napp.firstChild.nextSibling);};
 render();
}
})();
