'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Database, RefreshCcw, Server, Sparkles, XCircle } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { api } from '@/lib/api';
import type { SystemReadiness } from '@/types';

export default function StatusPage() {
  const [status, setStatus] = useState<SystemReadiness | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setStatus(await api.readiness());
    } catch (e) {
      setStatus(null);
      setError(e instanceof Error ? e.message : '백엔드 상태를 확인하지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return <div className="shell"><Topbar/><main className="page">
    <div className="page-title"><div><h1>배포 연결 상태</h1><p>Render 배포 후 Neon DB와 Gemini 설정이 실제로 연결됐는지 빠르게 확인합니다.</p></div><button className="secondary" disabled={loading} onClick={() => void load()}><RefreshCcw size={16}/> 다시 확인</button></div>
    {error && <p className="error">{error}</p>}
    <div className="comparison-stats">
      <StatusCard icon={<Server size={21}/>} title="Backend" ok={Boolean(status)} detail={status ? status.service : loading ? '확인 중...' : '연결 실패'}/>
      <StatusCard icon={<Database size={21}/>} title="Neon PostgreSQL" ok={status?.database === 'ok'} detail={status ? `database=${status.database}` : '백엔드 연결 후 확인 가능'}/>
      <StatusCard icon={<Sparkles size={21}/>} title="Gemini API 설정" ok={status?.geminiConfigured === true} detail={status ? `${status.geminiModel} · ${status.geminiConfigured ? '키 설정됨' : '키 미설정'}` : '백엔드 연결 후 확인 가능'}/>
    </div>
    <section className="panel"><h2>최종 확인 기준</h2><p className="panel-desc">이 화면에서 Gemini가 “설정됨”으로 나오는 것은 키가 서버에 존재한다는 뜻입니다. 실제 API 호출 성공 여부는 사용자 AAC의 A/B 문장 생성 후 결과 배지가 <strong>Gemini 실시간</strong>인지까지 확인해야 합니다.</p><p className="small">Fallback 배지가 나오면 Gemini 호출이 실패했거나 키/모델 설정이 없는 상태입니다. 이 경우에도 AAC 기본 동작은 멈추지 않도록 로컬 fallback을 사용합니다.</p></section>
  </main></div>;
}

function StatusCard({ icon, title, ok, detail }: { icon: React.ReactNode; title: string; ok: boolean; detail: string }) {
  return <div className={`stats-column ${ok ? 'personalized' : ''}`}><strong style={{display:'flex',alignItems:'center',gap:8}}>{icon}{title}{ok ? <CheckCircle2 size={17}/> : <XCircle size={17}/>}</strong><div><span>{detail}</span></div></div>;
}
