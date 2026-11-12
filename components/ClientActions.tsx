"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientActions({ orderId, mode, revisionsLeft }: { orderId: string; mode: "review" | "reply"; revisionsLeft: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(action: "approve" | "revise" | "reply") {
    setError("");
    if (action !== "approve" && !note.trim()) { setError(action === "revise" ? "Please describe the changes you want." : "Please write your answer."); return; }
    if (action === "approve" && !window.confirm("Approve this draft as final? You will then be able to download your files.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/client`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, note }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error ?? "Something went wrong. Please try again."); return; }
      setNote(""); setOpen(false);
      router.refresh();
    } catch {
      setError("Network problem. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "reply") {
    return (
      <div className="mt-4">
        <label htmlFor="reply" className="label">Your answer</label>
        <textarea id="reply" rows={4} className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        {error && <p className="err" role="alert">{error}</p>}
        <button className="btn btn-primary mt-3" disabled={busy} onClick={() => send("reply")}>{busy ? "Sending…" : "Send answer"}</button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" disabled={busy} onClick={() => send("approve")}>Approve</button>
        <button className="btn btn-ghost" disabled={busy || revisionsLeft <= 0} onClick={() => setOpen(!open)} aria-expanded={open}>Request changes</button>
        <button className="btn btn-ghost" disabled title="Available after you approve">Download</button>
      </div>
      <p className="mt-2 text-xs text-navy/60">
        Downloads unlock after you approve. {revisionsLeft > 0 ? `${revisionsLeft} free revision${revisionsLeft === 1 ? "" : "s"} left.` : "You have used both free revisions."}
      </p>
      {open && (
        <div className="mt-4">
          <label htmlFor="changes" className="label">What should we change?</label>
          <textarea id="changes" rows={4} className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn btn-navy mt-3" disabled={busy} onClick={() => send("revise")}>{busy ? "Sending…" : "Send change request"}</button>
        </div>
      )}
      {error && <p className="err" role="alert">{error}</p>}
    </div>
  );
}
