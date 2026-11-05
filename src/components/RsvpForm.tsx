"use client";

import { useState } from "react";
import { wedding } from "@/config/wedding";
import type { GuestInfo } from "./Invitation";

type Props = { guestName: string; guestSlug: string; guest: GuestInfo | null };

export default function RsvpForm({ guestName, guestSlug, guest }: Props) {
  const maxSeats = guest?.seats ?? wedding.openLinkMaxSeats;
  const alreadyReplied = guest && guest.status !== "pending";

  const [name, setName] = useState(guestName);
  const [attending, setAttending] = useState<boolean | null>(
    alreadyReplied ? guest.status === "attending" : null,
  );
  const [count, setCount] = useState(
    alreadyReplied && guest.attendingCount > 0 ? guest.attendingCount : Math.min(guest?.seats ?? 1, maxSeats),
  );
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"form" | "sending" | "done">(alreadyReplied ? "done" : "form");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ attending: boolean; count: number }>({
    attending: guest?.status === "attending",
    count: guest?.attendingCount ?? 0,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (attending === null) return setError("Please choose if you can come.");
    setState("sending");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest: guestSlug, name, attending, count, phone, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Sorry, something went wrong. Please try again.");
      setResult({ attending, count: data.count });
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sorry, something went wrong.");
      setState("form");
    }
  }

  if (state === "done") {
    const first = name.trim() || "friend";
    return (
      <div className="card rsvp-done" role="status">
        {result.attending ? (
          <>
            <p className="script-title">Thank you, {first}!</p>
            <p className="lead">
              We are so happy you can come. We have saved{" "}
              <strong>
                {result.count} {result.count === 1 ? "seat" : "seats"}
              </strong>{" "}
              for you.
            </p>
          </>
        ) : (
          <>
            <p className="script-title">Thank you, {first}</p>
            <p className="lead">We are sorry you can&apos;t come. You will be in our hearts on our special day.</p>
          </>
        )}
        <button className="link-btn" onClick={() => setState("form")}>
          Change my reply
        </button>
      </div>
    );
  }

  return (
    <form className="card rsvp" onSubmit={submit} noValidate>
      <label className="field">
        <span>Your name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={80}
          placeholder="Full name"
          required
        />
      </label>

      <fieldset className="field">
        <legend>Can you come?</legend>
        <div className="choice">
          <button
            type="button"
            className={attending === true ? "on" : ""}
            aria-pressed={attending === true}
            onClick={() => setAttending(true)}
          >
            Joyfully accept
          </button>
          <button
            type="button"
            className={attending === false ? "on" : ""}
            aria-pressed={attending === false}
            onClick={() => setAttending(false)}
          >
            Regretfully decline
          </button>
        </div>
      </fieldset>

      {attending && (
        <div className="field">
          <span id="count-label">Number of guests (including you)</span>
          <div className="stepper" role="group" aria-labelledby="count-label">
            <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} aria-label="Fewer guests" disabled={count <= 1}>
              −
            </button>
            <output aria-live="polite">{count}</output>
            <button type="button" onClick={() => setCount((c) => Math.min(maxSeats, c + 1))} aria-label="More guests" disabled={count >= maxSeats}>
              +
            </button>
          </div>
          {guest?.seats ? (
            <small className="muted">
              We have reserved {guest.seats} {guest.seats === 1 ? "seat" : "seats"} for you.
            </small>
          ) : null}
        </div>
      )}

      <label className="field">
        <span>
          Phone number <em>(optional)</em>
        </span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" maxLength={30} placeholder="07X XXX XXXX" />
      </label>

      <label className="field">
        <span>
          A message for the couple <em>(optional)</em>
        </span>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={500} />
      </label>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button className="btn-solid" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send my reply"}
      </button>
    </form>
  );
}
