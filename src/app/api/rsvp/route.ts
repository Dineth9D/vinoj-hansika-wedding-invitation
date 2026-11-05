import { NextResponse } from "next/server";
import { db, findGuestBySlug, hasDatabase, uniqueSlug, type Guest } from "@/lib/db";
import { cleanText, slugify } from "@/lib/text";
import { wedding } from "@/config/wedding";

export const dynamic = "force-dynamic";

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  if (!hasDatabase()) return bad("Replies are not set up yet. Please contact the couple.", 503);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request.");
  }

  const name = cleanText(body.name, 80);
  const guestParam = slugify(cleanText(body.guest, 80));
  const attending = body.attending === true;
  const phone = cleanText(body.phone, 30) || null;
  const message = cleanText(body.message, 500) || null;
  const rawCount = Number(body.count);

  if (!name) return bad("Please enter your name.");
  if (typeof body.attending !== "boolean") return bad("Please tell us if you can come.");

  try {
    const sql = await db();

    // 1. The guest's own link (?guest=...), or 2. a guest with the same name.
    let guest: Guest | null = guestParam ? await findGuestBySlug(guestParam) : null;
    if (!guest) guest = await findGuestBySlug(slugify(name));

    const maxSeats = guest?.invited ? guest.seats : wedding.openLinkMaxSeats;
    const count = attending
      ? Math.min(Math.max(Number.isFinite(rawCount) ? Math.round(rawCount) : 1, 1), maxSeats)
      : 0;
    const status = attending ? "attending" : "declined";

    if (guest) {
      await sql`
        UPDATE guests SET
          status = ${status},
          attending_count = ${count},
          phone = COALESCE(${phone}, phone),
          message = ${message},
          seats = ${guest.invited ? guest.seats : Math.max(count, 1)},
          responded_at = now()
        WHERE id = ${guest.id}`;
    } else {
      const slug = await uniqueSlug(slugify(name));
      await sql`
        INSERT INTO guests (name, slug, seats, phone, status, attending_count, message, invited, responded_at)
        VALUES (${name}, ${slug}, ${Math.max(count, 1)}, ${phone}, ${status}, ${count}, ${message}, FALSE, now())`;
    }

    return NextResponse.json({ ok: true, status, count });
  } catch (err) {
    console.error("RSVP failed", err);
    return bad("Sorry, something went wrong. Please try again.", 500);
  }
}
