import { PairingLab } from '@/components/PairingLab';

export default async function ConnectPage({ searchParams }: { searchParams: Promise<{ token?: string; mode?: string; demo?: string }> }) {
  const params = await searchParams;
  const mode = params.mode === 'guardian' || params.mode === 'qr' ? params.mode : 'code';
  const demo = params.demo === '1' || params.demo === 'true';
  return <PairingLab initialToken={params.token ?? ''} initialMode={params.token ? 'qr' : mode} demo={demo}/>;
}
