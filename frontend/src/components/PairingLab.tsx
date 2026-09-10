'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, Link2, QrCode, RefreshCcw, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
import type { PairingClaim, PairingCredential, PairedDevice } from '@/types';

const DEFAULT_USER_ID = 1;

export function PairingLab({ initialToken = '' }: { initialToken?: string }) {
  const [guardianUserId, setGuardianUserId] = useState(DEFAULT_USER_ID);
  const [credential, setCredential] = useState<PairingCredential | null>(null);
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [code, setCode] = useState('');
  const [token, setToken] = useState(initialToken);
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('말모아 웹 AAC');
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

  useEffect(() => {
    void loadDevices(guardianUserId);
  }, [guardianUserId]);

  const remaining = useMemo(() => {
    if (!credential) return 0;
    return Math.max(0, Math.ceil((new Date(credential.expiresAt).getTime() - clock) / 1000));
  }, [credential, clock]);

  async function loadDevices(userId: number) {
    try {
      setDevices(await api.pairedDevices(userId));
    } catch {
      setDevices([]);
    }
  }

  async function issue(refresh = false) {
    if (!Number.isInteger(guardianUserId) || guardianUserId < 1) {
      setError('사용자 ID는 1 이상의 정수여야 합니다.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const next = refresh
        ? await api.refreshPairing(guardianUserId)
        : await api.issuePairing(guardianUserId);
      setCredential(next);
      setMessage(refresh ? '기존 연결 정보를 폐기하고 새로 발급했습니다.' : '10분 동안 사용할 연결 정보를 만들었습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '연결 정보 생성에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!credential) return;
    await navigator.clipboard.writeText(credential.code);
    setMessage('6자리 코드를 복사했습니다.');
  }

  async function connect() {
    const normalizedCode = code.replace(/\D/g, '').slice(0, 6);
    if (!token && normalizedCode.length !== 6) {
      setError('QR 링크로 들어오거나 6자리 연결 코드를 입력해주세요.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    setClaim(null);
    try {
      const body = { deviceId, deviceName: deviceName.trim() || '말모아 기기', deviceType };
      const result = token
        ? await api.claimPairingQr(token, body)
        : await api.claimPairingCode(normalizedCode, body);
      setClaim(result);
      setMessage('보호자와 AAC 기기 연결이 완료되었습니다.');
      await loadDevices(result.aacUserId);
    } catch (e) {
      setError(e instanceof Error ? e.message : '기기 연결에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <div className="page-title">
        <div>
          <h1>사용자 기기 연결</h1>
          <p>기존 말모아의 QR · 6자리 코드 연결 흐름을 실제 DB와 연결해서 검증합니다.</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {message && <p className="success-box">{message}</p>}

      <div className="pairing-grid">
        <section className="panel">
          <h2><QrCode size={19}/> 보호자: 연결 정보 만들기</h2>
          <p className="panel-desc">새로 발급하면 이전 ACTIVE 코드는 즉시 취소됩니다. QR과 코드는 10분 동안만 유효합니다.</p>
          <div className="field">
            <label>AAC 사용자 ID</label>
            <input type="number" min={1} value={guardianUserId} onChange={e => setGuardianUserId(Math.max(1, Number(e.target.value) || 1))}/>
          </div>
          <div className="actions">
            <button className="primary" disabled={busy} onClick={() => void issue(false)}><Link2 size={17}/> 연결 정보 생성</button>
            <button className="secondary" disabled={busy || !credential} onClick={() => void issue(true)}><RefreshCcw size={17}/> 새로 발급</button>
          </div>

          {credential && (
            <div className="pairing-credential">
              <div className="qr-box"><QRCodeSVG value={credential.qrPayload} size={190} level="M" includeMargin aria-label="말모아 기기 연결 QR 코드"/></div>
              <div>
                <span className="small">6자리 연결 코드</span>
                <div className="pairing-code" aria-label={`연결 코드 ${credential.code}`}>{credential.code}</div>
                <button className="secondary" onClick={() => void copyCode()}><Copy size={15}/> 코드 복사</button>
                <p className={remaining > 0 ? 'pairing-timer' : 'pairing-timer expired'}>
                  {remaining > 0 ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')} 남음` : '만료됨 · 새로 발급해주세요'}
                </p>
              </div>
            </div>
          )}

          <h3 className="subheading">연결된 기기</h3>
          {devices.length === 0 ? <p className="small">아직 연결된 기기가 없습니다.</p> : (
            <div className="device-list">
              {devices.map(d => <div className="device-item" key={`${d.deviceId}-${d.pairedAt}`}><Smartphone size={18}/><span><strong>{d.deviceName}</strong><small>{d.deviceType} · {new Date(d.pairedAt).toLocaleString('ko-KR')}</small></span></div>)}
            </div>
          )}
        </section>

        <section className="panel">
          <h2><Smartphone size={19}/> 사용자: 이 기기 연결하기</h2>
          <p className="panel-desc">QR을 스캔해 이 페이지로 들어왔다면 토큰이 자동으로 들어옵니다. 아니면 보호자 화면의 6자리 코드를 입력합니다.</p>
          {token ? (
            <div className="token-ready"><CheckCircle2 size={18}/><span>QR 연결 정보가 확인되었습니다.</span><button type="button" onClick={() => setToken('')}>코드 입력으로 변경</button></div>
          ) : (
            <div className="field">
              <label>6자리 연결 코드</label>
              <input className="code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000"/>
            </div>
          )}
          <div className="form-grid pairing-device-fields">
            <div className="field"><label>기기 이름</label><input maxLength={160} value={deviceName} onChange={e => setDeviceName(e.target.value)}/></div>
            <div className="field"><label>기기 종류</label><select value={deviceType} onChange={e => setDeviceType(e.target.value as typeof deviceType)}><option value="MOBILE">휴대폰</option><option value="TABLET">태블릿</option><option value="WEB">PC / 웹</option><option value="UNKNOWN">기타</option></select></div>
          </div>
          <button className="primary connect-submit" disabled={busy || (!token && code.length !== 6)} onClick={() => void connect()}>{busy ? <RefreshCcw size={17}/> : <Link2 size={17}/>} {token ? 'QR로 연결 완료' : '코드로 연결'}</button>

          {claim && (
            <div className="claim-result">
              <CheckCircle2 size={30}/>
              <strong>연결 완료</strong>
              <span>사용자 #{claim.aacUserId} · 기기 ID {claim.deviceId.slice(0, 8)}…</span>
              <Link className="primary" href={`/aac?userId=${claim.aacUserId}`}>이 기기에서 AAC 열기</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
