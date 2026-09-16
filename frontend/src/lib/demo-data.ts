import type { AacSymbol, Comparison, UserSettings } from '@/types';

function emojiSvg(emoji: string, background = '#f4f4f7') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="18" fill="${background}"/><text x="60" y="69" text-anchor="middle" font-size="54">${emoji}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function symbol(
  id: number,
  category: string,
  text: string,
  emoji: string,
  colorHex: string,
  options: Partial<Pick<AacSymbol, 'favorite' | 'importantWord' | 'emergency' | 'sortOrder'>> = {},
): AacSymbol {
  return {
    id,
    assetName: `demo-${id}`,
    category,
    canonicalText: text,
    displayText: text,
    ttsText: text,
    userAlias: null,
    imageUrl: emojiSvg(emoji),
    colorHex,
    emergency: options.emergency ?? false,
    favorite: options.favorite ?? false,
    importantWord: options.importantWord ?? false,
    sortOrder: options.sortOrder ?? id,
  };
}

export const DEMO_SETTINGS: UserSettings = {
  userId: 1,
  name: '말모아 사용자',
  birthDate: null,
  relationshipType: 'SIBLING',
  emergencyContact: null,
  gridSize: 'GRID_4X4',
  voiceType: 'CHILD_MALE',
  speechRate: 1,
};

export const DEMO_SYMBOLS: AacSymbol[] = [
  symbol(9001, '음식', '물', '💧', '#9ed9ff', { favorite: true, importantWord: true, sortOrder: 1 }),
  symbol(9002, '음식', '밥', '🍚', '#ffd796', { favorite: true, sortOrder: 2 }),
  symbol(9003, '사람', '엄마', '👩', '#f8b9d4', { favorite: true, sortOrder: 3 }),
  symbol(9004, '사람', '선생님', '🧑‍🏫', '#c9c2ff', { sortOrder: 4 }),
  symbol(9005, '장소', '집', '🏠', '#b8e6b2', { sortOrder: 5 }),
  symbol(9006, '장소', '화장실', '🚻', '#b9d7ff', { importantWord: true, sortOrder: 6 }),
  symbol(9007, '신체', '배', '🫃', '#ffd0b8', { sortOrder: 7 }),
  symbol(9008, '신체', '머리', '🙂', '#ffe2a9', { sortOrder: 8 }),
  symbol(9009, '행동', '주세요', '🤲', '#c7edc9', { favorite: true, importantWord: true, sortOrder: 9 }),
  symbol(9010, '행동', '가요', '🚶', '#cfe6ff', { sortOrder: 10 }),
  symbol(9011, '감정', '좋아요', '😊', '#fff0a8', { favorite: true, sortOrder: 11 }),
  symbol(9012, '감정', '싫어요', '🙅', '#ffc0c0', { sortOrder: 12 }),
  symbol(9013, '설명', '아파요', '🤕', '#ffb9b9', { importantWord: true, sortOrder: 13 }),
  symbol(9014, '대화', '도와주세요', '🆘', '#ffb2b2', { importantWord: true, sortOrder: 14 }),
  symbol(9015, '문법', '더', '➕', '#d6d6f5', { sortOrder: 15 }),
  symbol(9016, '대화', '그만', '✋', '#d7d7dc', { sortOrder: 16 }),
];

export const DEMO_EMERGENCY: AacSymbol[] = [
  symbol(9101, '긴급어', '도와주세요', '🆘', '#ff9f9f', { emergency: true, importantWord: true }),
  symbol(9102, '긴급어', '아파요', '🤕', '#ffb3b3', { emergency: true, importantWord: true }),
  symbol(9103, '긴급어', '119', '🚑', '#ffd1d1', { emergency: true, importantWord: true }),
];

function candidate(sentence: string, personalWordCount = 1) {
  return {
    sentence,
    eojeolCount: sentence.trim().split(/\s+/).filter(Boolean).length,
    personalWordCount,
    valid: true,
    violations: [],
  };
}

function recommendations(words: string[]) {
  const joined = words.join(' ');
  if (joined.includes('물')) {
    return ['물 주세요', '차가운 물 주세요', '목말라요 물 주세요'];
  }
  if (joined.includes('화장실')) {
    return ['화장실 가요', '화장실 가고 싶어요', '화장실 같이 가 주세요'];
  }
  if (joined.includes('아파요') || joined.includes('배')) {
    return ['배가 아파요', '배가 많이 아파요', '배가 아파요 도와주세요'];
  }
  if (joined.includes('밥')) {
    return ['밥 주세요', '밥 먹고 싶어요', '밥 더 주세요'];
  }
  if (joined.includes('엄마')) {
    return ['엄마 보고 싶어요', '엄마 불러 주세요', '엄마랑 같이 가요'];
  }
  const base = words.length ? joined : '도와주세요';
  return [base, `${base} 주세요`, `${base} 하고 싶어요`];
}

export function buildDemoComparison(words: string[]): Comparison {
  const sentences = recommendations(words);
  const personalizedCandidates = sentences.map((sentence, index) => candidate(sentence, Math.max(1, words.length - index)));
  const baselineCandidates = [
    candidate(words.join(' ') || '도와주세요', 0),
    candidate(`${words.join(' ') || '도와주세요'} 부탁해요`, 0),
    candidate(`${words.join(' ') || '도와주세요'} 해주세요`, 0),
  ];

  return {
    baseline: {
      userId: 1,
      mode: 'baseline',
      source: 'fallback',
      situation: 'AAC 홈 체험',
      personalWords: [],
      maxEojeol: 7,
      candidates: baselineCandidates,
    },
    personalized: {
      userId: 1,
      mode: 'personalized',
      source: 'fallback',
      situation: 'AAC 홈 체험',
      personalWords: words,
      maxEojeol: 4,
      candidates: personalizedCandidates,
    },
  };
}

export const DEMO_SCENARIOS = [
  { label: '물을 마시고 싶어요', words: ['물', '주세요'] },
  { label: '배가 아파요', words: ['배', '아파요'] },
  { label: '화장실에 가고 싶어요', words: ['화장실', '가요'] },
] as const;
