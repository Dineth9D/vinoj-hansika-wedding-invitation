"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { coupleNames, monogram, wedding } from "@/config/wedding";
import Countdown from "./Countdown";
import RsvpForm from "./RsvpForm";
import { ChurchIcon, Divider, GlassesIcon, PinIcon } from "./Ornaments";

export type GuestInfo = {
  name: string;
  slug: string;
  seats: number | null; // null = not on the guest list
  status: "pending" | "attending" | "declined";
  attendingCount: number;
};

type Props = { guestName: string; guestSlug: string; guest: GuestInfo | null };

// Fixed positions so the server and the browser draw the same petals.
const PETALS = [
  [6, 0, 11], [18, 3.5, 14], [29, 7, 12], [41, 1.5, 15], [53, 5, 13],
  [64, 9, 11], [75, 2.5, 16], [86, 6, 12], [94, 10, 14], [35, 12, 13],
];

export default function Invitation({ guestName, guestSlug, guest }: Props) {
  const [stage, setStage] = useState<"closed" | "opening" | "open">("closed");
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const fadeTo = useCallback((target: number) => {
    const a = audioRef.current;
    if (!a) return;
    const step = () => {
      const diff = target - a.volume;
      if (Math.abs(diff) < 0.04) {
        a.volume = target;
        if (target === 0) a.pause();
        return;
      }
      a.volume = Math.min(1, Math.max(0, a.volume + Math.sign(diff) * 0.04));
      requestAnimationFrame(step);
    };
    step();
  }, []);

  const playMusic = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0;
    a.play()
      .then(() => {
        setPlaying(true);
        fadeTo(0.55);
      })
      .catch(() => setPlaying(false));
  }, [fadeTo]);

  const toggleMusic = () => {
    if (playing) {
      setPlaying(false);
      fadeTo(0);
    } else {
      playMusic();
    }
  };

  const open = () => {
    if (stage !== "closed") return;
    playMusic();
    setStage("opening");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => setStage("open"), reduce ? 50 : 1700);
  };

  // Lock page scroll while the cover is shown.
  useEffect(() => {
    document.body.style.overflow = stage === "open" ? "" : "hidden";
    if (stage === "open") window.scrollTo(0, 0);
  }, [stage]);

  // Reveal sections as they scroll into view.
  useEffect(() => {
    if (stage === "closed") return;
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [stage]);

  const greetingName = guestName || "Guest";

  return (
    <>
      <audio ref={audioRef} src="/audio/music.mp3" loop preload="none" />

      {stage !== "open" && (
        <div className={`cover ${stage === "opening" ? "is-opening" : ""}`} role="dialog" aria-label="Wedding invitation">
          <div className="cover-panel left" aria-hidden="true" />
          <div className="cover-panel right" aria-hidden="true" />
          <div className="cover-frame">
            <div className="cover-content">
              <p className="monogram">
                {monogram[0]} <span className="diamond" aria-hidden="true">◆</span> {monogram[1]}
              </p>
              <p className="cover-dear">Dear {greetingName},</p>
              <p className="cover-sub">you are invited to the wedding of</p>
              <h1 className="cover-names">
                <span>{wedding.groom.first}</span>
                <span className="amp">&amp;</span>
                <span>{wedding.bride.first}</span>
              </h1>
              <Divider />
              <p className="cover-date">{wedding.dateText.replace(/^\w+, /, "")}</p>
              <p className="cover-venue">
                {wedding.events.map((e) => `${e.place}, ${e.area}`).join("  ·  ")}
              </p>
              <button className="btn-outline" onClick={open}>
                Open invitation
              </button>
            </div>
          </div>
        </div>
      )}

      <main className={`site ${stage === "closed" ? "is-hidden" : ""}`} aria-hidden={stage === "closed"}>
        {/* Hero */}
        <section className="hero">
          <div className="hero-photo" role="img" aria-label={`${coupleNames}`} />
          <div className="hero-shade" />
          <div className="petals" aria-hidden="true">
            {PETALS.map(([left, delay, dur], i) => (
              <span key={i} style={{ left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${dur}s` }} />
            ))}
          </div>
          <div className="hero-text">
            <p className="eyebrow light">We are getting married</p>
            <h2 className="hero-names">
              {wedding.groom.first} <span className="amp">&amp;</span> {wedding.bride.first}
            </h2>
            <p className="hero-date">{wedding.dateShort}</p>
          </div>
          <a className="scroll-hint" href="#welcome" aria-label="Scroll down">
            <span />
          </a>
        </section>

        {/* Welcome */}
        <section id="welcome" className="section welcome">
          <div className="welcome-grid">
            <figure className="arch-photo reveal">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/couple-2.jpg" alt={`${wedding.groom.first} and ${wedding.bride.first}`} loading="lazy" />
            </figure>
            <div className="welcome-text reveal">
              <p className="script-title">Dear {greetingName},</p>
              <p className="lead">
                Together with our families, we joyfully invite you to celebrate our wedding and share in the
                happiness of our special day.
              </p>
              <Divider />
              <p className="couple-full">
                {wedding.groom.full}
                <span className="amp-line">&amp;</span>
                {wedding.bride.full}
              </p>
            </div>
          </div>
        </section>

        {/* Countdown */}
        <section className="section band">
          <div className="container narrow reveal">
            <p className="eyebrow">Save the date</p>
            <h2 className="title">Counting down to our day</h2>
            <Countdown target={wedding.dateISO} />
            <p className="muted center">{wedding.dateText}</p>
          </div>
        </section>

        {/* Events */}
        <section className="section">
          <div className="container reveal">
            <p className="eyebrow">The wedding day</p>
            <h2 className="title">Where &amp; when</h2>
            <div className="events">
              {wedding.events.map((e, i) => (
                <article className="event-card" key={e.title}>
                  <div className="event-icon" aria-hidden="true">
                    {i === 0 ? <ChurchIcon /> : <GlassesIcon />}
                  </div>
                  <h3 className="event-title">{e.title}</h3>
                  <p className="event-time">{e.time}</p>
                  <p className="event-place">{e.place}</p>
                  <p className="muted">{e.area}</p>
                  <a className="btn-outline small" href={e.mapUrl} target="_blank" rel="noopener noreferrer">
                    <PinIcon /> View on map
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* RSVP */}
        <section id="rsvp" className="section band">
          <div className="container narrow reveal">
            <p className="eyebrow">RSVP</p>
            <h2 className="title">Will you join us?</h2>
            <p className="muted center">Please let us know if you can come.</p>
            <RsvpForm guestName={guestName} guestSlug={guestSlug} guest={guest} />
          </div>
        </section>

        <footer className="footer">
          <p className="footer-names">{coupleNames}</p>
          <p className="muted">{wedding.dateShort}</p>
          <p className="footer-note">We can&apos;t wait to celebrate with you.</p>
        </footer>
      </main>

      {stage !== "closed" && (
        <button
          className={`music-btn ${playing ? "is-playing" : ""}`}
          onClick={toggleMusic}
          aria-label={playing ? "Pause music" : "Play music"}
          aria-pressed={playing}
        >
          <span className="bars" aria-hidden="true">
            <i /><i /><i /><i />
          </span>
        </button>
      )}
    </>
  );
}
