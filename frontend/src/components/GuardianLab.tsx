'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, Check, Heart, ImagePlus, Save, Star, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { AacSymbol, CommunicationProfile, GuardianNotification } from '@/types';

const USER_ID = 1;
const CATEGORIES = ['전체','긴급어','사람','음식','장소','신체','행동','감정','설명','대화','문법'];
const PRESETS = [
  { label:'단어 중심', help:'1~2어절', receptive:2, expressive:2, vocabulary:'VERY_EASY', abstract:false, causal:false },
  { label:'짧은 문장', help:'3~4어절', receptive:4, expressive:4, vocabulary:'EASY', abstract:false, causal:false },
  { label:'일반 문장', help:'5~7어절', receptive:7, expressive:7, vocabulary:'GENERAL', abstract:false, causal:true },
  { label:'확장 표현', help:'8어절+', receptive:10, expressive:10, vocabulary:'GENERAL', abstract:true, causal:true },
];
const DEFAULT_PROFILE: CommunicationProfile = { userId:USER_ID, age:10, receptiveMaxEojeol:4, expressiveMaxEojeol:4, vocabularyLevel:'EASY', allowAbstractLanguage:false, allowCausalExpression:false, notes:'' };

export function GuardianLab() {
  const [profile,setProfile]=useState<CommunicationProfile>(DEFAULT_PROFILE);
  const [symbols,setSymbols]=useState<AacSymbol[]>([]);
  const [notifications,setNotifications]=useState<GuardianNotification[]>([]);
  const [category,setCategory]=useState('전체');
  const [editingId,setEditingId]=useState<number|null>(null);
  const [draft,setDraft]=useState<Partial<AacSymbol>>({});
  const [loading,setLoading]=useState(true);
  const [status,setStatus]=useState('');
  const [error,setError]=useState('');

  async function load(){setLoading(true);setError('');try{const[p,s,n]=await Promise.all([api.getProfile(USER_ID),api.getSymbols(USER_ID),api.notifications(USER_ID)]);setProfile(p);setSymbols(s);setNotifications(n);}catch(e){setError(e instanceof Error?e.message:'불러오기에 실패했습니다.');}finally{setLoading(false);}}
  useEffect(()=>{void load();},[]);

  const filtered=useMemo(()=>category==='전체'?symbols:symbols.filter(s=>s.category===category),[symbols,category]);
  const editing=symbols.find(s=>s.id===editingId)??null;
  const unread=notifications.filter(n=>!n.read).length;

  function beginEdit(symbol:AacSymbol){setEditingId(symbol.id);setDraft({...symbol});setStatus('');}
  function applyPreset(preset:(typeof PRESETS)[number]){setProfile(p=>({...p,receptiveMaxEojeol:preset.receptive,expressiveMaxEojeol:preset.expressive,vocabularyLevel:preset.vocabulary,allowAbstractLanguage:preset.abstract,allowCausalExpression:preset.causal}));setStatus(`실험용 ‘${preset.label}’ 기준을 적용했습니다. 저장을 눌러 확정해주세요.`);}

  async function saveProfile(){setStatus('저장 중...');setError('');try{const saved=await api.saveProfile(USER_ID,{age:profile.age,receptiveMaxEojeol:profile.receptiveMaxEojeol,expressiveMaxEojeol:profile.expressiveMaxEojeol,vocabularyLevel:profile.vocabularyLevel,allowAbstractLanguage:profile.allowAbstractLanguage,allowCausalExpression:profile.allowCausalExpression,notes:profile.notes});setProfile(saved);setStatus('의사소통 프로필을 저장했습니다.');}catch(e){setError(e instanceof Error?e.message:'저장 실패');setStatus('');}}
  async function saveSymbol(){if(!editing)return;setStatus('카드 저장 중...');setError('');try{const saved=await api.customizeSymbol(USER_ID,editing.id,draft);setSymbols(current=>current.map(s=>s.id===saved.id?saved:s));setDraft({...saved});setStatus(`‘${saved.displayText}’ 카드를 저장했습니다.`);}catch(e){setError(e instanceof Error?e.message:'카드 저장 실패');setStatus('');}}
  async function markRead(n:GuardianNotification){if(n.read)return;try{const saved=await api.markNotificationRead(USER_ID,n.id);setNotifications(cur=>cur.map(x=>x.id===saved.id?saved:x));}catch{}}

  async function onImage(file:File|undefined){
    if(!file)return;
    setError('');setStatus('이미지를 최적화하는 중...');
    try{const dataUrl=await compressImage(file);setDraft(d=>({...d,imageUrl:dataUrl}));setStatus('이미지를 카드에 적용했습니다. 카드 설정 저장을 눌러 DB에 저장해주세요.');}
    catch(e){setError(e instanceof Error?e.message:'이미지를 처리하지 못했습니다.');setStatus('');}
  }

  if(loading)return <main className="page"><p className="loading">설정을 불러오는 중...</p></main>;
  return <main className="page">
    <div className="page-title"><div><h1>보호자 개인화 설정</h1><p>진단명 대신 실제 이해·표현 능력과 개인 어휘를 AI 제약조건으로 저장합니다.</p></div><span className="small">TEST USER #{USER_ID}</span></div>
    {error&&<p className="error">{error}</p>}

    <section className="panel"><h2><Bell size={19}/> 긴급 알림 {unread>0&&<span className="notification-count">{unread}</span>}</h2><p className="panel-desc">긴급 카드를 발화하면 DB에 알림이 생성됩니다. 이 실험판 UI는 알림 기능 검증용이며 예서님 최종 알림 디자인으로 간주하지 않습니다.</p>{notifications.length===0?<p className="small">아직 긴급 알림이 없습니다.</p>:<div className="notification-list">{notifications.slice(0,6).map(n=><button key={n.id} className={`notification-item ${n.read?'read':''}`} onClick={()=>void markRead(n)}><span><strong>{n.aacUserName}</strong> · {n.message}<small>{new Date(n.createdAt).toLocaleString('ko-KR')}</small></span>{!n.read&&<Check size={16}/>}</button>)}</div>}</section>

    <section className="panel"><h2>1. 의사소통 프로필</h2><p className="panel-desc">아래 프리셋은 임상 장애등급이 아니라 프로토타입 검증용 시작값입니다. 실제 사용자의 능력에 맞춰 숫자와 항목을 직접 조정할 수 있습니다.</p>
      <div className="preset-grid">{PRESETS.map(p=><button key={p.label} className="preset-card" onClick={()=>applyPreset(p)}><strong>{p.label}</strong><span>{p.help}</span></button>)}</div>
      <div className="form-grid"><div className="field"><label>연령</label><input type="number" min={1} max={120} value={profile.age??''} onChange={e=>setProfile({...profile,age:e.target.value?Number(e.target.value):null})}/></div><div className="field"><label>어휘 난이도</label><select value={profile.vocabularyLevel} onChange={e=>setProfile({...profile,vocabularyLevel:e.target.value})}><option value="VERY_EASY">매우 쉬운 생활어</option><option value="EASY">쉬운 일상어</option><option value="GENERAL">일반 어휘</option></select></div><div className="field"><label>이해 가능한 권장 최대 길이 (어절)</label><input type="number" min={1} max={20} value={profile.receptiveMaxEojeol} onChange={e=>setProfile({...profile,receptiveMaxEojeol:Number(e.target.value)})}/><span className="small">예: 4 → “선생님 물 주세요” 정도</span></div><div className="field"><label>주로 표현 가능한 최대 길이 (어절)</label><input type="number" min={1} max={20} value={profile.expressiveMaxEojeol} onChange={e=>setProfile({...profile,expressiveMaxEojeol:Number(e.target.value)})}/><span className="small">AI가 생성할 문장의 실제 상한으로 사용</span></div></div><div className="check-row"><input id="abstract" type="checkbox" checked={profile.allowAbstractLanguage} onChange={e=>setProfile({...profile,allowAbstractLanguage:e.target.checked})}/><label htmlFor="abstract">추상적인 표현도 이해/사용할 수 있음</label></div><div className="check-row"><input id="causal" type="checkbox" checked={profile.allowCausalExpression} onChange={e=>setProfile({...profile,allowCausalExpression:e.target.checked})}/><label htmlFor="causal">“~해서”, “왜냐하면” 같은 간단한 이유 표현 가능</label></div><div className="field"><label>보호자 메모</label><textarea rows={3} value={profile.notes??''} placeholder="예: 질문형보다 요청형을 잘 이해함. 낯선 추상어는 어려워함." onChange={e=>setProfile({...profile,notes:e.target.value})}/></div><div className="actions"><button className="primary" onClick={saveProfile}><Save size={17}/> 프로필 저장</button>{status&&<span className="status">{status}</span>}</div></section>

    <section className="panel"><h2>2. 상징 카드 · 개인 어휘 커스터마이징</h2><p className="panel-desc">표준 단어는 보존하고, 사용자에게 익숙한 표시 문구·별칭·TTS·이미지를 별도로 저장합니다. 즐겨찾기와 중요 단어는 AI 추천에 우선 반영됩니다.</p><div className="category-tabs">{CATEGORIES.map(c=><button key={c} className={`category-tab ${category===c?'active':''}`} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="edit-layout"><div className="list">{filtered.map(symbol=><button key={symbol.id} className={`list-item ${editingId===symbol.id?'active':''}`} onClick={()=>beginEdit(symbol)}><strong>{symbol.displayText}</strong><br/><span className="small">{symbol.category} · 표준: {symbol.canonicalText}{symbol.favorite?' · ★':''}</span></button>)}</div><div>{!editing?<div className="result-column"><p>왼쪽에서 수정할 카드를 선택해줘.</p></div>:<><div className="custom-image-preview">{draft.imageUrl?<img src={draft.imageUrl} alt={draft.displayText||editing.canonicalText}/>:<span>사용자 이미지 없음</span>}</div><div className="form-grid"><div className="field"><label>표준 텍스트 (유지)</label><input disabled value={editing.canonicalText}/></div><div className="field"><label>화면 표시 텍스트</label><input value={draft.displayText??''} onChange={e=>setDraft({...draft,displayText:e.target.value})}/></div><div className="field"><label>사용자 별칭/고유 표현</label><input placeholder="예: 사용자가 평소 부르는 표현" value={draft.userAlias??''} onChange={e=>setDraft({...draft,userAlias:e.target.value})}/></div><div className="field"><label>TTS 발화 문구</label><input value={draft.ttsText??''} onChange={e=>setDraft({...draft,ttsText:e.target.value})}/></div><div className="field"><label>커스텀 이미지 URL 또는 데이터</label><input placeholder="URL을 직접 넣어도 됩니다" value={draft.imageUrl?.startsWith('data:')?'[업로드한 이미지 데이터]':draft.imageUrl??''} onChange={e=>{if(!draft.imageUrl?.startsWith('data:'))setDraft({...draft,imageUrl:e.target.value})}}/></div><div className="field"><label>카드 정렬 순서 (선택)</label><input type="number" value={draft.sortOrder??''} onChange={e=>setDraft({...draft,sortOrder:e.target.value?Number(e.target.value):null})}/></div></div><div className="image-actions"><label className="secondary file-button"><ImagePlus size={16}/> 내 사진으로 바꾸기<input type="file" accept="image/*" onChange={e=>void onImage(e.target.files?.[0])}/></label>{draft.imageUrl&&<button className="secondary" onClick={()=>setDraft({...draft,imageUrl:null})}><Trash2 size={16}/> 사용자 이미지 제거</button>}</div><p className="small">프로토타입에서는 이미지를 320px 이하 JPEG로 압축해 Neon의 TEXT 필드에 저장합니다. 운영 버전에서는 별도 객체 스토리지로 분리할 예정입니다.</p><div className="check-row"><input id="favorite" type="checkbox" checked={draft.favorite??false} onChange={e=>setDraft({...draft,favorite:e.target.checked})}/><label htmlFor="favorite"><Star size={15}/> 즐겨찾기 — 추천 개인화에 반영</label></div><div className="check-row"><input id="important" type="checkbox" checked={draft.importantWord??false} onChange={e=>setDraft({...draft,importantWord:e.target.checked})}/><label htmlFor="important"><Heart size={15}/> 중요 단어 — AI가 문맥에 맞으면 최우선 활용</label></div><div className="actions"><button className="primary" onClick={saveSymbol}><Save size={17}/> 카드 설정 저장</button></div></>}</div></div></section>
  </main>;
}

function compressImage(file:File):Promise<string>{
  if(!file.type.startsWith('image/'))return Promise.reject(new Error('이미지 파일만 등록할 수 있습니다.'));
  if(file.size>12*1024*1024)return Promise.reject(new Error('원본 이미지는 12MB 이하만 사용할 수 있습니다.'));
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('이미지를 읽지 못했습니다.'));
    reader.onload=()=>{
      const image=new Image();
      image.onerror=()=>reject(new Error('이미지를 해석하지 못했습니다.'));
      image.onload=()=>{
        const max=320;const scale=Math.min(1,max/Math.max(image.width,image.height));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
        const ctx=canvas.getContext('2d');if(!ctx){reject(new Error('이미지를 변환하지 못했습니다.'));return;}
        ctx.drawImage(image,0,0,canvas.width,canvas.height);
        const data=canvas.toDataURL('image/jpeg',0.78);
        if(data.length>450000){reject(new Error('압축 후 이미지가 너무 큽니다. 더 작은 사진을 사용해주세요.'));return;}
        resolve(data);
      };
      image.src=String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
