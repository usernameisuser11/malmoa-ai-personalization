'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Database, RefreshCcw, Server, Sparkles, XCircle } from 'lucide-react';
import { Topbar } from '@/components/Topbar';
import { api } from '@/lib/api';
import type { GeminiProbe, SystemReadiness } from '@/types';

export default function StatusPage() {
  const [status, setStatus] = useState<SystemReadiness | null>(null);
  const [probe, setProbe] = useState<GeminiProbe | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [probing, setProbing] = useState(false);

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

  async function probeGemini() {
    setProbing(true);
    setError('');
    try {
      setProbe(await api.geminiProbe());
    } catch (e) {
      setProbe(null);
      setError(e instanceof Error ? e.message : 'Gemini 실제 호출에 실패했습니다.');
    } finally {
      setProbing(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return <div className="shell"><Topbar/><main className="page">
    <div className="page-title"><div><h1>배포 연결 상태</h1><p>Render 배포 후 Backend, Neon DB, Gemini 설정과 실제 호출 여부를 확인합니다.</p></div><button className="secondary" disabled={loading} onClick={() => void load()}><RefreshCcw size={16}/> 다시 확인</button></div>
    {error && <p className="error">{error}</p>}
    <div className="comparison-stats">
      <StatusCard icon={<Server size={21}/>} title="Backend" ok={Boolean(status?.ready)} detail={status ? `${status.service} · ready=${status.ready}` : loading ? '확인 중...' : '연결 실패'}/>
      <StatusCard icon={<Database size={21}/>} title="Neon PostgreSQL" ok={status?.database === 'ok'} detail={status ? `database=${status.database}` : '백엔드 연결 후 확인 가능'}/>
      <StatusCard icon={<Sparkles size={21}/>} title="Gemini API 설정" ok={status?.geminiConfigured === true} detail={status ? `${status.geminiModel} · ${status.geminiConfigured ? '키 설정됨' : '키 미설정'}` : '백엔드 연결 후 확인 가능'}/>
    </div>

    <section className="panel">
      <div className="page-title"><div><h2>Gemini 실제 호출 테스트</h2><p className="panel-desc">키가 존재하는지만 보지 않고 서버가 현재 설정된 모델을 실제로 호출할 수 있는지 테스트합니다.</p></div><button className="primary" disabled={probing || !status?.geminiConfigured} onClick={() => void probeGemini()}><Sparkles size={16}/> {probing ? '호출 중...' : '실제 호출 테스트'}</button></div>
      {!probe ? <p className="small">배포 후 버튼을 한 번 눌러 Gemini API 키·모델·네트워크가 모두 정상인지 확인해주세요.</p> : <div className={`stats-column ${probe.reachable ? 'personalized' : ''}`}><strong>{probe.reachable ? 'Gemini 실제 호출 성공' : 'Gemini 실제 호출 실패'}</strong><div><span>model={probe.model}</span><span>status={probe.status}</span><span>configured={String(probe.configured)}</span><span>reachable={String(probe.reachable)}</span></div></div>}
    </section>

    <section className="panel"><h2>최종 확인 기준</h2><p className="panel-desc">Neon은 <strong>database=ok</strong>, Gemini는 위 실제 호출 테스트에서 <strong>reachable=true</strong>가 되어야 연결이 완전히 확인된 상태입니다. 이후 사용자 AAC에서 A/B 문장을 생성해 결과 배지가 <strong>Gemini 실시간</strong>인지까지 확인합니다.</p><p className="small">Fallback 배지가 나오면 Gemini 호출 실패를 숨기지 않고 로컬 fallback을 사용한 상태입니다. AAC 기본 의사소통은 계속 가능하도록 구성되어 있습니다.</p></section>
  </main></div>;
}

function StatusCard({ icon, title, ok, detail }: { icon: React.ReactNode; title: string; ok: boolean; detail: string }) {
  return <div className={`stats-column ${ok ? 'personalized' : ''}`}><strong style={{display:'flex',alignItems:'center',gap:8}}>{icon}{title}{ok ? <CheckCircle2 size={17}/> : <XCircle size={17}/>}</strong><div><span>{detail}</span></div></div>;
}
