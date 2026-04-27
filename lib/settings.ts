import { cache } from 'react';
import prisma from './prisma';
import { DEFAULT_SETTINGS, SettingKey } from './defaultSettings';


export const getSettings = cache(async () => {
  const dbSettings = await prisma.systemSetting.findMany();

  const settings: Record<string, string> = { ...DEFAULT_SETTINGS };

  dbSettings.forEach(s => {
    settings[s.key] = s.value;
  });

  return settings as Record<SettingKey, string>;
});

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
}
