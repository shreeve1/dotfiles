#!/usr/bin/env python3
import json
import sys

session_id = "fake-session"
prompt_id = None

def send(value):
    sys.stdout.write(json.dumps(value) + "\n")
    sys.stdout.flush()

for line in sys.stdin:
    message = json.loads(line)
    method = message.get("method")
    request_id = message.get("id")
    if method == "initialize":
        send({"jsonrpc": "2.0", "id": request_id, "result": {"protocolVersion": 1}})
    elif method == "session/new":
        send({"jsonrpc": "2.0", "id": request_id, "result": {"sessionId": session_id}})
    elif method in {"session/set_mode", "session/set_model"}:
        send({"jsonrpc": "2.0", "id": request_id, "result": {}})
    elif method == "session/list":
        send({"jsonrpc": "2.0", "id": request_id, "result": {"sessions": [{"sessionId": session_id, "title": "Fake conversation", "cwd": "/tmp", "updatedAt": "now"}]}})
    elif method == "session/prompt":
        prompt_id = request_id
        send({"jsonrpc": "2.0", "method": "session/update", "params": {"sessionId": session_id, "update": {"sessionUpdate": "agent_message_chunk", "content": {"type": "text", "text": "Hello "}}}})
        send({"jsonrpc": "2.0", "method": "session/update", "params": {"sessionId": session_id, "update": {"sessionUpdate": "tool_call", "toolCallId": "tool-1", "title": "Run test", "status": "in_progress"}}})
        send({"jsonrpc": "2.0", "id": 900, "method": "session/request_permission", "params": {"sessionId": session_id, "toolCall": {"toolCallId": "permission-1", "title": "Allow test command", "rawInput": {"command": "true"}}, "options": [{"optionId": "allow_once", "kind": "allow_once", "name": "Allow once"}, {"optionId": "deny", "kind": "reject_once", "name": "Deny"}]}})
    elif request_id == 900 and prompt_id is not None:
        send({"jsonrpc": "2.0", "method": "session/update", "params": {"sessionId": session_id, "update": {"sessionUpdate": "tool_call_update", "toolCallId": "tool-1", "title": "Run test", "status": "completed"}}})
        send({"jsonrpc": "2.0", "method": "session/update", "params": {"sessionId": session_id, "update": {"sessionUpdate": "agent_message_chunk", "content": {"type": "text", "text": "world"}}}})
        send({"jsonrpc": "2.0", "id": prompt_id, "result": {"stopReason": "end_turn"}})
        prompt_id = None
