import Link from 'next/link';
import { HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="m2-system-screen">
      <section className="m2-system-card" aria-labelledby="not-found-title">
        <div className="m2-system-icon m2-system-icon--neutral" aria-hidden>
          <HelpCircle size={34} strokeWidth={2.2}/>
        </div>
        <h1 id="not-found-title">페이지를 찾을 수 없어요</h1>
        <p>주소가 바뀌었거나 삭제되었을 수 있어요.</p>
        <Link className="m2-system-button m2-system-button--primary" href="/">홈으로</Link>
      </section>
    </main>
  );
}
