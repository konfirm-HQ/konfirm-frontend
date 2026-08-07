"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus("");
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, stellar_base_address: address.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof body.message === "string" ? body.message : "Check your details — something in that form was not right.";
        throw new Error(msg);
      }
      router.push("/activity");
    } catch (err) {
      console.error("[konfirm signup]", err);
      setStatus(err instanceof Error ? err.message : "Could not create your account. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="page-center">
      <div className="card">
        <div className="brand" style={{ marginBottom: 24 }}>
          <span className="mark">✓</span> Konfirm
        </div>
        <h1 style={{ marginBottom: 22 }}>Create your account</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Business name</label>
            <input
              id="name"
              type="text"
              autoComplete="organization"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="hint">At least 8 characters.</div>
          </div>
          <div className="field">
            <label htmlFor="address">Your Stellar payout address</label>
            <input
              id="address"
              type="text"
              placeholder="G..."
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <div className="hint">This is where your payments land — Konfirm never holds your funds.</div>
          </div>
          <button type="submit" className="primary" disabled={submitting}>
            Create account
          </button>
          <div className={`status${status ? " error" : ""}`}>{status}</div>
        </form>
        <div className="footer">
          Already have an account? <Link href="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
