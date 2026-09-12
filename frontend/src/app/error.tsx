'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="m2-system-screen">
      <section className="m2-system-card" aria-labelledby="error-title">
        <div className="m2-system-icon m2-system-icon--error" aria-hidden>
          <AlertCircle size={34} strokeWidth={2.2}/>
        </div>
        <h1 id="error-title">잠시 후 다시 시도해 주세요</h1>
        <p>요청을 처리하지 못했어요.</p>
        <button className="m2-system-button m2-system-button--primary" type="button" onClick={() => reset()}>다시 시도</button>
        <Link className="m2-system-button m2-system-button--outline" href="/">홈으로</Link>
      </section>
    </main>
  );
}
