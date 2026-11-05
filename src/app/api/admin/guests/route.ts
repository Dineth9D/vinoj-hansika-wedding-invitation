import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db, uniqueSlug, type Guest } from "@/lib/db";
import { cleanText, slugify } from "@/lib/text";

export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ ok: false, error: "Please log in." }, { status: 401 });

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  const sql = await db();
  const guests = await sql<Guest[]>`SELECT * FROM guests ORDER BY created_at DESC, id DESC`;
  return NextResponse.json({ ok: true, guests });
}

/** Add one or many guests: { guests: [{ name, seats?, phone? }] } */
export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const list: unknown[] = Array.isArray(body.guests) ? body.guests.slice(0, 1000) : [];
  const sql = await db();
  const created: Guest[] = [];
  for (const item of list) {
    const g = (item ?? {}) as Record<string, unknown>;
    const name = cleanText(g.name, 80);
    if (!name) continue;
    const seats = Math.min(Math.max(Math.round(Number(g.seats) || 1), 1), 50);
    const phone = cleanText(g.phone, 30) || null;
    const slug = await uniqueSlug(slugify(name));
    const rows = await sql<Guest[]>`
      INSERT INTO guests (name, slug, seats, phone) VALUES (${name}, ${slug}, ${seats}, ${phone})
      RETURNING *`;
    created.push(rows[0]);
  }
  return NextResponse.json({ ok: true, created });
}
