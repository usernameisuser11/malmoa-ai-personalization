import Link from 'next/link';
import { Link2, MessageSquareText, Settings2 } from 'lucide-react';

export default function Home() {
  return (
    <main className="landing">
      <section className="hero-card">
        <div className="brand-badge">말모아</div>
        <h1>사용자에게 맞는 말하기를<br/>함께 설정해요</h1>
        <p>보호자 설정과 사용자 AAC를 연결해 개인화 문장 추천을 확인하는 테스트 화면입니다.</p>
        <div className="role-grid lab-home-grid">
          <Link className="role-card" href="/guardian?userId=1">
            <Settings2 size={24}/>
            <strong>보호자 설정</strong>
            <span>사용자 정보, 화면 격자, 음성, 의사소통 수준과 개인 어휘를 설정해요.</span>
          </Link>
          <Link className="role-card" href="/connect">
            <Link2 size={24}/>
            <strong>사용자 기기 연결</strong>
            <span>QR 또는 6자리 코드로 보호자와 사용자 기기를 연결해요.</span>
          </Link>
          <Link className="role-card" href="/aac?userId=1">
            <MessageSquareText size={24}/>
            <strong>사용자 AAC</strong>
            <span>상징을 고르고 일반 추천과 개인화 추천을 직접 비교해요.</span>
          </Link>
        </div>
        <p className="caption">현재는 기능 검증용 실험판입니다. 실제 개인정보 대신 테스트 데이터를 사용해주세요.</p>
      </section>
    </main>
  );
}
