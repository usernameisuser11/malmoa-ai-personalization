import Link from 'next/link';

export function Topbar() {
  return (
    <header className="topbar">
      <Link href="/" aria-label="말모아 홈">말모아</Link>
      <nav className="navs" aria-label="말모아 실험판 메뉴">
        <Link className="nav-pill" href="/guardian">보호자 설정</Link>
        <Link className="nav-pill" href="/connect">기기 연결</Link>
        <Link className="nav-pill" href="/aac">사용자 AAC</Link>
        <Link className="nav-pill" href="/context">개인화 정보</Link>
        <Link className="nav-pill" href="/status">연결 상태</Link>
      </nav>
    </header>
  );
}
