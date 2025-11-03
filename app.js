// Virtue.exe PWA — offline, localStorage
const initialState = {
  settings: {
    multipliers: {
      deep: 1.0,
      content: 1.2,
      stream: 1.0,
      gym: 0.8,
      read: 0.6,
      college: 0.4
    },
    targetLevel: 20
  },
  // Early-game tuned curve (same as workbook)
  levels: (() => {
    let cum = 0, arr = [0]; // arr[i] = XP needed to reach level i (cumulative)
    for (let lvl=1; lvl<=100; lvl++){
      let xp;
      if (lvl<=10) xp = 150 + 35*(lvl-1);
      else if (lvl<=30) xp = 500 + 50*(lvl-11);
      else xp = 1500 + 75*(lvl-31);
      cum += xp;
      arr.push(cum);
    }
    return arr;
  })(),
  days: {}, // key = YYYY-MM-DD -> record
  achievements: {} // key -> {name, xp, done, date}
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
  const raw = localStorage.getItem('virtue_state_v1');
  if(!raw){
    const state = JSON.parse(JSON.stringify(initialState));
    ACHIEVES.forEach(a=> state.achievements[a[0]] = {name:a[0], xp:a[1], done:false, date:null});
    save(state);
    return state;
  }
  return JSON.parse(raw);
}
function save(state){ localStorage.setItem('virtue_state_v1', JSON.stringify(state)); }

let state = load();

// UI helpers
const $ = (s)=>document.querySelector(s);
const $$ = (s)=>Array.from(document.querySelectorAll(s));

// Tabs
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
    if(tab==='log') { $('#dateInput').value = new Date().toISOString().slice(0,10); renderRecent(); }
  };
});

// Calculations
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
  const lvls = state.levels;
  let lvl = 1;
  for(let i=1;i<lvls.length;i++){ if(xp>=lvls[i]) lvl=i; else break; }
  return lvl;
}
function xpToNext(xp){
  const lvl = currentLevel(xp);
  const next = state.levels[Math.min(lvl+1, 100)];
  return Math.max(0, next - xp);
}
function weekHours(){
  // last 7 days total productive hours
  const today = new Date().toISOString().slice(0,10);
  const days = [...Array(7).keys()].map(i=>{
    const d = new Date(); d.setDate(d.getDate()-i);
    return d.toISOString().slice(0,10);
  });
  let sum=0;
  days.forEach(k=>{
    const d = state.days[k];
    if(d) sum += (d.deep||0)+(d.content||0)+(d.stream||0)+(d.gym||0)+(d.read||0)+(d.college||0);
  });
  return Math.round(sum*100)/100;
}
function bestDay(){
  let max=0;
  Object.values(state.days).forEach(d=>{ max = Math.max(max, dayXP(d)); });
  return max;
}
function streak(){
  // count consecutive days with XP>0 ending today
  let s=0;
  for(let i=0;i<365;i++){
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    const rec = state.days[key];
    const xp = rec ? dayXP(rec) : 0;
    if(xp>0) s++; else break;
  }
  return s;
}
function sevenDayAvgXP(){
  let sum=0, c=0;
  for(let i=0;i<7;i++){
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    const rec = state.days[key];
    sum += rec ? dayXP(rec) : 0;
    c++;
  }
  return Math.round(sum/c);
}

// Renderers
function renderDashboard(){
  const xp = totalXP();
  $('#totalXP').textContent = xp;
  const lvl = currentLevel(xp);
  $('#level').textContent = lvl;
  const toNext = xpToNext(xp);
  $('#xpToNext').textContent = toNext;
  const target = state.settings.targetLevel;
  const targetXP = state.levels[target];
  const pct = Math.min(1, xp/targetXP);
  $('#xpBar').style.width = (pct*100).toFixed(1)+'%';
  $('#weekHours').textContent = weekHours();
  $('#bestDayXP').textContent = bestDay();
  $('#streak').textContent = streak();
  const avg = sevenDayAvgXP();
  $('#paceHint').textContent = avg>=300 ? 'On fire. Keep going.' : 'Keep stacking wins.';
}

