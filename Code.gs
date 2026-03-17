/**
 * Pouncey Tract League Google Apps Script
 * Deploy as Web App:
 * - Execute as: Me
 * - Who has access: Anyone with the link
 *
 * This version calculates DUPR-style ratings and a live leaderboard
 * directly from Google Sheets stored league state.
 */

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "ping";
  if (action === "ping") {
    return jsonOutput({ok:true, message:"Apps Script is reachable."});
  }
  if (action === "loadLeagueState") {
    try {
      const data = loadLeagueState_();
      return jsonOutput({ok:true, data:data});
    } catch (err) {
      return jsonOutput({ok:false, error:String(err)});
    }
  }
  if (action === "updateWeekSignup") {
    try {
      const playersRaw = (e && e.parameter && e.parameter.players) || "";
      const players = String(playersRaw)
        .split("|")
        .map(function(x){ return String(x || "").trim(); })
        .filter(Boolean);
      const data = updateWeekSignup_({
        week: (e && e.parameter && e.parameter.week) || "",
        day: (e && e.parameter && e.parameter.day) || "",
        players: players
      });
      return jsonOutput({ok:true, message:"Week sign-up saved successfully.", data:data});
    } catch (err) {
      return jsonOutput({ok:false, error:String(err)});
    }
  }
  return jsonOutput({ok:false, error:"Unsupported GET action."});
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = body.action || "";
    const payload = body.payload || {};

    if (action === "ping") return jsonOutput({ok:true, message:"Apps Script connection successful."});

    if (action === "saveLeagueState") {
      saveLeagueState_(payload);
      return jsonOutput({ok:true, message:"League data saved to Google Sheets."});
    }

    if (action === "loadLeagueState") {
      const data = loadLeagueState_();
      return jsonOutput({ok:true, data:data});
    }

    if (action === "resetLeagueState") {
      resetLeagueState_();
      return jsonOutput({ok:true, message:"Google Sheets league data was reset."});
    }

    if (action === "updateMatchScore") {
      const data = updateMatchScore_(payload);
      return jsonOutput({ok:true, message:"Score updated successfully.", data:data});
    }

    if (action === "updateWeekSignup") {
      const data = updateWeekSignup_(payload);
      return jsonOutput({ok:true, message:"Week sign-up saved successfully.", data:data});
    }

    return jsonOutput({ok:false, error:"Unsupported POST action."});
  } catch (err) {
    return jsonOutput({ok:false, error:String(err)});
  }
}

