import { z } from "zod";

import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES } from "@/lib/constants";

export const feedbackInputSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(3000),
  category: z.enum(FEEDBACK_CATEGORIES),
  otherCategory: z.string().max(80).optional(),
  tags: z.array(z.string().min(1).max(24)).max(6).optional(),
});

export const adminLoginSchema = z.object({
  username: z.string().min(3).max(60),
  password: z.string().min(8).max(200),
});

export const adminFeedbackUpdateSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES).optional(),
  responseMessage: z.string().min(5).max(2000).optional(),
  flag: z.boolean().optional(),
  delete: z.boolean().optional(),
  assignDepartment: z.string().max(64).optional(),
});
