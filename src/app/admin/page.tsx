import type { Metadata } from "next";
import { headers } from "next/headers";
import { isAdmin } from "@/lib/auth";
import { db, hasDatabase, type Guest } from "@/lib/db";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";
import "./admin.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Guest list", robots: { index: false, follow: false } };

function SetupNote({ text }: { text: string }) {
  return (
    <main className="admin">
      <div className="admin-card narrow">
        <h1>Guest list</h1>
        <p>{text}</p>
      </div>
    </main>
  );
}

export default async function AdminPage() {
  if (!process.env.ADMIN_PASSWORD) {
    return <SetupNote text="Set the ADMIN_PASSWORD environment variable in Vercel, then redeploy." />;
  }
  if (!(await isAdmin())) return <AdminLogin />;
  if (!hasDatabase()) {
    return <SetupNote text="Connect a Postgres database (for example Neon from the Vercel Marketplace) so DATABASE_URL is set, then redeploy." />;
  }

  const sql = await db();
  const guests = await sql<Guest[]>`SELECT * FROM guests ORDER BY created_at DESC, id DESC`;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return <AdminDashboard initialGuests={JSON.parse(JSON.stringify(guests))} origin={`${proto}://${host}`} />;
}
