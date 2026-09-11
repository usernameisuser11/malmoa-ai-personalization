'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCcw, RotateCcw, Sparkles, Volume2, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { AacSymbol, Comparison, UserSettings } from '@/types';

const CATEGORY_ITEMS = [
  { key: '추천', icon: '✨' },
  { key: '최근', icon: '◷' },
  { key: '즐겨찾기', icon: '★' },
  { key: '긴급어', icon: '⚠' },
  { key: '사람', icon: '🧍' },
  { key: '음식', icon: '🍚' },
  { key: '장소', icon: '⌖' },
  { key: '신체', icon: '◉' },
  { key: '행동', icon: '🏃' },
  { key: '감정', icon: '☺' },
  { key: '설명', icon: '한' },
  { key: '대화', icon: '💬' },
  { key: '문법', icon: '＋' },
] as const;

const QUICK_RESPONSES = ['네', '아니요', '잠깐만요', '몰라요', '뭐예요'];

function defaultSettings(userId: number): UserSettings {
  return {
    userId,
    name: '사용자',
    birthDate: null,
    relationshipType: null,
    emergencyContact: null,
    gridSize: 'GRID_4X4',
    voiceType: 'CHILD_MALE',
    speechRate: 1,
  };
}

function MalmoaLogo() {
  return (
    <Link href="/" className="m2-logo" aria-label="말모아 시작 화면">
      <span>Mal</span><span>Moa</span>
    </Link>
  );
}

