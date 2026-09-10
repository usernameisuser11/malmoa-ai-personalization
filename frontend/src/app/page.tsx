import Link from 'next/link';
import { BrainCircuit, Settings2, MessageSquareText } from 'lucide-react';

export default function Home() {
  return (
    <main className="landing">
      <section className="hero-card">
        <div className="brand-badge"><BrainCircuit size={20}/> 말모아 Personalization Lab</div>
        <h1>사용자에게 AAC가 맞춰지는<br/>개인화 실험판</h1>
        <p>보호자가 의사소통 수준과 개인 어휘를 설정하고, 사용자는 그 정보가 반영된 AI 문장 추천을 실제로 사용해볼 수 있습니다.</p>
        <div className="role-grid">
          <Link className="role-card" href="/guardian"><Settings2/><strong>보호자 설정</strong><span>언어 수준 · 카드 · 즐겨찾기 커스터마이징</span></Link>
          <Link className="role-card" href="/aac"><MessageSquareText/><strong>사용자 AAC</strong><span>상징 선택 · AI 추천 비교 · TTS · 긴급 모드</span></Link>
        </div>
        <p className="caption">현재 실험판은 테스트 사용자 ID 1을 사용합니다. 실제 인증/연결은 기존 SMU-SENSE 흐름에서 다음 단계로 통합합니다.</p>
      </section>
    </main>
  );
}
