import { NextResponse } from "next/server";
import { BUCKET, getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { isProductSlug } from "@/lib/products";
import { STATUS } from "@/lib/status";
import {
  ALLOWED_IMAGE_TYPES,
  FORMS,
  MAX_FILE_BYTES,
  isUuid,
  isVisible,
  normalizeUrl,
  sniffImage,
  validateDetails,
  type FormValues,
} from "@/lib/forms";

export const runtime = "nodejs";

/** Step 2: save the project details and mark the order "Details Submitted". */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!isUuid(id)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "The store is not connected to its database yet." }, { status: 503 });

  const sb = getAdminClient();
  const { data: order } = await sb.from("orders").select("id,product,status").eq("id", id).maybeSingle();
  if (!order || !isProductSlug(order.product)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== STATUS.CONFIRMED) {
    return NextResponse.json({ error: "Details were already submitted for this order." }, { status: 409 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const defs = FORMS[order.product];
  const values: FormValues = {};
  for (const f of defs) {
    if (f.type === "file") continue;
    values[f.name] = f.type === "multiselect" ? form.getAll(f.name).map(String) : String(form.get(f.name) ?? "").trim();
  }

  const errors = validateDetails(order.product, values);

  // Files: JPG or PNG only, size capped, real image bytes
  const files: { field: string; bytes: Uint8Array; mime: "image/jpeg" | "image/png" }[] = [];
  for (const f of defs.filter((d) => d.type === "file")) {
    const file = form.get(f.name);
    if (!(file instanceof File) || file.size === 0) continue;
    if (file.size > MAX_FILE_BYTES) { errors[f.name] = "File is too large. Maximum 3 MB."; continue; }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) { errors[f.name] = "Only JPG or PNG files are accepted."; continue; }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mime = sniffImage(bytes);
    if (!mime) { errors[f.name] = "This file is not a valid JPG or PNG image."; continue; }
    files.push({ field: f.name, bytes, mime });
  }

  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  // Claim the order first so a double click cannot submit twice.
  const { data: claimed } = await sb
    .from("orders")
    .update({ status: STATUS.DETAILS })
    .eq("id", id)
    .eq("status", STATUS.CONFIRMED)
    .select("id");
  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ error: "Details were already submitted for this order." }, { status: 409 });
  }

  const rows: { order_id: string; field_name: string; field_value: string }[] = [];
  for (const f of defs) {
    if (f.type === "file" || !isVisible(f, values)) continue;
    const v = values[f.name];
    const text = Array.isArray(v) ? v.join(", ") : v;
    if (!text) continue;
    rows.push({ order_id: id, field_name: f.name, field_value: f.type === "url" ? normalizeUrl(text) : text });
  }

  try {
    for (const file of files) {
      const path = `uploads/${id}/${file.field}.${file.mime === "image/png" ? "png" : "jpg"}`;
      const { error } = await sb.storage.from(BUCKET).upload(path, file.bytes, { contentType: file.mime, upsert: true });
      if (error) throw new Error(`upload failed: ${error.message}`);
      rows.push({ order_id: id, field_name: file.field, field_value: path });
    }
    await sb.from("order_details").delete().eq("order_id", id);
    const { error } = await sb.from("order_details").insert(rows);
    if (error) throw new Error(`details insert failed: ${error.message}`);
  } catch (err) {
    console.error(err);
    await sb.from("orders").update({ status: STATUS.CONFIRMED }).eq("id", id); // let the client retry
    return NextResponse.json({ error: "Could not save your details. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
