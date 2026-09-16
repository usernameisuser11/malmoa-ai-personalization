'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Bell,
  ChevronRight,
  Clock3,
  Folder,
  GripVertical,
  Heart,
  HelpCircle,
  Home,
  ImagePlus,
  Info,
  MapPin,
  MessageCircle,
  Plus,
  Save,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { AacSymbol, CommunicationProfile, GuardianNotification, RecommendationStats, UserSettings } from '@/types';

type Screen = 'home' | 'settings' | 'language' | 'categories' | 'location' | 'tts' | 'report';
type Routine = { id: string; time: string; repeat: '매일' | '요일'; sentence: string; enabled: boolean };
type Place = { id: string; name: string; type: '집' | '학교' | '병원' | '치료실'; address: string; start: string; end: string };

const CATEGORIES = [
  { key: '긴급어', icon: '🆘', color: '#ffe7e7' },
  { key: '사람', icon: '👩', color: '#fff0e8' },
  { key: '음식·장소·신체', icon: '🍱', color: '#fff4df' },
  { key: '행동', icon: '🙌', color: '#eaf8f0' },
  { key: '감정·설명', icon: '😊', color: '#e9f7fc' },
  { key: '대화', icon: '💬', color: '#efefff' },
  { key: '문법', icon: '🔗', color: '#f1f4f4' },
] as const;

const DEFAULT_ROUTINES: Routine[] = [
  { id: 'morning', time: '08:00', repeat: '매일', sentence: '등교 준비 — 학교 상징 우선', enabled: true },
  { id: 'lunch', time: '12:30', repeat: '매일', sentence: '점심 약 복용 알림 팝업', enabled: true },
  { id: 'night', time: '21:00', repeat: '매일', sentence: '취침 루틴 — 양치, 약, 졸려요', enabled: false },
];

function defaultSettings(userId: number): UserSettings {
  return {
    userId,
    name: '사용자',
    birthDate: null,
    relationshipType: 'PARENT',
    emergencyContact: null,
    gridSize: 'GRID_4X4',
    voiceType: 'CHILD_MALE',
    speechRate: 1,
  };
}

function defaultProfile(userId: number): CommunicationProfile {
  return {
    userId,
    age: null,
    receptiveMaxEojeol: 4,
    expressiveMaxEojeol: 4,
    vocabularyLevel: 'EASY',
    allowAbstractLanguage: false,
    allowCausalExpression: false,
    notes: '',
  };
}

function storageKey(name: string, userId: number) {
  return `malmoa-guardian-${name}-${userId}`;
}

export function GuardianExperience({ userId = 1, screen = 'home' }: { userId?: number; screen?: Screen }) {
  const [settings, setSettings] = useState<UserSettings>(() => defaultSettings(userId));
  const [profile, setProfile] = useState<CommunicationProfile>(() => defaultProfile(userId));
  const [symbols, setSymbols] = useState<AacSymbol[]>([]);
  const [notifications, setNotifications] = useState<GuardianNotification[]>([]);
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      api.getUserSettings(userId),
      api.getProfile(userId),
      api.getSymbols(userId),
      api.notifications(userId),
      api.recommendationStats(userId).catch(() => null),
    ]).then(([nextSettings, nextProfile, nextSymbols, nextNotifications, nextStats]) => {
      if (cancelled) return;
      setSettings(nextSettings);
      setProfile(nextProfile);
      setSymbols(nextSymbols);
      setNotifications(nextNotifications);
      setStats(nextStats);
    }).catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : '보호자 데이터를 불러오지 못했습니다.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [userId]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  }

  const props = { userId, settings, setSettings, profile, setProfile, symbols, setSymbols, notifications, stats, notify };

  if (loading) return <main className="p3-loading"><span className="p3-loader"/><strong>설정을 불러오는 중...</strong></main>;

  return (
    <>
      {error ? <div className="p3-global-error">{error}</div> : null}
      {screen === 'home' ? <GuardianHome {...props}/> : null}
      {screen === 'settings' ? <EnvironmentSettings {...props}/> : null}
      {screen === 'language' ? <LanguageLevel {...props}/> : null}
      {screen === 'categories' ? <CategoryEditor userId={userId} notify={notify}/> : null}
      {screen === 'location' ? <LocationManager userId={userId} notify={notify}/> : null}
      {screen === 'tts' ? <VoiceSettings {...props}/> : null}
      {screen === 'report' ? <GuardianReport userId={userId} notifications={notifications} stats={stats}/> : null}
      {toast ? <div className="p3-toast">{toast}</div> : null}
    </>
  );
}

