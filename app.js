// Virtue.exe — Ascension PWA
const initialState = {
  settings: {
    multipliers: { deep:1.0, content:1.2, stream:1.0, gym:0.8, read:0.6, college:0.4 },
    targetLevel: 20
  },
  levels: (()=>{ let cum=0, arr=[0]; for(let lvl=1; lvl<=100; lvl++){ let xp; if(lvl<=10) xp=150+35*(lvl-1); else if(lvl<=30) xp=500+50*(lvl-11); else xp=1500+75*(lvl-31); cum+=xp; arr.push(cum);} return arr; })(),
  days: {},
  achievements: {}
};

const ACHIEVES = [
  ["First 10-hour Deep Work Day", 100],
  ["7-Day Streak Completed", 250],
  ["100 TikToks Posted", 500],
  ["First Long-Form Video Published", 200],
  ["First 50-Viewer Stream", 150],
  ["30 Days No Weed / No Vape", 800],
  ["Hit 1,000 Followers", 400],
  ["Hit 10,000 Followers", 1200],
  ["Workout PR (major)", 150],
  ["Spoke on Campus Central Stage", 300],
  ["Upload 5 shorts in one day", 120],
  ["7 streams in 7 days", 220],
  ["First collab stream", 150],
  ["1,000 avg daily XP for a week", 400],
  ["Bench + Deadlift PR in same week", 180],
  ["30-day Daily Log streak", 600],
  ["100,000 total XP milestone", 800],
  ["Upload 3 long-forms in a month", 350]
];

function load(){
  const raw = localStorage.getItem('virtue_state_v2');
  if(!raw){
    const state = JSON.parse(JSON.stringify(initialState));
    ACHIEVES.forEach(a=> state.achievements[a[0]] = {name:a[0], xp:a[1], done:false, date:null});
    save(state);
    return state;
  }
  return JSON.parse(raw);
}
function save(state){ localStorage.setItem('virtue_state_v2', JSON.stringify(state)); }

let state = load();
const $ = s=>document.querySelector(s);
const $$ = s=>Array.from(document.querySelectorAll(s));

// ---- Ranks ----
function rankTitle(lvl){
  if(lvl>=80) return 'ARCHITECT OF LIGHT';
  if(lvl>=60) return 'VIRTUOUS ASCENDANT';
  if(lvl>=40) return 'MASTER';
  if(lvl>=30) return 'ADEPT';
  if(lvl>=20) return 'DISCIPLE';
  if(lvl>=10) return 'APPRENTICE';
  return 'INITIATE';
}

// ---- Boot Sequence ----
function startBoot(){
  const overlay = document.getElementById('bootOverlay');
  const consoleEl = document.getElementById('bootConsole');
  const lines = [
    '[SYSTEM ERROR] Core integrity 23%',
    'Reinitializing neural Virtue core...',
    'Recovering memory shards: GRATITUDE, DISCIPLINE, FAITH...',
    'Rebinding aura conduits...',
    '[WARNING] Residual sin artifacts detected.',
    'Stabilizing... stable.',
    '[SYSTEM REBOOT SUCCESSFUL]'
  ];
  let i=0;
  const tick = ()=>{
    if(i<lines.length){
      consoleEl.textContent += lines[i] + '\n';
      i++; setTimeout(tick, i===lines.length-1 ? 900 : 500);
    }else{
      overlay.classList.add('hideBoot');
      setTimeout(()=> overlay.style.display='none', 1300);
    }
  };
  tick();
}

