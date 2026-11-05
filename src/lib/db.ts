import postgres from "postgres";

export type GuestStatus = "pending" | "attending" | "declined";

export type Guest = {
  id: number;
  name: string;
  slug: string;
  seats: number;
  phone: string | null;
  status: GuestStatus;
  attending_count: number;
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

/** Makes a slug that is not used yet: "dineth", "dineth-2", ... */
export async function uniqueSlug(base: string): Promise<string> {
  const sql = await db();
  const root = base || "guest";
  const rows = await sql<{ slug: string }[]>`
    SELECT slug FROM guests WHERE slug = ${root} OR slug LIKE ${root + "-%"}`;
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(root)) return root;
  for (let i = 2; ; i++) if (!taken.has(`${root}-${i}`)) return `${root}-${i}`;
}
