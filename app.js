const STORAGE_KEY = 'work-compass-profile-v1';
const suggestions = ['記事執筆','データ入力','Canva','WordPress','SNS運用','画像制作','動画編集'];
let skills = [];
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function addSkill(value){
  const skill = value.trim().replace(/^[、,\s]+|[、,\s]+$/g,'');
  if(!skill || skills.some(s => s.toLowerCase() === skill.toLowerCase())) return;
  skills.push(skill); renderSkills(); save();
}
function renderSkills(){
  $('#skills').innerHTML = skills.map((s,i)=>`<span class="chip">${escapeHtml(s)}<button type="button" data-remove="${i}" aria-label="${escapeHtml(s)}を削除">×</button></span>`).join('');
  $$('#skills [data-remove]').forEach(b=>b.onclick=()=>{skills.splice(+b.dataset.remove,1);renderSkills();save();});
}
function escapeHtml(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function showStep(n){
  $$('.form-step').forEach(p=>p.classList.toggle('active',p.dataset.panel===String(n)));
  $$('.step').forEach(s=>s.classList.toggle('active',+s.dataset.step<=n));
  if(n===3) buildResult();
  $('.panel').scrollIntoView({behavior:'smooth',block:'start'});
}
function profile(){return {
  skills, experience:$('#experience').value.trim(), jobType:$('#jobType').value,
  contract:$('#contract').value, minBudget:$('#minBudget').value, hours:$('#hours').value,
  priorities:$$('[name="priority"]:checked').map(x=>x.value)
};}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(profile()));}
function load(){
  try{const p=JSON.parse(localStorage.getItem(STORAGE_KEY));if(!p)return;
    skills=p.skills||[]; $('#experience').value=p.experience||''; $('#jobType').value=p.jobType||'';
    $('#contract').value=p.contract||''; $('#minBudget').value=p.minBudget||''; $('#hours').value=p.hours||'';
    $$('[name="priority"]').forEach(x=>x.checked=(p.priorities||[]).includes(x.value));renderSkills();
  }catch(e){localStorage.removeItem(STORAGE_KEY);}
}
function buildResult(){
  save(); const p=profile();
  const terms=[p.jobType,...p.skills.slice(0,3),...p.priorities.slice(0,1)].filter(Boolean);
  $('#searchQuery').value=[...new Set(terms)].join(' ') || '在宅 初心者歓迎';
  const summary=[...p.skills,p.jobType,p.contract,p.hours,...p.priorities,p.minBudget&&`希望 ${Number(p.minBudget).toLocaleString()}円〜`].filter(Boolean);
  previewSearch();
  $('#profileSummary').innerHTML=summary.map(x=>`<span>${escapeHtml(x)}</span>`).join('')||'<span>条件未設定</span>';
}
function score(){
  const raw=$('#jobText').value.trim();
  if(!raw){alert('案件のタイトルや説明文を貼り付けてください。');return;}
  const text=raw.toLowerCase(), p=profile();
  const terms=[...new Set([...p.skills,p.jobType,p.contract,...p.priorities].filter(Boolean))];
  const sentences=raw.split(/[。！？\n]+/).map(s=>s.trim()).filter(Boolean);
  const evidence=k=>sentences.find(s=>s.toLowerCase().includes(k.toLowerCase()))||'';
  const matches=terms.filter(k=>text.includes(k.toLowerCase()));
  const absent=terms.filter(k=>!text.includes(k.toLowerCase()));
  const good=[], concerns=[];
  matches.forEach(k=>{
    const quote=evidence(k);
    if(/不可|禁止|対象外|お断り|歓迎しません|募集していません|不要/.test(quote)){
      concerns.push({message:`「${k}」への制限・否定の可能性があります。前後の文を確認してください。`,quote});
    }else{
      good.push({message:`登録条件「${k}」への言及があります。経験・希望を活かせるか確認しましょう。`,quote});
    }
  });
  absent.forEach(k=>concerns.push({message:`「${k}」の記載が見つかりません。条件が合わないと断定はできません。`,quote:''}));
  const knownSkills=['Canva','Excel','WordPress','Photoshop','Illustrator','Figma','Python','JavaScript','動画編集','英語','SEO'];
  knownSkills.filter(k=>!p.skills.some(s=>s.toLowerCase()===k.toLowerCase())).forEach(k=>{
    const quote=evidence(k);
    if(quote && /必須|必要|経験者|できる方|使える方|扱える方/.test(quote)) concerns.push({message:`「${k}」が必要条件の可能性があります。プロフィールに未登録なので、対応できるか確認してください。`,quote});
  });
  ['lineで','lineへ','外部連絡','教材購入','先に購入','口座開設','無料登録','簡単に稼げ','誰でも高収入'].filter(k=>text.includes(k)).forEach(k=>concerns.push({message:`「${k}」への言及があります。禁止・注意を説明する文の場合もあるため、文脈を確認してください。`,quote:evidence(k)}));
  if(p.minBudget) concerns.push({message:`希望報酬は${Number(p.minBudget).toLocaleString()}円以上です。契約総額・単価・作業量は自動比較していないため確認してください。`,quote:''});
  if(p.hours) concerns.push({message:`使える時間は「${p.hours}」です。作業量・納期が収まるか確認してください。`,quote:''});
  if(!/AI|ＡＩ|ChatGPT|Claude|Codex/i.test(raw) && p.skills.some(k=>/AI|ChatGPT|Claude|Codex/i.test(k))) concerns.push({message:'AI利用の可否が分かりません。応募前に確認してください。',quote:''});
  const points=terms.length?Math.round(good.length/terms.length*100):null;
  const renderItems=items=>'<ul>'+items.map(x=>`<li>${escapeHtml(x.message)}${x.quote?`<blockquote>募集文：${escapeHtml(x.quote)}</blockquote>`:''}</li>`).join('')+'</ul>';
  $('#scoreResult').hidden=false;
  $('#scoreResult').innerHTML=`<h3>登録条件の一致率：${points===null?'条件未登録':points+'%'}</h3><p>文章中のキーワードと一部の注意表現から整理しています。意味の理解やスキルの充足を判定するAI診断ではありません。</p><h3>合っている点の候補</h3>${good.length?renderItems(good):'<p>登録条件との一致は見つかりませんでした。</p>'}<h3>不足・確認が必要な点</h3>${concerns.length?renderItems(concerns):'<p>今回のルールでは確認点を抽出できませんでした。</p>'}<p class="helper">募集状況、報酬、発注者情報、対応可能性は掲載元で確認してください。</p>`;
}

