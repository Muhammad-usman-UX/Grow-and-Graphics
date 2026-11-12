"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";

const OPTIONS = ["Brand identity", "Website", "Social content", "Not sure yet"];

/** No backend needed: opens WhatsApp (or email) with the message already written. */
export default function ContactForm() {
  const [need, setNeed] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function text() {
    return `Hi Grow & Graphics, I need: ${need}.${message.trim() ? `\n\n${message.trim()}` : ""}`;
  }
  function go(kind: "wa" | "mail") {
    if (!need) { setError("Choose what you need first."); return; }
    setError("");
    const url = kind === "wa"
      ? `${SITE.whatsappUrl}?text=${encodeURIComponent(text())}`
      : `mailto:${SITE.email}?subject=${encodeURIComponent(`Project enquiry: ${need}`)}&body=${encodeURIComponent(text())}`;
    window.open(url, kind === "wa" ? "_blank" : "_self", "noopener");
  }

  return (
    <div className="card p-6">
      <label htmlFor="need" className="label">What do you need?</label>
      <select id="need" className={`input ${error ? "input-error" : ""}`} value={need} onChange={(e) => setNeed(e.target.value)}>
        <option value="">Choose one</option>
        {OPTIONS.map((o) => <option key={o}>{o}</option>)}
      </select>
      {error && <p className="err" role="alert">{error}</p>}

      <label htmlFor="msg" className="label mt-5">Tell us a little about it (optional)</label>
      <textarea id="msg" rows={5} className="input" value={message} onChange={(e) => setMessage(e.target.value)} />

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={() => go("wa")}>Message us on WhatsApp</button>
        <button type="button" className="btn btn-ghost" onClick={() => go("mail")}>Send by email</button>
      </div>
    </div>
  );
}
