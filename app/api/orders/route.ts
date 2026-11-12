import { NextResponse } from "next/server";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { PRODUCTS, isProductSlug } from "@/lib/products";
import { STATUS } from "@/lib/status";
import { normalizeWhatsapp, validateContact } from "@/lib/forms";

export const runtime = "nodejs";

/** Step 1: create the order. Free launch, so price is always 0. */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.website) return NextResponse.json({ error: "Invalid request." }, { status: 400 }); // honeypot

  const product = String(body.product ?? "");
  if (!isProductSlug(product)) return NextResponse.json({ error: "Unknown product." }, { status: 400 });

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const whatsapp = String(body.whatsapp ?? "").trim();

  const errors = validateContact({ name, email, whatsapp });
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "The store is not connected to its database yet." }, { status: 503 });
  }

  const { data, error } = await getAdminClient()
    .from("orders")
    .insert({
      product,
      client_name: name.slice(0, 120),
      client_email: email.slice(0, 200),
      client_whatsapp: whatsapp.slice(0, 40),
      whatsapp_norm: normalizeWhatsapp(whatsapp),
      price: 0,
      status: STATUS.CONFIRMED,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: `This email or WhatsApp number has already used its free ${PRODUCTS[product].name}. Contact us on WhatsApp if you need help with your order.` },
        { status: 409 }
      );
    }
    console.error("order insert failed", error.message);
    return NextResponse.json({ error: "Could not save your order. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ orderId: data.id });
}
