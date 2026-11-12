"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Starts draft generation automatically and keeps calling the server until it is finished
 * (each call can only work for about a minute). No button, nothing for the client to press.
 */
export default function GenerationRunner({ orderId, refreshOnDone = true, message }: { orderId: string; refreshOnDone?: boolean; message?: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      for (let i = 0; i < 80; i++) {
        try {
          const res = await fetch(`/api/orders/${orderId}/generate`, { method: "POST" });
          const j = await res.json().catch(() => ({}));
          if (!res.ok) { setError(j.error ?? "Could not start your draft."); return; }
          if (j.done) { if (refreshOnDone) router.refresh(); return; }
          if (typeof j.remaining === "number") setRemaining(j.remaining);
          if (j.busy) await sleep(3000);
        } catch {
          await sleep(3000);
        }
      }
    })();
  }, [orderId, refreshOnDone, router]);

  if (error) return <p className="err rounded-lg bg-red-50 p-3" role="alert">{error}</p>;
  return (
    <div className="mt-5 flex items-center gap-3 rounded-xl border border-brand/40 bg-brand-mint p-4" role="status">
      <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      <p className="text-sm font-medium">
        {message ?? "Creating your first draft. This can take a minute. You can keep this page open."}
        {remaining !== null && remaining > 0 ? ` (${remaining} step${remaining === 1 ? "" : "s"} left)` : ""}
      </p>
    </div>
  );
}
