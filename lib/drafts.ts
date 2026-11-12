import "server-only";
import { BUCKET, getAdminClient } from "./supabase/admin";

export interface DraftFile {
  id: string;
  label: string;
  task: string;
  variant: string;
  type: string;
  status: string;
  version: number;
  note: string | null;
  url: string;
  downloadUrl?: string;
  name: string;
}

export const extOf = (type: string) => (type === "application/pdf" ? "pdf" : type === "image/jpeg" ? "jpg" : "png");

/** Signed links (1 hour). Files live in a private bucket, so nothing is reachable without one. */
export async function loadDrafts(orderId: string, opts: { statuses?: string[]; version?: number; download?: boolean; product?: string }): Promise<DraftFile[]> {
  const sb = getAdminClient();
  let q = sb.from("drafts").select("id,file_url,file_type,label,version,status,admin_note").eq("order_id", orderId).order("label");
  if (opts.statuses) q = q.in("status", opts.statuses);
  if (opts.version !== undefined) q = q.eq("version", opts.version);
  const { data } = await q;
  if (!data?.length) return [];

  const signed = await sb.storage.from(BUCKET).createSignedUrls(data.map((r) => r.file_url), 3600);
  const urlOf = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));

  return Promise.all(
    data.map(async (r) => {
      const [task, variant = "file"] = String(r.label).split(":");
      const name = `${opts.product ?? "design"}-${task}${variant !== "file" ? `-${variant}` : ""}.${extOf(r.file_type)}`;
      let downloadUrl: string | undefined;
      if (opts.download) {
        const d = await sb.storage.from(BUCKET).createSignedUrl(r.file_url, 3600, { download: name });
        downloadUrl = d.data?.signedUrl;
      }
      return { id: r.id, label: r.label, task, variant, type: r.file_type, status: r.status, version: r.version, note: r.admin_note, url: urlOf.get(r.file_url) ?? "", downloadUrl, name };
    })
  );
}
