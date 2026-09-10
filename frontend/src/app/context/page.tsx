'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, BarChart3, BrainCircuit, Heart, RefreshCcw, SlidersHorizontal, Star } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { api } from '@/lib/api';
import type { PersonalizationContext } from '@/types';

export default function ContextPage() {
  const [userInput, setUserInput] = useState('1');
  const [context, setContext] = useState<PersonalizationContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(rawUserId: string, syncUrl = false) {
    const userId = Number(rawUserId);
    if (!Number.isInteger(userId) || userId <= 0) {
      setError('사용자 ID는 1 이상의 정수여야 합니다.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      setContext(await api.personalizationContext(userId));
      setUserInput(String(userId));
      if (syncUrl) window.history.replaceState(null, '', `/context?userId=${userId}`);
    } catch (e) {
      setContext(null);
      setError(e instanceof Error ? e.message : '개인화 컨텍스트를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('userId') ?? '1';
    void load(requested);
  }, []);

  return (
    <div className="shell">
      <Topbar/>
      <main className="page">
        <div className="page-title">
          <div>
            <h1>AI 개인화 컨텍스트</h1>
            <p>개인화 문장 추천이 참고할 사용자 수준과 개인 어휘를 배포 전후 동일한 기준으로 확인합니다.</p>
          </div>
        </div>

        <section className="panel context-toolbar">
          <div className="field context-user-field">
            <label htmlFor="context-user-id">AAC 사용자 ID</label>
            <input id="context-user-id" inputMode="numeric" value={userInput} onChange={event => setUserInput(event.target.value.replace(/[^0-9]/g, ''))} onKeyDown={event => { if (event.key === 'Enter') void load(userInput, true); }}/>
          </div>
          <button className="primary" disabled={loading} onClick={() => void load(userInput, true)}><RefreshCcw size={16}/> {loading ? '불러오는 중...' : '컨텍스트 확인'}</button>
        </section>

        {error && <p className="error">{error}</p>}
        {loading && !context && <p className="loading">AI 개인화 정보를 불러오는 중...</p>}

        {context && (
          <>
            <section className="context-grid">
              <ContextCard icon={<SlidersHorizontal size={19}/>} title="표현 길이" value={`최대 ${context.profile.expressiveMaxEojeol}어절`} detail={`이해 권장 최대 ${context.profile.receptiveMaxEojeol}어절`}/>
              <ContextCard icon={<BrainCircuit size={19}/>} title="어휘 난이도" value={vocabularyLabel(context.profile.vocabularyLevel)} detail={`연령 ${context.profile.age ?? '미설정'}`}/>
              <ContextCard icon={<Star size={19}/>} title="즐겨찾기" value={`${context.favoriteWords.length}개`} detail={context.favoriteWords.length ? context.favoriteWords.slice(0, 3).join(', ') : '아직 없음'}/>
              <ContextCard icon={<Heart size={19}/>} title="중요 단어" value={`${context.importantWords.length}개`} detail={context.importantWords.length ? context.importantWords.slice(0, 3).join(', ') : '아직 없음'}/>
            </section>

            <section className="panel context-main-card">
              <div className="context-section-heading"><div><h2><BrainCircuit size={20}/> 실제 AI 입력 개인 어휘</h2><p className="panel-desc">백엔드가 즐겨찾기·중요어·사용 빈도를 합치고 중복을 제거한 뒤 개인화 Gemini 프롬프트에 넣는 순서입니다. 최대 30개까지 사용합니다.</p></div><span className="context-count">{context.promptWords.length}개</span></div>
              <WordChips words={context.promptWords} empty="아직 개인 어휘가 없습니다. 보호자 화면에서 즐겨찾기/중요어를 지정하거나 AAC를 사용하면 누적됩니다."/>
            </section>

            <div className="context-two-col">
              <section className="panel">
                <h2><Star size={19}/> 보호자가 지정한 어휘</h2>
                <p className="panel-desc">사용자가 익숙한 별칭이 있으면 별칭을 우선해 보여줍니다.</p>
                <h3 className="context-subtitle">즐겨찾기</h3>
                <WordChips words={context.favoriteWords} empty="지정된 즐겨찾기가 없습니다."/>
                <h3 className="context-subtitle">중요 단어</h3>
                <WordChips words={context.importantWords} empty="지정된 중요 단어가 없습니다."/>
              </section>

              <section className="panel">
                <h2><BarChart3 size={19}/> 자주 사용한 말</h2>
                <p className="panel-desc">사용 횟수가 높은 단어부터 최대 20개를 개인 어휘 후보로 반영합니다.</p>
                {context.frequentWords.length === 0 ? <p className="small">아직 사용 기록이 없습니다.</p> : <div className="usage-list">{context.frequentWords.map(item => <div className="usage-row" key={item.word}><strong>{item.word}</strong><span>{item.usageCount}회</span></div>)}</div>}
              </section>
            </div>

            <section className="panel">
              <h2>언어 생성 제약</h2>
              <div className="context-facts">
                <span>추상 표현 <strong>{context.profile.allowAbstractLanguage ? '허용' : '제한'}</strong></span>
                <span>이유 표현 <strong>{context.profile.allowCausalExpression ? '허용' : '제한'}</strong></span>
                <span>보호자 메모 <strong>{context.profile.notes?.trim() || '없음'}</strong></span>
              </div>
              <div className="actions"><a className="primary" href={`/aac?userId=${context.userId}`}>이 사용자로 A/B 추천 테스트 <ArrowRight size={16}/></a><a className="secondary" href={`/guardian?userId=${context.userId}`}>이 사용자 보호자 설정</a></div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function ContextCard({ icon, title, value, detail }: { icon: React.ReactNode; title: string; value: string; detail: string }) {
  return <div className="context-card"><div className="context-card-title">{icon}<span>{title}</span></div><strong>{value}</strong><small>{detail}</small></div>;
}

function WordChips({ words, empty }: { words: string[]; empty: string }) {
  return words.length ? <div className="word-chips">{words.map((word, index) => <span className="word-chip" key={`${word}-${index}`}>{index + 1}. {word}</span>)}</div> : <p className="small">{empty}</p>;
}

function vocabularyLabel(value: string) {
  if (value === 'VERY_EASY') return '매우 쉬운 생활어';
  if (value === 'EASY') return '쉬운 일상어';
  if (value === 'GENERAL') return '일반 어휘';
  return value;
}
