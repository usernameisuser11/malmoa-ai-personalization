import Link from 'next/link';

export function Topbar() {
  return (
    <header className="topbar">
      <Link href="/">말모아 Lab</Link>
      <nav className="navs">
        <Link className="nav-pill" href="/guardian">보호자</Link>
        <Link className="nav-pill" href="/connect">기기 연결</Link>
        <Link className="nav-pill" href="/aac">사용자 AAC</Link>
        <Link className="nav-pill" href="/status">연결 상태</Link>
      </nav>
    </header>
  );
}
