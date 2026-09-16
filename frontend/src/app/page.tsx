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
        <span className="m2-welcome__hint">보호자 앱에서 초대 코드나 QR을 받아 주세요</span>
      </section>
    </main>
  );
}
