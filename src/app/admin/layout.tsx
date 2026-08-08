"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  const [adminName, setAdminName] = useState<string | null>(null);
  // The login page itself never needs the check below — running it there
  // too would just redirect straight back to itself.
  const [resolved, setResolved] = useState(isLoginPage);

  useEffect(() => {
    if (isLoginPage) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`${API_BASE}/admin/auth/me`, { credentials: "include" });
      if (cancelled) return;
      if (!res.ok) {
        router.push("/admin/login");
        return;
      }
      const { admin } = await res.json();
      setAdminName(admin.name);
      setResolved(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoginPage]);

  async function handleLogout() {
    await fetch(`${API_BASE}/admin/auth/logout`, { method: "POST", credentials: "include" });
    router.push("/admin/login");
  }

  if (isLoginPage) return <>{children}</>;
  if (!resolved) return null;

  return (
    <div className="admin-wrap">
      <div className="header-row">
        <div className="brand">
          <span className="mark">✓</span> Konfirm Admin
        </div>
        <div className="nav">
          {adminName && <span className="hint">{adminName}</span>}
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
