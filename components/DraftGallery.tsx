import type { DraftFile } from "@/lib/drafts";

type LinkMode = "none" | "open" | "download";
const VARIANT_LABEL: Record<string, string> = { png: "PNG", jpg: "JPG", transparent: "Transparent PNG", pdf: "PDF", file: "File" };

function Links({ files, mode }: { files: DraftFile[]; mode: LinkMode }) {
  if (mode === "none") return null;
  return (
    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
      {files.map((f) => (
        <a key={f.id} href={mode === "download" ? f.downloadUrl ?? f.url : f.url} {...(mode === "open" ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="text-brand-dark underline">
          {mode === "download" ? "Download " : ""}{VARIANT_LABEL[f.variant] ?? f.variant}
        </a>
      ))}
    </p>
  );
}

export default function DraftGallery({ files, product, linkMode }: { files: DraftFile[]; product: string; linkMode: LinkMode }) {
  if (!files.length) return null;

  const pdf = files.find((f) => f.type === "application/pdf");
  if (pdf) {
    return (
      <div>
        <iframe src={pdf.url} title="Audit report preview" className="h-[70vh] w-full rounded-xl border border-navy/10" />
        <Links files={files.filter((f) => f.type === "application/pdf")} mode={linkMode} />
      </div>
    );
  }

  if (product === "logo-design") {
    const byTask = new Map<string, DraftFile[]>();
    files.forEach((f) => byTask.set(f.task, [...(byTask.get(f.task) ?? []), f]));
    const concepts = [1, 2, 3, 4].filter((c) => Array.from(byTask.keys()).some((k) => k.startsWith(`c${c}-`)));
    if (concepts.length) {
      return (
        <div className="space-y-8">
          {concepts.map((c) => (
            <section key={c}>
              <h3 className="mb-3 font-bold">Concept {c}</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {(["primary", "stacked", "icon"] as const).map((v) => {
                  const group = byTask.get(`c${c}-${v}`);
                  const png = group?.find((f) => f.variant === "png");
                  return (
                    <figure key={v} className="card overflow-hidden p-3">
                      {png ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={png.url} alt={`Concept ${c}, ${v} version`} className="aspect-square w-full rounded-lg bg-white object-contain" />
                      ) : (
                        <div className="flex aspect-square items-center justify-center rounded-lg bg-navy-50 text-sm text-navy/50">Not ready</div>
                      )}
                      <figcaption className="mt-2 text-sm font-semibold capitalize">{v}</figcaption>
                      {group && <Links files={group} mode={linkMode} />}
                    </figure>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      );
    }
  }

  // Posts, banners and manual uploads: one large preview per design
  const groups = new Map<string, DraftFile[]>();
  files.forEach((f) => groups.set(f.task, [...(groups.get(f.task) ?? []), f]));
  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([task, group]) => {
        const img = group.find((f) => f.variant === "png") ?? group.find((f) => f.type.startsWith("image/"));
        return (
          <figure key={task}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {img && <img src={img.url} alt="Draft preview" className="max-h-[75vh] w-auto max-w-full rounded-xl border border-navy/10" />}
            <Links files={group} mode={linkMode} />
          </figure>
        );
      })}
    </div>
  );
}
