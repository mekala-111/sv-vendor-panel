import { fetchWallet } from "@/lib/server-data";

export async function WalletBalance() {
  const wallet = await fetchWallet();
  return <>{wallet.balance}</>;
}
