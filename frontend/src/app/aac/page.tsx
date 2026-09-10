import { Topbar } from '@/components/Topbar';
import { AacLab } from '@/components/AacLab';

export default async function AacPage({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  const params = await searchParams;
  const parsed = Number(params.userId);
  const userId = Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  return <div className="shell"><Topbar/><AacLab userId={userId}/></div>;
}
