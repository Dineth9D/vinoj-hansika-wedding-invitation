"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      window.location.reload();
    } else {
      setError(data.error || "Could not log in.");
      setBusy(false);
    }
  }

  return (
    <main className="admin">
      <form className="admin-card narrow" onSubmit={submit}>
        <h1>Guest list</h1>
        <p className="admin-muted">Enter the admin password to see replies.</p>
        <label className="a-field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus />
        </label>
        {error && <p className="a-error" role="alert">{error}</p>}
        <button className="a-btn primary" disabled={busy}>
          {busy ? "Checking…" : "Log in"}
        </button>
      </form>
    </main>
  );
}
