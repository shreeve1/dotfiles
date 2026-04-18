/**
 * notifications.ts — Session timing + ntfy push + Telegram notifications
 *
 * Session timing is used by LoadContext.hook.ts to record session start.
 * ntfy push is available for hooks that need mobile/desktop notifications.
 * Telegram send is available for webhook-driven alerts.
 * notify() routes messages to one or more channels.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ============================================================================
// Session Timing
// ============================================================================

const SESSION_START_FILE = '/tmp/pai-session-start.txt';

export function recordSessionStart(): void {
  try { writeFileSync(SESSION_START_FILE, Date.now().toString()); } catch {}
}

export function getSessionDurationMinutes(): number {
  try {
    if (existsSync(SESSION_START_FILE)) {
      const startTime = parseInt(readFileSync(SESSION_START_FILE, 'utf-8'));
      return (Date.now() - startTime) / 1000 / 60;
    }
  } catch {}
  return 0;
}

// ============================================================================
// ntfy Push (fire-and-forget)
// ============================================================================

export type NotificationPriority = 'min' | 'low' | 'default' | 'high' | 'urgent';

export interface NotificationOptions {
  title?: string;
  priority?: NotificationPriority;
  tags?: string[];
}

function loadNtfyConfig(): { enabled: boolean; topic: string; server: string } {
  try {
    const paiDir = process.env.PAI_DIR || join(homedir(), '.claude');
    const settingsPath = join(paiDir, 'settings.json');
    if (!existsSync(settingsPath)) return { enabled: false, topic: '', server: 'ntfy.sh' };

    const raw = readFileSync(settingsPath, 'utf-8')
      .replace(/\$\{(\w+)\}/g, (_, key) => process.env[key] || '');
    const settings = JSON.parse(raw);
    const ntfy = settings.notifications?.ntfy;
    return {
      enabled: ntfy?.enabled ?? false,
      topic: ntfy?.topic ?? '',
      server: ntfy?.server ?? 'ntfy.sh',
    };
  } catch {
    return { enabled: false, topic: '', server: 'ntfy.sh' };
  }
}

export async function sendPush(
  message: string,
  options: NotificationOptions = {}
): Promise<boolean> {
  const config = loadNtfyConfig();
  if (!config.enabled || !config.topic) return false;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'text/plain' };
    if (options.title) headers['Title'] = options.title;
    if (options.priority) {
      const map: Record<NotificationPriority, string> = {
        min: '1', low: '2', default: '3', high: '4', urgent: '5',
      };
      headers['Priority'] = map[options.priority] || '3';
    }
    if (options.tags?.length) headers['Tags'] = options.tags.join(',');

    const response = await fetch(`https://${config.server}/${config.topic}`, {
      method: 'POST',
      headers,
      body: message,
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// Telegram (fire-and-forget)
// ============================================================================

function loadTelegramConfig(): { botToken: string; chatId: string } {
  try {
    const secretPath = join(homedir(), '.claude', 'secrets', 'telegram-env.sh');
    if (!existsSync(secretPath)) return { botToken: '', chatId: '' };
    const raw = readFileSync(secretPath, 'utf-8');
    let botToken = '';
    let chatId = '';
    for (const line of raw.split('\n')) {
      const tokenMatch = line.match(/^export\s+TELEGRAM_BOT_TOKEN="([^"]+)"/);
      if (tokenMatch) botToken = tokenMatch[1];
      const chatMatch = line.match(/^export\s+TELEGRAM_CHAT_ID="([^"]+)"/);
      if (chatMatch) chatId = chatMatch[1];
    }
    return { botToken, chatId };
  } catch {
    return { botToken: '', chatId: '' };
  }
}

export async function sendTelegram(
  message: string,
  chatIdOverride?: string
): Promise<boolean> {
  const { botToken, chatId } = loadTelegramConfig();
  const targetChat = chatIdOverride || chatId;
  if (!botToken || !targetChat) return false;

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChat,
        text: message,
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// Unified Notification Routing (fire-and-forget)
// ============================================================================

export function notify(channel: string, message: string): void {
  const channels = channel.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
  for (const ch of channels) {
    // Fire-and-forget: we intentionally do not await
    if (ch === 'ntfy') {
      sendPush(message).catch(() => {});
    } else if (ch === 'telegram') {
      sendTelegram(message).catch(() => {});
    }
  }
}
