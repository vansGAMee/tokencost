import type { Metadata } from "next";
import { SharedCalculation } from "@/components/share/shared-calculation";

export const metadata: Metadata = { title: "Shared calculation", description: "A private TokenCost calculation. Code stays in the URL fragment." };

export default function SharedPage() { return <SharedCalculation />; }
