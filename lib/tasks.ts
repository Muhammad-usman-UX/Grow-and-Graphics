import type { ProductSlug } from "./products";

export interface Task {
  id: string;
  kind: "image" | "audit";
  /** Must be finished first; its PNG is passed as a reference so the logo versions match. */
  after?: string;
  concept?: number;
  version?: "primary" | "stacked" | "icon";
}

/** The work for one generation round. Resumable: a task is done once its draft rows exist. */
export function tasksFor(product: ProductSlug): Task[] {
  if (product === "logo-design") {
    const t: Task[] = [];
    for (let c = 1; c <= 4; c++) t.push({ id: `c${c}-primary`, kind: "image", concept: c, version: "primary" });
    for (let c = 1; c <= 4; c++) {
      t.push({ id: `c${c}-stacked`, kind: "image", concept: c, version: "stacked", after: `c${c}-primary` });
      t.push({ id: `c${c}-icon`, kind: "image", concept: c, version: "icon", after: `c${c}-primary` });
    }
    return t;
  }
  if (product === "instagram-post") return [{ id: "post", kind: "image" }];
  if (product === "facebook-banner") return [{ id: "banner", kind: "image" }];
  return [{ id: "audit", kind: "audit" }];
}
