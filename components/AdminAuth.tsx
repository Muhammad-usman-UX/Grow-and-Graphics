"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    const { error: err } = await getBrowserClient().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) return setError("Wrong email or password.");
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card mx-auto max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-bold">Admin login</h1>
      <div><label htmlFor="a-email" className="label">Email</label><input id="a-email" type="email" autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><label htmlFor="a-pass" className="label">Password</label><input id="a-pass" type="password" autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button className="text-sm font-semibold text-navy/70 hover:text-navy" onClick={async () => { await getBrowserClient().auth.signOut(); router.push("/admin/login"); router.refresh(); }}>
      Log out
    </button>
  );
}
