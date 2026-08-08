"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

interface WithdrawalAttempt {
  id: string;
  currency: string;
  anchor_tx_id: string;
  last_status: string | null;
  last_polled_at: string | null;
  created_at: string;
  merchant_name: string;
  merchant_email: string;
}

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : "—";
}

export default function AdminWithdrawalsPage() {
  const [attempts, setAttempts] = useState<WithdrawalAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(showSpinner: boolean) {
    if (showSpinner) setLoading(true);
    const res = await fetch(`${API_BASE}/admin/withdrawal-attempts`, { credentials: "include" });
    if (res.ok) setAttempts(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await load(true);
    })();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await load(false);
    setRefreshing(false);
  }

  return (
    <div>
      <h1>Withdrawals</h1>
      <p className="sub">
        Cash-outs are a live proxy to Stellar&apos;s reference anchor — Konfirm has no local record of a withdrawal beyond this. Each
        row reflects the anchor&apos;s last known status; refreshing re-polls anything not yet finished. There is no admin action here
        beyond visibility — Konfirm has no authority to change the anchor&apos;s own transaction state.
      </p>

      <div className="admin-section">
        <button type="button" onClick={handleRefresh} disabled={refreshing} style={{ width: "auto", marginBottom: 16 }}>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>

        {loading ? (
          <div className="empty">Loading…</div>
        ) : attempts.length === 0 ? (
          <div className="empty">No cash-outs have been started yet.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Merchant</th>
                  <th>Currency</th>
                  <th>Anchor tx</th>
                  <th>Status</th>
                  <th>Last checked</th>
                  <th>Started</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ color: "var(--text-hi)" }}>{a.merchant_name}</div>
                      <div className="mono">{a.merchant_email}</div>
                    </td>
                    <td>{a.currency}</td>
                    <td className="mono">{a.anchor_tx_id}</td>
                    <td>
                      {a.last_status ? (
                        <span className={`status-pill ${a.last_status}`}>{a.last_status}</span>
                      ) : (
                        <span className="hint">unknown</span>
                      )}
                    </td>
                    <td>{formatDate(a.last_polled_at)}</td>
                    <td>{formatDate(a.created_at)}</td>
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
