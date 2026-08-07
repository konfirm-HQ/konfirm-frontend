"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

interface Payment {
  id: string;
  net_usdc: string;
  asset_code: string;
  payer_address: string;
  link_description: string | null;
}

function formatAmount(amount: number, code: string): string {
  return code === "USDC" ? `$${amount.toFixed(2)}` : `${amount.toFixed(2)} ${code}`;
}

function ActivityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryMerchant = searchParams.get("merchant");

  const [merchantAddress, setMerchantAddress] = useState<string | null>(queryMerchant);
  const [merchantName, setMerchantName] = useState<string | null>(null);
  const [showNav, setShowNav] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pending, setPending] = useState(false);
  // If ?merchant= was already in the URL there's nothing to resolve
  // asynchronously — derived synchronously at init rather than set inside
  // an effect body, which avoids an extra cascading render for that case.
  const [resolved, setResolved] = useState(() => Boolean(queryMerchant));

  // A ?merchant=G... in the URL still works (handy for support or a
  // one-off check), but the normal path is the logged-in session — no
  // address to remember or paste.
  useEffect(() => {
    if (queryMerchant) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
      if (cancelled) return;
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const { merchant } = await res.json();
      setMerchantAddress(merchant.stellar_base_address);
      setMerchantName(merchant.name);
      setShowNav(true);
      setResolved(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryMerchant]);

  const poll = useCallback(async () => {
    if (!merchantAddress) return;
    const [paymentsRes, pendingRes] = await Promise.all([
      fetch(`${API_BASE}/payments/by-merchant/${merchantAddress}`),
      fetch(`${API_BASE}/payments/pending-by-merchant/${merchantAddress}`),
    ]);
    const paymentsBody: Payment[] = await paymentsRes.json();
    const pendingBody = await pendingRes.json();
    setPayments(paymentsBody);
    setPending(Boolean(pendingBody.pending));
  }, [merchantAddress]);

  // The recursive scheduling lives here, in a plain local function, rather
  // than inside the `poll` callback referencing itself — a useCallback
  // can't safely call itself by name before its own declaration finishes
  // binding on each render.
  useEffect(() => {
    if (!resolved) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function loop() {
      if (cancelled) return;
      await poll();
      if (!cancelled) timer = setTimeout(loop, 3000);
    }
    loop();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [resolved, poll]);

  async function handleLogout() {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    router.push("/login");
  }

  const totals: Record<string, number> = {};
  payments.forEach((p) => {
    totals[p.asset_code] = (totals[p.asset_code] || 0) + Number(p.net_usdc);
  });
  const hasBalances = Object.keys(totals).length > 0;

  return (
    <div className="wrap">
      <div className="header-row">
        <div className="brand">
          <span className="mark">✓</span> Konfirm
        </div>
        {showNav && (
          <div className="nav">
            <Link href="/new">+ New payment</Link>
            <Link href="/cashout">Cash out</Link>
            <button type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </div>
      <h1>{merchantName ? `${merchantName}'s activity` : "Your activity"}</h1>
      <p className="sub">Every payment below landed and was konfirmed on-chain — nothing here is an estimate.</p>
      <div className="live-dot">
        <span className="d" /> Watching for new payments
      </div>
      <div className={`waiting-banner${pending ? " show" : ""}`}>
        <span className="spin" /> A payment is on its way — konfirming on-chain now…
      </div>
      <div className="balance">
        {hasBalances ? (
          Object.entries(totals).map(([code, amount]) => (
            <div key={code}>
              {formatAmount(amount, code)} <small>received</small>
            </div>
          ))
        ) : (
          <>
            $0.00 <small>received</small>
          </>
        )}
      </div>
      <div>
        {resolved && !merchantAddress && <div className="empty">No Stellar address on file yet.</div>}
        {merchantAddress && payments.length === 0 && !pending && (
          <div className="empty">No payments yet — this updates the instant one lands.</div>
        )}
        {payments.map((p) => (
          <div className="payment" key={p.id}>
            <div className="left">
              <div className="tick">✓</div>
              <div className="desc">
                {p.link_description || "Payment"}
                <div className="from">
                  from {p.payer_address.slice(0, 4)}…{p.payer_address.slice(-4)}
                </div>
              </div>
            </div>
            <div className="amount">{formatAmount(Number(p.net_usdc), p.asset_code)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ActivityPage() {
  return (
    <Suspense>
      <ActivityContent />
    </Suspense>
  );
}