type SharedProps = {
  userId: number;
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  profile: CommunicationProfile;
  setProfile: React.Dispatch<React.SetStateAction<CommunicationProfile>>;
  symbols: AacSymbol[];
  setSymbols: React.Dispatch<React.SetStateAction<AacSymbol[]>>;
  notifications: GuardianNotification[];
  stats: RecommendationStats | null;
  notify: (message: string) => void;
};

function GuardianHome({ userId, settings, symbols, setSymbols, notifications, notify }: SharedProps) {
  const [editMode, setEditMode] = useState(false);
  const [category, setCategory] = useState('전체');
  const [editing, setEditing] = useState<AacSymbol | null>(null);
  const [draft, setDraft] = useState<Partial<AacSymbol>>({});
  const [onboarding, setOnboarding] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (window.localStorage.getItem(storageKey('onboarding-done', userId)) !== '1') setOnboarding(1);
  }, [userId]);

  const visible = useMemo(() => {
    if (category === '전체') return symbols.filter(s => !s.emergency);
    if (category === '긴급어') return symbols.filter(s => s.emergency);
    if (category === '음식·장소·신체') return symbols.filter(s => ['음식', '장소', '신체'].includes(s.category));
    if (category === '감정·설명') return symbols.filter(s => ['감정', '설명'].includes(s.category));
    return symbols.filter(s => s.category === category);
  }, [symbols, category]);

  const unread = notifications.filter(n => !n.read).length;
  const columns = settings.gridSize === 'GRID_2X2' ? 2 : settings.gridSize === 'GRID_3X3' ? 3 : 4;

  function beginPress(symbol: AacSymbol) {
    timer.current = setTimeout(() => {
      setEditing(symbol);
      setDraft({ ...symbol });
    }, 800);
  }
  function endPress() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  async function saveCard() {
    if (!editing) return;
    try {
      const saved = await api.customizeSymbol(userId, editing.id, draft);
      setSymbols(current => current.map(item => item.id === saved.id ? saved : item));
      setEditing(null);
      notify('상징 카드가 저장되었습니다.');
    } catch (e) {
      notify(e instanceof Error ? e.message : '카드 저장에 실패했습니다.');
    }
  }

  async function toggleFavorite(symbol: AacSymbol) {
    try {
      const saved = await api.customizeSymbol(userId, symbol.id, { ...symbol, favorite: !symbol.favorite });
      setSymbols(current => current.map(item => item.id === saved.id ? saved : item));
    } catch {
      notify('즐겨찾기 변경에 실패했습니다.');
    }
  }

  function closeOnboarding() {
    window.localStorage.setItem(storageKey('onboarding-done', userId), '1');
    setOnboarding(0);
  }

  return (
    <main className="p3-home">
      <header className="p3-home-header">
        <Link className="p3-wordmark" href={`/guardian?userId=${userId}`}>Mal<span>Moa</span></Link>
        <div className="p3-home-actions">
          <Link href={`/guardian?userId=${userId}&screen=settings`} className="p3-head-button"><Settings size={18}/> 설정</Link>
          <button className={editMode ? 'p3-edit-toggle is-on' : 'p3-edit-toggle'} onClick={() => setEditMode(value => !value)}><SlidersHorizontal size={18}/>보호자 편집 모드 <b>{editMode ? 'ON' : 'OFF'}</b></button>
          <span className={unread ? 'p3-status is-alert' : 'p3-status'}><i/>{unread ? '긴급' : '안정'}</span>
        </div>
      </header>

      {editMode ? (
        <div className="p3-edit-toolbar">
          <button><Plus size={17}/>신규 카드 추가</button>
          <button><Trash2 size={17}/>선택 카드 삭제</button>
          <Link href={`/guardian?userId=${userId}&screen=categories`}><Folder size={17}/>카테고리 편집</Link>
          <button><Star size={17}/>즐겨찾기 등록 및 해제</button>
        </div>
      ) : null}

      <div className="p3-live-board">
        <aside className="p3-live-categories">
          <button className={category === '전체' ? 'is-active' : ''} onClick={() => setCategory('전체')}><Home size={16}/><span>전체</span></button>
          {CATEGORIES.map(item => <button key={item.key} className={category === item.key ? 'is-active' : ''} onClick={() => setCategory(item.key)}><span>{item.icon}</span><b>{item.key}</b></button>)}
        </aside>
        <section className={`p3-card-grid p3-card-grid--${columns}`}>
          {visible.map(symbol => (
            <button
              className="p3-symbol-card"
              key={symbol.id}
              style={{ '--p3-card': symbol.colorHex } as React.CSSProperties}
              onPointerDown={() => beginPress(symbol)}
              onPointerUp={endPress}
              onPointerLeave={endPress}
              onContextMenu={event => { event.preventDefault(); setEditing(symbol); setDraft({ ...symbol }); }}
            >
              <span className="p3-symbol-star" onClick={(event) => { event.stopPropagation(); void toggleFavorite(symbol); }}>{symbol.favorite ? '★' : '☆'}</span>
              {symbol.imageUrl ? <img src={symbol.imageUrl} alt=""/> : <span className="p3-symbol-placeholder">{symbol.canonicalText.slice(0, 1)}</span>}
              <strong>{symbol.userAlias || symbol.displayText}</strong>
            </button>
          ))}
        </section>
      </div>

      {editing ? (
        <div className="p3-modal-backdrop">
          <section className="p3-card-editor" role="dialog" aria-modal="true">
            <button className="p3-modal-x" onClick={() => setEditing(null)}><X/></button>
            <h2>상징 카드 편집</h2>
            <div className="p3-card-preview">
              {draft.imageUrl ? <img src={draft.imageUrl} alt=""/> : <span>{editing.canonicalText.slice(0, 1)}</span>}
            </div>
            <label>카드 텍스트<input value={draft.displayText ?? ''} onChange={e => setDraft(current => ({ ...current, displayText: e.target.value }))}/></label>
            <label>사용자 별칭<input value={draft.userAlias ?? ''} onChange={e => setDraft(current => ({ ...current, userAlias: e.target.value || null }))}/></label>
            <label className="p3-file-button"><ImagePlus size={18}/>이미지 변경<input type="file" accept="image/*" onChange={e => readImage(e.target.files?.[0], value => setDraft(current => ({ ...current, imageUrl: value })))}/></label>
            <button className={draft.favorite ? 'p3-favorite-row is-on' : 'p3-favorite-row'} onClick={() => setDraft(current => ({ ...current, favorite: !current.favorite }))}><Star size={19}/>{draft.favorite ? '즐겨찾기 해제' : '즐겨찾기 등록'}</button>
            <div className="p3-modal-actions"><button className="p3-danger-outline" disabled><Trash2 size={17}/>카드 삭제</button><button className="p3-primary" onClick={() => void saveCard()}><Save size={17}/>저장</button></div>
            <small>삭제 API는 백엔드 연동 후 활성화됩니다.</small>
          </section>
        </div>
      ) : null}

      {onboarding ? (
        <div className="p3-onboarding-backdrop">
          <section className="p3-onboarding">
            <span className="p3-step">{onboarding} / 2</span>
            {onboarding === 1 ? <><Sparkles size={42}/><h2>AI 문장 추천 수준을 맞춰주세요</h2><p>사용자의 언어 발달 수준에 맞춰 AI 추천 문장 길이를 맞춤 설정하세요.</p><Link href={`/guardian?userId=${userId}&screen=language`} className="p3-onboarding-link">언어 수준 바로 설정하기</Link></> : <><SlidersHorizontal size={42}/><h2>보호자 편집 모드</h2><p>보호자 편집 모드 버튼을 켜거나 상징 카드를 꾹 누르면 글자 수정과 즐겨찾기 편집을 할 수 있어요.</p><div className="p3-longpress-demo"><span>꾹</span><b>상징 카드를 길게 눌러보세요</b></div></>}
            <div className="p3-onboarding-actions"><button onClick={closeOnboarding}>건너뛰기</button><button className="p3-primary" onClick={() => onboarding === 1 ? setOnboarding(2) : closeOnboarding()}>{onboarding === 1 ? '다음' : '시작하기'}</button></div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function EnvironmentSettings({ userId, settings, setSettings, notify }: SharedProps) {
  const [routines, setRoutines] = useState<Routine[]>(DEFAULT_ROUTINES);
  const [routineModal, setRoutineModal] = useState(false);
  const [routineDraft, setRoutineDraft] = useState({ repeat: '매일' as '매일' | '요일', hour: 9, minute: 0, ampm: '오전' as '오전' | '오후', sentence: '' });

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey('routines', userId));
    if (raw) {
      try { setRoutines(JSON.parse(raw)); } catch {}
    }
  }, [userId]);

  function persist(next: Routine[]) {
    setRoutines(next);
    window.localStorage.setItem(storageKey('routines', userId), JSON.stringify(next));
  }

  async function saveSetting(next: UserSettings) {
    setSettings(next);
    try {
      const saved = await api.saveUserSettings(userId, {
        name: next.name,
        birthDate: next.birthDate,
        relationshipType: next.relationshipType,
        emergencyContact: next.emergencyContact,
        gridSize: next.gridSize,
        voiceType: next.voiceType,
        speechRate: next.speechRate,
      });
      setSettings(saved);
      notify('환경 설정이 저장되었습니다.');
    } catch (e) {
      notify(e instanceof Error ? e.message : '설정 저장에 실패했습니다.');
    }
  }

  function addRoutine() {
    const hour24 = routineDraft.ampm === '오후' && routineDraft.hour < 12 ? routineDraft.hour + 12 : routineDraft.ampm === '오전' && routineDraft.hour === 12 ? 0 : routineDraft.hour;
    const time = `${String(hour24).padStart(2, '0')}:${String(routineDraft.minute).padStart(2, '0')}`;
    const next = [...routines, { id: crypto.randomUUID(), time, repeat: routineDraft.repeat, sentence: routineDraft.sentence || '완성형 문장 자동 팝업', enabled: true }];
    persist(next);
    setRoutineModal(false);
    notify('루틴이 추가되었습니다.');
  }

  return (
    <main className="p3-settings-page">
      <PageTitle userId={userId} title="환경 설정" back="home"/>
      <div className="p3-setting-top">
        <section className="p3-setting-card">
          <h2>화면 격자 크기</h2><p>소근육 조절 능력에 맞게 설정</p>
          <div className="p3-grid-choices">
            {(['GRID_2X2','GRID_3X3','GRID_4X4'] as const).map(value => <button key={value} className={settings.gridSize === value ? 'is-selected' : ''} onClick={() => void saveSetting({ ...settings, gridSize: value })}>{value.replace('GRID_','').replace('X','×')}</button>)}
          </div>
        </section>
        <section className="p3-setting-card">
          <h2>TTS 음성</h2><p>또래 집단과 어울리는 자연스러운 음성</p>
          <div className="p3-voice-choices">
            <button className={settings.voiceType === 'CHILD_MALE' ? 'is-selected' : ''} onClick={() => void saveSetting({ ...settings, voiceType: 'CHILD_MALE' })}>또래 남아</button>
            <button className={settings.voiceType === 'CHILD_FEMALE' ? 'is-selected' : ''} onClick={() => void saveSetting({ ...settings, voiceType: 'CHILD_FEMALE' })}>또래 여아</button>
            <button disabled title="백엔드 음성 타입 확장 후 활성화">성인 여성</button>
          </div>
        </section>
      </div>

      <section className="p3-routine-card">
        <div className="p3-routine-head"><div><h2>루틴 스케줄러</h2><p>지정 시간에 완성형 문장 자동 팝업</p></div><button onClick={() => setRoutineModal(true)}><Plus size={17}/>추가</button></div>
        <div className="p3-routine-list">
          {routines.map(routine => <div className="p3-routine-row" key={routine.id}><Clock3 size={27}/><div><strong>{routine.time}</strong><span>{routine.repeat}</span><p>{routine.sentence}</p></div><button className={routine.enabled ? 'p3-switch is-on' : 'p3-switch'} onClick={() => persist(routines.map(item => item.id === routine.id ? { ...item, enabled: !item.enabled } : item))}><i/></button><button className="p3-trash" onClick={() => persist(routines.filter(item => item.id !== routine.id))}><Trash2 size={20}/></button></div>)}
        </div>
      </section>

      <div className="p3-settings-shortcuts">
        <Link href={`/guardian?userId=${userId}&screen=report`}><span className="is-green"><BarChart3/></span><div><strong>사용 기록 조회</strong><small>월별 / 일별 발화 기록 확인 및 삭제</small></div><ChevronRight/></Link>
        <Link href={`/guardian?userId=${userId}&screen=language`}><span className="is-yellow"><Info/></span><div><strong>도움말 · 버전 정보</strong><small>FAQ · 고객센터 · 앱 지원 · v2.4.1</small></div><ChevronRight/></Link>
      </div>

      <section className="p3-account-card"><h2>계정</h2><div><button>×&nbsp;&nbsp;로그아웃</button><button className="is-danger">△&nbsp;&nbsp;회원탈퇴</button></div></section>

      {routineModal ? <RoutineModal draft={routineDraft} setDraft={setRoutineDraft} onClose={() => setRoutineModal(false)} onSave={addRoutine}/> : null}
    </main>
  );
}

