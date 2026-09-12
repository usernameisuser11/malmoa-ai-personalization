import Link from 'next/link';
import { Activity, Home, Link2, MessageSquareText, Settings2, Sparkles } from 'lucide-react';
import { GuardianLab } from '@/components/GuardianLab';

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/guardian?userId=1', label: '보호자 설정', icon: Settings2, active: true },
  { href: '/connect', label: '기기 연결', icon: Link2 },
  { href: '/context?userId=1', label: '개인화 정보', icon: Sparkles },
  { href: '/status', label: '연결 상태', icon: Activity },
];

export default async function GuardianPage({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  const params = await searchParams;
  const parsed = Number(params.userId);
  const userId = Number.isInteger(parsed) && parsed > 0 ? parsed : 1;

  return (
    <div className="guardian-shell g2-shell">
      <aside className="g2-sidebar" aria-label="보호자 메뉴">
        <Link className="g2-brand" href="/" aria-label="말모아 홈">
          <MessageSquareText size={27} strokeWidth={2.4}/>
          <span><b>Mal</b><strong>Moa</strong></span>
        </Link>

        <div className="g2-profile">
          <div className="g2-avatar" aria-hidden>{String(userId).slice(-1)}</div>
          <div>
            <strong>말모아 보호자</strong>
            <span>AAC 사용자 #{userId}</span>
          </div>
        </div>

        <nav className="g2-nav">
          {navItems.map(({ href, label, icon: Icon, active }) => {
            const resolvedHref = href.includes('userId=1') ? href.replace('userId=1', `userId=${userId}`) : href;
            return (
              <Link key={label} href={resolvedHref} className={active ? 'is-active' : ''}>
                <Icon size={19} strokeWidth={2}/>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="g2-sidebar-note">
          <strong>AI 개인화 실험판</strong>
          <span>사용자 설정이 AAC 추천에 어떻게 반영되는지 확인하는 테스트 환경입니다.</span>
        </div>
      </aside>

      <div className="g2-content">
        <header className="g2-mobile-header">
          <Link className="g2-brand" href="/">MalMoa</Link>
          <Link href={`/aac?userId=${userId}`}>사용자 AAC</Link>
        </header>
        <GuardianLab userId={userId}/>
      </div>
    </div>
  );
}
