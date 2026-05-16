export const BATTLEFIELD_PROFILE_IDS = {
  STANDARD_200_6_15_MM: 'standard-200-6-15mm',
};

export const STANDARD_200_BATTLEFIELD_PROFILE = {
  id: BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM,
  formatId: 'standard-200',
  label: 'Standard 200 / 6-15 mm',
  widthUd: 30,
  heightUd: 20,
  widthCm: 120,
  heightCm: 80,
  udInCm: 4,
};

const BATTLEFIELD_PROFILES = {
  [BATTLEFIELD_PROFILE_IDS.STANDARD_200_6_15_MM]: STANDARD_200_BATTLEFIELD_PROFILE,
};

export function getBattlefieldProfile(profileId) {
  return BATTLEFIELD_PROFILES[profileId] ?? STANDARD_200_BATTLEFIELD_PROFILE;
}

export function convertUdToCm(valueUd, profile = STANDARD_200_BATTLEFIELD_PROFILE) {
  return valueUd * profile.udInCm;
}

export function convertCmToUd(valueCm, profile = STANDARD_200_BATTLEFIELD_PROFILE) {
  return valueCm / profile.udInCm;
}
