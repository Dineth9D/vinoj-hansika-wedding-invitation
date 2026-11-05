import Invitation, { type GuestInfo } from "@/components/Invitation";
import { findGuestBySlug, hasDatabase } from "@/lib/db";
import { nameFromParam, slugify } from "@/lib/text";

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
      if (g) {
        guest = {
          name: g.name,
          slug: g.slug,
          seats: g.invited ? g.seats : null,
          status: g.status,
          attendingCount: g.attending_count,
        };
      }
    } catch (err) {
      console.error("Guest lookup failed", err);
    }
  }

  const name = guest?.name ?? (raw ? nameFromParam(raw) : "");
  return <Invitation guestName={name} guestSlug={slug} guest={guest} />;
}
