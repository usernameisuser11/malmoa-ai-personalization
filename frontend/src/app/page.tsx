import Link from 'next/link';

export default function Home() {
  return (
    <main className="m2-welcome">
      <section className="m2-welcome__content" aria-labelledby="welcome-title">
        <h1 id="welcome-title">말모아에 오신 것을 환영해요</h1>
        <p>보호자와 연결하면 바로 대화를 시작할 수 있어요</p>
        <div className="m2-welcome__actions">
          <Link className="m2-button m2-button--primary" href="/connect?mode=code">초대 코드로 연결</Link>
          <Link className="m2-button m2-button--outline" href="/connect?mode=qr">QR로 스캔</Link>
        </div>
        <div className="m2-welcome__demo">
          <span>아직 연결 전이라면</span>
          <Link href="/aac?demo=1">프로토타입 바로 체험하기 <b>→</b></Link>
          <small>백엔드 없이도 상징 선택 · AI 문장 추천 · 음성 출력을 직접 체험할 수 있어요.</small>
        </div>
        <span className="m2-welcome__hint">보호자 앱에서 초대 코드나 QR을 받아 주세요</span>
      </section>
    </main>
  );
}
