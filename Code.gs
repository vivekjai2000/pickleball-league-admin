function defaultLeagueState_() {
  return {
    profile: {
      leagueTitle: "Pouncey Tract Weekend Pickleball League",
      leagueSubtitle: "Short Pump, VA",
      seasonStart: "2026-04-11",
      seasonEnd: "2026-10-03",
      defaultCourts: 5,
      defaultRounds: 8,
      winScore: 11,
      kFactor: 24,
      minMatchesForPlayoffs: 8,
      playoffFormat: 12,
      googleScriptUrl: "",
      currentSignupWeek: ""
    },
    roster: [],
    weeks: [],
    availability: {},
    playoffs: {},
    season: {}
  };
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function dispatchAction_(action, payload) {
  try {
    if (action === "ping") {
      return jsonOutput({ ok: true, message: "Apps Script connection successful." });
    }

    if (action === "saveLeagueState") {
      var saved = saveLeagueState_(payload || {});
      return jsonOutput({
        ok: true,
        message: "League data saved to Google Sheets.",
        data: saved
      });
    }

    if (action === "loadLeagueState") {
      return jsonOutput({
        ok: true,
        data: loadLeagueState_()
      });
    }

    if (action === "resetLeagueState") {
      resetLeagueState_();
      return jsonOutput({
        ok: true,
        message: "Google Sheets league data was reset."
      });
    }

    if (action === "updateMatchScore") {
      var scored = updateMatchScore_(payload || {});
      return jsonOutput({
        ok: true,
        message: "Score updated successfully.",
        data: scored
      });
    }

    if (action === "updateWeekSignup") {
      var signup = updateWeekSignup_(payload || {});
      return jsonOutput({
        ok: true,
        message: "Week sign-up saved successfully.",
        data: signup
      });
    }

    return jsonOutput({
      ok: false,
      error: "Unsupported action."
    });
  } catch (err) {
    return jsonOutput({
      ok: false,
      error: String(err)
    });
  }
}

function doGet(e) {
  try {
    var dataParam = (e && e.parameter && e.parameter.data) ? String(e.parameter.data) : "";
    if (dataParam) {
      var body = JSON.parse(dataParam);
      return dispatchAction_(body.action || "", body.payload || {});
    }

    // Default to live league state so opening /exec directly always returns JSON.
    var action = (e && e.parameter && e.parameter.action) || "loadLeagueState";

    if (action === "ping") {
      return dispatchAction_("ping", {});
    }

    if (action === "loadLeagueState") {
      return dispatchAction_("loadLeagueState", {});
    }

    if (action === "updateWeekSignup") {
      var playersRaw = (e && e.parameter && e.parameter.players) || "";
      var players = String(playersRaw)
        .split("|")
        .map(function(x) { return String(x || "").trim(); })
        .filter(Boolean);

      return dispatchAction_("updateWeekSignup", {
        week: (e && e.parameter && e.parameter.week) || "",
        day: (e && e.parameter && e.parameter.day) || "",
        players: players
      });
    }

    return jsonOutput({
      ok: false,
      error: "Unsupported GET action."
    });
  } catch (err) {
    return jsonOutput({
      ok: false,
      error: String(err)
    });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    return dispatchAction_(body.action || "", body.payload || {});
  } catch (err) {
    return jsonOutput({
      ok: false,
      error: String(err)
    });
  }
}

function getLeagueStateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName("league_state");
  if (!sh) {
    sh = ss.insertSheet("league_state");
    sh.getRange(1, 1, 1, 2).setValues([["key", "json"]]);
  }
  return sh;
}

function getLeaderboardSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName("leaderboard");
  if (!sh) {
    sh = ss.insertSheet("leaderboard");
  }
  return sh;
}

function loadLeagueState_() {
  var sh = getLeagueStateSheet_();
  var values = sh.getDataRange().getValues();
  if (!values || values.length < 2) {
    return defaultLeagueState_();
  }

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === "league_state" && values[i][1]) {
      try {
        var parsed = JSON.parse(values[i][1]);
        var merged = Object.assign(defaultLeagueState_(), parsed || {});
        merged.profile = Object.assign(defaultLeagueState_().profile, merged.profile || {});
        merged.roster = Array.isArray(merged.roster) ? merged.roster : [];
        merged.weeks = Array.isArray(merged.weeks) ? merged.weeks : [];
        merged.availability = merged.availability || {};
        merged.playoffs = merged.playoffs || {};
        merged.season = computeSeason_(merged);
        return merged;
      } catch (err) {
        throw new Error("Could not parse saved league state: " + err);
      }
    }
  }

  return defaultLeagueState_();
}

function saveLeagueState_(payload) {
  var full = Object.assign(defaultLeagueState_(), payload || {});
  full.profile = Object.assign(defaultLeagueState_().profile, full.profile || {});
  full.roster = Array.isArray(full.roster) ? full.roster : [];
  full.weeks = Array.isArray(full.weeks) ? full.weeks : [];
  full.availability = full.availability || {};
  full.playoffs = full.playoffs || {};
  full.season = computeSeason_(full);

  var sh = getLeagueStateSheet_();
  sh.clear();
  sh.getRange(1, 1, 1, 2).setValues([["key", "json"]]);
  sh.getRange(2, 1, 1, 2).setValues([["league_state", JSON.stringify(full)]]);
  writeLeaderboardSheet_(full.season);
  return full;
}

