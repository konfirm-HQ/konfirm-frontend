"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

interface Merchant {
  id: string;
  email: string;
  name: string;
  status: "pending" | "active" | "suspended";
  risk_tier: string;
  stellar_base_address: string | null;
  created_at: string;
}

interface ActivityEntry {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  detail: { reason?: string } | null;
  created_at: string;
  admin_name: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function shortAddress(address: string | null): string {
  if (!address) return "—";
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default function AdminDashboardPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const [merchantsRes, activityRes] = await Promise.all([
      fetch(`${API_BASE}/admin/merchants`, { credentials: "include" }),
      fetch(`${API_BASE}/admin/activity`, { credentials: "include" }),
    ]);
    if (merchantsRes.ok) setMerchants(await merchantsRes.json());
    if (activityRes.ok) setActivity(await activityRes.json());
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  async function toggleStatus(merchant: Merchant) {
    const nextStatus = merchant.status === "suspended" ? "active" : "suspended";
    const verb = nextStatus === "suspended" ? "suspend" : "reactivate";
    if (!window.confirm(`${verb === "suspend" ? "Suspend" : "Reactivate"} ${merchant.name} (${merchant.email})?`)) return;

    let reason: string | null = "";
    if (verb === "suspend") {
      reason = window.prompt("Reason (optional, shown in the activity log):", "");
      if (reason === null) return;
    }

    setPendingId(merchant.id);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/merchants/${merchant.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, reason: reason || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Could not ${verb} this merchant.`);
      }
      await load();
    } catch (err) {
      console.error("[konfirm admin] status change failed", err);
      setError(err instanceof Error ? err.message : `Could not ${verb} this merchant.`);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <h1>Merchants</h1>

      <div className="admin-section">
        {loading ? (
          <div className="empty">Loading…</div>
        ) : merchants.length === 0 ? (
          <div className="empty">No merchants yet.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Merchant</th>
                  <th>Status</th>
                  <th>Risk tier</th>
                  <th>Stellar address</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ color: "var(--text-hi)" }}>{m.name}</div>
                      <div className="mono">{m.email}</div>
                    </td>
                    <td>
                      <span className={`status-pill ${m.status}`}>{m.status}</span>
                    </td>
                    <td>{m.risk_tier}</td>
                    <td className="mono">{shortAddress(m.stellar_base_address)}</td>
                    <td>{formatDate(m.created_at)}</td>
                    <td>
                      <button type="button" disabled={pendingId === m.id} onClick={() => toggleStatus(m)}>
                        {m.status === "suspended" ? "Reactivate" : "Suspend"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {error && <div className="status error">{error}</div>}
      </div>

      <div className="admin-section">
        <h2>Recent activity</h2>
        {activity.length === 0 ? (
          <div className="empty">No admin actions yet.</div>
        ) : (
          <ul className="activity-feed">
            {activity.map((a) => (
              <li key={a.id}>
                <span className="when">{formatDate(a.created_at)}</span>
                <span className="who">{a.admin_name}</span> {a.action.replace(".", " ")} {a.target_type} {a.target_id.slice(0, 8)}
                {a.detail?.reason && <> — &ldquo;{a.detail.reason}&rdquo;</>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
