import { GuardianExperience } from '@/components/GuardianExperience';

const SCREENS = new Set(['home', 'settings', 'language', 'categories', 'location', 'tts', 'report']);

type GuardianScreen = 'home' | 'settings' | 'language' | 'categories' | 'location' | 'tts' | 'report';

export default async function GuardianPage({ searchParams }: { searchParams: Promise<{ userId?: string; screen?: string }> }) {
  const params = await searchParams;
  const parsed = Number(params.userId);
  const userId = Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  const screen = SCREENS.has(params.screen ?? '') ? params.screen as GuardianScreen : 'home';
  return <GuardianExperience userId={userId} screen={screen}/>;
}