// ---- Core calcs ----
function dayXP(d){
  const m = state.settings.multipliers;
  const base = (d.deep||0)*m.deep + (d.content||0)*m.content + (d.stream||0)*m.stream +
               (d.gym||0)*m.gym + (d.read||0)*m.read + (d.college||0)*m.college;
  const buff = d.buff==='Y' ? 1.1 : 1.0;
  const debuff = d.debuff==='Y' ? 0.75 : 1.0;
  const quest = (d.quests||0) * 15;
  return Math.round(base * 10 * buff * debuff + quest);
}
function totalXP(){
  let sum=0;
  Object.values(state.days).forEach(d=> sum += dayXP(d));
  Object.values(state.achievements).forEach(a=>{ if(a.done) sum += a.xp; });
  return sum;
}
function currentLevel(xp){
  const lvls = state.levels; let lvl=1;
  for(let i=1;i<lvls.length;i++){ if(xp>=lvls[i]) lvl=i; else break; }
  return lvl;
}
function xpToNext(xp){
  const lvl = currentLevel(xp);
  const next = state.levels[Math.min(lvl+1,100)];
  return Math.max(0,next-xp);
}
function weekHours(){
  const days=[...Array(7).keys()].map(i=>{const d=new Date(); d.setDate(d.getDate()-i); return d.toISOString().slice(0,10);});
  let sum=0;
  days.forEach(k=>{ const d=state.days[k]; if(d) sum += (d.deep||0)+(d.content||0)+(d.stream||0)+(d.gym||0)+(d.read||0)+(d.college||0); });
  return Math.round(sum*100)/100;
}
function bestDay(){ let max=0; Object.values(state.days).forEach(d=> max=Math.max(max, dayXP(d))); return max; }
function streak(){
  let s=0; for(let i=0;i<365;i++){const d=new Date(); d.setDate(d.getDate()-i); const k=d.toISOString().slice(0,10); const rec=state.days[k]; const xp=rec?dayXP(rec):0; if(xp>0) s++; else break;} return s;
}
function sevenDayAvgXP(){
  let sum=0; for(let i=0;i<7;i++){const d=new Date(); d.setDate(d.getDate()-i); const k=d.toISOString().slice(0,10); const rec=state.days[k]; sum += rec?dayXP(rec):0;} return Math.round(sum/7);
}

// ---- Aura Density ----
function computeAuraDensity(){
  let totalH=0, flowH=0;
  for(let i=0;i<7;i++){
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    const rec = state.days[key];
    if(rec){
      const h = (rec.deep||0)+(rec.content||0)+(rec.stream||0)+(rec.gym||0)+(rec.read||0)+(rec.college||0);
      totalH += h;
      if(rec.buff==='Y') flowH += h;
    }
  }
  if(totalH<=0) return 0;
  return Math.round((flowH/totalH)*100);
}
function renderAura(){
  const val = computeAuraDensity();
  const gauge = document.getElementById('auraGauge');
  const txt = document.getElementById('auraVal');
  const deg = Math.round(360*val/100);
  gauge.style.background = 'conic-gradient(var(--gold) ' + deg + 'deg, #1f2937 ' + deg + 'deg)';
  txt.textContent = val + '%';
}

// ---- System Log ----
function sysLog(line, cls=''){ const box=$('#sysLog'); if(!box) return; const div=document.createElement('div'); div.className='line '+cls; div.textContent=line; box.prepend(div); while(box.childNodes.length>80){ box.removeChild(box.lastChild);} }