function jsonOutput(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getLeagueStateSheet_(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName("LeagueState");
  if (!sh) {
    sh = ss.insertSheet("LeagueState");
    sh.getRange(1,1,1,2).setValues([["key","json"]]);
  }
  return sh;
}

function getLeaderboardSheet_(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName("Leaderboard");
  if (!sh) {
    sh = ss.insertSheet("Leaderboard");
  }
  return sh;
}

function defaultLeagueState_(){
  return {
    profile:{
      leagueTitle:"Pouncey Tract Weekend Pickleball League",
      leagueSubtitle:"Short Pump, VA",
      seasonStart:"",
      seasonEnd:"",
      defaultCourts:5,
      defaultRounds:8,
      winScore:11,
      kFactor:24,
      minMatchesForPlayoffs:8,
      googleScriptUrl:"",
      currentSignupWeek:""
    },
    roster:[],
    weeks:[],
    availability:{},
    playoffs:{},
    season:[]
  };
}

function saveLeagueState_(payload){
  const full = Object.assign(defaultLeagueState_(), payload || {});
  full.season = computeSeason_(full);
  const sh = getLeagueStateSheet_();
  sh.clear();
  sh.getRange(1,1,1,2).setValues([["key","json"]]);
  sh.getRange(2,1,1,2).setValues([["league_state", JSON.stringify(full)]]);
  writeLeaderboardSheet_(full.season);
}

function loadLeagueState_(){
  const sh = getLeagueStateSheet_();
  const lastRow = sh.getLastRow();
  if (lastRow < 2) {
    const empty = defaultLeagueState_();
    writeLeaderboardSheet_(empty.season);
    return empty;
  }
  const val = sh.getRange(2,2).getValue();
  const obj = val ? JSON.parse(val) : defaultLeagueState_();
  obj.profile = Object.assign(defaultLeagueState_().profile, obj.profile || {});
  obj.roster = obj.roster || [];
  obj.weeks = obj.weeks || [];
  obj.availability = obj.availability || {};
  obj.playoffs = obj.playoffs || {};
  obj.season = computeSeason_(obj);
  writeLeaderboardSheet_(obj.season);
  return obj;
}

function resetLeagueState_(){
  const sh = getLeagueStateSheet_();
  sh.clear();
  sh.getRange(1,1,1,2).setValues([["key","json"]]);
  const board = getLeaderboardSheet_();
  board.clear();
  board.getRange(1,1,1,10).setValues([["Rank","Player","Wins","Losses","Win %","Point Diff","Rating","Games","Playoff Eligible","Active"]]);
}

function writeLeaderboardSheet_(seasonRows){
  const sh = getLeaderboardSheet_();
  sh.clear();
  sh.getRange(1,1,1,10).setValues([["Rank","Player","Wins","Losses","Win %","Point Diff","Rating","Games","Playoff Eligible","Active"]]);
  if (!seasonRows || !seasonRows.length) return;
  const rows = seasonRows.map(function(r, i){
    return [
      i + 1,
      r.name || "",
      r.wins || 0,
      r.losses || 0,
      round2_((r.pct || 0) * 100) + "%",
      r.diff || 0,
      round1_(r.elo || 0),
      r.games || 0,
      r.playoffEligible ? "Yes" : "No",
      r.active === false ? "No" : "Yes"
    ];
  });
  sh.getRange(2,1,rows.length,rows[0].length).setValues(rows);
}

function computeSeason_(state){
  const profile = state.profile || {};
  const roster = state.roster || [];
  const weeks = state.weeks || [];
  const minMatches = Number(profile.minMatchesForPlayoffs || 8);
  const K = Number(profile.kFactor || 24);

  const players = {};
  roster.forEach(function(p){
    players[p.name] = {
      name: p.name,
      wins: 0,
      losses: 0,
      pf: 0,
      pa: 0,
      elo: Number(p.rating || 0) * 100,
      active: p.active !== false
    };
  });

  const completed = [];
  weeks.forEach(function(w){
    ["saturday","sunday"].forEach(function(day){
      const sched = (w[day] && w[day].schedule) || [];
      sched.forEach(function(m){
        if (m && m.completed) {
          completed.push({week:w.week || 0, day:day, match:m});
        }
      });
    });
  });

  completed.sort(function(a,b){
    if (a.week !== b.week) return a.week - b.week;
    if (a.day !== b.day) return a.day < b.day ? -1 : 1;
    return (a.match.round || 0) - (b.match.round || 0) || (a.match.court || 0) - (b.match.court || 0);
  });

  completed.forEach(function(item){
    const m = item.match;
    const a = m.team1[0], b = m.team1[1], c = m.team2[0], d = m.team2[1];
    [a,b,c,d].forEach(function(n){
      if (!players[n]) {
        players[n] = {name:n,wins:0,losses:0,pf:0,pa:0,elo:0,active:true};
      }
    });

    const t1 = (players[a].elo + players[b].elo) / 2;
    const t2 = (players[c].elo + players[d].elo) / 2;
    const expected1 = 1 / (1 + Math.pow(10, (t2 - t1) / 400));
    const expected2 = 1 - expected1;
    const score1 = Number(m.score1 || 0);
    const score2 = Number(m.score2 || 0);
    const totalPts = Math.max(1, score1 + score2);
    const margin = Math.abs(score1 - score2);
    const marginFactor = Math.max(0.6, Math.min(1.4, 1 + (margin / Math.max(11, totalPts))));
    const actual1 = score1 / totalPts;
    const actual2 = score2 / totalPts;
    const d1 = K * (actual1 - expected1) * marginFactor;
    const d2 = K * (actual2 - expected2) * marginFactor;

    players[a].elo += d1; players[b].elo += d1;
    players[c].elo += d2; players[d].elo += d2;

    players[a].pf += score1; players[a].pa += score2;
    players[b].pf += score1; players[b].pa += score2;
    players[c].pf += score2; players[c].pa += score1;
    players[d].pf += score2; players[d].pa += score1;

    if (score1 > score2) {
      players[a].wins++; players[b].wins++;
      players[c].losses++; players[d].losses++;
    } else {
      players[c].wins++; players[d].wins++;
      players[a].losses++; players[b].losses++;
    }
  });

  const rows = Object.keys(players).map(function(name){
    const p = players[name];
    const games = p.wins + p.losses;
    return {
      name: p.name,
      wins: p.wins,
      losses: p.losses,
      pf: p.pf,
      pa: p.pa,
      games: games,
      pct: games ? p.wins / games : 0,
      diff: p.pf - p.pa,
      elo: p.elo,
      active: p.active,
      playoffEligible: games >= minMatches
    };
  });

  rows.sort(function(x,y){
    if (y.pct !== x.pct) return y.pct - x.pct;
    if (y.diff !== x.diff) return y.diff - x.diff;
    if (y.elo !== x.elo) return y.elo - x.elo;
    return String(x.name).localeCompare(String(y.name));
  });

  return rows;
}

function round1_(n){ return Math.round((Number(n) || 0) * 10) / 10; }
function round2_(n){ return Math.round((Number(n) || 0) * 100) / 100; }


function isValidPickleballScore_(score1, score2){
  score1 = Number(score1 || 0);
  score2 = Number(score2 || 0);
  if (!isFinite(score1) || !isFinite(score2)) return false;
  if (score1 < 0 || score2 < 0 || score1 === score2) return false;
  var hi = Math.max(score1, score2), lo = Math.min(score1, score2), diff = hi - lo;
  if (hi < 11) return false;
  if (hi === 11) return diff >= 2 && lo <= 9;
  return lo >= 10 && diff === 2;
}

function updateMatchScore_(payload){
  const weekNum = Number(payload.week || 0);
  const dayKey = String(payload.day || "").toLowerCase();
  const round = Number(payload.round || 0);
  const court = Number(payload.court || 0);
  const score1 = Number(payload.score1 || 0);
  const score2 = Number(payload.score2 || 0);

  if (!isValidPickleballScore_(score1, score2)) {
    throw new Error("Invalid score. Valid examples: 11-9, 13-11, 15-13. Invalid examples: 11-10, 12-11, 14-13, 9-7.");
  }

  const state = loadLeagueState_();
  const weeks = state.weeks || [];
  const week = weeks.find(function(w){ return Number(w.week || 0) === weekNum; });
  if (!week) throw new Error("Week not found.");
  const day = week[dayKey];
  if (!day || !day.schedule) throw new Error("Scheduled day not found.");
  const match = day.schedule.find(function(m){
    return Number(m.round || 0) === round && Number(m.court || 0) === court;
  });
  if (!match) throw new Error("Scheduled match not found.");

  match.score1 = score1;
  match.score2 = score2;
  match.completed = true;

  saveLeagueState_(state);
  return loadLeagueState_();
}


function updateWeekSignup_(payload){
  const weekNum = Number(payload.week || 0);
  const dayKey = String(payload.day || "").toLowerCase();
  const players = Array.isArray(payload.players) ? payload.players.map(function(x){ return String(x || "").trim(); }).filter(Boolean) : [];
  if (!weekNum) throw new Error("Week is required.");
  if (dayKey !== "saturday" && dayKey !== "sunday") throw new Error("Day must be saturday or sunday.");

  const state = loadLeagueState_();
  const week = (state.weeks || []).find(function(w){ return Number(w.week || 0) === weekNum; });
  if (!week) throw new Error("Week not found.");
  if (!week[dayKey] || !week[dayKey].active) throw new Error("This day is not active for the selected week.");
  var sched = Array.isArray(week[dayKey].schedule) ? week[dayKey].schedule : [];
  if (sched.length > 0) throw new Error("Sign-up is closed because matches were already generated for this day.");

  if (!state.availability) state.availability = {};
  state.availability["W" + weekNum + "_" + dayKey] = players;

  saveLeagueState_(state);
  return loadLeagueState_();
}
