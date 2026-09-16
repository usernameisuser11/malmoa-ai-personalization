import { AacLab } from '@/components/AacLab';

export default async function AacPage({ searchParams }: { searchParams: Promise<{ userId?: string; demo?: string }> }) {
  const params = await searchParams;
  const parsed = Number(params.userId);
  const userId = Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  const demo = params.demo === '1' || params.demo === 'true';
  return <AacLab userId={userId} demo={demo}/>;
}
