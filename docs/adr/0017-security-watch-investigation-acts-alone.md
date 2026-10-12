---
status: accepted
---
# The security watch Investigation quarantines on its own, with full sudo

When the security watch finds something new on a host, an omp Investigation starts on a different server, in its own herdr tab: aidev's Findings go to itan8n, and every other host's go to aidev. It starts from the daily check, or within the hour for a Wazuh alert at level 12 or higher on a rule and host pair not seen before. It decides whether the Finding is real and applies any Quarantine itself: moving a file aside, stopping a container, disabling a skill, or isolating the host from the network. It does this with full sudo, with no approval step and no fixed list of allowed commands. James uses herdr every day but may not reach a new tab for hours, and would rather have a service go down on a false positive than leave a real compromise running while the session waits.

This coexists with homelab ADR 0012 (`~/homelab/docs/adr/0012-wazuh-security-incidents-langgraph.md`), which makes Wazuh-sourced incidents "propose-only … never actuates". 0012 still governs the Wazuh → homelab router → LangGraph path, which stays as it is. This ADR governs only the security watch, which reads Wazuh's alert log directly and opens Investigations through herdr. A reader who finds both should not "fix" one to match the other: they cover different paths on purpose.

## Considered options

- Propose-only, where the Investigation suggests and James approves in the tab. This is the rule 0012 uses. Rejected because a Finding can sit unanswered until James next looks at herdr.
- One fixed `quarantine` command allowed through a single sudoers rule, with logged and undoable actions and no other sudo for the Investigation user. This was recommended and rejected in favour of letting the agent choose any response.

## Consequences

- The Investigation reads possibly hostile content, such as injected text and attacker-planted files, while holding root on its own server and ssh with password-free sudo to the affected one. Text written to steer the agent could get it to run any command on both servers. This risk was accepted knowingly; the fixed-command option above is the way to narrow it later.
- An Investigation never runs on the server its Findings came from. In v1 each host's Baseline is the previous successful full check's results, saved unsigned on the other server. New, changed or removed Footholds and changed vulnerability or scored-malware results become Findings once; clean package inventory changes alone do not. Successful checks advance the Baseline while pending Findings stay queued independently. A failed check does not replace it. The first successful check only saves results and opens no Investigations. Legitimate Foothold changes James or his agents make can therefore open an Investigation that may quarantine them. Signed Baselines (approved on the laptop with a hardware key or passphrase key) are deferred to v2.
- aidev loses its root ssh into the Wazuh server, and Wazuh is managed from the laptop. The laptop must first get a separate administration key because its current key is also on aidev. This removes aidev's direct root access; it does not make Wazuh immune to compromise through the laptop or another route.
- herdr only notifies an attached client, so Findings, Quarantines, failed Investigation starts, and missing daily reports also go to James's Slack DM. Each server watches for the other's daily report; the Wazuh server watches for the laptop's.
- If both dev servers have Findings the same night, each still investigates and quarantines the other, and the Slack message says both are suspect.
- Known limits: the check cannot detect credentials that are read and sent out without leaving anything behind. A report from a root-compromised host is untrusted, since the attacker can fake a clean result; proof that a run happened is not proof it reported honestly. Because v1 Baselines are unsigned and each server can ssh to the other with password-free sudo, a compromised server can edit its saved Baseline on the other server and hide a Foothold. A malicious package with no advisory yet is caught only if GuardDog flags it on its first day.
- Isolation always leaves NetBird running (including aidev's route into `10.20.20.0/24`), ssh from the other server, and the Wazuh connection open, so James and the Investigation can still reach an isolated server. Nothing undoes a Quarantine automatically; James undoes it by hand.

## Implementation

The executable service, implementation plan and operator guide are in `~/homelab/services/security-watch/`. Its README records exercised offline acceptance separately from live deployment. Tool installation, unit activation and each Wazuh/key phase still require their own rollout approvals; approved runtime Investigations retain the autonomous authority decided here.
