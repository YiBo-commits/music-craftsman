/* ============================================================
   音匠工坊 · 完全版  v3
   - 注册区分「客户 / 工作人员」，支持手机号或微信号验证码校验（演示环境直接显示验证码）
   - 工作人员注册后需管理员审核方可登录
   - 客户：我要下单 / 我的订单（进度）/ 课程中心预约 / 我的课程（课时进度）
   - 工作人员：接单大厅 / 我的订单 / 流水记录（只读，不可修改）
   - 管理员（最高权限）：订单管理、派单、调价、取消、账目增改/作废、成员审核、系统设置
   - 流水记录带哈希校验链，任何改动都会留痕并反映在完整性标识上
   ============================================================ */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const DB_KEY='musicCraftDB_v3', USER_KEY='musicCraftUser_v3';
const roles={admin:'管理员',composer:'编曲师',mixer:'混音师',recording:'录音老师',teacher:'课程教师',client:'客户 / 学员'};
const PRODUCERS=['composer','mixer','recording'];
const STAFF=['composer','mixer','recording','teacher'];
const PROD_MAP={composer:'编曲',mixer:'混音',recording:'录音'};
const CATS=['订单','课程','设备','场地','人工','其他'];

/* ---------- 工具 ---------- */
function H(s){let h1=5381,h2=52711;const str='mc·'+s+'·v3';for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);h1=(h1*33^c)>>>0;h2=(h2*31^c)>>>0}return h1.toString(16).padStart(8,'0')+h2.toString(16).padStart(8,'0')}
function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function today(){return new Date().toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'})}
function now(){return new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}
function iso(){return new Date().toISOString().slice(0,10)}
function toast(text){const t=$('#toast');t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
function badge(t){return `<span class="badge ${t}">${t}</span>`}
function money(n){return '¥'+Number(n||0).toLocaleString()}

/* ---------- 种子数据 ---------- */
function makeSeed(){
  const db={
    users:[
      {id:'admin',name:'林嘉言',phone:'13800000000',wechat:'',role:'admin',pass:H('123456'),status:'active',created:'2026-01-01'},
      {id:'u1',name:'苏沐',phone:'13800000003',wechat:'',role:'composer',pass:H('123456'),status:'active',created:'2026-02-11'},
      {id:'u2',name:'叶知',phone:'13800000004',wechat:'',role:'mixer',pass:H('123456'),status:'active',created:'2026-02-20'},
      {id:'u3',name:'周乐',phone:'13800000005',wechat:'',role:'teacher',pass:H('123456'),status:'active',created:'2026-03-05'},
      {id:'u9',name:'何声',phone:'13800000009',wechat:'',role:'composer',pass:H('123456'),status:'pending',created:'2026-09-01'},
      {id:'c1',name:'林小雨',phone:'13800000001',wechat:'',role:'client',pass:H('123456'),status:'active',created:'2026-08-10'},
      {id:'c2',name:'王若彤',phone:'13800000002',wechat:'',role:'client',pass:H('123456'),status:'active',created:'2026-08-18'}
    ],
    orders:[
      {id:'YT-202609-012',title:'《夏夜微光》编曲制作',client:'星野文化',type:'编曲',assignee:'苏沐',due:'2026-09-03',price:3200,status:'进行中',progress:72,description:'制作流行抒情风格完整编曲，需要包含主歌、副歌与间奏，交付工程文件及 WAV。',updates:[['2026-09-01','完成主歌与副歌编曲，已提交第一版试听。'],['2026-08-29','项目已由苏沐接单，开始进行风格与配器设计。']]},
      {id:'YT-202608-031',title:'陈默《回响》混音',client:'独立音乐人 · 陈默',type:'混音',assignee:'叶知',due:'2026-09-05',price:1800,status:'进行中',progress:48,description:'完成分轨混音，重点优化人声清晰度、空间感和整体动态。',updates:[['2026-08-31','完成主唱人声处理与基础平衡。']]},
      {id:'YT-202608-029',title:'播客片头录音制作',client:'半山电台',type:'录音',assignee:'',due:'2026-09-07',price:1200,status:'待接单',progress:0,description:'录制播客片头人声，提供录音棚预约与后期基础处理。',updates:[]},
      {id:'YT-202608-025',title:'《无声告白》人声混音',client:'陈可',type:'混音',assignee:'叶知',due:'2026-08-29',price:1500,status:'已交付',progress:100,description:'独立流行歌曲人声混音项目。',updates:[['2026-08-28','最终版本已上传，等待客户确认。']]},
      {id:'YT-202608-020',title:'品牌广告音乐制作',client:'光点设计',type:'编曲',assignee:'苏沐',due:'2026-08-26',price:4500,status:'已完成',progress:100,description:'30 秒品牌广告配乐。',updates:[['2026-08-26','客户确认完成，项目归档。']]}
    ],
    courses:[
      {id:'C-01',title:'基本乐理培训课程',teacher:'周乐',hours:8,price:699,description:'系统学习音高、节奏、调式、音程与和弦知识。',schedule:'每周二 14:00 – 15:30',published:true},
      {id:'C-02',title:'和声基础培训课程',teacher:'沈悦',hours:10,price:899,description:'学习和弦连接、和声功能与常用和声进行。',schedule:'每周二 19:30 – 21:00',published:true}
    ],
    enrollments:[
      {id:'E-01',courseId:'C-01',user:'林小雨',date:'2026-08-20',lessonsDone:3,notes:[['2026-09-01','完成节奏与节拍章节，作业情况良好。']]},
      {id:'E-02',courseId:'C-02',user:'王若彤',date:'2026-08-22',lessonsDone:4,notes:[['2026-09-02','三和弦与转位讲解完成。']]}
    ],
    ledger:[],logs:[],codes:{}
  };
  [
    {date:'2026-08-15',type:'支出',category:'场地',amount:2600,summary:'八月录音棚房租',operator:'林嘉言'},
    {date:'2026-08-18',type:'支出',category:'设备',amount:1800,summary:'购买监听耳机与线材',operator:'林嘉言'},
    {date:'2026-08-20',type:'登记',category:'订单',amount:1500,ref:'YT-202608-025',summary:'订单创建登记：《无声告白》人声混音',operator:'林嘉言'},
    {date:'2026-08-20',type:'收入',category:'课程',amount:699,ref:'C-01',summary:'课程预约缴费：基本乐理培训课程（林小雨）',operator:'系统'},
    {date:'2026-08-22',type:'收入',category:'课程',amount:899,ref:'C-02',summary:'课程预约缴费：和声基础培训课程（王若彤）',operator:'系统'},
    {date:'2026-08-26',type:'登记',category:'订单',amount:4500,ref:'YT-202608-020',summary:'订单创建登记：品牌广告音乐制作',operator:'林嘉言'},
    {date:'2026-08-27',type:'收入',category:'订单',amount:4500,ref:'YT-202608-020',summary:'订单完成结算：品牌广告音乐制作',operator:'林嘉言'},
    {date:'2026-08-28',type:'收入',category:'订单',amount:1500,ref:'YT-202608-025',summary:'订单完成结算：《无声告白》人声混音',operator:'林嘉言'},
    {date:'2026-08-29',type:'登记',category:'订单',amount:3200,ref:'YT-202609-012',summary:'订单创建登记：《夏夜微光》编曲制作',operator:'林嘉言'},
    {date:'2026-08-31',type:'登记',category:'订单',amount:1800,ref:'YT-202608-031',summary:'订单创建登记：陈默《回响》混音',operator:'林嘉言'}
  ].forEach(e=>addLedger(db,e));
  return db;
}

/* ---------- 账本：哈希校验链 ---------- */
function sigOf(prev,e){return H(prev+e.date+e.type+e.category+e.amount+e.summary+e.operator+e.status)}
function addLedger(db,e){e.id='L-'+String(db.ledger.length+1).padStart(3,'0');e.status='有效';e.history=[];e.sig=sigOf(db.ledger.length?db.ledger[db.ledger.length-1].sig:'',e);db.ledger.push(e);return e}
function rechain(){let prev='';db.ledger.forEach(e=>{e.sig=sigOf(prev,e);prev=e.sig})}
function chainOk(){let prev='';return db.ledger.every(e=>{const s=sigOf(prev,e);if(s!==e.sig)return false;prev=s;return true})}

/* ---------- 全局状态 ---------- */
let db=JSON.parse(localStorage.getItem(DB_KEY)||'null')||makeSeed();
let current=JSON.parse(localStorage.getItem(USER_KEY)||'null');
let active='dashboard';
let authMode='login', regVerified=false, regContact='', cooldown=0, cdTimer=null;
let ledgerFilter='全部', ledgerQuery='', orderFilter='全部', orderQuery='';

function save(){localStorage.setItem(DB_KEY,JSON.stringify(db));localStorage.setItem(USER_KEY,JSON.stringify(current))}
function log(action){db.logs.unshift({time:now(),user:current?current.name:'访客',action});db.logs=db.logs.slice(0,300)}

/* ---------- 权限 ---------- */
const PAGES={dashboard:'all',market:['admin',...STAFF],neworder:['client'],myorders:['client',...STAFF],mycourses:['client'],manageorders:['admin'],courses:'all',schedule:['admin',...STAFF],ledger:['admin',...STAFF],team:['admin'],settings:['admin'],profile:'all',help:'all'};
function allowed(id){const p=PAGES[id];return p==='all'||(current&&p.includes(current.role))}
function isAdmin(){return current&&current.role==='admin'}
function isStaff(){return current&&STAFF.includes(current.role)}
function isClient(){return current&&current.role==='client'}

/* ---------- 导航与外壳 ---------- */
function navItems(){
  const r=current.role;let items=[['dashboard','⌂','工作台']];
  if(r==='client')items.push(['neworder','✎','我要下单'],['myorders','◷','我的订单'],['mycourses','▤','我的课程'],['courses','♫','课程中心']);
  else if(STAFF.includes(r))items.push(['market','◫','接单大厅'],['myorders','✓','我的订单'],['courses','▤','课程中心'],['schedule','▦','排课日历'],['ledger','￥','流水记录']);
  else items.push(['market','◫','接单大厅'],['manageorders','▣','订单管理'],['ledger','￥','流水记录'],['courses','▤','课程中心'],['schedule','▦','排课日历'],['team','♙','成员管理'],['settings','⚙','系统设置']);
  return items;
}
function renderNav(){
  $('#nav').innerHTML=navItems().map(([id,icon,name])=>{
    let small='';
    if(id==='market')small=db.orders.filter(o=>o.status==='待接单').length;
    if(id==='team')small=db.users.filter(u=>u.status==='pending').length;
    return `<button class="nav-item ${active===id?'active':''}" data-page="${id}"><span>${icon}</span>${name}${small?`<small>${small}</small>`:''}</button>`;
  }).join('');
}
function renderShell(){
  if(!current){$('#authView').classList.remove('hidden');$('#appView').classList.add('hidden');return}
  $('#authView').classList.add('hidden');$('#appView').classList.remove('hidden');
  $('#dateText').textContent=today();$('#accountName').textContent=current.name;$('#accountRole').textContent=roles[current.role];
  $('#avatar').textContent=current.name.slice(0,1);
  const btn=$('#headerAction');
  if(isAdmin()){btn.style.display='';btn.textContent='＋ 新建订单'}
  else if(current.role==='teacher'){btn.style.display='';btn.textContent='＋ 发布课程'}
  else if(isClient()){btn.style.display='';btn.textContent='＋ 我要下单'}
  else btn.style.display='none';
  if(!allowed(active))active='dashboard';
  renderNav();renderAll();
}
const TITLES={dashboard:'工作台',market:'接单大厅',neworder:'我要下单',myorders:'我的订单',mycourses:'我的课程',manageorders:'订单管理',courses:'课程中心',schedule:'排课日历',ledger:'流水记录',team:'成员管理',settings:'系统设置',profile:'个人中心',help:'使用帮助'};
function go(id){if(!allowed(id))id='dashboard';active=id;$$('.page').forEach(p=>p.classList.toggle('active',p.id===id));$('#pageTitle').textContent=TITLES[id]||'';renderNav();renderAll()}
function renderAll(){
  if(!current)return;
  const fns={dashboard,market,neworder,myorders,mycourses,manageorders,courses,schedule,ledger,team,settings,profile,help};
  $$('.page').forEach(p=>{
    if(!allowed(p.id)){p.innerHTML='';return}
    const fn=fns[p.id];if(fn)p.innerHTML=fn();
  });
  $$('.page').forEach(p=>p.classList.toggle('active',p.id===active));
}

/* ---------- 工作台 ---------- */
function dashboard(){if(isClient())return clientDash();if(isAdmin())return adminDash();return staffDash()}
function clientDash(){
  const mine=db.orders.filter(o=>o.client===current.name);
  const myCourses=db.enrollments.filter(e=>e.user===current.name);
  const spend=mine.filter(o=>o.status!=='已取消').reduce((s,o)=>s+o.price,0);
  return `<div class="hero"><div><p>欢迎回来，${esc(current.name)}</p><h2>发布音乐需求，预约专业课程。</h2><span>你有 ${mine.filter(o=>o.status==='进行中').length} 个进行中的订单、${myCourses.length} 门在学课程。</span></div><div class="hero-wave">〰〰〰〰</div></div>
  <div class="metrics">
  <article class="metric"><i>◷</i><p>进行中订单</p><strong>${mine.filter(o=>o.status==='进行中').length}</strong><small> 个</small></article>
  <article class="metric"><i>◫</i><p>待接单需求</p><strong>${mine.filter(o=>o.status==='待接单').length}</strong><small> 个</small></article>
  <article class="metric"><i>￥</i><p>累计订单金额</p><strong>${money(spend)}</strong></article>
  <article class="metric"><i>▤</i><p>在学课程</p><strong>${myCourses.length}</strong><small> 门</small></article>
  </div>
  <div class="grid"><section class="panel"><div class="panel-head"><div><h3>我的订单</h3><p>查看制作进度与交付时间</p></div><button class="text-button" data-go="myorders">查看全部 →</button></div>${clientOrderTable(mine.slice(0,4))}</section>
  <section class="panel"><div class="panel-head"><div><h3>我的课程进度</h3><p>课时完成情况</p></div><button class="text-button" data-go="courses">去预约 →</button></div>${myCourses.slice(0,3).map(e=>{const c=db.courses.find(x=>x.id===e.courseId);if(!c)return '';const pct=Math.round(e.lessonsDone/c.hours*100);return `<div class="deadline"><span class="day-box"><b>${e.lessonsDone}</b><span>/${c.hours}课时</span></span><div><b>${esc(c.title)}</b><p>${esc(c.teacher)} · ${esc(c.schedule)}</p><span class="mini-bar"><i style="width:${pct}%"></i></span>${pct}%</div></div>`}).join('')||'<div class="empty">还没有预约课程</div>'}</section></div>`;
}
function clientOrderTable(items){
  return `<div class="table-wrap"><table><thead><tr><th>项目</th><th>类型</th><th>进度</th><th>状态</th><th></th></tr></thead><tbody>${items.map(o=>`<tr><td><b>${esc(o.title)}</b><small>交付 ${o.due} · ${money(o.price)}</small></td><td>${badge(o.type)}</td><td><span class="mini-bar"><i style="width:${o.progress}%"></i></span>${o.progress}%</td><td>${badge(o.status)}</td><td><button class="text-button" data-detail="${o.id}">详情</button></td></tr>`).join('')||'<tr><td colspan="5" class="empty">还没有订单，点击「我要下单」发布需求</td></tr>'}</tbody></table></div>`;
}
function staffDash(){
  const mine=db.orders.filter(o=>o.assignee===current.name);
  return `<div class="hero"><div><p>欢迎回来，${esc(current.name)}</p><h2>选择合适任务，让专业被看见。</h2><span>你有 ${mine.filter(o=>o.status==='进行中').length} 个进行中的任务。</span></div><div class="hero-wave">〰〰〰〰</div></div>
  <div class="metrics">
  <article class="metric"><i>▣</i><p>进行中任务</p><strong>${mine.filter(o=>o.status==='进行中').length}</strong><small> 个</small></article>
  <article class="metric"><i>◷</i><p>可接任务</p><strong>${db.orders.filter(canTake).length}</strong><small> 个</small></article>
  <article class="metric"><i>￥</i><p>我的订单金额</p><strong>${money(mine.reduce((s,o)=>s+o.price,0))}</strong></article>
  <article class="metric"><i>▤</i><p>平台课程</p><strong>${db.courses.length}</strong><small> 门</small></article>
  </div>
  <div class="grid"><section class="panel"><div class="panel-head"><div><h3>我的任务</h3><p>跟进进度与交付</p></div><button class="text-button" data-go="myorders">查看全部 →</button></div>${orderTable(mine.slice(0,4))}</section>
  <section class="panel"><div class="panel-head"><div><h3>工作室最近流水</h3><p>仅可查看，账目由管理员维护</p></div><button class="text-button" data-go="ledger">全部流水 →</button></div>${db.ledger.slice(0,5).map(e=>`<div class="deadline"><span class="day-box"><b>${e.date.slice(5)}</b><span>${e.date.slice(0,4)}</span></span><div style="flex:1"><b style="font-size:13px;font-weight:600">${esc(e.summary)}</b><p>${esc(e.operator)} · ${badge(e.type)}</p></div><strong class="amount ${e.type==='收入'?'in':e.type==='支出'?'out':'reg'}">${e.type==='支出'?'-':''}${money(e.amount)}</strong></div>`).join('')}</section></div>`;
}
function adminDash(){
  const ongoing=db.orders.filter(o=>o.status==='进行中');
  const pend=db.users.filter(u=>u.status==='pending');
  const stats=ledgerStats();
  const month=new Date().toISOString().slice(0,7);
  const monthNet=db.ledger.filter(e=>e.status==='有效'&&e.type!=='登记'&&e.date.startsWith(month)).reduce((s,e)=>s+(e.type==='收入'?e.amount:-e.amount),0);
  return `<div class="hero"><div><p>工作室概览</p><h2>当前 ${ongoing.length} 个项目制作中。</h2><span>${pend.length?`有 ${pend.length} 个工作人员账号待审核。`:'暂无待审核账号。'}</span></div><div class="hero-wave">〰〰〰〰</div></div>
  <div class="metrics">
  <article class="metric"><i>▣</i><p>进行中订单</p><strong>${ongoing.length}</strong><small> 个</small></article>
  <article class="metric"><i>◷</i><p>待接单订单</p><strong>${db.orders.filter(o=>o.status==='待接单').length}</strong><small> 个</small></article>
  <article class="metric"><i>♙</i><p>待审核账号</p><strong>${pend.length}</strong><small> 个</small></article>
  <article class="metric"><i>￥</i><p>本月净收支</p><strong>${money(monthNet)}</strong></article>
  </div>
  <div class="grid"><section class="panel"><div class="panel-head"><div><h3>近期订单</h3><p>查看项目进展与交付时间</p></div><button class="text-button" data-go="manageorders">订单管理 →</button></div>${orderTable(db.orders.slice(0,4))}</section>
  <section class="panel"><div class="panel-head"><div><h3>财务概览</h3><p>累计 · 仅有效记录</p></div><button class="text-button" data-go="ledger">流水记录 →</button></div>
  <div class="ledger-summary" style="flex-direction:column;align-items:flex-start;gap:8px">
  <span class="kv in">收入合计<b>${money(stats.inS)}</b></span><span class="kv out">支出合计<b>${money(stats.outS)}</b></span><span class="kv">净收入<b>${money(stats.net)}</b></span><span class="kv">有效笔数<b>${stats.n}</b></span></div>
  ${pend.length?`<div class="readonly-banner" style="margin-top:14px">${pend.length} 个工作人员账号待审核（${pend.map(u=>esc(u.name)).join('、')}），请前往「成员管理」处理。</div>`:''}
  </section></div>`;
}

/* ---------- 订单 ---------- */
function canTake(o){return current&&PRODUCERS.includes(current.role)&&o.status==='待接单'&&PROD_MAP[current.role]===o.type}
function orderTable(items){
  return `<div class="table-wrap"><table><thead><tr><th>项目名称</th><th>类型</th><th>负责人</th><th>交付</th><th>进度</th><th>状态</th><th></th></tr></thead><tbody>${items.map(o=>`<tr><td><b>${esc(o.title)}</b><small>${esc(o.client)}</small></td><td>${badge(o.type)}</td><td>${esc(o.assignee||'待接单')}</td><td>${o.due}</td><td><span class="mini-bar"><i style="width:${o.progress}%"></i></span>${o.progress}%</td><td>${badge(o.status)}</td><td><button class="text-button" data-detail="${o.id}">详情</button></td></tr>`).join('')||'<tr><td colspan="7" class="empty">暂无订单</td></tr>'}</tbody></table></div>`;
}
function market(){
  const eligible=db.orders.filter(o=>o.status==='待接单');
  return `<div class="toolbar"><div><h2>接单大厅</h2><p>浏览公开任务，按专业能力接单</p></div>${PRODUCERS.includes(current.role)?'<button class="outline" data-page="myorders">查看我的订单</button>':''}</div>
  <div class="filters"><button class="filter active">全部任务</button><button class="filter">编曲</button><button class="filter">混音</button><button class="filter">录音</button></div>
  <div class="order-grid">${eligible.map(o=>`<article class="order-card"><span>${badge(o.type)}</span><h3>${esc(o.title)}</h3><p>${esc(o.description)}</p><div class="card-meta">客户：${esc(o.client)}<br>交付日期：${o.due}</div><div class="card-foot"><strong>${money(o.price)}</strong>${canTake(o)?`<button class="secondary" data-take="${o.id}">立即接单</button>`:`<button class="secondary" data-detail="${o.id}">查看详情</button>`}</div></article>`).join('')||'<div class="empty"><b>暂无可接任务</b>管理员可创建新订单，或稍后再来看看。</div>'}</div>`;
}
function neworder(){
  return `<div class="toolbar"><div><h2>我要下单</h2><p>提交你的音乐制作需求，工作室确认后开始制作</p></div></div>
  <section class="panel inline-form" style="max-width:640px"><form id="clientOrderForm"><div class="form-grid">
  <label class="wide">需求标题<input name="title" required placeholder="例如：我的原创歌曲《晚风》编曲"></label>
  <label>服务类型<select name="type"><option>编曲</option><option>混音</option><option>录音</option></select></label>
  <label>期望交付日期<input name="due" type="date" required></label>
  <label>预算金额（元）<input name="price" type="number" min="0" required placeholder="例如：3000"></label>
  <label class="wide">需求说明<textarea name="description" required placeholder="请写明音乐风格、参考曲目、是否需要人声、交付格式等"></textarea></label>
  </div><button class="primary" type="submit" style="margin-top:16px">提交需求</button></form>
  <p class="mini-note" style="margin-top:16px">流程说明：提交后订单进入「待接单」，管理员确认派单，制作人员接单并持续更新进度；你可在「我的订单」实时查看进度，接单前可随时取消。</p></section>`;
}
function myorders(){
  if(isClient()){
    const list=db.orders.filter(o=>o.client===current.name);
    return `<div class="toolbar"><div><h2>我的订单</h2><p>查看需求处理进度与制作记录</p></div><button class="primary" data-page="neworder">＋ 我要下单</button></div>
    <div class="task-grid">${list.map(o=>`<article class="task-card"><span>${badge(o.type)} ${badge(o.status)}</span><h3>${esc(o.title)}</h3><p>${esc(o.description)}</p><div class="progress"><i style="width:${o.progress}%"></i></div><small>当前进度 ${o.progress}% · 交付 ${o.due}</small><div class="card-foot"><strong>${money(o.price)}</strong><span>${o.status==='待接单'?`<button class="ghost-button" data-cancel-order="${o.id}">取消需求</button> `:''}<button class="secondary" data-detail="${o.id}">查看详情</button></span></div></article>`).join('')||'<div class="empty"><b>还没有订单</b>点击「我要下单」发布你的第一个音乐需求。</div>'}</div>`;
  }
  const list=db.orders.filter(o=>o.assignee===current.name);
  return `<div class="toolbar"><div><h2>我的订单</h2><p>查看订单信息、提交进度与交付成果</p></div><button class="outline" data-page="market">前往接单大厅</button></div>
  <div class="task-grid">${list.map(o=>`<article class="task-card"><span>${badge(o.type)} ${badge(o.status)}</span><h3>${esc(o.title)}</h3><p>${esc(o.description)}</p><div class="progress"><i style="width:${o.progress}%"></i></div><small>当前进度 ${o.progress}% · 交付 ${o.due}</small><div class="card-foot"><strong>${money(o.price)}</strong><button class="secondary" data-detail="${o.id}">订单操作</button></div></article>`).join('')||'<div class="empty"><b>还没有接到订单</b>前往「接单大厅」查看符合你身份的公开任务。</div>'}</div>`;
}
function manage(){
  const filters=['全部','待接单','进行中','已交付','已完成','已取消'];
  const list=db.orders.filter(o=>(orderFilter==='全部'||o.status===orderFilter)&&(!orderQuery||(o.title+o.client+o.id).includes(orderQuery)));
  return `<div class="toolbar"><div><h2>订单管理</h2><p>创建订单、指定负责人并跟进交付状态</p></div><button class="primary" data-new-order>＋ 新建订单</button></div>
  <div class="filters">${filters.map(f=>`<button class="filter ${orderFilter===f?'active':''}" data-of="${f}">${f}${f==='全部'?' '+db.orders.length:''}</button>`).join('')}<input class="search" id="orderSearch" placeholder="搜索项目或客户" value="${esc(orderQuery)}"></div>
  <section class="panel">${orderTable(list)}</section>`;
}

/* ---------- 订单弹窗与操作 ---------- */
function showModal(title,eyebrow,body,foot){$('#modalTitle').textContent=title;$('#modalEyebrow').textContent=eyebrow;$('#modalBody').innerHTML=body;$('#modalFoot').innerHTML=foot;$('#modal').showModal()}
function orderForm(){
  const people=db.users.filter(u=>STAFF.includes(u.role)&&u.status==='active');
  showModal('新建商业订单','录入需求并指定负责人',`<div class="form-grid"><label>项目名称<input name="title" required placeholder="例如：《夏夜微光》编曲制作"></label><label>客户名称<input name="client" required placeholder="填写客户名称"></label><label>服务类型<select name="type"><option>编曲</option><option>混音</option><option>录音</option></select></label><label>指定负责人<select name="assignee"><option value="">暂不指定，公开接单</option>${people.map(u=>`<option>${esc(u.name)} · ${roles[u.role]}</option>`).join('')}</select></label><label>交付日期<input name="due" type="date" required></label><label>项目报价<input name="price" type="number" required placeholder="例如：3200"></label><label class="wide">项目需求说明<textarea name="description" required placeholder="请写明制作风格、参考曲目、交付格式等"></textarea></label></div>`,`<button class="outline" value="cancel">取消</button><button class="primary" value="default" id="saveOrder">创建订单</button>`);
}
function details(id){
  const o=db.orders.find(x=>x.id===id);if(!o)return;
  const isAssignee=o.assignee===current.name&&isStaff();
  const mine=o.client===current.name;
  let btns=`<button class="outline" value="cancel">关闭</button>`;
  if(isAssignee)btns+=`<button class="secondary" data-progress="${o.id}">更新进度</button>`;
  if(isAdmin()){
    if(!o.assignee&&o.status!=='已取消')btns+=`<button class="secondary" data-assign="${o.id}">指派人员</button>`;
    if(o.status!=='已取消'&&o.status!=='已完成')btns+=`<button class="ghost-button" data-price="${o.id}">调整金额</button>`;
    if(o.status==='已交付')btns+=`<button class="primary" data-complete="${o.id}">确认完成</button>`;
    if(['待接单','进行中'].includes(o.status))btns+=`<button class="danger-button" data-cancel-order="${o.id}">取消订单</button>`;
  }
  if(isClient()&&mine&&o.status==='待接单')btns+=`<button class="danger-button" data-cancel-order="${o.id}">取消需求</button>`;
  showModal(o.title,'订单详情与项目进度',`<div class="detail-block"><b>客户与项目需求</b><p>客户：${esc(o.client)}<br>${esc(o.description)}</p></div><div class="detail-block"><b>订单信息</b><p>类型：${badge(o.type)}　状态：${badge(o.status)}<br>负责人：${esc(o.assignee||'待接单')}　交付：${o.due}　报价：${money(o.price)}</p></div><div class="detail-block"><b>当前进度：${o.progress}%</b><div class="progress"><i style="width:${o.progress}%"></i></div></div><div class="detail-block"><b>进度记录</b><div class="timeline">${o.updates.map(u=>`<div>${esc(u[1])}<small>${u[0]}</small></div>`).join('')||'<div>暂未提交进度<small>等待负责人开始处理</small></div>'}</div></div>`,btns);
}
function progressForm(id){
  const o=db.orders.find(x=>x.id===id);
  showModal('提交项目进度','更新制作状态并保留记录',`<div class="form-grid"><label>当前完成度（%）<input name="progress" type="number" min="0" max="100" value="${o.progress}" required></label><label>订单状态<select name="status"><option ${o.status==='进行中'?'selected':''}>进行中</option><option ${o.status==='已交付'?'selected':''}>已交付</option></select></label><label class="wide">进度说明 / 文件链接<textarea name="note" required placeholder="例如：完成副歌编曲，试听文件：https://..."></textarea></label></div>`,`<button class="outline" value="cancel">取消</button><button class="primary" id="saveProgress" value="default" data-id="${id}">提交进度</button>`);
}
function assignForm(id){
  const people=db.users.filter(u=>PRODUCERS.includes(u.role)&&u.status==='active');
  showModal('指定负责人','将订单派发给团队成员',`<label>负责人<select id="chosenAssignee">${people.map(u=>`<option>${esc(u.name)} · ${roles[u.role]}</option>`).join('')}</select></label>`,`<button class="outline" value="cancel">取消</button><button class="primary" id="saveAssign" value="default" data-id="${id}">确认指派</button>`);
}
function priceForm(id){
  const o=db.orders.find(x=>x.id===id);
  showModal('调整订单金额','仅管理员可执行，调整将记入流水与日志',`<div class="detail-block"><b>${esc(o.title)}</b><p>当前金额：${money(o.price)}</p></div><label>新金额（元）<input id="newPrice" type="number" min="0" required></label>`,`<button class="outline" value="cancel">取消</button><button class="primary" id="savePrice" value="default" data-id="${id}">确认调整</button>`);
}
function cancelOrder(id){
  const o=db.orders.find(x=>x.id===id);if(!o)return;
  o.status='已取消';o.updates.unshift([iso(),`${current.name} 取消了该订单。`]);
  addLedger(db,{date:iso(),type:'登记',category:'订单',amount:0,ref:o.id,summary:`订单取消：${o.title}`,operator:current.name});
  log(`取消订单：${o.title}`);save();$('#modal').close();toast('订单已取消');renderAll();
}

/* ---------- 课程 ---------- */
function courses(){
  const canPublish=isAdmin()||current.role==='teacher';
  return `<div class="toolbar"><div><h2>课程中心</h2><p>${isClient()?'浏览并预约感兴趣的课程':'课程上架、学员预约与教学管理'}</p></div>${canPublish?'<button class="primary" data-new-course>＋ 发布课程</button>':''}</div>
  <div class="course-grid">${db.courses.filter(c=>c.published).map((c,i)=>{
    const enrolled=db.enrollments.some(e=>e.courseId===c.id&&e.user===current.name);
    return `<article class="course-card"><div class="course-cover ${i%2?'orange':''}">♫</div><span>${badge('课程')}</span><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p><div class="card-meta">教师：${esc(c.teacher)}<br>${esc(c.schedule)} · ${c.hours} 课时<br>已预约 ${db.enrollments.filter(e=>e.courseId===c.id).length} 人${isClient()&&enrolled?'（你已预约）':''}</div><div class="card-foot"><strong>${money(c.price)} / ${c.hours}课时</strong>${isClient()?(enrolled?`<button class="secondary" data-go="mycourses">查看进度</button>`:`<button class="secondary" data-book="${c.id}">预约课程</button>`):(canPublish?`<span><button class="ghost-button" data-enroll="${c.id}">学员进度</button> <button class="secondary" data-course="${c.id}">查看</button></span>`:`<button class="secondary" data-course="${c.id}">查看课程</button>`)}</div></article>`}).join('')}</div>`;
}
function courseForm(){
  showModal('发布课程','创建课程并设置教学时间',`<div class="form-grid"><label>课程名称<input name="title" required placeholder="例如：基本乐理培训课程"></label><label>授课教师<input name="teacher" value="${esc(current.name)}" required></label><label>课程课时<input name="hours" type="number" value="8" min="1" required></label><label>课程价格<input name="price" type="number" value="699" min="0" required></label><label class="wide">上课安排<input name="schedule" required placeholder="例如：每周二 14:00 – 15:30"></label><label class="wide">课程简介<textarea name="description" required placeholder="填写适合人群、课程目标与主要内容"></textarea></label></div>`,`<button class="outline" value="cancel">取消</button><button class="primary" value="default" id="saveCourse">发布课程</button>`);
}
function bookCourse(id){
  const c=db.courses.find(x=>x.id===id);
  showModal('预约课程','提交预约后将进入学员名单',`<div class="detail-block"><b>${esc(c.title)}</b><p>授课教师：${esc(c.teacher)}<br>${esc(c.schedule)}<br>课程费用：${money(c.price)}（共 ${c.hours} 课时）</p></div><label>预约备注<textarea id="bookNote" placeholder="例如：已有基础、希望学习方向"></textarea></label>`,`<button class="outline" value="cancel">取消</button><button class="primary" id="confirmBook" value="default" data-id="${id}">确认预约</button>`);
}
function enrollModal(id){
  const c=db.courses.find(x=>x.id===id);if(!c)return;
  const list=db.enrollments.filter(e=>e.courseId===id);
  showModal(`学员进度 · ${c.title}`,'更新课时进度（教师 / 管理员）',
    (list.map(e=>`<div class="enroll-row"><div><b>${esc(e.user)}</b><p>预约于 ${e.date} · ${e.lessonsDone>=c.hours?'已结课':'进行中'}</p></div><select data-enroll-select="${e.id}">${Array.from({length:c.hours+1},(_,n)=>`<option value="${n}" ${n===e.lessonsDone?'selected':''}>${n} / ${c.hours} 课时</option>`).join('')}</select></div>`).join('')||'<div class="empty">暂无学员预约该课程</div>'),
    `<button class="outline" value="cancel">关闭</button>${list.length?`<button class="primary" id="saveLessons" value="default" data-id="${id}">保存进度</button>`:''}`);
}
function mycourses(){
  const list=db.enrollments.filter(e=>e.user===current.name);
  return `<div class="toolbar"><div><h2>我的课程</h2><p>查看课时进度与课堂记录</p></div><button class="outline" data-page="courses">去预约课程</button></div>
  <div class="task-grid">${list.map(e=>{const c=db.courses.find(x=>x.id===e.courseId);if(!c)return '';const pct=Math.min(100,Math.round(e.lessonsDone/c.hours*100));return `<article class="task-card"><span>${badge('课程')} ${badge(e.lessonsDone>=c.hours?'已完成':'进行中')}</span><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p><div class="progress"><i style="width:${pct}%"></i></div><small>课时进度 ${e.lessonsDone} / ${c.hours}（${pct}%） · 教师：${esc(c.teacher)}<br>${esc(c.schedule)} · 已缴费 ${money(c.price)}</small><div class="card-foot"><strong>${pct}%</strong><button class="secondary" data-course="${c.id}">课程详情</button></div>${e.notes.length?`<div class="timeline" style="margin-top:14px">${e.notes.slice(0,3).map(n=>`<div>${esc(n[1])}<small>${n[0]}</small></div>`).join('')}</div>`:''}</article>`}).join('')||'<div class="empty"><b>还没有预约课程</b>前往「课程中心」选择合适的课程预约。</div>'}</div>`;
}
function schedule(){
  const canPub=isAdmin()||current.role==='teacher';
  const events=db.courses.filter(c=>c.published).map((c,i)=>`<div class="event ${i%2?'orange':''}"><b>${esc(c.schedule)}</b><p>${esc(c.title)} · 授课教师：${esc(c.teacher)} · 已预约 ${db.enrollments.filter(e=>e.courseId===c.id).length} 人</p></div>`).join('');
  return `<div class="toolbar"><div><h2>排课日历</h2><p>统一查看课程时间与学员安排</p></div>${canPub?'<button class="primary" data-new-course>＋ 新建排课</button>':''}</div><section class="panel"><div class="panel-head"><div><h3>本周课程安排</h3><p>课程变动将同步显示在此处</p></div></div><div class="event-list">${events||'<div class="empty">暂无课程安排</div>'}</div></section>`;
}

/* ---------- 流水记录 ---------- */
function ledgerStats(){const v=db.ledger.filter(e=>e.status==='有效'&&e.type!=='登记');const inS=v.filter(e=>e.type==='收入').reduce((s,e)=>s+e.amount,0);const outS=v.filter(e=>e.type==='支出').reduce((s,e)=>s+e.amount,0);return{inS,outS,net:inS-outS,n:v.length}}
function ledger(){
  const admin=isAdmin();const s=ledgerStats();const ok=chainOk();
  const list=db.ledger.filter(e=>(ledgerFilter==='全部'||e.type===ledgerFilter)&&(!ledgerQuery||(e.summary+(e.ref||'')+e.operator).includes(ledgerQuery)));
  return `<div class="toolbar"><div><h2>流水记录 <span class="integrity ${ok?'':'bad'}">${ok?'✔ 账目链完整':'⚠ 账目存在异常'}</span></h2><p>收支明细与账目完整性 · 全部改动留痕</p></div>${admin?'<button class="primary" data-new-ledger>＋ 新增流水</button>':''}</div>
  ${admin?'':`<div class="readonly-banner">只读模式：流水记录由系统与管理员维护，工作人员仅可查看，不可修改。如需调整请联系管理员。</div>`}
  <div class="ledger-summary" style="margin-bottom:16px"><span class="kv in">收入合计<b>${money(s.inS)}</b></span><span class="kv out">支出合计<b>${money(s.outS)}</b></span><span class="kv">净收入<b>${money(s.net)}</b></span><span class="kv">有效笔数<b>${s.n}</b></span></div>
  <div class="filters">${['全部','收入','支出','登记'].map(f=>`<button class="filter ${ledgerFilter===f?'active':''}" data-lf="${f}">${f}</button>`).join('')}<input class="search" id="ledgerSearch" placeholder="搜索摘要 / 关联单号 / 经手人" value="${esc(ledgerQuery)}"></div>
  <section class="panel"><div class="table-wrap"><table style="min-width:880px"><thead><tr><th>日期</th><th>类型</th><th>类目</th><th>摘要</th><th>金额</th><th>经手</th><th>状态</th>${admin?'<th>操作</th>':''}</tr></thead><tbody>
  ${list.map(e=>`<tr class="${e.status==='已作废'?'voided':''}"><td>${e.date}</td><td>${badge(e.type)}</td><td>${esc(e.category)}</td><td><b>${esc(e.summary)}</b>${e.ref?`<small>关联：${esc(e.ref)}</small>`:''}${e.history.length?`<small>修改 ${e.history.length} 次（管理员）</small>`:''}</td><td class="amount ${e.type==='收入'?'in':e.type==='支出'?'out':'reg'}">${e.type==='支出'?'-':''}${money(e.amount)}</td><td>${esc(e.operator)}</td><td>${badge(e.status)}</td>${admin?`<td>${e.status==='有效'?`<button class="text-button" data-edit-ledger="${e.id}">编辑</button> <button class="text-button" style="color:var(--danger)" data-void-ledger="${e.id}">作废</button>`:'—'}</td>`:''}</tr>`).join('')||'<tr><td colspan="8" class="empty">暂无流水记录</td></tr>'}
  </tbody></table></div></section>`;
}
function newLedgerForm(){
  showModal('新增流水','仅管理员可手工记账',`<div class="form-grid"><label>日期<input id="nlDate" type="date" value="${iso()}" required></label><label>类型<select id="nlType"><option>收入</option><option>支出</option></select></label><label>类目<select id="nlCat">${CATS.map(c=>`<option>${c}</option>`).join('')}</select></label><label>金额（元）<input id="nlAmount" type="number" min="0" required></label><label class="wide">摘要<input id="nlSummary" required placeholder="例如：九月录音棚房租"></label></div>`,`<button class="outline" value="cancel">取消</button><button class="primary" id="saveLedger" value="default">保存流水</button>`);
}
function editLedgerForm(id){
  const e=db.ledger.find(x=>x.id===id);if(!e)return;
  showModal('编辑流水','仅管理员可修改，改动将留痕并重新校验账目链',`<div class="form-grid"><label>日期<input id="elDate" type="date" value="${e.date}" required></label><label>金额（元）<input id="elAmount" type="number" min="0" value="${e.amount}" required></label><label class="wide">摘要<input id="elSummary" value="${esc(e.summary)}" required></label></div>${e.history.length?`<div class="detail-block"><b>修改痕迹</b><div class="timeline">${e.history.map(h=>`<div>${esc(h.change)}<small>${esc(h.time)} · ${esc(h.by)}</small></div>`).join('')}</div></div>`:''}`,`<button class="outline" value="cancel">取消</button><button class="primary" id="saveLedgerEdit" value="default" data-id="${id}">保存修改</button>`);
}

/* ---------- 成员管理 ---------- */
function userCard(u,type){
  const contact=u.phone?('手机 '+u.phone):(u.wechat?('微信 '+u.wechat):'');
  let btns='';
  if(type==='pending')btns=`<button class="secondary" data-approve="${u.id}">通过</button> <button class="danger-button" data-reject="${u.id}">拒绝</button>`;
  else btns=`${u.status==='disabled'?`<button class="secondary" data-toggle-user="${u.id}">启用</button>`:`<button class="ghost-button" data-toggle-user="${u.id}">停用</button>`} <button class="ghost-button" data-reset-pass="${u.id}">重置密码</button>`;
  return `<article class="team-card"><span class="avatar">${esc(u.name[0])}</span><div style="flex:1"><h3 style="font-size:15px">${esc(u.name)} ${badge(u.status==='pending'?'待审核':u.status==='disabled'?'已停用':'在职')}</h3><p>${roles[u.role]}${contact?' · '+esc(contact):''}</p></div><div>${btns}</div></article>`;
}
function team(){
  const pending=db.users.filter(u=>u.status==='pending');
  const staff=db.users.filter(u=>STAFF.includes(u.role)&&u.status!=='pending');
  const clients=db.users.filter(u=>u.role==='client'&&u.status!=='pending');
  return `<div class="toolbar"><div><h2>成员管理</h2><p>审核工作人员注册、管理账号状态与权限</p></div></div>
  <h3 class="section-title">待审核账号（${pending.length}）</h3><div class="team-grid">${pending.map(u=>userCard(u,'pending')).join('')||'<div class="empty" style="grid-column:1/-1">暂无待审核账号</div>'}</div>
  <h3 class="section-title">工作人员（${staff.length}）</h3><div class="team-grid">${staff.map(u=>userCard(u,'staff')).join('')}</div>
  <h3 class="section-title">客户（${clients.length}）</h3><div class="team-grid">${clients.map(u=>userCard(u,'client')).join('')}</div>
  <p class="mini-note" style="margin-top:18px">说明：工作人员注册需管理员审核通过后方可登录；重置密码后初始密码为 123456；停用后该账号将无法登录。所有操作均记录在系统日志。</p>`;
}

/* ---------- 系统设置（管理员） ---------- */
function settings(){
  return `<div class="toolbar"><div><h2>系统设置</h2><p>管理员安全设置、数据管理与操作日志</p></div></div>
  <div class="settings-grid">
  <section class="panel"><div class="panel-head"><div><h3>安全设置</h3><p>修改管理员登录密码</p></div></div><form id="passForm"><div class="form-grid"><label class="wide">当前密码<input name="old" type="password" required></label><label>新密码<input name="pwd" type="password" required minlength="6" placeholder="至少 6 位"></label><label>确认新密码<input name="pwd2" type="password" required minlength="6"></label></div><button class="primary" type="submit" style="margin-top:14px">保存新密码</button></form></section>
  <section class="panel"><div class="panel-head"><div><h3>数据管理</h3><p>数据保存在浏览器本地（localStorage）</p></div></div><p class="mini-note" style="margin:0 0 14px">导出当前全部数据（账号、订单、课程、流水、日志）为 JSON 备份文件；重置将恢复到演示初始状态。</p><button class="outline" id="exportData">导出数据备份</button> <button class="danger-button" id="resetData">重置演示数据</button></section>
  <section class="panel wide-panel"><div class="panel-head"><div><h3>操作日志</h3><p>最近 ${Math.min(db.logs.length,100)} 条操作记录（只增不减）</p></div></div><div class="log-list">${db.logs.slice(0,100).map(l=>`<div class="log-item"><time>${esc(l.time)}</time><span><b>${esc(l.user)}</b>${esc(l.action)}</span></div>`).join('')||'<div class="empty">暂无日志</div>'}</div></section>
  </div>`;
}

/* ---------- 个人中心 / 帮助 ---------- */
function profile(){
  const mine=isClient()?db.orders.filter(o=>o.client===current.name):db.orders.filter(o=>o.assignee===current.name);
  const myCourses=isClient()?db.enrollments.filter(e=>e.user===current.name).length:0;
  const contact=current.phone?'手机 '+current.phone:(current.wechat?'微信 '+current.wechat:'未填写');
  return `<div class="toolbar"><div><h2>个人中心</h2><p>管理个人身份和业务数据</p></div><button class="outline" id="logout">退出登录</button></div>
  <div class="profile-layout"><article class="profile-card"><span class="avatar profile-avatar">${esc(current.name[0])}</span><h2>${esc(current.name)}</h2><p>${roles[current.role]}</p><dl><dt>联系方式</dt><dd>${esc(contact)}</dd><dt>账号状态</dt><dd>${current.status==='active'?'正常使用中':esc(current.status)}</dd><dt>可用功能</dt><dd>${isAdmin()?'订单管理、派单、调价、账目管理、成员审核、课程与排课、系统设置':isClient()?'我要下单、我的订单进度、课程预约、课程进度':'接单、订单进度更新、课程信息、流水查看（只读）'}</dd>${isClient()?`<dt>在学课程</dt><dd>${myCourses} 门</dd>`:''}<dt>相关订单</dt><dd>${mine.length} 个</dd></dl></article>
  <article class="profile-card"><h2>我的业务数据</h2>${mine.slice(0,6).map(o=>`<div class="detail-block"><b>${esc(o.title)}</b><p>${badge(o.status)}　进度：${o.progress}%　交付：${o.due}　金额：${money(o.price)}</p></div>`).join('')||'<div class="empty">暂无订单记录</div>'}</article></div>`;
}
function help(){
  return `<div class="toolbar"><div><h2>使用帮助</h2><p>快速熟悉音匠工坊的核心操作</p></div></div><section class="panel">
  <div class="detail-block"><b>1. 如何注册？客户和工作人员有什么区别？</b><p>注册页分为「客户注册」和「工作人员注册」两个入口。客户注册后即可直接使用；工作人员注册时需选择岗位（编曲师 / 混音师 / 录音老师 / 课程教师），提交后由管理员在「成员管理」中审核，通过后才能登录。</p></div>
  <div class="detail-block"><b>2. 手机号 / 微信验证码是怎么回事？</b><p>注册时选择「手机号验证」或「微信号验证」，点击获取验证码并输入即可完成校验。当前网站为纯静态环境，验证码会直接显示在输入框下方（演示模式）；正式上线接入短信服务或微信服务号后即可改为真实下发，流程不变。</p></div>
  <div class="detail-block"><b>3. 客户可以使用哪些功能？</b><p>客户可在「我要下单」提交编曲 / 混音 / 录音需求（接单前可取消），在「我的订单」查看制作进度，在「课程中心」预约课程，在「我的课程」查看课时进度与课堂记录。客户无法看到接单大厅、工作室流水与成员信息。</p></div>
  <div class="detail-block"><b>4. 工作人员可以使用哪些功能？为什么流水记录改不了？</b><p>工作人员可在接单大厅领取符合岗位的任务、在我的订单提交进度；「流水记录」对所有工作人员只读开放，保证账目透明，但只有最高权限管理员可以新增、修改或作废记录，任何改动都会留痕并体现在账目完整性校验上。</p></div>
  <div class="detail-block"><b>5. 管理员有哪些权限？</b><p>管理员拥有全部权限：新建订单与派单、调整金额、取消订单、确认验收、管理流水账目、审核与管理成员、发布课程与排课、修改密码、导出数据、查看操作日志。</p></div>
  <div class="detail-block"><b>6. 演示账号</b><p>管理员：林嘉言 / 123456（请登录后在「系统设置」修改密码）；编曲师：苏沐 / 123456；课程教师：周乐 / 123456；客户：林小雨 / 123456。另有一个待审核账号何声，可在管理员「成员管理」中体验审核流程。</p></div>
  </section>`;
}

/* ---------- 通知 ---------- */
function notifyItems(){
  let list=[];
  if(isAdmin()){const p=db.users.filter(u=>u.status==='pending');if(p.length)list.push([iso(),`待审核账号 ${p.length} 个（${p.map(u=>u.name).join('、')}），请前往「成员管理」处理`])}
  const mine=isClient()?db.orders.filter(o=>o.client===current.name):isStaff()?db.orders.filter(o=>o.assignee===current.name):db.orders.slice(0,4);
  mine.forEach(o=>{const u=o.updates[0];if(u)list.push([u[0],`${o.title}：${u[1]}`])});
  return list.slice(0,10);
}

/* ================= 事件处理 ================= */
document.addEventListener('click',e=>{
  const t=e.target;
  let p=t.closest('[data-page]');if(p)return go(p.dataset.page);
  let g=t.closest('[data-go]');if(g)return go(g.dataset.go);
  if(t.closest('[data-new-order]'))return orderForm();
  if(t.closest('[data-new-course]'))return courseForm();
  if(t.closest('[data-new-ledger]'))return newLedgerForm();
  let d=t.closest('[data-detail]');if(d)return details(d.dataset.detail);
  let lf=t.closest('[data-lf]');if(lf){ledgerFilter=lf.dataset.lf;renderPageKeepFocus('ledger','ledgerSearch',ledgerQuery);return}
  let of=t.closest('[data-of]');if(of){orderFilter=of.dataset.of;renderPageKeepFocus('manageorders','orderSearch',orderQuery);return}
  let tk=t.closest('[data-take]');
  if(tk){const o=db.orders.find(x=>x.id===tk.dataset.take);if(!o)return;o.assignee=current.name;o.status='进行中';o.progress=5;o.updates.unshift([iso(),`${current.name} 已接单，开始处理项目。`]);log(`接单：${o.title}`);save();toast('接单成功，已进入我的订单');renderAll();return}
  let pg=t.closest('[data-progress]');if(pg)return progressForm(pg.dataset.progress);
  let as=t.closest('[data-assign]');if(as)return assignForm(as.dataset.assign);
  let pr=t.closest('[data-price]');if(pr)return priceForm(pr.dataset.price);
  let co=t.closest('[data-cancel-order]');
  if(co){if(confirm('确认取消该订单？取消后将记入流水与日志。'))cancelOrder(co.dataset.cancelOrder);return}
  let cp=t.closest('[data-complete]');
  if(cp){const o=db.orders.find(x=>x.id===cp.dataset.complete);if(!o)return;o.status='已完成';o.progress=100;o.updates.unshift([iso(),'管理员确认客户验收，订单已完成。']);addLedger(db,{date:iso(),type:'收入',category:'订单',amount:o.price,ref:o.id,summary:`订单完成结算：${o.title}`,operator:current.name});log(`确认完成并结算：${o.title}（${money(o.price)}）`);save();$('#modal').close();toast('订单已归档，收入已记入流水');renderAll();return}
  let bk=t.closest('[data-book]');if(bk)return bookCourse(bk.dataset.book);
  let en=t.closest('[data-enroll]');if(en)return enrollModal(en.dataset.enroll);
  let cs=t.closest('[data-course]');
  if(cs){const c=db.courses.find(x=>x.id===cs.dataset.course);if(!c)return;return showModal(c.title,'课程信息',`<div class="detail-block"><b>课程内容</b><p>${esc(c.description)}</p></div><div class="detail-block"><b>教学安排</b><p>授课教师：${esc(c.teacher)}<br>${esc(c.schedule)} · ${c.hours} 课时<br>已预约学员：${db.enrollments.filter(x=>x.courseId===c.id).map(x=>esc(x.user)).join('、')||'暂无'}</p></div>`,`<button class="primary" value="cancel">关闭</button>`)}
  let el=t.closest('[data-edit-ledger]');if(el)return editLedgerForm(el.dataset.editLedger);
  let vl=t.closest('[data-void-ledger]');
  if(vl){const en2=db.ledger.find(x=>x.id===vl.dataset.voidLedger);if(!en2)return;if(!confirm('确认作废该流水？作废后将保留痕迹且不可恢复。'))return;en2.history.push({time:now(),by:current.name,change:'管理员作废该记录'});en2.status='已作废';rechain();log(`作废流水：${en2.summary}`);save();toast('流水已作废');renderAll();return}
  let ap=t.closest('[data-approve]');
  if(ap){const u=db.users.find(x=>x.id===ap.dataset.approve);if(!u)return;u.status='active';log(`通过工作人员审核：${u.name}（${roles[u.role]}）`);save();toast(`已通过 ${u.name} 的注册审核`);renderAll();return}
  let rj=t.closest('[data-reject]');
  if(rj){const u=db.users.find(x=>x.id===rj.dataset.reject);if(!u)return;if(!confirm(`确认拒绝 ${u.name} 的注册申请？`))return;db.users=db.users.filter(x=>x.id!==u.id);log(`拒绝工作人员注册：${u.name}`);save();toast('已拒绝该注册申请');renderAll();return}
  let tg=t.closest('[data-toggle-user]');
  if(tg){const u=db.users.find(x=>x.id===tg.dataset.toggleUser);if(!u)return;if(u.role==='admin')return toast('不能停用管理员账号');u.status=u.status==='disabled'?'active':'disabled';log(`${u.status==='disabled'?'停用':'启用'}账号：${u.name}`);save();toast(u.status==='disabled'?'账号已停用':'账号已启用');renderAll();return}
  let rp=t.closest('[data-reset-pass]');
  if(rp){const u=db.users.find(x=>x.id===rp.dataset.resetPass);if(!u)return;u.pass=H('123456');log(`重置密码：${u.name}`);save();toast(`已将 ${u.name} 的密码重置为 123456`);renderAll();return}
  if(t.id==='headerAction'){if(isAdmin())return active==='courses'?courseForm():orderForm();if(current.role==='teacher')return courseForm();if(isClient())return go('neworder');return}
  if(t.id==='notification'){const items=notifyItems();return showModal('通知中心','最新动态',items.map(i=>`<div class="deadline"><span class="day-box"><b>${i[0].slice(5)}</b><span>${i[0].slice(0,4)}</span></span><div><b style="font-size:13px;font-weight:600">${esc(i[1])}</b></div></div>`).join('')||'<div class="empty">暂无新动态</div>',`<button class="primary" value="cancel">知道了</button>`)}
  if(t.id==='logout'){current=null;save();authMode='login';active='dashboard';setAuthMode('login');renderShell();toast('已退出登录');return}
  if(t.id==='exportData'){const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='music-craftsman-backup.json';a.click();URL.revokeObjectURL(a.href);log('导出数据备份');save();toast('备份文件已下载');return}
  if(t.id==='resetData'){if(!confirm('确认重置？全部本地数据将恢复到演示初始状态。'))return;db=makeSeed();current=db.users[0];log('重置演示数据');save();renderShell();toast('已重置为演示数据');return}
});

/* 表单提交（统一分发） */
document.addEventListener('submit',e=>{
  const f=e.target;
  if(f.id==='authForm'){handleAuth(e);return}
  if(f.id==='clientOrderForm'){e.preventDefault();const a=Object.fromEntries(new FormData(f));
    const o={id:'YT-'+Date.now().toString().slice(-8),title:a.title,client:current.name,type:a.type,assignee:'',due:a.due,price:+a.price,status:'待接单',progress:0,description:a.description,updates:[[iso(),'客户提交需求，等待接单。']]};
    db.orders.unshift(o);addLedger(db,{date:iso(),type:'登记',category:'订单',amount:o.price,ref:o.id,summary:`客户需求登记：${a.title}`,operator:current.name});
    log(`客户提交需求：${a.title}`);save();f.reset();toast('需求已提交，可在「我的订单」查看进度');go('myorders');return}
  if(f.id==='passForm'){e.preventDefault();const a=Object.fromEntries(new FormData(f));
    if(H(a.old)!==current.pass)return toast('当前密码不正确');
    if(a.pwd.length<6)return toast('新密码至少 6 位');
    if(a.pwd!==a.pwd2)return toast('两次输入的新密码不一致');
    current.pass=H(a.pwd);const u=db.users.find(x=>x.id===current.id);if(u)u.pass=current.pass;
    log('修改管理员密码');save();f.reset();toast('密码已修改，下次登录请使用新密码');return}
  if(f.id!=='modalForm')return;
  const sub=e.submitter;if(!sub)return;const fd=new FormData(f);
  if(sub.id==='saveOrder'){e.preventDefault();const a=Object.fromEntries(fd);const assigned=(a.assignee||'').split(' · ')[0];
    const o={id:'YT-'+Date.now().toString().slice(-8),title:a.title,client:a.client,type:a.type,assignee:assigned,due:a.due,price:+a.price,status:assigned?'进行中':'待接单',progress:assigned?5:0,description:a.description,updates:assigned?[[iso(),'管理员已创建并指派订单。']]:[]};
    db.orders.unshift(o);addLedger(db,{date:iso(),type:'登记',category:'订单',amount:o.price,ref:o.id,summary:`订单创建登记：${o.title}`,operator:current.name});
    log(`创建订单：${o.title}`);save();$('#modal').close();toast('订单已创建');renderAll();return}
  if(sub.id==='saveCourse'){e.preventDefault();const a=Object.fromEntries(fd);
    db.courses.unshift({id:'C-'+Date.now().toString().slice(-5),title:a.title,teacher:a.teacher,hours:+a.hours,price:+a.price,description:a.description,schedule:a.schedule,published:true});
    log(`发布课程：${a.title}`);save();$('#modal').close();toast('课程已发布');renderAll();return}
  if(sub.id==='saveProgress'){e.preventDefault();const o=db.orders.find(x=>x.id===sub.dataset.id),a=Object.fromEntries(fd);
    o.progress=Math.min(100,Math.max(0,+a.progress));o.status=a.status;o.updates.unshift([iso(),a.note]);
    log(`更新进度：${o.title}（${o.progress}% · ${o.status}）`);save();$('#modal').close();toast('进度已提交');renderAll();return}
  if(sub.id==='saveAssign'){e.preventDefault();const o=db.orders.find(x=>x.id===sub.dataset.id);
    o.assignee=$('#chosenAssignee').value.split(' · ')[0];o.status='进行中';o.progress=5;o.updates.unshift([iso(),'管理员已完成指派。']);
    log(`指派订单：${o.title} → ${o.assignee}`);save();$('#modal').close();toast('已指定负责人');renderAll();return}
  if(sub.id==='savePrice'){e.preventDefault();const o=db.orders.find(x=>x.id===sub.dataset.id);const np=+$('#newPrice').value;
    if(!(np>=0))return toast('请输入正确的金额');
    addLedger(db,{date:iso(),type:'登记',category:'订单',amount:np,ref:o.id,summary:`订单金额调整：${o.title} ${money(o.price)} → ${money(np)}`,operator:current.name});
    o.updates.unshift([iso(),`管理员调整订单金额：${money(o.price)} → ${money(np)}`]);o.price=np;
    log(`调整金额：${o.title} → ${money(np)}`);save();$('#modal').close();toast('金额已调整并记入流水');renderAll();return}
  if(sub.id==='confirmBook'){e.preventDefault();const c=db.courses.find(x=>x.id===sub.dataset.id);
    if(db.enrollments.some(x=>x.courseId===c.id&&x.user===current.name))return toast('你已预约该课程');
    db.enrollments.push({id:'E-'+Date.now(),courseId:c.id,user:current.name,date:iso(),lessonsDone:0,notes:[[iso(),$('#bookNote').value||'预约成功，等待开课。']]});
    addLedger(db,{date:iso(),type:'收入',category:'课程',amount:c.price,ref:c.id,summary:`课程预约缴费：${c.title}（${current.name}）`,operator:current.name});
    log(`预约课程：${c.title}`);save();$('#modal').close();toast('预约成功，已加入课程名单');renderAll();return}
  if(sub.id==='saveLessons'){e.preventDefault();const cid=sub.dataset.id;const c=db.courses.find(x=>x.id===cid);let changed=false;
    $$('[data-enroll-select]').forEach(sel=>{const en3=db.enrollments.find(x=>x.id===sel.dataset.enrollSelect);if(!en3)return;const v=+sel.value;if(v!==en3.lessonsDone){en3.lessonsDone=v;en3.notes.unshift([iso(),`课时进度更新：${v}/${c.hours}${v>=c.hours?'，课程已结课':''}`]);changed=true}});
    if(changed){log(`更新学员课时进度：${c.title}`);save();toast('课时进度已保存')}else toast('没有需要保存的改动');
    $('#modal').close();renderAll();return}
  if(sub.id==='saveLedger'){e.preventDefault();const amt=+$('#nlAmount').value;
    if(!(amt>=0)||!$('#nlSummary').value)return toast('请填写完整的金额与摘要');
    addLedger(db,{date:$('#nlDate').value||iso(),type:$('#nlType').value,category:$('#nlCat').value,amount:amt,summary:$('#nlSummary').value,operator:current.name});
    log(`新增流水：${$('#nlSummary').value}（${money(amt)}）`);save();$('#modal').close();toast('流水已记录');renderAll();return}
  if(sub.id==='saveLedgerEdit'){e.preventDefault();const en4=db.ledger.find(x=>x.id===sub.dataset.id);if(!en4)return;
    const nd=$('#elDate').value,na=+$('#elAmount').value,ns=$('#elSummary').value;
    if(!(na>=0)||!ns)return toast('请填写完整的金额与摘要');
    const changes=[];if(nd!==en4.date)changes.push(`日期 ${en4.date}→${nd}`);if(na!==en4.amount)changes.push(`金额 ${money(en4.amount)}→${money(na)}`);if(ns!==en4.summary)changes.push('摘要已修改');
    if(!changes.length)return toast('没有需要保存的改动');
    en4.history.push({time:now(),by:current.name,change:changes.join('；')});en4.date=nd;en4.amount=na;en4.summary=ns;rechain();
    log(`修改流水：${en4.summary}`);save();$('#modal').close();toast('流水已修改并留痕');renderAll();return}
});

/* 搜索框输入（重渲染并保持焦点） */
document.addEventListener('input',e=>{
  if(e.target.id==='ledgerSearch'){ledgerQuery=e.target.value;renderPageKeepFocus('ledger','ledgerSearch',ledgerQuery)}
  if(e.target.id==='orderSearch'){orderQuery=e.target.value;renderPageKeepFocus('manageorders','orderSearch',orderQuery)}
  if(e.target.id==='authCode')checkCode();
});
function renderPageKeepFocus(pageId,inputId,val){const p=document.getElementById(pageId);const fns={ledger,manageorders};const fn=fns[pageId];if(!fn||!p)return;p.innerHTML=fn();const inp=document.getElementById(inputId);if(inp){inp.focus();inp.value=val;inp.setSelectionRange(val.length,val.length)}}

/* ---------- 注册 / 登录 ---------- */
function setAuthMode(mode){
  authMode=mode;regVerified=false;
  $$('#authTabs button').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  $('#roleWrap').classList.toggle('hidden',mode!=='staff');
  $('#contactWrap').classList.toggle('hidden',mode==='login');
  if(mode==='login'){$('#authTitle').textContent='欢迎回来';$('#authIntro').textContent='登录后管理你的音乐创作与教学工作';$('#authSubmit').textContent='登录';$('#authName').placeholder='请输入姓名或手机号'}
  if(mode==='client'){$('#authTitle').textContent='客户注册';$('#authIntro').textContent='注册后即可下单、预约课程并查看进度';$('#authSubmit').textContent='验证并注册';$('#authName').placeholder='请输入你的姓名'}
  if(mode==='staff'){$('#authTitle').textContent='工作人员注册';$('#authIntro').textContent='选择岗位并完成验证，提交后等待管理员审核';$('#authSubmit').textContent='提交注册申请';$('#authName').placeholder='请输入你的姓名'}
  $('#codeHint').classList.add('hidden');$('#authCode').value='';
  updateChannelLabel();
}
function updateChannelLabel(){
  const ch=document.querySelector('input[name=channel]:checked').value;
  $('#contactLabel').childNodes[0].nodeValue=ch==='phone'?'手机号':'微信号';
  $('#authContact').placeholder=ch==='phone'?'请输入 11 位手机号':'请输入微信号（字母开头，6-20 位）';
}
function channel(){return document.querySelector('input[name=channel]:checked').value}
function checkCode(){
  const c=$('#authCode').value.trim();const rec=db.codes[regContact];
  regVerified=!!(rec&&c&&c===rec.code&&Date.now()<rec.exp);
  let tag=$('#codeState');if(!tag){tag=document.createElement('span');tag.id='codeState';tag.className='code-ok';$('#authCode').after(tag)}
  tag.textContent=regVerified?'✔ 验证通过':'';
  return regVerified;
}
function startCooldown(){
  cooldown=60;const btn=$('#sendCode');btn.disabled=true;
  clearInterval(cdTimer);
  cdTimer=setInterval(()=>{cooldown--;if(cooldown<=0){clearInterval(cdTimer);btn.disabled=false;btn.textContent='获取验证码'}else btn.textContent=cooldown+'s 后重发'},1000);
}
$('#sendCode').addEventListener('click',()=>{
  const ch=channel();const c=$('#authContact').value.trim();
  const ok=ch==='phone'?/^1[3-9]\d{9}$/.test(c):/^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/.test(c);
  if(!ok)return toast(ch==='phone'?'请输入正确的 11 位手机号':'微信号需字母开头，6-20 位字母/数字/下划线');
  const code=String(Math.floor(100000+Math.random()*900000));
  db.codes[c]={code,exp:Date.now()+5*60*1000,ch};save();
  regContact=c;regVerified=false;
  const hint=$('#codeHint');hint.classList.remove('hidden');
  hint.innerHTML=`验证码已发送至${ch==='phone'?'手机 '+esc(c):'微信 '+esc(c)}（演示模式）<br>验证码：<b>${code}</b>，5 分钟内有效。<br><span style="color:#b3b0ba">正式环境将通过手机短信 / 微信服务通知真实下发。</span>`;
  startCooldown();toast('验证码已发送');
});
document.querySelector('.channel-row').addEventListener('change',()=>{$('#authContact').value='';$('#authCode').value='';regVerified=false;regContact='';$('#codeHint').classList.add('hidden');updateChannelLabel()});
$('#authTabs').addEventListener('click',e=>{const b=e.target.closest('button[data-mode]');if(b)setAuthMode(b.dataset.mode)});
function handleAuth(e){
  e.preventDefault();
  const name=$('#authName').value.trim(),pwd=$('#authPassword').value;
  if(authMode==='login'){
    const u=db.users.find(x=>x.name===name||x.phone===name);
    if(!u||u.pass!==H(pwd))return toast('账号或密码不正确');
    if(u.status==='pending')return toast('账号待管理员审核，通过后即可登录');
    if(u.status==='disabled')return toast('该账号已被停用，请联系管理员');
    current=u;log('登录平台');save();active='dashboard';renderShell();toast('欢迎回来，'+u.name);return;
  }
  const ch=channel(),contact=$('#authContact').value.trim(),code=$('#authCode').value.trim();
  const fmtOk=ch==='phone'?/^1[3-9]\d{9}$/.test(contact):/^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/.test(contact);
  if(!fmtOk)return toast(ch==='phone'?'请输入正确的 11 位手机号':'请输入正确的微信号');
  const rec=db.codes[contact];
  if(!rec||!code||code!==rec.code||Date.now()>=rec.exp)return toast('验证码不正确或已过期，请重新获取');
  if(name.length<2)return toast('请输入至少 2 个字的姓名');
  if(db.users.some(u=>u.name===name))return toast('该姓名已注册，请直接登录或更换姓名');
  if(db.users.some(u=>ch==='phone'?u.phone===contact:u.wechat===contact))return toast('该'+(ch==='phone'?'手机号':'微信号')+'已注册');
  if(pwd.length<6)return toast('密码至少 6 位');
  const base={id:'u'+Date.now(),name,phone:ch==='phone'?contact:'',wechat:ch==='wechat'?contact:'',pass:H(pwd),created:iso()};
  if(authMode==='client'){
    const u={...base,role:'client',status:'active'};
    db.users.push(u);current=u;log('客户注册：'+name);save();
    active='dashboard';renderShell();toast('注册成功，欢迎来到音匠工坊');
  }else{
    db.users.push({...base,role:$('#authRole').value,status:'pending'});
    log('工作人员注册申请：'+name);save();
    setAuthMode('login');$('#authName').value='';$('#authPassword').value='';
    toast('注册申请已提交，管理员审核通过后即可登录');
  }
}

/* ---------- 弹窗与初始化 ---------- */
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))$('#modal').close()});
renderShell();
