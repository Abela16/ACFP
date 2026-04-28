import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { MAX_ATTACHMENT_SIZE_BYTES } from "@/lib/constants";

export function createFeedbackPublicId(): string {
  return `FB-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function persistAttachment(file: File): Promise<string> {
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    throw new Error("Attachment exceeds 5MB limit.");
  }

  const extension = path.extname(file.name || "").toLowerCase();
  const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".txt", ".doc", ".docx"];
  if (!allowed.includes(extension)) {
    throw new Error("Unsupported attachment format.");
  }

  const absoluteDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(absoluteDir, { recursive: true });

  const filename = `${Date.now()}-${randomUUID()}${extension}`;
  const absolutePath = path.join(absoluteDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);
  return `/uploads/${filename}`;
}

export function parseTags(raw: string | null): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}
