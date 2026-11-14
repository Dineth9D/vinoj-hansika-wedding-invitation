import Invitation, { type GuestInfo } from "@/components/Invitation";
import { findGuestBySlug, hasDatabase } from "@/lib/db";
import { nameFromParam, slugify } from "@/lib/text";
import { wedding } from "@/config/wedding";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function Page({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = typeof sp.guest === "string" ? sp.guest.slice(0, 80) : "";
  const slug = slugify(raw);

  let guest: GuestInfo | null = null;
  if (slug && hasDatabase()) {
    try {
      const g = await findGuestBySlug(slug);
      // When only personal links may reply, a link must belong to someone on the guest list.
      if (g && (g.invited || wedding.openRsvp)) {
        guest = {
          name: g.name,
          slug: g.slug,
          seats: g.invited ? g.seats : null,
          status: g.status,
          attendingCount: g.attending_count,
          events: g.events,
        };
      }
    } catch (err) {
      console.error("Guest lookup failed", err);
    }
  }

  // Unknown links get a plain "Dear Guest" unless anyone may reply.
  const name = guest?.name ?? (raw && wedding.openRsvp ? nameFromParam(raw) : "");
  const canReply = guest !== null || wedding.openRsvp;
  return <Invitation guestName={name} guestSlug={slug} guest={guest} canReply={canReply} />;
}
