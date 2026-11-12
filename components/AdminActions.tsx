"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Panel = null | "work" | "improve" | "ask";

export default function AdminActions({ orderId, status, prompt, canApprove, canReview }: { orderId: string; status: string; prompt: string; canApprove: boolean; canReview: boolean }) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [note, setNote] = useState("");
  const [p, setP] = useState(prompt);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function act(action: string, extra: Record<string, string> = {}) {
    setError(""); setMsg(""); setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error ?? "Something went wrong."); return; }
      setPanel(null); setNote("");
      setMsg(action === "approve" ? (j.emailed ? "Approved. The client was emailed." : "Approved. The client can now see it on their order page (email is paused).") : "Done.");
      router.refresh();
    } catch {
      setError("Network problem.");
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File | null) {
    if (!file) return;
    setError(""); setMsg(""); setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/upload`, { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) setError(j.error ?? "Upload failed."); else { setMsg("File added as a draft. Approve it to send it."); router.refresh(); }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="text-lg font-bold">Actions</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="btn btn-primary" disabled={busy || !canApprove} onClick={() => act("approve")}>APPROVE AND SEND TO CLIENT</button>
        <button className="btn btn-ghost" disabled={busy || !canReview} onClick={() => setPanel(panel === "work" ? null : "work")}>NEEDS WORK</button>
        <button className="btn btn-ghost" disabled={busy || !canReview} onClick={() => setPanel(panel === "improve" ? null : "improve")}>IMPROVE IT</button>
        <button className="btn btn-ghost" disabled={busy || !canReview} onClick={() => setPanel(panel === "ask" ? null : "ask")}>Ask Client for More Details</button>
        {status === "Generation Failed" && <button className="btn btn-navy" disabled={busy} onClick={() => act("retry")}>Retry generation</button>}
      </div>

      {panel === "work" && (
        <div className="mt-4">
          <label htmlFor="n1" className="label">What is wrong with this draft? (required)</label>
          <textarea id="n1" rows={3} className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn btn-navy mt-3" disabled={busy} onClick={() => act("needs_work", { note })}>Regenerate (stays with admin)</button>
        </div>
      )}
      {panel === "improve" && (
        <div className="mt-4 space-y-3">
          <div><label htmlFor="p1" className="label">AI prompt (built only from the client&rsquo;s answers)</label><textarea id="p1" rows={8} className="input font-mono text-xs" value={p} onChange={(e) => setP(e.target.value)} /></div>
          <div><label htmlFor="n2" className="label">Extra note (optional)</label><textarea id="n2" rows={2} className="input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <button className="btn btn-navy" disabled={busy} onClick={() => act("improve", { prompt: p, note })}>Regenerate (stays with admin)</button>
        </div>
      )}
      {panel === "ask" && (
        <div className="mt-4">
          <label htmlFor="n3" className="label">What do you need from the client? They will see this on their order page.</label>
          <textarea id="n3" rows={3} className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn btn-navy mt-3" disabled={busy} onClick={() => act("ask_details", { note })}>Send request</button>
        </div>
      )}

      <details className="mt-5">
        <summary className="cursor-pointer text-sm font-semibold text-navy/70">Upload final file (manual backup)</summary>
        <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="mt-3 block text-sm" disabled={busy || !canReview} onChange={(e) => upload(e.target.files?.[0] ?? null)} />
        <p className="mt-1 text-xs text-navy/60">JPG, PNG or PDF, up to 4 MB. It is added as a draft and still needs Approve.</p>
      </details>

      {msg && <p className="mt-4 text-sm font-semibold text-brand-dark" role="status">{msg}</p>}
      {error && <p className="err" role="alert">{error}</p>}
    </div>
  );
}