// ---- Skills ----
function computeSkills(){
  const V = {Chastity:0, Temperance:0, Charity:0, Diligence:0, Patience:0, Kindness:0, Humility:0};
  const S = {Lust:0, Gluttony:0, Greed:0, Sloth:0, Wrath:0, Envy:0, Pride:0};
  const w = {
    deep:{Diligence:10},
    content:{Diligence:6, Charity:3, Kindness:2},
    stream:{Charity:4, Kindness:3, Humility:1},
    gym:{Temperance:8, Chastity:3},
    read:{Temperance:4, Patience:6, Humility:4},
    college:{Diligence:5, Humility:3}
  };
  Object.values(state.days).forEach(d=>{
    const hrs = {deep:d.deep||0, content:d.content||0, stream:d.stream||0, gym:d.gym||0, read:d.read||0, college:d.college||0};
    for(const key in hrs){ const val=hrs[key]; if(!val) continue; const map=w[key]; for(const v in map){ V[v] += map[v]*val; } }
    if(d.buff==='Y'){ V.Patience+=10; V.Diligence+=10; }
    if(d.debuff==='Y'){ S.Sloth+=30; S.Gluttony+=15; }
    if(d.quests){ V.Temperance += d.quests*5; V.Patience += d.quests*3; }
    if(d.resisted){ V.Chastity += d.resisted*12; V.Temperance += d.resisted*8; }
    if(d.slips){ S.Lust += d.slips*12; S.Envy += d.slips*8; S.Wrath += d.slips*10; }
    const totalH = hrs.deep+hrs.content+hrs.stream+hrs.gym+hrs.read+hrs.college;
    if(totalH<2){ S.Sloth += 20; }
  });
  Object.values(state.days).forEach(d=>{ if((d?.stream||0)>=2 && (d?.read||0)===0){ S.Pride += 10; } });
  const cap=1000;
  return {virtues:V, sins:S, balance:Object.values(V).reduce((a,b)=>a+b,0) - Object.values(S).reduce((a,b)=>a+b,0), cap};
}
function renderSkills(){
  const data = computeSkills();
  const vg = document.getElementById('virtuesGrid');
  const sg = document.getElementById('sinsGrid');
  vg.innerHTML=''; sg.innerHTML='';
  const makeRow = (name,val,cap,isSin)=>{
    const pct = Math.max(0, Math.min(1, val/cap));
    const wrap = document.createElement('div');
    wrap.className = 'skill' + (isSin?' sin':'');
    wrap.innerHTML = `<label><span>${name}</span><span>${Math.round(val)} / ${cap}</span></label>
      <div class="track"><div class="fill" style="width:${(pct*100).toFixed(1)}%"></div></div>`;
    return wrap;
  };
  Object.entries(data.virtues).forEach(([k,v])=> vg.appendChild(makeRow(k,v,data.cap,false)));
  Object.entries(data.sins).forEach(([k,v])=> sg.appendChild(makeRow(k,v,data.cap,true)));
  document.getElementById('balanceTip').textContent = 'Balance Score: ' + Math.round(data.balance);
}

