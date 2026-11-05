import { isAdmin } from "@/lib/auth";
import { db, type Guest } from "@/lib/db";

export const dynamic = "force-dynamic";

function cell(v: unknown) {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // stop spreadsheet formulas
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Please log in.", { status: 401 });
  const origin = new URL(req.url).origin;
  const sql = await db();
  const guests = await sql<Guest[]>`SELECT * FROM guests ORDER BY name`;
  const head = ["Name", "Invited seats", "Status", "Coming", "Phone", "Message", "On guest list", "Replied at", "Link"];
  const lines = [head.map(cell).join(",")];
  for (const g of guests) {
    lines.push(
      [g.name, g.seats, g.status, g.attending_count, g.phone, g.message, g.invited ? "yes" : "no",
        g.responded_at ? new Date(g.responded_at).toISOString() : "", `${origin}/?guest=${g.slug}`]
        .map(cell).join(","),
    );
  }
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="wedding-guests.csv"',
    },
  });
}