function RoutineModal({ draft, setDraft, onClose, onSave }: { draft: { repeat: '매일' | '요일'; hour: number; minute: number; ampm: '오전' | '오후'; sentence: string }; setDraft: React.Dispatch<React.SetStateAction<{ repeat: '매일' | '요일'; hour: number; minute: number; ampm: '오전' | '오후'; sentence: string }>>; onClose: () => void; onSave: () => void }) {
  const bump = (field: 'hour' | 'minute', delta: number) => setDraft(current => ({ ...current, [field]: field === 'hour' ? Math.min(12, Math.max(1, current.hour + delta)) : (current.minute + delta + 60) % 60 }));
  return <div className="p3-modal-backdrop"><section className="p3-routine-modal"><header><span><Clock3/></span><h2>루틴 추가</h2><button onClick={onClose}><X/></button></header><div className="p3-routine-modal-body"><label>반복 주기</label><div className="p3-repeat-choice"><button className={draft.repeat === '매일' ? 'is-selected' : ''} onClick={() => setDraft(current => ({ ...current, repeat: '매일' }))}>매일</button><button className={draft.repeat === '요일' ? 'is-selected' : ''} onClick={() => setDraft(current => ({ ...current, repeat: '요일' }))}>요일</button></div><label>시간</label><div className="p3-time-picker"><div className="p3-ampm"><button className={draft.ampm === '오전' ? 'is-selected' : ''} onClick={() => setDraft(current => ({ ...current, ampm: '오전' }))}>오전</button><button className={draft.ampm === '오후' ? 'is-selected' : ''} onClick={() => setDraft(current => ({ ...current, ampm: '오후' }))}>오후</button></div><TimeColumn label="시" value={draft.hour} onUp={() => bump('hour',1)} onDown={() => bump('hour',-1)}/><b className="p3-colon">:</b><TimeColumn label="분" value={draft.minute} onUp={() => bump('minute',5)} onDown={() => bump('minute',-5)}/></div><p className="p3-selected-time">선택된 시간: <b>{draft.ampm} {String(draft.hour).padStart(2,'0')}:{String(draft.minute).padStart(2,'0')}</b></p><label>출력할 문장</label><input className="p3-routine-input" placeholder="예: 물과 약을 가져다주세요" value={draft.sentence} onChange={e => setDraft(current => ({ ...current, sentence: e.target.value }))}/></div><footer><button className="p3-primary" onClick={onSave}>✓&nbsp;&nbsp;저장</button><button onClick={onClose}>취소</button></footer></section></div>;
}

