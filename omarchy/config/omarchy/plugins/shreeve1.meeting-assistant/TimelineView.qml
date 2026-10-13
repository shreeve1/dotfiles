import QtQuick
import QtQuick.Layouts
import qs.Commons
import qs.Ui

// The Timeline: Research Cards, dividers, your messages, Ask replies, tool
// lines and error lines in one scrolling list. It scrolls inside whatever size
// it is given and never asks for more, so streaming text cannot resize the Overlay.
Item {
  id: root

  required property var assistant

  readonly property color textColor: Color.notifications.text
  readonly property color bodyColor: Qt.darker(textColor, 1.15)
  readonly property color dimColor: Qt.darker(textColor, 1.4)
  readonly property int rowGap: Style.space(8)

  // Stay pinned to the newest line until the user scrolls away from the end.
  property bool follow: true

  function jumpToEnd() {
    follow = true
    list.positionViewAtEnd()
  }

  ListView {
    id: list
    anchors.fill: parent
    model: root.assistant.timeline
    spacing: root.rowGap
    clip: true
    boundsBehavior: Flickable.StopAtBounds

    onMovementStarted: root.follow = false
    onMovementEnded: root.follow = list.atYEnd
    onContentHeightChanged: if (root.follow) Qt.callLater(list.positionViewAtEnd)
    onCountChanged: if (root.follow) Qt.callLater(list.positionViewAtEnd)

    delegate: Item {
      id: row
      required property var model

      width: ListView.view ? ListView.view.width : 0
      height: content.height

      Loader {
        id: content
        width: row.width
        sourceComponent: row.model.kind === "card" ? cardComponent
          : row.model.kind === "divider" ? dividerComponent
          : row.model.kind === "user" ? userComponent
          : row.model.kind === "reply" ? replyComponent
          : row.model.kind === "tool" ? toolComponent
          : row.model.kind === "error" ? errorComponent
          : null
      }

      Component {
        id: cardComponent

        CardView {
          question: row.model.question
          answer: row.model.answer
          sources: JSON.parse(row.model.sourcesJson)
          lagMs: row.model.lagMs < 0 ? null : row.model.lagMs
          // CardView fades out at expiresAt; Timeline cards never fade. The
          // value stays inside the 32-bit millisecond range of its pause animation.
          expiresAt: Date.now() + 1000000000
        }
      }

      Component {
        id: dividerComponent

        Item {
          implicitHeight: dividerRow.implicitHeight

          RowLayout {
            id: dividerRow
            anchors.left: parent.left
            anchors.right: parent.right
            spacing: Style.space(8)

            Rectangle {
              Layout.fillWidth: true
              Layout.preferredHeight: 1
              color: root.dimColor
              opacity: 0.6
            }

            Text {
              textFormat: Text.PlainText
              text: row.model.event === "meeting_start" ? "Meeting started" : "Meeting ended"
              font.family: Style.font.family
              font.pixelSize: Style.font.caption
              color: root.dimColor
            }

            Rectangle {
              Layout.fillWidth: true
              Layout.preferredHeight: 1
              color: root.dimColor
              opacity: 0.6
            }
          }
        }
      }

      Component {
        id: userComponent

        Rectangle {
          implicitHeight: userColumn.implicitHeight + Style.space(16)
          radius: Style.cornerRadius
          color: Qt.alpha(Color.accent, 0.14)
          opacity: row.model.queued ? 0.6 : 1

          ColumnLayout {
            id: userColumn
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.verticalCenter: parent.verticalCenter
            anchors.leftMargin: Style.space(10)
            anchors.rightMargin: Style.space(10)
            spacing: Style.space(2)

            Text {
              textFormat: Text.PlainText
              Layout.fillWidth: true
              text: row.model.text
              font.family: Style.font.family
              font.pixelSize: Style.font.body
              color: root.textColor
              wrapMode: Text.Wrap
            }

            Text {
              textFormat: Text.PlainText
              visible: row.model.queued
              text: "queued"
              font.family: Style.font.family
              font.pixelSize: Style.font.caption
              color: root.dimColor
            }
          }
        }
      }

      Component {
        id: replyComponent

        Item {
          id: replyRoot
          readonly property string note: row.model.status === "aborted" ? "Stopped"
            : row.model.status === "error" ? "The reply failed."
            : row.model.status === "no_response" ? "No response from the Ask agent."
            : ""

          implicitHeight: replyColumn.implicitHeight

          ColumnLayout {
            id: replyColumn
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.leftMargin: Style.space(2)
            anchors.rightMargin: Style.space(2)
            spacing: Style.space(4)

            Text {
              textFormat: Text.PlainText
              Layout.fillWidth: true
              visible: row.model.text !== ""
              text: row.model.text
              font.family: Style.font.family
              font.pixelSize: Style.font.body
              color: root.bodyColor
              wrapMode: Text.Wrap
            }

            Text {
              textFormat: Text.PlainText
              Layout.fillWidth: true
              visible: replyRoot.note !== ""
              text: replyRoot.note
              font.family: Style.font.family
              font.pixelSize: Style.font.caption
              color: row.model.status === "aborted" ? root.dimColor : Color.urgent
              wrapMode: Text.Wrap
            }

            Button {
              visible: row.model.status === "no_response" && root.assistant.askState === "busy"
              text: "Stop"
              bordered: true
              fontSize: Style.font.bodySmall
              onClicked: root.assistant.stopAsk()
            }
          }
        }
      }

      Component {
        id: toolComponent

        Text {
          textFormat: Text.PlainText
          leftPadding: Style.space(2)
          text: "· " + row.model.toolName + (row.model.phase === "end" ? " done" : " running")
          font.family: Style.font.family
          font.pixelSize: Style.font.caption
          color: root.dimColor
          maximumLineCount: 1
          elide: Text.ElideRight
          opacity: 0.8
        }
      }

      Component {
        id: errorComponent

        BorderSurface {
          id: errorRoot
          readonly property bool canRetry: row.model.retry && row.model.entryId === root.assistant.retryEntryId

          implicitHeight: errorColumn.implicitHeight + Style.space(16)
          radius: Style.cornerRadius
          color: Qt.alpha(Color.urgent, 0.14)
          borderSpec: Border.flat(Color.urgent, Math.max(1, Style.space(1)))

          ColumnLayout {
            id: errorColumn
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.verticalCenter: parent.verticalCenter
            anchors.leftMargin: Style.space(10)
            anchors.rightMargin: Style.space(10)
            spacing: Style.space(4)

            Text {
              textFormat: Text.PlainText
              Layout.fillWidth: true
              text: row.model.message
              font.family: Style.font.family
              font.pixelSize: Style.font.body
              color: Color.urgent
              wrapMode: Text.Wrap
            }

            Text {
              textFormat: Text.PlainText
              Layout.fillWidth: true
              visible: errorRoot.canRetry && row.model.retryPreview !== ""
              text: row.model.retryPreview
              font.family: Style.font.family
              font.pixelSize: Style.font.caption
              color: root.dimColor
              wrapMode: Text.Wrap
            }

            Button {
              visible: errorRoot.canRetry
              text: "Retry"
              bordered: true
              fontSize: Style.font.bodySmall
              onClicked: root.assistant.retryAsk()
            }
          }
        }
      }
    }
  }

  Text {
    textFormat: Text.PlainText
    anchors.centerIn: parent
    visible: list.count === 0
    text: "Type a question and press Enter."
    font.family: Style.font.family
    font.pixelSize: Style.font.body
    color: root.dimColor
  }

  Rectangle {
    visible: list.contentHeight > list.height
    width: Math.max(2, Style.space(3))
    radius: width / 2
    anchors.right: parent.right
    y: list.height * list.visibleArea.yPosition
    height: list.height * list.visibleArea.heightRatio
    color: root.dimColor
    opacity: 0.6
  }
}
