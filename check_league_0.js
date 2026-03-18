
let data = window.POUNCEY_PUBLIC_DATA || null;
function showTab(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tabbtn').forEach(b => b.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');
}
function esc(s) { return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"); }
function loadPublicFile() {
  const file=document.getElementById('publicFile').files[0];
  if(!file) { viewerStatus.textContent="Choose a file first."; return; }
  const reader=new FileReader();
  reader.onload=e=> {
    try {
      const raw=e.target.result;
      if(file.name.endsWith('.js')) {
        const match=raw.match(/window\.POUNCEY_PUBLIC_DATA\s*=\s*([\s\S]*);/);
        if(!match) throw new Error("Invalid JS format");
        data=JSON.parse(match[1]);
      } else {
        data=JSON.parse(raw);
      }
      useData();
    } catch(err) {
      viewerStatus.textContent="Could not read the selected file.";
    }
  };
  reader.readAsText(file);
}
function buildPlayerStats() {
  if((data.season||[]).length) return data.season;
  const stats = {};
  (data.roster||[]).forEach(p => stats[p.name] = {name:p.name,wins:0,losses:0,pf:0,pa:0,elo:p.elo,active:p.active});
  (data.weeks||[]).forEach(w => ["saturday","sunday"].forEach(day => (w[day]?.schedule||[]).forEach(m => {
    if(!m.completed) return;
    const [a,b,c,d] = [m.team1[0],m.team1[1],m.team2[0],m.team2[1]];
    [a,b,c,d].forEach(n => { if(!stats[n]) stats[n] = {name:n,wins:0,losses:0,pf:0,pa:0,elo:0,active:true}; });
    stats[a].pf += m.score1; stats[b].pf += m.score1; stats[c].pf += m.score2; stats[d].pf += m.score2;
    stats[a].pa += m.score2; stats[b].pa += m.score2; stats[c].pa += m.score1; stats[d].pa += m.score1;
    if(m.score1 > m.score2) { stats[a].wins++; stats[b].wins++; stats[c].losses++; stats[d].losses++; }
    else { stats[c].wins++; stats[d].wins++; stats[a].losses++; stats[b].losses++; }
  })));
  return Object.values(stats).map(s => {
    const games = s.wins + s.losses;
    return {...s, games, pct: games ? s.wins/games : 0, diff: s.pf-s.pa};
  }).sort((a,b) => b.pct-a.pct || b.diff-a.diff || a.name.localeCompare(b.name));
}

function getLiveGoogleUrl(){
  return (window.POUNCEY_PUBLIC_DATA && window.POUNCEY_PUBLIC_DATA.profile && window.POUNCEY_PUBLIC_DATA.profile.googleScriptUrl) || localStorage.getItem("pouncey_google_script_url") || "";
}
async function tryLoadLiveGoogleData(){
  const url = getLiveGoogleUrl();
  if(!url) return false;
  try{
    const res = await fetch(url + "?action=loadLeagueState&ts=" + Date.now(), {
      method:"GET",
      mode:"cors",
      cache:"no-store"
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch(e) { return false; }
    if(json && json.ok && json.data){
      data = json.data;
      if(data.profile && data.profile.googleScriptUrl){
        try {
          localStorage.setItem("pouncey_google_script_url", data.profile.googleScriptUrl);
          localStorage.setItem("pouncy_google_script_url", data.profile.googleScriptUrl);
        } catch(e) {}
      }
      return true;
    }
  }catch(e){}
  return false;
}

function useData() {
  const viewer = document.getElementById("viewerStatus");
  if(!data) {
    if(viewer) viewer.textContent = "No league data found yet. Make sure Google Sheets sync is configured or the shared data file is updated.";
    return;
  }
  if(viewer) viewer.textContent = getLiveGoogleUrl() ? "Live Google Sheets data loaded." : "Public data loaded successfully.";

  const weekOptions = (data.weeks || []).map(w=>`<option value="${w.week}">Week ${w.week}</option>`).join('');
  const weekEl = document.getElementById("weekSel");
  if(weekEl) weekEl.innerHTML = weekOptions;

  renderOverview();
  renderSchedule();
  renderRankings();
  renderHistory();
  renderPlayers();
  renderPlayoffs();
  renderHallOfFame();
}


function getCurrentActiveWeek(){
  const weeks = data.weeks || [];
  if(!weeks.length) return null;
  const cur = data.profile && data.profile.currentSignupWeek ? String(data.profile.currentSignupWeek) : "";
  if(cur){
    const explicit = weeks.find(w => String(w.week) === cur);
    if(explicit) return explicit;
  }
  for(let i=weeks.length-1;i>=0;i--){
    const w = weeks[i];
    if((w.saturday && w.saturday.active) || (w.sunday && w.sunday.active)) return w;
  }
  return weeks[weeks.length-1] || null;
}
function getAvailabilityNames(weekNum, dayKey){
  const key = `W${weekNum}_${dayKey}`;
  const avail = (data.availability || {})[key];
  return Array.isArray(avail) ? avail : [];
}
function signupDayMarkup(weekNum, dayKey, label){
  const week = (data.weeks || []).find(w => Number(w.week) === Number(weekNum));
  const active = !!(week && week[dayKey] && week[dayKey].active);
  if(!active){
    return "";
  }
  const schedule = (week && week[dayKey] && Array.isArray(week[dayKey].schedule)) ? week[dayKey].schedule : [];
  const hasSchedule = schedule.length > 0;
  const hasCompleted = schedule.some(m => !!m.completed);
  if(hasCompleted){
    return "";
  }
  if(hasSchedule){
    return "";
  }
  const names = ((data.roster || []).filter(p => p.active !== false).map(p => p.name)).sort((a,b)=>a.localeCompare(b));
  const selected = new Set(getAvailabilityNames(weekNum, dayKey));
  return `<div class="player-card">
    <strong>Week ${weekNum} • ${label}</strong>
    <div class="small" style="margin-top:8px">Select players who are signing up for this day.</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-top:10px">
      ${names.map(name => `<label style="display:flex;align-items:center;gap:8px;border:1px solid #e5e7eb;border-radius:12px;padding:10px 12px;background:#fff"><input type="checkbox" data-signup="${dayKey}" value="${esc(name)}" ${selected.has(name) ? "checked" : ""}> <span>${esc(name)}</span></label>`).join('')}
    </div>
    <div style="margin-top:12px">
      <button onclick="saveWeekSignup(${weekNum}, '${dayKey}')">Save ${label} Sign-Up</button>
      <div class="small" id="signupMsg_${weekNum}_${dayKey}" style="margin-top:8px"></div>
    </div>
  </div>`;
}
async function saveWeekSignup(weekNum, dayKey){
  const msgEl = document.getElementById(`signupMsg_${weekNum}_${dayKey}`);
  const selected = [...document.querySelectorAll(`input[data-signup="${dayKey}"]:checked`)].map(x => x.value);
  if(msgEl) msgEl.textContent = "Saving...";
  try{
    const url = getLiveGoogleUrl();
    if(!url) throw new Error("Google Sheets live URL is not configured.");

    let json = null;
    const query = new URLSearchParams({
      action: "updateWeekSignup",
      week: String(Number(weekNum)),
      day: String(dayKey),
      players: selected.join("|")
    });

    try{
      const res = await fetch(url + "?" + query.toString(), {method:"GET", mode:"cors"});
      json = await res.json();
    }catch(e){
      json = null;
    }

    if(!json || !json.ok){
      const res2 = await fetch(url, {
        method:"POST",
        headers: {"Content-Type": "text/plain;charset=utf-8"},
        body: JSON.stringify({action:"updateWeekSignup", payload:{week:Number(weekNum), day:String(dayKey), players:selected}}),
        mode:"cors"
      });
      json = await res2.json();
    }

    if(!json.ok) throw new Error(json.error || "Unable to save sign-up.");
    if(json.data) data = json.data;
    if(msgEl) msgEl.textContent = `Saved ${selected.length} players for ${dayKey}.`;
    renderOverview(); renderSchedule(); renderLeaderboard(); renderHistory(); renderPlayers(); renderPlayoffs(); renderHallOfFame();
  }catch(err){
    if(msgEl) msgEl.textContent = err.message || "Unable to save sign-up. Replace Code.gs and redeploy Apps Script.";
  }
}
function renderSignup(){
  const week = getCurrentActiveWeek();
  if(!week){
    signupBox.innerHTML = "No active week found yet.";
    return;
  }
  const saturdayMarkup = signupDayMarkup(week.week, 'saturday', 'Saturday');
  const sundayMarkup = signupDayMarkup(week.week, 'sunday', 'Sunday');
  if(!saturdayMarkup && !sundayMarkup){
    signupBox.innerHTML = "Sign-up is closed for the active week because matches were already generated or completed.";
    return;
  }
  signupBox.innerHTML = `
    <div class="players-grid">
      ${saturdayMarkup}
      ${sundayMarkup}
    </div>
  `;
}


function getWeeklyRankingRows(){
  const weeks = data.weeks || [];
  if(!weeks.length) return [];
  const cur = data.profile && data.profile.currentSignupWeek ? String(data.profile.currentSignupWeek) : "";
  let targetWeek = cur ? weeks.find(w => String(w.week) === cur) : null;
  if(!targetWeek){
    targetWeek = weeks.find(w => ((w.saturday && w.saturday.active) || (w.sunday && w.sunday.active))) || weeks[weeks.length - 1];
  }
  if(!targetWeek) return [];
  const stats = {};
  ["saturday","sunday"].forEach(dayKey => {
    const matches = (targetWeek[dayKey] && Array.isArray(targetWeek[dayKey].schedule)) ? targetWeek[dayKey].schedule : [];
    matches.filter(m => m.completed).forEach(m => {
      const t1 = m.team1 || [], t2 = m.team2 || [];
      const s1 = Number(m.score1 || 0), s2 = Number(m.score2 || 0);
      [...t1, ...t2].forEach(name => {
        if(!stats[name]) stats[name] = {name, wins:0, losses:0, pf:0, pa:0};
      });
      t1.forEach(name => { stats[name].pf += s1; stats[name].pa += s2; if(s1 > s2) stats[name].wins += 1; else stats[name].losses += 1; });
      t2.forEach(name => { stats[name].pf += s2; stats[name].pa += s1; if(s2 > s1) stats[name].wins += 1; else stats[name].losses += 1; });
    });
  });
  return Object.values(stats)
    .map(r => ({...r, diff:r.pf-r.pa, games:r.wins+r.losses, pct:(r.wins+r.losses)?(r.wins/(r.wins+r.losses)):0, week:targetWeek.week}))
    .sort((a,b) => b.pct-a.pct || b.diff-a.diff || b.pf-a.pf || a.name.localeCompare(b.name));
}
function renderWeeklyRanking(){
  const rows = getWeeklyRankingRows();
  if(!rows.length){
    weeklyRankingBox.innerHTML = "No weekly ranking available yet.";
    return;
  }
  const weekNum = rows[0].week;
  weeklyRankingBox.innerHTML = `<div class="small" style="margin-bottom:10px">Week ${weekNum} ranking based on completed matches for the selected/current week.</div>` +
    `<div class="table-wrap"><table><thead><tr><th>Rank</th><th>Player</th><th>W-L</th><th>Point Diff</th></tr></thead><tbody>${
      rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${r.wins}-${r.losses}</td><td>${r.diff}</td></tr>`).join('')
    }</tbody></table></div>`;
}


function weeklyStatsPublic(weekNum, dayMode){
  const week = (data.weeks || []).find(w => Number(w.week) === Number(weekNum));
  if(!week) return [];
  const totals = {};
  ["saturday","sunday"].forEach(dayKey => {
    if(dayMode !== "ALL" && dayKey !== String(dayMode || "").toLowerCase()) return;
    const sched = (week[dayKey] && Array.isArray(week[dayKey].schedule)) ? week[dayKey].schedule : [];
    sched.forEach(m => {
      if(!m.completed) return;
      const [a,b,c,d] = [m.team1[0], m.team1[1], m.team2[0], m.team2[1]];
      [a,b,c,d].forEach(n => { if(!totals[n]) totals[n] = {name:n,wins:0,losses:0,pf:0,pa:0}; });
      totals[a].pf += Number(m.score1 || 0); totals[a].pa += Number(m.score2 || 0);
      totals[b].pf += Number(m.score1 || 0); totals[b].pa += Number(m.score2 || 0);
      totals[c].pf += Number(m.score2 || 0); totals[c].pa += Number(m.score1 || 0);
      totals[d].pf += Number(m.score2 || 0); totals[d].pa += Number(m.score1 || 0);
      if(Number(m.score1 || 0) > Number(m.score2 || 0)){ totals[a].wins++; totals[b].wins++; totals[c].losses++; totals[d].losses++; }
      else { totals[c].wins++; totals[d].wins++; totals[a].losses++; totals[b].losses++; }
    });
  });
  return Object.values(totals)
    .map(r => ({...r, diff:r.pf-r.pa, games:r.wins+r.losses, pct:(r.wins+r.losses)?r.wins/(r.wins+r.losses):0}))
    .sort((a,b) => b.pct-a.pct || b.diff-a.diff || b.pf-a.pf || a.name.localeCompare(b.name));
}
function renderWeeklyRankingTab(){
  const weekNum = Number((document.getElementById("rankWeek")||{}).value || 0);
  const dayMode = (document.getElementById("rankDay")||{}).value || "ALL";
  const box = document.getElementById("weeklyRankingBox");
  if(!box) return;
  const rows = weeklyStatsPublic(weekNum, dayMode);
  if(!rows.length){
    box.innerHTML = '<div class="small">No completed matches yet for this week/day.</div>';
    return;
  }
  box.innerHTML = `<div class="table-wrap"><table><thead><tr><th>#</th><th>Player</th><th>W</th><th>L</th><th>Win %</th><th>Diff</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${r.wins}</td><td>${r.losses}</td><td>${(r.pct*100).toFixed(1)}%</td><td>${r.diff}</td></tr>`).join('')}</tbody></table></div>`;
}
function renderRankings(){
  const rankWeekEl = document.getElementById("rankWeek");
  if(rankWeekEl){
    rankWeekEl.innerHTML = (data.weeks || []).map(w=>`<option value="${w.week}">Week ${w.week}</option>`).join('');
    const cur = data.profile && data.profile.currentSignupWeek ? String(data.profile.currentSignupWeek) : "";
    if(cur) rankWeekEl.value = cur;
    else if((data.weeks||[]).length) rankWeekEl.value = String(data.weeks[data.weeks.length-1].week);
  }
  renderWeeklyRankingTab();
  renderLeaderboard();
}

function renderChampionshipCenter() {
  const p = data.playoffs || {};
  const champ = p.champion || '';
  const fmt = Number(p.format || data.profile?.playoffFormat || 12);
  let stage = 'Regular Season';
  if (p.playIn && !p.champion) stage = 'Playoffs In Progress';
  if (champ) stage = 'Champion Decided';

  const finalistA = p.final?.f1?.a || '';
  const finalistB = p.final?.f1?.b || '';
  const finalWinner = p.final?.f1?.winner || '';
  championshipCenterBox.innerHTML = `
    <div class="hero-banner">
      <div class="small">League status</div>
      <div class="champ-name">${champ ? esc(champ) : 'No champion yet'}</div>
      <div class="small" style="margin-top:8px">Stage: ${stage}</div>
      <div style="margin-top:12px">
        ${champ ? `<span class="pill">Champion: ${esc(champ)}</span>` : `<span class="pill">Champion TBD</span>`}
        <span class="pill">Playoff Format: Top ${fmt}</span>
        ${finalistA || finalistB ? `<span class="pill">Final: ${esc(finalistA || 'TBD')} vs ${esc(finalistB || 'TBD')}</span>` : ''}
        ${finalWinner ? `<span class="pill">Final Winner: ${esc(finalWinner)}</span>` : ''}
      </div>
    </div>
  `;
}
function renderLatestResultsWidget() {
  const matches = [];
  (data.weeks||[]).forEach(w => ['saturday','sunday'].forEach(day => (w[day]?.schedule||[]).forEach(m => {
    if(m.completed) matches.push({week:w.week, day, round:m.round, court:m.court, ...m});
  })));
  const latest = matches.slice(-5).reverse();
  latestResultsBox.innerHTML = latest.length ? `<div class="widget-list">${latest.map(m => `
    <div class="widget-item">
      <div class="small">Week ${m.week} • ${m.day[0].toUpperCase()+m.day.slice(1)} • Round ${m.round} • Court ${m.court}</div>
      <div style="margin-top:6px"><strong>${esc(m.team1[0])} & ${esc(m.team1[1])}</strong> vs <strong>${esc(m.team2[0])} & ${esc(m.team2[1])}</strong></div>
      <div class="small" style="margin-top:6px">Result: ${m.score1}-${m.score2}</div>
    </div>`).join('')}</div>` : 'No recent results yet.';
}


function isValidPickleballScore(score1, score2){
  const a = Number(score1), b = Number(score2);
  if(!Number.isFinite(a) || !Number.isFinite(b)) return {ok:false, message:"Enter numeric scores."};
  if(a < 0 || b < 0) return {ok:false, message:"Scores cannot be negative."};
  if(a === b) return {ok:false, message:"Scores cannot be tied."};
  const hi = Math.max(a,b), lo = Math.min(a,b), diff = hi - lo;
  if(hi < 11) return {ok:false, message:"Winner must have at least 11 points."};
  if(hi === 11){
    if(diff < 2) return {ok:false, message:"11-point wins must be by at least 2."};
    if(lo > 9) return {ok:false, message:"11-point wins must end 11-0 through 11-9."};
    return {ok:true};
  }
  if(hi > 11){
    if(lo < 10) return {ok:false, message:"Extended games happen only after 10-10."};
    if(diff !== 2) return {ok:false, message:"Extended games must be won by exactly 2."};
    return {ok:true};
  }
  return {ok:false, message:"Invalid score."};
}
async function updateMatchScoreOnGoogle(week, dayKey, round, court, score1, score2){
  const url = getLiveGoogleUrl();
  if(!url) throw new Error("Google Sheets live URL is not configured.");
  const res = await fetch(url, {
    method:"POST",
    headers: {"Content-Type": "text/plain;charset=utf-8"},
    body: JSON.stringify({
      action:"updateMatchScore",
      payload:{week:Number(week), day:String(dayKey), round:Number(round), court:Number(court), score1:Number(score1), score2:Number(score2)}
    }),
    mode:"cors"
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch(e){ throw new Error("Unexpected response while saving score."); }
  if(!json.ok) throw new Error(json.error || "Unable to save score.");
  if(json.data) data = json.data;
  return json;
}
function scoreEditorMarkup(m){
  const disabled = m.completed ? "disabled" : "";
  return `<div class="match-card">
    <div class="match-head"><strong>Week ${m.week} • ${m.day[0].toUpperCase()+m.day.slice(1)}</strong><span class="small">Round ${m.round} • Court ${m.court}</span></div>
    <div class="team-row"><div class="team-name">${esc(m.team1[0])} & ${esc(m.team1[1])}</div><div class="team-score">${m.completed ? m.score1 : `<input type="number" min="0" inputmode="numeric" id="s1_${m.week}_${m.day}_${m.round}_${m.court}" style="width:78px;padding:8px;border:1px solid #ccd7e5;border-radius:12px" placeholder="0">`}</div></div>
    <div class="team-row"><div class="team-name">${esc(m.team2[0])} & ${esc(m.team2[1])}</div><div class="team-score">${m.completed ? m.score2 : `<input type="number" min="0" inputmode="numeric" id="s2_${m.week}_${m.day}_${m.round}_${m.court}" style="width:78px;padding:8px;border:1px solid #ccd7e5;border-radius:12px" placeholder="0">`}</div></div>
    ${m.completed ? `<div class="small" style="margin-top:10px">Completed result is locked.</div>` : `<div style="margin-top:12px"><button onclick="savePublicScore(${m.week}, '${m.day}', ${m.round}, ${m.court})">Save Score</button><div class="small" id="msg_${m.week}_${m.day}_${m.round}_${m.court}" style="margin-top:8px"></div></div>`}
  </div>`;
}
async function saveScheduleScore(week, dayKey, round, court){
  const s1el = document.getElementById(`sched1_${week}_${dayKey}_${round}_${court}`);
  const s2el = document.getElementById(`sched2_${week}_${dayKey}_${round}_${court}`);
  const msgEl = document.getElementById(`schedmsg_${week}_${dayKey}_${round}_${court}`);
  const s1 = Number(s1el?.value), s2 = Number(s2el?.value);
  const check = isValidPickleballScore(s1, s2);
  if(!check.ok){ if(msgEl) msgEl.textContent = check.message; return; }
  if(msgEl) msgEl.textContent = "Saving...";
  try{
    await updateMatchScoreOnGoogle(week, dayKey, round, court, s1, s2);
    if(msgEl) msgEl.textContent = "Score saved.";
    renderOverview(); renderSchedule(); renderLeaderboard(); renderHistory(); renderPlayers(); renderPlayoffs(); renderHallOfFame();
  }catch(err){
    if(msgEl) msgEl.textContent = err.message;
  }
}
async function savePublicScore(week, dayKey, round, court){
  const s1el = document.getElementById(`s1_${week}_${dayKey}_${round}_${court}`);
  const s2el = document.getElementById(`s2_${week}_${dayKey}_${round}_${court}`);
  const msgEl = document.getElementById(`msg_${week}_${dayKey}_${round}_${court}`);
  const s1 = Number(s1el?.value), s2 = Number(s2el?.value);
  const check = isValidPickleballScore(s1, s2);
  if(!check.ok){
    if(msgEl) msgEl.textContent = check.message;
    return;
  }
  if(msgEl) msgEl.textContent = "Saving...";
  try{
    await updateMatchScoreOnGoogle(week, dayKey, round, court, s1, s2);
    if(msgEl) msgEl.textContent = "Score saved.";
    renderOverview(); renderSchedule(); renderLeaderboard(); renderHistory(); renderPlayers(); renderPlayoffs(); renderHallOfFame();
  }catch(err){
    if(msgEl) msgEl.textContent = err.message;
  }
}

function renderOverview() {
  if(!data) return;
  renderChampionshipCenter();
  renderLatestResultsWidget();
  renderSignup();
  const activePlayers=(data.roster||[]).filter(p=>p.active!==false).length;
  const totalPlayers=(data.roster||[]).length;
  const weeks=(data.weeks||[]).length;
  const scored=(data.weeks||[]).reduce((n,w)=>n+(w.saturday.schedule||[]).filter(m=>m.completed).length+(w.sunday.schedule||[]).filter(m=>m.completed).length,0);
  statsGrid.innerHTML = `
    <div class="stat"><div class="label">Active Players</div><div class="value">${activePlayers}</div></div>
    <div class="stat"><div class="label">Total Players</div><div class="value">${totalPlayers}</div></div>
    <div class="stat"><div class="label">Weeks</div><div class="value">${weeks}</div></div>
    <div class="stat"><div class="label">Scored Matches</div><div class="value">${scored}</div></div>
  `;
  overviewBox.innerHTML=`<span class="pill">${esc(data.profile.leagueTitle)}</span><span class="pill">${weeks} weeks</span><span class="pill">${scored} scored matches</span><div style="margin-top:10px"><strong>Subtitle:</strong> ${esc(data.profile.leagueSubtitle || '')}</div>`;

  const top = (data.season||[]).slice(0,3);
  topThreeBox.innerHTML = top.length ? top.map((r,i)=>`<div class="rank-card rank-${i+1}"><div class="rank-num">${i+1}</div><strong>${esc(r.name)}</strong><div class="small" style="margin-top:8px">${r.wins}-${r.losses} • ${(r.pct*100).toFixed(1)}% • Diff ${r.diff}</div></div>`).join('') : '<div class="small">No leaderboard data yet.</div>';

  const allWeeks = data.weeks || [];
  const currentWeekObj = [...allWeeks].reverse().find(w => (((w.saturday?.schedule || []).length + (w.sunday?.schedule || []).length) > 0)) || allWeeks[allWeeks.length - 1];
  const featured = [];
  if (currentWeekObj) {
    ["saturday","sunday"].forEach(day => {
      (currentWeekObj[day]?.schedule || [])
        .filter(m => !m.completed)
        .forEach(m => featured.push({week: currentWeekObj.week, day: day, ...m}));
    });
  }
  const satCount = currentWeekObj ? (currentWeekObj.saturday?.schedule || []).length : 0;
  const sunCount = currentWeekObj ? (currentWeekObj.sunday?.schedule || []).length : 0;
  const completedCount = currentWeekObj
    ? ((currentWeekObj.saturday?.schedule || []).filter(m=>m.completed).length + (currentWeekObj.sunday?.schedule || []).filter(m=>m.completed).length)
    : 0;
  weekendSummaryBox.innerHTML = currentWeekObj
    ? `<span class="pill">Week ${currentWeekObj.week}</span><span class="pill">${satCount} Saturday matches</span><span class="pill">${sunCount} Sunday matches</span><span class="pill">${completedCount} completed</span><div style="margin-top:10px"><strong>Weekend view:</strong> This combines Saturday and Sunday for the latest active week. Leaderboard uses win percentage, and playoffs use a minimum matches threshold to keep things fair with lighter admin effort.</div>`
    : 'No weekend summary yet.';

  featuredMatchesBox.innerHTML = featured.length
    ? featured.map(m=>scoreEditorMarkup(m)).join('')
    : 'No current matches waiting for scores.';
}
function renderSchedule() {
  if(!data) return;
  const weekNum=Number(weekSel.value || data.weeks?.[0]?.week || 1), day=(daySel.value || 'Saturday').toLowerCase();
  const week=(data.weeks||[]).find(w=>w.week===weekNum), rows=week?.[day]?.schedule || [];
  if(!rows.length) { scheduleBox.innerHTML='<div class="status">No schedule found for this selection.</div>'; return; }
  const latestWeekNum = (data.weeks && data.weeks.length) ? data.weeks[data.weeks.length-1].week : weekNum;
  const editable = weekNum === latestWeekNum;
  scheduleBox.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Round</th><th>Court</th><th>Team 1</th><th>Team 2</th><th>Status</th></tr></thead><tbody>${rows.map(m=>{
    const editor = (!m.completed && editable)
      ? `<div><input type="number" min="0" inputmode="numeric" id="sched1_${weekNum}_${day}_${m.round}_${m.court}" style="width:64px;padding:6px;border:1px solid #ccd7e5;border-radius:10px" placeholder="0"> <input type="number" min="0" inputmode="numeric" id="sched2_${weekNum}_${day}_${m.round}_${m.court}" style="width:64px;padding:6px;border:1px solid #ccd7e5;border-radius:10px" placeholder="0"> <button style="padding:8px 10px;min-height:auto" onclick="saveScheduleScore(${weekNum}, '${day}', ${m.round}, ${m.court})">Save</button><div class="small" id="schedmsg_${weekNum}_${day}_${m.round}_${m.court}" style="margin-top:4px"></div></div>`
      : (m.completed ? `${m.score1}-${m.score2}` : 'Pending');
    return `<tr><td>${m.round}</td><td>${m.court}</td><td>${esc(m.team1[0])} & ${esc(m.team1[1])}</td><td>${esc(m.team2[0])} & ${esc(m.team2[1])}</td><td>${editor}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}
function renderLeaderboard() {
  if(!data) return;
  const rows = data.season || [];
  const box = document.getElementById("seasonRankingBox");
  if(!box) return;
  if(!rows.length) { box.innerHTML = '<div class="status">No leaderboard yet.</div>'; return; }
  box.innerHTML = `<div class="table-wrap"><table><thead><tr><th>#</th><th>Player</th><th>W</th><th>L</th><th>Win %</th><th>Diff</th><th>Rating</th><th>Active</th><th>Playoff Eligible</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${r.wins}</td><td>${r.losses}</td><td>${(r.pct*100).toFixed(1)}%</td><td>${r.diff}</td><td>${Number(r.elo||0).toFixed(1)}</td><td>${r.active===false ? 'No' : 'Yes'}</td><td>${r.playoffEligible ? 'Yes' : 'No'}</td></tr>`).join('')}</tbody></table></div>`;
}
function renderHistory() {
  if(!data || !data.weeks) return;
  let html='<div class="table-wrap"><table><thead><tr><th>Week</th><th>Completed Matches</th><th>Top 3 Snapshot</th></tr></thead><tbody>';
  const playerStats = buildPlayerStats();
  data.weeks.forEach(w=> {
    const cnt=(w.saturday.schedule||[]).filter(m=>m.completed).length + (w.sunday.schedule||[]).filter(m=>m.completed).length;
    const snap = cnt ? playerStats.slice(0,3).map((p,i)=>`${i+1}. ${esc(p.name)}`).join('<br>') : 'No results';
    html += `<tr><td>Week ${w.week}</td><td>${cnt}</td><td>${snap}</td></tr>`;
  });
  html += '</tbody></table></div>';
  historyBox.innerHTML = html;
}

function buildPlayerDeepStats(){
  const base = {};
  (data.roster || []).forEach(p => {
    base[p.name] = {
      name:p.name, rating:Number(p.rating || 0), elo:Number(p.elo || 0), wins:0, losses:0, ties:0,
      sessions:new Set(), lastPlayedWeek:0, lastPlayedDay:"", bestWeekSessions:0, weekSessionCounts:{},
      pf:0, pa:0
    };
  });
  (data.weeks || []).forEach(w => {
    ["saturday","sunday"].forEach(dayKey => {
      const rows = (w[dayKey] && Array.isArray(w[dayKey].schedule)) ? w[dayKey].schedule : [];
      rows.forEach(m => {
        if(!m.completed) return;
        const players = [...(m.team1 || []), ...(m.team2 || [])];
        players.forEach(name => {
          if(!base[name]) base[name] = {name, rating:0, elo:0, wins:0, losses:0, ties:0, sessions:new Set(), lastPlayedWeek:0, lastPlayedDay:"", bestWeekSessions:0, weekSessionCounts:{}, pf:0, pa:0};
          base[name].sessions.add(`W${w.week}-${dayKey}`);
          base[name].lastPlayedWeek = Math.max(base[name].lastPlayedWeek, Number(w.week || 0));
          if(base[name].lastPlayedWeek === Number(w.week || 0)) base[name].lastPlayedDay = dayKey;
          base[name].weekSessionCounts[w.week] = (base[name].weekSessionCounts[w.week] || 0) + 1;
          base[name].bestWeekSessions = Math.max(base[name].bestWeekSessions, base[name].weekSessionCounts[w.week]);
        });
        const s1 = Number(m.score1 || 0), s2 = Number(m.score2 || 0);
        (m.team1 || []).forEach(name => {
          base[name].pf += s1; base[name].pa += s2;
          if(s1 > s2) base[name].wins++; else if(s2 > s1) base[name].losses++; else base[name].ties++;
        });
        (m.team2 || []).forEach(name => {
          base[name].pf += s2; base[name].pa += s1;
          if(s2 > s1) base[name].wins++; else if(s1 > s2) base[name].losses++; else base[name].ties++;
        });
      });
    });
  });
  const totalWeeks = Math.max(1, (data.weeks || []).length);
  return Object.values(base).map(p => {
    const totalSessions = p.sessions.size;
    const freq = totalSessions / totalWeeks;
    const diff = p.pf - p.pa;
    const pct = (p.wins + p.losses) ? p.wins / (p.wins + p.losses) : 0;
    return {...p, totalSessions, freq, diff, pct};
  }).sort((a,b) => b.elo - a.elo || b.pct - a.pct || a.name.localeCompare(b.name));
}

function renderPlayers() {
  if(!data) return;
  const stats = buildPlayerDeepStats();
  playersBox.innerHTML = stats.length ? stats.map(p => {
    return `
      <div class="player-profile-card">
        <div class="player-profile-hero">
          <div class="player-profile-name">${esc(p.name)}</div>
          <div class="player-profile-rating">🏆 ${(p.elo ? p.elo/100 : p.rating).toFixed(2)} Rating</div>
        </div>
        <div class="player-profile-sections">
          <div class="player-subtitle">Activity</div>
          <div class="player-mini-grid">
            <div class="player-mini-card">
              <div class="player-mini-label">Last Played</div>
              <div class="player-mini-value">${p.lastPlayedWeek ? `Week ${p.lastPlayedWeek}${p.lastPlayedDay ? " • " + p.lastPlayedDay[0].toUpperCase() + p.lastPlayedDay.slice(1) : ""}` : "No matches yet"}</div>
            </div>
            <div class="player-mini-card">
              <div class="player-mini-label">Played</div>
              <div class="player-mini-value">${p.totalSessions} sessions</div>
            </div>
            <div class="player-mini-card">
              <div class="player-mini-label">Frequency</div>
              <div class="player-mini-value">${p.freq.toFixed(1)} per week</div>
            </div>
            <div class="player-mini-card">
              <div class="player-mini-label">Best Week</div>
              <div class="player-mini-value">${p.bestWeekSessions} session${p.bestWeekSessions === 1 ? "" : "s"}</div>
            </div>
          </div>
          <div class="player-subtitle">Record</div>
          <div class="player-record-grid">
            <div class="player-record-box win">
              <div class="player-mini-label">W</div>
              <div class="player-record-value">${p.wins}</div>
            </div>
            <div class="player-record-box loss">
              <div class="player-mini-label">L</div>
              <div class="player-record-value">${p.losses}</div>
            </div>
            <div class="player-record-box tie">
              <div class="player-mini-label">Diff</div>
              <div class="player-record-value">${p.diff}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('') : '<div class="small">No player data yet.</div>';
}

function renderPlayoffs() {
  const p = data.playoffs || {};
  const rows = (data.season || []);
  const fmt = Number(data.profile?.playoffFormat || p.format || 12);
  const headerTitle = `Top ${fmt} Playoff View`;
  const headerSubtitle = fmt === 4
    ? 'Seeds 1–4 advance directly to the semifinals.'
    : fmt === 8
      ? 'Seeds 1–8 advance to the quarterfinals.'
      : 'Seeds 1–4 receive byes. Seeds 5–12 play in.';
  const titleEl = document.getElementById("playoffHeaderTitle");
  const subEl = document.getElementById("playoffHeaderSubtitle");
  if(titleEl) titleEl.textContent = headerTitle;
  if(subEl) subEl.textContent = headerSubtitle + ' This view is generated automatically from the current season leaderboard.';

  const show = m => `${esc(m.a || 'TBD')} vs ${esc(m.b || 'TBD')}${m.winner ? `<br><strong>Winner: ${esc(m.winner)}</strong>` : ''}`;

  if(fmt === 4){
    if(p.semifinals && p.final){
      playoffBox.innerHTML = `<div class="bracket-card"><h3>Semifinals</h3><div class="small" style="margin-top:10px">${show(p.semifinals.s1)}<br><br>${show(p.semifinals.s2)}</div></div><div class="bracket-card"><h3>Final</h3><div class="small" style="margin-top:10px">${show(p.final.f1)}<br><br><strong>Champion</strong><br>${esc(p.champion || 'TBD')}</div></div>`;
      return;
    }
    const bracketRows = rows.filter(r=>r.playoffEligible).slice(0,4).length >= 4 ? rows.filter(r=>r.playoffEligible).slice(0,4) : rows.slice(0,4);
    if(bracketRows.length < 4){ playoffBox.innerHTML = `<div class="status">Top 4 playoff view will appear once at least 4 players have season rankings.</div>`; return; }
    const seed = i => bracketRows[i-1] ? `${i}. ${esc(bracketRows[i-1].name)}` : `Seed ${i} TBD`;
    playoffBox.innerHTML = `<div class="bracket-card"><h3>Semifinals</h3><div class="small" style="margin-top:10px">${seed(1)} vs ${seed(4)}<br><br>${seed(2)} vs ${seed(3)}</div></div><div class="bracket-card"><h3>Final</h3><div class="small" style="margin-top:10px">Winner SF1 vs Winner SF2<br><br><strong>Champion</strong><br>TBD</div></div>`;
    return;
  }

  if(fmt === 8){
    if(p.quarterfinals && p.semifinals && p.final){
      playoffBox.innerHTML = `<div class="bracket-card"><h3>Quarterfinals</h3><div class="small" style="margin-top:10px">${show(p.quarterfinals.q1)}<br><br>${show(p.quarterfinals.q2)}<br><br>${show(p.quarterfinals.q3)}<br><br>${show(p.quarterfinals.q4)}</div></div><div class="bracket-card"><h3>Semifinals</h3><div class="small" style="margin-top:10px">${show(p.semifinals.s1)}<br><br>${show(p.semifinals.s2)}</div></div><div class="bracket-card"><h3>Final</h3><div class="small" style="margin-top:10px">${show(p.final.f1)}<br><br><strong>Champion</strong><br>${esc(p.champion || 'TBD')}</div></div>`;
      return;
    }
    const bracketRows = rows.filter(r=>r.playoffEligible).slice(0,8).length >= 8 ? rows.filter(r=>r.playoffEligible).slice(0,8) : rows.slice(0,8);
    if(bracketRows.length < 8){ playoffBox.innerHTML = `<div class="status">Top 8 playoff view will appear once at least 8 players have season rankings.</div>`; return; }
    const seed = i => bracketRows[i-1] ? `${i}. ${esc(bracketRows[i-1].name)}` : `Seed ${i} TBD`;
    playoffBox.innerHTML = `<div class="bracket-card"><h3>Quarterfinals</h3><div class="small" style="margin-top:10px">${seed(1)} vs ${seed(8)}<br><br>${seed(4)} vs ${seed(5)}<br><br>${seed(3)} vs ${seed(6)}<br><br>${seed(2)} vs ${seed(7)}</div></div><div class="bracket-card"><h3>Semifinals</h3><div class="small" style="margin-top:10px">Winner QF1 vs Winner QF2<br><br>Winner QF3 vs Winner QF4</div></div><div class="bracket-card"><h3>Final</h3><div class="small" style="margin-top:10px">Winner SF1 vs Winner SF2<br><br><strong>Champion</strong><br>TBD</div></div>`;
    return;
  }

  if(p.playIn && p.quarterfinals && p.semifinals && p.final){
    playoffBox.innerHTML = `<div class="bracket-card"><h3>Play-In</h3><div class="small" style="margin-top:10px">${show(p.playIn.m1)}<br><br>${show(p.playIn.m2)}<br><br>${show(p.playIn.m3)}<br><br>${show(p.playIn.m4)}</div></div><div class="bracket-card"><h3>Quarterfinals</h3><div class="small" style="margin-top:10px">${show(p.quarterfinals.q1)}<br><br>${show(p.quarterfinals.q2)}<br><br>${show(p.quarterfinals.q3)}<br><br>${show(p.quarterfinals.q4)}</div></div><div class="bracket-card"><h3>Semifinals</h3><div class="small" style="margin-top:10px">${show(p.semifinals.s1)}<br><br>${show(p.semifinals.s2)}</div></div><div class="bracket-card"><h3>Final</h3><div class="small" style="margin-top:10px">${show(p.final.f1)}<br><br><strong>Champion</strong><br>${esc(p.champion || 'TBD')}</div></div>`;
    return;
  }
  const bracketRows = rows.filter(r=>r.playoffEligible).slice(0,12).length >= 12 ? rows.filter(r=>r.playoffEligible).slice(0,12) : rows.slice(0,12);
  if(bracketRows.length < 12){ playoffBox.innerHTML = `<div class="status">Top 12 playoff view will appear once at least 12 players have season rankings.</div>`; return; }
  const seed = i => bracketRows[i-1] ? `${i}. ${esc(bracketRows[i-1].name)}` : `Seed ${i} TBD`;
  playoffBox.innerHTML = `<div class="bracket-card"><h3>Play-In</h3><div class="small" style="margin-top:10px">5 vs 12<br>${seed(5)}<br>${seed(12)}<br><br>6 vs 11<br>${seed(6)}<br>${seed(11)}<br><br>7 vs 10<br>${seed(7)}<br>${seed(10)}<br><br>8 vs 9<br>${seed(8)}<br>${seed(9)}</div></div><div class="bracket-card"><h3>Quarterfinals</h3><div class="small" style="margin-top:10px">QF1<br>${seed(1)} vs Winner 8/9<br><br>QF2<br>${seed(4)} vs Winner 5/12<br><br>QF3<br>${seed(3)} vs Winner 6/11<br><br>QF4<br>${seed(2)} vs Winner 7/10</div></div><div class="bracket-card"><h3>Semifinals</h3><div class="small" style="margin-top:10px">SF1<br>Winner QF1 vs Winner QF2<br><br>SF2<br>Winner QF3 vs Winner QF4</div></div><div class="bracket-card"><h3>Final</h3><div class="small" style="margin-top:10px">Winner SF1 vs Winner SF2<br><br><strong>Champion</strong><br>TBD</div></div>`;
}

function renderHallOfFame() {
  const rows = buildPlayerStats();
  if(!rows.length){ hofBox.innerHTML = '<div class="status">No Hall of Fame data yet.</div>'; return; }
  const champ = rows[0];
  const mostWins = [...rows].sort((a,b)=>b.wins-a.wins || b.pct-a.pct)[0];
  const bestDiff = [...rows].sort((a,b)=>b.diff-a.diff || b.pct-a.pct)[0];
  const iron = [...rows].sort((a,b)=>b.games-a.games || b.wins-a.wins)[0];
  hofBox.innerHTML = `
    <div class="players-grid">
      <div class="player-card"><strong>League Leader</strong><div class="small" style="margin-top:8px">${esc(champ.name)} • ${(champ.pct*100).toFixed(1)}% • Rating ${(champ.elo||0).toFixed(1)}</div></div>
      <div class="player-card"><strong>Most Wins</strong><div class="small" style="margin-top:8px">${esc(mostWins.name)} • ${mostWins.wins} wins</div></div>
      <div class="player-card"><strong>Best Point Differential</strong><div class="small" style="margin-top:8px">${esc(bestDiff.name)} • Diff ${bestDiff.diff}</div></div>
      <div class="player-card"><strong>Iron Player</strong><div class="small" style="margin-top:8px">${esc(iron.name)} • ${iron.games} matches played</div></div>
    </div>
  `;
}





window.addEventListener('load', async ()=>{
  const loaded = await tryLoadLiveGoogleData();
  if(!loaded && (window.POUNCEY_PUBLIC_DATA || window.POUNCY_PUBLIC_DATA)) data = window.POUNCEY_PUBLIC_DATA || window.POUNCY_PUBLIC_DATA;
  useData();
});