// ---- UI: Tabs ----
$$('#tabs button').forEach(btn=>{
  btn.onclick = ()=>{
    $$('#tabs button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    $$('.tab').forEach(sec=>sec.classList.remove('active'));
    $('#'+tab).classList.add('active');
    if(tab==='dashboard') renderDashboard();
    if(tab==='achievements') renderAchievements();
    if(tab==='settings') renderSettings();
    if(tab==='skills') renderSkills();
    if(tab==='log'){ $('#dateInput').value = new Date().toISOString().slice(0,10); renderRecent(); }
  };
});

// ---- Renderers ----
function renderDashboard(){
  const xp = totalXP(); $('#totalXP').textContent = xp;
  const lvl = currentLevel(xp); $('#level').textContent = lvl;
  const toNext = xpToNext(xp); $('#xpToNext').textContent = toNext;
  const target = state.settings.targetLevel; const targetXP = state.levels[target];
  const pct = Math.min(1, xp/targetXP); $('#xpBar').style.width = (pct*100).toFixed(1)+'%';
  $('#weekHours').textContent = weekHours(); $('#bestDayXP').textContent = bestDay(); $('#streak').textContent = streak();
  const avg = sevenDayAvgXP();
  $('#paceHint').textContent = avg>=300 ? 'On fire. Keep going.' : 'Keep stacking wins.';
  // Ranks + Aura
  $('#rankTitle').textContent = rankTitle(lvl);
  const nextRank = rankTitle(lvl+1);
  $('#rankHint').textContent = 'Next: ' + nextRank;
  renderAura();
}
function renderRecent(){
  const cont = $('#recentDays'); cont.innerHTML='';
  const keys = Object.keys(state.days).sort().reverse().slice(0,14);
  keys.forEach(k=>{ const d = state.days[k]; const xp = dayXP(d); const div=document.createElement('div'); div.className='day'; div.innerHTML = `<strong>${k}</strong> — ${xp} XP — Notes: ${(d.notes||'')}`; cont.appendChild(div); });
}
function renderAchievements(){
  const box = $('#achieveList'); box.innerHTML='';
  Object.values(state.achievements).forEach(a=>{ const row=document.createElement('div'); row.className='stat'; row.innerHTML = `<span>${a.name} ${a.done ? '✅' : ''}</span><strong>${a.xp} XP</strong>`; box.appendChild(row); });
}
function renderSettings(){
  const m = state.settings.multipliers; const container = $('#multis'); container.innerHTML='';
  const fields = [['Deep Work','deep'],['Content','content'],['Streaming','stream'],['Gym','gym'],['Read/Meditate','read'],['College','college']];
  fields.forEach(([label, key])=>{ const wrap=document.createElement('label'); wrap.innerHTML = `${label} <input type="number" step="0.1" value="${m[key]}" data-m="${key}">`; container.appendChild(wrap); });
  $('#targetLevel').value = state.settings.targetLevel;
}

// ---- Handlers ----
$('#saveDay').onclick = ()=>{
  const xpBefore = totalXP();
  const k = $('#dateInput').value || new Date().toISOString().slice(0,10);
  state.days[k] = {
    deep: +($('#deepWork').value||0),
    content: +($('#content').value||0),
    stream: +($('#stream').value||0),
    gym: +($('#gym').value||0),
    read: +($('#read').value||0),
    college: +($('#college').value||0),
    quests: +($('#questsCount').value||0),
    resisted: +($('#resisted').value||0),
    slips: +($('#slips').value||0),
    buff: $('#buff').value,
    debuff: $('#debuff').value,
    notes: $('#notes').value.trim()
  };
  save(state);
  const xpAfter = totalXP();
  const lvlBefore = currentLevel(xpBefore);
  const lvlAfter = currentLevel(xpAfter);
  if(lvlAfter>lvlBefore){ sysLog('[ASCENSION NOTICE] LEVEL UP → ' + lvlAfter + ' (' + rankTitle(lvlAfter) + ')','warn'); }
  sysLog('[SYSTEM LOG] Saved day ' + k + ' — ' + dayXP(state.days[k]) + ' XP','good');
  renderDashboard(); renderRecent(); renderSkills();
  alert('Saved.');
};

$('#addAchieve').onclick = ()=>{
  const names = Object.keys(state.achievements);
  const pick = prompt('Type achievement name exactly as listed:\n' + names.join('\n'));
  if(!pick) return;
  const a = state.achievements[pick];
  if(!a){ alert('Not found.'); return; }
  a.done = true; a.date = new Date().toISOString().slice(0,10);
  save(state); renderAchievements(); renderDashboard();
  sysLog('[ASCENSION NOTICE] Achievement unlocked: ' + a.name + ' (+' + a.xp + ' XP)','warn');
  alert('Achievement unlocked! +' + a.xp + ' XP');
};

$('#saveSettings').onclick = ()=>{
  $$('#multis input').forEach(inp=> state.settings.multipliers[inp.dataset.m] = +inp.value);
  state.settings.targetLevel = +($('#targetLevel').value || 20);
  save(state);
  alert('Settings saved.'); renderDashboard();
};

$('#exportData').onclick = ()=>{
  const data = localStorage.getItem('virtue_state_v2') || '{}';
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='virtue_backup.json'; a.click();
  URL.revokeObjectURL(url);
};
$('#importData').onclick = ()=> $('#importFile').click();
$('#importFile').onchange = (e)=>{
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{ localStorage.setItem('virtue_state_v2', reader.result); state = load(); renderDashboard(); renderAchievements(); renderSettings(); renderRecent(); renderSkills(); alert('Imported.'); };
  reader.readAsText(file);
};
$('#resetAll').onclick = ()=>{
  if(confirm('Reset ALL data?')){
    localStorage.removeItem('virtue_state_v2'); state = load();
    renderDashboard(); renderAchievements(); renderSettings(); renderRecent(); renderSkills();
  }
};

// Init
startBoot();
renderDashboard();
renderSkills();