function renderRecent(){
  const cont = $('#recentDays'); cont.innerHTML='';
  const keys = Object.keys(state.days).sort().reverse().slice(0,14);
  keys.forEach(k=>{
    const d = state.days[k];
    const xp = dayXP(d);
    const div = document.createElement('div'); div.className='day';
    div.innerHTML = `<strong>${k}</strong> — ${xp} XP — Notes: ${(d.notes||'')}`;
    cont.appendChild(div);
  });
}

function renderAchievements(){
  const box = $('#achieveList'); box.innerHTML='';
  Object.values(state.achievements).forEach(a=>{
    const row = document.createElement('div'); row.className='stat';
    row.innerHTML = `<span>${a.name} ${a.done ? '✅' : ''}</span><strong>${a.xp} XP</strong>`;
    box.appendChild(row);
  });
}

function renderSettings(){
  const m = state.settings.multipliers;
  const container = $('#multis'); container.innerHTML='';
  const fields = [
    ['Deep Work','deep'],['Content','content'],['Streaming','stream'],
    ['Gym','gym'],['Read/Meditate','read'],['College','college']
  ];
  fields.forEach(([label, key])=>{
    const wrap = document.createElement('label');
    wrap.innerHTML = `${label} <input type="number" step="0.1" value="${m[key]}" data-m="${key}">`;
    container.appendChild(wrap);
  });
  $('#targetLevel').value = state.settings.targetLevel;
}

// Save day
$('#saveDay').onclick = ()=>{
  const k = $('#dateInput').value || new Date().toISOString().slice(0,10);
  state.days[k] = {
    deep: +($('#deepWork').value||0),
    content: +($('#content').value||0),
    stream: +($('#stream').value||0),
    gym: +($('#gym').value||0),
    read: +($('#read').value||0),
    college: +($('#college').value||0),
    quests: +($('#questsCount').value||0),
    buff: $('#buff').value,
    debuff: $('#debuff').value,
    notes: $('#notes').value.trim()
  };
  save(state);
  renderDashboard();
  renderRecent();
  alert('Saved.');
};

// Achievements mark
$('#addAchieve').onclick = ()=>{
  const names = Object.keys(state.achievements);
  const pick = prompt('Type achievement name exactly as listed:\n' + names.join('\n'));
  if(!pick) return;
  const a = state.achievements[pick];
  if(!a){ alert('Not found.'); return; }
  a.done = true; a.date = new Date().toISOString().slice(0,10);
  save(state); renderAchievements(); renderDashboard();
  alert('Achievement unlocked! +' + a.xp + ' XP');
};

// Settings
$('#saveSettings').onclick = ()=>{
  $$('#multis input').forEach(inp=>{
    state.settings.multipliers[inp.dataset.m] = +inp.value;
  });
  state.settings.targetLevel = +$('#targetLevel').value || 20;
  save(state);
  alert('Settings saved.');
  renderDashboard();
};

// Export/Import/Reset
$('#exportData').onclick = ()=>{
  const data = localStorage.getItem('virtue_state_v1') || '{}';
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'virtue_backup.json'; a.click();
  URL.revokeObjectURL(url);
};
$('#importData').onclick = ()=> $('#importFile').click();
$('#importFile').onchange = (e)=>{
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    localStorage.setItem('virtue_state_v1', reader.result);
    state = load(); renderDashboard(); renderAchievements(); renderSettings(); renderRecent();
    alert('Imported.');
  };
  reader.readAsText(file);
};
$('#resetAll').onclick = ()=>{
  if(confirm('Reset ALL data?')){
    localStorage.removeItem('virtue_state_v1');
    state = load(); renderDashboard(); renderAchievements(); renderSettings(); renderRecent();
  }
};

// Init
renderDashboard();