function TimeColumn({ label, value, onUp, onDown }: { label: string; value: number; onUp: () => void; onDown: () => void }) {
  return <div className="p3-time-column"><span>{label}</span><button onClick={onUp}>⌃</button><strong>{String(value).padStart(2,'0')}</strong><button onClick={onDown}>⌄</button></div>;
}

function LanguageLevel({ userId, profile, setProfile, notify }: SharedProps) {
  const levels = [
    { level: 1, example: '물', help: '한 단어 중심(1어절)', eojeol: 1, vocabulary: 'VERY_EASY' },
    { level: 2, example: '물 주세요. / 물 마시고 싶어요.', help: '짧은 문장 중심(2~4어절) · 기본값', eojeol: 4, vocabulary: 'EASY' },
    { level: 3, example: '목이 말라서 물을 마시고 싶어요.', help: '일반 문장 중심(5~6어절)', eojeol: 6, vocabulary: 'GENERAL' },
    { level: 4, example: '지금 너무 목이 마른데 시원한 물 한 잔만 주실 수 있나요?', help: '복잡한 문장 중심(7어절 이상)', eojeol: 10, vocabulary: 'GENERAL' },
  ];
  const active = levels.reduce((best, item) => Math.abs(item.eojeol - profile.expressiveMaxEojeol) < Math.abs(best.eojeol - profile.expressiveMaxEojeol) ? item : best, levels[1]);

  async function save() {
    try {
      const saved = await api.saveProfile(userId, {
        age: profile.age,
        receptiveMaxEojeol: profile.receptiveMaxEojeol,
        expressiveMaxEojeol: profile.expressiveMaxEojeol,
        vocabularyLevel: profile.vocabularyLevel,
        allowAbstractLanguage: profile.allowAbstractLanguage,
        allowCausalExpression: profile.allowCausalExpression,
        notes: profile.notes,
      });
      setProfile(saved);
      notify('사용자 언어 수준 설정이 저장되었습니다.');
    } catch (e) { notify(e instanceof Error ? e.message : '저장에 실패했습니다.'); }
  }

  return <main className="p3-subpage"><PageTitle userId={userId} title="AI 문장 추천 수준 설정" back="settings"/><section className="p3-language-card"><h2>사용자가 어느 정도 수준의 문장을 이해할 수 있나요?</h2><p>보호자가 선택한 사용자 수준을 기반으로 AI가 이해하기 쉬운 문장을 생성하고 추천합니다.</p><div className="p3-level-list">{levels.map(item => <button key={item.level} className={active.level === item.level ? 'is-selected' : ''} onClick={() => setProfile(current => ({ ...current, expressiveMaxEojeol: item.eojeol, receptiveMaxEojeol: item.eojeol, vocabularyLevel: item.vocabulary }))}><span>{item.level}</span><div><strong>{item.example}</strong><small>{item.help}</small></div><i/></button>)}</div><button className="p3-save-wide" onClick={() => void save()}>저장하기</button></section></main>;
}

