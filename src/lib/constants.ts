export const FEEDBACK_CATEGORIES = [
  "Cafeteria",
  "Security",
  "Education",
  "Facilities",
  "Administration",
  "Other",
] as const;

export const FEEDBACK_STATUSES = [
  "Pending",
  "In Review",
  "Resolved",
  "Rejected",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const DEPARTMENTS = [
  "Cafeteria Management",
  "Security Office",
  "Academic Office",
  "Administration",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const CATEGORY_TO_DEPARTMENT: Record<FeedbackCategory, Department> = {
  Cafeteria: "Cafeteria Management",
  Security: "Security Office",
  Education: "Academic Office",
  Facilities: "Administration",
  Administration: "Administration",
  Other: "Administration",
};

export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;
export const UPLOAD_DIR = "public/uploads";
export const ADMIN_SESSION_COOKIE = "admin_session";
export const LIKE_SESSION_COOKIE = "feedback_session_id";
