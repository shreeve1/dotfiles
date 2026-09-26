import QtQuick
import Quickshell

ShellRoot {
  id: test
  property int stage: 0
  property int failures: 0
  function check(ok, message) {
    if (ok) console.log("ok", message)
    else { failures++; console.log("FAIL", message) }
  }

  AcpSession {
    id: session
    settings: ({ binary: Qt.resolvedUrl("fake_acp.py").toString().replace("file://", ""), mode: "default" })
  }

  AcpSession {
    id: failedSession
    settings: ({ binary: "/bin/false", mode: "default" })
  }

  Timer {
    interval: 25
    repeat: true
    running: true
    onTriggered: {
      if (test.stage === 0) {
        test.check(session.newConversation("hello", "/tmp"), "starts a conversation")
        test.check(failedSession.newConversation("retry me", "/tmp"), "starts a failing conversation")
        test.stage = 1
      } else if (test.stage === 1 && session.approval) {
        test.check(session.approvalTitle() === "Allow test command", "shows ACP permission request")
        session.decide("allow_once")
        test.stage = 2
      } else if (test.stage === 2 && session.phase === "idle" && session.answer()) {
        test.check(session.answer() === "Hello world", "streams answer chunks")
        test.check(session.messages.some(function(item) { return item.role === "activity" && item.text.indexOf("Run test") === 0 }), "renders tool activity")
        test.stage = 3
      } else if (test.stage === 3 && session.recent.length === 1) {
        test.check(session.recent[0].title === "Fake conversation", "loads recent ACP sessions")
        test.check(failedSession.phase === "idle" && !!failedSession.error, "startup failure leaves the session recoverable")
        session.shutdown()
        failedSession.shutdown()
        console.log(test.failures ? "FAIL Hermes ACP session" : "PASS Hermes ACP session")
        Qt.quit()
        test.stage = 4
      }
    }
  }
  Timer { interval: 15000; running: true; onTriggered: { console.log("FAIL timeout", test.stage, session.phase, session.error, session.diagnostic); session.shutdown(); Qt.quit() } }
}