function CategoryEditor({ userId, notify }: { userId: number; notify: (message: string) => void }) {
  const [icon, setIcon] = useState('📁');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#16a56d');
  const [items, setItems] = useState(CATEGORIES.map(item => ({ ...item, base: true })));
  const icons = ['📁','🌟','❤️','🎯','🎨','🎵','🏃','🍎','🌈','🔥','💎','🦋'];
  const colors = ['#16a56d','#ffd052','#ffa31c','#ff7f83','#7b88f3','#84d4e8','#ffad80','#b7c1bd'];

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey('categories', userId));
    if (raw) { try { setItems(JSON.parse(raw)); } catch {} }
  }, [userId]);

  function add() {
    if (!name.trim()) return;
    const next = [...items, { key: name.trim(), icon, color, base: false }];
    setItems(next);
    window.localStorage.setItem(storageKey('categories', userId), JSON.stringify(next));
    setName('');
    notify('카테고리가 추가되었습니다.');
  }

  return <main className="p3-category-page"><section className="p3-category-maker"><div className="p3-category-preview"><span style={{ borderColor: color, background: `${color}22` }}>{icon}</span><strong>{name || '카테고리 이름'}</strong></div><h3>아이콘</h3><div className="p3-icon-palette">{icons.map(value => <button key={value} className={icon === value ? 'is-selected' : ''} onClick={() => setIcon(value)}>{value}</button>)}</div><h3>카테고리 이름</h3><input placeholder="예: 취미활동" value={name} onChange={e => setName(e.target.value)}/><h3>대표 색상</h3><div className="p3-color-palette">{colors.map(value => <button key={value} className={color === value ? 'is-selected' : ''} style={{ background: value }} onClick={() => setColor(value)}/>)}</div><button className="p3-category-add" onClick={add}><Plus/>카테고리 추가</button><Link href={`/guardian?userId=${userId}&screen=settings`} className="p3-category-back"><ArrowLeft/>환경 설정으로</Link></section><section className="p3-category-list"><h1>내 카테고리 ({items.length}개)</h1><p><GripVertical size={15}/> 아이콘을 드래그해서 순서 변경</p>{items.map(item => <div className="p3-category-list-row" key={item.key}><GripVertical/><span style={{ background: item.color }}>{item.icon}</span><strong>{item.key}</strong><em>{item.base ? '기본' : '추가'}</em></div>)}</section></main>;
}

