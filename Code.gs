/**
 * Pouncy Tract League Google Apps Script
 * Deploy as Web App:
 * - Execute as: Me
 * - Who has access: Anyone with the link
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
    return jsonOutput({ok:false, error:"Unsupported POST action."});
  } catch (err) {
    return jsonOutput({ok:false, error:String(err)});
  }
}

function jsonOutput(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet_(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName("LeagueState");
  if (!sh) {
    sh = ss.insertSheet("LeagueState");
    sh.getRange(1,1,1,2).setValues([["key","json"]]);
  }
  return sh;
}

function saveLeagueState_(payload){
  const sh = getSheet_();
  sh.clear();
  sh.getRange(1,1,1,2).setValues([["key","json"]]);
  sh.getRange(2,1,1,2).setValues([["league_state", JSON.stringify(payload)]]);
}

function loadLeagueState_(){
  const sh = getSheet_();
  const lastRow = sh.getLastRow();
  if (lastRow < 2) {
    return {
      profile:{
        leagueTitle:"Pouncy Tract Weekend Pickleball League",
        leagueSubtitle:"Short Pump, VA",
        seasonStart:"",
        seasonEnd:"",
        defaultCourts:5,
        defaultRounds:8,
        winScore:11,
        kFactor:24,
        minMatchesForPlayoffs:8,
        googleScriptUrl:""
      },
      roster:[],
      weeks:[],
      availability:{},
      playoffs:{}
    };
  }
  const val = sh.getRange(2,2).getValue();
  return val ? JSON.parse(val) : {};
}

function resetLeagueState_(){
  const sh = getSheet_();
  sh.clear();
  sh.getRange(1,1,1,2).setValues([["key","json"]]);
}
