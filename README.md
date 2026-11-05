# Vinoj & Chathuni – Wedding Invitation

An online wedding invitation with RSVP and a private guest list.
It works on phones, tablets, laptops and desktops.

- **Invitation page:** `/` – greets each guest by name, plays soft music, shows a countdown, the events and an RSVP form.
- **Guest list (admin):** `/admin` – password protected. Add guests, copy or WhatsApp their personal links, and see who is coming.

## Personal links

Every guest on the list gets a link like:

```
https://your-site.vercel.app/?guest=dineth
```

The page then says "Dear Dineth" and saves the reply against Dineth's row.
The link `https://your-site.vercel.app/` (with no name) also works. People who use it type their own name, and they show up as "Not on list" in the admin page.

## Change the wedding details

All names, dates, times and map links are in `src/config/wedding.ts`.

- Photos: `public/images/couple-1.jpg` (big photo at the top) and `public/images/couple-2.jpg` (arched photo).
- Music: `public/audio/music.mp3` (the couple's chosen song). It loops and starts softly when the guest taps "Open invitation". To change it, replace the file and keep the same name (an MP3 under about 5 MB).

## Deploy on Vercel

1. In Vercel, click **Add New → Project** and import this repository. Vercel finds Next.js by itself.
2. Add a database: open the project → **Storage** → **Create Database** → **Neon (Postgres)** → connect it to the project. This adds `DATABASE_URL` for you. The free plan is enough for 500 guests.
3. Add the admin password: **Settings → Environment Variables** → add `ADMIN_PASSWORD` with a long password.
4. Click **Redeploy** so the new settings are used.
5. Open `https://your-site.vercel.app/admin`, log in, and add your guests.

The app creates its database table by itself the first time it runs.

## Adding guests

In `/admin`, paste one invitation per line:

```
Dineth
Perera Family, 4
Aunty Mala, 2, 0771234567
```

- The number after the first comma is how many seats this invitation has. If you leave it out, the "Default seats" value is used.
- The phone number is optional. With a phone number, the WhatsApp button opens a chat with that person directly.
- "People coming" at the top is the total head count from all replies.
- **Download CSV** gives you the full list for Excel or Google Sheets.

## Run it on your computer

```bash
npm install
cp .env.example .env.local   # then fill in DATABASE_URL and ADMIN_PASSWORD
npm run dev
```

Then open http://localhost:3000/?guest=Dineth
