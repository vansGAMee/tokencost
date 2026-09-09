import type { Metadata } from "next";
import { RatesMarket } from "@/components/rates/rates-market";

export const metadata: Metadata = { title: "Live model rates", description: "Compare current official AI model token prices." };

export default async function RatesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <RatesMarket initial={{ query: typeof params.q === "string" ? params.q : "", provider: typeof params.provider === "string" ? params.provider : "All", currency: typeof params.currency === "string" ? params.currency : "USD", modelId: typeof params.model === "string" ? params.model : "" }} />;
}