function VoiceSettings({ userId, settings, setSettings, notify }: SharedProps) {
  async function save(next: UserSettings) {
    setSettings(next);
    try {
      const saved = await api.saveUserSettings(userId, {
        name: next.name,
        birthDate: next.birthDate,
        relationshipType: next.relationshipType,
        emergencyContact: next.emergencyContact,
        gridSize: next.gridSize,
        voiceType: next.voiceType,
        speechRate: next.speechRate,
      });
      setSettings(saved);
    } catch (e) { notify(e instanceof Error ? e.message : '음성 설정 저장 실패'); }
  }
  function preview() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance('안녕하세요! 말모아입니다.');
    utterance.lang = 'ko-KR'; utterance.rate = settings.speechRate; utterance.pitch = settings.voiceType === 'CHILD_FEMALE' ? 1.35 : 1.15;
    window.speechSynthesis.speak(utterance);
  }
  return <main className="p3-voice-page"><Link href={`/guardian?userId=${userId}&screen=settings`} className="p3-voice-back"><ArrowLeft/></Link><div className="p3-progress-dots"><i/><i/><i/><i className="off"/></div><h1>음성 설정</h1><p>사용자에게 맞게 목소리를 고르세요</p><div className="p3-voice-list"><button className={settings.voiceType === 'CHILD_MALE' ? 'is-selected' : ''} onClick={() => void save({ ...settings, voiceType: 'CHILD_MALE' })}>남성 아동</button><button className={settings.voiceType === 'CHILD_FEMALE' ? 'is-selected' : ''} onClick={() => void save({ ...settings, voiceType: 'CHILD_FEMALE' })}>여성 아동</button></div><div className="p3-speed-head"><strong>음성 속도</strong><b>{settings.speechRate.toFixed(1)}×</b></div><div className="p3-speed-row"><span>🐢</span><button onClick={() => void save({ ...settings, speechRate: Math.max(.7, +(settings.speechRate-.1).toFixed(1)) })}>−</button><input type="range" min="0.7" max="1.3" step="0.1" value={settings.speechRate} onChange={e => void save({ ...settings, speechRate: Number(e.target.value) })}/><button onClick={() => void save({ ...settings, speechRate: Math.min(1.3, +(settings.speechRate+.1).toFixed(1)) })}>＋</button><span>🐰</span></div><div className="p3-speed-scale"><span>0.7×</span><span>1.3×</span></div><button className="p3-preview-voice" onClick={preview}><Volume2 size={19}/>미리듣기<small>{settings.voiceType === 'CHILD_MALE' ? '남성 아동' : '여성 아동'} · {settings.speechRate.toFixed(1)}×</small></button></main>;
}

