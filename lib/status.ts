export const STATUS = {
  CONFIRMED: "Client Confirmed",
  DETAILS: "Details Submitted",
  GENERATING: "Generating",
  FAILED: "Generation Failed",
  ADMIN_REVIEW: "Draft Ready for Admin Review",
  NEEDS_DETAILS: "Needs More Details",
  CLIENT_REVIEW: "First Draft Ready for Client Review",
  REVISION: "Revision Requested",
  DELIVERED: "Delivered",
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];

/** The five steps the client sees on their order page. */
export const TIMELINE: Status[] = [
  STATUS.CONFIRMED,
  STATUS.DETAILS,
  STATUS.ADMIN_REVIEW,
  STATUS.CLIENT_REVIEW,
  STATUS.DELIVERED,
];

/** Where each status sits on the timeline (side statuses map to the nearest step). */
export function timelineIndex(status: string): number {
  switch (status) {
    case STATUS.CONFIRMED: return 0;
    case STATUS.DETAILS:
    case STATUS.GENERATING:
    case STATUS.FAILED:
    case STATUS.NEEDS_DETAILS: return 1;
    case STATUS.ADMIN_REVIEW:
    case STATUS.REVISION: return 2;
    case STATUS.CLIENT_REVIEW: return 3;
    case STATUS.DELIVERED: return 4;
    default: return 0;
  }
}

/** Plain-language message shown to the client for each status. */
export function clientMessage(status: string): string {
  switch (status) {
    case STATUS.CONFIRMED: return "Your order is confirmed. Add your project details to start.";
    case STATUS.DETAILS: return "Details received. Your first draft is being created.";
    case STATUS.GENERATING: return "Your first draft is being created.";
    case STATUS.FAILED: return "Something went wrong while creating your draft. We are looking at it and will fix it for free.";
    case STATUS.ADMIN_REVIEW: return "Your draft is being checked by our team before it reaches you.";
    case STATUS.NEEDS_DETAILS: return "We need a little more information from you to continue.";
    case STATUS.CLIENT_REVIEW: return "Your first draft is ready. Please review it below.";
    case STATUS.REVISION: return "Your changes were received. A new draft is being prepared and checked.";
    case STATUS.DELIVERED: return "Delivered. Your final files are ready to download.";
    default: return "";
  }
}
