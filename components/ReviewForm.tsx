"use client";

import { useState } from "react";

interface Existing { rating: number; clicked: boolean; done: boolean }

export default function ReviewForm({ orderId, defaultName, productName, googleUrl, existing }: { orderId: string; defaultName: string; productName: string; googleUrl: string; existing: Existing | null }) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [name, setName] = useState(defaultName);
  const [comment, setComment] = useState("");
  const [priv, setPriv] = useState("");
  const [submitted, setSubmitted] = useState(Boolean(existing));
  const [clicked, setClicked] = useState(existing?.clicked ?? false);
  const [done, setDone] = useState(existing?.done ?? false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!rating) return setError("Choose 1 to 5 stars.");
    if (!name.trim()) return setError("Please enter your name.");
    if (!comment.trim()) return setError("Please write a short comment.");
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating, name, comment, privateFeedback: priv }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return setError(j.error ?? "Could not save your review.");
      setSubmitted(true);
    } catch {
      setError("Network problem. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const track = (event: "clicked" | "done") => {
    fetch(`/api/orders/${orderId}/google`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event }) }).catch(() => {});
    if (event === "clicked") setClicked(true); else setDone(true);
  };

  if (submitted) {
    return (
      <div className="card mt-8 p-6">
        <h2 className="text-xl font-bold">Thank you for your review</h2>
        <p className="mt-1 text-sm text-navy/70">It will appear on our site after our team approves it.</p>
        {rating >= 4 && (
          <div className="mt-5 rounded-xl bg-brand-mint p-4">
            <p className="font-medium">Love your design? Please review Grow and Graphics on Google - it takes 30 seconds.</p>
            <a href={googleUrl} target="_blank" rel="noopener noreferrer" onClick={() => track("clicked")} className="btn btn-primary mt-3">Review Us on Google</a>
            {clicked && !done && <button type="button" className="btn btn-ghost ml-3 mt-3" onClick={() => track("done")}>I have posted my review</button>}
            {done && <p className="mt-3 text-sm font-semibold text-brand-dark">Thank you, that really helps.</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="card mt-8 space-y-4 p-6">
      <h2 className="text-xl font-bold">Leave a review</h2>
      <p className="text-sm text-navy/70">How was your free {productName}?</p>
      <fieldset>
        <legend className="label">Rating <span className="text-red-600">*</span></legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n === 1 ? "" : "s"}`} onClick={() => setRating(n)} className={`text-3xl leading-none ${n <= rating ? "text-brand" : "text-navy/20"}`}>★</button>
          ))}
        </div>
      </fieldset>
      <div><label htmlFor="rv-name" className="label">Your name <span className="text-red-600">*</span></label><input id="rv-name" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div><label htmlFor="rv-product" className="label">Product</label><input id="rv-product" className="input bg-navy-50" value={productName} readOnly /></div>
      <div><label htmlFor="rv-comment" className="label">Comment <span className="text-red-600">*</span></label><textarea id="rv-comment" rows={4} className="input" value={comment} onChange={(e) => setComment(e.target.value)} /></div>
      {rating > 0 && rating <= 3 && (
        <div>
          <label htmlFor="rv-priv" className="label">Tell us how we can improve <span className="font-normal text-navy/50">(private, only our team sees this)</span></label>
          <textarea id="rv-priv" rows={3} className="input" value={priv} onChange={(e) => setPriv(e.target.value)} />
        </div>
      )}
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Submit review"}</button>
    </form>
  );
}
