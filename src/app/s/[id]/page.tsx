import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharedCalculation } from "@/components/share/shared-calculation";
import { readStoredShare } from "@/server/share-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Shared calculation",
  description: "A shared TokenCost code calculation.",
  robots: { index: false, follow: false },
};

export default async function ShortSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await readStoredShare(id);
  if (!payload) notFound();
  return <SharedCalculation initialPayload={payload} />;
}