function resetLeagueState_() {
  var sh = getLeagueStateSheet_();
  sh.clear();
  sh.getRange(1, 1, 1, 2).setValues([["key", "json"]]);

  var lb = getLeaderboardSheet_();
  lb.clear();
}

function updateWeekSignup_(payload) {
  var full = loadLeagueState_();
  var week = String((payload && payload.week) || "").trim();
  var day = String((payload && payload.day) || "").trim();
  var players = (payload && payload.players) || [];

  if (!week || !day) {
    throw new Error("Week and day are required.");
  }

  var key = "W" + week + "_" + day;
  full.availability[key] = Array.isArray(players) ? players : [];
  return saveLeagueState_(full);
}

function updateMatchScore_(payload) {
  var full = loadLeagueState_();
  var weekNum = Number(payload.week);
  var dayKey = String(payload.day || "").trim();
  var matchId = String(payload.matchId || "").trim();
  var team1Score = Number(payload.team1Score);
  var team2Score = Number(payload.team2Score);

  if (!weekNum || !dayKey || !matchId) {
    throw new Error("Week, day, and matchId are required.");
  }

  var week = null;
  for (var i = 0; i < full.weeks.length; i++) {
    if (Number(full.weeks[i].week) === weekNum) {
      week = full.weeks[i];
      break;
    }
  }
  if (!week || !week[dayKey] || !Array.isArray(week[dayKey].schedule)) {
    throw new Error("Could not find the requested schedule.");
  }

  var match = null;
  for (var j = 0; j < week[dayKey].schedule.length; j++) {
    if (String(week[dayKey].schedule[j].id || "") === matchId) {
      match = week[dayKey].schedule[j];
      break;
    }
  }
  if (!match) {
    throw new Error("Could not find the requested match.");
  }

  match.team1Score = team1Score;
  match.team2Score = team2Score;
  match.completed = true;
  match.winner = team1Score > team2Score ? 1 : 2;

  return saveLeagueState_(full);
}

function computeSeason_(full) {
  var roster = Array.isArray(full.roster) ? full.roster : [];
  var weeks = Array.isArray(full.weeks) ? full.weeks : [];
  var minMatches = Number((full.profile && full.profile.minMatchesForPlayoffs) || 8);

  var stats = {};
  roster.forEach(function(p) {
    if (!p || !p.name) return;
    stats[p.name] = {
      name: p.name,
      rating: Number(p.elo || (Number(p.rating || 0) * 100)),
      matches: 0,
      wins: 0,
      losses: 0,
      diff: 0,
      pct: 0,
      playoffEligible: false
    };
  });

  weeks.forEach(function(w) {
    ["saturday", "sunday"].forEach(function(dayKey) {
      var day = w && w[dayKey];
      if (!day || !Array.isArray(day.schedule)) return;
      day.schedule.forEach(function(m) {
        if (!m || !m.completed) return;
        var t1 = Array.isArray(m.team1) ? m.team1 : [];
        var t2 = Array.isArray(m.team2) ? m.team2 : [];
        var s1 = Number(m.team1Score || 0);
        var s2 = Number(m.team2Score || 0);

        t1.forEach(function(name) {
          if (!stats[name]) return;
          stats[name].matches += 1;
          stats[name].diff += (s1 - s2);
          if (s1 > s2) stats[name].wins += 1;
          else stats[name].losses += 1;
        });

        t2.forEach(function(name) {
          if (!stats[name]) return;
          stats[name].matches += 1;
          stats[name].diff += (s2 - s1);
          if (s2 > s1) stats[name].wins += 1;
          else stats[name].losses += 1;
        });
      });
    });
  });

  var leaderboard = Object.keys(stats).map(function(name) {
    var s = stats[name];
    s.pct = s.matches ? (s.wins / s.matches) : 0;
    s.playoffEligible = s.matches >= minMatches;
    return s;
  });

  leaderboard.sort(function(a, b) {
    if (b.pct !== a.pct) return b.pct - a.pct;
    if (b.diff !== a.diff) return b.diff - a.diff;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return String(a.name).localeCompare(String(b.name));
  });

  return {
    generatedAt: new Date().toISOString(),
    rosterCount: roster.filter(function(p) { return p && p.active !== false; }).length,
    weeksCount: weeks.length,
    leaderboard: leaderboard
  };
}

function writeLeaderboardSheet_(season) {
  var sh = getLeaderboardSheet_();
  sh.clear();

  var rows = [["Rank", "Player", "Matches", "Wins", "Losses", "WinPct", "Diff", "Rating", "PlayoffEligible"]];
  var board = (season && Array.isArray(season.leaderboard)) ? season.leaderboard : [];
  board.forEach(function(r, idx) {
    rows.push([
      idx + 1,
      r.name,
      r.matches,
      r.wins,
      r.losses,
      r.pct,
      r.diff,
      r.rating,
      r.playoffEligible ? "Yes" : "No"
    ]);
  });

  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}
