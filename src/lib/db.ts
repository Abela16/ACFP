import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { CATEGORY_TO_DEPARTMENT, Department, FeedbackCategory } from "@/lib/constants";

const IS_NEXT_BUILD = process.env.NEXT_PHASE === "phase-production-build";
const DB_DIR = path.join(process.cwd(), "storage");
const DB_PATH = IS_NEXT_BUILD ? ":memory:" : path.join(DB_DIR, "acfp.sqlite");

if (!IS_NEXT_BUILD && !fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);
if (!IS_NEXT_BUILD) {
  db.exec("PRAGMA journal_mode = WAL;");
}
db.exec("PRAGMA busy_timeout = 5000;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    department TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    other_category TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    likes_count INTEGER NOT NULL DEFAULT 0,
    attachment_path TEXT,
    tags_json TEXT NOT NULL DEFAULT '[]',
    flagged INTEGER NOT NULL DEFAULT 0,
    deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS feedback_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feedback_id INTEGER NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS feedback_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feedback_id INTEGER NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(feedback_id, session_id)
  );
`);

const listColumns = db.prepare("PRAGMA table_info(feedback)").all() as Array<{ name: string }>;
if (!listColumns.some((column) => column.name === "assigned_department")) {
  db.exec("ALTER TABLE feedback ADD COLUMN assigned_department TEXT;");
}

function hashPassword(password: string): string {
  const salt = randomUUID();
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, encodedHash: string): boolean {
  const [salt, hash] = encodedHash.split(":");
  if (!salt || !hash) {
    return false;
  }
  const candidate = scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");
  if (stored.length !== candidate.length) {
    return false;
  }
  return timingSafeEqual(candidate, stored);
}

function seedAdminIfMissing(username: string, password: string, department: Department): void {
  const existing = db
    .prepare("SELECT id FROM admins WHERE username = ? LIMIT 1")
    .get(username) as { id: number } | undefined;
  if (existing) {
    return;
  }
  db.prepare("INSERT INTO admins (username, password_hash, department) VALUES (?, ?, ?)")
    .run(username, hashPassword(password), department);
}

const adminSeedPassword = process.env.ADMIN_SEED_PASSWORD || "ChangeMe123!";

seedAdminIfMissing("cafeteria_admin", adminSeedPassword, "Cafeteria Management");
seedAdminIfMissing("security_admin", adminSeedPassword, "Security Office");
seedAdminIfMissing("academic_admin", adminSeedPassword, "Academic Office");
seedAdminIfMissing("super_admin", adminSeedPassword, "Administration");

export type AdminRecord = {
  id: number;
  username: string;
  password_hash: string;
  department: Department;
};

export type FeedbackRecord = {
  id: number;
  public_id: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  other_category: string | null;
  status: string;
  likes_count: number;
  attachment_path: string | null;
  tags_json: string;
  flagged: number;
  deleted: number;
  created_at: string;
  updated_at: string;
  assigned_department: Department | null;
};

export function getDb(): DatabaseSync {
  return db;
}

export function authenticateAdmin(username: string, password: string): Omit<AdminRecord, "password_hash"> | null {
  const admin = db
    .prepare("SELECT id, username, password_hash, department FROM admins WHERE username = ? LIMIT 1")
    .get(username) as AdminRecord | undefined;
  if (!admin) {
    return null;
  }
  if (!verifyPassword(password, admin.password_hash)) {
    return null;
  }
  return { id: admin.id, username: admin.username, department: admin.department };
}

export function departmentCanManageCategory(department: Department, category: FeedbackCategory): boolean {
  return CATEGORY_TO_DEPARTMENT[category] === department || department === "Administration";
}
