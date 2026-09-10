'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCcw, Sparkles, Volume2, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { AacSymbol, Comparison, RecommendationStats } from '@/types';

const USER_ID = 1;
const CATEGORIES = ['전체','사람','음식','장소','신체','행동','감정','설명','대화','문법'];
const emoji: Record<string,string> = {긴급어:'🆘',사람:'👤',음식:'🥤',장소:'📍',신체:'🖐️',행동:'▶️',감정:'🙂',설명:'✨',대화:'💬',문법:'🔗'};

export function AacLab() {
  const [symbols,setSymbols]=useState<AacSymbol[]>([]);
  const [emergency,setEmergency]=useState<AacSymbol[]>([]);
  const [selected,setSelected]=useState<AacSymbol[]>([]);
  const [category,setCategory]=useState('전체');
  const [situation,setSituation]=useState('학교');
  const [intent,setIntent]=useState('물을 마시고 싶다');
  const [comparison,setComparison]=useState<Comparison|null>(null);
  const [stats,setStats]=useState<RecommendationStats|null>(null);
  const [loading,setLoading]=useState(true);
  const [generating,setGenerating]=useState(false);
  const [error,setError]=useState('');
  const [emergencyMode,setEmergencyMode]=useState(false);

  async function refreshStats(){try{setStats(await api.recommendationStats(USER_ID));}catch{}}

  useEffect(()=>{(async()=>{try{const [s,e]=await Promise.all([api.getSymbols(USER_ID),api.getEmergencySymbols(USER_ID)]);setSymbols(s);setEmergency(e);await refreshStats();}catch(err){setError(err instanceof Error?err.message:'불러오기 실패');}finally{setLoading(false);}})();},[]);

  const filtered=useMemo(()=>category==='전체'?symbols.filter(s=>!s.emergency):symbols.filter(s=>s.category===category&&!s.emergency),[symbols,category]);

  function toggle(symbol:AacSymbol){
    setComparison(null);
    setSelected(current=>current.some(s=>s.id===symbol.id)?current.filter(s=>s.id!==symbol.id):current.length>=3?current:[...current,symbol]);
  }

  async function generate(){
    setGenerating(true);setError('');
    try{const result=await api.compare({userId:USER_ID,situation,intent,selectedWords:selected.map(s=>s.userAlias||s.displayText)});setComparison(result);await refreshStats();}
    catch(err){setError(err instanceof Error?err.message:'AI 생성 실패');}
    finally{setGenerating(false);}
  }

  async function speak(sentence:string,words:string[]=[]){
    if(typeof window!=='undefined'&&'speechSynthesis'in window){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(sentence);u.lang='ko-KR';window.speechSynthesis.speak(u);}
    try{await api.recordUsage(USER_ID,words.length?words:sentence.replace(/[.!?]/g,'').split(/\s+/));}catch{}
  }

  async function selectPersonalized(sentence:string){
    await speak(sentence,selected.map(x=>x.userAlias||x.displayText));
    try{await api.markRecommendationSelected(USER_ID,sentence);await refreshStats();}catch{}
  }

  if(loading)return <main className="page"><p className="loading">AAC 데이터를 불러오는 중...</p></main>;

  return <main className="page">
    <div className="page-title"><div><h1>사용자 AAC · AI 추천 실험</h1><p>카드를 최대 3개 선택하고 일반 AI와 개인화 AI의 결과를 바로 비교합니다.</p></div><button className="emergency-toggle" onClick={()=>setEmergencyMode(v=>!v)}><AlertTriangle size={17}/> 긴급 모드</button></div>
    {error&&<p className="error">{error}</p>}

    {stats&&<section className="stats-grid"><div className="stat-card"><span>개인화 후보 생성</span><strong>{stats.generatedCount}</strong></div><div className="stat-card"><span>실제 선택</span><strong>{stats.selectedCount}</strong></div><div className="stat-card"><span>선택률</span><strong>{Math.round(stats.selectionRate*100)}%</strong></div><div className="stat-card"><span>평균 문장 길이</span><strong>{stats.averageEojeol.toFixed(1)}어절</strong></div><div className="stat-card"><span>평균 개인어휘</span><strong>{stats.averagePersonalWordCount.toFixed(1)}개</strong></div></section>}

    {emergencyMode&&<section className="panel emergency-panel"><div className="page-title"><div><h2>긴급 표현</h2><p className="panel-desc">AI와 무관하게 항상 고정 제공되는 핵심 표현입니다. 발화 시 보호자 알림 DB에도 기록됩니다.</p></div><button className="secondary" onClick={()=>setEmergencyMode(false)}><X size={16}/> 닫기</button></div><div className="emergency-grid">{emergency.map(s=><button className="emergency-button" key={s.id} onClick={()=>void speak(s.ttsText,[s.displayText])}>{s.displayText}<br/><span className="small">눌러서 바로 말하기</span></button>)}</div></section>}

    <section className="panel"><h2>1. 상징 카드 선택</h2><p className="panel-desc">사용자 맞춤 표시 텍스트/별칭이 있으면 그것을 보여주고, 카드 위치는 자동 재배치하지 않습니다.</p><div className="category-tabs">{CATEGORIES.map(c=><button key={c} className={`category-tab ${category===c?'active':''}`} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="selected-strip"><strong>선택:</strong>{selected.length===0?<span className="small">최대 3개까지 선택</span>:selected.map(s=><span className="token" key={s.id}>{s.userAlias||s.displayText}</span>)}</div><div className="symbol-grid">{filtered.map(s=><button key={s.id} className={`symbol-card ${selected.some(x=>x.id===s.id)?'selected':''}`} style={{background:s.colorHex+'55'}} onClick={()=>toggle(s)}><span className="symbol-emoji">{emoji[s.category]||'◻️'}</span><span className="symbol-name">{s.userAlias||s.displayText}</span><span className="symbol-meta">{s.favorite?'★ 즐겨찾기 ':''}{s.importantWord?'♥ 중요':''}</span></button>)}</div></section>

    <section className="panel"><h2>2. 현재 상황과 의도</h2><p className="panel-desc">AI는 이 정보와 보호자가 설정한 프로필/개인 어휘를 함께 사용합니다.</p><div className="form-grid"><div className="field"><label>상황</label><select value={situation} onChange={e=>setSituation(e.target.value)}><option>학교</option><option>집</option><option>병원</option><option>식사</option><option>외출</option><option>친구와 대화</option><option>직접 입력</option></select></div><div className="field"><label>표현하려는 핵심 의도</label><input value={intent} onChange={e=>setIntent(e.target.value)} placeholder="예: 물을 마시고 싶다"/></div></div><div className="actions"><button className="primary" disabled={generating} onClick={()=>void generate()}>{generating?<RefreshCcw size={17}/>:<Sparkles size={17}/>} {generating?'생성 중...':'일반 AI vs 개인화 AI 생성'}</button></div></section>

    {comparison&&<section className="panel"><h2>3. 추천 결과 비교</h2><p className="panel-desc">개인화 결과는 최대 어절 수와 즐겨찾기/중요/사용 빈도 어휘를 기준으로 후검증·정렬됩니다. 개인화 문장을 누르면 ‘실제 선택’으로 기록됩니다.</p><div className="two-col"><Result title="일반 AI" result={comparison.baseline} onSpeak={s=>void speak(s)}/><Result title="말모아 개인화 AI" result={comparison.personalized} personalized onSpeak={s=>void selectPersonalized(s)}/></div></section>}
  </main>;
}

function Result({title,result,personalized=false,onSpeak}:{title:string;result:Comparison['baseline'];personalized?:boolean;onSpeak:(sentence:string)=>void}){
  return <div className={`result-column ${personalized?'personalized':''}`}><h3><span>{title}</span>{personalized&&<Sparkles size={18}/>}</h3>{personalized&&<p className="small">최대 {result.maxEojeol}어절 · 개인 어휘: {result.personalWords.length?result.personalWords.slice(0,8).join(', '):'아직 없음'}</p>}{result.candidates.map((c,i)=><button key={i} className="candidate" onClick={()=>onSpeak(c.sentence)}><strong>{c.sentence}</strong><div className="metrics"><span>{c.eojeolCount}어절</span>{personalized&&<span>개인어휘 {c.personalWordCount}개</span>}<span className={c.valid?'metric-ok':'metric-bad'}>{c.valid?'조건 통과':c.violations.join(', ')}</span><span><Volume2 size={12}/> {personalized?'선택하고 말하기':'말하기'}</span></div></button>)}</div>;
}
