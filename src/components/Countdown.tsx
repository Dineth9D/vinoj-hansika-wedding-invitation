"use client";

import { useEffect, useState } from "react";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function partsUntil(target: number): Parts | null {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export default function Countdown({ target }: { target: string }) {
  const t = new Date(target).getTime();
  const [parts, setParts] = useState<Parts | null | undefined>(undefined);

  useEffect(() => {
    setParts(partsUntil(t));
    const id = window.setInterval(() => setParts(partsUntil(t)), 1000);
    return () => window.clearInterval(id);
  }, [t]);

  if (parts === null) {
    const sameDay = Date.now() - t < 12 * 3600 * 1000;
    return (
      <p className="countdown-done">
        {sameDay ? "Today is the day!" : "Thank you for celebrating with us."}
      </p>
    );
  }

  const items: [string, number | undefined][] = [
    ["Days", parts?.days],
    ["Hours", parts?.hours],
    ["Minutes", parts?.minutes],
    ["Seconds", parts?.seconds],
  ];

  return (
    <div className="countdown" role="timer" aria-live="off">
      {items.map(([label, value]) => (
        <div className="cd-box" key={label}>
          <span className="cd-num">{value === undefined ? "--" : String(value).padStart(2, "0")}</span>
          <span className="cd-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
