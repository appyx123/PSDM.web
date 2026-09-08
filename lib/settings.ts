import prisma from './prisma';
import { DEFAULT_SETTINGS, SettingKey } from './defaultSettings';

interface CachedSettings {
  data: Record<SettingKey, string>;
  expiresAt: number;
}

declare global {
  var __psdm_settings_cache: CachedSettings | undefined;
}

const SETTINGS_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function invalidateSettingsCache() {
  globalThis.__psdm_settings_cache = undefined;
}

export async function getSettings(): Promise<Record<SettingKey, string>> {
  const now = Date.now();
  if (globalThis.__psdm_settings_cache && globalThis.__psdm_settings_cache.expiresAt > now) {
    return globalThis.__psdm_settings_cache.data;
  }

  try {
    const dbSettings = await prisma.systemSetting.findMany();
    const settings: Record<string, string> = { ...DEFAULT_SETTINGS };

    dbSettings.forEach(s => {
      settings[s.key] = s.value;
    });

    const result = settings as Record<SettingKey, string>;
    globalThis.__psdm_settings_cache = {
      data: result,
      expiresAt: now + SETTINGS_CACHE_TTL_MS
    };

    return result;
  } catch (error) {
    console.warn('Failed to fetch settings from DB, falling back to cache or defaults:', error);
    if (globalThis.__psdm_settings_cache?.data) {
      return globalThis.__psdm_settings_cache.data;
    }
    return DEFAULT_SETTINGS as Record<SettingKey, string>;
  }
}

export async function getSetting(key: SettingKey): Promise<string> {
  const settings = await getSettings();
  return settings[key] || DEFAULT_SETTINGS[key];
}

export async function updateSetting(key: SettingKey, value: string, adminId: string) {
  const oldSetting = await prisma.systemSetting.findUnique({
    where: { key }
  });

  const oldValue = oldSetting ? oldSetting.value : DEFAULT_SETTINGS[key];

  await prisma.$transaction([
    prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    }),
    prisma.settingsAudit.create({
      data: {
        adminId,
        key,
        oldValue,
        newValue: value
      }
    })
  ]);

  // Immediately invalidate cache so all subsequent requests see the new value
  invalidateSettingsCache();
}
