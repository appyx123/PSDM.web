export const DEFAULT_SETTINGS = {
  APP_NAME: 'PSDM System',
  APP_LOGO: '',
  TARGET_POINTS: '100',
  SP_THRESHOLDS: JSON.stringify([50, 30, 15]), // Threshold for SP1, SP2, SP3
  ALPHA_MULTIPLIER: '2',
  ALPHA_MAX_PENALTY: '50', // Absolute maximum penalty (positive number representing reduction)
  POINT_RULES: JSON.stringify({
    EKSTERNAL: {
      TEPAT_WAKTU: 5,
      TERLAMBAT_SAH: 2,
      IZIN_SAKIT: 0,
      TERLAMBAT_NON_SAKTI: -2,
      PULANG_CEPAT: -3,
      ALPHA: -7
    },
    INTERNAL: {
      TEPAT_WAKTU: 3,
      TERLAMBAT_SAH: 1,
      IZIN_SAKIT: 0,
      TERLAMBAT_NON_SAKTI: -1,
      PULANG_CEPAT: -2,
      ALPHA: -5
    },
    KEPANITIAAN: {
      TEPAT_WAKTU: 2,
      TERLAMBAT_SAH: 1,
      IZIN_SAKIT: 0,
      TERLAMBAT_NON_SAKTI: -1,
      PULANG_CEPAT: -2,
      ALPHA: -3
    }
  })
};

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
