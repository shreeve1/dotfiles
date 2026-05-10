import { existsSync, readFileSync } from "fs";
import { join } from "path";

const HOME = process.env.HOME!;
const SETTINGS_PATH = join(HOME, ".config", "opencode", "opencode.json");

const DEFAULT_IDENTITY = {
  name: "PAI",
  fullName: "Personal AI",
  displayName: "PAI",
  mainDAVoiceID: "",
  color: "#3B82F6",
};

const DEFAULT_PRINCIPAL = {
  name: "User",
  pronunciation: "",
  timezone: "UTC",
};

export interface VoiceProsody {
  stability: number;
  similarity_boost: number;
  style: number;
  speed: number;
  use_speaker_boost: boolean;
}

export interface VoicePersonality {
  baseVoice: string;
  enthusiasm: number;
  energy: number;
  expressiveness: number;
  resilience: number;
  composure: number;
  optimism: number;
  warmth: number;
  formality: number;
  directness: number;
  precision: number;
  curiosity: number;
  playfulness: number;
}

export interface Identity {
  name: string;
  fullName: string;
  displayName: string;
  mainDAVoiceID: string;
  color: string;
  voice?: VoiceProsody;
  personality?: VoicePersonality;
}

export interface Principal {
  name: string;
  pronunciation: string;
  timezone: string;
}

export interface Settings {
  daidentity?: Partial<Identity>;
  principal?: Partial<Principal>;
  env?: Record<string, string>;
  [key: string]: unknown;
}

let cachedSettings: Settings | null = null;

function loadSettings(): Settings {
  if (cachedSettings) return cachedSettings;

  try {
    if (!existsSync(SETTINGS_PATH)) {
      cachedSettings = {};
      return cachedSettings;
    }

    cachedSettings = JSON.parse(readFileSync(SETTINGS_PATH, "utf-8"));
    return cachedSettings!;
  } catch {
    cachedSettings = {};
    return cachedSettings;
  }
}

export function getIdentity(): Identity {
  const settings = loadSettings();
  const daidentity = settings.daidentity || {};
  const envDA = settings.env?.DA;
  const voices = (daidentity as any).voices || {};
  const voiceConfig = voices.main || (daidentity as any).voice;

  return {
    name: daidentity.name || envDA || DEFAULT_IDENTITY.name,
    fullName: daidentity.fullName || daidentity.name || envDA || DEFAULT_IDENTITY.fullName,
    displayName: daidentity.displayName || daidentity.name || envDA || DEFAULT_IDENTITY.displayName,
    mainDAVoiceID: voiceConfig?.voiceId || (daidentity as any).voiceId || daidentity.mainDAVoiceID || DEFAULT_IDENTITY.mainDAVoiceID,
    color: daidentity.color || DEFAULT_IDENTITY.color,
    voice: voiceConfig as VoiceProsody | undefined,
    personality: (daidentity as any).personality as VoicePersonality | undefined,
  };
}

export function getPrincipal(): Principal {
  const settings = loadSettings();
  const principal = settings.principal || {};
  const envPrincipal = settings.env?.PRINCIPAL;

  return {
    name: principal.name || envPrincipal || DEFAULT_PRINCIPAL.name,
    pronunciation: principal.pronunciation || DEFAULT_PRINCIPAL.pronunciation,
    timezone: principal.timezone || DEFAULT_PRINCIPAL.timezone,
  };
}

export function clearCache(): void {
  cachedSettings = null;
}

export function getDAName(): string {
  return getIdentity().name;
}

export function getPrincipalName(): string {
  return getPrincipal().name;
}

export function getVoiceId(): string {
  return getIdentity().mainDAVoiceID;
}

export function getSettings(): Settings {
  return loadSettings();
}

export function getDefaultIdentity(): Identity {
  return { ...DEFAULT_IDENTITY };
}

export function getDefaultPrincipal(): Principal {
  return { ...DEFAULT_PRINCIPAL };
}

export function getAlgorithmVoice(): { voiceId: string; voiceName: string; stability: number; similarity_boost: number; style: number; speed: number; use_speaker_boost: boolean; volume?: number } | null {
  const settings = loadSettings();
  const voices = (settings.daidentity as any)?.voices;
  if (!voices?.algorithm?.voiceId) return null;
  return voices.algorithm;
}

export function getVoiceProsody(): VoiceProsody | undefined {
  return getIdentity().voice;
}

export function getVoicePersonality(): VoicePersonality | undefined {
  return getIdentity().personality;
}
