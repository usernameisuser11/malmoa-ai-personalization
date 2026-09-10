import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '말모아 AI 개인화 AAC',
    short_name: '말모아 Lab',
    description: '사용자 의사소통 수준과 개인 어휘 기반 AAC 실험판',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8F8FA',
    theme_color: '#149E69',
    lang: 'ko-KR',
  };
}
