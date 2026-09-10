import Link from 'next/link';
import { BrainCircuit, Link2, MessageSquareText, Settings2 } from 'lucide-react';

export default function Home() {
  return (
    <main className="landing">
      <section className="hero-card">
        <div className="brand-badge"><BrainCircuit size={20}/> 말모아 Personalization Lab</div>
        <h1>사용자에게 AAC가 맞춰지는<br/>개인화 실험판</h1>
        <p>보호자가 의사소통 수준과 개인 어휘를 설정하고, 사용자는 그 정보가 반영된 AI 문장 추천을 실제로 사용해볼 수 있습니다.</p>
        <div className="role-grid lab-home-grid">
          <Link className="role-card" href="/guardian"><Settings2/><strong>보호자 설정</strong><span>언어 수준 · 카드 · 즐겨찾기 · 화면 격자 · TTS 커스터마이징</span></Link>
          <Link className="role-card" href="/connect"><Link2/><strong>사용자 기기 연결</strong><span>10분 QR · 6자리 연결 코드 · 연결 기기 확인</span></Link>
          <Link className="role-card" href="/aac"><MessageSquareText/><strong>사용자 AAC</strong><span>상징 선택 · 일반/개인화 AI A/B 비교 · TTS · 긴급 모드</span></Link>
        </div>
        <p className="caption">기본 실험 사용자는 ID 1입니다. 기기 연결을 완료하면 연결된 사용자 ID로 AAC 화면이 열립니다. 실제 개인정보 대신 테스트 데이터를 사용해주세요.</p>
      </section>
    </main>
  );
}
