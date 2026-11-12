"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminReviewControls({ id, approved, googleDone }: { id: string; approved: boolean; googleDone: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function patch(body: Record<string, boolean>) {
    setBusy(true); setError("");
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!res.ok) setError("Could not update."); else router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {approved ? <button className="btn btn-ghost" disabled={busy} onClick={() => patch({ approved: false })}>Hide</button> : <button className="btn btn-primary" disabled={busy} onClick={() => patch({ approved: true })}>Approve</button>}
      <button className="btn btn-ghost" disabled={busy} onClick={() => patch({ google_review_done: !googleDone })}>{googleDone ? "Unmark Google done" : "Mark Google done"}</button>
      {error && <span className="err">{error}</span>}
    </div>
  );
}
