export const SITE = {
  name: "Grow & Graphics",
  email: "meet.withmuhammad1@gmail.com",
  whatsappNumber: "923273915504",
  whatsappDisplay: "+923273915504",
  whatsappUrl: "https://wa.me/923273915504",
  location: "Remote/Ryk Pakistan",
  founder: "Muhammad Usman",
  googleReviewUrl:
    process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || "https://g.page/r/CezGoiZtjb_sEAI/review",
  googleProfileUrl:
    process.env.NEXT_PUBLIC_GOOGLE_PROFILE_URL ||
    process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ||
    "https://g.page/r/CezGoiZtjb_sEAI/review",
  logoIcon: "https://grow-andgraphics.lovable.app/assets/logo-icon-C4rSUGXf.png",
  heroImage: "https://grow-andgraphics.lovable.app/assets/hero-CHGfxpu2.jpg",
  aboutImage: "https://grow-andgraphics.lovable.app/assets/work-social--Ur_4k1I.jpg",
};

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/shop", label: "Shop" },
  { href: "/contact", label: "Contact" },
];

const A = "https://grow-andgraphics.lovable.app/__l5e/assets-v1";
export const WORK = [
  { name: "TOICO × Sanman", tag: "Co-branded identity · Trade-show walls", img: `${A}/3394ee9f-06fa-4a80-973c-3001d45938b5/work-toico.jpg` },
  { name: "AI Decode", tag: "Website · Editorial design", img: `${A}/631eb99a-9af2-4c85-8197-bee618993f0f/work-aidecode.jpg` },
  { name: "Louvray Jewelry", tag: "Identity · Guidelines · Packaging", img: `${A}/54416711-e493-4ddd-88c8-705396cbf194/work-louvray.jpg` },
  { name: "H2 Hats", tag: "Social campaign · Merch graphics", img: `${A}/852fd2a0-34e3-4e9b-af8c-7f2c017965e5/work-h2hats.jpg` },
  { name: "Animal Rush Wildlife Co.", tag: "Logo design · Apparel", img: `${A}/740d94fa-6109-4bc1-b4c3-c76cace7f3f3/work-animal-rush.jpg` },
  { name: "Heartza", tag: "Logo design · Kitchen products", img: `${A}/f3119b53-4a77-42ab-8b02-f3a53e6e5171/work-heartza.jpg` },
  { name: "J.R. Reed Booster Club", tag: "Business cards · Print", img: `${A}/21e8e04b-412a-445a-bd23-590d0f8488cf/work-jrreed.jpg` },
  { name: "The Tiny Seat Company", tag: "Logo design · Badge", img: `${A}/0e0e2235-5c05-4e07-a68d-942cf3722b08/work-tiny-seat.jpg` },
  { name: "Full Custom AI", tag: "Logo design · AI startup", img: `${A}/d6d7f91b-1697-4940-ac0c-8fd08395cee6/work-fullcustom.jpg` },
];
