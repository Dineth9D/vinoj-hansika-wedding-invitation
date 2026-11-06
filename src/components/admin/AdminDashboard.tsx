"use client";

import { useMemo, useRef, useState } from "react";
import type { Guest, GuestStatus } from "@/lib/db";
import { attendOptions, coupleNames, goesTo, type Attend } from "@/config/wedding";

type Props = { initialGuests: Guest[]; origin: string };
type Filter = "all" | GuestStatus | "open" | "mass" | "reception";

const STATUS_LABEL: Record<GuestStatus, string> = {
  pending: "Waiting",
  attending: "Coming",
  declined: "Not coming",
};

/** "0771234567" -> "94771234567" for WhatsApp (Sri Lanka). */
function waNumber(phone: string | null) {
  if (!phone) return "";
  let d = phone.replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("0")) d = "94" + d.slice(1);
  return d;
}

export default function AdminDashboard({ initialGuests, origin }: Props) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [bulk, setBulk] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [defaultSeats, setDefaultSeats] = useState(2);
  const [newName, setNewName] = useState("");
  const [newSeats, setNewSeats] = useState(2);
  const [newPhone, setNewPhone] = useState("");
  const nameInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Guest | null>(null);

  const link = (g: Guest) => `${origin}/?guest=${encodeURIComponent(g.slug)}`;

  const stats = useMemo(() => {
    const invited = guests.filter((g) => g.invited);
    const sum = (list: Guest[], f: (g: Guest) => number) => list.reduce((a, g) => a + f(g), 0);
    return {
      invitations: invited.length,
      seatsInvited: sum(invited, (g) => g.seats),
      coming: sum(guests, (g) => g.attending_count),
      atMass: sum(guests.filter((g) => goesTo(g, "mass")), (g) => g.attending_count),
      atReception: sum(guests.filter((g) => goesTo(g, "reception")), (g) => g.attending_count),
      massReplies: guests.filter((g) => goesTo(g, "mass")).length,
      receptionReplies: guests.filter((g) => goesTo(g, "reception")).length,
      comingReplies: guests.filter((g) => g.status === "attending").length,
      declined: guests.filter((g) => g.status === "declined").length,
      waiting: invited.filter((g) => g.status === "pending").length,
      waitingSeats: sum(invited.filter((g) => g.status === "pending"), (g) => g.seats),
      openReplies: guests.filter((g) => !g.invited).length,
    };
  }, [guests]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests.filter((g) => {
      if (filter === "open" && g.invited) return false;
      if ((filter === "mass" || filter === "reception") && !goesTo(g, filter)) return false;
      if ((filter === "pending" || filter === "attending" || filter === "declined") && g.status !== filter) return false;
      if (q && !(`${g.name} ${g.phone ?? ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [guests, filter, query]);

  function flash(text: string) {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2500);
  }

  async function copy(text: string, what = "Link") {
    try {
      await navigator.clipboard.writeText(text);
      flash(`${what} copied`);
    } catch {
      window.prompt("Copy this:", text);
    }
  }

  async function postGuests(list: { name: string; seats: number; phone: string }[]) {
    setBusy(true);
    const res = await fetch("/api/admin/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guests: list }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok && data.ok) {
      setGuests((prev) => [...data.created, ...prev]);
      return data.created as Guest[];
    }
    flash(data.error || "Could not add guests");
    return null;
  }

  // One guest from the simple row form.
  async function addOne(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      nameInput.current?.focus();
      return;
    }
    const created = await postGuests([{ name, seats: newSeats, phone: newPhone.trim() }]);
    if (created) {
      flash(`Added ${created[0].name}`);
      setNewName("");
      setNewSeats(2); // back to the usual size, so the next guest is not given the wrong seats
      setNewPhone("");
      nameInput.current?.focus(); // ready for the next guest
    }
  }

  // Many guests pasted at once, one per line.
  async function addGuests(e: React.FormEvent) {
    e.preventDefault();
    const list = bulk
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, seats, phone] = line.split(",").map((p) => p.trim());
        return { name, seats: seats ? Number(seats) : defaultSeats, phone: phone || "" };
      })
      .filter((g) => g.name);
    if (!list.length) return;
    const created = await postGuests(list);
    if (created) {
      setBulk("");
      flash(`Added ${created.length} ${created.length === 1 ? "guest" : "guests"}`);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const res = await fetch(`/api/admin/guests/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      setGuests((prev) => prev.map((g) => (g.id === data.guest.id ? data.guest : g)));
      setEditing(null);
      flash("Saved");
    } else {
      flash(data.error || "Could not save");
    }
  }

  async function remove(g: Guest) {
    if (!window.confirm(`Remove ${g.name} from the guest list?`)) return;
    const res = await fetch(`/api/admin/guests/${g.id}`, { method: "DELETE" });
    if (res.ok) {
      setGuests((prev) => prev.filter((x) => x.id !== g.id));
      flash("Removed");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  const tabs: [Filter, string, number][] = [
    ["all", "All", guests.length],
    ["attending", "Coming", stats.comingReplies],
    ["mass", "Holy Mass", stats.massReplies],
    ["reception", "Reception", stats.receptionReplies],
    ["declined", "Not coming", stats.declined],
    ["pending", "Waiting", stats.waiting],
    ["open", "Not on list", stats.openReplies],
  ];

  return (
    <main className="admin">
      <header className="admin-head">
        <div>
          <p className="admin-eyebrow">{coupleNames}</p>
          <h1>Guest list</h1>
        </div>
        <div className="admin-actions">
          <a className="a-btn" href="/api/admin/export">Download CSV</a>
          <button className="a-btn ghost" onClick={logout}>Log out</button>
        </div>
      </header>

      <section className="stats" aria-label="Summary">
        <div className="stat highlight">
          <span className="stat-num">{stats.coming}</span>
          <span className="stat-label">People coming</span>
          <span className="stat-sub">from {stats.comingReplies} replies</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.atMass}</span>
          <span className="stat-label">At the Holy Mass</span>
          <span className="stat-sub">3:00 PM · {stats.massReplies} replies</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.atReception}</span>
          <span className="stat-label">At the Reception</span>
          <span className="stat-sub">7:00 PM · {stats.receptionReplies} replies</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.seatsInvited}</span>
          <span className="stat-label">Seats invited</span>
          <span className="stat-sub">{stats.invitations} invitations</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.waiting}</span>
          <span className="stat-label">Not replied yet</span>
          <span className="stat-sub">{stats.waitingSeats} seats</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.declined}</span>
          <span className="stat-label">Not coming</span>
          <span className="stat-sub">replies</span>
        </div>
      </section>

      <section className="admin-card">
        <h2>Add a guest</h2>
        <form onSubmit={addOne} className="add-one">
          <label className="a-field add-name">
            <span>Name</span>
            <input
              ref={nameInput}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Perera Family"
              maxLength={80}
              autoComplete="off"
            />
          </label>
          <label className="a-field add-seats">
            <span>Seats</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              value={newSeats}
              onChange={(e) => setNewSeats(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
            />
          </label>
          <label className="a-field add-phone">
            <span>Phone (optional)</span>
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="07X XXX XXXX"
              maxLength={30}
              autoComplete="off"
            />
          </label>
          <button className="a-btn primary add-btn" disabled={busy || !newName.trim()}>
            {busy ? "Adding…" : "Add"}
          </button>
        </form>
        <p className="admin-muted small">
          Seats = how many people this invitation is for. The phone number lets the WhatsApp button open their chat.
        </p>

        <button type="button" className="a-link bulk-toggle" onClick={() => setShowBulk((v) => !v)} aria-expanded={showBulk}>
          {showBulk ? "Hide" : "Add many at once"}
        </button>
        {showBulk && (
        <>
        <p className="admin-muted">
          Paste one invitation per line. Add the seats and phone after commas, for example:{" "}
          <code>Perera Family, 4, 0771234567</code>
        </p>
        <form onSubmit={addGuests} className="add-form">
          <textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={4}
            placeholder={"Dineth\nPerera Family, 4\nAunty Mala, 2, 0771234567"}
            aria-label="Guests to add"
          />
          <div className="add-row">
            <label className="a-inline">
              Default seats
              <input type="number" min={1} max={50} value={defaultSeats} onChange={(e) => setDefaultSeats(Number(e.target.value) || 1)} />
            </label>
            <button className="a-btn primary" disabled={busy || !bulk.trim()}>
              {busy ? "Adding…" : "Add all"}
            </button>
          </div>
        </form>
        </>
        )}
        <p className="admin-muted small">
          General link (for people not on the list):{" "}
          <button className="a-link" onClick={() => copy(`${origin}/`)}>{origin}/</button>
        </p>
      </section>

      <section className="admin-card">
        <div className="list-tools">
          <div className="tabs" role="tablist">
            {tabs.map(([key, label, n]) => (
              <button key={key} role="tab" aria-selected={filter === key} className={filter === key ? "on" : ""} onClick={() => setFilter(key)}>
                {label} <span>{n}</span>
              </button>
            ))}
          </div>
          <input className="search" type="search" placeholder="Search name or phone" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search guests" />
        </div>

        {shown.length === 0 ? (
          <p className="admin-muted empty">No guests here yet.</p>
        ) : (
          <div className="g-table" role="table">
            <div className="g-row g-headrow" role="row">
              <span role="columnheader">Guest</span>
              <span role="columnheader">Seats</span>
              <span role="columnheader">Reply</span>
              <span role="columnheader">Message</span>
              <span role="columnheader" className="right">Actions</span>
            </div>
            {shown.map((g) => {
              const wa = waNumber(g.phone);
              const text = `Dear ${g.name},\n\nWith great joy, we invite you to our wedding. Please open your invitation here:\n${link(g)}\n\n${coupleNames}`;
              return (
                <div className="g-row" role="row" key={g.id}>
                  <span className="g-name" role="cell">
                    <strong>{g.name}</strong>
                    {g.phone && <small>{g.phone}</small>}
                    {!g.invited && <small className="tag">Not on list</small>}
                  </span>
                  <span role="cell" className="g-seats">
                    <small className="m-label">Seats </small>
                    {g.invited ? g.seats : "–"}
                  </span>
                  <span role="cell">
                    <span className={`chip ${g.status}`}>
                      {STATUS_LABEL[g.status]}
                      {g.status === "attending" && ` · ${g.attending_count}`}
                    </span>
                    {g.status === "attending" && (
                      <small className="attend-tag">
                        {attendOptions.find((o) => o.value === (g.events ?? "both"))!.short}
                      </small>
                    )}
                  </span>
                  <span role="cell" className="g-msg" title={g.message ?? ""}>
                    {g.message}
                  </span>
                  <span role="cell" className="g-actions">
                    <button className="a-btn small" onClick={() => copy(link(g))}>Copy link</button>
                    <a
                      className="a-btn small"
                      href={`https://wa.me/${wa}?text=${encodeURIComponent(text)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                    <button className="a-btn small ghost" onClick={() => setEditing({ ...g })}>Edit</button>
                    <button className="a-btn small ghost danger" onClick={() => remove(g)} aria-label={`Remove ${g.name}`}>Remove</button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {editing && (
        <div className="modal" role="dialog" aria-modal="true" aria-label={`Edit ${editing.name}`} onClick={() => setEditing(null)}>
          <form className="admin-card modal-card" onSubmit={saveEdit} onClick={(e) => e.stopPropagation()}>
            <h2>Edit guest</h2>
            <label className="a-field">
              <span>Name</span>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </label>
            <div className="two">
              <label className="a-field">
                <span>Seats</span>
                <input type="number" min={1} max={50} value={editing.seats} onChange={(e) => setEditing({ ...editing, seats: Number(e.target.value) || 1 })} />
              </label>
              <label className="a-field">
                <span>Phone</span>
                <input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </label>
            </div>
            <div className="two">
              <label className="a-field">
                <span>Reply</span>
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as GuestStatus })}>
                  <option value="pending">Waiting</option>
                  <option value="attending">Coming</option>
                  <option value="declined">Not coming</option>
                </select>
              </label>
              <label className="a-field">
                <span>People coming</span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  disabled={editing.status !== "attending"}
                  value={editing.status === "attending" ? editing.attending_count || 1 : 0}
                  onChange={(e) => setEditing({ ...editing, attending_count: Number(e.target.value) || 0 })}
                />
              </label>
            </div>
            {editing.status === "attending" && (
              <label className="a-field">
                <span>Attending</span>
                <select
                  value={editing.events ?? "both"}
                  onChange={(e) => setEditing({ ...editing, events: e.target.value as Attend })}
                >
                  {attendOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            )}
            <div className="modal-actions">
              <button type="button" className="a-btn ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="a-btn primary">Save</button>
            </div>
          </form>
        </div>
      )}

      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  );
}
