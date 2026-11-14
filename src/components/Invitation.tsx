"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { coupleNames, monogram, wedding, type Attend } from "@/config/wedding";
import Countdown from "./Countdown";
import RsvpForm from "./RsvpForm";
import { ChurchIcon, DateText, Divider, GlassesIcon, HeartIcon, PhoneIcon, PinIcon } from "./Ornaments";

export type GuestInfo = {
  name: string;
  slug: string;
  seats: number | null; // null = not on the guest list
  status: "pending" | "attending" | "declined";
  attendingCount: number;
  events: Attend | null;
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

  const fadeId = useRef(0);
  const resumeOnReturn = useRef(false);

  // Gently change the volume. iPhones (Safari and Chrome) do not let a page change
  // the volume, so there the fade ends at once and `done` runs straight away.
  const fadeTo = useCallback((target: number, done?: () => void) => {
    const a = audioRef.current;
    if (!a) return;
    const id = ++fadeId.current; // a newer fade cancels this one
    const step = () => {
      if (id !== fadeId.current) return;
      const before = a.volume;
      const diff = target - before;
      if (Math.abs(diff) < 0.04) {
        a.volume = target;
        done?.();
        return;
      }
      a.volume = Math.min(1, Math.max(0, before + Math.sign(diff) * 0.04));
      if (a.volume === before) {
        done?.(); // volume is fixed on this device: stop fading
        return;
      }
      requestAnimationFrame(step);
    };
    step();
  }, []);

  const playMusic = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    fadeId.current++; // cancel any fade in progress
    // iPhones (Safari and Chrome) do not allow a page to change the volume.
    const before = a.volume;
    a.volume = before === 0.5 ? 0.4 : 0.5;
    const canFade = a.volume !== before;
    a.volume = canFade ? 0 : before;
    const started = a.play();
    if (started) {
      started
        .then(() => {
          if (canFade) fadeTo(0.55);
        })
        .catch(() => setPlaying(!a.paused));
    }
  }, [fadeTo]);

  // Stop straight away. This works the same on every phone and browser.
  const stopMusic = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    fadeId.current++; // cancel any fade in progress
    a.pause();
    setPlaying(false);
  }, []);

  // Decide from the real player, not from what the button last showed.
  const toggleMusic = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) playMusic();
    else stopMusic();
  };

  // Keep the button in step with the real player (also when the phone pauses it,
  // for example for a call or from the lock screen).
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const events: [string, () => void][] = [
      ["play", onPlay],
      ["playing", onPlay],
      ["pause", onPause],
      ["ended", onPause],
    ];
    events.forEach(([name, fn]) => a.addEventListener(name, fn));
    return () => events.forEach(([name, fn]) => a.removeEventListener(name, fn));
  }, []);

  // Pause when the guest leaves the page or switches app; continue when they come back.
  useEffect(() => {
    const onVisibility = () => {
      const a = audioRef.current;
      if (!a) return;
      if (document.hidden) {
        resumeOnReturn.current = !a.paused;
        fadeId.current++; // stop any fade in progress
        a.pause();
      } else if (resumeOnReturn.current) {
        resumeOnReturn.current = false;
        playMusic();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [playMusic]);

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

  // Smooth, eased scrolling for mouse wheels and trackpads.
  // Phones keep their own native momentum scrolling, which is already smooth.
  useEffect(() => {
    if (stage !== "open") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.065, // lower = longer, softer glide after each wheel step
      wheelMultiplier: 0.85,
      anchors: { duration: 1.6 },
    });
    return () => lenis.destroy();
  }, [stage]);

  // Pause the falling petals when the photo is off screen, to save work while scrolling.
  useEffect(() => {
    if (stage === "closed") return;
    const hero = document.querySelector(".hero");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => hero.classList.toggle("is-offscreen", !e.isIntersecting));
    io.observe(hero);
    return () => io.disconnect();
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
              <p className="cover-sub">You are invited to the wedding of</p>
              <h1 className="cover-names">
                <span>{wedding.partner1.first}</span>
                <span className="amp">&amp;</span>
                <span>{wedding.partner2.first}</span>
              </h1>
              <Divider />
              <p className="cover-date">
                <DateText text={wedding.dateLong} />
              </p>
              <p className="cover-venue">
                {wedding.events.map((e) => `${e.place}, ${e.area}`).join("  ·  ")}
              </p>
              <button className="btn-outline" onClick={open}>
                Open Invitation
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
              {wedding.partner1.first} <span className="amp">&amp;</span> {wedding.partner2.first}
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
              <img src="/images/couple-2.jpg" alt={`${wedding.partner1.first} and ${wedding.partner2.first}`} loading="lazy" />
            </figure>
            <div className="welcome-text reveal">
              <p className="script-title">Together with our families,</p>
              <p className="lead">
                we joyfully invite you to celebrate our wedding and share in the happiness of our special day.
              </p>
              <Divider />
              <p className="couple-full">
                {wedding.partner1.full}
                <span className="amp-line">&amp;</span>
                {wedding.partner2.full}
              </p>
            </div>
          </div>
        </section>

        {/* Countdown */}
        <section className="section date-section" aria-label="Wedding date">
          <div className="container reveal">
            <h2 className="big-date">
              <DateText text={wedding.dateLong} />
            </h2>
            <Divider />
            <Countdown target={wedding.dateISO} />
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
        <section id="rsvp" className="section paper-section">
          <div className="container reveal">
            <div className="wedding-card">
              <div className="wedding-card-inner">
                <p className="wc-dear">Dear {greetingName},</p>
                <p className="wc-text">
                  Two hearts and a new chapter, as we celebrate the beginning of our journey together.
                </p>
                <p className="wc-blessing">
                  Your presence and blessings would mean the{" "}
                  <span className="nowrap">
                    world to us. <HeartIcon />
                  </span>
                </p>
                <Divider />
                <RsvpForm guestName={guestName} guestSlug={guestSlug} guest={guest} />
                <hr className="wc-rule" />
                <p className="wc-call">Rather call? Reach us on</p>
                <a className="call-btn" href={`tel:${wedding.contact.tel}`}>
                  <PhoneIcon />
                  {wedding.contact.phone} - {wedding.contact.name}
                </a>
              </div>
            </div>
          </div>
        </section>

        <footer className="footer">
          <p className="footer-thanks">Thank you for being a part of our special day</p>
          <p className="footer-names">{coupleNames}</p>
          <p className="footer-date">{wedding.dateShort}</p>
          <p className="credit">
            Designed &amp; built by{" "}
            {wedding.credit.url ? (
              <a href={wedding.credit.url} target="_blank" rel="noopener noreferrer">
                {wedding.credit.name}
              </a>
            ) : (
              wedding.credit.name
            )}
          </p>
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
