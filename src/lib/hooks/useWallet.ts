/** Wallet balance & transaction fetchers for the vendor panel. */

import { api } from "@/lib/api";

export interface Wallet {
  id: string;
  vendorId: string;
  balance: number;
  currency: string;
  updatedAt: string;
}

export type WalletTransactionType = "CREDIT" | "DEBIT" | "REFUND" | "ADJUSTMENT";

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

export async function fetchWallet(): Promise<Wallet> {
  return api.get<Wallet>("/wallet");
}

export async function fetchWalletTransactions(params: { page?: number; limit?: number } = {}) {
  const { page = 1, limit = 20 } = params;
  const { items, meta } = await api.getList<WalletTransaction>("/wallet/transactions", {
    params: { page, limit },
  });
  return { items, page: meta.page, totalPages: meta.totalPages, total: meta.total };
}
