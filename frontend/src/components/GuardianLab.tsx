'use client';

import { useEffect, useMemo, useState } from 'react';
import { Heart, Save, Star } from 'lucide-react';
import { api } from '@/lib/api';
import type { AacSymbol, CommunicationProfile } from '@/types';

const USER_ID = 1;
const CATEGORIES = ['전체','긴급어','사람','음식','장소','신체','행동','감정','설명','대화','문법'];

const DEFAULT_PROFILE: CommunicationProfile = {
  userId: USER_ID,
  age: 10,
  receptiveMaxEojeol: 4,
  expressiveMaxEojeol: 4,
  vocabularyLevel: 'EASY',
  allowAbstractLanguage: false,
  allowCausalExpression: false,
  notes: '',
};

export function GuardianLab() {
  const [profile, setProfile] = useState<CommunicationProfile>(DEFAULT_PROFILE);
  const [symbols, setSymbols] = useState<AacSymbol[]>([]);
  const [category, setCategory] = useState('전체');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<AacSymbol>>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const [p, s] = await Promise.all([api.getProfile(USER_ID), api.getSymbols(USER_ID)]);
      setProfile(p); setSymbols(s);
    } catch (e) { setError(e instanceof Error ? e.message : '불러오기에 실패했습니다.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => category === '전체' ? symbols : symbols.filter(s => s.category === category), [symbols, category]);
  const editing = symbols.find(s => s.id === editingId) ?? null;

  function beginEdit(symbol: AacSymbol) {
    setEditingId(symbol.id);
    setDraft({ ...symbol });
    setStatus('');
  }

  async function saveProfile() {
    setStatus('저장 중...'); setError('');
    try {
      const saved = await api.saveProfile(USER_ID, {
        age: profile.age,
        receptiveMaxEojeol: profile.receptiveMaxEojeol,
        expressiveMaxEojeol: profile.expressiveMaxEojeol,
        vocabularyLevel: profile.vocabularyLevel,
        allowAbstractLanguage: profile.allowAbstractLanguage,
        allowCausalExpression: profile.allowCausalExpression,
        notes: profile.notes,
      });
      setProfile(saved); setStatus('의사소통 프로필을 저장했습니다.');
    } catch (e) { setError(e instanceof Error ? e.message : '저장 실패'); setStatus(''); }
  }

  async function saveSymbol() {
    if (!editing) return;
    setStatus('카드 저장 중...'); setError('');
    try {
      const saved = await api.customizeSymbol(USER_ID, editing.id, draft);
      setSymbols(current => current.map(s => s.id === saved.id ? saved : s));
      setDraft({ ...saved }); setStatus(`‘${saved.displayText}’ 카드를 저장했습니다.`);
    } catch (e) { setError(e instanceof Error ? e.message : '카드 저장 실패'); setStatus(''); }
  }

  if (loading) return <main className="page"><p className="loading">설정을 불러오는 중...</p></main>;

  return (
    <main className="page">
      <div className="page-title">
        <div><h1>보호자 개인화 설정</h1><p>진단명 대신 실제 이해·표현 능력과 개인 어휘를 AI 제약조건으로 저장합니다.</p></div>
        <span className="small">TEST USER #{USER_ID}</span>
      </div>
      {error && <p className="error">{error}</p>}

      <section className="panel">
        <h2>1. 의사소통 프로필</h2>
        <p className="panel-desc">사용자의 ‘지적 수준’을 AI가 추측하게 하지 않고, 보호자가 관찰한 실제 언어 능력을 구체적인 값으로 입력합니다.</p>
        <div className="form-grid">
          <div className="field"><label>연령</label><input type="number" min={1} max={120} value={profile.age ?? ''} onChange={e=>setProfile({...profile,age:e.target.value?Number(e.target.value):null})}/></div>
          <div className="field"><label>어휘 난이도</label><select value={profile.vocabularyLevel} onChange={e=>setProfile({...profile,vocabularyLevel:e.target.value})}><option value="VERY_EASY">매우 쉬운 생활어</option><option value="EASY">쉬운 일상어</option><option value="GENERAL">일반 어휘</option></select></div>
          <div className="field"><label>이해 가능한 권장 최대 길이 (어절)</label><input type="number" min={1} max={20} value={profile.receptiveMaxEojeol} onChange={e=>setProfile({...profile,receptiveMaxEojeol:Number(e.target.value)})}/><span className="small">예: 4 → “선생님 물 주세요” 정도</span></div>
          <div className="field"><label>주로 표현 가능한 최대 길이 (어절)</label><input type="number" min={1} max={20} value={profile.expressiveMaxEojeol} onChange={e=>setProfile({...profile,expressiveMaxEojeol:Number(e.target.value)})}/><span className="small">AI가 생성할 문장의 실제 상한으로 사용</span></div>
        </div>
        <div className="check-row"><input id="abstract" type="checkbox" checked={profile.allowAbstractLanguage} onChange={e=>setProfile({...profile,allowAbstractLanguage:e.target.checked})}/><label htmlFor="abstract">추상적인 표현도 이해/사용할 수 있음</label></div>
        <div className="check-row"><input id="causal" type="checkbox" checked={profile.allowCausalExpression} onChange={e=>setProfile({...profile,allowCausalExpression:e.target.checked})}/><label htmlFor="causal">“~해서”, “왜냐하면” 같은 간단한 이유 표현 가능</label></div>
        <div className="field"><label>보호자 메모</label><textarea rows={3} value={profile.notes ?? ''} placeholder="예: 질문형보다 요청형을 잘 이해함. 낯선 추상어는 어려워함." onChange={e=>setProfile({...profile,notes:e.target.value})}/></div>
        <div className="actions"><button className="primary" onClick={saveProfile}><Save size={17}/> 프로필 저장</button>{status && <span className="status">{status}</span>}</div>
      </section>

      <section className="panel">
        <h2>2. 상징 카드 · 개인 어휘 커스터마이징</h2>
        <p className="panel-desc">표준 단어는 보존하고, 사용자에게 익숙한 표시 문구·별칭·TTS 문구를 별도로 저장합니다. 즐겨찾기와 중요 단어는 AI 추천에 우선 반영됩니다.</p>
        <div className="category-tabs">{CATEGORIES.map(c=><button key={c} className={`category-tab ${category===c?'active':''}`} onClick={()=>setCategory(c)}>{c}</button>)}</div>
        <div className="edit-layout">
          <div className="list">
            {filtered.map(symbol=><button key={symbol.id} className={`list-item ${editingId===symbol.id?'active':''}`} onClick={()=>beginEdit(symbol)}>
              <strong>{symbol.displayText}</strong><br/><span className="small">{symbol.category} · 표준: {symbol.canonicalText}{symbol.favorite?' · ★':''}</span>
            </button>)}
          </div>
          <div>
            {!editing ? <div className="result-column"><p>왼쪽에서 수정할 카드를 선택해줘.</p></div> : <>
              <div className="form-grid">
                <div className="field"><label>표준 텍스트 (유지)</label><input disabled value={editing.canonicalText}/></div>
                <div className="field"><label>화면 표시 텍스트</label><input value={draft.displayText ?? ''} onChange={e=>setDraft({...draft,displayText:e.target.value})}/></div>
                <div className="field"><label>사용자 별칭/고유 표현</label><input placeholder="예: 사용자가 평소 부르는 표현" value={draft.userAlias ?? ''} onChange={e=>setDraft({...draft,userAlias:e.target.value})}/></div>
                <div className="field"><label>TTS 발화 문구</label><input value={draft.ttsText ?? ''} onChange={e=>setDraft({...draft,ttsText:e.target.value})}/></div>
                <div className="field"><label>커스텀 이미지 URL</label><input placeholder="추후 업로드 스토리지와 연결" value={draft.imageUrl ?? ''} onChange={e=>setDraft({...draft,imageUrl:e.target.value})}/></div>
                <div className="field"><label>카드 정렬 순서 (선택)</label><input type="number" value={draft.sortOrder ?? ''} onChange={e=>setDraft({...draft,sortOrder:e.target.value?Number(e.target.value):null})}/></div>
              </div>
              <div className="check-row"><input id="favorite" type="checkbox" checked={draft.favorite ?? false} onChange={e=>setDraft({...draft,favorite:e.target.checked})}/><label htmlFor="favorite"><Star size={15}/> 즐겨찾기 — 추천 개인화에 반영</label></div>
              <div className="check-row"><input id="important" type="checkbox" checked={draft.importantWord ?? false} onChange={e=>setDraft({...draft,importantWord:e.target.checked})}/><label htmlFor="important"><Heart size={15}/> 중요 단어 — AI가 문맥에 맞으면 최우선 활용</label></div>
              <div className="actions"><button className="primary" onClick={saveSymbol}><Save size={17}/> 카드 설정 저장</button></div>
            </>}
          </div>
        </div>
      </section>
    </main>
  );
}