$('#suggestions').innerHTML=suggestions.map(s=>`<button type="button">＋ ${s}</button>`).join('');
$$('#suggestions button').forEach((b,i)=>b.onclick=()=>addSkill(suggestions[i]));
$('#addSkill').onclick=()=>{$('#skillInput').value.split(/[、,]/).forEach(addSkill);$('#skillInput').value='';};
$('#skillInput').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('#addSkill').click();}};
$$('.next,.prev,.step').forEach(b=>b.onclick=()=>showStep(+b.dataset.next||+b.dataset.step));
$$('input,textarea,select').forEach(el=>el.addEventListener('change',save));
function searchExpression(){
  const domains={both:'(site:crowdworks.jp/public/jobs/ OR site:lancers.jp/work/detail/)',crowdworks:'site:crowdworks.jp/public/jobs/',lancers:'site:lancers.jp/work/detail/'};
  return `${domains[$('#searchSite').value]} ${$('#searchQuery').value.trim()}`;
}
function previewSearch(){ $('#queryPreview').textContent=searchExpression(); }
$('#openSearch').onclick=()=>{
  const url=new URL('https://www.google.com/search');
  url.searchParams.set('q',searchExpression());
  {
    const filters=[];
    if($('#searchPeriod').value) filters.push(`qdr:${$('#searchPeriod').value}`);
    if($('#searchOrder').value==='date') filters.push('sbd:1');
    if(filters.length) url.searchParams.set('tbs',filters.join(','));
  }
  window.open(url.toString(),'_blank','noopener,noreferrer');
};
$('#searchQuery').addEventListener('input',previewSearch);
$('#searchSite').addEventListener('change',previewSearch);
const CANDIDATES_KEY='work-compass-candidates-v1';
let candidates=[];
try { const stored=JSON.parse(localStorage.getItem(CANDIDATES_KEY)||'[]'); if(Array.isArray(stored)) candidates=stored.filter(x=>x && typeof x.title==='string' && validCandidateUrl(x.url)); } catch(e) {}
function validCandidateUrl(value){
  try { const u=new URL(value); return u.protocol==='https:' && ((['crowdworks.jp','www.crowdworks.jp'].includes(u.hostname) && /^\/public\/jobs\/\d+\/?$/.test(u.pathname)) || (['lancers.jp','www.lancers.jp'].includes(u.hostname) && /^\/work\/detail\/\d+\/?$/.test(u.pathname))); } catch(e){return false;}
}
function renderCandidates(){
  const list=$('#candidateList'); list.replaceChildren();
  if(!candidates.length){list.textContent='保存した案件はまだありません。';return;}
  candidates.forEach((c,i)=>{
    const card=document.createElement('article'); card.className='candidate-card';
    const link=document.createElement('a'); link.textContent=c.title;link.href=c.url;link.target='_blank';link.rel='noopener noreferrer';
    const note=document.createElement('p');note.textContent=`${new URL(c.url).hostname} ・ 募集状況は要確認`;
    const remove=document.createElement('button');remove.type='button';remove.textContent='募集終了・不要な案件を削除';remove.onclick=()=>{candidates.splice(i,1);localStorage.setItem(CANDIDATES_KEY,JSON.stringify(candidates));renderCandidates();};
    card.append(link,note,remove); list.append(card);
  });
}
$('#saveCandidate').onclick=()=>{
  const title=$('#candidateTitle').value.trim(),url=$('#candidateUrl').value.trim();
  const status=$('#candidateStatus');
  if(!title || !validCandidateUrl(url)){status.textContent='案件名と、クラウドワークスまたはランサーズの案件詳細URLを入力してください。';return;}
  if(candidates.some(c=>new URL(c.url).origin+new URL(c.url).pathname===new URL(url).origin+new URL(url).pathname)){status.textContent='この案件は保存済みです。';return;}
  candidates.unshift({title,url});localStorage.setItem(CANDIDATES_KEY,JSON.stringify(candidates));renderCandidates();status.textContent='案件を保存しました。';$('#candidateTitle').value='';$('#candidateUrl').value='';
};
$('#profileForm').addEventListener('submit',e=>e.preventDefault());
renderCandidates();
$('#scoreJob').onclick=score;
$('#resetAll').onclick=()=>{if(confirm('プロフィールをリセットしますか？保存した案件は残ります。')){localStorage.removeItem(STORAGE_KEY);location.reload();}};
load();