export function AacLab({ userId = 1 }: { userId?: number }) {
  const [settings, setSettings] = useState<UserSettings>(() => defaultSettings(userId));
  const [symbols, setSymbols] = useState<AacSymbol[]>([]);
  const [emergency, setEmergency] = useState<AacSymbol[]>([]);
  const [selected, setSelected] = useState<AacSymbol[]>([]);
  const [category, setCategory] = useState('추천');
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setSettings(defaultSettings(userId));
    setSymbols([]);
    setEmergency([]);
    setSelected([]);
    setComparison(null);

    (async () => {
      try {
        const [userSettings, userSymbols, emergencySymbols] = await Promise.all([
          api.getUserSettings(userId),
          api.getSymbols(userId),
          api.getEmergencySymbols(userId),
        ]);
        if (cancelled) return;
        setSettings(userSettings);
        setSymbols(userSymbols);
        setEmergency(emergencySymbols);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'AAC 데이터를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const allNormalSymbols = useMemo(
    () => symbols.filter(symbol => !symbol.emergency),
    [symbols],
  );

  const filtered = useMemo(() => {
    if (category === '추천') {
      const preferred = allNormalSymbols.filter(symbol => symbol.favorite || symbol.importantWord);
      const rest = allNormalSymbols.filter(symbol => !symbol.favorite && !symbol.importantWord);
      return [...preferred, ...rest].slice(0, 20);
    }
    if (category === '최근') {
      return [...allNormalSymbols]
        .sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER))
        .slice(0, 20);
    }
    if (category === '즐겨찾기') return allNormalSymbols.filter(symbol => symbol.favorite);
    if (category === '긴급어') return emergency;
    return allNormalSymbols.filter(symbol => symbol.category === category);
  }, [allNormalSymbols, category, emergency]);

  const columns = settings.gridSize === 'GRID_2X2' ? 2 : settings.gridSize === 'GRID_3X3' ? 3 : 4;
  const selectedWords = selected.map(item => item.userAlias || item.displayText);

  function toggle(symbol: AacSymbol) {
    if (symbol.emergency) {
      void speak(symbol.ttsText, [symbol.displayText]);
      return;
    }
    setComparison(null);
    setSelected(current => current.some(item => item.id === symbol.id)
      ? current.filter(item => item.id !== symbol.id)
      : current.length >= 3 ? current : [...current, symbol]);
  }

  async function generate() {
    if (selected.length === 0) {
      setError('AI 문장을 만들려면 상징을 하나 이상 골라주세요.');
      return;
    }
    setGenerating(true);
    setError('');
    setComparison(null);
    try {
      const result = await api.compare({
        userId,
        situation: 'AAC 홈',
        intent: selectedWords.join(' '),
        selectedWords,
      });
      setComparison(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 문장 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  }

  async function speak(sentence: string, words: string[] = []) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = 'ko-KR';
      utterance.rate = settings.speechRate;
      utterance.pitch = settings.voiceType === 'CHILD_FEMALE' ? 1.35 : 1.15;
      window.speechSynthesis.speak(utterance);
    }
    const usageWords = words.length ? words : sentence.replace(/[.!?]/g, '').split(/\s+/).filter(Boolean);
    try {
      await api.recordUsage(userId, usageWords);
    } catch {
      // 발화는 사용 기록 저장과 무관하게 계속 동작한다.
    }
  }

  async function choosePersonalized(sentence: string) {
    await speak(sentence, selectedWords);
    try {
      await api.markRecommendationSelected(userId, 'personalized', sentence);
    } catch {
      // 선택 기록 실패가 AAC 발화를 막지 않도록 한다.
    }
  }

  function reset() {
    setSelected([]);
    setComparison(null);
    setError('');
  }

  if (loading) {
    return (
      <main className="m2-loading-screen">
        <div className="m2-spinner" />
        <strong>AAC 데이터를 불러오고 있어요</strong>
        <span>잠시만 기다려 주세요</span>
      </main>
    );
  }

  return (
    <main className="m2-aac">
      <header className="m2-aac__header">
        <MalmoaLogo />
        <nav className="m2-aac__nav" aria-label="사용자 메뉴">
          <span className="is-active">홈</span>
          <Link href={`/guardian?userId=${userId}`}>설정</Link>
        </nav>
        <button className="m2-emergency" onClick={() => setCategory('긴급어')}>긴급</button>
      </header>

      {error ? <div className="m2-inline-error">{error}</div> : null}

      <div className="m2-aac__workspace">
        <aside className="m2-category-rail" aria-label="AAC 카테고리">
          {CATEGORY_ITEMS.map(item => (
            <button
              type="button"
              key={item.key}
              className={category === item.key ? `m2-category is-active m2-category--${item.key}` : `m2-category m2-category--${item.key}`}
              onClick={() => setCategory(item.key)}
            >
              <span aria-hidden="true">{item.icon}</span>
              <strong>{item.key}</strong>
            </button>
          ))}
        </aside>

        <section className="m2-symbol-area" aria-label={`${category} 상징`}>
          {selected.length > 0 ? <div className="m2-limit-banner">⚠ 상징은 최대 3개까지 선택할 수 있어요</div> : null}
          <div className={`m2-symbol-grid m2-symbol-grid--${columns}`}>
            {filtered.length === 0 ? (
              <div className="m2-empty-grid">이 카테고리에 표시할 상징이 아직 없어요.</div>
            ) : filtered.map(symbol => {
              const isSelected = selected.some(item => item.id === symbol.id);
              return (
                <button
                  type="button"
                  key={symbol.id}
                  className={isSelected ? 'm2-symbol-card is-selected' : 'm2-symbol-card'}
                  style={{ '--symbol-color': symbol.colorHex } as React.CSSProperties}
                  onClick={() => toggle(symbol)}
                >
                  <CardVisual symbol={symbol}/>
                  <span>{symbol.userAlias || symbol.displayText}</span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="m2-selection-panel" aria-label="선택한 상징">
          {selected.length === 0 ? (
            <div className="m2-selection-empty">상징을 골라 보세요</div>
          ) : (
            <div className="m2-selected-grid">
              {selected.map(symbol => (
                <button type="button" key={symbol.id} onClick={() => toggle(symbol)}>
                  <CardVisual symbol={symbol} compact/>
                  <span>{symbol.userAlias || symbol.displayText}</span>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>

      <div className="m2-aac__tools">
        <button type="button" className="m2-tool m2-tool--reset" onClick={reset}><RotateCcw size={18}/>초기화</button>
        <button type="button" className="m2-tool m2-tool--ai" disabled={selected.length === 0 || generating} onClick={() => void generate()}><Sparkles size={18}/>{generating ? '만드는 중' : 'AI 변환'}</button>
        <button type="button" className="m2-tool m2-tool--speak" disabled={selected.length === 0} onClick={() => void speak(selectedWords.join(' '), selectedWords)}><Volume2 size={19}/>말하기</button>
      </div>

      <footer className="m2-quick-bar" aria-label="빠른 대화">
        {QUICK_RESPONSES.map(text => <button type="button" key={text} onClick={() => void speak(text, [text])}>{text}</button>)}
      </footer>

      {generating ? (
        <div className="m2-modal-backdrop" role="dialog" aria-modal="true" aria-label="AI 추천 문장 생성 중">
          <div className="m2-ai-modal m2-ai-modal--loading">
            <div className="m2-ai-modal__head"><h2>AI 추천 문장</h2><button type="button" onClick={() => setGenerating(false)}><X size={22}/></button></div>
            <div className="m2-ai-loading"><div className="m2-spinner"/><strong>AI가 문장을 만들고 있어요...</strong></div>
          </div>
        </div>
      ) : null}

      {comparison ? (
        <div className="m2-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ai-recommend-title">
          <div className="m2-ai-modal">
            <div className="m2-ai-modal__head">
              <h2 id="ai-recommend-title">AI 추천 문장</h2>
              <div>
                <button type="button" className="m2-regenerate" onClick={() => void generate()}><RefreshCcw size={18}/>다시 만들기</button>
                <button type="button" className="m2-modal-close" aria-label="닫기" onClick={() => setComparison(null)}><X size={22}/></button>
              </div>
            </div>
            <div className="m2-ai-list">
              {comparison.personalized.candidates.slice(0, 3).map((candidate, index) => (
                <div className="m2-ai-candidate" key={`${candidate.sentence}-${index}`}>
                  <span className="m2-ai-number">{index + 1}</span>
                  <strong>{candidate.sentence}</strong>
                  <button type="button" onClick={() => void choosePersonalized(candidate.sentence)}><Volume2 size={28}/><span>말하기</span></button>
                </div>
              ))}
            </div>
            <p className="m2-ai-footnote">사용자 의사소통 수준과 개인 어휘를 반영한 추천 결과예요.</p>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function CardVisual({ symbol, compact = false }: { symbol: AacSymbol; compact?: boolean }) {
  if (symbol.imageUrl) return <img className={compact ? 'm2-symbol-image is-compact' : 'm2-symbol-image'} src={symbol.imageUrl} alt=""/>;
  return <span className={compact ? 'm2-placeholder is-compact' : 'm2-placeholder'} aria-hidden="true">×</span>;
}
