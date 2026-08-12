"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

type SettlementStatus = "settled" | "failed" | "held";

interface Settlement {
  id: string;
  payer_address: string;
  pay_to: string;
  asset_contract: string;
  amount: string;
  resource_url: string | null;
  status: SettlementStatus;
  tx_hash: string | null;
  created_at: string;
}

const STATUS_OPTIONS: SettlementStatus[] = ["settled", "failed", "held"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

// x402 USDC amounts arrive in atomic units (7 decimals), unlike the
// existing payments table's already-decimal amount_usdc.
function formatAmount(amount: string): string {
  const n = Number(amount) / 10_000_000;
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : amount;
}

function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;
}

export default function AdminX402SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [filter, setFilter] = useState<"" | SettlementStatus>("");
  const [loading, setLoading] = useState(true);

  async function load(status: string) {
    setLoading(true);
    const url = status ? `${API_BASE}/admin/x402-settlements?status=${status}` : `${API_BASE}/admin/x402-settlements`;
    const res = await fetch(url, { credentials: "include" });
    if (res.ok) setSettlements(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await load(filter);
    })();
  }, [filter]);

  return (
    <div>
      <h1>x402 Settlements</h1>
      <p className="sub">
        Per-request agent payments settled through Konfirm&apos;s x402 facilitator (the <code>exact</code> scheme on Stellar
        testnet). A &quot;held&quot; row is a request that passed protocol-level verification but was rejected by Konfirm&apos;s
        compliance check — the same blocklist and on-chain check that already protect checkout and the reconciler.
      </p>

      <div className="admin-inline-form">
        <div className="field">
          <label htmlFor="filter">Filter by status</label>
          <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value as "" | SettlementStatus)}>
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-section">
        {loading ? (
          <div className="empty">Loading…</div>
        ) : settlements.length === 0 ? (
          <div className="empty">No settlements match this filter.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Payer</th>
                  <th>Pay to</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Tx hash</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <td className="mono">{shortAddress(s.payer_address)}</td>
                    <td className="mono">{shortAddress(s.pay_to)}</td>
                    <td className="mono">{formatAmount(s.amount)}</td>
                    <td>
                      <span className={`status-pill ${s.status}`}>{s.status}</span>
                    </td>
                    <td className="mono">{s.tx_hash ? shortAddress(s.tx_hash) : "—"}</td>
                    <td>{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
