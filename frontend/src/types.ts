export type CommunicationProfile = {
  userId: number;
  age: number | null;
  receptiveMaxEojeol: number;
  expressiveMaxEojeol: number;
  vocabularyLevel: string;
  allowAbstractLanguage: boolean;
  allowCausalExpression: boolean;
  notes: string | null;
};

export type AacSymbol = {
  id: number;
  assetName: string;
  category: string;
  canonicalText: string;
  displayText: string;
  ttsText: string;
  userAlias: string | null;
  imageUrl: string | null;
  colorHex: string;
  emergency: boolean;
  favorite: boolean;
  importantWord: boolean;
  sortOrder: number | null;
};

export type Candidate = {
  sentence: string;
  eojeolCount: number;
  personalWordCount: number;
  valid: boolean;
  violations: string[];
};

export type RecommendationResult = {
  userId: number;
  mode: 'baseline' | 'personalized';
  situation: string;
  personalWords: string[];
  maxEojeol: number | null;
  candidates: Candidate[];
};

export type Comparison = {
  baseline: RecommendationResult;
  personalized: RecommendationResult;
};
