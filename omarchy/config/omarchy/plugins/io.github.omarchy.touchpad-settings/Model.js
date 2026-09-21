// Pure helpers and JSON validation shared by QML and tests.
function controllerPath(url) { return decodeURIComponent(String(url).replace(/^file:\/\//, "")); }
function concise(value, fallback) { var s=String(value||"").replace(/\s+/g," ").trim()||fallback; return s.length>180?s.slice(0,177)+"…":s; }
function validNumber(v,min,max,step) { var n=Number(v); return Number.isFinite(n)&&n>=min-1e-9&&n<=max+1e-9&&Math.abs(n/step-Math.round(n/step))<1e-7; }
function validSettings(s) { return s && validNumber(s.sensitivity,-1,1,.05) && validNumber(s.scroll_factor,.1,2,.1) && ["natural_scroll","tap_to_click","clickfinger_behavior","disable_while_typing","tap_and_drag","middle_button_emulation"].every(k=>typeof s[k]==="boolean"); }
function parseResponse(raw) { try { var p=JSON.parse(String(raw||"")); if(!p||p.schemaVersion!==1) return {ok:false,error:"Controller returned an unsupported response"}; if(p.ok!==true) return {ok:false,error:concise(p.error,"Controller reported an error")}; if(!validSettings(p.settings)) return {ok:false,error:"Controller returned invalid settings"}; return {ok:true,payload:p}; } catch(e) { return {ok:false,error:"Controller returned invalid JSON"}; } }
function statusCommand(c) { return [c,"status","--json"]; }
function restoreCommand(c) { return [c,"restore","--json"]; }
function applyCommand(c,s) { if(!validSettings(s)) return {ok:false,error:"Invalid touchpad settings"}; return {ok:true,command:[c,"apply","--json",JSON.stringify(s)]}; }
if(typeof module!=="undefined") module.exports={controllerPath,concise,validNumber,validSettings,parseResponse,statusCommand,restoreCommand,applyCommand};
