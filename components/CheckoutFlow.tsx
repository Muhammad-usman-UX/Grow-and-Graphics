"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import GenerationRunner from "@/components/GenerationRunner";
import {
  ALLOWED_IMAGE_TYPES,
  FORMS,
  MAX_FILE_BYTES,
  isVisible,
  validateContact,
  validateDetails,
  type FieldDef,
  type FormValues,
} from "@/lib/forms";
import type { ProductSlug } from "@/lib/products";

type Errors = Record<string, string>;

function initialValues(product: ProductSlug): FormValues {
  const v: FormValues = {};
  for (const f of FORMS[product]) if (f.type !== "file") v[f.name] = f.type === "multiselect" ? [] : "";
  return v;
}

function Steps({ step }: { step: number }) {
  const items = ["Contact", "Project details", "Done"];
  return (
    <ol className="mb-8 flex items-center gap-3 text-sm" aria-label="Progress">
      {items.map((t, i) => (
        <li key={t} className="flex items-center gap-2" aria-current={step === i + 1 ? "step" : undefined}>
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step > i + 1 ? "bg-brand text-white" : step === i + 1 ? "bg-navy text-white" : "bg-navy/10 text-navy/60"}`}>{step > i + 1 ? "✓" : i + 1}</span>
          <span className={step === i + 1 ? "font-semibold" : "text-navy/60"}>{t}</span>
          {i < items.length - 1 && <span aria-hidden className="mx-1 h-px w-6 bg-navy/20" />}
        </li>
      ))}
    </ol>
  );
}

function FieldError({ id, msg }: { id: string; msg?: string }) {
  return msg ? <p id={`${id}-err`} className="err" role="alert">{msg}</p> : null;
}

function Field(props: {
  def: FieldDef;
  value: string | string[];
  error?: string;
  file?: File | null;
  onChange: (v: string | string[]) => void;
  onFile: (f: File | null) => void;
}) {
  const { def, value, error, file, onChange, onFile } = props;
  const id = `f-${def.name}`;
  const cls = `input ${error ? "input-error" : ""}`;
  const aria = { "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${id}-err` : undefined } as const;

  return (
    <div id={`field-${def.name}`}>
      <label htmlFor={id} className="label">
        {def.label}
        {def.required ? <span className="text-red-600"> *</span> : <span className="font-normal text-navy/50"> (optional)</span>}
      </label>

      {(def.type === "text" || def.type === "url" || def.type === "date") && (
        <input id={id} type={def.type === "url" ? "text" : def.type} inputMode={def.type === "url" ? "url" : undefined} className={cls} placeholder={def.placeholder} value={value as string} onChange={(e) => onChange(e.target.value)} {...aria} />
      )}

      {def.type === "textarea" && (
        <textarea id={id} rows={4} className={cls} placeholder={def.placeholder} value={value as string} onChange={(e) => onChange(e.target.value)} {...aria} />
      )}

      {def.type === "select" && (
        <select id={id} className={cls} value={value as string} onChange={(e) => onChange(e.target.value)} {...aria}>
          <option value="">Choose one</option>
          {def.options!.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )}

      {def.type === "multiselect" && (
        <fieldset id={id} className="grid gap-2 sm:grid-cols-2">
          {def.options!.map((o) => {
            const on = (value as string[]).includes(o);
            return (
              <label key={o} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${on ? "border-brand bg-brand-mint" : "border-navy/20"}`}>
                <input type="checkbox" checked={on} onChange={() => onChange(on ? (value as string[]).filter((x) => x !== o) : [...(value as string[]), o])} />
                {o}
              </label>
            );
          })}
        </fieldset>
      )}

      {def.type === "colours" && (
        <div className="flex gap-2">
          <input id={id} type="text" className={cls} placeholder={def.placeholder} value={value as string} onChange={(e) => onChange(e.target.value)} {...aria} />
          <input
            type="color"
            aria-label="Pick a colour to add"
            defaultValue="#0F2A4A"
            className="h-[42px] w-12 shrink-0 cursor-pointer rounded-lg border border-navy/20 bg-white p-1"
            onChange={(e) => {
              const hex = e.target.value.toUpperCase();
              const cur = (value as string).trim();
              if (!cur.includes(hex)) onChange(cur ? `${cur}, ${hex}` : hex);
            }}
          />
        </div>
      )}

      {def.type === "file" && (
        <>
          <input id={id} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" onChange={(e) => onFile(e.target.files?.[0] ?? null)} {...aria} />
          {file && <p className="mt-1 text-xs text-navy/60">{file.name}</p>}
        </>
      )}

      {def.help && !error && <p className="mt-1 text-xs text-navy/50">{def.help}</p>}
      <FieldError id={id} msg={error} />
    </div>
  );
}

export default function CheckoutFlow({ product, productName, initialOrderId }: { product: ProductSlug; productName: string; initialOrderId?: string }) {
  const [step, setStep] = useState<1 | 2 | 3>(initialOrderId ? 2 : 1);
  const [orderId, setOrderId] = useState(initialOrderId ?? "");
  const [contact, setContact] = useState({ name: "", email: "", whatsapp: "", website: "" });
  const [values, setValues] = useState<FormValues>(() => initialValues(product));
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  function scrollToFirst(errs: Errors, order: string[]) {
    const first = order.find((n) => errs[n]);
    if (first) document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function submitContact(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const errs = validateContact(contact);
    setErrors(errs);
    if (Object.keys(errs).length) return scrollToFirst(errs, ["name", "email", "whatsapp"]);
    setBusy(true);
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product, ...contact }) });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setFormError(data.error ?? "");
        return;
      }
      setOrderId(data.orderId);
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormError("Network problem. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitDetails(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const defs = FORMS[product];
    const errs = validateDetails(product, values);
    for (const f of defs.filter((d) => d.type === "file")) {
      const file = files[f.name];
      if (!file) continue;
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) errs[f.name] = "Only JPG or PNG files are accepted.";
      else if (file.size > MAX_FILE_BYTES) errs[f.name] = "File is too large. Maximum 3 MB.";
    }
    setErrors(errs);
    if (Object.keys(errs).length) {
      setFormError("Please fix the highlighted fields.");
      return scrollToFirst(errs, defs.map((d) => d.name));
    }

    const fd = new FormData();
    for (const f of defs) {
      if (f.type === "file") {
        const file = files[f.name];
        if (file) fd.append(f.name, file);
        continue;
      }
      if (!isVisible(f, values)) continue;
      const v = values[f.name];
      if (Array.isArray(v)) v.forEach((x) => fd.append(f.name, x));
      else fd.append(f.name, v);
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/details`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.errors) { setErrors(data.errors); scrollToFirst(data.errors, defs.map((d) => d.name)); }
        setFormError(data.error ?? "Please fix the highlighted fields.");
        return;
      }
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFormError("Network problem. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const orderLink = `${origin}/order/${orderId}`;

  return (
    <div className="mx-auto max-w-2xl">
      <Steps step={step} />

      {step === 1 && (
        <form onSubmit={submitContact} noValidate className="card space-y-5 p-6">
          <div>
            <h2 className="text-xl font-bold">Step 1: Your contact details</h2>
            <p className="mt-1 text-sm text-navy/60">{productName} is free. No payment needed. We use WhatsApp only as a way to reach you.</p>
          </div>
          {([["name", "Full name", "text", "name"], ["email", "Email", "email", "email"], ["whatsapp", "WhatsApp number", "tel", "tel"]] as const).map(([k, label, type, ac]) => (
            <div key={k} id={`field-${k}`}>
              <label htmlFor={`c-${k}`} className="label">{label} <span className="text-red-600">*</span></label>
              <input id={`c-${k}`} type={type} autoComplete={ac} placeholder={k === "whatsapp" ? "+92 300 1234567" : undefined} className={`input ${errors[k] ? "input-error" : ""}`} value={contact[k]} onChange={(e) => setContact({ ...contact, [k]: e.target.value })} aria-invalid={errors[k] ? true : undefined} aria-describedby={errors[k] ? `c-${k}-err` : undefined} />
              {errors[k] && <p id={`c-${k}-err`} className="err" role="alert">{errors[k]}</p>}
            </div>
          ))}
          {/* Honeypot: hidden from people, bots fill it */}
          <div className="absolute -left-[9999px]" aria-hidden>
            <label>Website<input tabIndex={-1} autoComplete="off" value={contact.website} onChange={(e) => setContact({ ...contact, website: e.target.value })} /></label>
          </div>
          {formError && <p className="err rounded-lg bg-red-50 p-3" role="alert">{formError}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Continue to project details"}</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={submitDetails} noValidate className="card space-y-5 p-6">
          <div>
            <h2 className="text-xl font-bold">Step 2: Project details for your {productName}</h2>
            <p className="mt-1 text-sm text-navy/60">Fields marked * are required. We create your draft only from what you write here.</p>
          </div>
          <div className="rounded-lg bg-navy-50 p-3 text-sm">
            <p className="font-semibold">Your private order link</p>
            <p className="mt-1 break-all text-navy/70">{orderLink}</p>
            <p className="mt-1 text-xs text-navy/60">Save this link. It is how you will see your draft. There is no login.</p>
          </div>
          {FORMS[product].filter((f) => isVisible(f, values)).map((f) => (
            <Field key={f.name} def={f} value={values[f.name] ?? ""} error={errors[f.name]} file={files[f.name]} onChange={(v) => { setValues({ ...values, [f.name]: v }); if (errors[f.name]) setErrors({ ...errors, [f.name]: "" }); }} onFile={(file) => { setFiles({ ...files, [f.name]: file }); if (errors[f.name]) setErrors({ ...errors, [f.name]: "" }); }} />
          ))}
          {formError && <p className="err rounded-lg bg-red-50 p-3" role="alert">{formError}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Sending…" : "Submit details"}</button>
        </form>
      )}

      {step === 3 && (
        <div className="card p-8 text-center">
          <p aria-hidden className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand text-xl text-white">✓</p>
          <h2 className="mt-4 text-2xl font-extrabold">Details received. Your first draft is being created.</h2>
          <p className="mt-2 text-navy/70">Our team checks every draft before it reaches you. Follow progress on your private order page.</p>
          <GenerationRunner orderId={orderId} refreshOnDone={false} message="Creating your first draft in the background. You can open your order page now or keep this page open." />
          <Link href={`/order/${orderId}`} className="btn btn-primary mt-6">Open my order page</Link>
          <p className="mt-4 break-all text-xs text-navy/50">{orderLink}</p>
        </div>
      )}
    </div>
  );
}
