import { Topbar } from '@/components/Topbar';
import { PairingLab } from '@/components/PairingLab';

export default async function ConnectPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return <div className="shell"><Topbar/><PairingLab initialToken={params.token ?? ''}/></div>;
}
