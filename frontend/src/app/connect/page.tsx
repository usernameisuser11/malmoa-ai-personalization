import { PairingLab } from '@/components/PairingLab';

export default async function ConnectPage({ searchParams }: { searchParams: Promise<{ token?: string; mode?: string }> }) {
  const params = await searchParams;
  const mode = params.mode === 'guardian' || params.mode === 'qr' ? params.mode : 'code';
  return <PairingLab initialToken={params.token ?? ''} initialMode={params.token ? 'qr' : mode}/>;
}