function LocationManager({ userId, notify }: { userId: number; notify: (message: string) => void }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [draft, setDraft] = useState({ name: '', type: '학교' as Place['type'], address: '', start: '08:00', end: '15:00' });
  useEffect(() => { const raw = window.localStorage.getItem(storageKey('places', userId)); if (raw) { try { setPlaces(JSON.parse(raw)); } catch {} } }, [userId]);
  function add() { if (!draft.name || !draft.address) return; const next = [...places, { id: crypto.randomUUID(), ...draft }]; setPlaces(next); window.localStorage.setItem(storageKey('places', userId), JSON.stringify(next)); setDraft({ name: '', type: '학교', address: '', start: '08:00', end: '15:00' }); notify('장소가 저장되었습니다.'); }
  return <main className="p3-subpage"><PageTitle userId={userId} title="장소 관리" back="settings"/><div className="p3-location-layout"><section className="p3-place-panel"><h2>자주 가는 장소</h2><p>장소와 시간 조건을 등록하면 관련 상징을 우선 노출할 수 있어요.</p><div className="p3-place-list">{places.map(place => <article key={place.id}><MapPin/><div><strong>{place.name}</strong><span>{place.type} · {place.start}~{place.end}</span><small>{place.address}</small></div><button onClick={() => { const next = places.filter(p => p.id !== place.id); setPlaces(next); window.localStorage.setItem(storageKey('places', userId), JSON.stringify(next)); }}><Trash2/></button></article>)}</div><div className="p3-place-form"><input placeholder="장소 이름" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/><select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value as Place['type'] })}>{['집','학교','병원','치료실'].map(v => <option key={v}>{v}</option>)}</select><input placeholder="주소 검색" value={draft.address} onChange={e => setDraft({ ...draft, address: e.target.value })}/><div><input type="time" value={draft.start} onChange={e => setDraft({ ...draft, start: e.target.value })}/><input type="time" value={draft.end} onChange={e => setDraft({ ...draft, end: e.target.value })}/></div><button className="p3-primary" onClick={add}><Save/>장소 저장</button></div></section><section className="p3-map-panel"><div className="p3-map-canvas"><MapPin size={42}/><strong>Map API 연동 지도 뷰어</strong><span>사용자의 현재 위치와 이동 경로가 표시되는 영역입니다.</span></div><div className="p3-location-status"><span><i/>실시간 위치 연결 대기</span><small>GPS 백엔드 수신 후 현재 위치 핀과 이동 경로를 표시합니다.</small></div></section></div></main>;
}

