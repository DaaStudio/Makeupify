export enum Language {
  EN = 'English',
  TR = 'Türkçe',
  ES = 'Español',
  PT = 'Português',
  DE = 'Deutsch',
  FR = 'Français',
  JP = '日本語',
  KO = '한국어',
  AR = 'العربية'
}

export enum Gender {
  FEMALE = 'female',
  MALE = 'male'
}

export enum MakeupMethod {
  PRESET = 'preset',
  TEXT = 'text',
  TRANSFER = 'transfer'
}

export interface Translation {
  title: string;
  subtitle: string;
  uploadStep: string;
  uploadDesc: string;
  genderStep: string;
  male: string;
  female: string;
  methodStep: string;
  methodPreset: string;
  methodText: string;
  methodTransfer: string;
  methodTransferDesc: string;
  generate: string;
  generating: string;
  error: string;
  retry: string;
  download: string;
  back: string;
  startOver: string;
  textPlaceholder: string;
  transferPlaceholder: string;
  recommendationTitle: string;
  recommendationBody: string;
  adModalTitle: string;
  adModalBody: string;
  yes: string;
  no: string;
  adWatching: string;
  quickTagsLabel: string;
  presets: {
    natural: string;
    glam: string;
    gothic: string;
    bridal: string;
    editorial: string;
    grooming: string;
    kpop: string;
    punk: string;
    acne: string; // New
    wrinkle: string; // New
    smooth: string; // New
  };
  tags: {
    redLipstick: string;
    pinkBlush: string;
    catEye: string;
    contour: string;
    foundation: string;
    smokeyEye: string;
    highlighter: string;
  }
}

export type Translations = Record<Language, Translation>;

export interface Preset {
  id: string;
  labelKey: keyof Translation['presets'];
  prompt: string;
  gender: Gender[];
  category?: 'style' | 'retouch';
}

export interface QuickTag {
  id: string;
  labelKey: keyof Translation['tags'];
  value: string;
}
