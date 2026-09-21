import json, os, stat, subprocess, tempfile, unittest
from pathlib import Path
CTL=Path(__file__).parents[1]/'controller/touchpadctl'
S={'sensitivity':0,'scroll_factor':.4,'natural_scroll':False,'tap_to_click':True,'clickfinger_behavior':True,'disable_while_typing':True,'tap_and_drag':True,'middle_button_emulation':False}
OPTIONS=['input:sensitivity','input:touchpad:scroll_factor','input:touchpad:natural_scroll','input:touchpad:tap-to-click','input:touchpad:clickfinger_behavior','input:touchpad:disable_while_typing','input:touchpad:tap-and-drag','input:touchpad:middle_button_emulation']
class ControllerTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory(); d=Path(self.tmp.name); self.log=d/'log'; self.bin=d/'bin'; self.bin.mkdir()
  script=self.bin/'hyprctl'; script.write_text('''#!/usr/bin/env python3\nimport json,os,sys\nopen(os.environ["HYPR_LOG"],"a").write(json.dumps(sys.argv[1:])+"\\n")\nif sys.argv[1:2]==["getoption"]:\n n=sys.argv[2]; print(json.dumps({"option":n,"float":0.0 if n.endswith("sensitivity") else 0.4}) if n.endswith("sensitivity") or n.endswith("scroll_factor") else json.dumps({"option":n,"bool":False}))\n'''); script.chmod(script.stat().st_mode|stat.S_IEXEC)
  self.env={**os.environ,'PATH':str(self.bin)+os.pathsep+os.environ.get('PATH',''),'HYPR_LOG':str(self.log),'XDG_CONFIG_HOME':str(d/'config')}
 def tearDown(self): self.tmp.cleanup()
 def invoke(self,*args): return subprocess.run([str(CTL),*args],text=True,capture_output=True,env=self.env)
 def calls(self): return [json.loads(x) for x in self.log.read_text().splitlines()] if self.log.exists() else []
 def test_exact_ordering_and_apply(self):
  self.assertEqual(self.invoke('status','--json').returncode,0)
  p=self.invoke('apply','--json',json.dumps(S)); self.assertEqual(p.returncode,0); self.assertTrue(json.loads(p.stdout)['saved'])
  self.assertEqual(json.loads((Path(self.env['XDG_CONFIG_HOME'])/'omarchy/touchpad-settings.json').read_text())['settings'],S)
  self.log.write_text('')
  p=self.invoke('restore','--json'); self.assertEqual(p.returncode,0); self.assertTrue(json.loads(p.stdout)['restored']);
  calls=[x for x in self.calls() if x[0]=='keyword']
  expected=[['keyword',o,('0' if i==0 else '0.4' if i==1 else 'false' if i in (2,7) else 'true')] for i,o in enumerate(OPTIONS)]
  self.assertEqual(calls,expected)
 def test_missing_restore_is_noop(self):
  p=self.invoke('restore','--json'); self.assertEqual(p.returncode,0); self.assertFalse(json.loads(p.stdout)['restored']); self.assertFalse(any(x[0]=='keyword' for x in self.calls()))
 def test_rejects_malformed_saved_document_as_json(self):
  p=Path(self.env['XDG_CONFIG_HOME'])/'omarchy'; p.mkdir(parents=True); (p/'touchpad-settings.json').write_text('[]')
  result=self.invoke('restore','--json'); self.assertNotEqual(result.returncode,0)
  self.assertEqual(json.loads(result.stdout), {'schemaVersion':1,'ok':False,'error':'saved touchpad settings have an unsupported format'})
  self.assertFalse(any(x[0]=='keyword' for x in self.calls()))
 def test_rejects_invalid_without_calls_or_save(self):
  for bad in ({**S,'sensitivity':2},{**S,'scroll_factor':.15},{**S,'tap_to_click':1}):
   self.assertNotEqual(self.invoke('apply','--json',json.dumps(bad)).returncode,0)
  self.assertFalse(self.calls()); self.assertFalse((Path(self.env['XDG_CONFIG_HOME'])/'omarchy/touchpad-settings.json').exists())
if __name__=='__main__': unittest.main()
