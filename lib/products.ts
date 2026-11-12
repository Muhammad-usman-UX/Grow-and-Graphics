export type ProductSlug = "logo-design" | "instagram-post" | "facebook-banner" | "ui-ux-audit";

export interface Product {
  slug: ProductSlug;
  name: string;
  blurb: string;
  oldPrice?: string;
  delivery: string;
  revisions: string;
  badge?: string;
  category: string;
  includes: string[];
}

export const PRODUCTS: Record<ProductSlug, Product> = {
  "logo-design": {
    slug: "logo-design",
    name: "Logo Design",
    blurb: "A logo built around your brand, not a template.",
    oldPrice: "Rs. 5,000",
    delivery: "3 days",
    revisions: "2 revisions",
    badge: "Popular",
    category: "Services",
    includes: ["4 logo concepts", "Primary, stacked and icon versions", "PNG + JPG files", "Transparent version"],
  },
  "instagram-post": {
    slug: "instagram-post",
    name: "Instagram Post",
    blurb: "One post, designed properly, in 24 hours.",
    oldPrice: "Rs. 1,500",
    delivery: "24 hours",
    revisions: "2 revisions",
    badge: "New",
    category: "Services",
    includes: ["1080x1080 square or 1080x1920 story", "JPG + PNG files"],
  },
  "facebook-banner": {
    slug: "facebook-banner",
    name: "Facebook Banner",
    blurb: "A clean cover banner sized for your Facebook page.",
    oldPrice: "Rs. 2,000",
    delivery: "48 hours",
    revisions: "2 revisions",
    category: "Services",
    includes: ["820x312 px", "JPG + PNG files"],
  },
  "ui-ux-audit": {
    slug: "ui-ux-audit",
    name: "UI/UX Audit",
    blurb: "A prioritised list of what to fix on your website or app.",
    delivery: "PDF audit report",
    revisions: "2 revisions",
    category: "Services",
    includes: ["PDF audit report", "Problems ranked by priority", "A suggested fix for each problem"],
  },
};

export const PRODUCT_LIST = Object.values(PRODUCTS);

export function isProductSlug(v: string): v is ProductSlug {
  return Object.prototype.hasOwnProperty.call(PRODUCTS, v);
}

export interface ComingSoon {
  slug: string;
  name: string;
  blurb: string;
  category: string;
}

export const COMING_SOON: ComingSoon[] = [
  { slug: "feed-starter-pack", name: "Feed Starter Pack", blurb: "60 Instagram layouts we actually use with clients.", category: "Templates" },
  { slug: "brand-book-kit", name: "Brand Book Kit", blurb: "A 48-page guidelines doc you fill in, not build.", category: "Branding" },
  { slug: "line-icons-vol-1", name: "Line Icons, Vol. 1", blurb: "240 icons on a 24px grid. Two weights.", category: "Icons" },
  { slug: "packaging-mockups", name: "Kraft Packaging Mockups", blurb: "Bags, boxes and labels, shot on stone.", category: "Print" },
  { slug: "ledger-dashboard-kit", name: "Ledger Dashboard Kit", blurb: "Dashboard screens and components for finance and admin tools.", category: "UI kits" },
  { slug: "highlight-covers", name: "Highlight Covers", blurb: "Instagram story highlight covers in a consistent set.", category: "Templates" },
];
