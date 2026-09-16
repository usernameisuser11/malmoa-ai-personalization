'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Copy, QrCode, RefreshCcw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
import type { PairingClaim, PairingCredential } from '@/types';

type Mode = 'code' | 'qr' | 'guardian';

export function PairingLab({ initialToken = '', initialMode = 'code', demo = false }: { initialToken?: string; initialMode?: Mode; demo?: boolean }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [guardianUserId, setGuardianUserId] = useState(1);
  const [credential, setCredential] = useState<PairingCredential | null>(null);
  const [code, setCode] = useState(demo ? '123456' : '');
  const [token] = useState(initialToken);
  const [deviceId, setDeviceId] = useState('');
  const [deviceType, setDeviceType] = useState<'TABLET' | 'MOBILE' | 'WEB' | 'UNKNOWN'>('WEB');
  const [claim, setClaim] = useState<PairingClaim | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const saved = window.localStorage.getItem('malmoa-device-id');
    const id = saved || crypto.randomUUID();
    if (!saved) window.localStorage.setItem('malmoa-device-id', id);
    setDeviceId(id);
    const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    setDeviceType(mobile ? 'MOBILE' : 'WEB');
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = useMemo(() => {
    if (!credential) return 0;
    return Math.max(0, Math.ceil((new Date(credential.expiresAt).getTime() - clock) / 1000));
  }, [credential, clock]);

  const qrToken = token || (demo && mode === 'qr' ? 'demo-token' : '');

  async function issue(refresh = false) {
    setBusy(true);
    setError('');
    setMessage('');

    if (demo) {
      await new Promise(resolve => window.setTimeout(resolve, 450));
      setCredential({
        code: '123456',
        qrPayload: `${window.location.origin}/connect?token=demo-token&demo=1`,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        remainingSeconds: 600,
      });
      setMessage(refresh ? '새 체험용 연결 정보를 만들었어요.' : '체험용 연결 정보를 만들었어요.');
      setBusy(false);
      return;
    }

    try {
      const next = refresh ? await api.refreshPairing(guardianUserId) : await api.issuePairing(guardianUserId);
      setCredential(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : '연결 정보 생성에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function connect() {
    const normalizedCode = code.replace(/\D/g, '').slice(0, 6);
    if (!qrToken && normalizedCode.length !== 6) {
      setError('6자리 연결 코드를 입력해주세요.');
      return;
    }
    setBusy(true);
    setError('');
    setClaim(null);

    if (demo) {
      await new Promise(resolve => window.setTimeout(resolve, 550));
      const result: PairingClaim = {
        aacUserId: 1,
        deviceId: deviceId || 'demo-device',
        pairedAt: new Date().toISOString(),
      };
      setClaim(result);
      window.localStorage.setItem('aacUserId', String(result.aacUserId));
      setBusy(false);
      return;
    }

    try {
      const body = { deviceId, deviceName: '말모아 사용자 기기', deviceType };
      const result = qrToken
        ? await api.claimPairingQr(qrToken, body)
        : await api.claimPairingCode(normalizedCode, body);
      setClaim(result);
      window.localStorage.setItem('aacUserId', String(result.aacUserId));
    } catch (e) {
      setError(e instanceof Error ? e.message : '기기 연결에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!credential) return;
    await navigator.clipboard.writeText(credential.code);
    setMessage('초대 코드를 복사했어요.');
  }

  if (mode === 'guardian') {
    return (
      <main className="m2-connect m2-connect--guardian">
        <Link href={demo ? '/' : '/guardian'} className="m2-connect__back"><ArrowLeft size={18}/>돌아가기</Link>
        <section className="m2-guardian-pairing">
          {demo ? <span className="m2-connect-demo-badge">체험 모드</span> : null}
          <h1>사용자 기기 연결</h1>
          <p>사용자에게 전달할 6자리 초대 코드와 QR을 만들어요.</p>
          {error ? <p className="m2-connect__error">{error}</p> : null}
          {message ? <p className="m2-connect__success">{message}</p> : null}
          <label className="m2-guardian-userid">AAC 사용자 ID<input type="number" min={1} value={guardianUserId} onChange={e => setGuardianUserId(Math.max(1, Number(e.target.value) || 1))}/></label>
          <button className="m2-button m2-button--primary" disabled={busy} onClick={() => void issue(false)}>{busy ? '만드는 중...' : '연결 정보 만들기'}</button>
          {credential ? (
            <div className="m2-guardian-credential">
              <div className="m2-guardian-qr"><QRCodeSVG value={credential.qrPayload} size={210} level="M" includeMargin/></div>
              <div>
                <span>6자리 초대 코드</span>
                <strong>{credential.code}</strong>
                <button onClick={() => void copyCode()}><Copy size={15}/>복사</button>
                <small>{remaining > 0 ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')} 남음` : '만료됨'}</small>
                <button className="m2-refresh-link" onClick={() => void issue(true)}><RefreshCcw size={14}/>새로 발급</button>
              </div>
            </div>
          ) : null}
          {demo ? <Link className="m2-demo-next-link" href="/connect?mode=code&demo=1">사용자 코드 입력 화면도 체험하기 →</Link> : null}
        </section>
      </main>
    );
  }

  if (claim) {
    return (
      <main className="m2-connect">
        <section className="m2-connect__center m2-connected">
          <CheckCircle2 size={54}/>
          <h1>연결이 완료됐어요</h1>
          <p>{demo ? '체험용 연결이 완료됐어요. 이제 AAC 화면을 사용해 보세요.' : '이제 말모아 AAC를 바로 사용할 수 있어요.'}</p>
          <Link className="m2-button m2-button--primary" href={`/aac?userId=${claim.aacUserId}${demo ? '&demo=1' : ''}`}>AAC 시작하기</Link>
        </section>
      </main>
    );
  }

  if (mode === 'qr') {
    return (
      <main className="m2-connect">
        <button type="button" className="m2-connect__back" onClick={() => history.back()}><ArrowLeft size={18}/>뒤로가기</button>
        <section className="m2-connect__center">
          {demo ? <span className="m2-connect-demo-badge">체험 모드</span> : null}
          <h1>QR 스캔</h1>
          <p>보호자가 만든 QR을 휴대폰 카메라로 스캔해주세요</p>
          <div className="m2-scanner" aria-label="QR 스캔 영역">
            <i/><i/><i/><i/>
            <QrCode size={58}/>
            <span>{qrToken ? 'QR 연결 정보를 확인했어요' : 'QR을 비추면 자동으로 인식해요'}</span>
          </div>
          {demo ? <p className="m2-demo-connect-note">체험에서는 QR 인식이 완료된 상태를 재현합니다.</p> : null}
          {error ? <p className="m2-connect__error">{error}</p> : null}
          {qrToken ? <button className="m2-button m2-button--primary" disabled={busy} onClick={() => void connect()}>{busy ? '연결 중...' : '연결하기'}</button> : null}
          <button type="button" className="m2-text-link" onClick={() => { setMode('code'); setError(''); }}>초대 코드로 연결</button>
        </section>
      </main>
    );
  }

  return (
    <main className="m2-connect">
      <button type="button" className="m2-connect__back" onClick={() => history.back()}><ArrowLeft size={18}/>뒤로가기</button>
      <section className="m2-connect__center">
        {demo ? <span className="m2-connect-demo-badge">체험 모드</span> : null}
        <h1>코드 입력</h1>
        <p>보호자가 발급한 6자리 초대 코드를 입력하세요</p>
        <label className="m2-code-input-wrap">
          <span className="sr-only">6자리 초대 코드</span>
          <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}/>
          <div className="m2-code-boxes" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => <span key={index}>{code[index] ?? ''}</span>)}
          </div>
        </label>
        {demo ? <p className="m2-demo-connect-note">체험용 코드 <b>123456</b>이 미리 입력되어 있어요.</p> : null}
        {error ? <p className="m2-connect__error">{error}</p> : null}
        <button className="m2-button m2-button--primary" disabled={busy || code.length !== 6} onClick={() => void connect()}>{busy ? '연결 중...' : '연결하기'}</button>
        <button type="button" className="m2-text-link" onClick={() => { setMode('qr'); setError(''); }}>QR로 스캔</button>
      </section>
    </main>
  );
}
