"use client";

import { useState } from "react";
import { attendPhrase, wedding, type Attend } from "@/config/wedding";
import type { GuestInfo } from "./Invitation";

type Props = { guestName: string; guestSlug: string; guest: GuestInfo | null };
type Answer = boolean | null; // true = joyfully accept, false = regretfully decline, null = not answered yet

const [MASS, RECEPTION] = wedding.events;

/** Turn the two answers into what we store: both / mass / reception, or not coming. */
function toEvents(mass: Answer, reception: Answer): Attend | null {
  if (mass && reception) return "both";
  if (mass) return "mass";
  if (reception) return "reception";
  return null;
}

function AcceptDecline({
  label,
  question,
  value,
  onChange,
}: {
  label: string;
  question: string;
  value: Answer;
  onChange: (v: boolean) => void;
}) {
  return (
    <fieldset className="rsvp-question">
      <legend className="rsvp-eyebrow">{label}</legend>
      <p className="rsvp-ask">{question}</p>
      <div className="choice pair">
        <button type="button" className={value === true ? "on" : ""} aria-pressed={value === true} onClick={() => onChange(true)}>
          Joyfully Accept
        </button>
        <button type="button" className={value === false ? "on" : ""} aria-pressed={value === false} onClick={() => onChange(false)}>
          Regretfully Decline
        </button>
      </div>
    </fieldset>
  );
}

export default function RsvpForm({ guestName, guestSlug, guest }: Props) {
  const reserved = guest?.seats ?? null; // seats on the guest list; null = general link
  const maxSeats = reserved ?? wedding.openLinkMaxSeats;
  const alreadyReplied = !!guest && guest.status !== "pending";

  // Earlier replies (also ones made with the old form) fill in the answers.
  const was = guest?.status === "attending" ? (guest.events ?? "both") : null;
  const [mass, setMass] = useState<Answer>(alreadyReplied ? was === "both" || was === "mass" : null);
  const [reception, setReception] = useState<Answer>(alreadyReplied ? was === "both" || was === "reception" : null);

  // The name only needs typing on the general link, when we do not know who this is.
  const askName = !guestName;
  const [typedName, setTypedName] = useState("");
  const name = askName ? typedName : guestName;

  const [count, setCount] = useState(
    alreadyReplied && guest.attendingCount > 0 ? Math.min(guest.attendingCount, maxSeats) : reserved ?? 1,
  );
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"form" | "sending" | "done">(alreadyReplied ? "done" : "form");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ count: number; events: Attend | null }>({
    count: guest?.attendingCount ?? 0,
    events: guest?.status === "attending" ? (guest.events ?? "both") : null,
  });

  const comingToSomething = mass === true || reception === true;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (mass === null) return setError(`Please let us know if you can join us for the ${MASS.title}.`);
    if (reception === null) return setError(`Please let us know if you can join us for the ${RECEPTION.title}.`);
    const events = toEvents(mass, reception);
    const attending = events !== null;
    setState("sending");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest: guestSlug, name, attending, count: attending ? count : 0, events, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Sorry, something went wrong. Please try again.");
      setResult({ count: data.count, events: data.events ?? null });
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sorry, something went wrong.");
      setState("form");
    }
  }

  if (state === "done") {
    const who = name.trim() || "friend";
    return (
      <div className="rsvp-done" role="status">
        {result.events ? (
          <>
            <p className="script-title">Thank you, {who}!</p>
            <p className="lead">
              We are so happy you can come to {attendPhrase(result.events)}. We have saved{" "}
              <strong>
                {result.count} {result.count === 1 ? "seat" : "seats"}
              </strong>{" "}
              for you.
            </p>
          </>
        ) : (
          <>
            <p className="script-title">Thank you, {who}</p>
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
    <>
      <h2 className="wc-title">Kindly RSVP</h2>
      {reserved !== null && (
        <p className="rsvp-reserved">
          This invitation is reserved for {reserved} {reserved === 1 ? "guest" : "guests"}.
        </p>
      )}

      <form className="rsvp" onSubmit={submit} noValidate>
        {askName && (
          <label className="field">
            <span>Your name</span>
            <input
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              autoComplete="name"
              maxLength={80}
              placeholder="Full name"
              required
            />
          </label>
        )}

        <AcceptDecline
          label={MASS.title}
          question={`Will you be joining us for the ${MASS.title}?`}
          value={mass}
          onChange={setMass}
        />
        <AcceptDecline
          label={RECEPTION.title}
          question={`Will you be joining us for the ${RECEPTION.title}?`}
          value={reception}
          onChange={setReception}
        />

        {/* How many are coming: only when the invitation is for 2 or more people. */}
        {comingToSomething && maxSeats > 1 && (
          <div className="field rsvp-count">
            {reserved !== null ? (
              <p className="rsvp-note">
                If not everyone can make it, please let us know how many of you will be joining us.
              </p>
            ) : (
              <span id="count-label">Number of guests (including you)</span>
            )}
            <div className="stepper" role="group" aria-label="Number of guests">
              <button type="button" onClick={() => setCount((c) => Math.max(1, c - 1))} aria-label="Fewer guests" disabled={count <= 1}>
                −
              </button>
              <output aria-live="polite">{count}</output>
              <button type="button" onClick={() => setCount((c) => Math.min(maxSeats, c + 1))} aria-label="More guests" disabled={count >= maxSeats}>
                +
              </button>
            </div>
          </div>
        )}

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
          {state === "sending" ? "Sending…" : "Confirm RSVP"}
        </button>
      </form>
    </>
  );
}
