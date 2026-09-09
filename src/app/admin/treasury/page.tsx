"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface TreasuryStatus {
  contract_id: string;
  signers: string[];
  threshold: string;
  usdc_balance: string | null;
  reachable: boolean;
  wired_into_checkout: boolean;
}

function explorerUrl(id: string): string {
  return `https://stellar.expert/explorer/testnet/contract/${id}`;
}

function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;
}

export default function AdminTreasuryPage() {
  const [status, setStatus] = useState<TreasuryStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const result = await apiFetch<TreasuryStatus>("/admin/treasury/status");
      if (result.ok) setStatus(result.data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="empty">Loading…</div>;
  if (!status) return <div className="empty">Could not load treasury status.</div>;

  return (
    <div>
      <h1>Treasury</h1>
      <p className="sub">
        The treasury Soroban contract, read live via its USDC balance. It is deployed and multi-sig-controlled but not yet in the
        live checkout or x402 settlement path — nothing currently routes funds through it.
      </p>

      {!status.wired_into_checkout && (
        <div className="status" style={{ marginBottom: 20 }}>
          Not wired into checkout yet — this contract holds no operational funds today. Tracked as an open issue on
          konfirm-backend.
        </div>
      )}

      <div className="admin-section">
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">USDC balance</div>
            <div className={`stat-value ${status.reachable ? "" : "stat-bad"}`}>
              {status.reachable ? `$${status.usdc_balance}` : "unreachable"}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Signer threshold</div>
            <div className="stat-value">{status.threshold}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Signers</div>
            <div className="stat-value">{status.signers.length}</div>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h2>Contract</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono">
                  <a href={explorerUrl(status.contract_id)} target="_blank" rel="noreferrer">
                    {status.contract_id}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-section">
        <h2>Signers ({status.threshold})</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {status.signers.map((s) => (
                <tr key={s}>
                  <td className="mono">{shortAddress(s)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
