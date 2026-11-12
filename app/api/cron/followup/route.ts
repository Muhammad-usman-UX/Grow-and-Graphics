import { NextResponse } from "next/server";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { emailEnabled, sendFollowup } from "@/lib/email";
import { STATUS } from "@/lib/status";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

/** Runs once a day (see vercel.json). Sends the follow-up 24 hours after Delivered. Does nothing until RESEND_API_KEY is set. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!emailEnabled() || !isSupabaseConfigured()) return NextResponse.json({ skipped: true });

  const sb = getAdminClient();
  const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data } = await sb.from("orders").select("id,client_name,client_email").eq("status", STATUS.DELIVERED).eq("followup_sent", false).lt("delivered_at", cutoff).limit(50);
  let sent = 0;
  for (const o of data ?? []) {
    if (await sendFollowup(o, SITE.googleReviewUrl)) {
      await sb.from("orders").update({ followup_sent: true }).eq("id", o.id);
      sent++;
    }
  }
  return NextResponse.json({ sent });
}