function GuardianReport({ userId, notifications, stats }: { userId: number; notifications: GuardianNotification[]; stats: RecommendationStats | null }) {
  const emergencyCount = notifications.length;
  const selectionRate = stats?.personalized.selectionRate ?? 0;
  return <main className="p3-subpage"><PageTitle userId={userId} title="보호자 리포트" back="settings"/><div className="p3-report-toolbar"><div><button className="is-selected">주간</button><button>월간</button><button>일자 지정</button></div><button className="p3-report-export">PDF 리포트 내보내기</button></div><div className="p3-report-grid"><section className="p3-report-card"><h2>단어 사용 패턴 분석</h2><div className="p3-report-summary"><article><span>긴급 모드 발생</span><strong>{emergencyCount}회</strong></article><article><span>개인화 문장 선택률</span><strong>{Math.round(selectionRate * 100)}%</strong></article></div><h3>자주 사용한 상징 TOP 5</h3><div className="p3-empty-chart"><BarChart3/><p>상징별 사용 빈도 API가 연결되면 실제 TOP 5가 표시됩니다.</p></div><h3>AI 발화 맥락 인사이트</h3><blockquote>현재는 추천 선택 통계와 긴급 알림 데이터를 기준으로 리포트 영역을 구성합니다.</blockquote></section><section className="p3-report-card"><h2>심박 변동 및 표정 변화</h2><div className="p3-heart-chart"><Heart/><div className="p3-chart-line"/><span>60</span><span>100</span><span>110+</span></div><div className="p3-report-event"><Clock3/><div><strong>생체·표정 데이터 연동 대기</strong><p>MAX30102 심박 데이터와 표정 인식 결과가 수신되면 시간대별 타임라인에 함께 표시됩니다.</p></div></div></section></div></main>;
}

function PageTitle({ userId, title, back }: { userId: number; title: string; back: Screen }) {
  return <header className="p3-page-title"><Link href={`/guardian?userId=${userId}&screen=${back}`}><ArrowLeft/></Link><h1>{title}</h1></header>;
}

function readImage(file: File | undefined, done: (value: string) => void) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => typeof reader.result === 'string' && done(reader.result);
  reader.readAsDataURL(file);
}
