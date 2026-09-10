import type { Metadata } from 'next';
import './globals.css';
import './result-status.css';

export const metadata: Metadata = {
  title: '말모아 AI 개인화 테스트',
  description: '사용자 의사소통 수준과 개인 어휘를 반영하는 AAC 실험판',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
