#!/usr/bin/python3
import json, sys

def get_color_code(p):
    return "32" if p < 50 else "33" if p < 80 else "31"

def fmt(t):
    return f"{t/1000:.1f}K" if t >= 1000 else str(t)

def bar(p, w=16):
    filled = int(p/100*w)
    return "█" * filled + "░" * (w - filled)

data = json.loads(sys.stdin.read() or "{}")
c = data.get("context_window", {})
u = c.get("used_percentage", 0)
cur = c.get("current_usage", {})
m = data.get("model", {}).get("display_name", "")

# Line 1: Model, progress bar, percentage, totals matching exact format
# Format: [model] progress_bar % total_in input/output/cache (max:max_ctx)
line1_parts = []
if m:
    line1_parts.append(f"\033[36m[{m}]\033[0m")

line1_parts.append(f"\033[{get_color_code(u)}m{bar(u)}\033[0m")
line1_parts.append(f"\033[{get_color_code(u)}m{u:.0f}%\033[0m")

# Total input (cumulative)
line1_parts.append(f"\033[90m{fmt(c.get('total_input_tokens',0))}\033[0m")

# Current usage: input/output with cache if present
current_in = cur.get('input_tokens', 0)
current_out = cur.get('output_tokens', 0)
cache_creation = cur.get('cache_creation_input_tokens', 0)
cache_read = cur.get('cache_read_input_tokens', 0)

io_str = f"{fmt(current_in)}/{fmt(current_out)}"
if cache_creation > 0 or cache_read > 0:
    io_str += f"/{fmt(cache_creation)}/{fmt(cache_read)}"

line1_parts.append(f"\033[90m{io_str}\033[0m")

max_ctx = c.get('context_window_size', 200000)
line1_parts.append(f"\033[90m(max:{fmt(max_ctx)})\033[0m")

line1 = " ".join(line1_parts)

print(line1)
