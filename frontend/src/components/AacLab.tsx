'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Download, RefreshCcw, Sparkles, Volume2, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { AacSymbol, Comparison, RecommendationStats, UserSettings } from '@/types';

const CATEGORIES = ['전체', '사람', '음식', '장소', '신체', '행동', '감정', '설명', '대화', '문법'];
const emoji: Record<string, string> = {
  긴급어: '🆘', 사람: '👤', 음식: '🥤', 장소: '📍', 신체: '🖐️', 행동: '▶️', 감정: '🙂', 설명: '✨', 대화: '💬', 문법: '🔗',
};

function defaultSettings(userId: number): UserSettings {
  return {
    userId,
    name: '사용자',
    birthDate: null,
    relationshipType: null,
    emergencyContact: null,
    gridSize: 'GRID_3X3',
    voiceType: 'CHILD_MALE',
    speechRate: 1,
  };
}

export function AacLab({ userId = 1 }: { userId?: number }) {
  const [settings, setSettings] = useState<UserSettings>(() => defaultSettings(userId));
  const [symbols, setSymbols] = useState<AacSymbol[]>([]);
  const [emergency, setEmergency] = useState<AacSymbol[]>([]);
  const [selected, setSelected] = useState<AacSymbol[]>([]);
  const [category, setCategory] = useState('전체');
  const [situation, setSituation] = useState('학교');
  const [customSituation, setCustomSituation] = useState('');
  const [intent, setIntent] = useState('물을 마시고 싶다');
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [emergencyMode, setEmergencyMode] = useState(false);

  async function refreshStats() {
    try {
      setStats(await api.recommendationStats(userId));
    } catch {
      setStats(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setSettings(defaultSettings(userId));
    setSymbols([]);
    setEmergency([]);
    setSelected([]);
    setComparison(null);
    setStats(null);

    (async () => {
      try {
        const [userSettings, userSymbols, emergencySymbols, recommendationStats] = await Promise.all([
          api.getUserSettings(userId),
          api.getSymbols(userId),
          api.getEmergencySymbols(userId),
          api.recommendationStats(userId).catch(() => null),
        ]);
        if (cancelled) return;
        setSettings(userSettings);
        setSymbols(userSymbols);
        setEmergency(emergencySymbols);
        setStats(recommendationStats);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'AAC 데이터를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const filtered = useMemo(
    () => category === '전체'
      ? symbols.filter(symbol => !symbol.emergency)
      : symbols.filter(symbol => symbol.category === category && !symbol.emergency),
    [symbols, category],
  );
  const columns = settings.gridSize === 'GRID_2X2' ? 2 : settings.gridSize === 'GRID_4X4' ? 4 : 3;
  const actualSituation = situation === '직접 입력' ? (customSituation.trim() || '기타 상황') : situation;

  function toggle(symbol: AacSymbol) {
    setComparison(null);
    setSelected(current => current.some(item => item.id === symbol.id)
      ? current.filter(item => item.id !== symbol.id)
      : current.length >= 3 ? current : [...current, symbol]);
  }

  async function generate() {
    const normalizedIntent = intent.trim();
    if (!normalizedIntent && selected.length === 0) {
      setError('표현하려는 의도나 상징 카드를 하나 이상 입력해주세요.');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const result = await api.compare({
        userId,
        situation: actualSituation,
        intent: normalizedIntent,
        selectedWords: selected.map(symbol => symbol.userAlias || symbol.displayText),
      });
      setComparison(result);
      await refreshStats();
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
    const usageWords = words.length
      ? words
      : sentence.replace(/[.!?]/g, '').split(/\s+/).filter(Boolean);
    try {
      await api.recordUsage(userId, usageWords);
    } catch {
      // TTS itself should still work if usage logging temporarily fails.
    }
  }

  async function choose(mode: 'baseline' | 'personalized', sentence: string) {
    await speak(sentence, mode === 'personalized' ? selected.map(item => item.userAlias || item.displayText) : []);
    try {
      await api.markRecommendationSelected(userId, mode, sentence);
      await refreshStats();
    } catch {
      // Selection logging must not block communication.
    }
  }

  if (loading) return <main className="page"><p className="loading">AAC 데이터를 불러오는 중...</p></main>;

  const fallbackUsed = comparison && (comparison.baseline.source === 'fallback' || comparison.personalized.source === 'fallback');

  return (
    <main className="page">
      <div className="page-title">
        <div>
          <h1>{settings.name}님의 AAC</h1>
          <p>사용자 #{userId} · {columns}열 격자 · TTS {settings.speechRate.toFixed(1)}× · 같은 입력으로 일반 AI와 개인화 AI를 비교합니다.</p>
        </div>
        <div className="actions">
          <a className="secondary" href={api.experimentExportUrl(userId)}><Download size={16}/> 실험 CSV</a>
          <button className="emergency-toggle" onClick={() => setEmergencyMode(value => !value)}><AlertTriangle size={17}/> 긴급 모드</button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      {stats && <section className="comparison-stats"><StatsColumn title="일반 AI" stats={stats.baseline}/><StatsColumn title="개인화 AI" stats={stats.personalized} personalized/></section>}

      {emergencyMode && (
        <section className="panel emergency-panel">
          <div className="page-title">
            <div><h2>긴급 표현</h2><p className="panel-desc">AI와 무관하게 고정 제공되며 발화 시 보호자 알림에 기록됩니다.</p></div>
            <button className="secondary" onClick={() => setEmergencyMode(false)}><X size={16}/> 닫기</button>
          </div>
          <div className="emergency-grid">
            {emergency.map(symbol => <button className="emergency-button" key={symbol.id} onClick={() => void speak(symbol.ttsText, [symbol.displayText])}><CardVisual symbol={symbol}/><strong>{symbol.userAlias || symbol.displayText}</strong><span className="small">눌러서 바로 말하기</span></button>)}
          </div>
        </section>
      )}

      <section className="panel">
        <h2>1. 상징 카드 선택</h2>
        <p className="panel-desc">최대 3개. 보호자가 만든 별칭과 사용자 사진이 있으면 우선 표시하며, 사용 빈도 때문에 기본 카드 위치를 자동으로 바꾸지 않습니다.</p>
        <div className="category-tabs">{CATEGORIES.map(item => <button key={item} className={`category-tab ${category === item ? 'active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="selected-strip"><strong>선택:</strong>{selected.length === 0 ? <span className="small">최대 3개까지 선택</span> : selected.map(symbol => <span className="token" key={symbol.id}>{symbol.userAlias || symbol.displayText}</span>)}</div>
        <div className="symbol-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {filtered.map(symbol => <button key={symbol.id} className={`symbol-card ${selected.some(item => item.id === symbol.id) ? 'selected' : ''}`} style={{ background: `${symbol.colorHex}55` }} onClick={() => toggle(symbol)}><CardVisual symbol={symbol}/><span className="symbol-name">{symbol.userAlias || symbol.displayText}</span><span className="symbol-meta">{symbol.favorite ? '★ 즐겨찾기 ' : ''}{symbol.importantWord ? '♥ 중요' : ''}</span></button>)}
        </div>
      </section>

      <section className="panel">
        <h2>2. 현재 상황과 의도</h2>
        <p className="panel-desc">개인화 AI에는 보호자 설정, 자주 쓴 말, 즐겨찾기와 중요어가 추가 Context로 들어갑니다.</p>
        <div className="form-grid">
          <div className="field"><label>상황</label><select value={situation} onChange={event => setSituation(event.target.value)}><option>학교</option><option>집</option><option>병원</option><option>식사</option><option>외출</option><option>친구와 대화</option><option>직접 입력</option></select>{situation === '직접 입력' && <input value={customSituation} onChange={event => setCustomSituation(event.target.value)} placeholder="예: 학원에서 쉬는 시간"/>}</div>
          <div className="field"><label>표현하려는 핵심 의도</label><input value={intent} onChange={event => setIntent(event.target.value)} placeholder="예: 물을 마시고 싶다"/></div>
        </div>
        <div className="actions"><button className="primary" disabled={generating} onClick={() => void generate()}>{generating ? <RefreshCcw size={17}/> : <Sparkles size={17}/>} {generating ? '생성 중...' : 'A/B 문장 생성'}</button></div>
      </section>

      {comparison && (
        <section className="panel">
          <h2>3. 추천 결과 비교</h2>
          <p className="panel-desc">실제로 사용하고 싶은 문장을 눌러 선택률을 기록합니다. 개인화 결과는 길이 위반 시 재생성을 시도합니다.</p>
          {fallbackUsed && <p className="fallback-notice"><AlertTriangle size={16}/> 일부 결과가 Gemini가 아니라 안전한 로컬 fallback으로 생성되었습니다. Render의 API 키와 모델 설정을 확인해주세요.</p>}
          <div className="two-col"><Result title="일반 AI" result={comparison.baseline} onChoose={sentence => void choose('baseline', sentence)}/><Result title="말모아 개인화 AI" result={comparison.personalized} personalized onChoose={sentence => void choose('personalized', sentence)}/></div>
        </section>
      )}
    </main>
  );
}

function CardVisual({ symbol }: { symbol: AacSymbol }) {
  return symbol.imageUrl ? <img className="symbol-image" src={symbol.imageUrl} alt=""/> : <span className="symbol-emoji">{emoji[symbol.category] || '◻️'}</span>;
}

function Result({ title, result, personalized = false, onChoose }: { title: string; result: Comparison['baseline']; personalized?: boolean; onChoose: (sentence: string) => void }) {
  const sourceLabel = result.source === 'gemini' ? 'Gemini 실시간' : 'Fallback';
  return <div className={`result-column ${personalized ? 'personalized' : ''}`}><h3><span>{title}</span><span className={`ai-source ${result.source}`}>{personalized && <Sparkles size={14}/>} {sourceLabel}</span></h3>{personalized && <p className="small">최대 {result.maxEojeol}어절 · 개인 어휘: {result.personalWords.length ? result.personalWords.slice(0, 8).join(', ') : '아직 없음'}</p>}{result.candidates.map((candidate, index) => <button key={`${candidate.sentence}-${index}`} className="candidate" onClick={() => onChoose(candidate.sentence)}><strong>{candidate.sentence}</strong><div className="metrics"><span>{candidate.eojeolCount}어절</span>{personalized && <span>개인어휘 {candidate.personalWordCount}개</span>}<span className={candidate.valid ? 'metric-ok' : 'metric-bad'}>{candidate.valid ? '조건 통과' : candidate.violations.join(', ')}</span><span><Volume2 size={12}/> 선택·말하기</span></div></button>)}</div>;
}

function StatsColumn({ title, stats, personalized = false }: { title: string; stats: RecommendationStats['baseline']; personalized?: boolean }) {
  return <div className={`stats-column ${personalized ? 'personalized' : ''}`}><strong>{title}</strong><div><span>후보 {stats.generatedCount}</span><span>선택 {stats.selectedCount}</span><span>선택률 {Math.round(stats.selectionRate * 100)}%</span><span>평균 {stats.averageEojeol.toFixed(1)}어절</span>{personalized && <span>개인어휘 {stats.averagePersonalWordCount.toFixed(1)}개</span>}</div></div>;
}
