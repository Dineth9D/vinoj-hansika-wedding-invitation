import { randomInt } from "node:crypto";
import postgres from "postgres";
import { slugify } from "./text";
import type { Attend } from "@/config/wedding";

export type GuestStatus = "pending" | "attending" | "declined";

export type Guest = {
  id: number;
  name: string;
  slug: string;
  seats: number;
  phone: string | null;
  status: GuestStatus;
  attending_count: number;
  /** Which parts of the day; null for older replies (counted as both). */
  events: Attend | null;
  message: string | null;
  invited: boolean;
  responded_at: string | null;
  created_at: string;
};

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __schemaReady: Promise<void> | undefined;
}

export function hasDatabase() {
  return url.length > 0;
}

function client() {
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!global.__sql) {
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url) || url.includes("host=/");
    global.__sql = postgres(url, {
      ssl: local ? false : "require",
      max: 3,
      prepare: false, // needed for pooled (pgbouncer) connections such as Neon's
      idle_timeout: 20,
      transform: { undefined: null },
    });
  }
  return global.__sql;
}

/** Returns the SQL client, creating the table the first time. */
export async function db() {
  const sql = client();
  if (!global.__schemaReady) {
    global.__schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS guests (
          id              SERIAL PRIMARY KEY,
          name            TEXT NOT NULL,
          slug            TEXT NOT NULL UNIQUE,
          seats           INT  NOT NULL DEFAULT 1,
          phone           TEXT,
          status          TEXT NOT NULL DEFAULT 'pending',
          attending_count INT  NOT NULL DEFAULT 0,
          message         TEXT,
          invited         BOOLEAN NOT NULL DEFAULT TRUE,
          responded_at    TIMESTAMPTZ,
          created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await sql`ALTER TABLE guests ADD COLUMN IF NOT EXISTS events TEXT`;
    })().catch((err) => {
      global.__schemaReady = undefined;
      throw err;
    });
  }
  await global.__schemaReady;
  return sql;
}

export async function findGuestBySlug(slug: string): Promise<Guest | null> {
  const sql = await db();
  const rows = await sql<Guest[]>`SELECT * FROM guests WHERE slug = ${slug} LIMIT 1`;
  return rows[0] ?? null;
}

// No look-alike characters (0/o, 1/l/i), so codes are easy to read.
const CODE_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";

function randomCode(): string {
  for (;;) {
    let code = "";
    for (let i = 0; i < 4; i++) code += CODE_CHARS[randomInt(CODE_CHARS.length)];
    if (/\d/.test(code)) return code; // always has a digit, so it never looks like a name
  }
}

/**
 * A link id that is hard to guess: "pravil-k7m2".
 * Someone who only knows a guest's name cannot open their invitation or reply for them.
 */
export async function newGuestSlug(name: string): Promise<string> {
  const sql = await db();
  const base = slugify(name).slice(0, 40) || "guest";
  for (;;) {
    const slug = `${base}-${randomCode()}`;
    const rows = await sql`SELECT 1 FROM guests WHERE slug = ${slug} LIMIT 1`;
    if (rows.length === 0) return slug;
  }
}

/** A guest who replied from the general link (not on the list), matched by name. */
export async function findOpenGuestByName(name: string): Promise<Guest | null> {
  const sql = await db();
  const rows = await sql<Guest[]>`
    SELECT * FROM guests WHERE invited = FALSE AND lower(name) = lower(${name})
    ORDER BY id LIMIT 1`;
  return rows[0] ?? null;
}
