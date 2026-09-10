import { Topbar } from '@/components/Topbar';
import { GuardianLab } from '@/components/GuardianLab';

export default async function GuardianPage({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  const params = await searchParams;
  const parsed = Number(params.userId);
  const userId = Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  return <div className="shell guardian-shell"><Topbar/><GuardianLab userId={userId}/></div>;
}
