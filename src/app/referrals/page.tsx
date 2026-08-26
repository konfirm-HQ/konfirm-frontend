"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRequireAuth } from "@/lib/useAuth";

interface Merchant {
  name: string;
}

interface ReferralRow {
  name: string;
  email: string;
  created_at: string;
  activated: boolean;
}

interface ReferralsResponse {
  code: string | null;
  referrals: ReferralRow[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

export default function ReferralsPage() {
  const { resolved } = useRequireAuth<Merchant>({
    meEndpoint: "/auth/me",
    loginPath: "/login",
    select: (body) => (body as { merchant: Merchant }).merchant,
  });
  const [data, setData] = useState<ReferralsResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!resolved) return;
    (async () => {
      const res = await apiFetch<ReferralsResponse>("/auth/me/referrals");
      if (res.ok) setData(res.data);
    })();
  }, [resolved]);

  if (!resolved) return null;

  const referralUrl = data?.code ? `${window.location.origin}/signup?ref=${data.code}` : null;

  function copyLink() {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 20px" }}>
      <h1>Refer other merchants</h1>

      {!data ? (
        <div className="empty">Loading…</div>
      ) : (
        <>
          <div className="admin-section">
            <p>Share your link. Anyone who signs up through it is automatically credited to you — no code to remember.</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <code className="mono" style={{ padding: "8px 12px", background: "var(--surface)", borderRadius: 8 }}>
                {referralUrl}
              </code>
              <button type="button" onClick={copyLink}>
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          </div>

          <div className="admin-section">
            <h2 style={{ fontSize: 15, marginBottom: 12 }}>People you&apos;ve referred</h2>
            {data.referrals.length === 0 ? (
              <div className="empty">Nobody yet — share your link above.</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Merchant</th>
                      <th>Status</th>
                      <th>Referred</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.referrals.map((r) => (
                      <tr key={r.email}>
                        <td>
                          <div style={{ color: "var(--text-hi)" }}>{r.name}</div>
                          <div className="mono">{r.email}</div>
                        </td>
                        <td>
                          <span className={`status-pill ${r.activated ? "paid" : "pending"}`}>
                            {r.activated ? "Active" : "Signed up"}
                          </span>
                        </td>
                        <td>{formatDate(r.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
