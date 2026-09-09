import Link from "next/link";

export default function ChangesPage() {
  return <main className="changes-page"><header><Link className="wordmark" href="/">TokenCost</Link><Link href="/rates">← Rates</Link></header><section><p className="eyebrow">Verified history</p><h1>Price changes</h1><p>There are no recorded changes yet. TokenCost creates a history step only after a normalized official price actually changes—never from demo data.</p><div className="empty-ledger"><span>Ledger ready</span><strong>0 verified changes</strong><small>Initial snapshot: 8 September 2026</small></div></section></main>;
}
