import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db, type Guest } from "@/lib/db";
import { cleanText } from "@/lib/text";

export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ ok: false, error: "Please log in." }, { status: 401 });

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return unauthorized();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ ok: false }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const sql = await db();
  const [cur] = await sql<Guest[]>`SELECT * FROM guests WHERE id = ${id}`;
  if (!cur) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const name = body.name !== undefined ? cleanText(body.name, 80) || cur.name : cur.name;
  const seats = body.seats !== undefined ? Math.min(Math.max(Math.round(Number(body.seats) || 1), 1), 50) : cur.seats;
  const phone = body.phone !== undefined ? cleanText(body.phone, 30) || null : cur.phone;
  const status = ["pending", "attending", "declined"].includes(body.status) ? body.status : cur.status;
  let count = body.attending_count !== undefined ? Math.max(Math.round(Number(body.attending_count) || 0), 0) : cur.attending_count;
  if (status !== "attending") count = 0;
  else if (count < 1) count = 1;
  if (cur.invited) count = Math.min(count, seats);

  const [guest] = await sql<Guest[]>`
    UPDATE guests SET name = ${name}, seats = ${seats}, phone = ${phone}, status = ${status},
      attending_count = ${count},
      responded_at = ${status === "pending" ? null : cur.responded_at ?? new Date().toISOString()}
    WHERE id = ${id} RETURNING *`;
  return NextResponse.json({ ok: true, guest });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return unauthorized();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ ok: false }, { status: 400 });
  const sql = await db();
  await sql`DELETE FROM guests WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
